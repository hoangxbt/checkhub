import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Same list as constants.js
const tools = [
  '/', '/dns-lookup', '/reverse-dns', '/dns-compare', '/dnssec-check',
  '/ns-lookup', '/mx-lookup', '/txt-lookup', '/public-dns',
  '/whois', '/domain-age', '/ip-geolocation', '/asn-lookup', '/ip-to-domain',
  '/http-headers', '/ssl-checker', '/website-status',
  '/my-ip', '/spf-dmarc', '/domain-health',
  '/password-generator', '/2fa', '/base64', '/url-encode', '/json-formatter',
  '/regex-tester', '/jwt-decoder', '/hash-generator', '/uuid-generator', '/timestamp',
  '/mac-lookup', '/subnet-calc', '/port-scanner',
  '/ping-test', '/cron-parser', '/ssl-decoder', '/diff-checker'
];

let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

const date = new Date().toISOString().split('T')[0];

tools.forEach(p => {
  xml += `  <url>
    <loc>https://checkhub.org${p === '/' ? '' : p}</loc>
    <lastmod>${date}</lastmod>
    <changefreq>${p === '/' ? 'daily' : 'weekly'}</changefreq>
    <priority>${p === '/' ? '1.0' : '0.8'}</priority>
  </url>
`;
});

xml += `</urlset>`;

fs.writeFileSync(path.join(__dirname, 'public', 'sitemap.xml'), xml);
fs.writeFileSync(path.join(__dirname, 'public', 'robots.txt'), `User-agent: *
Allow: /

Sitemap: https://checkhub.org/sitemap.xml
`);

console.log('Sitemap and robots.txt generated successfully!');
