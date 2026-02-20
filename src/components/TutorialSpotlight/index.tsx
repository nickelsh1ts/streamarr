'use client';
import Badge from '@app/components/Common/Badge';
import Button from '@app/components/Common/Button';
import Spotlight from '@app/components/Common/Spotlight';
import { useOnboardingContext } from '@app/context/OnboardingContext';
import useSettings from '@app/hooks/useSettings';
import {
  addIframeScrollListeners,
  getCurrentElementRect,
  getFullSelector,
  hasRectChanged,
  isElementVisible,
  observeIframeDocuments,
  queryAllDocuments,
} from '@app/utils/domHelpers';
import type { TutorialStepResponse } from '@server/interfaces/api/onboardingInterfaces';
import { usePathname, useRouter } from 'next/navigation';
import React, {
  startTransition,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { FormattedMessage } from 'react-intl';
import TutorialTooltip from './TutorialTooltip';

const TutorialSpotlight: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const {
    showTutorial,
    tutorialActive,
    currentStepIndex,
    nextStep,
    prevStep,
    completeStep,
    completeTutorial,
    skipTutorial,
    startTutorial,
    isPreviewMode,
    allowSkipTutorial,
    canAlwaysSkip,
    showAdminTutorial,
    tutorialSteps,
    tutorialMode,
  } = useOnboardingContext();
  const { applicationTitle } = useSettings().currentSettings;

  // Refs for element tracking
  const targetElementRef = useRef<Element | null>(null);
  const iframeRectRef = useRef<DOMRect | undefined>(undefined);
  const observerRef = useRef<MutationObserver | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  // State
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [iframeReady, setIframeReady] = useState(false);

  const currentStep = tutorialSteps[currentStepIndex] as
    | TutorialStepResponse
    | undefined;
  const canDismiss =
    (allowSkipTutorial ?? true) || isPreviewMode || canAlwaysSkip;
  const isLastStep = currentStepIndex === tutorialSteps.length - 1;
  const isWatchRoute = pathname?.startsWith('/watch') ?? false;

  // Determine if TutorialWizard should handle this step instead
  // - Global 'wizard': All steps handled by TutorialWizard
  // - Global 'spotlight': All steps handled here
  // - Global 'both': Use per-step mode to decide
  const shouldUseWizard =
    tutorialMode === 'wizard' ||
    (tutorialMode === 'both' && currentStep?.mode === 'wizard');

  // Navigate to step's route if needed
  useEffect(() => {
    if (shouldUseWizard) return; // Wizard mode handles its own navigation
    if (!tutorialActive || !currentStep?.route) return;

    // Only navigate if we're not already on the correct route
    if (currentStep.route && pathname !== currentStep.route) {
      router.push(currentStep.route);
    }
  }, [tutorialActive, currentStep, pathname, router, shouldUseWizard]);

  // Detect when iframe is ready on /watch route
  // This prevents element lookup before the iframe content has loaded
  useEffect(() => {
    if (!isWatchRoute) {
      // Not on watch route - mark as ready via a timeout to avoid direct setState in effect
      const id = setTimeout(() => setIframeReady(true), 0);
      return () => clearTimeout(id);
    }

    // Reset ready state when navigating to /watch
    const resetId = setTimeout(() => setIframeReady(false), 0);

    const checkIframeReady = () => {
      const iframe = document.querySelector('iframe') as HTMLIFrameElement;
      if (!iframe) return false;

      try {
        const doc = iframe.contentDocument;
        if (!doc) return false;

        // Check if iframe document is loaded and has rendered content
        const mobileNav = doc.querySelector('[data-tutorial="mobile-nav"]');
        return !!(doc.readyState === 'complete' && doc.body && mobileNav);
      } catch {
        // Cross-origin, consider ready
        return true;
      }
    };

    // Poll until iframe is ready
    const pollInterval = setInterval(() => {
      if (checkIframeReady()) {
        setIframeReady(true);
        clearInterval(pollInterval);
      }
    }, 100);

    // Timeout after 5 seconds - proceed anyway
    const timeout = setTimeout(() => {
      setIframeReady(true);
      clearInterval(pollInterval);
    }, 5000);

    // Also listen for iframe load event
    const iframe = document.querySelector('iframe') as HTMLIFrameElement;
    const handleLoad = () => {
      // Delay slightly to allow React to portal content
      setTimeout(() => {
        if (checkIframeReady()) {
          setIframeReady(true);
          clearInterval(pollInterval);
        }
      }, 300);
    };

    if (iframe) {
      iframe.addEventListener('load', handleLoad);
    }

    return () => {
      clearTimeout(resetId);
      clearInterval(pollInterval);
      clearTimeout(timeout);
      if (iframe) {
        iframe.removeEventListener('load', handleLoad);
      }
    };
  }, [isWatchRoute]);

  // Find and track target element using layout effect for DOM measurements
  useLayoutEffect(() => {
    // Cleanup function for observers
    const cleanup = () => {
      observerRef.current?.disconnect();
      resizeObserverRef.current?.disconnect();
      observerRef.current = null;
      resizeObserverRef.current = null;
    };

    if (!tutorialActive || !currentStep?.targetSelector) {
      targetElementRef.current = null;
      iframeRectRef.current = undefined;
      startTransition(() => setTargetRect(null));
      cleanup();
      return;
    }

    // On /watch route, wait for iframe to be ready before finding elements
    if (isWatchRoute && !iframeReady) {
      return;
    }

    const findTarget = () => {
      const fullSelector = getFullSelector(currentStep.targetSelector);
      const elementsFromAllDocuments = queryAllDocuments(fullSelector);

      // On /watch route, prioritize iframe elements
      if (isWatchRoute) {
        elementsFromAllDocuments.sort((a, b) => {
          if (a.isIframe && !b.isIframe) return -1;
          if (!a.isIframe && b.isIframe) return 1;
          return 0;
        });
      }

      let element: Element | null = null;
      let elementIframeRect: DOMRect | undefined = undefined;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      for (const { el, iframeRect } of elementsFromAllDocuments) {
        const elRect = el.getBoundingClientRect();
        const rect = iframeRect
          ? new DOMRect(
              elRect.x + iframeRect.x,
              elRect.y + iframeRect.y,
              elRect.width,
              elRect.height
            )
          : elRect;

        const isWithinViewport =
          rect.right > 0 &&
          rect.left < viewportWidth &&
          rect.bottom > 0 &&
          rect.top < viewportHeight;

        if (
          rect.width > 0 &&
          rect.height > 0 &&
          isWithinViewport &&
          isElementVisible(el)
        ) {
          element = el;
          elementIframeRect = iframeRect;
          break;
        }
      }

      if (element) {
        if (targetElementRef.current !== element) {
          targetElementRef.current = element;
          iframeRectRef.current = elementIframeRect;
          setTargetRect(getCurrentElementRect(element, elementIframeRect));

          // Setup resize observer for this element
          resizeObserverRef.current?.disconnect();
          resizeObserverRef.current = new ResizeObserver(() => {
            if (targetElementRef.current) {
              setTargetRect(
                getCurrentElementRect(
                  targetElementRef.current,
                  iframeRectRef.current
                )
              );
            }
          });
          resizeObserverRef.current.observe(element);
        }
      } else if (targetElementRef.current !== null) {
        targetElementRef.current = null;
        iframeRectRef.current = undefined;
        setTargetRect(null);
      }
    };

    // Initial find
    findTarget();

    // Watch for DOM changes with debounce
    let mutationRafId: number | null = null;
    const mutationCallback = () => {
      if (mutationRafId) cancelAnimationFrame(mutationRafId);
      mutationRafId = requestAnimationFrame(() => {
        findTarget();
        mutationRafId = null;
      });
    };

    observerRef.current = new MutationObserver(mutationCallback);
    observerRef.current.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Also observe iframe documents for DOM changes
    const cleanupIframeObservers = observeIframeDocuments(mutationCallback);

    // Watch for resize/scroll
    const handleResize = () => {
      if (targetElementRef.current) {
        setTargetRect(
          getCurrentElementRect(targetElementRef.current, iframeRectRef.current)
        );
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleResize, true);

    // Also listen for scroll events inside same-origin iframes
    const cleanupIframeScrollListeners = addIframeScrollListeners(handleResize);

    // Position polling to catch layout shifts
    let lastRect: DOMRect | null = null;
    const positionPollInterval = setInterval(() => {
      if (!targetElementRef.current) return;

      const currentRect = getCurrentElementRect(
        targetElementRef.current,
        iframeRectRef.current
      );

      if (hasRectChanged(currentRect, lastRect)) {
        lastRect = currentRect;
        setTargetRect(currentRect);
      }
    }, 150);

    return () => {
      if (mutationRafId) cancelAnimationFrame(mutationRafId);
      clearInterval(positionPollInterval);
      cleanup();
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleResize, true);
      cleanupIframeObservers();
      cleanupIframeScrollListeners();
    };
  }, [tutorialActive, currentStep, iframeReady, isWatchRoute]);

  // Handle step progression
  const handleNext = useCallback(async () => {
    if (!currentStep) return;

    // Mark step as completed
    await completeStep(currentStep.id);

    if (isLastStep) {
      await completeTutorial();
    } else {
      nextStep();
    }
  }, [currentStep, isLastStep, completeStep, completeTutorial, nextStep]);
  const handleSkip = canDismiss ? skipTutorial : undefined;

  // Don't render for wizard-only mode or wizard-mode steps
  if (tutorialMode === 'wizard' || (shouldUseWizard && tutorialActive)) {
    return null;
  }

  // Start tutorial prompt (shows before tutorial begins)
  if (showTutorial && !tutorialActive && tutorialSteps.length > 0) {
    if (showAdminTutorial) {
      setTimeout(() => startTutorial(), 0);
      return null;
    }

    return createPortal(
      <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black backdrop-blur-sm bg-opacity-30 animate-fade-in">
        <div className="bg-base-200 rounded-xl p-4 sm:p-6 max-w-md mx-1 shadow-2xl border border-primary/30 animate-scale-in">
          <h3 className="text-xl font-bold text-base-content mb-3">
            <FormattedMessage
              id="tutorial.ready.title"
              defaultMessage="Interactive Tutorial"
            />
          </h3>
          <p className="text-neutral mb-6">
            <FormattedMessage
              id="tutorial.ready.description"
              defaultMessage="We'll guide you through key features of {applicationTitle} with a quick tour."
              values={{ applicationTitle }}
            />
          </p>
          <div className="flex gap-3 justify-end">
            {canDismiss && (
              <Button buttonType="ghost" buttonSize="sm" onClick={skipTutorial}>
                <FormattedMessage
                  id="tutorial.skipTour"
                  defaultMessage="Skip Tour"
                />
              </Button>
            )}
            <Button
              buttonType="primary"
              buttonSize="sm"
              onClick={startTutorial}
            >
              <FormattedMessage
                id="tutorial.startTour"
                defaultMessage="Start Tour"
              />
            </Button>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  if (!tutorialActive || !currentStep) {
    return null;
  }

  return createPortal(
    <>
      {targetRect ? (
        <Spotlight targetRect={targetRect} />
      ) : (
        <div className="fixed inset-0 z-[1100] bg-black/30 backdrop-blur-sm animate-fade-in" />
      )}
      {isPreviewMode && (
        <Badge
          badgeType="warning"
          className="fixed top-4 left-4 z-[1200] px-3 py-1.5 border border-warning backdrop-blur-sm bg-warning/30 animate-fade-in"
        >
          <FormattedMessage
            id="settings.onboarding.previewMode"
            defaultMessage="Preview Mode"
          />
        </Badge>
      )}
      <TutorialTooltip
        step={currentStep}
        targetRect={targetRect}
        currentIndex={currentStepIndex}
        totalSteps={tutorialSteps.length}
        onNext={handleNext}
        onPrev={prevStep}
        onSkip={handleSkip}
        isFirst={currentStepIndex === 0}
        isLast={isLastStep}
      />
    </>,
    document.body
  );
};

export default TutorialSpotlight;
