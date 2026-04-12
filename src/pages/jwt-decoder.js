// src/pages/jwt-decoder.js
import { showToast } from '../components/toast.js';

export function renderJwtDecoder() {
  const page = document.createElement('div');
  page.innerHTML = `<section class="page-hero"><div class="container">
    <h1>JWT Decoder</h1>
    <p>Decode and inspect JSON Web Tokens. View header, payload, signature, and expiration status.</p>
  </div></section>`;

  const section = document.createElement('section');
  section.className = 'container page-section';
  section.innerHTML = `
    <div style="max-width:900px;margin:0 auto">
      <!-- JWT Input -->
      <div style="margin-bottom:1rem">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem">
          <label style="font-size:0.8125rem;font-weight:600;color:var(--text-primary)">Paste JWT Token</label>
          <div style="display:flex;gap:0.375rem">
            <button id="jwt-sample" style="padding:0.375rem 0.75rem;font-size:0.75rem;font-weight:500;border-radius:var(--radius-md);border:1px solid var(--border-color);background:var(--bg-surface);color:var(--text-secondary);cursor:pointer;transition:all 0.2s">📄 Sample</button>
            <button id="jwt-clear" style="padding:0.375rem 0.75rem;font-size:0.75rem;font-weight:500;border-radius:var(--radius-md);border:1px solid var(--border-color);background:var(--bg-surface);color:var(--text-secondary);cursor:pointer;transition:all 0.2s">🗑️ Clear</button>
          </div>
        </div>
        <textarea id="jwt-input" placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c" spellcheck="false" style="width:100%;min-height:120px;padding:1rem;border-radius:var(--radius-lg);border:2px solid var(--border-color);background:var(--bg-surface);color:var(--text-primary);font-family:'JetBrains Mono',monospace;font-size:0.8125rem;resize:vertical;outline:none;line-height:1.6;box-sizing:border-box;transition:border-color 0.2s;word-break:break-all"></textarea>
      </div>

      <!-- Status -->
      <div id="jwt-status" style="padding:0.625rem 1rem;border-radius:var(--radius-md);margin-bottom:1rem;font-size:0.8125rem;display:none"></div>

      <!-- Decoded Sections -->
      <div style="display:grid;grid-template-columns:1fr;gap:1rem" id="jwt-results" style="display:none">
        <!-- Header -->
        <div style="border-radius:var(--radius-lg);border:1px solid var(--border-color);overflow:hidden" id="jwt-header-card">
          <div style="padding:0.75rem 1rem;background:var(--bg-surface-hover);border-bottom:1px solid var(--border-color);display:flex;justify-content:space-between;align-items:center">
            <span style="font-size:0.8125rem;font-weight:600;color:var(--text-primary)">📋 Header</span>
            <span style="font-size:0.6875rem;font-weight:600;color:var(--color-primary);background:var(--color-primary-light);padding:0.125rem 0.5rem;border-radius:var(--radius-full)">ALGORITHM & TOKEN TYPE</span>
          </div>
          <pre id="jwt-header" style="padding:1rem;margin:0;font-family:'JetBrains Mono',monospace;font-size:0.8125rem;color:var(--text-primary);background:var(--bg-surface);line-height:1.6;overflow:auto"></pre>
        </div>

        <!-- Payload -->
        <div style="border-radius:var(--radius-lg);border:1px solid var(--border-color);overflow:hidden" id="jwt-payload-card">
          <div style="padding:0.75rem 1rem;background:var(--bg-surface-hover);border-bottom:1px solid var(--border-color);display:flex;justify-content:space-between;align-items:center">
            <span style="font-size:0.8125rem;font-weight:600;color:var(--text-primary)">📦 Payload</span>
            <span style="font-size:0.6875rem;font-weight:600;color:var(--color-accent);background:rgba(6,182,212,0.1);padding:0.125rem 0.5rem;border-radius:var(--radius-full)">DATA</span>
          </div>
          <pre id="jwt-payload" style="padding:1rem;margin:0;font-family:'JetBrains Mono',monospace;font-size:0.8125rem;color:var(--text-primary);background:var(--bg-surface);line-height:1.6;overflow:auto"></pre>
        </div>

        <!-- Token Info -->
        <div style="border-radius:var(--radius-lg);border:1px solid var(--border-color);overflow:hidden" id="jwt-info-card">
          <div style="padding:0.75rem 1rem;background:var(--bg-surface-hover);border-bottom:1px solid var(--border-color)">
            <span style="font-size:0.8125rem;font-weight:600;color:var(--text-primary)">⏱️ Token Info</span>
          </div>
          <div id="jwt-info" style="padding:1rem;background:var(--bg-surface)"></div>
        </div>
      </div>
    </div>`;
  page.appendChild(section);

  setTimeout(() => {
    const input = page.querySelector('#jwt-input');
    const status = page.querySelector('#jwt-status');
    const headerPre = page.querySelector('#jwt-header');
    const payloadPre = page.querySelector('#jwt-payload');
    const infoDiv = page.querySelector('#jwt-info');
    const resultsDiv = page.querySelector('#jwt-results');
    const headerCard = page.querySelector('#jwt-header-card');
    const payloadCard = page.querySelector('#jwt-payload-card');
    const infoCard = page.querySelector('#jwt-info-card');

    function base64UrlDecode(str) {
      str = str.replace(/-/g, '+').replace(/_/g, '/');
      const pad = str.length % 4;
      if (pad) str += '='.repeat(4 - pad);
      return decodeURIComponent(atob(str).split('').map(c =>
        '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
      ).join(''));
    }

    function syntaxHL(json) {
      return json.replace(/("(\\u[\da-fA-F]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(\.\d*)?([eE][+-]?\d+)?)/g, (match) => {
        let cls = 'color:#e06c75';
        if (/^"/.test(match)) {
          cls = match.endsWith(':') ? 'color:var(--color-primary);font-weight:600' : 'color:#98c379';
        } else if (/true|false/.test(match)) {
          cls = 'color:#d19a66';
        } else if (/null/.test(match)) {
          cls = 'color:#e5c07b';
        }
        return `<span style="${cls}">${match}</span>`;
      });
    }

    function formatTimestamp(ts) {
      if (!ts) return null;
      const d = new Date(ts * 1000);
      const now = new Date();
      const diff = d - now;
      const absDiff = Math.abs(diff);
      let relative;
      if (absDiff < 60000) relative = 'just now';
      else if (absDiff < 3600000) relative = Math.floor(absDiff / 60000) + ' minutes';
      else if (absDiff < 86400000) relative = Math.floor(absDiff / 3600000) + ' hours';
      else relative = Math.floor(absDiff / 86400000) + ' days';
      if (diff > 0) relative = 'in ' + relative;
      else relative = relative + ' ago';
      return { date: d.toLocaleString(), relative, expired: diff < 0 };
    }

    function decode() {
      const token = input.value.trim();
      if (!token) {
        status.style.display = 'none';
        [headerCard, payloadCard, infoCard].forEach(c => c.style.display = 'none');
        return;
      }

      const parts = token.split('.');
      if (parts.length !== 3) {
        status.style.display = 'block';
        status.style.background = 'rgba(239,68,68,0.1)';
        status.style.color = 'var(--color-error)';
        status.textContent = '❌ Invalid JWT format. Expected 3 parts separated by dots.';
        input.style.borderColor = 'var(--color-error)';
        [headerCard, payloadCard, infoCard].forEach(c => c.style.display = 'none');
        return;
      }

      try {
        const header = JSON.parse(base64UrlDecode(parts[0]));
        const payload = JSON.parse(base64UrlDecode(parts[1]));

        input.style.borderColor = 'var(--color-success)';
        status.style.display = 'block';
        status.style.background = 'rgba(16,185,129,0.1)';
        status.style.color = 'var(--color-success)';
        status.textContent = '✅ Valid JWT decoded successfully';

        [headerCard, payloadCard, infoCard].forEach(c => c.style.display = 'block');

        headerPre.innerHTML = syntaxHL(JSON.stringify(header, null, 2));
        payloadPre.innerHTML = syntaxHL(JSON.stringify(payload, null, 2));

        // Token info
        let infoHtml = '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:0.75rem">';

        // Algorithm
        infoHtml += `<div style="padding:0.75rem;border-radius:var(--radius-md);background:var(--bg-surface-hover)">
          <div style="font-size:0.6875rem;text-transform:uppercase;letter-spacing:0.05em;color:var(--text-tertiary);margin-bottom:0.25rem">Algorithm</div>
          <div style="font-size:0.9375rem;font-weight:600;color:var(--text-primary);font-family:'JetBrains Mono',monospace">${header.alg || 'N/A'}</div>
        </div>`;

        // Type
        infoHtml += `<div style="padding:0.75rem;border-radius:var(--radius-md);background:var(--bg-surface-hover)">
          <div style="font-size:0.6875rem;text-transform:uppercase;letter-spacing:0.05em;color:var(--text-tertiary);margin-bottom:0.25rem">Type</div>
          <div style="font-size:0.9375rem;font-weight:600;color:var(--text-primary);font-family:'JetBrains Mono',monospace">${header.typ || 'N/A'}</div>
        </div>`;

        // Issued At
        if (payload.iat) {
          const iat = formatTimestamp(payload.iat);
          infoHtml += `<div style="padding:0.75rem;border-radius:var(--radius-md);background:var(--bg-surface-hover)">
            <div style="font-size:0.6875rem;text-transform:uppercase;letter-spacing:0.05em;color:var(--text-tertiary);margin-bottom:0.25rem">Issued At</div>
            <div style="font-size:0.8125rem;font-weight:600;color:var(--text-primary)">${iat.date}</div>
            <div style="font-size:0.75rem;color:var(--text-secondary)">${iat.relative}</div>
          </div>`;
        }

        // Expiration
        if (payload.exp) {
          const exp = formatTimestamp(payload.exp);
          infoHtml += `<div style="padding:0.75rem;border-radius:var(--radius-md);background:${exp.expired ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)'}">
            <div style="font-size:0.6875rem;text-transform:uppercase;letter-spacing:0.05em;color:var(--text-tertiary);margin-bottom:0.25rem">Expires</div>
            <div style="font-size:0.8125rem;font-weight:600;color:${exp.expired ? 'var(--color-error)' : 'var(--color-success)'}">${exp.date}</div>
            <div style="font-size:0.75rem;color:${exp.expired ? 'var(--color-error)' : 'var(--color-success)'}">${exp.expired ? '🔴 EXPIRED' : '🟢 VALID'} · ${exp.relative}</div>
          </div>`;
        }

        // Subject
        if (payload.sub) {
          infoHtml += `<div style="padding:0.75rem;border-radius:var(--radius-md);background:var(--bg-surface-hover)">
            <div style="font-size:0.6875rem;text-transform:uppercase;letter-spacing:0.05em;color:var(--text-tertiary);margin-bottom:0.25rem">Subject</div>
            <div style="font-size:0.8125rem;font-weight:600;color:var(--text-primary);font-family:'JetBrains Mono',monospace">${payload.sub}</div>
          </div>`;
        }

        // Issuer
        if (payload.iss) {
          infoHtml += `<div style="padding:0.75rem;border-radius:var(--radius-md);background:var(--bg-surface-hover)">
            <div style="font-size:0.6875rem;text-transform:uppercase;letter-spacing:0.05em;color:var(--text-tertiary);margin-bottom:0.25rem">Issuer</div>
            <div style="font-size:0.8125rem;font-weight:600;color:var(--text-primary)">${payload.iss}</div>
          </div>`;
        }

        infoHtml += '</div>';
        infoDiv.innerHTML = infoHtml;

      } catch (e) {
        status.style.display = 'block';
        status.style.background = 'rgba(239,68,68,0.1)';
        status.style.color = 'var(--color-error)';
        status.textContent = '❌ Failed to decode: ' + e.message;
        input.style.borderColor = 'var(--color-error)';
        [headerCard, payloadCard, infoCard].forEach(c => c.style.display = 'none');
      }
    }

    input.addEventListener('input', decode);

    page.querySelector('#jwt-sample').addEventListener('click', () => {
      // Generate a sample JWT with current timestamps
      const now = Math.floor(Date.now() / 1000);
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
      const payload = btoa(JSON.stringify({
        sub: '1234567890', name: 'John Doe', email: 'john@example.com',
        role: 'admin', iat: now, exp: now + 3600, iss: 'checkhub.org'
      })).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
      const sig = 'SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
      input.value = `${header}.${payload}.${sig}`;
      decode();
    });

    page.querySelector('#jwt-clear').addEventListener('click', () => {
      input.value = '';
      input.style.borderColor = 'var(--border-color)';
      status.style.display = 'none';
      [headerCard, payloadCard, infoCard].forEach(c => c.style.display = 'none');
    });

    input.focus();
  }, 100);

  return page;
}
