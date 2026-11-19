import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const read = name => readFileSync(path.join(root, name), 'utf8');
const script = read('pir-scroll-experience.js');
const marquee = read('pir-marquee.js');
const css = read('pir-motion-polish.css');
const server = read('server.js');

test('physical wheel and touchpad are never intercepted by the site', () => {
  assert.doesNotMatch(script, /addEventListener\(['"]wheel['"]/);
  assert.doesNotMatch(script, /event\.preventDefault\(\);\s*moveTo/);
  assert.doesNotMatch(script, /requestAnimationFrame\(/);
  assert.match(script, /browser owns physical wheel/);
});

test('anchor scroll uses built-in compositor smooth behavior and respects reduced motion', () => {
  assert.match(script, /scrollTo\(\{ top: clamp\(top\), behavior: motionAllowed\(\) \? 'smooth' : 'instant' \}\)/);
  assert.match(script, /prefers-reduced-motion: reduce/);
  assert.match(script, /data(set|\.pvMotion)/);
  assert.match(script, /headerHeight/);
});

test('background avoids expensive fixed-attachment repaint during normal scroll', () => {
  assert.match(css, /html body \{background-attachment:scroll !important;\}/);
});

test('marquee is paused when outside the viewport to avoid background rAF work', () => {
  assert.match(marquee, /new IntersectionObserver\(/);
  assert.match(marquee, /if \(inView\) start\(\); else stop\(\)/);
  assert.match(marquee, /if \(!allowed\(\) \|\| !inView\)/);
});

test('new versions load in final document and links preserve existing product UI', () => {
  assert.ok(server.includes('pir-scroll-experience.js?v=20261114n'));
  assert.ok(server.includes('pir-marquee.js?v=20261114n'));
  assert.ok(server.includes('pir-motion-polish.css?v=20261114n'));
  assert.ok(server.includes('pir-faq-accordion.js?v=20261114m'));
  assert.ok(server.includes('pir-footer-refinement.css?v=20261114j'));
});
