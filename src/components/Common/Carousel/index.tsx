'use client';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import React, {
  useCallback,
  useEffect,
  useImperativeHandle,
  useState,
  forwardRef,
} from 'react';

export interface CarouselHandle {
  goTo: (index: number) => void;
  next: () => void;
  prev: () => void;
  getCurrentIndex: () => number;
}

interface CarouselProps {
  children: React.ReactNode[];
  showDots?: boolean;
  showArrows?: boolean;
  autoPlay?: boolean;
  autoPlayInterval?: number;
  onSlideChange?: (index: number) => void;
  initialSlide?: number;
  className?: string;
  dotClassName?: string;
  arrowClassName?: string;
  progressDots?: boolean;
  clickableDots?: boolean;
  fillHeight?: boolean;
}

/**
 * Reusable carousel component with navigation controls
 * Supports touch swipe, keyboard navigation, and autoplay
 */
const Carousel = forwardRef<CarouselHandle, CarouselProps>(
  (
    {
      children,
      showDots = true,
      showArrows = true,
      autoPlay = false,
      autoPlayInterval = 5000,
      onSlideChange,
      initialSlide = 0,
      className = '',
      dotClassName = '',
      arrowClassName = '',
      progressDots = true,
      clickableDots = true,
      fillHeight = true,
    },
    ref
  ) => {
    const [currentIndex, setCurrentIndex] = useState(initialSlide);
    const totalSlides = React.Children.count(children);

    // Expose imperative methods
    useImperativeHandle(
      ref,
      () => ({
        goTo: (index: number) => {
          if (index >= 0 && index < totalSlides) {
            setCurrentIndex(index);
          }
        },
        next: () => {
          setCurrentIndex((prev) => (prev < totalSlides - 1 ? prev + 1 : prev));
        },
        prev: () => {
          setCurrentIndex((prev) => (prev > 0 ? prev - 1 : prev));
        },
        getCurrentIndex: () => currentIndex,
      }),
      [currentIndex, totalSlides]
    );

    // Notify parent of slide changes
    useEffect(() => {
      onSlideChange?.(currentIndex);
    }, [currentIndex, onSlideChange]);

    // Autoplay
    useEffect(() => {
      if (!autoPlay || totalSlides <= 1) return;

      const timer = setInterval(() => {
        setCurrentIndex((prev) => (prev < totalSlides - 1 ? prev + 1 : 0));
      }, autoPlayInterval);

      return () => clearInterval(timer);
    }, [autoPlay, autoPlayInterval, totalSlides]);

    // Keyboard navigation
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'ArrowLeft') {
          setCurrentIndex((prev) => (prev > 0 ? prev - 1 : prev));
        } else if (e.key === 'ArrowRight') {
          setCurrentIndex((prev) => (prev < totalSlides - 1 ? prev + 1 : prev));
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, [totalSlides]);

    const goToSlide = useCallback((index: number) => {
      setCurrentIndex(index);
    }, []);

    const nextSlide = useCallback(() => {
      setCurrentIndex((prev) => (prev < totalSlides - 1 ? prev + 1 : prev));
    }, [totalSlides]);

    const prevSlide = useCallback(() => {
      setCurrentIndex((prev) => (prev > 0 ? prev - 1 : prev));
    }, []);

    // Touch handling for swipe
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);

    const minSwipeDistance = 50;

    const onTouchStart = useCallback((e: React.TouchEvent) => {
      setTouchEnd(null);
      setTouchStart(e.targetTouches[0].clientX);
    }, []);

    const onTouchMove = useCallback((e: React.TouchEvent) => {
      setTouchEnd(e.targetTouches[0].clientX);
    }, []);

    const onTouchEnd = useCallback(() => {
      if (!touchStart || !touchEnd) return;

      const distance = touchStart - touchEnd;
      const isLeftSwipe = distance > minSwipeDistance;
      const isRightSwipe = distance < -minSwipeDistance;

      if (isLeftSwipe) {
        nextSlide();
      } else if (isRightSwipe) {
        prevSlide();
      }
    }, [touchStart, touchEnd, nextSlide, prevSlide]);

    if (totalSlides === 0) {
      return null;
    }

    const childArray = React.Children.toArray(children);

    return (
      <div
        className={`relative ${fillHeight ? 'h-full flex flex-col' : ''} ${className}`}
      >
        <div
          className={`overflow-hidden ${fillHeight ? 'flex-1' : ''}`}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <div
            className={`flex transition-transform duration-300 ease-out ${fillHeight ? 'h-full' : ''}`}
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {childArray.map((child, index) => (
              <div
                key={index}
                className={`w-full flex-shrink-0 ${fillHeight ? 'h-full' : ''}`}
              >
                {child}
              </div>
            ))}
          </div>
        </div>
        {showArrows && totalSlides > 1 && (
          <>
            <button
              onClick={prevSlide}
              disabled={currentIndex === 0}
              className={`group absolute left-0 top-1/2 -translate-y-1/2 px-4 h-full disabled:cursor-not-allowed ${arrowClassName}`}
              aria-label="Previous slide"
            >
              <span className="absolute inset-0 bg-gradient-to-l to-base-300 from-transparent opacity-0 group-hover:opacity-100 group-disabled:!opacity-0 transition-opacity duration-200" />
              <ChevronLeftIcon className="relative w-5 h-5" />
            </button>
            <button
              onClick={nextSlide}
              disabled={currentIndex === totalSlides - 1}
              className={`group absolute right-0 top-1/2 -translate-y-1/2 px-4 h-full disabled:cursor-not-allowed ${arrowClassName}`}
              aria-label="Next slide"
            >
              <span className="absolute inset-0 bg-gradient-to-r to-base-300 from-transparent opacity-0 group-hover:opacity-100 group-disabled:!opacity-0 transition-opacity duration-200" />
              <ChevronRightIcon className="relative w-5 h-5" />
            </button>
          </>
        )}
        {showDots && totalSlides > 1 && (
          <div className={`flex justify-center gap-2 mt-4 ${dotClassName}`}>
            {childArray.map((_, index) => {
              const dotClasses = `transition-all duration-200 rounded-full ${
                index === currentIndex
                  ? 'bg-primary w-6 h-2.5'
                  : progressDots && index < currentIndex
                    ? 'bg-primary/50 hover:bg-primary/70 w-2.5 h-2.5'
                    : clickableDots
                      ? 'bg-base-content/30 hover:bg-base-content/50 w-2.5 h-2.5'
                      : 'bg-base-content/30 w-2.5 h-2.5'
              }`;
              if (clickableDots) {
                return (
                  <button
                    key={index}
                    onClick={() => goToSlide(index)}
                    className={dotClasses}
                    aria-label={`Go to slide ${index + 1}`}
                    aria-current={index === currentIndex ? 'true' : 'false'}
                  />
                );
              }
              return (
                <div
                  key={index}
                  className={dotClasses}
                  aria-label={`Slide ${index + 1}`}
                />
              );
            })}
          </div>
        )}
      </div>
    );
  }
);

Carousel.displayName = 'Carousel';

export default Carousel;
