import test from 'node:test';
import assert from 'node:assert/strict';

import { checkPropagation } from '../src/services/dns-api.js';

test('checkPropagation delegates propagation checks to the backend endpoint', async () => {
  const originalFetch = global.fetch;
  const calls = [];

  global.fetch = async (url) => {
    calls.push(String(url));
    return {
      ok: true,
      async json() {
        return { results: [] };
      },
    };
  };

  try {
    const results = await checkPropagation('example.com', 'A', [
      { name: 'Google', ip: '8.8.8.8' },
      { name: 'Cloudflare', ip: '1.1.1.1' },
    ]);

    assert.deepEqual(results, []);
    assert.deepEqual(calls, [
      '/api/dns-propagation?domain=example.com&type=A',
    ]);
  } finally {
    global.fetch = originalFetch;
  }
});
