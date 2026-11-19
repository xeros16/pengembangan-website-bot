import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../server.js', import.meta.url), 'utf8');

test('current motion system uses semantic reveal families across page content', () => {
  for (const family of ['media','panel','heading','card','content']) {
    assert.ok(source.includes(`data-pv-motion-kind="${family}"`) || source.includes(`?'${family}'`), `missing ${family} reveal family`);
  }
  assert.ok(source.includes('el.dataset.pvMotionKind='));
  assert.ok(source.includes('mountReveal(document)'));
  assert.ok(source.includes('mountImages(document)'));
});

test('current motion observer covers public, client, studio and case-study surfaces', () => {
  for (const selector of ['.pv-client-card','.moodboard-create','.studio-panel','.case-cover','.support-success','.showcase-section-heading']) {
    assert.ok(source.includes(selector), `missing motion target ${selector}`);
  }
  assert.ok(source.includes("if('MutationObserver' in window)"));
  assert.ok(source.includes('mountReveal(node);mountImages(node)'));
});

test('fine-pointer depth and magnetic motion are disabled for reduced-motion users', () => {
  assert.ok(source.includes("const finePointer=window.matchMedia('(hover:hover) and (pointer:fine)').matches"));
  assert.ok(source.includes('if(finePointer&&!motionReduced)'));
  assert.ok(source.includes('requestAnimationFrame'));
  assert.ok(source.includes("document.documentElement.dataset.pvMotion==='off'"));
  assert.ok(source.includes('.pv-magnetic{'));
  assert.ok(source.includes('pv-depth-active'));
});

test('user and system reduced-motion settings remain authoritative', () => {
  assert.ok(source.includes("const systemMotionReduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches"));
  assert.ok(source.includes("const motionReduced=systemMotionReduced||motionPreference==='off'"));
  assert.ok(source.includes('@media(prefers-reduced-motion:reduce)'));
  assert.ok(source.includes('html[data-pv-motion="off"] .pv-magnetic'));
  assert.ok(source.includes('html[data-pv-motion="off"] .site-nav'));
});

test('site navigation remains stable during View Transitions and cache metadata advances', () => {
  assert.ok(source.includes('.site-nav{view-transition-name:pv-site-nav}'));
  assert.ok(source.includes("version: '6.7.2'"));
  assert.ok(source.includes("const CACHE='pir-visuals-public-v46'"));
  assert.ok(source.includes('/icon.svg?v=6710'));
});
