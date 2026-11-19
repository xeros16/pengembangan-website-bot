import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const css = fs.readFileSync(new URL('../pir-showcase-editorial.css', import.meta.url), 'utf8');
const server = fs.readFileSync(new URL('../server.js', import.meta.url), 'utf8');
const fix = css.slice(css.lastIndexOf('Carousel copy hierarchy and spacing'));

test('showcase slide copy keeps metadata first and title/description together', () => {
  assert.match(fix, /\.pv-showcase-meta\s*\{[^}]*flex:\s*0 0 auto !important/s);
  assert.match(fix, /\.pv-showcase-copy h3\s*\{[^}]*margin-block:\s*clamp\(38px, 4vw, 58px\) 14px !important/s);
  assert.match(fix, /\.pv-showcase-copy > p\s*\{[^}]*margin:\s*0 !important/s);
});

test('creator line and CTA remain in the lower-left group on desktop', () => {
  assert.match(fix, /\.pv-showcase-byline\s*\{[^}]*margin-block-start:\s*auto !important/s);
  assert.match(fix, /\.pv-showcase-cta\s*\{[^}]*align-self:\s*flex-start !important/s);
});

test('mobile receives the same reading order without changing the artwork layout', () => {
  assert.match(fix, /@media \(max-width: 900px\)[\s\S]*?\.pv-showcase-copy > p\s*\{[^}]*margin:\s*0 !important/s);
  assert.match(css, /grid-template-areas:\s*"copy" "art" !important/);
  assert.match(css, /object-fit:\s*contain !important/);
});

test('the canceled masthead centering patch is absent and cache version is refreshed', () => {
  assert.doesNotMatch(css, /Center the text group above the showcase/);
  assert.match(server, /pir-showcase-editorial\.css\?v=20261118-image-fill-center-r/);
});
