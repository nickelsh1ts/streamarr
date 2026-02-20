import { getRepository } from '@server/datasource';
import {
  WelcomeContent,
  WelcomeContentType,
} from '@server/entity/WelcomeContent';
import {
  TutorialStep,
  TutorialMode,
  TooltipPosition,
} from '@server/entity/TutorialStep';
import { UserOnboarding } from '@server/entity/UserOnboarding';
import type {
  WelcomeContentResponse,
  WelcomeContentCreateRequest,
  WelcomeContentUpdateRequest,
  WelcomeContentReorderRequest,
  TutorialStepResponse,
  TutorialStepCreateRequest,
  TutorialStepUpdateRequest,
  TutorialStepReorderRequest,
  OnboardingSettingsResponse,
} from '@server/interfaces/api/onboardingInterfaces';
import { Permission, hasPermission } from '@server/lib/permissions';
import {
  sanitizeHtml,
  sanitizeYouTubeUrl,
  sanitizeImageUrl,
} from '@server/lib/sanitize';
import { getSettings } from '@server/lib/settings';
import {
  resetOnboardingDefaults,
  onboardingImageService,
} from '@server/lib/onboarding';
import logger from '@server/logger';
import { isAuthenticated } from '@server/middleware/auth';
import { Router } from 'express';
import multer from 'multer';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

router.get<Record<string, never>, OnboardingSettingsResponse>(
  '/',
  isAuthenticated(Permission.ADMIN),
  (_req, res) => {
    const settings = getSettings();
    res.status(200).json(settings.onboarding as OnboardingSettingsResponse);
  }
);

router.post<Record<string, never>, OnboardingSettingsResponse>(
  '/',
  isAuthenticated(Permission.ADMIN),
  async (req, res, next) => {
    try {
      const settings = getSettings();
      const {
        welcomeEnabled,
        tutorialEnabled,
        tutorialMode,
        allowSkipWelcome,
        allowSkipTutorial,
        tutorialAutostart,
        tutorialAutostartDelay,
        adminOnboardingCompleted,
      } = req.body;

      settings.onboarding = {
        initialized: settings.onboarding.initialized,
        welcomeEnabled: welcomeEnabled ?? settings.onboarding.welcomeEnabled,
        tutorialEnabled: tutorialEnabled ?? settings.onboarding.tutorialEnabled,
        tutorialMode: tutorialMode ?? settings.onboarding.tutorialMode,
        allowSkipWelcome:
          allowSkipWelcome ?? settings.onboarding.allowSkipWelcome,
        allowSkipTutorial:
          allowSkipTutorial ?? settings.onboarding.allowSkipTutorial,
        tutorialAutostart:
          tutorialAutostart ?? settings.onboarding.tutorialAutostart,
        tutorialAutostartDelay:
          tutorialAutostartDelay ?? settings.onboarding.tutorialAutostartDelay,
        adminOnboardingCompleted:
          adminOnboardingCompleted ??
          settings.onboarding.adminOnboardingCompleted,
      };

      settings.save();

      res.status(200).json(settings.onboarding as OnboardingSettingsResponse);
    } catch (e) {
      logger.error('Failed to update onboarding settings', {
        label: 'Onboarding',
        error: e instanceof Error ? e.message : String(e),
      });
      next({ status: 500, message: 'Failed to update settings' });
    }
  }
);

router.get<Record<string, never>, WelcomeContentResponse[]>(
  '/welcome',
  isAuthenticated(Permission.ADMIN),
  async (_req, res, next) => {
    try {
      const welcomeContentRepo = getRepository(WelcomeContent);
      const content = await welcomeContentRepo.find({
        order: { order: 'ASC' },
      });

      const response: WelcomeContentResponse[] = content.map((wc) => ({
        id: wc.id,
        type: wc.type,
        order: wc.order,
        enabled: wc.enabled,
        title: wc.title,
        description: wc.description,
        imageUrl: wc.imageUrl,
        videoUrl: wc.videoUrl,
        videoAutoplay: wc.videoAutoplay,
        customHtml: wc.customHtml,
        createdAt: wc.createdAt.toISOString(),
        updatedAt: wc.updatedAt.toISOString(),
      }));

      res.status(200).json(response);
    } catch (e) {
      logger.error('Failed to get welcome content', {
        label: 'Onboarding',
        error: e instanceof Error ? e.message : String(e),
        stack: e instanceof Error ? e.stack : undefined,
      });
      next({ status: 500, message: 'Failed to get welcome content' });
    }
  }
);

router.post<Record<string, never>, WelcomeContentResponse>(
  '/welcome',
  isAuthenticated(Permission.ADMIN),
  async (req, res, next) => {
    try {
      const welcomeContentRepo = getRepository(WelcomeContent);
      const body = req.body as WelcomeContentCreateRequest;

      const maxOrder = await welcomeContentRepo
        .createQueryBuilder('wc')
        .select('MAX(wc.order)', 'max')
        .getRawOne();

      const newContent = new WelcomeContent({
        type: body.type ?? WelcomeContentType.USER,
        order: body.order ?? (maxOrder?.max ?? 0) + 1,
        enabled: body.enabled ?? true,
        title: body.title,
        description: body.description,
        imageUrl: body.imageUrl ? sanitizeImageUrl(body.imageUrl) : undefined,
        videoUrl: body.videoUrl ? sanitizeYouTubeUrl(body.videoUrl) : undefined,
        videoAutoplay: body.videoAutoplay ?? false,
        customHtml: body.customHtml ? sanitizeHtml(body.customHtml) : undefined,
      });

      await welcomeContentRepo.save(newContent);

      const response: WelcomeContentResponse = {
        id: newContent.id,
        type: newContent.type,
        order: newContent.order,
        enabled: newContent.enabled,
        title: newContent.title,
        description: newContent.description,
        imageUrl: newContent.imageUrl,
        videoUrl: newContent.videoUrl,
        videoAutoplay: newContent.videoAutoplay,
        customHtml: newContent.customHtml,
        createdAt: newContent.createdAt.toISOString(),
        updatedAt: newContent.updatedAt.toISOString(),
      };

      res.status(201).json(response);
    } catch (e) {
      logger.error('Failed to create welcome content', {
        label: 'Onboarding',
        error: e instanceof Error ? e.message : String(e),
        stack: e instanceof Error ? e.stack : undefined,
      });
      next({ status: 500, message: 'Failed to create welcome content' });
    }
  }
);

router.put<{ id: string }, WelcomeContentResponse>(
  '/welcome/:id',
  isAuthenticated(Permission.ADMIN),
  async (req, res, next) => {
    try {
      const welcomeContentRepo = getRepository(WelcomeContent);
      const id = Number(req.params.id);
      const body = req.body as WelcomeContentUpdateRequest;

      const content = await welcomeContentRepo.findOne({ where: { id } });
      if (!content) {
        res.status(404).json({ error: 'Welcome content not found' } as never);
        return;
      }

      if (body.type !== undefined) content.type = body.type;
      if (body.order !== undefined) content.order = body.order;
      if (body.enabled !== undefined) content.enabled = body.enabled;
      if (body.title !== undefined) content.title = body.title;
      if (body.description !== undefined)
        content.description = body.description;
      if (body.imageUrl !== undefined) {
        const oldImageUrl = content.imageUrl;
        const newImageUrl = body.imageUrl
          ? sanitizeImageUrl(body.imageUrl)
          : null;

        if (oldImageUrl && oldImageUrl !== newImageUrl) {
          const oldFilename =
            onboardingImageService.getFilenameFromUrl(oldImageUrl);
          if (oldFilename) {
            try {
              await onboardingImageService.deleteImage(oldFilename);
            } catch (e) {
              logger.warn('Failed to delete old image from welcome content', {
                label: 'Onboarding',
                error: e instanceof Error ? e.message : String(e),
                stack: e instanceof Error ? e.stack : undefined,
              });
            }
          }
        }
        content.imageUrl = newImageUrl;
      }
      if (body.videoUrl !== undefined) {
        content.videoUrl = body.videoUrl
          ? sanitizeYouTubeUrl(body.videoUrl)
          : null;
      }
      if (body.videoAutoplay !== undefined)
        content.videoAutoplay = body.videoAutoplay;
      if (body.customHtml !== undefined) {
        content.customHtml = body.customHtml
          ? sanitizeHtml(body.customHtml)
          : null;
      }

      await welcomeContentRepo.save(content);

      const response: WelcomeContentResponse = {
        id: content.id,
        type: content.type,
        order: content.order,
        enabled: content.enabled,
        title: content.title,
        description: content.description,
        imageUrl: content.imageUrl,
        videoUrl: content.videoUrl,
        videoAutoplay: content.videoAutoplay,
        customHtml: content.customHtml,
        createdAt: content.createdAt.toISOString(),
        updatedAt: content.updatedAt.toISOString(),
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('Failed to update welcome content', {
        label: 'Onboarding',
        error,
      });
      next({ status: 500, message: 'Failed to update welcome content' });
    }
  }
);

router.delete<{ id: string }>(
  '/welcome/:id',
  isAuthenticated(Permission.ADMIN),
  async (req, res, next) => {
    try {
      const welcomeContentRepo = getRepository(WelcomeContent);
      const id = Number(req.params.id);

      const content = await welcomeContentRepo.findOne({ where: { id } });
      if (!content) {
        res.status(404).json({ error: 'Welcome content not found' });
        return;
      }

      if (content.imageUrl) {
        const filename = onboardingImageService.getFilenameFromUrl(
          content.imageUrl
        );
        if (filename) {
          try {
            await onboardingImageService.deleteImage(filename);
          } catch (e) {
            logger.warn('Failed to delete image from welcome content', {
              label: 'Onboarding',
              error: e instanceof Error ? e.message : String(e),
              stack: e instanceof Error ? e.stack : undefined,
            });
          }
        }
      }

      await welcomeContentRepo.remove(content);

      logger.debug(`Welcome content deleted: ${id} - ${content.title}`, {
        label: 'Onboarding',
      });

      res.status(204).send();
    } catch (e) {
      logger.error('Failed to delete welcome content', {
        label: 'Onboarding',
        error: e instanceof Error ? e.message : String(e),
        stack: e instanceof Error ? e.stack : undefined,
      });
      next({ status: 500, message: 'Failed to delete welcome content' });
    }
  }
);

router.post(
  '/welcome/reorder',
  isAuthenticated(Permission.ADMIN),
  async (req, res, next) => {
    try {
      const welcomeContentRepo = getRepository(WelcomeContent);
      const { items } = req.body as WelcomeContentReorderRequest;

      for (const item of items) {
        await welcomeContentRepo.update(item.id, { order: item.order });
      }

      res.status(200).json({ success: true });
    } catch (e) {
      logger.error('Failed to reorder welcome content', {
        label: 'Onboarding',
        error: e instanceof Error ? e.message : String(e),
        stack: e instanceof Error ? e.stack : undefined,
      });
      next({ status: 500, message: 'Failed to reorder welcome content' });
    }
  }
);

router.post(
  '/welcome/:id/image',
  isAuthenticated(Permission.ADMIN),
  upload.single('image'),
  async (req, res, next) => {
    try {
      const welcomeContentRepo = getRepository(WelcomeContent);
      const id = Number(req.params.id);

      const content = await welcomeContentRepo.findOne({ where: { id } });
      if (!content) {
        res.status(404).json({ error: 'Welcome content not found' });
        return;
      }

      if (!req.file) {
        res.status(400).json({ error: 'No file uploaded' });
        return;
      }

      if (content.imageUrl) {
        const oldFilename = onboardingImageService.getFilenameFromUrl(
          content.imageUrl
        );
        if (oldFilename) {
          try {
            await onboardingImageService.deleteImage(oldFilename);
          } catch (e) {
            logger.warn('Failed to delete old image', {
              label: 'Onboarding',
              error: e instanceof Error ? e.message : String(e),
              stack: e instanceof Error ? e.stack : undefined,
            });
          }
        }
      }

      const result = await onboardingImageService.uploadImage({
        buffer: req.file.buffer,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
      });

      content.imageUrl = result.url;
      await welcomeContentRepo.save(content);

      res.status(200).json({ url: result.url });
    } catch (e) {
      logger.error('Failed to upload welcome content image', {
        label: 'Onboarding',
        error: e instanceof Error ? e.message : String(e),
        stack: e instanceof Error ? e.stack : undefined,
      });
      next({ status: 500, message: 'Failed to upload image' });
    }
  }
);

router.get<Record<string, never>, TutorialStepResponse[]>(
  '/tutorial',
  isAuthenticated(Permission.ADMIN),
  async (_req, res, next) => {
    try {
      const tutorialStepRepo = getRepository(TutorialStep);
      const steps = await tutorialStepRepo.find({
        order: { order: 'ASC' },
      });

      const response: TutorialStepResponse[] = steps.map((ts) => ({
        id: ts.id,
        order: ts.order,
        enabled: ts.enabled,
        mode: ts.mode,
        targetSelector: ts.targetSelector,
        title: ts.title,
        description: ts.description,
        tooltipPosition: ts.tooltipPosition,
        route: ts.route,
        imageUrl: ts.imageUrl,
        videoUrl: ts.videoUrl,
        videoAutoplay: ts.videoAutoplay,
        customHtml: ts.customHtml,
        createdAt: ts.createdAt.toISOString(),
        updatedAt: ts.updatedAt.toISOString(),
      }));

      res.status(200).json(response);
    } catch (e) {
      logger.error('Failed to get tutorial steps', {
        label: 'Onboarding',
        error: e instanceof Error ? e.message : String(e),
        stack: e instanceof Error ? e.stack : undefined,
      });
      next({ status: 500, message: 'Failed to get tutorial steps' });
    }
  }
);

router.post<Record<string, never>, TutorialStepResponse>(
  '/tutorial',
  isAuthenticated(Permission.ADMIN),
  async (req, res, next) => {
    try {
      const tutorialStepRepo = getRepository(TutorialStep);
      const body = req.body as TutorialStepCreateRequest;

      const maxOrder = await tutorialStepRepo
        .createQueryBuilder('ts')
        .select('MAX(ts.order)', 'max')
        .getRawOne();

      const newStep = new TutorialStep({
        order: body.order ?? (maxOrder?.max ?? 0) + 1,
        enabled: body.enabled ?? true,
        mode: body.mode ?? TutorialMode.BOTH,
        targetSelector: body.targetSelector,
        title: body.title,
        description: body.description,
        tooltipPosition: body.tooltipPosition ?? TooltipPosition.AUTO,
        route: body.route,
        imageUrl: body.imageUrl ? sanitizeImageUrl(body.imageUrl) : undefined,
        videoUrl: body.videoUrl ? sanitizeYouTubeUrl(body.videoUrl) : undefined,
        videoAutoplay: body.videoAutoplay ?? false,
        customHtml: body.customHtml ? sanitizeHtml(body.customHtml) : undefined,
      });

      await tutorialStepRepo.save(newStep);

      const response: TutorialStepResponse = {
        id: newStep.id,
        order: newStep.order,
        enabled: newStep.enabled,
        mode: newStep.mode,
        targetSelector: newStep.targetSelector,
        title: newStep.title,
        description: newStep.description,
        tooltipPosition: newStep.tooltipPosition,
        route: newStep.route,
        imageUrl: newStep.imageUrl,
        videoUrl: newStep.videoUrl,
        videoAutoplay: newStep.videoAutoplay,
        customHtml: newStep.customHtml,
        createdAt: newStep.createdAt.toISOString(),
        updatedAt: newStep.updatedAt.toISOString(),
      };

      res.status(201).json(response);
    } catch (e) {
      logger.error('Failed to create tutorial step', {
        label: 'Onboarding',
        error: e instanceof Error ? e.message : String(e),
        stack: e instanceof Error ? e.stack : undefined,
      });
      next({ status: 500, message: 'Failed to create tutorial step' });
    }
  }
);

router.put<{ id: string }, TutorialStepResponse>(
  '/tutorial/:id',
  isAuthenticated(Permission.ADMIN),
  async (req, res, next) => {
    try {
      const tutorialStepRepo = getRepository(TutorialStep);
      const id = Number(req.params.id);
      const body = req.body as TutorialStepUpdateRequest;

      const step = await tutorialStepRepo.findOne({ where: { id } });
      if (!step) {
        res.status(404).json({ error: 'Tutorial step not found' } as never);
        return;
      }

      if (body.order !== undefined) step.order = body.order;
      if (body.enabled !== undefined) step.enabled = body.enabled;
      if (body.mode !== undefined) step.mode = body.mode;
      if (body.targetSelector !== undefined)
        step.targetSelector = body.targetSelector;
      if (body.title !== undefined) step.title = body.title;
      if (body.description !== undefined) step.description = body.description;
      if (body.tooltipPosition !== undefined)
        step.tooltipPosition = body.tooltipPosition;
      if (body.route !== undefined) step.route = body.route;
      if (body.imageUrl !== undefined) {
        const oldImageUrl = step.imageUrl;
        const newImageUrl = body.imageUrl
          ? sanitizeImageUrl(body.imageUrl)
          : null;

        if (oldImageUrl && oldImageUrl !== newImageUrl) {
          const oldFilename =
            onboardingImageService.getFilenameFromUrl(oldImageUrl);
          if (oldFilename) {
            try {
              await onboardingImageService.deleteImage(oldFilename);
            } catch (e) {
              logger.warn('Failed to delete old image from tutorial step', {
                label: 'Onboarding',
                error: e instanceof Error ? e.message : String(e),
                stack: e instanceof Error ? e.stack : undefined,
              });
            }
          }
        }
        step.imageUrl = newImageUrl;
      }
      if (body.videoUrl !== undefined) {
        step.videoUrl = body.videoUrl
          ? sanitizeYouTubeUrl(body.videoUrl)
          : null;
      }
      if (body.videoAutoplay !== undefined) {
        step.videoAutoplay = body.videoAutoplay;
      }
      if (body.customHtml !== undefined) {
        step.customHtml = body.customHtml
          ? sanitizeHtml(body.customHtml)
          : null;
      }

      await tutorialStepRepo.save(step);

      const response: TutorialStepResponse = {
        id: step.id,
        order: step.order,
        enabled: step.enabled,
        mode: step.mode,
        targetSelector: step.targetSelector,
        title: step.title,
        description: step.description,
        tooltipPosition: step.tooltipPosition,
        route: step.route,
        imageUrl: step.imageUrl,
        videoUrl: step.videoUrl,
        videoAutoplay: step.videoAutoplay,
        customHtml: step.customHtml,
        createdAt: step.createdAt.toISOString(),
        updatedAt: step.updatedAt.toISOString(),
      };

      res.status(200).json(response);
    } catch (e) {
      logger.error('Failed to update tutorial step', {
        label: 'Onboarding',
        error: e instanceof Error ? e.message : String(e),
        stack: e instanceof Error ? e.stack : undefined,
      });
      next({ status: 500, message: 'Failed to update tutorial step' });
    }
  }
);

router.delete<{ id: string }>(
  '/tutorial/:id',
  isAuthenticated(Permission.ADMIN),
  async (req, res, next) => {
    try {
      const tutorialStepRepo = getRepository(TutorialStep);
      const id = Number(req.params.id);

      const step = await tutorialStepRepo.findOne({ where: { id } });
      if (!step) {
        res.status(404).json({ error: 'Tutorial step not found' });
        return;
      }

      if (step.imageUrl) {
        const filename = onboardingImageService.getFilenameFromUrl(
          step.imageUrl
        );
        if (filename) {
          try {
            await onboardingImageService.deleteImage(filename);
          } catch (e) {
            logger.warn('Failed to delete image for tutorial step', {
              label: 'Onboarding',
              error: e instanceof Error ? e.message : String(e),
              stack: e instanceof Error ? e.stack : undefined,
            });
          }
        }
      }

      await tutorialStepRepo.remove(step);

      logger.debug(`Tutorial step deleted: ${id} - ${step.title}`, {
        label: 'Onboarding',
      });

      res.status(204).send();
    } catch (e) {
      logger.error('Failed to delete tutorial step', {
        label: 'Onboarding',
        error: e instanceof Error ? e.message : String(e),
        stack: e instanceof Error ? e.stack : undefined,
      });
      next({ status: 500, message: 'Failed to delete tutorial step' });
    }
  }
);

router.post(
  '/tutorial/reorder',
  isAuthenticated(Permission.ADMIN),
  async (req, res, next) => {
    try {
      const tutorialStepRepo = getRepository(TutorialStep);
      const { items } = req.body as TutorialStepReorderRequest;

      for (const item of items) {
        await tutorialStepRepo.update(item.id, { order: item.order });
      }

      res.status(200).json({ success: true });
    } catch (e) {
      logger.error('Failed to reorder tutorial steps', {
        label: 'Onboarding',
        error: e instanceof Error ? e.message : String(e),
        stack: e instanceof Error ? e.stack : undefined,
      });
      next({ status: 500, message: 'Failed to reorder tutorial steps' });
    }
  }
);

router.post(
  '/tutorial/:id/image',
  isAuthenticated(Permission.ADMIN),
  upload.single('image'),
  async (req, res, next) => {
    try {
      const tutorialStepRepo = getRepository(TutorialStep);
      const id = Number(req.params.id);

      const step = await tutorialStepRepo.findOne({ where: { id } });
      if (!step) {
        res.status(404).json({ error: 'Tutorial step not found' });
        return;
      }

      if (!req.file) {
        res.status(400).json({ error: 'No file uploaded' });
        return;
      }

      if (step.imageUrl) {
        const oldFilename = onboardingImageService.getFilenameFromUrl(
          step.imageUrl
        );
        if (oldFilename) {
          try {
            await onboardingImageService.deleteImage(oldFilename);
          } catch (e) {
            logger.warn('Failed to delete old image from tutorial step', {
              label: 'Onboarding',
              error: e instanceof Error ? e.message : String(e),
              stack: e instanceof Error ? e.stack : undefined,
            });
          }
        }
      }

      const result = await onboardingImageService.uploadImage({
        buffer: req.file.buffer,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
      });

      step.imageUrl = result.url;
      await tutorialStepRepo.save(step);

      res.status(200).json({ url: result.url });
    } catch (e) {
      logger.error('Failed to upload tutorial step image', {
        label: 'Onboarding',
        error: e instanceof Error ? e.message : String(e),
        stack: e instanceof Error ? e.stack : undefined,
      });
      next({ status: 500, message: 'Failed to upload image' });
    }
  }
);

router.post<
  Record<string, never>,
  | { message: string; welcomeCount: number; tutorialCount: number }
  | { error: string }
>('/reset', isAuthenticated(Permission.ADMIN), async (req, res, next) => {
  try {
    const { type } = req.body as { type?: 'welcome' | 'tutorial' };

    logger.debug(
      `Resetting onboarding ${type ? type + ' content' : 'content'} to defaults`,
      { label: 'Onboarding' }
    );

    const result = await resetOnboardingDefaults(type);

    res.status(200).json({
      message: 'Onboarding content reset to defaults',
      welcomeCount: result.welcomeCount,
      tutorialCount: result.tutorialCount,
    });
  } catch (e) {
    logger.error('Failed to reset onboarding content to defaults', {
      label: 'Onboarding',
      error: e instanceof Error ? e.message : String(e),
      stack: e instanceof Error ? e.stack : undefined,
    });
    next({ status: 500, message: 'Failed to reset defaults' });
  }
});

router.post<
  Record<string, never>,
  { success: boolean; count: number } | { error: string }
>(
  '/reset-all-users',
  isAuthenticated(Permission.ADMIN),
  async (_req, res, next) => {
    try {
      const onboardingRepo = getRepository(UserOnboarding);

      const allOnboardings = await onboardingRepo.find({
        relations: ['user'],
      });

      // Filter out users with ADMIN or MANAGE_USERS permissions
      const nonAdminOnboardings = allOnboardings.filter((onboarding) => {
        const userPermissions = onboarding.user.permissions ?? 0;
        const isAdminOrManager = hasPermission(
          [Permission.ADMIN, Permission.MANAGE_USERS],
          userPermissions,
          { type: 'or' }
        );
        return !isAdminOrManager;
      });

      logger.debug(
        `Resetting onboarding for ${nonAdminOnboardings.length} users`,
        {
          label: 'Onboarding',
          excluded: `${allOnboardings.length - nonAdminOnboardings.length} ${allOnboardings.length - nonAdminOnboardings.length === 1 ? 'admin' : 'admins'}`,
        }
      );

      for (const onboarding of nonAdminOnboardings) {
        onboarding.reset();
      }

      await onboardingRepo.save(nonAdminOnboardings);

      res.status(200).json({
        success: true,
        count: nonAdminOnboardings.length,
      });
    } catch (e) {
      logger.error('Failed to reset onboarding for all users', {
        label: 'Onboarding',
        error: e instanceof Error ? e.message : String(e),
        stack: e instanceof Error ? e.stack : undefined,
      });
      next({ status: 500, message: 'Failed to reset all users' });
    }
  }
);

router.post<Record<string, never>, { success: boolean } | { error: string }>(
  '/admin-complete',
  isAuthenticated(Permission.ADMIN),
  async (_req, res, next) => {
    try {
      const settings = getSettings();

      settings.onboarding = {
        ...settings.onboarding,
        adminOnboardingCompleted: true,
      };
      settings.save();

      res.status(200).json({ success: true });
    } catch (e) {
      logger.error('Failed to complete admin onboarding', {
        label: 'Onboarding',
        error: e instanceof Error ? e.message : String(e),
        stack: e instanceof Error ? e.stack : undefined,
      });
      next({ status: 500, message: 'Failed to complete admin onboarding' });
    }
  }
);

export default router;
