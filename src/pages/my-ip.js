// src/pages/my-ip.js
import { makeClickToCopy } from '../components/copy-button.js';
import { cacheGet, cacheSet } from '../utils/cache.js';

export function renderMyIp() {
  const page = document.createElement('div');
  page.innerHTML = `<section class="page-hero"><div class="container">
    <h1>What is My IP Address?</h1>
    <p>Instantly see your public IP address, location, ISP, and connection details.</p>
  </div></section>`;

  const resultsArea = document.createElement('section');
  resultsArea.className = 'container page-section';
  resultsArea.innerHTML = `<div style="display:flex;justify-content:center;padding:3rem"><div class="skeleton" style="width:200px;height:200px;border-radius:50%"></div></div>`;
  page.appendChild(resultsArea);

  setTimeout(() => loadMyIp(resultsArea), 100);
  return page;
}

function getFlagEmoji(code) {
  if (!code) return '🌐';
  return String.fromCodePoint(...[...code.toUpperCase()].map(c => 0x1F1E6 - 65 + c.charCodeAt(0)));
}

async function loadMyIp(container) {
  try {
    let data = cacheGet('myip2');
    if (!data) {
      // Try ipapi.co first (HTTPS, 1000 req/day), ip-api.com as fallback
      let geoData = null;
      try {
        const res = await fetch('https://ipapi.co/json/');
        if (res.ok) {
          const json = await res.json();
          if (!json.error) geoData = json;
        }
      } catch {}

      if (!geoData) {
        try {
          const res = await fetch('http://ip-api.com/json/?fields=status,query,country,countryCode,regionName,city,zip,lat,lon,timezone,isp,org,as,asname');
          const json = await res.json();
          if (json.status === 'success') {
            geoData = {
              ip: json.query, city: json.city, region: json.regionName,
              country_name: json.country, country_code: json.countryCode,
              postal: json.zip, latitude: json.lat, longitude: json.lon,
              timezone: json.timezone, org: json.org || json.isp,
              asn: json.as, hostname: json.asname || '—',
            };
          }
        } catch {}
      }

      if (!geoData) {
        // Last resort: at least get the IP
        try {
          const ipRes = await fetch('https://api.ipify.org?format=json');
          const ipJson = await ipRes.json();
          geoData = { ip: ipJson.ip };
        } catch { geoData = {}; }
      }

      data = {
        ip: geoData.ip || geoData.query || 'Unknown',
        city: geoData.city || '—',
        region: geoData.region || geoData.regionName || '—',
        country: geoData.country_name || geoData.country || '—',
        countryCode: geoData.country_code || geoData.countryCode || '',
        postal: geoData.postal || geoData.zip || '—',
        lat: geoData.latitude || geoData.lat,
        lon: geoData.longitude || geoData.lon,
        timezone: geoData.timezone || '—',
        utcOffset: geoData.utc_offset || '',
        isp: geoData.org || geoData.isp || '—',
        asn: geoData.asn || geoData.as || '—',
        hostname: geoData.hostname || geoData.asname || '—',
        currency: geoData.currency || '—',
        languages: geoData.languages || '—',
      };
      cacheSet('myip2', data, 300000);
    }

    container.innerHTML = '';

    // Big IP Card
    const ipCard = document.createElement('div');
    ipCard.className = 'animate-fade-in';
    ipCard.style.cssText = 'text-align:center;padding:3rem 2rem;margin-bottom:2rem;border-radius:var(--radius-xl);background:linear-gradient(135deg,var(--color-primary),var(--color-accent));position:relative;overflow:hidden;box-shadow:0 20px 60px -12px rgba(37,99,235,0.4)';
    ipCard.innerHTML = `
      <div style="position:absolute;inset:0;background:radial-gradient(circle at 30% 50%,rgba(255,255,255,0.1),transparent 70%)"></div>
      <div style="position:relative;z-index:1">
        <p style="color:rgba(255,255,255,0.8);font-size:0.875rem;font-weight:500;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:0.75rem">Your Public IP Address</p>
        <h2 id="my-ip-display" style="font-family:'JetBrains Mono',monospace;font-size:2.5rem;font-weight:700;color:white;cursor:pointer;transition:transform 0.15s" title="Click to copy">${data.ip}</h2>
        <p style="color:rgba(255,255,255,0.7);font-size:0.8125rem;margin-top:0.5rem">click to copy</p>
        <div style="margin-top:1.5rem;display:flex;justify-content:center;gap:2rem;flex-wrap:wrap">
          <div style="text-align:center"><span style="display:block;font-size:2rem">${getFlagEmoji(data.countryCode)}</span><span style="font-size:0.75rem;color:rgba(255,255,255,0.8)">${data.country}</span></div>
          <div style="text-align:center"><span style="display:block;font-size:1.25rem;font-weight:600;color:white">${data.city}</span><span style="font-size:0.75rem;color:rgba(255,255,255,0.8)">${data.region}</span></div>
          <div style="text-align:center"><span style="display:block;font-size:1.25rem;font-weight:600;color:white">${data.timezone}</span><span style="font-size:0.75rem;color:rgba(255,255,255,0.8)">Timezone</span></div>
        </div>
      </div>`;
    container.appendChild(ipCard);

    // Click to copy
    const ipDisplay = ipCard.querySelector('#my-ip-display');
    makeClickToCopy(ipDisplay, data.ip);

    // Details grid
    const details = [
      { icon: '🌍', label: 'Location', value: `${data.city}, ${data.region}, ${data.country}` },
      { icon: '📮', label: 'Postal Code', value: data.postal },
      { icon: '📍', label: 'Coordinates', value: data.lat && data.lon ? `${data.lat}, ${data.lon}` : '—' },
      { icon: '🕐', label: 'Timezone', value: `${data.timezone} (${data.utcOffset})` },
      { icon: '🏢', label: 'ISP / Organization', value: data.isp },
      { icon: '🔗', label: 'ASN', value: data.asn },
      { icon: '🖥️', label: 'Hostname', value: data.hostname },
      { icon: '💱', label: 'Currency', value: data.currency },
      { icon: '🗣️', label: 'Languages', value: data.languages },
    ];

    const grid = document.createElement('div');
    grid.className = 'animate-fade-in';
    grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:1rem;margin-bottom:2rem';
    grid.innerHTML = details.map(d => `
      <div style="padding:1rem 1.25rem;border-radius:var(--radius-lg);background:var(--bg-surface);border:1px solid var(--border-color);display:flex;align-items:center;gap:1rem;transition:transform 0.15s,box-shadow 0.15s" onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='var(--shadow-md)'" onmouseout="this.style.transform='';this.style.boxShadow=''">
        <span style="font-size:1.5rem;flex-shrink:0">${d.icon}</span>
        <div style="min-width:0">
          <p style="font-size:0.75rem;color:var(--text-tertiary);text-transform:uppercase;letter-spacing:0.05em">${d.label}</p>
          <p class="ip-value" style="font-size:0.9375rem;font-weight:600;color:var(--text-primary);word-break:break-all">${d.value}</p>
        </div>
      </div>`).join('');
    container.appendChild(grid);
    grid.querySelectorAll('.ip-value').forEach(el => makeClickToCopy(el, el.textContent));

    // Map
    if (data.lat && data.lon) {
      const mapDiv = document.createElement('div');
      mapDiv.className = 'animate-fade-in';
      mapDiv.style.cssText = 'border-radius:var(--radius-lg);overflow:hidden;border:1px solid var(--border-color)';
      mapDiv.innerHTML = `<iframe src="https://www.openstreetmap.org/export/embed.html?bbox=${data.lon - 0.1},${data.lat - 0.05},${data.lon + 0.1},${data.lat + 0.05}&layer=mapnik&marker=${data.lat},${data.lon}" style="width:100%;height:300px;border:none" loading="lazy"></iframe>`;
      container.appendChild(mapDiv);
    }
  } catch (error) {
    container.innerHTML = `<div class="animate-fade-in" style="text-align:center;padding:3rem;color:var(--color-error)"><p style="font-weight:600">Could not detect your IP</p><p style="margin-top:0.5rem;color:var(--text-secondary)">${error.message}</p></div>`;
  }
}
