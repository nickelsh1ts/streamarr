'use client';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

const Request = ({ children, ...props }) => {
  const pathname = usePathname();
  const url = pathname.replace('/request', '');
  const router = useRouter();

  const [contentRef, setContentRef] = useState(null);
  const [loadingIframe, setLoadingIframe] = useState(true);
  const mountNode = contentRef?.contentWindow?.document?.body;
  const innerFrame = contentRef?.contentWindow;

  useEffect(() => {
    innerFrame?.navigation.addEventListener('navigate', function () {
      router.push(
        '/request' + innerFrame.location.pathname.replace('/overseerr', '')
      );
    });
  });

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
        className={`w-full h-[93dvh] relative ${loadingIframe && 'invisible'} relative`}
        src={`https://streamarr.nickelsh1ts.com/overseerr${url && url.replace('null', '')}`}
        allowFullScreen
        title="Plex"
      >
        {mountNode && createPortal(children, mountNode)}
      </iframe>
      {loadingIframe ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg text-white me-1">Loading</span>{' '}
          <span className="loading loading-dots loading-md text-primary mt-2"></span>
        </div>
      ) : null}
    </>
  );
};
export default Request;
