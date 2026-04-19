import { isPublicIp } from './_lib/network.js';

const GEO_FIELDS = 'status,message,country,countryCode,regionName,city,zip,lat,lon,timezone,isp,org,as,asname,query';

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

  const ip = typeof req.query.ip === 'string' ? req.query.ip.trim() : '';
  if (!ip || !isPublicIp(ip)) {
    return res.status(400).json({ error: 'Invalid IP parameter' });
  }

  try {
    const response = await fetch(`http://ip-api.com/json/${encodeURIComponent(ip)}?fields=${GEO_FIELDS}`);
    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error while fetching geolocation' });
  }
}
