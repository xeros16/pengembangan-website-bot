import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read = (path) => fs.readFileSync(new URL(path, import.meta.url), 'utf8');
test('featured portfolio is limited to approved owner-owned works and three active items', () => {
  const source = read('../features/design-marketplace/index.js');
  assert.match(source, /findOne\(\{ itemId: itemId\.toUpperCase\(\), ownerJid: ctx\.userJid \}\)/);
  assert.match(source, /item\.moderationStatus !== 'approved'/);
  assert.match(source, /count >= 3/);
  assert.match(source, /item\.featured = true/);
  assert.match(source, /item\.featured = false/);
});
test('featured work remains stored and displayed first in public portfolio', () => {
  const schema = read('../models/design-marketplace.js');
  const source = read('../features/design-marketplace/index.js');
  const docs = read('../features/design-marketplace/README.md');
  assert.match(schema, /featured: \{ type: Boolean, default: false, index: true \}/);
  assert.match(schema, /designerId: 1, moderationStatus: 1, featured: -1/);
  assert.match(source, /sort\(\{ featured: -1, createdAt: -1 \}\)/);
  assert.match(source, /mode === 'featured'/);
  assert.match(docs, /portfolio unggulan ART-ID/);
});
test('directory search is based on approved work, not order ratings or price ranking', () => {
  const source = read('../features/design-marketplace/index.js');
  assert.match(source, /PortfolioItem\.distinct\('ownerJid', \{ moderationStatus: 'approved' \}\)/);
  assert.doesNotMatch(source, /DesignReview\.aggregate/);
  assert.doesNotMatch(source, /acceptsOrders: true/);
});
