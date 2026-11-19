import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.cwd());
const css = fs.readFileSync(path.join(root, 'pir-showcase-editorial.css'), 'utf8');
const server = fs.readFileSync(path.join(root, 'server.js'), 'utf8');
const finalFix = css.slice(css.lastIndexOf('Maximize desktop artwork inside the forest frame'));

test('showcase panel remains full width with a balanced 50/50 split', () => {
  assert.match(css, /\.pv-home-showcase \.pv-showcase-panel\s*\{[\s\S]*max-width:\s*none;[\s\S]*width:\s*100%;[\s\S]*padding:\s*0;/);
  assert.match(css, /grid-template-columns:\s*minmax\(0, 1fr\) minmax\(0, 1fr\) !important/);
});

test('forest backdrop wraps the media ratio with a small inset and no white canvas', () => {
  assert.match(finalFix, /\.pv-showcase-art:has\(> img\)[\s\S]*?width:\s*100% !important[\s\S]*?height:\s*100% !important/);
  assert.match(finalFix, /padding:\s*clamp\(6px, \.65vw, 9px\) !important/);
  assert.match(finalFix, /background:\s*linear-gradient/);
  assert.match(finalFix, /object-fit:\s*contain !important/);
});

test('showcase stylesheet cache key is updated', () => {
  assert.match(server, /\/pir-showcase-editorial\.css\?v=20261118-image-fill-center-r/);
});
