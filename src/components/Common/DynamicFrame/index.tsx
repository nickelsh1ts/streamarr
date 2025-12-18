'use client';
import LoadingEllipsis from '@app/components/Common/LoadingEllipsis';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { setIframeTheme } from '@app/utils/themeUtils';
import { colord } from 'colord';
import type { Theme } from '@server/lib/settings';

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
  const pathname = usePathname().replace(newBase, '');
  const router = useRouter();

  const [contentRef, setContentRef] = useState(null);
  const [loadingIframe, setLoadingIframe] = useState(false);

  const mountNode = contentRef?.contentWindow?.document?.body;
  const innerFrame = contentRef?.contentWindow;

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
    innerFrame?.navigation.addEventListener('navigate', () => {
      setLoadingIframe(true);
      setTimeout(() => {
        if (
          pathname != innerFrame.location.pathname.replace(basePath + '/', '')
        ) {
          router.push(innerFrame.location.pathname.replace(basePath, newBase));
        } else {
          setLoadingIframe(false);
        }
      }, 200);
    });
  }, [
    innerFrame?.location.pathname,
    innerFrame?.navigation,
    router,
    pathname,
    basePath,
    newBase,
  ]);

  return (
    <>
      <iframe
        {...props}
        loading="lazy"
        onLoad={() => setTimeout(() => setLoadingIframe(false), 600)}
        ref={setContentRef}
        className={`w-full h-[calc(100dvh-11.6rem)] sm:h-[calc(100dvh-8.45rem)] relative ${loadingIframe && 'invisible'}`}
        src={`${domainURL}${basePath}${pathname}`}
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
