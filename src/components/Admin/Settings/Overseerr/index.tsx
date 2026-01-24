/* eslint-disable @next/next/no-css-tags */
'use client';
import DynamicFrame from '@app/components/Common/DynamicFrame';
import Button from '@app/components/Common/Button';
import type { ServiceSettings } from '@server/lib/settings';
import { useState } from 'react';
import useSWR from 'swr';
import useSettings from '@app/hooks/useSettings';
import {
  ArrowTopRightOnSquareIcon,
  LockClosedIcon,
} from '@heroicons/react/24/outline';

const AdminOverseerr = () => {
  const [hostname] = useState(() =>
    typeof window !== 'undefined'
      ? `${window?.location?.protocol}//${window?.location?.host}`
      : ''
  );
  const { data } = useSWR<ServiceSettings>('/api/v1/settings/overseerr');
  const { currentSettings } = useSettings();

  const isLocalhost =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1');

  if (isLocalhost && currentSettings?.requestHostname) {
    const overseerrUrl = `http://${currentSettings.requestHostname}/settings`;
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100dvh-12rem)] bg-base-300 px-4 mt-2 -mx-4 rounded-lg">
        <div className="text-center max-w-md">
          <LockClosedIcon className="w-16 h-16 mx-auto mb-4 text-primary" />
          <h2 className="text-xl font-semibold text-base-content mb-2">
            Cross-Origin Access
          </h2>
          <p className="text-base-content/70 mb-6">
            Overseerr settings cannot be embedded when accessing locally due to
            browser security restrictions. Please open it in a new tab to
            continue or access streamarr from a secure hostname.
          </p>
          <Button
            buttonSize="sm"
            buttonType="primary"
            as="a"
            target="_blank"
            href={overseerrUrl}
          >
            Open Overseerr Settings{' '}
            <ArrowTopRightOnSquareIcon className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative mt-2 -mx-4">
      {data?.urlBase && (
        <DynamicFrame
          title={'downloads'}
          domainURL={hostname}
          basePath={data?.urlBase}
          newBase={'/admin/settings/overseerr'}
        >
          <link rel="stylesheet" href="/request.css" />
        </DynamicFrame>
      )}
    </div>
  );
};
export default AdminOverseerr;
