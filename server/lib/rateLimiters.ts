import { rateLimit, type Options } from 'express-rate-limit';

const createRateLimiter = (options: Partial<Options>) =>
  rateLimit({
    standardHeaders: true,
    legacyHeaders: false,
    validate: { xForwardedForHeader: false },
    ...options,
  });

export const arrAuthLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // limit each IP to 5 requests per windowMs
});

export const plexPinLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
});

export const plexAuthLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
});

export const plexPinStatusLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  // The client polls this endpoint roughly every 2s during an active
  // sign-in (~30/min). 120/min/IP leaves ample headroom for legitimate
  // polling while bounding abuse of this outbound-request-triggering route.
  max: 120,
});

export const resetPasswordLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per window
});

export const audiobookshelfLinkLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
});

export const avatarLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 120, // 2 req/sec per IP — covers page loads, blocks bulk enumeration
});

export const settingsAboutLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // limit expensive settings/about introspection per IP
});

export const settingsAboutDiskSpaceLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // limit expensive disk space introspection per IP
});

export const settingsCacheLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
});

export const newsletterPreviewLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
});

export const newsletterTestLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
});

export const newsletterImageUploadLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // pasting several images into one body is normal; bulk uploads are not
});

export const trialExtensionRequestLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
});
