import { getRepository } from '@server/datasource';
import { UserOnboarding } from '@server/entity/UserOnboarding';
import {
  WelcomeContent,
  WelcomeContentType,
} from '@server/entity/WelcomeContent';
import { TutorialStep } from '@server/entity/TutorialStep';
import type {
  UserOnboardingStatusResponse,
  UserOnboardingDataResponse,
  TutorialProgressRequest,
} from '@server/interfaces/api/onboardingInterfaces';
import { Permission } from '@server/lib/permissions';
import { getSettings } from '@server/lib/settings';
import logger from '@server/logger';
import { Router } from 'express';

const router = Router({ mergeParams: true });

router.get<{ id: string }, UserOnboardingDataResponse>(
  '/',
  async (req, res, next) => {
    try {
      const userId = Number(req.params.id);

      const onboardingRepo = getRepository(UserOnboarding);
      const welcomeContentRepo = getRepository(WelcomeContent);
      const tutorialStepRepo = getRepository(TutorialStep);
      const settings = getSettings();

      const onboarding = await onboardingRepo.findOne({
        where: { user: { id: userId } },
      });

      const welcomeContent = await welcomeContentRepo.find({
        where: {
          enabled: true,
          type: WelcomeContentType.USER,
        },
        order: { order: 'ASC' },
      });

      const tutorialSteps = await tutorialStepRepo.find({
        where: { enabled: true },
        order: { order: 'ASC' },
      });

      const response: UserOnboardingDataResponse = {
        status: onboarding
          ? {
              id: onboarding.id,
              userId: onboarding.user?.id ?? userId,
              welcomeCompleted: onboarding.welcomeCompleted,
              welcomeCompletedAt: onboarding.welcomeCompletedAt?.toISOString(),
              welcomeDismissed: onboarding.welcomeDismissed,
              tutorialCompleted: onboarding.tutorialCompleted,
              tutorialCompletedAt:
                onboarding.tutorialCompletedAt?.toISOString(),
              tutorialProgress: onboarding.tutorialProgress,
              createdAt: onboarding.createdAt.toISOString(),
              updatedAt: onboarding.updatedAt.toISOString(),
            }
          : null,
        settings: settings.onboarding,
        welcomeContent: welcomeContent.map((wc) => ({
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
        })),
        tutorialSteps: tutorialSteps.map((ts) => ({
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
        })),
      };

      res.status(200).json(response);
    } catch (e) {
      logger.error('Failed to get user onboarding data', {
        label: 'UserOnboarding',
        error: e instanceof Error ? e.message : String(e),
        stack: e instanceof Error ? e.stack : undefined,
      });
      next({ status: 500, message: 'Failed to get onboarding data' });
    }
  }
);

router.get<{ id: string }, UserOnboardingStatusResponse | null>(
  '/status',
  async (req, res, next) => {
    try {
      const userId = Number(req.params.id);

      const onboardingRepo = getRepository(UserOnboarding);
      const onboarding = await onboardingRepo.findOne({
        where: { user: { id: userId } },
      });

      if (!onboarding) {
        res.status(200).json(null);
        return;
      }

      const response: UserOnboardingStatusResponse = {
        id: onboarding.id,
        userId: userId,
        welcomeCompleted: onboarding.welcomeCompleted,
        welcomeCompletedAt: onboarding.welcomeCompletedAt?.toISOString(),
        welcomeDismissed: onboarding.welcomeDismissed,
        tutorialCompleted: onboarding.tutorialCompleted,
        tutorialCompletedAt: onboarding.tutorialCompletedAt?.toISOString(),
        tutorialProgress: onboarding.tutorialProgress,
        createdAt: onboarding.createdAt.toISOString(),
        updatedAt: onboarding.updatedAt.toISOString(),
      };

      res.status(200).json(response);
    } catch (e) {
      logger.error('Failed to get user onboarding status', {
        label: 'UserOnboarding',
        error: e instanceof Error ? e.message : String(e),
        stack: e instanceof Error ? e.stack : undefined,
      });
      next({ status: 500, message: 'Failed to get onboarding status' });
    }
  }
);

router.post<{ id: string }>('/welcome/complete', async (req, res, next) => {
  try {
    const userId = Number(req.params.id);

    if (req.user?.id !== userId) {
      next({ status: 403, message: 'Forbidden' });
      return;
    }

    const onboardingRepo = getRepository(UserOnboarding);
    let onboarding = await onboardingRepo.findOne({
      where: { user: { id: userId } },
      relations: ['user'],
    });

    if (!onboarding) {
      onboarding = new UserOnboarding({ user: req.user });
    }

    onboarding.completeWelcome();
    await onboardingRepo.save(onboarding);

    res.status(200).json({ success: true });
  } catch (e) {
    logger.error(
      `Failed to complete welcome for user ${Number(req.params.id)}`,
      {
        label: 'UserOnboarding',
        error: e instanceof Error ? e.message : String(e),
        stack: e instanceof Error ? e.stack : undefined,
      }
    );
    next({ status: 500, message: 'Failed to complete welcome' });
  }
});

router.post<{ id: string }>('/welcome/dismiss', async (req, res, next) => {
  try {
    const userId = Number(req.params.id);

    if (req.user?.id !== userId) {
      next({ status: 403, message: 'Forbidden' });
      return;
    }

    const settings = getSettings();
    const isAdmin = req.user?.hasPermission(Permission.ADMIN);
    if (!settings.onboarding.allowSkipWelcome && !isAdmin) {
      next({ status: 400, message: 'Skipping is not allowed' });
      return;
    }

    const onboardingRepo = getRepository(UserOnboarding);
    let onboarding = await onboardingRepo.findOne({
      where: { user: { id: userId } },
      relations: ['user'],
    });

    if (!onboarding) {
      onboarding = new UserOnboarding({ user: req.user });
    }

    onboarding.dismissWelcome();
    await onboardingRepo.save(onboarding);

    res.status(200).json({ success: true });
  } catch (e) {
    logger.error(
      `Failed to dismiss welcome for user ${Number(req.params.id)}`,
      {
        label: 'UserOnboarding',
        error: e instanceof Error ? e.message : String(e),
        stack: e instanceof Error ? e.stack : undefined,
      }
    );
    next({ status: 500, message: 'Failed to dismiss welcome' });
  }
});

router.post<{ id: string }>('/tutorial/progress', async (req, res, next) => {
  try {
    const userId = Number(req.params.id);

    if (req.user?.id !== userId) {
      next({ status: 403, message: 'Forbidden' });
      return;
    }

    const { stepId } = req.body as TutorialProgressRequest;

    if (typeof stepId !== 'number') {
      next({ status: 400, message: 'stepId is required' });
      return;
    }

    const onboardingRepo = getRepository(UserOnboarding);
    let onboarding = await onboardingRepo.findOne({
      where: { user: { id: userId } },
      relations: ['user'],
    });

    if (!onboarding) {
      onboarding = new UserOnboarding({ user: req.user });
    }

    onboarding.addStepProgress(stepId);
    await onboardingRepo.save(onboarding);

    res.status(200).json({
      success: true,
      progress: onboarding.tutorialProgress,
    });
  } catch (e) {
    logger.error(
      `Failed to update tutorial progress for user ${Number(req.params.id)}`,
      {
        label: 'UserOnboarding',
        error: e instanceof Error ? e.message : String(e),
        stack: e instanceof Error ? e.stack : undefined,
      }
    );
    next({ status: 500, message: 'Failed to update progress' });
  }
});

router.post<{ id: string }>('/tutorial/complete', async (req, res, next) => {
  try {
    const userId = Number(req.params.id);

    if (req.user?.id !== userId) {
      next({ status: 403, message: 'Forbidden' });
      return;
    }

    const onboardingRepo = getRepository(UserOnboarding);
    let onboarding = await onboardingRepo.findOne({
      where: { user: { id: userId } },
      relations: ['user'],
    });

    if (!onboarding) {
      onboarding = new UserOnboarding({ user: req.user });
    }

    onboarding.completeTutorial();
    await onboardingRepo.save(onboarding);

    res.status(200).json({ success: true });
  } catch (e) {
    logger.error(
      `Failed to complete tutorial for user ${Number(req.params.id)}`,
      {
        label: 'UserOnboarding',
        error: e instanceof Error ? e.message : String(e),
        stack: e instanceof Error ? e.stack : undefined,
      }
    );
    next({ status: 500, message: 'Failed to complete tutorial' });
  }
});

router.post<{ id: string }>('/tutorial/skip', async (req, res, next) => {
  try {
    const userId = Number(req.params.id);

    if (req.user?.id !== userId) {
      next({ status: 403, message: 'Forbidden' });
      return;
    }

    const settings = getSettings();
    const isAdmin = req.user?.hasPermission(Permission.ADMIN);
    if (!settings.onboarding.allowSkipTutorial && !isAdmin) {
      next({ status: 400, message: 'Skipping is not allowed' });
      return;
    }

    const onboardingRepo = getRepository(UserOnboarding);
    let onboarding = await onboardingRepo.findOne({
      where: { user: { id: userId } },
      relations: ['user'],
    });

    if (!onboarding) {
      onboarding = new UserOnboarding({ user: req.user });
    }

    onboarding.completeTutorial();
    await onboardingRepo.save(onboarding);

    res.status(200).json({ success: true });
  } catch (e) {
    logger.error(`Failed to skip tutorial for user ${Number(req.params.id)}`, {
      label: 'UserOnboarding',
      error: e instanceof Error ? e.message : String(e),
      stack: e instanceof Error ? e.stack : undefined,
    });
    next({ status: 500, message: 'Failed to skip tutorial' });
  }
});

router.post<{ id: string }>('/reset', async (req, res, next) => {
  try {
    const userId = Number(req.params.id);

    const onboardingRepo = getRepository(UserOnboarding);
    const onboarding = await onboardingRepo.findOne({
      where: { user: { id: userId } },
    });

    if (onboarding) {
      onboarding.reset();
      await onboardingRepo.save(onboarding);
    }

    logger.debug(`Onboarding reset for user ${userId}`, {
      label: 'UserOnboarding',
    });

    res.status(200).json({ success: true });
  } catch (e) {
    logger.error(
      `Failed to reset onboarding for user ${Number(req.params.id)}`,
      {
        label: 'UserOnboarding',
        error: e instanceof Error ? e.message : String(e),
        stack: e instanceof Error ? e.stack : undefined,
      }
    );
    next({ status: 500, message: 'Failed to reset onboarding' });
  }
});

export default router;
