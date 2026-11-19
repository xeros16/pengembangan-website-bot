import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const css = fs.readFileSync(new URL('../pir-showcase-editorial.css', import.meta.url), 'utf8');
const server = fs.readFileSync(new URL('../server.js', import.meta.url), 'utf8');

test('desktop showcase height follows natural media ratio without crop', () => {
  assert.match(css, /Desktop artwork ratio-led layout/);
  assert.match(css, /@media \(min-width: 901px\)/);
  assert.match(css, /\.pv-showcase-art > img,[\s\S]*?block-size:\s*auto\s*!important/);
  assert.match(css, /object-fit:\s*contain\s*!important/);
  assert.match(css, /min-block-size:\s*0\s*!important/);
  assert.match(css, /min-block-size:\s*0\s*!important/);
});

test('desktop natural-ratio changes are scoped above the mobile breakpoint', () => {
  const start = css.lastIndexOf('Desktop artwork ratio-led layout');
  const end = css.indexOf('Restore consistent desktop editorial typography', start);
  const block = css.slice(start, end > start ? end : css.length);
  assert.match(block, /@media \(min-width: 901px\)/);
  assert.match(block, /@media \(max-width: 1100px\)/);
  assert.doesNotMatch(block, /@media \(max-width: 900px\)/);
});

test('latest showcase stylesheet is cache-busted', () => {
  assert.match(server, /pir-showcase-editorial\.css\?v=20261118-image-fill-center-r/);
});
