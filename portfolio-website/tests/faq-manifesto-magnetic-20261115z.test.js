import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../server.js',import.meta.url),'utf8');
const css=readFileSync(new URL('../pir-party-paper.css',import.meta.url),'utf8');
const footer=readFileSync(new URL('../pir-footer-refinement.css',import.meta.url),'utf8');
test('the <p> itself has no legacy horizontal padding',()=>{
 assert.doesNotMatch(footer,/padding:\s*0 22px 18px !important/);
 assert.doesNotMatch(footer,/padding:\s*0 18px 16px !important/);
 assert.match(css,/details > \.pv-faq-panel > p \{[\s\S]*?padding:\s*0 !important/);
 assert.match(css,/details > summary \{[\s\S]*?padding-inline:\s*var\(--pv-faq-gutter\) !important/);
});
test('all manifesto rows have the same height and the short first two have an optical adjustment',()=>{
 assert.match(css,/min-height:\s*54px !important/);
 assert.match(css,/div:nth-child\(-n\+2\) > :is\(b,span\)/);
 assert.match(css,/top:\s*2px !important/);
});
test('footer Temukan desainer shares the central magnetic system',()=>{
 assert.match(source,/const magneticSelector=[^\n]*\.pv-footer-button/);
 assert.match(source,/magneticTarget\.style\.setProperty\('--pv-magnetic-x'/);
 assert.match(css,/pv-footer-feature-actions > \.pv-footer-button/);
});
test('fresh asset versions prevent retained stylesheets after reload',()=>{
 assert.match(source,/pir-party-paper\.css\?v=20261115z/);
 assert.match(source,/pir-footer-refinement\.css\?v=20261115z/);
});
