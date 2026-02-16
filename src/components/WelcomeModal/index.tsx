'use client';
import Button from '@app/components/Common/Button';
import Carousel, { type CarouselHandle } from '@app/components/Common/Carousel';
import { useOnboardingContext } from '@app/context/OnboardingContext';
import { Dialog, DialogBackdrop, DialogPanel } from '@headlessui/react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { XMarkIcon } from '@heroicons/react/24/solid';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import WelcomeSlide from './WelcomeSlide';
import Badge from '@app/components/Common/Badge';

const WelcomeModal: React.FC = () => {
  const {
    showWelcome,
    data,
    completeWelcome,
    dismissWelcome,
    isPreviewMode,
    endPreview,
  } = useOnboardingContext();

  const carouselRef = useRef<CarouselHandle>(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = useMemo(() => data?.welcomeContent ?? [], [data]);
  const canDismiss = (data?.settings.allowSkipWelcome ?? true) || isPreviewMode;

  const handleSlideChange = useCallback((index: number) => {
    setCurrentSlide(index);
  }, []);

  const handleNext = useCallback(() => {
    if (currentSlide < slides.length - 1) {
      carouselRef.current?.next();
    } else {
      completeWelcome();
    }
  }, [currentSlide, slides.length, completeWelcome]);

  const handlePrev = useCallback(() => {
    carouselRef.current?.prev();
  }, []);

  const handleClose = useCallback(() => {
    if (isPreviewMode) {
      endPreview();
      return;
    }
    if (canDismiss) {
      dismissWelcome();
    }
  }, [canDismiss, dismissWelcome, isPreviewMode, endPreview]);

  const isLastSlide = currentSlide === slides.length - 1;

  if (slides.length === 0) {
    return null;
  }

  return (
    <Dialog onClose={handleClose} open={showWelcome}>
      <DialogBackdrop
        transition
        className="fixed inset-0 z-[1050] w-full bg-base-300 backdrop-blur-sm bg-opacity-30 transition-opacity data-[closed]:opacity-0"
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
              <Carousel
                ref={carouselRef}
                showArrows={false}
                onSlideChange={handleSlideChange}
                dotClassName="mb-6"
                className="flex-1"
              >
                {slides.map((slide) => (
                  <div key={slide.id} className="p-6 sm:p-8 h-full">
                    <WelcomeSlide content={slide} />
                  </div>
                ))}
              </Carousel>
            </div>
            <div className="px-6 pb-4 sm:px-8 sm:pb-6">
              <div className="flex justify-between items-center">
                <div>
                  {currentSlide > 0 && (
                    <Button
                      buttonSize="sm"
                      buttonType="ghost"
                      onClick={handlePrev}
                    >
                      <ChevronLeftIcon className="h-4 w-4 mr-2" />
                      <FormattedMessage
                        id="common.previous"
                        defaultMessage="Previous"
                      />
                    </Button>
                  )}
                </div>
                <div className="flex gap-3">
                  {canDismiss && (
                    <Button
                      buttonSize="sm"
                      buttonType="ghost"
                      onClick={handleClose}
                    >
                      <FormattedMessage
                        id="common.skip"
                        defaultMessage="Skip"
                      />
                    </Button>
                  )}
                  <Button
                    buttonSize="sm"
                    buttonType="primary"
                    onClick={handleNext}
                    className="flex items-center gap-2"
                  >
                    {isLastSlide ? (
                      <FormattedMessage
                        id="welcome.getStarted"
                        defaultMessage="Get Started"
                      />
                    ) : (
                      <>
                        <FormattedMessage
                          id="common.next"
                          defaultMessage="Next"
                        />
                        <ChevronRightIcon className="h-4 w-4 ml-2" />
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

export default WelcomeModal;
