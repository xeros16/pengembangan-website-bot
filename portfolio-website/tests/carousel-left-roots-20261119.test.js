import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const css = fs.readFileSync(new URL('../pir-showcase-editorial.css', import.meta.url), 'utf8');
const server = fs.readFileSync(new URL('../server.js', import.meta.url), 'utf8');

test('the superseded root ornament is replaced by the current branch ornament', () => {
  assert.match(css, /Subtle tree-branch ornament on the LEFT copy panel only/);
  assert.match(css, /background-image: url\('\/pir-carousel-branches-left\.svg\?v=20261119b'\)/);
  assert.doesNotMatch(css, /pir-carousel-roots-left\.svg/);
  assert.match(server, /pir-carousel-branches-left\.svg/);
  assert.doesNotMatch(server, /pir-carousel-roots-left\.svg/);
});
