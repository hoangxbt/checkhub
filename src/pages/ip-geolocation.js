// src/pages/ip-geolocation.js
import { createSearchBar } from '../components/search-bar.js';
import { createTableSkeleton } from '../components/loading-skeleton.js';
import { makeClickToCopy } from '../components/copy-button.js';
import { cacheGet, cacheSet } from '../utils/cache.js';
import { queryGoogleDNS } from '../services/dns-api.js';
import { isValidIP } from '../utils/validators.js';

export function renderIpGeolocation() {
  const page = document.createElement('div');
  page.innerHTML = `<section class="page-hero"><div class="container">
    <h1>IP Geolocation</h1>
    <p>Find the geographic location, ISP, and organization for any IP address or domain.</p>
  </div></section>`;

  const searchSection = document.createElement('section');
  searchSection.className = 'container';
  const { form, input } = createSearchBar({
    placeholder: 'Enter IP address or domain (e.g. 8.8.8.8 or google.com)',
    showTypeSelector: false,
    onSearch: (query) => runGeoLookup(query, resultsArea),
  });
  searchSection.appendChild(form);
  page.appendChild(searchSection);

  const resultsArea = document.createElement('section');
  resultsArea.className = 'container page-section';
  page.appendChild(resultsArea);

  setTimeout(() => input.focus(), 200);
  return page;
}

function getFlagEmoji(code) {
  if (!code) return '🌐';
  return String.fromCodePoint(...[...code.toUpperCase()].map(c => 0x1F1E6 - 65 + c.charCodeAt(0)));
}

async function runGeoLookup(query, container) {
  container.innerHTML = '';
  container.appendChild(createTableSkeleton(6, 2));
  try {
    let ip = query;
    if (!isValidIP(query)) {
      const dns = await queryGoogleDNS(query, 'A');
      const aRecord = (dns.Answer || []).find(a => a.type === 1);
      if (!aRecord) throw new Error(`Could not resolve ${query} to an IP address`);
      ip = aRecord.data;
    }

    const cacheKey = `geo:${ip}`;
    let data = cacheGet(cacheKey);
    if (!data) {
      const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,regionName,city,lat,lon,isp,org,as,asname,timezone,query`);
      data = await response.json();
      if (data.status === 'fail') throw new Error(data.message || 'Geolocation lookup failed');
      cacheSet(cacheKey, data, 3600000);
    }

    container.innerHTML = '';

    // Location card
    const card = document.createElement('div');
    card.className = 'animate-fade-in';
    card.style.cssText = 'text-align:center;padding:2.5rem;margin-bottom:1.5rem;border-radius:var(--radius-lg);background:var(--bg-surface);border:1px solid var(--border-color);box-shadow:var(--shadow-md)';
    card.innerHTML = `
      <div style="font-size:4rem;margin-bottom:0.5rem">${getFlagEmoji(data.countryCode)}</div>
      <h2 style="font-size:1.25rem;font-weight:700;color:var(--text-primary)">${data.city}, ${data.regionName}</h2>
      <p style="color:var(--text-secondary);margin-top:0.25rem">${data.country}</p>
      <p style="font-family:'JetBrains Mono',monospace;margin-top:0.75rem;color:var(--color-primary);font-size:1rem;font-weight:600">${ip}</p>
      ${query !== ip ? `<p style="color:var(--text-tertiary);font-size:0.8125rem;margin-top:0.25rem">Resolved from ${query}</p>` : ''}`;
    container.appendChild(card);

    // Details table
    const fields = [
      { label: 'IP Address', value: data.query || ip },
      { label: 'Country', value: `${getFlagEmoji(data.countryCode)} ${data.country}` },
      { label: 'Region', value: data.regionName },
      { label: 'City', value: data.city },
      { label: 'Coordinates', value: `${data.lat}, ${data.lon}` },
      { label: 'Timezone', value: data.timezone },
      { label: 'ISP', value: data.isp },
      { label: 'Organization', value: data.org },
      { label: 'AS Number', value: data.as },
      { label: 'AS Name', value: data.asname },
    ];

    const wrapper = document.createElement('div');
    wrapper.className = 'results-table-wrapper animate-fade-in';
    wrapper.innerHTML = `<table class="results-table">
      <thead><tr><th>Field</th><th>Value</th></tr></thead>
      <tbody class="animate-stagger">${fields.map(f => `<tr>
        <td style="font-weight:600;min-width:140px">${f.label}</td>
        <td><span class="ip-value">${f.value || '—'}</span></td>
      </tr>`).join('')}</tbody></table>`;
    container.appendChild(wrapper);
    wrapper.querySelectorAll('.ip-value').forEach(el => makeClickToCopy(el, el.textContent));

    // Map embed
    if (data.lat && data.lon) {
      const mapDiv = document.createElement('div');
      mapDiv.className = 'animate-fade-in';
      mapDiv.style.cssText = 'margin-top:1.5rem;border-radius:var(--radius-lg);overflow:hidden;border:1px solid var(--border-color)';
      mapDiv.innerHTML = `<iframe src="https://www.openstreetmap.org/export/embed.html?bbox=${data.lon - 0.05},${data.lat - 0.05},${data.lon + 0.05},${data.lat + 0.05}&layer=mapnik&marker=${data.lat},${data.lon}" style="width:100%;height:300px;border:none"></iframe>`;
      container.appendChild(mapDiv);
    }
  } catch (error) {
    container.innerHTML = `<div class="animate-fade-in" style="text-align:center;padding:3rem;color:var(--color-error)"><p style="font-weight:600">Geolocation Failed</p><p style="margin-top:0.5rem;color:var(--text-secondary)">${error.message}</p></div>`;
  }
}
