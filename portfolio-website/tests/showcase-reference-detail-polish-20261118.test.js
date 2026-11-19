import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const css = fs.readFileSync(new URL('../pir-showcase-editorial.css', import.meta.url), 'utf8');
const server = fs.readFileSync(new URL('../server.js', import.meta.url), 'utf8');

test('desktop showcase media has a right breathing inset instead of touching the panel edge', () => {
  assert.match(css, /@media \(min-width:\s*901px\)[\s\S]*\.pv-showcase-art\s*\{[\s\S]*inline-size:\s*calc\(100% - clamp\(22px, 2\.6vw, 38px\)\);[\s\S]*margin-inline:\s*0 clamp\(22px, 2\.6vw, 38px\);/);
  assert.match(css, /@media \(max-width:\s*900px\)[\s\S]*\.pv-showcase-art\s*\{[\s\S]*margin-inline:\s*auto;/);
});

test('description divider is a clearly visible dashed forest rule', () => {
  assert.match(css, /\.pv-showcase-byline::before\s*\{[\s\S]*height:\s*2px;[\s\S]*repeating-linear-gradient\([\s\S]*rgba\(32, 55, 42, \.72\) 0 11px/);
});

test('showcase CTA follows the reference outline style while retaining PIR forest identity', () => {
  assert.match(css, /\.pv-showcase-cta\s*\{[\s\S]*border:\s*1\.5px solid var\(--pir-showcase-forest\)[\s\S]*border-radius:\s*0 !important;[\s\S]*background:\s*transparent !important;[\s\S]*text-transform:\s*uppercase;/);
  assert.match(css, /\.pv-showcase-cta:hover\s*\{[\s\S]*background:\s*var\(--pir-showcase-forest\) !important;/);
  assert.match(server, /pir-showcase-editorial\.css\?v=20261118-image-fill-center-r/);
});
