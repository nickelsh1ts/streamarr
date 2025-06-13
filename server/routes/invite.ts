import { InviteStatus } from '@server/constants/invite';
import { getRepository } from '@server/datasource';
import Invite from '@server/entity/Invite';
import type { InviteResultsResponse } from '@server/interfaces/api/inviteInterfaces';
import { Permission } from '@server/lib/permissions';
import logger from '@server/logger';
import { isAuthenticated } from '@server/middleware/auth';
import { Router } from 'express';

const inviteRoutes = Router();

inviteRoutes.get<Record<string, string>, InviteResultsResponse>(
  '/',
  isAuthenticated(
    [
      Permission.MANAGE_INVITES,
      Permission.VIEW_INVITES,
      Permission.CREATE_INVITES,
    ],
    { type: 'or' }
  ),
  async (req, res, next) => {
    const pageSize = req.query.take ? Number(req.query.take) : 10;
    const skip = req.query.skip ? Number(req.query.skip) : 0;
    const createdBy = req.query.createdBy ? Number(req.query.createdBy) : null;

    let sortFilter: string;

    switch (req.query.sort) {
      case 'modified':
        sortFilter = 'invite.updatedAt';
        break;
      default:
        sortFilter = 'invite.createdAt';
    }

    let statusFilter: InviteStatus[];

    switch (req.query.filter) {
      case 'valid':
        statusFilter = [InviteStatus.VALID];
        break;
      case 'redeemed':
        statusFilter = [InviteStatus.REDEEMED];
        break;
      case 'expired':
        statusFilter = [InviteStatus.EXPIRED];
        break;
      default:
        statusFilter = [
          InviteStatus.VALID,
          InviteStatus.EXPIRED,
          InviteStatus.REDEEMED,
        ];
    }

    let query = getRepository(Invite)
      .createQueryBuilder('invite')
      .leftJoinAndSelect('invite.createdBy', 'createdBy')
      .leftJoinAndSelect('invite.modifiedBy', 'modifiedBy')
      .where('invite.status IN (:...InviteStatus)', {
        InviteStatus: statusFilter,
      });

    if (
      !req.user?.hasPermission(
        [Permission.MANAGE_INVITES, Permission.VIEW_INVITES],
        { type: 'or' }
      )
    ) {
      if (createdBy && createdBy !== req.user?.id) {
        return next({
          status: 403,
          message:
            'You do not have permission to view invites sent by other users',
        });
      }
      query = query.andWhere('createdBy.id = :id', { id: req.user?.id });
    } else if (createdBy) {
      query = query.andWhere('createdBy.id = :id', { id: createdBy });
    }

    const [invites, inviteCount] = await query
      .orderBy(sortFilter, 'DESC')
      .take(pageSize)
      .skip(skip)
      .getManyAndCount();

    res.status(200).json({
      pageInfo: {
        pages: Math.ceil(inviteCount / pageSize),
        pageSize,
        results: inviteCount,
        page: Math.ceil(skip / pageSize) + 1,
      },
      results: invites,
    });
  }
);

inviteRoutes.post<
  Record<string, string>,
  Invite,
  {
    code: string;
    inviteStatus: number;
    expiresAt?: Date;
    downloads?: boolean;
    status?: InviteStatus;
    maxUses?: number;
  }
>(
  '/',
  isAuthenticated([Permission.MANAGE_INVITES, Permission.CREATE_INVITES], {
    type: 'or',
  }),
  async (req, res, next) => {
    // Satisfy typescript here. User is set, we assure you!
    if (!req.user) {
      return next({ status: 500, message: 'User missing from request.' });
    }

    const inviteRepository = getRepository(Invite);

    const invite = new Invite({
      createdBy: req.user,
      updatedBy: req.user,
      code: req.body.code,
      expiresAt: req.body.expiresAt ? new Date(req.body.expiresAt) : null,
      downloads: req.body.downloads,
      status: req.body.status || InviteStatus.VALID,
      maxUses: req.body.maxUses || 1,
    });

    const newinvite = await inviteRepository.save(invite);

    res.status(200).json(newinvite);
  }
);

inviteRoutes.get('/count', async (req, res, next) => {
  const inviteRepository = getRepository(Invite);

  try {
    const query = inviteRepository.createQueryBuilder('invite');

    const totalCount = await query.getCount();

    const activeCount = await query
      .where('invite.status = :InviteStatus', {
        InviteStatus: InviteStatus.VALID,
      })
      .getCount();

    const inactiveCount = await query
      .where('invite.status = :InviteStatus', {
        InviteStatus: InviteStatus.REDEEMED && InviteStatus.EXPIRED,
      })
      .getCount();

    res.status(200).json({
      total: totalCount,
      active: activeCount,
      inactive: inactiveCount,
    });
  } catch (e) {
    logger.debug('Something went wrong retrieving invite counts.', {
      label: 'API',
      errorMessage: e.message,
    });
    next({ status: 500, message: 'Unable to retrieve invite counts.' });
  }
});

inviteRoutes.get<{ inviteId: string }>(
  '/:inviteId',
  isAuthenticated(
    [
      Permission.MANAGE_INVITES,
      Permission.VIEW_INVITES,
      Permission.CREATE_INVITES,
    ],
    { type: 'or' }
  ),
  async (req, res, next) => {
    const inviteRepository = getRepository(Invite);
    // Satisfy typescript here. User is set, we assure you!
    if (!req.user) {
      return next({ status: 500, message: 'User missing from request.' });
    }

    try {
      const invite = await inviteRepository
        .createQueryBuilder('invite')
        .leftJoinAndSelect('invite.createdBy', 'createdBy')
        .where('invite.id = :inviteId', {
          inviteId: Number(req.params.inviteId),
        })
        .getOneOrFail();

      if (
        invite.createdBy.id !== req.user.id &&
        !req.user.hasPermission(
          [Permission.MANAGE_INVITES, Permission.VIEW_INVITES],
          { type: 'or' }
        )
      ) {
        return next({
          status: 403,
          message: 'You do not have permission to view this invite.',
        });
      }

      res.status(200).json(invite);
    } catch (e) {
      logger.debug('Failed to retrieve invite.', {
        label: 'API',
        errorMessage: e.message,
      });
      next({ status: 500, message: 'invite not found.' });
    }
  }
);

inviteRoutes.post<{ inviteId: string; status: string }, Invite>(
  '/:inviteId/:status',
  isAuthenticated([Permission.MANAGE_INVITES, Permission.CREATE_INVITES], {
    type: 'or',
  }),
  async (req, res, next) => {
    const inviteRepository = getRepository(Invite);
    // Satisfy typescript here. User is set, we assure you!
    if (!req.user) {
      return next({ status: 500, message: 'User missing from request.' });
    }

    try {
      const invite = await inviteRepository.findOneOrFail({
        where: { id: Number(req.params.inviteId) },
      });

      if (
        !req.user?.hasPermission(Permission.MANAGE_INVITES) &&
        invite.createdBy.id !== req.user?.id
      ) {
        return next({
          status: 401,
          message: 'You do not have permission to modify this invite.',
        });
      }

      let newStatus: InviteStatus | undefined;

      switch (req.params.status) {
        case 'redeemed':
          newStatus = InviteStatus.REDEEMED;
          break;
        case 'valid':
          newStatus = InviteStatus.VALID;
          break;
        case 'expired':
          newStatus = InviteStatus.EXPIRED;
      }

      if (!newStatus) {
        return next({
          status: 400,
          message: 'You must provide a valid status',
        });
      }

      invite.status = newStatus;
      invite.updatedBy = req.user;
      if (newStatus === InviteStatus.REDEEMED) {
        invite.redeemedBy = [...(invite.redeemedBy || []), req.user];
      }

      await inviteRepository.save(invite);

      res.status(200).json(invite);
    } catch (e) {
      logger.debug('Something went wrong updating the invite.', {
        label: 'API',
        errorMessage: e.message,
      });
      next({ status: 500, message: 'invite not found.' });
    }
  }
);

inviteRoutes.delete(
  '/:inviteId',
  isAuthenticated([Permission.MANAGE_INVITES, Permission.CREATE_INVITES], {
    type: 'or',
  }),
  async (req, res, next) => {
    const inviteRepository = getRepository(Invite);

    try {
      const invite = await inviteRepository.findOneOrFail({
        where: { id: Number(req.params.inviteId) },
        relations: { createdBy: true },
      });

      if (
        !req.user?.hasPermission(Permission.MANAGE_INVITES) &&
        invite.createdBy.id !== req.user?.id
      ) {
        return next({
          status: 401,
          message: 'You do not have permission to delete this invite.',
        });
      }

      await inviteRepository.remove(invite);

      res.status(204).send();
    } catch (e) {
      logger.error('Something went wrong deleting an invite.', {
        label: 'API',
        errorMessage: e.message,
      });
      next({ status: 404, message: 'invite not found.' });
    }
  }
);

export default inviteRoutes;
