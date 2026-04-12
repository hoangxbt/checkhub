export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const mac = req.query.mac;
  if (!mac || mac.length < 8) {
    return res.status(400).json({ error: 'Invalid MAC address parameter' });
  }

  try {
    // API 1: api.macvendors.com (Plain text)
    const res1 = await fetch(`https://api.macvendors.com/${mac}`).catch(() => null);
    if (res1 && res1.status === 200) {
      const vendor = await res1.text();
      return res.status(200).json({ vendor });
    }
    if (res1 && res1.status === 404) {
      return res.status(200).json({ vendor: 'Unknown / Not Found' });
    }

    // API 2: mac-address.alldata.pt (JSON)
    const res2 = await fetch(`https://mac-address.alldata.pt/api/${mac}`).catch(() => null);
    if (res2 && res2.status === 200) {
      const data = await res2.json();
      return res.status(200).json({ vendor: data.vendor || 'Unknown / Not Found' });
    }

    // API 3: macvendors.co (JSON)
    const res3 = await fetch(`https://macvendors.co/api/${mac}`).catch(() => null);
    if (res3 && res3.status === 200) {
      const data = await res3.json();
      const vendorInfo = data.result?.company || 'Unknown / Not Found';
      return res.status(200).json({ vendor: vendorInfo });
    }

    // If all fail
    return res.status(200).json({ vendor: 'Unknown / Rate Limited' });

  } catch (err) {
    return res.status(500).json({ error: 'Internal server error while resolving MAC' });
  }
}
