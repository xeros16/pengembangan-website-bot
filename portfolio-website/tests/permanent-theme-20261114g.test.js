import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const server = readFileSync(new URL('../server.js', import.meta.url), 'utf8');
const css = readFileSync(new URL('../pir-permanent-theme.css', import.meta.url), 'utf8');
const company = readFileSync(new URL('../company-editorial.css', import.meta.url), 'utf8');

test('all rendered pages start with the permanent color setting', () => {
  assert.ok(server.includes('<html lang="id" data-theme="light"><head>'));
  assert.ok(server.includes('document.documentElement.dataset.theme=\'light\';'));
  assert.ok(!server.includes("localStorage.getItem(themeKey)"));
  assert.ok(!server.includes("localStorage.setItem(themeKey"));
});

test('public page shell no longer renders a light/dark toggle', () => {
  assert.ok(!server.includes('<button type="button" class="theme-toggle nav-action-button" data-theme-toggle'));
  assert.match(server, /pir-permanent-theme\.css\?v=20261114g/);
  assert.ok(!server.includes('href="/pir-unified-theme.css?v=20261114f"'));
  assert.match(server, /<meta name="color-scheme" content="light">/);
});

test('permanent theme retains the previous forest hero and cream/sage sections', () => {
  assert.match(css, /\.pv-home \.pv-hero\s*\{[\s\S]*?background:linear-gradient\(110deg,#172B20/);
  assert.match(css, /\.pv-talent-section \{background:#E3EBE0/);
  assert.match(css, /\.pv-manifesto \{background:#CBDDB6/);
  assert.match(css, /\.footer-cta \{background:linear-gradient\(135deg,#264531/);
});

test('navbar widths and mobile actions have one fixed style', () => {
  assert.match(css, /header\.site-nav\s*\{[\s\S]*?width:100vw !important/);
  assert.match(css, /border-radius:0 0 16px 16px !important/);
  assert.match(css, /grid-template-areas:"portal portal" "search motion" !important/);
  assert.ok(company.includes('border-radius:0 0 16px 16px !important'));
});
