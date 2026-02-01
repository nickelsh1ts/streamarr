/* eslint-disable @next/next/no-css-tags */
'use client';
import DynamicFrame from '@app/components/Common/DynamicFrame';
import LoadingEllipsis from '@app/components/Common/LoadingEllipsis';
import { ServiceNotConfigured } from '@app/components/Common/ServiceError';
import { useUser, Permission } from '@app/hooks/useUser';
import type { UserSettingsGeneralResponse } from '@server/interfaces/api/userSettingsInterfaces';
import { useState } from 'react';
import useSWR from 'swr';

const Stats = () => {
  const { user, hasPermission } = useUser();
  const isAdmin = hasPermission(Permission.ADMIN);
  const [hostname] = useState(() =>
    typeof window !== 'undefined'
      ? `${window?.location?.protocol}//${window?.location?.host}`
      : ''
  );

  const { data: userSettings, isLoading } = useSWR<UserSettingsGeneralResponse>(
    user ? `/api/v1/user/${user?.id}/settings/main` : null
  );

  if (isLoading) {
    return <LoadingEllipsis />;
  }

  const isConfigured = !(
    !userSettings?.tautulliEnabled || !userSettings?.tautulliBaseUrl
  );

  if (!isConfigured) {
    return (
      <ServiceNotConfigured
        serviceName="Tautulli"
        settingsPath={isAdmin ? '/admin/settings/services/tautulli' : undefined}
        isAdmin={isAdmin}
        isAdminRoute={false}
      />
    );
  }

  return (
    <div className="relative">
      <DynamicFrame
        title="Stats"
        domainURL={hostname}
        basePath={userSettings.tautulliBaseUrl}
        newBase="/stats"
        serviceName="Tautulli"
        settingsPath="/admin/settings/services/tautulli"
        isConfigured={true}
      >
        <link rel="stylesheet" href="/stats.css" />
      </DynamicFrame>
    </div>
  );
};

export default Stats;
