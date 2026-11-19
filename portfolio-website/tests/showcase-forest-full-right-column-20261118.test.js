import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const css = fs.readFileSync(new URL('../pir-showcase-editorial.css', import.meta.url), 'utf8');
const server = fs.readFileSync(new URL('../server.js', import.meta.url), 'utf8');
const backdrop = css.slice(css.lastIndexOf('Full desktop forest backdrop to marked bounds'));
const fix = css.slice(css.lastIndexOf('Maximize desktop artwork inside the forest frame'));

test('desktop forest backdrop fills the complete right column and controls rail', () => {
  assert.match(backdrop, /@media\s*\(min-width:\s*901px\)/);
  assert.match(backdrop, /\.pv-showcase-panel\s*\{[\s\S]*?linear-gradient\([\s\S]*?transparent 50%[\s\S]*?#172c20 50%[\s\S]*?#2b4934 100%/);
});

test('uploaded image scales to the full available frame without losing its aspect ratio', () => {
  assert.match(fix, /\.pv-showcase-art:has\(> img\)[\s\S]*?justify-self: stretch !important[\s\S]*?align-self: stretch !important/);
  assert.match(fix, /\.pv-showcase-art:has\(> img\) > img,[\s\S]*?width: 100% !important[\s\S]*?height: 100% !important/);
  assert.match(fix, /max-width: 100% !important[\s\S]*?max-height: 100% !important/);
  assert.match(fix, /object-fit: contain !important/);
  assert.match(fix, /object-position: center center !important/);
  assert.doesNotMatch(fix, /object-fit: cover/);
});

test('only desktop showcase CSS cache is refreshed; mobile rules remain scoped separately', () => {
  assert.match(server, /pir-showcase-editorial\.css\?v=20261118-image-fill-center-r/);
  assert.match(fix, /@media\s*\(min-width:\s*901px\)/);
});
