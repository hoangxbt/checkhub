import net from 'net';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const host = req.query.host;
  
  if (!host || host.match(/^(127\.|192\.168\.|10\.|172\.1[6-9]\.|172\.2[0-9]\.|172\.3[0-1]\.)/)) {
    return res.status(400).json({ error: 'Invalid or local host parameter' });
  }

  function tcpPing(target, port, timeoutMs) {
    return new Promise((resolve) => {
      const socket = new net.Socket();
      const startTime = process.hrtime();
      
      let resolved = false;
      const finish = (status, time) => {
        if (resolved) return;
        resolved = true;
        socket.destroy();
        resolve({ port, status, time });
      };

      socket.setTimeout(timeoutMs);

      socket.on('connect', () => {
        const diff = process.hrtime(startTime);
        const ms = (diff[0] * 1000) + (diff[1] / 1000000);
        finish('open', ms);
      });

      socket.on('timeout', () => finish('timeout', null));
      socket.on('error', () => finish('error', null));

      try {
        socket.connect(port, target);
      } catch (err) {
        finish('error', null);
      }
    });
  }

  try {
    // Ping 4 times sequentially to simulate ICMP ping sequence
    const results = [];
    for (let i = 0; i < 4; i++) {
      // Prioritize HTTPS port 443
      const pingRes = await tcpPing(host, 443, 2000);
      results.push({ seq: i + 1, ...pingRes });
      if (i < 3) await new Promise(r => setTimeout(r, 200)); // Sleep between pings
    }

    return res.status(200).json({ host, pings: results });
  } catch (err) {
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
