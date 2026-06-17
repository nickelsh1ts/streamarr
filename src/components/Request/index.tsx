'use client';
import DynamicFrame from '@app/components/Common/DynamicFrame';
import LoadingEllipsis from '@app/components/Common/LoadingEllipsis';
import useRouteGuard from '@app/hooks/useRouteGuard';
import { Permission, useUser } from '@app/hooks/useUser';
import type { UserSettingsGeneralResponse } from '@server/interfaces/api/userSettingsInterfaces';
import { useState } from 'react';
import useSWR from 'swr';

const Request = ({ children, ...props }) => {
  useRouteGuard([Permission.REQUEST, Permission.STREAMARR], {
    type: 'or',
  });
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

  const isConfigured =
    !!userSettings?.requestUrl && !!userSettings?.requestEnabled;

  return (
    <div className="relative">
      <DynamicFrame
        {...props}
        title="Seerr"
        domainURL={hostname}
        basePath={userSettings?.requestUrl}
        newBase="/request"
        serviceName="Seerr"
        settingsPath={
          isAdmin ? '/admin/settings/services/overseerr' : undefined
        }
        isConfigured={isConfigured}
        injectTheme
      >
        {children}
      </DynamicFrame>
    </div>
  );
};
export default Request;
