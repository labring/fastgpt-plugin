import { lookup } from 'node:dns/promises';
import { isIP, isIPv6 } from 'node:net';

import { env } from '../../env';

export type UrlSafetyError =
  | 'invalid-url'
  | 'unsupported-protocol'
  | 'host-not-allowed'
  | 'internal-address'
  | 'dns-lookup-failed';

type UrlSafetyResult =
  | {
      ok: true;
      url: string;
    }
  | {
      ok: false;
      error: UrlSafetyError;
    };

const METADATA_HOSTNAMES = new Set([
  '169.254.169.254',
  '100.100.100.200',
  'metadata.google.internal',
  'metadata.tencentyun.com'
]);

const normalizeHostname = (hostname: string): string =>
  hostname
    .trim()
    .toLowerCase()
    .replace(/^\[(.*)]$/, '$1')
    .replace(/\.$/, '');

const getServiceLocalHost = (): string => {
  const port = `${env.PORT}`;
  if (env.HOSTNAME && isIPv6(env.HOSTNAME)) {
    return `[${env.HOSTNAME}]:${port}`;
  }
  return `${env.HOSTNAME || 'localhost'}:${port}`;
};

const isIPv4InRange = (parts: number[], first: number, second?: number): boolean => {
  if (parts[0] !== first) return false;
  return second === undefined || parts[1] === second;
};

const isPrivateIPv4 = (address: string): boolean => {
  const parts = address.split('.').map(Number);
  if (
    parts.length !== 4 ||
    parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)
  ) {
    return true;
  }

  return (
    parts[0] === 0 ||
    parts[0] === 10 ||
    parts[0] === 127 ||
    (parts[0] === 100 && parts[1] >= 64 && parts[1] <= 127) ||
    (parts[0] === 169 && parts[1] === 254) ||
    (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
    isIPv4InRange(parts, 192, 0) ||
    isIPv4InRange(parts, 192, 168) ||
    (parts[0] === 198 && (parts[1] === 18 || parts[1] === 19)) ||
    parts[0] >= 224
  );
};

const isPrivateIPv6 = (address: string): boolean => {
  const normalized = normalizeHostname(address);
  const mappedIpv4 = normalized.match(/^(?:::ffff:|0:0:0:0:0:ffff:)(\d{1,3}(?:\.\d{1,3}){3})$/);

  if (mappedIpv4) {
    return isPrivateIPv4(mappedIpv4[1]);
  }

  return (
    normalized === '::' ||
    normalized === '::1' ||
    normalized.startsWith('fc') ||
    normalized.startsWith('fd') ||
    normalized.startsWith('fe8') ||
    normalized.startsWith('fe9') ||
    normalized.startsWith('fea') ||
    normalized.startsWith('feb') ||
    normalized.startsWith('ff') ||
    normalized.startsWith('2001:db8:')
  );
};

const getAllowedInstallHosts = (): string[] =>
  (env.ALLOWED_INSTALL_HOSTS ?? '')
    .split(',')
    .map((host) => normalizeHostname(host))
    .filter(Boolean);

const isAllowedHost = (hostname: string): boolean => {
  const allowedHosts = getAllowedInstallHosts();
  if (allowedHosts.length === 0) return true;

  const normalized = normalizeHostname(hostname);
  return allowedHosts.some((allowedHost) => {
    if (allowedHost.startsWith('*.')) {
      const domain = allowedHost.slice(2);
      return normalized.endsWith(`.${domain}`);
    }
    return normalized === allowedHost;
  });
};

const isInternalHostname = (hostname: string): boolean => {
  const normalized = normalizeHostname(hostname);
  const ipType = isIP(normalized);

  if (normalized === 'localhost' || normalized.endsWith('.localhost')) {
    return true;
  }

  if (METADATA_HOSTNAMES.has(normalized)) {
    return true;
  }

  if (ipType === 4) {
    return isPrivateIPv4(normalized);
  }

  if (ipType === 6) {
    return isPrivateIPv6(normalized);
  }

  return false;
};

const shouldBypassNetworkSafety = (): boolean =>
  env.DISABLE_SSRF_CHECK && env.NODE_ENV !== 'production';

export const isInternalAddress = (url: string): boolean => {
  try {
    const parsedUrl = new URL(url);

    if (parsedUrl.host === getServiceLocalHost()) {
      return true;
    }

    return isInternalHostname(parsedUrl.hostname);
  } catch {
    return true;
  }
};

export const validateExternalFetchUrl = async (url: string): Promise<UrlSafetyResult> => {
  let parsedUrl: URL;

  try {
    parsedUrl = new URL(url);
  } catch {
    return { ok: false, error: 'invalid-url' };
  }

  if (shouldBypassNetworkSafety()) {
    return { ok: true, url: parsedUrl.toString() };
  }

  if (parsedUrl.protocol !== 'https:') {
    return { ok: false, error: 'unsupported-protocol' };
  }

  if (!isAllowedHost(parsedUrl.hostname)) {
    return { ok: false, error: 'host-not-allowed' };
  }

  if (isInternalAddress(parsedUrl.toString())) {
    return { ok: false, error: 'internal-address' };
  }

  const hostname = normalizeHostname(parsedUrl.hostname);
  if (isIP(hostname) === 0) {
    try {
      const addresses = await lookup(hostname, { all: true, verbatim: true });
      if (addresses.some(({ address }) => isInternalHostname(address))) {
        return { ok: false, error: 'internal-address' };
      }
    } catch {
      return { ok: false, error: 'dns-lookup-failed' };
    }
  }

  return { ok: true, url: parsedUrl.toString() };
};
