import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const css = fs.readFileSync(new URL('../pir-showcase-editorial.css', import.meta.url), 'utf8');
const layout = css.slice(css.lastIndexOf('Full-bleed showcase split (corrected)'));

test('keeps the existing heading and tabs outside the full-bleed breakout', () => {
  assert.match(layout, /\.pv-showcase-panels\s*\{[\s\S]*?width:\s*100vw !important/);
  assert.doesNotMatch(layout, /\.pv-showcase-heading\s*\{/);
  assert.doesNotMatch(layout, /\.pv-showcase-tabs\s*\{/);
});

test('carousel panels span the viewport with no added copy border', () => {
  assert.match(layout, /margin-left:\s*calc\(50% - 50vw\) !important/);
  assert.match(layout, /\.pv-showcase-panel\s*\{[\s\S]*?max-width:\s*none !important/);
  assert.match(layout, /\.pv-showcase-copy\s*\{[\s\S]*?border:\s*0 !important/);
  assert.match(layout, /grid-template-columns:\s*minmax\(0, 1fr\) minmax\(0, 1fr\) !important/);
});

test('image sizing and crop behavior are not overridden by the layout patch', () => {
  assert.doesNotMatch(layout, /object-fit|object-position|\.pv-showcase-art\s*\{/);
});

test('mobile retains the stacked text-then-art structure and full-width controls', () => {
  assert.match(layout, /@media \(max-width: 900px\)[\s\S]*?grid-template-areas:\s*"copy" "art"/);
  assert.match(layout, /\.pv-showcase-controls\s*\{[\s\S]*?width:\s*100% !important/);
});
