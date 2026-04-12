// src/pages/website-status.js
import { createSearchBar } from '../components/search-bar.js';
import { createTableSkeleton } from '../components/loading-skeleton.js';

export function renderWebsiteStatus() {
  const page = document.createElement('div');
  page.innerHTML = `<section class="page-hero"><div class="container">
    <h1>Website Status Checker</h1>
    <p>Check if a website is up or down. See response time and HTTP status code.</p>
  </div></section>`;

  const searchSection = document.createElement('section');
  searchSection.className = 'container';
  const { form, input } = createSearchBar({
    placeholder: 'Enter URL or domain (e.g. google.com)',
    showTypeSelector: false,
    onSearch: (url) => {
      if (!url.startsWith('http')) url = 'https://' + url;
      runStatusCheck(url, resultsArea);
    },
  });
  searchSection.appendChild(form);
  page.appendChild(searchSection);

  const resultsArea = document.createElement('section');
  resultsArea.className = 'container page-section';
  page.appendChild(resultsArea);

  setTimeout(() => input.focus(), 200);
  return page;
}

async function runStatusCheck(url, container) {
  container.innerHTML = '';
  container.appendChild(createTableSkeleton(3, 2));
  try {
    const startTime = performance.now();
    let status = 'unknown', statusText = '', responseTime = 0;

    try {
      const response = await fetch(url, { method: 'HEAD', mode: 'no-cors', signal: AbortSignal.timeout(10000) });
      responseTime = Math.round(performance.now() - startTime);
      // no-cors returns opaque response, but if it doesn't throw, the server responded
      status = response.type === 'opaque' ? 'up' : (response.ok ? 'up' : 'down');
      statusText = response.type === 'opaque' ? 'Reachable (CORS restricted)' : `${response.status} ${response.statusText}`;
    } catch (err) {
      responseTime = Math.round(performance.now() - startTime);
      if (err.name === 'AbortError' || err.name === 'TimeoutError') {
        status = 'timeout';
        statusText = 'Request timed out (>10s)';
      } else {
        status = 'down';
        statusText = err.message;
      }
    }

    container.innerHTML = '';

    const isUp = status === 'up';
    const colors = {
      up: { icon: '🟢', color: 'var(--color-success)', bg: 'var(--color-success-light)', text: 'Website is UP' },
      down: { icon: '🔴', color: 'var(--color-error)', bg: 'var(--color-error-light)', text: 'Website is DOWN' },
      timeout: { icon: '🟡', color: 'var(--color-warning)', bg: 'var(--color-warning-light)', text: 'Request Timed Out' },
    };
    const c = colors[status] || colors.down;

    const card = document.createElement('div');
    card.className = 'animate-fade-in';
    card.style.cssText = `text-align:center;padding:3rem;margin-bottom:1.5rem;border-radius:var(--radius-lg);border:2px solid ${c.color};background:${c.bg}`;
    card.innerHTML = `
      <div style="font-size:4rem;margin-bottom:0.75rem">${c.icon}</div>
      <h2 style="font-size:1.5rem;font-weight:700;color:${c.color}">${c.text}</h2>
      <p style="color:var(--text-secondary);margin-top:0.5rem;font-family:'JetBrains Mono',monospace">${url}</p>
      <div style="margin-top:1.5rem;display:flex;justify-content:center;gap:3rem;flex-wrap:wrap">
        <div style="text-align:center"><span style="display:block;font-size:1.5rem;font-weight:700;color:var(--text-primary)">${responseTime}ms</span><span style="font-size:0.8125rem;color:var(--text-secondary)">Response Time</span></div>
        <div style="text-align:center"><span style="display:block;font-size:1.5rem;font-weight:700;color:var(--text-primary)">${statusText}</span><span style="font-size:0.8125rem;color:var(--text-secondary)">Status</span></div>
      </div>`;
    container.appendChild(card);

    // Response time context
    const timeContext = responseTime < 200 ? { label: 'Excellent', color: 'var(--color-success)' }
      : responseTime < 500 ? { label: 'Good', color: 'var(--color-primary)' }
      : responseTime < 1000 ? { label: 'Fair', color: 'var(--color-warning)' }
      : { label: 'Slow', color: 'var(--color-error)' };

    if (isUp) {
      const bar = document.createElement('div');
      bar.className = 'animate-fade-in';
      bar.style.cssText = 'margin-bottom:1rem;padding:1rem 1.25rem;border-radius:var(--radius-md);background:var(--bg-surface);border:1px solid var(--border-color);display:flex;align-items:center;gap:1rem';
      bar.innerHTML = `<span style="font-size:0.875rem;font-weight:600">Response Time:</span>
        <div style="flex:1;height:8px;border-radius:4px;background:var(--bg-surface-hover);overflow:hidden"><div style="height:100%;width:${Math.min(responseTime / 20, 100)}%;background:${timeContext.color};border-radius:4px;transition:width 0.5s ease"></div></div>
        <span style="font-size:0.875rem;font-weight:600;color:${timeContext.color}">${timeContext.label}</span>`;
      container.appendChild(bar);
    }
  } catch (error) {
    container.innerHTML = `<div class="animate-fade-in" style="text-align:center;padding:3rem;color:var(--color-error)"><p style="font-weight:600">Check Failed</p><p style="margin-top:0.5rem;color:var(--text-secondary)">${error.message}</p></div>`;
  }
}
