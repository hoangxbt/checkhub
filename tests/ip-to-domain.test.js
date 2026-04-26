import test from 'node:test';
import assert from 'node:assert/strict';

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

function createTextResponse(text, { ok = true, status = 200 } = {}) {
  return {
    ok,
    status,
    async text() {
      return text;
    },
  };
}

test('ip-to-domain api returns hosted domains from the reverse-IP provider', async () => {
  const { default: handler } = await import('../api/ip-to-domain.js');
  const originalFetch = global.fetch;
  const calls = [];

  global.fetch = async (url) => {
    calls.push(String(url));
    return createTextResponse('lmrtfy.com\r\nredditblog.com\nredditforpros.com\n');
  };

  try {
    const res = createMockResponse();
    await handler({ method: 'GET', query: { ip: '151.101.1.140' } }, res);

    assert.equal(res.statusCode, 200);
    assert.deepEqual(calls, [
      'https://api.hackertarget.com/reverseiplookup/?q=151.101.1.140',
    ]);
    assert.deepEqual(res.body, {
      ip: '151.101.1.140',
      provider: 'hackertarget',
      count: 3,
      domains: ['lmrtfy.com', 'redditblog.com', 'redditforpros.com'],
    });
  } finally {
    global.fetch = originalFetch;
  }
});

test('ip-to-domain api treats provider no-data responses as an empty result', async () => {
  const { default: handler } = await import('../api/ip-to-domain.js');
  const originalFetch = global.fetch;

  global.fetch = async () => createTextResponse('No DNS A records found');

  try {
    const res = createMockResponse();
    await handler({ method: 'GET', query: { ip: '104.21.65.1' } }, res);

    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, {
      ip: '104.21.65.1',
      provider: 'hackertarget',
      count: 0,
      domains: [],
    });
  } finally {
    global.fetch = originalFetch;
  }
});

test('ip-to-domain api rejects private IP addresses before calling the provider', async () => {
  const { default: handler } = await import('../api/ip-to-domain.js');
  const originalFetch = global.fetch;
  let called = false;

  global.fetch = async () => {
    called = true;
    return createTextResponse('example.com');
  };

  try {
    const res = createMockResponse();
    await handler({ method: 'GET', query: { ip: '192.168.1.10' } }, res);

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.error, 'Invalid IP parameter');
    assert.equal(called, false);
  } finally {
    global.fetch = originalFetch;
  }
});
