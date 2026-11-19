import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const source = readFileSync(new URL('../features/design-marketplace/index.js', import.meta.url), 'utf8');
test('v5.91 directory does not send order lifecycle notifications', () => {
  assert.doesNotMatch(source, /sendMarketplaceNotice/);
  for (const event of ['order-started', 'delivery-submitted', 'delivery-verified-client', 'revision-requested', 'order-completed', 'offer-received']) {
    assert.ok(!source.includes(`'${event}'`), `unexpected order notification ${event}`);
  }
});
