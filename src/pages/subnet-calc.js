// src/pages/subnet-calc.js
import { showToast } from '../components/toast.js';

export function renderSubnetCalc() {
  const page = document.createElement('div');
  page.innerHTML = `<section class="page-hero"><div class="container">
    <h1>IP Subnet Calculator</h1>
    <p>Calculate network ranges, broadcast addresses, and total usable hosts from an IPv4 address and CIDR prefix.</p>
  </div></section>`;

  const section = document.createElement('section');
  section.className = 'container page-section';
  section.innerHTML = `
    <div style="max-width:900px;margin:0 auto">
      
      <!-- Calculator Input -->
      <div style="background:var(--bg-surface);border:1px solid var(--border-color);border-radius:var(--radius-lg);padding:1.5rem;margin-bottom:1.5rem;box-shadow:var(--shadow-sm)">
        <div style="display:grid;grid-template-columns:2fr 1fr;gap:1rem;margin-bottom:1rem">
          <div>
            <label style="font-size:0.8125rem;font-weight:600;color:var(--text-primary);display:block;margin-bottom:0.5rem">IP Address</label>
            <input type="text" id="subnet-ip" placeholder="e.g. 192.168.1.1" value="192.168.1.1" spellcheck="false" style="width:100%;padding:0.75rem 1rem;border-radius:var(--radius-md);border:1px solid var(--border-color);background:var(--bg-surface-hover);color:var(--text-primary);font-family:'JetBrains Mono',monospace;font-size:1rem;outline:none;box-sizing:border-box">
          </div>
          <div>
            <label style="font-size:0.8125rem;font-weight:600;color:var(--text-primary);display:block;margin-bottom:0.5rem">Subnet Mask (CIDR)</label>
            <div style="position:relative">
              <span style="position:absolute;left:1rem;top:50%;transform:translateY(-50%);color:var(--text-tertiary);font-family:'JetBrains Mono',monospace;pointer-events:none">/</span>
              <input type="number" id="subnet-cidr" placeholder="24" value="24" min="0" max="32" style="width:100%;padding:0.75rem 1rem 0.75rem 2rem;border-radius:var(--radius-md);border:1px solid var(--border-color);background:var(--bg-surface-hover);color:var(--color-primary);font-weight:700;font-family:'JetBrains Mono',monospace;font-size:1rem;outline:none;box-sizing:border-box">
            </div>
          </div>
        </div>
        
        <div style="display:flex;justify-content:space-between;align-items:center">
          <select id="subnet-mask-select" style="padding:0.5rem 0.75rem;border-radius:var(--radius-md);border:1px solid var(--border-color);background:var(--bg-surface-hover);color:var(--text-secondary);font-size:0.8125rem;outline:none">
            <option value="">Quick Select Subnet Mask...</option>
            <option value="8">255.0.0.0 (/8)</option>
            <option value="16">255.255.0.0 (/16)</option>
            <option value="24">255.255.255.0 (/24)</option>
            <option value="25">255.255.255.128 (/25)</option>
            <option value="26">255.255.255.192 (/26)</option>
            <option value="27">255.255.255.224 (/27)</option>
            <option value="28">255.255.255.240 (/28)</option>
            <option value="29">255.255.255.248 (/29)</option>
            <option value="30">255.255.255.252 (/30)</option>
          </select>
          <div id="subnet-error" style="color:var(--color-error);font-size:0.8125rem;font-weight:500;display:none">Invalid IP Address</div>
        </div>
      </div>

      <!-- Results Grid -->
      <div id="subnet-results" style="display:grid;grid-template-columns:1fr;gap:1rem">
        
        <!-- Summary Cards -->
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1rem">
          <div style="background:var(--color-primary-light);border:1px solid rgba(59,130,246,0.3);border-radius:var(--radius-lg);padding:1.25rem;text-align:center">
            <div style="font-size:0.75rem;text-transform:uppercase;letter-spacing:0.05em;color:var(--color-primary);margin-bottom:0.375rem;font-weight:600">Usable Hosts</div>
            <div id="res-hosts" style="font-size:1.75rem;font-weight:700;color:var(--text-primary);font-family:'JetBrains Mono',monospace"></div>
          </div>
          <div style="background:var(--bg-surface);border:1px solid var(--border-color);border-radius:var(--radius-lg);padding:1.25rem;text-align:center">
            <div style="font-size:0.75rem;text-transform:uppercase;letter-spacing:0.05em;color:var(--text-tertiary);margin-bottom:0.375rem;font-weight:600">Network Address</div>
            <div id="res-network" style="font-size:1.25rem;font-weight:700;color:var(--text-primary);font-family:'JetBrains Mono',monospace;margin-bottom:0.25rem"></div>
            <div id="res-network-cidr" style="font-size:0.875rem;color:var(--color-accent);font-family:'JetBrains Mono',monospace;font-weight:600"></div>
          </div>
          <div style="background:var(--bg-surface);border:1px solid var(--border-color);border-radius:var(--radius-lg);padding:1.25rem;text-align:center">
            <div style="font-size:0.75rem;text-transform:uppercase;letter-spacing:0.05em;color:var(--text-tertiary);margin-bottom:0.375rem;font-weight:600">Broadcast Address</div>
            <div id="res-broadcast" style="font-size:1.25rem;font-weight:700;color:var(--text-primary);font-family:'JetBrains Mono',monospace"></div>
          </div>
        </div>

        <!-- Detail Table -->
        <div style="background:var(--bg-surface);border:1px solid var(--border-color);border-radius:var(--radius-lg);overflow:hidden">
          <table style="width:100%;border-collapse:collapse;text-align:left">
            <tbody id="res-table-body">
              <!-- Dynamically populated -->
            </tbody>
          </table>
        </div>

        <!-- Binary Representation -->
        <div style="background:var(--bg-surface);border:1px solid var(--border-color);border-radius:var(--radius-lg);overflow:hidden;margin-top:0.5rem">
          <div style="padding:0.75rem 1rem;background:var(--bg-surface-hover);border-bottom:1px solid var(--border-color)">
            <span style="font-size:0.8125rem;font-weight:600;color:var(--text-primary)">🔢 Binary Representation</span>
          </div>
          <div style="padding:1rem;font-family:'JetBrains Mono',monospace;font-size:0.875rem;line-height:1.8">
            <div style="display:flex;justify-content:space-between;border-bottom:1px solid var(--border-color);padding-bottom:0.5rem;margin-bottom:0.5rem">
              <span style="color:var(--text-secondary)">IP Address</span>
              <span id="bin-ip" style="color:var(--text-primary)"></span>
            </div>
            <div style="display:flex;justify-content:space-between;border-bottom:1px solid var(--border-color);padding-bottom:0.5rem;margin-bottom:0.5rem">
              <span style="color:var(--text-secondary)">Subnet Mask</span>
              <span id="bin-mask" style="color:var(--color-primary)"></span>
            </div>
            <div style="display:flex;justify-content:space-between">
              <span style="color:var(--text-secondary)">Network</span>
              <span id="bin-network" style="color:var(--color-success)"></span>
            </div>
          </div>
        </div>

      </div>
    </div>`;
  page.appendChild(section);

  setTimeout(() => {
    const ipInput = page.querySelector('#subnet-ip');
    const cidrInput = page.querySelector('#subnet-cidr');
    const selectMask = page.querySelector('#subnet-mask-select');
    const errorDiv = page.querySelector('#subnet-error');
    
    // Result elements
    const resHosts = page.querySelector('#res-hosts');
    const resNetwork = page.querySelector('#res-network');
    const resNetworkCidr = page.querySelector('#res-network-cidr');
    const resBroadcast = page.querySelector('#res-broadcast');
    const resTableBody = page.querySelector('#res-table-body');
    
    const binIp = page.querySelector('#bin-ip');
    const binMask = page.querySelector('#bin-mask');
    const binNetwork = page.querySelector('#bin-network');

    function ipToInt(ip) {
      return ip.split('.').reduce((int, octet) => (int << 8) + parseInt(octet, 10), 0) >>> 0;
    }

    function intToIp(int) {
      return [
        (int >>> 24) & 255,
        (int >>> 16) & 255,
        (int >>> 8) & 255,
        int & 255
      ].join('.');
    }

    function toBinaryStr(int, highlightIndex = -1) {
      const parts = [];
      for (let i = 3; i >= 0; i--) {
        const octet = (int >>> (i * 8)) & 255;
        let bin = octet.toString(2).padStart(8, '0');
        parts.push(bin);
      }
      const fullBin = parts.join('.');
      if (highlightIndex >= 0 && highlightIndex <= 32) {
        // Highlight Network vs Host bits
        let dotAdjustedIndex = highlightIndex + Math.floor(highlightIndex / 8);
        if (highlightIndex === 32) dotAdjustedIndex = fullBin.length;
        
        const netPart = fullBin.substring(0, dotAdjustedIndex);
        const hostPart = fullBin.substring(dotAdjustedIndex);
        return `<span style="color:var(--color-primary)">${netPart}</span><span style="color:var(--text-tertiary)">${hostPart}</span>`;
      }
      return parts.join('.');
    }

    function calculate() {
      const ipStr = ipInput.value.trim();
      let cidr = parseInt(cidrInput.value, 10);

      // Validate IP
      const ipv4Regex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
      if (!ipv4Regex.test(ipStr)) {
        errorDiv.textContent = 'Invalid IP Address format';
        errorDiv.style.display = 'block';
        ipInput.style.borderColor = 'var(--color-error)';
        return;
      }
      if (isNaN(cidr) || cidr < 0 || cidr > 32) {
        errorDiv.textContent = 'CIDR must be between 0 and 32';
        errorDiv.style.display = 'block';
        cidrInput.style.borderColor = 'var(--color-error)';
        return;
      }

      errorDiv.style.display = 'none';
      ipInput.style.borderColor = 'var(--border-color)';
      cidrInput.style.borderColor = 'var(--border-color)';

      // Math
      const ipInt = ipToInt(ipStr);
      let maskInt = 0;
      if (cidr > 0) maskInt = (~0 << (32 - cidr)) >>> 0;
      
      const networkInt = (ipInt & maskInt) >>> 0;
      const broadcastInt = (networkInt | (~maskInt)) >>> 0;
      
      let firstUsableInt = networkInt + 1;
      let lastUsableInt = broadcastInt - 1;
      let totalHosts = Math.pow(2, 32 - cidr);
      let usableHosts = totalHosts - 2;

      // Special cases
      if (cidr === 32) {
        firstUsableInt = networkInt;
        lastUsableInt = networkInt;
        usableHosts = 1;
      } else if (cidr === 31) {
        // RFC 3021 Point-to-Point
        usableHosts = 2;
        firstUsableInt = networkInt;
        lastUsableInt = broadcastInt;
      }

      // Update DOM
      resNetwork.textContent = intToIp(networkInt);
      resNetworkCidr.textContent = `/${cidr}`;
      resBroadcast.textContent = intToIp(broadcastInt);
      resHosts.textContent = usableHosts.toLocaleString();

      const maskStr = intToIp(maskInt);
      const wildcardInt = (~maskInt) >>> 0;

      // Generate Table Rows
      const tbody = `
        <tr style="border-bottom:1px solid var(--border-color)"><td style="padding:0.75rem 1rem;color:var(--text-secondary);width:40%">Subnet Mask</td><td style="padding:0.75rem 1rem;font-weight:600;color:var(--text-primary);font-family:'JetBrains Mono',monospace">${maskStr}</td></tr>
        <tr style="border-bottom:1px solid var(--border-color)"><td style="padding:0.75rem 1rem;color:var(--text-secondary)">Wildcard Mask</td><td style="padding:0.75rem 1rem;font-weight:600;color:var(--text-primary);font-family:'JetBrains Mono',monospace">${intToIp(wildcardInt)}</td></tr>
        <tr style="border-bottom:1px solid var(--border-color)"><td style="padding:0.75rem 1rem;color:var(--text-secondary)">First Usable Host</td><td style="padding:0.75rem 1rem;font-weight:600;color:var(--color-success);font-family:'JetBrains Mono',monospace">${intToIp(firstUsableInt)}</td></tr>
        <tr style="border-bottom:1px solid var(--border-color)"><td style="padding:0.75rem 1rem;color:var(--text-secondary)">Last Usable Host</td><td style="padding:0.75rem 1rem;font-weight:600;color:var(--color-error);font-family:'JetBrains Mono',monospace">${intToIp(lastUsableInt)}</td></tr>
        <tr style="border-bottom:1px solid var(--border-color)"><td style="padding:0.75rem 1rem;color:var(--text-secondary)">Total IPv4 Addresses</td><td style="padding:0.75rem 1rem;font-weight:600;color:var(--text-primary)">${totalHosts.toLocaleString()}</td></tr>
      `;
      resTableBody.innerHTML = tbody;

      // Binary
      binIp.innerHTML = toBinaryStr(ipInt, cidr);
      binMask.innerHTML = toBinaryStr(maskInt, cidr);
      binNetwork.innerHTML = toBinaryStr(networkInt, cidr);
    }

    // Event Listeners
    ipInput.addEventListener('input', calculate);
    cidrInput.addEventListener('input', () => {
      selectMask.value = ''; 
      calculate();
    });
    
    selectMask.addEventListener('change', (e) => {
      if(e.target.value) {
        cidrInput.value = e.target.value;
        calculate();
      }
    });

    // Initial Calculation
    calculate();

  }, 100);

  return page;
}
