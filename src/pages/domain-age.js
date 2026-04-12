// src/pages/domain-age.js
import { createSearchBar } from '../components/search-bar.js';
import { createTableSkeleton } from '../components/loading-skeleton.js';
import { cacheGet, cacheSet } from '../utils/cache.js';

export function renderDomainAge() {
  const page = document.createElement('div');
  page.innerHTML = `<section class="page-hero"><div class="container">
    <h1>Domain Age Checker</h1>
    <p>Check how old a domain is. See creation date, expiry date, and age breakdown.</p>
  </div></section>`;

  const searchSection = document.createElement('section');
  searchSection.className = 'container';
  const { form, input } = createSearchBar({
    placeholder: 'Enter domain name (e.g. google.com)',
    showTypeSelector: false,
    onSearch: (domain) => runDomainAge(domain, resultsArea),
  });
  searchSection.appendChild(form);
  page.appendChild(searchSection);

  const resultsArea = document.createElement('section');
  resultsArea.className = 'container page-section';
  page.appendChild(resultsArea);

  setTimeout(() => input.focus(), 200);
  return page;
}

async function runDomainAge(domain, container) {
  container.innerHTML = '';
  container.appendChild(createTableSkeleton(4, 2));
  try {
    const cacheKey = `whois:${domain}`;
    let data = cacheGet(cacheKey);
    if (!data) {
      const rdap = await fetch(`https://rdap.org/domain/${encodeURIComponent(domain)}`);
      if (!rdap.ok) throw new Error('Could not fetch domain info.');
      const json = await rdap.json();
      const events = json.events || [];
      const getEvent = (action) => (events.find(e => e.eventAction === action) || {}).eventDate;
      data = { creation_date: getEvent('registration'), expiration_date: getEvent('expiration'), updated_date: getEvent('last changed') };
      cacheSet(cacheKey, data, 3600000);
    }

    container.innerHTML = '';
    const created = data.creation_date ? new Date(data.creation_date) : null;
    const expires = data.expiration_date ? new Date(data.expiration_date) : null;
    const now = new Date();

    if (!created) {
      container.innerHTML = `<div class="animate-fade-in" style="text-align:center;padding:2rem;color:var(--text-secondary)">Could not determine creation date for <strong>${domain}</strong></div>`;
      return;
    }

    const diff = now - created;
    const years = Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
    const months = Math.floor((diff % (365.25 * 24 * 60 * 60 * 1000)) / (30.44 * 24 * 60 * 60 * 1000));
    const days = Math.floor((diff % (30.44 * 24 * 60 * 60 * 1000)) / (24 * 60 * 60 * 1000));

    // Age card
    const ageCard = document.createElement('div');
    ageCard.className = 'animate-fade-in';
    ageCard.style.cssText = 'text-align:center;padding:2.5rem;margin-bottom:1.5rem;border-radius:var(--radius-lg);background:var(--bg-surface);border:1px solid var(--border-color);box-shadow:var(--shadow-md)';
    ageCard.innerHTML = `
      <div style="font-size:3rem;margin-bottom:0.75rem">📅</div>
      <h2 style="font-size:1.5rem;font-weight:700;color:var(--text-primary)">${domain}</h2>
      <div style="margin-top:1rem;display:flex;justify-content:center;gap:2rem;flex-wrap:wrap">
        <div style="text-align:center"><span style="display:block;font-size:2rem;font-weight:700;color:var(--color-primary)">${years}</span><span style="font-size:0.8125rem;color:var(--text-secondary)">Years</span></div>
        <div style="text-align:center"><span style="display:block;font-size:2rem;font-weight:700;color:var(--color-accent)">${months}</span><span style="font-size:0.8125rem;color:var(--text-secondary)">Months</span></div>
        <div style="text-align:center"><span style="display:block;font-size:2rem;font-weight:700;color:var(--color-success)">${days}</span><span style="font-size:0.8125rem;color:var(--text-secondary)">Days</span></div>
      </div>`;
    container.appendChild(ageCard);

    // Timeline
    const fmt = (d) => d ? d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—';
    let daysUntilExpiry = expires ? Math.ceil((expires - now) / (24 * 60 * 60 * 1000)) : null;

    const wrapper = document.createElement('div');
    wrapper.className = 'results-table-wrapper animate-fade-in';
    wrapper.innerHTML = `<table class="results-table">
      <thead><tr><th>Event</th><th>Date</th><th>Info</th></tr></thead>
      <tbody class="animate-stagger">
        <tr><td><strong>🟢 Created</strong></td><td>${fmt(created)}</td><td style="color:var(--text-secondary)">${years} years ago</td></tr>
        ${data.updated_date ? `<tr><td><strong>🔄 Last Updated</strong></td><td>${fmt(new Date(data.updated_date))}</td><td style="color:var(--text-secondary)">—</td></tr>` : ''}
        ${expires ? `<tr><td><strong>${daysUntilExpiry > 0 ? '📋' : '🔴'} Expires</strong></td><td>${fmt(expires)}</td><td style="color:${daysUntilExpiry > 90 ? 'var(--color-success)' : daysUntilExpiry > 30 ? 'var(--color-warning)' : 'var(--color-error)'}; font-weight:600">${daysUntilExpiry > 0 ? `${daysUntilExpiry} days remaining` : 'EXPIRED'}</td></tr>` : ''}
      </tbody></table>`;
    container.appendChild(wrapper);
  } catch (error) {
    container.innerHTML = `<div class="animate-fade-in" style="text-align:center;padding:3rem;color:var(--color-error)"><p style="font-weight:600">Lookup Failed</p><p style="margin-top:0.5rem;color:var(--text-secondary)">${error.message}</p></div>`;
  }
}
