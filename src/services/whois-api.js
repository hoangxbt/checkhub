import { cacheGet, cacheSet } from '../utils/cache.js';

const WHOIS_CACHE_TTL_MS = 3600000;
const WHOIS_CACHE_VERSION = 'whois3';

export class WhoisLookupError extends Error {
  constructor(message, { code = null, provider = null, status = null } = {}) {
    super(message);
    this.name = 'WhoisLookupError';
    this.code = code;
    this.provider = provider;
    this.status = status;
  }
}

export async function fetchWhois(domain) {
  const cacheKey = `${WHOIS_CACHE_VERSION}:${domain}`;
  const cached = cacheGet(cacheKey);
  if (cached) {
    return cached;
  }

  const response = await fetch(`/api/whois?domain=${encodeURIComponent(domain)}`);
  let payload = null;

  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw new WhoisLookupError(
      payload?.error || `WHOIS lookup failed (${response.status})`,
      {
        code: payload?.code || null,
        provider: payload?.provider || null,
        status: response.status,
      },
    );
  }

  cacheSet(cacheKey, payload, WHOIS_CACHE_TTL_MS);
  return payload;
}
