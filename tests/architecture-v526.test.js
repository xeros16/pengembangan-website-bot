import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('WhatsApp bot no longer starts the public website process', () => {
  const source = fs.readFileSync(new URL('../index.js', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /startPublicPortfolioServer/);
  assert.doesNotMatch(source, /design-marketplace\/public\/server/);
});

test('portfolio website is a standalone Node project', () => {
  const pkg = JSON.parse(fs.readFileSync(new URL('../portfolio-website/package.json', import.meta.url), 'utf8'));
  assert.equal(pkg.name, 'pir-visuals-portfolio-website');
  assert.ok(pkg.scripts.start);
  assert.ok(fs.existsSync(new URL('../portfolio-website/.env.example', import.meta.url)));
});

test('website uses the bot-compatible MongoDB collection names', () => {
  const source = fs.readFileSync(new URL('../portfolio-website/models.js', import.meta.url), 'utf8');
  for (const name of ['designerprofiles', 'portfolioitems', 'designservices', 'designeranalytics']) assert.ok(source.includes(name));
});

test('game modules remain in their own directory', () => {
  assert.ok(fs.existsSync(new URL('../games/index.js', import.meta.url)));
  assert.ok(fs.existsSync(new URL('../games/pixel-realm/index.js', import.meta.url)));
});
