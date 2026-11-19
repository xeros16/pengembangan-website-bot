import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const load = name => fs.readFileSync(new URL('../' + name, import.meta.url), 'utf8');
const page = load('server.js');
const intro = load('pir-intro-experience.js');
const css = load('pir-intro-experience.css');
const top = load('pir-back-to-top.js');
const marquee = load('pir-marquee.js');

test('intro hold 2150ms + exit 450ms totals 2.6 seconds', () => {
  assert.match(intro, /const RUN_MS = 2150;/);
  assert.match(intro, /const EXIT_MS = 450;/);
  assert.match(css, /pv-intro-progress 2\.15s linear forwards/);
});
test('TOP includes native link fallback and real page-top target', () => {
  assert.match(page, /id="pv-page-top"/);
  assert.match(page, /href="#pv-page-top" class="pv-back-top" data-back-top/);
  assert.match(top, /document\.addEventListener\('click'/);
  assert.match(top, /scrollTo\(\{ top: 0, left: 0, behavior: 'instant' \}\)/);
});
test('a single handler owns TOP action and a single handler owns visibility', () => {
  assert.doesNotMatch(page, /backTop\?\.addEventListener\('click'/);
  assert.doesNotMatch(page, /backTop\?\.classList\.toggle\('is-visible'/);
  assert.match(top, /classList\.toggle\('is-visible'/);
});
test('TOP visibility and keyboard focus have a no-JS fallback', () => {
  assert.match(css, /html:not\(\.pv-top-ready\)/);
  assert.match(css, /a\.pv-back-top\[data-back-top\]:focus-visible/);
  assert.match(top, /button\.tabIndex = visible \? 0 : -1/);
});
test('hero labels have one vertically balanced top-and-bottom border', () => {
  assert.match(css, /\.pv-hero-main \.pv-hero-foot/);
  assert.match(css, /padding:19px 0 !important/);
  assert.match(css, /border-top:1px solid #719478 !important/);
  assert.match(css, /border-bottom:1px solid #719478 !important/);
  assert.match(css, /\.pv-index[^]*?border-top:0 !important/);
});
test('continuous marquee is slower but still moves on hover', () => {
  assert.match(marquee, /active \? 4 : 36/);
  assert.match(marquee, /speed \|\| 36/);
  assert.match(marquee, /slow \? 4 : 36/);
  assert.doesNotMatch(marquee, /active \? 0 :/);
});
test('fresh asset URLs prevent Chrome using stale animation and TOP code', () => {
  for (const asset of ['pir-intro-experience.css','pir-intro-experience.js','pir-back-to-top.js','pir-marquee.js']) {
    assert(page.includes(`${asset}?v=20261114t`), `Missing versioned ${asset}`);
  }
});
