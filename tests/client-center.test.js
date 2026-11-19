import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read = path => fs.readFileSync(new URL(path, import.meta.url), 'utf8');
test('legacy Client Center commands are not listed as active commands', () => {
  const catalog = read('../features/command-catalog.js');
  assert.doesNotMatch(catalog, /new Set\(\['client', 'klien'/);
  assert.doesNotMatch(catalog, /client: 'Dashboard pesanan/);
});
test('legacy Client Center commands redirect users to direct portfolio discovery', () => {
  const source = read('../features/design-marketplace/index.js');
  assert.match(source, /ctx\.command === 'client' \|\| ctx\.command === 'klien'/);
  assert.match(source, /Pusat pelanggan tidak lagi mengelola pesanan melalui bot/);
  assert.match(source, /hubungi kontak pada `\.designer DSN-ID` secara langsung/);
  assert.doesNotMatch(source, /async function handleClientCenter/);
});
