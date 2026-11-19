import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCommandAliasMap } from '../features/command-aliases.js';

test('custom aliases accept valid names and preserve built-ins', () => {
  const map = buildCommandAliasMap({ kontras: 'contrast', cmd: 'help', 'bad name': 'help', too_long_alias_name: 'help' });
  assert.equal(map.kontras, 'contrast');
  assert.equal(map.cmd, 'commands');
  assert.equal(map['bad name'], undefined);
  assert.equal(map.too_long_alias_name, undefined);
});

test('invalid custom alias payloads fall back to built-ins', () => {
  const map = buildCommandAliasMap(null);
  assert.equal(map.h, 'help');
  assert.equal(map.m, 'menu');
});
