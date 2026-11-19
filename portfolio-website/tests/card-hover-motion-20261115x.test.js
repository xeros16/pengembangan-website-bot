import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const server=readFileSync(new URL('../server.js',import.meta.url),'utf8');
const script=readFileSync(new URL('../pir-party-paper.js',import.meta.url),'utf8');
const styles=readFileSync(new URL('../pir-party-paper.css',import.meta.url),'utf8');

test('Cara Kerja, Tentang and Untuk Bisnis share the same animated editorial card grid',()=>{
 assert.match(server,/kind === 'about' \|\| kind === 'how-it-works' \|\| kind === 'for-business'/);
 assert.match(server,/class="company-editorial-grid"/);
 assert.match(script,/registerCardGroup\(document\.querySelector\('\.company-editorial-grid'\), '\.company-editorial-card'\)/);
 assert.doesNotMatch(script,/if \(path === '\/for-business'\)/);
 assert.match(script,/item\.classList\.add\('pv-party-animated'\)/);
});

test('card interactions add non-paper shine, title lift and independent journey-card lift',()=>{
 assert.match(styles,/\.pv-party-animated::after/);
 assert.match(styles,/linear-gradient\(108deg/);
 assert.match(styles,/\.pv-party-animated:is\(:hover,:focus-within\)::after/);
 assert.match(styles,/\.pv-party-animated:is\(:hover,:focus-within\) :is\(strong,h2\)/);
 assert.match(styles,/\.company-editorial-card\.pv-party-animated:is\(:hover,:focus-within\)/);
 assert.match(styles,/translate:\s*0 -6px/);
});

test('particles are limited to their own grid, with accessible hover and focus states',()=>{
 assert.match(styles,/\.pv-party-layer--cards\s*\{\s*inset:\s*-105px 0;\s*overflow:\s*hidden/);
 assert.match(script,/record\.layer\.getBoundingClientRect\(\)/);
 assert.match(script,/addEventListener\('pointerenter'/);
 assert.match(script,/addEventListener\('focusin'/);
 assert.match(styles,/pointer-events:\s*none\s*!important/);
 assert.match(script,/createdPieces\.forEach\(p => p\.remove\(\)\)/);
});

test('both confetti and non-paper animations honor reduced-motion settings',()=>{
 assert.match(script,/prefers-reduced-motion:\s*reduce/);
 assert.match(styles,/@media \(prefers-reduced-motion: reduce\)/);
 assert.match(styles,/html\[data-pv-motion="off"\] body #main-content \.pv-party-animated/);
 assert.match(styles,/\.pv-party-animated::after \{display:\s*none\s*!important;\}/);
});
