import { getSettings } from '@server/lib/settings';
import type { User } from '@server/entity/User';
import { NotificationType } from '@server/constants/notification';
import type { NotificationAgent } from '@server/lib/notifications/agents/agent';
import { getIntl } from '@server/i18n';
import type { IntlShape } from '@server/i18n';
import WebPushAgent from '@server/lib/notifications/agents/webpush';
import { Router } from 'express';
import EmailAgent from '@server/lib/notifications/agents/email';
import InAppAgent from '@server/lib/notifications/agents/inApp';

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

notificationRoutes.get('/email', (_req, res) => {
  const settings = getSettings();

  res.status(200).json(settings.notifications.agents.email);
});

notificationRoutes.post('/email', (req, res) => {
  const settings = getSettings();

  settings.notifications.agents.email = req.body;
  settings.save();

  res.status(200).json(settings.notifications.agents.email);
});

notificationRoutes.post('/email/test', (req, res, next) => {
  (async () => {
    if (!req.user) {
      return next({
        status: 500,
        message: 'User information is missing from the request.',
      });
    }

    const intl = getIntl(req.user.settings?.locale);

    const emailAgent = new EmailAgent(req.body);
    if (await sendTestNotification(emailAgent, req.user, intl)) {
      res.status(204).send();
    } else {
      return next({
        status: 500,
        message: intl.formatMessage(
          {
            id: 'notifications.test.failed',
            defaultMessage: 'Failed to send {type} notification.',
          },
          { type: 'email' }
        ),
      });
    }
  })().catch(next);
});

notificationRoutes.get('/webpush', (_req, res) => {
  const settings = getSettings();

  res.status(200).json(settings.notifications.agents.webpush);
});

notificationRoutes.post('/webpush', (req, res) => {
  const settings = getSettings();

  settings.notifications.agents.webpush = req.body;
  settings.save();

  res.status(200).json(settings.notifications.agents.webpush);
});

notificationRoutes.post('/webpush/test', (req, res, next) => {
  (async () => {
    if (!req.user) {
      return next({
        status: 500,
        message: 'User information is missing from the request.',
      });
    }

    const intl = getIntl(req.user.settings?.locale);

    const webpushAgent = new WebPushAgent(req.body);
    if (await sendTestNotification(webpushAgent, req.user, intl)) {
      res.status(204).send();
    } else {
      return next({
        status: 500,
        message: intl.formatMessage(
          {
            id: 'notifications.test.failed',
            defaultMessage: 'Failed to send {type} notification.',
          },
          { type: 'web push' }
        ),
      });
    }
  })().catch(next);
});

notificationRoutes.get('/inapp', (_req, res) => {
  const settings = getSettings();

  res.status(200).json(settings.notifications.agents.inApp);
});

notificationRoutes.post('/inapp', (req, res) => {
  const settings = getSettings();

  settings.notifications.agents.inApp = req.body;
  settings.save();

  res.status(200).json(settings.notifications.agents.inApp);
});

notificationRoutes.post('/inapp/test', (req, res, next) => {
  (async () => {
    if (!req.user) {
      return next({
        status: 500,
        message: 'User information is missing from the request.',
      });
    }

    const intl = getIntl(req.user.settings?.locale);

    const inAppAgent = new InAppAgent(req.body);
    if (await sendTestNotification(inAppAgent, req.user, intl)) {
      res.status(204).send();
    } else {
      return next({
        status: 500,
        message: intl.formatMessage(
          {
            id: 'notifications.test.failed',
            defaultMessage: 'Failed to send {type} notification.',
          },
          { type: 'in-app' }
        ),
      });
    }
  })().catch(next);
});

export default notificationRoutes;
