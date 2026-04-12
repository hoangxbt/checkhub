import crypto from 'crypto';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const certString = req.body.cert;
    if (!certString || !certString.includes('BEGIN CERTIFICATE')) {
      return res.status(400).json({ error: 'Invalid Certificate Format. Standard PEM expected.' });
    }

    // Node.js native X509Parser
    const cert = new crypto.X509Certificate(certString);
    
    // Parse validity
    const validFrom = new Date(cert.validFrom);
    const validTo = new Date(cert.validTo);
    const now = new Date();
    const daysRemaining = Math.ceil((validTo - now) / (1000 * 60 * 60 * 24));
    
    // Check if expired
    const isExpired = now > validTo;

    return res.status(200).json({
      subject: cert.subject,
      issuer: cert.issuer,
      validFrom: validFrom.toISOString(),
      validTo: validTo.toISOString(),
      daysRemaining,
      isExpired,
      fingerprint: cert.fingerprint,
      fingerprint256: cert.fingerprint256,
      serialNumber: cert.serialNumber,
      subjectAltName: cert.subjectAltName || '',
      keyUsage: cert.keyUsage || [],
      infoAccess: cert.infoAccess || '',
    });

  } catch (err) {
    return res.status(400).json({ error: 'Failed to parse certificate. It may be corrupt or malformed.' });
  }
}
