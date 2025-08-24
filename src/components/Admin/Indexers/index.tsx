'use client';
import DynamicFrame from '@app/components/Common/DynamicFrame';
import LoadingEllipsis from '@app/components/Common/LoadingEllipsis';
import type { ServiceSettings } from '@server/lib/settings';
import { useEffect, useState } from 'react';
import useSWR from 'swr';

const AdminIndexers = () => {
  const [hostname, setHostname] = useState('');
  const { data } = useSWR<ServiceSettings>('/api/v1/settings/prowlarr');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setHostname(`${window?.location?.protocol}//${window?.location?.host}`);
    }
  }, [setHostname]);

  if (!data) {
    return <LoadingEllipsis />;
  }

  return (
    <div className="relative mt-2">
      <DynamicFrame
        title={'indexers'}
        domainURL={hostname}
        basePath={data?.urlBase}
        newBase={'/admin/indexers'}
      ></DynamicFrame>
    </div>
  );
};
export default AdminIndexers;
