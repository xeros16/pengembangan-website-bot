import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const css=readFileSync(new URL('../pir-public-polish.css',import.meta.url),'utf8');
const server=readFileSync(new URL('../server.js',import.meta.url),'utf8');

test('Favorites hero no longer adds an extra top-only gap before its results band',()=>{
  assert.match(css,/html body #main-content\.wrap:has\(> #favorite-results\) > \.hero:not\(\.pv-hero\),[\s\S]*?margin-bottom:0 !important;/);
});

test('Favorites and Shortlist share one equal top/bottom spacing token',()=>{
  assert.match(css,/html body #main-content\.wrap:has\(> #favorite-results\) > #favorite-results,[\s\S]*?--pv-empty-band-space:clamp\(32px,3\.5vw,48px\);[\s\S]*?padding-top:var\(--pv-empty-band-space\) !important;[\s\S]*?padding-bottom:var\(--pv-empty-band-space\) !important;/);
  assert.match(css,/@media\(max-width:760px\) \{[\s\S]*?--pv-empty-band-space:clamp\(24px,6vw,32px\);/);
});

test('Empty-state cards do not add asymmetric outer margins',()=>{
  assert.match(css,/html body #main-content\.wrap:has\(> #favorite-results\) > #favorite-results > \.empty-state,[\s\S]*?margin-top:0 !important;[\s\S]*?margin-bottom:0 !important;/);
});

test('page shell loads the updated public polish stylesheet',()=>{
  assert.match(server,/pir-public-polish\.css\?v=20261118bi/);
  assert.match(server,/parts\[0\] === 'favorites' && req\.method === 'GET'/);
});
