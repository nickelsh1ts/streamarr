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
import {
  ArrowTopRightOnSquareIcon,
  LockClosedIcon,
} from '@heroicons/react/24/outline';
import Button from '@app/components/Common/Button';

//TODO: update words to use intl

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

  const isLocalhost =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1');

  const mountNode = contentRef?.contentWindow?.document?.body;
  const innerFrame = contentRef?.contentWindow;

  const hostname =
    typeof window !== 'undefined' && currentSettings?.requestUrl
      ? `${window?.location?.protocol}//${window?.location?.host}${currentSettings?.requestUrl}`
      : '';

  useEffect(() => {
    if (!currentSettings?.requestUrl || !innerFrame?.navigation) {
      return;
    }

    const handleNavigate = () => {
      setLoadingIframe(true);
      setTimeout(() => {
        if (
          url !==
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
    };

    innerFrame.navigation.addEventListener('navigate', handleNavigate);

    return () => {
      innerFrame.navigation?.removeEventListener('navigate', handleNavigate);
    };
  }, [
    currentSettings?.requestUrl,
    innerFrame?.location?.pathname,
    innerFrame?.navigation,
    innerFrame,
    router,
    url,
  ]);

  useEffect(() => {
    if (!mountNode || !currentSettings.theme) {
      return;
    }

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
      `linear-gradient(180deg, rgba(${hexToRgb(theme.primary)}, 0.47) 0%, rgba(${hexToRgb(theme['base-300'])}, 1) 100%)`,
      'important'
    );
    mountNode.style.setProperty(
      '--label-text-color',
      theme['base-content'],
      'important'
    );
    mountNode.style.setProperty('--tw-ring-color', theme.primary, 'important');

    // Set DaisyUI CSS variables for injected components
    if (innerFrame) {
      setIframeTheme(innerFrame, currentSettings.theme);
    }
  }, [mountNode, currentSettings.theme, innerFrame]);

  if (isLocalhost && currentSettings?.requestHostname) {
    const overseerrUrl = `http://${currentSettings.requestHostname}${url && url.replace('null', '')}`;
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100dvh-4rem)] bg-base-300 px-4">
        <div className="text-center max-w-md">
          <LockClosedIcon className="w-16 h-16 mx-auto mb-4 text-primary" />
          <h2 className="text-xl font-semibold text-base-content mb-2">
            Cross-Origin Access
          </h2>
          <p className="text-base-content/70 mb-6">
            Overseerr cannot be embedded when accessing locally due to browser
            security restrictions. Please open it in a new tab to continue or
            access streamarr from a secure hostname.
          </p>
          <Button
            buttonSize="sm"
            buttonType="primary"
            as="a"
            target="_blank"
            href={overseerrUrl}
          >
            Open Overseerr{' '}
            <ArrowTopRightOnSquareIcon className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
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
        title="Overseerr"
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
