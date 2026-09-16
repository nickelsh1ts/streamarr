'use client';
import DynamicFrame from '@app/components/Common/DynamicFrame';
import LoadingEllipsis from '@app/components/Common/LoadingEllipsis';
import type { ServiceSettings } from '@server/lib/settings';
import { useState } from 'react';
import useSWR from 'swr';

const AdminPrerolls = () => {
  const [hostname] = useState(() =>
    typeof window !== 'undefined'
      ? `${window.location.protocol}//${window.location.host}`
      : ''
  );
  const { data, isLoading } = useSWR<ServiceSettings>(
    '/api/v1/settings/nexroll'
  );

  if (isLoading) return <LoadingEllipsis />;

  return (
    <div className="relative mt-2">
      <DynamicFrame
        title="prerolls"
        domainURL={hostname}
        basePath={data?.urlBase}
        newBase="/admin/prerolls"
        serviceName="NeXroll"
        settingsPath="/admin/settings/services/nexroll"
        isConfigured={!!(data?.enabled && data.hostname && data.urlBase)}
      />
    </div>
  );
};

export default AdminPrerolls;
