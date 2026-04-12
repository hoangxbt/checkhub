// src/pages/asn-lookup.js
import { createSearchBar } from '../components/search-bar.js';
import { createTableSkeleton } from '../components/loading-skeleton.js';
import { makeClickToCopy } from '../components/copy-button.js';
import { cacheGet, cacheSet } from '../utils/cache.js';

export function renderAsnLookup() {
  const page = document.createElement('div');
  page.innerHTML = `<section class="page-hero"><div class="container">
    <h1>ASN Lookup</h1>
    <p>Look up Autonomous System Number details, IP prefixes, and organization info.</p>
  </div></section>`;

  const searchSection = document.createElement('section');
  searchSection.className = 'container';
  const { form, input } = createSearchBar({
    placeholder: 'Enter ASN (e.g. AS15169) or IP address',
    showTypeSelector: false,
    onSearch: (query) => runAsnLookup(query, resultsArea),
  });
  searchSection.appendChild(form);
  page.appendChild(searchSection);

  const resultsArea = document.createElement('section');
  resultsArea.className = 'container page-section';
  page.appendChild(resultsArea);

  setTimeout(() => input.focus(), 200);
  return page;
}

async function runAsnLookup(query, container) {
  container.innerHTML = '';
  container.appendChild(createTableSkeleton(5, 2));
  try {
    const cleanQuery = query.replace(/^[Aa][Ss]/, '');
    const isASN = /^\d+$/.test(cleanQuery);
    const cacheKey = `asn:${cleanQuery}`;
    let data = cacheGet(cacheKey);

    if (!data) {
      let url;
      if (isASN) {
        url = `https://api.bgpview.io/asn/${cleanQuery}`;
      } else {
        url = `https://api.bgpview.io/ip/${cleanQuery}`;
      }
      const response = await fetch(url);
      if (!response.ok) throw new Error('ASN lookup failed');
      const json = await response.json();
      data = json.data;
      cacheSet(cacheKey, data, 3600000);
    }

    container.innerHTML = '';

    if (isASN) {
      // ASN details
      const card = document.createElement('div');
      card.className = 'animate-fade-in';
      card.style.cssText = 'text-align:center;padding:2.5rem;margin-bottom:1.5rem;border-radius:var(--radius-lg);background:var(--bg-surface);border:1px solid var(--border-color);box-shadow:var(--shadow-md)';
      card.innerHTML = `
        <div style="font-size:3rem;margin-bottom:0.5rem">🏗️</div>
        <h2 style="font-size:1.25rem;font-weight:700;color:var(--text-primary)">AS${data.asn}</h2>
        <p style="color:var(--text-secondary);margin-top:0.25rem">${data.name || '—'}</p>
        <p style="color:var(--text-tertiary);font-size:0.8125rem;margin-top:0.25rem">${data.description_short || ''}</p>`;
      container.appendChild(card);

      const fields = [
        { label: 'ASN', value: `AS${data.asn}` },
        { label: 'Name', value: data.name },
        { label: 'Description', value: data.description_short },
        { label: 'Country', value: data.country_code },
        { label: 'Website', value: data.website },
        { label: 'Email', value: data.email_contacts?.join(', ') || '—' },
        { label: 'Traffic Estimation', value: data.traffic_estimation },
        { label: 'RIR', value: data.rir_allocation?.rir_name },
      ];

      const wrapper = document.createElement('div');
      wrapper.className = 'results-table-wrapper animate-fade-in';
      wrapper.innerHTML = `<table class="results-table">
        <thead><tr><th>Field</th><th>Value</th></tr></thead>
        <tbody class="animate-stagger">${fields.map(f => `<tr>
          <td style="font-weight:600;min-width:160px">${f.label}</td>
          <td><span class="ip-value">${f.value || '—'}</span></td>
        </tr>`).join('')}</tbody></table>`;
      container.appendChild(wrapper);

      // Fetch prefixes
      try {
        const prefixRes = await fetch(`https://api.bgpview.io/asn/${cleanQuery}/prefixes`);
        const prefixData = await prefixRes.json();
        const v4 = (prefixData.data?.ipv4_prefixes || []).slice(0, 20);
        if (v4.length > 0) {
          const prefixSection = document.createElement('div');
          prefixSection.style.marginTop = '1.5rem';
          prefixSection.innerHTML = `<h3 style="font-size:1rem;font-weight:600;margin-bottom:0.75rem;color:var(--text-primary)">IPv4 Prefixes (showing ${Math.min(v4.length, 20)})</h3>`;
          const pw = document.createElement('div');
          pw.className = 'results-table-wrapper';
          pw.innerHTML = `<table class="results-table">
            <thead><tr><th>Prefix</th><th>Name</th><th>Description</th></tr></thead>
            <tbody>${v4.map(p => `<tr><td><span class="ip-value">${p.prefix}</span></td><td>${p.name || '—'}</td><td style="color:var(--text-secondary)">${p.description || '—'}</td></tr>`).join('')}</tbody></table>`;
          prefixSection.appendChild(pw);
          container.appendChild(prefixSection);
          pw.querySelectorAll('.ip-value').forEach(el => makeClickToCopy(el, el.textContent));
        }
      } catch {}
    } else {
      // IP lookup result
      const prefixes = data.prefixes || [];
      const fields = [
        { label: 'IP', value: data.ip || query },
        { label: 'PTR Record', value: data.ptr_record },
        { label: 'RIR', value: data.rir_allocation?.rir_name },
      ];

      const wrapper = document.createElement('div');
      wrapper.className = 'results-table-wrapper animate-fade-in';
      wrapper.innerHTML = `<table class="results-table">
        <thead><tr><th>Field</th><th>Value</th></tr></thead>
        <tbody class="animate-stagger">${fields.map(f => `<tr>
          <td style="font-weight:600">${f.label}</td>
          <td><span class="ip-value">${f.value || '—'}</span></td>
        </tr>`).join('')}
        ${prefixes.map(p => `<tr>
          <td style="font-weight:600">AS${p.asn?.asn || '?'}</td>
          <td>${p.asn?.name || '—'} — <span class="ip-value">${p.prefix}</span></td>
        </tr>`).join('')}</tbody></table>`;
      container.appendChild(wrapper);
      wrapper.querySelectorAll('.ip-value').forEach(el => makeClickToCopy(el, el.textContent));
    }
  } catch (error) {
    container.innerHTML = `<div class="animate-fade-in" style="text-align:center;padding:3rem;color:var(--color-error)"><p style="font-weight:600">ASN Lookup Failed</p><p style="margin-top:0.5rem;color:var(--text-secondary)">${error.message}</p></div>`;
  }
}
