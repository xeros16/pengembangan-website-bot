import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const root = process.cwd();
const feature = fs.readFileSync(path.join(root, 'features/design-marketplace/index.js'), 'utf8');
const model = fs.readFileSync(path.join(root, 'models/design-marketplace.js'), 'utf8');
const docs = fs.readFileSync(path.join(root, 'features/design-marketplace/README.md'), 'utf8');

test('active v5.91 bot feature has no payment ledger commands or runtime model import', () => {
  assert.doesNotMatch(feature, /MarketplacePayment/);
  assert.doesNotMatch(feature, /payment-submit|payment-verify|payment-reject/);
  assert.match(feature, /Tidak ada payment atau transaksi melalui bot/);
});

test('old payment schema is archival only and is not operated by the directory', () => {
  assert.match(model, /MarketplacePaymentSchema/);
  assert.match(model, /LEGACY ARCHIVE ONLY/);
  assert.match(docs, /manual payment ledger/);
  assert.match(docs, /do not create briefs, offers, orders, packages, payment records/i);
});
