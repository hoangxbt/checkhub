import { readFile } from 'node:fs/promises';
import { Resolver } from 'node:dns/promises';

const DNS_QUERY_TIMEOUT_MS = 2500;
const EMPTY_DNS_ERROR_CODES = new Set(['ENODATA', 'ENOTFOUND', 'ENONAME', 'ENODOMAIN']);

let dnsServersPromise;

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
}

async function loadDnsServers() {
  if (!dnsServersPromise) {
    dnsServersPromise = readFile(
      new URL('../src/data/dns-servers.json', import.meta.url),
      'utf8',
    ).then((contents) => JSON.parse(contents));
  }

  return dnsServersPromise;
}

function normalizeTargetName(value) {
  if (typeof value !== 'string') return '';
  return value.trim().toLowerCase().replace(/\.$/, '');
}

function withTimeout(promise, timeoutMs) {
  let timer;

  return Promise.race([
    promise,
    new Promise((_, reject) => {
      timer = setTimeout(() => {
        const error = new Error('DNS query timed out');
        error.code = 'ETIMEOUT';
        reject(error);
      }, timeoutMs);
    }),
  ]).finally(() => clearTimeout(timer));
}

async function resolveRecords(resolver, name, type) {
  switch (type) {
    case 'A':
      return resolver.resolve4(name, { ttl: true });
    case 'AAAA':
      return resolver.resolve6(name, { ttl: true });
    case 'CNAME':
      return resolver.resolveCname(name);
    case 'MX':
      return resolver.resolveMx(name);
    case 'NS':
      return resolver.resolveNs(name);
    case 'TXT':
      return resolver.resolveTxt(name);
    case 'SOA':
      return resolver.resolveSoa(name);
    case 'PTR':
      return resolver.resolvePtr(name);
    case 'SRV':
      return resolver.resolveSrv(name);
    case 'CAA':
      return resolver.resolveCaa(name);
    default:
      throw new Error(`Unsupported record type: ${type}`);
  }
}

function stringifyRecordObject(record) {
  return Object.entries(record)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([key, value]) => `${key}=${value}`)
    .join(' ');
}

function normalizeAnswers(type, answers) {
  if (!answers) {
    return { values: [], ttl: null };
  }

  switch (type) {
    case 'A':
    case 'AAAA': {
      const ttl = answers.find((record) => typeof record === 'object' && 'ttl' in record)?.ttl ?? null;
      const values = answers.map((record) => (typeof record === 'string' ? record : record.address));
      return { values, ttl };
    }
    case 'CNAME':
    case 'NS':
    case 'PTR':
      return { values: answers, ttl: null };
    case 'MX':
      return {
        values: answers.map((record) => `${record.priority} ${record.exchange}`),
        ttl: null,
      };
    case 'TXT':
      return {
        values: answers.map((chunks) => chunks.join('')),
        ttl: null,
      };
    case 'SOA':
      return {
        values: [stringifyRecordObject(answers)],
        ttl: answers.minttl ?? null,
      };
    case 'SRV':
      return {
        values: answers.map((record) => `${record.priority} ${record.weight} ${record.port} ${record.name}`),
        ttl: null,
      };
    case 'CAA':
      return {
        values: answers.map((record) => stringifyRecordObject(record)),
        ttl: null,
      };
    default:
      return { values: [], ttl: null };
  }
}

async function queryServer(server, domain, type) {
  const resolver = new Resolver();
  resolver.setServers([server.ip]);

  const startedAt = performance.now();

  try {
    const rawAnswers = await withTimeout(resolveRecords(resolver, domain, type), DNS_QUERY_TIMEOUT_MS);
    const { values, ttl } = normalizeAnswers(type, rawAnswers);

    return {
      server,
      status: values.length > 0 ? 'resolved' : 'not-resolved',
      ips: values,
      responseTime: Math.round(performance.now() - startedAt),
      ttl,
    };
  } catch (error) {
    if (EMPTY_DNS_ERROR_CODES.has(error.code)) {
      return {
        server,
        status: 'not-resolved',
        ips: [],
        responseTime: Math.round(performance.now() - startedAt),
        ttl: null,
      };
    }

    return {
      server,
      status: 'error',
      ips: [],
      responseTime: Math.round(performance.now() - startedAt),
      ttl: null,
      error: error.code === 'ETIMEOUT' ? 'DNS query timed out' : error.message,
    };
  }
}

export default async function handler(req, res) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const domain = normalizeTargetName(req.query.domain);
  const type = String(req.query.type || 'A').toUpperCase();

  if (!domain || /\s/.test(domain) || /[/?#]/.test(domain)) {
    return res.status(400).json({ error: 'Invalid domain parameter' });
  }

  try {
    const dnsServers = await loadDnsServers();
    const results = await Promise.all(dnsServers.map((server) => queryServer(server, domain, type)));
    return res.status(200).json({ domain, type, results });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error while checking propagation' });
  }
}
