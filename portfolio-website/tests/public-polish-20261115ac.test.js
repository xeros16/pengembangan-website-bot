import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const server=readFileSync(new URL('../server.js',import.meta.url),'utf8');
const css=readFileSync(new URL('../pir-public-polish.css',import.meta.url),'utf8');

test('new public polish asset is served and loaded after the older harmony stylesheet',()=>{
 assert.match(server, /pir-page-harmony\.css\?v=20261115ab"><link rel="stylesheet" href="\/pir-public-polish\.css\?v=20261115ad/);
 assert.match(server, /'pir-public-polish\.css'\]\.includes\(parts\[0\]\)/);
});
test('contact hero explicitly overrides both color and WebKit text fill',()=>{
 assert.match(css,/\.support-hero \.support-hero-main :is\(h1,h1 em,\.eyebrow,p,\.support-hours\)/);
 assert.match(css,/color:\s*#F3F7EC\s*!important/);
 assert.match(css,/-webkit-text-fill-color:\s*#F3F7EC\s*!important/);
});
test('category and shortlist panels are full-width, text remains padded',()=>{
 assert.match(css,/\.category-intro,\s*html body #main-content\.wrap > \.shortlist-hero,\s*html body #main-content\.wrap > \.shortlist-results/);
 assert.match(css,/width:100vw\s*!important/);
 assert.match(css,/margin-left:calc\(50% - 50vw\)\s*!important/);
 assert.match(css,/\.shortlist-results > \.shortlist-toolbar/);
});
test('manifesto entries have no inter-row gap and equal minimum heights',()=>{
 assert.match(css,/\.pv-manifesto-points\s*\{[\s\S]*?gap:0\s*!important/);
 assert.match(css,/\.pv-manifesto-points > div\s*\{[\s\S]*?min-height:62px\s*!important/);
 assert.match(css,/\.pv-manifesto-points > div:last-child\s*\{\s*border-bottom:1px solid/);
});
test('floating ornaments are subtle, do not capture pointer events, and respect reduced motion',()=>{
 assert.match(css,/@keyframes pv-ac-float/);
 assert.match(css,/animation:\s*pv-ac-float 8.8s ease-in-out infinite/);
 assert.match(css,/@media \(prefers-reduced-motion: reduce\)/);
 assert.match(css,/html\[data-pv-motion="off"\]/);
 assert.match(css,/animation:\s*none\s*!important/);
});
