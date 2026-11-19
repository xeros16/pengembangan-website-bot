import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const source = readFileSync(new URL('../features/design-marketplace/index.js', import.meta.url), 'utf8');
test('v5.91 studio shows portfolio moderation and reach metrics, not an order queue', () => {
  const studio = source.slice(source.indexOf('async function handleDesignerStudio(ctx)'), source.indexOf('async function handleServiceCommand(ctx)'));
  for (const metric of ['approved', 'pending', 'rejected', 'profileViews', 'portfolioViews', 'contactClicks']) assert.ok(studio.includes(metric));
  assert.doesNotMatch(studio, /DesignRequest|acceptedOfferIds|ANTRIAN PESANAN AKTIF|requestdesign start/);
});
test('studio explains that agreement and payment remain outside the bot', () => {
  assert.match(source, /kesepakatan, dan pembayaran berlangsung langsung di luar bot/);
});
