// src/pages/cron-parser.js
import parser from 'cron-parser';
import cronstrue from 'cronstrue';

export function renderCronParser() {
  const page = document.createElement('div');
  page.innerHTML = `<section class="page-hero"><div class="container">
    <h1>Cron Expression Parser</h1>
    <p>Understand complex cron schedules instantly. Translates cron strings into human-readable text and calculates the next execution dates.</p>
  </div></section>`;

  const section = document.createElement('section');
  section.className = 'container page-section';
  section.innerHTML = `
    <div style="max-width:800px;margin:0 auto">
      <!-- Input Area -->
      <div style="background:var(--bg-surface);border:1px solid var(--border-color);border-radius:var(--radius-lg);padding:1.5rem;text-align:center;box-shadow:var(--shadow-sm)">
        <h2 style="font-size:1rem;font-weight:600;color:var(--text-secondary);margin-bottom:1rem;text-transform:uppercase;letter-spacing:0.05em">Enter Cron Expression</h2>
        <input type="text" id="cron-input" value="0 0 * * *" spellcheck="false" style="width:100%;max-width:500px;padding:1rem 1.5rem;border-radius:var(--radius-md);border:2px solid var(--border-color);background:var(--bg-surface-hover);color:var(--color-primary);font-family:'JetBrains Mono',monospace;font-size:2rem;font-weight:700;text-align:center;outline:none;transition:border-color 0.2s">
        
        <div style="display:flex;justify-content:center;gap:0.5rem;margin-top:1.5rem;flex-wrap:wrap">
          <button class="cron-preset" data-val="* * * * *" style="padding:0.5rem 1rem;background:var(--bg-surface-hover);border:1px solid var(--border-color);border-radius:var(--radius-full);font-size:0.8125rem;color:var(--text-primary);cursor:pointer;transition:all 0.2s">Every minute</button>
          <button class="cron-preset" data-val="0 * * * *" style="padding:0.5rem 1rem;background:var(--bg-surface-hover);border:1px solid var(--border-color);border-radius:var(--radius-full);font-size:0.8125rem;color:var(--text-primary);cursor:pointer;transition:all 0.2s">Every hour</button>
          <button class="cron-preset" data-val="0 0 * * *" style="padding:0.5rem 1rem;background:var(--bg-surface-hover);border:1px solid var(--border-color);border-radius:var(--radius-full);font-size:0.8125rem;color:var(--text-primary);cursor:pointer;transition:all 0.2s">Every day</button>
          <button class="cron-preset" data-val="0 0 * * 0" style="padding:0.5rem 1rem;background:var(--bg-surface-hover);border:1px solid var(--border-color);border-radius:var(--radius-full);font-size:0.8125rem;color:var(--text-primary);cursor:pointer;transition:all 0.2s">Every Sunday</button>
          <button class="cron-preset" data-val="0 0 1 * *" style="padding:0.5rem 1rem;background:var(--bg-surface-hover);border:1px solid var(--border-color);border-radius:var(--radius-full);font-size:0.8125rem;color:var(--text-primary);cursor:pointer;transition:all 0.2s">1st of month</button>
        </div>
      </div>

      <!-- Arrow -->
      <div style="text-align:center;font-size:1.5rem;color:var(--text-tertiary);margin:1rem 0">⬇</div>

      <!-- Results Area -->
      <div id="cron-results" style="background:var(--bg-surface);border:1px solid var(--border-color);border-radius:var(--radius-lg);padding:2rem;text-align:center;box-shadow:var(--shadow-md)">
        <h2 style="font-size:1rem;font-weight:600;color:var(--text-secondary);margin-bottom:0.5rem;text-transform:uppercase;letter-spacing:0.05em">Meaning</h2>
        <div id="cron-desc" style="font-size:2rem;font-weight:700;color:var(--color-success);line-height:1.2;margin-bottom:2rem;word-break:keep-all"></div>
        
        <div style="border-top:1px dashed var(--border-color);padding-top:1.5rem;text-align:left">
          <h3 style="font-size:0.875rem;font-weight:600;color:var(--text-secondary);margin-bottom:1rem;text-transform:uppercase;letter-spacing:0.05em">Next 5 Executions</h3>
          <div id="cron-next-list" style="display:flex;flex-direction:column;gap:0.75rem"></div>
        </div>
      </div>

    </div>`;
  page.appendChild(section);

  setTimeout(() => {
    const input = page.querySelector('#cron-input');
    const desc = page.querySelector('#cron-desc');
    const nextList = page.querySelector('#cron-next-list');

    // Preset buttons mapping
    page.querySelectorAll('.cron-preset').forEach(btn => {
      btn.addEventListener('click', () => {
        input.value = btn.getAttribute('data-val');
        updateCron();
      });
      btn.addEventListener('mouseover', () => btn.style.borderColor = 'var(--color-primary)');
      btn.addEventListener('mouseout', () => btn.style.borderColor = 'var(--border-color)');
    });

    function updateCron() {
      const val = input.value.trim();
      if (!val) {
        input.style.borderColor = 'var(--color-error)';
        desc.textContent = 'Please enter a cron expression';
        desc.style.color = 'var(--color-error)';
        nextList.innerHTML = '';
        return;
      }

      try {
        // Generate Description
        const humanDesc = cronstrue.toString(val, { use24HourTimeFormat: true });
        desc.textContent = "“" + humanDesc + "”";
        desc.style.color = 'var(--color-success)';
        input.style.borderColor = 'var(--border-color)';

        // Calculate next 5 times
        const opts = { currentDate: new Date() };
        const interval = parser.parseExpression(val, opts);
        
        let html = '';
        for (let i = 0; i < 5; i++) {
          const nextDate = interval.next().toDate();
          const dateStr = nextDate.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
          const timeStr = nextDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          
          html += `
            <div style="display:flex;align-items:center;background:var(--bg-surface-hover);padding:0.75rem 1.25rem;border-radius:var(--radius-md);border:1px solid var(--border-color)">
              <div style="width:2rem;height:2rem;border-radius:50%;background:var(--color-primary-light);color:var(--color-primary);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.875rem;margin-right:1rem">${i+1}</div>
              <div style="flex:1;font-weight:600;color:var(--text-primary)">${dateStr}</div>
              <div style="font-family:'JetBrains Mono',monospace;color:var(--color-accent);font-weight:600">${timeStr}</div>
            </div>`;
        }
        nextList.innerHTML = html;
        
      } catch (err) {
        input.style.borderColor = 'var(--color-error)';
        desc.textContent = 'Invalid Cron Expression';
        desc.style.color = 'var(--color-error)';
        nextList.innerHTML = `<div style="padding:1rem;color:var(--color-error);text-align:center;background:var(--color-error-light);border-radius:var(--radius-md)">${err.message.replace('Error: ', '')}</div>`;
      }
    }

    input.addEventListener('input', updateCron);
    updateCron(); // Initial render

  }, 100);

  return page;
}
