import { NotificationType } from '@server/constants/notification';
import { getRepository } from '@server/datasource';
import { User } from '@server/entity/User';
import PreparedEmail from '@server/lib/email';
import type { NotificationAgentEmail } from '@server/lib/settings';
import { getSettings, NotificationAgentKey } from '@server/lib/settings';
import logger from '@server/logger';
import type { EmailOptions } from 'email-templates';
import path from 'path';
import validator from 'validator';
import {
  ALL_NOTIFICATIONS,
  hasNotificationType,
  shouldSendAdminNotification,
} from '..';
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
    type: NotificationType,
    payload: NotificationPayload,
    recipientEmail: string,
    recipientName?: string
  ): EmailOptions | undefined {
    const { applicationUrl, applicationTitle, customLogo } = getSettings().main;
    const logoUrl = customLogo || '/logo_full.png';

    const TEMPLATE_MAP: Partial<Record<NotificationType, string>> = {
      [NotificationType.TEST_NOTIFICATION]: 'test-email',
      [NotificationType.LOCAL_MESSAGE]: 'localmessage',
      [NotificationType.ACCESS_EXTENSION_REQUESTED]: 'accessextensionrequest',
      [NotificationType.USER_CREATED]: 'usercreated',
      [NotificationType.INVITE_REDEEMED]: 'inviteredeemed',
      [NotificationType.INVITE_EXPIRED]: 'inviteexpired',
      [NotificationType.NEW_INVITE]: 'newinvite',
      [NotificationType.NEW_EVENT]: 'newevent',
      [NotificationType.PLEX_ACCESS_LOST]: 'plexaccesslost',
    };

    const templateName = TEMPLATE_MAP[type];
    if (!templateName) {
      return undefined;
    }

    const baseLocals: Record<string, unknown> = {
      subject: payload.subject,
      message: payload.message,
      applicationUrl,
      applicationTitle,
      recipientName,
      recipientEmail,
      logoUrl,
    };

    // The legacy test-email template uses `body` rather than `subject`/`message`.
    if (type === NotificationType.TEST_NOTIFICATION) {
      baseLocals.body = payload.message;
    }

    if (type === NotificationType.NEW_EVENT) {
      baseLocals.description = payload.event?.description;
    }

    return {
      template: path.join(__dirname, '../../../templates/email', templateName),
      message: { to: recipientEmail },
      locals: baseLocals,
    };
  }

  public async send(
    type: NotificationType,
    payload: NotificationPayload
  ): Promise<boolean> {
    const settings = this.getSettings();
    if (!hasNotificationType(type, settings.types ?? ALL_NOTIFICATIONS)) {
      return true;
    }

    if (payload.notifyUser) {
      if (
        !payload.notifyUser.settings ||
        payload.notifyUser.settings.hasNotificationType(
          NotificationAgentKey.EMAIL,
          type
        )
      ) {
        if (
          !validator.isEmail(payload.notifyUser.email, { require_tld: false })
        ) {
          logger.warn('Skipping email notification due to invalid address', {
            label: 'Notifications',
            recipient: payload.notifyUser.displayName,
            address: payload.notifyUser.email,
            type: NotificationType[type],
          });
        } else {
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
              errorMessage: e instanceof Error ? e.message : String(e),
            });

            return false;
          }
        }
      }
    }

    if (payload.notifyAdmin) {
      const userRepository = getRepository(User);
      const users = await userRepository.find({ relations: ['settings'] });

      await Promise.all(
        users
          .filter(
            (user) =>
              (!user.settings ||
                user.settings.hasNotificationType(
                  NotificationAgentKey.EMAIL,
                  type
                )) &&
              validator.isEmail(user.email, { require_tld: false }) &&
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
                errorMessage: e instanceof Error ? e.message : String(e),
              });
            }
          })
      );
    }

    return true;
  }
}

export default EmailAgent;
