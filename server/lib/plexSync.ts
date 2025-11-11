import { getRepository } from '@server/datasource';
import { User } from '@server/entity/User';
import { getSettings } from '@server/lib/settings';
import logger from '@server/logger';
import axios from 'axios';

export interface PlexSyncOptions {
  allowSync?: boolean;
  allowCameraUpload?: boolean;
  allowChannels?: boolean;
  plexHome?: boolean;
}

/**
 * PlexSync class handles synchronization of user library access with Plex server
 */
class PlexSync {
  private settings = getSettings();

  /**
   * Get admin user's Plex token from the database
   * @returns Promise resolving to the admin user with Plex token
   */
  private async getAdminPlexToken(): Promise<{ plexToken: string }> {
    const userRepository = getRepository(User);
    const mainUser = await userRepository
      .createQueryBuilder('user')
      .addSelect('user.plexToken')
      .where('user.id = :id', { id: 1 })
      .getOne();

    if (!mainUser || !mainUser.plexToken) {
      throw new Error('Admin Plex token is missing');
    }

    return { plexToken: mainUser.plexToken };
  }

  /**
   * Determine library section IDs based on shared libraries configuration
   * @param sharedLibraries The shared libraries configuration string
   * @returns Array of library section IDs
   */
  private getLibrarySectionIds(sharedLibraries: string): string[] {
    let librarySectionIds: string[] = [];

    if (sharedLibraries === 'all') {
      librarySectionIds =
        this.settings.plex.libraries
          .filter((lib) => lib.enabled)
          .map((lib) => lib.id) || [];
    } else if (
      sharedLibraries === 'server' ||
      sharedLibraries === '' ||
      !sharedLibraries
    ) {
      // Use app settings for default libraries
      const defaultLibs = this.settings.main.sharedLibraries;

      if (defaultLibs === 'all' || !defaultLibs) {
        // Send empty array for "all" libraries (will grant all available sections)
        librarySectionIds = [];
      } else {
        // Send specific libraries from server settings
        const enabledLibraries = this.settings.plex.libraries.filter(
          (lib) => lib.enabled
        );
        const adminConfiguredLibs = defaultLibs
          ? defaultLibs
              .split(/[,|]/)
              .map((id) => id.trim())
              .filter((id) => id !== '')
          : [];

        librarySectionIds = adminConfiguredLibs.filter((libId) =>
          enabledLibraries.some((enabled) => enabled.id === libId)
        );
      }
    } else if (typeof sharedLibraries === 'string') {
      // Specific libraries selected
      const enabledLibraries = this.settings.plex.libraries.filter(
        (lib) => lib.enabled
      );
      const requestedLibs = sharedLibraries
        .split(/[,|]/)
        .map((id) => id.trim())
        .filter((id) => id !== '');

      librarySectionIds = requestedLibs.filter((libId) =>
        enabledLibraries.some((enabled) => enabled.id === libId)
      );
    }

    return librarySectionIds;
  }

  /**
   * Get the current shared libraries for a user from Plex
   * @param user The user to check
   * @returns Promise resolving to array of library IDs that user currently has access to
   */
  public async getCurrentPlexLibraries(user: User): Promise<string[]> {
    try {
      if (!user.email) {
        return [];
      }

      const { plexToken } = await this.getAdminPlexToken();
      const response = await axios.get('http://localhost:5005/libraries', {
        params: {
          token: plexToken,
          server_id: this.settings.plex.machineId,
          email: user.email,
        },
      });

      return response.data.success ? response.data.libraries || [] : [];
    } catch {
      return [];
    }
  }

  public async syncUserLibraries(
    user: User,
    sharedLibraries: string,
    options: PlexSyncOptions = {}
  ): Promise<void> {
    if (!user.email) {
      throw new Error(`User ${user.id} has no email address for Plex sync`);
    }

    const {
      allowSync = false,
      allowCameraUpload = false,
      allowChannels = false,
      plexHome = false,
    } = options;

    const { plexToken } = await this.getAdminPlexToken();
    const librarySectionIds = this.getLibrarySectionIds(sharedLibraries);

    try {
      const response = await axios.post('http://localhost:5005/libraries', {
        token: plexToken,
        server_id: this.settings.plex.machineId,
        email: user.email,
        libraries: librarySectionIds,
        allow_sync: allowSync,
        allow_camera_upload: allowCameraUpload,
        allow_channels: allowChannels,
        plex_home: plexHome,
      });

      if (!response.data.success) {
        throw new Error(
          response.data.error || 'Failed to update Plex libraries'
        );
      }
    } catch (e) {
      logger.error(`Failed to sync Plex libraries for user ${user.email}`, {
        label: 'Plex Sync',
        userId: user.id,
        error: e.message,
      });

      if (e.response) {
        throw new Error(
          `Plex API error: ${e.response.data.error || e.response.statusText}`
        );
      } else if (e.request) {
        throw new Error('Failed to connect to Plex service');
      } else {
        throw new Error(`Plex sync error: ${e.message}`);
      }
    }
  }
}

export const plexSync = new PlexSync();
