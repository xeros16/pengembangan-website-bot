import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizePixelRealmArgs } from '../games/pixel-realm/command-aliases.js';

test('default .pr opens Pixel Realm menu', () => {
  assert.deepEqual(normalizePixelRealmArgs([]), ['menu']);
});
test('short command .pr mulai is preserved', () => {
  assert.deepEqual(normalizePixelRealmArgs(['mulai']), ['mulai']);
});
test('English setup aliases normalize to canonical commands', () => {
  assert.deepEqual(normalizePixelRealmArgs(['start']), ['mulai']);
  assert.deepEqual(normalizePixelRealmArgs(['name', 'PixelFox']), ['nama', 'PixelFox']);
  assert.deepEqual(normalizePixelRealmArgs(['class', 'pendekar']), ['kelas', 'pendekar']);
  assert.deepEqual(normalizePixelRealmArgs(['confirm']), ['konfirmasi']);
});
test('pet names are shorthand adoption commands', () => {
  for (const pet of ['fox', 'wolf', 'slime', 'dragon']) {
    assert.deepEqual(normalizePixelRealmArgs([pet]), ['pet', 'adopsi', pet]);
    assert.deepEqual(normalizePixelRealmArgs(['pet', pet]), ['pet', 'adopsi', pet]);
  }
});
test('ordinary subcommands and their arguments remain intact', () => {
  assert.deepEqual(normalizePixelRealmArgs(['beli', 'potion', '5']), ['beli', 'potion', '5']);
  assert.deepEqual(normalizePixelRealmArgs(['explore']), ['jelajah']);
});
