// src/pages/ns-lookup.js
import { createSearchBar } from '../components/search-bar.js';
import { createTableSkeleton } from '../components/loading-skeleton.js';
import { makeClickToCopy } from '../components/copy-button.js';
import { dnsLookup, queryGoogleDNS } from '../services/dns-api.js';

export function renderNsLookup() {
  const page = document.createElement('div');
  page.innerHTML = `<section class="page-hero"><div class="container">
    <h1>NS Lookup</h1>
    <p>Find nameservers for any domain. See which DNS providers host the zone.</p>
  </div></section>`;

  const searchSection = document.createElement('section');
  searchSection.className = 'container';
  const { form, input } = createSearchBar({
    placeholder: 'Enter domain name (e.g. example.com)',
    showTypeSelector: false,
    onSearch: (domain) => runNsLookup(domain, resultsArea),
  });
  searchSection.appendChild(form);
  page.appendChild(searchSection);

  const resultsArea = document.createElement('section');
  resultsArea.className = 'container page-section';
  page.appendChild(resultsArea);

  setTimeout(() => input.focus(), 200);
  return page;
}

async function runNsLookup(domain, container) {
  container.innerHTML = '';
  container.appendChild(createTableSkeleton(4, 4));
  try {
    const result = await dnsLookup(domain, 'NS');
    container.innerHTML = '';

    if (result.answers.length === 0) {
      container.innerHTML = `<div class="animate-fade-in" style="text-align:center;padding:2rem;color:var(--text-secondary)">No NS records found for <strong>${domain}</strong></div>`;
      return;
    }

    const info = document.createElement('div');
    info.className = 'animate-fade-in';
    info.style.cssText = 'margin-bottom:1rem;font-size:0.875rem;color:var(--text-secondary)';
    info.innerHTML = `Domain: <strong style="color:var(--text-primary)">${domain}</strong> · Nameservers: <strong style="color:var(--color-primary)">${result.answers.length}</strong>`;
    container.appendChild(info);

    // Resolve IPs for each NS
    const nsWithIps = await Promise.all(result.answers.map(async (ns) => {
      try {
        const aResult = await queryGoogleDNS(ns.data.replace(/\.$/, ''), 'A');
        const ips = (aResult.Answer || []).filter(a => a.type === 1).map(a => a.data);
        return { ...ns, ips };
      } catch { return { ...ns, ips: [] }; }
    }));

    const wrapper = document.createElement('div');
    wrapper.className = 'results-table-wrapper animate-fade-in';
    wrapper.innerHTML = `<table class="results-table">
      <thead><tr><th>Nameserver</th><th>IP Address</th><th>TTL</th></tr></thead>
      <tbody class="animate-stagger">${nsWithIps.map(ns => `<tr>
        <td><strong>${ns.data}</strong></td>
        <td>${ns.ips.length > 0 ? ns.ips.map(ip => `<span class="ip-value">${ip}</span>`).join(', ') : '—'}</td>
        <td>${ns.ttl}</td>
      </tr>`).join('')}</tbody></table>`;
    container.appendChild(wrapper);
    wrapper.querySelectorAll('.ip-value').forEach(el => makeClickToCopy(el, el.textContent));
  } catch (error) {
    container.innerHTML = `<div class="animate-fade-in" style="text-align:center;padding:3rem;color:var(--color-error)"><p style="font-weight:600">Lookup Failed</p><p style="margin-top:0.5rem;color:var(--text-secondary)">${error.message}</p></div>`;
  }
}
