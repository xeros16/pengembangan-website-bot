import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const code = readFileSync(new URL('../server.js', import.meta.url),'utf8');
const js = readFileSync(new URL('../pir-party-paper.js', import.meta.url),'utf8');
const css = readFileSync(new URL('../pir-party-paper.css', import.meta.url),'utf8');

test('paper styles and script are registered with a fresh cache version',()=>{
 assert.match(code,/pir-party-paper\.css\?v=20261115w/);
 assert.match(code,/pir-party-paper\.js\?v=20261115w/);
 assert.match(code,/pir-party-paper\.js'\]\.includes\(parts\[0\]\)/);
});

test('home, category, and for-business cards plus footer art are animated',()=>{
 assert.match(js,/registerCardGroup\(document\.querySelector\('\.pv-home \.pv-category-grid'\), '\.home-category'\)/);
 assert.match(js,/registerCardGroup\(document\.querySelector\('\.category-tile-grid'\), '\.category-tile'\)/);
 assert.match(js,/path === '\/for-business'/);
 assert.match(js,/registerCardGroup\(document\.querySelector\('\.company-editorial-grid'\), '\.company-editorial-card'\)/);
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

test('cards use a medium paper palette, manifesto rows are centered, and FAQ answers align with the question text',()=>{
 assert.match(js,/const cardColors = \['#56745D','#678164','#748A5E','#8B7561','#9E7C69','#B18C73'\]/);
 assert.match(js,/const sealColors = \['#D9E9C6','#BED4AB','#E6D7C6','#C28569','#F6F4E8','#96B692'\]/);
 assert.match(css,/grid-template-columns:\s*32px minmax\(0,1fr\)\s*!important/);
 assert.match(css,/padding:\s*13px 0\s*!important/);
 assert.match(css,/\.pv-faq-list \.pv-faq-panel\s*\{\s*padding:\s*0 var\(--pv-faq-gutter\) 22px/);
 assert.match(css,/font:\s*700 clamp\(16px,1\.25vw,18px\)\/1\.08 Georgia/);
});
