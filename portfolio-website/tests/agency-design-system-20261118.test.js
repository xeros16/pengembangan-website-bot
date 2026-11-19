import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const server = fs.readFileSync(path.join(root, 'server.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'pir-agency-system.css'), 'utf8');

test('agency design system is linked and served as a cache-safe static asset', () => {
  assert.match(server, /<link rel="stylesheet" href="\/pir-agency-system\.css\?v=20261118c">/);
  assert.ok(server.includes("'pir-desktop-refinement.css'"));
  assert.equal((server.match(/'pir-desktop-refinement\.css'/g) || []).length, 2);
});

test('homepage adds original user journey and uses only published verified testimonials', () => {
  assert.match(server, /const journeyMarkup = `<section class="pv-journey-section">/);
  assert.match(server, /SAYA MENCARI DESAINER|Saya mencari desainer/i);
  assert.match(server, /Saya ingin menampilkan karya/);
  assert.match(server, /Saya sedang menjalankan proyek/);
  assert.match(server, /DesignerTestimonial\.find\(\{ isPublished: true, emailVerified: true \}\)/);
  assert.match(server, /\$\{testimonialMarkup\}/);
});

test('agency system covers the requested responsive and accessible design rules', () => {
  for (const breakpoint of ['1024px', '768px', '480px', '375px']) {
    assert.match(css, new RegExp(`@media \\(max-width: ${breakpoint}\\)`));
  }
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /font-family:\s*Georgia/);
  assert.match(css, /font-family:\s*Inter/);
  assert.match(css, /--pir-ds-forest/);
  assert.match(css, /--pir-ds-paper/);
});
