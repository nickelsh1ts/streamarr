import { rateLimit } from 'express-rate-limit';

export const arrAuthLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // limit each IP to 5 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});

export const resetPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per window
  standardHeaders: true,
  legacyHeaders: false,
});

export const avatarLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 120, // 2 req/sec per IP — covers page loads, blocks bulk enumeration
  standardHeaders: true,
  legacyHeaders: false,
});

export const settingsAboutLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // limit expensive settings/about introspection per IP
  standardHeaders: true,
  legacyHeaders: false,
});

export const trialExtensionRequestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
});
