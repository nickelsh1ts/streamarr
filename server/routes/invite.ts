import { InviteStatus } from '@server/constants/invite';
import { getRepository } from '@server/datasource';
import Invite from '@server/entity/Invite';
import type { User } from '@server/entity/User';
import type { InviteResultsResponse } from '@server/interfaces/api/inviteInterfaces';
import { Permission } from '@server/lib/permissions';
import { getSettings } from '@server/lib/settings';
import logger from '@server/logger';
import { isAuthenticated } from '@server/middleware/auth';
import { Router } from 'express';
import QRCodeProxy from '@server/lib/qrcodeproxy';

function generateIcode(): string {
  // Generates a random 8-character alphanumeric invite code
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let icode = '';
  for (let i = 0; i < 8; i++) {
    icode += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return icode;
}

const inviteRoutes = Router();

inviteRoutes.get<Record<string, string>, InviteResultsResponse>(
  '/',
  isAuthenticated(
    [
      Permission.MANAGE_INVITES,
      Permission.VIEW_INVITES,
      Permission.CREATE_INVITES,
      Permission.STREAMARR,
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
      case 'active':
        statusFilter = [InviteStatus.ACTIVE];
        break;
      case 'redeemed':
        statusFilter = [InviteStatus.REDEEMED];
        break;
      case 'expired':
        statusFilter = [InviteStatus.EXPIRED];
        break;
      case 'inactive':
        statusFilter = [InviteStatus.INACTIVE];
        break;
      default:
        statusFilter = [
          InviteStatus.ACTIVE,
          InviteStatus.EXPIRED,
          InviteStatus.REDEEMED,
          InviteStatus.INACTIVE,
        ];
    }

    let query = getRepository(Invite)
      .createQueryBuilder('invite')
      .leftJoinAndSelect('invite.createdBy', 'createdBy')
      .leftJoinAndSelect('invite.updatedBy', 'updatedBy')
      .leftJoinAndSelect('invite.redeemedBy', 'redeemedBy')
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

    // Explicitly run expiry/status update logic for each invite
    const inviteRepository = getRepository(Invite);
    await Promise.all(
      invites.map(async (invite) => {
        let expiryDate;
        if (invite.expiresAt) {
          expiryDate = new Date(invite.expiresAt);
        } else if (invite.expiryLimit !== 0) {
          let msPerUnit = 86400000;
          if (invite.expiryTime === 'weeks') msPerUnit = 604800000;
          if (invite.expiryTime === 'months') msPerUnit = 2629800000;
          expiryDate = new Date(
            invite.createdAt.getTime() + invite.expiryLimit * msPerUnit
          );
        }
        const now = Date.now();
        // Only check for expiry, not usage limit (handled at use time)
        if (
          expiryDate &&
          now > expiryDate.getTime() &&
          invite.status !== InviteStatus.EXPIRED &&
          invite.status !== InviteStatus.REDEEMED // Don't override redeemed
        ) {
          invite.status = InviteStatus.EXPIRED;
          await inviteRepository.save(invite);
          logger.debug('Invite marked as expired and saved', {
            label: 'API',
            inviteId: invite.id,
            icode: invite.icode,
          });
        }
      })
    );

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
    icode: string;
    inviteStatus: number;
    expiryLimit?: number;
    expiryTime?: 'days' | 'weeks' | 'months';
    liveTv?: boolean;
    plexHome?: boolean;
    sharedLibraries?: string;
    downloads?: boolean;
    status?: InviteStatus;
    usageLimit?: number;
    inviteAs?: User;
  }
>(
  '/',
  isAuthenticated(
    [
      Permission.MANAGE_INVITES,
      Permission.CREATE_INVITES,
      Permission.STREAMARR,
    ],
    {
      type: 'or',
    }
  ),
  async (req, res, next) => {
    if (!req.user) {
      return next({ status: 500, message: 'User missing from request.' });
    }

    const settings = getSettings();
    if (!settings.main.enableSignUp) {
      return next({
        status: 403,
        message:
          'Invite creation is disabled. Signup must be enabled to create invites.',
      });
    }

    const inviteRepository = getRepository(Invite);

    const invite = new Invite({
      createdBy: req.body.inviteAs ?? req.user,
      updatedBy: req.user,
      icode: req.body.icode || generateIcode(),
      expiresAt:
        req.body.expiryLimit > 0 && req.body.expiryTime
          ? new Date(
              Date.now() +
                req.body.expiryLimit *
                  {
                    days: 86400000,
                    weeks: 604800000,
                    months: 2629800000,
                  }[req.body.expiryTime]
            )
          : null,
      status: req.body.status ?? InviteStatus.ACTIVE,
      usageLimit: req.body.usageLimit ?? 1,
      downloads: req.body.downloads ?? true,
      liveTv: req.body.liveTv ?? false,
      plexHome: req.body.plexHome ?? false,
      sharedLibraries: req.body.sharedLibraries ?? '',
      expiryLimit: req.body.expiryLimit ?? 1,
      expiryTime: req.body.expiryTime ?? 'days',
    });

    const newinvite = await inviteRepository.save(invite);

    res.status(200).json(newinvite);
  }
);

inviteRoutes.put<{ id: string }, Invite, Invite>(
  '/:id',
  isAuthenticated([Permission.MANAGE_INVITES, Permission.ADVANCED_INVITES], {
    type: 'or',
  }),
  async (req, res, next) => {
    // Satisfy typescript here. User is set, we assure you!
    if (!req.user) {
      return next({ status: 500, message: 'User missing from request.' });
    }

    const inviteRepository = getRepository(Invite);

    try {
      const invite = await inviteRepository.findOneOrFail({
        where: { id: Number(req.params.id) },
      });

      inviteRepository.merge(invite, req.body);
      // If invite was REDEEMED and usageLimit is now greater than uses, set back to ACTIVE
      if (
        invite.status === InviteStatus.REDEEMED &&
        invite.usageLimit > invite.uses
      ) {
        invite.status = InviteStatus.ACTIVE;
      }
      // If usageLimit is set to a value less than or equal to uses, set to REDEEMED
      if (invite.usageLimit > 0 && invite.usageLimit <= invite.uses) {
        invite.status = InviteStatus.REDEEMED;
      }
      const updatedInvite = await inviteRepository.save(invite);

      res.status(200).json(updatedInvite);
    } catch (e) {
      logger.debug('Something went wrong saving invite.', {
        label: 'API',
        errorMessage: e.message,
      });
      next({ status: 404, message: 'Invite not found' });
    }
  }
);

inviteRoutes.get('/count', async (req, res, next) => {
  const inviteRepository = getRepository(Invite);

  try {
    const query = inviteRepository.createQueryBuilder('invite');

    const totalCount = await query.getCount();

    const activeCount = await query
      .where('invite.status = :InviteStatus', {
        InviteStatus: InviteStatus.ACTIVE,
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
      Permission.STREAMARR,
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
  isAuthenticated(
    [
      Permission.MANAGE_INVITES,
      Permission.CREATE_INVITES,
      Permission.STREAMARR,
    ],
    {
      type: 'or',
    }
  ),
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
        case 'active':
          newStatus = InviteStatus.ACTIVE;
          break;
        case 'expired':
          newStatus = InviteStatus.EXPIRED;
          break;
        case 'inactive':
          newStatus = InviteStatus.INACTIVE;
          break;
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

inviteRoutes.get<{ inviteId: string }>(
  '/:inviteId/qrcode',
  isAuthenticated(
    [
      Permission.MANAGE_INVITES,
      Permission.VIEW_INVITES,
      Permission.CREATE_INVITES,
      Permission.STREAMARR,
    ],
    { type: 'or' }
  ),
  async (req, res, next) => {
    const inviteRepository = getRepository(Invite);
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
          message: 'You do not have permission to view this QR Code.',
        });
      }
      const qrProxy = new QRCodeProxy();
      const inviteUrl = `${getSettings().main.applicationUrl}/signup?icode=${invite.icode}`;
      await qrProxy.getQRCode(invite.id, invite.icode, inviteUrl);
      const cacheKey = qrProxy.getCacheKey(invite.id, invite.icode);
      const imageData = await qrProxy.getImage(cacheKey);
      if (imageData) {
        res.writeHead(200, {
          'Content-Type': `image/${imageData.meta.extension}`,
          'Content-Length': imageData.imageBuffer.length,
          'Cache-Control': `public, max-age=${imageData.meta.curRevalidate}`,
          'OS-Cache-Key': imageData.meta.cacheKey,
          'OS-Cache-Status': imageData.meta.cacheMiss ? 'MISS' : 'HIT',
        });
        res.end(imageData.imageBuffer);
      } else {
        res.status(404).send();
      }
    } catch (e) {
      logger.error('Failed to serve QR code image', {
        errorMessage: e.message,
      });
      next({ status: 500, message: 'Failed to serve QR code image.' });
    }
  }
);

inviteRoutes.delete(
  '/:inviteId',
  isAuthenticated(
    [
      Permission.MANAGE_INVITES,
      Permission.CREATE_INVITES,
      Permission.STREAMARR,
    ],
    {
      type: 'or',
    }
  ),
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

inviteRoutes.delete(
  '/:inviteId/qrcode',
  isAuthenticated(
    [
      Permission.MANAGE_INVITES,
      Permission.CREATE_INVITES,
      Permission.STREAMARR,
    ],
    {
      type: 'or',
    }
  ),
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
          message: 'You do not have permission to delete this QR Code.',
        });
      }
      const qrProxy = new QRCodeProxy();
      const cacheKey = qrProxy.getCacheKey(invite.id, invite.icode);
      await qrProxy.deleteImage(cacheKey);
      res.status(204).send();
    } catch (e) {
      logger.error('Failed to delete QR code image', {
        errorMessage: e.message,
      });
      next({ status: 404, message: 'QR code not found.' });
    }
  }
);

export default inviteRoutes;
