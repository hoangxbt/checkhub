// src/pages/reverse-dns.js
import { createSearchBar } from '../components/search-bar.js';
import { createTableSkeleton } from '../components/loading-skeleton.js';
import { makeClickToCopy } from '../components/copy-button.js';
import { queryCloudflareDNS } from '../services/dns-api.js';
import { isValidIP } from '../utils/validators.js';
import { showToast } from '../components/toast.js';

export function renderReverseDns() {
  const page = document.createElement('div');
  page.innerHTML = `<section class="page-hero"><div class="container">
    <h1>Reverse DNS Lookup</h1>
    <p>Find the hostname associated with an IP address using PTR records.</p>
  </div></section>`;

  const searchSection = document.createElement('section');
  searchSection.className = 'container';
  const { form, input } = createSearchBar({
    placeholder: 'Enter IP address (e.g. 8.8.8.8)',
    showTypeSelector: false,
    onSearch: (ip) => runReverseLookup(ip, resultsArea),
  });
  searchSection.appendChild(form);
  page.appendChild(searchSection);

  const resultsArea = document.createElement('section');
  resultsArea.className = 'container page-section';
  page.appendChild(resultsArea);

  setTimeout(() => input.focus(), 200);
  return page;
}

async function runReverseLookup(ip, container) {
  if (!isValidIP(ip)) { showToast('Please enter a valid IP address', 'error'); return; }
  container.innerHTML = '';
  container.appendChild(createTableSkeleton(3, 3));
  try {
    const parts = ip.split('.').reverse();
    const ptrDomain = parts.join('.') + '.in-addr.arpa';
    const data = await queryCloudflareDNS(ptrDomain, 'PTR');
    container.innerHTML = '';
    const answers = data.Answer || [];

    const info = document.createElement('div');
    info.className = 'animate-fade-in';
    info.style.cssText = 'margin-bottom:1rem;font-size:0.875rem;color:var(--text-secondary)';
    info.innerHTML = `IP: <strong style="color:var(--text-primary)">${ip}</strong> · PTR Query: <strong style="color:var(--text-primary)">${ptrDomain}</strong>`;
    container.appendChild(info);

    if (answers.length === 0) {
      container.innerHTML += `<div class="animate-fade-in" style="text-align:center;padding:2rem;color:var(--text-secondary)">No PTR records found for <strong>${ip}</strong></div>`;
      return;
    }

    const wrapper = document.createElement('div');
    wrapper.className = 'results-table-wrapper animate-fade-in';
    wrapper.innerHTML = `<table class="results-table">
      <thead><tr><th>Hostname</th><th>TTL</th><th>Type</th></tr></thead>
      <tbody class="animate-stagger">${answers.map(a => `<tr>
        <td><span class="ip-value">${a.data}</span></td>
        <td>${a.TTL}</td>
        <td><span style="padding:0.125rem 0.5rem;border-radius:var(--radius-sm);background:var(--color-primary-light);color:var(--color-primary);font-weight:600;font-size:0.75rem">PTR</span></td>
      </tr>`).join('')}</tbody></table>`;
    container.appendChild(wrapper);
    wrapper.querySelectorAll('.ip-value').forEach(el => makeClickToCopy(el, el.textContent));
  } catch (error) {
    container.innerHTML = `<div class="animate-fade-in" style="text-align:center;padding:3rem;color:var(--color-error)"><p style="font-weight:600">Lookup Failed</p><p style="margin-top:0.5rem;color:var(--text-secondary)">${error.message}</p></div>`;
  }
}
