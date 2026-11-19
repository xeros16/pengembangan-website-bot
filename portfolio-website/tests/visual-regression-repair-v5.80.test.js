import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../server.js', import.meta.url), 'utf8');

test('v5.81.0 advances release metadata and public cache assets', () => {
  assert.ok(source.includes("version: '6.7.2'"));
  assert.ok(source.includes("const CACHE='pir-visuals-public-v46'"));
  for (const asset of ['/icon.svg?v=6710', '/public-ui.js?v=6710', '/pwa-register.js?v=6710', '/vendor/gsap.min.js?v=6710', '/studio-upload.js?v=6712']) {
    assert.ok(source.includes(asset));
  }
});

test('hero keeps the tablet responsive single-column layout instead of forcing two columns', () => {
  assert.match(source, /@media\(max-width:1180px\)\{\s*#main-content \.pv-hero\{\s*min-height:0!important;\s*grid-template-columns:minmax\(0,1fr\)!important;/);
  assert.match(source, /#main-content \.pv-hero h1\{\s*max-width:14ch!important;\s*font-size:clamp\(56px,7\.4vw,88px\)!important;\s*line-height:1\.02!important;/);
});

test('hero kinetic words use short vertical travel so they do not collide with copy or CTAs', () => {
  assert.ok(source.includes("intro.fromTo(words,{autoAlpha:0,y:14,rotation:2},{autoAlpha:1,y:0,rotation:0,duration:.94,stagger:.055,ease:'power4.out'},'-=0.08');"));
  assert.ok(source.includes("transform:translate3d(0,14px,0) rotate(2deg)"));
  assert.ok(!source.includes('yPercent:112'));
  assert.ok(!source.includes('translate3d(0,112%,0)'));
});

test('category tile palettes remain fixed on hover, active, focus, and visited states', () => {
  assert.match(source, /#main-content \.category-tile:visited,\s*#main-content \.category-tile:hover,\s*#main-content \.category-tile:active,\s*#main-content \.category-tile:focus-visible\{\s*color:var\(--cat-ink\)!important;\s*background-color:var\(--cat-bg\)!important;/);
  assert.ok(source.includes('filter:none!important;'));
  assert.ok(source.includes('transition:transform .25s ease,box-shadow .25s ease!important;'));
  assert.ok(source.includes('background:color-mix(in srgb,var(--cat-bg) 82%,rgba(255,255,255,.14))!important;'));
  const repairBlock = source.slice(source.lastIndexOf('/* A category keeps its own palette'));
  assert.ok(repairBlock.includes('#main-content .category-tile:hover{\n  transform:translateY(-3px);'));
  assert.ok(!repairBlock.includes('filter:saturate'));
});
