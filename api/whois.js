import { cleanDomainInput, isValidDomain } from '../src/utils/validators.js';
import { lookupWhois } from './_lib/whois.js';

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
}

export default async function handler(req, res) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const rawDomain = typeof req.query.domain === 'string' ? req.query.domain.trim() : '';
  const domain = cleanDomainInput(rawDomain);

  if (!domain || !isValidDomain(domain)) {
    return res.status(400).json({ error: 'Invalid domain parameter' });
  }

  try {
    const result = await lookupWhois(domain);

    if (result.kind === 'record') {
      return res.status(200).json(result.data);
    }

    return res.status(result.status || 502).json({
      error: result.error || 'WHOIS lookup failed',
      code: result.code || 'provider_error',
      provider: result.provider || null,
    });
  } catch {
    return res.status(500).json({
      error: 'Internal server error while fetching WHOIS data',
      code: 'internal_error',
      provider: null,
    });
  }
}
