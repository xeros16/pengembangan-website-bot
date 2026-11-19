import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../server.js',import.meta.url),'utf8');
const css=readFileSync(new URL('../pir-party-paper.css',import.meta.url),'utf8');
const script=readFileSync(new URL('../pir-party-paper.js',import.meta.url),'utf8');

test('fresh stylesheet and interaction JS are loaded after older theme layers',()=>{
  assert.match(source,/pir-party-paper\.css\?v=20261115z/);
  assert.match(source,/pir-party-paper\.js\?v=20261115y/);
});
test('category Explore has its own text underline and separate arrow motion',()=>{
  assert.match(source,/class="category-tile-foot"[\s\S]*?<b>Explore <span class="pv-link-arrow"/);
  assert.match(css,/\.category-tile-foot > b[\s\S]*?background-size:\s*0 1px/);
  assert.match(css,/\.category-tile-foot > b\s*\{[\s\S]*?background-size: calc\(100% - 15px\) 1px/);
});
test('card sheen is clipped to each card, while paper animation stays in separate layer',()=>{
  assert.match(css,/\.pv-party-animated\s*\{[\s\S]*?overflow: clip !important;\s*contain: paint/);
  assert.match(css,/\.pv-party-animated::after\s*\{[\s\S]*?clip-path: inset\(0 round 5px\)/);
  assert.match(css,/\.pv-party-layer--cards\s*\{[\s\S]*?overflow:\s*hidden/);
});
test('manifesto rows keep one rhythm with an optical baseline adjustment for 01 and 02',()=>{
  assert.match(css,/\.pv-manifesto-points > div\s*\{[\s\S]*?grid-template-rows:\s*minmax\(0, 1fr\)\s*!important/);
  assert.match(css,/\.pv-manifesto-points > div\s*\{[\s\S]*?min-height:\s*54px\s*!important/);
  assert.match(css,/\.pv-manifesto-points > div > :is\(b,span\)\s*\{[\s\S]*?align-self:\s*center\s*!important/);
  assert.match(css,/div:nth-child\(-n\+2\) > :is\(b,span\)/);
});
test('hero designer button lifts and arrow-only links do not move their labels',()=>{
  assert.match(source,/Temukan desainer <span class="pv-link-arrow"/);
  assert.match(source,/Hubungi kami <span class="pv-link-arrow"/);
  assert.match(css,/\.pv-hero-actions > \.pv-button\.pv-button-dark:is\(:hover,:focus-visible\)\s*\{[\s\S]*?transform: translateY\(-3px\)/);
  assert.match(css,/a:is\(:hover,:focus-visible\) \.pv-link-arrow\s*\{[\s\S]*?transform: translate\(4px,-3px\)/);
  assert.match(css,/\.company-editorial-card\.pv-party-animated:is\(:hover,:focus-within\) a\s*\{\s*transform: none !important/);
});
test('trailing text-arrow links get safe, idempotent DOM decoration; animations respect motion preference',()=>{
  assert.match(script,/const decorateLinkArrows = \(\) =>/);
  assert.match(script,/link\.classList\.contains\('pv-arrow-decorated'\)/);
  assert.match(script,/last\.nodeType !== 3/);
  assert.match(script,/link\.appendChild\(arrow\)/);
  assert.match(css,/@media \(prefers-reduced-motion:reduce\)/);
  assert.match(css,/html\[data-pv-motion="off"\] body #main-content a \.pv-link-arrow/);
});
