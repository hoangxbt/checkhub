// src/components/copy-button.js
import { showToast } from './toast.js';

const COPY_ICON = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`;
const CHECK_ICON = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>`;

export function createCopyButton(textToCopy) {
  const btn = document.createElement('button');
  btn.className = 'copy-btn';
  btn.innerHTML = COPY_ICON;
  btn.title = 'Copy to clipboard';
  btn.addEventListener('click', async (e) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(textToCopy);
      btn.innerHTML = CHECK_ICON;
      btn.style.color = 'var(--color-success)';
      btn.style.opacity = '1';
      showToast('Copied to clipboard!', 'success', 2000);
      setTimeout(() => { btn.innerHTML = COPY_ICON; btn.style.color = ''; btn.style.opacity = ''; }, 2000);
    } catch { showToast('Failed to copy', 'error'); }
  });
  return btn;
}

export function makeClickToCopy(element, text) {
  element.style.cursor = 'pointer';
  element.title = 'Click to copy';
  element.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(text);
      showToast(`Copied: ${text}`, 'success', 2000);
    } catch { showToast('Failed to copy', 'error'); }
  });
}
