import type { OutboundProxySettings } from '@server/lib/settings';
import logger from '@server/logger';
import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import axios from 'axios';
import http from 'http';
import { HttpProxyAgent } from 'http-proxy-agent';
import https from 'https';
import { HttpsProxyAgent } from 'https-proxy-agent';
import net from 'net';
import { Agent, ProxyAgent } from 'undici';

interface ProxyState {
  proxyUrl: string;
  httpAgent: HttpProxyAgent<string>;
  httpsAgent: HttpsProxyAgent<string>;
  dispatcher: ProxyAgent;
  directHttpAgent: http.Agent;
  directHttpsAgent: https.Agent;
  directDispatcher: Agent;
  bypassEntries: string[];
  bypassLocalAddresses: boolean;
}

// Proxy settings require a restart, so the state is built once at startup.
let state: ProxyState | null = null;

const LOCAL_SUFFIXES = ['.localhost', '.local', '.internal', '.home.arpa'];

const normalizeHost = (hostname: string): string =>
  hostname
    .trim()
    .toLowerCase()
    .replace(/^\[|\]$/g, '')
    .replace(/\.$/, '');

const isPrivateIPv4 = (ip: string): boolean => {
  const [a, b] = ip.split('.').map(Number);

  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168)
  );
};

const isPrivateIPv6 = (ip: string): boolean => {
  const mappedHex = ip.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
  if (mappedHex) {
    const high = Number.parseInt(mappedHex[1], 16);
    const low = Number.parseInt(mappedHex[2], 16);
    return isPrivateIPv4(
      [high >> 8, high & 0xff, low >> 8, low & 0xff].join('.')
    );
  }

  return (
    ip === '::' ||
    ip === '::1' ||
    /^f[cd][0-9a-f]{0,2}:/.test(ip) ||
    /^fe[89ab][0-9a-f]?:/.test(ip)
  );
};

// Plex hands out `a-b-c-d.<hash>.plex.direct` names that encode the target IP.
const isPrivatePlexDirect = (host: string): boolean => {
  const match = host.match(/^(\d+)-(\d+)-(\d+)-(\d+)\.[^.]+\.plex\.direct$/);
  return !!match && isPrivateIPv4(match.slice(1, 5).join('.'));
};

export const isLocalHost = (hostname: string): boolean => {
  const host = normalizeHost(hostname);
  if (!host) return true;

  const ipVersion = net.isIP(host);
  if (ipVersion === 4) return isPrivateIPv4(host);
  if (ipVersion === 6) return isPrivateIPv6(host);

  return (
    host === 'localhost' ||
    !host.includes('.') ||
    LOCAL_SUFFIXES.some((suffix) => host.endsWith(suffix)) ||
    isPrivatePlexDirect(host)
  );
};

const matchesBypassEntry = (host: string, entry: string): boolean => {
  if (entry.startsWith('*.') || entry.startsWith('.')) {
    const domain = entry.replace(/^\*?\./, '');
    return host === domain || host.endsWith(`.${domain}`);
  }

  return host === entry;
};

export const parseBypassFilter = (bypassFilter: string): string[] =>
  bypassFilter.split(/[,\n]/).map(normalizeHost).filter(Boolean);

export const shouldBypassProxy = (hostname: string): boolean => {
  const host = normalizeHost(hostname);

  if (state?.bypassLocalAddresses && isLocalHost(host)) return true;

  return (
    state?.bypassEntries.some((entry) => matchesBypassEntry(host, entry)) ??
    false
  );
};

const buildProxyUrl = (settings: OutboundProxySettings): URL => {
  const hostname =
    net.isIP(normalizeHost(settings.hostname)) === 6 &&
    !settings.hostname.startsWith('[')
      ? `[${settings.hostname}]`
      : settings.hostname;
  const url = new URL(
    `${settings.useSsl ? 'https' : 'http'}://${hostname}:${settings.port}`
  );

  if (settings.username) {
    url.username = settings.username;
    url.password = settings.password ?? '';
  }

  return url;
};

const buildProxyToken = (
  settings: Pick<OutboundProxySettings, 'username' | 'password'>
): string | undefined =>
  settings.username
    ? `Basic ${Buffer.from(
        `${settings.username}:${settings.password ?? ''}`
      ).toString('base64')}`
    : undefined;

export const createProxyDispatcher = (
  settings: OutboundProxySettings
): ProxyAgent => {
  const proxyUrl = buildProxyUrl(settings);
  proxyUrl.username = '';
  proxyUrl.password = '';

  return new ProxyAgent({
    uri: proxyUrl.toString(),
    token: buildProxyToken(settings),
    // Forward plain-HTTP requests instead of tunneling them; many proxies only
    // allow CONNECT to port 443. HTTPS targets still use CONNECT.
    proxyTunnel: false,
  });
};

export const initializeOutboundProxy = (
  settings: OutboundProxySettings
): void => {
  if (!settings.enabled) {
    state = null;
    return;
  }

  const proxyUrl = buildProxyUrl(settings).toString();

  state = {
    proxyUrl,
    httpAgent: new HttpProxyAgent(proxyUrl, { keepAlive: true }),
    httpsAgent: new HttpsProxyAgent(proxyUrl, { keepAlive: true }),
    dispatcher: createProxyDispatcher(settings),
    directHttpAgent: new http.Agent({ keepAlive: true }),
    directHttpsAgent: new https.Agent({ keepAlive: true }),
    directDispatcher: new Agent(),
    bypassEntries: parseBypassFilter(settings.bypassFilter),
    bypassLocalAddresses: settings.bypassLocalAddresses,
  };

  logger.info('Outbound HTTP(S) proxy enabled', {
    label: 'Outbound Proxy',
    proxy: `${settings.hostname}:${settings.port}`,
    bypassEntries: state.bypassEntries.length,
  });
};

const resolveRequestHost = (
  config: InternalAxiosRequestConfig
): string | undefined => {
  try {
    const url = config.baseURL
      ? new URL(config.url ?? '', config.baseURL)
      : new URL(config.url ?? '');
    return url.hostname;
  } catch {
    return undefined;
  }
};

const outboundProxyInterceptor = (
  config: InternalAxiosRequestConfig
): InternalAxiosRequestConfig => {
  if (!state) return config;

  const host = resolveRequestHost(config);
  const direct = !host || shouldBypassProxy(host);

  config.httpAgent = direct ? state.directHttpAgent : state.httpAgent;
  config.httpsAgent = direct ? state.directHttpsAgent : state.httpsAgent;
  config.proxy = false;

  const existingBeforeRedirect = config.beforeRedirect;
  config.beforeRedirect = (options, responseDetails, requestDetails) => {
    existingBeforeRedirect?.(options, responseDetails, requestDetails);

    const redirectHost =
      typeof options.hostname === 'string' ? options.hostname : undefined;
    if (!redirectHost || !options.agents) return;

    const redirectDirect = shouldBypassProxy(redirectHost);
    if (redirectDirect !== direct) {
      throw new Error(
        'Refusing redirect across outbound proxy bypass boundary'
      );
    }

    options.agents.http = redirectDirect
      ? state?.directHttpAgent
      : state?.httpAgent;
    options.agents.https = redirectDirect
      ? state?.directHttpsAgent
      : state?.httpsAgent;
  };

  return config;
};

/**
 * Route an Axios instance through the outbound proxy policy. Instances from
 * `axios.create()` do not inherit the default instance's interceptors, so each
 * one must be registered explicitly.
 */
export const applyOutboundProxy = <T extends AxiosInstance>(instance: T): T => {
  instance.interceptors.request.use(outboundProxyInterceptor);
  return instance;
};

applyOutboundProxy(axios);

/**
 * Server-side `fetch` that follows the outbound proxy policy. A global
 * dispatcher is deliberately avoided so Next.js server rendering, which calls
 * Streamarr's own API over loopback, is never proxied.
 */
export const outboundFetch = (
  input: string | URL,
  init: RequestInit = {}
): Promise<Response> => {
  if (!state) return fetch(input, init);

  const redirectMode = init.redirect ?? 'follow';
  const headers = new Headers(init.headers);
  let currentUrl = new URL(input);
  let currentInit = { ...init, redirect: 'manual' as RequestRedirect };
  const initialBypass = shouldBypassProxy(currentUrl.hostname);
  let redirectCount = 0;

  const request = async (): Promise<Response> => {
    const host = currentUrl.hostname;
    const dispatcher = shouldBypassProxy(host)
      ? state?.directDispatcher
      : state?.dispatcher;
    const response = await fetch(currentUrl, {
      ...currentInit,
      headers,
      dispatcher,
    } as RequestInit);

    if (![301, 302, 303, 307, 308].includes(response.status)) {
      return response;
    }

    const location = response.headers.get('location');
    if (!location || redirectMode === 'manual') return response;
    if (redirectMode === 'error') {
      throw new TypeError('Outbound request was redirected');
    }
    if (++redirectCount > 20) {
      throw new TypeError('Outbound request exceeded the redirect limit');
    }

    const redirectUrl = new URL(location, currentUrl);
    const redirectBypass = shouldBypassProxy(redirectUrl.hostname);
    if (redirectBypass !== initialBypass) {
      throw new Error(
        'Refusing redirect across outbound proxy bypass boundary'
      );
    }

    if (redirectUrl.origin !== currentUrl.origin) {
      headers.delete('authorization');
      headers.delete('cookie');
      headers.delete('proxy-authorization');
    }

    if (
      response.status === 303 ||
      ((response.status === 301 || response.status === 302) &&
        (currentInit.method ?? 'GET').toUpperCase() === 'POST')
    ) {
      currentInit = { ...currentInit, method: 'GET', body: undefined };
    }

    await response.body?.cancel();
    currentUrl = redirectUrl;
    return request();
  };

  return request();
};

/**
 * web-push only accepts `https.Agent` instances for `agent`, so proxied
 * requests use its supported `proxy` option instead.
 */
export const getWebPushTransport = (
  endpoint: string
): { proxy?: string; agent?: https.Agent } => {
  if (!state) return {};

  try {
    return shouldBypassProxy(new URL(endpoint).hostname)
      ? { agent: state.directHttpsAgent }
      : { proxy: state.proxyUrl };
  } catch {
    return { agent: state.directHttpsAgent };
  }
};

const HOSTNAME_PATTERN =
  /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/i;
const BYPASS_ENTRY_PATTERN =
  /^(\*\.|\.)?[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/i;

const isValidHost = (host: string): boolean => {
  if (host.length > 253) return false;

  const normalized = normalizeHost(host);
  const ipVersion = net.isIP(normalized);
  if (ipVersion !== 0) return true;

  if (/^\d+(?:\.\d+){3}$/.test(normalized)) return false;

  return (
    HOSTNAME_PATTERN.test(normalized) &&
    normalized.split('.').every((label) => label.length <= 63)
  );
};

/**
 * Validate an incoming outbound proxy update against the stored settings.
 * An omitted or empty password keeps the stored one; clearing the username
 * clears the password.
 */
export const resolveOutboundProxyUpdate = (
  current: OutboundProxySettings,
  incoming: Partial<OutboundProxySettings> | undefined
): { value: OutboundProxySettings } | { error: string } => {
  if (!incoming) return { value: current };

  const next: OutboundProxySettings = {
    enabled: incoming.enabled ?? current.enabled,
    hostname: (incoming.hostname ?? current.hostname).trim(),
    port: Number(incoming.port ?? current.port),
    useSsl: incoming.useSsl ?? current.useSsl,
    username: (incoming.username ?? current.username ?? '').trim(),
    password: incoming.password ? incoming.password : current.password,
    bypassFilter: (incoming.bypassFilter ?? current.bypassFilter).trim(),
    bypassLocalAddresses:
      incoming.bypassLocalAddresses ?? current.bypassLocalAddresses,
  };

  if (!next.username) {
    next.username = undefined;
    next.password = undefined;
  }

  if (next.username?.includes(':')) {
    return { error: 'Proxy username must not contain a colon' };
  }
  if (
    (next.username?.length ?? 0) > 255 ||
    (next.password?.length ?? 0) > 1024
  ) {
    return { error: 'Proxy credentials exceed the maximum supported length' };
  }
  if (next.bypassFilter.length > 2048) {
    return { error: 'Proxy bypass list is too long' };
  }

  if (!Number.isInteger(next.port) || next.port < 1 || next.port > 65535) {
    return { error: 'Proxy port must be between 1 and 65535' };
  }

  if (next.enabled && !isValidHost(next.hostname)) {
    return { error: 'A valid proxy hostname or IP address is required' };
  }

  if (next.hostname && !isValidHost(next.hostname)) {
    return { error: 'Invalid proxy hostname or IP address' };
  }

  const invalidEntry = parseBypassFilter(next.bypassFilter).find(
    (entry) => net.isIP(entry) === 0 && !BYPASS_ENTRY_PATTERN.test(entry)
  );
  if (invalidEntry) {
    return { error: `Invalid proxy bypass entry: ${invalidEntry}` };
  }

  return { value: next };
};

export const OUTBOUND_PROXY_TEST_URL = 'https://example.com/';

const describeProxyError = (e: unknown): string => {
  const codes: string[] = [];
  const messages: string[] = [];
  const names: string[] = [];
  let current: unknown = e;

  for (let depth = 0; current && depth < 6; depth++) {
    const error = current as {
      name?: string;
      message?: string;
      code?: string;
      cause?: unknown;
    };
    if (error.code) codes.push(error.code);
    if (error.message) messages.push(error.message);
    if (error.name) names.push(error.name);
    current = error.cause;
  }

  const message = messages.join(' ');

  if (/\b407\b/.test(message)) {
    return 'Proxy authentication failed';
  }
  if (
    codes.some((code) =>
      ['ECONNREFUSED', 'ENOTFOUND', 'EAI_AGAIN', 'EHOSTUNREACH'].includes(code)
    )
  ) {
    return 'Unable to connect to the proxy server';
  }
  if (
    names.includes('TimeoutError') ||
    codes.includes('UND_ERR_CONNECT_TIMEOUT')
  ) {
    return 'The proxy test request timed out';
  }

  return 'The proxy did not relay the test request';
};

/**
 * Send one bounded HTTPS request through the given (saved) proxy settings.
 * This does not reconfigure the running app; proxy changes require a restart.
 */
export const testOutboundProxy = async (
  settings: OutboundProxySettings,
  timeoutMs: number
): Promise<number> => {
  let dispatcher: ProxyAgent | undefined;

  try {
    dispatcher = createProxyDispatcher(settings);
    const response = await fetch(OUTBOUND_PROXY_TEST_URL, {
      method: 'HEAD',
      redirect: 'manual',
      dispatcher,
      signal: AbortSignal.timeout(timeoutMs),
    } as RequestInit);

    if (response.status === 407) {
      throw new Error('Proxy returned HTTP 407');
    }

    return response.status;
  } catch (e) {
    throw new Error(describeProxyError(e));
  } finally {
    await dispatcher?.close().catch(() => undefined);
  }
};
