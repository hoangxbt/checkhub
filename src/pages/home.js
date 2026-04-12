// src/pages/home.js
import { createSearchBar } from '../components/search-bar.js';
import { createResultsTable } from '../components/results-table.js';
import { createTableSkeleton } from '../components/loading-skeleton.js';
import { checkPropagation } from '../services/dns-api.js';
import { TOOLS } from '../utils/constants.js';
import dnsServers from '../data/dns-servers.json';

export function renderHome() {
  const page = document.createElement('div');

  const hero = document.createElement('section');
  hero.className = 'page-hero';
  hero.innerHTML = `<div class="container">
    <h1>DNS Propagation Checker</h1>
    <p>Check DNS record propagation across ${dnsServers.length}+ global servers. Fast, free, no ads.</p>
    <a href="/my-ip" id="hero-ip-badge" style="display:inline-flex;align-items:center;gap:0.625rem;margin-top:1rem;padding:0.5rem 1.25rem;border-radius:var(--radius-full);background:rgba(59,130,246,0.12);border:1px solid rgba(59,130,246,0.25);color:var(--color-primary);font-family:'JetBrains Mono',monospace;font-size:0.875rem;font-weight:600;text-decoration:none;transition:all 0.2s;cursor:pointer;backdrop-filter:blur(8px)" onmouseover="this.style.background='rgba(59,130,246,0.2)';this.style.transform='translateY(-1px)';this.style.boxShadow='0 4px 12px rgba(59,130,246,0.2)'" onmouseout="this.style.background='rgba(59,130,246,0.12)';this.style.transform='';this.style.boxShadow=''">
      <span style="width:8px;height:8px;border-radius:50%;background:var(--color-success);animation:pulse-dot 2s infinite"></span>
      <span id="hero-ip-text">Detecting your IP...</span>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="opacity:0.6"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
    </a>
  </div>`;
  page.appendChild(hero);

  // Fetch IP in background (deferred until page is in DOM)
  setTimeout(async () => {
    const ipText = page.querySelector('#hero-ip-text');
    if (!ipText) return;
    try {
      const res = await fetch('https://api.ipify.org?format=json');
      const data = await res.json();
      ipText.textContent = 'Your IP: ' + data.ip;
    } catch {
      try {
        const res2 = await fetch('https://ipapi.co/ip/');
        const ip = await res2.text();
        ipText.textContent = 'Your IP: ' + ip.trim();
      } catch { ipText.textContent = 'View your IP →'; }
    }
  }, 300);

  const searchSection = document.createElement('section');
  searchSection.className = 'container';
  const { form, input } = createSearchBar({
    placeholder: 'Enter domain name (e.g. google.com)',
    showTypeSelector: true,
    onSearch: (domain, type) => runPropagationCheck(domain, type, resultsArea),
  });
  searchSection.appendChild(form);
  page.appendChild(searchSection);

  const resultsArea = document.createElement('section');
  resultsArea.className = 'container page-section';
  resultsArea.id = 'propagation-results';
  page.appendChild(resultsArea);

  const toolsSection = document.createElement('section');
  toolsSection.className = 'container page-section';
  const relatedTools = TOOLS.filter(t => t.id !== 'home').slice(0, 8);
  toolsSection.innerHTML = `<h2 style="font-size:1.25rem;font-weight:600;margin-bottom:1rem;color:var(--text-primary)">More Tools</h2>
    <div class="tools-grid">${relatedTools.map(tool => `
      <a href="${tool.path}" class="tool-card">
        <div class="tool-icon">${tool.icon}</div>
        <h3>${tool.name}</h3>
        <p>${tool.description}</p>
      </a>`).join('')}
    </div>`;
  page.appendChild(toolsSection);

  setTimeout(() => input.focus(), 200);
  return page;
}

async function runPropagationCheck(domain, type, container) {
  container.innerHTML = '';
  container.appendChild(createTableSkeleton(dnsServers.length, 5));
  try {
    const results = await checkPropagation(domain, type, dnsServers);
    const resolved = results.filter(r => r.status === 'resolved').length;
    container.innerHTML = '';
    const stats = document.createElement('div');
    stats.className = 'animate-fade-in';
    stats.style.cssText = 'display:flex;gap:1.5rem;margin-bottom:1rem;font-size:0.875rem;color:var(--text-secondary)';
    stats.innerHTML = `<span>Domain: <strong style="color:var(--text-primary)">${domain}</strong></span>
      <span>Type: <strong style="color:var(--text-primary)">${type}</strong></span>
      <span>Resolved: <strong style="color:var(--color-success)">${resolved}/${results.length}</strong></span>`;
    container.appendChild(stats);
    container.appendChild(createResultsTable(results));
  } catch (error) {
    container.innerHTML = `<div class="animate-fade-in" style="text-align:center;padding:3rem;color:var(--color-error)">
      <p style="font-size:1.125rem;font-weight:600">Error</p>
      <p style="margin-top:0.5rem;color:var(--text-secondary)">${error.message}</p>
      <button onclick="location.reload()" style="margin-top:1rem;padding:0.5rem 1.5rem;background:var(--color-primary);color:white;border-radius:var(--radius-md);font-weight:500;cursor:pointer">Retry</button>
    </div>`;
  }
}
