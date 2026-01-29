import type { AllClientData } from '@ctrl/shared-torrent';
import logger from '@server/logger';

export type ClientHealthStatus = 'healthy' | 'retrying' | 'unhealthy';

interface ClientHealthState {
  clientId: number;
  clientName: string;
  status: ClientHealthStatus;
  lastSuccess?: Date;
  lastFailure?: Date;
  lastError?: string;
  cooldownUntil?: Date;
  consecutiveFailures: number;
  retryTimeout?: NodeJS.Timeout;
  cachedData?: AllClientData & { queueingEnabled?: boolean };
}

// In-memory health state for all clients
const clientHealthMap = new Map<number, ClientHealthState>();

/**
 * Initialize or get health state for a client
 */
function getOrCreateHealthState(
  clientId: number,
  clientName: string
): ClientHealthState {
  if (!clientHealthMap.has(clientId)) {
    clientHealthMap.set(clientId, {
      clientId,
      clientName,
      status: 'healthy',
      consecutiveFailures: 0,
    });
  }
  return clientHealthMap.get(clientId)!;
}

/**
 * Get current health status for a client
 */
export function getClientHealth(
  clientId: number
): ClientHealthState | undefined {
  return clientHealthMap.get(clientId);
}

/**
 * Get health status for all clients
 */
export function getAllClientsHealth(): ClientHealthState[] {
  return Array.from(clientHealthMap.values());
}

/**
 * Check if client is currently in cooldown period
 */
export function isClientInCooldown(clientId: number): boolean {
  const health = clientHealthMap.get(clientId);
  if (!health?.cooldownUntil) return false;
  return new Date() < health.cooldownUntil;
}

/**
 * Mark client as failed and update health state
 */
export function markClientFailed(
  clientId: number,
  clientName: string,
  error: string
): void {
  const health = getOrCreateHealthState(clientId, clientName);
  health.lastFailure = new Date();
  health.lastError = error;
  health.consecutiveFailures += 1;

  // First failure - mark as retrying (will trigger 5-second retry)
  if (health.consecutiveFailures === 1) {
    health.status = 'retrying';
  }
  // Second consecutive failure - mark as unhealthy and set cooldown
  else if (health.consecutiveFailures === 2) {
    health.status = 'unhealthy';
    health.cooldownUntil = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    logger.debug(`Download client unreachable, will retry in 5 minutes`, {
      label: 'Health Check',
      client: clientName,
      error: error,
    });
  }
}

/**
 * Mark client as healthy and clear failure state
 */
export function markClientHealthy(
  clientId: number,
  clientName: string,
  data?: AllClientData & { queueingEnabled?: boolean }
): void {
  const health = getOrCreateHealthState(clientId, clientName);
  const wasUnhealthy = health.status === 'unhealthy';

  health.status = 'healthy';
  health.lastSuccess = new Date();
  health.consecutiveFailures = 0;
  health.lastError = undefined;
  health.cooldownUntil = undefined;

  if (data) {
    health.cachedData = data;
  }

  // Clear retry timeout if exists
  if (health.retryTimeout) {
    clearTimeout(health.retryTimeout);
    health.retryTimeout = undefined;
  }

  if (wasUnhealthy) {
    logger.debug(`Download client connection restored`, {
      label: 'Health Check',
      client: clientName,
    });
  }
}

/**
 * Reset client health state (used for manual retry)
 */
export function resetClientHealth(clientId: number): void {
  const health = clientHealthMap.get(clientId);
  if (!health) return;

  health.status = 'healthy';
  health.consecutiveFailures = 0;
  health.lastError = undefined;
  health.cooldownUntil = undefined;

  if (health.retryTimeout) {
    clearTimeout(health.retryTimeout);
    health.retryTimeout = undefined;
  }
}

/**
 * Get cached data for a client in cooldown
 */
export function getCachedClientData(
  clientId: number
): (AllClientData & { queueingEnabled?: boolean }) | undefined {
  const health = clientHealthMap.get(clientId);
  return health?.cachedData;
}

/**
 * Set retry timeout for a client
 */
export function setRetryTimeout(
  clientId: number,
  timeout: NodeJS.Timeout
): void {
  const health = clientHealthMap.get(clientId);
  if (health) {
    health.retryTimeout = timeout;
  }
}

/**
 * Clear all health state (useful for testing)
 */
export function clearAllHealthState(): void {
  clientHealthMap.forEach((health) => {
    if (health.retryTimeout) {
      clearTimeout(health.retryTimeout);
    }
  });
  clientHealthMap.clear();
}
