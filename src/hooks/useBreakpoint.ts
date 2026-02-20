'use client';
import { useState, useEffect, useCallback } from 'react';

export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

export type BreakpointKey = keyof typeof BREAKPOINTS;

export type LayoutContext = 'mobile' | 'tablet' | 'desktop';

interface BreakpointState {
  width: number;
  layout: LayoutContext;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}

export const useBreakpoint = (): BreakpointState => {
  const getState = useCallback((): BreakpointState => {
    if (typeof window === 'undefined') {
      return {
        width: BREAKPOINTS.lg,
        layout: 'desktop',
        isMobile: false,
        isTablet: false,
        isDesktop: true,
      };
    }

    const width = window.innerWidth;
    let layout: LayoutContext;

    if (width < BREAKPOINTS.sm) {
      layout = 'mobile';
    } else if (width < BREAKPOINTS.lg) {
      layout = 'tablet';
    } else {
      layout = 'desktop';
    }

    return {
      width,
      layout,
      isMobile: layout === 'mobile',
      isTablet: layout === 'tablet',
      isDesktop: layout === 'desktop',
    };
  }, []);

  const [state, setState] = useState<BreakpointState>(getState);

  useEffect(() => {
    let rafId: number | null = null;

    const handleResize = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        setState(getState());
        rafId = null;
      });
    };

    window.addEventListener('resize', handleResize);
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handleResize);
    };
  }, [getState]);

  return state;
};

export const getMobileNavHeight = (): number => {
  const mobileNav = document.querySelector(
    '[data-tutorial="mobile-nav"]'
  ) as HTMLElement | null;
  if (mobileNav) {
    const height = mobileNav.offsetHeight;
    if (height > 0) return height;
  }

  const iframes = document.querySelectorAll('iframe');
  for (const iframe of iframes) {
    try {
      const iframeDoc = (iframe as HTMLIFrameElement).contentDocument;
      if (iframeDoc) {
        const iframeMobileNav = iframeDoc.querySelector(
          '[data-tutorial="mobile-nav"]'
        ) as HTMLElement | null;
        if (iframeMobileNav) {
          const height = iframeMobileNav.offsetHeight;
          if (height > 0) {
            return height;
          }
        }
      }
    } catch {
      // Cross-origin, skip
    }
  }

  return 0;
};

export default useBreakpoint;
