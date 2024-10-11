'use client';
import useHash from '@app/hooks/useHash';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

const Watch = ({ children, ...props }) => {
  const pathname = usePathname();
  const hash = useHash();
  const url = `${pathname.replace('/watch', '')}${hash}`;
  const router = useRouter();

  const [contentRef, setContentRef] = useState(null);
  const [loadingIframe, setLoadingIframe] = useState(true);
  const mountNode = contentRef?.contentWindow?.document?.body;
  const innerFrame = contentRef?.contentWindow;

  useEffect(() => {
    setTimeout(() => {
      const div = document
        ?.getElementsByTagName('iframe')[0]
        .contentDocument?.querySelector(
          "[class^='PlayerContainer-container-']"
        );
      if (div) {
        const observer = new MutationObserver(function (mutations) {
          if (mutations.some((mutation) => mutation.type === 'childList')) {
            const pageTitle = innerFrame?.document.title;
            console.log('found mutations');
            console.log('TITLE: ' + pageTitle);
            if (
              document.title != pageTitle &&
              pageTitle != 'Plex' &&
              pageTitle != undefined
            ) {
              document.title = pageTitle;
            }
            if (pageTitle === 'Plex') {
              document.title = 'Now Streaming - Streamarr';
            }
          }
        });
        const config = { childList: true, subtree: true };
        observer.observe(div, config);
      }
    }, 300);
  });

  useEffect(() => {
    innerFrame?.addEventListener('hashchange', function () {
      if (hash != innerFrame.location.hash) {
        router.push('/watch/web/index.html' + innerFrame.location.hash);
      }
    });
  });

  if (!pathname.includes('/watch/web/index.html')) {
    router.push('/watch/web/index.html');
  } else {
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
          className={`w-full h-dvh z-20${loadingIframe && ' invisible'}`}
          src={`https://streamarr-dev.nickelsh1ts.com${url && url.replace('null', '')}`}
          allowFullScreen
          title="Plex"
        >
          {mountNode && createPortal(children, mountNode)}
        </iframe>
        {loadingIframe ? (
          <div className="fixed inset-0 flex items-center justify-center">
            <span className="text-lg text-white me-1">Loading</span>{' '}
            <span className="loading loading-dots loading-md text-primary mt-2"></span>
          </div>
        ) : null}
      </>
    );
  }
};

export default Watch;
