import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const js = readFileSync(new URL('../pir-shared-ornaments.js',import.meta.url),'utf8');
const css = readFileSync(new URL('../pir-public-polish.css',import.meta.url),'utf8');
const server = readFileSync(new URL('../server.js',import.meta.url),'utf8');

test('shared ornament enhances existing secondary hero seals, not Discover', () => {
  assert.match(js,/querySelector\(':scope > \.hero:not\(\.pv-hero\):not\(\.legal-copy\)'\)/);
  assert.match(js,/!hero\.querySelector\('\.stat-grid'\)/);
  assert.match(js,/querySelector\(':scope > \.shortlist-hero'\)/);
  assert.match(js,/host\.classList\.add\('pv-shared-seal-host'\)/);
});
test('shared ornament reproduces five Discover satellites and full PIR seal', () => {
  for (const name of ['star','star2','dots','leaf','pencil']) {
    assert.match(js, new RegExp(`\\['${name}'`));
  }
  assert.match(js,/logo\.src = '\/pir-footer-seal\.svg'/);
  assert.match(js,/const footerSeal = root\.querySelector/);
});
test('shared seal remains centered, outside flow, mobile-safe, and reduced-motion aware', () => {
  assert.match(css,/\.pv-shared-seal-host > \.pv-discover-ornament\.pv-shared-seal\s*\{\s*position:absolute !important/);
  assert.match(css,/top:50% !important;/);
  assert.match(css,/transform:translateY\(-50%\) !important;/);
  assert.match(css,/@media\(max-width:760px\)\s*\{/);
  assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
  assert.match(css,/html\[data-pv-motion="off"\]/);
});
test('shared script is linked from full website shell and served as a static asset', () => {
  assert.match(server,/pir-shared-ornaments\.js\?v=20261115ar/);
  assert.match(server,/pir-public-polish\.css\?v=20261115ar/);
  assert.match(server,/'pir-shared-ornaments\.js'\]\.includes\(parts\[0\]\)/);
});
