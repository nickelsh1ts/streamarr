import { getRepository } from '@server/datasource';
import NewsletterImage from '@server/entity/NewsletterImage';
import logger from '@server/logger';
import { stat } from 'fs/promises';
import {
  collectUsedNewsletterImages,
  newsletterImageLock,
  newsletterImageService,
} from './images';

// Only ever governs uploads that were abandoned: removals made in the editor
// are applied on save and never wait for this. Kept generous because an admin
// can leave a half-written newsletter open for a long time, and those uploads
// are not tied to anything until they save.
const UNDELIVERED_GRACE_MS = 24 * 60 * 60 * 1000;

// Deleting a delivered image breaks every copy of that email already sitting in
// a recipient's inbox, so those are kept far longer.
const DELIVERED_RETENTION_MS = 365 * 24 * 60 * 60 * 1000;

type ReconcileResult = {
  deleted: number;
  orphaned: number;
  restored: number;
};

class NewsletterImageCleanup {
  private static isRunning = false;
  private static isCancelled = false;

  public static status(): { running: boolean } {
    return { running: NewsletterImageCleanup.isRunning };
  }

  public static cancel(): void {
    NewsletterImageCleanup.isCancelled = true;
  }

  public static async run(): Promise<void> {
    if (NewsletterImageCleanup.isRunning) {
      logger.warn(
        'Newsletter image cleanup is already running, skipping duplicate run.',
        { label: 'Newsletters' }
      );
      return;
    }

    NewsletterImageCleanup.isRunning = true;
    NewsletterImageCleanup.isCancelled = false;

    try {
      let result: ReconcileResult | undefined;
      await newsletterImageLock.dispatch('newsletter-images', async () => {
        if (!NewsletterImageCleanup.isCancelled) {
          result = await NewsletterImageCleanup.reconcile();
        }
      });

      if (result) {
        logger.info('Newsletter image cleanup complete', {
          label: 'Newsletters',
          ...result,
        });
      }
    } catch (e) {
      logger.error('Newsletter image cleanup failed', {
        label: 'Newsletters',
        errorMessage: e instanceof Error ? e.message : String(e),
      });
    } finally {
      NewsletterImageCleanup.isRunning = false;
      NewsletterImageCleanup.isCancelled = false;
    }
  }

  /**
   * Scans every newsletter body, then stamps, restores or deletes images based
   * on whether anything still references them. Always global: an image may be
   * referenced by a newsletter other than the one that uploaded it.
   */
  private static async reconcile(): Promise<ReconcileResult> {
    const now = Date.now();
    const imageRepository = getRepository(NewsletterImage);
    const referenced = await collectUsedNewsletterImages();
    const images = await imageRepository.find();
    const known = new Set(images.map((image) => image.filename));
    const missing = [...referenced].filter((name) => !known.has(name));

    if (missing.length) {
      logger.warn('Newsletters reference images that no longer exist', {
        label: 'Newsletters',
        filenames: missing,
      });
    }

    const fileless = images
      .filter(
        (image) =>
          referenced.has(image.filename) &&
          !newsletterImageService.imageExists(image.filename)
      )
      .map((image) => image.filename);

    if (fileless.length) {
      logger.warn('Newsletters reference images with missing files', {
        label: 'Newsletters',
        filenames: fileless,
      });
    }

    const restored: NewsletterImage[] = [];
    const orphaned: NewsletterImage[] = [];
    const expired: NewsletterImage[] = [];

    for (const image of images) {
      const inUse = referenced.has(image.filename);

      if (inUse) {
        if (image.orphanedAt) {
          image.orphanedAt = null;
          restored.push(image);
        }
        continue;
      }

      // Nothing left to protect, so retention does not apply.
      if (!newsletterImageService.imageExists(image.filename)) {
        expired.push(image);
        continue;
      }

      // Nothing has marked this one yet, so it has been unused since it was
      // uploaded — which is already long enough to act on in the same pass.
      const unusedSince = image.orphanedAt ?? image.createdAt;
      const expiresAt = image.lastDeliveredAt
        ? image.lastDeliveredAt.getTime() + DELIVERED_RETENTION_MS
        : unusedSince.getTime() + UNDELIVERED_GRACE_MS;

      if (now > expiresAt) {
        expired.push(image);
        continue;
      }

      if (!image.orphanedAt) {
        image.orphanedAt = new Date();
        orphaned.push(image);
      }
    }

    if (restored.length || orphaned.length) {
      await imageRepository.save([...restored, ...orphaned]);
    }

    let deleted = 0;
    for (const image of expired) {
      if (NewsletterImageCleanup.isCancelled) {
        logger.info('Newsletter image cleanup cancelled', {
          label: 'Newsletters',
        });
        break;
      }

      await newsletterImageService.deleteImage(image.filename);
      await imageRepository.remove(image);
      deleted += 1;
    }

    deleted += await NewsletterImageCleanup.removeUntrackedFiles(
      new Set(images.map((image) => image.filename)),
      referenced,
      now
    );

    return { deleted, orphaned: orphaned.length, restored: restored.length };
  }

  /** Files whose row never landed, e.g. an upload that failed mid-save. */
  private static async removeUntrackedFiles(
    known: Set<string>,
    referenced: Set<string>,
    now: number
  ): Promise<number> {
    const files = await newsletterImageService.listFilenames();
    let deleted = 0;

    for (const filename of files) {
      if (NewsletterImageCleanup.isCancelled) {
        break;
      }

      // Referenced files are spared even without a row, so restoring one from
      // a backup does not get swept away a day later.
      if (known.has(filename) || referenced.has(filename)) {
        continue;
      }

      const filePath = newsletterImageService.getImagePath(filename);
      const stats = await stat(filePath).catch(() => null);

      // The grace period also keeps this from racing an in-flight upload.
      if (!stats?.isFile() || now - stats.mtimeMs <= UNDELIVERED_GRACE_MS) {
        continue;
      }

      await newsletterImageService.deleteImage(filename);
      deleted += 1;

      logger.debug('Removed untracked newsletter image', {
        label: 'Newsletters',
        filename,
      });
    }

    return deleted;
  }
}

export default NewsletterImageCleanup;
