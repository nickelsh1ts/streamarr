'use client';
import LoadingEllipsis from '@app/components/Common/LoadingEllipsis';
import useSettings from '@app/hooks/useSettings';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

const Watch = ({ children, ...props }) => {
  const [contentRef, setContentRef] = useState(null);
  const [loadingIframe, setLoadingIframe] = useState(true);
  const mountNode = contentRef?.contentWindow?.document?.body;
  const innerFrame = contentRef?.contentWindow;

  const [hostname, setHostname] = useState('');
  const [iframeUrl, setIframeUrl] = useState('');
  const { currentSettings } = useSettings();

  // Track the parent window's location for the iframe src (polling approach)
  useEffect(() => {
    let lastParentUrl = window.location.pathname + window.location.hash;
    let lastIframeUrl = '';
    setIframeUrl(lastParentUrl.replace('/watch', ''));
    const interval = setInterval(() => {
      const parentUrl = window.location.pathname + window.location.hash;
      const iframeUrlNow = innerFrame
        ? innerFrame.location.pathname + innerFrame.location.hash
        : '';

      // If parent location changed (sidebar/menu navigation)
      if (parentUrl !== lastParentUrl) {
        lastParentUrl = parentUrl;
        setIframeUrl(parentUrl.replace('/watch', ''));
        // Don't update parent location here!
      }
      // If iframe location changed (user navigated inside iframe)
      else if (iframeUrlNow && iframeUrlNow !== lastIframeUrl) {
        lastIframeUrl = iframeUrlNow;
        if ('/watch' + iframeUrlNow !== parentUrl) {
          window.history.replaceState(null, '', '/watch' + iframeUrlNow);
          setIframeUrl(iframeUrlNow.replace('/watch', ''));
          lastParentUrl = '/watch' + iframeUrlNow;
        }
      }
    }, 100);
    return () => clearInterval(interval);
  }, [innerFrame]);

  useEffect(() => {
    setTimeout(() => {
      const div = document
        ?.getElementsByTagName('iframe')[0]
        ?.contentDocument?.querySelector(
          "[class^='PlayerContainer-container-']"
        );
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
          // console.log('Double click detected!');
        });
      });
    }, 600);
  });

  useEffect(() => {
    if (mountNode) {
      mountNode.style.setProperty(
        '--logo-image-url',
        (process.env.NEXT_PUBLIC_LOGO &&
          `url("${process.env.NEXT_PUBLIC_LOGO}")`) ||
          'url("/logo_full.png")'
      );
      mountNode.style.setProperty(
        '--logo-sm-url',
        (process.env.NEXT_PUBLIC_LOGO_SM &&
          `url("${process.env.NEXT_PUBLIC_LOGO_SM}")`) ||
          'url("/streamarr-logo-512x512.png")'
      );
    }
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setHostname(`${window?.location?.protocol}//${window?.location?.host}`);
    }
  }, [setHostname]);

  // Remove key from iframe and update src imperatively
  useEffect(() => {
    if (
      contentRef &&
      contentRef.src !==
        `${hostname}${iframeUrl && iframeUrl.replace('null', '')}`
    ) {
      contentRef.src = `${hostname}${iframeUrl && iframeUrl.replace('null', '')}`;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [iframeUrl, hostname]);

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
