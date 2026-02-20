'use client';
import Toast from '@app/components/Toast';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid';
import type { PythonServiceStatusResponse } from '@server/interfaces/api/settingsInterfaces';
import axios from 'axios';
import { useCallback, useState } from 'react';
import { useIntl } from 'react-intl';
import useSWR from 'swr';

export const PYTHON_STATUS_SWR_KEY = '/api/v1/settings/python/status';

interface UsePythonRestartOptions {
  refreshInterval?: number;
}

export function usePythonRestart(options?: UsePythonRestartOptions) {
  const intl = useIntl();
  const [isRestarting, setIsRestarting] = useState(false);

  const { data, error, mutate } = useSWR<PythonServiceStatusResponse>(
    PYTHON_STATUS_SWR_KEY,
    {
      refreshInterval: options?.refreshInterval ?? 30_000,
      revalidateOnFocus: true,
    }
  );

  const restart = useCallback(async () => {
    setIsRestarting(true);

    try {
      const response = await axios.post<{ success: boolean; message: string }>(
        '/api/v1/settings/python/restart'
      );

      if (response.data.success) {
        Toast({
          title: intl.formatMessage({
            id: 'system.python.restartSuccess',
            defaultMessage: 'Plex Sync service restarted successfully',
          }),
          icon: <CheckCircleIcon className="size-7" />,
          type: 'success',
        });
      } else {
        Toast({
          title:
            response.data.message ||
            intl.formatMessage({
              id: 'system.python.restartFailed',
              defaultMessage: 'Failed to restart Plex Sync service',
            }),
          icon: <XCircleIcon className="size-7" />,
          type: 'error',
          duration: 10000,
        });
      }
    } catch {
      Toast({
        title: intl.formatMessage({
          id: 'system.python.restartFailed',
          defaultMessage: 'Failed to restart Plex Sync service',
        }),
        icon: <XCircleIcon className="size-7" />,
        type: 'error',
      });
    } finally {
      setIsRestarting(false);
      mutate();
    }
  }, [intl, mutate]);

  return {
    status: data,
    error,
    isRestarting,
    restart,
    revalidate: mutate,
  };
}
