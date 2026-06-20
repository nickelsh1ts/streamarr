'use client';
import LoadingEllipsis from '@app/components/Common/LoadingEllipsis';
import {
  ServiceError,
  ServiceNotConfigured,
} from '@app/components/Common/ServiceError';
import { useServiceProxy } from '@app/hooks/useServiceProxy';
import useSettings from '@app/hooks/useSettings';
import { Permission, useUser } from '@app/hooks/useUser';
import { parseColorToHex, setIframeTheme } from '@app/utils/themeUtils';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface DynamicFrameProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  children?: any;
  title?: string;
  basePath?: string;
  newBase?: string;
  domainURL?: string;
  serviceName?: string;
  settingsPath?: string;
  isConfigured?: boolean;
  injectTheme?: boolean;
}

const DynamicFrame = ({
  children,
  title,
  basePath,
  newBase,
  domainURL,
  serviceName = 'Service',
  settingsPath,
  isConfigured = true,
  injectTheme = false,
  ...props
}: DynamicFrameProps) => {
  const pathname = usePathname();
  const { currentSettings } = useSettings();
  const { hasPermission } = useUser();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [mountNode, setMountNode] = useState<HTMLElement | null>(null);
  const [innerFrame, setInnerFrame] = useState<Window | null>(null);
  const [loadingIframe, setLoadingIframe] = useState(true);
  const isAdminRoute = pathname?.startsWith('/admin');
  const isAdmin = hasPermission(Permission.ADMIN);

  const {
    status: proxyStatus,
    error: proxyError,
    retry,
  } = useServiceProxy({
    proxyPath: basePath,
    enabled: isConfigured && !!basePath,
  });

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
      setInnerFrame(iframe.contentWindow as Window);

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
    if (!mountNode || !currentSettings.theme || !injectTheme) {
      return;
    }
    const theme = currentSettings.theme;
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result
        ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
        : '0,0,0';
    };
    const primaryHex = parseColorToHex(theme.primary) ?? theme.primary;
    const base300Hex = parseColorToHex(theme['base-300']) ?? theme['base-300'];
    const primaryChannels = hexToRgb(primaryHex);

    mountNode.style.setProperty('--logo-image-url', `url("${logoSrc}")`);
    mountNode.style.setProperty('--logo-sm-url', `url("${logoSmallSrc}")`);

    // Theme-park base CSS consumes --accent-color exclusively as raw RGB channels
    // (e.g. rgb(var(--accent-color))), so it must be comma-separated channels,
    // never a whole color value.
    const themeVars: Record<string, string> = {
      '--color-background-accent': theme.primary,
      '--accent-color': primaryChannels,
      '--color-brand-accent': theme.secondary,
      '--bs-primary': theme.primary,
      '--color-background-accent-focus': theme.primary,
      '--color-text-accent': theme.secondary,
      '--main-bg-color': theme['base-300'],
      '--modal-bg-color': theme['base-100'],
      '--drop-down-menu-bg': theme.neutral,
      '--text': theme['base-content'],
      '--text-hover': theme['base-content'],
      '--color-text-on-accent': theme['base-content'],
      '--link-color': theme.primary,
      '--button-color': theme.primary,
      '--button-color-hover': theme.secondary,
      '--plex-poster-unwatched': theme['base-content'],
      '--transparency-light-15': `rgba(${primaryChannels}, 0.15)`,
      '--overseerr-gradient': `linear-gradient(180deg, rgba(${primaryChannels}, 0.47) 0%, rgba(${hexToRgb(base300Hex)}, 1) 100%)`,
      '--label-text-color': theme['base-content'],
      '--tw-ring-color': theme.primary,
    };

    // Theme-park declares these vars on :root and on the .react-chroma-dark
    // wrapper, but the iframe stylesheet makes the wrapper inherit them from
    // :root. Setting them on the document root therefore cascades everywhere
    // (including content the SPA adds later); body is also set as a fallback.
    const targets: HTMLElement[] = [
      innerFrame?.document?.documentElement as HTMLElement,
      mountNode,
    ].filter(Boolean) as HTMLElement[];

    targets.forEach((target) => {
      Object.entries(themeVars).forEach(([name, value]) => {
        target.style.setProperty(name, value, 'important');
      });
    });

    if (innerFrame) {
      setIframeTheme(innerFrame, theme);
    }
  }, [
    mountNode,
    innerFrame,
    currentSettings.theme,
    logoSrc,
    logoSmallSrc,
    injectTheme,
  ]);

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

  if (!isConfigured) {
    return (
      <ServiceNotConfigured
        serviceName={serviceName}
        settingsPath={settingsPath}
        isAdmin={isAdmin}
        isAdminRoute={isAdminRoute}
      />
    );
  }

  if (proxyStatus === 'loading') {
    return (
      <div
        className={`${isAdminRoute ? 'h-[calc(100dvh-11.6rem)] sm:h-[calc(100dvh-8.45rem)]' : 'h-[calc(100dvh-7.5rem)] sm:h-[calc(100dvh-4.35rem)]'} flex items-center justify-center`}
      >
        <LoadingEllipsis />
      </div>
    );
  }

  if (proxyStatus === 'error') {
    return (
      <ServiceError
        serviceName={serviceName}
        error={proxyError}
        isAdmin={isAdmin}
        onRetry={retry}
        isAdminRoute={isAdminRoute}
      />
    );
  }

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
