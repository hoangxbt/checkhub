// src/pages/ip-to-domain.js
import { createSearchBar } from '../components/search-bar.js';
import { createTableSkeleton } from '../components/loading-skeleton.js';
import { makeClickToCopy } from '../components/copy-button.js';
import { cacheGet, cacheSet } from '../utils/cache.js';
import { isValidIP } from '../utils/validators.js';
import { showToast } from '../components/toast.js';

export function renderIpToDomain() {
  const page = document.createElement('div');
  page.innerHTML = `<section class="page-hero"><div class="container">
    <h1>IP to Domain</h1>
    <p>Find domains hosted on a specific IP address using reverse DNS lookup.</p>
  </div></section>`;

  const searchSection = document.createElement('section');
  searchSection.className = 'container';
  const { form, input } = createSearchBar({
    placeholder: 'Enter IP address (e.g. 151.101.1.140)',
    showTypeSelector: false,
    onSearch: (ip) => runIpToDomain(ip, resultsArea),
  });
  searchSection.appendChild(form);
  page.appendChild(searchSection);

  const resultsArea = document.createElement('section');
  resultsArea.className = 'container page-section';
  page.appendChild(resultsArea);

  setTimeout(() => input.focus(), 200);
  return page;
}

async function runIpToDomain(ip, container) {
  if (!isValidIP(ip)) { showToast('Please enter a valid IP address', 'error'); return; }
  container.innerHTML = '';
  container.appendChild(createTableSkeleton(5, 2));
  try {
    const cacheKey = `ip-to-domain:${ip}`;
    let data = cacheGet(cacheKey);

    if (!data) {
      const response = await fetch(`/api/ip-to-domain?ip=${encodeURIComponent(ip)}`);
      let payload = null;

      try {
        payload = await response.json();
      } catch {
        payload = null;
      }

      if (!response.ok) {
        throw new Error(payload?.error || `Reverse IP lookup failed (${response.status})`);
      }

      data = payload;
      cacheSet(cacheKey, data, 3600000);
    }

    const domains = Array.isArray(data.domains) ? data.domains : [];

    container.innerHTML = '';

    const info = document.createElement('div');
    info.className = 'animate-fade-in';
    info.style.cssText = 'margin-bottom:1rem;font-size:0.875rem;color:var(--text-secondary)';
    info.innerHTML = `IP: <strong style="color:var(--text-primary)">${ip}</strong> - Domains found: <strong style="color:var(--color-primary)">${domains.length}</strong>`;
    container.appendChild(info);

    if (domains.length === 0) {
      container.innerHTML += `<div class="animate-fade-in" style="text-align:center;padding:2rem;color:var(--text-secondary)">
        <p>No hosted domains found for <strong>${ip}</strong></p>
        <p style="margin-top:0.5rem;font-size:0.8125rem;color:var(--text-tertiary)">The provider may not have indexed domains for this IP, or the IP may not host public websites.</p></div>`;
      return;
    }

    const wrapper = document.createElement('div');
    wrapper.className = 'results-table-wrapper animate-fade-in';
    wrapper.innerHTML = `<table class="results-table">
      <thead><tr><th>#</th><th>Domain</th></tr></thead>
      <tbody class="animate-stagger">${domains.map((domain, i) => `<tr>
        <td>${i + 1}</td>
        <td><span class="ip-value">${domain}</span></td>
      </tr>`).join('')}</tbody></table>`;
    container.appendChild(wrapper);
    wrapper.querySelectorAll('.ip-value').forEach(el => makeClickToCopy(el, el.textContent));
  } catch (error) {
    container.innerHTML = `<div class="animate-fade-in" style="text-align:center;padding:3rem;color:var(--color-error)"><p style="font-weight:600">Lookup Failed</p><p style="margin-top:0.5rem;color:var(--text-secondary)">${error.message}</p></div>`;
  }
}
