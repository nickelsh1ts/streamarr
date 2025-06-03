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
    innerFrame?.navigation.addEventListener('navigate', () => {
      setLoadingIframe(true);
      setTimeout(() => {
        if (
          url != innerFrame.location.pathname.replace('/overseerr', '') &&
          !innerFrame.location.pathname.includes('/search')
        ) {
          router.push(
            innerFrame.location.pathname.replace('/overseerr', '/request')
          );
        } else {
          setTimeout(() => setLoadingIframe(false), 600);
        }
      }, 600);
    });
  }, [innerFrame?.location.pathname, innerFrame?.navigation, router, url]);

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
        src={`${process.env.NEXT_PUBLIC_BASE_DOMAIN}/overseerr${url && url.replace('null', '')}`}
        allowFullScreen
        title="Plex"
      >
        {mountNode && createPortal(children, mountNode)}
      </iframe>
      {loadingIframe ? (
        <div className="absolute inset-0 flex items-center justify-center bg-[#1f1f1f]">
          <span className="text-lg text-white me-1">Loading</span>{' '}
          <span className="loading loading-dots loading-md text-primary mt-2"></span>
        </div>
      ) : null}
    </>
  );
};
export default Request;
