'use client';
import DynamicFrame from '@app/components/Common/DynamicFrame';
import LoadingEllipsis from '@app/components/Common/LoadingEllipsis';
import type { ServiceSettings } from '@server/lib/settings';
import { useState } from 'react';
import useSWR from 'swr';

const AdminCleaning = () => {
  const [hostname] = useState(() =>
    typeof window !== 'undefined'
      ? `${window?.location?.protocol}//${window?.location?.host}`
      : ''
  );
  const { data, isLoading } = useSWR<ServiceSettings>(
    '/api/v1/settings/cleanuparr'
  );

  if (isLoading) {
    return <LoadingEllipsis />;
  }

  const isConfigured = !!(data?.enabled && data?.hostname && data?.urlBase);

  return (
    <div className="relative mt-2">
      <DynamicFrame
        title="cleaning"
        domainURL={hostname}
        basePath={data?.urlBase}
        newBase="/admin/cleaning"
        serviceName="Cleanuparr"
        settingsPath="/admin/settings/services/cleanuparr"
        isConfigured={isConfigured}
      />
    </div>
  );
};
export default AdminCleaning;
