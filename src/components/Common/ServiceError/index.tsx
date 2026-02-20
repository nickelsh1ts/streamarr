'use client';
import type {
  ServiceProxyError,
  ServiceProxyErrorType,
} from '@app/hooks/useServiceProxy';
import ServiceNotConfigured from './ServiceNotConfigured';
import ServiceUnavailable from './ServiceUnavailable';
import ServiceNotFound from './ServiceNotFound';
import ServiceErrorGeneric from './ServiceErrorGeneric';

export interface ServiceErrorProps {
  serviceName: string;
  error?: ServiceProxyError | null;
  isAdmin?: boolean;
  onRetry?: () => void;
  isAdminRoute?: boolean;
}

export type { ServiceProxyError, ServiceProxyErrorType };

export function ServiceError({
  serviceName,
  error,
  isAdmin = false,
  onRetry,
  isAdminRoute = false,
}: ServiceErrorProps) {
  if (!error) {
    return (
      <ServiceErrorGeneric
        serviceName={serviceName}
        isAdmin={isAdmin}
        onRetry={onRetry}
        isAdminRoute={isAdminRoute}
      />
    );
  }

  switch (error.type) {
    case 'not_found':
      return (
        <ServiceNotFound
          serviceName={serviceName}
          error={error}
          isAdmin={isAdmin}
          onRetry={onRetry}
          isAdminRoute={isAdminRoute}
        />
      );

    case 'unavailable':
    case 'timeout':
      return (
        <ServiceUnavailable
          serviceName={serviceName}
          error={error}
          isAdmin={isAdmin}
          onRetry={onRetry}
          isAdminRoute={isAdminRoute}
        />
      );

    default:
      return (
        <ServiceErrorGeneric
          serviceName={serviceName}
          error={error}
          isAdmin={isAdmin}
          onRetry={onRetry}
          isAdminRoute={isAdminRoute}
        />
      );
  }
}

export {
  ServiceNotConfigured,
  ServiceUnavailable,
  ServiceNotFound,
  ServiceErrorGeneric,
};
export default ServiceError;
