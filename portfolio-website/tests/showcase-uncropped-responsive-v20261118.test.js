import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const css = fs.readFileSync(new URL('../pir-showcase-editorial.css', import.meta.url), 'utf8');
const server = fs.readFileSync(new URL('../server.js', import.meta.url), 'utf8');
const finalFix = css.slice(css.lastIndexOf('Maximize desktop artwork inside the forest frame'));
const mobileFix = css.slice(css.lastIndexOf('Mobile artwork full-width correction'));

test('desktop artwork fills the available frame and preserves the complete source ratio', () => {
  assert.match(finalFix, /width: 100% !important[\s\S]*?height: 100% !important/);
  assert.match(finalFix, /max-width: 100% !important[\s\S]*?max-height: 100% !important/);
  assert.match(finalFix, /object-fit: contain !important/);
  assert.match(finalFix, /object-position: center center !important/);
});

test('forest gradient stays behind the image while the image remains transparent', () => {
  assert.match(finalFix, /\.pv-showcase-art:has\(> img\)[\s\S]*?background: linear-gradient/);
  assert.match(finalFix, /background: transparent !important/);
});

test('mobile rules preserve intrinsic image ratio without forcing a cropped height', () => {
  assert.match(mobileFix, /@media \(max-width: 900px\)[\s\S]*?height: auto !important/);
  assert.match(mobileFix, /max-block-size: none !important/);
  assert.match(mobileFix, /object-fit: contain !important/);
});

test('showcase stylesheet cache key is updated', () => {
  assert.match(server, /pir-showcase-editorial\.css\?v=20261119-heading-zoom-safe-b/);
});
