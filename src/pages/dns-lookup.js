// src/pages/dns-lookup.js
import { createSearchBar } from '../components/search-bar.js';
import { createTableSkeleton } from '../components/loading-skeleton.js';
import { dnsLookup } from '../services/dns-api.js';
import { makeClickToCopy } from '../components/copy-button.js';

export function renderDnsLookup() {
  const page = document.createElement('div');

  const hero = document.createElement('section');
  hero.className = 'page-hero';
  hero.innerHTML = `<div class="container">
    <h1>DNS Lookup</h1>
    <p>Look up DNS records for any domain. Supports A, AAAA, CNAME, MX, NS, TXT, SOA, and more.</p>
  </div>`;
  page.appendChild(hero);

  const searchSection = document.createElement('section');
  searchSection.className = 'container';
  const { form, input } = createSearchBar({
    placeholder: 'Enter domain name (e.g. example.com)',
    showTypeSelector: true,
    onSearch: (domain, type) => runLookup(domain, type, resultsArea),
  });
  searchSection.appendChild(form);
  page.appendChild(searchSection);

  const resultsArea = document.createElement('section');
  resultsArea.className = 'container page-section';
  resultsArea.id = 'dns-lookup-results';
  page.appendChild(resultsArea);

  setTimeout(() => input.focus(), 200);
  return page;
}

async function runLookup(domain, type, container) {
  container.innerHTML = '';
  container.appendChild(createTableSkeleton(5, 4));
  try {
    const result = await dnsLookup(domain, type);
    container.innerHTML = '';

    const info = document.createElement('div');
    info.className = 'animate-fade-in';
    info.style.cssText = 'margin-bottom:1rem;font-size:0.875rem;color:var(--text-secondary);display:flex;gap:1.5rem;flex-wrap:wrap';
    info.innerHTML = `<span>Domain: <strong style="color:var(--text-primary)">${result.domain}</strong></span>
      <span>Type: <strong style="color:var(--text-primary)">${result.type}</strong></span>
      <span>Resolver: <strong style="color:var(--text-primary)">${result.resolver}</strong></span>
      <span>Records: <strong style="color:var(--color-primary)">${result.answers.length}</strong></span>`;
    container.appendChild(info);

    if (result.answers.length === 0) {
      container.innerHTML += `<div class="animate-fade-in" style="text-align:center;padding:2rem;color:var(--text-secondary)">
        <p>No ${type} records found for <strong>${domain}</strong></p></div>`;
      return;
    }

    const wrapper = document.createElement('div');
    wrapper.className = 'results-table-wrapper animate-fade-in';
    const table = document.createElement('table');
    table.className = 'results-table';
    table.innerHTML = `<thead><tr><th>Name</th><th>Type</th><th>TTL</th><th>Value</th></tr></thead>`;

    const tbody = document.createElement('tbody');
    tbody.className = 'animate-stagger';

    result.answers.forEach(answer => {
      const tr = document.createElement('tr');
      const nameCell = document.createElement('td'); nameCell.textContent = answer.name;
      const typeCell = document.createElement('td');
      typeCell.innerHTML = `<span style="display:inline-block;padding:0.125rem 0.5rem;border-radius:var(--radius-sm);background:var(--color-primary-light);color:var(--color-primary);font-weight:600;font-size:0.75rem">${answer.type}</span>`;
      const ttlCell = document.createElement('td'); ttlCell.textContent = answer.ttl; ttlCell.style.color = 'var(--text-secondary)';
      const dataCell = document.createElement('td');
      const valueSpan = document.createElement('span');
      valueSpan.className = 'ip-value'; valueSpan.textContent = answer.data;
      makeClickToCopy(valueSpan, answer.data);
      dataCell.appendChild(valueSpan);
      tr.appendChild(nameCell); tr.appendChild(typeCell); tr.appendChild(ttlCell); tr.appendChild(dataCell);
      tbody.appendChild(tr);
    });

    table.appendChild(tbody); wrapper.appendChild(table); container.appendChild(wrapper);

    if (result.authority && result.authority.length > 0) {
      const authSection = document.createElement('div');
      authSection.style.marginTop = '1.5rem';
      authSection.innerHTML = `<h3 style="font-size:1rem;font-weight:600;margin-bottom:0.75rem;color:var(--text-primary)">Authority</h3>`;
      const authWrapper = document.createElement('div');
      authWrapper.className = 'results-table-wrapper';
      const authTable = document.createElement('table');
      authTable.className = 'results-table';
      authTable.innerHTML = `<thead><tr><th>Name</th><th>Type</th><th>TTL</th><th>Value</th></tr></thead>`;
      const authBody = document.createElement('tbody');
      result.authority.forEach(a => {
        authBody.innerHTML += `<tr><td>${a.name}</td><td>${a.type}</td><td>${a.ttl}</td><td style="font-family:'JetBrains Mono',monospace;font-size:0.8125rem">${a.data}</td></tr>`;
      });
      authTable.appendChild(authBody); authWrapper.appendChild(authTable); authSection.appendChild(authWrapper); container.appendChild(authSection);
    }
  } catch (error) {
    container.innerHTML = `<div class="animate-fade-in" style="text-align:center;padding:3rem;color:var(--color-error)">
      <p style="font-size:1.125rem;font-weight:600">Lookup Failed</p>
      <p style="margin-top:0.5rem;color:var(--text-secondary)">${error.message}</p></div>`;
  }
}
