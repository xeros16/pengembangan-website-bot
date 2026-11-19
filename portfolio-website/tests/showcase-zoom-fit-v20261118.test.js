import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const css = fs.readFileSync(new URL('../pir-showcase-editorial.css', import.meta.url), 'utf8');
const server = fs.readFileSync(new URL('../server.js', import.meta.url), 'utf8');
const finalFix = css.slice(css.lastIndexOf('Maximize desktop artwork inside the forest frame'));

test('showcase artwork uses the full forest frame instead of being limited to its intrinsic size', () => {
  assert.match(finalFix, /\.pv-showcase-art:has\(> img\)[\s\S]*?width: 100% !important[\s\S]*?height: 100% !important/);
  assert.match(finalFix, /background: linear-gradient\(145deg, #172c20 0%, #20372a 58%, #2b4934 100%\) !important/);
  assert.match(finalFix, /object-fit: contain !important/);
  assert.match(finalFix, /object-position: center center !important/);
  assert.match(finalFix, /max-width: 100% !important[\s\S]*?max-height: 100% !important/);
  assert.doesNotMatch(finalFix, /max-width: min\(100%,\s*560px\)/);
});

test('showcase zoom-fit stylesheet is cache-busted', () => {
  assert.match(server, /pir-showcase-editorial\.css\?v=20261118-image-fill-center-r/);
});
