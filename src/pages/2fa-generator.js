import * as OTPAuth from 'otpauth';
import { showToast } from '../components/toast.js';

export function render2FAGenerator() {
  const container = document.createElement('div');
  container.className = 'tool-page';

  container.innerHTML = `
    <div class="tool-header">
      <h1 class="tool-title">2FA Code Generator</h1>
      <p class="tool-subtitle">Generate Time-based One-Time Passwords (TOTP) from your secret key.</p>
    </div>

    <div class="grid">
      <div class="card">
        <h3 class="card-title">Setup Key</h3>
        <div class="input-group">
          <label>Secret Key or URI</label>
          <input type="text" id="fa-secret" placeholder="JBSWY3DPEHPK3PXP" autocomplete="off" spellcheck="false" style="font-family: var(--font-mono); font-size: 1.1rem; padding: 12px; border-radius: 8px; border: 1px solid var(--border-color); width: 100%; box-sizing: border-box;">
        </div>
        <p style="font-size: 0.9rem; color: var(--text-muted); margin-top: 16px;">Standard Base32 secret keys or otpauth:// URIs are supported.</p>
      </div>

      <div class="card" style="text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center;">
        <h3 class="card-title" style="align-self: flex-start;">Your Code</h3>
        
        <div id="totp-display" class="mt-4 mb-4" style="font-size: 3rem; font-weight: 700; letter-spacing: 0.1em; font-variant-numeric: tabular-nums; display: flex; align-items: center; justify-content: center; height: 80px; color: var(--text-color);">
          --- ---
        </div>

        <div style="width: 100%; display: flex; align-items: center; gap: 12px; margin-top: 10px;">
          <div style="flex: 1; height: 6px; background: var(--bg-alt); border-radius: 3px; overflow: hidden;">
            <div id="totp-progress" style="height: 100%; width: 100%; background: var(--primary-color); transition: width 0.5s linear;"></div>
          </div>
          <div id="totp-timer" style="font-family: var(--font-mono); font-size: 0.9rem; color: var(--text-muted); width: 30px; text-align: right;">30s</div>
        </div>
        
        <button id="copy-totp" class="btn btn-primary" style="display: none; margin-top: 24px; width: 100%;">Copy Code</button>
      </div>
    </div>
  `;

  // Logic
  const secretInput = container.querySelector('#fa-secret');
  const display = container.querySelector('#totp-display');
  const progress = container.querySelector('#totp-progress');
  const timerText = container.querySelector('#totp-timer');
  const copyBtn = container.querySelector('#copy-totp');
  
  let currentTotpObj = null;
  let updateInterval;
  let currentCodeUrl = '';

  function updateCode() {
    if (!currentTotpObj) {
      display.textContent = '--- ---';
      copyBtn.style.display = 'none';
      progress.style.width = '100%';
      timerText.textContent = '30s';
      return;
    }

    try {
      const code = currentTotpObj.generate();
      // Format as 123 456
      display.textContent = code.slice(0, 3) + ' ' + code.slice(3);
      currentCodeUrl = code;
      copyBtn.style.display = 'block';

      // Update timer
      const epoch = Math.floor(Date.now() / 1000);
      const remaining = 30 - (epoch % 30);
      
      timerText.textContent = remaining + 's';
      progress.style.width = ((remaining / 30) * 100) + '%';
      
      if (remaining < 6) {
        progress.style.background = 'var(--error-color)';
        display.style.color = 'var(--error-color)';
      } else {
        progress.style.background = 'var(--primary-color)';
        display.style.color = 'var(--text-color)';
      }
    } catch (err) {
      console.error(err);
      display.textContent = 'ERROR';
    }
  }

  function parseInput() {
    const val = secretInput.value.trim().replace(/\s+/g, '');
    if (!val) {
      currentTotpObj = null;
      updateCode();
      return;
    }

    try {
      if (val.startsWith('otpauth://')) {
        currentTotpObj = OTPAuth.URI.parse(val);
      } else {
        currentTotpObj = new OTPAuth.TOTP({
          issuer: "CheckHub",
          label: "Unknown",
          algorithm: "SHA1",
          digits: 6,
          period: 30,
          secret: val
        });
      }
      updateCode();
    } catch (e) {
      currentTotpObj = null;
      display.textContent = 'INVALID';
      copyBtn.style.display = 'none';
      progress.style.width = '0%';
      timerText.textContent = '0s';
    }
  }

  secretInput.addEventListener('input', parseInput);

  copyBtn.addEventListener('click', () => {
    if (currentCodeUrl) {
      navigator.clipboard.writeText(currentCodeUrl);
      showToast('2FA Code copied to clipboard', 'success');
    }
  });

  // Start tick
  updateInterval = setInterval(updateCode, 1000);
  
  // Cleanup
  container.addEventListener('DOMNodeRemoved', (e) => {
    if (e.target === container) clearInterval(updateInterval);
  });

  return container;
}
