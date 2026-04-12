// src/utils/validators.js
export function isValidDomain(input) {
  if (!input || typeof input !== 'string') return false;
  const cleaned = input.trim().toLowerCase();
  return /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/.test(cleaned);
}

export function isValidIP(input) {
  if (!input || typeof input !== 'string') return false;
  const cleaned = input.trim();
  const v4 = cleaned.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (v4) return v4.slice(1).every(n => parseInt(n) <= 255);
  return /^([0-9a-f]{0,4}:){2,7}[0-9a-f]{0,4}$/i.test(cleaned);
}

export function cleanDomainInput(input) {
  if (!input) return '';
  let c = input.trim().toLowerCase();
  c = c.replace(/^https?:\/\//, '').replace(/\/.*$/, '').replace(/:\d+$/, '');
  return c;
}
