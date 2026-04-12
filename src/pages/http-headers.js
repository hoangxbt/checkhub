// src/pages/http-headers.js
import { createSearchBar } from '../components/search-bar.js';
import { createTableSkeleton } from '../components/loading-skeleton.js';
import { makeClickToCopy } from '../components/copy-button.js';

const SECURITY_HEADERS = {
  'strict-transport-security': { name: 'HSTS', good: true, desc: 'Forces HTTPS connections' },
  'content-security-policy': { name: 'CSP', good: true, desc: 'Controls resource loading' },
  'x-frame-options': { name: 'X-Frame-Options', good: true, desc: 'Prevents clickjacking' },
  'x-content-type-options': { name: 'X-Content-Type', good: true, desc: 'Prevents MIME sniffing' },
  'x-xss-protection': { name: 'XSS Protection', good: true, desc: 'XSS filter' },
  'referrer-policy': { name: 'Referrer Policy', good: true, desc: 'Controls referrer info' },
  'permissions-policy': { name: 'Permissions Policy', good: true, desc: 'Controls browser features' },
};

export function renderHttpHeaders() {
  const page = document.createElement('div');
  page.innerHTML = `<section class="page-hero"><div class="container">
    <h1>HTTP Headers Check</h1>
    <p>Analyze HTTP response headers and security configuration for any website.</p>
  </div></section>`;

  const searchSection = document.createElement('section');
  searchSection.className = 'container';
  const { form, input } = createSearchBar({
    placeholder: 'Enter URL (e.g. https://google.com)',
    showTypeSelector: false,
    onSearch: (url) => {
      if (!url.startsWith('http')) url = 'https://' + url;
      runHeaderCheck(url, resultsArea);
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

async function runHeaderCheck(url, container) {
  container.innerHTML = '';
  container.appendChild(createTableSkeleton(8, 3));
  try {
    // Use a CORS proxy or direct fetch (may be limited)
    const response = await fetch(url, { method: 'HEAD', mode: 'no-cors' }).catch(() => null);

    container.innerHTML = '';

    // Since direct HEAD requests are limited by CORS, show what we can detect
    const info = document.createElement('div');
    info.className = 'animate-fade-in';
    info.style.cssText = 'margin-bottom:1.5rem;font-size:0.875rem;color:var(--text-secondary)';
    info.innerHTML = `URL: <strong style="color:var(--text-primary)">${url}</strong>`;
    container.appendChild(info);

    // Security analysis card
    const secCard = document.createElement('div');
    secCard.className = 'animate-fade-in';
    secCard.style.cssText = 'margin-bottom:1.5rem;padding:1.5rem;border-radius:var(--radius-lg);background:var(--bg-surface);border:1px solid var(--border-color)';
    secCard.innerHTML = `<h3 style="font-size:1rem;font-weight:600;margin-bottom:1rem;color:var(--text-primary)">Security Headers Analysis</h3>
      <p style="color:var(--text-secondary);font-size:0.8125rem;margin-bottom:1rem">Recommended security headers for <code style="color:var(--color-primary)">${url}</code></p>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:0.75rem">
        ${Object.entries(SECURITY_HEADERS).map(([key, h]) => `
          <div style="padding:0.75rem;border-radius:var(--radius-md);border:1px solid var(--border-color);background:var(--bg-surface-hover)">
            <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.25rem">
              <span style="color:var(--text-tertiary)">📋</span>
              <strong style="font-size:0.8125rem">${h.name}</strong>
            </div>
            <p style="font-size:0.75rem;color:var(--text-tertiary)">${h.desc}</p>
            <code style="font-size:0.7rem;color:var(--color-primary)">${key}</code>
          </div>`).join('')}
      </div>`;
    container.appendChild(secCard);

    // Note about CORS limitations
    const note = document.createElement('div');
    note.className = 'animate-fade-in';
    note.style.cssText = 'padding:1rem 1.25rem;border-radius:var(--radius-md);background:var(--color-warning-light);border:1px solid var(--color-warning);font-size:0.8125rem';
    note.innerHTML = `<strong style="color:var(--color-warning)">⚠️ Note:</strong> <span style="color:var(--text-secondary)">Full HTTP header analysis requires a server-side proxy due to browser CORS restrictions. The headers shown above are recommended security headers to check. Deploy serverless functions for complete header analysis.</span>`;
    container.appendChild(note);
  } catch (error) {
    container.innerHTML = `<div class="animate-fade-in" style="text-align:center;padding:3rem;color:var(--color-error)"><p style="font-weight:600">Check Failed</p><p style="margin-top:0.5rem;color:var(--text-secondary)">${error.message}</p></div>`;
  }
}
