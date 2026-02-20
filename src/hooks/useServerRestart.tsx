'use client';
import Toast from '@app/components/Toast';
import { waitForRestart } from '@app/utils/restartHelpers';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid';
import axios from 'axios';
import { useCallback, useState } from 'react';
import { useIntl } from 'react-intl';

export function useServerRestart() {
  const intl = useIntl();
  const [isRestarting, setIsRestarting] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);

  const restart = useCallback(async () => {
    setIsRestarting(true);

    try {
      await axios.post('/api/v1/settings/restart');
      await new Promise((r) => setTimeout(r, 750));

      setIsRestarting(false);
      setIsReconnecting(true);

      if (await waitForRestart()) {
        Toast({
          title: intl.formatMessage({
            id: 'system.server.restartSuccess',
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
            id: 'system.server.restartFailed',
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
          id: 'system.server.restartFailed',
          defaultMessage: 'Restart failed. Please restart the server manually.',
        }),
        icon: <XCircleIcon className="size-7" />,
        type: 'error',
      });
    }
  }, [intl]);

  return { isRestarting, isReconnecting, restart };
}
