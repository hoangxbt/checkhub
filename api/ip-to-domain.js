import { isPublicIpv4 } from './_lib/network.js';
import { isValidDomain } from '../src/utils/validators.js';

const REVERSE_IP_API = 'https://api.hackertarget.com/reverseiplookup/';
const EMPTY_RESPONSE_PATTERNS = [
  /^no dns a records found$/i,
  /^no records found$/i,
];
const PROVIDER_ERROR_PATTERNS = [
  /^api count exceeded/i,
  /^error/i,
  /^invalid/i,
];

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
}

function parseReverseIpResponse(text) {
  const lines = String(text || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length || lines.some((line) => EMPTY_RESPONSE_PATTERNS.some((pattern) => pattern.test(line)))) {
    return [];
  }

  const providerMessage = lines.join(' ');
  if (PROVIDER_ERROR_PATTERNS.some((pattern) => pattern.test(providerMessage))) {
    const error = new Error(providerMessage);
    error.code = 'PROVIDER_ERROR';
    throw error;
  }

  const seen = new Set();
  return lines
    .map((line) => line.replace(/\.$/, '').toLowerCase())
    .filter((line) => {
      if (!isValidDomain(line) || seen.has(line)) return false;
      seen.add(line);
      return true;
    });
}

export default async function handler(req, res) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const ip = typeof req.query.ip === 'string' ? req.query.ip.trim() : '';
  if (!ip || !isPublicIpv4(ip)) {
    return res.status(400).json({ error: 'Invalid IP parameter' });
  }

  try {
    const response = await fetch(`${REVERSE_IP_API}?q=${encodeURIComponent(ip)}`);
    const text = await response.text();

    if (!response.ok) {
      return res.status(502).json({
        error: `Reverse IP provider failed (${response.status})`,
        provider: 'hackertarget',
      });
    }

    const domains = parseReverseIpResponse(text);
    return res.status(200).json({
      ip,
      provider: 'hackertarget',
      count: domains.length,
      domains,
    });
  } catch (error) {
    if (error.code === 'PROVIDER_ERROR') {
      return res.status(502).json({
        error: error.message || 'Reverse IP provider failed',
        provider: 'hackertarget',
      });
    }

    return res.status(500).json({
      error: 'Internal server error while fetching reverse IP domains',
    });
  }
}
