import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizePrivateKey } from './google-private-key.ts';

test('converts literal newline escapes from environment variables', () => {
  assert.equal(normalizePrivateKey('  BEGIN\\nkey\\nEND  '), 'BEGIN\nkey\nEND');
});

test('preserves multiline keys and handles missing configuration', () => {
  assert.equal(normalizePrivateKey('BEGIN\nkey\nEND'), 'BEGIN\nkey\nEND');
  assert.equal(normalizePrivateKey(undefined), '');
  assert.equal(normalizePrivateKey('   '), '');
});
