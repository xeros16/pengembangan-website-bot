import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const css = fs.readFileSync(new URL('../pir-showcase-editorial.css', import.meta.url), 'utf8');
const server = fs.readFileSync(new URL('../server.js', import.meta.url), 'utf8');

test('desktop showcase artwork uses the full media column as its centering reference', () => {
  assert.match(css, /justify-self:\s*stretch\s*!important/);
  assert.match(css, /inline-size:\s*100%\s*!important/);
  assert.match(css, /place-items:\s*center\s*!important/);
  assert.match(css, /align-self:\s*center\s*!important/);
  assert.match(css, /margin:\s*0 auto\s*!important/);
});

test('exact media-centering stylesheet is cache-busted', () => {
  assert.match(server, /pir-showcase-editorial\.css\?v=20261118-image-fill-center-r/);
});
