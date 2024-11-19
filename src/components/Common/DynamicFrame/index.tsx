'use client';
import LoadingEllipsis from '@app/components/Common/LoadingEllipsis';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface DynamicFrameProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  children?: any;
  title?: string;
  basePath?: string;
  newBase?: string;
  domainURL?: string;
}

const DynamicFrame = ({
  children,
  title,
  basePath,
  newBase,
  domainURL,
  ...props
}: DynamicFrameProps) => {
  const pathname = usePathname().replace(newBase, '');
  const router = useRouter();

  const [contentRef, setContentRef] = useState(null);
  const [loadingIframe, setLoadingIframe] = useState(false);

  const mountNode = contentRef?.contentWindow?.document?.body;
  const innerFrame = contentRef?.contentWindow;

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
        className={`w-full h-[85dvh] relative ${loadingIframe && 'invisible'}`}
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
