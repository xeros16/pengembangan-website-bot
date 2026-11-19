import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../server.js', import.meta.url), 'utf8');
const rootPackage = JSON.parse(fs.readFileSync(new URL('../../package.json', import.meta.url), 'utf8'));
const websitePackage = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

const navMarkup = source.slice(source.indexOf('<header class="site-nav">'), source.indexOf('</header>', source.indexOf('<header class="site-nav">')) + 9);
const navCss = source.slice(source.lastIndexOf('/* v5.72.0 — navigation restoration'), source.indexOf('</style>', source.lastIndexOf('/* v5.72.0 — navigation restoration')));
const publicUiStart = source.indexOf("if (parts[0] === 'public-ui.js') return res.end(`") + "if (parts[0] === 'public-ui.js') return res.end(`".length;
const publicUiEnd = source.indexOf('`);', publicUiStart);
const publicUi = source.slice(publicUiStart, publicUiEnd);

test('v5.81.0 advances platform, website and public cache versions', () => {
  assert.equal(rootPackage.version, '6.7.2');
  assert.equal(websitePackage.version, '3.50.0');
  assert.ok(source.includes("version: '6.7.2'"));
  assert.ok(source.includes("const CACHE='pir-visuals-public-v46'"));
  assert.ok(source.includes('/icon.svg?v=6710'));
  assert.ok(source.includes('/public-ui.js?v=6710'));
  assert.ok(source.includes('/studio-upload.js?v=6712'));
});

test('closed native Lainnya disclosure is explicitly hidden so it cannot cover navigation actions', () => {
  assert.match(navCss, /\.nav-more:not\(\[open\]\)>\.nav-more-menu\s*\{display:none!important\}/);
  assert.match(navCss, /\.nav-more\[open\]>\.nav-more-menu\s*\{display:grid\}/);
  assert.match(navMarkup, /<summary[^>]*aria-expanded="false"/);
});

test('mobile submenu uses a two-column layout and navigation panel remains scrollable', () => {
  assert.match(navCss, /\.nav-more\[open\]>\.nav-more-menu\s*\{position:static;display:grid;grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(navCss, /max-height:min\(78dvh,calc\(100dvh - 104px\)\)/);
  assert.match(navCss, /overflow-x:hidden;overflow-y:auto;overscroll-behavior:contain;touch-action:pan-y/);
});

test('top navigation includes client workspace and contact support destinations', () => {
  assert.match(navMarkup, /href="\/client"/);
  assert.match(navMarkup, /href="\/contact">Contact &amp; support/);
});

test('navigation uses one controller with outside click, Escape focus return and responsive cleanup', () => {
  assert.equal((publicUi.match(/const closeNav=/g) || []).length, 1);
  assert.match(publicUi, /navMore\?\.addEventListener\('toggle',syncNavMore\)/);
  assert.match(publicUi, /if\(event\.key!=='Escape'\)return/);
  assert.match(publicUi, /navMoreSummary\?\.addEventListener\('click'/);
  assert.match(publicUi, /compactNavQuery\.addEventListener\('change',syncNavViewport\)/);
  assert.match(publicUi, /if\(restoreFocus\)toggle\?\.focus\(\)/);
  assert.match(publicUi, /window\.addEventListener\('resize'/);
  assert.match(publicUi, /target\?\.closest\('a\[href\]'\)\)closeNav\(false\)/);
});

test('all secondary navigation destinations retain their route handlers', () => {
  for (const route of ['/client', '/contact', '/about', '/how-it-works', '/favorites', '/shortlist', '/collections']) {
    assert.ok(navMarkup.includes(`href="${route}"`), `missing navigation destination ${route}`);
  }
  assert.ok(source.includes("if (parts[0] === 'client' && parts.length === 1 && req.method === 'GET')"));
  assert.ok(source.includes("if (parts[0] === 'contact' && parts.length === 1 && req.method === 'GET')"));
  assert.ok(source.includes("['about', 'how-it-works', 'privacy', 'terms', 'contact'].includes(parts[0])"));
  assert.ok(source.includes("if (parts[0] === 'favorites' && req.method === 'GET')"));
  assert.ok(source.includes("if (parts[0] === 'shortlist' && parts.length === 1 && req.method === 'GET')"));
  assert.ok(source.includes("if (parts[0] === 'collections' && parts.length === 1 && req.method === 'GET')"));
});

test('compact navigation keeps its absolute panel positioning and 320px-safe width', () => {
  assert.ok(source.includes('display:none;position:absolute;top:calc(100% + 9px)'));
  assert.ok(navCss.includes('.nav-links.open{z-index:241;pointer-events:auto}'));
  assert.ok(navCss.includes('left:0;right:0;width:100%;max-width:100%'));
  assert.ok(!navCss.includes('.nav-links{position:relative'));
});

test('quick search replaces the compact menu and Escape is left to an open dialog', () => {
  assert.match(publicUi, /const openCommand=\(\)=>\{if\(!commandDialog\|\|commandDialog\.open\)return;commandReturnFocus=nav\?\.classList\.contains\('open'\)\?toggle:document\.activeElement;closeNav\(false\);updateCommandResults\(\);commandDialog\.showModal\(\)/);
  assert.match(publicUi, /if\(document\.querySelector\('dialog\[open\]'\)\)return/);
});
