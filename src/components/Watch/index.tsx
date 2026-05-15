'use client';
import LoadingEllipsis from '@app/components/Common/LoadingEllipsis';
import {
  ServiceError,
  ServiceNotConfigured,
} from '@app/components/Common/ServiceError';
import { useServiceProxy } from '@app/hooks/useServiceProxy';
import useSettings from '@app/hooks/useSettings';
import { useUser, Permission } from '@app/hooks/useUser';
import { setIframeTheme } from '@app/utils/themeUtils';
import { colord } from 'colord';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const Watch = ({ children, ...props }) => {
  const { hasPermission } = useUser();
  const isAdmin = hasPermission(Permission.ADMIN);

  const {
    status: proxyStatus,
    error: proxyError,
    retry,
  } = useServiceProxy({ proxyPath: '/web' });

  const contentRef = useRef<HTMLIFrameElement | null>(null);
  const [loadingIframe, setLoadingIframe] = useState(true);
  const [mountNode, setMountNode] = useState<HTMLElement | null>(null);
  const [innerFrame, setInnerFrame] = useState<Window | null>(null);

  const hostname =
    typeof window !== 'undefined'
      ? `${window.location.protocol}//${window.location.host}`
      : '';
  const [iframeUrl, setIframeUrl] = useState(() =>
    typeof window !== 'undefined'
      ? (
          window.location.pathname +
          window.location.search +
          window.location.hash
        ).replace('/watch', '')
      : ''
  );
  const { currentSettings } = useSettings();

  // Use custom logos if available, otherwise fallback to defaults
  const logoSrc = currentSettings.customLogo || '/logo_full.png';
  const logoSmallSrc =
    currentSettings.customLogoSmall || '/streamarr-logo-512x512.png';

  // Track the parent window's location for the iframe src
  useEffect(() => {
    let lastParentUrl =
      window.location.pathname + window.location.search + window.location.hash;
    let lastIframeUrl = '';
    const interval = setInterval(() => {
      let parentUrl =
        window.location.pathname +
        window.location.search +
        window.location.hash;

      const firstHashbang = parentUrl.indexOf('#!');
      const lastHashbang = parentUrl.lastIndexOf('#!');
      if (firstHashbang !== lastHashbang) {
        // Collapse duplicate hashbang segments: keep only the last #! segment
        parentUrl =
          parentUrl.slice(0, firstHashbang) + parentUrl.slice(lastHashbang);
        window.history.replaceState(
          { ...window.history.state, as: parentUrl, url: parentUrl },
          '',
          parentUrl
        );
      }

      const iframeUrlNow = innerFrame
        ? innerFrame.location.pathname +
          innerFrame.location.search +
          innerFrame.location.hash
        : '';

      // If parent location changed (sidebar/menu navigation or Plex parent navigation)
      if (parentUrl !== lastParentUrl) {
        lastParentUrl = parentUrl;
        setIframeUrl(parentUrl.replace('/watch', ''));
        // Don't update parent location here!
      }
      // If iframe location changed (user navigated inside iframe)
      else if (iframeUrlNow && iframeUrlNow !== lastIframeUrl) {
        lastIframeUrl = iframeUrlNow;
        if ('/watch' + iframeUrlNow !== parentUrl) {
          window.history.replaceState(
            {
              ...window.history.state,
              as: '/watch' + iframeUrlNow,
              url: '/watch' + iframeUrlNow,
            },
            '',
            '/watch' + iframeUrlNow
          );
          setIframeUrl(iframeUrlNow.replace('/watch', ''));
          lastParentUrl = '/watch' + iframeUrlNow;
        }
      }
    }, 100);
    return () => clearInterval(interval);
  }, [innerFrame]);

  useEffect(() => {
    setTimeout(() => {
      let div = null;
      try {
        div = document
          ?.getElementsByTagName('iframe')[0]
          ?.contentDocument?.querySelector(
            "[class^='PlayerContainer-container-']"
          );
      } catch {
        // Cross-origin, div remains null
      }
      const menu = document
        ?.getElementsByTagName('iframe')[0]
        ?.contentDocument?.getElementById('sidebarMenu');
      if (div) {
        const observer = new MutationObserver(function (mutations) {
          if (mutations.some((mutation) => mutation.type === 'childList')) {
            const pageTitle = innerFrame?.document.title;
            if (
              document.title != pageTitle &&
              pageTitle != 'Plex' &&
              pageTitle != undefined
            ) {
              document.title = pageTitle;
              menu?.classList.add('mb-[6.5rem]');
            }
            if (pageTitle === 'Plex') {
              document.title = `Now Streaming - ${currentSettings.applicationTitle}`;
              menu?.classList.remove('mb-[6.5rem]');
            }
          }
        });
        const config = { childList: true, subtree: true };
        observer.observe(div, config);
      }
      const iframe = document
        ?.getElementsByTagName('iframe')[0]
        ?.contentDocument?.querySelectorAll(
          "[aria-haspopup^='menu'], [aria-label='Pause'], [aria-label='Play']"
        );
      let dbltap = false;
      iframe?.forEach((e) => {
        e.addEventListener('touchend', (e) => {
          if (!dbltap) {
            dbltap = true;
            setTimeout(function () {
              dbltap = false;
            }, 700);
          }
          e.preventDefault();
        });
      });
    }, 600);
  });

  useEffect(() => {
    if (mountNode) {
      mountNode.style.setProperty('--logo-image-url', `url("${logoSrc}")`);
      mountNode.style.setProperty('--logo-sm-url', `url("${logoSmallSrc}")`);
    }
  });

  useEffect(() => {
    if (mountNode && currentSettings.theme) {
      const theme = currentSettings.theme;
      mountNode.style.setProperty(
        '--link-color-hover',
        theme['primary'],
        'important'
      );
      mountNode.style.setProperty(
        '--accent-color',
        colord(theme.primary)
          .toRgbString()
          .replace('rgb(', '')
          .replace(')', ''),
        'important'
      );
      mountNode.style.setProperty(
        '--color-background-accent',
        theme.primary,
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
        theme.primary,
        'important'
      );
      mountNode.style.setProperty(
        '--main-bg-color',
        theme['base-300'],
        'important'
      );
      mountNode.style.setProperty(
        '--drop-down-menu-bg',
        theme['base-300'],
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
      mountNode.style.setProperty(
        '--link-color',
        theme['base-content'],
        'important'
      );
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
    }

    if (innerFrame) {
      setIframeTheme(innerFrame, currentSettings.theme);
    }
  }, [mountNode, currentSettings.theme, innerFrame]);

  useEffect(() => {
    const normalizedIframeUrl = `${hostname}${iframeUrl && iframeUrl.replace('null', '')}`;

    if (contentRef.current && contentRef.current.src !== normalizedIframeUrl) {
      contentRef.current.src = normalizedIframeUrl;
    }
  }, [iframeUrl, hostname]);

  if (proxyStatus === 'loading') {
    return <LoadingEllipsis fixed />;
  }

  if (proxyStatus === 'error' && proxyError?.type === 'not_found') {
    return (
      <ServiceNotConfigured
        serviceName="Plex"
        settingsPath={isAdmin ? '/admin/settings/plex' : undefined}
        isAdmin={isAdmin}
        isAdminRoute={false}
      />
    );
  }

  if (proxyStatus === 'error') {
    return (
      <ServiceError
        serviceName="Plex"
        error={proxyError}
        isAdmin={isAdmin}
        onRetry={retry}
        isAdminRoute={false}
      />
    );
  }

  return (
    <>
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
      <iframe
        {...props}
        loading="eager"
        onLoad={() => {
          let nextMountNode: HTMLElement | null = null;
          let nextInnerFrame: Window | null = null;

          try {
            if (
              contentRef.current?.contentWindow &&
              contentRef.current.contentWindow.location.origin ===
                window.location.origin
            ) {
              nextMountNode = contentRef.current.contentWindow.document.body;
              nextInnerFrame = contentRef.current.contentWindow;
            }
          } catch {
            nextMountNode = null;
            nextInnerFrame = null;
          }

          setMountNode(nextMountNode);
          setInnerFrame(nextInnerFrame);

          setTimeout(() => {
            setLoadingIframe(false);
          }, 1000);
        }}
        ref={contentRef}
        className={`w-full h-dvh ${loadingIframe && 'invisible'}`}
        src={`${hostname}${iframeUrl && iframeUrl.replace('null', '')}`}
        allowFullScreen
        title="Plex"
      />
      {mountNode && createPortal(children, mountNode)}
      {loadingIframe ? <LoadingEllipsis fixed /> : null}
    </>
  );
};

export default Watch;
