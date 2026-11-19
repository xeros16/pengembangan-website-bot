import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const dir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = file => readFileSync(path.join(dir,file),'utf8');

test('FAQ uses a panel and interruptible height transitions', () => {
  const source = read('server.js');
  const script = read('pir-faq-accordion.js');
  assert.match(source, /class=\\?"pv-faq-panel\\?"/);
  assert.match(script, /const from = details\.getBoundingClientRect\(\)\.height/);
  assert.match(script, /tween\.cancel\(\)/);
  assert.match(script, /details\.open = desiredOpen/);
  assert.match(script, /prefers-reduced-motion: reduce/);
  assert.match(script, /summary\.addEventListener\('click'/);
});

test('scroll avoids overriding touchpad, touch, form and nested scroll areas', () => {
  const source = read('pir-scroll-experience.js');
  assert.match(source, /\(pointer: fine\)/);
  assert.match(source, /isDiscreteWheel/);
  assert.match(source, /hasNativeScrollParent/);
  assert.match(source, /prefers-reduced-motion: reduce/);
  assert.match(source, /event\.ctrlKey/);
  assert.match(source, /event\.preventDefault\(\)/);
  assert.match(source, /window\.scrollTo\(\{top: currentY, behavior: 'instant'\}\)/);
  assert.match(source, /scrollTo\(\{top, behavior: enabled\(\) \? 'smooth' : 'instant'\}\)/);
});

test('movement stylesheet and scripts load with new cache keys', () => {
  const source = read('server.js');
  const css = read('pir-motion-refinement.css');
  assert.ok(source.includes('/pir-motion-refinement.css?v=20261114k'));
  assert.ok(source.includes('/pir-faq-accordion.js?v=20261114k'));
  assert.ok(source.includes('/pir-scroll-experience.js?v=20261114k'));
  assert.match(css, /pv-faq-panel/);
  assert.match(css, /prefers-reduced-motion:reduce/);
  assert.ok(source.includes("'pir-motion-refinement.css', 'pir-scroll-experience.js'"));
});
