import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const css = fs.readFileSync(path.join(root, 'pir-whole-site-v3.64.css'), 'utf8');
const server = fs.readFileSync(path.join(root, 'server.js'), 'utf8');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const lock = JSON.parse(fs.readFileSync(path.join(root, 'package-lock.json'), 'utf8'));

test('the final whole-site stylesheet is linked after the existing page styles', () => {
  assert.match(server, /pir-whole-site-v3\.64\.css\?v=20261119a/);
  assert.ok(server.includes("'pir-whole-site-v3.64.css'"));
  assert.ok(server.includes("'pir-whole-site-v3.64.css', 'pir-carousel-branches-left.svg'].includes(parts[0]) ? { revalidate: true"));
});

test('PIR identity tokens use forest, sage, cream, ivory and clay', () => {
  for (const token of [
    '--pir-forest: #20372A', '--pir-forest-deep: #14291D', '--pir-sage: #C7DAAF',
    '--pir-sage-soft: #E4EBDD', '--pir-cream: #F0F3EB', '--pir-ivory: #FCFDF8',
    '--pir-peach: #E8D3C3', '--pir-clay: #AD634A'
  ]) assert.ok(css.includes(token), `Missing token: ${token}`);
});

test('homepage mustard showcase and fourth category card are replaced by PIR colors', () => {
  assert.match(css, /\.pv-category-grid \.home-category:nth-child\(4\)\s*\{\s*background:\s*#D5E2C8/);
  assert.match(css, /\[data-showcase-panel="latest"\] \.pv-showcase-slide\s*\{\s*background:\s*var\(--pir-sage-soft\)/);
  assert.match(css, /\[data-showcase-panel="expensive"\] \.pv-showcase-slide\s*\{\s*background:\s*var\(--pir-peach\)/);
  assert.doesNotMatch(css, /background:\s*#e8c65d/i);
  assert.doesNotMatch(css, /background:\s*#e9c65d/i);
});

test('business service cards use a balanced three-column desktop grid and responsive collapse', () => {
  assert.match(css, /\.company-editorial-business \.company-editorial-grid\s*\{[\s\S]*?grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)/);
  assert.match(css, /@media \(max-width:\s*1024px\)[\s\S]*?grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/);
  assert.match(css, /@media \(max-width:\s*760px\)[\s\S]*?grid-template-columns:\s*minmax\(0,\s*1fr\)/);
});

test('discover, studio, command explorer and portfolio surfaces share the brand system', () => {
  for (const selector of [
    '.pv-discovery-stage', '.pv-match-finder', 'form[action="/studio/login"]',
    '.command-explorer-hero', '.command-explorer-example', '.category-intro',
    '.showcase-work', '.case-footer', '.studio-panel', '.support-form-card'
  ]) assert.ok(css.includes(selector), `Missing page treatment: ${selector}`);
});

test('mobile sizing, focus visibility and reduced-motion safeguards are included', () => {
  assert.match(css, /max-width:\s*760px/);
  assert.match(css, /min-height:\s*44px/);
  assert.match(css, /font-size:\s*16px\s*!important/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /overflow-x:\s*clip/);
});

test('website package metadata is aligned at v3.64.0', () => {
  assert.equal(pkg.version, '3.64.0');
  assert.equal(lock.version, '3.64.0');
  assert.equal(lock.packages[''].version, '3.64.0');
});
