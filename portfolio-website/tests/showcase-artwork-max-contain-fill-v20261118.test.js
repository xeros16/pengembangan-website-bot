import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const css = fs.readFileSync(new URL('../pir-showcase-editorial.css', import.meta.url), 'utf8');
const server = fs.readFileSync(new URL('../server.js', import.meta.url), 'utf8');
const fix = css.slice(css.lastIndexOf('Maximize desktop artwork inside the forest frame'));

test('desktop green frame fills the full right column and keeps the artwork centered', () => {
  assert.match(fix, /@media \(min-width: 901px\)/);
  assert.match(fix, /\.pv-showcase-art:has\(> img\)[\s\S]*?display: grid !important[\s\S]*?place-items: center !important/);
  assert.match(fix, /justify-self: stretch !important[\s\S]*?align-self: stretch !important/);
  assert.match(fix, /width: 100% !important[\s\S]*?height: 100% !important/);
  assert.match(fix, /padding: clamp\(6px, \.65vw, 9px\) !important/);
  assert.match(fix, /background: linear-gradient\(145deg, #172c20 0%, #20372a 58%, #2b4934 100%\) !important/);
});

test('artwork scales up to the frame while contain preserves its full ratio without cropping', () => {
  assert.match(fix, /\.pv-showcase-art:has\(> img\) > img,[\s\S]*?width: 100% !important[\s\S]*?height: 100% !important/);
  assert.match(fix, /max-width: 100% !important[\s\S]*?max-height: 100% !important/);
  assert.match(fix, /object-fit: contain !important/);
  assert.match(fix, /object-position: center center !important/);
  assert.doesNotMatch(fix, /object-fit: cover/);
  assert.doesNotMatch(fix, /transform: scale\(/);
});

test('copy column and mobile artwork rules are not changed by this desktop-only override', () => {
  assert.doesNotMatch(fix, /pv-showcase-copy|grid-template-columns|grid-template-areas|@media \(max-width:/);
  assert.match(server, /pir-showcase-editorial\.css\?v=20261118-image-fill-center-r/);
});
