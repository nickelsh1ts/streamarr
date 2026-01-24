/* eslint-disable @next/next/no-css-tags */
'use client';
import DynamicFrame from '@app/components/Common/DynamicFrame';
import LoadingEllipsis from '@app/components/Common/LoadingEllipsis';
import type { TautulliSettings } from '@server/lib/settings';
import { useState } from 'react';
import useSWR from 'swr';

const Stats = () => {
  const [hostname] = useState(() =>
    typeof window !== 'undefined'
      ? `${window?.location?.protocol}//${window?.location?.host}`
      : ''
  );

  const { data: tautulliData } = useSWR<TautulliSettings>(
    '/api/v1/settings/tautulli'
  );

  if (!tautulliData || !tautulliData.urlBase) {
    return <LoadingEllipsis />;
  }

  return (
    <div className="relative">
      <DynamicFrame
        title="Stats"
        domainURL={hostname}
        basePath={tautulliData.urlBase}
        newBase="/stats"
      >
        <link rel="stylesheet" href="/stats.css" />
      </DynamicFrame>
    </div>
  );
};

export default Stats;
