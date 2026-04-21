import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildDomainNotFoundState,
  buildRdapNoDataState,
  buildWhoisUnavailableState,
} from '../src/utils/rdap.js';

test('buildRdapNoDataState warns that .vn registry data may be unavailable via rdap.org', () => {
  const state = buildRdapNoDataState('https://chiasegpu.vn/');

  assert.equal(state.title, 'WHOIS Data Unavailable');
  assert.match(state.message, /chiasegpu\.vn/i);
  assert.match(state.message, /rdap\.org/i);
  assert.match(state.hint, /\.vn/i);
  assert.match(state.hint, /VNNIC/i);
});

test('buildRdapNoDataState keeps generic guidance for other domains', () => {
  const state = buildRdapNoDataState('example.test');

  assert.equal(state.title, 'RDAP Record Not Found');
  assert.match(state.message, /example\.test/i);
  assert.match(state.message, /may be unregistered/i);
  assert.equal(state.hint, null);
});

test('buildDomainNotFoundState keeps the unregistered wording explicit', () => {
  const state = buildDomainNotFoundState('missing-example.vn');

  assert.equal(state.title, 'Domain Not Found');
  assert.match(state.message, /missing-example\.vn/i);
  assert.match(state.message, /not be registered/i);
});

test('buildWhoisUnavailableState explains that VNNIC may be temporarily unavailable', () => {
  const state = buildWhoisUnavailableState('chiasegpu.vn', 'vnnic');

  assert.equal(state.title, 'WHOIS Data Unavailable');
  assert.match(state.message, /chiasegpu\.vn/i);
  assert.match(state.hint, /VNNIC/i);
});
