'use client';
import DynamicFrame from '@app/components/Common/DynamicFrame';
import LoadingEllipsis from '@app/components/Common/LoadingEllipsis';
import type { ServiceSettings } from '@server/lib/settings';
import { useState } from 'react';
import useSWR from 'swr';

const AdminSubtitles = () => {
  const [hostname] = useState(() =>
    typeof window !== 'undefined'
      ? `${window?.location?.protocol}//${window?.location?.host}`
      : ''
  );
  const { data, isLoading } = useSWR<ServiceSettings>(
    '/api/v1/settings/bazarr'
  );

  if (isLoading) {
    return <LoadingEllipsis />;
  }

  const isConfigured = !!(data?.enabled && data?.hostname && data?.urlBase);

  return (
    <div className="relative mt-2">
      <DynamicFrame
        title="subtitles"
        domainURL={hostname}
        basePath={data?.urlBase}
        newBase="/admin/srt"
        serviceName="Bazarr"
        settingsPath="/admin/settings/services/bazarr"
        isConfigured={isConfigured}
      />
    </div>
  );
};
export default AdminSubtitles;
