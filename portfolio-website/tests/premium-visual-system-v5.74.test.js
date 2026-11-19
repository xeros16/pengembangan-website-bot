import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../server.js', import.meta.url), 'utf8');
const rootPackage = JSON.parse(fs.readFileSync(new URL('../../package.json', import.meta.url), 'utf8'));
const websitePackage = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const premiumStart = source.indexOf('/* PIR Visuals v5.74.0 — unified premium visual system */');
const premiumEnd = source.indexOf('</style>', premiumStart);
const premiumCss = source.slice(premiumStart, premiumEnd);

test('v5.81.0 advances platform, website, public assets and service-worker cache', () => {
  assert.equal(rootPackage.version, '6.7.2');
  assert.equal(websitePackage.version, '3.50.0');
  assert.ok(source.includes("version: '6.7.2'"));
  assert.ok(source.includes("const CACHE='pir-visuals-public-v46'"));
  assert.ok(source.includes('/icon.svg?v=6710'));
  assert.ok(source.includes('/public-ui.js?v=6710'));
  assert.ok(source.includes('/pwa-register.js?v=6710'));
});

test('Light and Dark themes share semantic canvas, surface, text and accent tokens', () => {
  for (const token of ['--bg:', '--bg-soft:', '--surface:', '--surface-raised:', '--line:', '--text:', '--muted:', '--accent:', '--accent-strong:', '--gold:']) {
    assert.ok(premiumCss.includes(token), `missing semantic token ${token}`);
  }
  assert.match(premiumCss, /\[data-theme="light"\]\s*\{/);
});

test('page canvas uses sparse linework and one asymmetric contour', () => {
  assert.match(premiumCss, /repeating-linear-gradient\(135deg,transparent 0 118px/);
  assert.match(premiumCss, /border-radius:61% 39% 47% 53%/);
  assert.match(premiumCss, /\.pv-work-section:before\{display:none!important\}/);
});

test('premium layout keeps deliberate responsive breakpoints and control spacing', () => {
  assert.ok(premiumCss.includes('@media(max-width:1180px)'));
  assert.ok(premiumCss.includes('@media(max-width:760px)'));
  assert.ok(premiumCss.includes('@media(max-width:520px)'));
  assert.match(premiumCss, /\.nav-actions\{gap:10px;padding-left:10px;border-left:1px solid var\(--line\)\}/);
  assert.match(premiumCss, /\.nav-action-button\{min-height:42px;min-width:42px;padding:0 12px/);
});
