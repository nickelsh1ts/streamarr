import type { PlexLibraryItem } from '@server/api/plexapi';
import PlexAPI from '@server/api/plexapi';
import { getRepository } from '@server/datasource';
import { User } from '@server/entity/User';
import type {
  RunnableScanner,
  StatusBase,
} from '@server/lib/scanners/baseScanner';
import BaseScanner from '@server/lib/scanners/baseScanner';
import type { Library } from '@server/lib/settings';
import { getSettings } from '@server/lib/settings';

type SyncStatus = StatusBase & {
  currentLibrary: Library;
  libraries: Library[];
};

class PlexScanner
  extends BaseScanner<PlexLibraryItem>
  implements RunnableScanner<SyncStatus>
{
  private plexClient: PlexAPI;
  private libraries: Library[];
  private currentLibrary: Library;
  private isRecentOnly = false;

  public constructor(isRecentOnly = false) {
    super('Plex Scan', { bundleSize: 50 });
    this.isRecentOnly = isRecentOnly;
  }

  public status(): SyncStatus {
    return {
      running: this.running,
      progress: this.progress,
      total: this.totalSize ?? 0,
      currentLibrary: this.currentLibrary,
      libraries: this.libraries,
    };
  }

  public async run(): Promise<void> {
    const settings = getSettings();
    const sessionId = this.startRun();
    try {
      const userRepository = getRepository(User);
      const admin = await userRepository.findOne({
        select: { id: true, plexToken: true },
        where: { id: 1 },
      });

      if (!admin) {
        return this.log('No admin configured. Plex scan skipped.', 'warn');
      }

      this.plexClient = new PlexAPI({ plexToken: admin.plexToken });

      this.libraries = settings.plex.libraries.filter(
        (library) => library.enabled
      );
    } catch (e) {
      this.log('Scan interrupted', 'error', { errorMessage: e.message });
    } finally {
      this.endRun(sessionId);
    }
  }

  private async paginateLibrary(
    library: Library,
    { start = 0, sessionId }: { start?: number; sessionId: string }
  ) {
    if (!this.running) {
      throw new Error('Sync was aborted.');
    }

    if (this.sessionId !== sessionId) {
      throw new Error('New session was started. Old session aborted.');
    }

    const response = await this.plexClient.getLibraryContents(library.id, {
      size: this.protectedBundleSize,
      offset: start,
    });

    this.progress = start;
    this.totalSize = response.totalSize;

    await new Promise<void>((resolve, reject) =>
      setTimeout(() => {
        this.paginateLibrary(library, {
          start: start + this.protectedBundleSize,
          sessionId,
        })
          .then(() => resolve())
          .catch((e) => reject(new Error(e.message)));
      }, this.protectedUpdateRate)
    );
  }
}

export const plexFullScanner = new PlexScanner();
