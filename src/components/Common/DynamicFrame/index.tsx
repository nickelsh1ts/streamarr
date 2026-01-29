'use client';
import LoadingEllipsis from '@app/components/Common/LoadingEllipsis';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { setIframeTheme } from '@app/utils/themeUtils';
import { colord } from 'colord';
import useSettings from '@app/hooks/useSettings';

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
}

const DynamicFrame = ({
  children,
  title,
  basePath,
  newBase,
  domainURL,
  ...props
}: DynamicFrameProps) => {
  const pathname = usePathname();
  const { currentSettings } = useSettings();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [mountNode, setMountNode] = useState<HTMLElement | null>(null);
  const [innerFrame, setInnerFrame] = useState<WindowWithNavigation | null>(
    null
  );
  const [loadingIframe, setLoadingIframe] = useState(true);
  const isAdminRoute = pathname?.startsWith('/admin');

  // Use custom logos if available, otherwise fallback to defaults
  const logoSrc = currentSettings.customLogo || '/logo_full.png';
  const logoSmallSrc =
    currentSettings.customLogoSmall || '/streamarr-logo-512x512.png';

  // Track the current iframe path to avoid unnecessary updates
  const currentIframePathRef = useRef<string>('');

  // Get the initial hash from browser URL (for hash-based routing like Tdarr)
  const [initialHash] = useState(() =>
    typeof window !== 'undefined' ? window.location.hash : ''
  );

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
  // Include initialHash for hash-based routing (e.g., Tdarr uses /#/libraries)
  const iframeSrc = useMemo(() => {
    if (!domainURL || !basePath) return '';
    return `${domainURL}${basePath}${subPath}${initialHash}`;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [domainURL, basePath]); // Intentionally exclude subPath/initialHash to only compute initial src

  // Handle iframe load event
  const handleIframeLoad = useCallback(() => {
    const iframe = iframeRef.current;
    if (iframe?.contentWindow?.document?.body) {
      setMountNode(iframe.contentWindow.document.body);
      setInnerFrame(iframe.contentWindow as WindowWithNavigation);

      // Update browser URL based on current iframe location after load
      // This catches navigations that cause full page loads within the iframe
      try {
        const iframeUrl = new URL(iframe.contentWindow.location.href);
        const iframePath = iframeUrl.pathname;
        const iframeHash = iframeUrl.hash;

        // Calculate the sub-path (remove basePath prefix)
        const newSubPath = iframePath.replace(basePath ?? '', '');
        const fullSubPath = newSubPath + iframeHash;

        // Only update browser URL if the path actually changed
        if (fullSubPath !== currentIframePathRef.current && newBase) {
          currentIframePathRef.current = fullSubPath;
          const newBrowserPath = `${newBase}${fullSubPath}`;
          window.history.replaceState(
            {
              ...window.history.state,
              as: newBrowserPath,
              url: newBrowserPath,
            },
            '',
            newBrowserPath
          );
        }
      } catch {
        // Cross-origin access blocked - ignore
      }
    }
    setTimeout(() => setLoadingIframe(false), 300);
  }, [basePath, newBase]);

  useEffect(() => {
    if (!mountNode || !currentSettings.theme) {
      return;
    }
    const theme = currentSettings.theme;
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result
        ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
        : '0,0,0';
    };
    mountNode.style.setProperty('--logo-image-url', `url("${logoSrc}")`);
    mountNode.style.setProperty('--logo-sm-url', `url("${logoSmallSrc}")`);
    mountNode.style.setProperty(
      '--color-background-accent',
      theme.primary,
      'important'
    );
    mountNode.style.setProperty(
      '--accent-color',
      colord(theme.primary).toRgbString().replace('rgb(', '').replace(')', ''),
      'important'
    );
    mountNode.style.setProperty(
      '--color-brand-accent',
      theme.secondary,
      'important'
    );
    mountNode.style.setProperty('--bs-primary', theme.primary, 'important');
    mountNode.style.setProperty(
      '--color-background-accent-focus',
      theme.secondary,
      'important'
    );
    mountNode.style.setProperty(
      '--color-text-accent',
      theme.secondary,
      'important'
    );
    mountNode.style.setProperty(
      '--main-bg-color',
      theme['base-300'],
      'important'
    );
    mountNode.style.setProperty(
      '--modal-bg-color',
      theme['base-100'],
      'important'
    );
    mountNode.style.setProperty(
      '--drop-down-menu-bg',
      theme.neutral,
      'important'
    );
    mountNode.style.setProperty('--text', theme['base-content'], 'important');
    mountNode.style.setProperty(
      '--text-hover',
      theme['base-content'],
      'important'
    );
    mountNode.style.setProperty(
      '--color-text-on-accent',
      theme['base-content'],
      'important'
    );
    mountNode.style.setProperty('--link-color', theme.primary, 'important');
    mountNode.style.setProperty('--button-color', theme.primary, 'important');
    mountNode.style.setProperty(
      '--button-color-hover',
      theme.secondary,
      'important'
    );
    mountNode.style.setProperty(
      '--plex-poster-unwatched',
      theme['base-content'],
      'important'
    );
    mountNode.style.setProperty(
      '--transparency-light-15',
      `rgba(${hexToRgb(theme.primary)}, 0.15)`,
      'important'
    );
    mountNode.style.setProperty(
      '--overseerr-gradient',
      `linear-gradient(180deg, rgba(${hexToRgb(theme.primary)}, 0.47) 0%, rgba(${hexToRgb(theme.neutral)}, 1) 100%)`,
      'important'
    );
    mountNode.style.setProperty(
      '--label-text-color',
      theme['base-content'],
      'important'
    );
    mountNode.style.setProperty('--tw-ring-color', theme.primary, 'important');

    if (innerFrame) {
      setIframeTheme(innerFrame, theme);
    }
  }, [mountNode, innerFrame, currentSettings.theme, logoSrc, logoSmallSrc]);

  useEffect(() => {
    if (!innerFrame?.navigation) return;

    const handleNavigate = (event: NavigateEvent) => {
      // Get the new path from the iframe navigation
      const iframeUrl = new URL(event.destination.url);
      const iframePath = iframeUrl.pathname;
      const iframeHash = iframeUrl.hash; // For hash-based routing (e.g., Tdarr)

      // Calculate the sub-path (remove basePath prefix)
      const newSubPath = iframePath.replace(basePath ?? '', '');

      // Combine path and hash for the full route
      // Hash-based apps (like Tdarr) use /#/route, path-based apps use /route
      const fullSubPath = newSubPath + iframeHash;

      // Only update browser URL if the path actually changed
      if (fullSubPath !== currentIframePathRef.current) {
        currentIframePathRef.current = fullSubPath;

        // Use replaceState to update browser URL without triggering Next.js navigation
        // This prevents the iframe from remounting
        const newBrowserPath = `${newBase}${fullSubPath}`;
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
        className={`w-full ${isAdminRoute ? 'h-[calc(100dvh-11.6rem)] sm:h-[calc(100dvh-8.45rem)]' : 'h-[calc(100dvh-7.5rem)] sm:h-[calc(100dvh-4.35rem)]'} relative ${loadingIframe ? 'invisible' : ''}`}
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
