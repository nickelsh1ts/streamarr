'use client';
import Badge from '@app/components/Common/Badge';
import Button from '@app/components/Common/Button';
import CachedImage from '@app/components/Common/CachedImage';
import Carousel, { type CarouselHandle } from '@app/components/Common/Carousel';
import ContentRenderer from '@app/components/Common/ContentRenderer';
import YouTubeEmbed from '@app/components/Common/YouTubeEmbed';
import { useOnboardingContext } from '@app/context/OnboardingContext';
import useSettings from '@app/hooks/useSettings';
import { Dialog, DialogBackdrop, DialogPanel } from '@headlessui/react';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import type { TutorialStepResponse } from '@server/interfaces/api/onboardingInterfaces';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { FormattedMessage } from 'react-intl';

interface TutorialStepSlideProps {
  step: TutorialStepResponse;
}

const TutorialStepSlide: React.FC<TutorialStepSlideProps> = ({ step }) => {
  return (
    <div className="flex flex-col h-full p-6 sm:p-8">
      <h2 className="text-2xl sm:text-3xl font-bold text-base-content mb-4">
        {step.title}
      </h2>
      <p className="text-base-content/70 sm:text-lg mb-6 leading-relaxed">
        {step.description}
      </p>
      <div className="flex-1 flex flex-col gap-4 items-center justify-center">
        {!!step.imageUrl && (
          <div className="relative w-full max-w-lg mx-auto h-48">
            <CachedImage
              src={step.imageUrl}
              alt={step.title}
              fill
              sizes="(max-width: 768px) 100vw, 512px"
              className="object-contain"
            />
          </div>
        )}
        {!!step.videoUrl && (
          <YouTubeEmbed
            url={step.videoUrl}
            title={step.title}
            autoplay={step.videoAutoplay}
            className="max-w-lg mx-auto"
          />
        )}
        {!!step.customHtml && <ContentRenderer html={step.customHtml} />}
      </div>
      {step.route && (
        <div className="mt-4 px-3 py-2 bg-base-300 rounded-md text-sm text-base-content/70">
          <FormattedMessage
            id="tutorial.wizard.routeHint"
            defaultMessage="This feature is available at: {route}"
            values={{
              route: <code className="text-primary">{step.route}</code>,
            }}
          />
        </div>
      )}
    </div>
  );
};

const TutorialWizard: React.FC = () => {
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
    endPreview,
    allowSkipTutorial,
    canAlwaysSkip,
    tutorialSteps,
    tutorialMode = 'both',
  } = useOnboardingContext();
  const { applicationTitle } = useSettings().currentSettings;

  const carouselRef = useRef<CarouselHandle>(null);
  const [localIndex, setLocalIndex] = useState(currentStepIndex);

  const steps = useMemo(() => tutorialSteps ?? [], [tutorialSteps]);
  const currentStep = steps[currentStepIndex] as
    | (typeof steps)[number]
    | undefined;
  const canDismiss =
    (allowSkipTutorial ?? true) || isPreviewMode || canAlwaysSkip;
  isPreviewMode || canAlwaysSkip;

  const isFullWizardMode = tutorialMode === 'wizard';
  const isMixedModeWizardStep =
    tutorialMode === 'both' && currentStep?.mode === 'wizard';

  const wizardSteps = useMemo(() => {
    if (isFullWizardMode) {
      return steps;
    }
    return currentStep ? [currentStep] : [];
  }, [steps, isFullWizardMode, currentStep]);

  const isLastStep = isFullWizardMode
    ? localIndex === steps.length - 1
    : currentStepIndex === steps.length - 1;
  const isFirstStep = isFullWizardMode
    ? localIndex === 0
    : currentStepIndex === 0;

  const handleSlideChange = useCallback((index: number) => {
    setLocalIndex(index);
  }, []);

  const handleNext = useCallback(async () => {
    const stepIndex = isFullWizardMode ? localIndex : currentStepIndex;
    const stepToComplete = steps[stepIndex];
    if (stepToComplete) {
      await completeStep(stepToComplete.id);
    }

    if (isLastStep) {
      await completeTutorial();
    } else {
      nextStep();
      if (isFullWizardMode) {
        carouselRef.current?.next();
      }
    }
  }, [
    steps,
    localIndex,
    currentStepIndex,
    isLastStep,
    isFullWizardMode,
    completeStep,
    completeTutorial,
    nextStep,
  ]);

  const handlePrev = useCallback(() => {
    prevStep();
    if (isFullWizardMode) {
      carouselRef.current?.prev();
    }
  }, [prevStep, isFullWizardMode]);

  const handleSkip = useCallback(async () => {
    if (isPreviewMode) {
      endPreview();
    } else {
      await skipTutorial();
    }
  }, [skipTutorial, isPreviewMode, endPreview]);

  const handleClose = useCallback(() => {
    if (isPreviewMode) {
      endPreview();
    } else if (canDismiss) {
      skipTutorial();
    }
  }, [canDismiss, skipTutorial, isPreviewMode, endPreview]);

  const showPrompt =
    isFullWizardMode && showTutorial && !tutorialActive && steps.length > 0;
  const showWizard =
    tutorialActive &&
    wizardSteps.length > 0 &&
    (isFullWizardMode || isMixedModeWizardStep);

  if (showPrompt) {
    return (
      <Dialog onClose={handleClose} open={showPrompt}>
        <DialogBackdrop
          transition
          className="fixed inset-0 z-[1050] w-full bg-base-300 backdrop-blur-sm bg-opacity-30 transition-opacity data-[closed]:opacity-0"
        />
        <div className="fixed inset-0 z-[1050] w-screen overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-2 sm:p-0">
            <DialogPanel
              transition
              className="relative transform overflow-hidden rounded-xl text-left shadow-2xl w-full sm:my-8 sm:max-w-md border border-primary/30 bg-base-200 transition duration-300 ease-out data-[closed]:opacity-0 data-[closed]:scale-0"
            >
              <div className="p-4 sm:p-6">
                <h3 className="text-xl font-bold text-base-content mb-3">
                  <FormattedMessage
                    id="tutorial.ready.title"
                    defaultMessage="Interactive Tutorial"
                  />
                </h3>
                <p className="text-base-content/70 mb-6">
                  <FormattedMessage
                    id="tutorial.ready.description"
                    defaultMessage="We'll guide you through key features of {applicationTitle} with a quick tour."
                    values={{ applicationTitle }}
                  />
                </p>
                <div className="flex gap-3 justify-end">
                  {canDismiss && (
                    <Button
                      buttonType="ghost"
                      buttonSize="sm"
                      onClick={handleSkip}
                    >
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
            </DialogPanel>
          </div>
        </div>
      </Dialog>
    );
  }

  return (
    <Dialog onClose={handleClose} open={showWizard}>
      <DialogBackdrop
        transition
        className="fixed inset-0 z-[1050] w-full bg-black backdrop-blur-sm bg-opacity-30 transition-opacity data-[closed]:opacity-0"
      />
      <div className="fixed inset-0 z-[1050] w-screen overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-1 sm:p-0">
          <DialogPanel
            transition
            className="relative transform overflow-hidden rounded-xl text-left shadow-2xl w-full sm:my-8 sm:max-w-2xl border border-primary/30 bg-base-200 transition duration-300 ease-out data-[closed]:opacity-0 data-[closed]:scale-0"
          >
            {canDismiss && (
              <button
                type="button"
                onClick={handleClose}
                className="absolute top-1 right-1 z-10 btn hover:bg-zinc-700 p-1 btn-sm rounded-md"
              >
                <XMarkIcon className="h-5 w-5 text-base-content/70" />
                <span className="sr-only">
                  <FormattedMessage id="common.close" defaultMessage="Close" />
                </span>
              </button>
            )}
            <div className="min-h-[400px] sm:min-h-[450px] flex flex-col">
              {isFullWizardMode ? (
                <Carousel
                  ref={carouselRef}
                  showArrows={false}
                  onSlideChange={handleSlideChange}
                  initialSlide={currentStepIndex}
                  dotClassName="mb-6"
                  className="flex-1"
                >
                  {steps.map((step) => (
                    <TutorialStepSlide key={step.id} step={step} />
                  ))}
                </Carousel>
              ) : (
                wizardSteps[0] && <TutorialStepSlide step={wizardSteps[0]} />
              )}
            </div>
            <div className="px-6 pb-4 sm:px-8 sm:pb-6">
              {!isFullWizardMode && (
                <div className="text-center text-sm text-base-content/50 mb-4">
                  <FormattedMessage
                    id="tutorial.stepProgress"
                    defaultMessage="Step {current} of {total}"
                    values={{
                      current: currentStepIndex + 1,
                      total: steps.length,
                    }}
                  />
                </div>
              )}
              <div className="flex justify-between items-center">
                {!isFirstStep ? (
                  <Button
                    buttonType="ghost"
                    buttonSize="sm"
                    onClick={handlePrev}
                    className="gap-1"
                  >
                    <ChevronLeftIcon className="w-4 h-4 mr-2" />
                    <FormattedMessage
                      id="common.previous"
                      defaultMessage="Previous"
                    />
                  </Button>
                ) : (
                  <div />
                )}
                <div className="flex gap-2">
                  {canDismiss && !isLastStep && (
                    <Button
                      buttonType="ghost"
                      buttonSize="sm"
                      onClick={handleSkip}
                    >
                      <FormattedMessage
                        id="tutorial.skipTour"
                        defaultMessage="Skip Tour"
                      />
                    </Button>
                  )}
                  <Button
                    buttonType="primary"
                    buttonSize="sm"
                    onClick={handleNext}
                  >
                    {isLastStep ? (
                      <FormattedMessage
                        id="common.finish"
                        defaultMessage="Finish"
                      />
                    ) : (
                      <>
                        <FormattedMessage
                          id="common.next"
                          defaultMessage="Next"
                        />
                        <ChevronRightIcon className="w-4 h-4 ml-1" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </DialogPanel>
        </div>
        {isPreviewMode && (
          <Badge
            badgeType="warning"
            className="fixed top-4 left-4 z-[1051] px-3 py-1.5 border border-warning bg-warning/30"
          >
            <FormattedMessage
              id="settings.onboarding.previewMode"
              defaultMessage="Preview Mode"
            />
          </Badge>
        )}
      </div>
    </Dialog>
  );
};

export default TutorialWizard;
