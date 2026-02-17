'use client';
import type { UserOnboardingDataResponse } from '@server/interfaces/api/onboardingInterfaces';
import type {
  TutorialStepResponse,
  WelcomeContentResponse,
} from '@server/interfaces/api/onboardingInterfaces';
import { Permission } from '@server/lib/permissions';
import axios from 'axios';
import { usePathname } from 'next/navigation';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useIntl } from 'react-intl';
import { useOnboarding } from '@app/hooks/useOnboarding';
import { useUser } from '@app/hooks/useUser';
import useSettings from '@app/hooks/useSettings';
import {
  getAdminWelcomeSlides,
  getAdminTutorialSteps,
} from '@app/utils/adminOnboarding';

interface OnboardingContextType {
  data?: UserOnboardingDataResponse;
  loading: boolean;
  error: unknown;

  isAdminOnboarding: boolean;
  showAdminWelcome: boolean;
  showAdminTutorial: boolean;
  allowSkipWelcome: boolean;
  allowSkipTutorial: boolean;
  canAlwaysSkip: boolean;

  welcomeContent: WelcomeContentResponse[];
  tutorialSteps: TutorialStepResponse[];
  tutorialMode: 'spotlight' | 'wizard' | 'both';

  showWelcome: boolean;
  completeWelcome: () => Promise<void>;
  dismissWelcome: () => Promise<void>;

  showTutorial: boolean;
  tutorialActive: boolean;
  startTutorial: () => void;
  closeTutorial: () => void;
  currentStepIndex: number;
  nextStep: () => void;
  prevStep: () => void;
  completeStep: (stepId: number) => Promise<void>;
  completeTutorial: () => Promise<void>;
  skipTutorial: () => Promise<void>;

  isPreviewMode: boolean;
  startWelcomePreview: () => void;
  startTutorialPreview: () => void;
  endPreview: () => void;

  resetOnboarding: () => Promise<void>;
  refetch: () => Promise<void>;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(
  undefined
);

interface OnboardingProviderProps {
  children: React.ReactNode;
}

type AdminPhase = 'idle' | 'welcome' | 'tutorial';

export const OnboardingProvider: React.FC<OnboardingProviderProps> = ({
  children,
}) => {
  const { user, hasPermission } = useUser();
  const { currentSettings } = useSettings();
  const intl = useIntl();
  const { data, loading, error, mutate } = useOnboarding(user?.id);
  const pathname = usePathname();

  const isSetupRoute = pathname?.startsWith('/setup');
  const isAdmin = hasPermission(Permission.ADMIN);
  const allowSkipWelcome = data?.settings.allowSkipWelcome ?? true;
  const allowSkipTutorial = data?.settings.allowSkipTutorial ?? true;
  const canAlwaysSkip = isAdmin;

  const tutorialMode = data?.settings.tutorialMode ?? 'both';

  const [adminPhase, setAdminPhase] = useState<AdminPhase>('idle');
  const [adminOnboardingJustCompleted, setAdminOnboardingJustCompleted] =
    useState(false);

  const showAdminWelcome = adminPhase === 'welcome';
  const showAdminTutorial = adminPhase === 'tutorial';

  const [welcomeOpen, setWelcomeOpen] = useState(false);

  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [tutorialActive, setTutorialActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const [isPreviewMode, setIsPreviewMode] = useState(false);

  const resetTutorialState = useCallback(() => {
    setTutorialActive(false);
    setTutorialOpen(false);
    setCurrentStepIndex(0);
  }, []);

  const isAdminOnboarding = useMemo(() => {
    if (!isAdmin || !user || loading || !currentSettings.initialized)
      return false;

    const adminOnboardingCompleted =
      data?.settings?.adminOnboardingCompleted ?? false;
    return !adminOnboardingCompleted;
  }, [isAdmin, user, loading, currentSettings.initialized, data?.settings]);

  const welcomeContent = useMemo((): WelcomeContentResponse[] => {
    if (isAdminOnboarding) {
      return getAdminWelcomeSlides(intl);
    }
    return data?.welcomeContent ?? [];
  }, [isAdminOnboarding, intl, data?.welcomeContent]);

  const tutorialSteps = useMemo((): TutorialStepResponse[] => {
    if (isAdminOnboarding) {
      return getAdminTutorialSteps(intl);
    }
    return data?.tutorialSteps ?? [];
  }, [isAdminOnboarding, intl, data?.tutorialSteps]);

  const shouldBlockUserOnboarding = useMemo(() => {
    return (
      isSetupRoute ||
      isAdminOnboarding ||
      adminOnboardingJustCompleted ||
      adminPhase !== 'idle'
    );
  }, [
    isSetupRoute,
    isAdminOnboarding,
    adminOnboardingJustCompleted,
    adminPhase,
  ]);

  useEffect(() => {
    if (isSetupRoute) return;
    if (adminOnboardingJustCompleted) return;
    if (isAdminOnboarding && adminPhase === 'idle') {
      setAdminPhase('welcome');
    }
  }, [
    isAdminOnboarding,
    adminPhase,
    isSetupRoute,
    adminOnboardingJustCompleted,
  ]);

  const finalizeAdminOnboarding = useCallback(async () => {
    setAdminOnboardingJustCompleted(true);
    setAdminPhase('idle');
    resetTutorialState();

    try {
      await axios.post('/api/v1/settings/onboarding/admin-complete');
      if (user?.id) {
        await axios.post(`/api/v1/user/${user.id}/onboarding/welcome/dismiss`);
        await axios.post(`/api/v1/user/${user.id}/onboarding/tutorial/skip`);
      }
      await mutate();
    } catch {
      // Silently fail - UI state already updated
    }
  }, [mutate, user?.id, resetTutorialState]);

  const completeAdminTutorial = finalizeAdminOnboarding;

  const showWelcome = showAdminWelcome || welcomeOpen;
  const showTutorial = showAdminTutorial || tutorialOpen;

  const shouldwelcomeOpenModal = useMemo(() => {
    if (loading || error || !data || !user) return false;
    if (shouldBlockUserOnboarding) return false;

    const { settings, status, welcomeContent } = data;

    return (
      settings.welcomeEnabled &&
      welcomeContent.length > 0 &&
      (!status || (!status.welcomeCompleted && !status.welcomeDismissed))
    );
  }, [data, loading, error, user, shouldBlockUserOnboarding]);

  useEffect(() => {
    setWelcomeOpen(shouldwelcomeOpenModal);
  }, [shouldwelcomeOpenModal]);

  // After welcome completes (or is disabled), check if tutorial should show
  useEffect(() => {
    if (loading || error || !data || !user) return;
    if (shouldBlockUserOnboarding) return;

    const { settings, status } = data;

    const welcomeDone =
      !settings.welcomeEnabled ||
      status?.welcomeCompleted ||
      status?.welcomeDismissed;
    const shouldAutoStartTutorial =
      settings.tutorialEnabled &&
      settings.tutorialAutostart &&
      welcomeDone &&
      !status?.tutorialCompleted;

    if (shouldAutoStartTutorial && !welcomeOpen) {
      const delay = settings.tutorialAutostartDelay || 3000;
      const timeout = setTimeout(() => {
        setTutorialOpen(true);
      }, delay);
      return () => clearTimeout(timeout);
    }
  }, [data, loading, error, user, welcomeOpen, shouldBlockUserOnboarding]);

  const completeWelcome = useCallback(async () => {
    // In preview mode, just close without saving
    if (isPreviewMode) {
      setWelcomeOpen(false);
      return;
    }
    if (showAdminWelcome) {
      setAdminPhase('tutorial');
      return;
    }
    if (!user?.id) return;
    try {
      await axios.post(`/api/v1/user/${user.id}/onboarding/welcome/complete`);
      setWelcomeOpen(false);
      await mutate();
    } catch {
      // Silently fail - UI state already handles this
    }
  }, [user, mutate, isPreviewMode, showAdminWelcome]);

  const dismissWelcome = useCallback(async () => {
    // In preview mode, just close without saving
    if (isPreviewMode) {
      setWelcomeOpen(false);
      return;
    }
    if (!user?.id) return;
    try {
      await axios.post(`/api/v1/user/${user.id}/onboarding/welcome/dismiss`);
      setWelcomeOpen(false);
      await mutate();
    } catch {
      // Silently fail - UI state already handles this
    }
  }, [user, mutate, isPreviewMode]);

  const startTutorial = useCallback(() => {
    setTutorialActive(true);
    setTutorialOpen(true);
    setCurrentStepIndex(0);
  }, []);

  const closeTutorial = useCallback(() => {
    setTutorialActive(false);
    setTutorialOpen(false);
  }, []);

  const nextStep = useCallback(() => {
    const stepsLength = tutorialSteps.length;
    setCurrentStepIndex((prev) => (prev < stepsLength - 1 ? prev + 1 : prev));
  }, [tutorialSteps.length]);

  const prevStep = useCallback(() => {
    setCurrentStepIndex((prev) => (prev > 0 ? prev - 1 : prev));
  }, []);

  // Preview mode functions
  const endPreview = useCallback(() => {
    setIsPreviewMode(false);
    setWelcomeOpen(false);
    resetTutorialState();
  }, [resetTutorialState]);

  const completeStep = useCallback(
    async (stepId: number) => {
      // In preview mode or admin mode, skip API call
      if (isPreviewMode || showAdminTutorial) return;
      if (!user?.id) return;
      try {
        await axios.post(
          `/api/v1/user/${user.id}/onboarding/tutorial/progress`,
          {
            stepId,
          }
        );
        await mutate();
      } catch {
        // Silently fail - step progress is non-critical
      }
    },
    [user, mutate, isPreviewMode, showAdminTutorial]
  );

  const endTutorial = useCallback(
    async (endpoint: 'complete' | 'skip') => {
      if (isPreviewMode) {
        endPreview();
        return;
      }
      if (showAdminTutorial) {
        await completeAdminTutorial();
        return;
      }
      if (!user?.id) return;
      try {
        await axios.post(
          `/api/v1/user/${user.id}/onboarding/tutorial/${endpoint}`
        );
        closeTutorial();
        await mutate();
      } catch {
        // Silently fail - UI state already handles this
      }
    },
    [
      user,
      mutate,
      closeTutorial,
      isPreviewMode,
      endPreview,
      showAdminTutorial,
      completeAdminTutorial,
    ]
  );

  const completeTutorial = useCallback(
    () => endTutorial('complete'),
    [endTutorial]
  );

  const skipTutorial = useCallback(() => endTutorial('skip'), [endTutorial]);

  // Reset
  const resetOnboarding = useCallback(async () => {
    if (!user?.id) return;
    try {
      await axios.post(`/api/v1/user/${user.id}/onboarding/reset`);
      setWelcomeOpen(false);
      resetTutorialState();
      await mutate();
    } catch {
      // Silently fail - UI state already handles this
    }
  }, [user, mutate, resetTutorialState]);

  // Preview mode start functions
  const startWelcomePreview = useCallback(() => {
    setIsPreviewMode(true);
    setWelcomeOpen(true);
    resetTutorialState();
  }, [resetTutorialState]);

  const startTutorialPreview = useCallback(() => {
    setIsPreviewMode(true);
    setWelcomeOpen(false);
    startTutorial();
  }, [startTutorial]);

  const refetch = useCallback(async () => {
    await mutate();
  }, [mutate]);

  return (
    <OnboardingContext.Provider
      value={{
        data,
        loading,
        error,
        isAdminOnboarding,
        showAdminWelcome,
        showAdminTutorial,
        allowSkipWelcome,
        allowSkipTutorial,
        canAlwaysSkip,
        welcomeContent,
        tutorialSteps,
        tutorialMode,
        showWelcome,
        completeWelcome,
        dismissWelcome,
        showTutorial,
        tutorialActive,
        startTutorial,
        closeTutorial,
        currentStepIndex,
        nextStep,
        prevStep,
        completeStep,
        completeTutorial,
        skipTutorial,
        isPreviewMode,
        startWelcomePreview,
        startTutorialPreview,
        endPreview,
        resetOnboarding,
        refetch,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboardingContext = (): OnboardingContextType => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error(
      'useOnboardingContext must be used within an OnboardingProvider'
    );
  }
  return context;
};
