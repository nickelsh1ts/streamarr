'use client';
import LoadingEllipsis from '@app/components/Common/LoadingEllipsis';
import useRouteGuard from '@app/hooks/useRouteGuard';
import { Permission } from '@server/lib/permissions';
import type { ServiceSettings } from '@server/lib/settings';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import useSWR from 'swr';

//TODO: Disable this component if Overseerr is not enabled in settings.

const Request = ({ children, ...props }) => {
  useRouteGuard([Permission.REQUEST, Permission.STREAMARR], {
    type: 'or',
  });
  const pathname = usePathname();
  const url = pathname.replace('/request', '');
  const router = useRouter();

  const { data } = useSWR<ServiceSettings>('/api/v1/settings/overseerr');

  const [contentRef, setContentRef] = useState(null);
  const [loadingIframe, setLoadingIframe] = useState(true);
  const mountNode = contentRef?.contentWindow?.document?.body;
  const innerFrame = contentRef?.contentWindow;

  const [hostname, setHostname] = useState('');

  useEffect(() => {
    if (!data?.urlBase) {
      setLoadingIframe(true);
    } else {
      innerFrame?.navigation?.addEventListener('navigate', () => {
        setLoadingIframe(true);
        setTimeout(() => {
          if (
            url != innerFrame?.location?.pathname.replace(data?.urlBase, '') &&
            !innerFrame?.location?.pathname.includes('/search')
          ) {
            router.push(
              innerFrame?.location?.pathname.replace(data?.urlBase, '/request')
            );
          } else {
            setTimeout(() => setLoadingIframe(false), 600);
          }
        }, 600);
      });
    }
  }, [
    data?.urlBase,
    innerFrame?.location?.pathname,
    innerFrame?.navigation,
    router,
    url,
  ]);

  useEffect(() => {
    if (typeof window !== 'undefined' && data?.urlBase) {
      setHostname(
        `${window?.location?.protocol}//${window?.location?.host}${data?.urlBase}`
      );
    }
  }, [data?.urlBase, setHostname]);

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
        <div className="absolute inset-0 flex items-center justify-center bg-[#1f1f1f]">
          <LoadingEllipsis />
        </div>
      ) : null}
    </>
  );
};
export default Request;
