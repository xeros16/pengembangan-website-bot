import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../server.js', import.meta.url), 'utf8');
const rootPackage = JSON.parse(fs.readFileSync(new URL('../../package.json', import.meta.url), 'utf8'));
const websitePackage = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const navStart = source.indexOf("const nav=document.getElementById('main-nav');");
const navEnd = source.indexOf('const getLightbox=()=>', navStart);
const navController = source.slice(navStart, navEnd);
const navCssStart = source.lastIndexOf('/* PIR Visuals v5.81.0 — universal navigation');
const navCssEnd = source.indexOf('</style>', navCssStart);
const navCss = source.slice(navCssStart, navCssEnd);

test('v5.81.0 aligns platform, website, health endpoint and public cache versions', () => {
  assert.equal(rootPackage.version, '6.7.2');
  assert.equal(websitePackage.version, '3.50.0');
  assert.ok(source.includes("version: '6.7.2'"));
  assert.ok(source.includes("const CACHE='pir-visuals-public-v46'"));
  for (const asset of ['/icon.svg?v=6710', '/public-ui.js?v=6710', '/pwa-register.js?v=6710', '/vendor/gsap.min.js?v=6710', '/studio-upload.js?v=6712']) {
    assert.ok(source.includes(asset), `missing cache-busted asset ${asset}`);
  }
});

test('compact navigation state is driven by the same 1180px media query as its CSS', () => {
  assert.ok(navController.includes("window.matchMedia('(max-width: 1180px)')"));
  assert.ok(navController.includes('compactNavQuery.addEventListener'));
  assert.ok(navController.includes('window.addEventListener(\'resize\',syncNavViewport'));
  assert.match(navCss, /@media\(max-width:1180px\)/);
  assert.match(navCss, /@media\(min-width:1181px\)/);
});

test('closed compact navigation is inert and hidden from assistive technology', () => {
  assert.ok(navController.includes("nav.setAttribute('inert','')"));
  assert.ok(navController.includes("nav.setAttribute('aria-hidden','true')"));
  assert.ok(navController.includes("nav.removeAttribute('inert')"));
  assert.ok(navController.includes("nav.removeAttribute('aria-hidden')"));
});

test('navigation state resets safely after viewport changes and back-forward cache restores', () => {
  assert.ok(navController.includes('const syncNavViewport=()=>'));
  assert.ok(navController.includes("window.addEventListener('pageshow'"));
  assert.ok(navController.includes('if(compactNavQuery.matches)closeNav(false)'));
});

test('route-aware current state includes the brand home link and nested destination groups', () => {
  assert.ok(navController.includes("const brandLink=document.querySelector('.site-nav .brand[href=\"/\"]')"));
  assert.ok(navController.includes("link.setAttribute('aria-current','page')"));
  assert.ok(navController.includes("navMore?.classList.toggle('has-current'"));
  assert.ok(navController.includes("/^\\\\/(p|designer|work)\\\\//"));
});

test('compact panel respects safe areas, viewport height and touch scrolling', () => {
  assert.ok(navCss.includes('env(safe-area-inset-left'));
  assert.ok(navCss.includes('env(safe-area-inset-right'));
  assert.ok(navCss.includes('env(safe-area-inset-bottom'));
  assert.ok(navCss.includes('max-height:min(78dvh,calc(100dvh - 104px))'));
  assert.ok(navCss.includes('overflow-y:auto!important'));
  assert.ok(navCss.includes('overscroll-behavior:contain'));
  assert.ok(navCss.includes('touch-action:pan-y'));
});

test('keyboard, outside-click and disclosure navigation controls remain wired', () => {
  assert.ok(navController.includes("navMoreSummary?.addEventListener('click'"));
  assert.ok(navController.includes("document.addEventListener('keydown'"));
  assert.ok(navController.includes("if(event.key!=='Escape')return"));
  assert.ok(navController.includes('if(restoreFocus)toggle?.focus()'));
  assert.ok(navController.includes("target?.closest('#main-nav,.nav-toggle')"));
});

test('no-script visitors retain access to compact navigation destinations', () => {
  assert.ok(source.includes('<noscript><style>@media(max-width:1180px)'));
  assert.ok(source.includes('.site-nav .nav-links{display:flex!important;position:static!important'));
});


test('320px phones keep the brand and menu toggle on one row and cap menu height to the viewport', () => {
  assert.match(navCss, /@media\(max-width:360px\)/);
  assert.ok(navCss.includes('.site-nav{gap:8px;flex-wrap:nowrap;align-items:center;padding:8px 10px}'));
  assert.ok(navCss.includes('.site-nav>.nav-toggle{min-width:76px!important'));
  assert.ok(navCss.includes('max-height:min(78dvh,calc(100dvh - 104px - env(safe-area-inset-top,0px) - env(safe-area-inset-bottom,0px)))!important'));
});
