import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const css=readFileSync(new URL('../pir-public-polish.css',import.meta.url),'utf8');
const server=readFileSync(new URL('../server.js',import.meta.url),'utf8');

test('ornaments follow a closed continuous motion path, not stop-start keyframe translations',()=>{
  assert.match(css, /@keyframes pv-ag-orbit\s*\{\s*from \{ offset-distance:0%; \}\s*to \{ offset-distance:100%; \}/);
  assert.match(css,/offset-path:path\("M 0 -14 C .* Z"\);/);
  assert.match(css,/animation:pv-ag-orbit 9\.6s linear infinite/);
  assert.doesNotMatch(css,/@keyframes pv-ac-float(?:-alt)?\s*\{/);
});
test('motion disabled by user and system respects reduced motion',()=>{
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(css, /html\[data-pv-motion="off"\] body/);
  assert.match(css,/animation: none !important; translate: none !important;/);
});
test('shortlist results section uses identical top and bottom spacing across widths',()=>{
  assert.match(css,/\.shortlist-results \{\s*--pv-band-space:clamp\(42px,4\.4vw,66px\);\s*padding-top:var\(--pv-band-space\) !important;\s*padding-bottom:var\(--pv-band-space\) !important;/);
  assert.match(css,/@media\(max-width:760px\)\s*\{[\s\S]*?--pv-band-space:clamp\(27px,7vw,40px\)/);
});
test('internal public pages share forest/sage/ivory palette without changing private studio',()=>{
  for(const cls of ['.shortlist-hero','.category-editorial','.company-editorial','.pv-match-finder','.support-hero','.pv-collection-builder']){
    assert.ok(css.includes(`:has(> ${cls})`),`missing public page ${cls}`);
  }
  assert.ok(!css.includes(':has(> .studio-panel)'));
});
test('server references the versioned stylesheet for cache refresh',()=>{
  assert.match(server, /pir-public-polish\.css\?v=20261118bi/);
});
