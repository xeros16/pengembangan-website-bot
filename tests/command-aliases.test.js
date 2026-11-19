import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SHORT_COMMAND_ALIASES,
  COMMAND_ALIASES,
  buildCommandAliasMap,
  normalizeShortCommand,
} from '../features/command-aliases.js';

test('pintasan bawaan diterjemahkan ke perintah lengkap', () => {
  assert.equal(normalizeShortCommand('cmd'), 'commands');
  assert.equal(normalizeShortCommand('h'), 'help');
  assert.equal(normalizeShortCommand('.wz'), 'wizard');
  assert.equal(normalizeShortCommand('ct'), 'contrast');
});

test('pintasan dari konfigurasi dimuat dan diarahkan ke perintah kanonis', () => {
  assert.equal(normalizeShortCommand('kontras'), 'contrast');
  assert.equal(normalizeShortCommand('.warna'), 'colorpalette');
  assert.equal(normalizeShortCommand('daftar'), 'commands');
  assert.ok(Object.keys(COMMAND_ALIASES).length > Object.keys(SHORT_COMMAND_ALIASES).length);
});

test('alias tidak boleh menimpa perintah utama atau pintasan bawaan', () => {
  const aliases = buildCommandAliasMap({
    contrast: 'help',
    ct: 'help',
    'bad alias': 'help',
    aman: 'contrast',
  });
  assert.equal(aliases.contrast, undefined);
  assert.equal(aliases.ct, 'contrast');
  assert.equal(aliases['bad alias'], undefined);
  assert.equal(aliases.aman, 'contrast');
});

test('perintah biasa tetap sama', () => {
  assert.equal(normalizeShortCommand('brandkit'), 'brandkit');
  assert.equal(normalizeShortCommand('contrast'), 'contrast');
});
