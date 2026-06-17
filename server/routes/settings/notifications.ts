import PushoverAPI from '@server/api/pushover';
import { NotificationType } from '@server/constants/notification';
import type { User } from '@server/entity/User';
import type { IntlShape } from '@server/i18n';
import { getIntl } from '@server/i18n';
import type { NotificationAgent } from '@server/lib/notifications/agents/agent';
import DiscordAgent from '@server/lib/notifications/agents/discord';
import EmailAgent from '@server/lib/notifications/agents/email';
import GotifyAgent from '@server/lib/notifications/agents/gotify';
import InAppAgent from '@server/lib/notifications/agents/inApp';
import NtfyAgent from '@server/lib/notifications/agents/ntfy';
import PushbulletAgent from '@server/lib/notifications/agents/pushbullet';
import PushoverAgent from '@server/lib/notifications/agents/pushover';
import SlackAgent from '@server/lib/notifications/agents/slack';
import TelegramAgent from '@server/lib/notifications/agents/telegram';
import WebhookAgent from '@server/lib/notifications/agents/webhook';
import WebPushAgent from '@server/lib/notifications/agents/webpush';
import type { NotificationAgents } from '@server/lib/settings';
import { getSettings } from '@server/lib/settings';
import { Router } from 'express';

const notificationRoutes = Router();

const sendTestNotification = async (
  agent: NotificationAgent,
  user: User,
  intl: IntlShape
) => {
  return await agent.send(NotificationType.TEST_NOTIFICATION, {
    notifySystem: true,
    notifyAdmin: false,
    notifyUser: user,
    subject: intl.formatMessage({
      id: 'notifications.test.subject',
      defaultMessage: 'Test Notification',
    }),
    message: intl.formatMessage({
      id: 'notifications.test.message',
      defaultMessage: 'Check check, 1, 2, 3. Are we coming in clear?',
    }),
  });
};

const registerAgentRoutes = <K extends keyof NotificationAgents>(
  routePath: string,
  settingsKey: K,
  typeName: string,
  factory: (settings: NotificationAgents[K]) => NotificationAgent
) => {
  notificationRoutes.get<unknown, NotificationAgents[K]>(
    `/${routePath}`,
    (_req, res) => {
      const settings = getSettings();
      const agentSettings = settings.notifications.agents[settingsKey];

      res.status(200).json(agentSettings);
    }
  );

  notificationRoutes.post<
    unknown,
    NotificationAgents[K],
    NotificationAgents[K]
  >(`/${routePath}`, (req, res) => {
    const settings = getSettings();

    settings.notifications.agents[settingsKey] = req.body;
    settings.save();

    res.status(200).json(settings.notifications.agents[settingsKey]);
  });

  notificationRoutes.post<unknown, unknown, NotificationAgents[K]>(
    `/${routePath}/test`,
    (req, res, next) => {
      (async () => {
        if (!req.user) {
          return next({
            status: 500,
            message: 'User information is missing from the request.',
          });
        }

        const intl = getIntl(req.user.settings?.locale);

        const agent = factory(req.body);
        if (await sendTestNotification(agent, req.user, intl)) {
          res.status(204).send();
        } else {
          return next({
            status: 500,
            message: intl.formatMessage(
              {
                id: 'notifications.test.failed',
                defaultMessage: 'Failed to send {type} notification.',
              },
              { type: typeName }
            ),
          });
        }
      })().catch(next);
    }
  );
};

registerAgentRoutes(
  'discord',
  'discord',
  'Discord',
  (settings) => new DiscordAgent(settings)
);
registerAgentRoutes(
  'email',
  'email',
  'email',
  (settings) => new EmailAgent(settings)
);
registerAgentRoutes(
  'gotify',
  'gotify',
  'Gotify',
  (settings) => new GotifyAgent(settings)
);
registerAgentRoutes(
  'ntfy',
  'ntfy',
  'ntfy',
  (settings) => new NtfyAgent(settings)
);
registerAgentRoutes(
  'pushbullet',
  'pushbullet',
  'Pushbullet',
  (settings) => new PushbulletAgent(settings)
);
registerAgentRoutes(
  'pushover',
  'pushover',
  'Pushover',
  (settings) => new PushoverAgent(settings)
);

notificationRoutes.get('/pushover/sounds', async (_req, res, next) => {
  const pushoverApi = new PushoverAPI();

  try {
    const token =
      getSettings().notifications.agents.pushover.options.accessToken;

    if (!token) {
      return next({
        status: 400,
        message: 'Pushover application token is not configured.',
      });
    }

    const sounds = await pushoverApi.getSounds(token);
    res.status(200).json(
      sounds.map((sound) => ({
        value: sound.name,
        label: sound.description,
      }))
    );
  } catch (e) {
    next({
      status: 500,
      message:
        e instanceof Error ? e.message : 'Unable to retrieve Pushover sounds.',
    });
  }
});
registerAgentRoutes(
  'slack',
  'slack',
  'Slack',
  (settings) => new SlackAgent(settings)
);
registerAgentRoutes(
  'telegram',
  'telegram',
  'Telegram',
  (settings) => new TelegramAgent(settings)
);
registerAgentRoutes(
  'webhook',
  'webhook',
  'webhook',
  (settings) => new WebhookAgent(settings)
);
registerAgentRoutes(
  'webpush',
  'webpush',
  'web push',
  (settings) => new WebPushAgent(settings)
);
registerAgentRoutes(
  'inapp',
  'inApp',
  'in-app',
  (settings) => new InAppAgent(settings)
);

export default notificationRoutes;
