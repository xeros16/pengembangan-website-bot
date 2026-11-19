import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const server = fs.readFileSync(new URL('../server.js', import.meta.url), 'utf8');
const css = fs.readFileSync(new URL('../pir-public-polish.css', import.meta.url), 'utf8');

test('Discover Quick View accepts local profile-avatar URLs and has a load-error fallback', () => {
  assert.match(server, /safeAvatar=\/\^https:/);
  assert.match(server, /profile-avatar/);
  assert.match(server, /img\.addEventListener\('error'/);
  assert.match(server, /fields\.avatar\.textContent=\(fields\.name\.textContent\|\|'P'\)/);
});

test('designer Selected Work loads its first images eagerly and preserves natural image dimensions', () => {
  assert.match(server, /loading="\$\{i < 2 \? 'eager' : 'lazy'\}"/);
  assert.match(server, /fetchpriority="\$\{i === 0 \? 'high' : 'auto'\}"/);
  assert.match(css, /designer-showcase \.showcase-work-image img[\s\S]*?height:auto!important[\s\S]*?object-fit:contain!important/);
  assert.match(css, /designer-showcase \.showcase-work-image\{[\s\S]*?aspect-ratio:auto!important/);
});

test('case-study cover no longer scales or crops the original artwork', () => {
  assert.match(css, /case-study \.case-cover img[\s\S]*?height:auto!important[\s\S]*?max-height:none!important[\s\S]*?object-fit:contain!important[\s\S]*?transform:none!important/);
  assert.match(css, /case-study \.pv-case-chapters[\s\S]*?background:rgba\(250,251,247,.98\)!important/);
});

test('project experience review form uses a responsive full-width field layout', () => {
  assert.match(server, /class="card showcase-review-card"/);
  assert.match(server, /class="showcase-review-form"/);
  assert.match(css, /showcase-review-form[\s\S]*?grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(css, /showcase-review-form input,[\s\S]*?width:100%!important/);
  assert.match(css, /@media\(max-width:760px\)[\s\S]*?showcase-review-form\{grid-template-columns:1fr/);
});
