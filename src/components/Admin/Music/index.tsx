'use client';
import DynamicFrame from '@app/components/Common/DynamicFrame';
import LoadingEllipsis from '@app/components/Common/LoadingEllipsis';
import type { ServiceSettings } from '@server/lib/settings';
import { useState } from 'react';
import useSWR from 'swr';

const AdminMusic = () => {
  const [hostname] = useState(() =>
    typeof window !== 'undefined'
      ? `${window?.location?.protocol}//${window?.location?.host}`
      : ''
  );
  const { data } = useSWR<ServiceSettings>('/api/v1/settings/lidarr');

  if (!data) {
    return <LoadingEllipsis />;
  }

  return (
    <div className="relative mt-2">
      <DynamicFrame
        title={'music'}
        domainURL={hostname}
        basePath={data?.urlBase}
        newBase={'/admin/music'}
      ></DynamicFrame>
    </div>
  );
};
export default AdminMusic;
