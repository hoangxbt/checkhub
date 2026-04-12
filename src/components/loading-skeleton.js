// src/components/loading-skeleton.js
export function createTableSkeleton(rows = 10, cols = 4) {
  const wrapper = document.createElement('div');
  wrapper.className = 'results-table-wrapper';
  let html = '<table class="results-table"><tbody>';
  for (let r = 0; r < rows; r++) {
    html += '<tr>';
    for (let c = 0; c < cols; c++) {
      const width = c === 0 ? '40%' : c === cols - 1 ? '15%' : '25%';
      html += `<td><div class="skeleton skeleton-line" style="width:${width}"></div></td>`;
    }
    html += '</tr>';
  }
  html += '</tbody></table>';
  wrapper.innerHTML = html;
  return wrapper;
}
