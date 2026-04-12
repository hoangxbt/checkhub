// src/pages/whois.js
import { createSearchBar } from '../components/search-bar.js';
import { createTableSkeleton } from '../components/loading-skeleton.js';
import { makeClickToCopy } from '../components/copy-button.js';
import { cacheGet, cacheSet } from '../utils/cache.js';

export function renderWhois() {
  const page = document.createElement('div');
  page.innerHTML = `<section class="page-hero"><div class="container">
    <h1>WHOIS Lookup</h1>
    <p>Look up domain registration information including registrar, dates, and nameservers.</p>
  </div></section>`;

  const searchSection = document.createElement('section');
  searchSection.className = 'container';
  const { form, input } = createSearchBar({
    placeholder: 'Enter domain name (e.g. google.com)',
    showTypeSelector: false,
    onSearch: (domain) => runWhois(domain, resultsArea),
  });
  searchSection.appendChild(form);
  page.appendChild(searchSection);

  const resultsArea = document.createElement('section');
  resultsArea.className = 'container page-section';
  page.appendChild(resultsArea);

  setTimeout(() => input.focus(), 200);
  return page;
}

async function runWhois(domain, container) {
  container.innerHTML = '';
  container.appendChild(createTableSkeleton(10, 2));
  try {
    const cacheKey = `whois2:${domain}`;  // v2 key to avoid stale cache from old format
    let parsed = cacheGet(cacheKey);

    if (!parsed) {
      // Primary: RDAP protocol (standardized, free, no key needed)
      const rdapUrl = `https://rdap.org/domain/${encodeURIComponent(domain)}`;
      const response = await fetch(rdapUrl);

      if (!response.ok) {
        if (response.status === 404) {
          container.innerHTML = `<div class="animate-fade-in" style="text-align:center;padding:3rem">
            <div style="font-size:3rem;margin-bottom:0.75rem">🔍</div>
            <h2 style="font-size:1.25rem;font-weight:700;color:var(--text-primary)">Domain Not Found</h2>
            <p style="color:var(--text-secondary);margin-top:0.5rem">No WHOIS data found for <strong>${domain}</strong>. The domain may not be registered.</p></div>`;
          return;
        }
        throw new Error(`RDAP lookup failed (${response.status})`);
      }

      const rdap = await response.json();
      parsed = parseRDAPResponse(rdap, domain);
      cacheSet(cacheKey, parsed, 3600000); // 1 hour cache
    }

    container.innerHTML = '';
    renderWhoisResults(parsed, domain, container);
  } catch (error) {
    container.innerHTML = `<div class="animate-fade-in" style="text-align:center;padding:3rem;color:var(--color-error)">
      <p style="font-weight:600">WHOIS Lookup Failed</p>
      <p style="margin-top:0.5rem;color:var(--text-secondary)">${error.message}</p>
      <p style="margin-top:0.5rem;color:var(--text-tertiary);font-size:0.8125rem">RDAP servers may be temporarily unavailable. Try again in a moment.</p></div>`;
  }
}

function parseRDAPResponse(rdap, domain) {
  const result = {
    domainName: rdap.ldhName || rdap.unicodeName || domain,
    handle: rdap.handle || '—',
    status: Array.isArray(rdap.status) ? rdap.status : [],
    events: {},
    nameservers: [],
    registrar: null,
    registrant: null,
    secureDNS: null,
    port43: rdap.port43 || null,
    links: [],
    rawEntities: [],
  };

  // Events (registration, expiration, last changed, last update of RDAP database)
  if (Array.isArray(rdap.events)) {
    rdap.events.forEach(event => {
      if (event.eventAction && event.eventDate) {
        result.events[event.eventAction] = event.eventDate;
      }
    });
  }

  // Nameservers
  if (Array.isArray(rdap.nameservers)) {
    result.nameservers = rdap.nameservers.map(ns => {
      const name = ns.ldhName || ns.unicodeName || '—';
      const v4 = ns.ipAddresses?.v4 || [];
      const v6 = ns.ipAddresses?.v6 || [];
      return { name, v4, v6 };
    });
  }

  // DNSSEC
  if (rdap.secureDNS) {
    result.secureDNS = {
      delegationSigned: rdap.secureDNS.delegationSigned || false,
      zoneSigned: rdap.secureDNS.zoneSigned || false,
    };
  }

  // Entities (registrar, registrant, admin, tech, abuse)
  if (Array.isArray(rdap.entities)) {
    rdap.entities.forEach(entity => {
      const roles = entity.roles || [];
      const info = extractEntityInfo(entity);

      if (roles.includes('registrar')) {
        result.registrar = info;
        // Check for nested entities in registrar (abuse contact)
        if (Array.isArray(entity.entities)) {
          entity.entities.forEach(sub => {
            const subInfo = extractEntityInfo(sub);
            if ((sub.roles || []).includes('abuse')) {
              result.registrar.abuseEmail = subInfo.email;
              result.registrar.abusePhone = subInfo.phone;
            }
          });
        }
      }
      if (roles.includes('registrant')) result.registrant = info;

      result.rawEntities.push({ roles, ...info });
    });
  }

  // Links
  if (Array.isArray(rdap.links)) {
    result.links = rdap.links.filter(l => l.href).map(l => ({ rel: l.rel, href: l.href, type: l.type }));
  }

  return result;
}

function extractEntityInfo(entity) {
  const info = {
    handle: entity.handle || null,
    name: null,
    org: null,
    email: null,
    phone: null,
    address: null,
    url: null,
  };

  // Parse vCard (jCard format)
  if (entity.vcardArray && Array.isArray(entity.vcardArray[1])) {
    const vcard = entity.vcardArray[1];
    vcard.forEach(prop => {
      const propName = prop[0];
      const value = prop[3];
      switch (propName) {
        case 'fn': info.name = value; break;
        case 'org': info.org = Array.isArray(value) ? value[0] : value; break;
        case 'email': info.email = value; break;
        case 'tel': info.phone = typeof value === 'string' ? value : (value?.uri || value); break;
        case 'adr': {
          if (Array.isArray(value)) {
            const parts = value.flat().filter(Boolean);
            info.address = parts.join(', ');
          }
          break;
        }
        case 'url': info.url = value; break;
      }
    });
  }

  // publicIds (IANA ID)
  if (Array.isArray(entity.publicIds)) {
    info.ianaId = entity.publicIds.find(p => p.type === 'IANA Registrar ID')?.identifier;
  }

  return info;
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZoneName: 'short' });
  } catch { return dateStr; }
}

function formatStatus(status) {
  const descriptions = {
    'active': { label: 'Active', color: 'var(--color-success)', icon: '🟢' },
    'client transfer prohibited': { label: 'Transfer Lock', color: 'var(--color-warning)', icon: '🔒' },
    'client delete prohibited': { label: 'Delete Lock', color: 'var(--color-warning)', icon: '🔒' },
    'client update prohibited': { label: 'Update Lock', color: 'var(--color-warning)', icon: '🔒' },
    'server transfer prohibited': { label: 'Server Transfer Lock', color: 'var(--color-error)', icon: '🛡️' },
    'server delete prohibited': { label: 'Server Delete Lock', color: 'var(--color-error)', icon: '🛡️' },
    'server update prohibited': { label: 'Server Update Lock', color: 'var(--color-error)', icon: '🛡️' },
  };
  return descriptions[status.toLowerCase()] || { label: status, color: 'var(--text-secondary)', icon: '📋' };
}

function renderWhoisResults(data, domain, container) {
  // === Header Card ===
  const card = document.createElement('div');
  card.className = 'animate-fade-in';
  card.style.cssText = 'padding:2rem;margin-bottom:1.5rem;border-radius:var(--radius-lg);background:var(--bg-surface);border:1px solid var(--border-color);box-shadow:var(--shadow-md)';

  const statusArr = data.status || [];
  const inactiveStatuses = ['inactive', 'pending delete', 'redemption period', 'pending restore'];
  const isActive = statusArr.length === 0 || !statusArr.some(s => inactiveStatuses.some(i => s.toLowerCase().includes(i)));
  card.innerHTML = `
    <div style="display:flex;align-items:center;gap:1rem;margin-bottom:1.5rem">
      <div style="font-size:2.5rem">${isActive ? '🟢' : '🔴'}</div>
      <div>
        <h2 style="font-size:1.25rem;font-weight:700;color:var(--text-primary)">${(data.domainName || domain).toUpperCase()}</h2>
        <p style="color:${isActive ? 'var(--color-success)' : 'var(--color-error)'};font-weight:600;font-size:0.875rem">${isActive ? 'Domain Active' : 'Domain Inactive'}</p>
      </div>
    </div>
    ${statusArr.length > 0 ? `<div style="display:flex;flex-wrap:wrap;gap:0.5rem">
      ${statusArr.map(s => {
        const info = formatStatus(s);
        return `<span style="display:inline-flex;align-items:center;gap:0.375rem;padding:0.25rem 0.75rem;border-radius:var(--radius-full);font-size:0.75rem;font-weight:500;background:${info.color}15;color:${info.color};border:1px solid ${info.color}30">${info.icon} ${s}</span>`;
      }).join('')}
    </div>` : ''}`;
  container.appendChild(card);

  // === Registration Info ===
  const regFields = [];
  const events = data.events || {};
  if (data.registrar?.name) regFields.push({ label: 'Registrar', value: data.registrar.name, icon: '🏢' });
  if (data.registrar?.ianaId) regFields.push({ label: 'IANA ID', value: data.registrar.ianaId, icon: '#️⃣' });
  if (data.registrar?.url) regFields.push({ label: 'Registrar URL', value: data.registrar.url, icon: '🔗' });
  if (data.registrar?.abuseEmail) regFields.push({ label: 'Abuse Email', value: data.registrar.abuseEmail, icon: '📧' });
  if (data.registrar?.abusePhone) regFields.push({ label: 'Abuse Phone', value: data.registrar.abusePhone, icon: '📞' });
  if (events.registration) regFields.push({ label: 'Created', value: formatDate(events.registration), icon: '📅' });
  if (events['last changed']) regFields.push({ label: 'Last Updated', value: formatDate(events['last changed']), icon: '🔄' });
  if (events.expiration) regFields.push({ label: 'Expires', value: formatDate(events.expiration), icon: '⏳' });
  if (events['last update of RDAP database']) regFields.push({ label: 'RDAP DB Updated', value: formatDate(events['last update of RDAP database']), icon: '🗃️' });
  if (data.handle && data.handle !== '—') regFields.push({ label: 'Registry Domain ID', value: data.handle, icon: '🆔' });
  if (data.status && data.status.length > 0) {
    regFields.push({ 
      label: 'Domain Status', 
      value: `<div style="display:flex;flex-direction:column;gap:4px">${data.status.map(s => `<span>${s}</span>`).join('')}</div>`, 
      icon: '🚥' 
    });
  }
  if (data.port43) regFields.push({ label: 'WHOIS Server', value: data.port43, icon: '🖥️' });

  // DNSSEC
  if (data.secureDNS) {
    const signed = data.secureDNS.delegationSigned;
    regFields.push({ label: 'DNSSEC', value: signed ? 'signedDelegation ✅' : 'unsigned ❌', icon: '🛡️' });
  }

  if (regFields.length > 0) {
    const section = document.createElement('div');
    section.style.marginBottom = '1.5rem';
    section.innerHTML = `<h3 style="font-size:1rem;font-weight:600;margin-bottom:0.75rem;color:var(--text-primary)">Registration Information</h3>`;
    const wrapper = document.createElement('div');
    wrapper.className = 'results-table-wrapper animate-fade-in';
    wrapper.innerHTML = `<table class="results-table">
      <thead><tr><th style="width:40%">Field</th><th>Value</th></tr></thead>
      <tbody class="animate-stagger">${regFields.map(f => `<tr>
        <td style="font-weight:600"><span style="margin-right:0.5rem">${f.icon}</span>${f.label}</td>
        <td><span class="ip-value" style="word-break:break-all">${f.value}</span></td>
      </tr>`).join('')}</tbody></table>`;
    section.appendChild(wrapper);
    container.appendChild(section);
    wrapper.querySelectorAll('.ip-value').forEach(el => makeClickToCopy(el, el.textContent));
  }

  // === Registrant Info ===
  if (data.registrant && (data.registrant.name || data.registrant.org)) {
    const regSection = document.createElement('div');
    regSection.style.marginBottom = '1.5rem';
    regSection.innerHTML = `<h3 style="font-size:1rem;font-weight:600;margin-bottom:0.75rem;color:var(--text-primary)">Registrant Contact</h3>`;
    const fields = [
      data.registrant.name && { label: 'Name', value: data.registrant.name },
      data.registrant.org && { label: 'Organization', value: data.registrant.org },
      data.registrant.email && { label: 'Email', value: data.registrant.email },
      data.registrant.phone && { label: 'Phone', value: data.registrant.phone },
      data.registrant.address && { label: 'Address', value: data.registrant.address },
    ].filter(Boolean);

    const rw = document.createElement('div');
    rw.className = 'results-table-wrapper animate-fade-in';
    rw.innerHTML = `<table class="results-table">
      <thead><tr><th style="width:40%">Field</th><th>Value</th></tr></thead>
      <tbody>${fields.map(f => `<tr><td style="font-weight:600">${f.label}</td><td>${f.value}</td></tr>`).join('')}</tbody></table>`;
    regSection.appendChild(rw);
    container.appendChild(regSection);
  }

  // === Nameservers ===
  if ((data.nameservers || []).length > 0) {
    const nsSection = document.createElement('div');
    nsSection.style.marginBottom = '1.5rem';
    nsSection.innerHTML = `<h3 style="font-size:1rem;font-weight:600;margin-bottom:0.75rem;color:var(--text-primary)">Nameservers (${data.nameservers.length})</h3>`;
    const nsWrapper = document.createElement('div');
    nsWrapper.className = 'results-table-wrapper animate-fade-in';
    nsWrapper.innerHTML = `<table class="results-table">
      <thead><tr><th>Nameserver</th><th>IPv4</th><th>IPv6</th></tr></thead>
      <tbody class="animate-stagger">${data.nameservers.map(ns => `<tr>
        <td><strong><span class="ip-value">${ns.name}</span></strong></td>
        <td>${ns.v4.length > 0 ? ns.v4.map(ip => `<span class="ip-value">${ip}</span>`).join(', ') : '—'}</td>
        <td style="font-size:0.75rem;color:var(--text-secondary)">${ns.v6.length > 0 ? ns.v6.join(', ') : '—'}</td>
      </tr>`).join('')}</tbody></table>`;
    nsSection.appendChild(nsWrapper);
    container.appendChild(nsSection);
    nsWrapper.querySelectorAll('.ip-value').forEach(el => makeClickToCopy(el, el.textContent));
  }

  // === Domain Age Quick Calc ===
  if (events.registration) {
    const created = new Date(events.registration);
    const now = new Date();
    const diff = now - created;
    const years = Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
    const months = Math.floor((diff % (365.25 * 24 * 60 * 60 * 1000)) / (30.44 * 24 * 60 * 60 * 1000));

    let expiryInfo = '';
    if (events.expiration) {
      const expiry = new Date(events.expiration);
      const daysLeft = Math.ceil((expiry - now) / (24 * 60 * 60 * 1000));
      const expiryColor = daysLeft > 90 ? 'var(--color-success)' : daysLeft > 30 ? 'var(--color-warning)' : 'var(--color-error)';
      expiryInfo = `<div style="text-align:center"><span style="display:block;font-size:1.5rem;font-weight:700;color:${expiryColor}">${daysLeft > 0 ? daysLeft : 'EXPIRED'}</span><span style="font-size:0.75rem;color:var(--text-secondary)">${daysLeft > 0 ? 'Days Until Expiry' : ''}</span></div>`;
    }

    const ageCard = document.createElement('div');
    ageCard.className = 'animate-fade-in';
    ageCard.style.cssText = 'padding:1.5rem;border-radius:var(--radius-lg);background:var(--bg-surface);border:1px solid var(--border-color);display:flex;justify-content:center;gap:3rem;flex-wrap:wrap';
    ageCard.innerHTML = `
      <div style="text-align:center"><span style="display:block;font-size:1.5rem;font-weight:700;color:var(--color-primary)">${years}</span><span style="font-size:0.75rem;color:var(--text-secondary)">Years Old</span></div>
      <div style="text-align:center"><span style="display:block;font-size:1.5rem;font-weight:700;color:var(--color-accent)">${months}</span><span style="font-size:0.75rem;color:var(--text-secondary)">Months</span></div>
      ${expiryInfo}`;
    container.appendChild(ageCard);
  }
}
