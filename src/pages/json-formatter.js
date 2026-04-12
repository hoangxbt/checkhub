// src/pages/json-formatter.js
import { showToast } from '../components/toast.js';

export function renderJsonFormatter() {
  const page = document.createElement('div');
  page.innerHTML = `<section class="page-hero"><div class="container">
    <h1>JSON Formatter & Validator</h1>
    <p>Format, validate, and minify JSON data. Syntax highlighting with error detection.</p>
  </div></section>`;

  const section = document.createElement('section');
  section.className = 'container page-section';
  section.innerHTML = `
    <div style="max-width:1100px;margin:0 auto">
      <!-- Actions Bar -->
      <div style="display:flex;gap:0.5rem;margin-bottom:1rem;flex-wrap:wrap;align-items:center">
        <button id="json-format" style="padding:0.5rem 1rem;background:linear-gradient(135deg,var(--color-primary),var(--color-accent));color:white;font-size:0.8125rem;font-weight:600;border-radius:var(--radius-md);border:none;cursor:pointer">✨ Format</button>
        <button id="json-minify" style="padding:0.5rem 1rem;background:var(--bg-surface);color:var(--text-primary);font-size:0.8125rem;font-weight:600;border-radius:var(--radius-md);border:1px solid var(--border-color);cursor:pointer">📦 Minify</button>
        <button id="json-copy" style="padding:0.5rem 1rem;background:var(--bg-surface);color:var(--text-primary);font-size:0.8125rem;font-weight:600;border-radius:var(--radius-md);border:1px solid var(--border-color);cursor:pointer">📋 Copy</button>
        <button id="json-clear" style="padding:0.5rem 1rem;background:var(--bg-surface);color:var(--text-primary);font-size:0.8125rem;font-weight:600;border-radius:var(--radius-md);border:1px solid var(--border-color);cursor:pointer">🗑️ Clear</button>
        <button id="json-sample" style="padding:0.5rem 1rem;background:var(--bg-surface);color:var(--text-primary);font-size:0.8125rem;font-weight:600;border-radius:var(--radius-md);border:1px solid var(--border-color);cursor:pointer">📄 Sample</button>
        <div style="flex:1"></div>
        <label style="display:flex;align-items:center;gap:0.375rem;font-size:0.8125rem;color:var(--text-secondary)">
          Indent:
          <select id="json-indent" style="padding:0.25rem 0.5rem;border-radius:var(--radius-sm);border:1px solid var(--border-color);background:var(--bg-surface);color:var(--text-primary);font-size:0.8125rem">
            <option value="2" selected>2 spaces</option>
            <option value="4">4 spaces</option>
            <option value="tab">Tab</option>
          </select>
        </label>
      </div>

      <!-- Status Bar -->
      <div id="json-status" style="padding:0.5rem 0.75rem;border-radius:var(--radius-md);margin-bottom:0.75rem;font-size:0.8125rem;display:none"></div>

      <!-- Editor -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;align-items:start" id="json-grid">
        <div>
          <label style="font-size:0.8125rem;font-weight:600;color:var(--text-primary);display:block;margin-bottom:0.5rem">Input JSON</label>
          <textarea id="json-input" placeholder='{"key": "value"}' style="width:100%;min-height:450px;padding:1rem;border-radius:var(--radius-lg);border:2px solid var(--border-color);background:var(--bg-surface);color:var(--text-primary);font-family:'JetBrains Mono',monospace;font-size:0.8125rem;resize:vertical;outline:none;tab-size:2;transition:border-color 0.2s;box-sizing:border-box;line-height:1.6" spellcheck="false"></textarea>
        </div>
        <div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem">
            <label style="font-size:0.8125rem;font-weight:600;color:var(--text-primary)">Formatted Output</label>
            <span id="json-stats" style="font-size:0.7rem;color:var(--text-tertiary)"></span>
          </div>
          <pre id="json-output" style="width:100%;min-height:450px;padding:1rem;border-radius:var(--radius-lg);border:2px solid var(--border-color);background:var(--bg-surface-hover);color:var(--text-primary);font-family:'JetBrains Mono',monospace;font-size:0.8125rem;overflow:auto;white-space:pre-wrap;word-break:break-word;margin:0;box-sizing:border-box;line-height:1.6"></pre>
        </div>
      </div>
    </div>`;
  page.appendChild(section);

  setTimeout(() => {
    const input = page.querySelector('#json-input');
    const output = page.querySelector('#json-output');
    const status = page.querySelector('#json-status');
    const stats = page.querySelector('#json-stats');

    function getIndent() {
      const v = page.querySelector('#json-indent').value;
      return v === 'tab' ? '\t' : parseInt(v);
    }

    function syntaxHL(json) {
      return json.replace(/("(\\u[\da-fA-F]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(\.\d*)?([eE][+-]?\d+)?)/g, (match) => {
        let cls = 'color:#e06c75'; // number
        if (/^"/.test(match)) {
          cls = match.endsWith(':') ? 'color:var(--color-primary);font-weight:600' : 'color:#98c379'; // key vs string
        } else if (/true|false/.test(match)) {
          cls = 'color:#d19a66'; // boolean
        } else if (/null/.test(match)) {
          cls = 'color:#e5c07b'; // null
        }
        return `<span style="${cls}">${match}</span>`;
      });
    }

    function countJSON(obj) {
      if (obj === null || typeof obj !== 'object') return { keys: 0, values: 1, depth: 0 };
      let keys = 0, values = 0, maxDepth = 0;
      const stack = [{ obj, depth: 1 }];
      while (stack.length) {
        const { obj: cur, depth } = stack.pop();
        maxDepth = Math.max(maxDepth, depth);
        if (Array.isArray(cur)) {
          values += cur.length;
          cur.forEach(item => { if (item && typeof item === 'object') stack.push({ obj: item, depth: depth + 1 }); });
        } else {
          const entries = Object.entries(cur);
          keys += entries.length;
          entries.forEach(([, v]) => { if (v && typeof v === 'object') stack.push({ obj: v, depth: depth + 1 }); else values++; });
        }
      }
      return { keys, values, depth: maxDepth };
    }

    function format() {
      const raw = input.value.trim();
      if (!raw) { output.innerHTML = ''; status.style.display = 'none'; stats.textContent = ''; return; }
      try {
        const parsed = JSON.parse(raw);
        const formatted = JSON.stringify(parsed, null, getIndent());
        output.innerHTML = syntaxHL(formatted);
        input.style.borderColor = 'var(--color-success)';
        status.style.display = 'block';
        status.style.background = 'var(--color-success-light)';
        status.style.color = 'var(--color-success)';
        status.innerHTML = '✅ Valid JSON';
        const info = countJSON(parsed);
        stats.textContent = `${info.keys} keys · ${info.values} values · depth ${info.depth} · ${formatted.length} chars`;
      } catch (e) {
        output.textContent = raw;
        input.style.borderColor = 'var(--color-error)';
        status.style.display = 'block';
        status.style.background = 'var(--color-error-light)';
        status.style.color = 'var(--color-error)';
        status.innerHTML = `❌ Invalid JSON: ${e.message}`;
        stats.textContent = '';
      }
    }

    function minify() {
      try {
        const parsed = JSON.parse(input.value);
        const minified = JSON.stringify(parsed);
        input.value = minified;
        format();
        showToast(`Minified: ${minified.length} chars`, 'success');
      } catch (e) {
        showToast('Cannot minify: Invalid JSON', 'error');
      }
    }

    input.addEventListener('input', format);
    // Allow Tab in textarea
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        const start = input.selectionStart;
        const end = input.selectionEnd;
        input.value = input.value.substring(0, start) + '  ' + input.value.substring(end);
        input.selectionStart = input.selectionEnd = start + 2;
        format();
      }
    });

    page.querySelector('#json-format').addEventListener('click', () => {
      try {
        const parsed = JSON.parse(input.value);
        input.value = JSON.stringify(parsed, null, getIndent());
        format();
      } catch { format(); }
    });
    page.querySelector('#json-minify').addEventListener('click', minify);
    page.querySelector('#json-copy').addEventListener('click', () => {
      const text = output.textContent;
      if (text) { navigator.clipboard.writeText(text); showToast('Copied!', 'success'); }
    });
    page.querySelector('#json-clear').addEventListener('click', () => {
      input.value = ''; output.innerHTML = ''; status.style.display = 'none'; stats.textContent = '';
      input.style.borderColor = 'var(--border-color)';
    });
    page.querySelector('#json-sample').addEventListener('click', () => {
      input.value = JSON.stringify({
        name: "CheckHub",
        version: "1.0.0",
        description: "Free DNS Checker & Network Tools",
        tools: ["DNS Propagation", "WHOIS Lookup", "SSL Checker", "Domain Health"],
        features: { darkMode: true, commandPalette: true, noAds: true, openSource: false },
        stats: { totalTools: 24, apiKeys: 0, frameworks: 0 },
        author: { name: "CheckHub Team", url: "https://checkhub.org" }
      }, null, 2);
      format();
    });
    page.querySelector('#json-indent').addEventListener('change', format);

    input.focus();
  }, 100);

  return page;
}
