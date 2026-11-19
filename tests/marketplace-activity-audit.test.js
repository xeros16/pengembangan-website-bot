import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const source = readFileSync(new URL('../features/design-marketplace/index.js', import.meta.url), 'utf8');
const model = readFileSync(new URL('../models/design-marketplace.js', import.meta.url), 'utf8');

test('legacy order activity model remains for historical records only', () => {
  assert.match(model, /LEGACY ARCHIVE ONLY/);
  assert.match(model, /const MarketplaceActivitySchema/);
  assert.match(model, /MarketplaceActivitySchema\.index/);
});

test('current activity dashboard is limited to profiles, works, and reports', () => {
  const dashboard = source.slice(source.indexOf('async function handleMarketAdmin(ctx)'), source.indexOf('function dashboardIdentityJids(ctx)'));
  assert.match(dashboard, /DesignerProfile\.find/);
  assert.match(dashboard, /PortfolioItem\.find/);
  assert.match(dashboard, /MarketplaceReport\.find/);
  assert.doesNotMatch(dashboard, /DesignRequest|DesignOffer|MarketplaceActivity/);
  assert.doesNotMatch(source, /recordOrderActivity/);
});
