import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../pir-public-polish.css', import.meta.url), 'utf8');
const server = readFileSync(new URL('../server.js', import.meta.url), 'utf8');
const block = css.split('PIR Visuals / 2026-11-16ay')[1] || '';

test('Moodboard intro and builder stage meet without the inherited hero gap', () => {
  assert.match(block, /#main-content\.wrap:has\(> \.pv-collection-builder\) > \.hero:not\(\.pv-hero\)\s*\{[\s\S]*?margin-bottom:0 !important/);
  assert.match(block, /#main-content\.wrap:has\(> \.pv-collection-builder\) > \.pv-collection-builder\s*\{[\s\S]*?margin-top:0 !important/);
  assert.match(server, /function renderMoodboardPage[\s\S]*?<section class="hero"[\s\S]*?\$\{content\}/);
});

test('Category wrapper removes its top inset without widening the category tile grid', () => {
  assert.match(block, /#main-content\.wrap:has\(> \.category-editorial\)\s*\{[\s\S]*?padding-top:0 !important/);
  assert.match(block, /#main-content\.wrap:has\(> \.category-editorial\) > \.category-editorial\s*\{[\s\S]*?padding-top:0 !important/);
  assert.match(css, /#main-content\.wrap > \.category-editorial > :is\(\.category-intro,\.category-index,\.category-recent\)/);
});

test('Category intro masthead is viewport-wide while its section content remains intact', () => {
  assert.match(block, /\.category-editorial > \.category-intro\s*\{[\s\S]*?width:100vw !important/);
  assert.match(block, /\.category-editorial > \.category-intro\s*\{[\s\S]*?max-width:100vw !important/);
  assert.match(block, /\.category-editorial > \.category-intro\s*\{[\s\S]*?margin-left:calc\(50% - 50vw\) !important/);
  assert.match(server, /<h1>Find your<br><em>creative language\.<\/em><\/h1>/);
  assert.match(server, /<section class="category-index">/);
});

test('Browser cache is refreshed for the revised public layout stylesheet', () => {
  assert.match(server, /pir-public-polish\.css\?v=20261116ay/);
});
