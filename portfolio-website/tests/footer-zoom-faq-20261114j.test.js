import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const load = filename => readFileSync(path.join(root, filename), 'utf8');
const server = load('server.js');
const stylesheet = load('pir-footer-refinement.css');
const faqScript = load('pir-faq-accordion.js');
const seal = load('pir-footer-seal.svg');

test('footer uses bounded SVG rather than oversized cropped ring pseudoelements', () => {
  assert.match(server, /class="pv-footer-feature-art" src="\/pir-footer-seal\.svg"/);
  assert.match(stylesheet, /\.pv-footer-feature-graphic::after\s*\{\s*content:\s*none\s*!important;/);
  assert.match(stylesheet, /\.pv-footer-feature-art\s*\{[\s\S]*?object-fit:\s*contain\s*!important;/);
  assert.match(seal, /viewBox="0 0 560 560"/);
});

test('footer and FAQ enhancements are versioned and served from local app', () => {
  assert.match(server, /\/pir-footer-refinement\.css\?v=20261114j/);
  assert.match(server, /\/pir-faq-accordion\.js\?v=20261114k/);
  assert.match(server, /'pir-footer-seal\.svg'/);
  assert.match(server, /'pir-faq-accordion\.js'/);
});

test('FAQ uses native details, animated height, and reduced-motion fallback', () => {
  assert.match(server, /<details><summary>/);
  assert.match(server, /class="pv-faq-panel"/);
  assert.match(faqScript, /addEventListener\('click'/);
  assert.match(faqScript, /details\.animate\(/);
  assert.match(faqScript, /prefers-reduced-motion:\s*reduce/);
  assert.match(faqScript, /details\.open\s*=\s*desiredOpen/);
});
