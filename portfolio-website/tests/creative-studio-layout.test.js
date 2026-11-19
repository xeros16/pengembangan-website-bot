import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const server = fs.readFileSync(new URL('../server.js', import.meta.url), 'utf8');
const layout = fs.readFileSync(new URL('../pir-creative-studio-layout.css', import.meta.url), 'utf8');

test('Creative Studio uses one centered content rail for the hero, feature grid, and CTA', () => {
  assert.ok(server.includes('class="pv-creative-hero-inner"'));
  assert.ok(server.includes('class="pv-creative-hero-copy"'));
  assert.ok(server.includes('class="pv-creative-hero-summary"'));
  assert.ok(server.includes('class="pv-creative-grid-inner"'));
  assert.ok(server.includes('class="pv-creative-bottom-inner"'));
  assert.ok(server.includes('pir-creative-studio-layout.css?v=20261116az'));
  assert.ok(layout.includes('width:min(var(--pv-creative-content-width),100%)'));
  assert.ok(layout.includes('margin:0 auto !important'));
});

test('Creative Studio card grid has even spacing, equal row stretching, and a mobile stack', () => {
  assert.ok(layout.includes('grid-template-columns:repeat(2,minmax(0,1fr)) !important'));
  assert.ok(layout.includes('align-items:stretch !important'));
  assert.ok(layout.includes('gap:clamp(18px,2vw,26px) !important'));
  assert.ok(layout.includes('grid-template-columns:minmax(0,1fr) !important'));
  assert.ok(layout.includes('@media(max-width:760px)'));
  assert.ok(layout.includes('margin-top:0 !important'));
});

test('Creative Studio hero stacks its summary below the title and preserves the right-side ornament area', () => {
  assert.ok(layout.includes('grid-template-columns:minmax(0,1fr);'));
  assert.ok(layout.includes('justify-items:start;'));
  assert.ok(layout.includes('max-width:min(100%,760px,58vw) !important;'));
  assert.ok(layout.includes('max-width:100% !important;'));
  assert.ok(layout.includes('pv-creative-hero-summary'));
});
