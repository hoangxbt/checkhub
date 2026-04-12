// src/components/search-bar.js
import { RECORD_TYPES } from '../utils/constants.js';
import { cleanDomainInput } from '../utils/validators.js';

export function createSearchBar({ placeholder = 'Enter domain name...', showTypeSelector = true, onSearch, defaultType = 'A' }) {
  const form = document.createElement('form');
  form.className = 'search-bar';
  form.setAttribute('id', 'search-bar');

  const input = document.createElement('input');
  input.type = 'text'; input.placeholder = placeholder;
  input.id = 'search-input'; input.autocomplete = 'off'; input.spellcheck = false;
  form.appendChild(input);

  let select;
  if (showTypeSelector) {
    select = document.createElement('select');
    select.id = 'record-type-select';
    RECORD_TYPES.forEach(rt => {
      const opt = document.createElement('option');
      opt.value = rt.value; opt.textContent = rt.label;
      if (rt.value === defaultType) opt.selected = true;
      select.appendChild(opt);
    });
    form.appendChild(select);
  }

  const btn = document.createElement('button');
  btn.type = 'submit'; btn.textContent = 'Search'; btn.id = 'search-button';
  form.appendChild(btn);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const domain = cleanDomainInput(input.value);
    if (!domain) { input.focus(); return; }
    const type = select ? select.value : 'A';
    if (onSearch) onSearch(domain, type);
  });

  return { form, input, select };
}
