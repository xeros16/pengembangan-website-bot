import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve(import.meta.dirname, '..');
const server = fs.readFileSync(path.join(root, 'server.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'pir-footer-refinement.css'), 'utf8');
const svg = fs.readFileSync(path.join(root, 'pir-footer-landscape.svg'), 'utf8');

test('new footer design stylesheet loads after permanent theme with cache version', () => {
  const old = server.indexOf('/pir-permanent-theme.css?v=20261114g');
  const revised = server.indexOf('/pir-footer-refinement.css?v=20261114h');
  assert.ok(old >= 0 && revised > old);
  assert.match(server, /\['pir-footer-landscape\.svg', 'pir-footer-refinement\.css'\]/);
});
test('footer uses real routes and editorial structure', () => {
  assert.match(server, /<footer class="foot pv-footer"/);
  assert.match(server, /Temukan talenta\.<br><em>Wujudkan ide besar\.<\/em>/);
  assert.match(server, /class="pv-footer-navigation footer-grid"/);
  assert.match(server, /src="\/pir-footer-landscape\.svg"/);
  for (const href of ['/discover', '/categories', '/for-business', '/contact', '/privacy', '/terms', '/studio']) assert.ok(server.includes(`href="${href}"`));
});
test('active navbar explicitly uses forest background and ivory text', () => {
  assert.match(css, /a\[aria-current="page"\][\s\S]*?background: #365B40 !important/);
  assert.match(css, /-webkit-text-fill-color: #F7F9ED !important/);
  assert.match(css, /a\.nav-cta\[aria-current="page"\]/);
});
test('one permanent theme remains without the light/dark switch', () => {
  assert.match(server, /<html lang="id" data-theme="light">/);
  assert.doesNotMatch(server, /data-theme-toggle aria-pressed/);
  assert.match(css, /One permanent theme only/);
});
test('custom illustration is authored locally and SVG-shaped', () => {
  assert.match(svg, /<svg /);
  assert.match(svg, /Bentang ide PIR Visuals/);
  assert.match(svg, /viewBox="0 0 1600 530"/);
  assert.doesNotMatch(svg, /<image[^>]+https?:\/\//);
});
test('mobile footer and navbar have dedicated layout rules', () => {
  assert.match(css, /@media\(max-width:600px\)/);
  assert.match(css, /grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(css, /@media\(max-width:850px\)/);
});
