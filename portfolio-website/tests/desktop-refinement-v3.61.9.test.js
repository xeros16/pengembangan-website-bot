import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const css = fs.readFileSync(new URL('../pir-desktop-refinement.css', import.meta.url), 'utf8');
const server = fs.readFileSync(new URL('../server.js', import.meta.url), 'utf8');

test('desktop refinement loads after the showcase stylesheet and is routed as a static asset', () => {
  const showcaseIndex = server.indexOf('pir-showcase-editorial.css?v=20261119-heading-zoom-safe-b');
  const refinementIndex = server.indexOf('pir-desktop-refinement.css?v=20261119a');
  assert.ok(showcaseIndex >= 0, 'showcase stylesheet remains linked');
  assert.ok(refinementIndex > showcaseIndex, 'desktop refinement loads after the showcase');
  assert.match(server, /'pir-desktop-refinement\.css'/);
});

test('desktop layout strengthens the hero and readable index hierarchy', () => {
  assert.match(css, /@media\s*\(min-width:\s*1025px\)/);
  assert.match(css, /grid-template-columns:\s*minmax\(0,\s*1\.08fr\)\s+minmax\(360px,\s*\.92fr\)/);
  assert.match(css, /max-width:\s*470px/);
  assert.match(css, /font-size:\s*clamp\(66px,\s*7\.6vw,\s*116px\)/);
});

test('desktop service, journey, portfolio, and FAQ layouts use the PIR grid system', () => {
  assert.match(css, /grid-template-columns:\s*repeat\(4,\s*minmax\(0,\s*1fr\)\)/);
  assert.match(css, /\.pv-journey-card\s*\{/);
  assert.match(css, /\.pv-talent-grid\s*\{/);
  assert.match(css, /\.pv-project-grid\s*\{/);
  assert.match(css, /\.pv-faq\s*\{/);
  assert.match(css, /#e4ebdc/);
  assert.match(css, /#f1e2d6/);
});

test('large tablet gets a two-column fallback without overriding the mobile stack', () => {
  assert.match(css, /@media\s*\(min-width:\s*901px\)\s*and\s*\(max-width:\s*1024px\)/);
  assert.match(css, /\.pv-journey-card:last-child\s*\{\s*grid-column:\s*1\s*\/\s*-1/s);
});

test('the refinement does not alter the community showcase media sizing rules', () => {
  assert.doesNotMatch(css, /pv-showcase-art|pv-showcase-slide|object-fit/);
});

test('motion refinements respect reduced-motion preferences', () => {
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  assert.match(css, /transition:\s*none\s*!important/);
});
