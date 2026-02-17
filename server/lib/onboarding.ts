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
import logger from '@server/logger';
import { getSettings } from '@server/lib/settings';
import ImageUploadService from '@server/lib/imageUpload';

interface DefaultWelcomeContent {
  type: WelcomeContentType;
  order: number;
  enabled: boolean;
  title: string;
  description: string;
  imageUrl?: string;
  videoUrl?: string;
  customHtml?: string;
}

interface DefaultTutorialStep {
  order: number;
  enabled: boolean;
  mode: TutorialMode;
  targetSelector: string;
  title: string;
  description: string;
  tooltipPosition: TooltipPosition;
  route?: string;
}

export const DEFAULT_WELCOME_CONTENT: DefaultWelcomeContent[] = [
  {
    type: WelcomeContentType.USER,
    order: 0,
    enabled: true,
    title: 'Welcome to {applicationTitle}!',
    description:
      "Your personal media streaming hub. We're glad to have you here. Let's take a quick look at what you can do.",
  },
  {
    type: WelcomeContentType.USER,
    order: 1,
    enabled: true,
    title: 'Explore Our Library',
    description:
      'Browse and stream movies, TV shows, and more. Use the sidebar to navigate between different sections.',
  },
  {
    type: WelcomeContentType.USER,
    order: 2,
    enabled: true,
    title: 'Stay Up to Date',
    description:
      'Check the Release Schedule to see upcoming content. Invite friends to join, or request new content to be added to the library.',
  },
  {
    type: WelcomeContentType.USER,
    order: 3,
    enabled: true,
    title: 'Need Help?',
    description:
      'Click on your profile picture to access settings and help. You can always restart this tutorial from your account settings.',
  },
];

export function getDefaultTutorialSteps(
  settings: ReturnType<typeof getSettings>
): DefaultTutorialStep[] {
  return [
    {
      order: 0,
      enabled: true,
      mode: TutorialMode.SPOTLIGHT,
      targetSelector: '[data-tutorial="nav-home"]',
      title: 'Home',
      description:
        'This is your Home. Browse our entire media library, discover new content, and pick up where you left off.',
      tooltipPosition: TooltipPosition.RIGHT,
    },
    {
      order: 1,
      enabled: true,
      mode: TutorialMode.SPOTLIGHT,
      targetSelector: '[data-tutorial="library-menu"]',
      title: 'Library Menu',
      description:
        'Access available libraries here. Browse movies, TV shows, music, and more organized by category.',
      tooltipPosition: TooltipPosition.RIGHT,
    },
    {
      order: 2,
      enabled: settings.main.enableSignUp,
      mode: TutorialMode.SPOTLIGHT,
      targetSelector: '[data-tutorial="nav-invites"]',
      title: 'Invites',
      description:
        'Share the experience! Create invite links to bring friends and family to {applicationTitle}.',
      tooltipPosition: TooltipPosition.RIGHT,
      route: '/invites',
    },
    {
      order: 3,
      enabled: settings.main.releaseSched,
      mode: TutorialMode.SPOTLIGHT,
      targetSelector: '[data-tutorial="nav-schedule"]',
      title: 'Release Schedule',
      description:
        'Keep track of upcoming releases and when new content will be available.',
      tooltipPosition: TooltipPosition.RIGHT,
      route: '/schedule',
    },
    {
      order: 4,
      enabled: true,
      mode: TutorialMode.SPOTLIGHT,
      targetSelector: '[data-tutorial="user-dropdown"]',
      title: 'Your Profile',
      description:
        'Access your profile, account settings, notifications, watch history, and sign out from here.',
      tooltipPosition: TooltipPosition.BOTTOM,
    },
    {
      order: 5,
      enabled: true,
      mode: TutorialMode.SPOTLIGHT,
      targetSelector: '[data-tutorial="library-pin"]',
      title: 'Pin Plex Libraries',
      description:
        'Pin our Plex Libraries to your homepage for an optimal experience.',
      tooltipPosition: TooltipPosition.BOTTOM,
      route: '/profile/settings',
    },
  ];
}

export async function initializeOnboardingDefaults(): Promise<boolean> {
  const settings = getSettings();

  if (settings.onboarding.initialized) {
    return false;
  }

  const welcomeContentRepo = getRepository(WelcomeContent);
  const tutorialStepRepo = getRepository(TutorialStep);

  const existingWelcomeCount = await welcomeContentRepo.count();
  const existingTutorialCount = await tutorialStepRepo.count();

  if (existingWelcomeCount > 0 || existingTutorialCount > 0) {
    logger.debug(
      `Onboarding content already exists (${existingWelcomeCount} welcome, ${existingTutorialCount} tutorial). Skipping initialization.`,
      { label: 'Onboarding' }
    );
    return false;
  }

  const appTitle = settings.main.applicationTitle || 'Streamarr';

  for (const content of DEFAULT_WELCOME_CONTENT) {
    const welcomeContent = new WelcomeContent({
      ...content,
      title: content.title.replace('{applicationTitle}', appTitle),
    });
    await welcomeContentRepo.save(welcomeContent);
  }

  const defaultTutorialSteps = getDefaultTutorialSteps(settings);
  for (const step of defaultTutorialSteps) {
    const tutorialStep = new TutorialStep({
      ...step,
      description: step.description.replace('{applicationTitle}', appTitle),
    });
    await tutorialStepRepo.save(tutorialStep);
  }

  settings.onboarding = { ...settings.onboarding, initialized: true };
  settings.save();

  logger.info(
    `Initialized ${DEFAULT_WELCOME_CONTENT.length} welcome pages and ${defaultTutorialSteps.length} tutorial steps.`,
    { label: 'Onboarding' }
  );

  return true;
}

export async function resetOnboardingDefaults(
  type?: 'welcome' | 'tutorial'
): Promise<{ welcomeCount: number; tutorialCount: number }> {
  const welcomeContentRepo = getRepository(WelcomeContent);
  const tutorialStepRepo = getRepository(TutorialStep);
  const settings = getSettings();
  const appTitle = settings.main.applicationTitle || 'Streamarr';

  let welcomeCount = 0;
  let tutorialCount = 0;

  try {
    if (!type || type === 'welcome') {
      const existingWelcome = await welcomeContentRepo.find();
      for (const content of existingWelcome) {
        if (content.imageUrl) {
          const filename = onboardingImageService.getFilenameFromUrl(
            content.imageUrl
          );
          if (filename) {
            try {
              await onboardingImageService.deleteImage(filename);
            } catch (e) {
              logger.warn('Failed to delete image during reset', {
                label: 'Onboarding',
                error: e instanceof Error ? e.message : String(e),
              });
            }
          }
        }
      }
      await welcomeContentRepo.clear();

      for (const content of DEFAULT_WELCOME_CONTENT) {
        const welcomeContent = new WelcomeContent({
          ...content,
          title: content.title.replace('{applicationTitle}', appTitle),
        });
        await welcomeContentRepo.save(welcomeContent);
        welcomeCount++;
      }
    }

    if (!type || type === 'tutorial') {
      const existingSteps = await tutorialStepRepo.find();
      for (const step of existingSteps) {
        if (step.imageUrl) {
          const filename = onboardingImageService.getFilenameFromUrl(
            step.imageUrl
          );
          if (filename) {
            try {
              await onboardingImageService.deleteImage(filename);
            } catch (e) {
              logger.warn('Failed to delete image during reset', {
                label: 'Onboarding',
                error: e instanceof Error ? e.message : String(e),
              });
            }
          }
        }
      }
      await tutorialStepRepo.clear();

      const defaultTutorialSteps = getDefaultTutorialSteps(settings);
      for (const step of defaultTutorialSteps) {
        const tutorialStep = new TutorialStep({
          ...step,
          description: step.description.replace('{applicationTitle}', appTitle),
        });
        await tutorialStepRepo.save(tutorialStep);
        tutorialCount++;
      }
    }

    logger.info(
      `Reset ${tutorialCount} tutorial steps and ${welcomeCount} welcome content pages to defaults.`,
      { label: 'Onboarding' }
    );
  } catch (e) {
    logger.error('Error during reset operation', {
      label: 'Onboarding',
      errorMessage: e instanceof Error ? e.message : String(e),
      errorStack: e instanceof Error ? e.stack : undefined,
    });
    throw e;
  }

  return { welcomeCount, tutorialCount };
}

export const onboardingImageService = new ImageUploadService({
  directory: 'onboarding',
  urlPrefix: '/onboarding/images',
  label: 'ImageUpload',
});
