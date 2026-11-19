import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../server.js', import.meta.url), 'utf8');

test('v5.68.1 keeps one persistent navigation header and avoids a second entrance animation', () => {
  assert.equal((source.match(/<header class="site-nav">/g) || []).length, 1);
  assert.match(source, /\.site-nav\{view-transition-name:pv-site-nav\}/);
  assert.match(source, /\.pv-motion-ready \.site-nav\{animation:none!important;opacity:1!important;transform:none!important\}/);
  assert.match(source, /::view-transition-old\(pv-site-nav\),::view-transition-new\(pv-site-nav\)\{animation:none!important/);
  assert.doesNotMatch(source, /\.pv-motion-ready \.site-nav\{animation:pv-nav-enter/);
});

test('v5.68.1 restores all homepage text and project imagery when Motion is Off', () => {
  assert.match(source, /html\[data-pv-motion="off"\] \.pv-home-motion \.pv-hero-word\{opacity:1!important;transform:none!important/);
  assert.match(source, /html\[data-pv-motion="off"\] \.pv-home-motion \.pv-project-grid\[data-pv-story\] \.home-project-image\{clip-path:none!important/);
  assert.match(source, /html\[data-pv-motion="off"\] \.pv-home \.pv-motion-ribbon-track\{animation:none!important/);
  assert.match(source, /html\[data-pv-motion="off"\] \.showcase-work-image:after\{display:none!important/);
  assert.match(source, /html\[data-pv-motion="off"\] \.pv-home \.carousel-slide\.is-active/);
});

test('v5.68.1 uses one RAF scroll scheduler and compositor-based progress', () => {
  assert.match(source, /const requestScrollState=\(\)=>\{if\(!scrollFrame\)scrollFrame=window\.requestAnimationFrame\(paintScrollState\);\}/);
  assert.match(source, /window\.addEventListener\('scroll',requestScrollState,\{passive:true\}\)/);
  assert.match(source, /progress\.style\.transform='scaleX\('/);
  assert.match(source, /navHeader\?\.classList\.toggle\('is-scrolled'/);
  assert.doesNotMatch(source, /progress\.style\.width=/);
});

test('v5.68.1 avoids nested reveal animations and removes duplicate home-grid observers', () => {
  assert.match(source, /alreadyGrouped=false/);
  assert.match(source, /if\(ancestor\.hasAttribute\('data-pv-reveal'\)\|\|\(ancestor\.hasAttribute\('data-pv-story'\)\&\&ancestor\.matches\('\.pv-category-grid,\.pv-talent-grid,\.pv-project-grid'\)\)\)\{alreadyGrouped=true;break;\}/);
  assert.match(source, /revealObserver\?\.unobserve\(child\)/);
  assert.match(source, /child\.removeAttribute\('data-pv-reveal'\)/);
  assert.match(source, /ancestor\.hasAttribute\('data-pv-story'\)\&\&ancestor\.matches\('\.pv-category-grid,\.pv-talent-grid,\.pv-project-grid'\)/);
  assert.match(source, /const storyParent=node\.parentElement\?\.closest\('\.pv-category-grid\[data-pv-story\],\.pv-talent-grid\[data-pv-story\],\.pv-project-grid\[data-pv-story\]'\)/);
});

test('v5.68.1 adds restrained image, category, navigation and magnetic CTA interactions', () => {
  assert.match(source, /\.showcase-work\[data-pv-reveal\]\.is-visible \.showcase-work-image img\{transform:scale\(1\)\}/);
  assert.match(source, /\.pv-motion-ready \.showcase-work\[data-pv-reveal\]\.is-visible \.showcase-work-image:after\{transform:scaleX\(0\)/);
  assert.match(source, /\.category-tile:hover \.category-tile-art>span/);
  assert.match(source, /\.nav-primary>a\[aria-current="page"\]:after/);
  assert.match(source, /const magneticSelector=/);
  assert.match(source, /\.pv-magnetic\{translate:var\(--pv-magnetic-x,0px\) var\(--pv-magnetic-y,0px\)/);
});

test('v5.68.1 removes blur and layout-changing padding from primary motion paths', () => {
  assert.doesNotMatch(source, /@keyframes pv-view-out\{to\{opacity:0;filter:blur/);
  assert.doesNotMatch(source, /\.pv-home \.home-category:hover\{[^}]*padding-top/);
  assert.doesNotMatch(source, /\.pv-home \.pv-manifesto-copy \.pv-manifesto-points div:hover\{padding-left/);
});

test('v5.68.1 respects system reduced motion and keeps controls operable without animation', () => {
  assert.match(source, /@media\(prefers-reduced-motion:reduce\)/);
  assert.match(source, /window\.matchMedia\('\(prefers-reduced-motion: reduce\)'\)\.matches/);
  assert.match(source, /html\[data-pv-motion="off"\] \.pv-magnetic\{translate:none!important\}/);
});

test('v5.68.1 advances release, PWA cache and icon cache-busting metadata', () => {
  assert.ok(source.includes("version: '6.7.2'"));
  assert.ok(source.includes("const CACHE='pir-visuals-public-v46'"));
  assert.ok(source.includes('/icon.svg?v=6710'));
});
