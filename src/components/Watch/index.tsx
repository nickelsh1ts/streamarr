'use client';

import useHash from '@app/hooks/useHash';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { createPortal } from 'react-dom';

const Watch = ({ children, ...props }) => {
  const pathname = usePathname();
  const hash = useHash();
  const url = `${pathname.replace('/watch', '')}${hash}`;
  const router = useRouter();

  const [contentRef, setContentRef] = useState(null);

  const [loadingIframe, setLoadingIframe] = useState(true);

  const mountNode = contentRef?.contentWindow?.document?.body;

  if (!pathname.includes('/watch/web/index.html')) {
    router.push('/watch/web/index.html');
  } else {
    return (
      <>
        <p className="hidden">
          If you&apos;re seeing this page, you have not yet configured your
          webserver correctly.
        </p>
        <iframe
          {...props}
          loading="eager"
          onLoad={() => {
            setTimeout(() => {
              setLoadingIframe(false);
            }, 1000);
          }}
          ref={setContentRef}
          className={`w-full h-screen z-20${loadingIframe && ' invisible'}`}
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
