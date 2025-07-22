import { getOrFetchCalendar } from '@server/lib/calendarCache';
import { Permission } from '@server/lib/permissions';
import { isAuthenticated } from '@server/middleware/auth';
import { Router } from 'express';

const calendarRoutes = Router();

calendarRoutes.get(
  '/sonarr',
  isAuthenticated([Permission.VIEW_SCHEDULE, Permission.STREAMARR], {
    type: 'or',
  }),
  async (req, res) => {
    const events = await getOrFetchCalendar('sonarr');
    res.json(events);
  }
);

calendarRoutes.get(
  '/radarr',
  isAuthenticated([Permission.VIEW_SCHEDULE, Permission.STREAMARR], {
    type: 'or',
  }),
  async (req, res) => {
    const events = await getOrFetchCalendar('radarr');
    res.json(events);
  }
);

export default calendarRoutes;
