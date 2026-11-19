import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const server = fs.readFileSync(new URL('../server.js', import.meta.url), 'utf8');
const start = server.indexOf('async function renderHome()');
const end = server.indexOf('function renderInfoPage', start);
const home = server.slice(start, end > start ? end : undefined);

test('homepage featured designer cards are defined before the talent section renders', () => {
  assert.ok(start >= 0, 'renderHome must exist');
  const declaration = home.indexOf("const featuredCards = featured.map(designerCard).join('');");
  const usage = home.indexOf('${featuredCards ||');
  assert.ok(declaration >= 0, 'featuredCards must be built from the featured designer query');
  assert.ok(usage > declaration, 'featuredCards must be declared before the homepage talent section uses it');
  assert.match(home, /featured\.map\(designerCard\)\.join\(''\)/);
});
