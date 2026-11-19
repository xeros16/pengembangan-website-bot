import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import test from 'node:test';
const server=readFileSync(new URL('../server.js',import.meta.url),'utf8');
const css=readFileSync(new URL('../pir-public-polish.css',import.meta.url),'utf8');

test('Discover hero includes actual anchored decorative node (not motion-path pseudo)',()=>{
  assert.match(server,/pv-discover-ornament__outer/);
  assert.match(server,/pv-discover-ornament__inner/);
  assert.match(css,/\.pv-discover-ornament\s*\{[^}]*top:50%;[^}]*right:/s);
  assert.match(css,/\.pv-discover-ornament__outer\s*\{[^}]*pv-an-centered-orbit/s);
  assert.match(css,/\.pv-discover-ornament__inner\s*\{[^}]*pv-an-centered-orbit/s);
  assert.match(css,/\.hero:not\(\.pv-hero\):has\(\.stat-grid\)::before,[\s\S]*?content:none !important/);
});
test('Discover search band keeps full width and equal seam before and after boundary',()=>{
  assert.match(css,/\.pv-discovery-search-band\s*\{[^}]*display:flex !important;[^}]*align-items:center !important;[^}]*justify-content:center !important;/s);
  assert.match(css,/\.pv-discovery-search-band > \.pv-discovery-shell\s*\{[^}]*align-self:center !important;/s);
  const aq=css.slice(css.lastIndexOf('/* AQ / 2026-11-15'));
  assert.match(aq,/--pv-discover-seam:\s*clamp\(42px,4\.4vw,60px\)/);
  assert.match(aq,/\.pv-discovery-stage > \.pv-match-finder\s*\{\s*margin-bottom:\s*var\(--pv-discover-seam\) !important;/);
  assert.match(aq,/\.pv-discovery-stage > \.pv-discovery-search-band\s*\{\s*padding-top:\s*var\(--pv-discover-seam\) !important;\s*padding-bottom:\s*var\(--pv-discover-seam\) !important;/);
  assert.match(aq,/@media\(max-width:760px\)[\s\S]*--pv-discover-seam:\s*31px/);
});
test('animations respect reduced-motion and version is updated',()=>{
  assert.match(css,/@media\(prefers-reduced-motion:reduce\)[\s\S]*?\.pv-discover-ornament__outer/);
  assert.match(css,/html\[data-pv-motion="off"\] body #main-content \.pv-discover-ornament__outer/);
  assert.match(server,/pir-public-polish\.css\?v=20261115ar/);
});
