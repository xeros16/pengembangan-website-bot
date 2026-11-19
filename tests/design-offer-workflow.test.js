import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read = path => fs.readFileSync(new URL(path, import.meta.url), 'utf8');
const model = read('../models/design-marketplace.js');
const feature = read('../features/design-marketplace/index.js');
const docs = read('../docs/MARKETPLACE.md');

test('legacy request and offer schemas are retained only for historical records', () => {
  assert.match(model, /LEGACY ARCHIVE ONLY/);
  assert.match(model, /DesignRequestSchema/);
  assert.match(model, /DesignOfferSchema/);
  assert.match(docs, /legacy schemas remain/i);
});
test('active bot no longer handles offer, order, delivery, revision, or review workflow', () => {
  for (const legacy of ['DesignRequest', 'DesignOffer', 'DesignReview', 'MarketplacePayment', 'MarketplaceDispute']) {
    assert.ok(!feature.includes(legacy), `${legacy} should not be imported or operated by the active feature`);
  }
  assert.doesNotMatch(feature, /requestdesign (?:accept|decline|withdraw|deliver|review|confirm|start)/i);
  assert.doesNotMatch(feature, /sendMarketplaceNotice/);
});
test('old requestdesign command responds with direct-contact guidance only', () => {
  assert.match(feature, /ctx\.command === 'requestdesign'/);
  assert.match(feature, /Fitur brief, penawaran, dan pesanan melalui bot sudah dinonaktifkan/);
  assert.match(feature, /hubungi kontak yang dicantumkan secara langsung/);
});
test('the current product boundary excludes payment and mediation', () => {
  assert.match(docs, /No checkout, payment gateway, manual payment ledger, escrow/);
  assert.match(docs, /prospective client contacts the designer directly/i);
  assert.match(docs, /not transaction arbitration/i);
});
