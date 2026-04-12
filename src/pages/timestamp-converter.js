// src/pages/timestamp-converter.js
import { showToast } from '../components/toast.js';

export function renderTimestampConverter() {
  const page = document.createElement('div');
  page.innerHTML = `<section class="page-hero"><div class="container">
    <h1>Unix Timestamp Converter</h1>
    <p>Convert between Unix timestamps and human-readable dates. Supports seconds and milliseconds.</p>
  </div></section>`;

  const section = document.createElement('section');
  section.className = 'container page-section';
  section.innerHTML = `
    <div style="max-width:900px;margin:0 auto">

      <!-- Live Clock -->
      <div style="text-align:center;padding:1.5rem;border-radius:var(--radius-lg);border:1px solid var(--border-color);background:var(--bg-surface);margin-bottom:1.25rem">
        <div style="font-size:0.75rem;text-transform:uppercase;letter-spacing:0.05em;color:var(--text-tertiary);margin-bottom:0.5rem">Current Unix Timestamp</div>
        <div id="ts-live" style="font-family:'JetBrains Mono',monospace;font-size:2rem;font-weight:700;color:var(--color-primary);cursor:pointer;transition:all 0.2s" title="Click to copy"></div>
        <div id="ts-live-date" style="font-size:0.875rem;color:var(--text-secondary);margin-top:0.375rem"></div>
        <div id="ts-live-ms" style="font-size:0.75rem;color:var(--text-tertiary);margin-top:0.25rem;font-family:'JetBrains Mono',monospace"></div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.25rem" id="ts-grid">
        <!-- Timestamp → Date -->
        <div style="border-radius:var(--radius-lg);border:1px solid var(--border-color);overflow:hidden">
          <div style="padding:0.75rem 1rem;background:var(--bg-surface-hover);border-bottom:1px solid var(--border-color)">
            <span style="font-size:0.8125rem;font-weight:600;color:var(--text-primary)">⏰ Timestamp → Date</span>
          </div>
          <div style="padding:1rem;background:var(--bg-surface)">
            <div style="display:flex;gap:0.5rem;margin-bottom:0.75rem">
              <input type="text" id="ts-input" placeholder="e.g. 1700000000" spellcheck="false" style="flex:1;padding:0.625rem 0.75rem;border-radius:var(--radius-md);border:1px solid var(--border-color);background:var(--bg-surface-hover);color:var(--text-primary);font-family:'JetBrains Mono',monospace;font-size:0.875rem;outline:none;box-sizing:border-box">
              <button id="ts-now-btn" style="padding:0.625rem 0.75rem;font-size:0.75rem;font-weight:600;border-radius:var(--radius-md);background:var(--color-primary);color:white;border:none;cursor:pointer;white-space:nowrap">Now</button>
            </div>
            <div style="display:flex;gap:0.5rem;margin-bottom:0.75rem">
              <button class="ts-unit-btn active" data-unit="s" style="flex:1;padding:0.375rem;font-size:0.75rem;font-weight:600;border-radius:var(--radius-md);border:1px solid var(--border-color);cursor:pointer;transition:all 0.2s">Seconds</button>
              <button class="ts-unit-btn" data-unit="ms" style="flex:1;padding:0.375rem;font-size:0.75rem;font-weight:600;border-radius:var(--radius-md);border:1px solid var(--border-color);cursor:pointer;transition:all 0.2s">Milliseconds</button>
            </div>
            <div id="ts-to-date-result"></div>
          </div>
        </div>

        <!-- Date → Timestamp -->
        <div style="border-radius:var(--radius-lg);border:1px solid var(--border-color);overflow:hidden">
          <div style="padding:0.75rem 1rem;background:var(--bg-surface-hover);border-bottom:1px solid var(--border-color)">
            <span style="font-size:0.8125rem;font-weight:600;color:var(--text-primary)">📅 Date → Timestamp</span>
          </div>
          <div style="padding:1rem;background:var(--bg-surface)">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.5rem;margin-bottom:0.75rem">
              <div>
                <label style="font-size:0.6875rem;color:var(--text-tertiary);display:block;margin-bottom:0.25rem">Date</label>
                <input type="date" id="ts-date" style="width:100%;padding:0.5rem;border-radius:var(--radius-md);border:1px solid var(--border-color);background:var(--bg-surface-hover);color:var(--text-primary);font-size:0.8125rem;outline:none;box-sizing:border-box">
              </div>
              <div>
                <label style="font-size:0.6875rem;color:var(--text-tertiary);display:block;margin-bottom:0.25rem">Time</label>
                <input type="time" id="ts-time" step="1" style="width:100%;padding:0.5rem;border-radius:var(--radius-md);border:1px solid var(--border-color);background:var(--bg-surface-hover);color:var(--text-primary);font-size:0.8125rem;outline:none;box-sizing:border-box">
              </div>
            </div>
            <button id="ts-now-date-btn" style="width:100%;padding:0.5rem;font-size:0.75rem;font-weight:500;border-radius:var(--radius-md);border:1px solid var(--border-color);background:var(--bg-surface);color:var(--text-secondary);cursor:pointer;margin-bottom:0.75rem">📌 Set to Now</button>
            <div id="ts-from-date-result"></div>
          </div>
        </div>
      </div>

      <!-- Quick Reference -->
      <div style="margin-top:1.25rem;border-radius:var(--radius-lg);border:1px solid var(--border-color);overflow:hidden">
        <div style="padding:0.75rem 1rem;background:var(--bg-surface-hover);border-bottom:1px solid var(--border-color)">
          <span style="font-size:0.8125rem;font-weight:600;color:var(--text-primary)">📋 Quick Reference</span>
        </div>
        <div style="padding:0;background:var(--bg-surface)">
          <table style="width:100%;border-collapse:collapse">
            <thead>
              <tr style="background:var(--bg-surface-hover)">
                <th style="text-align:left;padding:0.625rem 1rem;font-size:0.75rem;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:var(--text-tertiary);border-bottom:1px solid var(--border-color)">Event</th>
                <th style="text-align:left;padding:0.625rem 1rem;font-size:0.75rem;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:var(--text-tertiary);border-bottom:1px solid var(--border-color)">Timestamp</th>
                <th style="text-align:left;padding:0.625rem 1rem;font-size:0.75rem;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:var(--text-tertiary);border-bottom:1px solid var(--border-color)">Date</th>
              </tr>
            </thead>
            <tbody id="ts-reference-body"></tbody>
          </table>
        </div>
      </div>
    </div>`;
  page.appendChild(section);

  setTimeout(() => {
    const live = page.querySelector('#ts-live');
    const liveDate = page.querySelector('#ts-live-date');
    const liveMs = page.querySelector('#ts-live-ms');
    const tsInput = page.querySelector('#ts-input');
    const toDateResult = page.querySelector('#ts-to-date-result');
    const dateInput = page.querySelector('#ts-date');
    const timeInput = page.querySelector('#ts-time');
    const fromDateResult = page.querySelector('#ts-from-date-result');
    const refBody = page.querySelector('#ts-reference-body');

    let currentUnit = 's';

    // Live clock
    function updateLive() {
      const now = new Date();
      const ts = Math.floor(now.getTime() / 1000);
      live.textContent = ts;
      liveDate.textContent = now.toLocaleString();
      liveMs.textContent = `ms: ${now.getTime()}`;
    }
    updateLive();
    const liveInterval = setInterval(updateLive, 1000);

    // Clean up on navigation
    const observer = new MutationObserver(() => {
      if (!document.contains(page)) {
        clearInterval(liveInterval);
        observer.disconnect();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    live.addEventListener('click', () => {
      navigator.clipboard.writeText(live.textContent);
      showToast('Timestamp copied!', 'success');
    });

    // Unit toggle
    page.querySelectorAll('.ts-unit-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        page.querySelectorAll('.ts-unit-btn').forEach(b => {
          b.classList.remove('active');
          b.style.background = 'var(--bg-surface)';
          b.style.color = 'var(--text-secondary)';
          b.style.borderColor = 'var(--border-color)';
        });
        btn.classList.add('active');
        btn.style.background = 'var(--color-primary-light)';
        btn.style.color = 'var(--color-primary)';
        btn.style.borderColor = 'var(--color-primary)';
        currentUnit = btn.dataset.unit;
        convertToDate();
      });
    });

    // Init active style
    const activeBtn = page.querySelector('.ts-unit-btn.active');
    if (activeBtn) {
      activeBtn.style.background = 'var(--color-primary-light)';
      activeBtn.style.color = 'var(--color-primary)';
      activeBtn.style.borderColor = 'var(--color-primary)';
    }

    // Timestamp → Date
    function convertToDate() {
      const raw = tsInput.value.trim();
      if (!raw) { toDateResult.innerHTML = ''; return; }
      const num = parseInt(raw);
      if (isNaN(num)) {
        toDateResult.innerHTML = '<div style="color:var(--color-error);font-size:0.8125rem">❌ Invalid number</div>';
        return;
      }
      const ms = currentUnit === 'ms' ? num : num * 1000;
      const d = new Date(ms);
      if (isNaN(d.getTime())) {
        toDateResult.innerHTML = '<div style="color:var(--color-error);font-size:0.8125rem">❌ Invalid timestamp</div>';
        return;
      }

      const now = new Date();
      const diff = now - d;
      const absDiff = Math.abs(diff);
      let relative;
      if (absDiff < 60000) relative = 'just now';
      else if (absDiff < 3600000) relative = Math.floor(absDiff / 60000) + ' min';
      else if (absDiff < 86400000) relative = Math.floor(absDiff / 3600000) + ' hours';
      else if (absDiff < 2592000000) relative = Math.floor(absDiff / 86400000) + ' days';
      else if (absDiff < 31536000000) relative = Math.floor(absDiff / 2592000000) + ' months';
      else relative = Math.floor(absDiff / 31536000000) + ' years';
      if (diff > 0) relative += ' ago';
      else relative = 'in ' + relative;

      toDateResult.innerHTML = `
        <div style="display:grid;gap:0.5rem">
          <div style="padding:0.5rem 0.75rem;border-radius:var(--radius-md);background:var(--bg-surface-hover)">
            <div style="font-size:0.6875rem;color:var(--text-tertiary);text-transform:uppercase">Local</div>
            <div style="font-size:0.8125rem;font-weight:600;color:var(--text-primary);font-family:'JetBrains Mono',monospace">${d.toLocaleString()}</div>
          </div>
          <div style="padding:0.5rem 0.75rem;border-radius:var(--radius-md);background:var(--bg-surface-hover)">
            <div style="font-size:0.6875rem;color:var(--text-tertiary);text-transform:uppercase">UTC</div>
            <div style="font-size:0.8125rem;font-weight:600;color:var(--text-primary);font-family:'JetBrains Mono',monospace">${d.toUTCString()}</div>
          </div>
          <div style="padding:0.5rem 0.75rem;border-radius:var(--radius-md);background:var(--bg-surface-hover)">
            <div style="font-size:0.6875rem;color:var(--text-tertiary);text-transform:uppercase">ISO 8601</div>
            <div style="font-size:0.8125rem;font-weight:600;color:var(--text-primary);font-family:'JetBrains Mono',monospace">${d.toISOString()}</div>
          </div>
          <div style="padding:0.5rem 0.75rem;border-radius:var(--radius-md);background:var(--bg-surface-hover)">
            <div style="font-size:0.6875rem;color:var(--text-tertiary);text-transform:uppercase">Relative</div>
            <div style="font-size:0.8125rem;font-weight:600;color:var(--color-primary)">${relative}</div>
          </div>
        </div>`;
    }

    tsInput.addEventListener('input', convertToDate);
    page.querySelector('#ts-now-btn').addEventListener('click', () => {
      tsInput.value = currentUnit === 'ms' ? Date.now() : Math.floor(Date.now() / 1000);
      convertToDate();
    });

    // Date → Timestamp
    function convertFromDate() {
      const dv = dateInput.value;
      const tv = timeInput.value;
      if (!dv) { fromDateResult.innerHTML = ''; return; }
      const d = new Date(`${dv}T${tv || '00:00:00'}`);
      if (isNaN(d.getTime())) {
        fromDateResult.innerHTML = '<div style="color:var(--color-error);font-size:0.8125rem">❌ Invalid date</div>';
        return;
      }
      const sec = Math.floor(d.getTime() / 1000);
      const ms = d.getTime();
      fromDateResult.innerHTML = `
        <div style="display:grid;gap:0.5rem">
          <div style="padding:0.5rem 0.75rem;border-radius:var(--radius-md);background:var(--bg-surface-hover);display:flex;justify-content:space-between;align-items:center">
            <div>
              <div style="font-size:0.6875rem;color:var(--text-tertiary);text-transform:uppercase">Seconds</div>
              <div style="font-size:0.9375rem;font-weight:700;color:var(--color-primary);font-family:'JetBrains Mono',monospace;cursor:pointer" onclick="navigator.clipboard.writeText('${sec}')" title="Click to copy">${sec}</div>
            </div>
            <button onclick="navigator.clipboard.writeText('${sec}')" style="padding:0.25rem 0.5rem;font-size:0.6875rem;border-radius:var(--radius-sm);border:1px solid var(--border-color);background:var(--bg-surface);color:var(--text-tertiary);cursor:pointer">Copy</button>
          </div>
          <div style="padding:0.5rem 0.75rem;border-radius:var(--radius-md);background:var(--bg-surface-hover);display:flex;justify-content:space-between;align-items:center">
            <div>
              <div style="font-size:0.6875rem;color:var(--text-tertiary);text-transform:uppercase">Milliseconds</div>
              <div style="font-size:0.9375rem;font-weight:700;color:var(--color-accent);font-family:'JetBrains Mono',monospace;cursor:pointer" onclick="navigator.clipboard.writeText('${ms}')" title="Click to copy">${ms}</div>
            </div>
            <button onclick="navigator.clipboard.writeText('${ms}')" style="padding:0.25rem 0.5rem;font-size:0.6875rem;border-radius:var(--radius-sm);border:1px solid var(--border-color);background:var(--bg-surface);color:var(--text-tertiary);cursor:pointer">Copy</button>
          </div>
        </div>`;
    }

    dateInput.addEventListener('input', convertFromDate);
    timeInput.addEventListener('input', convertFromDate);
    page.querySelector('#ts-now-date-btn').addEventListener('click', () => {
      const now = new Date();
      dateInput.value = now.toISOString().split('T')[0];
      timeInput.value = now.toTimeString().split(' ')[0];
      convertFromDate();
    });

    // Reference table
    const references = [
      { name: 'Unix Epoch', ts: 0 },
      { name: 'Y2K', ts: 946684800 },
      { name: 'Max 32-bit', ts: 2147483647 },
      { name: '1 hour ago', ts: Math.floor(Date.now() / 1000) - 3600 },
      { name: 'Now', ts: Math.floor(Date.now() / 1000) },
      { name: '1 hour from now', ts: Math.floor(Date.now() / 1000) + 3600 },
      { name: 'Tomorrow', ts: Math.floor(Date.now() / 1000) + 86400 },
      { name: 'Next week', ts: Math.floor(Date.now() / 1000) + 604800 },
    ];

    refBody.innerHTML = references.map(r => `
      <tr style="border-bottom:1px solid var(--border-color)">
        <td style="padding:0.5rem 1rem;font-size:0.8125rem;color:var(--text-primary);font-weight:500">${r.name}</td>
        <td style="padding:0.5rem 1rem;font-family:'JetBrains Mono',monospace;font-size:0.8125rem;color:var(--color-primary);cursor:pointer" onclick="navigator.clipboard.writeText('${r.ts}')" title="Click to copy">${r.ts}</td>
        <td style="padding:0.5rem 1rem;font-size:0.8125rem;color:var(--text-secondary)">${new Date(r.ts * 1000).toLocaleString()}</td>
      </tr>`).join('');

  }, 100);

  return page;
}
