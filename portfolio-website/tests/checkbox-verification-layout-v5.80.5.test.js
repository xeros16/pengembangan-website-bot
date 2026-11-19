import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../server.js', import.meta.url), 'utf8');

test('checkboxes and radio controls override generic form-field dimensions', () => {
  assert.match(source, /#main-content input\[type="checkbox"\],[\s\S]*?width:18px!important;[\s\S]*?height:18px!important;[\s\S]*?min-height:18px!important;[\s\S]*?padding:0!important;/);
});

test('discovery filter labels keep checkbox and text aligned horizontally', () => {
  assert.match(source, /#main-content \.filter-row label\{[\s\S]*?display:inline-flex!important;[\s\S]*?flex-direction:row!important;[\s\S]*?align-items:center!important;/);
});

test('resend verification input and button have a deliberate responsive gap', () => {
  assert.ok(source.includes('class="pv-resend-verification-form"'));
  assert.ok(source.includes('class="pv-resend-verification-controls"'));
  assert.match(source, /\.pv-resend-verification-controls\{[\s\S]*?grid-template-columns:minmax\(0,1fr\) max-content;[\s\S]*?gap:12px;/);
  assert.ok(source.includes('grid-template-columns:minmax(0,1fr);'));
});

test('magnetic mouse-following animation remains in the current release', () => {
  assert.ok(source.includes('v5.80.4 — robust mouse-following motion for every interactive button'));
  assert.ok(source.includes("document.addEventListener('pointermove'"));
  assert.ok(source.includes("document.addEventListener('pointerover'"));
});
