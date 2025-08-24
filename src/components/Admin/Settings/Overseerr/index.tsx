/* eslint-disable @next/next/no-css-tags */
'use client';
import DynamicFrame from '@app/components/Common/DynamicFrame';
import type { ServiceSettings } from '@server/lib/settings';
import { useState, useEffect } from 'react';
import useSWR from 'swr';

const AdminOverseerr = () => {
  const [hostname, setHostname] = useState('');
  const { data } = useSWR<ServiceSettings>('/api/v1/settings/overseerr');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setHostname(`${window?.location?.protocol}//${window?.location?.host}`);
    }
  }, [setHostname]);

  return (
    <div className="relative mt-2 -mx-4">
      {data?.urlBase && (
        <DynamicFrame
          title={'downloads'}
          domainURL={hostname}
          basePath={data?.urlBase}
          newBase={'/admin/settings/overseerr'}
        >
          <link rel="stylesheet" href="/request.css" />
        </DynamicFrame>
      )}
    </div>
  );
};
export default AdminOverseerr;
