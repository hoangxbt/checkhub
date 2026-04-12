// src/pages/spf-dmarc.js
import { createSearchBar } from '../components/search-bar.js';
import { createTableSkeleton } from '../components/loading-skeleton.js';
import { makeClickToCopy } from '../components/copy-button.js';
import { dnsLookup } from '../services/dns-api.js';

export function renderSpfDmarc() {
  const page = document.createElement('div');
  page.innerHTML = `<section class="page-hero"><div class="container">
    <h1>SPF & DMARC Validator</h1>
    <p>Analyze your email authentication configuration. Check SPF, DMARC, and DKIM records for issues.</p>
  </div></section>`;

  const searchSection = document.createElement('section');
  searchSection.className = 'container';
  const { form, input } = createSearchBar({
    placeholder: 'Enter domain name (e.g. google.com)',
    showTypeSelector: false,
    onSearch: (domain) => runSpfDmarc(domain, resultsArea),
  });
  searchSection.appendChild(form);
  page.appendChild(searchSection);

  const resultsArea = document.createElement('section');
  resultsArea.className = 'container page-section';
  page.appendChild(resultsArea);

  setTimeout(() => input.focus(), 200);
  return page;
}

// SPF mechanism explanations
const SPF_MECHANISMS = {
  'all': 'Default result for all senders',
  'ip4': 'Allow specific IPv4 address or range',
  'ip6': 'Allow specific IPv6 address or range',
  'a': 'Allow domain A record IPs',
  'mx': 'Allow domain mail server IPs',
  'include': 'Include another domain\'s SPF policy',
  'redirect': 'Use another domain\'s SPF record entirely',
  'exists': 'Perform DNS exists check',
  'ptr': 'Reverse DNS check (deprecated)',
  'exp': 'Explanation string for failures',
};

const SPF_QUALIFIERS = {
  '+': { label: 'Pass', color: 'var(--color-success)', desc: 'Allow (default)' },
  '-': { label: 'Fail', color: 'var(--color-error)', desc: 'Reject' },
  '~': { label: 'SoftFail', color: 'var(--color-warning)', desc: 'Accept but mark' },
  '?': { label: 'Neutral', color: 'var(--text-tertiary)', desc: 'No policy' },
};

async function runSpfDmarc(domain, container) {
  container.innerHTML = '';
  container.appendChild(createTableSkeleton(6, 3));
  try {
    const [txtResult, dmarcResult] = await Promise.all([
      dnsLookup(domain, 'TXT'),
      dnsLookup(`_dmarc.${domain}`, 'TXT'),
    ]);

    // Extract records
    const allTxt = txtResult.answers.map(a => a.data.replace(/"/g, ''));
    const spfRecord = allTxt.find(t => t.toLowerCase().startsWith('v=spf1'));
    const dmarcRecord = (dmarcResult.answers || []).map(a => a.data.replace(/"/g, '')).find(t => t.toLowerCase().startsWith('v=dmarc1'));

    container.innerHTML = '';

    // === Overall Score ===
    const spfOk = !!spfRecord;
    const dmarcOk = !!dmarcRecord;
    const score = (spfOk ? 1 : 0) + (dmarcOk ? 1 : 0);
    const scoreLabel = score === 2 ? 'Excellent' : score === 1 ? 'Partial' : 'Missing';
    const scoreColor = score === 2 ? 'var(--color-success)' : score === 1 ? 'var(--color-warning)' : 'var(--color-error)';
    const scoreEmoji = score === 2 ? '🛡️' : score === 1 ? '⚠️' : '🔓';

    const scoreCard = document.createElement('div');
    scoreCard.className = 'animate-fade-in';
    scoreCard.style.cssText = `text-align:center;padding:2rem;margin-bottom:2rem;border-radius:var(--radius-lg);border:2px solid ${scoreColor};background:${scoreColor}10`;
    scoreCard.innerHTML = `
      <div style="font-size:3rem;margin-bottom:0.5rem">${scoreEmoji}</div>
      <h2 style="font-size:1.25rem;font-weight:700;color:${scoreColor}">Email Security: ${scoreLabel}</h2>
      <p style="color:var(--text-secondary);margin-top:0.25rem">${domain}</p>
      <div style="margin-top:1rem;display:flex;justify-content:center;gap:1.5rem">
        <span style="padding:0.25rem 0.75rem;border-radius:var(--radius-full);font-size:0.8125rem;font-weight:600;background:${spfOk ? 'var(--color-success)' : 'var(--color-error)'}15;color:${spfOk ? 'var(--color-success)' : 'var(--color-error)'}">SPF ${spfOk ? '✓' : '✗'}</span>
        <span style="padding:0.25rem 0.75rem;border-radius:var(--radius-full);font-size:0.8125rem;font-weight:600;background:${dmarcOk ? 'var(--color-success)' : 'var(--color-error)'}15;color:${dmarcOk ? 'var(--color-success)' : 'var(--color-error)'}">DMARC ${dmarcOk ? '✓' : '✗'}</span>
      </div>`;
    container.appendChild(scoreCard);

    // === SPF Section ===
    const spfSection = document.createElement('div');
    spfSection.style.marginBottom = '2rem';
    spfSection.innerHTML = `<h3 style="font-size:1.125rem;font-weight:600;margin-bottom:1rem;color:var(--text-primary);display:flex;align-items:center;gap:0.5rem"><span style="font-size:1.5rem">📧</span> SPF Record</h3>`;

    if (spfRecord) {
      // Raw record
      const raw = document.createElement('div');
      raw.className = 'animate-fade-in';
      raw.style.cssText = 'padding:1rem;border-radius:var(--radius-md);background:var(--bg-surface);border:1px solid var(--border-color);margin-bottom:1rem;font-family:"JetBrains Mono",monospace;font-size:0.8125rem;word-break:break-all;cursor:pointer';
      raw.textContent = spfRecord;
      makeClickToCopy(raw, spfRecord);
      spfSection.appendChild(raw);

      // Parse SPF
      const mechanisms = parseSpf(spfRecord);
      const warnings = getSpfWarnings(spfRecord, mechanisms);

      // Warnings
      if (warnings.length > 0) {
        const warnDiv = document.createElement('div');
        warnDiv.style.cssText = 'margin-bottom:1rem;display:flex;flex-direction:column;gap:0.5rem';
        warnDiv.innerHTML = warnings.map(w => `<div style="padding:0.75rem 1rem;border-radius:var(--radius-md);background:${w.level === 'error' ? 'var(--color-error-light)' : 'var(--color-warning-light)'};border-left:4px solid ${w.level === 'error' ? 'var(--color-error)' : 'var(--color-warning)'};font-size:0.8125rem">
          <strong style="color:${w.level === 'error' ? 'var(--color-error)' : 'var(--color-warning)'}">${w.level === 'error' ? '❌' : '⚠️'} ${w.title}</strong>
          <p style="color:var(--text-secondary);margin-top:0.25rem">${w.message}</p>
        </div>`).join('');
        spfSection.appendChild(warnDiv);
      }

      // Mechanisms table
      const mechWrapper = document.createElement('div');
      mechWrapper.className = 'results-table-wrapper animate-fade-in';
      mechWrapper.innerHTML = `<table class="results-table">
        <thead><tr><th>Qualifier</th><th>Mechanism</th><th>Value</th><th>Description</th></tr></thead>
        <tbody class="animate-stagger">${mechanisms.map(m => {
          const q = SPF_QUALIFIERS[m.qualifier] || SPF_QUALIFIERS['+'];
          return `<tr>
            <td><span style="padding:0.125rem 0.5rem;border-radius:var(--radius-sm);background:${q.color}15;color:${q.color};font-weight:600;font-size:0.75rem">${m.qualifier} ${q.label}</span></td>
            <td style="font-weight:600">${m.mechanism}</td>
            <td style="font-family:'JetBrains Mono',monospace;font-size:0.8125rem"><span class="ip-value">${m.value || '—'}</span></td>
            <td style="color:var(--text-secondary);font-size:0.8125rem">${SPF_MECHANISMS[m.mechanism] || '—'}</td>
          </tr>`;
        }).join('')}</tbody></table>`;
      spfSection.appendChild(mechWrapper);
      mechWrapper.querySelectorAll('.ip-value').forEach(el => el.textContent !== '—' && makeClickToCopy(el, el.textContent));
    } else {
      spfSection.innerHTML += `<div class="animate-fade-in" style="padding:1.5rem;border-radius:var(--radius-md);background:var(--color-error-light);border:1px solid var(--color-error);text-align:center">
        <p style="font-weight:600;color:var(--color-error)">❌ No SPF Record Found</p>
        <p style="color:var(--text-secondary);font-size:0.8125rem;margin-top:0.5rem">This domain has no SPF record. Email spoofing is possible. Add a TXT record starting with <code>v=spf1</code>.</p>
      </div>`;
    }
    container.appendChild(spfSection);

    // === DMARC Section ===
    const dmarcSection = document.createElement('div');
    dmarcSection.style.marginBottom = '2rem';
    dmarcSection.innerHTML = `<h3 style="font-size:1.125rem;font-weight:600;margin-bottom:1rem;color:var(--text-primary);display:flex;align-items:center;gap:0.5rem"><span style="font-size:1.5rem">🛡️</span> DMARC Record</h3>`;

    if (dmarcRecord) {
      const raw2 = document.createElement('div');
      raw2.className = 'animate-fade-in';
      raw2.style.cssText = 'padding:1rem;border-radius:var(--radius-md);background:var(--bg-surface);border:1px solid var(--border-color);margin-bottom:1rem;font-family:"JetBrains Mono",monospace;font-size:0.8125rem;word-break:break-all;cursor:pointer';
      raw2.textContent = dmarcRecord;
      makeClickToCopy(raw2, dmarcRecord);
      dmarcSection.appendChild(raw2);

      const tags = parseDmarc(dmarcRecord);
      const dmarcWarnings = getDmarcWarnings(tags);

      if (dmarcWarnings.length > 0) {
        const warnDiv2 = document.createElement('div');
        warnDiv2.style.cssText = 'margin-bottom:1rem;display:flex;flex-direction:column;gap:0.5rem';
        warnDiv2.innerHTML = dmarcWarnings.map(w => `<div style="padding:0.75rem 1rem;border-radius:var(--radius-md);background:${w.level === 'error' ? 'var(--color-error-light)' : 'var(--color-warning-light)'};border-left:4px solid ${w.level === 'error' ? 'var(--color-error)' : 'var(--color-warning)'};font-size:0.8125rem">
          <strong style="color:${w.level === 'error' ? 'var(--color-error)' : 'var(--color-warning)'}">${w.level === 'error' ? '❌' : '⚠️'} ${w.title}</strong>
          <p style="color:var(--text-secondary);margin-top:0.25rem">${w.message}</p>
        </div>`).join('');
        dmarcSection.appendChild(warnDiv2);
      }

      const DMARC_TAGS = {
        v: 'Version', p: 'Policy', sp: 'Subdomain Policy', rua: 'Aggregate Reports', ruf: 'Forensic Reports',
        adkim: 'DKIM Alignment', aspf: 'SPF Alignment', pct: 'Percentage', ri: 'Report Interval', fo: 'Failure Options',
      };
      const policyColors = { none: 'var(--color-warning)', quarantine: 'var(--color-primary)', reject: 'var(--color-success)' };

      const tagWrapper = document.createElement('div');
      tagWrapper.className = 'results-table-wrapper animate-fade-in';
      tagWrapper.innerHTML = `<table class="results-table">
        <thead><tr><th>Tag</th><th>Value</th><th>Description</th></tr></thead>
        <tbody class="animate-stagger">${Object.entries(tags).map(([key, val]) => {
          const isPolicyTag = key === 'p' || key === 'sp';
          return `<tr>
            <td style="font-weight:600">${key}</td>
            <td>${isPolicyTag ? `<span style="padding:0.125rem 0.625rem;border-radius:var(--radius-sm);background:${(policyColors[val] || 'var(--text-secondary)')}15;color:${policyColors[val] || 'var(--text-secondary)'};font-weight:600;font-size:0.8125rem">${val}</span>` : `<span class="ip-value" style="font-family:'JetBrains Mono',monospace;font-size:0.8125rem">${val}</span>`}</td>
            <td style="color:var(--text-secondary);font-size:0.8125rem">${DMARC_TAGS[key] || '—'}</td>
          </tr>`;
        }).join('')}</tbody></table>`;
      dmarcSection.appendChild(tagWrapper);
      tagWrapper.querySelectorAll('.ip-value').forEach(el => makeClickToCopy(el, el.textContent));
    } else {
      dmarcSection.innerHTML += `<div class="animate-fade-in" style="padding:1.5rem;border-radius:var(--radius-md);background:var(--color-error-light);border:1px solid var(--color-error);text-align:center">
        <p style="font-weight:600;color:var(--color-error)">❌ No DMARC Record Found</p>
        <p style="color:var(--text-secondary);font-size:0.8125rem;margin-top:0.5rem">No DMARC record at <code>_dmarc.${domain}</code>. Add a TXT record starting with <code>v=DMARC1</code>.</p>
      </div>`;
    }
    container.appendChild(dmarcSection);
  } catch (error) {
    container.innerHTML = `<div class="animate-fade-in" style="text-align:center;padding:3rem;color:var(--color-error)"><p style="font-weight:600">Validation Failed</p><p style="margin-top:0.5rem;color:var(--text-secondary)">${error.message}</p></div>`;
  }
}

function parseSpf(record) {
  const parts = record.split(/\s+/).slice(1); // skip v=spf1
  return parts.map(part => {
    let qualifier = '+';
    let rest = part;
    if (['+', '-', '~', '?'].includes(part[0])) {
      qualifier = part[0];
      rest = part.slice(1);
    }
    const colonIdx = rest.indexOf(':');
    const slashIdx = rest.indexOf('/');
    let mechanism, value;
    if (colonIdx > 0) {
      mechanism = rest.substring(0, colonIdx);
      value = rest.substring(colonIdx + 1);
    } else if (slashIdx > 0) {
      mechanism = rest.substring(0, slashIdx);
      value = '/' + rest.substring(slashIdx + 1);
    } else {
      mechanism = rest;
      value = '';
    }
    return { qualifier, mechanism: mechanism.toLowerCase(), value };
  });
}

function getSpfWarnings(record, mechanisms) {
  const warnings = [];
  if (record.length > 450) warnings.push({ level: 'warning', title: 'Record Too Long', message: `SPF record is ${record.length} chars. DNS TXT records should stay under 450 chars to avoid UDP truncation.` });
  const lookups = mechanisms.filter(m => ['include', 'a', 'mx', 'exists', 'redirect'].includes(m.mechanism));
  if (lookups.length > 10) warnings.push({ level: 'error', title: 'Too Many DNS Lookups', message: `${lookups.length} DNS lookups detected. SPF allows a maximum of 10 DNS lookups. Exceeding this causes permerror.` });
  const allMech = mechanisms.find(m => m.mechanism === 'all');
  if (allMech && allMech.qualifier === '+') warnings.push({ level: 'error', title: 'Permissive +all', message: 'Using "+all" allows ANY server to send email for your domain. Use "-all" (fail) or "~all" (softfail).' });
  if (!allMech) warnings.push({ level: 'warning', title: 'No "all" Mechanism', message: 'Missing "all" at the end of SPF record. It\'s recommended to end with "-all" or "~all".' });
  if (mechanisms.some(m => m.mechanism === 'ptr')) warnings.push({ level: 'warning', title: 'Deprecated "ptr" Mechanism', message: 'The "ptr" mechanism is deprecated in RFC 7208. Consider using "ip4" or "ip6" instead.' });
  return warnings;
}

function parseDmarc(record) {
  const tags = {};
  record.split(';').forEach(part => {
    const [key, ...valParts] = part.trim().split('=');
    if (key && valParts.length > 0) tags[key.trim()] = valParts.join('=').trim();
  });
  return tags;
}

function getDmarcWarnings(tags) {
  const warnings = [];
  if (tags.p === 'none') warnings.push({ level: 'warning', title: 'Policy is "none"', message: 'DMARC policy is set to "none" — no action is taken on failing emails. Consider upgrading to "quarantine" or "reject" for better protection.' });
  if (!tags.rua) warnings.push({ level: 'warning', title: 'No Aggregate Reports', message: 'No "rua" tag found. You won\'t receive aggregate DMARC reports. Add rua=mailto:dmarc@yourdomain.com.' });
  if (tags.pct && parseInt(tags.pct) < 100) warnings.push({ level: 'warning', title: `Policy applied to ${tags.pct}% only`, message: `DMARC policy only applies to ${tags.pct}% of emails. Set pct=100 for full coverage.` });
  return warnings;
}
