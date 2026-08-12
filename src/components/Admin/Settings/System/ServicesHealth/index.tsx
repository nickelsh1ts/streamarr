'use client';
import Badge from '@app/components/Common/Badge';
import Button from '@app/components/Common/Button';
import LoadingEllipsis from '@app/components/Common/LoadingEllipsis';
import Toast from '@app/components/Toast';
import {
  ArrowPathIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  XCircleIcon,
} from '@heroicons/react/24/solid';
import type {
  ServiceHealth,
  ServiceHealthInstance,
  ServiceHealthResponse,
  ServiceHealthStatus,
} from '@server/interfaces/api/settingsInterfaces';
import axios from 'axios';
import { useCallback, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import useSWR from 'swr';

const StatusBadge = ({ status }: { status: ServiceHealthStatus }) => {
  switch (status) {
    case 'healthy':
      return (
        <Badge badgeType="success">
          <FormattedMessage
            id="system.status.healthy"
            defaultMessage="Healthy"
          />
        </Badge>
      );
    case 'unhealthy':
      return (
        <Badge badgeType="error">
          <FormattedMessage
            id="system.status.unhealthy"
            defaultMessage="Unhealthy"
          />
        </Badge>
      );
    case 'retrying':
      return (
        <Badge badgeType="warning">
          <FormattedMessage
            id="system.status.retrying"
            defaultMessage="Retrying…"
          />
        </Badge>
      );
    default:
      return (
        <Badge badgeType="warning">
          <FormattedMessage
            id="system.status.unknown"
            defaultMessage="Unknown"
          />
        </Badge>
      );
  }
};

const RetryButton = ({
  onRetry,
  isRetrying,
}: {
  onRetry: () => void;
  isRetrying: boolean;
}) => (
  <Button
    buttonType="warning"
    buttonSize="sm"
    onClick={onRetry}
    disabled={isRetrying}
    className="btn-outline"
  >
    <ArrowPathIcon
      className={`mr-1 size-4 ${isRetrying ? 'animate-spin' : ''}`}
    />
    <FormattedMessage id="common.retry" defaultMessage="Retry" />
  </Button>
);

const ServiceDetail = ({
  status,
  version,
  detail,
  error,
}: {
  status: ServiceHealthStatus;
  version?: string;
  detail?: string;
  error?: string;
}) => {
  if ((status === 'unhealthy' || status === 'retrying') && error) {
    return <p className="text-neutral text-sm break-all">{error}</p>;
  }

  if (version || detail) {
    return <p className="text-neutral text-sm">{version || detail}</p>;
  }

  return null;
};

const InstanceRow = ({
  instance,
  onRetry,
  isRetrying,
}: {
  instance: ServiceHealthInstance;
  onRetry: () => void;
  isRetrying: boolean;
}) => (
  <div className="border-base-content/10 flex flex-row items-center justify-between gap-3 border-t px-4 py-2 pl-14">
    <div>
      <h5 className="flex gap-2 font-semibold">
        {instance.name}{' '}
        <span>
          <StatusBadge status={instance.status} />
        </span>
      </h5>
      <ServiceDetail
        status={instance.status}
        version={instance.version}
        detail={instance.detail}
        error={instance.error}
      />
    </div>
    <RetryButton onRetry={onRetry} isRetrying={isRetrying} />
  </div>
);

const ServiceCard = ({
  service,
  onRetry,
  retryingId,
}: {
  service: ServiceHealth;
  onRetry: (id: string) => void;
  retryingId: string | null;
}) => {
  const intl = useIntl();
  const [isExpanded, setIsExpanded] = useState(false);

  const hasMultipleInstances =
    !!service.instances && service.instances.length > 1;

  // Single-instance multi-capable services render flat using their one child.
  const singleInstance =
    service.instances && service.instances.length === 1
      ? service.instances[0]
      : undefined;
  const version = singleInstance?.version ?? service.version;
  const error = singleInstance?.error ?? service.error;
  const detail = singleInstance?.detail ?? service.detail;

  if (hasMultipleInstances && service.instances) {
    const healthyCount = service.instances.filter(
      (i) => i.status === 'healthy'
    ).length;

    return (
      <div className="border-base-content/10 bg-base-200/50 rounded-lg border">
        <div className="flex flex-row items-center justify-between gap-4 px-4 py-2">
          <div className="flex items-start gap-2">
            <button
              type="button"
              className="text-neutral hover:text-base-content mt-1 rounded p-0.5 transition hover:cursor-pointer"
              onClick={() => setIsExpanded((prev) => !prev)}
              aria-expanded={isExpanded}
              aria-label={
                isExpanded
                  ? intl.formatMessage({
                      id: 'system.health.collapseInstances',
                      defaultMessage: 'Hide instances',
                    })
                  : intl.formatMessage({
                      id: 'system.health.expandInstances',
                      defaultMessage: 'Show instances',
                    })
              }
            >
              {isExpanded ? (
                <ChevronDownIcon className="size-4" />
              ) : (
                <ChevronRightIcon className="size-4" />
              )}
            </button>
            <div>
              <h4 className="flex gap-2 text-lg font-bold">
                {service.name}
                <span>
                  <StatusBadge status={service.status} />
                </span>
              </h4>
              <p className="text-neutral text-sm">
                <FormattedMessage
                  id="system.health.instanceSummary"
                  defaultMessage="{healthy} of {total} healthy"
                  values={{
                    healthy: healthyCount,
                    total: service.instances.length,
                  }}
                />
              </p>
            </div>
          </div>
          {service.retryable && !isExpanded && (
            <RetryButton
              onRetry={() => onRetry(service.id)}
              isRetrying={retryingId === service.id}
            />
          )}
        </div>
        {isExpanded &&
          service.instances.map((instance) => (
            <InstanceRow
              key={instance.id}
              instance={instance}
              onRetry={() => onRetry(instance.id)}
              isRetrying={retryingId === instance.id}
            />
          ))}
      </div>
    );
  }

  return (
    <div className="border-base-content/10 bg-base-200/50 hover:bg-base-200/30 rounded-lg border px-4 py-2">
      <div className="flex flex-row items-center justify-between gap-4">
        <div>
          <h4 className="flex gap-2 text-lg font-bold">
            {service.name}
            <span>
              <StatusBadge status={service.status} />
            </span>
          </h4>
          <ServiceDetail
            status={service.status}
            version={version}
            detail={detail}
            error={error}
          />
        </div>
        {service.retryable && (
          <RetryButton
            onRetry={() => onRetry(service.id)}
            isRetrying={retryingId === service.id}
          />
        )}
      </div>
    </div>
  );
};

const ServicesHealth = () => {
  const intl = useIntl();
  const { data, mutate, isLoading } = useSWR<ServiceHealthResponse>(
    '/api/v1/settings/health',
    { revalidateOnFocus: true }
  );

  const [retryingId, setRetryingId] = useState<string | null>(null);

  const handleRetry = useCallback(
    async (id: string) => {
      setRetryingId(id);
      try {
        const res = await axios.post<ServiceHealthResponse>(
          '/api/v1/settings/health/retry',
          { id }
        );
        await mutate(res.data, { revalidate: false });
      } catch (e) {
        Toast({
          title: intl.formatMessage({
            id: 'system.health.retryFailed',
            defaultMessage: 'Failed to retry service health check.',
          }),
          type: 'error',
          icon: <XCircleIcon className="size-7" />,
          message: e.response?.data?.message || e.message,
        });
      } finally {
        setRetryingId(null);
      }
    },
    [intl, mutate]
  );

  if (isLoading) {
    return <LoadingEllipsis />;
  }

  if (!data) {
    return null;
  }

  return (
    <>
      {data.services.map((service) => (
        <ServiceCard
          key={service.id}
          service={service}
          onRetry={handleRetry}
          retryingId={retryingId}
        />
      ))}
    </>
  );
};

export default ServicesHealth;
