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
  defaultExpanded,
}: {
  service: ServiceHealth;
  onRetry: (id: string) => void;
  retryingId: string | null;
  defaultExpanded?: boolean;
}) => {
  const intl = useIntl();
  const hasMultipleInstances =
    !!service.instances && service.instances.length > 1;

  const hasInstanceIssue =
    service.instances?.some((i) => i.status !== 'healthy') ?? false;

  const [isExpanded, setIsExpanded] = useState(
    defaultExpanded ?? hasInstanceIssue
  );

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
  const [showHealthy, setShowHealthy] = useState(false);

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

  if (data.services.length === 0) {
    return (
      <div className="border-base-content/10 bg-base-200/50 text-neutral rounded-lg border px-4 py-3 text-center text-sm">
        <FormattedMessage
          id="system.health.noServices"
          defaultMessage="No services configured."
        />
      </div>
    );
  }

  const isServiceHealthy = (s: ServiceHealth) =>
    s.status === 'healthy' &&
    (!s.instances || s.instances.every((i) => i.status === 'healthy'));

  const issueServices = data.services.filter((s) => !isServiceHealthy(s));
  const healthyServices = data.services.filter((s) => isServiceHealthy(s));

  return (
    <div className="flex flex-col gap-2">
      {issueServices.length === 0 ? (
        <>
          <div className="border-base-content/10 bg-base-200/50 hover:bg-base-200/30 flex flex-row items-center justify-between rounded-lg border px-4 py-2.5">
            <div className="flex items-center gap-2">
              <StatusBadge status="healthy" />
              <span className="font-semibold">
                <FormattedMessage
                  id="system.health.allHealthy"
                  defaultMessage="All {total} services operational"
                  values={{ total: data.services.length }}
                />
              </span>
            </div>
            <Button
              buttonType="ghost"
              buttonSize="sm"
              onClick={() => setShowHealthy((prev) => !prev)}
              aria-expanded={showHealthy}
              className="border-base-content/10 text-neutral hover:text-base-content border"
            >
              {showHealthy ? (
                <>
                  <FormattedMessage
                    id="system.health.hideDetails"
                    defaultMessage="Hide details"
                  />
                  <ChevronDownIcon className="ml-1 size-4" />
                </>
              ) : (
                <>
                  <FormattedMessage
                    id="system.health.showDetails"
                    defaultMessage="Show details"
                  />
                  <ChevronRightIcon className="ml-1 size-4" />
                </>
              )}
            </Button>
          </div>
          {showHealthy &&
            healthyServices.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                onRetry={handleRetry}
                retryingId={retryingId}
              />
            ))}
        </>
      ) : (
        <>
          {issueServices.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              onRetry={handleRetry}
              retryingId={retryingId}
            />
          ))}
          {healthyServices.length > 0 && (
            <>
              <button
                type="button"
                onClick={() => setShowHealthy((prev) => !prev)}
                aria-expanded={showHealthy}
                className="border-base-content/10 bg-base-200/50 hover:bg-base-200/30 text-base-content/80 hover:text-base-content flex w-full items-center justify-between rounded-lg border px-4 py-2.5 text-sm font-semibold transition hover:cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <StatusBadge status="healthy" />
                  <span>
                    <FormattedMessage
                      id="system.health.healthyCount"
                      defaultMessage="{count} healthy {count, plural, one {service} other {services}}"
                      values={{ count: healthyServices.length }}
                    />
                  </span>
                </div>
                <span className="text-neutral flex items-center gap-1 text-xs font-normal">
                  {showHealthy ? (
                    <>
                      <FormattedMessage
                        id="system.health.hideHealthy"
                        defaultMessage="Hide"
                      />
                      <ChevronDownIcon className="size-4" />
                    </>
                  ) : (
                    <>
                      <FormattedMessage
                        id="system.health.showHealthy"
                        defaultMessage="Show"
                      />
                      <ChevronRightIcon className="size-4" />
                    </>
                  )}
                </span>
              </button>
              {showHealthy &&
                healthyServices.map((service) => (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    onRetry={handleRetry}
                    retryingId={retryingId}
                  />
                ))}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default ServicesHealth;
