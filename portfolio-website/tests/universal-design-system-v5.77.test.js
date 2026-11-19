import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../server.js', import.meta.url), 'utf8');
const rootPackage = JSON.parse(fs.readFileSync(new URL('../../package.json', import.meta.url), 'utf8'));
const websitePackage = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const marker = '/* PIR Visuals v5.77.0 — Universal Design System */';
const start = source.indexOf(marker);
const end = source.indexOf('</style>', start);
const css = source.slice(start, end);

function luminance(hex) {
  const values = [1, 3, 5].map(index => parseInt(hex.slice(index, index + 2), 16) / 255);
  const linear = values.map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}
function contrast(foreground, background) {
  const [light, dark] = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (light + 0.05) / (dark + 0.05);
}

test('v5.81.0 release metadata and cache-busted public assets are aligned', () => {
  assert.equal(rootPackage.version, '6.7.2');
  assert.equal(websitePackage.version, '3.50.0');
  assert.ok(source.includes("version: '6.7.2'"));
  assert.ok(source.includes("const CACHE='pir-visuals-public-v46'"));
  for (const asset of ['/icon.svg?v=6710', '/public-ui.js?v=6710', '/pwa-register.js?v=6710', '/studio-upload.js?v=6712']) {
    assert.ok(source.includes(asset), `missing ${asset}`);
  }
});

test('Universal Light Mode text, muted text, accent and gold pass WCAG AA', () => {
  assert.notEqual(start, -1, 'universal design system layer exists');
  assert.ok(end > start, 'universal design system layer is closed');
  const pairs = [
    ['#202820', '#FFFFFF', 12],
    ['#4B594E', '#FFFFFF', 7],
    ['#4B594E', '#F5F7F1', 6],
    ['#5E6B60', '#F3F2EB', 4.5],
    ['#2F5838', '#FFFFFF', 7],
    ['#765C2F', '#FFFFFF', 5],
    ['#FFFFFF', '#426B49', 6],
  ];
  for (const [foreground, background, minimum] of pairs) {
    assert.ok(contrast(foreground, background) >= minimum,
      `${foreground} on ${background} should be >= ${minimum}:1; got ${contrast(foreground, background).toFixed(2)}:1`);
  }
});

test('Universal Dark Mode has readable text and consistent semantic surfaces', () => {
  const pairs = [
    ['#F0F2E9', '#1C2720', 10],
    ['#B8C3B5', '#1C2720', 7],
    ['#CBD9BE', '#263229', 7],
  ];
  for (const [foreground, background, minimum] of pairs) {
    assert.ok(contrast(foreground, background) >= minimum,
      `${foreground} on ${background} should be >= ${minimum}:1`);
  }
  for (const token of ['--surface:#1C2720', '--surface-raised:#263229', '--text:#F0F2E9', '--muted:#B8C3B5', '--accent-strong:#CBD9BE']) {
    assert.ok(css.includes(token), `missing ${token}`);
  }
});

test('Universal design layer covers all major page families and shared UI components', () => {
  for (const selector of [
    '.pv-hero', '.pv-category-grid', '.designer-card', '.pv-collection-work',
    '.studio-sidebar', '.studio-panel', '.studio-kpis article', '.growth-panel',
    '.pv-client-card', '.pv-project-list-card', '.support-channel',
    '.support-form-card', '.shortlist-table-wrap', '.pv-command-dialog',
    '.pv-quick-view-dialog', '.pv-studio-setup', '.pv-upload-dropzone'
  ]) {
    assert.ok(css.includes(selector), `missing universal page/component coverage for ${selector}`);
  }
});

test('Shared form, table, status, navigation and dialog controls use semantic theme tokens', () => {
  assert.match(css, /#main-content input:not\(\[type="checkbox"\]\)/);
  assert.match(css, /#main-content table/);
  assert.match(css, /#main-content \.pv-project-status/);
  assert.match(css, /\.nav-more-menu/);
  assert.match(css, /\.pv-command-dialog/);
  assert.match(css, /:focus-visible/);
});

test('Intentionally dark editorial hero panels remain readable in both themes', () => {
  for (const selector of ['.pv-hero', '.pv-join', '.shortlist-hero', '.profile-hero']) {
    assert.ok(css.includes(selector), `missing dark editorial panel ${selector}`);
  }
  assert.match(css, /color:#F0F2E9!important/);
  assert.match(css, /background:linear-gradient\(122deg,#202D23 0%,#304233 58%,#202B22 100%\)!important/);
});

test('Mobile layouts and reduced-motion preferences are covered universally', () => {
  assert.match(css, /@media\(max-width:900px\)/);
  assert.match(css, /@media\(max-width:760px\)/);
  assert.match(css, /@media\(max-width:520px\)/);
  assert.match(css, /@media\(prefers-reduced-motion:reduce\)/);
});

test('Legacy kinetic text-fill styles cannot reduce contrast in dark editorial panels on Light Mode', () => {
  assert.match(css, /html\[data-theme="light"\] #main-content \.pv-hero h1,[\s\S]*?-webkit-text-fill-color:#F0F2E9!important/);
  assert.match(css, /html\[data-theme="light"\] #main-content \.pv-hero \.pv-index :is\(span,strong,b,small\)[\s\S]*?-webkit-text-fill-color:#263B2B!important/);
  assert.match(css, /html\[data-theme="light"\] #main-content \.shortlist-hero h1 em[\s\S]*?-webkit-text-fill-color:#F0F2E9!important/);
});
