'use client';
import Alert from '@app/components/Common/Alert';
import ConfirmButton from '@app/components/Common/ConfirmButton';
import Toast from '@app/components/Toast';
import { waitForRestart } from '@app/utils/restartHelpers';
import {
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/solid';
import type { RestartStatusResponse } from '@server/interfaces/api/settingsInterfaces';
import axios from 'axios';
import { useCallback, useState } from 'react';
import { usePathname } from 'next/navigation';
import { FormattedMessage, useIntl } from 'react-intl';
import useSWR from 'swr';

export const RESTART_REQUIRED_SWR_KEY = '/api/v1/settings/restart-required';

interface RestartRequiredAlertProps {
  filterServices?: string[];
}

const RestartRequiredAlert = ({
  filterServices,
}: RestartRequiredAlertProps) => {
  const intl = useIntl();
  const pathname = usePathname();
  const [isRestarting, setIsRestarting] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);

  const { data, error } = useSWR<RestartStatusResponse>(
    RESTART_REQUIRED_SWR_KEY,
    { revalidateOnFocus: true }
  );

  const handleRestart = useCallback(async () => {
    setIsRestarting(true);

    try {
      await axios.post('/api/v1/settings/restart');
      await new Promise((r) => setTimeout(r, 750));

      setIsRestarting(false);
      setIsReconnecting(true);

      if (await waitForRestart()) {
        Toast({
          title: intl.formatMessage({
            id: 'settings.restartRequired.success',
            defaultMessage: 'Server restarted successfully',
          }),
          icon: <CheckCircleIcon className="size-7" />,
          type: 'success',
        });
        window.location.reload();
      } else {
        setIsReconnecting(false);
        Toast({
          title: intl.formatMessage({
            id: 'settings.restartRequired.failed',
            defaultMessage:
              'Restart failed. Please restart the server manually.',
          }),
          icon: <XCircleIcon className="size-7" />,
          type: 'error',
          duration: 10000,
        });
      }
    } catch {
      setIsRestarting(false);
      setIsReconnecting(false);
      Toast({
        title: intl.formatMessage({
          id: 'settings.restartRequired.failed',
          defaultMessage: 'Restart failed. Please restart the server manually.',
        }),
        icon: <XCircleIcon className="size-7" />,
        type: 'error',
      });
    }
  }, [intl]);

  if (!data || error || !data.required || pathname?.startsWith('/setup')) {
    return null;
  }

  const relevantServices = filterServices
    ? data.services.filter((s) => filterServices.includes(s))
    : data.services;

  if (relevantServices.length === 0) {
    return null;
  }

  return (
    <Alert
      type="warning"
      title={
        <FormattedMessage
          id="settings.restartRequired.title"
          defaultMessage="Restart Required"
        />
      }
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 w-full">
        <span className="text-sm">
          <FormattedMessage
            id="settings.restartRequired.message"
            defaultMessage="Changes to {services} require a server restart to take effect."
            values={{ services: relevantServices.join(', ') }}
          />
        </span>
        <div className="flex-shrink-0">
          {isRestarting || isReconnecting ? (
            <div className="flex items-center gap-2 text-warning-content">
              <ArrowPathIcon className="size-5 animate-spin" />
              <span>
                {isReconnecting ? (
                  <FormattedMessage
                    id="settings.restartRequired.reconnecting"
                    defaultMessage="Reconnecting..."
                  />
                ) : (
                  <FormattedMessage
                    id="settings.restartRequired.restarting"
                    defaultMessage="Restarting..."
                  />
                )}
              </span>
            </div>
          ) : (
            <ConfirmButton
              onClick={handleRestart}
              confirmText={intl.formatMessage({
                id: 'common.areYouSure',
                defaultMessage: 'Are you sure?',
              })}
              buttonSize="sm"
            >
              <ArrowPathIcon className="size-4 mr-1" />
              <FormattedMessage
                id="settings.restartRequired.button"
                defaultMessage="Restart Now"
              />
            </ConfirmButton>
          )}
        </div>
      </div>
    </Alert>
  );
};

export default RestartRequiredAlert;
