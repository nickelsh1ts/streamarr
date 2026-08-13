import { getRepository } from '@server/datasource';
import Newsletter from '@server/entity/Newsletter';
import { getSettings } from '@server/lib/settings';
import logger from '@server/logger';
import schedule from 'node-schedule';
import {
  NewsletterDataUnavailableError,
  NewsletterEmptyError,
  recordNewsletterAbort,
  sendNewsletter,
} from './send';

const DEFAULT_RETRY_ATTEMPTS = 3;
const DEFAULT_RETRY_INTERVAL_MS = 5 * 60 * 1000;

/**
 * Manages dynamic node-schedule jobs keyed by newsletter id, unlike the
 * static settings-driven jobs in server/job/schedule.ts. Jobs are loaded
 * at boot and rescheduled whenever a newsletter is created, updated or
 * deleted.
 */
class NewsletterScheduler {
  private jobs = new Map<number, schedule.Job>();

  // Tracks in-flight retry attempts for scheduled sends whose content sources
  // were unreachable, keyed by newsletter id.
  private retries = new Map<
    number,
    { attempts: number; timer: NodeJS.Timeout | null }
  >();

  public async loadAll(): Promise<void> {
    try {
      const newsletterRepository = getRepository(Newsletter);
      const newsletters = await newsletterRepository.find({
        where: { enabled: true },
      });

      for (const newsletter of newsletters) {
        if (
          newsletter.scheduleType === 'once' &&
          newsletter.sendAt &&
          new Date(newsletter.sendAt).getTime() <= Date.now()
        ) {
          newsletter.enabled = false;
          await newsletterRepository.save(newsletter);

          logger.warn(
            'Disabled a one-time newsletter whose scheduled time passed while offline',
            {
              label: 'Newsletters',
              newsletterId: newsletter.id,
              name: newsletter.name,
            }
          );

          continue;
        }

        this.schedule(newsletter);
      }

      logger.info('Scheduled newsletters loaded', {
        label: 'Newsletters',
        count: this.jobs.size,
      });
    } catch (e) {
      logger.error('Failed to load scheduled newsletters', {
        label: 'Newsletters',
        errorMessage: e instanceof Error ? e.message : String(e),
      });
    }
  }

  public schedule(newsletter: Newsletter): void {
    this.cancel(newsletter.id);

    if (!newsletter.enabled) {
      return;
    }

    const run = async () => {
      logger.info('Starting scheduled newsletter send', {
        label: 'Newsletters',
        newsletterId: newsletter.id,
        name: newsletter.name,
      });

      let fresh: Newsletter | null = null;

      try {
        // Re-fetch so edits made after scheduling are respected.
        fresh = await getRepository(Newsletter).findOne({
          where: { id: newsletter.id },
        });

        const pending = this.retries.get(newsletter.id);
        if (pending?.timer) {
          clearTimeout(pending.timer);
          pending.timer = null;
        }

        if (!fresh || !fresh.enabled) {
          this.retries.delete(newsletter.id);
          return;
        }

        await sendNewsletter(fresh, 'schedule');
        this.retries.delete(fresh.id);

        if (fresh.scheduleType === 'once') {
          this.cancel(fresh.id);
        }
      } catch (e) {
        if (e instanceof NewsletterDataUnavailableError) {
          await this.handleDataUnavailable(fresh ?? newsletter, e, run);
          return;
        }

        if (e instanceof NewsletterEmptyError) {
          this.retries.delete(newsletter.id);

          logger.warn(
            'Scheduled newsletter skipped; all configured content blocks were empty',
            {
              label: 'Newsletters',
              newsletterId: newsletter.id,
              name: newsletter.name,
              blocks: e.blocks,
            }
          );

          await this.disableOnceNewsletter(fresh ?? newsletter);
          return;
        }

        logger.error('Scheduled newsletter send failed', {
          label: 'Newsletters',
          newsletterId: newsletter.id,
          errorMessage: e instanceof Error ? e.message : String(e),
        });
      }
    };

    let job: schedule.Job | null = null;

    if (newsletter.scheduleType === 'once') {
      if (!newsletter.sendAt) {
        return;
      }

      const sendAt = new Date(newsletter.sendAt);

      if (sendAt.getTime() <= Date.now()) {
        return;
      }

      job = schedule.scheduleJob(sendAt, run);
    } else if (newsletter.cronSchedule) {
      job = schedule.scheduleJob(newsletter.cronSchedule, run);
    }

    if (job) {
      this.jobs.set(newsletter.id, job);
    } else {
      logger.warn('Newsletter has no valid schedule and was not scheduled', {
        label: 'Newsletters',
        newsletterId: newsletter.id,
        name: newsletter.name,
      });
    }
  }

  public cancel(id: number): void {
    const existing = this.jobs.get(id);

    if (existing) {
      existing.cancel();
      this.jobs.delete(id);
    }

    const retry = this.retries.get(id);

    if (retry?.timer) {
      clearTimeout(retry.timer);
    }

    this.retries.delete(id);
  }

  private async handleDataUnavailable(
    newsletter: Newsletter,
    error: NewsletterDataUnavailableError,
    run: () => Promise<void>
  ): Promise<void> {
    const { network } = getSettings();
    const maxAttempts = Math.max(
      1,
      network.scheduledRetryAttempts ?? DEFAULT_RETRY_ATTEMPTS
    );
    const intervalMs = Math.max(
      0,
      network.scheduledRetryInterval ?? DEFAULT_RETRY_INTERVAL_MS
    );

    const state = this.retries.get(newsletter.id) ?? {
      attempts: 0,
      timer: null,
    };
    state.attempts += 1;

    if (state.attempts < maxAttempts) {
      logger.warn(
        `External services unavailable on attempt ${state.attempts} of ${maxAttempts}, retrying in ${intervalMs}ms`,
        {
          label: 'Newsletters',
          newsletterId: newsletter.id,
          name: newsletter.name,
          attempt: state.attempts,
          maxAttempts,
          retryInMs: intervalMs,
          failures: error.failures.map((failure) => failure.source),
        }
      );

      state.timer = setTimeout(() => void run(), intervalMs);
      this.retries.set(newsletter.id, state);
      return;
    }

    this.retries.delete(newsletter.id);

    try {
      await recordNewsletterAbort(newsletter, error.failures);
    } catch (e) {
      logger.error('Failed to record aborted newsletter', {
        label: 'Newsletters',
        newsletterId: newsletter.id,
        errorMessage: e instanceof Error ? e.message : String(e),
      });
    }

    await this.disableOnceNewsletter(newsletter);
  }

  /**
   * Disables and unschedules a one-time newsletter after it has been aborted or
   * skipped. Recurring newsletters are left untouched so they run again on
   * their next cron tick. No-op for recurring schedules.
   */
  private async disableOnceNewsletter(newsletter: Newsletter): Promise<void> {
    if (newsletter.scheduleType !== 'once') {
      return;
    }

    try {
      const newsletterRepository = getRepository(Newsletter);
      const current = await newsletterRepository.findOne({
        where: { id: newsletter.id },
      });

      if (current) {
        current.enabled = false;
        await newsletterRepository.save(current);
      }
    } catch (e) {
      logger.error('Failed to disable one-time newsletter after abort', {
        label: 'Newsletters',
        newsletterId: newsletter.id,
        errorMessage: e instanceof Error ? e.message : String(e),
      });
    }

    this.cancel(newsletter.id);
  }

  public nextRun(id: number): Date | null {
    const next = this.jobs.get(id)?.nextInvocation();
    return next ? new Date(next.getTime()) : null;
  }

  public validateCron(cron: string): boolean {
    const job = schedule.scheduleJob(cron, () => undefined);

    if (!job) {
      return false;
    }

    job.cancel();
    return true;
  }

  /**
   * Guards against abusive newsletter cadences. A newsletter never needs
   * second-level precision, and an every-minute send would spam recipients and
   * hammer the mail server, so reject seconds-granularity (6-field) crons and
   * minute fields that fire every minute.
   */
  public isCronTooFrequent(cron: string): boolean {
    const fields = cron.trim().split(/\s+/);

    // A leading seconds field (6 total) allows sub-minute scheduling.
    if (fields.length >= 6) {
      return true;
    }

    return !/^\d+$/.test(fields[0]);
  }
}

const newsletterScheduler = new NewsletterScheduler();

export default newsletterScheduler;
