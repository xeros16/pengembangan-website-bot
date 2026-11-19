import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const css = fs.readFileSync(new URL('../pir-public-polish.css', import.meta.url), 'utf8');

test('designer Selected Work cannot be hidden behind an unfinished reveal curtain', () => {
  assert.match(css, /designer-showcase \.showcase-work-image:after\s*\{[^}]*content:none!important[^}]*display:none!important/s);
  assert.match(css, /designer-showcase \.showcase-work-image img\s*\{[^}]*opacity:1!important[^}]*visibility:visible!important/s);
});

test('mobile homepage carousel keeps uploaded artwork visible and preserves its full preview', () => {
  assert.match(css, /@media\(max-width:760px\)[\s\S]*?pv-home \.home-carousel \.carousel-art\s*\{[^}]*opacity:1!important/);
  assert.match(css, /pv-home \.home-carousel \.carousel-art :is\(img,video\)\s*\{[\s\S]*?opacity:1!important[\s\S]*?object-fit:contain!important[\s\S]*?mask-image:none!important/);
  assert.match(css, /pv-home \.home-carousel \.carousel-art:before\s*\{[\s\S]*?color-mix\(in srgb,var\(--surface\) 92%,transparent\)/);
});
