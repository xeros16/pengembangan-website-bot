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

test('homepage hero gets balanced split-layout safeguards without removing motion', () => {
  assert.match(source, /#main-content \.pv-hero h1\{\s*max-width:9\.6ch;\s*text-wrap:balance;\s*\}/);
  assert.match(source, /#main-content \.pv-home-motion \.pv-hero-word\{\s*margin-right:\.035em;\s*\}/);
  assert.ok(source.includes('@media(max-width:1150px){'));
  assert.ok(source.includes('#main-content .pv-hero-main{'));
});

test('category cards keep stronger chips and repaired contrast in light and dark themes', () => {
  assert.ok(source.includes('#main-content .category-tile .category-tile-top span{'));
  assert.ok(source.includes('#main-content .category-tone-2{--cat-bg:#D5DDD2;--cat-ink:#1E2B22;--cat-muted:#4D5D50;--cat-accent:#456148}'));
  assert.ok(source.includes('#main-content .category-tone-9{--cat-bg:#E6E7DB;--cat-ink:#233129;--cat-muted:#506156;--cat-accent:#335542}'));
  assert.ok(source.includes('html[data-theme="dark"] #main-content .category-tile .category-tile-top span{'));
});

test('customer support light hero preserves readable accent emphasis and aside sizing', () => {
  assert.ok(source.includes('html[data-theme="light"] #main-content .support-hero h1 em{'));
  assert.ok(source.includes('color:#55775A!important;'));
  assert.ok(source.includes('html[data-theme="light"] #main-content .support-hero-aside>strong{'));
});
