'use client';
import DynamicFrame from '@app/components/Common/DynamicFrame';
import LoadingEllipsis from '@app/components/Common/LoadingEllipsis';
import type { ServiceSettings } from '@server/lib/settings';
import { useState } from 'react';
import useSWR from 'swr';

const AdminDownloads = () => {
  const [hostname] = useState(() => {
    if (typeof window !== 'undefined') {
      return `${window?.location?.protocol}//${window?.location?.host}`;
    }
    return '';
  });
  const { data } = useSWR<ServiceSettings>('/api/v1/settings/downloads');

  if (!data) {
    return <LoadingEllipsis />;
  }

  return (
    <div className="relative mt-2">
      <DynamicFrame
        title={'downloads'}
        domainURL={hostname}
        basePath={data?.urlBase}
        newBase={'/admin/downloads'}
      ></DynamicFrame>
    </div>
  );
};
export default AdminDownloads;
