import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const css = fs.readFileSync(new URL('../pir-showcase-editorial.css', import.meta.url), 'utf8');
const js = fs.readFileSync(new URL('../pir-home-showcase.js', import.meta.url), 'utf8');
const server = fs.readFileSync(new URL('../server.js', import.meta.url), 'utf8');

test('showcase uses PIR Visuals editorial identity instead of external brand styling', () => {
  assert.match(css, /--pir-showcase-forest:\s*#20372a/);
  assert.match(css, /--pir-showcase-sage:\s*#c7daaf/);
  assert.match(css, /grid-template-areas:\s*"copy art"/);
  assert.match(css, /background:\s*#e4ecdb/);
  assert.match(css, /linear-gradient\(145deg,\s*#1b3123 0%,\s*#20372a 58%,\s*#2d4d37 100%\)/);
  assert.match(css, /PIR VISUALS \/ COMMUNITY/);
  assert.doesNotMatch(css, /#e9c65d|#e2b39a/);
  assert.doesNotMatch(css, /#f0b52d|#e9c65d|#e2b39a/);
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
  assert.match(css, /object-fit:\s*contain/);
});

test('showcase stylesheet is served after the agency system with a fresh cache version', () => {
  assert.match(server, /pir-agency-system\.css\?v=20261118c"><link rel="stylesheet" href="\/pir-showcase-editorial\.css\?v=20261119-heading-zoom-safe-b"><link rel="stylesheet" href="\/pir-desktop-refinement\.css\?v=20261119a"/);
});
