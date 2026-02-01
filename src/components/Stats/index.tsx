/* eslint-disable @next/next/no-css-tags */
'use client';
import DynamicFrame from '@app/components/Common/DynamicFrame';
import LoadingEllipsis from '@app/components/Common/LoadingEllipsis';
import { useUser } from '@app/hooks/useUser';
import type { UserSettingsGeneralResponse } from '@server/interfaces/api/userSettingsInterfaces';
import { useState } from 'react';
import useSWR from 'swr';

const Stats = () => {
  const { user } = useUser();
  const [hostname] = useState(() =>
    typeof window !== 'undefined'
      ? `${window?.location?.protocol}//${window?.location?.host}`
      : ''
  );

  const { data: userSettings } = useSWR<UserSettingsGeneralResponse>(
    user ? `/api/v1/user/${user?.id}/settings/main` : null
  );

  if (!userSettings || !userSettings.tautulliBaseUrl) {
    return <LoadingEllipsis />;
  }

  return (
    <div className="relative">
      <DynamicFrame
        title="Stats"
        domainURL={hostname}
        basePath={userSettings.tautulliBaseUrl}
        newBase="/stats"
      >
        <link rel="stylesheet" href="/stats.css" />
      </DynamicFrame>
    </div>
  );
};

export default Stats;
