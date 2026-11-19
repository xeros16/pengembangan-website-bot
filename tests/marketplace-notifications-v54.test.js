import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const source = readFileSync(new URL('../features/design-marketplace/index.js', import.meta.url), 'utf8');
test('v5.91 direct-contact directory has no multi-recipient order notification helper', () => {
  assert.doesNotMatch(source, /sendMarketplaceNotices/);
  assert.doesNotMatch(source, /offer-accepted-designer|offer-accepted-client|dispute-opened-owner|delivery-review-owner/);
  assert.match(source, /hubungi kontak yang dicantumkan secara langsung/);
});
