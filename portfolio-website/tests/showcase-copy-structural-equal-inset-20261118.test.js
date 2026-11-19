import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const server = fs.readFileSync(new URL('../server.js', import.meta.url), 'utf8');
const css = fs.readFileSync(new URL('../pir-showcase-editorial.css', import.meta.url), 'utf8');
const js = fs.readFileSync(new URL('../pir-home-showcase.js', import.meta.url), 'utf8');

test('work and event slides mark the complete text column directly', () => {
  assert.equal((server.match(/class=\"pv-showcase-copy\" data-pv-showcase-copy/g) || []).length, 2);
  assert.doesNotMatch(server, /pv-showcase-copy-inner/);
});

test('desktop left inset stays generous while right-side details remain within the copy panel', () => {
  assert.ok(js.includes("copy.style.setProperty('padding-left', 'clamp(76px, 6.8vw, 104px)', 'important')"));
  assert.match(css, /padding-left:\s*clamp\(76px, 6\.8vw, 104px\)\s*!important[\s\S]*?padding-right:\s*clamp\(16px, 1\.8vw, 24px\)\s*!important/);
  assert.match(server, /padding-left: clamp\(76px, 6\.8vw, 104px\) !important[\s\S]*?padding-right: clamp\(16px, 1\.8vw, 24px\) !important/);
});

test('runtime removes desktop inline padding on mobile', () => {
  assert.match(js, /copy\.style\.removeProperty\('padding-left'\)[\s\S]*?copy\.style\.removeProperty\('padding-right'\)/);
  assert.match(server, /@media \(min-width: 901px\)/);
});

test('image markup and carousel columns are not modified by the inset patch', () => {
  assert.match(server, /class="pv-showcase-art"/);
  assert.doesNotMatch(css.slice(css.lastIndexOf('Desktop carousel copy inset')), /pv-showcase-art|object-fit|grid-template-columns/);
});

test('stylesheet and runtime script cache keys are refreshed', () => {
  assert.match(server, /pir-showcase-editorial\.css\?v=20261118-copy-inset-runtime-h/);
  assert.match(server, /pir-home-showcase\.js\?v=20261118-copy-inset-runtime-h/);
});
