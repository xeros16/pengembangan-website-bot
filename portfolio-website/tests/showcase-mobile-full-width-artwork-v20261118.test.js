import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../pir-showcase-editorial.css', import.meta.url), 'utf8');
const marker = '2026-11-18 — Mobile artwork full-width correction';
const fix = css.slice(css.lastIndexOf(marker));

test('mobile showcase artwork fills its media column without green backing or height caps', () => {
  assert.match(fix, /@media\s*\(max-width:\s*900px\)/);
  assert.match(fix, /\.pv-showcase-art[\s\S]*?inline-size:\s*100% !important/);
  assert.match(fix, /\.pv-showcase-art[\s\S]*?padding:\s*0 !important/);
  assert.match(fix, /\.pv-showcase-art[\s\S]*?background:\s*transparent !important/);
  assert.match(fix, /\.pv-showcase-art\.is-portrait\s*>\s*img[\s\S]*?width:\s*100% !important/);
  assert.match(fix, /\.pv-showcase-art\.is-portrait\s*>\s*img[\s\S]*?max-width:\s*100% !important/);
  assert.match(fix, /\.pv-showcase-art\.is-portrait\s*>\s*img[\s\S]*?max-height:\s*none !important/);
  assert.match(fix, /object-fit:\s*contain !important/);
  assert.match(fix, /height:\s*auto !important/);
});
