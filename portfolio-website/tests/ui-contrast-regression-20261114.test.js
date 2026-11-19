import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const dir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(dir, '..');
const server = readFileSync(path.join(root, 'server.js'), 'utf8');
const css = readFileSync(path.join(root, 'company-editorial.css'), 'utf8');
const staticAssets = readFileSync(path.join(root, 'static-assets.js'), 'utf8');

test('brand stylesheet uses a fresh version and revalidates without restart in development', () => {
  assert.match(server, /company-editorial\.css\?v=20261114e/);
  assert.match(server, /revalidate: true, cacheControl: 'no-cache, must-revalidate'/);
  assert.match(staticAssets, /let pending = revalidate \? null : assets\.get\(file\)/);
});
test('dark-mode talent links and manifesto steps use explicit readable ink', () => {
  assert.match(css, /pv-talent-section \.pv-outline-link/);
  assert.match(css, /-webkit-text-fill-color:#244B31 !important/);
  assert.match(css, /\.pv-manifesto-points > div > b/);
  assert.match(css, /color:#35553C !important/);
});
test('FAQ titles use editorial serif and body uses readable UI sans, in both modes', () => {
  assert.match(css, /pv-faq-list summary \{/);
  assert.match(css, /font-family:Georgia, "Times New Roman", serif/);
  assert.match(css, /pv-faq-list p \{/);
  assert.match(css, /font-size:15px/);
  assert.match(css, /html\[data-theme="light"\] #main-content \.pv-home \.pv-faq-list details/);
});
test('footer callout and inner-page navigation share responsive full-bleed sizing', () => {
  assert.match(css, /\.footer-cta \{/);
  assert.match(css, /grid-template-columns:minmax\(0,1\.08fr\)/);
  assert.match(css, /body:not\(:has\(\.pv-home\)\) #main-content > \.site-nav/);
  assert.match(css, /width:100vw/);
});
