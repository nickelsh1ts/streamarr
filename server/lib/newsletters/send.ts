import dataSource, { getRepository } from '@server/datasource';
import type Newsletter from '@server/entity/Newsletter';
import type { NewsletterTrigger } from '@server/entity/NewsletterHistory';
import NewsletterHistory from '@server/entity/NewsletterHistory';
import { User } from '@server/entity/User';
import { getIntl } from '@server/i18n';
import PreparedEmail from '@server/lib/email';
import { getSettings } from '@server/lib/settings';
import logger from '@server/logger';
import path from 'path';
import { In } from 'typeorm';
import validator from 'validator';
import type { NewsletterDataFailure } from './dataProviders';
import { getConfiguredBlocks, resolveBlockData } from './dataProviders';
import type { RenderedNewsletter } from './render';
import {
  getNewsletterEmailStrings,
  renderForRecipient,
  renderNewsletter,
} from './render';

const runningNewsletters = new Set<number>();

export const isNewsletterSending = (id: number): boolean =>
  runningNewsletters.has(id);

export class NewsletterDataUnavailableError extends Error {
  public readonly failures: NewsletterDataFailure[];

  constructor(failures: NewsletterDataFailure[]) {
    super(
      'One or more external services are unavailable. The newsletter was not sent.'
    );
    this.name = 'NewsletterDataUnavailableError';
    this.failures = failures;
  }
}

export class NewsletterEmptyError extends Error {
  public readonly blocks: string[];

  constructor(blocks: string[]) {
    super('There is no content to send — all configured blocks are empty.');
    this.name = 'NewsletterEmptyError';
    this.blocks = blocks;
  }
}

/**
 * Resolves a newsletter's recipient list: active users, honouring custom
 * selection and per-user un-subscription for non-important newsletters, filtered
 * to those with a valid email address.
 */
const resolveNewsletterRecipients = async (
  newsletter: Newsletter
): Promise<User[]> => {
  const userRepository = getRepository(User);

  let recipients =
    newsletter.recipientMode === 'custom'
      ? await userRepository.find({
          where: { id: In(newsletter.recipientIds ?? []), active: true },
          relations: ['settings'],
        })
      : await userRepository.find({
          where: { active: true },
          relations: ['settings'],
        });

  if (!newsletter.isImportant) {
    recipients = recipients.filter(
      (user) =>
        !(user.settings?.unsubscribedNewsletters ?? []).includes(newsletter.id)
    );
  }

  return recipients.filter((user) =>
    validator.isEmail(user.email, { require_tld: false })
  );
};

export const recordNewsletterAbort = async (
  newsletter: Newsletter,
  failures: NewsletterDataFailure[]
): Promise<{ recipientCount: number }> => {
  const recipients = await resolveNewsletterRecipients(newsletter);
  const recipientCount = recipients.length;

  await getRepository(NewsletterHistory).save(
    new NewsletterHistory({
      newsletter,
      triggeredBy: 'schedule',
      recipientCount,
      failureCount: recipientCount,
    })
  );

  logger.error(
    'Newsletter was aborted because external services were unavailable',
    {
      label: 'Newsletters',
      newsletterId: newsletter.id,
      name: newsletter.name,
      recipientCount,
      failures: failures.map((failure) => ({
        block: failure.block,
        source: failure.source,
        mediaType: failure.mediaType,
        error: failure.error,
      })),
    }
  );

  return { recipientCount };
};

/**
 * Sends a newsletter to its resolved recipients using PreparedEmail
 * directly. The notification agent layer is intentionally bypassed so
 * that newsletter delivery is governed only by the admin's recipient
 * selection and each user's independent newsletter subscription (which
 * important newsletters override).
 */
export const sendNewsletter = async (
  newsletter: Newsletter,
  triggeredBy: NewsletterTrigger,
  options: { testUser?: User } = {}
): Promise<{ recipientCount: number; failureCount: number }> => {
  const settings = getSettings();
  const emailSettings = settings.notifications.agents.email;

  if (
    !emailSettings.enabled ||
    !emailSettings.options.emailFrom ||
    !emailSettings.options.smtpHost ||
    !emailSettings.options.smtpPort
  ) {
    throw new Error(
      'Email notifications are not configured. Configure the email agent before sending newsletters.'
    );
  }

  if (runningNewsletters.has(newsletter.id)) {
    throw new Error('This newsletter is already being sent.');
  }

  runningNewsletters.add(newsletter.id);

  try {
    const recipients: User[] =
      triggeredBy === 'test' && options.testUser
        ? [options.testUser].filter((user) =>
            validator.isEmail(user.email, { require_tld: false })
          )
        : await resolveNewsletterRecipients(newsletter);

    const { data: blockData, failures } = await resolveBlockData(
      newsletter.blocks
    );

    if (failures.length > 0) {
      throw new NewsletterDataUnavailableError(failures);
    }

    const configuredBlocks = getConfiguredBlocks(newsletter.blocks);

    if (
      configuredBlocks.length > 0 &&
      configuredBlocks.every((block) => blockData[block].length === 0)
    ) {
      throw new NewsletterEmptyError(configuredBlocks);
    }

    const { applicationUrl, applicationTitle, customLogo } = settings.main;
    const logoUrl = customLogo || '/logo_full.png';

    const byLocale = new Map<
      string,
      {
        rendered: RenderedNewsletter;
        strings: ReturnType<typeof getNewsletterEmailStrings>;
      }
    >();

    let failureCount = 0;

    for (const user of recipients) {
      try {
        const intl = getIntl(user.settings?.locale);
        const localeKey = intl.locale;
        let entry = byLocale.get(localeKey);

        if (!entry) {
          entry = {
            rendered: await renderNewsletter(newsletter, { intl, blockData }),
            strings: getNewsletterEmailStrings(intl, applicationTitle),
          };
          byLocale.set(localeKey, entry);
        }

        const personalized = renderForRecipient(entry.rendered, user);
        const email = new PreparedEmail(emailSettings, user.settings?.pgpKey);

        await email.send({
          template: path.join(__dirname, '../../templates/email/newsletter'),
          message: {
            to: user.email,
            // Flag important newsletters as high priority (sets X-Priority /
            // Importance headers via nodemailer).
            ...(newsletter.isImportant ? { priority: 'high' as const } : {}),
          },
          locals: {
            subject: personalized.subject,
            body: personalized.html,
            applicationUrl,
            applicationTitle,
            baseUrl: applicationUrl,
            showChrome: !!applicationUrl,
            recipientName: user.displayName,
            recipientEmail: user.email,
            isImportant: newsletter.isImportant,
            logoUrl,
            ...entry.strings,
          },
        });
      } catch (e) {
        failureCount++;
        logger.error('Failed to send newsletter email', {
          label: 'Newsletters',
          newsletterId: newsletter.id,
          recipient: user.displayName,
          errorMessage: e instanceof Error ? e.message : String(e),
        });
      }
    }

    // Record the run and update the newsletter's send state atomically.
    await dataSource.transaction(async (manager) => {
      await manager.save(
        new NewsletterHistory({
          newsletter,
          triggeredBy,
          recipientCount: recipients.length,
          failureCount,
        })
      );

      if (triggeredBy !== 'test') {
        newsletter.lastSentAt = new Date();

        if (newsletter.scheduleType === 'once') {
          newsletter.enabled = false;
        }

        await manager.save(newsletter);
      }
    });

    logger.info('Newsletter sent', {
      label: 'Newsletters',
      newsletterId: newsletter.id,
      name: newsletter.name,
      recipientCount: recipients.length,
      failureCount,
      triggeredBy,
    });

    return { recipientCount: recipients.length, failureCount };
  } finally {
    runningNewsletters.delete(newsletter.id);
  }
};
