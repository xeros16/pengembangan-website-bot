import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const css = fs.readFileSync(new URL('../pir-showcase-editorial.css', import.meta.url), 'utf8');
const server = fs.readFileSync(new URL('../server.js', import.meta.url), 'utf8');
const finalFix = css.slice(css.lastIndexOf('Compact forest media panel (final correction)'));

test('desktop forest background is confined to the artwork panel, not the controls rail', () => {
  assert.match(finalFix, /\.pv-showcase-panel\s*\{\s*background:\s*transparent !important/);
  assert.match(finalFix, /\.pv-showcase-art[\s\S]*?background:\s*linear-gradient\(145deg, #172c20 0%, #20372a 58%, #2b4934 100%\) !important/);
});

test('desktop image fills the available green panel while preserving the full image', () => {
  assert.match(finalFix, /\.pv-showcase-art > img,[\s\S]*?inline-size:\s*100% !important[\s\S]*?block-size:\s*100% !important/);
  assert.match(finalFix, /object-fit:\s*contain !important/);
  assert.match(finalFix, /object-position:\s*center center !important/);
});

test('mobile keeps stacked responsive layout and uncropped natural image height', () => {
  assert.match(finalFix, /@media \(max-width: 900px\)[\s\S]*?grid-template-areas:\s*"copy" "art" !important/);
  assert.match(finalFix, /@media \(max-width: 900px\)[\s\S]*?height:\s*auto !important/);
  assert.match(finalFix, /max-block-size:\s*min\(68svh, 520px\) !important/);
  assert.match(finalFix, /object-fit:\s*contain !important/);
});

test('showcase stylesheet cache key is refreshed', () => {
  assert.match(server, /pir-showcase-editorial\.css\?v=20261118-image-fill-center-r/);
});
