// src/components/command-palette.js
import { TOOLS } from '../utils/constants.js';

let isOpen = false, selectedIndex = 0, filteredTools = [...TOOLS];

function fuzzyMatch(query, text) {
  const q = query.toLowerCase(), t = text.toLowerCase();
  if (t.includes(q)) return true;
  let qi = 0;
  for (let i = 0; i < t.length && qi < q.length; i++) { if (t[i] === q[qi]) qi++; }
  return qi === q.length;
}

function renderResults(resultsEl) {
  resultsEl.innerHTML = filteredTools.map((tool, i) => `
    <div class="command-palette-item ${i === selectedIndex ? 'selected' : ''}" data-path="${tool.path}" data-index="${i}">
      <span class="icon">${tool.icon}</span><span class="label">${tool.name}</span><span class="shortcut">${tool.category}</span>
    </div>`).join('');
}

function open(container) {
  isOpen = true; selectedIndex = 0; filteredTools = [...TOOLS];
  container.classList.add('open');
  container.innerHTML = `<div class="command-palette">
    <input type="text" class="command-palette-input" id="cmd-palette-input" placeholder="Search tools... (e.g. DNS, WHOIS, SSL)" autocomplete="off" />
    <div class="command-palette-results" id="cmd-palette-results"></div>
  </div>`;

  const input = container.querySelector('#cmd-palette-input');
  const resultsEl = container.querySelector('#cmd-palette-results');
  renderResults(resultsEl);
  setTimeout(() => input.focus(), 50);

  input.addEventListener('input', () => {
    const query = input.value.trim();
    filteredTools = query ? TOOLS.filter(t => fuzzyMatch(query, t.name) || fuzzyMatch(query, t.description) || fuzzyMatch(query, t.category)) : [...TOOLS];
    selectedIndex = 0;
    renderResults(resultsEl);
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); selectedIndex = Math.min(selectedIndex + 1, filteredTools.length - 1); renderResults(resultsEl); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); selectedIndex = Math.max(selectedIndex - 1, 0); renderResults(resultsEl); }
    else if (e.key === 'Enter' && filteredTools[selectedIndex]) { close(container); window.__router.navigate(filteredTools[selectedIndex].path); }
    else if (e.key === 'Escape') close(container);
  });

  resultsEl.addEventListener('click', (e) => {
    const item = e.target.closest('.command-palette-item');
    if (item) { close(container); window.__router.navigate(item.dataset.path); }
  });
}

function close(container) { isOpen = false; container.classList.remove('open'); container.innerHTML = ''; }

export function initCommandPalette(router) {
  const container = document.getElementById('command-palette-overlay');
  container.className = 'command-palette-overlay';
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); isOpen ? close(container) : open(container); }
    if (e.key === 'Escape' && isOpen) close(container);
  });
  document.addEventListener('open-command-palette', () => { if (!isOpen) open(container); });
  container.addEventListener('click', (e) => { if (e.target === container) close(container); });
}
