'use client';
import Alert from '@app/components/Common/Alert';
import ConfirmButton from '@app/components/Common/ConfirmButton';
import { useServerRestart } from '@app/hooks/useServerRestart';
import { ArrowPathIcon } from '@heroicons/react/24/solid';
import type { RestartStatusResponse } from '@server/interfaces/api/settingsInterfaces';
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
  const { isRestarting, isReconnecting, restart } = useServerRestart();

  const { data, error } = useSWR<RestartStatusResponse>(
    RESTART_REQUIRED_SWR_KEY,
    { revalidateOnFocus: true }
  );

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
              onClick={restart}
              confirmText={intl.formatMessage({
                id: 'common.areYouSure',
                defaultMessage: 'Are you sure?',
              })}
              buttonSize="sm"
              className="max-sm:btn-block"
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
