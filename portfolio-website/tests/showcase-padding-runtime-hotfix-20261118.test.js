import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const server = fs.readFileSync(new URL('../server.js', import.meta.url), 'utf8');
const css = fs.readFileSync(new URL('../pir-showcase-editorial.css', import.meta.url), 'utf8');
const js = fs.readFileSync(new URL('../pir-home-showcase.js', import.meta.url), 'utf8');

test('work and event slides expose the actual copy column to the inset runtime', () => {
  assert.equal((server.match(/class=\"pv-showcase-copy\" data-pv-showcase-copy/g) || []).length, 2);
  assert.doesNotMatch(server, /pv-showcase-copy-inner/);
});

test('desktop inset is applied directly with inline important styles', () => {
  assert.match(js, /copy\.style\.setProperty\('padding-left', 'clamp\(76px, 6\.8vw, 104px\)', 'important'\)[\s\S]*?copy\.style\.setProperty\('padding-right', 'clamp\(16px, 1\.8vw, 24px\)', 'important'\)/);
  assert.match(js, /copyInsetMedia\.addEventListener/);
  assert.match(js, /copy\.style\.removeProperty\('padding-left'\)[\s\S]*?copy\.style\.removeProperty\('padding-right'\)/);
});

test('CSS fallback targets the copy column without depending on nested wrappers', () => {
  assert.match(server, /pv-showcase-copy-inset-runtime/);
  assert.match(server, /padding-left: clamp\(76px, 6\.8vw, 104px\) !important[\s\S]*?padding-right: clamp\(16px, 1\.8vw, 24px\) !important/);
  assert.match(css, /padding-left:\s*clamp\(76px, 6\.8vw, 104px\)\s*!important[\s\S]*?padding-right:\s*clamp\(16px, 1\.8vw, 24px\)\s*!important/);
});

test('mobile copy and artwork markup remain unchanged', () => {
  assert.match(js, /copyInsetMedia\.matches/);
  assert.match(server, /class="pv-showcase-art"/);
  assert.match(server, /pir-home-showcase\.js\?v=20261118-copy-inset-runtime-h/);
});
