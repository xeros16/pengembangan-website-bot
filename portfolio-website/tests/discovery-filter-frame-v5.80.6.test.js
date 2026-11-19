import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../server.js', import.meta.url), 'utf8');

test('discovery section no longer renders a card wrapper around the filters', () => {
  assert.ok(source.includes('<section class="pv-discovery-shell"><div class="section-head">'));
  assert.ok(!source.includes('<section class="card"><div class="section-head"><div><span class="eyebrow">Smart discovery</span>'));
});

test('discovery shell and filter form have no enclosing frame or panel fill', () => {
  assert.ok(source.includes('#main-content>.pv-discovery-shell{'));
  assert.ok(source.includes('padding:0!important;'));
  assert.ok(source.includes('border:0!important;'));
  assert.ok(source.includes('background:transparent!important;'));
  assert.ok(source.includes('#main-content>.pv-discovery-shell>.pv-discovery-filters{'));
  assert.ok(source.includes('#main-content>.pv-discovery-shell>.pv-discovery-filters .pv-filter-panel{'));
});

test('filter controls retain their own borders and compact checkbox dimensions', () => {
  assert.ok(source.includes('#main-content input:not([type="checkbox"]):not([type="radio"])'));
  assert.ok(source.includes('width:18px!important;'));
  assert.ok(source.includes('min-width:18px!important;'));
});

test('the current release preserves mouse-following animation and updates public cache assets', () => {
  assert.ok(source.includes("version: '6.7.2'"));
  assert.ok(source.includes("const CACHE='pir-visuals-public-v46'"));
  assert.ok(source.includes("const isMousePointer=event=>!event.pointerType||event.pointerType==='mouse'||event.pointerType==='pen'"));
  assert.ok(source.includes("magneticTarget.classList.add('pv-magnetic','pv-button-pointer-hover')"));
  assert.ok(source.includes('/public-ui.js?v=6710'));
});
