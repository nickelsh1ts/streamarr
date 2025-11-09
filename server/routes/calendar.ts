import { getRepository } from '@server/datasource';
import Event from '@server/entity/Event';
import { getOrFetchCalendar } from '@server/lib/calendarCache';
import { Permission } from '@server/lib/permissions';
import logger from '@server/logger';
import { isAuthenticated } from '@server/middleware/auth';
import { randomUUID } from 'crypto';
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

calendarRoutes.get<Record<string, string>>(
  '/local',
  isAuthenticated([Permission.VIEW_SCHEDULE, Permission.STREAMARR], {
    type: 'or',
  }),
  async (req, res) => {
    const events = await getRepository(Event)
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.createdBy', 'createdBy')
      .getMany();
    res.json(events);
  }
);

calendarRoutes.post<
  Record<string, string>,
  Event,
  {
    uid: string | null;
    summary: string;
    start: Date;
    end: Date;
    description: string;
    categories?: string;
    status?: 'TENTATIVE' | 'CONFIRMED' | 'CANCELLED';
    allDay?: boolean;
    sendNotification?: boolean;
  }
>(
  '/local',
  isAuthenticated([Permission.MANAGE_EVENTS, Permission.CREATE_EVENTS], {
    type: 'or',
  }),
  async (req, res, next) => {
    if (!req.user) {
      return next({ status: 500, message: 'User missing from request.' });
    }

    try {
      const eventRepository = getRepository(Event);

      // Generate UUID if none provided or if empty string
      const uid =
        req.body.uid && req.body.uid.trim() !== ''
          ? req.body.uid
          : randomUUID();

      const event = new Event({
        uid,
        summary: req.body.summary,
        start: req.body.start,
        end: req.body.end,
        description: req.body.description,
        categories: req.body.categories,
        status: req.body.status,
        allDay: req.body.allDay,
        sendNotification: req.body.sendNotification ?? false,
        createdBy: req.user,
        updatedBy: req.user,
      });

      const newEvent = await eventRepository.save(event);

      res.status(200).json(newEvent);
    } catch (e) {
      logger.error('Something went wrong creating an event.', {
        label: 'Calendar',
        errorMessage: e.message,
      });
      next({ status: 500, message: 'Failed to create event.' });
    }
  }
);

calendarRoutes.put<{ eventId: string }, Event, Event>(
  '/local/:eventId',
  isAuthenticated([Permission.MANAGE_EVENTS, Permission.CREATE_EVENTS], {
    type: 'or',
  }),
  async (req, res, next) => {
    if (!req.user) {
      return next({ status: 500, message: 'User missing from request.' });
    }

    const eventRepository = getRepository(Event);

    try {
      const event = await eventRepository.findOneOrFail({
        where: { id: Number(req.params.eventId) },
      });

      if (
        !req.user?.hasPermission(Permission.MANAGE_EVENTS) &&
        event.createdBy.id !== req.user?.id
      ) {
        return next({
          status: 401,
          message: 'You do not have permission to edit this event.',
        });
      }

      eventRepository.merge(event, req.body);

      const updatedEvent = await eventRepository.save(event);

      res.status(200).json(updatedEvent);
    } catch (e) {
      logger.error('Something went wrong updating an event.', {
        label: 'Calendar',
        errorMessage: e.message,
      });
      next({ status: 404, message: 'Event not found.' });
    }
  }
);

calendarRoutes.delete(
  '/local/:eventId',
  isAuthenticated([Permission.MANAGE_EVENTS, Permission.CREATE_EVENTS], {
    type: 'or',
  }),
  async (req, res, next) => {
    const eventRepository = getRepository(Event);

    try {
      const event = await eventRepository.findOneOrFail({
        where: { id: Number(req.params.eventId) },
        relations: { createdBy: true },
      });

      if (
        !req.user?.hasPermission(Permission.MANAGE_EVENTS) &&
        event.createdBy.id !== req.user?.id
      ) {
        return next({
          status: 401,
          message: 'You do not have permission to delete this event.',
        });
      }

      await eventRepository.remove(event);

      res.status(204).send();
    } catch (e) {
      logger.error('Something went wrong deleting an event.', {
        label: 'Calendar',
        errorMessage: e.message,
      });
      next({ status: 404, message: 'Event not found.' });
    }
  }
);

export default calendarRoutes;
