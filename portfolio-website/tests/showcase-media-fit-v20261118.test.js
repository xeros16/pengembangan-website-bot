import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const css = fs.readFileSync(new URL('../pir-agency-system.css', import.meta.url), 'utf8');
const server = fs.readFileSync(new URL('../server.js', import.meta.url), 'utf8');

test('homepage showcase media shrinks to intrinsic media ratio instead of a fixed empty frame', () => {
  assert.match(css, /\.pv-showcase-art\s*\{[\s\S]*?inline-size:\s*fit-content;/);
  assert.match(css, /\.pv-showcase-art\s*\{[\s\S]*?aspect-ratio:\s*auto;/);
  assert.match(css, /\.pv-showcase-art\s*>\s*img[\s\S]*?inline-size:\s*auto;/);
  assert.match(css, /\.pv-showcase-art\s*>\s*img[\s\S]*?block-size:\s*auto;/);
  assert.match(css, /max-block-size:\s*min\(62svh,\s*560px\)/);
  assert.doesNotMatch(css, /\.pv-showcase-art\s*\{[\s\S]*?aspect-ratio:\s*16\/10;/);
});

test('homepage showcase stylesheet cache version is bumped for the media-fit fix', () => {
  assert.match(server, /pir-agency-system\.css\?v=20261118c/);
});
