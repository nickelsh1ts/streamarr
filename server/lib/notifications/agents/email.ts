import { getRepository } from '@server/datasource';
import { User } from '@server/entity/User';
import PreparedEmail from '@server/lib/email';
import type { NotificationAgentEmail } from '@server/lib/settings';
import { getSettings, NotificationAgentKey } from '@server/lib/settings';
import logger from '@server/logger';
import type { EmailOptions } from 'email-templates';
import path from 'path';
import { shouldSendAdminNotification } from '..';
import type { NotificationAgent, NotificationPayload } from './agent';
import { BaseAgent } from './agent';
import { NotificationType } from '@server/constants/notification';

class EmailAgent
  extends BaseAgent<NotificationAgentEmail>
  implements NotificationAgent
{
  protected getSettings(): NotificationAgentEmail {
    if (this.settings) {
      return this.settings;
    }

    const settings = getSettings();

    return settings.notifications.agents.email;
  }

  public shouldSend(): boolean {
    const settings = this.getSettings();

    if (
      settings.enabled &&
      settings.options.emailFrom &&
      settings.options.smtpHost &&
      settings.options.smtpPort
    ) {
      return true;
    }

    return false;
  }

  private buildMessage(
    type: NotificationType,
    payload: NotificationPayload,
    recipientEmail: string,
    recipientName?: string
  ): EmailOptions | undefined {
    const { applicationUrl, applicationTitle, customLogo } = getSettings().main;

    // Use custom logo if available, otherwise fallback to default
    const logoUrl = customLogo || '/logo_full.png';

    if (type === NotificationType.TEST_NOTIFICATION) {
      return {
        template: path.join(__dirname, '../../../templates/email/test-email'),
        message: { to: recipientEmail },
        locals: {
          body: payload.message,
          applicationUrl,
          applicationTitle,
          recipientName,
          recipientEmail,
          logoUrl,
        },
      };
    }

    if (type === NotificationType.LOCAL_MESSAGE) {
      return {
        template: path.join(__dirname, '../../../templates/email/localmessage'),
        message: { to: recipientEmail },
        locals: {
          subject: payload.subject,
          message: payload.message,
          applicationUrl,
          applicationTitle,
          recipientName,
          recipientEmail,
          logoUrl,
        },
      };
    }
  }

  public async send(
    type: NotificationType,
    payload: NotificationPayload
  ): Promise<boolean> {
    if (payload.notifyUser) {
      if (
        !payload.notifyUser.settings ||
        // Check if user has email notifications enabled and fallback to true if undefined
        // since email should default to true
        (payload.notifyUser.settings.hasNotificationType(
          NotificationAgentKey.EMAIL,
          type
        ) ??
          true)
      ) {
        logger.debug('Sending email notification', {
          label: 'Notifications',
          recipient: payload.notifyUser.displayName,
          type: NotificationType[type],
          subject: payload.subject,
        });

        try {
          const emailMessage = this.buildMessage(
            type,
            payload,
            payload.notifyUser.email,
            payload.notifyUser.displayName
          );

          // Skip sending if no template is configured for this notification type
          if (!emailMessage) {
            logger.debug('No email template configured for notification type', {
              label: 'Notifications',
              type: NotificationType[type],
            });
            return true;
          }

          const email = new PreparedEmail(
            this.getSettings(),
            payload.notifyUser.settings?.pgpKey
          );
          await email.send(emailMessage);
        } catch (e) {
          logger.error('Error sending email notification', {
            label: 'Notifications',
            recipient: payload.notifyUser.displayName,
            type: NotificationType[type],
            subject: payload.subject,
            errorMessage: e.message,
          });

          return false;
        }
      }
    }

    if (payload.notifyAdmin) {
      const userRepository = getRepository(User);
      const users = await userRepository.find();

      await Promise.all(
        users
          .filter(
            (user) =>
              (!user.settings ||
                // Check if user has email notifications enabled and fallback to true if undefined
                // since email should default to true
                (user.settings.hasNotificationType(
                  NotificationAgentKey.EMAIL,
                  type
                ) ??
                  true)) &&
              shouldSendAdminNotification(type, user, payload)
          )
          .map(async (user) => {
            logger.debug('Sending email notification', {
              label: 'Notifications',
              recipient: user.displayName,
              type: NotificationType[type],
              subject: payload.subject,
            });

            try {
              const emailMessage = this.buildMessage(
                type,
                payload,
                user.email,
                user.displayName
              );

              // Skip sending if no template is configured for this notification type
              if (!emailMessage) {
                logger.debug(
                  'No email template configured for notification type',
                  {
                    label: 'Notifications',
                    type: NotificationType[type],
                  }
                );
                return true;
              }

              const email = new PreparedEmail(
                this.getSettings(),
                user.settings?.pgpKey
              );
              await email.send(emailMessage);
            } catch (e) {
              logger.error('Error sending email notification', {
                label: 'Notifications',
                recipient: user.displayName,
                type: NotificationType[type],
                subject: payload.subject,
                errorMessage: e.message,
              });

              return false;
            }
          })
      );
    }

    return true;
  }
}

export default EmailAgent;
