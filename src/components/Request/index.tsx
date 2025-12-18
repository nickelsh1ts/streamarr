'use client';
import LoadingEllipsis from '@app/components/Common/LoadingEllipsis';
import useRouteGuard from '@app/hooks/useRouteGuard';
import useSettings from '@app/hooks/useSettings';
import { Permission } from '@server/lib/permissions';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { setIframeTheme } from '@app/utils/themeUtils';
import { colord } from 'colord';

const Request = ({ children, ...props }) => {
  useRouteGuard([Permission.REQUEST, Permission.STREAMARR], {
    type: 'or',
  });
  const pathname = usePathname();
  const url = pathname.replace('/request', '');
  const router = useRouter();
  const { currentSettings } = useSettings();

  const [contentRef, setContentRef] = useState(null);
  const [loadingIframe, setLoadingIframe] = useState(
    () => !currentSettings?.requestUrl
  );
  const mountNode = contentRef?.contentWindow?.document?.body;
  const innerFrame = contentRef?.contentWindow;

  const hostname =
    typeof window !== 'undefined' && currentSettings?.requestUrl
      ? `${window?.location?.protocol}//${window?.location?.host}${currentSettings?.requestUrl}`
      : '';

  useEffect(() => {
    if (currentSettings?.requestUrl) {
      innerFrame?.navigation?.addEventListener('navigate', () => {
        setLoadingIframe(true);
        setTimeout(() => {
          if (
            url !=
              innerFrame?.location?.pathname.replace(
                currentSettings?.requestUrl,
                ''
              ) &&
            !innerFrame?.location?.pathname.includes('/search')
          ) {
            router.push(
              innerFrame?.location?.pathname.replace(
                currentSettings?.requestUrl,
                '/request'
              )
            );
          } else {
            setTimeout(() => setLoadingIframe(false), 600);
          }
        }, 600);
      });
    }
  }, [
    currentSettings?.requestUrl,
    innerFrame?.location?.pathname,
    innerFrame?.navigation,
    router,
    url,
  ]);

  useEffect(() => {
    if (mountNode && currentSettings.theme) {
      const hexToRgb = (hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result
          ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
          : '0,0,0';
      };
      const theme = currentSettings.theme;
      mountNode.style.setProperty(
        '--color-background-accent',
        theme.primary,
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
        `linear-gradient(180deg, rgba(${hexToRgb(theme.primary)}, 0.47) 0%, rgba(${hexToRgb(theme['base-300'])}, 1) 100%)`,
        'important'
      );
      mountNode.style.setProperty(
        '--label-text-color',
        theme['base-content'],
        'important'
      );
      mountNode.style.setProperty(
        '--tw-ring-color',
        theme.primary,
        'important'
      );

      // Set DaisyUI CSS variables for injected components
      if (innerFrame) {
        setIframeTheme(innerFrame, currentSettings.theme);
      }
    }
  }, [
    mountNode,
    currentSettings.theme,
    innerFrame,
    innerFrame?.location?.pathname,
  ]);

  return (
    <>
      <iframe
        {...props}
        loading="eager"
        onLoad={() => {
          setTimeout(() => {
            setLoadingIframe(false);
          }, 1000);
        }}
        ref={setContentRef}
        className={`w-full h-[calc(100dvh-4rem)] sm:h-[calc(100dvh-4rem)] relative ${loadingIframe && 'invisible'}`}
        src={`${hostname}${url && url.replace('null', '')}`}
        allowFullScreen
        title="Plex"
      >
        {mountNode && createPortal(children, mountNode)}
      </iframe>
      {loadingIframe ? (
        <div className="absolute inset-0 flex items-center justify-center bg-base-300">
          <LoadingEllipsis />
        </div>
      ) : null}
    </>
  );
};
export default Request;
