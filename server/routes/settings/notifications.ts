import { getSettings } from '@server/lib/settings';
import { Router } from 'express';

const notificationRoutes = Router();

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

export default notificationRoutes;
