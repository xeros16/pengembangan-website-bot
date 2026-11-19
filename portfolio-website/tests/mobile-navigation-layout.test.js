import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../server.js', import.meta.url), 'utf8');
const mobileBlock = source.slice(source.lastIndexOf('/* v5.66.0 — mobile navigation spacing'), source.lastIndexOf('/* v5.67.0 — precise mobile button alignment'));

test('mobile navigation panel aligns to the header and stays within the phone viewport', () => {
  assert.match(mobileBlock, /\.nav-links\.open\s*\{[\s\S]*?left:0;right:0;width:100%;max-width:100%/);
  assert.match(mobileBlock, /max-height:calc\(100dvh - 108px\)/);
  assert.match(mobileBlock, /overflow-y:auto/);
  assert.match(mobileBlock, /overscroll-behavior:contain/);
});

test('mobile primary links and menu controls have comfortable touch targets', () => {
  assert.match(mobileBlock, /\.nav-links\.open \.nav-primary>a\s*\{[\s\S]*?min-height:50px/);
  assert.match(mobileBlock, /\.nav-links\.open \.nav-more>summary\s*\{[\s\S]*?min-height:50px/);
  assert.match(mobileBlock, /\.nav-links\.open \.nav-actions \.nav-cta\s*\{[\s\S]*?min-height:52px/);
  assert.match(mobileBlock, /data-motion-toggle\][\s\S]*?min-height:49px/);
});

test('mobile utility actions are not squeezed into the old three-column row', () => {
  assert.match(mobileBlock, /\.nav-links\.open \.nav-actions\s*\{[\s\S]*?grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(mobileBlock, /\.nav-links\.open \.nav-actions \[data-command-open\]\s*\{[\s\S]*?grid-column:1\/-1/);
  assert.match(mobileBlock, /@media\(max-width:380px\)\s*\{[\s\S]*?grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
});

test('mobile utility controls preserve explicit light and dark surfaces', () => {
  assert.match(mobileBlock, /\[data-theme="light"\] \.nav-links\.open \.nav-actions/);
  assert.match(mobileBlock, /\[data-theme="dark"\] \.nav-links\.open \.nav-actions/);
});

test('release metadata and service-worker cache are advanced', () => {
  assert.ok(source.includes("version: '6.7.2'"));
  assert.ok(source.includes("const CACHE='pir-visuals-public-v46'"));
  assert.ok(source.includes('/icon.svg?v=6710'));
});
