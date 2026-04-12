// src/pages/ping-test.js
export function renderPingTest() {
  const page = document.createElement('div');
  page.innerHTML = `<section class="page-hero"><div class="container">
    <h1>Global Ping Test</h1>
    <p>Check the availability and response time (latency) of any server or domain globally using TCP Ping.</p>
  </div></section>`;

  const section = document.createElement('section');
  section.className = 'container page-section';
  section.innerHTML = `
    <div style="max-width:800px;margin:0 auto">
      <!-- Input Area -->
      <div style="display:flex;gap:0.5rem;margin-bottom:1.5rem">
        <input type="text" id="ping-host" placeholder="Domain or IP (e.g. google.com or 8.8.8.8)" spellcheck="false" style="flex:1;padding:0.875rem 1.25rem;border-radius:var(--radius-lg);border:2px solid var(--border-color);background:var(--bg-surface);color:var(--text-primary);font-family:'JetBrains Mono',monospace;font-size:1rem;outline:none;transition:border-color 0.2s">
        <button id="ping-scan-btn" style="padding:0.875rem 2rem;background:linear-gradient(135deg,var(--color-primary),var(--color-accent));color:white;font-size:0.9375rem;font-weight:600;border-radius:var(--radius-lg);border:none;cursor:pointer;transition:all 0.2s">⚡ Ping Server</button>
      </div>

      <div style="padding:1rem;border-radius:var(--radius-md);background:var(--color-primary-light);border:1px solid rgba(59,130,246,0.3);margin-bottom:1.5rem">
        <p style="font-size:0.8125rem;color:var(--text-secondary);line-height:1.5;margin:0">
          <strong style="color:var(--color-primary)">Note:</strong> Browsers do not support ICMP. This tool issues TCP protocol pings (Port 443/80) via our Vercel Edge nodes to accurately measure connection latency and availability.
        </p>
      </div>

      <!-- Loading State -->
      <div id="ping-loading" style="display:none;text-align:center;padding:3rem">
        <div style="width:40px;height:40px;border:3px solid var(--border-color);border-top-color:var(--color-success);border-radius:50%;animation:spin 1s linear infinite;margin:0 auto 1rem"></div>
        <div style="font-size:0.9375rem;color:var(--text-primary);font-weight:500">Pinging server...</div>
        <div style="font-size:0.8125rem;color:var(--text-secondary);margin-top:0.25rem">Transmitting 4 packets</div>
      </div>

      <!-- Error State -->
      <div id="ping-error" style="display:none;padding:1.5rem;border-radius:var(--radius-lg);background:var(--color-error-light);color:var(--color-error);border:1px solid rgba(239,68,68,0.3);text-align:center;font-weight:600"></div>

      <!-- Results Terminal -->
      <div id="ping-results" style="display:none;background:#0d1117;border-radius:var(--radius-lg);border:1px solid var(--border-color);overflow:hidden;box-shadow:var(--shadow-lg)">
        <div style="background:#161b22;padding:0.75rem 1rem;border-bottom:1px solid #30363d;display:flex;align-items:center;gap:0.5rem">
          <div style="width:12px;height:12px;border-radius:50%;background:#ff5f56"></div>
          <div style="width:12px;height:12px;border-radius:50%;background:#ffbd2e"></div>
          <div style="width:12px;height:12px;border-radius:50%;background:#27c93f"></div>
          <span style="margin-left:0.5rem;color:#8b949e;font-size:0.75rem;font-weight:600;font-family:'JetBrains Mono',monospace">ping-terminal</span>
        </div>
        <div id="ping-terminal-output" style="padding:1.5rem;font-family:'JetBrains Mono',monospace;font-size:0.875rem;line-height:1.6;color:#c9d1d9;white-space:pre-wrap"></div>
      </div>
    </div>`;
  page.appendChild(section);

  if (!document.getElementById('spin-keyframes')) {
    const style = document.createElement('style');
    style.id = 'spin-keyframes';
    style.innerHTML = `@keyframes spin { 100% { transform: rotate(360deg); } }`;
    document.head.appendChild(style);
  }

  setTimeout(() => {
    const input = page.querySelector('#ping-host');
    const btn = page.querySelector('#ping-scan-btn');
    const loading = page.querySelector('#ping-loading');
    const errorDiv = page.querySelector('#ping-error');
    const resultsDiv = page.querySelector('#ping-results');
    const terminal = page.querySelector('#ping-terminal-output');

    async function doPing() {
      const host = input.value.trim().replace(/^https?:\/\//, '').split('/')[0];
      if (!host) {
        input.style.borderColor = 'var(--color-error)';
        input.focus();
        return;
      }

      input.style.borderColor = 'var(--border-color)';
      resultsDiv.style.display = 'none';
      errorDiv.style.display = 'none';
      terminal.innerHTML = '';
      loading.style.display = 'block';
      btn.disabled = true;
      btn.style.opacity = '0.7';

      try {
        const res = await fetch(`/api/ping?host=${encodeURIComponent(host)}`);
        if (!res.ok) {
          const errData = await res.json().catch(()=>({}));
          throw new Error(errData.error || 'Server Error: ' + res.status);
        }
        
        const data = await res.json();
        const pings = data.pings || [];
        
        // Terminal rendering effect
        let html = `<span style="color:#58a6ff">PING</span> ${host} via TCP (Port 443)\n\n`;
        
        let sent = 4;
        let received = 0;
        let times = [];

        for (const p of pings) {
          if (p.status === 'open') {
            received++;
            times.push(p.time);
            html += `Reply from ${host}: time=<span style="color:#3fb950">${p.time.toFixed(2)}ms</span> seq=${p.seq}\n`;
          } else {
            html += `Request timed out. seq=${p.seq} \n`;
          }
        }
        
        const lost = sent - received;
        const lossPercent = (lost / sent) * 100;
        
        html += `\n--- ${host} ping statistics ---\n`;
        html += `${sent} packets transmitted, ${received} received, ${lossPercent}% packet loss\n`;
        
        if (received > 0) {
          const min = Math.min(...times).toFixed(2);
          const max = Math.max(...times).toFixed(2);
          const avg = (times.reduce((a,b)=>a+b,0) / received).toFixed(2);
          html += `rtt min/avg/max = <span style="color:#79c0ff">${min}</span>/<span style="color:#79c0ff">${avg}</span>/<span style="color:#79c0ff">${max}</span> ms\n`;
        } else {
          html += `<span style="color:#f85149">Host appears down or completely filtering TCP connections.</span>`;
        }

        terminal.innerHTML = html;
        resultsDiv.style.display = 'block';

      } catch (err) {
        errorDiv.textContent = '❌ ' + err.message;
        errorDiv.style.display = 'block';
      } finally {
        loading.style.display = 'none';
        btn.disabled = false;
        btn.style.opacity = '1';
      }
    }

    btn.addEventListener('click', doPing);
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') doPing();
    });

  }, 100);

  return page;
}
