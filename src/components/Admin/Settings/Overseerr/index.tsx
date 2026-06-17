'use client';
import Button from '@app/components/Common/Button';
import DynamicFrame from '@app/components/Common/DynamicFrame';
import LoadingEllipsis from '@app/components/Common/LoadingEllipsis';
import { useUser } from '@app/hooks/useUser';
import { withVersion } from '@app/utils/assetVersion';
import {
  ArrowTopRightOnSquareIcon,
  LockClosedIcon,
} from '@heroicons/react/24/outline';
import type { UserSettingsGeneralResponse } from '@server/interfaces/api/userSettingsInterfaces';
import type { ServiceSettings } from '@server/lib/settings';
import { useState } from 'react';
import { FormattedMessage } from 'react-intl';
import useSWR from 'swr';

const AdminOverseerr = () => {
  const { user } = useUser();
  const [hostname] = useState(() =>
    typeof window !== 'undefined'
      ? `${window?.location?.protocol}//${window?.location?.host}`
      : ''
  );
  const { data, isLoading } = useSWR<ServiceSettings>(
    '/api/v1/settings/overseerr'
  );
  const { data: userSettings } = useSWR<UserSettingsGeneralResponse>(
    user ? `/api/v1/user/${user?.id}/settings/main` : null
  );

  const isLocalhost =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1');

  if (isLocalhost && userSettings?.requestHostname) {
    const overseerrUrl = `http://${userSettings.requestHostname}/settings`;
    return (
      <div className="bg-base-300 -mx-4 mt-2 flex h-[calc(100dvh-12rem)] flex-col items-center justify-center rounded-lg px-4">
        <div className="max-w-md text-center">
          <LockClosedIcon className="text-primary mx-auto mb-4 h-16 w-16" />
          <h2 className="text-base-content mb-2 text-xl font-semibold">
            <FormattedMessage
              id="settings.crossOriginAccess"
              defaultMessage="Cross-Origin Access"
            />
          </h2>
          <p className="text-base-content/70 mb-6">
            <FormattedMessage
              id="settings.overseerr.localhostDescriptionSettings"
              defaultMessage="Seerr settings cannot be embedded when accessing locally due to browser security restrictions. Please open it in a new tab to continue or access streamarr from a secure hostname."
            />
          </p>
          <Button
            buttonSize="sm"
            buttonType="primary"
            as="a"
            target="_blank"
            href={overseerrUrl}
          >
            <FormattedMessage
              id="settings.openOverseerrSettings"
              defaultMessage="Open Seerr Settings"
            />
            <ArrowTopRightOnSquareIcon className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <LoadingEllipsis />;
  }

  const isConfigured = !!(data?.enabled && data?.hostname && data?.urlBase);

  return (
    <div className="relative -mx-4 mt-2">
      <DynamicFrame
        title="seerr"
        domainURL={hostname}
        basePath={data?.urlBase}
        newBase="/admin/settings/overseerr"
        serviceName="Seerr"
        settingsPath="/admin/settings/services/overseerr"
        isConfigured={isConfigured}
        injectTheme
      >
        <link rel="stylesheet" href={withVersion('/request.css')} />
      </DynamicFrame>
    </div>
  );
};
export default AdminOverseerr;
