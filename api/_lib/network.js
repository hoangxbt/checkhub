import net from 'node:net';
import { lookup } from 'node:dns/promises';

export const LOCAL_HOST_ERROR = 'Invalid or local host parameter';

const BLOCKED_HOSTNAME_PATTERNS = [
  /^localhost$/i,
  /\.localhost$/i,
  /\.local$/i,
  /\.localdomain$/i,
  /\.internal$/i,
  /\.home\.arpa$/i,
  /\.lan$/i,
];

export function normalizeHostInput(value) {
  if (typeof value !== 'string') return '';

  let host = value.trim();
  if (!host) return '';

  host = host.replace(/\.$/, '');

  if (host.startsWith('[') && host.endsWith(']')) {
    host = host.slice(1, -1);
  }

  return host.toLowerCase();
}

export function isBlockedHostname(value) {
  const host = normalizeHostInput(value);
  if (!host) return true;
  return BLOCKED_HOSTNAME_PATTERNS.some((pattern) => pattern.test(host));
}

function unwrapIpv4MappedAddress(address) {
  const normalized = normalizeHostInput(address);
  const match = normalized.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i);
  return match ? match[1] : normalized;
}

function parseIpv4(address) {
  const match = unwrapIpv4MappedAddress(address).match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!match) return null;

  const octets = match.slice(1).map((part) => Number.parseInt(part, 10));
  return octets.every((part) => part >= 0 && part <= 255) ? octets : null;
}

export function isPublicIpv4(address) {
  const octets = parseIpv4(address);
  if (!octets) return false;

  const [a, b, c, d] = octets;

  if (a === 0 || a === 10 || a === 127) return false;
  if (a === 100 && b >= 64 && b <= 127) return false;
  if (a === 169 && b === 254) return false;
  if (a === 172 && b >= 16 && b <= 31) return false;
  if (a === 192 && b === 0) return false;
  if (a === 192 && b === 168) return false;
  if (a === 198 && (b === 18 || b === 19)) return false;
  if (a === 198 && b === 51 && c === 100) return false;
  if (a === 203 && b === 0 && c === 113) return false;
  if (a >= 224) return false;
  if (a === 255 && b === 255 && c === 255 && d === 255) return false;

  return true;
}

export function isPublicIpv6(address) {
  const normalized = normalizeHostInput(address);
  if (!net.isIPv6(normalized)) return false;

  if (normalized === '::' || normalized === '::1') return false;

  const mappedIpv4 = normalized.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i);
  if (mappedIpv4) return isPublicIpv4(mappedIpv4[1]);

  const firstSegment = normalized.split(':').find((segment) => segment.length > 0) || '0';
  const firstHextet = Number.parseInt(firstSegment, 16);
  if (Number.isNaN(firstHextet)) return false;

  if ((firstHextet & 0xfe00) === 0xfc00) return false; // fc00::/7 unique local
  if (firstHextet >= 0xfe80 && firstHextet <= 0xfebf) return false; // fe80::/10 link-local
  if (firstHextet >= 0xff00) return false; // ff00::/8 multicast
  if (normalized.startsWith('2001:db8')) return false; // documentation prefix

  return true;
}

export function isPublicIp(address) {
  const normalized = unwrapIpv4MappedAddress(address);
  if (net.isIPv4(normalized)) return isPublicIpv4(normalized);
  if (net.isIPv6(normalized)) return isPublicIpv6(normalized);
  return false;
}

function normalizeResolvedAddress(address, family) {
  const normalized = unwrapIpv4MappedAddress(address);
  return {
    address: normalized,
    family: net.isIP(normalized) || family,
  };
}

export async function resolvePublicTarget(host) {
  const normalized = normalizeHostInput(host);
  if (!normalized || isBlockedHostname(normalized)) {
    throw new Error(LOCAL_HOST_ERROR);
  }

  const directFamily = net.isIP(normalized);
  if (directFamily) {
    if (!isPublicIp(normalized)) {
      throw new Error(LOCAL_HOST_ERROR);
    }

    const entry = normalizeResolvedAddress(normalized, directFamily);
    return {
      hostname: normalized,
      address: entry.address,
      family: entry.family,
      addresses: [entry],
    };
  }

  const records = await lookup(normalized, { all: true, verbatim: true });
  if (!records.length) {
    throw new Error('Could not resolve host');
  }

  if (records.some((record) => !isPublicIp(record.address))) {
    throw new Error(LOCAL_HOST_ERROR);
  }

  const addresses = records
    .map((record) => normalizeResolvedAddress(record.address, record.family))
    .sort((left, right) => left.family - right.family);

  return {
    hostname: normalized,
    address: addresses[0].address,
    family: addresses[0].family,
    addresses,
  };
}
