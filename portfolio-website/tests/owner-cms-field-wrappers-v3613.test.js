import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const server = fs.readFileSync(new URL('../server.js', import.meta.url), 'utf8');
const css = fs.readFileSync(new URL('../pir-public-polish.css', import.meta.url), 'utf8');

test('Owner CMS copywriting and SEO field wrappers are transparent while controls stay styled', () => {
  assert.match(server, /03 \/ SECTION COPY[\s\S]*?class="studio-form-grid">\$\{copyEditor\}/);
  assert.match(server, /08 \/ SEARCH & SHARING[\s\S]*?class="studio-form-grid"><label class="studio-field studio-field-wide">SEO title/);
  assert.match(css, /v3\.61\.3 — Remove the inherited white field-wrapper panels/);
  assert.match(css, /#main-content \.studio-cms-shell \.studio-cms-main form#studio-editor \.studio-editor-section \.studio-form-grid > label\.studio-field[\s\S]*?background:transparent!important/);
});

test('The CMS wrapper fix is scoped and does not remove input and textarea surfaces', () => {
  assert.match(server, /\.studio-field input,\.studio-field textarea/);
  assert.match(server, /#main-content input:not\(\[type=\"checkbox\"\]\):not\(\[type=\"radio\"\]\):not\(\[type=\"range\"\]\):not\(\[type=\"file\"\]\),[\s\S]*?background:var\(--surface-elevated\)!important/);
});
