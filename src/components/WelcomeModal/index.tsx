'use client';
import Badge from '@app/components/Common/Badge';
import Button from '@app/components/Common/Button';
import Carousel, { type CarouselHandle } from '@app/components/Common/Carousel';
import { useOnboardingContext } from '@app/context/OnboardingContext';
import type { AdminWelcomeSlide } from '@app/utils/adminOnboarding';
import { Dialog, DialogBackdrop, DialogPanel } from '@headlessui/react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { XMarkIcon } from '@heroicons/react/24/solid';
import React, { useCallback, useRef, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import WelcomeSlide from './WelcomeSlide';

const WelcomeModal: React.FC = () => {
  const {
    showWelcome,
    completeWelcome,
    dismissWelcome,
    isPreviewMode,
    endPreview,
    allowSkipWelcome,
    canAlwaysSkip,
    showAdminWelcome,
    welcomeContent,
  } = useOnboardingContext();

  const carouselRef = useRef<CarouselHandle>(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  const canDismiss =
    (allowSkipWelcome ?? true) || isPreviewMode || canAlwaysSkip;

  const handleSlideChange = useCallback((index: number) => {
    setCurrentSlide(index);
  }, []);

  const handleNext = useCallback(() => {
    if (currentSlide < welcomeContent.length - 1) {
      carouselRef.current?.next();
    } else {
      completeWelcome();
    }
  }, [currentSlide, welcomeContent.length, completeWelcome]);

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

  const isLastSlide = currentSlide === welcomeContent.length - 1;

  if (welcomeContent.length === 0) {
    return null;
  }

  return (
    <Dialog onClose={handleClose} open={showWelcome}>
      <DialogBackdrop
        transition
        className="bg-base-300/30 fixed inset-0 z-1050 w-full backdrop-blur-sm transition-opacity duration-300 ease-out data-closed:opacity-0"
      />
      <div className="fixed inset-0 z-1050 w-screen overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-1 sm:p-0">
          <DialogPanel
            transition
            className="border-primary/30 bg-base-200 relative w-full transform overflow-hidden rounded-xl border text-left shadow-2xl transition duration-300 ease-out data-closed:scale-0 data-closed:opacity-0 sm:my-8 sm:max-w-2xl"
          >
            {canDismiss && !showAdminWelcome && (
              <button
                type="button"
                onClick={handleClose}
                className="btn btn-sm absolute top-1 right-1 z-10 rounded-md p-1 hover:bg-zinc-700"
              >
                <XMarkIcon className="text-base-content/70 h-5 w-5" />
                <span className="sr-only">
                  <FormattedMessage id="common.close" defaultMessage="Close" />
                </span>
              </button>
            )}
            <div className="flex min-h-100 flex-col sm:min-h-112.5">
              <Carousel
                ref={carouselRef}
                showArrows={false}
                onSlideChange={handleSlideChange}
                dotClassName="mb-6"
                className="flex-1"
              >
                {welcomeContent.map((slide) => (
                  <div key={slide.id} className="h-full p-6 sm:p-8">
                    <WelcomeSlide
                      content={slide}
                      icon={(slide as AdminWelcomeSlide).icon}
                    />
                  </div>
                ))}
              </Carousel>
            </div>
            <div className="px-6 pb-4 sm:px-8 sm:pb-6">
              <div className="flex items-center justify-between">
                <div>
                  {currentSlide > 0 && (
                    <Button
                      buttonSize="sm"
                      buttonType="ghost"
                      onClick={handlePrev}
                    >
                      <ChevronLeftIcon className="mr-2 h-4 w-4" />
                      <FormattedMessage
                        id="common.previous"
                        defaultMessage="Previous"
                      />
                    </Button>
                  )}
                </div>
                <div className="flex gap-3">
                  {canDismiss && !isLastSlide && (
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
                        <ChevronRightIcon className="ml-2 h-4 w-4" />
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
            className="border-warning bg-warning/30 fixed top-4 left-4 z-1051 border px-3 py-1.5"
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
