import { getRepository } from '@server/datasource';
import Invite from '@server/entity/Invite';
import { InviteStatus } from '@server/constants/invite';
import { In, LessThanOrEqual } from 'typeorm';
import logger from '@server/logger';
import { getSettings } from '@server/lib/settings';
import QRCodeProxy from '@server/lib/qrcodeproxy';
import fs from 'fs/promises';

class ExpiredInvites {
  public async run() {
    const inviteRepository = getRepository(Invite);
    const qrProxy = new QRCodeProxy();
    const now = new Date();
    const expiredInvites = await inviteRepository.find({
      where: {
        status: In([InviteStatus.ACTIVE, InviteStatus.INACTIVE]),
        expiresAt: LessThanOrEqual(now),
      },
    });

    let updatedCount = 0;
    let qrDeletedCount = 0;

    for (const invite of expiredInvites) {
      invite.status = InviteStatus.EXPIRED;
      await inviteRepository.save(invite);
      updatedCount++;

      logger.info(`Invite ${invite.icode} marked as expired.`, {
        label: 'Jobs',
      });

      // Delete QR code for expired invite
      const cacheKey = qrProxy.getCacheKey(invite.id, invite.icode);
      const deleted = await qrProxy.deleteImage(cacheKey);
      if (deleted) qrDeletedCount++;
    }

    // Clean up orphaned QR codes (no associated invite)
    const settings = getSettings();
    const cacheDir = qrProxy.getCacheDirectory();
    let orphanDeletedCount = 0;

    if (!settings.main.cacheImages) {
      return;
    }

    try {
      const allInvites = await inviteRepository.find({
        select: ['id', 'icode'],
      });
      const files = await fs.readdir(cacheDir);
      for (const file of files) {
        if (file.endsWith('.png')) {
          const cacheKey = file.replace('.png', '');
          const inviteExists = allInvites.some(
            (invite) =>
              qrProxy.getCacheKey(invite.id, invite.icode) === cacheKey
          );
          if (!inviteExists) {
            await qrProxy.deleteImage(cacheKey);
            orphanDeletedCount++;
          }
        }
      }
    } catch (e) {
      logger.error('Failed to clean orphaned QR codes', {
        label: 'Jobs',
        errorMessage: e.message,
      });
    }

    logger.info(
      `Expired invites: ${updatedCount}, QR codes deleted: ${qrDeletedCount}, orphaned QR codes deleted: ${orphanDeletedCount}`,
      { label: 'Jobs' }
    );
  }
}

const expiredInvites = new ExpiredInvites();

export default expiredInvites;
