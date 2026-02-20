'use client';
import Alert from '@app/components/Common/Alert';
import ConfirmButton from '@app/components/Common/ConfirmButton';
import { usePythonRestart } from '@app/hooks/usePythonRestart';
import { ArrowPathIcon } from '@heroicons/react/24/solid';
import { FormattedMessage, useIntl } from 'react-intl';
import { Permission, useUser } from '@app/hooks/useUser';

const PythonServiceAlert = () => {
  const intl = useIntl();
  const { hasPermission } = useUser();
  const { status, error, isRestarting, restart } = usePythonRestart();

  if (
    !status ||
    error ||
    status.status !== 'unhealthy' ||
    !hasPermission(Permission.ADMIN)
  ) {
    return null;
  }

  return (
    <Alert
      type="error"
      title={
        <FormattedMessage
          id="system.python.alertTitle"
          defaultMessage="Plex Sync Service Down"
        />
      }
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 w-full">
        <span className="text-sm">
          <FormattedMessage
            id="system.python.alertMessage"
            defaultMessage="The Plex Sync service is unreachable. Plex invites and library sync are currently unavailable."
          />
        </span>
        <div className="flex-shrink-0">
          {isRestarting ? (
            <div className="flex items-center gap-2 text-error-content">
              <ArrowPathIcon className="size-5 animate-spin" />
              <span>
                <FormattedMessage
                  id="system.restarting"
                  defaultMessage="Restarting..."
                />
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
            >
              <ArrowPathIcon className="size-4 mr-1" />
              <FormattedMessage
                id="system.python.restart"
                defaultMessage="Restart Service"
              />
            </ConfirmButton>
          )}
        </div>
      </div>
    </Alert>
  );
};

export default PythonServiceAlert;
