import net from 'node:net';

import { LOCAL_HOST_ERROR, resolvePublicTarget } from './_lib/network.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
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
    const target = await resolvePublicTarget(req.query.host);

    // Ping 4 times sequentially to simulate ICMP ping sequence
    const results = [];
    for (let i = 0; i < 4; i++) {
      // Prioritize HTTPS port 443
      const pingRes = await tcpPing(target.address, 443, 2000);
      results.push({ seq: i + 1, ...pingRes });
      if (i < 3) await new Promise(r => setTimeout(r, 200)); // Sleep between pings
    }

    return res.status(200).json({
      host: target.hostname,
      resolvedAddress: target.address,
      pings: results,
    });
  } catch (err) {
    if (err.message === LOCAL_HOST_ERROR || err.message === 'Could not resolve host') {
      return res.status(400).json({ error: err.message });
    }

    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
