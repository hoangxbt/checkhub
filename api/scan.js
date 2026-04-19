import net from 'node:net';

import { LOCAL_HOST_ERROR, resolvePublicTarget } from './_lib/network.js';

const COMMON_PORTS = [
  { p: 21, svc: 'ftp' }, { p: 22, svc: 'ssh' }, { p: 23, svc: 'telnet' },
  { p: 25, svc: 'smtp' }, { p: 53, svc: 'domain' }, { p: 80, svc: 'http' },
  { p: 110, svc: 'pop3' }, { p: 111, svc: 'rpcbind' }, { p: 135, svc: 'msrpc' },
  { p: 139, svc: 'netbios-ssn' }, { p: 143, svc: 'imap' }, { p: 443, svc: 'https' },
  { p: 445, svc: 'microsoft-ds' }, { p: 993, svc: 'imaps' }, { p: 995, svc: 'pop3s' },
  { p: 1723, svc: 'pptp' }, { p: 3306, svc: 'mysql' }, { p: 3389, svc: 'ms-wbt-server' },
  { p: 5900, svc: 'vnc' }, { p: 8080, svc: 'http-proxy' }
];

function checkPort(host, port, timeoutMs) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let status = 'closed';

    socket.setTimeout(timeoutMs);

    socket.on('connect', () => {
      status = 'open';
      socket.destroy();
    });

    socket.on('timeout', () => {
      status = 'filtered'; // Timeout usually means dropped by firewall
      socket.destroy();
    });

    socket.on('error', (err) => {
      status = 'closed'; // ECONNREFUSED means port is actively closed
    });

    socket.on('close', () => {
      resolve(status);
    });

    // Handle invalid host error quickly without crashing
    try {
      socket.connect(port, host);
    } catch (err) {
      resolve('error');
    }
  });
}

export default async function handler(req, res) {
  // Enforce CORS for safety but allow access
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const target = await resolvePublicTarget(req.query.host);

    // Scan top 20 ports in parallel with a 3.5-second timeout
    const promises = COMMON_PORTS.map(async (cp) => {
      const state = await checkPort(target.address, cp.p, 3500);
      return { port: cp.p, protocol: 'TCP', service: cp.svc, state };
    });

    const results = await Promise.all(promises);
    return res.status(200).json({
      host: target.hostname,
      resolvedAddress: target.address,
      ports: results,
    });
  } catch (err) {
    if (err.message === LOCAL_HOST_ERROR || err.message === 'Could not resolve host') {
      return res.status(400).json({ error: err.message });
    }

    return res.status(500).json({ error: 'Internal server error while scanning' });
  }
}
