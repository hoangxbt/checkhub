// src/pages/dns-compare.js
import { createTableSkeleton } from '../components/loading-skeleton.js';
import { dnsLookup } from '../services/dns-api.js';
import { cleanDomainInput } from '../utils/validators.js';
import { RECORD_TYPES } from '../utils/constants.js';

export function renderDnsCompare() {
  const page = document.createElement('div');
  page.innerHTML = `<section class="page-hero"><div class="container">
    <h1>DNS Record Compare</h1>
    <p>Compare DNS records between two domains side-by-side. Spot differences instantly.</p>
  </div></section>`;

  const formSection = document.createElement('section');
  formSection.className = 'container';
  formSection.innerHTML = `
    <form id="compare-form" style="display:flex;gap:0.75rem;max-width:800px;margin:1.5rem auto;flex-wrap:wrap;align-items:center">
      <input id="domain-a" type="text" placeholder="First domain (e.g. google.com)" style="flex:1;min-width:200px;padding:0.875rem 1.25rem;border:2px solid var(--border-color);border-radius:var(--radius-lg);background:var(--bg-surface);color:var(--text-primary);font-size:1rem;outline:none" autocomplete="off" />
      <span style="color:var(--text-tertiary);font-weight:600">vs</span>
      <input id="domain-b" type="text" placeholder="Second domain (e.g. bing.com)" style="flex:1;min-width:200px;padding:0.875rem 1.25rem;border:2px solid var(--border-color);border-radius:var(--radius-lg);background:var(--bg-surface);color:var(--text-primary);font-size:1rem;outline:none" autocomplete="off" />
      <select id="compare-type" style="padding:0.875rem 0.75rem;border:2px solid var(--border-color);border-radius:var(--radius-lg);background:var(--bg-surface);color:var(--text-primary);font-size:0.875rem;outline:none">${RECORD_TYPES.map(r => `<option value="${r.value}">${r.label}</option>`).join('')}</select>
      <button type="submit" style="padding:0.875rem 1.75rem;background:linear-gradient(135deg,var(--color-primary),var(--color-accent));color:white;font-size:0.9375rem;font-weight:600;border-radius:var(--radius-lg);border:none;cursor:pointer">Compare</button>
    </form>`;
  page.appendChild(formSection);

  const resultsArea = document.createElement('section');
  resultsArea.className = 'container page-section';
  page.appendChild(resultsArea);

  setTimeout(() => {
    const form = page.querySelector('#compare-form');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const a = cleanDomainInput(page.querySelector('#domain-a').value);
      const b = cleanDomainInput(page.querySelector('#domain-b').value);
      const type = page.querySelector('#compare-type').value;
      if (a && b) runCompare(a, b, type, resultsArea);
    });
    page.querySelector('#domain-a').focus();
  }, 100);

  return page;
}

async function runCompare(domainA, domainB, type, container) {
  container.innerHTML = '';
  container.appendChild(createTableSkeleton(5, 5));
  try {
    const [resultA, resultB] = await Promise.all([dnsLookup(domainA, type), dnsLookup(domainB, type)]);
    container.innerHTML = '';

    const maxLen = Math.max(resultA.answers.length, resultB.answers.length, 1);
    let rows = '';
    for (let i = 0; i < maxLen; i++) {
      const a = resultA.answers[i];
      const b = resultB.answers[i];
      const aVal = a ? a.data : '—';
      const bVal = b ? b.data : '—';
      const match = aVal === bVal;
      const rowColor = match ? '' : 'background:var(--color-error-light)';
      rows += `<tr style="${rowColor}">
        <td>${i + 1}</td>
        <td style="font-family:'JetBrains Mono',monospace;font-size:0.8125rem">${aVal}</td>
        <td>${a ? a.ttl : '—'}</td>
        <td style="font-family:'JetBrains Mono',monospace;font-size:0.8125rem">${bVal}</td>
        <td>${b ? b.ttl : '—'}</td>
        <td><span class="${match ? 'status-resolved' : 'status-failed'}">${match ? '✓ Match' : '✗ Different'}</span></td>
      </tr>`;
    }

    const matchCount = resultA.answers.filter((a, i) => resultB.answers[i] && a.data === resultB.answers[i].data).length;
    const info = document.createElement('div');
    info.className = 'animate-fade-in';
    info.style.cssText = 'margin-bottom:1rem;font-size:0.875rem;color:var(--text-secondary);display:flex;gap:1.5rem;flex-wrap:wrap';
    info.innerHTML = `<span>Type: <strong style="color:var(--text-primary)">${type}</strong></span>
      <span>Match: <strong style="color:${matchCount === maxLen ? 'var(--color-success)' : 'var(--color-warning)'}">${matchCount}/${maxLen}</strong></span>`;
    container.appendChild(info);

    const wrapper = document.createElement('div');
    wrapper.className = 'results-table-wrapper animate-fade-in';
    wrapper.innerHTML = `<table class="results-table">
      <thead><tr><th>#</th><th>${domainA}</th><th>TTL</th><th>${domainB}</th><th>TTL</th><th>Status</th></tr></thead>
      <tbody class="animate-stagger">${rows}</tbody></table>`;
    container.appendChild(wrapper);
  } catch (error) {
    container.innerHTML = `<div class="animate-fade-in" style="text-align:center;padding:3rem;color:var(--color-error)"><p style="font-weight:600">Compare Failed</p><p style="margin-top:0.5rem;color:var(--text-secondary)">${error.message}</p></div>`;
  }
}
