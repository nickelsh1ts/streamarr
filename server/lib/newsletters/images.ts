import { getRepository } from '@server/datasource';
import Newsletter from '@server/entity/Newsletter';
import NewsletterImage from '@server/entity/NewsletterImage';
import type { NewsletterImageResponse } from '@server/interfaces/api/newsletterInterfaces';
import ImageUploadService from '@server/lib/imageUpload';
import logger from '@server/logger';
import AsyncLock from '@server/utils/asyncLock';
import { stat } from 'fs/promises';
import { In } from 'typeorm';

const NEWSLETTER_IMAGE_URL_PREFIX = '/imageproxy/newsletter';

export const newsletterImageLock = new AsyncLock();
const inFlightNewsletterImages = new Map<number, Set<string>>();

export const ALLOWED_NEWSLETTER_IMAGE_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/gif',
  'image/webp',
];

export const MAX_NEWSLETTER_IMAGE_BYTES = 10 * 1024 * 1024;

// Matches the `<md5>-<timestamp>.<ext>` names produced by ImageUploadService.
const NEWSLETTER_IMAGE_REFERENCE_SOURCE = `${NEWSLETTER_IMAGE_URL_PREFIX}/([a-f0-9]{32}-\\d+\\.(?:png|jpe?g|gif|webp))`;

const NEWSLETTER_IMAGE_REFERENCE_REGEX = new RegExp(
  NEWSLETTER_IMAGE_REFERENCE_SOURCE,
  'g'
);

// Non-global, for testing a single tag without carrying `lastIndex` between calls.
const NEWSLETTER_IMAGE_REFERENCE_PATTERN = new RegExp(
  NEWSLETTER_IMAGE_REFERENCE_SOURCE
);

export const newsletterImageService = new ImageUploadService({
  directory: 'newsletter',
  urlPrefix: NEWSLETTER_IMAGE_URL_PREFIX,
  label: 'Newsletters',
  maxWidth: 1600,
  maxHeight: 1600,
});

// Recipients fetch through mailbox-provider proxies (Gmail, Apple MPP) that
// share IPs, so only misses are limited; delivered images must never 429.
export const createNewsletterImageRouter = () =>
  newsletterImageService.createRouter({
    requireAuth: false,
    limitMissesOnly: true,
  });

// Filenames are content-hashed, so the service's own `?v=` cache buster would
// only add noise to the URL embedded in delivered email.
const getNewsletterImageUrl = (filename: string): string =>
  `${NEWSLETTER_IMAGE_URL_PREFIX}/${filename}`;

const IMG_TAG_REGEX = /<img\b[^>]*>/gi;
const STYLE_ATTR_REGEX = /style\s*=\s*("([^"]*)"|'([^']*)')/i;

// Appended last so it wins over anything the author set, matching how the email
// template already sizes its logo.
const FIT_STYLE = 'max-width:100%;height:auto;';

/**
 * Keeps body images inside the email's fixed-width content column. Without this
 * a full-size screenshot renders at its natural width and overflows the layout.
 */
export const constrainNewsletterImages = (html: string): string =>
  html.replace(IMG_TAG_REGEX, (tag) => {
    const style = tag.match(STYLE_ATTR_REGEX);

    if (!style) {
      return tag.replace(/<img\b/i, () => `<img style="${FIT_STYLE}"`);
    }

    const existing = (style[2] ?? style[3] ?? '').trim();
    const separator = existing && !existing.endsWith(';') ? ';' : '';

    return tag.replace(
      STYLE_ATTR_REGEX,
      () => `style="${existing}${separator}${FIT_STYLE}"`
    );
  });

/**
 * Drops `<img>` tags whose file is gone, so an image deleted outside the app
 * does not go out as a broken image in a send nobody can recall.
 */
export const stripMissingNewsletterImages = (html: string): string =>
  html.replace(IMG_TAG_REGEX, (tag) => {
    const match = tag.match(NEWSLETTER_IMAGE_REFERENCE_PATTERN);

    if (!match) {
      return tag;
    }

    if (newsletterImageService.imageExists(match[1])) {
      return tag;
    }

    logger.warn('Dropped a newsletter image whose file is missing', {
      label: 'Newsletters',
      filename: match[1],
    });

    return '';
  });

/**
 * Rewrites body image URLs to absolute for delivery. Bodies store relative
 * paths so they survive an `applicationUrl` change; email clients cannot
 * resolve those, and the preview passes an empty base to stay relative.
 * Covers `href` too, since an image can be linked as well as embedded.
 */
export const absolutizeNewsletterImageUrls = (
  html: string,
  resourceBase: string
): string => {
  const base = resourceBase.replace(/\/+$/, '');

  if (!base) {
    return html;
  }

  return html.replace(
    new RegExp(`((?:src|href)=["'])${NEWSLETTER_IMAGE_URL_PREFIX}/`, 'g'),
    `$1${base}${NEWSLETTER_IMAGE_URL_PREFIX}/`
  );
};

/**
 * Every newsletter image filename appearing anywhere in a body — `<img>`,
 * `<a href>`, markdown, or a bare URL — since any of them keeps a file in use.
 */
export const extractNewsletterImageFilenames = (
  body: string | null | undefined
): Set<string> => {
  const filenames = new Set<string>();

  if (!body) {
    return filenames;
  }

  for (const [, filename] of body.matchAll(NEWSLETTER_IMAGE_REFERENCE_REGEX)) {
    filenames.add(filename);
  }

  return filenames;
};

export const describeNewsletterImage = async (
  image: NewsletterImage
): Promise<NewsletterImageResponse> => {
  const stats = await stat(
    newsletterImageService.getImagePath(image.filename)
  ).catch(() => null);

  return {
    filename: image.filename,
    url: getNewsletterImageUrl(image.filename),
    size: stats?.size ?? 0,
    missing: !stats,
    delivered: !!image.lastDeliveredAt,
    createdAt: image.createdAt,
  };
};

/**
 * Images a newsletter uses: everything its body references plus anything
 * uploaded but not yet inserted.
 */
export const getNewsletterImageFilenames = (
  newsletter: Pick<Newsletter, 'body' | 'imageFilenames'>
): Set<string> => {
  const filenames = extractNewsletterImageFilenames(newsletter.body);

  for (const filename of newsletter.imageFilenames ?? []) {
    filenames.add(filename);
  }

  return filenames;
};

export const protectNewsletterImages = (
  newsletter: Pick<Newsletter, 'id' | 'body' | 'imageFilenames'>
): void => {
  inFlightNewsletterImages.set(
    newsletter.id,
    getNewsletterImageFilenames(newsletter)
  );
};

export const releaseNewsletterImages = (newsletterId: number): void => {
  inFlightNewsletterImages.delete(newsletterId);
};

/** Every filename any newsletter still uses, via its body or its attachments. */
export const collectUsedNewsletterImages = async (): Promise<Set<string>> => {
  const newsletters = await getRepository(Newsletter).find({
    select: { id: true, body: true, imageFilenames: true },
  });

  const used = new Set<string>();

  for (const newsletter of newsletters) {
    for (const filename of getNewsletterImageFilenames(newsletter)) {
      used.add(filename);
    }
  }

  for (const filenames of inFlightNewsletterImages.values()) {
    for (const filename of filenames) {
      used.add(filename);
    }
  }

  return used;
};

/**
 * Reclaims images a newsletter has stopped using. Deliberately scoped to the
 * given candidates rather than every image: an upload that has not been saved
 * into any newsletter yet must survive someone else's save.
 */
export const reclaimNewsletterImages = async (
  candidates: Iterable<string>
): Promise<void> => {
  const filenames = [...new Set(candidates)];

  if (!filenames.length) {
    return;
  }

  const used = await collectUsedNewsletterImages();
  const imageRepository = getRepository(NewsletterImage);
  const images = await imageRepository.find({
    where: { filename: In(filenames) },
  });

  const updated: NewsletterImage[] = [];
  const discarded: NewsletterImage[] = [];

  for (const image of images) {
    if (used.has(image.filename)) {
      if (image.orphanedAt) {
        image.orphanedAt = null;
        updated.push(image);
      }
      continue;
    }

    if (
      image.lastDeliveredAt &&
      newsletterImageService.imageExists(image.filename)
    ) {
      // Deleting the file would break every copy of the email already
      // delivered, so let retention expire it instead.
      if (!image.orphanedAt) {
        image.orphanedAt = new Date();
        updated.push(image);
      }
      continue;
    }

    // Retention exists to protect the file, so there is nothing to hold on to
    // once it is gone.
    discarded.push(image);
  }

  if (updated.length) {
    await imageRepository.save(updated);
  }

  for (const image of discarded) {
    await newsletterImageService.deleteImage(image.filename);
  }

  if (discarded.length) {
    await imageRepository.remove(discarded);
  }
};

/**
 * Marks every image embedded in a delivered newsletter, so cleanup keeps the
 * files alive while that email is still in recipients' inboxes. Test sends must
 * not call this, or previewing a draft would grant it full retention.
 */
export const markNewsletterImagesDelivered = async (
  newsletter: Newsletter
): Promise<void> => {
  const filenames = [...extractNewsletterImageFilenames(newsletter.body)];

  if (!filenames.length) {
    return;
  }

  await getRepository(NewsletterImage).update(
    { filename: In(filenames) },
    { lastDeliveredAt: new Date() }
  );
};
