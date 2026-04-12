// src/pages/2fa-generator.js
import * as OTPAuth from 'otpauth';
import { showToast } from '../components/toast.js';

export function render2FAGenerator() {
  const page = document.createElement('div');
  page.innerHTML = `<section class="page-hero"><div class="container">
    <h1>2FA Code Generator</h1>
    <p>Generate Time-based One-Time Passwords (TOTP) from your secret key. Fully client-side — nothing is sent to any server.</p>
  </div></section>`;

  const section = document.createElement('section');
  section.className = 'container page-section';
  section.innerHTML = `
    <div style="max-width:700px;margin:0 auto">
      <!-- Secret Key Input -->
      <div style="margin-bottom:1.5rem;padding:1.25rem;border-radius:var(--radius-lg);background:var(--bg-surface);border:1px solid var(--border-color)">
        <label style="font-size:0.875rem;font-weight:600;color:var(--text-primary);display:block;margin-bottom:0.75rem">Secret Key or otpauth:// URI</label>
        <input id="fa-secret" type="text" placeholder="JBSWY3DPEHPK3PXP" autocomplete="off" spellcheck="false"
          style="width:100%;box-sizing:border-box;padding:0.75rem 1rem;font-family:'JetBrains Mono',monospace;font-size:1rem;border-radius:var(--radius-md);border:1px solid var(--border-color);background:var(--bg-color);color:var(--text-primary);outline:none;transition:border-color 0.2s"
          onfocus="this.style.borderColor='var(--color-primary)'" onblur="this.style.borderColor='var(--border-color)'" />
        <p style="font-size:0.75rem;color:var(--text-tertiary);margin-top:0.5rem">Paste your Base32 secret or scan a QR code's <code style="background:var(--bg-surface-hover);padding:2px 5px;border-radius:3px;font-size:0.7rem">otpauth://</code> URI.</p>
      </div>

      <!-- OTP Code Display -->
      <div id="totp-card" style="padding:2rem;border-radius:var(--radius-lg);background:var(--bg-surface);border:2px solid var(--border-color);margin-bottom:1.5rem;text-align:center;cursor:pointer;transition:border-color 0.2s" title="Click to copy code">
        <p id="totp-display" style="font-family:'JetBrains Mono',monospace;font-size:3rem;font-weight:700;letter-spacing:0.15em;color:var(--text-primary);line-height:1.4;user-select:all;margin:0;font-variant-numeric:tabular-nums">— — —</p>
        <p id="totp-hint" style="font-size:0.75rem;color:var(--text-tertiary);margin-top:0.5rem">Enter a secret key above to generate codes</p>
      </div>

      <!-- Timer Bar -->
      <div style="margin-bottom:1.5rem">
        <div style="display:flex;justify-content:space-between;margin-bottom:0.375rem">
          <span style="font-size:0.8125rem;color:var(--text-secondary)">Time Remaining</span>
          <span id="totp-timer" style="font-family:'JetBrains Mono',monospace;font-size:0.8125rem;font-weight:600;color:var(--color-primary)">30s</span>
        </div>
        <div style="height:6px;border-radius:3px;background:var(--bg-surface-hover);overflow:hidden">
          <div id="totp-progress" style="height:100%;border-radius:3px;width:100%;background:var(--color-primary);transition:width 1s linear"></div>
        </div>
      </div>

      <!-- Actions -->
      <div style="display:flex;gap:0.75rem;flex-wrap:wrap">
        <button id="totp-copy" style="flex:1;min-width:150px;padding:0.875rem 1.5rem;background:linear-gradient(135deg,var(--color-primary),var(--color-accent));color:white;font-size:0.9375rem;font-weight:600;border-radius:var(--radius-lg);border:none;cursor:pointer;transition:transform 0.1s,box-shadow 0.2s;opacity:0.5;pointer-events:none" onmousedown="this.style.transform='scale(0.97)'" onmouseup="this.style.transform=''">📋 Copy Code</button>
        <button id="totp-clear" style="padding:0.875rem 1.5rem;background:var(--bg-surface);color:var(--text-primary);font-size:0.9375rem;font-weight:600;border-radius:var(--radius-lg);border:1px solid var(--border-color);cursor:pointer;transition:background 0.15s" onmouseover="this.style.background='var(--bg-surface-hover)'" onmouseout="this.style.background='var(--bg-surface)'">🗑️ Clear</button>
      </div>

      <!-- Info Section -->
      <div style="margin-top:2rem;padding:1.25rem;border-radius:var(--radius-lg);background:var(--bg-surface);border:1px solid var(--border-color)">
        <h3 style="font-size:1rem;font-weight:600;margin-bottom:0.75rem;color:var(--text-primary)">ℹ️ How it works</h3>
        <ul style="font-size:0.8125rem;color:var(--text-secondary);line-height:1.8;padding-left:1.25rem;margin:0">
          <li>TOTP generates a new 6-digit code every <strong>30 seconds</strong> based on the current time and your secret key.</li>
          <li>This tool uses the <strong>otpauth</strong> library and runs <strong>100% in your browser</strong> — your key never leaves your device.</li>
          <li>Compatible with Google Authenticator, Authy, Microsoft Authenticator, and all RFC 6238 apps.</li>
        </ul>
      </div>
    </div>`;
  page.appendChild(section);

  // Logic
  setTimeout(() => {
    const secretInput = page.querySelector('#fa-secret');
    const display = page.querySelector('#totp-display');
    const hint = page.querySelector('#totp-hint');
    const progress = page.querySelector('#totp-progress');
    const timerText = page.querySelector('#totp-timer');
    const copyBtn = page.querySelector('#totp-copy');
    const clearBtn = page.querySelector('#totp-clear');
    const card = page.querySelector('#totp-card');

    let totpObj = null;
    let currentCode = '';

    function updateCode() {
      if (!totpObj) {
        display.textContent = '— — —';
        hint.textContent = 'Enter a secret key above to generate codes';
        copyBtn.style.opacity = '0.5';
        copyBtn.style.pointerEvents = 'none';
        progress.style.width = '100%';
        progress.style.background = 'var(--color-primary)';
        timerText.textContent = '30s';
        timerText.style.color = 'var(--color-primary)';
        card.style.borderColor = 'var(--border-color)';
        return;
      }

      try {
        const code = totpObj.generate();
        currentCode = code;
        display.textContent = code.slice(0, 3) + ' ' + code.slice(3);
        hint.textContent = 'Click to copy';
        copyBtn.style.opacity = '1';
        copyBtn.style.pointerEvents = 'auto';

        const epoch = Math.floor(Date.now() / 1000);
        const remaining = 30 - (epoch % 30);
        timerText.textContent = remaining + 's';
        progress.style.width = ((remaining / 30) * 100) + '%';

        if (remaining <= 5) {
          progress.style.background = '#ef4444';
          timerText.style.color = '#ef4444';
          card.style.borderColor = '#ef4444';
          display.style.color = '#ef4444';
        } else if (remaining <= 10) {
          progress.style.background = '#f59e0b';
          timerText.style.color = '#f59e0b';
          card.style.borderColor = '#f59e0b';
          display.style.color = 'var(--text-primary)';
        } else {
          progress.style.background = 'var(--color-primary)';
          timerText.style.color = 'var(--color-primary)';
          card.style.borderColor = 'var(--color-primary)';
          display.style.color = 'var(--text-primary)';
        }
      } catch (err) {
        display.textContent = 'ERROR';
        hint.textContent = err.message;
      }
    }

    function parseInput() {
      const val = secretInput.value.trim().replace(/\s+/g, '');
      if (!val) {
        totpObj = null;
        updateCode();
        return;
      }
      try {
        if (val.startsWith('otpauth://')) {
          totpObj = OTPAuth.URI.parse(val);
        } else {
          totpObj = new OTPAuth.TOTP({
            issuer: 'CheckHub',
            label: 'User',
            algorithm: 'SHA1',
            digits: 6,
            period: 30,
            secret: val
          });
        }
        updateCode();
      } catch (e) {
        totpObj = null;
        display.textContent = 'INVALID';
        display.style.color = '#ef4444';
        hint.textContent = 'Could not parse key — check your input';
        copyBtn.style.opacity = '0.5';
        copyBtn.style.pointerEvents = 'none';
        progress.style.width = '0%';
        timerText.textContent = '0s';
      }
    }

    secretInput.addEventListener('input', parseInput);

    function doCopy() {
      if (currentCode) {
        navigator.clipboard.writeText(currentCode).then(() => showToast('2FA code copied!', 'success'));
      }
    }

    copyBtn.addEventListener('click', doCopy);
    card.addEventListener('click', doCopy);

    clearBtn.addEventListener('click', () => {
      secretInput.value = '';
      totpObj = null;
      currentCode = '';
      updateCode();
    });

    const interval = setInterval(updateCode, 1000);

    // Cleanup on navigation
    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        for (const node of m.removedNodes) {
          if (node === page || node.contains?.(page)) {
            clearInterval(interval);
            observer.disconnect();
            return;
          }
        }
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }, 100);

  return page;
}
