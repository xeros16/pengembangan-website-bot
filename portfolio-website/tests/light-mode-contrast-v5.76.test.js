import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../server.js', import.meta.url), 'utf8');
const rootPackage = JSON.parse(fs.readFileSync(new URL('../../package.json', import.meta.url), 'utf8'));
const websitePackage = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const marker = '/* PIR Visuals v5.76.0 — Light Mode contrast & surface harmonization */';
const start = source.indexOf(marker);
const end = source.indexOf('</style>', start);
const lightCss = source.slice(start, end);

function luminance(hex) {
  const values = [1, 3, 5].map(index => parseInt(hex.slice(index, index + 2), 16) / 255);
  const linear = values.map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}
function contrast(foreground, background) {
  const [light, dark] = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (light + 0.05) / (dark + 0.05);
}

test('v5.81.0 advances website and platform release metadata and cache busting', () => {
  assert.equal(rootPackage.version, '6.7.2');
  assert.equal(websitePackage.version, '3.50.0');
  assert.ok(source.includes("version: '6.7.2'"));
  assert.ok(source.includes("const CACHE='pir-visuals-public-v46'"));
  for (const asset of ['/icon.svg?v=6710', '/public-ui.js?v=6710', '/pwa-register.js?v=6710', '/studio-upload.js?v=6712']) {
    assert.ok(source.includes(asset), `missing cache-busted asset ${asset}`);
  }
});

test('Light Mode uses one darker semantic text palette with WCAG AA contrast', () => {
  assert.notEqual(start, -1, 'v5.76.0 light-mode layer exists');
  assert.ok(end > start, 'light-mode layer is closed');
  const pairs = [
    ['#202820', '#FFFEFA', 15],
    ['#4E5B50', '#FFFEFA', 7],
    ['#5D6B60', '#F4F2EC', 4.8],
    ['#31583A', '#F7F8F2', 7],
    ['#765C2F', '#FFFEFA', 6],
    ['#1F2C22', '#FFFEFA', 7],
    ['#405445', '#EEF3E9', 4.5],
    ['#49664C', '#FFFEFA', 4.5],
    ['#FFFFFF', '#35583A', 7.5],
  ];
  for (const [foreground, background, minimum] of pairs) {
    assert.ok(contrast(foreground, background) >= minimum,
      `${foreground} on ${background} must be at least ${minimum}:1`);
  }
  for (const token of ['--bg:#F4F2EC', '--surface:#FFFEFA', '--surface-raised:#F7F8F2', '--text:#202820', '--muted:#4E5B50', '--subtle:#5D6B60', '--accent-strong:#31583A']) {
    assert.ok(lightCss.includes(token), `missing token ${token}`);
  }
});

test('Customer Support hero italic heading and service-hours metadata remain readable on the light canvas', () => {
  assert.match(lightCss, /\.support-hero h1 em\{[\s\S]*?color:#31583A!important/);
  assert.match(lightCss, /\.support-hours\{color:#405445/);
  assert.match(lightCss, /\.support-hero p\{color:#4E5B50/);
});

test('Customer Support aside card is opaque and uses a coherent light surface with dark text', () => {
  assert.match(lightCss, /\.support-hero-aside\{[\s\S]*?background:linear-gradient\(145deg,#FFFEFA 0%,#EEF3E9 100%\)!important/);
  assert.match(lightCss, /\.support-hero-aside>strong\{color:#1F2C22!important/);
  assert.match(lightCss, /\.support-hero-aside li\{[\s\S]*?color:#405445!important/);
  assert.doesNotMatch(lightCss, /\.support-hero-aside\{[^}]*background:rgba\(/);
});

test('Shared cards, tables, form controls and focus states receive the same Light Mode contrast system', () => {
  for (const selector of ['.studio-panel', '.studio-sidebar', '.growth-panel', '.support-channel', '.support-form-card', '.support-note', '.shortlist-table-wrap', '.pv-work-section', '.pv-manifesto']) {
    assert.ok(lightCss.includes(selector), `missing shared surface selector ${selector}`);
  }
  assert.match(lightCss, /\[data-theme="light"\] :is\(button,a,input,select,textarea,\[tabindex\]\):focus-visible/);
  assert.match(lightCss, /input::placeholder[\s\S]*?color:#657266/);
  assert.match(lightCss, /@media\(max-width:760px\)\{\s*\.foot\{margin-inline:-16px\}/);
  assert.match(lightCss, /@media\(max-width:520px\)\{\s*\.foot\{margin-inline:-13px\}/);
});
