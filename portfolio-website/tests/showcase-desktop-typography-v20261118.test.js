import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const css = fs.readFileSync(new URL('../pir-showcase-editorial.css', import.meta.url), 'utf8');
const server = fs.readFileSync(new URL('../server.js', import.meta.url), 'utf8');

test('desktop showcase title retains a consistent editorial scale', () => {
  assert.match(css, /font-size:\s*clamp\(48px,\s*5\.4vw,\s*84px\)\s*!important/);
  assert.match(css, /font-size:\s*14px\s*!important/);
  assert.match(css, /justify-content:\s*center\s*!important/);
});

test('desktop typography override is isolated from tablet and mobile', () => {
  assert.match(css, /@media\s*\(min-width:\s*901px\)/);
});

test('showcase stylesheet cache version is refreshed', () => {
  assert.match(server, /pir-showcase-editorial\.css\?v=20261118-image-fill-center-r/);
});
