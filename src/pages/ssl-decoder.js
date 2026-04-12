// src/pages/ssl-decoder.js
import { showToast } from '../components/toast.js';

export function renderSslDecoder() {
  const page = document.createElement('div');
  page.innerHTML = `<section class="page-hero"><div class="container">
    <h1>SSL/CSR Decoder</h1>
    <p>Paste a PEM-encoded SSL Certificate to instantly decode its Subject, Issuer, Validity dates, and SANs.</p>
  </div></section>`;

  const section = document.createElement('section');
  section.className = 'container page-section';
  section.innerHTML = `
    <div style="max-width:1000px;margin:0 auto">
      <div style="display:grid;grid-template-columns:1fr;gap:1.5rem">
        <!-- Input Area -->
        <div style="background:var(--bg-surface);border:1px solid var(--border-color);border-radius:var(--radius-lg);overflow:hidden">
          <div style="padding:0.75rem 1rem;background:var(--bg-surface-hover);border-bottom:1px solid var(--border-color);display:flex;justify-content:space-between;align-items:center">
            <span style="font-size:0.8125rem;font-weight:600;color:var(--text-primary)">PEM Certificate Input</span>
            <button id="ssl-paste-btn" style="background:none;border:none;color:var(--color-primary);font-size:0.75rem;font-weight:600;cursor:pointer">📋 Paste</button>
          </div>
          <textarea id="ssl-input" placeholder="-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----" spellcheck="false" style="width:100%;height:220px;padding:1.25rem;background:transparent;border:none;color:var(--text-primary);font-family:'JetBrains Mono',monospace;font-size:0.875rem;resize:vertical;outline:none;box-sizing:border-box"></textarea>
          <div style="padding:1rem;border-top:1px solid var(--border-color);background:var(--bg-surface-hover);text-align:right">
            <button id="ssl-decode-btn" style="padding:0.625rem 1.5rem;background:linear-gradient(135deg,var(--color-primary),var(--color-accent));color:white;font-size:0.875rem;font-weight:600;border-radius:var(--radius-md);border:none;cursor:pointer">🔓 Decode Certificate</button>
          </div>
        </div>

        <!-- Processing State -->
        <div id="ssl-loading" style="display:none;text-align:center;padding:2rem">
          <div class="skeleton" style="width:100%;height:300px;border-radius:var(--radius-lg)"></div>
        </div>

        <div id="ssl-error" style="display:none;padding:1rem;background:var(--color-error-light);color:var(--color-error);border:1px solid rgba(239,68,68,0.3);border-radius:var(--radius-md);font-weight:600;text-align:center"></div>

        <!-- Results -->
        <div id="ssl-results" style="display:none;flex-direction:column;gap:1.5rem">
          
          <!-- Validity Card -->
          <div style="border-radius:var(--radius-lg);border:1px solid var(--border-color);background:var(--bg-surface);padding:1.5rem;display:flex;align-items:center;gap:1.5rem">
            <div id="ssl-status-icon" style="font-size:3rem"></div>
            <div style="flex:1">
              <div id="ssl-cn-title" style="font-size:1.25rem;font-weight:700;color:var(--text-primary);margin-bottom:0.25rem;word-break:break-all"></div>
              <div id="ssl-status-text" style="font-weight:600;font-size:0.875rem;margin-bottom:0.5rem"></div>
              <div style="display:flex;gap:2rem;font-size:0.8125rem;color:var(--text-secondary)">
                <div><strong>Issued:</strong> <span id="ssl-issued"></span></div>
                <div><strong>Expires:</strong> <span id="ssl-expires"></span></div>
              </div>
            </div>
            <div style="text-align:center;padding-left:1.5rem;border-left:1px solid var(--border-color)">
              <div id="ssl-days" style="font-size:2rem;font-weight:700;color:var(--text-primary);line-height:1"></div>
              <div style="font-size:0.75rem;color:var(--text-tertiary);text-transform:uppercase;letter-spacing:0.05em;margin-top:0.25rem">Days Left</div>
            </div>
          </div>

          <!-- Data Grid -->
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(400px,1fr));gap:1.5rem">
            
            <div style="border-radius:var(--radius-lg);border:1px solid var(--border-color);background:var(--bg-surface);overflow:hidden">
              <div style="padding:0.75rem 1rem;background:var(--bg-surface-hover);border-bottom:1px solid var(--border-color)">
                <span style="font-size:0.8125rem;font-weight:600;color:var(--text-primary)">Subject Information</span>
              </div>
              <div id="ssl-subject-list" style="padding:1rem;display:grid;gap:0.75rem;font-size:0.875rem"></div>
            </div>
            
            <div style="border-radius:var(--radius-lg);border:1px solid var(--border-color);background:var(--bg-surface);overflow:hidden">
              <div style="padding:0.75rem 1rem;background:var(--bg-surface-hover);border-bottom:1px solid var(--border-color)">
                <span style="font-size:0.8125rem;font-weight:600;color:var(--text-primary)">Issuer Information</span>
              </div>
              <div id="ssl-issuer-list" style="padding:1rem;display:grid;gap:0.75rem;font-size:0.875rem"></div>
            </div>

          </div>

          <!-- Details Table -->
          <div style="border-radius:var(--radius-lg);border:1px solid var(--border-color);background:var(--bg-surface);overflow:hidden">
            <table style="width:100%;border-collapse:collapse;text-align:left;font-size:0.875rem">
              <tbody id="ssl-details-table"></tbody>
            </table>
          </div>

        </div>
      </div>
    </div>`;
  page.appendChild(section);

  setTimeout(() => {
    const input = page.querySelector('#ssl-input');
    const btn = page.querySelector('#ssl-decode-btn');
    const pasteBtn = page.querySelector('#ssl-paste-btn');
    
    // Result elements
    const results = page.querySelector('#ssl-results');
    const errorDiv = page.querySelector('#ssl-error');
    const loading = page.querySelector('#ssl-loading');
    
    pasteBtn.addEventListener('click', async () => {
      try {
        const text = await navigator.clipboard.readText();
        input.value = text;
        showToast('Pasted from clipboard');
        if (text.includes('BEGIN CERTIFICATE')) decodeCert();
      } catch (err) {
        showToast('Could not read clipboard', 'error');
      }
    });

    function parseDN(dnString) {
      if (!dnString) return [];
      return dnString.split('\\n').map(l => {
        const parts = l.split('=');
        return { key: parts[0], value: parts.slice(1).join('=') };
      });
    }

    async function decodeCert() {
      const val = input.value.trim();
      if (!val) {
        input.style.border = '1px solid var(--color-error)';
        return;
      }
      
      input.style.border = 'none';
      results.style.display = 'none';
      errorDiv.style.display = 'none';
      loading.style.display = 'block';
      btn.disabled = true;

      try {
        const res = await fetch('/api/ssl-decode', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cert: val })
        });
        
        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.error || 'Server error');
        }

        // Render Data
        const subjParams = parseDN(data.subject);
        const issuerParams = parseDN(data.issuer);
        
        const cnField = subjParams.find(p => p.key === 'CN' || p.key === 'O');
        page.querySelector('#ssl-cn-title').textContent = cnField ? cnField.value : 'Unknown Entity';

        const dOptions = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        page.querySelector('#ssl-issued').textContent = new Date(data.validFrom).toLocaleDateString('en-US', dOptions);
        page.querySelector('#ssl-expires').textContent = new Date(data.validTo).toLocaleDateString('en-US', dOptions);
        page.querySelector('#ssl-days').textContent = data.daysRemaining;
        
        const statusIcon = page.querySelector('#ssl-status-icon');
        const statusText = page.querySelector('#ssl-status-text');
        
        if (data.isExpired) {
          statusIcon.textContent = '❌';
          statusText.textContent = 'Certificate Expired';
          statusText.style.color = 'var(--color-error)';
          page.querySelector('#ssl-days').style.color = 'var(--color-error)';
        } else {
          statusIcon.textContent = '✅';
          statusText.textContent = 'Certificate Valid';
          statusText.style.color = 'var(--color-success)';
          page.querySelector('#ssl-days').style.color = data.daysRemaining < 30 ? 'var(--color-warning)' : 'var(--color-primary)';
        }

        // Dict render
        const renderDict = (params, containerId) => {
          const html = params.map(p => `
            <div style="display:flex;justify-content:space-between;border-bottom:1px dashed var(--border-color);padding-bottom:0.25rem">
              <span style="color:var(--text-secondary);font-weight:600">${p.key}</span>
              <span style="color:var(--text-primary);text-align:right;max-width:70%;word-break:break-all">${p.value}</span>
            </div>
          `).join('');
          page.querySelector(containerId).innerHTML = html;
        };

        renderDict(subjParams, '#ssl-subject-list');
        renderDict(issuerParams, '#ssl-issuer-list');

        // Details
        let sansHtml = data.subjectAltName.split(', ').map(s => `<span style="display:inline-block;background:var(--bg-surface-hover);padding:0.125rem 0.5rem;border-radius:4px;border:1px solid var(--border-color);margin:2px;font-size:0.75rem">${s.replace('DNS:','')}</span>`).join('');
        
        const details = [
          { label: 'Subject Alternative Names (SANs)', val: sansHtml || '—' },
          { label: 'Serial Number', val: `<code style="font-family:'JetBrains Mono',monospace;color:var(--color-accent)">${data.serialNumber}</code>` },
          { label: 'SHA-256 Fingerprint', val: `<code style="font-family:'JetBrains Mono',monospace;color:var(--text-primary)">${data.fingerprint256}</code>` },
          { label: 'SHA-1 Fingerprint', val: `<code style="font-family:'JetBrains Mono',monospace;color:var(--text-secondary)">${data.fingerprint}</code>` }
        ];

        page.querySelector('#ssl-details-table').innerHTML = details.map(d => `
          <tr style="border-bottom:1px solid var(--border-color)">
            <td style="padding:1rem;color:var(--text-secondary);font-weight:600;width:30%">${d.label}</td>
            <td style="padding:1rem">${d.val}</td>
          </tr>
        `).join('');

        results.style.display = 'flex';
      } catch(err) {
        errorDiv.textContent = err.message;
        errorDiv.style.display = 'block';
      } finally {
        loading.style.display = 'none';
        btn.disabled = false;
      }
    }

    btn.addEventListener('click', decodeCert);
  }, 100);

  return page;
}
