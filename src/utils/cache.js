// src/utils/cache.js
const DEFAULT_TTL = 5 * 60 * 1000;

export function cacheGet(key) {
  try {
    const item = sessionStorage.getItem(`checkhub:${key}`);
    if (!item) return null;
    const parsed = JSON.parse(item);
    if (Date.now() > parsed.expiry) { sessionStorage.removeItem(`checkhub:${key}`); return null; }
    return parsed.data;
  } catch { return null; }
}

export function cacheSet(key, data, ttl = DEFAULT_TTL) {
  try {
    sessionStorage.setItem(`checkhub:${key}`, JSON.stringify({ data, expiry: Date.now() + ttl }));
  } catch { sessionStorage.clear(); }
}
