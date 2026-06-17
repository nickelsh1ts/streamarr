import { getRepository } from '@server/datasource';
import Newsletter from '@server/entity/Newsletter';
import NewsletterHistory from '@server/entity/NewsletterHistory';
import { User } from '@server/entity/User';
import { getIntl } from '@server/i18n';
import type {
  NewsletterBody,
  NewsletterHistoryResultsResponse,
  NewsletterResultsResponse,
  NewsletterSendResult,
  NewsletterVariablesResponse,
} from '@server/interfaces/api/newsletterInterfaces';
import PreparedEmail from '@server/lib/email';
import type { NewsletterBlockData } from '@server/lib/newsletters/dataProviders';
import { resolveBlockData } from '@server/lib/newsletters/dataProviders';
import {
  getNewsletterEmailStrings,
  renderForRecipient,
  renderNewsletter,
} from '@server/lib/newsletters/render';
import newsletterScheduler from '@server/lib/newsletters/scheduler';
import {
  isNewsletterSending,
  sendNewsletter,
} from '@server/lib/newsletters/send';
import {
  newsletterPreviewLimiter,
  newsletterTestLimiter,
} from '@server/lib/rateLimiters';
import { getSettings } from '@server/lib/settings';
import logger from '@server/logger';
import { Router } from 'express';
import path from 'path';

const newsletterRoutes = Router();

// Maximum page size for paginated list/history endpoints.
const MAX_PAGE_SIZE = 100;
const DEFAULT_PAGE_SIZE = 10;

// Parse and clamp pagination query params so a caller cannot request an
// unbounded page (or pass NaN/negative values).
const parsePagination = (query: {
  take?: unknown;
  skip?: unknown;
}): { take: number; skip: number } => {
  const rawTake = Number(query.take);
  const rawSkip = Number(query.skip);

  const take =
    Number.isFinite(rawTake) && rawTake > 0
      ? Math.min(Math.floor(rawTake), MAX_PAGE_SIZE)
      : DEFAULT_PAGE_SIZE;
  const skip =
    Number.isFinite(rawSkip) && rawSkip > 0 ? Math.floor(rawSkip) : 0;

  return { take, skip };
};

// Short-lived cache of resolved block data for previews, keyed by the block
// configuration. Avoids re-hitting Plex/Tautulli/Radarr/Sonarr when an admin
// previews repeatedly while editing copy (the blocks are unchanged).
const PREVIEW_CACHE_TTL = 30 * 1000;
const previewBlockDataCache = new Map<
  string,
  { data: NewsletterBlockData; expires: number }
>();

const resolvePreviewBlockData = async (
  newsletter: Newsletter
): Promise<NewsletterBlockData> => {
  const key = JSON.stringify(newsletter.blocks ?? {});
  const now = Date.now();
  const cached = previewBlockDataCache.get(key);

  if (cached && cached.expires > now) {
    return cached.data;
  }

  const data = await resolveBlockData(newsletter.blocks);
  previewBlockDataCache.set(key, { data, expires: now + PREVIEW_CACHE_TTL });

  // Opportunistically drop expired entries so the map cannot grow unbounded.
  for (const [cacheKey, value] of previewBlockDataCache) {
    if (value.expires <= now) {
      previewBlockDataCache.delete(cacheKey);
    }
  }

  return data;
};

const renderPreview = async (
  newsletter: Newsletter,
  user?: User
): Promise<string> => {
  const settings = getSettings();
  const { applicationTitle, customLogo } = settings.main;
  const intl = getIntl(user?.settings?.locale ?? settings.main.locale);

  const blockData = await resolvePreviewBlockData(newsletter);
  const rendered = await renderNewsletter(newsletter, {
    baseUrl: '',
    intl,
    blockData,
  });
  const personalized = renderForRecipient(rendered, {
    displayName: user?.displayName,
    email: user?.email ?? '',
  });

  const email = new PreparedEmail(settings.notifications.agents.email);

  return email.render(
    path.join(__dirname, '../../templates/email/newsletter/html'),
    {
      subject: personalized.subject,
      body: personalized.html,
      applicationTitle,
      baseUrl: '',
      showChrome: true,
      recipientName: user?.displayName,
      recipientEmail: user?.email,
      isImportant: newsletter.isImportant,
      logoUrl: customLogo || '/logo_full.png',
      ...getNewsletterEmailStrings(intl, applicationTitle),
    }
  );
};

const NEWSLETTER_VARIABLES: NewsletterVariablesResponse = {
  tokens: [
    {
      token: '{{applicationTitle}}',
      description: 'The configured application title',
    },
    {
      token: '{{applicationUrl}}',
      description: 'The configured application URL',
    },
    { token: '{{recipientName}}', description: "The recipient's display name" },
    {
      token: '{{recipientEmail}}',
      description: "The recipient's email address",
    },
    { token: '{{date}}', description: 'The date the newsletter is sent' },
  ],
  blocks: [
    {
      token: '{{recentlyAdded}}',
      description: 'Recently added Plex media, grouped by library type',
    },
    {
      token: '{{topStreams}}',
      description: 'Most streamed media from Tautulli',
    },
    {
      token: '{{byTag}}',
      description: 'Media labeled or tagged by a specific tag',
    },
  ],
};

const validateNewsletterBody = (body: NewsletterBody): string | null => {
  if (!body.name?.trim()) {
    return 'Name is required.';
  }

  if (!body.subject?.trim()) {
    return 'Subject is required.';
  }

  if (body.bodyFormat && !['markdown', 'html'].includes(body.bodyFormat)) {
    return 'Invalid body format.';
  }

  if (body.recipientMode && !['all', 'custom'].includes(body.recipientMode)) {
    return 'Invalid recipient mode.';
  }

  if (body.recipientMode === 'custom' && !body.recipientIds?.length) {
    return 'At least one recipient is required when using a custom recipient list.';
  }

  if (body.scheduleType && !['once', 'recurring'].includes(body.scheduleType)) {
    return 'Invalid schedule type.';
  }

  if (
    body.cronSchedule &&
    !newsletterScheduler.validateCron(body.cronSchedule)
  ) {
    return 'Invalid cron schedule.';
  }

  if (
    body.cronSchedule &&
    newsletterScheduler.isCronTooFrequent(body.cronSchedule)
  ) {
    return 'The schedule is too frequent; newsletters can run at most once per hour.';
  }

  if (body.enabled) {
    if (body.scheduleType === 'once') {
      if (!body.sendAt) {
        return 'A send date is required for one-time newsletters.';
      }

      if (new Date(body.sendAt).getTime() <= Date.now()) {
        return 'The send date must be in the future.';
      }
    } else if (!body.cronSchedule) {
      return 'A cron schedule is required for recurring newsletters.';
    }
  }

  return null;
};

const assignNewsletterBody = (
  newsletter: Newsletter,
  body: NewsletterBody
): void => {
  newsletter.name = body.name.trim();
  newsletter.subject = body.subject.trim();
  newsletter.description = body.description?.trim() || null;
  newsletter.body = body.body ?? '';
  newsletter.bodyFormat = body.bodyFormat ?? 'markdown';
  newsletter.blocks = body.blocks ?? {};
  newsletter.recipientMode = body.recipientMode ?? 'all';
  newsletter.recipientIds = body.recipientIds ?? [];
  newsletter.isImportant = body.isImportant ?? false;
  newsletter.enabled = body.enabled ?? false;
  newsletter.scheduleType = body.scheduleType ?? 'recurring';
  newsletter.cronSchedule = body.cronSchedule ?? null;
  newsletter.sendAt = body.sendAt ? new Date(body.sendAt) : null;
};

newsletterRoutes.get<Record<string, string>, NewsletterResultsResponse>(
  '/',
  async (req, res, next) => {
    try {
      const { take, skip } = parsePagination(req.query);

      const SORT_COLUMNS = {
        created: 'newsletter.createdAt',
        modified: 'newsletter.updatedAt',
        name: 'newsletter.name',
      } as const;
      const sortKey: keyof typeof SORT_COLUMNS =
        req.query.sort === 'created' || req.query.sort === 'name'
          ? req.query.sort
          : 'modified';
      const sortColumn = SORT_COLUMNS[sortKey];
      const sortDirection: 'ASC' | 'DESC' = sortKey === 'name' ? 'ASC' : 'DESC';

      const query = getRepository(Newsletter)
        .createQueryBuilder('newsletter')
        .leftJoinAndSelect('newsletter.createdBy', 'createdBy')
        .leftJoinAndSelect('newsletter.updatedBy', 'updatedBy');

      switch (req.query.filter) {
        case 'enabled':
          query.where('newsletter.enabled = :enabled', { enabled: true });
          break;
        case 'disabled':
          query.where('newsletter.enabled = :enabled', { enabled: false });
          break;
        case 'important':
          query.where('newsletter.isImportant = :important', {
            important: true,
          });
          break;
        case 'all':
        default:
          break;
      }

      const [newsletters, newsletterCount] = await query
        .orderBy(sortColumn, sortDirection)
        .take(take)
        .skip(skip)
        .getManyAndCount();

      res.status(200).json({
        pageInfo: {
          pages: Math.ceil(newsletterCount / take),
          pageSize: take,
          results: newsletterCount,
          page: Math.ceil(skip / take) + 1,
        },
        results: newsletters,
      });
    } catch (e) {
      logger.error('Failed to retrieve newsletters', {
        label: 'Newsletters',
        errorMessage: e instanceof Error ? e.message : String(e),
      });
      next({ status: 500, message: 'Unable to load newsletters.' });
    }
  }
);

newsletterRoutes.get<Record<string, string>, NewsletterVariablesResponse>(
  '/variables',
  (_req, res) => {
    res.status(200).json(NEWSLETTER_VARIABLES);
  }
);

// Renders a preview from an unsaved newsletter body so the editor can preview
// drafts before they are created or saved.
newsletterRoutes.post<Record<string, string>, string, NewsletterBody>(
  '/preview',
  newsletterPreviewLimiter,
  async (req, res, next) => {
    try {
      const newsletter = new Newsletter();
      assignNewsletterBody(
        newsletter,
        // Name/subject are not required to preview; fall back to placeholders.
        {
          ...req.body,
          name: req.body.name?.trim() || 'Preview',
          subject: req.body.subject?.trim() || 'Preview',
        }
      );

      const html = await renderPreview(newsletter, req.user);
      res.status(200).setHeader('Content-Type', 'text/html').send(html);
    } catch (e) {
      logger.error('Failed to render newsletter preview', {
        label: 'Newsletters',
        errorMessage: e instanceof Error ? e.message : String(e),
      });
      next({ status: 500, message: 'Unable to generate preview.' });
    }
  }
);

newsletterRoutes.post<Record<string, string>, Newsletter, NewsletterBody>(
  '/',
  async (req, res, next) => {
    const validationError = validateNewsletterBody(req.body);

    if (validationError) {
      return next({ status: 400, message: validationError });
    }

    try {
      const newsletter = new Newsletter({
        createdBy: req.user,
        updatedBy: req.user,
      });
      assignNewsletterBody(newsletter, req.body);

      const created = await getRepository(Newsletter).save(newsletter);
      newsletterScheduler.schedule(created);

      res.status(201).json(created);
    } catch (e) {
      logger.error('Failed to create newsletter', {
        label: 'Newsletters',
        errorMessage: e.message,
      });
      next({ status: 500, message: 'Failed to create newsletter.' });
    }
  }
);

newsletterRoutes.get<{ id: string }, Newsletter>(
  '/:id',
  async (req, res, next) => {
    try {
      const newsletter = await getRepository(Newsletter).findOneOrFail({
        where: { id: Number(req.params.id) },
      });

      res.status(200).json(newsletter);
    } catch {
      next({ status: 404, message: 'Newsletter not found.' });
    }
  }
);

newsletterRoutes.put<{ id: string }, Newsletter, NewsletterBody>(
  '/:id',
  async (req, res, next) => {
    const validationError = validateNewsletterBody(req.body);

    if (validationError) {
      return next({ status: 400, message: validationError });
    }

    try {
      const newsletterRepository = getRepository(Newsletter);
      const newsletter = await newsletterRepository.findOneOrFail({
        where: { id: Number(req.params.id) },
      });

      assignNewsletterBody(newsletter, req.body);
      newsletter.updatedBy = req.user as User;

      const updated = await newsletterRepository.save(newsletter);
      newsletterScheduler.schedule(updated);

      res.status(200).json(updated);
    } catch (e) {
      logger.error('Failed to update newsletter', {
        label: 'Newsletters',
        newsletterId: req.params.id,
        errorMessage: e.message,
      });
      next({ status: 404, message: 'Newsletter not found.' });
    }
  }
);

newsletterRoutes.delete<{ id: string }>('/:id', async (req, res, next) => {
  try {
    const newsletterRepository = getRepository(Newsletter);
    const newsletter = await newsletterRepository.findOneOrFail({
      where: { id: Number(req.params.id) },
    });

    newsletterScheduler.cancel(newsletter.id);
    await newsletterRepository.remove(newsletter);

    res.status(204).send();
  } catch {
    next({ status: 404, message: 'Newsletter not found.' });
  }
});

newsletterRoutes.post<{ id: string }, NewsletterSendResult>(
  '/:id/send',
  async (req, res, next) => {
    try {
      const newsletter = await getRepository(Newsletter).findOneOrFail({
        where: { id: Number(req.params.id) },
      });

      if (isNewsletterSending(newsletter.id)) {
        return next({
          status: 409,
          message: 'This newsletter is already being sent.',
        });
      }

      const result = await sendNewsletter(newsletter, 'manual');

      res.status(200).json({
        newsletterId: newsletter.id,
        ...result,
      });
    } catch (e) {
      logger.error('Failed to send newsletter', {
        label: 'Newsletters',
        newsletterId: req.params.id,
        errorMessage: e instanceof Error ? e.message : String(e),
      });
      next({
        status: 500,
        message: e instanceof Error ? e.message : 'Unable to send newsletter.',
      });
    }
  }
);

newsletterRoutes.post<{ id: string }, NewsletterSendResult>(
  '/:id/test',
  newsletterTestLimiter,
  async (req, res, next) => {
    try {
      const newsletter = await getRepository(Newsletter).findOneOrFail({
        where: { id: Number(req.params.id) },
      });

      const testUser = await getRepository(User).findOneOrFail({
        where: { id: req.user?.id },
        relations: ['settings'],
      });

      const result = await sendNewsletter(newsletter, 'test', { testUser });

      res.status(200).json({
        newsletterId: newsletter.id,
        ...result,
      });
    } catch (e) {
      logger.error('Failed to send test newsletter', {
        label: 'Newsletters',
        newsletterId: req.params.id,
        errorMessage: e instanceof Error ? e.message : String(e),
      });
      next({
        status: 500,
        message:
          e instanceof Error ? e.message : 'Unable to send test newsletter.',
      });
    }
  }
);

newsletterRoutes.get<{ id: string }>(
  '/:id/preview',
  newsletterPreviewLimiter,
  async (req, res, next) => {
    try {
      const newsletter = await getRepository(Newsletter).findOneOrFail({
        where: { id: Number(req.params.id) },
      });

      const html = await renderPreview(newsletter, req.user);
      res.status(200).setHeader('Content-Type', 'text/html').send(html);
    } catch (e) {
      logger.error('Failed to render newsletter preview', {
        label: 'Newsletters',
        newsletterId: req.params.id,
        errorMessage: e instanceof Error ? e.message : String(e),
      });
      next({ status: 500, message: 'Unable to generate preview.' });
    }
  }
);

newsletterRoutes.get<{ id: string }, NewsletterHistoryResultsResponse>(
  '/:id/history',
  async (req, res, next) => {
    try {
      const { take, skip } = parsePagination(req.query);

      const [history, historyCount] = await getRepository(NewsletterHistory)
        .createQueryBuilder('history')
        .where('history.newsletterId = :id', { id: Number(req.params.id) })
        .orderBy('history.createdAt', 'DESC')
        .take(take)
        .skip(skip)
        .getManyAndCount();

      res.status(200).json({
        pageInfo: {
          pages: Math.ceil(historyCount / take),
          pageSize: take,
          results: historyCount,
          page: Math.ceil(skip / take) + 1,
        },
        results: history,
      });
    } catch (e) {
      logger.error('Failed to retrieve newsletter history', {
        label: 'Newsletters',
        newsletterId: req.params.id,
        errorMessage: e instanceof Error ? e.message : String(e),
      });
      next({ status: 500, message: 'Unable to load newsletter history.' });
    }
  }
);

export default newsletterRoutes;
