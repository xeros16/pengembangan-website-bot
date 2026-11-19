import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../server.js', import.meta.url), 'utf8');

function luminance(hex) {
  const channels = [1, 3, 5].map(index => parseInt(hex.slice(index, index + 2), 16) / 255);
  const linear = channels.map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}
function contrast(a, b) {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}
function categoryTokens() {
  const tokens = new Map();
  const rules = /(?:#main-content\s+)?\.category-tone-(\d+)\s*\{([^}]*)\}/g;
  for (const match of source.matchAll(rules)) {
    const id = Number(match[1]);
    const values = tokens.get(id) || {};
    for (const declaration of match[2].split(';')) {
      const pair = declaration.match(/(--cat-(?:bg|ink|muted|accent))\s*:\s*(#[0-9a-fA-F]{6})/);
      if (pair) values[pair[1]] = pair[2].toUpperCase();
    }
    tokens.set(id, values);
  }
  return tokens;
}

test('category cards keep their own foreground palette after global theme rules', () => {
  assert.match(source, /#main-content \.category-tile \.category-tile-copy h2[\s\S]*?color:var\(--cat-ink\)!important/);
  assert.match(source, /#main-content \.category-tile \.category-tile-copy p[\s\S]*?color:var\(--cat-muted\)!important/);
  assert.match(source, /#main-content \.category-tile \.category-tile-foot>b[\s\S]*?color:var\(--cat-ink\)!important/);
});

test('all ten category tiles meet WCAG AA contrast for title and supporting copy', () => {
  const tokens = categoryTokens();
  assert.equal(tokens.size, 10, 'expected all ten category palettes');
  for (let id = 1; id <= 10; id++) {
    const item = tokens.get(id);
    assert.ok(item?.['--cat-bg'] && item?.['--cat-ink'] && item?.['--cat-muted'], `category ${id} palette is complete`);
    assert.ok(contrast(item['--cat-bg'], item['--cat-ink']) >= 4.5, `category ${id} title contrast below 4.5:1`);
    assert.ok(contrast(item['--cat-bg'], item['--cat-muted']) >= 4.5, `category ${id} body contrast below 4.5:1`);
  }
});

test('Portal desainer CTA has explicit high-contrast theme tokens and cannot fade in Light Mode', () => {
  assert.match(source, /--pv-nav-cta-bg:#CDD7BF/);
  assert.match(source, /--pv-nav-cta-ink:#202820/);
  assert.match(source, /--pv-nav-cta-bg:#344B36/);
  assert.match(source, /--pv-nav-cta-ink:#FFFFFF/);
  assert.match(source, /#main-content \.site-nav \.nav-actions>a\.nav-cta[\s\S]*?opacity:1!important/);
  assert.match(source, /-webkit-text-fill-color:var\(--pv-nav-cta-ink\)!important/);
});

test('homepage primary buttons preserve readable text on their solid surfaces', () => {
  assert.match(source, /#main-content \.pv-hero \.pv-button-dark[\s\S]*?color:var\(--pv-hero-button-ink\)!important/);
  assert.match(source, /#main-content \.pv-join \.pv-button-light[\s\S]*?color:var\(--pv-light-button-ink\)!important/);
  assert.match(source, /#main-content \.pv-join h2\{color:#F4F1E8!important/);
  assert.match(source, /#main-content \.pv-join p\{color:#D6DED2!important/);
});

test('public service worker and health endpoint advertise the updated release', () => {
  assert.ok(source.includes("version: '6.7.2'"));
  assert.ok(source.includes("const CACHE='pir-visuals-public-v46'"));
});
