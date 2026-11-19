import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const css = fs.readFileSync(new URL('../pir-showcase-editorial.css', import.meta.url), 'utf8');
const js = fs.readFileSync(new URL('../pir-home-showcase.js', import.meta.url), 'utf8');
const server = fs.readFileSync(new URL('../server.js', import.meta.url), 'utf8');

test('showcase measures the visible viewport so classic scrollbars do not create a right-side offset', () => {
  assert.match(js, /document\.documentElement\.clientWidth\s*\|\|\s*window\.innerWidth/);
  assert.match(js, /root\.getBoundingClientRect\(\)\.left/);
  assert.match(js, /--pv-showcase-bleed-width/);
  assert.match(js, /--pv-showcase-bleed-left/);
  assert.match(js, /addEventListener\('resize',\s*syncShowcaseViewport/);
});

test('showcase panels and controls both use the measured full-bleed width and left edge', () => {
  const block = css.slice(css.lastIndexOf('Full-bleed viewport alignment without scrollbar drift'));
  assert.match(block, /\.pv-showcase-panels,[\s\S]*?\.pv-showcase-controls/);
  assert.match(block, /width:\s*var\(--pv-showcase-bleed-width, 100vw\) !important/);
  assert.match(block, /max-width:\s*var\(--pv-showcase-bleed-width, 100vw\) !important/);
  assert.match(block, /margin-left:\s*var\(--pv-showcase-bleed-left, calc\(50% - 50vw\)\) !important/);
});

test('new CSS and JS cache keys are served together', () => {
  assert.match(server, /pir-showcase-editorial\.css\?v=20261118-fullbleed-visible-viewport-t/);
  assert.match(server, /pir-home-showcase\.js\?v=20261118-fullbleed-visible-viewport-t/);
});
