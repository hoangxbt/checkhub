// src/pages/uuid-generator.js
import { showToast } from '../components/toast.js';

export function renderUuidGenerator() {
  const page = document.createElement('div');
  page.innerHTML = `<section class="page-hero"><div class="container">
    <h1>UUID Generator</h1>
    <p>Generate universally unique identifiers (UUID v4). Bulk generate, validate, and format UUIDs.</p>
  </div></section>`;

  const section = document.createElement('section');
  section.className = 'container page-section';
  section.innerHTML = `
    <div style="max-width:900px;margin:0 auto">

      <!-- Single UUID -->
      <div style="border-radius:var(--radius-lg);border:1px solid var(--border-color);overflow:hidden;margin-bottom:1.25rem">
        <div style="padding:0.75rem 1rem;background:var(--bg-surface-hover);border-bottom:1px solid var(--border-color);display:flex;justify-content:space-between;align-items:center">
          <span style="font-size:0.8125rem;font-weight:600;color:var(--text-primary)">🆔 Generate UUID</span>
          <div style="display:flex;gap:0.375rem;align-items:center">
            <label style="font-size:0.75rem;color:var(--text-secondary);display:flex;align-items:center;gap:0.25rem;cursor:pointer">
              Case:
              <select id="uuid-case" style="padding:0.25rem 0.5rem;border-radius:var(--radius-sm);border:1px solid var(--border-color);background:var(--bg-surface);color:var(--text-primary);font-size:0.75rem">
                <option value="lower">lowercase</option>
                <option value="upper">UPPERCASE</option>
              </select>
            </label>
            <label style="font-size:0.75rem;color:var(--text-secondary);display:flex;align-items:center;gap:0.25rem;cursor:pointer">
              <input type="checkbox" id="uuid-braces" style="cursor:pointer"> Braces
            </label>
            <label style="font-size:0.75rem;color:var(--text-secondary);display:flex;align-items:center;gap:0.25rem;cursor:pointer">
              <input type="checkbox" id="uuid-no-hyphens" style="cursor:pointer"> No hyphens
            </label>
          </div>
        </div>
        <div style="padding:1.25rem;background:var(--bg-surface);text-align:center">
          <div id="uuid-display" style="font-family:'JetBrains Mono',monospace;font-size:1.5rem;font-weight:600;color:var(--color-primary);letter-spacing:0.025em;margin-bottom:1rem;word-break:break-all;cursor:pointer;padding:0.75rem;border-radius:var(--radius-md);transition:background 0.2s" title="Click to copy"></div>
          <div style="display:flex;gap:0.5rem;justify-content:center">
            <button id="uuid-new" style="padding:0.625rem 1.5rem;background:linear-gradient(135deg,var(--color-primary),var(--color-accent));color:white;font-size:0.875rem;font-weight:600;border-radius:var(--radius-md);border:none;cursor:pointer;transition:all 0.2s">🔄 Generate New</button>
            <button id="uuid-copy" style="padding:0.625rem 1.25rem;background:var(--bg-surface-hover);color:var(--text-primary);font-size:0.875rem;font-weight:500;border-radius:var(--radius-md);border:1px solid var(--border-color);cursor:pointer;transition:all 0.2s">📋 Copy</button>
          </div>
        </div>
      </div>

      <!-- Bulk Generate -->
      <div style="border-radius:var(--radius-lg);border:1px solid var(--border-color);overflow:hidden;margin-bottom:1.25rem">
        <div style="padding:0.75rem 1rem;background:var(--bg-surface-hover);border-bottom:1px solid var(--border-color);display:flex;justify-content:space-between;align-items:center">
          <span style="font-size:0.8125rem;font-weight:600;color:var(--text-primary)">📦 Bulk Generate</span>
          <div style="display:flex;gap:0.5rem;align-items:center">
            <label style="font-size:0.75rem;color:var(--text-secondary)">Count:</label>
            <input type="number" id="uuid-count" value="10" min="1" max="1000" style="width:70px;padding:0.375rem 0.5rem;border-radius:var(--radius-sm);border:1px solid var(--border-color);background:var(--bg-surface);color:var(--text-primary);font-size:0.8125rem;text-align:center;outline:none">
            <button id="uuid-bulk" style="padding:0.375rem 0.75rem;font-size:0.75rem;font-weight:600;border-radius:var(--radius-md);background:var(--color-primary);color:white;border:none;cursor:pointer">Generate</button>
            <button id="uuid-bulk-copy" style="padding:0.375rem 0.75rem;font-size:0.75rem;font-weight:500;border-radius:var(--radius-md);border:1px solid var(--border-color);background:var(--bg-surface);color:var(--text-secondary);cursor:pointer">📋 Copy All</button>
          </div>
        </div>
        <textarea id="uuid-bulk-output" readonly style="width:100%;min-height:200px;padding:1rem;border:none;background:var(--bg-surface);color:var(--text-primary);font-family:'JetBrains Mono',monospace;font-size:0.8125rem;resize:vertical;outline:none;line-height:1.8;box-sizing:border-box"></textarea>
      </div>

      <!-- Validate UUID -->
      <div style="border-radius:var(--radius-lg);border:1px solid var(--border-color);overflow:hidden">
        <div style="padding:0.75rem 1rem;background:var(--bg-surface-hover);border-bottom:1px solid var(--border-color)">
          <span style="font-size:0.8125rem;font-weight:600;color:var(--text-primary)">✅ Validate UUID</span>
        </div>
        <div style="padding:1rem;background:var(--bg-surface)">
          <div style="display:flex;gap:0.5rem">
            <input type="text" id="uuid-validate-input" placeholder="Paste UUID to validate..." spellcheck="false" style="flex:1;padding:0.625rem 0.75rem;border-radius:var(--radius-md);border:1px solid var(--border-color);background:var(--bg-surface-hover);color:var(--text-primary);font-family:'JetBrains Mono',monospace;font-size:0.8125rem;outline:none;box-sizing:border-box">
            <button id="uuid-validate-btn" style="padding:0.625rem 1rem;font-size:0.8125rem;font-weight:500;border-radius:var(--radius-md);border:1px solid var(--border-color);background:var(--bg-surface);color:var(--text-primary);cursor:pointer">Check</button>
          </div>
          <div id="uuid-validate-result" style="margin-top:0.75rem;font-size:0.8125rem;display:none"></div>
        </div>
      </div>
    </div>`;
  page.appendChild(section);

  setTimeout(() => {
    const display = page.querySelector('#uuid-display');
    const caseSelect = page.querySelector('#uuid-case');
    const bracesCheck = page.querySelector('#uuid-braces');
    const noHyphensCheck = page.querySelector('#uuid-no-hyphens');
    const bulkOutput = page.querySelector('#uuid-bulk-output');
    const countInput = page.querySelector('#uuid-count');
    const validateInput = page.querySelector('#uuid-validate-input');
    const validateResult = page.querySelector('#uuid-validate-result');

    function generateUUID() {
      return crypto.randomUUID();
    }

    function formatUUID(uuid) {
      let formatted = uuid;
      if (noHyphensCheck.checked) formatted = formatted.replace(/-/g, '');
      if (caseSelect.value === 'upper') formatted = formatted.toUpperCase();
      if (bracesCheck.checked) formatted = `{${formatted}}`;
      return formatted;
    }

    function newUUID() {
      const uuid = formatUUID(generateUUID());
      display.textContent = uuid;
      display.style.animation = 'none';
      display.offsetHeight; // trigger reflow
      display.style.animation = 'fadeIn 0.3s ease';
    }

    newUUID();

    page.querySelector('#uuid-new').addEventListener('click', newUUID);
    page.querySelector('#uuid-copy').addEventListener('click', () => {
      navigator.clipboard.writeText(display.textContent);
      showToast('UUID copied!', 'success');
    });
    display.addEventListener('click', () => {
      navigator.clipboard.writeText(display.textContent);
      showToast('UUID copied!', 'success');
      display.style.background = 'var(--color-primary-light)';
      setTimeout(() => display.style.background = 'transparent', 300);
    });

    // Options change
    [caseSelect, bracesCheck, noHyphensCheck].forEach(el => {
      el.addEventListener('change', newUUID);
    });

    // Bulk
    page.querySelector('#uuid-bulk').addEventListener('click', () => {
      const count = Math.min(Math.max(parseInt(countInput.value) || 10, 1), 1000);
      const uuids = [];
      for (let i = 0; i < count; i++) uuids.push(formatUUID(generateUUID()));
      bulkOutput.value = uuids.join('\n');
      showToast(`Generated ${count} UUIDs`, 'success');
    });

    page.querySelector('#uuid-bulk-copy').addEventListener('click', () => {
      if (bulkOutput.value) {
        navigator.clipboard.writeText(bulkOutput.value);
        showToast('All UUIDs copied!', 'success');
      }
    });

    // Validate
    function validateUUID() {
      const val = validateInput.value.trim();
      if (!val) { validateResult.style.display = 'none'; return; }
      validateResult.style.display = 'block';

      // UUID v1-v5 regex
      const uuidRegex = /^[{(]?[0-9a-f]{8}-?[0-9a-f]{4}-?[0-5][0-9a-f]{3}-?[089ab][0-9a-f]{3}-?[0-9a-f]{12}[)}]?$/i;
      const isValid = uuidRegex.test(val);

      if (isValid) {
        const clean = val.replace(/[{}()-]/g, '').toLowerCase();
        const version = clean[12];
        const variant = parseInt(clean[16], 16);
        let variantName = 'Unknown';
        if ((variant & 0x8) === 0) variantName = 'NCS';
        else if ((variant & 0xC) === 0x8) variantName = 'RFC 4122';
        else if ((variant & 0xE) === 0xC) variantName = 'Microsoft';
        else variantName = 'Future';

        validateResult.innerHTML = `<div style="padding:0.75rem;border-radius:var(--radius-md);background:rgba(16,185,129,0.08)">
          <div style="color:var(--color-success);font-weight:600;margin-bottom:0.5rem">✅ Valid UUID</div>
          <div style="display:flex;gap:1rem;font-size:0.8125rem;color:var(--text-secondary)">
            <span>Version: <strong style="color:var(--text-primary)">v${version}</strong></span>
            <span>Variant: <strong style="color:var(--text-primary)">${variantName}</strong></span>
          </div>
        </div>`;
      } else {
        validateResult.innerHTML = `<div style="padding:0.75rem;border-radius:var(--radius-md);background:rgba(239,68,68,0.08);color:var(--color-error);font-weight:600">❌ Invalid UUID format</div>`;
      }
    }

    page.querySelector('#uuid-validate-btn').addEventListener('click', validateUUID);
    validateInput.addEventListener('input', validateUUID);
  }, 100);

  return page;
}
