'use client';
import type { UserOnboardingDataResponse } from '@server/interfaces/api/onboardingInterfaces';
import axios from 'axios';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useOnboarding } from '@app/hooks/useOnboarding';
import { useUser } from '@app/hooks/useUser';

interface OnboardingContextType {
  data?: UserOnboardingDataResponse;
  loading: boolean;
  error: unknown;

  showWelcome: boolean;
  setShowWelcome: (show: boolean) => void;
  completeWelcome: () => Promise<void>;
  dismissWelcome: () => Promise<void>;

  showTutorial: boolean;
  setShowTutorial: (show: boolean) => void;
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

export const OnboardingProvider: React.FC<OnboardingProviderProps> = ({
  children,
}) => {
  const { user } = useUser();
  const { data, loading, error, mutate } = useOnboarding(user?.id);

  const [showWelcome, setShowWelcome] = useState(false);

  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialActive, setTutorialActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const [isPreviewMode, setIsPreviewMode] = useState(false);

  const shouldShowWelcomeModal = useMemo(() => {
    if (loading || error || !data || !user) return false;

    const { settings, status, welcomeContent } = data;

    return (
      settings.welcomeEnabled &&
      welcomeContent.length > 0 &&
      (!status || (!status.welcomeCompleted && !status.welcomeDismissed))
    );
  }, [data, loading, error, user]);

  useEffect(() => {
    setShowWelcome(shouldShowWelcomeModal);
  }, [shouldShowWelcomeModal]);

  // After welcome completes (or is disabled), check if tutorial should show
  useEffect(() => {
    if (loading || error || !data || !user) return;

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

    if (shouldAutoStartTutorial && !showWelcome) {
      const delay = settings.tutorialAutostartDelay || 3000;
      const timeout = setTimeout(() => {
        setShowTutorial(true);
      }, delay);
      return () => clearTimeout(timeout);
    }
  }, [data, loading, error, user, showWelcome]);

  // Welcome actions
  const completeWelcome = useCallback(async () => {
    // In preview mode, just close without saving
    if (isPreviewMode) {
      setShowWelcome(false);
      return;
    }
    if (!user?.id) return;
    try {
      await axios.post(`/api/v1/user/${user.id}/onboarding/welcome/complete`);
      setShowWelcome(false);
      await mutate();
    } catch {
      // Silently fail - UI state already handles this
    }
  }, [user, mutate, isPreviewMode]);

  const dismissWelcome = useCallback(async () => {
    // In preview mode, just close without saving
    if (isPreviewMode) {
      setShowWelcome(false);
      return;
    }
    if (!user?.id) return;
    try {
      await axios.post(`/api/v1/user/${user.id}/onboarding/welcome/dismiss`);
      setShowWelcome(false);
      await mutate();
    } catch {
      // Silently fail - UI state already handles this
    }
  }, [user, mutate, isPreviewMode]);

  const startTutorial = useCallback(() => {
    setTutorialActive(true);
    setShowTutorial(true);
    setCurrentStepIndex(0);
  }, []);

  const closeTutorial = useCallback(() => {
    setTutorialActive(false);
    setShowTutorial(false);
  }, []);

  const nextStep = useCallback(() => {
    const stepsLength = data?.tutorialSteps?.length ?? 0;
    setCurrentStepIndex((prev) => (prev < stepsLength - 1 ? prev + 1 : prev));
  }, [data?.tutorialSteps?.length]);

  const prevStep = useCallback(() => {
    setCurrentStepIndex((prev) => (prev > 0 ? prev - 1 : prev));
  }, []);

  // Preview mode functions
  const endPreview = useCallback(() => {
    setIsPreviewMode(false);
    setShowWelcome(false);
    setShowTutorial(false);
    setTutorialActive(false);
    setCurrentStepIndex(0);
  }, []);

  const completeStep = useCallback(
    async (stepId: number) => {
      // In preview mode, skip API call
      if (isPreviewMode) return;
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
    [user, mutate, isPreviewMode]
  );

  const completeTutorial = useCallback(async () => {
    // In preview mode, just close
    if (isPreviewMode) {
      endPreview();
      return;
    }
    if (!user?.id) return;
    try {
      await axios.post(`/api/v1/user/${user.id}/onboarding/tutorial/complete`);
      closeTutorial();
      await mutate();
    } catch {
      // Silently fail - UI state already handles this
    }
  }, [user, mutate, closeTutorial, isPreviewMode, endPreview]);

  const skipTutorial = useCallback(async () => {
    // In preview mode, just close
    if (isPreviewMode) {
      endPreview();
      return;
    }
    if (!user?.id) return;
    try {
      await axios.post(`/api/v1/user/${user.id}/onboarding/tutorial/skip`);
      closeTutorial();
      await mutate();
    } catch {
      // Silently fail - UI state already handles this
    }
  }, [user, mutate, closeTutorial, isPreviewMode, endPreview]);

  // Reset
  const resetOnboarding = useCallback(async () => {
    if (!user?.id) return;
    try {
      await axios.post(`/api/v1/user/${user.id}/onboarding/reset`);
      setShowWelcome(false);
      setShowTutorial(false);
      setTutorialActive(false);
      setCurrentStepIndex(0);
      await mutate();
    } catch {
      // Silently fail - UI state already handles this
    }
  }, [user, mutate]);

  // Preview mode start functions
  const startWelcomePreview = useCallback(() => {
    setIsPreviewMode(true);
    setShowWelcome(true);
    setShowTutorial(false);
    setTutorialActive(false);
    setCurrentStepIndex(0);
  }, []);

  const startTutorialPreview = useCallback(() => {
    setIsPreviewMode(true);
    setShowWelcome(false);
    setShowTutorial(true);
    setTutorialActive(true);
    setCurrentStepIndex(0);
  }, []);

  const refetch = useCallback(async () => {
    await mutate();
  }, [mutate]);

  return (
    <OnboardingContext.Provider
      value={{
        data,
        loading,
        error,
        showWelcome,
        setShowWelcome,
        completeWelcome,
        dismissWelcome,
        showTutorial,
        setShowTutorial,
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
