// src/pages/domain-health.js
import { createSearchBar } from '../components/search-bar.js';
import { createTableSkeleton } from '../components/loading-skeleton.js';
import { queryGoogleDNS, queryCloudflareDNS } from '../services/dns-api.js';
import { dnsLookup } from '../services/dns-api.js';

export function renderDomainHealth() {
  const page = document.createElement('div');
  page.innerHTML = `<section class="page-hero"><div class="container">
    <h1>Domain Health Check</h1>
    <p>Comprehensive health score for your domain. Checks DNS, email security, SSL, and DNSSEC.</p>
  </div></section>`;

  const searchSection = document.createElement('section');
  searchSection.className = 'container';
  const { form, input } = createSearchBar({
    placeholder: 'Enter domain name (e.g. example.com)',
    showTypeSelector: false,
    onSearch: (domain) => runHealthCheck(domain, resultsArea),
  });
  searchSection.appendChild(form);
  page.appendChild(searchSection);

  const resultsArea = document.createElement('section');
  resultsArea.className = 'container page-section';
  page.appendChild(resultsArea);

  setTimeout(() => input.focus(), 200);
  return page;
}

const CHECKS = [
  { id: 'dns_a', category: 'DNS', name: 'A Record', weight: 15, desc: 'Domain resolves to an IP address' },
  { id: 'dns_ns', category: 'DNS', name: 'NS Records', weight: 10, desc: 'Nameservers are configured' },
  { id: 'dns_ns_multi', category: 'DNS', name: 'Multiple NS', weight: 5, desc: 'At least 2 nameservers for redundancy' },
  { id: 'dns_mx', category: 'Email', name: 'MX Records', weight: 10, desc: 'Mail servers are configured' },
  { id: 'dns_spf', category: 'Email', name: 'SPF Record', weight: 10, desc: 'SPF record prevents email spoofing' },
  { id: 'dns_spf_strict', category: 'Email', name: 'SPF Strict', weight: 5, desc: 'SPF uses -all or ~all (not +all)' },
  { id: 'dns_dmarc', category: 'Email', name: 'DMARC Record', weight: 10, desc: 'DMARC policy is configured' },
  { id: 'dns_dmarc_enforce', category: 'Email', name: 'DMARC Enforced', weight: 5, desc: 'DMARC policy is quarantine or reject' },
  { id: 'dnssec', category: 'Security', name: 'DNSSEC', weight: 10, desc: 'DNSSEC is enabled' },
  { id: 'ssl_valid', category: 'Security', name: 'SSL Certificate', weight: 15, desc: 'Valid SSL/TLS certificate exists' },
  { id: 'ssl_not_expiring', category: 'Security', name: 'SSL Expiry', weight: 5, desc: 'SSL certificate not expiring within 30 days' },
];

async function runHealthCheck(domain, container) {
  container.innerHTML = '';

  // Progress UI
  const progressSection = document.createElement('div');
  progressSection.className = 'animate-fade-in';
  progressSection.style.cssText = 'text-align:center;padding:2rem;margin-bottom:1.5rem';
  progressSection.innerHTML = `
    <p style="color:var(--text-secondary);margin-bottom:1rem;font-size:0.875rem" id="health-status">Running health checks...</p>
    <div style="width:100%;max-width:400px;margin:0 auto;height:8px;border-radius:4px;background:var(--bg-surface-hover);overflow:hidden">
      <div id="health-progress" style="height:100%;width:0%;background:linear-gradient(90deg,var(--color-primary),var(--color-accent));border-radius:4px;transition:width 0.3s ease"></div>
    </div>`;
  container.appendChild(progressSection);

  const results = {};
  let completed = 0;
  const total = 6; // number of parallel check groups

  function updateProgress(step) {
    completed++;
    const pct = Math.round((completed / total) * 100);
    const bar = container.querySelector('#health-progress');
    const status = container.querySelector('#health-status');
    if (bar) bar.style.width = pct + '%';
    if (status) status.textContent = step;
  }

  try {
    // Run all checks in parallel
    const [aResult, nsResult, mxResult, txtResult, dmarcResult, dnssecResult, sslResult] = await Promise.allSettled([
      dnsLookup(domain, 'A').then(r => { updateProgress('Checking DNS records...'); return r; }),
      dnsLookup(domain, 'NS').then(r => { updateProgress('Checking nameservers...'); return r; }),
      dnsLookup(domain, 'MX').then(r => { updateProgress('Checking email config...'); return r; }),
      dnsLookup(domain, 'TXT').then(r => { updateProgress('Checking SPF/DMARC...'); return r; }),
      dnsLookup(`_dmarc.${domain}`, 'TXT').then(r => { updateProgress('Checking DMARC policy...'); return r; }),
      queryGoogleDNS(domain, 'A').then(r => { updateProgress('Checking DNSSEC...'); return r; }),
      fetch(`https://crt.sh/?q=${encodeURIComponent(domain)}&output=json`).then(r => r.json()).catch(() => []),
    ]);

    const a = aResult.status === 'fulfilled' ? aResult.value : { answers: [] };
    const ns = nsResult.status === 'fulfilled' ? nsResult.value : { answers: [] };
    const mx = mxResult.status === 'fulfilled' ? mxResult.value : { answers: [] };
    const txt = txtResult.status === 'fulfilled' ? txtResult.value : { answers: [] };
    const dmarc = dmarcResult.status === 'fulfilled' ? dmarcResult.value : { answers: [] };
    const dnssec = dnssecResult.status === 'fulfilled' ? dnssecResult.value : {};
    const certs = sslResult.status === 'fulfilled' ? sslResult.value : [];

    // Extract records
    const allTxt = txt.answers.map(r => r.data.replace(/"/g, ''));
    const spfRecord = allTxt.find(t => t.toLowerCase().startsWith('v=spf1'));
    const dmarcRecord = dmarc.answers.map(r => r.data.replace(/"/g, '')).find(t => t.toLowerCase().startsWith('v=dmarc1'));

    // SSL check
    const sortedCerts = Array.isArray(certs) ? certs.sort((a, b) => new Date(b.not_before) - new Date(a.not_before)) : [];
    const latestCert = sortedCerts[0];
    const now = new Date();
    const certValid = latestCert && new Date(latestCert.not_before) <= now && new Date(latestCert.not_after) >= now;
    const certDaysLeft = latestCert ? Math.ceil((new Date(latestCert.not_after) - now) / 86400000) : 0;

    // Compute results
    results.dns_a = { pass: a.answers.length > 0, detail: a.answers.length > 0 ? `Resolves to ${a.answers[0]?.data}` : 'No A record found' };
    results.dns_ns = { pass: ns.answers.length > 0, detail: ns.answers.length > 0 ? `${ns.answers.length} nameserver(s)` : 'No NS records' };
    results.dns_ns_multi = { pass: ns.answers.length >= 2, detail: ns.answers.length >= 2 ? `${ns.answers.length} nameservers (redundant)` : 'Only 1 nameserver — add more for redundancy' };
    results.dns_mx = { pass: mx.answers.length > 0, detail: mx.answers.length > 0 ? `${mx.answers.length} mail server(s)` : 'No MX records — can\'t receive email' };
    results.dns_spf = { pass: !!spfRecord, detail: spfRecord ? 'SPF record found' : 'No SPF record — email spoofing possible' };
    results.dns_spf_strict = { pass: spfRecord ? !spfRecord.includes('+all') : false, detail: spfRecord ? (spfRecord.includes('+all') ? 'Uses +all — too permissive!' : 'SPF policy is restrictive') : 'No SPF record' };
    results.dns_dmarc = { pass: !!dmarcRecord, detail: dmarcRecord ? 'DMARC record found' : 'No DMARC record at _dmarc.' + domain };
    results.dns_dmarc_enforce = { pass: dmarcRecord ? !dmarcRecord.includes('p=none') : false, detail: dmarcRecord ? (dmarcRecord.includes('p=none') ? 'Policy is "none" — monitoring only' : 'Policy enforced (quarantine/reject)') : 'No DMARC record' };
    results.dnssec = { pass: dnssec.AD === true, detail: dnssec.AD ? 'DNSSEC validated (AD flag)' : 'DNSSEC not enabled' };
    results.ssl_valid = { pass: certValid, detail: certValid ? `Valid cert (${latestCert.common_name})` : 'No valid SSL certificate found' };
    results.ssl_not_expiring = { pass: certDaysLeft > 30, detail: certDaysLeft > 30 ? `${certDaysLeft} days remaining` : (certDaysLeft > 0 ? `⚠️ Only ${certDaysLeft} days remaining!` : 'Certificate expired or not found') };

    // Calculate score
    let totalScore = 0, maxScore = 0;
    CHECKS.forEach(check => {
      maxScore += check.weight;
      if (results[check.id]?.pass) totalScore += check.weight;
    });
    const pct = Math.round((totalScore / maxScore) * 100);
    const grade = pct >= 90 ? 'A' : pct >= 75 ? 'B' : pct >= 60 ? 'C' : pct >= 40 ? 'D' : 'F';
    const gradeColors = { A: '#10b981', B: '#3b82f6', C: '#f59e0b', D: '#f97316', F: '#ef4444' };

    container.innerHTML = '';

    // Score card
    const scoreCard = document.createElement('div');
    scoreCard.className = 'animate-fade-in';
    scoreCard.style.cssText = 'text-align:center;padding:2.5rem;margin-bottom:2rem;border-radius:var(--radius-xl);background:var(--bg-surface);border:1px solid var(--border-color);box-shadow:var(--shadow-lg)';
    scoreCard.innerHTML = `
      <div style="display:inline-flex;align-items:center;justify-content:center;width:120px;height:120px;border-radius:50%;border:6px solid ${gradeColors[grade]};margin-bottom:1rem;position:relative">
        <span style="font-size:3rem;font-weight:800;color:${gradeColors[grade]}">${grade}</span>
        <span style="position:absolute;bottom:-4px;left:50%;transform:translateX(-50%);background:var(--bg-surface);padding:0 0.5rem;font-size:0.75rem;font-weight:600;color:${gradeColors[grade]}">${pct}%</span>
      </div>
      <h2 style="font-size:1.25rem;font-weight:700;color:var(--text-primary);margin-bottom:0.25rem">${domain}</h2>
      <p style="color:var(--text-secondary);font-size:0.875rem">${totalScore} / ${maxScore} points · ${Object.values(results).filter(r => r.pass).length} / ${CHECKS.length} checks passed</p>
      <div style="margin-top:1.25rem;display:flex;justify-content:center;gap:0.75rem;flex-wrap:wrap">
        ${['DNS', 'Email', 'Security'].map(cat => {
          const catChecks = CHECKS.filter(c => c.category === cat);
          const catPass = catChecks.filter(c => results[c.id]?.pass).length;
          const catColor = catPass === catChecks.length ? 'var(--color-success)' : catPass > 0 ? 'var(--color-warning)' : 'var(--color-error)';
          return `<span style="padding:0.375rem 0.875rem;border-radius:var(--radius-full);font-size:0.75rem;font-weight:600;background:${catColor}15;color:${catColor};border:1px solid ${catColor}30">${cat} ${catPass}/${catChecks.length}</span>`;
        }).join('')}
      </div>`;
    container.appendChild(scoreCard);

    // Results table by category
    ['DNS', 'Email', 'Security'].forEach(category => {
      const catChecks = CHECKS.filter(c => c.category === category);
      const section = document.createElement('div');
      section.style.marginBottom = '1.5rem';
      const catPass = catChecks.filter(c => results[c.id]?.pass).length;
      section.innerHTML = `<h3 style="font-size:1rem;font-weight:600;margin-bottom:0.75rem;color:var(--text-primary);display:flex;align-items:center;gap:0.5rem">${category === 'DNS' ? '🌐' : category === 'Email' ? '📧' : '🔒'} ${category} <span style="font-size:0.75rem;color:var(--text-tertiary)">(${catPass}/${catChecks.length})</span></h3>`;
      const wrapper = document.createElement('div');
      wrapper.className = 'results-table-wrapper animate-fade-in';
      wrapper.innerHTML = `<table class="results-table">
        <thead><tr><th>Check</th><th>Status</th><th>Weight</th><th>Detail</th></tr></thead>
        <tbody class="animate-stagger">${catChecks.map(check => {
          const r = results[check.id] || { pass: false, detail: '—' };
          return `<tr>
            <td><strong>${check.name}</strong><br><span style="font-size:0.75rem;color:var(--text-tertiary)">${check.desc}</span></td>
            <td><span class="${r.pass ? 'status-resolved' : 'status-failed'}">${r.pass ? '✓ Pass' : '✗ Fail'}</span></td>
            <td style="text-align:center;font-weight:600;color:${r.pass ? 'var(--color-success)' : 'var(--text-tertiary)'}">${r.pass ? `+${check.weight}` : '0'}</td>
            <td style="color:var(--text-secondary);font-size:0.8125rem">${r.detail}</td>
          </tr>`;
        }).join('')}</tbody></table>`;
      section.appendChild(wrapper);
      container.appendChild(section);
    });
  } catch (error) {
    container.innerHTML = `<div class="animate-fade-in" style="text-align:center;padding:3rem;color:var(--color-error)"><p style="font-weight:600">Health Check Failed</p><p style="margin-top:0.5rem;color:var(--text-secondary)">${error.message}</p></div>`;
  }
}
