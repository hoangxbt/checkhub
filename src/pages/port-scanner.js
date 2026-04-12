// src/pages/port-scanner.js
import { showToast } from '../components/toast.js';

export function renderPortScanner() {
  const page = document.createElement('div');
  page.innerHTML = `<section class="page-hero"><div class="container">
    <h1>Port Scanner</h1>
    <p>Scan common TCP ports on any public IP address or domain to check firewalls and exposed services.</p>
  </div></section>`;

  const section = document.createElement('section');
  section.className = 'container page-section';
  section.innerHTML = `
    <div style="max-width:900px;margin:0 auto">
      <!-- Input Area -->
      <div style="display:flex;gap:0.5rem;margin-bottom:1.5rem">
        <input type="text" id="port-host" placeholder="Domain or IP (e.g. example.com or 8.8.8.8)" spellcheck="false" style="flex:1;padding:0.875rem 1.25rem;border-radius:var(--radius-lg);border:2px solid var(--border-color);background:var(--bg-surface);color:var(--text-primary);font-family:'JetBrains Mono',monospace;font-size:1rem;outline:none;transition:border-color 0.2s">
        <button id="port-scan-btn" style="padding:0.875rem 2rem;background:linear-gradient(135deg,var(--color-primary),var(--color-accent));color:white;font-size:0.9375rem;font-weight:600;border-radius:var(--radius-lg);border:none;cursor:pointer;transition:all 0.2s">🚀 Scan Ports</button>
      </div>

      <!-- Notice -->
      <div style="padding:1rem;border-radius:var(--radius-md);background:var(--color-primary-light);border:1px solid rgba(59,130,246,0.3);margin-bottom:1.5rem">
        <p style="font-size:0.8125rem;color:var(--text-secondary);line-height:1.5;margin:0">
          <strong style="color:var(--color-primary)">Note:</strong> This tool uses our own serverless backend to scan the Top 20 TCP ports in real-time. Scanning takes up to <strong>3-4 seconds</strong>.
        </p>
      </div>

      <!-- Loading State -->
      <div id="port-loading" style="display:none;text-align:center;padding:3rem">
        <div style="width:40px;height:40px;border:3px solid var(--border-color);border-top-color:var(--color-primary);border-radius:50%;animation:spin 1s linear infinite;margin:0 auto 1rem"></div>
        <div style="font-size:0.9375rem;color:var(--text-primary);font-weight:500">Scanning ports...</div>
        <div style="font-size:0.8125rem;color:var(--text-secondary);margin-top:0.25rem">Waiting for Nmap response</div>
      </div>

      <!-- Error State -->
      <div id="port-error" style="display:none;padding:1.5rem;border-radius:var(--radius-lg);background:var(--color-error-light);color:var(--color-error);border:1px solid rgba(239,68,68,0.3);text-align:center">
        <p id="port-error-msg" style="font-weight:600;margin:0"></p>
      </div>

      <!-- Results Grid -->
      <div id="port-results" style="display:none;grid-template-columns:1fr;gap:1.5rem">
        <div style="border-radius:var(--radius-lg);border:1px solid var(--border-color);overflow:hidden;background:var(--bg-surface)">
          <div style="padding:0.75rem 1rem;background:var(--bg-surface-hover);border-bottom:1px solid var(--border-color);display:flex;justify-content:space-between;align-items:center">
            <span style="font-size:0.8125rem;font-weight:600;color:var(--text-primary)">📊 Scan Results</span>
            <span id="port-target-display" style="font-size:0.75rem;color:var(--color-primary);font-family:'JetBrains Mono',monospace;font-weight:600;background:var(--color-primary-light);padding:0.125rem 0.5rem;border-radius:var(--radius-full)"></span>
          </div>
          <table style="width:100%;border-collapse:collapse;text-align:left">
            <thead>
              <tr style="background:var(--bg-surface)">
                <th style="padding:0.75rem 1rem;font-size:0.75rem;font-weight:600;color:var(--text-tertiary);text-transform:uppercase;border-bottom:1px solid var(--border-color)">Port</th>
                <th style="padding:0.75rem 1rem;font-size:0.75rem;font-weight:600;color:var(--text-tertiary);text-transform:uppercase;border-bottom:1px solid var(--border-color)">Protocol</th>
                <th style="padding:0.75rem 1rem;font-size:0.75rem;font-weight:600;color:var(--text-tertiary);text-transform:uppercase;border-bottom:1px solid var(--border-color)">Service</th>
                <th style="padding:0.75rem 1rem;font-size:0.75rem;font-weight:600;color:var(--text-tertiary);text-transform:uppercase;border-bottom:1px solid var(--border-color)">State</th>
              </tr>
            </thead>
            <tbody id="port-table-body">
            </tbody>
          </table>
          <div id="port-raw-wrapper" style="border-top:1px solid var(--border-color);padding:1rem;background:var(--bg-surface-hover)">
            <details>
              <summary style="font-size:0.8125rem;font-weight:600;color:var(--text-secondary);cursor:pointer;outline:none">View Raw Nmap Output</summary>
              <pre id="port-raw-output" style="margin-top:0.75rem;padding:1rem;background:#0d1117;color:#c9d1d9;border-radius:var(--radius-md);font-family:'JetBrains Mono',monospace;font-size:0.75rem;line-height:1.6;overflow:auto;max-height:300px"></pre>
            </details>
          </div>
        </div>
      </div>
    </div>`;
  page.appendChild(section);

  // Add keyframes for spinner locally
  if (!document.getElementById('spin-keyframes')) {
    const style = document.createElement('style');
    style.id = 'spin-keyframes';
    style.innerHTML = `@keyframes spin { 100% { transform: rotate(360deg); } }`;
    document.head.appendChild(style);
  }

  setTimeout(() => {
    const input = page.querySelector('#port-host');
    const btn = page.querySelector('#port-scan-btn');
    const loading = page.querySelector('#port-loading');
    const errorDiv = page.querySelector('#port-error');
    const errorMsg = page.querySelector('#port-error-msg');
    const results = page.querySelector('#port-results');
    const targetDisplay = page.querySelector('#port-target-display');
    const tbody = page.querySelector('#port-table-body');
    const rawOutput = page.querySelector('#port-raw-output');

    async function doScan() {
      const host = input.value.trim().replace(/^https?:\/\//, '').split('/')[0];
      if (!host) {
        input.style.borderColor = 'var(--color-error)';
        input.focus();
        return;
      }

      input.style.borderColor = 'var(--border-color)';
      results.style.display = 'none';
      errorDiv.style.display = 'none';
      loading.style.display = 'block';
      btn.disabled = true;
      btn.style.opacity = '0.7';

      try {
        // We use our new Vercel serverless function backend
        const res = await fetch(`/api/scan?host=${encodeURIComponent(host)}`);
        if (!res.ok) {
          const errData = await res.json().catch(()=>({}));
          throw new Error(errData.error || 'Server Error: ' + res.status);
        }
        
        const data = await res.json();
        
        if (!data.ports || data.ports.length === 0) {
          errorMsg.textContent = 'Scan completed, but no ports were found.';
          errorDiv.style.display = 'block';
          results.style.display = 'grid';
          loading.style.display = 'none';
        } else {
          // Render Table
          let html = '';
          data.ports.forEach(p => {
            const stateLower = p.state.toLowerCase();
            let stateStyle = 'color:var(--text-secondary)';
            let stateIcon = '⚪';
            
            if (stateLower === 'open') {
              stateStyle = 'color:var(--color-success);font-weight:700';
              stateIcon = '🟢';
            } else if (stateLower === 'closed') {
              stateStyle = 'color:var(--color-error)';
              stateIcon = '🔴';
            } else if (stateLower.includes('filter')) {
              stateStyle = 'color:var(--color-accent)';
              stateIcon = '🟡';
            }

            html += `
              <tr style="border-bottom:1px solid var(--border-color);transition:background 0.2s" onmouseover="this.style.background='var(--bg-surface-hover)'" onmouseout="this.style.background='transparent'">
                <td style="padding:0.875rem 1rem;font-family:'JetBrains Mono',monospace;font-size:0.875rem;color:var(--text-primary);font-weight:600">${p.port}</td>
                <td style="padding:0.875rem 1rem;font-size:0.8125rem;color:var(--text-secondary)">${p.protocol}</td>
                <td style="padding:0.875rem 1rem;font-size:0.8125rem;color:var(--text-primary)">${p.service}</td>
                <td style="padding:0.875rem 1rem;font-size:0.8125rem;${stateStyle}">${stateIcon} ${p.state.toUpperCase()}</td>
              </tr>
            `;
          });
          
          tbody.innerHTML = html;
          rawOutput.textContent = JSON.stringify(data, null, 2);
          targetDisplay.textContent = host;
          
          results.style.display = 'grid';
        }

      } catch (err) {
        errorMsg.textContent = '❌ ' + err.message + ' (Note: Public APIs may be restricted by adblockers or rate limits)';
        errorDiv.style.display = 'block';
      } finally {
        loading.style.display = 'none';
        btn.disabled = false;
        btn.style.opacity = '1';
      }
    }

    btn.addEventListener('click', doScan);
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') doScan();
    });

  }, 100);

  return page;
}
