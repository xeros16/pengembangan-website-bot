import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const server = fs.readFileSync(new URL('../server.js', import.meta.url), 'utf8');
const css = fs.readFileSync(new URL('../pir-public-polish.css', import.meta.url), 'utf8');
const block = css.split('PIR Visuals / 2026-11-16ba')[1] || '';

test('Client Workspace landing groups its eyebrow, title, copy, invite note and CTA in one rail', () => {
  assert.match(server, /class="pv-client-confirmation pv-client-landing"><div class="pv-client-landing-inner">/);
  assert.match(server, /pv-client-landing-inner[\s\S]*?PIR VISUALS \/ CLIENT WORKSPACE[\s\S]*?One shared space\.[\s\S]*?pv-invite-pending[\s\S]*?Temukan desainer/);
  assert.match(server, /pir-public-polish\.css\?v=20261118bi/);
  assert.match(block, /pv-client-landing-inner\s*\{[\s\S]*?width:min\(936px,100%\)\s*!important/);
  assert.match(block, /pv-client-landing-inner\s*\{[\s\S]*?align-items:flex-start\s*!important/);
});

test('Client Workspace removes the trailing gap before the shared footer', () => {
  assert.match(block, /#main-content\.wrap:has\(> \.pv-client-landing\)\s*\{[\s\S]*?padding-bottom:0\s*!important/);
  assert.match(block, /#main-content\.wrap > \.pv-client-landing\s*\{[\s\S]*?margin-bottom:0\s*!important/);
  assert.match(block, /#main-content\.wrap:has\(> \.pv-client-landing\) > footer\.pv-footer\s*\{[\s\S]*?margin-top:0\s*!important/);
});

test('Client Workspace CTA and eyebrow share the same left-aligned content rail', () => {
  assert.match(block, /pv-client-landing \.eyebrow\s*\{[\s\S]*?text-align:left\s*!important/);
  assert.match(block, /pv-client-landing \.btn\s*\{[\s\S]*?align-self:flex-start\s*!important/);
  assert.match(block, /pv-client-landing-inner > p\s*\{[\s\S]*?text-align:left\s*!important/);
});

test('Homepage hero has matching top and bottom spacing on desktop and mobile', () => {
  assert.match(block, /pv-home > \.pv-hero\s*\{[\s\S]*?padding-top:clamp\(48px,6vw,88px\)\s*!important/);
  assert.match(block, /pv-home > \.pv-hero\s*\{[\s\S]*?padding-bottom:clamp\(48px,6vw,88px\)\s*!important/);
  assert.match(block, /@media\(max-width:760px\)[\s\S]*?padding-top:clamp\(32px,7vw,54px\)\s*!important[\s\S]*?padding-bottom:clamp\(32px,7vw,54px\)\s*!important/);
});
