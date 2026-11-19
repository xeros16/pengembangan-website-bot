import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../server.js', import.meta.url), 'utf8');

test('category tiles keep their own palette instead of receiving the generic spotlight wash', () => {
  const spotlight = source.slice(source.indexOf('const finePointer=window.matchMedia'), source.indexOf('const depthSelector='));
  assert.ok(spotlight.includes("event.target.closest('.designer-card,.work,.feature-item,.trust-item,.pv-client-card,.studio-panel,.growth-panel')"));
  assert.ok(!spotlight.includes('.category-tile'));
});

test('hero discover CTA uses an explicit high-contrast ink and readable dimensions', () => {
  const fix = source.slice(source.lastIndexOf('/* PIR Visuals v5.80.2'));
  assert.ok(fix.includes('color:#26372A!important;'));
  assert.ok(fix.includes('-webkit-text-fill-color:#26372A!important;'));
  assert.ok(fix.includes('font-size:12px!important;'));
  assert.ok(fix.includes('min-height:48px!important;'));
});

test('v5.81.0 cache busting preserves the v5.81.0 visual fix', () => {
  assert.ok(source.includes("version: '6.7.2'"));
  assert.ok(source.includes("const CACHE='pir-visuals-public-v46'"));
  assert.ok(source.includes('/public-ui.js?v=6710'));
});
