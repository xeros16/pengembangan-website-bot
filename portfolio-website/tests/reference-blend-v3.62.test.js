import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.cwd());
const server = fs.readFileSync(path.join(root, 'server.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'pir-reference-blend-v3.62.css'), 'utf8');

test('reference blend stylesheet is linked and served as a public asset', () => {
  assert.match(server, /pir-reference-blend-v3\.62\.css\?v=20261119b/);
  assert.match(server, /'pir-reference-blend-v3\.62\.css'/);
});

test('homepage presents user pathways before the community showcase', () => {
  const home = server.slice(server.indexOf('const body = `<div class="pv-home">'), server.indexOf('const seoTitle', server.indexOf('const body = `<div class="pv-home">')));
  assert.ok(home.indexOf('${journeyMarkup}') >= 0);
  assert.ok(home.indexOf('${showcaseMarkup}') >= 0);
  assert.ok(home.indexOf('${journeyMarkup}') < home.indexOf('${showcaseMarkup}'));
});

test('reference blend keeps responsive and reduced-motion fallbacks', () => {
  assert.match(css, /@media \(min-width: 1180px\)/);
  assert.match(css, /@media \(max-width: 600px\)/);
  assert.match(css, /prefers-reduced-motion: reduce/);
});

test('directory filters and designer cards receive collection-style presentation', () => {
  assert.match(css, /grid-template-areas:[\s\S]*"filters heading"/);
  assert.match(css, /pv-filter-panel-inner/);
  assert.match(css, /designer-card-cover/);
});
