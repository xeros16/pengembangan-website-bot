import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../server.js', import.meta.url), 'utf8');

test('button magnetic motion supports any connected mouse pointer', () => {
  assert.ok(source.includes('const isMousePointer=event=>!event.pointerType||event.pointerType===\'mouse\'||event.pointerType===\'pen\';'));
  assert.ok(source.includes("document.addEventListener('pointermove'"));
  assert.match(source, /const magneticSelector='button:not\(:disabled\):not\(\[aria-disabled="true"\]\)/);
  assert.ok(source.includes("document.addEventListener('pointerover'"));
  assert.ok(source.includes("document.addEventListener('pointerout'"));
});

test('magnetic motion is delegated and handles dynamic controls without static-only binding', () => {
  assert.ok(source.includes('const findMagneticTarget=event=>'));
  assert.ok(source.includes("magneticTarget.classList.add('pv-magnetic','pv-button-pointer-hover')"));
  assert.ok(source.includes('target.contains(event.relatedTarget)'));
  assert.ok(!source.includes('const motionButtons=document.querySelectorAll(magneticSelector)'));
});

test('button movement is visibly bounded and returns to center', () => {
  assert.ok(source.includes('Math.max(-10,Math.min(10,x))'));
  assert.ok(source.includes('Math.max(-8,Math.min(8,y))'));
  assert.ok(source.includes("element.style.setProperty('--pv-magnetic-x','0px')"));
  assert.ok(source.includes("element.style.setProperty('--pv-magnetic-y','0px')"));
  assert.ok(source.includes('.pv-magnetic{translate:var(--pv-magnetic-x,0px) var(--pv-magnetic-y,0px)!important;'));
});

test('motion preference and disabled controls remain respected', () => {
  assert.ok(source.includes("document.documentElement.dataset.pvMotion==='off'||systemMotionReduced"));
  assert.match(source, /magneticTarget\.matches\(':disabled,\[aria-disabled="true"\]'\)/);
});
