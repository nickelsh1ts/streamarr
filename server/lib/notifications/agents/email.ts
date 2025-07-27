import { getRepository } from '@server/datasource';
import { User } from '@server/entity/User';
import PreparedEmail from '@server/lib/email';
import type { NotificationAgentEmail } from '@server/lib/settings';
import { getSettings, NotificationAgentKey } from '@server/lib/settings';
import logger from '@server/logger';
import type { EmailOptions } from 'email-templates';
import path from 'path';
import { Notification } from '..';
import type { NotificationAgent, NotificationPayload } from './agent';
import { BaseAgent } from './agent';

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
    type: Notification,
    payload: NotificationPayload,
    recipientEmail: string,
    recipientName?: string
  ): EmailOptions | undefined {
    const { applicationUrl, applicationTitle, customLogo } = getSettings().main;

    // Use custom logo if available, otherwise fallback to default
    const logoUrl = customLogo || '/logo_full.png';

    if (type === Notification.TEST_NOTIFICATION) {
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

    return undefined;
  }

  public async send(
    type: Notification,
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
          type: Notification[type],
          subject: payload.subject,
        });

        try {
          const email = new PreparedEmail(
            this.getSettings(),
            payload.notifyUser.settings?.pgpKey
          );
          await email.send(
            this.buildMessage(
              type,
              payload,
              payload.notifyUser.email,
              payload.notifyUser.displayName
            )
          );
        } catch (e) {
          logger.error('Error sending email notification', {
            label: 'Notifications',
            recipient: payload.notifyUser.displayName,
            type: Notification[type],
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
              !user.settings ||
              // Check if user has email notifications enabled and fallback to true if undefined
              // since email should default to true
              (user.settings.hasNotificationType(
                NotificationAgentKey.EMAIL,
                type
              ) ??
                true)
          )
          .map(async (user) => {
            logger.debug('Sending email notification', {
              label: 'Notifications',
              recipient: user.displayName,
              type: Notification[type],
              subject: payload.subject,
            });

            try {
              const email = new PreparedEmail(
                this.getSettings(),
                user.settings?.pgpKey
              );
              await email.send(
                this.buildMessage(type, payload, user.email, user.displayName)
              );
            } catch (e) {
              logger.error('Error sending email notification', {
                label: 'Notifications',
                recipient: user.displayName,
                type: Notification[type],
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
