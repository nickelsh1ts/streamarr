'use client';
import DynamicFrame from '@app/components/Common/DynamicFrame';
import { useEffect, useState } from 'react';

const AdminSubtitles = () => {
  const [hostname, setHostname] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setHostname(`${window?.location?.protocol}//${window?.location?.host}`);
    }
  }, [setHostname]);

  return (
    <div className="relative mt-2">
      <DynamicFrame
        title={'subtitles'}
        domainURL={process.env.NEXT_PUBLIC_BASE_DOMAIN || hostname}
        basePath={'/admin/bazarr'}
        newBase={'/admin/srt'}
      ></DynamicFrame>
    </div>
  );
};
export default AdminSubtitles;
