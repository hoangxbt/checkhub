// src/components/navbar.js
import { createThemeToggle } from './theme-toggle.js';
import { TOOLS } from '../utils/constants.js';

const CHEVRON_DOWN = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>`;
const MENU_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>`;
const LOGO_ICON = `<svg viewBox="0 0 32 32" width="32" height="32" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="ch-g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#10b981"/><stop offset="100%" stop-color="#0284c7"/></linearGradient></defs><rect width="32" height="32" rx="10" fill="url(#ch-g)"/><path d="M9.5 16.5L14 21L22.5 11" stroke="white" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`;

function createDropdown(categoryName, tools) {
  return `<div class="navbar-dropdown">
    <button class="navbar-dropdown-trigger">${categoryName} ${CHEVRON_DOWN}</button>
    <div class="navbar-dropdown-menu">
      ${tools.map(t => `<a href="${t.path}" class="navbar-dropdown-item"><span class="icon">${t.icon}</span><span class="label">${t.name}</span></a>`).join('')}
    </div>
  </div>`;
}

export function renderNavbar(container) {
  const dnsTools = TOOLS.filter(t => t.category === 'DNS Tools');
  const domainTools = TOOLS.filter(t => t.category === 'Domain Intelligence');
  const networkTools = TOOLS.filter(t => t.category === 'Network Tools');
  const utilityTools = TOOLS.filter(t => t.category === 'Utility Tools');

  container.className = 'navbar';
  container.innerHTML = `<div class="container">
    <a href="/" class="navbar-brand">${LOGO_ICON}<span>CheckHub</span></a>
    <div class="navbar-menu" id="navbar-menu">
      <a href="/" class="navbar-link active">Home</a>
      ${createDropdown('DNS Tools', dnsTools)}
      ${createDropdown('Domain', domainTools)}
      ${createDropdown('Network', networkTools)}
      ${createDropdown('Utilities', utilityTools)}
    </div>
    <div class="navbar-actions">
      <button class="navbar-kbd" id="cmd-palette-trigger" aria-label="Search tools"><span>⌘</span><span>K</span></button>
      <div id="theme-toggle-slot"></div>
      <button class="navbar-toggle" id="navbar-toggle" aria-label="Toggle menu">${MENU_ICON}</button>
    </div>
  </div>`;

  container.querySelector('#theme-toggle-slot').appendChild(createThemeToggle());

  container.querySelectorAll('.navbar-dropdown').forEach(dropdown => {
    dropdown.querySelector('.navbar-dropdown-trigger').addEventListener('click', (e) => {
      e.stopPropagation();
      container.querySelectorAll('.navbar-dropdown.open').forEach(d => { if (d !== dropdown) d.classList.remove('open'); });
      dropdown.classList.toggle('open');
    });
  });
  document.addEventListener('click', () => container.querySelectorAll('.navbar-dropdown.open').forEach(d => d.classList.remove('open')));

  container.querySelector('#navbar-toggle').addEventListener('click', () => container.querySelector('#navbar-menu').classList.toggle('open'));
  container.querySelector('#cmd-palette-trigger').addEventListener('click', () => document.dispatchEvent(new CustomEvent('open-command-palette')));
}
