import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const server = fs.readFileSync(new URL('../server.js',import.meta.url),'utf8');
const css = fs.readFileSync(new URL('../pir-public-polish.css',import.meta.url),'utf8');
const change = css.split('PIR Visuals / 2026-11-16bc')[1] || '';
test('The manifesto keeps the PV / 2026 index in its markup',()=>{
  assert.match(server, /pv-manifesto-index">PV \/ 2026<\/span>/);
});
test('Mobile-only index scales down without wrapping',()=>{
  assert.match(change, /@media \(max-width:760px\)/);
  assert.match(change, /font-size:clamp\(12px,3\.2vw,14px\) !important/);
  assert.match(change, /white-space:nowrap/);
  assert.match(change, /flex:0 0 auto/);
});
test('The header index stays opposite the chapter label',()=>{
  assert.match(change, /justify-content:space-between/);
  assert.match(change, /flex-wrap:nowrap/);
  assert.match(change, /pv-manifesto-aside > \.pv-label/);
});
test('Page requests a refreshed style asset',()=>{
  assert.match(server, /pir-public-polish\.css\?v=20261118bi/);
});
