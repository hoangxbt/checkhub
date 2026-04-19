import { isPublicIp, normalizeHostInput } from './_lib/network.js';

const GEO_FIELDS = 'status,message,country,countryCode,regionName,city,zip,lat,lon,timezone,isp,org,as,asname,query';

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
}

function getClientIp(req) {
  const forwardedFor = req.headers['x-forwarded-for'];
  if (typeof forwardedFor === 'string' && forwardedFor.trim()) {
    return normalizeHostInput(forwardedFor.split(',')[0]);
  }

  if (Array.isArray(forwardedFor) && forwardedFor.length > 0) {
    return normalizeHostInput(String(forwardedFor[0]).split(',')[0]);
  }

  return normalizeHostInput(req.socket?.remoteAddress || '');
}

export default async function handler(req, res) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const clientIp = getClientIp(req);

  if (!clientIp || !isPublicIp(clientIp)) {
    return res.status(200).json({ ip: clientIp || 'Unknown' });
  }

  try {
    const response = await fetch(`http://ip-api.com/json/${encodeURIComponent(clientIp)}?fields=${GEO_FIELDS}`);
    const data = await response.json();

    if (data.status === 'fail') {
      return res.status(200).json({ ip: clientIp });
    }

    return res.status(200).json({
      ...data,
      ip: data.query || clientIp,
    });
  } catch (error) {
    return res.status(200).json({ ip: clientIp });
  }
}
