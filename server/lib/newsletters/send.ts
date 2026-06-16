import dataSource, { getRepository } from '@server/datasource';
import type { NewsletterTrigger } from '@server/entity/NewsletterHistory';
import type Newsletter from '@server/entity/Newsletter';
import NewsletterHistory from '@server/entity/NewsletterHistory';
import { User } from '@server/entity/User';
import { getIntl } from '@server/i18n';
import PreparedEmail from '@server/lib/email';
import { getSettings } from '@server/lib/settings';
import logger from '@server/logger';
import path from 'path';
import { In } from 'typeorm';
import validator from 'validator';
import { resolveBlockData } from './dataProviders';
import type { RenderedNewsletter } from './render';
import {
  getNewsletterEmailStrings,
  renderForRecipient,
  renderNewsletter,
} from './render';

const runningNewsletters = new Set<number>();

export const isNewsletterSending = (id: number): boolean =>
  runningNewsletters.has(id);

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
    let recipients: User[];

    if (triggeredBy === 'test' && options.testUser) {
      recipients = [options.testUser];
    } else {
      const userRepository = getRepository(User);

      recipients =
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
            !(user.settings?.unsubscribedNewsletters ?? []).includes(
              newsletter.id
            )
        );
      }
    }

    recipients = recipients.filter((user) =>
      validator.isEmail(user.email, { require_tld: false })
    );

    const blockData = await resolveBlockData(newsletter.blocks);
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
