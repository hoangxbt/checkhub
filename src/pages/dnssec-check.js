// src/pages/dnssec-check.js
import { createSearchBar } from '../components/search-bar.js';
import { createTableSkeleton } from '../components/loading-skeleton.js';
import { queryGoogleDNS } from '../services/dns-api.js';

export function renderDnssecCheck() {
  const page = document.createElement('div');
  page.innerHTML = `<section class="page-hero"><div class="container">
    <h1>DNSSEC Checker</h1>
    <p>Verify if a domain has DNSSEC properly configured and enabled.</p>
  </div></section>`;

  const searchSection = document.createElement('section');
  searchSection.className = 'container';
  const { form, input } = createSearchBar({
    placeholder: 'Enter domain name (e.g. cloudflare.com)',
    showTypeSelector: false,
    onSearch: (domain) => runDnssecCheck(domain, resultsArea),
  });
  searchSection.appendChild(form);
  page.appendChild(searchSection);

  const resultsArea = document.createElement('section');
  resultsArea.className = 'container page-section';
  page.appendChild(resultsArea);

  setTimeout(() => input.focus(), 200);
  return page;
}

async function runDnssecCheck(domain, container) {
  container.innerHTML = '';
  container.appendChild(createTableSkeleton(4, 3));
  try {
    const [aResult, dnskeyResult, dsResult] = await Promise.allSettled([
      queryGoogleDNS(domain, 'A'),
      queryGoogleDNS(domain, 'DNSKEY'),
      queryGoogleDNS(domain, 'DS'),
    ]);

    const aData = aResult.status === 'fulfilled' ? aResult.value : {};
    const dnskey = dnskeyResult.status === 'fulfilled' ? dnskeyResult.value : {};
    const ds = dsResult.status === 'fulfilled' ? dsResult.value : {};

    const adFlag = aData.AD === true;
    const hasDNSKEY = (dnskey.Answer || []).length > 0;
    const hasDS = (ds.Answer || []).length > 0;
    const isSecure = adFlag || hasDNSKEY;

    container.innerHTML = '';

    // Status card
    const statusCard = document.createElement('div');
    statusCard.className = 'animate-fade-in';
    statusCard.style.cssText = `text-align:center;padding:2rem;margin-bottom:1.5rem;border-radius:var(--radius-lg);border:2px solid ${isSecure ? 'var(--color-success)' : 'var(--color-error)'};background:${isSecure ? 'var(--color-success-light)' : 'var(--color-error-light)'}`;
    statusCard.innerHTML = `
      <div style="font-size:3rem;margin-bottom:0.5rem">${isSecure ? '🛡️' : '⚠️'}</div>
      <h2 style="font-size:1.25rem;font-weight:700;color:${isSecure ? 'var(--color-success)' : 'var(--color-error)'}">${isSecure ? 'DNSSEC Enabled' : 'DNSSEC Not Detected'}</h2>
      <p style="margin-top:0.5rem;color:var(--text-secondary)">${domain}</p>`;
    container.appendChild(statusCard);

    // Details
    const checks = [
      { label: 'AD Flag (Authenticated Data)', value: adFlag, desc: 'Response was validated by the resolver' },
      { label: 'DNSKEY Records', value: hasDNSKEY, desc: `${(dnskey.Answer || []).length} DNSKEY record(s) found` },
      { label: 'DS Records', value: hasDS, desc: `${(ds.Answer || []).length} DS record(s) found` },
    ];

    const wrapper = document.createElement('div');
    wrapper.className = 'results-table-wrapper animate-fade-in';
    wrapper.innerHTML = `<table class="results-table">
      <thead><tr><th>Check</th><th>Status</th><th>Details</th></tr></thead>
      <tbody class="animate-stagger">${checks.map(c => `<tr>
        <td><strong>${c.label}</strong></td>
        <td><span class="${c.value ? 'status-resolved' : 'status-failed'}">${c.value ? '✓ Pass' : '✗ Fail'}</span></td>
        <td style="color:var(--text-secondary)">${c.desc}</td>
      </tr>`).join('')}</tbody></table>`;
    container.appendChild(wrapper);

    // DNSKEY details
    if (hasDNSKEY) {
      const keySection = document.createElement('div');
      keySection.style.marginTop = '1.5rem';
      keySection.innerHTML = `<h3 style="font-size:1rem;font-weight:600;margin-bottom:0.75rem;color:var(--text-primary)">DNSKEY Records</h3>`;
      const keyWrapper = document.createElement('div');
      keyWrapper.className = 'results-table-wrapper';
      keyWrapper.innerHTML = `<table class="results-table">
        <thead><tr><th>Flags</th><th>Algorithm</th><th>Key</th></tr></thead>
        <tbody>${(dnskey.Answer || []).map(a => {
          const parts = a.data.split(/\s+/);
          return `<tr><td>${parts[0] || '—'}</td><td>${parts[2] || '—'}</td><td style="font-family:'JetBrains Mono',monospace;font-size:0.75rem;max-width:400px;word-break:break-all">${parts.slice(3).join(' ').substring(0, 80)}...</td></tr>`;
        }).join('')}</tbody></table>`;
      keySection.appendChild(keyWrapper);
      container.appendChild(keySection);
    }
  } catch (error) {
    container.innerHTML = `<div class="animate-fade-in" style="text-align:center;padding:3rem;color:var(--color-error)"><p style="font-weight:600">Check Failed</p><p style="margin-top:0.5rem;color:var(--text-secondary)">${error.message}</p></div>`;
  }
}
