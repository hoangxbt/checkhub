// src/pages/regex-tester.js
import { showToast } from '../components/toast.js';

export function renderRegexTester() {
  const page = document.createElement('div');
  page.innerHTML = `<section class="page-hero"><div class="container">
    <h1>Regex Tester</h1>
    <p>Test and debug regular expressions in real-time with match highlighting and group extraction.</p>
  </div></section>`;

  const section = document.createElement('section');
  section.className = 'container page-section';
  section.innerHTML = `
    <div style="max-width:900px;margin:0 auto">
      <!-- Regex Input -->
      <div style="margin-bottom:1rem">
        <label style="font-size:0.8125rem;font-weight:600;color:var(--text-primary);display:block;margin-bottom:0.5rem">Regular Expression</label>
        <div style="display:flex;align-items:center;gap:0;border:2px solid var(--border-color);border-radius:var(--radius-lg);overflow:hidden;background:var(--bg-surface);transition:border-color 0.2s" id="regex-wrapper">
          <span style="padding:0.75rem 0.75rem;color:var(--text-tertiary);font-family:'JetBrains Mono',monospace;font-size:1rem;user-select:none">/</span>
          <input type="text" id="regex-pattern" placeholder="your regex here" spellcheck="false" style="flex:1;padding:0.75rem 0;border:none;background:transparent;color:var(--text-primary);font-family:'JetBrains Mono',monospace;font-size:0.9375rem;outline:none">
          <span style="padding:0.75rem 0.25rem;color:var(--text-tertiary);font-family:'JetBrains Mono',monospace;font-size:1rem;user-select:none">/</span>
          <input type="text" id="regex-flags" value="gm" style="width:50px;padding:0.75rem 0.5rem;border:none;border-left:1px solid var(--border-color);background:var(--bg-surface-hover);color:var(--color-primary);font-family:'JetBrains Mono',monospace;font-size:0.9375rem;font-weight:600;outline:none;text-align:center" spellcheck="false">
        </div>
      </div>

      <!-- Flag Toggles -->
      <div style="display:flex;gap:0.5rem;margin-bottom:1rem;flex-wrap:wrap" id="flag-toggles">
        <button data-flag="g" class="flag-btn active" style="padding:0.375rem 0.75rem;font-size:0.75rem;font-weight:600;border-radius:var(--radius-md);border:1px solid var(--border-color);cursor:pointer;transition:all 0.2s">g <span style="font-weight:400;opacity:0.7">global</span></button>
        <button data-flag="m" class="flag-btn active" style="padding:0.375rem 0.75rem;font-size:0.75rem;font-weight:600;border-radius:var(--radius-md);border:1px solid var(--border-color);cursor:pointer;transition:all 0.2s">m <span style="font-weight:400;opacity:0.7">multiline</span></button>
        <button data-flag="i" class="flag-btn" style="padding:0.375rem 0.75rem;font-size:0.75rem;font-weight:600;border-radius:var(--radius-md);border:1px solid var(--border-color);cursor:pointer;transition:all 0.2s">i <span style="font-weight:400;opacity:0.7">insensitive</span></button>
        <button data-flag="s" class="flag-btn" style="padding:0.375rem 0.75rem;font-size:0.75rem;font-weight:600;border-radius:var(--radius-md);border:1px solid var(--border-color);cursor:pointer;transition:all 0.2s">s <span style="font-weight:400;opacity:0.7">dotall</span></button>
        <button data-flag="u" class="flag-btn" style="padding:0.375rem 0.75rem;font-size:0.75rem;font-weight:600;border-radius:var(--radius-md);border:1px solid var(--border-color);cursor:pointer;transition:all 0.2s">u <span style="font-weight:400;opacity:0.7">unicode</span></button>
      </div>

      <!-- Status -->
      <div id="regex-status" style="padding:0.5rem 0.75rem;border-radius:var(--radius-md);margin-bottom:0.75rem;font-size:0.8125rem;display:none"></div>

      <!-- Test String -->
      <div style="margin-bottom:1rem">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem">
          <label style="font-size:0.8125rem;font-weight:600;color:var(--text-primary)">Test String</label>
          <span id="regex-match-count" style="font-size:0.75rem;color:var(--text-tertiary)"></span>
        </div>
        <textarea id="regex-test-input" placeholder="Enter test string here..." spellcheck="false" style="width:100%;min-height:180px;padding:1rem;border-radius:var(--radius-lg);border:2px solid var(--border-color);background:var(--bg-surface);color:var(--text-primary);font-family:'JetBrains Mono',monospace;font-size:0.8125rem;resize:vertical;outline:none;line-height:1.8;box-sizing:border-box;transition:border-color 0.2s"></textarea>
      </div>

      <!-- Highlighted Result -->
      <div style="margin-bottom:1rem">
        <label style="font-size:0.8125rem;font-weight:600;color:var(--text-primary);display:block;margin-bottom:0.5rem">Match Highlighting</label>
        <pre id="regex-highlight" style="min-height:100px;padding:1rem;border-radius:var(--radius-lg);border:2px solid var(--border-color);background:var(--bg-surface-hover);color:var(--text-primary);font-family:'JetBrains Mono',monospace;font-size:0.8125rem;line-height:1.8;white-space:pre-wrap;word-break:break-word;margin:0;overflow:auto"></pre>
      </div>

      <!-- Match Details -->
      <div id="regex-matches" style="display:none">
        <label style="font-size:0.8125rem;font-weight:600;color:var(--text-primary);display:block;margin-bottom:0.5rem">Match Details</label>
        <div id="regex-match-list" style="border-radius:var(--radius-lg);border:1px solid var(--border-color);overflow:hidden"></div>
      </div>

      <!-- Common Patterns -->
      <div style="margin-top:1.5rem">
        <label style="font-size:0.8125rem;font-weight:600;color:var(--text-primary);display:block;margin-bottom:0.5rem">Common Patterns</label>
        <div style="display:flex;flex-wrap:wrap;gap:0.375rem" id="regex-presets"></div>
      </div>
    </div>`;
  page.appendChild(section);

  const presets = [
    { label: 'Email', pattern: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}', test: 'user@example.com\ninvalid@\ntest.dev@mail.co' },
    { label: 'URL', pattern: 'https?:\\/\\/[\\w\\-]+(\\.[\\w\\-]+)+[\\/\\w\\-.,@?^=%&:~+#]*', test: 'Visit https://example.com or http://test.dev/path?q=1' },
    { label: 'IPv4', pattern: '\\b\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\b', test: '192.168.1.1\n10.0.0.1\n999.999.999.999\nhello' },
    { label: 'Phone', pattern: '\\+?\\d{1,3}[-.\\s]?\\(?\\d{1,4}\\)?[-.\\s]?\\d{1,4}[-.\\s]?\\d{1,9}', test: '+1-555-123-4567\n(555) 987-6543\n+84 912 345 678' },
    { label: 'Hex Color', pattern: '#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})\\b', test: '#fff #3b82f6 #00ff00 #gg' },
    { label: 'Date (YYYY-MM-DD)', pattern: '\\d{4}-\\d{2}-\\d{2}', test: '2024-01-15\n2023-12-31\nnot-a-date' },
  ];

  const matchColors = ['rgba(59,130,246,0.25)', 'rgba(16,185,129,0.25)', 'rgba(245,158,11,0.25)', 'rgba(239,68,68,0.25)', 'rgba(168,85,247,0.25)'];

  setTimeout(() => {
    const patternInput = page.querySelector('#regex-pattern');
    const flagsInput = page.querySelector('#regex-flags');
    const testInput = page.querySelector('#regex-test-input');
    const highlight = page.querySelector('#regex-highlight');
    const status = page.querySelector('#regex-status');
    const matchCount = page.querySelector('#regex-match-count');
    const matchesDiv = page.querySelector('#regex-matches');
    const matchList = page.querySelector('#regex-match-list');
    const wrapper = page.querySelector('#regex-wrapper');
    const presetsDiv = page.querySelector('#regex-presets');

    // Render presets
    presets.forEach(p => {
      const btn = document.createElement('button');
      btn.textContent = p.label;
      btn.style.cssText = 'padding:0.375rem 0.75rem;font-size:0.75rem;font-weight:500;border-radius:var(--radius-md);border:1px solid var(--border-color);background:var(--bg-surface);color:var(--text-secondary);cursor:pointer;transition:all 0.2s';
      btn.addEventListener('mouseover', () => { btn.style.borderColor = 'var(--color-primary)'; btn.style.color = 'var(--color-primary)'; });
      btn.addEventListener('mouseout', () => { btn.style.borderColor = 'var(--border-color)'; btn.style.color = 'var(--text-secondary)'; });
      btn.addEventListener('click', () => {
        patternInput.value = p.pattern;
        testInput.value = p.test;
        runRegex();
      });
      presetsDiv.appendChild(btn);
    });

    // Flag toggles
    page.querySelectorAll('.flag-btn').forEach(btn => {
      updateFlagBtnStyle(btn);
      btn.addEventListener('click', () => {
        btn.classList.toggle('active');
        updateFlagBtnStyle(btn);
        const flags = Array.from(page.querySelectorAll('.flag-btn.active')).map(b => b.dataset.flag).join('');
        flagsInput.value = flags;
        runRegex();
      });
    });

    function updateFlagBtnStyle(btn) {
      if (btn.classList.contains('active')) {
        btn.style.background = 'var(--color-primary-light)';
        btn.style.borderColor = 'var(--color-primary)';
        btn.style.color = 'var(--color-primary)';
      } else {
        btn.style.background = 'var(--bg-surface)';
        btn.style.borderColor = 'var(--border-color)';
        btn.style.color = 'var(--text-tertiary)';
      }
    }

    function escapeHtml(s) {
      return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    function runRegex() {
      const pattern = patternInput.value;
      const flags = flagsInput.value;
      const text = testInput.value;

      if (!pattern) {
        highlight.innerHTML = escapeHtml(text) || '<span style="color:var(--text-tertiary)">Highlighted matches will appear here...</span>';
        status.style.display = 'none';
        matchCount.textContent = '';
        matchesDiv.style.display = 'none';
        wrapper.style.borderColor = 'var(--border-color)';
        return;
      }

      let regex;
      try {
        regex = new RegExp(pattern, flags);
        wrapper.style.borderColor = 'var(--color-success)';
        status.style.display = 'block';
        status.style.background = 'rgba(16,185,129,0.1)';
        status.style.color = 'var(--color-success)';
        status.textContent = '✅ Valid regex';
      } catch (e) {
        wrapper.style.borderColor = 'var(--color-error)';
        status.style.display = 'block';
        status.style.background = 'rgba(239,68,68,0.1)';
        status.style.color = 'var(--color-error)';
        status.textContent = '❌ ' + e.message;
        highlight.innerHTML = escapeHtml(text);
        matchCount.textContent = '';
        matchesDiv.style.display = 'none';
        return;
      }

      if (!text) {
        highlight.innerHTML = '<span style="color:var(--text-tertiary)">Enter test string above...</span>';
        matchCount.textContent = '';
        matchesDiv.style.display = 'none';
        return;
      }

      // Find all matches
      const matches = [];
      if (flags.includes('g')) {
        let m;
        while ((m = regex.exec(text)) !== null) {
          matches.push({ index: m.index, match: m[0], groups: m.slice(1), length: m[0].length });
          if (m[0].length === 0) regex.lastIndex++;
        }
      } else {
        const m = regex.exec(text);
        if (m) matches.push({ index: m.index, match: m[0], groups: m.slice(1), length: m[0].length });
      }

      matchCount.textContent = `${matches.length} match${matches.length !== 1 ? 'es' : ''}`;

      // Build highlighted text
      let html = '';
      let lastIdx = 0;
      matches.forEach((m, i) => {
        html += escapeHtml(text.slice(lastIdx, m.index));
        const color = matchColors[i % matchColors.length];
        html += `<mark style="background:${color};border-radius:2px;padding:0 1px;border-bottom:2px solid ${color.replace('0.25', '0.8')}">${escapeHtml(m.match)}</mark>`;
        lastIdx = m.index + m.length;
      });
      html += escapeHtml(text.slice(lastIdx));
      highlight.innerHTML = html || escapeHtml(text);

      // Match details
      if (matches.length > 0) {
        matchesDiv.style.display = 'block';
        let tableHtml = '<table style="width:100%;border-collapse:collapse">';
        tableHtml += '<tr style="background:var(--bg-surface-hover)"><th style="text-align:left;padding:0.625rem 1rem;font-size:0.75rem;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:var(--text-tertiary);border-bottom:1px solid var(--border-color)">#</th><th style="text-align:left;padding:0.625rem 1rem;font-size:0.75rem;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:var(--text-tertiary);border-bottom:1px solid var(--border-color)">Match</th><th style="text-align:left;padding:0.625rem 1rem;font-size:0.75rem;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:var(--text-tertiary);border-bottom:1px solid var(--border-color)">Index</th><th style="text-align:left;padding:0.625rem 1rem;font-size:0.75rem;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:var(--text-tertiary);border-bottom:1px solid var(--border-color)">Groups</th></tr>';
        matches.slice(0, 50).forEach((m, i) => {
          tableHtml += `<tr style="border-bottom:1px solid var(--border-color)"><td style="padding:0.5rem 1rem;font-size:0.8125rem;color:var(--text-tertiary)">${i + 1}</td><td style="padding:0.5rem 1rem;font-family:'JetBrains Mono',monospace;font-size:0.8125rem;color:var(--color-primary)">${escapeHtml(m.match)}</td><td style="padding:0.5rem 1rem;font-size:0.8125rem;color:var(--text-secondary)">${m.index}</td><td style="padding:0.5rem 1rem;font-family:'JetBrains Mono',monospace;font-size:0.75rem;color:var(--text-secondary)">${m.groups.length ? m.groups.map(g => escapeHtml(g || 'undefined')).join(', ') : '—'}</td></tr>`;
        });
        tableHtml += '</table>';
        matchList.innerHTML = tableHtml;
      } else {
        matchesDiv.style.display = 'none';
      }
    }

    patternInput.addEventListener('input', runRegex);
    flagsInput.addEventListener('input', () => {
      // Sync flag toggles
      page.querySelectorAll('.flag-btn').forEach(btn => {
        const isActive = flagsInput.value.includes(btn.dataset.flag);
        btn.classList.toggle('active', isActive);
        updateFlagBtnStyle(btn);
      });
      runRegex();
    });
    testInput.addEventListener('input', runRegex);

    patternInput.focus();
  }, 100);

  return page;
}
