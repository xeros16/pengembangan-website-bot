import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const css = fs.readFileSync(path.join(root, 'pir-reference-blend-v3.62.css'), 'utf8');
const server = fs.readFileSync(path.join(root, 'server.js'), 'utf8');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const lock = JSON.parse(fs.readFileSync(path.join(root, 'package-lock.json'), 'utf8'));

test('PIR brand palette is centralized in the v3.63 harmony layer', () => {
  for (const token of [
    '--pir-forest: #20372A', '--pir-forest-deep: #14291D', '--pir-sage: #C7DAAF',
    '--pir-sage-soft: #E4EBDD', '--pir-cream: #F0F3EB', '--pir-ivory: #FCFDF8',
    '--pir-olive: #7A8450', '--pir-clay: #AD634A', '--pir-peach: #E8D3C3'
  ]) assert.ok(css.includes(token), `Missing token: ${token}`);
});

test('homepage yellow cards are replaced by PIR sage and peach tones', () => {
  assert.match(css, /\.pv-journey-card:nth-child\(1\)\s*\{\s*background:\s*var\(--pir-sage-soft\)/);
  assert.match(css, /\.pv-journey-card:nth-child\(3\)\s*\{\s*background:\s*var\(--pir-peach\)/);
  assert.match(css, /\.home-category:nth-child\(3\)\s*\{\s*background:\s*var\(--pir-peach\)/);
  assert.match(css, /\.pv-home \.pv-journey-card:nth-child\(1\)\s*\{\s*background:\s*var\(--pir-sage-soft\)/);
});

test('business, discovery, login, and command explorer surfaces receive brand styling', () => {
  for (const selector of [
    '.company-editorial-business', '.pv-discovery-stage', 'form[action="/studio/login"]',
    '.command-explorer-hero', '.command-explorer-example'
  ]) assert.ok(css.includes(selector), `Missing page treatment: ${selector}`);
});

test('brand harmony stylesheet is linked and served as a cache-revalidated asset', () => {
  assert.match(server, /pir-reference-blend-v3\.62\.css\?v=20261119b/);
  assert.ok(server.includes("'pir-reference-blend-v3.62.css'"));
  assert.ok(server.includes("'pir-reference-blend-v3.62.css', 'pir-whole-site-v3.64.css', 'pir-carousel-branches-left.svg'"));
  assert.match(server, /'pir-whole-site-v3\.64\.css'.*?cacheControl: 'no-cache, must-revalidate'/);
});

test('version metadata is aligned', () => {
  assert.equal(pkg.version, '3.64.0');
  assert.equal(lock.version, '3.64.0');
  assert.equal(lock.packages[''].version, '3.64.0');
});

test('reduced-motion and mobile form safeguards are present', () => {
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /font-size:\s*16px\s*!important/);
  assert.match(css, /min-height:\s*44px/);
});
