import test from 'node:test';
import assert from 'node:assert/strict';

import {
  isBlockedHostname,
  isPublicIp,
  normalizeHostInput,
} from '../api/_lib/network.js';

test('normalizeHostInput trims wrapper characters from host values', () => {
  assert.equal(normalizeHostInput(' [::1]. '), '::1');
  assert.equal(normalizeHostInput('Example.com.'), 'example.com');
});

test('isBlockedHostname rejects local-only hostnames', () => {
  assert.equal(isBlockedHostname('localhost'), true);
  assert.equal(isBlockedHostname('printer.local'), true);
  assert.equal(isBlockedHostname('router.home.arpa'), true);
  assert.equal(isBlockedHostname('example.com'), false);
});

test('isPublicIp rejects private, loopback, and link-local addresses', () => {
  assert.equal(isPublicIp('10.0.0.1'), false);
  assert.equal(isPublicIp('169.254.169.254'), false);
  assert.equal(isPublicIp('::1'), false);
  assert.equal(isPublicIp('::ffff:127.0.0.1'), false);
});

test('isPublicIp allows routable IPv4 and IPv6 addresses', () => {
  assert.equal(isPublicIp('8.8.8.8'), true);
  assert.equal(isPublicIp('2606:4700:4700::1111'), true);
});
