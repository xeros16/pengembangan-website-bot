import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const css = fs.readFileSync(new URL('../pir-showcase-editorial.css', import.meta.url), 'utf8');
const server = fs.readFileSync(new URL('../server.js', import.meta.url), 'utf8');
const js = fs.readFileSync(new URL('../pir-home-showcase.js', import.meta.url), 'utf8');

test('desktop aligns right-side details to the copy panel edge without translating them', () => {
  assert.match(css, /@media \(min-width: 901px\)[\s\S]*?\.pv-showcase-meta strong[\s\S]*?position: static !important;[\s\S]*?left: auto !important/);
  assert.match(css, /\.pv-showcase-byline::before[\s\S]*?right: 0 !important/);
  assert.match(server, /pv-showcase-right-details-align/);
  assert.match(server, /position: static !important; left: auto !important/);
});

test('runtime clears stale inline offsets from price and creator link', () => {
  assert.match(js, /copy\.querySelectorAll\('\.pv-showcase-meta strong, \.pv-showcase-byline a'\)[\s\S]*?item\.style\.removeProperty\('left'\)/);
  assert.match(js, /root\.dataset\.copyInsetRuntime = '20261118h'/);
});

test('mobile removes the desktop-only text shift and preserves prior padding behavior', () => {
  assert.match(js, /item\.style\.removeProperty\('left'\)/);
  assert.match(js, /copy\.style\.removeProperty\('padding-left'\)[\s\S]*?copy\.style\.removeProperty\('padding-right'\)/);
});

test('image column and media fit are untouched', () => {
  assert.match(server, /class="pv-showcase-art"/);
  assert.doesNotMatch(css.slice(css.lastIndexOf('Move only the right-aligned carousel details')), /pv-showcase-art|object-fit|grid-template-columns|background/);
});
