import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../features/design-marketplace/index.js', import.meta.url), 'utf8');
const readme = fs.readFileSync(new URL('../docs/MARKETPLACE.md', import.meta.url), 'utf8');

test('v5.91 directory admin dashboard is routed and owner-protected', () => {
  assert.match(source, /ctx\.command === 'marketadmin'/);
  assert.match(source, /ctx\.isBotOwner\(ctx\.userJid, ctx\.senderIdentityAliases\)/);
  assert.match(source, /async function handleMarketAdmin\(ctx\)/);
});

test('Owner dashboard only moderates profiles, portfolio work, and reports', () => {
  const dashboard = source.slice(source.indexOf('async function handleMarketAdmin(ctx)'), source.indexOf('function dashboardIdentityJids(ctx)'));
  for (const command of ['designers', 'pending', 'reports', 'activity']) assert.ok(dashboard.includes(`marketadmin ${command}`));
  for (const forbidden of ['MarketplacePayment', 'DesignRequest', 'DesignOffer', 'DesignReview', 'orders', 'payments', 'finance']) {
    assert.ok(!dashboard.includes(`marketadmin ${forbidden}`), `unexpected active dashboard: ${forbidden}`);
  }
  assert.match(dashboard, /PortfolioItem\.countDocuments/);
  assert.match(dashboard, /MarketplaceReport\.countDocuments/);
});

test('directory documentation defines direct contact and excludes transaction mediation', () => {
  assert.match(readme, /portfolio discovery directory/i);
  assert.match(readme, /No checkout, payment gateway, manual payment ledger, escrow/);
  assert.match(readme, /contacts the designer directly/i);
});
