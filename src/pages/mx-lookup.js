// src/pages/mx-lookup.js
import { createSearchBar } from '../components/search-bar.js';
import { createTableSkeleton } from '../components/loading-skeleton.js';
import { makeClickToCopy } from '../components/copy-button.js';
import { dnsLookup, queryGoogleDNS } from '../services/dns-api.js';

export function renderMxLookup() {
  const page = document.createElement('div');
  page.innerHTML = `<section class="page-hero"><div class="container">
    <h1>MX Lookup</h1>
    <p>Find mail exchange servers for any domain. Check email routing configuration.</p>
  </div></section>`;

  const searchSection = document.createElement('section');
  searchSection.className = 'container';
  const { form, input } = createSearchBar({
    placeholder: 'Enter domain name (e.g. gmail.com)',
    showTypeSelector: false,
    onSearch: (domain) => runMxLookup(domain, resultsArea),
  });
  searchSection.appendChild(form);
  page.appendChild(searchSection);

  const resultsArea = document.createElement('section');
  resultsArea.className = 'container page-section';
  page.appendChild(resultsArea);

  setTimeout(() => input.focus(), 200);
  return page;
}

async function runMxLookup(domain, container) {
  container.innerHTML = '';
  container.appendChild(createTableSkeleton(5, 4));
  try {
    const result = await dnsLookup(domain, 'MX');
    container.innerHTML = '';

    if (result.answers.length === 0) {
      container.innerHTML = `<div class="animate-fade-in" style="text-align:center;padding:2rem;color:var(--text-secondary)">No MX records found for <strong>${domain}</strong></div>`;
      return;
    }

    // Parse priority and hostname from MX data
    const mxRecords = result.answers.map(a => {
      const parts = a.data.split(/\s+/);
      const priority = parts.length > 1 ? parseInt(parts[0]) : 0;
      const hostname = parts.length > 1 ? parts[1] : parts[0];
      return { priority, hostname, ttl: a.ttl };
    }).sort((a, b) => a.priority - b.priority);

    // Resolve IPs
    const mxWithIps = await Promise.all(mxRecords.map(async (mx) => {
      try {
        const aResult = await queryGoogleDNS(mx.hostname.replace(/\.$/, ''), 'A');
        const ips = (aResult.Answer || []).filter(a => a.type === 1).map(a => a.data);
        return { ...mx, ips };
      } catch { return { ...mx, ips: [] }; }
    }));

    const info = document.createElement('div');
    info.className = 'animate-fade-in';
    info.style.cssText = 'margin-bottom:1rem;font-size:0.875rem;color:var(--text-secondary)';
    info.innerHTML = `Domain: <strong style="color:var(--text-primary)">${domain}</strong> · Mail Servers: <strong style="color:var(--color-primary)">${mxRecords.length}</strong>`;
    container.appendChild(info);

    const wrapper = document.createElement('div');
    wrapper.className = 'results-table-wrapper animate-fade-in';
    wrapper.innerHTML = `<table class="results-table">
      <thead><tr><th>Priority</th><th>Mail Server</th><th>IP Address</th><th>TTL</th></tr></thead>
      <tbody class="animate-stagger">${mxWithIps.map(mx => `<tr>
        <td><span style="display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:var(--radius-sm);background:${mx.priority <= 10 ? 'var(--color-success-light)' : 'var(--color-warning-light)'};color:${mx.priority <= 10 ? 'var(--color-success)' : 'var(--color-warning)'};font-weight:700;font-size:0.875rem">${mx.priority}</span></td>
        <td><strong>${mx.hostname}</strong></td>
        <td>${mx.ips.length > 0 ? mx.ips.map(ip => `<span class="ip-value">${ip}</span>`).join(', ') : '—'}</td>
        <td>${mx.ttl}</td>
      </tr>`).join('')}</tbody></table>`;
    container.appendChild(wrapper);
    wrapper.querySelectorAll('.ip-value').forEach(el => makeClickToCopy(el, el.textContent));
  } catch (error) {
    container.innerHTML = `<div class="animate-fade-in" style="text-align:center;padding:3rem;color:var(--color-error)"><p style="font-weight:600">Lookup Failed</p><p style="margin-top:0.5rem;color:var(--text-secondary)">${error.message}</p></div>`;
  }
}
