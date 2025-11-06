import { getRepository } from '@server/datasource';
import Invite from '@server/entity/Invite';
import { InviteStatus } from '@server/constants/invite';
import { Not, In } from 'typeorm';
import logger from '@server/logger';
import QRCodeProxy from '@server/lib/qrcodeproxy';
import fs from 'fs/promises';

class ExpiredInvites {
  public async run() {
    const inviteRepository = getRepository(Invite);
    const invites = await inviteRepository.find({
      where: { status: Not(In([InviteStatus.EXPIRED, InviteStatus.REDEEMED])) },
    });
    let updatedCount = 0;
    let qrDeletedCount = 0;
    const qrProxy = new QRCodeProxy();
    for (const invite of invites) {
      if (invite.expiryLimit !== 0) {
        let msPerUnit = 86400000;
        if (invite.expiryTime === 'weeks') msPerUnit = 604800000;
        if (invite.expiryTime === 'months') msPerUnit = 2629800000;
        const expiryDate = new Date(
          invite.createdAt.getTime() + invite.expiryLimit * msPerUnit
        );
        if (
          Date.now() > expiryDate.getTime() &&
          invite.status !== InviteStatus.EXPIRED &&
          invite.status !== InviteStatus.REDEEMED
        ) {
          invite.status = InviteStatus.EXPIRED;
          await inviteRepository.save(invite);
          updatedCount++;
          logger.info(`Invite ${invite.id} marked as expired.`, {
            label: 'Jobs',
          });
          // Delete QR code image for expired invite
          const cacheKey = qrProxy.getCacheKey(invite.id, invite.icode);
          const deleted = await qrProxy.deleteImage(cacheKey);
          if (deleted) qrDeletedCount++;
        }
      }
    }
    // Clean up orphaned QR codes (no associated invite)
    const cacheDir = qrProxy.getCacheDirectory();
    let orphanDeletedCount = 0;
    try {
      const files = await fs.readdir(cacheDir);
      for (const file of files) {
        if (file.endsWith('.png')) {
          const cacheKey = file.replace('.png', '');
          const inviteExists = invites.some(
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
      `Expired invites fixed: ${updatedCount}, QR codes deleted: ${qrDeletedCount}, orphaned QR codes deleted: ${orphanDeletedCount}`,
      { label: 'Jobs' }
    );
  }
}

const expiredInvites = new ExpiredInvites();

export default expiredInvites;
