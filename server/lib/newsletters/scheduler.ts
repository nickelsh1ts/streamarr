import { getRepository } from '@server/datasource';
import Newsletter from '@server/entity/Newsletter';
import logger from '@server/logger';
import schedule from 'node-schedule';
import { sendNewsletter } from './send';

/**
 * Manages dynamic node-schedule jobs keyed by newsletter id, unlike the
 * static settings-driven jobs in server/job/schedule.ts. Jobs are loaded
 * at boot and rescheduled whenever a newsletter is created, updated or
 * deleted.
 */
class NewsletterScheduler {
  private jobs = new Map<number, schedule.Job>();

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

      try {
        // Re-fetch so edits made after scheduling are respected.
        const fresh = await getRepository(Newsletter).findOne({
          where: { id: newsletter.id },
        });

        if (!fresh || !fresh.enabled) {
          return;
        }

        await sendNewsletter(fresh, 'schedule');

        if (fresh.scheduleType === 'once') {
          this.cancel(fresh.id);
        }
      } catch (e) {
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
