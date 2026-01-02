/* eslint-disable @next/next/no-css-tags */
'use client';
import DynamicFrame from '@app/components/Common/DynamicFrame';
import type { ServiceSettings } from '@server/lib/settings';
import { useState } from 'react';
import useSWR from 'swr';
import useSettings from '@app/hooks/useSettings';

const AdminOverseerr = () => {
  const [hostname] = useState(() =>
    typeof window !== 'undefined'
      ? `${window?.location?.protocol}//${window?.location?.host}`
      : ''
  );
  const { data } = useSWR<ServiceSettings>('/api/v1/settings/overseerr');
  const { currentSettings } = useSettings();

  return (
    <div className="relative mt-2 -mx-4">
      {data?.urlBase && (
        <DynamicFrame
          title={'downloads'}
          domainURL={hostname}
          basePath={data?.urlBase}
          newBase={'/admin/settings/overseerr'}
          theme={currentSettings?.theme}
        >
          <link rel="stylesheet" href="/request.css" />
        </DynamicFrame>
      )}
    </div>
  );
};
export default AdminOverseerr;
