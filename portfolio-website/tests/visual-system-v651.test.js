import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const server = fs.readFileSync(new URL('../server.js', import.meta.url), 'utf8');
const css = fs.readFileSync(new URL('../visual-system.css', import.meta.url), 'utf8');

test('unified visual stylesheet is served same-origin after the page style system', () => {
  assert.ok(server.includes('href="/visual-system.css?v=6710"'));
  assert.ok(server.includes("parts[0] === 'visual-system.css'"));
  assert.ok(server.includes("'text/css; charset=utf-8'"));
  assert.ok(css.includes('--surface-elevated: #354136'));
  assert.ok(css.includes('[data-theme="light"]'));
});

test('background uses a sparse motif and one asymmetrical organic form', () => {
  assert.match(css, /transparent 0 286px/);
  assert.match(css, /transparent 288px 572px/);
  assert.match(css, /border-radius: 62% 38% 55% 45%/);
  assert.match(css, /box-shadow: none !important/);
  assert.doesNotMatch(css, /repeating-radial-gradient|0 22px.*64px/);
});

test('navigation actions have spacing and a separated mobile grid', () => {
  assert.match(css, /gap: 10px !important/);
  assert.match(css, /padding-left: 14px/);
  assert.match(css, /grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(css, /border-top: 1px solid var\(--line\)/);
});

test('visual system keeps contrast, focus, and reduced-motion rules', () => {
  assert.match(css, /--muted: #515d53/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /prefers-reduced-motion: reduce/);
});

test('semantic text and action token pairs meet WCAG AA contrast targets', () => {
  const luminance = hex => {
    const rgb = [1, 3, 5].map(index => parseInt(hex.slice(index, index + 2), 16) / 255);
    const linear = rgb.map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
    return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
  };
  const ratio = (foreground, background) => {
    const [lighter, darker] = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
    return (lighter + 0.05) / (darker + 0.05);
  };
  const pairs = [
    ['#202820', '#fffef9'], ['#515d53', '#fffef9'], ['#657064', '#f8f8f1'], ['#35543b', '#f4f2e9'], ['#ffffff', '#526b4b'],
    ['#f1f2e9', '#252e27'], ['#bac4b9', '#252e27'], ['#9eaa9f', '#2c372e'], ['#c8d6bd', '#171d19'], ['#1d281f', '#a8b99c'],
  ];
  for (const [foreground, background] of pairs) assert.ok(ratio(foreground, background) >= 4.5, `${foreground} on ${background} must meet 4.5:1`);
});
