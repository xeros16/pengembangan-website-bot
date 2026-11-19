import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const css = fs.readFileSync(new URL('../pir-showcase-editorial.css', import.meta.url), 'utf8');
const server = fs.readFileSync(new URL('../server.js', import.meta.url), 'utf8');
const finalFix = css.slice(css.lastIndexOf('Maximize desktop artwork inside the forest frame'));

test('forest panel fills the full right column with a small balanced inset', () => {
  assert.match(finalFix, /grid[\s\S]*?place-items: center !important/);
  assert.match(finalFix, /width: 100% !important[\s\S]*?height: 100% !important/);
  assert.match(finalFix, /padding: clamp\(6px, \.65vw, 9px\) !important/);
  assert.match(finalFix, /background: linear-gradient\(145deg, #172c20 0%, #20372a 58%, #2b4934 100%\) !important/);
});

test('artwork remains uncropped and decorative rings stay removed', () => {
  assert.match(finalFix, /object-fit: contain !important/);
  assert.match(finalFix, /object-position: center center !important/);
  assert.match(finalFix, /width: 100% !important[\s\S]*?height: 100% !important/);
  assert.match(css, /\.pv-showcase-slide::after[\s\S]*?content: none !important/);
});

test('mobile keeps the stacked layout and natural image height', () => {
  const mobile = css.slice(css.lastIndexOf('Mobile artwork full-width correction'));
  assert.match(mobile, /@media \(max-width: 900px\)[\s\S]*?grid-template-areas: \"copy\" \"art\"/);
  assert.match(mobile, /height: auto !important/);
  assert.match(mobile, /object-fit: contain !important/);
});

test('latest carousel stylesheet is cache-busted', () => {
  assert.match(server, /pir-showcase-editorial\.css\?v=20261118-image-fill-center-r/);
});
