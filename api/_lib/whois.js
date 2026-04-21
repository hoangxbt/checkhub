import https from 'node:https';
import net from 'node:net';

const VN_WHOIS_URL = 'https://tracuutenmien.gov.vn/tra-cuu-thong-tin-ten-mien';
const RDAP_URL_PREFIX = 'https://rdap.org/domain/';
const US_WHOIS_HOST = 'whois.nic.us';
const WHOIS_PORT = 43;
const WHOIS_TIMEOUT_MS = 15000;

export async function lookupWhois(domain, fetchImpl = fetch) {
  if (domain.toLowerCase().endsWith('.vn')) {
    return lookupVnWhois(domain, fetchImpl);
  }

  if (domain.toLowerCase().endsWith('.us')) {
    return lookupUsWhois(domain);
  }

  return lookupRdapWhois(domain, fetchImpl);
}

async function lookupVnWhois(domain, fetchImpl) {
  const response = await postVnWhoisRequest(domain);

  if (!response.ok) {
    return {
      kind: 'error',
      status: 502,
      code: 'provider_error',
      provider: 'vnnic',
      error: `VNNIC lookup failed (${response.status})`,
    };
  }

  const html = await response.text();
  const parsed = parseVnWhoisHtml(html, domain);

  if (!parsed) {
    return {
      kind: 'error',
      status: 502,
      code: 'provider_error',
      provider: 'vnnic',
      error: 'Could not parse VNNIC WHOIS response',
    };
  }

  return parsed;
}

function postVnWhoisRequest(domain) {
  const body = new URLSearchParams({ domainName: domain }).toString();

  return new Promise((resolve, reject) => {
    const request = https.request(
      VN_WHOIS_URL,
      {
        method: 'POST',
        headers: {
          Accept: 'text/html,application/xhtml+xml',
          'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
          'Content-Length': Buffer.byteLength(body),
          'User-Agent': 'CheckHub WHOIS Lookup',
        },
        ciphers: 'DEFAULT@SECLEVEL=0',
      },
      (response) => {
        let html = '';
        response.setEncoding('utf8');
        response.on('data', (chunk) => {
          html += chunk;
        });
        response.on('end', () => {
          resolve({
            ok: (response.statusCode || 0) >= 200 && (response.statusCode || 0) < 300,
            status: response.statusCode || 0,
            async text() {
              return html;
            },
          });
        });
      },
    );

    request.on('error', reject);
    request.write(body);
    request.end();
  });
}

async function lookupRdapWhois(domain, fetchImpl) {
  const response = await fetchImpl(`${RDAP_URL_PREFIX}${encodeURIComponent(domain)}`);

  if (!response.ok) {
    if (response.status === 404) {
      return {
        kind: 'not_found',
        status: 404,
        code: 'provider_no_data',
        provider: 'rdap',
        error: 'No WHOIS record was returned by rdap.org',
      };
    }

    return {
      kind: 'error',
      status: 502,
      code: 'provider_error',
      provider: 'rdap',
      error: `RDAP lookup failed (${response.status})`,
    };
  }

  const rdap = await response.json();

  return {
    kind: 'record',
    data: parseRdapResponse(rdap, domain),
  };
}

async function lookupUsWhois(domain) {
  try {
    const rawWhois = await queryUsWhois(domain);
    return parseUsWhoisText(rawWhois, domain);
  } catch (error) {
    return {
      kind: 'error',
      status: 502,
      code: 'provider_error',
      provider: US_WHOIS_HOST,
      error: `WHOIS lookup failed (${error.message || 'network error'})`,
    };
  }
}

function queryUsWhois(domain) {
  return new Promise((resolve, reject) => {
    let responseText = '';
    let settled = false;

    const socket = net.createConnection(
      { host: US_WHOIS_HOST, port: WHOIS_PORT },
      () => {
        socket.setEncoding('utf8');
        socket.write(`${domain}\r\n`);
      },
    );

    function finish(error, value) {
      if (settled) {
        return;
      }

      settled = true;

      if (error) {
        socket.destroy();
        reject(error);
        return;
      }

      resolve(value);
    }

    socket.setTimeout(WHOIS_TIMEOUT_MS);
    socket.on('data', (chunk) => {
      responseText += chunk;
    });
    socket.on('end', () => {
      finish(null, responseText);
    });
    socket.on('timeout', () => {
      finish(new Error('timed out'));
    });
    socket.on('error', (error) => {
      finish(error);
    });
  });
}

function parseUsWhoisText(text, domain) {
  const databaseUpdate = extractUsWhoisDatabaseUpdate(text);

  if (/^No Data Found$/mi.test(text)) {
    return {
      kind: 'not_found',
      status: 404,
      code: 'not_registered',
      provider: US_WHOIS_HOST,
      error: `No registration record was returned for ${domain}`,
      ...(databaseUpdate ? { lastDatabaseUpdate: databaseUpdate } : {}),
    };
  }

  const fields = collectWhoisFields(text);
  const domainName = (firstFieldValue(fields, 'Domain Name') || domain).toLowerCase();
  const handle = firstFieldValue(fields, 'Registry Domain ID');
  const registrarName = firstFieldValue(fields, 'Registrar');
  const registrarUrl = firstFieldValue(fields, 'Registrar URL');
  const registrarIanaId = firstFieldValue(fields, 'Registrar IANA ID');
  const registrarAbuseEmail = firstFieldValue(fields, 'Registrar Abuse Contact Email');
  const registrarAbusePhone = firstFieldValue(fields, 'Registrar Abuse Contact Phone');
  const registrantAddress = joinAddressParts([
    firstFieldValue(fields, 'Registrant Street'),
    firstFieldValue(fields, 'Registrant Street1'),
    firstFieldValue(fields, 'Registrant Street2'),
    firstFieldValue(fields, 'Registrant Street3'),
    firstFieldValue(fields, 'Registrant City'),
    firstFieldValue(fields, 'Registrant State/Province'),
    firstFieldValue(fields, 'Registrant Postal Code'),
    firstFieldValue(fields, 'Registrant Country'),
  ]);
  const dnssec = firstFieldValue(fields, 'DNSSEC');
  const nameservers = (fields.get('Name Server') || []).map((name) => ({
    name,
    v4: [],
    v6: [],
  }));

  return {
    kind: 'record',
    data: {
      provider: US_WHOIS_HOST,
      domainName,
      handle: handle || null,
      status: (fields.get('Domain Status') || []).map((value) => value.replace(/\s+https?:\/\/\S+$/i, '').trim()),
      events: {
        ...(firstFieldValue(fields, 'Creation Date') ? { registration: firstFieldValue(fields, 'Creation Date') } : {}),
        ...(firstFieldValue(fields, 'Registry Expiry Date') ? { expiration: firstFieldValue(fields, 'Registry Expiry Date') } : {}),
        ...(firstFieldValue(fields, 'Updated Date') ? { 'last changed': firstFieldValue(fields, 'Updated Date') } : {}),
        ...(databaseUpdate ? { 'last update of RDAP database': databaseUpdate } : {}),
      },
      nameservers,
      registrar: (registrarName || registrarUrl || registrarIanaId || registrarAbuseEmail || registrarAbusePhone) ? {
        name: registrarName || null,
        org: null,
        email: null,
        phone: null,
        address: null,
        url: registrarUrl || null,
        handle: null,
        ianaId: registrarIanaId || null,
        abuseEmail: registrarAbuseEmail || null,
        abusePhone: registrarAbusePhone || null,
      } : null,
      registrant: {
        name: firstFieldValue(fields, 'Registrant Name') || null,
        org: firstFieldValue(fields, 'Registrant Organization') || null,
        email: firstFieldValue(fields, 'Registrant Email') || null,
        phone: firstFieldValue(fields, 'Registrant Phone') || null,
        address: registrantAddress,
        url: null,
        handle: null,
      },
      secureDNS: dnssec ? {
        delegationSigned: /signeddelegation/i.test(dnssec),
        zoneSigned: false,
      } : null,
      port43: US_WHOIS_HOST,
      links: [
        { rel: 'source', href: `whois://${US_WHOIS_HOST}`, type: 'text/plain' },
      ],
      rawEntities: [],
    },
  };
}

export function parseVnWhoisHtml(html, domain) {
  const rows = extractTableRows(html);
  if (rows.length === 0) {
    return null;
  }

  const domainName = extractDomainHeading(html) || domain;
  const fieldMap = new Map(rows.map(({ label, value, valueHtml }) => [foldText(label), { value, valueHtml }]));
  const statusField = findField(fieldMap, 'trang thai');
  const registrantField = findField(fieldMap, 'ten chu the dang ky su dung');
  const registrarField = findField(fieldMap, 'nha dang ky quan ly');
  const registrationField = findField(fieldMap, 'ngay dang ky');
  const expirationField = findField(fieldMap, 'ngay het han');
  const rawStatus = statusField?.value || null;

  if (rawStatus && foldText(rawStatus) === 'chua cap phat') {
    return {
      kind: 'not_found',
      status: 404,
      code: 'not_registered',
      provider: 'vnnic',
      error: `No registration record was returned for ${domainName}`,
    };
  }

  const registrarValue = registrarField || null;
  const registrarUrl = registrarValue ? extractFirstLink(registrarValue.valueHtml) : null;
  const registrationDate = parseVnDate(registrationField?.value || null);
  const expirationDate = parseVnDate(expirationField?.value || null);

  return {
    kind: 'record',
    data: {
      provider: 'vnnic',
      domainName,
      handle: null,
      status: rawStatus ? [rawStatus] : [],
      events: {
        ...(registrationDate ? { registration: registrationDate } : {}),
        ...(expirationDate ? { expiration: expirationDate } : {}),
      },
      nameservers: [],
      registrar: registrarValue ? {
        name: registrarValue.value || null,
        url: registrarUrl,
        org: null,
        email: null,
        phone: null,
        address: null,
        handle: null,
        ianaId: null,
      } : null,
      registrant: registrantField?.value ? {
        name: registrantField.value,
        org: null,
        email: null,
        phone: null,
        address: null,
        url: null,
        handle: null,
      } : null,
      secureDNS: null,
      port43: null,
      links: [
        { rel: 'source', href: VN_WHOIS_URL, type: 'text/html' },
      ],
      rawEntities: [],
    },
  };
}

function parseRdapResponse(rdap, domain) {
  const result = {
    provider: 'rdap',
    domainName: rdap.ldhName || rdap.unicodeName || domain,
    handle: rdap.handle || null,
    status: Array.isArray(rdap.status) ? rdap.status : [],
    events: {},
    nameservers: [],
    registrar: null,
    registrant: null,
    secureDNS: null,
    port43: rdap.port43 || null,
    links: [],
    rawEntities: [],
  };

  if (Array.isArray(rdap.events)) {
    rdap.events.forEach((event) => {
      if (event.eventAction && event.eventDate) {
        result.events[event.eventAction] = event.eventDate;
      }
    });
  }

  if (Array.isArray(rdap.nameservers)) {
    result.nameservers = rdap.nameservers.map((nameserver) => ({
      name: nameserver.ldhName || nameserver.unicodeName || null,
      v4: nameserver.ipAddresses?.v4 || [],
      v6: nameserver.ipAddresses?.v6 || [],
    }));
  }

  if (rdap.secureDNS) {
    result.secureDNS = {
      delegationSigned: rdap.secureDNS.delegationSigned || false,
      zoneSigned: rdap.secureDNS.zoneSigned || false,
    };
  }

  if (Array.isArray(rdap.entities)) {
    rdap.entities.forEach((entity) => {
      const roles = entity.roles || [];
      const info = extractEntityInfo(entity);

      if (roles.includes('registrar')) {
        result.registrar = info;

        if (Array.isArray(entity.entities)) {
          entity.entities.forEach((subEntity) => {
            if ((subEntity.roles || []).includes('abuse')) {
              const subInfo = extractEntityInfo(subEntity);
              result.registrar.abuseEmail = subInfo.email;
              result.registrar.abusePhone = subInfo.phone;
            }
          });
        }
      }

      if (roles.includes('registrant')) {
        result.registrant = info;
      }

      result.rawEntities.push({ roles, ...info });
    });
  }

  if (Array.isArray(rdap.links)) {
    result.links = rdap.links
      .filter((link) => link.href)
      .map((link) => ({ rel: link.rel, href: link.href, type: link.type }));
  }

  return result;
}

function extractEntityInfo(entity) {
  const info = {
    handle: entity.handle || null,
    name: null,
    org: null,
    email: null,
    phone: null,
    address: null,
    url: null,
    ianaId: null,
  };

  if (entity.vcardArray && Array.isArray(entity.vcardArray[1])) {
    entity.vcardArray[1].forEach((property) => {
      const propertyName = property[0];
      const value = property[3];

      switch (propertyName) {
        case 'fn':
          info.name = value;
          break;
        case 'org':
          info.org = Array.isArray(value) ? value[0] : value;
          break;
        case 'email':
          info.email = value;
          break;
        case 'tel':
          info.phone = typeof value === 'string' ? value : (value?.uri || value || null);
          break;
        case 'adr':
          if (Array.isArray(value)) {
            info.address = value.flat().filter(Boolean).join(', ');
          }
          break;
        case 'url':
          info.url = value;
          break;
      }
    });
  }

  if (Array.isArray(entity.publicIds)) {
    info.ianaId = entity.publicIds.find((item) => item.type === 'IANA Registrar ID')?.identifier || null;
  }

  return info;
}

function extractTableRows(html) {
  const rows = [];
  const rowPattern = /<tr>\s*<td>([\s\S]*?)<\/td>\s*<td>([\s\S]*?)<\/td>\s*<\/tr>/gi;
  let match;

  while ((match = rowPattern.exec(html)) !== null) {
    rows.push({
      label: stripTags(match[1]),
      value: stripTags(match[2]),
      valueHtml: match[2],
    });
  }

  return rows;
}

function extractDomainHeading(html) {
  const match = html.match(/<h5[^>]*class="card-text"[^>]*>([\s\S]*?)<\/h5>/i);
  return match ? stripTags(match[1]).toLowerCase() : null;
}

function findField(fieldMap, ...needles) {
  for (const [key, value] of fieldMap.entries()) {
    if (needles.some((needle) => key === needle || key.startsWith(needle) || key.includes(needle))) {
      return value;
    }
  }

  return null;
}

function extractFirstLink(html) {
  const match = html.match(/<a[^>]+href="([^"]+)"/i);
  return match ? decodeHtmlEntities(match[1]) : null;
}

function parseVnDate(value) {
  if (!value) {
    return null;
  }

  const match = value.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (!match) {
    return null;
  }

  const [, day, month, year] = match;
  return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day))).toISOString();
}

function stripTags(value) {
  return decodeHtmlEntities(value.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
}

function decodeHtmlEntities(value) {
  return value
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>');
}

function foldText(value) {
  return stripTags(value)
    .toLowerCase()
    .replace(/đ/g, 'd')
    .normalize('NFD')
    .replace(/\p{Mark}+/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function collectWhoisFields(text) {
  const fields = new Map();

  text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .forEach((line) => {
      const match = line.match(/^([^:]+):\s*(.*)$/);
      if (!match) {
        return;
      }

      const [, rawName, rawValue] = match;
      const name = rawName.trim();
      const value = rawValue.trim();
      const existing = fields.get(name) || [];
      existing.push(value);
      fields.set(name, existing);
    });

  return fields;
}

function firstFieldValue(fields, name) {
  return fields.get(name)?.[0] || null;
}

function extractUsWhoisDatabaseUpdate(text) {
  const match = text.match(/>>> Last update of WHOIS database:\s*([^\r\n<]+?)\s*<</i);
  return match ? match[1].trim() : null;
}

function joinAddressParts(parts) {
  const values = parts.filter(Boolean);
  return values.length > 0 ? values.join(', ') : null;
}
