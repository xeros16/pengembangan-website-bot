import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const css = fs.readFileSync(new URL('../pir-public-polish.css', import.meta.url), 'utf8');
const server = fs.readFileSync(new URL('../server.js', import.meta.url), 'utf8');

test('community showcase uses an editorial split layout with compact category rail', () => {
  assert.match(css, /width:min\(100%,1280px\)\s*!important/);
  assert.match(css, /grid-template-columns:minmax\(0,1\.25fr\) minmax\(260px,\.75fr\)\s*!important/);
  assert.match(css, /pv-showcase-tabs button\.is-active[\s\S]*?background:#244b34\s*!important/);
  assert.match(css, /grid-template-columns:minmax\(0,1\.15fr\) minmax\(330px,\.85fr\)\s*!important/);
});

test('showcase media preserves intrinsic ratio and avoids a fixed 16:10 frame in the revision', () => {
  const revision = css.slice(css.lastIndexOf('v3.61.0'));
  assert.match(revision, /aspect-ratio:auto\s*!important/);
  assert.match(revision, /pv-showcase-art>img[\s\S]*?width:auto\s*!important/);
  assert.match(revision, /pv-showcase-art>img[\s\S]*?height:auto\s*!important/);
  assert.doesNotMatch(revision, /aspect-ratio:16\/10\s*!important/);
});

test('stylesheet cache is bumped for the editorial showcase revision', () => {
  assert.match(server, /pir-public-polish\.css\?v=20261118bj&rev=3613/);
});
