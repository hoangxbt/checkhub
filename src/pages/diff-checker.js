// src/pages/diff-checker.js
import * as Diff from 'diff';

export function renderDiffChecker() {
  const page = document.createElement('div');
  page.innerHTML = `<section class="page-hero"><div class="container">
    <h1>Text/Code Diff Checker</h1>
    <p>Compare two text blocks or code files to instantly highlight the changes, additions, and deletions.</p>
  </div></section>`;

  const section = document.createElement('section');
  section.className = 'container page-section';
  section.innerHTML = `
    <!-- Top Configuration -->
    <div style="background:var(--bg-surface);border:1px solid var(--border-color);border-radius:var(--radius-lg);padding:1rem;margin-bottom:1.5rem;display:flex;justify-content:space-between;align-items:center">
      <div style="display:flex;gap:1.5rem">
        <label style="display:flex;align-items:center;gap:0.5rem;cursor:pointer;color:var(--text-primary);font-weight:500;font-size:0.875rem">
          <input type="radio" name="diff-mode" value="words" checked style="accent-color:var(--color-primary)"> Compare Words
        </label>
        <label style="display:flex;align-items:center;gap:0.5rem;cursor:pointer;color:var(--text-primary);font-weight:500;font-size:0.875rem">
          <input type="radio" name="diff-mode" value="lines" style="accent-color:var(--color-primary)"> Compare Lines
        </label>
      </div>
      <div>
        <button id="diff-swap-btn" style="padding:0.5rem 1rem;background:var(--bg-surface-hover);color:var(--text-primary);font-weight:600;font-size:0.8125rem;border:1px solid var(--border-color);border-radius:var(--radius-md);cursor:pointer;transition:all 0.2s">🔄 Swap Text</button>
        <button id="diff-compare-btn" style="padding:0.5rem 1.5rem;background:linear-gradient(135deg,var(--color-primary),var(--color-accent));color:white;font-weight:600;font-size:0.8125rem;border:none;border-radius:var(--radius-md);cursor:pointer;margin-left:0.5rem">✨ Compare Now</button>
      </div>
    </div>

    <!-- Inputs -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1.5rem">
      <div style="border:1px solid var(--border-color);border-radius:var(--radius-lg);overflow:hidden;background:var(--bg-surface)">
        <div style="background:var(--color-error-light);color:var(--color-error);padding:0.5rem 1rem;font-size:0.8125rem;font-weight:700;border-bottom:1px solid var(--border-color)">📝 Original Text</div>
        <textarea id="diff-original" spellcheck="false" placeholder="Paste original text here..." style="width:100%;height:300px;padding:1rem;background:transparent;border:none;color:var(--text-primary);font-family:'JetBrains Mono',monospace;font-size:0.875rem;resize:vertical;outline:none;box-sizing:border-box"></textarea>
      </div>
      <div style="border:1px solid var(--border-color);border-radius:var(--radius-lg);overflow:hidden;background:var(--bg-surface)">
        <div style="background:var(--color-success-light);color:var(--color-success);padding:0.5rem 1rem;font-size:0.8125rem;font-weight:700;border-bottom:1px solid var(--border-color)">✨ Modified Text</div>
        <textarea id="diff-modified" spellcheck="false" placeholder="Paste new/modified text here..." style="width:100%;height:300px;padding:1rem;background:transparent;border:none;color:var(--text-primary);font-family:'JetBrains Mono',monospace;font-size:0.875rem;resize:vertical;outline:none;box-sizing:border-box"></textarea>
      </div>
    </div>

    <!-- Result -->
    <div id="diff-output-container" style="display:none;border:1px solid var(--border-color);border-radius:var(--radius-lg);overflow:hidden;background:var(--bg-surface)">
      <div style="background:var(--bg-surface-hover);padding:0.75rem 1rem;font-size:0.8125rem;font-weight:700;color:var(--text-primary);border-bottom:1px solid var(--border-color);display:flex;justify-content:space-between">
        <span>🔍 Comparison Result</span>
        <span style="font-weight:500;color:var(--text-secondary)">Legend: <span style="background:var(--color-error-light);color:var(--color-error);padding:0 4px;border-radius:2px">Removed</span> / <span style="background:var(--color-success-light);color:var(--color-success);padding:0 4px;border-radius:2px">Added</span></span>
      </div>
      <div id="diff-result" style="padding:1.5rem;font-family:'JetBrains Mono',monospace;font-size:0.875rem;line-height:1.6;white-space:pre-wrap;overflow-x:auto;box-sizing:border-box;color:var(--text-primary)"></div>
    </div>`;
  page.appendChild(section);

  setTimeout(() => {
    const btnSwap = page.querySelector('#diff-swap-btn');
    const btnCompare = page.querySelector('#diff-compare-btn');
    const txtOriginal = page.querySelector('#diff-original');
    const txtModified = page.querySelector('#diff-modified');
    const container = page.querySelector('#diff-output-container');
    const output = page.querySelector('#diff-result');
    const radios = page.querySelectorAll('input[name="diff-mode"]');

    btnSwap.addEventListener('click', () => {
      const temp = txtOriginal.value;
      txtOriginal.value = txtModified.value;
      txtModified.value = temp;
      if (container.style.display !== 'none') runDiff();
    });

    function runDiff() {
      const t1 = txtOriginal.value;
      const t2 = txtModified.value;
      
      if (!t1 && !t2) return;

      let mode = 'words';
      radios.forEach(r => { if (r.checked) mode = r.value; });

      const diffResult = mode === 'words' ? Diff.diffWords(t1, t2) : Diff.diffLines(t1, t2);
      
      const fragment = document.createDocumentFragment();
      
      diffResult.forEach(part => {
        const span = document.createElement('span');
        
        let color = '';
        let bg = '';
        let pad = mode === 'lines' ? 'display:block;min-height:1.2em;width:100%' : '';
        let fontWeight = '';
        
        if (part.added) {
          color = 'var(--color-success)';
          bg = 'var(--color-success-light)';
          fontWeight = '600';
          if (mode==='lines') pad += ';background:rgba(16,185,129,0.1);border-left:3px solid var(--color-success)';
        } else if (part.removed) {
          color = 'var(--color-error)';
          bg = 'var(--color-error-light)';
          fontWeight = '600';
          span.style.textDecoration = 'line-through';
          span.style.textDecorationColor = 'rgba(239,68,68,0.5)';
          if (mode==='lines') pad += ';background:rgba(239,68,68,0.1);border-left:3px solid var(--color-error)';
        } else {
          color = 'var(--text-primary)';
          bg = 'transparent';
        }

        span.style.cssText = `color:${color};background-color:${bg};${pad};font-weight:${fontWeight}`;
        span.appendChild(document.createTextNode(part.value));
        fragment.appendChild(span);
      });

      output.innerHTML = '';
      output.appendChild(fragment);
      container.style.display = 'block';
      container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    btnCompare.addEventListener('click', runDiff);
    
    // Auto diff on small text if configured
    let timeout;
    const autoRun = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        if(txtOriginal.value.length < 5000 && txtModified.value.length < 5000) runDiff(); 
      }, 500);
    };
    txtOriginal.addEventListener('input', autoRun);
    txtModified.addEventListener('input', autoRun);
    radios.forEach(r => r.addEventListener('change', runDiff));

  }, 100);

  return page;
}
