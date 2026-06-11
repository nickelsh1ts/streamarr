import { Permission } from '@server/lib/permissions';
import PlexTvAPI from '@server/api/plextv';
import SeerrAPI from '@server/api/seerr';
import { getRepository } from '@server/datasource';
import { User } from '@server/entity/User';
import { getSettings } from '@server/lib/settings';
import logger from '@server/logger';

class TrialExpiry {
  private isRunning = false;

  public cancel(): void {
    this.isRunning = false;
  }

  private async deprovisionExternalAccess(
    user: User,
    adminToken: string,
    machineId: string
  ): Promise<Record<'Plex' | 'Seerr', string[]>> {
    const settings = getSettings();
    const failures: Record<'Plex' | 'Seerr', string[]> = {
      Plex: [],
      Seerr: [],
    };

    if (!user.plexId) {
      return failures;
    }

    try {
      if (!this.isRunning) {
        logger.info('Trial expiry job cancelled.', {
          label: 'Jobs',
        });
        return failures;
      }
      const plexTvApi = new PlexTvAPI(adminToken);
      await plexTvApi.deprovisionUser(user.plexId, machineId);
    } catch (e) {
      failures.Plex.push(e instanceof Error ? e.message : String(e));
    }

    const seerrSettings = settings.overseerr;
    if (seerrSettings.enabled && seerrSettings.hostname) {
      try {
        if (!this.isRunning) {
          logger.info('Trial expiry job cancelled.', {
            label: 'Jobs',
          });
          return failures;
        }
        const seerrApi = new SeerrAPI(seerrSettings);
        await seerrApi.revokeAllPermissionsByPlexId(user.plexId);
      } catch (e) {
        failures.Seerr.push(e instanceof Error ? e.message : String(e));
      }
    }

    return failures;
  }

  public status(): { running: boolean } {
    return { running: this.isRunning };
  }

  public async run() {
    if (this.isRunning) {
      logger.warn(
        'Trial expiry job is already running, skipping duplicate run.',
        {
          label: 'Jobs',
        }
      );
      return;
    }

    this.isRunning = true;

    try {
      const settings = getSettings();

      if (!settings.main.enableTrialPeriod) {
        return;
      }

      const userRepository = getRepository(User);
      const now = new Date();

      const admin = await userRepository
        .createQueryBuilder('user')
        .addSelect('user.plexToken')
        .where('user.id = :id', { id: 1 })
        .getOne();

      const adminToken = admin?.plexToken;
      const machineId = settings.plex.machineId;

      if (!adminToken || !machineId) {
        logger.warn(
          'Missing admin Plex token or machineId — Plex deprovisioning will be skipped.',
          { label: 'Jobs' }
        );
      }

      const users = await userRepository
        .createQueryBuilder('user')
        .leftJoinAndSelect('user.settings', 'settings')
        .where('settings.trialPeriodEndsAt IS NOT NULL')
        .andWhere('settings.trialPeriodEndsAt <= :now', {
          now,
        })
        .andWhere('user.active = :isActive', { isActive: true })
        .getMany();

      let promotedCount = 0;
      let deactivatedCount = 0;
      const externalFailuresByService: Record<'Plex' | 'Seerr', string[]> = {
        Plex: [],
        Seerr: [],
      };

      for (const user of users) {
        // Safety check: privileged users should never be deactivated by trial logic.
        if (
          user.id === 1 ||
          user.hasPermission(
            [Permission.MANAGE_USERS, Permission.MANAGE_INVITES],
            {
              type: 'or',
            }
          )
        ) {
          continue;
        }

        if (!this.isRunning) {
          logger.info('Trial expiry job cancelled.', {
            label: 'Jobs',
          });
          return;
        }

        const outcome =
          user.settings?.trialPeriodOutcome ?? settings.main.trialPeriodOutcome;

        if (outcome === 'deactivate') {
          const trialEndDateAtExpiry = user.settings?.trialPeriodEndsAt ?? now;
          const failures =
            adminToken && machineId
              ? await this.deprovisionExternalAccess(
                  user,
                  adminToken,
                  machineId
                )
              : { Plex: ['missing admin token or machine id'], Seerr: [] };
          for (const service of ['Plex', 'Seerr'] as const) {
            if (failures[service].length > 0) {
              externalFailuresByService[service].push(
                `User ${user.id} (${user.email ?? 'unknown'}): ${failures[service].join(', ')}`
              );
            }
          }

          user.active = false;
          user.accessRevokedAt = trialEndDateAtExpiry;
          user.accessRevokedReason = 'trial_expired';
          if (user.settings) {
            user.settings.trialPeriodEndsAt = null;
            user.settings.trialExtensionRequested = false;
            user.settings.trialExtensionRequestedAt = null;
          }
          await userRepository.save(user);
          deactivatedCount += 1;
          continue;
        }

        if (user.settings) {
          user.settings.trialPeriodEndsAt = null;
          user.settings.trialExtensionRequested = false;
          user.settings.trialExtensionRequestedAt = null;
        }
        await userRepository.save(user);
        promotedCount += 1;
      }

      logger.info(
        `Access expiry job completed. Deactivated: ${deactivatedCount}, promoted: ${promotedCount}.`,
        { label: 'Jobs' }
      );

      for (const service of ['Plex', 'Seerr'] as const) {
        const serviceFailures = externalFailuresByService[service];

        if (serviceFailures.length === 0) {
          continue;
        }

        logger.error('Access expiry external deprovision failures detected.', {
          label: 'Jobs',
          service,
          failures: serviceFailures,
        });
      }
    } catch (e) {
      logger.error('Access expiry check job failed.', {
        label: 'Jobs',
        errorMessage: e instanceof Error ? e.message : String(e),
      });
    } finally {
      this.isRunning = false;
    }
  }
}

const trialExpiry = new TrialExpiry();

export default trialExpiry;
