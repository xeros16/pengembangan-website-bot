import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const css = fs.readFileSync(new URL('../pir-showcase-bettr-editorial.css', import.meta.url), 'utf8');
const js = fs.readFileSync(new URL('../pir-home-showcase.js', import.meta.url), 'utf8');
const server = fs.readFileSync(new URL('../server.js', import.meta.url), 'utf8');

test('showcase uses an editorial split carousel composition instead of a generic card frame', () => {
  assert.match(css, /grid-template-areas:\s*"copy art"/);
  assert.match(css, /grid-template-columns:\s*minmax\(0,\s*\.88fr\)\s+minmax\(0,\s*1\.12fr\)/);
  assert.match(css, /background:\s*#e9c65d/);
  assert.match(css, /box-shadow:\s*0 18px 45px/);
  assert.match(css, /pv-showcase-tabs button::after/);
  assert.match(css, /pv-showcase-slide\[data-index="0"\]::before/);
});

test('showcase media is classified by intrinsic aspect ratio so portrait and landscape work use the available frame intelligently', () => {
  assert.match(js, /const classifyMedia = slide =>/);
  assert.match(js, /media\.naturalWidth/);
  assert.match(js, /media\.videoWidth/);
  assert.match(js, /is-portrait/);
  assert.match(js, /is-landscape/);
  assert.match(js, /is-square/);
  assert.match(css, /pv-showcase-art\.is-portrait/);
  assert.match(css, /pv-showcase-art\.is-landscape/);
});

test('new showcase stylesheet is served and loaded after the agency system', () => {
  assert.match(server, /pir-agency-system\.css\?v=20261118c"><link rel="stylesheet" href="\/pir-showcase-bettr-editorial\.css\?v=20261118d"/);
  assert.match(server, /'pir-showcase-bettr-editorial\.css'/);
});
