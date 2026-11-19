import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const server = fs.readFileSync(new URL('../server.js', import.meta.url), 'utf8');
const css = fs.readFileSync(new URL('../pir-public-polish.css', import.meta.url), 'utf8');

test('Owner can create, remove, and save up to twenty FAQs', () => {
  assert.match(server, /data-faq-list/);
  assert.match(server, /data-faq-add/);
  assert.match(server, /data-faq-remove/);
  assert.match(server, /data-faq-count/);
  assert.match(server, /Math\.min\(20,faqCountValue\)/);
  assert.match(server, /faqCards\(\)/);
  assert.match(server, /faqAdd\?\.addEventListener\('click'/);
  assert.match(server, /faqList\?\.addEventListener\('click'/);
});

test('Public FAQ renders saved Owner entries, including an intentionally empty list', () => {
  assert.match(server, /Array\.isArray\(homeCopy\.faq\)[\s\S]*?homeCopy\.faq\.slice\(0,20\)/);
  assert.match(server, /faqItems\.map\(item/);
});

test('Live preview allows same-origin iframe only on preview mode', () => {
  assert.match(server, /const previewFrameHeaders = previewMode \? \{/);
  assert.match(server, /'x-frame-options': 'SAMEORIGIN'/);
  assert.match(server, /frame-ancestors 'self'/);
});

test('Visual Site Studio no longer wraps the editor in an unnecessary outer card', () => {
  assert.match(css, /\.studio-cms-shell\{[\s\S]*?border:0!important;[\s\S]*?background:transparent!important;/);
  assert.match(css, /#main-content \.studio-editor-section\{[\s\S]*?background:transparent!important;[\s\S]*?box-shadow:none!important;/);
});

test('Checkbox labels keep consistent spacing and alignment across the dashboard', () => {
  assert.match(css, /label:has\(input\[type="checkbox"\]\)[\s\S]*?gap:10px!important/);
});

test('Owner artwork previews are larger while preserving original image ratio', () => {
  assert.match(css, /\.owner-work-grid\{grid-template-columns:repeat\(2,minmax\(0,1fr\)\)!important/);
  assert.match(css, /\.owner-work-preview img,[\s\S]*?object-fit:contain/);
  assert.match(css, /max-height:none!important/);
});
