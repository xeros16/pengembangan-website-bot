import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../pir-public-polish.css', import.meta.url), 'utf8');
const server = readFileSync(new URL('../server.js', import.meta.url), 'utf8');

test('interior-page footer breaks out of a constrained content wrapper', () => {
  const block = css.split('PIR Visuals / 2026-11-16ax')[1] || '';
  assert.match(block, /#main-content\.wrap > footer\.foot\.pv-footer\s*\{[\s\S]*?width:100vw !important/);
  assert.match(block, /#main-content\.wrap > footer\.foot\.pv-footer\s*\{[\s\S]*?min-width:100vw !important/);
  assert.match(block, /#main-content\.wrap > footer\.foot\.pv-footer\s*\{[\s\S]*?max-width:none !important/);
});

test('footer is centred against the viewport, not offset by the old wrapper gutter', () => {
  const block = css.split('PIR Visuals / 2026-11-16ax')[1] || '';
  assert.match(block, /margin-left:calc\(50% - 50vw\) !important/);
  assert.match(block, /margin-right:calc\(50% - 50vw\) !important/);
  assert.doesNotMatch(block, /margin-left:calc\(-1 \* clamp\(/);
});

test('full-bleed override is scoped to interior pages and keeps the homepage layout separate', () => {
  const block = css.split('PIR Visuals / 2026-11-16ax')[1] || '';
  assert.match(block, /body:not\(:has\(\.pv-home\)\)/);
  assert.match(block, /#main-content\.wrap > footer\.foot\.pv-footer/);
});

test('page shell requests the new cache-busted public stylesheet', () => {
  assert.match(server, /pir-public-polish\.css\?v=20261118bi/);
});
