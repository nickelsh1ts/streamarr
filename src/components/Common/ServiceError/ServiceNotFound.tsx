'use client';
import Button from '@app/components/Common/Button';
import type { ServiceProxyError } from '@app/hooks/useServiceProxy';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import { FormattedMessage } from 'react-intl';

interface ServiceNotFoundProps {
  serviceName: string;
  error?: ServiceProxyError | null;
  isAdmin?: boolean;
  onRetry?: () => void;
  isAdminRoute?: boolean;
}

export default function ServiceNotFound({
  serviceName,
  error,
  isAdmin = false,
  onRetry,
  isAdminRoute = false,
}: ServiceNotFoundProps) {
  const heightClass = isAdminRoute
    ? 'h-[calc(100dvh-11.6rem)] sm:h-[calc(100dvh-8.45rem)]'
    : 'h-[calc(100dvh-7.5rem)] sm:h-[calc(100dvh-4.35rem)]';

  return (
    <div
      className={`${heightClass} bg-base-300 relative flex flex-col items-center justify-center overflow-hidden rounded-lg px-4`}
    >
      <div className="relative z-10 max-w-md text-center">
        <div className="mb-4">
          <Image
            alt=""
            src="/img/404-chair.png"
            width={200}
            height={190}
            className="mx-auto"
          />
        </div>
        <h2 className="text-base-content mb-2 text-2xl font-semibold uppercase">
          <FormattedMessage id="common.service" defaultMessage="Service" />{' '}
          <s className="text-primary">
            <span className="text-primary-content font-bold">
              <FormattedMessage
                id="serviceNotFound.notFound"
                defaultMessage="Not found"
              />
            </span>
          </s>
        </h2>
        <p className="text-base-content/70 mb-4">
          <FormattedMessage
            id="ServiceNotFound.description"
            defaultMessage="This usually means Streamarr hasn't been restarted since {serviceName} was added or updated."
            values={{ serviceName }}
          />
        </p>
        {isAdmin && error?.details && (
          <p className="text-base-content/50 bg-base-200 mb-6 rounded px-3 py-2 font-mono text-sm">
            {error.details}
          </p>
        )}
        {onRetry && (
          <Button buttonType="primary" buttonSize="sm" onClick={onRetry}>
            <ArrowPathIcon className="mr-2 h-4 w-4" />
            <FormattedMessage id="common.retry" defaultMessage="Retry" />
          </Button>
        )}
      </div>
    </div>
  );
}
