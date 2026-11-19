import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const css = fs.readFileSync(new URL('../pir-showcase-editorial.css', import.meta.url), 'utf8');
const server = fs.readFileSync(new URL('../server.js', import.meta.url), 'utf8');
const finalFix = css.slice(css.lastIndexOf('Stable media-ratio forest frame (final)'));

test('showcase keeps the full split composition and uses a fitted forest frame instead of full-bleed crop', () => {
  assert.match(finalFix, /grid-template-columns:\s*minmax\(0, 1fr\) minmax\(0, 1fr\) !important/);
  assert.match(finalFix, /inline-size:\s*fit-content !important/);
  assert.match(finalFix, /object-fit:\s*contain !important/);
  assert.doesNotMatch(finalFix, /object-fit:\s*cover/);
});

test('ratio-led showcase stylesheet is cache-busted', () => {
  assert.match(server, /pir-showcase-editorial\.css\?v=20261119-heading-zoom-safe-b/);
});
