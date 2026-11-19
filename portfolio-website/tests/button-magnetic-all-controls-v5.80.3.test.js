import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../server.js', import.meta.url), 'utf8');

test('v5.81.0 restores magnetic motion for all button-like controls', () => {
  assert.match(source, /const magneticSelector='button:not\(:disabled\):not\(\[aria-disabled="true"\]\)/);
  assert.ok(source.includes('const isMousePointer=event=>!event.pointerType||event.pointerType===\'mouse\'||event.pointerType===\'pen\';'));
  for (const selector of ['input[type=submit]', '.btn', '.button', '.pv-button', '.nav-cta', '.site-nav .nav-primary>a', '[role=button]', '[data-back-top]']) {
    assert.ok(source.includes(selector), `missing magnetic selector ${selector}`);
  }
  assert.ok(source.includes("document.addEventListener('pointermove'"));
  assert.ok(source.includes("document.addEventListener('pointerover'"));
  assert.ok(source.includes("document.addEventListener('pointerout'"));
  assert.ok(!source.includes('const motionButtons=document.querySelectorAll(magneticSelector)'));
});

test('magnetic motion is bounded and disabled controls are excluded', () => {
  assert.match(source, /magneticTarget\.matches\(':disabled,\[aria-disabled="true"\]'\)/);
  assert.ok(source.includes('Math.max(-10,Math.min(10,x))'));
  assert.ok(source.includes('Math.max(-8,Math.min(8,y))'));
});

test('release metadata and cache are advanced without removing GSAP', () => {
  assert.ok(source.includes("version: '6.7.2'"));
  assert.ok(source.includes("const CACHE='pir-visuals-public-v46'"));
  assert.ok(source.includes('/vendor/gsap.min.js?v=6710'));
  assert.ok(source.includes('/vendor/ScrollTrigger.min.js?v=6710'));
  assert.ok(source.includes('.pv-magnetic{translate:var(--pv-magnetic-x,0px) var(--pv-magnetic-y,0px)!important;'));
});
