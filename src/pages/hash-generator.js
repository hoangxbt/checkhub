// src/pages/hash-generator.js
import { showToast } from '../components/toast.js';

export function renderHashGenerator() {
  const page = document.createElement('div');
  page.innerHTML = `<section class="page-hero"><div class="container">
    <h1>Hash Generator</h1>
    <p>Generate MD5, SHA-1, SHA-256, SHA-512 hashes from text. Compare hashes for integrity verification.</p>
  </div></section>`;

  const section = document.createElement('section');
  section.className = 'container page-section';
  section.innerHTML = `
    <div style="max-width:900px;margin:0 auto">
      <!-- Input -->
      <div style="margin-bottom:1rem">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem">
          <label style="font-size:0.8125rem;font-weight:600;color:var(--text-primary)">Input Text</label>
          <div style="display:flex;gap:0.375rem;align-items:center">
            <label style="font-size:0.75rem;color:var(--text-secondary);display:flex;align-items:center;gap:0.25rem;cursor:pointer">
              <input type="checkbox" id="hash-live" checked style="cursor:pointer"> Live
            </label>
            <button id="hash-clear" style="padding:0.375rem 0.75rem;font-size:0.75rem;font-weight:500;border-radius:var(--radius-md);border:1px solid var(--border-color);background:var(--bg-surface);color:var(--text-secondary);cursor:pointer">🗑️ Clear</button>
          </div>
        </div>
        <textarea id="hash-input" placeholder="Enter text to hash..." spellcheck="false" style="width:100%;min-height:140px;padding:1rem;border-radius:var(--radius-lg);border:2px solid var(--border-color);background:var(--bg-surface);color:var(--text-primary);font-family:'JetBrains Mono',monospace;font-size:0.875rem;resize:vertical;outline:none;line-height:1.6;box-sizing:border-box;transition:border-color 0.2s"></textarea>
        <div style="display:flex;justify-content:space-between;margin-top:0.375rem">
          <span id="hash-char-count" style="font-size:0.75rem;color:var(--text-tertiary)">0 characters · 0 bytes</span>
          <select id="hash-encoding" style="padding:0.25rem 0.5rem;border-radius:var(--radius-sm);border:1px solid var(--border-color);background:var(--bg-surface);color:var(--text-primary);font-size:0.75rem">
            <option value="utf-8">UTF-8</option>
            <option value="ascii">ASCII</option>
          </select>
        </div>
      </div>

      <!-- Hash button -->
      <button id="hash-generate" style="width:100%;padding:0.75rem;background:linear-gradient(135deg,var(--color-primary),var(--color-accent));color:white;font-size:0.9375rem;font-weight:600;border-radius:var(--radius-md);border:none;cursor:pointer;transition:all 0.2s;margin-bottom:1.25rem">⚡ Generate Hashes</button>

      <!-- Results -->
      <div id="hash-results"></div>

      <!-- Compare Section -->
      <div style="margin-top:1.5rem;border-radius:var(--radius-lg);border:1px solid var(--border-color);overflow:hidden">
        <div style="padding:0.75rem 1rem;background:var(--bg-surface-hover);border-bottom:1px solid var(--border-color)">
          <span style="font-size:0.8125rem;font-weight:600;color:var(--text-primary)">🔍 Compare Hashes</span>
        </div>
        <div style="padding:1rem;background:var(--bg-surface)">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem">
            <input type="text" id="hash-compare-a" placeholder="Hash A" spellcheck="false" style="padding:0.625rem 0.75rem;border-radius:var(--radius-md);border:1px solid var(--border-color);background:var(--bg-surface-hover);color:var(--text-primary);font-family:'JetBrains Mono',monospace;font-size:0.75rem;outline:none;box-sizing:border-box">
            <input type="text" id="hash-compare-b" placeholder="Hash B" spellcheck="false" style="padding:0.625rem 0.75rem;border-radius:var(--radius-md);border:1px solid var(--border-color);background:var(--bg-surface-hover);color:var(--text-primary);font-family:'JetBrains Mono',monospace;font-size:0.75rem;outline:none;box-sizing:border-box">
          </div>
          <div id="hash-compare-result" style="margin-top:0.75rem;font-size:0.8125rem;text-align:center;display:none"></div>
        </div>
      </div>
    </div>`;
  page.appendChild(section);

  const algorithms = [
    { name: 'MD5', algo: null, color: '#e06c75' },
    { name: 'SHA-1', algo: 'SHA-1', color: '#d19a66' },
    { name: 'SHA-256', algo: 'SHA-256', color: '#98c379' },
    { name: 'SHA-384', algo: 'SHA-384', color: '#61afef' },
    { name: 'SHA-512', algo: 'SHA-512', color: '#c678dd' },
  ];

  setTimeout(() => {
    const input = page.querySelector('#hash-input');
    const results = page.querySelector('#hash-results');
    const charCount = page.querySelector('#hash-char-count');
    const liveCheck = page.querySelector('#hash-live');
    const compareA = page.querySelector('#hash-compare-a');
    const compareB = page.querySelector('#hash-compare-b');
    const compareResult = page.querySelector('#hash-compare-result');

    // MD5 implementation (simplified)
    function md5(string) {
      function md5cycle(x, k) {
        var a = x[0], b = x[1], c = x[2], d = x[3];
        a = ff(a, b, c, d, k[0], 7, -680876936); d = ff(d, a, b, c, k[1], 12, -389564586);
        c = ff(c, d, a, b, k[2], 17, 606105819); b = ff(b, c, d, a, k[3], 22, -1044525330);
        a = ff(a, b, c, d, k[4], 7, -176418897); d = ff(d, a, b, c, k[5], 12, 1200080426);
        c = ff(c, d, a, b, k[6], 17, -1473231341); b = ff(b, c, d, a, k[7], 22, -45705983);
        a = ff(a, b, c, d, k[8], 7, 1770035416); d = ff(d, a, b, c, k[9], 12, -1958414417);
        c = ff(c, d, a, b, k[10], 17, -42063); b = ff(b, c, d, a, k[11], 22, -1990404162);
        a = ff(a, b, c, d, k[12], 7, 1804603682); d = ff(d, a, b, c, k[13], 12, -40341101);
        c = ff(c, d, a, b, k[14], 17, -1502002290); b = ff(b, c, d, a, k[15], 22, 1236535329);
        a = gg(a, b, c, d, k[1], 5, -165796510); d = gg(d, a, b, c, k[6], 9, -1069501632);
        c = gg(c, d, a, b, k[11], 14, 643717713); b = gg(b, c, d, a, k[0], 20, -373897302);
        a = gg(a, b, c, d, k[5], 5, -701558691); d = gg(d, a, b, c, k[10], 9, 38016083);
        c = gg(c, d, a, b, k[15], 14, -660478335); b = gg(b, c, d, a, k[4], 20, -405537848);
        a = gg(a, b, c, d, k[9], 5, 568446438); d = gg(d, a, b, c, k[14], 9, -1019803690);
        c = gg(c, d, a, b, k[3], 14, -187363961); b = gg(b, c, d, a, k[8], 20, 1163531501);
        a = gg(a, b, c, d, k[13], 5, -1444681467); d = gg(d, a, b, c, k[2], 9, -51403784);
        c = gg(c, d, a, b, k[7], 14, 1735328473); b = gg(b, c, d, a, k[12], 20, -1926607734);
        a = hh(a, b, c, d, k[5], 4, -378558); d = hh(d, a, b, c, k[8], 11, -2022574463);
        c = hh(c, d, a, b, k[11], 16, 1839030562); b = hh(b, c, d, a, k[14], 23, -35309556);
        a = hh(a, b, c, d, k[1], 4, -1530992060); d = hh(d, a, b, c, k[4], 11, 1272893353);
        c = hh(c, d, a, b, k[7], 16, -155497632); b = hh(b, c, d, a, k[10], 23, -1094730640);
        a = hh(a, b, c, d, k[13], 4, 681279174); d = hh(d, a, b, c, k[0], 11, -358537222);
        c = hh(c, d, a, b, k[3], 16, -722521979); b = hh(b, c, d, a, k[6], 23, 76029189);
        a = hh(a, b, c, d, k[9], 4, -640364487); d = hh(d, a, b, c, k[12], 11, -421815835);
        c = hh(c, d, a, b, k[15], 16, 530742520); b = hh(b, c, d, a, k[2], 23, -995338651);
        a = ii(a, b, c, d, k[0], 6, -198630844); d = ii(d, a, b, c, k[7], 10, 1126891415);
        c = ii(c, d, a, b, k[14], 15, -1416354905); b = ii(b, c, d, a, k[5], 21, -57434055);
        a = ii(a, b, c, d, k[12], 6, 1700485571); d = ii(d, a, b, c, k[3], 10, -1894986606);
        c = ii(c, d, a, b, k[10], 15, -1051523); b = ii(b, c, d, a, k[1], 21, -2054922799);
        a = ii(a, b, c, d, k[8], 6, 1873313359); d = ii(d, a, b, c, k[15], 10, -30611744);
        c = ii(c, d, a, b, k[6], 15, -1560198380); b = ii(b, c, d, a, k[13], 21, 1309151649);
        a = ii(a, b, c, d, k[4], 6, -145523070); d = ii(d, a, b, c, k[11], 10, -1120210379);
        c = ii(c, d, a, b, k[2], 15, 718787259); b = ii(b, c, d, a, k[9], 21, -343485551);
        x[0] = add32(a, x[0]); x[1] = add32(b, x[1]); x[2] = add32(c, x[2]); x[3] = add32(d, x[3]);
      }
      function cmn(q, a, b, x, s, t) { a = add32(add32(a, q), add32(x, t)); return add32((a << s) | (a >>> (32 - s)), b); }
      function ff(a, b, c, d, x, s, t) { return cmn((b & c) | ((~b) & d), a, b, x, s, t); }
      function gg(a, b, c, d, x, s, t) { return cmn((b & d) | (c & (~d)), a, b, x, s, t); }
      function hh(a, b, c, d, x, s, t) { return cmn(b ^ c ^ d, a, b, x, s, t); }
      function ii(a, b, c, d, x, s, t) { return cmn(c ^ (b | (~d)), a, b, x, s, t); }
      function md51(s) {
        var n = s.length, state = [1732584193, -271733879, -1732584194, 271733878], i;
        for (i = 64; i <= n; i += 64) md5cycle(state, md5blk(s.substring(i - 64, i)));
        s = s.substring(i - 64);
        var tail = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
        for (i = 0; i < s.length; i++) tail[i >> 2] |= s.charCodeAt(i) << ((i % 4) << 3);
        tail[i >> 2] |= 0x80 << ((i % 4) << 3);
        if (i > 55) { md5cycle(state, tail); for (i = 0; i < 16; i++) tail[i] = 0; }
        tail[14] = n * 8;
        md5cycle(state, tail);
        return state;
      }
      function md5blk(s) {
        var md5blks = [], i;
        for (i = 0; i < 64; i += 4) md5blks[i >> 2] = s.charCodeAt(i) + (s.charCodeAt(i + 1) << 8) + (s.charCodeAt(i + 2) << 16) + (s.charCodeAt(i + 3) << 24);
        return md5blks;
      }
      var hex_chr = '0123456789abcdef'.split('');
      function rhex(n) {
        var s = '', j = 0;
        for (; j < 4; j++) s += hex_chr[(n >> (j * 8 + 4)) & 0x0F] + hex_chr[(n >> (j * 8)) & 0x0F];
        return s;
      }
      function hex(x) { for (var i = 0; i < x.length; i++) x[i] = rhex(x[i]); return x.join(''); }
      function add32(a, b) { return (a + b) & 0xFFFFFFFF; }
      return hex(md51(string));
    }

    async function generateHash(algo, text) {
      const encoder = new TextEncoder();
      const data = encoder.encode(text);
      const hashBuffer = await crypto.subtle.digest(algo, data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    async function generateAll() {
      const text = input.value;
      if (!text) { results.innerHTML = ''; return; }

      const byteLength = new TextEncoder().encode(text).length;
      charCount.textContent = `${text.length} characters · ${byteLength} bytes`;

      let html = '';
      // MD5 first (sync)
      const md5Hash = md5(text);
      html += buildHashRow('MD5', md5Hash, algorithms[0].color, 32);

      // SHA family (async)
      for (let i = 1; i < algorithms.length; i++) {
        const a = algorithms[i];
        try {
          const hash = await generateHash(a.algo, text);
          html += buildHashRow(a.name, hash, a.color, hash.length);
        } catch { /* skip if not supported */ }
      }
      results.innerHTML = html;

      // Attach copy handlers
      results.querySelectorAll('.hash-copy-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          navigator.clipboard.writeText(btn.dataset.hash);
          showToast('Hash copied!', 'success');
        });
      });
    }

    function buildHashRow(name, hash, color, len) {
      return `<div style="display:flex;align-items:center;gap:0.75rem;padding:0.875rem 1rem;border-radius:var(--radius-lg);border:1px solid var(--border-color);background:var(--bg-surface);margin-bottom:0.5rem;transition:all 0.2s">
        <div style="min-width:70px">
          <span style="font-size:0.75rem;font-weight:700;color:${color};background:${color}15;padding:0.125rem 0.5rem;border-radius:var(--radius-full)">${name}</span>
        </div>
        <code style="flex:1;font-family:'JetBrains Mono',monospace;font-size:0.75rem;color:var(--text-primary);word-break:break-all;line-height:1.5">${hash}</code>
        <span style="font-size:0.6875rem;color:var(--text-tertiary);min-width:35px;text-align:right">${len}ch</span>
        <button class="hash-copy-btn" data-hash="${hash}" style="padding:0.375rem 0.625rem;font-size:0.75rem;border-radius:var(--radius-md);border:1px solid var(--border-color);background:var(--bg-surface-hover);color:var(--text-secondary);cursor:pointer;transition:all 0.2s;white-space:nowrap">📋 Copy</button>
      </div>`;
    }

    input.addEventListener('input', () => {
      const byteLength = new TextEncoder().encode(input.value).length;
      charCount.textContent = `${input.value.length} characters · ${byteLength} bytes`;
      if (liveCheck.checked) generateAll();
    });

    page.querySelector('#hash-generate').addEventListener('click', generateAll);
    page.querySelector('#hash-clear').addEventListener('click', () => {
      input.value = '';
      results.innerHTML = '';
      charCount.textContent = '0 characters · 0 bytes';
    });

    // Compare
    function compareHashes() {
      const a = compareA.value.trim().toLowerCase();
      const b = compareB.value.trim().toLowerCase();
      if (!a || !b) { compareResult.style.display = 'none'; return; }
      compareResult.style.display = 'block';
      if (a === b) {
        compareResult.innerHTML = '<span style="color:var(--color-success);font-weight:600">✅ Hashes match!</span>';
      } else {
        compareResult.innerHTML = '<span style="color:var(--color-error);font-weight:600">❌ Hashes do NOT match</span>';
      }
    }
    compareA.addEventListener('input', compareHashes);
    compareB.addEventListener('input', compareHashes);

    input.focus();
  }, 100);

  return page;
}
