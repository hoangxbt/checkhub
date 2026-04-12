// src/pages/password-generator.js
import { makeClickToCopy } from '../components/copy-button.js';
import { showToast } from '../components/toast.js';

const CHARSETS = {
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  numbers: '0123456789',
  symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?',
};

export function renderPasswordGenerator() {
  const page = document.createElement('div');
  page.innerHTML = `<section class="page-hero"><div class="container">
    <h1>Password Generator</h1>
    <p>Generate strong, random passwords. Customize length, characters, and complexity.</p>
  </div></section>`;

  const section = document.createElement('section');
  section.className = 'container page-section';
  section.innerHTML = `
    <div style="max-width:700px;margin:0 auto">
      <!-- Password Display -->
      <div id="pw-display" style="padding:1.5rem 2rem;border-radius:var(--radius-lg);background:var(--bg-surface);border:2px solid var(--border-color);margin-bottom:1.5rem;text-align:center;cursor:pointer;transition:border-color 0.2s" title="Click to copy">
        <p id="pw-value" style="font-family:'JetBrains Mono',monospace;font-size:1.75rem;font-weight:600;color:var(--text-primary);word-break:break-all;letter-spacing:0.05em;line-height:1.5;user-select:all"></p>
        <p style="font-size:0.75rem;color:var(--text-tertiary);margin-top:0.5rem">Click to copy</p>
      </div>

      <!-- Strength Meter -->
      <div style="margin-bottom:1.5rem">
        <div style="display:flex;justify-content:space-between;margin-bottom:0.375rem">
          <span style="font-size:0.8125rem;color:var(--text-secondary)">Strength</span>
          <span id="pw-strength-label" style="font-size:0.8125rem;font-weight:600"></span>
        </div>
        <div style="height:6px;border-radius:3px;background:var(--bg-surface-hover);overflow:hidden">
          <div id="pw-strength-bar" style="height:100%;border-radius:3px;transition:width 0.3s,background 0.3s"></div>
        </div>
      </div>

      <!-- Length Slider -->
      <div style="margin-bottom:1.5rem;padding:1.25rem;border-radius:var(--radius-lg);background:var(--bg-surface);border:1px solid var(--border-color)">
        <div style="display:flex;justify-content:space-between;margin-bottom:0.75rem">
          <label style="font-size:0.875rem;font-weight:600;color:var(--text-primary)">Password Length</label>
          <span id="pw-length-display" style="font-family:'JetBrains Mono',monospace;font-size:0.875rem;font-weight:700;color:var(--color-primary);min-width:2.5rem;text-align:right"></span>
        </div>
        <input id="pw-length" type="range" min="4" max="128" value="20" style="width:100%;accent-color:var(--color-primary);cursor:pointer" />
        <div style="display:flex;justify-content:space-between;font-size:0.7rem;color:var(--text-tertiary);margin-top:0.25rem"><span>4</span><span>128</span></div>
      </div>

      <!-- Character Options -->
      <div style="margin-bottom:1.5rem;padding:1.25rem;border-radius:var(--radius-lg);background:var(--bg-surface);border:1px solid var(--border-color)">
        <p style="font-size:0.875rem;font-weight:600;color:var(--text-primary);margin-bottom:0.75rem">Character Types</p>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem">
          ${['uppercase:Uppercase (A-Z)', 'lowercase:Lowercase (a-z)', 'numbers:Numbers (0-9)', 'symbols:Symbols (!@#$%)'].map(opt => {
            const [id, label] = opt.split(':');
            return `<label style="display:flex;align-items:center;gap:0.625rem;padding:0.625rem 0.875rem;border-radius:var(--radius-md);border:1px solid var(--border-color);cursor:pointer;transition:background 0.15s;font-size:0.8125rem;color:var(--text-primary)" onmouseover="this.style.background='var(--bg-surface-hover)'" onmouseout="this.style.background=''">
              <input type="checkbox" id="pw-${id}" checked style="accent-color:var(--color-primary);width:1rem;height:1rem;cursor:pointer" />
              ${label}
            </label>`;
          }).join('')}
        </div>
      </div>

      <!-- Actions -->
      <div style="display:flex;gap:0.75rem;flex-wrap:wrap">
        <button id="pw-generate" style="flex:1;min-width:150px;padding:0.875rem 1.5rem;background:linear-gradient(135deg,var(--color-primary),var(--color-accent));color:white;font-size:0.9375rem;font-weight:600;border-radius:var(--radius-lg);border:none;cursor:pointer;transition:transform 0.1s,box-shadow 0.2s" onmousedown="this.style.transform='scale(0.97)'" onmouseup="this.style.transform=''">🔄 Generate Password</button>
        <button id="pw-copy" style="padding:0.875rem 1.5rem;background:var(--bg-surface);color:var(--text-primary);font-size:0.9375rem;font-weight:600;border-radius:var(--radius-lg);border:1px solid var(--border-color);cursor:pointer;transition:background 0.15s" onmouseover="this.style.background='var(--bg-surface-hover)'" onmouseout="this.style.background='var(--bg-surface)'">📋 Copy</button>
      </div>

      <!-- Batch Generate -->
      <div style="margin-top:2rem">
        <h3 style="font-size:1rem;font-weight:600;margin-bottom:0.75rem;color:var(--text-primary)">Bulk Generate</h3>
        <div id="pw-batch" style="display:grid;gap:0.5rem"></div>
      </div>
    </div>`;
  page.appendChild(section);

  setTimeout(() => {
    const lengthSlider = page.querySelector('#pw-length');
    const lengthDisplay = page.querySelector('#pw-length-display');
    const pwValue = page.querySelector('#pw-value');
    const strengthBar = page.querySelector('#pw-strength-bar');
    const strengthLabel = page.querySelector('#pw-strength-label');
    const batchDiv = page.querySelector('#pw-batch');

    function getCharset() {
      let chars = '';
      if (page.querySelector('#pw-uppercase').checked) chars += CHARSETS.uppercase;
      if (page.querySelector('#pw-lowercase').checked) chars += CHARSETS.lowercase;
      if (page.querySelector('#pw-numbers').checked) chars += CHARSETS.numbers;
      if (page.querySelector('#pw-symbols').checked) chars += CHARSETS.symbols;
      return chars || CHARSETS.lowercase + CHARSETS.numbers;
    }

    function generatePassword(len) {
      const chars = getCharset();
      const array = new Uint32Array(len);
      crypto.getRandomValues(array);
      return Array.from(array, v => chars[v % chars.length]).join('');
    }

    function calcStrength(pw) {
      let score = 0;
      if (pw.length >= 8) score++;
      if (pw.length >= 12) score++;
      if (pw.length >= 20) score++;
      if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
      if (/[0-9]/.test(pw)) score++;
      if (/[^a-zA-Z0-9]/.test(pw)) score++;
      if (pw.length >= 32) score++;
      return Math.min(score, 5);
    }

    function updateStrength(pw) {
      const s = calcStrength(pw);
      const levels = [
        { label: 'Very Weak', color: '#ef4444', pct: 20 },
        { label: 'Weak', color: '#f97316', pct: 35 },
        { label: 'Fair', color: '#f59e0b', pct: 50 },
        { label: 'Strong', color: '#3b82f6', pct: 70 },
        { label: 'Very Strong', color: '#10b981', pct: 85 },
        { label: 'Excellent', color: '#059669', pct: 100 },
      ];
      const level = levels[Math.min(s, levels.length - 1)];
      strengthBar.style.width = level.pct + '%';
      strengthBar.style.background = level.color;
      strengthLabel.textContent = level.label;
      strengthLabel.style.color = level.color;
    }

    function generate() {
      const len = parseInt(lengthSlider.value);
      const pw = generatePassword(len);
      pwValue.textContent = pw;
      lengthDisplay.textContent = len;
      updateStrength(pw);
      // Batch
      batchDiv.innerHTML = Array.from({ length: 5 }, () => {
        const bpw = generatePassword(len);
        return `<div style="display:flex;align-items:center;gap:0.5rem;padding:0.5rem 0.75rem;border-radius:var(--radius-md);background:var(--bg-surface);border:1px solid var(--border-color)">
          <span class="ip-value" style="flex:1;font-family:'JetBrains Mono',monospace;font-size:0.8125rem;word-break:break-all;cursor:pointer">${bpw}</span>
        </div>`;
      }).join('');
      batchDiv.querySelectorAll('.ip-value').forEach(el => makeClickToCopy(el, el.textContent));
    }

    lengthSlider.addEventListener('input', () => { lengthDisplay.textContent = lengthSlider.value; generate(); });
    page.querySelector('#pw-generate').addEventListener('click', generate);
    page.querySelector('#pw-copy').addEventListener('click', () => {
      navigator.clipboard.writeText(pwValue.textContent).then(() => showToast('Password copied!', 'success'));
    });
    page.querySelector('#pw-display').addEventListener('click', () => {
      navigator.clipboard.writeText(pwValue.textContent).then(() => showToast('Password copied!', 'success'));
    });
    page.querySelectorAll('[id^="pw-"][type="checkbox"]').forEach(cb => cb.addEventListener('change', generate));

    generate();
  }, 100);

  return page;
}
