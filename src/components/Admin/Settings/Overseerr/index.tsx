'use client';
import DynamicFrame from '@app/components/Common/DynamicFrame';
import LoadingEllipsis from '@app/components/Common/LoadingEllipsis';
import { withVersion } from '@app/utils/assetVersion';
import type { ServiceSettings } from '@server/lib/settings';
import { useState } from 'react';
import useSWR from 'swr';

const AdminOverseerr = () => {
  const [hostname] = useState(() =>
    typeof window !== 'undefined'
      ? `${window?.location?.protocol}//${window?.location?.host}`
      : ''
  );
  const { data, isLoading } = useSWR<ServiceSettings>(
    '/api/v1/settings/overseerr'
  );

  if (isLoading) {
    return <LoadingEllipsis />;
  }

  const isConfigured = !!(data?.enabled && data?.hostname && data?.urlBase);

  return (
    <div className="relative -mx-4 mt-2">
      <DynamicFrame
        title="seerr"
        domainURL={hostname}
        basePath={data?.urlBase}
        newBase="/admin/settings/overseerr"
        serviceName="Seerr"
        settingsPath="/admin/settings/services/overseerr"
        isConfigured={isConfigured}
        injectTheme
      >
        <link rel="stylesheet" href={withVersion('/request.css')} />
      </DynamicFrame>
    </div>
  );
};
export default AdminOverseerr;
