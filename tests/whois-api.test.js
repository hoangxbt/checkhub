import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import https from 'node:https';

import handler from '../api/whois.js';

function createMockResponse() {
  return {
    headers: {},
    statusCode: 200,
    body: null,
    ended: false,
    setHeader(name, value) {
      this.headers[name] = value;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
    end() {
      this.ended = true;
      return this;
    },
  };
}

function createTextFetchResponse(html, { ok = true, status = 200 } = {}) {
  return {
    ok,
    status,
    async text() {
      return html;
    },
    async json() {
      throw new Error('json() not implemented for this response');
    },
  };
}

function createJsonFetchResponse(payload, { ok = true, status = 200 } = {}) {
  return {
    ok,
    status,
    async json() {
      return payload;
    },
    async text() {
      return JSON.stringify(payload);
    },
  };
}

function mockVnHttpsRequest(html, statusCode = 200) {
  const originalRequest = https.request;
  const calls = [];

  https.request = (url, options, callback) => {
    calls.push([url, options, '']);

    const request = new EventEmitter();
    request.write = (chunk) => {
      calls[calls.length - 1][2] += String(chunk);
    };
    request.end = () => {
      const response = new EventEmitter();
      response.statusCode = statusCode;
      response.setEncoding = () => {};
      callback(response);
      queueMicrotask(() => {
        response.emit('data', html);
        response.emit('end');
      });
    };
    request.on = request.addListener.bind(request);
    return request;
  };

  return {
    calls,
    restore() {
      https.request = originalRequest;
    },
  };
}

test('whois api uses the official .vn provider for registered domains', async () => {
  const html = `
    <div class="card-body">
      <h5 class="card-text">chiasegpu.vn</h5>
      <table class="table">
        <tbody>
          <tr><td>Loại tên miền:</td><td>Tên miền quốc gia .VN</td></tr>
          <tr><td>Tên chủ thể đăng ký sử dụng:</td><td>Nguyễn Trường Giang</td></tr>
          <tr><td>Nhà đăng ký quản lý:</td><td><a href="https://www.vnnic.vn/nhadangky/thongtin/gmo">Công ty Cổ phần GMO-Z.com RUNSYSTEM</a></td></tr>
          <tr><td>Ngày đăng ký:</td><td>30-12-2025</td></tr>
          <tr><td>Ngày hết hạn:</td><td>30-12-2026</td></tr>
        </tbody>
      </table>
    </div>
  `;
  const vnRequest = mockVnHttpsRequest(html);

  try {
    const res = createMockResponse();
    await handler({ method: 'GET', query: { domain: 'https://chiasegpu.vn/' } }, res);

    assert.equal(res.statusCode, 200);
    assert.equal(vnRequest.calls.length, 1);
    assert.equal(vnRequest.calls[0][0], 'https://tracuutenmien.gov.vn/tra-cuu-thong-tin-ten-mien');
    assert.equal(vnRequest.calls[0][1].method, 'POST');
    assert.match(vnRequest.calls[0][2], /domainName=chiasegpu\.vn/);
    assert.equal(res.body.provider, 'vnnic');
    assert.equal(res.body.domainName, 'chiasegpu.vn');
    assert.equal(res.body.registrant.name, 'Nguyễn Trường Giang');
    assert.equal(res.body.registrar.name, 'Công ty Cổ phần GMO-Z.com RUNSYSTEM');
    assert.equal(res.body.registrar.url, 'https://www.vnnic.vn/nhadangky/thongtin/gmo');
    assert.equal(res.body.events.registration, '2025-12-30T00:00:00.000Z');
    assert.equal(res.body.events.expiration, '2026-12-30T00:00:00.000Z');
  } finally {
    vnRequest.restore();
  }
});

test('whois api returns 404 for .vn domains that are not allocated', async () => {
  const html = `
    <div class="card-body">
      <h5 class="card-text">this-domain-should-not-exist-xyz.vn</h5>
      <table class="table">
        <tbody>
          <tr><td>Loại tên miền:</td><td>Tên miền quốc gia .VN</td></tr>
          <tr><td>Trạng thái:</td><td>Chưa cấp phát</td></tr>
        </tbody>
      </table>
    </div>
  `;
  const vnRequest = mockVnHttpsRequest(html);

  try {
    const res = createMockResponse();
    await handler({ method: 'GET', query: { domain: 'this-domain-should-not-exist-xyz.vn' } }, res);

    assert.equal(res.statusCode, 404);
    assert.equal(res.body.code, 'not_registered');
    assert.equal(res.body.provider, 'vnnic');
  } finally {
    vnRequest.restore();
  }
});

test('whois api falls back to RDAP for non-.vn domains', async () => {
  const rdap = {
    ldhName: 'google.com',
    handle: '12345_DOMAIN_COM-VRSN',
    status: ['active'],
    events: [
      { eventAction: 'registration', eventDate: '1997-09-15T04:00:00Z' },
      { eventAction: 'expiration', eventDate: '2028-09-14T04:00:00Z' },
    ],
    nameservers: [
      { ldhName: 'ns1.google.com', ipAddresses: { v4: ['216.239.32.10'] } },
    ],
    entities: [
      {
        roles: ['registrar'],
        vcardArray: ['vcard', [
          ['fn', {}, 'text', 'MarkMonitor Inc.'],
          ['url', {}, 'uri', 'https://www.markmonitor.com'],
        ]],
      },
    ],
    port43: 'whois.markmonitor.com',
  };
  const originalFetch = global.fetch;
  const calls = [];

  global.fetch = async (url) => {
    calls.push(String(url));
    return createJsonFetchResponse(rdap);
  };

  try {
    const res = createMockResponse();
    await handler({ method: 'GET', query: { domain: 'google.com' } }, res);

    assert.equal(res.statusCode, 200);
    assert.deepEqual(calls, ['https://rdap.org/domain/google.com']);
    assert.equal(res.body.provider, 'rdap');
    assert.equal(res.body.domainName, 'google.com');
    assert.equal(res.body.registrar.name, 'MarkMonitor Inc.');
    assert.equal(res.body.events.registration, '1997-09-15T04:00:00Z');
    assert.equal(res.body.nameservers[0].name, 'ns1.google.com');
  } finally {
    global.fetch = originalFetch;
  }
});

test('whois api surfaces RDAP no-data as a provider-no-data error', async () => {
  const originalFetch = global.fetch;

  global.fetch = async () => createJsonFetchResponse({}, { ok: false, status: 404 });

  try {
    const res = createMockResponse();
    await handler({ method: 'GET', query: { domain: 'example.test' } }, res);

    assert.equal(res.statusCode, 404);
    assert.equal(res.body.code, 'provider_no_data');
    assert.equal(res.body.provider, 'rdap');
  } finally {
    global.fetch = originalFetch;
  }
});
