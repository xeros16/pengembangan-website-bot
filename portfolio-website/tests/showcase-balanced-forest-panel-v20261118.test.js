import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const css = fs.readFileSync(new URL('../pir-showcase-editorial.css', import.meta.url), 'utf8');
const server = fs.readFileSync(new URL('../server.js', import.meta.url), 'utf8');
const finalFix = css.slice(css.lastIndexOf('Balanced forest panel / artwork fills available area'));

test('desktop showcase keeps an equal editorial split', () => {
  assert.match(finalFix, /grid-template-columns: minmax\(0, 1fr\) minmax\(0, 1fr\) !important/);
  assert.match(finalFix, /grid-template-areas: "copy art" !important/);
});

test('forest green fills the complete right artwork column', () => {
  assert.match(finalFix, /\.pv-showcase-art\s*\{[\s\S]*?width: 100% !important/);
  assert.match(finalFix, /background: linear-gradient\(145deg, #172c20 0%, #20372a 58%, #2b4934 100%\) !important/);
});

test('desktop artwork scales to the available panel area without cropping', () => {
  assert.match(finalFix, /\.pv-showcase-art > img,[\s\S]*?width: 100% !important/);
  assert.match(finalFix, /height: 100% !important/);
  assert.match(finalFix, /object-fit: contain !important/);
  assert.match(finalFix, /object-position: center center !important/);
  assert.match(finalFix, /background: transparent !important/);
});

test('mobile keeps a stacked layout and natural image ratio over forest green', () => {
  assert.match(finalFix, /@media \(max-width: 900px\)[\s\S]*?grid-template-areas: "copy" "art" !important/);
  assert.match(finalFix, /@media \(max-width: 900px\)[\s\S]*?height: auto !important/);
  assert.match(finalFix, /max-block-size: min\(68svh, 520px\) !important/);
  assert.match(finalFix, /background: linear-gradient\(145deg, #172c20 0%, #20372a 58%, #2b4934 100%\) !important/);
});

test('showcase stylesheet cache key is refreshed', () => {
  assert.match(server, /pir-showcase-editorial\.css\?v=20261118-image-fill-center-r/);
});
