'use client';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

const PullToRefresh = () => {
  const router = useRouter();

  const [pullStartPoint, setPullStartPoint] = useState(0);
  const [pullChange, setPullChange] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const refreshDiv = useRef<HTMLDivElement>(null);

  // Various pull down thresholds that determine icon location
  const pullDownInitThreshold = pullChange > 20;
  const pullDownStopThreshold = 120;
  const pullDownReloadThreshold = pullChange > 340;
  const pullDownIconLocation = pullChange / 3;

  useEffect(() => {
    // Reload function that is called when reload threshold has been hit
    // Add loading class to determine when to add spin animation
    const forceReload = () => {
      setIsLoading(true);
      refreshDiv.current?.classList.add('loading');
      setTimeout(() => {
        location.reload();
      }, 1000);
    };

    const html = document.querySelector('html');

    // Determines if we are at the top of the page
    // Locks or unlocks page when pulling down to refresh
    const pullStart = (e: TouchEvent) => {
      setPullStartPoint(e.targetTouches[0].screenY);

      if (window.scrollY === 0 && window.scrollX === 0) {
        refreshDiv.current?.classList.add('block');
        refreshDiv.current?.classList.remove('hidden');
        document.body.style.touchAction = 'none';
        document.body.style.overscrollBehavior = 'none';
        if (html) {
          html.style.overscrollBehaviorY = 'none';
        }
      } else {
        refreshDiv.current?.classList.remove('block');
        refreshDiv.current?.classList.add('hidden');
      }
    };

    // Tracks how far we have pulled down the refresh icon
    const pullDown = async (e: TouchEvent) => {
      const screenY = e.targetTouches[0].screenY;

      const pullLength =
        pullStartPoint < screenY ? Math.abs(screenY - pullStartPoint) : 0;

      setPullChange(pullLength);
    };

    // Will reload the page if we are past the threshold
    // Otherwise, we reset the pull
    const pullFinish = () => {
      setPullStartPoint(0);

      if (pullDownReloadThreshold) {
        forceReload();
      } else {
        setPullChange(0);
      }

      document.body.style.touchAction = 'auto';
      document.body.style.overscrollBehaviorY = 'auto';
      if (html) {
        html.style.overscrollBehaviorY = 'auto';
      }
    };

    window.addEventListener('touchstart', pullStart, { passive: false });
    window.addEventListener('touchmove', pullDown, { passive: false });
    window.addEventListener('touchend', pullFinish, { passive: false });

    return () => {
      window.removeEventListener('touchstart', pullStart);
      window.removeEventListener('touchmove', pullDown);
      window.removeEventListener('touchend', pullFinish);
    };
  }, [pullDownInitThreshold, pullDownReloadThreshold, pullStartPoint, router]);

  return (
    <div
      ref={refreshDiv}
      className="pointer-events-none absolute top-0 right-0 left-0 z-50 m-auto w-fit transition-all ease-out"
      id="refreshIcon"
      style={{
        top:
          pullDownIconLocation < pullDownStopThreshold && pullDownInitThreshold
            ? pullDownIconLocation
            : pullDownInitThreshold
              ? pullDownStopThreshold
              : '',
      }}
    >
      <div
        className={`${
          isLoading && 'animate-spin'
        } border-primary bg-secondary relative -top-24 h-9 w-9 rounded-full border-2 p-1 shadow-md ring-1 shadow-black ring-zinc-700`}
        style={{ animationDirection: 'reverse' }}
      >
        <ArrowPathIcon
          className={`-scale-x-100 rounded-full ${
            pullDownReloadThreshold && 'rotate-180'
          } text-white-500 transition-all duration-500`}
        />
      </div>
    </div>
  );
};

export default PullToRefresh;
