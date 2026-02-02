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
  const { data, isLoading } = useSWR<ServiceSettings>('/api/v1/settings/tdarr');

  if (isLoading) {
    return <LoadingEllipsis />;
  }

  const isConfigured = !!(data?.enabled && data?.hostname);

  return (
    <div className="relative mt-2">
      <DynamicFrame
        title="transcoding"
        domainURL={hostname}
        basePath={TDARR_PROXY_PATH}
        newBase="/admin/transcode"
        serviceName="Tdarr"
        settingsPath="/admin/settings/services/tdarr"
        isConfigured={isConfigured}
      />
    </div>
  );
};
export default AdminTranscoding;
