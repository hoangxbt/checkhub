// src/pages/mac-lookup.js
import { showToast } from '../components/toast.js';

export function renderMacLookup() {
  const page = document.createElement('div');
  page.innerHTML = `<section class="page-hero"><div class="container">
    <h1>MAC Address Lookup</h1>
    <p>Find the manufacturer (OUI vendor) of any device by its MAC Address. Analyzes Unicast/Multicast and UAA/LAA status.</p>
  </div></section>`;

  const section = document.createElement('section');
  section.className = 'container page-section';
  section.innerHTML = `
    <div style="max-width:768px;margin:0 auto">
      <div style="display:flex;gap:0.5rem;margin-bottom:1.5rem">
        <input type="text" id="mac-input" placeholder="e.g. 00:1A:2B:3C:4D:5E, 00-1A-2B-3C-4D-5E, or 001A2B3C4D5E" spellcheck="false" style="flex:1;padding:0.875rem 1.25rem;border-radius:var(--radius-lg);border:2px solid var(--border-color);background:var(--bg-surface);color:var(--text-primary);font-family:'JetBrains Mono',monospace;font-size:1rem;outline:none;transition:border-color 0.2s">
        <button id="mac-search" style="padding:0.875rem 1.5rem;background:linear-gradient(135deg,var(--color-primary),var(--color-accent));color:white;font-size:0.9375rem;font-weight:600;border-radius:var(--radius-lg);border:none;cursor:pointer;transition:all 0.2s;white-space:nowrap">🔍 Lookup</button>
      </div>

      <!-- Loading and Error -->
      <div id="mac-loading" style="display:none;text-align:center;padding:2rem;color:var(--text-tertiary)">
        <div class="skeleton" style="width:100%;height:140px;border-radius:var(--radius-lg)"></div>
      </div>
      <div id="mac-error" style="display:none;padding:1rem;border-radius:var(--radius-md);background:var(--color-error-light);color:var(--color-error);font-weight:500;margin-bottom:1rem"></div>

      <!-- Results Grid -->
      <div id="mac-results" style="display:none;grid-template-columns:1fr;gap:1rem">
        <!-- Vendor Card -->
        <div style="border-radius:var(--radius-lg);border:1px solid var(--border-color);overflow:hidden;background:var(--bg-surface)">
          <div style="padding:0.75rem 1rem;background:var(--bg-surface-hover);border-bottom:1px solid var(--border-color);display:flex;align-items:center;gap:0.5rem">
            <span>🏢</span> <span style="font-size:0.8125rem;font-weight:600;color:var(--text-primary)">Vendor Information</span>
          </div>
          <div style="padding:1.5rem;text-align:center">
            <div id="mac-vendor" style="font-size:1.5rem;font-weight:700;color:var(--color-primary);margin-bottom:0.5rem"></div>
            <div id="mac-prefix" style="font-family:'JetBrains Mono',monospace;font-size:0.875rem;color:var(--text-secondary);background:var(--bg-surface-hover);padding:0.25rem 0.75rem;border-radius:var(--radius-full);display:inline-block"></div>
          </div>
        </div>

        <!-- Technical Details Grid -->
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:1rem">
          <div style="border-radius:var(--radius-lg);border:1px solid var(--border-color);background:var(--bg-surface);padding:1.25rem">
            <div style="font-size:0.6875rem;text-transform:uppercase;letter-spacing:0.05em;color:var(--text-tertiary);margin-bottom:0.5rem">Transmission Type (Bit 0)</div>
            <div id="mac-cast" style="font-size:0.9375rem;font-weight:600;color:var(--text-primary)"></div>
            <div id="mac-cast-desc" style="font-size:0.75rem;color:var(--text-secondary);margin-top:0.25rem"></div>
          </div>
          
          <div style="border-radius:var(--radius-lg);border:1px solid var(--border-color);background:var(--bg-surface);padding:1.25rem">
            <div style="font-size:0.6875rem;text-transform:uppercase;letter-spacing:0.05em;color:var(--text-tertiary);margin-bottom:0.5rem">Administration Type (Bit 1)</div>
            <div id="mac-admin" style="font-size:0.9375rem;font-weight:600;color:var(--text-primary)"></div>
            <div id="mac-admin-desc" style="font-size:0.75rem;color:var(--text-secondary);margin-top:0.25rem"></div>
          </div>
        </div>

        <!-- Formats -->
        <div style="border-radius:var(--radius-lg);border:1px solid var(--border-color);overflow:hidden;background:var(--bg-surface);margin-top:1rem">
          <div style="padding:0.75rem 1rem;background:var(--bg-surface-hover);border-bottom:1px solid var(--border-color)">
            <span style="font-size:0.8125rem;font-weight:600;color:var(--text-primary)">📋 Standard Formats</span>
          </div>
          <div style="padding:1rem;display:grid;gap:0.75rem">
            <div style="display:flex;justify-content:space-between;align-items:center;padding:0.75rem;border-radius:var(--radius-md);border:1px solid var(--border-color);background:var(--bg-surface-hover)">
              <span style="font-size:0.8125rem;color:var(--text-secondary)">Standard / Linux</span>
              <div style="display:flex;align-items:center;gap:0.5rem">
                <code id="mac-fmt-standard" style="font-family:'JetBrains Mono',monospace;font-size:0.875rem;color:var(--text-primary)"></code>
                <button class="mac-copy" data-target="mac-fmt-standard" style="background:none;border:none;cursor:pointer;opacity:0.6;font-size:1rem;padding:0.25rem">📋</button>
              </div>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;padding:0.75rem;border-radius:var(--radius-md);border:1px solid var(--border-color);background:var(--bg-surface-hover)">
              <span style="font-size:0.8125rem;color:var(--text-secondary)">Windows / IEEE 802</span>
              <div style="display:flex;align-items:center;gap:0.5rem">
                <code id="mac-fmt-windows" style="font-family:'JetBrains Mono',monospace;font-size:0.875rem;color:var(--text-primary)"></code>
                <button class="mac-copy" data-target="mac-fmt-windows" style="background:none;border:none;cursor:pointer;opacity:0.6;font-size:1rem;padding:0.25rem">📋</button>
              </div>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;padding:0.75rem;border-radius:var(--radius-md);border:1px solid var(--border-color);background:var(--bg-surface-hover)">
              <span style="font-size:0.8125rem;color:var(--text-secondary)">Cisco</span>
              <div style="display:flex;align-items:center;gap:0.5rem">
                <code id="mac-fmt-cisco" style="font-family:'JetBrains Mono',monospace;font-size:0.875rem;color:var(--text-primary)"></code>
                <button class="mac-copy" data-target="mac-fmt-cisco" style="background:none;border:none;cursor:pointer;opacity:0.6;font-size:1rem;padding:0.25rem">📋</button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>`;
  page.appendChild(section);

  setTimeout(() => {
    const input = page.querySelector('#mac-input');
    const btn = page.querySelector('#mac-search');
    const loading = page.querySelector('#mac-loading');
    const errorDiv = page.querySelector('#mac-error');
    const results = page.querySelector('#mac-results');

    // Result elements
    const vendorEl = page.querySelector('#mac-vendor');
    const prefixEl = page.querySelector('#mac-prefix');
    const castEl = page.querySelector('#mac-cast');
    const castDescEl = page.querySelector('#mac-cast-desc');
    const adminEl = page.querySelector('#mac-admin');
    const adminDescEl = page.querySelector('#mac-admin-desc');
    
    const fmtStandard = page.querySelector('#mac-fmt-standard');
    const fmtWindows = page.querySelector('#mac-fmt-windows');
    const fmtCisco = page.querySelector('#mac-fmt-cisco');

    function parseMac(macStr) {
      const clean = macStr.replace(/[^a-fA-F0-9]/g, '').toUpperCase();
      if (clean.length !== 12) return null;
      return clean;
    }

    function formatMacArray(clean) {
      const parts = [];
      for (let i = 0; i < 12; i += 2) parts.push(clean.substr(i, 2));
      return parts;
    }

    async function doLookup() {
      const raw = input.value.trim();
      const clean = parseMac(raw);

      if (!clean) {
        input.style.borderColor = 'var(--color-error)';
        errorDiv.textContent = '❌ Invalid MAC Address format. Needs 12 hex characters.';
        errorDiv.style.display = 'block';
        results.style.display = 'none';
        return;
      }

      input.style.borderColor = 'var(--color-primary)';
      errorDiv.style.display = 'none';
      results.style.display = 'none';
      loading.style.display = 'block';
      btn.disabled = true;

      const parts = formatMacArray(clean);
      const standardFormat = parts.join(':');
      const windowsFormat = parts.join('-');
      const ciscoFormat = clean.substr(0, 4) + '.' + clean.substr(4, 4) + '.' + clean.substr(8, 4);

      // Bitwise analysis of first octet
      const firstOctet = parseInt(parts[0], 16);
      const isMulticast = (firstOctet & 0x01) === 1;
      const isLAA = (firstOctet & 0x02) === 2;

      castEl.textContent = isMulticast ? 'Multicast (Group)' : 'Unicast (Single)';
      castEl.style.color = isMulticast ? 'var(--color-accent)' : 'var(--color-success)';
      castDescEl.innerHTML = isMulticast 
        ? 'Frame is sent to all stations in a dedicated group. <strong>Bit 0 is 1</strong>.' 
        : 'Frame is sent to a single specific station. <strong>Bit 0 is 0</strong>.';

      adminEl.textContent = isLAA ? 'Locally Administered (LAA)' : 'Universally Administered (UAA)';
      adminEl.style.color = isLAA ? 'var(--color-error)' : 'var(--color-success)';
      adminDescEl.innerHTML = isLAA 
        ? 'MAC Address is overridden by software/network admin. <strong>Bit 1 is 1</strong>.' 
        : 'Burned-in address assigned by device manufacturer. <strong>Bit 1 is 0</strong>.';

      // Formats
      fmtStandard.textContent = standardFormat;
      fmtWindows.textContent = windowsFormat;
      fmtCisco.textContent = ciscoFormat.toLowerCase();

      // Prefix
      prefixEl.textContent = 'OUI Prefix: ' + standardFormat.substring(0, 8);

      try {
        // We use MACVendors API as it allows CORS and is free without API key
        // Using a CORS proxy to be absolutely safe (some adblockers block macvendors directly)
        const response = await fetch(`https://api.macvendors.com/${standardFormat}`);
        
        if (response.ok) {
          const vendor = await response.text();
          vendorEl.textContent = vendor;
        } else if (response.status === 404) {
          vendorEl.textContent = 'Unknown / Not Found';
          vendorEl.style.color = 'var(--text-secondary)';
        } else {
          // Fallback if API rate limited
          vendorEl.textContent = 'Lookup Unavailable';
          vendorEl.style.color = 'var(--color-error)';
        }
      } catch (e) {
        // Failed to fetch (cors/adblocker)
        try {
          // Secondary fallback API
          const res2 = await fetch(`https://mac-address.alldata.pt/api/${standardFormat}`);
          const data = await res2.json();
          vendorEl.textContent = data.vendor || 'Unknown Provider';
        } catch(fallbackErr) {
          vendorEl.textContent = 'Network Error (Try disabling adblock)';
          vendorEl.style.color = 'var(--color-error)';
        }
      }

      loading.style.display = 'none';
      results.style.display = 'grid';
      btn.disabled = false;
    }

    btn.addEventListener('click', doLookup);
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') doLookup();
    });

    // Copy buttons
    page.querySelectorAll('.mac-copy').forEach(copyBtn => {
      copyBtn.addEventListener('click', (e) => {
        const targetId = e.target.closest('button').dataset.target;
        const textToCopy = page.querySelector('#' + targetId).textContent;
        navigator.clipboard.writeText(textToCopy);
        showToast('Copied to clipboard!', 'success');
        e.target.textContent = '✅';
        setTimeout(() => e.target.textContent = '📋', 2000);
      });
    });

    input.focus();
  }, 100);

  return page;
}
