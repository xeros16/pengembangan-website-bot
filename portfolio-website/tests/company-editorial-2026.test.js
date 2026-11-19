import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const project = path.resolve(import.meta.dirname, '..');
const server = fs.readFileSync(path.join(project, 'server.js'), 'utf8');
const css = fs.readFileSync(path.join(project, 'company-editorial.css'), 'utf8');
test('global editorial CSS is linked on the shared shell and served as a local asset', () => {
 assert.match(server, /href="\/company-editorial\.css\?v=20261114e"/);
 assert.match(server, /\['editorial-theme\.css', 'editorial-art\.svg', 'company-editorial\.css'\]/);
 assert.ok(css.includes('company-editorial-hero'));
});
test('business landing route is present and does not alter existing information routes', () => {
 assert.match(server, /parts\[0\] === 'for-business'/);
 assert.match(server, /renderInfoPage\('for-business'\)/);
 assert.match(server, /\['about', 'how-it-works', 'privacy', 'terms', 'contact'\]/);
});
test('all pages share a responsive navigation and the company edition honours reduced motion', () => {
 assert.match(server, /id="main-nav"/);
 assert.match(css, /@media \(max-width:600px\)/);
 assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
});
