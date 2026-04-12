// src/pages/ssl-checker.js
import { createSearchBar } from '../components/search-bar.js';
import { createTableSkeleton } from '../components/loading-skeleton.js';
import { makeClickToCopy } from '../components/copy-button.js';

export function renderSslChecker() {
  const page = document.createElement('div');
  page.innerHTML = `<section class="page-hero"><div class="container">
    <h1>SSL/TLS Checker</h1>
    <p>Verify SSL/TLS certificate details, validity, and security for any domain.</p>
  </div></section>`;

  const searchSection = document.createElement('section');
  searchSection.className = 'container';
  const { form, input } = createSearchBar({
    placeholder: 'Enter domain name (e.g. github.com)',
    showTypeSelector: false,
    onSearch: (domain) => runSslCheck(domain, resultsArea),
  });
  searchSection.appendChild(form);
  page.appendChild(searchSection);

  const resultsArea = document.createElement('section');
  resultsArea.className = 'container page-section';
  page.appendChild(resultsArea);

  setTimeout(() => input.focus(), 200);
  return page;
}

async function runSslCheck(domain, container) {
  container.innerHTML = '';
  container.appendChild(createTableSkeleton(5, 2));
  try {
    // Use crt.sh API for certificate transparency logs
    const response = await fetch(`https://crt.sh/?q=${encodeURIComponent(domain)}&output=json`);
    if (!response.ok) throw new Error('SSL certificate lookup failed');
    const certs = await response.json();

    container.innerHTML = '';

    if (certs.length === 0) {
      container.innerHTML = `<div class="animate-fade-in" style="text-align:center;padding:2rem;color:var(--text-secondary)">No SSL certificates found for <strong>${domain}</strong></div>`;
      return;
    }

    // Get the most recent certificate
    const sorted = certs.sort((a, b) => new Date(b.not_before) - new Date(a.not_before));
    const latest = sorted[0];
    const notBefore = new Date(latest.not_before);
    const notAfter = new Date(latest.not_after);
    const now = new Date();
    const isValid = now >= notBefore && now <= notAfter;
    const daysLeft = Math.ceil((notAfter - now) / (24 * 60 * 60 * 1000));

    // Status card
    const card = document.createElement('div');
    card.className = 'animate-fade-in';
    card.style.cssText = `text-align:center;padding:2rem;margin-bottom:1.5rem;border-radius:var(--radius-lg);border:2px solid ${isValid ? 'var(--color-success)' : 'var(--color-error)'};background:${isValid ? 'var(--color-success-light)' : 'var(--color-error-light)'}`;
    card.innerHTML = `
      <div style="font-size:3rem;margin-bottom:0.5rem">${isValid ? '🔒' : '🔓'}</div>
      <h2 style="font-size:1.25rem;font-weight:700;color:${isValid ? 'var(--color-success)' : 'var(--color-error)'}">${isValid ? 'SSL Certificate Valid' : 'SSL Certificate Invalid/Expired'}</h2>
      <p style="color:var(--text-secondary);margin-top:0.5rem">${domain}</p>
      ${isValid ? `<p style="margin-top:0.5rem;font-weight:600;color:${daysLeft > 30 ? 'var(--color-success)' : 'var(--color-warning)'}"> ${daysLeft} days remaining</p>` : ''}`;
    container.appendChild(card);

    // Certificate details
    const fields = [
      { label: 'Common Name', value: latest.common_name },
      { label: 'Issuer', value: latest.issuer_name },
      { label: 'Valid From', value: notBefore.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) },
      { label: 'Valid Until', value: notAfter.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) },
      { label: 'Serial Number', value: latest.serial_number },
      { label: 'SAN (Names)', value: latest.name_value?.replace(/\n/g, ', ') },
    ];

    const wrapper = document.createElement('div');
    wrapper.className = 'results-table-wrapper animate-fade-in';
    wrapper.innerHTML = `<table class="results-table">
      <thead><tr><th>Field</th><th>Value</th></tr></thead>
      <tbody class="animate-stagger">${fields.map(f => `<tr>
        <td style="font-weight:600;min-width:140px">${f.label}</td>
        <td><span class="ip-value" style="word-break:break-all">${f.value || '—'}</span></td>
      </tr>`).join('')}</tbody></table>`;
    container.appendChild(wrapper);
    wrapper.querySelectorAll('.ip-value').forEach(el => makeClickToCopy(el, el.textContent));

    // Certificate history
    if (sorted.length > 1) {
      const histSection = document.createElement('div');
      histSection.style.marginTop = '1.5rem';
      histSection.innerHTML = `<h3 style="font-size:1rem;font-weight:600;margin-bottom:0.75rem;color:var(--text-primary)">Certificate History (latest ${Math.min(sorted.length, 10)})</h3>`;
      const hw = document.createElement('div');
      hw.className = 'results-table-wrapper';
      hw.innerHTML = `<table class="results-table">
        <thead><tr><th>Issuer</th><th>Not Before</th><th>Not After</th><th>Common Name</th></tr></thead>
        <tbody>${sorted.slice(0, 10).map(c => {
          const nb = new Date(c.not_before);
          const na = new Date(c.not_after);
          const valid = now >= nb && now <= na;
          return `<tr>
            <td style="font-size:0.8rem">${c.issuer_name?.substring(0, 60) || '—'}</td>
            <td>${nb.toLocaleDateString()}</td>
            <td><span style="color:${valid ? 'var(--color-success)' : 'var(--text-tertiary)'}">${na.toLocaleDateString()}</span></td>
            <td style="font-size:0.8rem">${c.common_name || '—'}</td>
          </tr>`;
        }).join('')}</tbody></table>`;
      histSection.appendChild(hw);
      container.appendChild(histSection);
    }
  } catch (error) {
    container.innerHTML = `<div class="animate-fade-in" style="text-align:center;padding:3rem;color:var(--color-error)"><p style="font-weight:600">SSL Check Failed</p><p style="margin-top:0.5rem;color:var(--text-secondary)">${error.message}</p></div>`;
  }
}
