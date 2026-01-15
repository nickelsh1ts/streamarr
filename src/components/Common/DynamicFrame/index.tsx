'use client';
import LoadingEllipsis from '@app/components/Common/LoadingEllipsis';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { setIframeTheme } from '@app/utils/themeUtils';
import { colord } from 'colord';
import type { Theme } from '@server/lib/settings';

// Type for Navigation API (not yet in standard TypeScript lib)
interface NavigationDestination {
  url: string;
}

interface NavigateEvent extends Event {
  destination: NavigationDestination;
}

interface Navigation extends EventTarget {
  addEventListener(
    type: 'navigate',
    callback: (event: NavigateEvent) => void
  ): void;
  removeEventListener(
    type: 'navigate',
    callback: (event: NavigateEvent) => void
  ): void;
}

interface WindowWithNavigation extends Window {
  navigation?: Navigation;
}

interface DynamicFrameProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  children?: any;
  title?: string;
  basePath?: string;
  newBase?: string;
  domainURL?: string;
  theme?: Theme | null;
}

const DynamicFrame = ({
  children,
  title,
  basePath,
  newBase,
  domainURL,
  theme,
  ...props
}: DynamicFrameProps) => {
  const pathname = usePathname();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [mountNode, setMountNode] = useState<HTMLElement | null>(null);
  const [innerFrame, setInnerFrame] = useState<WindowWithNavigation | null>(
    null
  );
  const [loadingIframe, setLoadingIframe] = useState(true);

  // Track the current iframe path to avoid unnecessary updates
  const currentIframePathRef = useRef<string>('');

  // Calculate the sub-path (path after the newBase)
  // Only extract subPath if pathname actually starts with newBase, otherwise use empty string
  const subPath = useMemo(() => {
    if (!pathname || !newBase) return '';
    // Check if the current pathname starts with this iframe's newBase
    if (pathname.startsWith(newBase)) {
      return pathname.slice(newBase.length) || '';
    }
    // If pathname doesn't match this iframe's route, return empty (load service root)
    return '';
  }, [pathname, newBase]);

  // Calculate iframe src - only compute once on mount
  const iframeSrc = useMemo(() => {
    if (!domainURL || !basePath) return '';
    return `${domainURL}${basePath}${subPath}`;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [domainURL, basePath]); // Intentionally exclude subPath to only compute initial src

  // Handle iframe load event
  const handleIframeLoad = useCallback(() => {
    const iframe = iframeRef.current;
    if (iframe?.contentWindow?.document?.body) {
      setMountNode(iframe.contentWindow.document.body);
      setInnerFrame(iframe.contentWindow as WindowWithNavigation);
    }
    setTimeout(() => setLoadingIframe(false), 300);
  }, []);

  useEffect(() => {
    if (mountNode && theme) {
      const theTheme = theme as Theme;
      const hexToRgb = (hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result
          ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
          : '0,0,0';
      };
      mountNode.style.setProperty(
        '--color-background-accent',
        theTheme.primary,
        'important'
      );
      mountNode.style.setProperty(
        '--accent-color',
        colord(theTheme.primary)
          .toRgbString()
          .replace('rgb(', '')
          .replace(')', ''),
        'important'
      );
      mountNode.style.setProperty(
        '--color-brand-accent',
        theTheme.secondary,
        'important'
      );
      mountNode.style.setProperty(
        '--bs-primary',
        theTheme.primary,
        'important'
      );
      mountNode.style.setProperty(
        '--color-background-accent-focus',
        theTheme.secondary,
        'important'
      );
      mountNode.style.setProperty(
        '--color-text-accent',
        theTheme.secondary,
        'important'
      );
      mountNode.style.setProperty(
        '--main-bg-color',
        theTheme['base-300'],
        'important'
      );
      mountNode.style.setProperty(
        '--modal-bg-color',
        theTheme['base-100'],
        'important'
      );
      mountNode.style.setProperty(
        '--drop-down-menu-bg',
        theTheme.neutral,
        'important'
      );
      mountNode.style.setProperty(
        '--text',
        theTheme['base-content'],
        'important'
      );
      mountNode.style.setProperty(
        '--text-hover',
        theTheme['base-content'],
        'important'
      );
      mountNode.style.setProperty(
        '--color-text-on-accent',
        theTheme['base-content'],
        'important'
      );
      mountNode.style.setProperty(
        '--link-color',
        theTheme.primary,
        'important'
      );
      mountNode.style.setProperty(
        '--button-color',
        theTheme.primary,
        'important'
      );
      mountNode.style.setProperty(
        '--button-color-hover',
        theTheme.secondary,
        'important'
      );
      mountNode.style.setProperty(
        '--plex-poster-unwatched',
        theTheme['base-content'],
        'important'
      );
      mountNode.style.setProperty(
        '--transparency-light-15',
        `rgba(${hexToRgb(theTheme.primary)}, 0.15)`,
        'important'
      );
      mountNode.style.setProperty(
        '--overseerr-gradient',
        `linear-gradient(180deg, rgba(${hexToRgb(theTheme.primary)}, 0.47) 0%, rgba(${hexToRgb(theTheme.neutral)}, 1) 100%)`,
        'important'
      );
      mountNode.style.setProperty(
        '--label-text-color',
        theTheme['base-content'],
        'important'
      );
      mountNode.style.setProperty(
        '--tw-ring-color',
        theTheme.primary,
        'important'
      );

      if (innerFrame) {
        setIframeTheme(innerFrame, theTheme);
      }
    }
  }, [mountNode, innerFrame, theme]);

  useEffect(() => {
    if (!innerFrame?.navigation) return;

    const handleNavigate = (event: NavigateEvent) => {
      // Get the new path from the iframe navigation
      const iframeUrl = new URL(event.destination.url);
      const iframePath = iframeUrl.pathname;

      // Calculate the sub-path (remove basePath prefix)
      const newSubPath = iframePath.replace(basePath ?? '', '');

      // Only update browser URL if the path actually changed
      if (newSubPath !== currentIframePathRef.current) {
        currentIframePathRef.current = newSubPath;

        // Use replaceState to update browser URL without triggering Next.js navigation
        // This prevents the iframe from remounting
        const newBrowserPath = `${newBase}${newSubPath}`;
        window.history.replaceState(
          { ...window.history.state, as: newBrowserPath, url: newBrowserPath },
          '',
          newBrowserPath
        );
      }
    };

    innerFrame.navigation.addEventListener('navigate', handleNavigate);

    // Cleanup listener on unmount or when innerFrame changes
    return () => {
      innerFrame.navigation.removeEventListener('navigate', handleNavigate);
    };
  }, [innerFrame, basePath, newBase]);

  return (
    <>
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
      <iframe
        {...props}
        ref={iframeRef}
        loading="lazy"
        onLoad={handleIframeLoad}
        className={`w-full h-[calc(100dvh-11.6rem)] sm:h-[calc(100dvh-8.45rem)] relative ${loadingIframe ? 'invisible' : ''}`}
        src={iframeSrc}
        allowFullScreen
        title={title}
      >
        {mountNode && createPortal(children, mountNode)}
      </iframe>
      {loadingIframe ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <LoadingEllipsis />
        </div>
      ) : null}
    </>
  );
};
export default DynamicFrame;
