'use client';
import Button from '@app/components/Common/Button';
import type { ServiceProxyError } from '@app/hooks/useServiceProxy';
import {
  ArrowPathIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import { FormattedMessage, useIntl } from 'react-intl';

interface ServiceErrorGenericProps {
  serviceName: string;
  error?: ServiceProxyError | null;
  isAdmin?: boolean;
  onRetry?: () => void;
  isAdminRoute?: boolean;
}

export default function ServiceErrorGeneric({
  serviceName,
  error,
  isAdmin = false,
  onRetry,
  isAdminRoute = false,
}: ServiceErrorGenericProps) {
  const intl = useIntl();
  const heightClass = isAdminRoute
    ? 'h-[calc(100dvh-11.6rem)] sm:h-[calc(100dvh-8.45rem)]'
    : 'h-[calc(100dvh-7.5rem)] sm:h-[calc(100dvh-4.35rem)]';

  const errorDetails: string[] = [];
  errorDetails.push(
    `${error?.message ?? intl.formatMessage({ id: 'common.unknownError', defaultMessage: 'Unknown error' })}`
  );
  errorDetails.push(
    `HTTP Status: ${error?.code ?? intl.formatMessage({ id: 'common.unknown', defaultMessage: 'Unknown' })}`
  );
  errorDetails.push(
    `${error?.details ?? intl.formatMessage({ id: 'common.noErrorDetails', defaultMessage: "Couldn't retrieve error details." })}`
  );

  return (
    <div
      className={`${heightClass} flex flex-col items-center justify-center bg-base-300`}
    >
      <div className="text-center max-w-md">
        <ExclamationCircleIcon className="w-16 h-16 mx-auto mb-4 text-error" />
        <h2 className="text-2xl font-semibold text-base-content mb-2">
          <FormattedMessage
            id="common.somethingWentWrong"
            defaultMessage="Something Went Wrong"
          />
        </h2>
        <p className="text-base-content/70 mb-4">
          <FormattedMessage
            id="ServiceErrorGeneric.description"
            defaultMessage="An error occurred while trying to connect to {serviceName}."
            values={{ serviceName }}
          />
        </p>
        {isAdmin && (
          <div className="text-sm text-base-content/60  mb-6 font-mono bg-base-200 px-4 py-3 rounded-lg text-left">
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
