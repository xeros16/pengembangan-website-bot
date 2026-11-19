import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const code = readFileSync(new URL('../server.js', import.meta.url),'utf8');
const js = readFileSync(new URL('../pir-party-paper.js', import.meta.url),'utf8');
const css = readFileSync(new URL('../pir-party-paper.css', import.meta.url),'utf8');
test('paper styles and script are registered with a fresh cache version',()=>{
 assert.match(code,/pir-party-paper\.css\?v=20261115u/);
 assert.match(code,/pir-party-paper\.js\?v=20261115u/);
 assert.match(code,/pir-party-paper\.js'\]\.includes\(parts\[0\]\)/);
});
test('only the four home category cards and footer art are animated',()=>{
 assert.match(js,/querySelectorAll\('\.home-category'\)/);
 assert.match(js,/querySelector\('\.pv-footer-feature-graphic'\)/);
 assert.match(js,/addEventListener\('pointerenter'/);
 assert.match(js,/event\.pointerType === 'touch'/);
});
test('effects do not block links and respect reduced motion',()=>{
 assert.match(css,/pointer-events:\s*none\s*!important/);
 assert.match(css,/@media\s*\(prefers-reduced-motion:\s*reduce\)/);
 assert.match(js,/prefers-reduced-motion:\s*reduce/);
 assert.match(css,/data-pv-motion="off"/);
});
test('particles have cleanup and short-lived CSS animations',()=>{
 assert.match(js,/addEventListener\('animationend'/);
 assert.match(js,/createdPieces\.forEach\(p => p\.remove\(\)\)/);
 assert.match(css,/@keyframes pv-paper-pop/);
});
test('manifesto step separators do not double the first border',()=>{
 assert.match(css,/\.pv-manifesto-points\s*\{\s*border:\s*0\s*!important/);
 assert.match(css,/\.pv-manifesto-points > div\s*\{[\s\S]*?border-top:\s*1px solid #8ca57f\s*!important/);
 assert.match(css,/\.pv-manifesto-points > div:last-child\s*\{\s*border-bottom:\s*1px solid #8ca57f\s*!important/);
});
