import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const server=readFileSync(new URL('../server.js',import.meta.url),'utf8');
const css=readFileSync(new URL('../pir-public-polish.css',import.meta.url),'utf8');

test('latest polish CSS is the final stylesheet for public pages',()=>{
  assert.match(server,/pir-public-polish\.css\?v=20261115ad/);
  assert.match(css,/20261115ad/);
});
test('floating animation moves diagonally as well as vertically at a quicker pace',()=>{
  assert.match(css,/@keyframes pv-ac-float \{[\s\S]*18% \{ translate: 8px -8px;/);
  assert.match(css,/@keyframes pv-ac-float-alt \{[\s\S]*22% \{ translate: -8px 6px;/);
  assert.match(css,/pv-ac-float 8\.8s ease-in-out infinite/);
  assert.match(css,/pv-ac-float-alt 10s ease-in-out infinite/);
  assert.match(css,/prefers-reduced-motion: reduce/);
});
test('shortlist has PIR Visuals emblem and continuous sage/forest background',()=>{
  assert.match(css,/\.shortlist-hero::after \{[\s\S]*?pir-footer-seal\.svg/);
  assert.match(css,/\.shortlist-hero \{[\s\S]*?margin:0 !important/);
  assert.match(css,/\.shortlist-results \{[\s\S]*?margin:0 !important/);
  assert.match(css,/\.shortlist-hero,\s*html body #main-content\.wrap > \.shortlist-results \{\s*margin-left:calc\(50% - 50vw\) !important/);
});
test('category full-bleed selector matches nested structure',()=>{
  assert.match(server,/<main class="category-editorial">/);
  assert.match(css,/#main-content\.wrap > \.category-editorial > \.category-intro \{/);
  assert.match(css,/width:100vw !important/);
});
test('zoom menu has dark text contrast and single-column mobile navigation',()=>{
  assert.match(css,/@media \(max-width:1180px\)/);
  assert.match(css,/nav\.nav-links\.open/);
  assert.match(css,/background:#20382b !important/);
  assert.match(css,/color:#f5f8ef !important/);
  assert.match(css,/@media \(max-width:600px\)/);
  assert.match(css,/grid-template-columns:minmax\(0,1fr\) !important/);
});
