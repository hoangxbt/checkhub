// src/pages/url-encode.js
import { showToast } from '../components/toast.js';

export function renderUrlEncode() {
  const page = document.createElement('div');
  page.innerHTML = `<section class="page-hero"><div class="container">
    <h1>URL Encode / Decode</h1>
    <p>Encode or decode URLs and query strings. Handles special characters and Unicode.</p>
  </div></section>`;

  const section = document.createElement('section');
  section.className = 'container page-section';
  section.innerHTML = `
    <div style="max-width:900px;margin:0 auto">
      <!-- Mode Toggle -->
      <div style="display:flex;justify-content:center;margin-bottom:1.5rem">
        <div style="display:inline-flex;border-radius:var(--radius-lg);background:var(--bg-surface);border:1px solid var(--border-color);overflow:hidden">
          <button id="url-encode-btn" style="padding:0.625rem 1.5rem;font-size:0.875rem;font-weight:600;border:none;cursor:pointer;transition:all 0.2s;background:var(--color-primary);color:white">Encode</button>
          <button id="url-decode-btn" style="padding:0.625rem 1.5rem;font-size:0.875rem;font-weight:600;border:none;cursor:pointer;transition:all 0.2s;background:transparent;color:var(--text-secondary)">Decode</button>
        </div>
      </div>

      <!-- Encoding Options -->
      <div style="display:flex;justify-content:center;gap:1rem;margin-bottom:1.5rem;flex-wrap:wrap">
        <label style="display:flex;align-items:center;gap:0.375rem;font-size:0.8125rem;color:var(--text-secondary);cursor:pointer">
          <input type="radio" name="url-type" value="component" checked style="accent-color:var(--color-primary)"> encodeURIComponent
        </label>
        <label style="display:flex;align-items:center;gap:0.375rem;font-size:0.8125rem;color:var(--text-secondary);cursor:pointer">
          <input type="radio" name="url-type" value="uri" style="accent-color:var(--color-primary)"> encodeURI
        </label>
      </div>

      <!-- Input/Output -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;align-items:start">
        <div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem">
            <label style="font-size:0.8125rem;font-weight:600;color:var(--text-primary)" id="url-input-label">Plain Text / URL</label>
            <button id="url-clear" style="font-size:0.75rem;color:var(--text-tertiary);background:none;border:none;cursor:pointer;padding:0.25rem 0.5rem">Clear</button>
          </div>
          <textarea id="url-input" placeholder="Enter text or URL to encode..." style="width:100%;min-height:250px;padding:1rem;border-radius:var(--radius-lg);border:2px solid var(--border-color);background:var(--bg-surface);color:var(--text-primary);font-family:'JetBrains Mono',monospace;font-size:0.875rem;resize:vertical;outline:none;box-sizing:border-box" spellcheck="false"></textarea>
        </div>
        <div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem">
            <label style="font-size:0.8125rem;font-weight:600;color:var(--text-primary)" id="url-output-label">URL Encoded</label>
            <button id="url-copy" style="font-size:0.75rem;color:var(--color-primary);background:none;border:none;cursor:pointer;padding:0.25rem 0.5rem;font-weight:600">📋 Copy</button>
          </div>
          <textarea id="url-output" readonly style="width:100%;min-height:250px;padding:1rem;border-radius:var(--radius-lg);border:2px solid var(--border-color);background:var(--bg-surface-hover);color:var(--text-primary);font-family:'JetBrains Mono',monospace;font-size:0.875rem;resize:vertical;outline:none;box-sizing:border-box" spellcheck="false"></textarea>
        </div>
      </div>

      <!-- Common examples -->
      <div style="margin-top:2rem;padding:1.25rem;border-radius:var(--radius-lg);background:var(--bg-surface);border:1px solid var(--border-color)">
        <h3 style="font-size:0.875rem;font-weight:600;color:var(--text-primary);margin-bottom:0.75rem">Common Encodings Reference</h3>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:0.5rem;font-size:0.8125rem">
          ${[['Space', ' ', '%20'], ['&', '&', '%26'], ['=', '=', '%3D'], ['?', '?', '%3F'], ['#', '#', '%23'], ['/', '/', '%2F'], ['@', '@', '%40'], ['+', '+', '%2B']].map(([name, char, enc]) =>
            `<div style="display:flex;justify-content:space-between;padding:0.375rem 0.625rem;border-radius:var(--radius-sm);background:var(--bg-surface-hover)">
              <span style="color:var(--text-secondary)">${name}</span>
              <span style="font-family:'JetBrains Mono',monospace;color:var(--color-primary)">${enc}</span>
            </div>`).join('')}
        </div>
      </div>
    </div>`;
  page.appendChild(section);

  setTimeout(() => {
    const input = page.querySelector('#url-input');
    const output = page.querySelector('#url-output');
    const encodeBtn = page.querySelector('#url-encode-btn');
    const decodeBtn = page.querySelector('#url-decode-btn');
    const inputLabel = page.querySelector('#url-input-label');
    const outputLabel = page.querySelector('#url-output-label');
    let mode = 'encode';

    function convert() {
      const useComponent = page.querySelector('input[name="url-type"]:checked').value === 'component';
      try {
        if (mode === 'encode') {
          output.value = useComponent ? encodeURIComponent(input.value) : encodeURI(input.value);
        } else {
          output.value = useComponent ? decodeURIComponent(input.value) : decodeURI(input.value);
        }
        output.style.borderColor = 'var(--border-color)';
      } catch (e) {
        output.value = `Error: ${e.message}`;
        output.style.borderColor = 'var(--color-error)';
      }
    }

    input.addEventListener('input', convert);
    page.querySelectorAll('input[name="url-type"]').forEach(r => r.addEventListener('change', convert));

    encodeBtn.addEventListener('click', () => {
      mode = 'encode';
      encodeBtn.style.background = 'var(--color-primary)'; encodeBtn.style.color = 'white';
      decodeBtn.style.background = 'transparent'; decodeBtn.style.color = 'var(--text-secondary)';
      inputLabel.textContent = 'Plain Text / URL';
      outputLabel.textContent = 'URL Encoded';
      input.placeholder = 'Enter text or URL to encode...';
      input.value = ''; output.value = '';
    });

    decodeBtn.addEventListener('click', () => {
      mode = 'decode';
      decodeBtn.style.background = 'var(--color-primary)'; decodeBtn.style.color = 'white';
      encodeBtn.style.background = 'transparent'; encodeBtn.style.color = 'var(--text-secondary)';
      inputLabel.textContent = 'Encoded URL String';
      outputLabel.textContent = 'Decoded Text';
      input.placeholder = 'Enter URL-encoded string to decode...';
      input.value = ''; output.value = '';
    });

    page.querySelector('#url-copy').addEventListener('click', () => {
      if (output.value) { navigator.clipboard.writeText(output.value); showToast('Copied!', 'success'); }
    });
    page.querySelector('#url-clear').addEventListener('click', () => { input.value = ''; output.value = ''; });

    input.focus();
  }, 100);

  return page;
}
