// src/components/results-table.js
import { makeClickToCopy } from './copy-button.js';

export function createResultsTable(results) {
  const wrapper = document.createElement('div');
  wrapper.className = 'results-table-wrapper animate-fade-in';
  const table = document.createElement('table');
  table.className = 'results-table';

  const thead = document.createElement('thead');
  thead.innerHTML = `<tr><th>Server</th><th>IP Address</th><th>TTL</th><th>Status</th><th>Time</th></tr>`;
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  tbody.className = 'animate-stagger';

  results.forEach(result => {
    const tr = document.createElement('tr');
    const statusClass = result.status === 'resolved' ? 'status-resolved' : 'status-failed';
    const statusIcon = result.status === 'resolved' ? '✓' : '✗';
    const flag = getFlagEmoji(result.server.country);

    tr.innerHTML = `
      <td><span>${flag}</span> <strong>${result.server.name}</strong><br><small style="color:var(--text-tertiary)">${result.server.provider}</small></td>
      <td></td>
      <td>${result.ttl || '—'}</td>
      <td><span class="${statusClass}">${statusIcon} ${result.status === 'resolved' ? 'Resolved' : 'Failed'}</span></td>
      <td>${result.responseTime}ms</td>`;

    const ipCell = tr.querySelectorAll('td')[1];
    if (result.ips.length > 0) {
      result.ips.forEach((ip, i) => {
        const span = document.createElement('span');
        span.className = 'ip-value'; span.textContent = ip;
        makeClickToCopy(span, ip);
        ipCell.appendChild(span);
        if (i < result.ips.length - 1) ipCell.appendChild(document.createTextNode(', '));
      });
    } else { ipCell.textContent = '—'; }

    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  wrapper.appendChild(table);
  return wrapper;
}

function getFlagEmoji(countryCode) {
  if (!countryCode) return '🌐';
  const code = countryCode.toUpperCase();
  return String.fromCodePoint(...[...code].map(c => 0x1F1E6 - 65 + c.charCodeAt(0)));
}
