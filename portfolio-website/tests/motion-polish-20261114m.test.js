import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
const server=read('server.js');
const css=read('pir-motion-polish.css');
const marquee=read('pir-marquee.js');
const scroll=read('pir-scroll-experience.js');
const faq=read('pir-faq-accordion.js');
test('new stylesheet is the final cascade layer and served from site',()=>{
 assert.ok(server.includes('pir-motion-polish.css?v=20261114m'));
 assert.ok(server.includes("'pir-motion-polish.css'"));
 assert.ok(server.includes('pir-marquee.js?v=20261114m'));
 assert.ok(server.includes('pir-scroll-experience.js?v=20261114m'));
});
test('nav removes margin and rounded right corner on all public routes',()=>{
 assert.match(css,/body:has\(\.pv-home\).*header\.site-nav/s);
 assert.match(css,/margin:0 !important/);
 assert.match(css,/border-radius:0 !important/);
});
test('the hero value lines use common content width',()=>{
 assert.match(css,/\.pv-hero-foot,[\s\S]*?\.pv-index[\s\S]*?width:100% !important/);
});
test('marquee has only one movement controller and keeps speed above zero',()=>{
 assert.ok(!server.includes('ribbonTween=gsapMotion.to'));
 assert.match(marquee,/destinationSpeed = active \? 5 : 44/);
 assert.match(marquee,/Math\.ceil\(ribbon\.clientWidth \/ groupWidth\) \+ 2/);
 assert.ok(!marquee.includes('pause()'));
});
test('FAQ uses native disclosure rather than JavaScript height snapshots',()=>{
 assert.match(css,/::details-content/);
 assert.match(css,/interpolate-size:allow-keywords/);
 assert.doesNotMatch(faq,/\.animate\(|\.getBoundingClientRect\(|preventDefault\(/);
});
test('scrolling respects nested content, reduced motion, trackpads and keyboard',()=>{
 assert.match(scroll,/prefers-reduced-motion/);
 assert.match(scroll,/nestedScrollable/);
 assert.match(scroll,/isTouchpad/);
 assert.match(scroll,/critically damped/i);
 assert.match(scroll,/requestAnimationFrame/);
});
