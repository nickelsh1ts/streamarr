'use client';
import Button from '@app/components/Common/Button';
import CachedImage from '@app/components/Common/CachedImage';
import ContentRenderer from '@app/components/Common/ContentRenderer';
import YouTubeEmbed from '@app/components/Common/YouTubeEmbed';
import { useBreakpoint, getMobileNavHeight } from '@app/hooks/useBreakpoint';
import type { TutorialStepResponse } from '@server/interfaces/api/onboardingInterfaces';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { FormattedMessage } from 'react-intl';

interface TutorialTooltipProps {
  step: TutorialStepResponse;
  targetRect: DOMRect | null;
  currentIndex: number;
  totalSteps: number;
  onNext: () => void;
  onPrev: () => void;
  onSkip?: () => void;
  isFirst: boolean;
  isLast: boolean;
}

type ComputedPosition = 'top' | 'bottom' | 'left' | 'right';

const TutorialTooltip: React.FC<TutorialTooltipProps> = ({
  step,
  targetRect,
  currentIndex,
  totalSteps,
  onNext,
  onPrev,
  onSkip,
  isFirst,
  isLast,
}) => {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const { isMobile, layout } = useBreakpoint();
  const [computedPosition, setComputedPosition] =
    useState<ComputedPosition>('bottom');
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({
    position: 'fixed',
    bottom: '16px',
    left: '16px',
    right: '16px',
    margin: '0 auto',
    width: 'fit-content',
  });
  // Arrow offset as percentage (0-100) along the edge pointing to target center
  const [arrowOffset, setArrowOffset] = useState(50);
  // Track if we're currently calculating to prevent loops
  const isCalculatingRef = useRef(false);
  // Store calculatePosition in ref to avoid re-creating ResizeObserver
  const calculatePositionRef = useRef<() => void>(() => {});

  // Position calculation function
  const calculatePosition = useCallback(() => {
    // Prevent re-entrant calls
    if (isCalculatingRef.current) return;
    isCalculatingRef.current = true;

    try {
      // Get mobile nav height for bottom padding on mobile
      const mobileNavHeight = isMobile ? getMobileNavHeight() : 0;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const gap = 16;
      // Effective viewport height accounting for mobile nav
      const effectiveViewportHeight = viewportHeight - mobileNavHeight;

      if (!targetRect || !tooltipRef.current) {
        // No target - position tooltip just above the mobile nav
        // On mobile, sit just above the mobile nav bar
        if (isMobile && mobileNavHeight > 0) {
          // Position at bottom of effective viewport, just above mobile nav
          setTooltipStyle({
            position: 'fixed',
            top: 'auto',
            bottom: `${mobileNavHeight + gap}px`,
            left: `${gap}px`,
            right: `${gap}px`,
            margin: '0 auto',
            width: 'fit-content',
            maxWidth: `calc(100vw - ${gap * 2}px)`,
            height: undefined,
          });
        } else {
          // On desktop/tablet, center in viewport
          setTooltipStyle({
            position: 'fixed',
            top: `${gap}px`,
            bottom: `${gap}px`,
            left: `${gap}px`,
            right: `${gap}px`,
            margin: 'auto',
            width: 'fit-content',
            height: 'fit-content',
          });
        }
        setArrowOffset(50);
        setComputedPosition('bottom'); // Default, but arrow won't show without targetRect
        return;
      }

      const tooltipRect = tooltipRef.current.getBoundingClientRect();

      // Check if target is within the mobile nav area
      const targetInMobileNav =
        isMobile && targetRect.bottom > effectiveViewportHeight;

      // Determine position preference
      const stepPosition = step.tooltipPosition;
      let position: ComputedPosition;

      // On mobile with target in bottom nav, ALWAYS use 'top' position
      // This overrides any explicit tooltipPosition to prevent tooltip from going under the nav
      if (targetInMobileNav) {
        position = 'top';
      } else if (!stepPosition || stepPosition === 'auto') {
        // Calculate available space in each direction
        const spaceTop = targetRect.top;
        // Account for mobile nav when calculating bottom space
        const spaceBottom = effectiveViewportHeight - targetRect.bottom;
        const spaceLeft = targetRect.left;
        const spaceRight = viewportWidth - targetRect.right;

        // Choose position with most space
        const spaces: Record<ComputedPosition, number> = {
          top: spaceTop,
          bottom: spaceBottom,
          left: spaceLeft,
          right: spaceRight,
        };

        position = (Object.keys(spaces) as ComputedPosition[]).reduce(
          (best, current) => (spaces[current] > spaces[best] ? current : best),
          'bottom' as ComputedPosition
        );
      } else {
        position = stepPosition as ComputedPosition;
      }

      // Calculate tooltip position
      let top = 0;
      let left = 0;

      switch (position) {
        case 'top':
          top = targetRect.top - tooltipRect.height - gap;
          left = targetRect.left + targetRect.width / 2 - tooltipRect.width / 2;
          break;
        case 'bottom':
          top = targetRect.bottom + gap;
          left = targetRect.left + targetRect.width / 2 - tooltipRect.width / 2;
          break;
        case 'left':
          top = targetRect.top + targetRect.height / 2 - tooltipRect.height / 2;
          left = targetRect.left - tooltipRect.width - gap;
          break;
        case 'right':
          top = targetRect.top + targetRect.height / 2 - tooltipRect.height / 2;
          left = targetRect.right + gap;
          break;
      }

      // Clamp to viewport bounds (account for mobile nav at bottom)
      left = Math.max(
        gap,
        Math.min(left, viewportWidth - tooltipRect.width - gap)
      );
      top = Math.max(
        gap,
        Math.min(top, effectiveViewportHeight - tooltipRect.height - gap)
      );

      // Calculate arrow offset based on target center relative to tooltip
      const targetCenterX = targetRect.left + targetRect.width / 2;
      const targetCenterY = targetRect.top + targetRect.height / 2;
      let offset = 50;

      if (position === 'top' || position === 'bottom') {
        // Arrow moves horizontally - calculate where target center falls on tooltip width
        const relativeX = targetCenterX - left;
        offset = Math.max(
          10,
          Math.min(90, (relativeX / tooltipRect.width) * 100)
        );
      } else {
        // Arrow moves vertically - calculate where target center falls on tooltip height
        const relativeY = targetCenterY - top;
        offset = Math.max(
          10,
          Math.min(90, (relativeY / tooltipRect.height) * 100)
        );
      }

      setArrowOffset(offset);
      setComputedPosition(position);
      setTooltipStyle({
        position: 'fixed',
        top: `${top}px`,
        left: `${left}px`,
        // Clear properties used in no-target centering mode
        bottom: 'auto',
        right: 'auto',
        margin: undefined,
        width: undefined,
        maxWidth: undefined,
        height: undefined,
      });
    } finally {
      isCalculatingRef.current = false;
    }
  }, [targetRect, step.tooltipPosition, isMobile]);

  // Keep ref in sync with latest calculatePosition
  calculatePositionRef.current = calculatePosition;

  // Recalculate position when targetRect, step, or layout changes
  useEffect(() => {
    // Use RAF to ensure we measure after DOM has painted
    const rafId = requestAnimationFrame(() => {
      calculatePositionRef.current();
    });
    return () => cancelAnimationFrame(rafId);
  }, [targetRect, step.id, layout]);

  // Watch for tooltip size changes and recalculate position
  // Use empty deps to only set up observer once per mount
  useEffect(() => {
    if (!tooltipRef.current) return;

    let rafId: number | null = null;
    const observer = new ResizeObserver(() => {
      // Debounce with RAF to prevent infinite loops
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        calculatePositionRef.current();
        rafId = null;
      });
    });

    observer.observe(tooltipRef.current);
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      observer.disconnect();
    };
  }, []);

  // Watch for iframe load events and mobile nav appearing
  // This handles the /watch route where mobile nav is portaled into iframe
  useEffect(() => {
    const iframeMutationObservers: MutationObserver[] = [];
    const iframeListeners: HTMLIFrameElement[] = [];
    let recalcTimeoutId: ReturnType<typeof setTimeout> | null = null;

    const scheduleRecalculation = () => {
      if (recalcTimeoutId) clearTimeout(recalcTimeoutId);
      recalcTimeoutId = setTimeout(() => calculatePositionRef.current(), 200);
    };

    const setupIframeObserver = (iframeEl: HTMLIFrameElement) => {
      try {
        const iframeDoc = iframeEl.contentDocument;
        if (iframeDoc?.body) {
          const observer = new MutationObserver(() => {
            const mobileNav = iframeDoc.querySelector(
              '[data-tutorial="mobile-nav"]'
            );
            if (mobileNav && (mobileNav as HTMLElement).offsetHeight > 0) {
              calculatePositionRef.current();
            }
          });
          observer.observe(iframeDoc.body, { childList: true, subtree: true });
          iframeMutationObservers.push(observer);
        }
      } catch {
        // Cross-origin, skip
      }
    };

    const handleIframeLoad = (e: Event) => {
      setupIframeObserver(e.target as HTMLIFrameElement);
      scheduleRecalculation();
    };

    const iframes = document.querySelectorAll('iframe');
    for (const iframe of iframes) {
      const iframeEl = iframe as HTMLIFrameElement;
      iframeEl.addEventListener('load', handleIframeLoad);
      iframeListeners.push(iframeEl);
      if (iframeEl.contentDocument?.readyState === 'complete') {
        setupIframeObserver(iframeEl);
        scheduleRecalculation();
      }
    }

    // Watch for dynamically added iframes
    const mainObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node instanceof HTMLIFrameElement) {
            node.addEventListener('load', handleIframeLoad);
            iframeListeners.push(node);
          }
        }
      }
    });
    mainObserver.observe(document.body, { childList: true, subtree: true });

    return () => {
      if (recalcTimeoutId) clearTimeout(recalcTimeoutId);
      iframeListeners.forEach((el) =>
        el.removeEventListener('load', handleIframeLoad)
      );
      iframeMutationObservers.forEach((obs) => obs.disconnect());
      mainObserver.disconnect();
    };
  }, []);

  // Arrow style with dynamic positioning
  const arrowStyle = useMemo((): React.CSSProperties => {
    if (!targetRect) return { display: 'none' };

    const size = 12;
    const offset = size / 2;
    const borderStyle = '1px solid rgba(168, 85, 247, 0.5)';

    const baseStyle: React.CSSProperties = {
      position: 'absolute',
      width: size,
      height: size,
      transform: 'rotate(45deg)',
    };

    const positionStyles: Record<ComputedPosition, React.CSSProperties> = {
      top: {
        top: '100%',
        left: `${arrowOffset}%`,
        marginTop: -offset,
        marginLeft: -offset,
        borderRight: borderStyle,
        borderBottom: borderStyle,
      },
      bottom: {
        bottom: '100%',
        left: `${arrowOffset}%`,
        marginBottom: -offset,
        marginLeft: -offset,
        borderLeft: borderStyle,
        borderTop: borderStyle,
      },
      left: {
        left: '100%',
        top: `${arrowOffset}%`,
        marginLeft: -offset,
        marginTop: -offset,
        borderTop: borderStyle,
        borderRight: borderStyle,
      },
      right: {
        right: '100%',
        top: `${arrowOffset}%`,
        marginRight: -offset,
        marginTop: -offset,
        borderBottom: borderStyle,
        borderLeft: borderStyle,
      },
    };

    return { ...baseStyle, ...positionStyles[computedPosition] };
  }, [computedPosition, targetRect, arrowOffset]);

  return (
    <div
      ref={tooltipRef}
      className="z-[1150] bg-base-200 rounded-xl shadow-2xl border border-primary/30 p-5 max-w-sm animate-scale-in"
      style={tooltipStyle}
    >
      <div className="bg-base-200" style={arrowStyle} />
      <div className="text-xs text-base-content/50 mb-2">
        <FormattedMessage
          id="tutorial.stepProgress"
          defaultMessage="Step {current} of {total}"
          values={{ current: currentIndex + 1, total: totalSteps }}
        />
      </div>
      <h4 className="text-lg font-semibold text-base-content mb-2">
        {step.title}
      </h4>
      <p className="text-base-content/70 text-sm mb-4 leading-relaxed">
        {step.description}
      </p>
      {step.imageUrl && (
        <div className="relative mb-4 h-32">
          <CachedImage
            src={step.imageUrl}
            alt={step.title}
            fill
            sizes="320px"
            className="rounded-lg object-contain"
          />
        </div>
      )}
      {step.videoUrl && (
        <div className="mb-4">
          <YouTubeEmbed
            url={step.videoUrl}
            title={step.title}
            autoplay={step.videoAutoplay}
            className="w-full"
          />
        </div>
      )}
      {step.customHtml && (
        <div className="mb-4">
          <ContentRenderer html={step.customHtml} className="text-sm" />
        </div>
      )}
      <div className="flex justify-between items-center gap-3">
        <div>
          {!isFirst && (
            <Button
              buttonType="ghost"
              buttonSize="sm"
              onClick={onPrev}
              className="flex items-center gap-1"
            >
              <ChevronLeftIcon className="h-4 w-4" />
              <FormattedMessage id="common.back" defaultMessage="Back" />
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          {onSkip && !isLast && (
            <Button buttonType="ghost" buttonSize="sm" onClick={onSkip}>
              <FormattedMessage id="common.skip" defaultMessage="Skip" />
            </Button>
          )}
          <Button
            buttonType="primary"
            buttonSize="sm"
            onClick={onNext}
            className="flex items-center gap-1"
          >
            {isLast ? (
              <FormattedMessage id="common.finish" defaultMessage="Finish" />
            ) : (
              <>
                <FormattedMessage id="common.next" defaultMessage="Next" />
                <ChevronRightIcon className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TutorialTooltip;
