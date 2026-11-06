import { outboundFetch } from '@server/lib/outboundProxy';
import type { NetworkSettings } from '@server/lib/settings';
import { getSettings } from '@server/lib/settings';
import { isIP } from 'net';
import proxyaddr from 'proxy-addr';

export type TrustProxyFn = (address: string, hop: number) => boolean;

// proxy-addr's named ranges for loopback, link-local and private networks
const LOCAL_NETWORK_PROXIES = ['loopback', 'linklocal', 'uniquelocal'];

// https://www.cloudflare.com/ips/
export const CLOUDFLARE_IP_RANGES = [
  '173.245.48.0/20',
  '103.21.244.0/22',
  '103.22.200.0/22',
  '103.31.4.0/22',
  '141.101.64.0/18',
  '108.162.192.0/18',
  '190.93.240.0/20',
  '188.114.96.0/20',
  '197.234.240.0/22',
  '198.41.128.0/17',
  '162.158.0.0/15',
  '104.16.0.0/13',
  '104.24.0.0/14',
  '172.64.0.0/13',
  '131.0.72.0/22',
  '2400:cb00::/32',
  '2606:4700::/32',
  '2803:f800::/32',
  '2405:b500::/32',
  '2405:8100::/32',
  '2a06:98c0::/29',
  '2c0f:f248::/32',
];

const CLOUDFLARE_IPS_URL = 'https://api.cloudflare.com/client/v4/ips';

export const isValidProxyAddress = (value: string): boolean => {
  const [address, prefix, ...rest] = value.split('/');
  const version = isIP(address);
  if (!version || rest.length) {
    return false;
  }
  if (prefix === undefined) {
    return true;
  }
  // proxy-addr rejects /0, which would otherwise stop startup
  return (
    /^\d{1,3}$/.test(prefix) &&
    Number(prefix) >= 1 &&
    Number(prefix) <= (version === 4 ? 32 : 128)
  );
};

export const getCloudflareRanges = (network: NetworkSettings): string[] =>
  network.trustedProxies.cloudflareRanges ?? CLOUDFLARE_IP_RANGES;

export const getTrustProxyValue = (
  network: NetworkSettings
): false | 1 | string[] => {
  if (!network.trustProxy) {
    return false;
  }

  const { localNetworks, cloudflare, additional } = network.trustedProxies;
  const trusted = [
    ...(localNetworks ? LOCAL_NETWORK_PROXIES : []),
    ...(cloudflare ? getCloudflareRanges(network) : []),
    ...additional,
  ];

  // Nothing selected keeps the original single-hop behaviour
  return trusted.length ? trusted : 1;
};

// Shared by Express's `trust proxy` and the raw Socket.IO/WebSocket checks
export const compileTrustProxy = (network: NetworkSettings): TrustProxyFn => {
  const value = getTrustProxyValue(network);
  if (!value) {
    return () => false;
  }
  if (value === 1) {
    return (_address, hop) => hop < 1;
  }
  return proxyaddr.compile(value);
};

export const fetchCloudflareRanges = async (): Promise<string[]> => {
  const response = await outboundFetch(CLOUDFLARE_IPS_URL, {
    signal: AbortSignal.timeout(getSettings().network.requestTimeout),
  });
  if (!response.ok) {
    throw new Error(`Cloudflare responded with status ${response.status}`);
  }

  const body = (await response.json()) as {
    success?: boolean;
    result?: { ipv4_cidrs?: unknown; ipv6_cidrs?: unknown };
  };
  const ranges = [body.result?.ipv4_cidrs, body.result?.ipv6_cidrs].flatMap(
    (list) => (Array.isArray(list) ? list : [])
  );

  if (
    !body.success ||
    !ranges.length ||
    !ranges.every(
      (range) => typeof range === 'string' && isValidProxyAddress(range)
    )
  ) {
    throw new Error('Cloudflare returned an unexpected IP range list');
  }

  return ranges as string[];
};
