import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const css = fs.readFileSync(new URL('../pir-public-polish.css', import.meta.url), 'utf8');
const server = fs.readFileSync(new URL('../server.js', import.meta.url), 'utf8');

test('Company editorial main shell can reach both viewport edges at wide zoom widths', () => {
  const block = css.split('PIR Visuals / 2026-11-16aw')[1] || '';
  assert.match(block, /#main-content\.wrap:has\(> \.company-editorial\)\s*\{[\s\S]*?width:100%\s*!important/);
  assert.match(block, /#main-content\.wrap:has\(> \.company-editorial\)\s*\{[\s\S]*?max-width:none\s*!important/);
});

test('About editorial wrapper has no top spacer and remains full viewport width', () => {
  const block = css.split('PIR Visuals / 2026-11-16aw')[1] || '';
  assert.match(block, /:has\(> \.company-editorial > \.company-editorial-hero\) > \.company-editorial\s*\{[\s\S]*?width:100vw\s*!important/);
  assert.match(block, /:has\(> \.company-editorial > \.company-editorial-hero\) > \.company-editorial\s*\{[\s\S]*?padding:0 0 clamp\(/);
  assert.match(block, /margin:0 0 0 calc\(50% - 50vw\)\s*!important/);
});

test('About hero is full bleed while preserving responsive inner padding', () => {
  const block = css.split('PIR Visuals / 2026-11-16aw')[1] || '';
  assert.match(block, /:has\(> \.company-editorial > \.company-editorial-hero\) > \.company-editorial > \.company-editorial-hero\s*\{[\s\S]*?width:100vw\s*!important/);
  assert.match(block, /:has\(> \.company-editorial > \.company-editorial-hero\) > \.company-editorial > \.company-editorial-hero\s*\{[\s\S]*?max-width:100vw\s*!important/);
  assert.match(block, /@media\(max-width:760px\)[\s\S]*?padding:32px 20px\s*!important/);
});

test('About page keeps existing editorial content and serves the updated stylesheet', () => {
  assert.match(server, /company-editorial-hero/);
  assert.match(server, /company-editorial-grid/);
  assert.match(server, /pir-public-polish\.css\?v=20261118bi/);
});
