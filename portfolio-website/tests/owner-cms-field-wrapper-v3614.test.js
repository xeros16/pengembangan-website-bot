import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const server = fs.readFileSync(new URL('../server.js', import.meta.url), 'utf8');
const css = fs.readFileSync(new URL('../pir-public-polish.css', import.meta.url), 'utf8');

test('Owner CMS sections include Headline, Copywriting, and SEO fields', () => {
  assert.match(server, /Headline & announcement/);
  assert.match(server, /Copywriting setiap bagian/);
  assert.match(server, /SEO & social preview/);
});

test('Owner CMS field wrappers are transparent without removing control styling', () => {
  assert.match(css, /#main-content \.studio-cms-shell #studio-editor \.studio-editor-section \.studio-form-grid \.studio-field[\s\S]*?background:transparent!important/);
  assert.match(css, /background-image:none!important/);
  assert.match(css, /border:0!important/);
  assert.match(css, /box-shadow:none!important/);
  assert.match(server, /#main-content input:not\(\[type="checkbox"\]\)/);
});

test('Owner dashboard keeps its Live Site Preview and fetches the new CSS revision', () => {
  assert.match(server, /<aside class="studio-preview">[\s\S]*?<iframe name="pv-studio-preview"/);
  assert.match(server, /pir-public-polish\.css\?v=20261118bi&rev=3612&cms=3613&fieldfix=3614/);
});
