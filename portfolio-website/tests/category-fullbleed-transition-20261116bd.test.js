import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const server = fs.readFileSync(new URL('../server.js', import.meta.url), 'utf8');
const polish = fs.readFileSync(new URL('../pir-public-polish.css', import.meta.url), 'utf8');
const transition = fs.readFileSync(new URL('../pir-page-transitions.css', import.meta.url), 'utf8');
const controller = fs.readFileSync(new URL('../pir-page-transitions.js', import.meta.url), 'utf8');
const category = polish.split('PIR Visuals / 2026-11-16bd')[1] || '';

test('category landing is a nested full-bleed masthead and flush with the navbar', () => {
  assert.match(server, /<main class="category-editorial">\s*<header class="category-intro">/);
  assert.match(category, /#main-content\.wrap:has\(> \.category-editorial\)\s*\{\s*padding-top:0\s*!important/);
  assert.match(category, /#main-content\.wrap > \.category-editorial\s*\{[\s\S]*?padding:0 0 clamp\(28px,4\.2vw,54px\)\s*!important/);
  assert.match(category, /#main-content\.wrap > \.category-editorial > \.category-intro\s*\{[\s\S]*?width:100vw\s*!important[\s\S]*?max-width:none\s*!important[\s\S]*?margin:0\s*!important/);
});

test('category tile sections remain centered rather than overflowing the viewport', () => {
  assert.match(category, /\.category-editorial > :is\(\.category-index,\.category-recent\)\s*\{[\s\S]*?width:min\(1240px,calc\(100% - 2 \* clamp\(20px,4vw,64px\)\)\)\s*!important/);
  assert.match(category, /margin-inline:auto\s*!important/);
  assert.match(category, /@media\(max-width:760px\)[\s\S]*?grid-template-columns:minmax\(0,1fr\)\s*!important/);
  assert.match(category, /@media\(max-width:760px\)[\s\S]*?width:calc\(100% - 32px\)\s*!important/);
});

test('new native route transition no longer double-animates a nested main snapshot', () => {
  assert.match(transition, /@view-transition\s*\{\s*navigation:auto;/);
  assert.match(transition, /#main-content\s*\{\s*view-transition-name:none\s*!important/);
  assert.match(transition, /header\.site-nav\s*\{\s*view-transition-name:pv-site-nav;/);
  assert.doesNotMatch(transition, /::view-transition-(?:new|old)\(pv-main-content\)/);
  assert.match(transition, /::view-transition-new\(root\)\s*\{[\s\S]*?480ms cubic-bezier\(\.16,1,\.3,1\)/);
});

test('fallback is eased, accessibility-compatible and preserves the browser router', () => {
  assert.match(transition, /pv-route-fallback-enter 450ms cubic-bezier\(\.16,1,\.3,1\)/);
  assert.match(controller, /window\.location\.assign\(destination\.href\)/);
  assert.match(controller, /\}, 210\);/);
  assert.match(transition, /html\[data-pv-motion="off"\]/);
  assert.match(transition, /@media\(prefers-reduced-motion:reduce\)/);
});

test('both updated assets are cache-busted on the real page shell', () => {
  assert.match(server, /pir-public-polish\.css\?v=20261118bi/);
  assert.match(server, /pir-page-transitions\.css\?v=20261116bd/);
  assert.match(server, /pir-page-transitions\.js\?v=20261116bd/);
});
