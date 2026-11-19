import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const server = readFileSync(new URL('../server.js', import.meta.url), 'utf8');
const css = readFileSync(new URL('../pir-site-consistency.css', import.meta.url), 'utf8');
const reveal = readFileSync(new URL('../pir-editorial-reveal.js', import.meta.url), 'utf8');
const scroll = readFileSync(new URL('../pir-scroll-experience.js', import.meta.url), 'utf8');

test('final shared stylesheet is loaded after all legacy layers', () => {
  const marker = '/pir-site-consistency.css?v=20261114p';
  assert.ok(server.includes(marker));
  assert.ok(server.indexOf(marker) > server.indexOf('/pir-motion-polish.css?v=20261114n'));
});
test('new CSS/JS assets are directly served with expected content types', () => {
  assert.match(server, /'pir-site-consistency\.css','pir-editorial-reveal\.js'/);
  assert.match(server, /parts\[0\]\.endsWith\('\.css'\) \? 'text\/css; charset=utf-8'/);
});
test('shared navbar uses centered viewport breakout rather than old guessed gutters', () => {
  assert.match(css, /calc\(50% - 50vw\)/);
  assert.match(css, /width:100vw!important/);
  assert.match(css, /max-width:100vw!important/);
});
test('interior pages share forest/sage hero and readable filter controls', () => {
  assert.match(css, /--pir-forest:#20372a/);
  assert.match(css, /--pir-sage:#c7daaf/);
  assert.match(css, /\.pv-match-finder/);
  assert.match(css, /\.pv-discovery-filters/);
  assert.match(css, /\.stat-grid \.stat strong/);
});
test('scroll remains browser-native; editorial reveal only uses observer', () => {
  assert.doesNotMatch(scroll, /addEventListener\(\s*['"]wheel['"]/);
  assert.doesNotMatch(reveal, /addEventListener\(\s*['"]wheel['"]/);
  assert.match(reveal, /IntersectionObserver/);
  assert.match(reveal, /prefers-reduced-motion: reduce/);
});
test('reveal is only applied below the first viewport', () => {
  assert.match(reveal, /el\.getBoundingClientRect\(\)\.top < window\.innerHeight \+ 50/);
  assert.match(css, /\.pir-reveal-pending\.pir-revealed/);
});
