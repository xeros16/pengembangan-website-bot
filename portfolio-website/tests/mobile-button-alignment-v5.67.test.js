import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../server.js', import.meta.url), 'utf8');
const patch = source.slice(source.lastIndexOf('/* v5.67.0 — precise mobile button alignment'));

test('mobile Menu/Tutup toggle has a fixed icon slot and deliberate label gap', () => {
  assert.match(patch, /\.nav-toggle\s*\{[\s\S]*?display:inline-flex!important/);
  assert.match(patch, /\.nav-toggle\s*\{[\s\S]*?align-items:center[\s\S]*?justify-content:center[\s\S]*?gap:12px!important/);
  assert.match(patch, /\.nav-toggle-icon\s*\{[\s\S]*?flex:0 0 22px[\s\S]*?width:22px[\s\S]*?height:22px/);
  assert.match(patch, /\.nav-toggle-label\s*\{[\s\S]*?white-space:nowrap/);
});

test('mobile utility controls use centered icon-label alignment and a consistent touch height', () => {
  assert.match(patch, /\.nav-links\.open \.nav-actions \.nav-action-button\s*\{[\s\S]*?display:inline-flex!important[\s\S]*?align-items:center[\s\S]*?min-height:50px/);
  assert.match(patch, /\.nav-links\.open \.nav-actions \[data-motion-toggle\][\s\S]*?justify-content:center[\s\S]*?gap:9px!important/);
  assert.match(patch, /\.nav-action-button>span:first-child\s*\{[\s\S]*?flex:0 0 21px[\s\S]*?height:21px/);
});

test('mobile Search and Portal desainer occupy full-width rows without squeezing utility labels', () => {
  assert.match(patch, /grid-template-areas:"portal portal" "search search" "motion theme"!important/);
  assert.match(patch, /grid-area:search[\s\S]*?grid-column:1\/-1!important[\s\S]*?justify-content:flex-start[\s\S]*?padding-inline:16px/);
  assert.match(patch, /grid-area:portal[\s\S]*?grid-column:1\/-1!important[\s\S]*?justify-content:center[\s\S]*?min-height:54px/);
  assert.match(patch, /grid-template-columns:repeat\(2,minmax\(0,1fr\)\)!important/);
});

test('narrow phones retain the two-column utility layout and explicit motion/theme grid areas', () => {
  const narrow = patch.slice(patch.lastIndexOf('@media(max-width:380px)'));
  assert.match(narrow, /grid-template-columns:repeat\(2,minmax\(0,1fr\)\)!important/);
  assert.ok(narrow.includes('grid-area:motion!important'));
  assert.ok(narrow.includes('grid-area:theme!important'));
  assert.ok(narrow.includes('gap:11px!important'));
});

test('v5.68.1 retains v5.67.0 mobile alignment and advances cache metadata', () => {
  assert.ok(source.includes("version: '6.7.2'"));
  assert.ok(source.includes("const CACHE='pir-visuals-public-v46'"));
  assert.ok(source.includes('/icon.svg?v=6710'));
});
