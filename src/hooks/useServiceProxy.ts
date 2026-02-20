'use client';
import { useCallback, useEffect, useState } from 'react';

export type ServiceProxyErrorType =
  | 'not_found'
  | 'unavailable'
  | 'timeout'
  | 'unknown';

export interface ServiceProxyError {
  type: ServiceProxyErrorType;
  code?: number;
  message: string;
  details?: string;
  target?: string;
  reason?: string;
  errorCode?: string;
}

export type ServiceProxyStatus = 'loading' | 'ready' | 'error';

export interface UseServiceProxyResult {
  status: ServiceProxyStatus;
  error: ServiceProxyError | null;
  retry: () => void;
}

interface UseServiceProxyOptions {
  proxyPath: string | undefined;
  enabled?: boolean;
  timeout?: number;
}

interface CdnInfo {
  isCdn: boolean;
  provider?: string;
  identifier?: string;
}

const TIMEOUT_MS = 10000;

// CDN detection patterns
const CDN_HEADERS: Record<string, { provider: string; idHeader?: string }> = {
  'cf-ray': { provider: 'Cloudflare', idHeader: 'cf-ray' },
  'x-amz-cf-id': { provider: 'CloudFront', idHeader: 'x-amz-cf-id' },
  'x-served-by': { provider: 'Fastly', idHeader: 'x-served-by' },
  'x-akamai-request-id': {
    provider: 'Akamai',
    idHeader: 'x-akamai-request-id',
  },
  'x-cache': { provider: 'CDN' }, // Generic CDN indicator
};

/**
 * Detects if response is from a CDN and extracts provider info.
 */
function detectCdn(response: Response): CdnInfo {
  for (const [header, info] of Object.entries(CDN_HEADERS)) {
    if (response.headers.has(header)) {
      return {
        isCdn: true,
        provider: info.provider,
        identifier: info.idHeader
          ? (response.headers.get(info.idHeader) ?? undefined)
          : undefined,
      };
    }
  }
  return { isCdn: false };
}

/**
 * Safely parses JSON from response, returns null on failure.
 */
async function tryParseJson(
  response: Response
): Promise<Record<string, unknown> | null> {
  if (!response.headers.get('content-type')?.includes('application/json')) {
    return null;
  }
  try {
    return await response.json();
  } catch {
    return null;
  }
}

/**
 * Creates an error object with defaults.
 */
function createError(
  type: ServiceProxyErrorType,
  message: string,
  overrides: Partial<Omit<ServiceProxyError, 'type' | 'message'>> = {}
): ServiceProxyError {
  return { type, message, ...overrides };
}

/**
 * Parses an error response to determine the error type.
 */
async function parseErrorResponse(
  response: Response,
  requestUrl: string
): Promise<ServiceProxyError> {
  const { status } = response;
  const cdn = detectCdn(response);
  const isHtml = response.headers.get('content-type')?.includes('text/html');

  // CDN intercepted error (5xx + HTML from CDN)
  if (cdn.isCdn && status >= 500 && isHtml) {
    const idLabel = cdn.identifier
      ? `${cdn.provider}-ID: ${cdn.identifier}`
      : 'CDN_ERROR';
    return createError('unavailable', 'Service is unreachable', {
      code: status,
      details: `${cdn.provider} returned error ${status}`,
      target: requestUrl,
      reason: `${cdn.provider} intercepted the request. The upstream service may be down or unreachable.`,
      errorCode: idLabel,
    });
  }

  // 404 - Not Found
  if (status === 404) {
    return createError('not_found', 'Page not found', {
      code: 404,
      details: 'The requested path was not found',
      target: requestUrl,
    });
  }

  // 502, 503, 504 - Service Unavailable (with potential JSON details from our proxy)
  if ([502, 503, 504].includes(status)) {
    const json = await tryParseJson(response);
    return createError('unavailable', 'Service is unavailable', {
      code: status,
      details: (json?.message as string) ?? `HTTP ${status}`,
      target: (json?.target as string) ?? requestUrl,
      reason: json?.reason as string,
      errorCode: json?.code as string,
    });
  }

  // Other 4xx - Client errors
  if (status >= 400 && status < 500) {
    return createError('unknown', 'Request failed', {
      code: status,
      details: `HTTP ${status}`,
      target: requestUrl,
    });
  }

  // Other 5xx - Server errors
  if (status >= 500) {
    return createError('unavailable', 'Service error', {
      code: status,
      details: `HTTP ${status}`,
      target: requestUrl,
    });
  }

  // Fallback
  return createError('unknown', 'An unexpected error occurred', {
    code: status,
    details: `HTTP ${status}`,
    target: requestUrl,
  });
}

/**
 * Hook to probe a service proxy path and determine if it's reachable.
 *
 * @example
 * ```tsx
 * const { status, error, retry } = useServiceProxy({
 *   proxyPath: '/radarr/',
 *   enabled: isConfigured,
 * });
 *
 * if (status === 'loading') return <LoadingEllipsis />;
 * if (status === 'error') return <ServiceError error={error} onRetry={retry} />;
 * return <iframe src={...} />;
 * ```
 */
export function useServiceProxy({
  proxyPath,
  enabled = true,
  timeout = TIMEOUT_MS,
}: UseServiceProxyOptions): UseServiceProxyResult {
  const [status, setStatus] = useState<ServiceProxyStatus>(() =>
    !proxyPath || !enabled ? 'ready' : 'loading'
  );
  const [error, setError] = useState<ServiceProxyError | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!proxyPath || !enabled) {
      return;
    }

    const controller = new AbortController();
    const signal = AbortSignal.any([
      controller.signal,
      AbortSignal.timeout(timeout),
    ]);

    // Reset state at start of probe
    queueMicrotask(() => {
      if (!signal.aborted) {
        setStatus('loading');
        setError(null);
      }
    });

    const fetchOptions: RequestInit = {
      signal,
      credentials: 'same-origin',
      redirect: 'manual',
    };

    // Try HEAD first (faster, no body), fall back to GET if needed
    const probe = async (): Promise<Response> => {
      const headResponse = await fetch(proxyPath, {
        ...fetchOptions,
        method: 'HEAD',
      });

      // 405 = Method Not Allowed, some servers don't support HEAD
      if (headResponse.status === 405) {
        return fetch(proxyPath, { ...fetchOptions, method: 'GET' });
      }

      // For error responses, re-fetch with GET to get the response body with error details
      if (!headResponse.ok && headResponse.type !== 'opaqueredirect') {
        return fetch(proxyPath, { ...fetchOptions, method: 'GET' });
      }

      return headResponse;
    };

    probe()
      .then(async (response) => {
        if (signal.aborted) return;

        if (response.ok || response.type === 'opaqueredirect') {
          setStatus('ready');
          setError(null);
        } else {
          setStatus('error');
          setError(await parseErrorResponse(response, proxyPath));
        }
      })
      .catch((err) => {
        if (signal.aborted) {
          // Check if it was a timeout (TimeoutError from AbortSignal.timeout)
          if (err?.name === 'TimeoutError') {
            setStatus('error');
            setError(
              createError('timeout', 'Request timed out', {
                details: `Service did not respond within ${timeout / 1000} seconds`,
                target: proxyPath,
                errorCode: 'TIMEOUT',
              })
            );
          }
          return;
        }

        setStatus('error');
        setError(
          createError('unavailable', 'Unable to connect to service', {
            details: err instanceof Error ? err.message : 'Network error',
            target: proxyPath,
            errorCode: 'NETWORK_ERROR',
          })
        );
      });

    return () => controller.abort();
  }, [proxyPath, enabled, timeout, retryCount]);

  const retry = useCallback(() => setRetryCount((c) => c + 1), []);

  return { status, error, retry };
}

export default useServiceProxy;
