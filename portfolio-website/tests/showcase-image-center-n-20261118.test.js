import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const css = fs.readFileSync(new URL('../pir-showcase-editorial.css', import.meta.url), 'utf8');
const server = fs.readFileSync(new URL('../server.js', import.meta.url), 'utf8');
const fix = css.slice(css.lastIndexOf('Maximize desktop artwork inside the forest frame'));

test('desktop artwork frame fills the green column and stays centered on both axes', () => {
  assert.match(fix, /@media \(min-width: 901px\)/);
  assert.match(fix, /display: grid !important[\s\S]*?place-items: center !important/);
  assert.match(fix, /justify-self: stretch !important[\s\S]*?align-self: stretch !important/);
  assert.match(fix, /width: 100% !important[\s\S]*?height: 100% !important/);
  assert.match(fix, /padding: clamp\(6px, \.65vw, 9px\) !important/);
});

test('desktop artwork scales to the largest contain size without cropping or stretching', () => {
  assert.match(fix, /\.pv-showcase-art:has\(> img\) > img,[\s\S]*?width: 100% !important[\s\S]*?height: 100% !important/);
  assert.match(fix, /max-width: 100% !important[\s\S]*?max-height: 100% !important/);
  assert.match(fix, /object-fit: contain !important/);
  assert.match(fix, /object-position: center center !important/);
  assert.doesNotMatch(fix, /object-fit: cover|transform: scale\(/);
});

test('desktop-only image revision leaves copy column and mobile rules untouched', () => {
  assert.doesNotMatch(fix, /pv-showcase-copy|grid-template-columns|grid-template-areas|@media \(max-width:/);
  assert.match(server, /pir-showcase-editorial\.css\?v=20261118-image-fill-center-r/);
});
