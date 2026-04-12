// src/pages/base64.js
import { showToast } from '../components/toast.js';

export function renderBase64() {
  const page = document.createElement('div');
  page.innerHTML = `<section class="page-hero"><div class="container">
    <h1>Base64 Encode / Decode</h1>
    <p>Encode text to Base64 or decode Base64 strings instantly. Supports UTF-8.</p>
  </div></section>`;

  const section = document.createElement('section');
  section.className = 'container page-section';
  section.innerHTML = `
    <div style="max-width:900px;margin:0 auto">
      <!-- Mode Toggle -->
      <div style="display:flex;justify-content:center;margin-bottom:1.5rem">
        <div style="display:inline-flex;border-radius:var(--radius-lg);background:var(--bg-surface);border:1px solid var(--border-color);overflow:hidden">
          <button id="b64-encode-btn" class="b64-mode active" style="padding:0.625rem 1.5rem;font-size:0.875rem;font-weight:600;border:none;cursor:pointer;transition:all 0.2s;background:var(--color-primary);color:white">Encode</button>
          <button id="b64-decode-btn" class="b64-mode" style="padding:0.625rem 1.5rem;font-size:0.875rem;font-weight:600;border:none;cursor:pointer;transition:all 0.2s;background:transparent;color:var(--text-secondary)">Decode</button>
        </div>
      </div>

      <!-- Input/Output -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;align-items:start" id="b64-grid">
        <div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem">
            <label style="font-size:0.8125rem;font-weight:600;color:var(--text-primary)" id="b64-input-label">Plain Text</label>
            <button id="b64-clear" style="font-size:0.75rem;color:var(--text-tertiary);background:none;border:none;cursor:pointer;padding:0.25rem 0.5rem">Clear</button>
          </div>
          <textarea id="b64-input" placeholder="Enter text to encode..." style="width:100%;min-height:280px;padding:1rem;border-radius:var(--radius-lg);border:2px solid var(--border-color);background:var(--bg-surface);color:var(--text-primary);font-family:'JetBrains Mono',monospace;font-size:0.875rem;resize:vertical;outline:none;transition:border-color 0.2s;box-sizing:border-box" spellcheck="false"></textarea>
          <p style="font-size:0.7rem;color:var(--text-tertiary);margin-top:0.375rem"><span id="b64-input-count">0</span> characters</p>
        </div>
        <div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem">
            <label style="font-size:0.8125rem;font-weight:600;color:var(--text-primary)" id="b64-output-label">Base64 Encoded</label>
            <button id="b64-copy" style="font-size:0.75rem;color:var(--color-primary);background:none;border:none;cursor:pointer;padding:0.25rem 0.5rem;font-weight:600">📋 Copy</button>
          </div>
          <textarea id="b64-output" readonly style="width:100%;min-height:280px;padding:1rem;border-radius:var(--radius-lg);border:2px solid var(--border-color);background:var(--bg-surface-hover);color:var(--text-primary);font-family:'JetBrains Mono',monospace;font-size:0.875rem;resize:vertical;outline:none;box-sizing:border-box" spellcheck="false"></textarea>
          <p style="font-size:0.7rem;color:var(--text-tertiary);margin-top:0.375rem"><span id="b64-output-count">0</span> characters</p>
        </div>
      </div>
    </div>`;
  page.appendChild(section);

  setTimeout(() => {
    const input = page.querySelector('#b64-input');
    const output = page.querySelector('#b64-output');
    const encodeBtn = page.querySelector('#b64-encode-btn');
    const decodeBtn = page.querySelector('#b64-decode-btn');
    const inputLabel = page.querySelector('#b64-input-label');
    const outputLabel = page.querySelector('#b64-output-label');
    const inputCount = page.querySelector('#b64-input-count');
    const outputCount = page.querySelector('#b64-output-count');
    let mode = 'encode';

    function convert() {
      try {
        if (mode === 'encode') {
          output.value = btoa(unescape(encodeURIComponent(input.value)));
        } else {
          output.value = decodeURIComponent(escape(atob(input.value)));
        }
        output.style.borderColor = 'var(--border-color)';
      } catch (e) {
        output.value = `Error: ${e.message}`;
        output.style.borderColor = 'var(--color-error)';
      }
      inputCount.textContent = input.value.length;
      outputCount.textContent = output.value.length;
    }

    input.addEventListener('input', convert);

    encodeBtn.addEventListener('click', () => {
      mode = 'encode';
      encodeBtn.style.background = 'var(--color-primary)'; encodeBtn.style.color = 'white';
      decodeBtn.style.background = 'transparent'; decodeBtn.style.color = 'var(--text-secondary)';
      inputLabel.textContent = 'Plain Text';
      outputLabel.textContent = 'Base64 Encoded';
      input.placeholder = 'Enter text to encode...';
      input.value = ''; output.value = '';
      inputCount.textContent = '0'; outputCount.textContent = '0';
    });

    decodeBtn.addEventListener('click', () => {
      mode = 'decode';
      decodeBtn.style.background = 'var(--color-primary)'; decodeBtn.style.color = 'white';
      encodeBtn.style.background = 'transparent'; encodeBtn.style.color = 'var(--text-secondary)';
      inputLabel.textContent = 'Base64 String';
      outputLabel.textContent = 'Decoded Text';
      input.placeholder = 'Enter Base64 string to decode...';
      input.value = ''; output.value = '';
      inputCount.textContent = '0'; outputCount.textContent = '0';
    });

    page.querySelector('#b64-copy').addEventListener('click', () => {
      if (output.value) { navigator.clipboard.writeText(output.value); showToast('Copied!', 'success'); }
    });
    page.querySelector('#b64-clear').addEventListener('click', () => {
      input.value = ''; output.value = '';
      inputCount.textContent = '0'; outputCount.textContent = '0';
    });

    input.focus();
  }, 100);

  return page;
}
