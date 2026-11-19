import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const shell = read('server.js');
const boot = read('pir-intro-boot.js');
const intro = read('pir-intro-experience.js');

test('brand link forces intro on every click including when first-visit intro is already seen', () => {
  const link = shell.match(/const brandMarkup = `([^`]+)`;/)?.[1];
  assert.ok(link);
  assert.match(link, /class="brand" href="\/\?pv_intro=1"/);
  assert.match(link, /<strong>PIR VISUALS<\/strong><small>CREATIVE TALENT NETWORK<\/small>/);
  assert.doesNotMatch(link, /branding\?\.displayName|accountAvatarMarkup|avatarUrl/);
  assert.match(boot, /if \(!force && sessionStorage\.getItem/);
  const states = new Set();
  runInNewContext(boot, {
    location: { pathname: '/', search: '?pv_intro=1' },
    URLSearchParams,
    window: { matchMedia: () => ({ matches: false }) },
    sessionStorage: { getItem: () => '1', setItem: () => {} },
    document: { documentElement: { classList: { add: value => states.add(value) } } },
    performance: { now: () => 1 },
  });
  assert.equal(states.has('pv-intro-active'), true);
});

test('completed intro removes force query but preserves other parameters', () => {
  const states = new Set(['pv-intro-active']);
  const classList = { contains: key => states.has(key), add: key => states.add(key), remove: (...keys) => keys.forEach(key => states.delete(key)) };
  const timers = [];
  const overlay = { hidden: false, offsetWidth:100, querySelector: () => ({ addEventListener: () => {} }) };
  let replaced = null;
  const url = 'http://localhost:3080/?pv_intro=1&source=logo#top';
  const history = { state: { keep: true }, replaceState: (...params) => { replaced = params[2]; } };
  const window = {
    __pvIntroStartedAt: 0,
    location: { href:url, pathname:'/' },
    history,
    setTimeout: (fn, ms) => { timers.push({ fn, ms }); return timers.length; },
    clearTimeout: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
  };
  runInNewContext(intro, {
    window, location: { href: url }, URL,
    document: { documentElement: { classList }, addEventListener:()=>{}, getElementById: () => overlay, readyState: 'complete' },
    performance: { now: () => 10 },
  });
  const hold = timers.find(timer => timer.ms === 3400);
  assert.ok(hold); hold.fn();
  const close = timers.find(timer => timer.ms === 620);
  assert.ok(close); close.fn();
  assert.equal(replaced, '/?source=logo#top');
  assert.equal(overlay.hidden, true);
  assert.equal(states.has('pv-intro-active'), false);
});

test('designer name and avatar remain in the individual showcase instead of replacing the site identity', () => {
  assert.match(shell, /<h1>\$\{escapeHtml\(profile\.displayName\)\}<\/h1>/);
  assert.match(shell, /class="designer-portrait"/);
  assert.match(shell, /profile\.avatarUrl/);
  assert.match(shell, /const brandMarkup = `<a class="brand" href="\/\?pv_intro=1"/);
  assert.doesNotMatch(shell.match(/const brandMarkup = `([^`]+)`;/)?.[1] ?? '', /profile\.avatarUrl|branding\.avatarUrl/);
});
