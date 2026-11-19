import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const root = process.cwd();
const feature = fs.readFileSync(path.join(root, 'features/design-marketplace/index.js'), 'utf8');
const model = fs.readFileSync(path.join(root, 'models/design-marketplace.js'), 'utf8');
const docs = fs.readFileSync(path.join(root, 'docs/MARKETPLACE.md'), 'utf8');

test('v5.91 has no active dispute commands or dispute model import', () => {
  assert.doesNotMatch(feature, /requestdesign dispute(?:-list|-resolve)?/i);
  assert.doesNotMatch(feature, /MarketplaceDispute/);
  assert.match(feature, /Tidak ada brief pesanan, penawaran, checkout, pembayaran, komisi, atau sengketa/);
});

test('legacy dispute collection is retained only for historical data preservation', () => {
  assert.match(model, /LEGACY ARCHIVE ONLY/);
  assert.match(model, /MarketplaceDisputeSchema/);
  assert.match(docs, /legacy schemas remain/i);
  assert.match(docs, /not transaction arbitration/i);
});
