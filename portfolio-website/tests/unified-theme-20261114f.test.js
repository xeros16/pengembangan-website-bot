import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const source = readFileSync(new URL('../server.js', import.meta.url), 'utf8');
const css = readFileSync(new URL('../pir-unified-theme.css', import.meta.url), 'utf8');
test('legacy unified stylesheet is superseded by the permanent editorial theme', () => {
  const last = source.indexOf('/pir-permanent-theme.css?v=20261114g');
  assert.ok(last > source.indexOf('/company-editorial.css?v=20261114e'));
  assert.ok(!source.includes('href="/pir-unified-theme.css?v=20261114f"'));
  assert.match(source, /'pir-permanent-theme\.css'/);
});
test('shared navbar shape is declared for home and internal routes', () => {
  assert.match(css, /border-radius:0 0 16px 16px !important/);
  assert.match(css, /body:not\(:has\(\.pv-home\)\) #main-content > header\.site-nav/);
  assert.match(css, /border-radius:0 0 14px 14px !important/);
});
test('home palette has explicit light and dark tokens without recursive self-reference', () => {
  assert.match(css, /html\[data-theme="light"\] #main-content \.pv-home \{--pv-ink:#20372A\}/);
  assert.match(css, /html\[data-theme="dark"\] #main-content \.pv-home \{--pv-ink:#F1F6EC\}/);
  assert.doesNotMatch(css, /--pv-ink:var\(--pv-ink\)/);
});
test('FAQ, manifesto numbers and primary navigation CTA have theme-aware contrast rules', () => {
  assert.match(css, /\.pv-faq-list summary/);
  assert.match(css, /\.pv-manifesto-points b/);
  assert.match(css, /data-theme="dark"\] body #main-content > header\.site-nav \.nav-actions > a\.nav-cta/);
});
