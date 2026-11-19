import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const server = fs.readFileSync(new URL('../server.js', import.meta.url), 'utf8');
const visual = fs.readFileSync(new URL('../visual-system.css', import.meta.url), 'utf8');

test('public Creative Studio page documents bot features without executing commands or exposing private data', () => {
  assert.ok(server.includes("parts[0] === 'creative-studio' && parts.length === 1 && req.method === 'GET'"));
  assert.ok(server.includes("pageShell('Creative Studio — PIR Visuals'"));
  for (const feature of ['Creative Asset Library', 'Sticker Studio', 'Voice Lab', 'Design Seasons', 'Cuaca & Gempa', 'Multifunction Hub']) assert.ok(server.includes(feature));
  for (const command of ['.assetstudio simpan', '.sticker bulat', '.bass', '.voice help', '.8d', '.karaoke', '.tempo 1.25', '.cuaca Bandung', '.gempa', '.designseason submit', '.music top', '.music preview', '.dl apple', '.anime populer', '.mediaformat cek']) assert.ok(server.includes(command));
  assert.ok(server.includes('href="/creative-studio"'));
  assert.ok(server.includes("{loc:`${base}/creative-studio`,priority:'0.7'}"));
  assert.ok(server.includes('visual-system.css?v=6710'));
  assert.ok(!server.includes('CreativeAsset.find('), 'public guide must not query private asset records');
  assert.ok(!server.includes('DesignSeason.find('), 'public guide must not expose group season records');
});

test('Creative Studio feature cards inherit semantic Light/Dark tokens and responsive layout', () => {
  assert.ok(server.includes('var(--surface)'));
  assert.ok(server.includes('var(--bg-soft)'));
  assert.ok(server.includes('var(--line)'));
  assert.ok(server.includes('@media(max-width:760px)'));
  assert.ok(server.includes('pv-creative-hero-inner'));
  assert.ok(server.includes('pv-creative-grid-inner'));
  assert.ok(server.includes('pv-creative-bottom-inner'));
  assert.ok(visual.includes('[data-theme="light"]'));
  assert.ok(visual.includes(':focus-visible'));
  assert.ok(visual.includes('prefers-reduced-motion: reduce'));
});
