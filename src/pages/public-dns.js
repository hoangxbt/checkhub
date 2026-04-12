// src/pages/public-dns.js
import { makeClickToCopy } from '../components/copy-button.js';

const PUBLIC_DNS_SERVERS = [
  { provider: 'Google Public DNS', primary: '8.8.8.8', secondary: '8.8.4.4', ipv6_primary: '2001:4860:4860::8888', ipv6_secondary: '2001:4860:4860::8844', country: 'US', doh: true, dot: true, dnssec: true, privacy: 'Logs', url: 'https://developers.google.com/speed/public-dns' },
  { provider: 'Cloudflare', primary: '1.1.1.1', secondary: '1.0.0.1', ipv6_primary: '2606:4700:4700::1111', ipv6_secondary: '2606:4700:4700::1001', country: 'US', doh: true, dot: true, dnssec: true, privacy: 'No Logs', url: 'https://1.1.1.1' },
  { provider: 'Quad9', primary: '9.9.9.9', secondary: '149.112.112.112', ipv6_primary: '2620:fe::fe', ipv6_secondary: '2620:fe::9', country: 'CH', doh: true, dot: true, dnssec: true, privacy: 'No Logs', url: 'https://quad9.net' },
  { provider: 'OpenDNS', primary: '208.67.222.222', secondary: '208.67.220.220', ipv6_primary: '2620:119:35::35', ipv6_secondary: '2620:119:53::53', country: 'US', doh: true, dot: false, dnssec: true, privacy: 'Logs', url: 'https://www.opendns.com' },
  { provider: 'AdGuard DNS', primary: '94.140.14.14', secondary: '94.140.15.15', ipv6_primary: '2a10:50c0::ad1:ff', ipv6_secondary: '2a10:50c0::ad2:ff', country: 'CY', doh: true, dot: true, dnssec: true, privacy: 'No Logs', url: 'https://adguard-dns.io' },
  { provider: 'CleanBrowsing', primary: '185.228.168.168', secondary: '185.228.169.168', ipv6_primary: '2a0d:2a00:1::', ipv6_secondary: '2a0d:2a00:2::', country: 'US', doh: true, dot: true, dnssec: true, privacy: 'No Logs', url: 'https://cleanbrowsing.org' },
  { provider: 'Comodo Secure', primary: '8.26.56.26', secondary: '8.20.247.20', ipv6_primary: '—', ipv6_secondary: '—', country: 'US', doh: false, dot: false, dnssec: true, privacy: 'Logs', url: 'https://www.comodo.com/secure-dns/' },
  { provider: 'Verisign', primary: '64.6.64.6', secondary: '64.6.65.6', ipv6_primary: '2620:74:1b::1:1', ipv6_secondary: '2620:74:1c::2:2', country: 'US', doh: false, dot: false, dnssec: true, privacy: 'No Logs', url: 'https://www.verisign.com/en_US/security-services/public-dns/index.xhtml' },
  { provider: 'Yandex DNS', primary: '77.88.8.8', secondary: '77.88.8.1', ipv6_primary: '2a02:6b8::feed:0ff', ipv6_secondary: '2a02:6b8:0:1::feed:0ff', country: 'RU', doh: true, dot: true, dnssec: true, privacy: 'Logs', url: 'https://dns.yandex.com' },
  { provider: 'DNS.WATCH', primary: '84.200.69.80', secondary: '84.200.70.40', ipv6_primary: '2001:1608:10:25::1c04:b12f', ipv6_secondary: '2001:1608:10:25::9249:d69b', country: 'DE', doh: false, dot: false, dnssec: true, privacy: 'No Logs', url: 'https://dns.watch' },
  { provider: 'Neustar UltraDNS', primary: '156.154.70.1', secondary: '156.154.71.1', ipv6_primary: '2610:a1:1018::1', ipv6_secondary: '2610:a1:1019::1', country: 'US', doh: true, dot: true, dnssec: true, privacy: 'Logs', url: 'https://www.home.neustar/dns-services' },
  { provider: 'SafeDNS', primary: '195.46.39.39', secondary: '195.46.39.40', ipv6_primary: '—', ipv6_secondary: '—', country: 'RU', doh: false, dot: false, dnssec: false, privacy: 'Logs', url: 'https://www.safedns.com' },
  { provider: 'NextDNS', primary: '45.90.28.0', secondary: '45.90.30.0', ipv6_primary: '2a07:a8c0::', ipv6_secondary: '2a07:a8c1::', country: 'US', doh: true, dot: true, dnssec: true, privacy: 'Configurable', url: 'https://nextdns.io' },
  { provider: 'Control D', primary: '76.76.2.0', secondary: '76.76.10.0', ipv6_primary: '2606:1a40::', ipv6_secondary: '2606:1a40:1::', country: 'CA', doh: true, dot: true, dnssec: true, privacy: 'No Logs', url: 'https://controld.com' },
  { provider: 'Mullvad DNS', primary: '194.242.2.2', secondary: '194.242.2.3', ipv6_primary: '—', ipv6_secondary: '—', country: 'SE', doh: true, dot: true, dnssec: true, privacy: 'No Logs', url: 'https://mullvad.net/en/help/dns-over-https-and-dns-over-tls/' },
];

function getFlagEmoji(code) {
  if (!code) return '🌐';
  return String.fromCodePoint(...[...code.toUpperCase()].map(c => 0x1F1E6 - 65 + c.charCodeAt(0)));
}

export function renderPublicDns() {
  const page = document.createElement('div');
  page.innerHTML = `<section class="page-hero"><div class="container">
    <h1>Public DNS Servers</h1>
    <p>Browse a curated list of ${PUBLIC_DNS_SERVERS.length}+ public DNS servers worldwide with features and privacy info.</p>
  </div></section>`;

  const filterSection = document.createElement('section');
  filterSection.className = 'container';
  filterSection.innerHTML = `<div style="max-width:400px;margin:1rem auto">
    <input id="dns-filter" type="text" placeholder="Search DNS providers..." style="width:100%;padding:0.75rem 1.25rem;border:2px solid var(--border-color);border-radius:var(--radius-lg);background:var(--bg-surface);color:var(--text-primary);font-size:0.9375rem;outline:none" autocomplete="off" />
  </div>`;
  page.appendChild(filterSection);

  const tableSection = document.createElement('section');
  tableSection.className = 'container page-section';
  tableSection.id = 'public-dns-table';
  page.appendChild(tableSection);

  setTimeout(() => {
    renderTable(PUBLIC_DNS_SERVERS, tableSection);
    const filter = page.querySelector('#dns-filter');
    filter.addEventListener('input', () => {
      const q = filter.value.toLowerCase();
      const filtered = PUBLIC_DNS_SERVERS.filter(s => s.provider.toLowerCase().includes(q) || s.country.toLowerCase().includes(q) || s.primary.includes(q));
      renderTable(filtered, tableSection);
    });
  }, 100);
  return page;
}

function renderTable(servers, container) {
  const feat = (v) => v ? `<span style="color:var(--color-success)">✓</span>` : `<span style="color:var(--text-tertiary)">—</span>`;
  const privBadge = (p) => {
    const colors = { 'No Logs': 'var(--color-success)', 'Logs': 'var(--color-warning)', 'Configurable': 'var(--color-primary)' };
    return `<span style="padding:0.125rem 0.5rem;border-radius:var(--radius-sm);font-size:0.7rem;font-weight:600;background:${colors[p] || 'var(--text-tertiary)'}22;color:${colors[p] || 'var(--text-tertiary)'}">${p}</span>`;
  };

  container.innerHTML = `<div class="results-table-wrapper" style="overflow-x:auto"><table class="results-table">
    <thead><tr><th>Provider</th><th>Primary</th><th>Secondary</th><th>IPv6</th><th>DoH</th><th>DoT</th><th>DNSSEC</th><th>Privacy</th></tr></thead>
    <tbody class="animate-stagger">${servers.map(s => `<tr>
      <td><strong>${getFlagEmoji(s.country)} ${s.provider}</strong></td>
      <td><span class="ip-value">${s.primary}</span></td>
      <td><span class="ip-value">${s.secondary}</span></td>
      <td style="font-size:0.75rem;color:var(--text-secondary)">${s.ipv6_primary}</td>
      <td>${feat(s.doh)}</td><td>${feat(s.dot)}</td><td>${feat(s.dnssec)}</td>
      <td>${privBadge(s.privacy)}</td>
    </tr>`).join('')}</tbody></table></div>`;
  container.querySelectorAll('.ip-value').forEach(el => makeClickToCopy(el, el.textContent));
}
