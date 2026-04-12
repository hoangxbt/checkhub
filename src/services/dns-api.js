// src/services/dns-api.js
import { cacheGet, cacheSet } from '../utils/cache.js';

const GOOGLE_DOH = 'https://dns.google/resolve';
const CLOUDFLARE_DOH = 'https://cloudflare-dns.com/dns-query';

export async function queryGoogleDNS(domain, type = 'A') {
  const cacheKey = `google:${domain}:${type}`;
  const cached = cacheGet(cacheKey);
  if (cached) return cached;
  const url = `${GOOGLE_DOH}?name=${encodeURIComponent(domain)}&type=${type}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Google DNS error: ${response.status}`);
  const data = await response.json();
  cacheSet(cacheKey, data);
  return data;
}

export async function queryCloudflareDNS(domain, type = 'A') {
  const cacheKey = `cf:${domain}:${type}`;
  const cached = cacheGet(cacheKey);
  if (cached) return cached;
  const url = `${CLOUDFLARE_DOH}?name=${encodeURIComponent(domain)}&type=${type}`;
  const response = await fetch(url, { headers: { 'Accept': 'application/dns-json' } });
  if (!response.ok) throw new Error(`Cloudflare DNS error: ${response.status}`);
  const data = await response.json();
  cacheSet(cacheKey, data);
  return data;
}

export async function checkPropagation(domain, type = 'A', servers) {
  const results = await Promise.allSettled(
    servers.map(async (server) => {
      const startTime = performance.now();
      try {
        const url = `${GOOGLE_DOH}?name=${encodeURIComponent(domain)}&type=${type}`;
        const response = await fetch(url);
        const data = await response.json();
        const responseTime = Math.round(performance.now() - startTime);
        const answers = data.Answer || [];
        const ips = answers.filter(a => a.type === getTypeNumber(type) || type === 'ANY').map(a => a.data);
        return { server, status: ips.length > 0 ? 'resolved' : 'not-resolved', ips, responseTime, ttl: answers[0]?.TTL || null };
      } catch (error) {
        return { server, status: 'error', ips: [], responseTime: Math.round(performance.now() - startTime), error: error.message };
      }
    })
  );
  return results.map(r => r.status === 'fulfilled' ? r.value : { server: {}, status: 'error', ips: [], responseTime: 0, error: 'Unknown error' });
}

export async function dnsLookup(domain, type = 'A') {
  const cacheKey = `lookup:${domain}:${type}`;
  const cached = cacheGet(cacheKey);
  if (cached) return cached;

  const [googleResult, cfResult] = await Promise.allSettled([queryGoogleDNS(domain, type), queryCloudflareDNS(domain, type)]);
  const googleData = googleResult.status === 'fulfilled' ? googleResult.value : null;
  const cfData = cfResult.status === 'fulfilled' ? cfResult.value : null;
  const primary = googleData || cfData;
  if (!primary) throw new Error('DNS lookup failed from all resolvers');

  const result = {
    domain, type, status: primary.Status,
    answers: (primary.Answer || []).map(a => ({ name: a.name, type: getTypeName(a.type), ttl: a.TTL, data: a.data })),
    authority: (primary.Authority || []).map(a => ({ name: a.name, type: getTypeName(a.type), ttl: a.TTL, data: a.data })),
    queryTime: new Date().toISOString(),
    resolver: googleData ? 'Google DNS' : 'Cloudflare DNS',
  };
  cacheSet(cacheKey, result);
  return result;
}

function getTypeNumber(type) {
  const map = { A: 1, AAAA: 28, CNAME: 5, MX: 15, NS: 2, TXT: 16, SOA: 6, PTR: 12, SRV: 33, CAA: 257 };
  return map[type] || 1;
}

function getTypeName(num) {
  const map = { 1: 'A', 28: 'AAAA', 5: 'CNAME', 15: 'MX', 2: 'NS', 16: 'TXT', 6: 'SOA', 12: 'PTR', 33: 'SRV', 257: 'CAA' };
  return map[num] || `TYPE${num}`;
}
