import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const css = fs.readFileSync(new URL('../pir-public-polish.css', import.meta.url), 'utf8');
const server = fs.readFileSync(new URL('../server.js', import.meta.url), 'utf8');

test('Category heading exposes the descender of the g in looking', () => {
  const rule = css.split('PIR Visuals / 2026-11-16bb')[1] || '';
  assert.match(rule, /\.pv-home-motion \.pv-category-section \.pv-section-top h2\.pv-managed-title\s*\{[\s\S]*?overflow:visible\s*!important/);
});

test('Fix is scoped to category section and does not alter other story animations', () => {
  assert.match(server, /\.pv-home-motion \.pv-section-top h2\{overflow:hidden\}/);
  assert.match(server, /What are you\\nlooking to create\?/);
  assert.match(server, /pir-public-polish\.css\?v=20261118bi/);
});
