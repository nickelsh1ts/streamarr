'use client';
import DynamicFrame from '@app/components/Common/DynamicFrame';
import LoadingEllipsis from '@app/components/Common/LoadingEllipsis';
import type { ServiceSettings } from '@server/lib/settings';
import { useState } from 'react';
import useSWR from 'swr';

/** Hardcoded proxy path - Tdarr has no base URL support */
const TDARR_PROXY_PATH = '/tdarr';

const AdminTranscoding = () => {
  const [hostname] = useState(() =>
    typeof window !== 'undefined'
      ? `${window?.location?.protocol}//${window?.location?.host}`
      : ''
  );
  const { data } = useSWR<ServiceSettings>('/api/v1/settings/tdarr');

  if (!data) {
    return <LoadingEllipsis />;
  }

  return (
    <div className="relative mt-2">
      <DynamicFrame
        title={'transcoding'}
        domainURL={hostname}
        basePath={TDARR_PROXY_PATH}
        newBase={'/admin/transcode'}
      ></DynamicFrame>
    </div>
  );
};
export default AdminTranscoding;
