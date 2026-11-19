import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const css = fs.readFileSync(new URL('../pir-showcase-editorial.css', import.meta.url), 'utf8');
const server = fs.readFileSync(new URL('../server.js', import.meta.url), 'utf8');
const svg = fs.readFileSync(new URL('../pir-carousel-branches-left.svg', import.meta.url), 'utf8');
const ornament = css.slice(css.lastIndexOf('Subtle tree-branch ornament on the LEFT copy panel only'));

test('tree-branch decoration is attached only to the left copy panel', () => {
  assert.match(ornament, /\.pv-showcase-copy::before/);
  assert.doesNotMatch(ornament, /\.pv-showcase-art::before|\.pv-showcase-art::after/);
  assert.match(ornament, /background-image: url\('\/pir-carousel-branches-left\.svg\?v=20261119b'\)/);
  assert.match(ornament, /right: -18px !important/);
  assert.match(ornament, /background-position: right bottom/);
});

test('branch ornament remains subtle and does not intercept interaction', () => {
  assert.match(ornament, /opacity: \.34 !important/);
  assert.match(ornament, /pointer-events: none !important/);
  assert.match(ornament, /z-index: 0 !important/);
  assert.match(ornament, /mix-blend-mode: multiply !important/);
});

test('branch asset is routed and the stylesheet cache version is refreshed', () => {
  assert.match(server, /pir-carousel-branches-left\.svg/);
  assert.match(server, /pir-showcase-editorial\.css\?v=20261119-heading-zoom-safe-b/);
  assert.match(svg, /<svg[\s\S]*viewBox="0 0 560 700"/);
  assert.match(svg, /stroke-linecap="round"/);
  assert.match(svg, /M535 728 C500 664/);
});
