'use client';
import DynamicFrame from '@app/components/Common/DynamicFrame';
import { useEffect, useState } from 'react';

const AdminMusic = () => {
  const [hostname, setHostname] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setHostname(`${window?.location?.protocol}//${window?.location?.host}`);
    }
  }, [setHostname]);

  return (
    <div className="relative mt-2">
      <DynamicFrame
        title={'music'}
        domainURL={process.env.NEXT_PUBLIC_BASE_DOMAIN || hostname}
        basePath={'/admin/lidarr'}
        newBase={'/admin/music'}
      ></DynamicFrame>
    </div>
  );
};
export default AdminMusic;
