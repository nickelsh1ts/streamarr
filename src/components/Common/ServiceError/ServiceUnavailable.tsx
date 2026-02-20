'use client';
import Button from '@app/components/Common/Button';
import type { ServiceProxyError } from '@app/hooks/useServiceProxy';
import {
  ArrowPathIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { FormattedMessage, useIntl } from 'react-intl';

interface ServiceUnavailableProps {
  serviceName: string;
  error?: ServiceProxyError | null;
  isAdmin?: boolean;
  onRetry?: () => void;
  isAdminRoute?: boolean;
}

export default function ServiceUnavailable({
  serviceName,
  error,
  isAdmin = false,
  onRetry,
  isAdminRoute = false,
}: ServiceUnavailableProps) {
  const intl = useIntl();

  const heightClass = isAdminRoute
    ? 'h-[calc(100dvh-11.6rem)] sm:h-[calc(100dvh-8.45rem)]'
    : 'h-[calc(100dvh-7.5rem)] sm:h-[calc(100dvh-4.35rem)]';

  const isTimeout = error?.type === 'timeout';
  const errorDetails: string[] = [];
  if (error?.target) {
    errorDetails.push(`Target: ${error.target}`);
  }
  if (error?.errorCode) {
    errorDetails.push(`Error: ${error.errorCode}`);
  }
  if (error?.reason) {
    errorDetails.push(`Reason: ${error.reason}`);
  }
  if (error?.code) {
    errorDetails.push(`HTTP Status: ${error.code}`);
  }

  return (
    <div
      className={`${heightClass} flex flex-col items-center justify-center bg-base-300`}
    >
      <div className="text-center max-w-md">
        <ExclamationTriangleIcon className="w-16 h-16 mx-auto text-warning" />
        <h2 className="text-2xl font-semibold text-base-content mb-2">
          <FormattedMessage
            id="serviceUnavailable.title"
            defaultMessage="{serviceName} Unavailable"
            values={{ serviceName }}
          />
        </h2>
        <p className="text-base-content/70 mb-4">
          {isTimeout
            ? intl.formatMessage(
                {
                  id: 'serviceUnavailable.timeoutMessage',
                  defaultMessage: `Something went wrong. {serviceName} did not respond in time.`,
                },
                { serviceName }
              )
            : intl.formatMessage(
                {
                  id: 'serviceUnavailable.unreachableMessage',
                  defaultMessage: `Unable to connect to {serviceName}. Service is unreachable.`,
                },
                { serviceName }
              )}
        </p>
        {isAdmin && errorDetails.length > 0 && (
          <div className="text-sm text-base-content/60 mb-6 font-mono bg-base-200 px-4 py-3 rounded-lg text-left">
            {errorDetails.map((detail, idx) => (
              <div key={idx} className="mb-1 last:mb-0">
                {detail}
              </div>
            ))}
          </div>
        )}
        {onRetry && (
          <Button buttonType="primary" buttonSize="sm" onClick={onRetry}>
            <ArrowPathIcon className="w-4 h-4 mr-2" />
            <FormattedMessage id="common.retry" defaultMessage="Retry" />
          </Button>
        )}
      </div>
    </div>
  );
}
