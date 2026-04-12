// src/pages/txt-lookup.js
import { createSearchBar } from '../components/search-bar.js';
import { createTableSkeleton } from '../components/loading-skeleton.js';
import { makeClickToCopy } from '../components/copy-button.js';
import { dnsLookup } from '../services/dns-api.js';

export function renderTxtLookup() {
  const page = document.createElement('div');
  page.innerHTML = `<section class="page-hero"><div class="container">
    <h1>TXT Record Lookup</h1>
    <p>Look up TXT records including SPF, DKIM, and DMARC configurations.</p>
  </div></section>`;

  const searchSection = document.createElement('section');
  searchSection.className = 'container';
  const { form, input } = createSearchBar({
    placeholder: 'Enter domain name (e.g. google.com)',
    showTypeSelector: false,
    onSearch: (domain) => runTxtLookup(domain, resultsArea),
  });
  searchSection.appendChild(form);
  page.appendChild(searchSection);

  const resultsArea = document.createElement('section');
  resultsArea.className = 'container page-section';
  page.appendChild(resultsArea);

  setTimeout(() => input.focus(), 200);
  return page;
}

function classifyTxt(value) {
  const v = value.toLowerCase();
  if (v.startsWith('v=spf1')) return { label: 'SPF', color: 'var(--color-success)', bg: 'var(--color-success-light)' };
  if (v.includes('dkim')) return { label: 'DKIM', color: 'var(--color-primary)', bg: 'var(--color-primary-light)' };
  if (v.startsWith('v=dmarc1')) return { label: 'DMARC', color: 'var(--color-warning)', bg: 'var(--color-warning-light)' };
  if (v.includes('google-site-verification') || v.includes('ms=') || v.includes('facebook-domain')) return { label: 'Verification', color: 'var(--color-accent)', bg: 'var(--color-accent-light)' };
  return { label: 'TXT', color: 'var(--text-secondary)', bg: 'var(--bg-surface-hover)' };
}

async function runTxtLookup(domain, container) {
  container.innerHTML = '';
  container.appendChild(createTableSkeleton(5, 3));
  try {
    const result = await dnsLookup(domain, 'TXT');
    container.innerHTML = '';

    if (result.answers.length === 0) {
      container.innerHTML = `<div class="animate-fade-in" style="text-align:center;padding:2rem;color:var(--text-secondary)">No TXT records found for <strong>${domain}</strong></div>`;
      return;
    }

    const info = document.createElement('div');
    info.className = 'animate-fade-in';
    info.style.cssText = 'margin-bottom:1rem;font-size:0.875rem;color:var(--text-secondary)';
    info.innerHTML = `Domain: <strong style="color:var(--text-primary)">${domain}</strong> · Records: <strong style="color:var(--color-primary)">${result.answers.length}</strong>`;
    container.appendChild(info);

    const wrapper = document.createElement('div');
    wrapper.className = 'results-table-wrapper animate-fade-in';
    wrapper.innerHTML = `<table class="results-table">
      <thead><tr><th>Type</th><th>Value</th><th>TTL</th></tr></thead>
      <tbody class="animate-stagger">${result.answers.map(a => {
        const cls = classifyTxt(a.data);
        return `<tr>
          <td><span style="padding:0.125rem 0.625rem;border-radius:var(--radius-sm);background:${cls.bg};color:${cls.color};font-weight:600;font-size:0.75rem">${cls.label}</span></td>
          <td><span class="ip-value" style="word-break:break-all;font-size:0.8rem">${a.data.replace(/"/g, '')}</span></td>
          <td>${a.ttl}</td>
        </tr>`;
      }).join('')}</tbody></table>`;
    container.appendChild(wrapper);
    wrapper.querySelectorAll('.ip-value').forEach(el => makeClickToCopy(el, el.textContent));
  } catch (error) {
    container.innerHTML = `<div class="animate-fade-in" style="text-align:center;padding:3rem;color:var(--color-error)"><p style="font-weight:600">Lookup Failed</p><p style="margin-top:0.5rem;color:var(--text-secondary)">${error.message}</p></div>`;
  }
}
