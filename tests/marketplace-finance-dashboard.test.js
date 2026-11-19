import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const source = fs.readFileSync(new URL('../features/design-marketplace/index.js', import.meta.url), 'utf8');
const docs = fs.readFileSync(new URL('../features/design-marketplace/README.md', import.meta.url), 'utf8');

test('v5.91 Owner directory dashboard does not import or aggregate payment data', () => {
  assert.match(source, /async function handleMarketAdmin\(ctx\)/);
  assert.doesNotMatch(source, /MarketplacePayment\.aggregate/);
  assert.doesNotMatch(source, /MarketplacePayment\.find/);
  assert.match(source, /Fitur pesanan, penawaran, rating transaksi, dan pembayaran tidak digunakan/);
});

test('legacy finance views are disabled and explicitly outside the current directory', () => {
  assert.match(source, /'finance', 'keuangan'/);
  assert.match(docs, /active v5\.91 bot feature does not import or query them/i);
  assert.match(docs, /checkout, payment gateway, manual payment ledger/i);
});
