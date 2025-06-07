'use client';
import DynamicFrame from '@app/components/Common/DynamicFrame';
import { useEffect, useState } from 'react';

const AdminDownloads = () => {
  const [hostname, setHostname] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setHostname(`${window?.location?.protocol}//${window?.location?.host}`);
    }
  }, [setHostname]);

  return (
    <div className="relative mt-2">
      <DynamicFrame
        title={'downloads'}
        domainURL={process.env.NEXT_PUBLIC_BASE_DOMAIN || hostname}
        basePath={'/admin/qbt'}
        newBase={'/admin/downloads'}
      ></DynamicFrame>
    </div>
  );
};
export default AdminDownloads;
