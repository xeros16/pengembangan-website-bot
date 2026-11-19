import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const css = fs.readFileSync(new URL('../pir-showcase-editorial.css', import.meta.url), 'utf8');
const server = fs.readFileSync(new URL('../server.js', import.meta.url), 'utf8');
const js = fs.readFileSync(new URL('../pir-home-showcase.js', import.meta.url), 'utf8');

const LEFT = 'clamp(108px, 8.8vw, 132px)';
const RIGHT = 'clamp(16px, 1.8vw, 24px)';

test('only the desktop left-copy inset is increased', () => {
  assert.ok(js.includes(`padding-left', '${LEFT}'`));
  assert.ok(css.includes(`padding-left: ${LEFT} !important`));
  assert.ok(server.includes(`padding-left: ${LEFT} !important`));
});

test('the right inset remains exactly at its previous runtime value', () => {
  assert.ok(js.includes(`padding-right', '${RIGHT}'`));
  assert.ok(css.includes(`padding-right: ${RIGHT} !important`));
  assert.ok(server.includes(`padding-right: ${RIGHT} !important`));
});

test('the artwork column, image ratio, and responsive layout are not targeted by this patch', () => {
  const start = css.lastIndexOf('Left-only correction');
  const patch = css.slice(start);
  assert.doesNotMatch(patch, /pv-showcase-art|object-fit|grid-template-columns/);
  assert.match(server, /class="pv-showcase-art"/);
  assert.match(js, /copyInsetMedia\.matches/);
  assert.match(js, /copy\.style\.removeProperty\('padding-left'\)[\s\S]*?copy\.style\.removeProperty\('padding-right'\)/);
});

test('new runtime and asset cache keys are active', () => {
  assert.match(js, /root\.dataset\.copyInsetRuntime = '20261118l'/);
  assert.match(server, /pir-showcase-editorial\.css\?v=20261118-left-only-inset-l/);
  assert.match(server, /pir-home-showcase\.js\?v=20261118-left-only-inset-l/);
});
