import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../pir-home-showcase.js', import.meta.url), 'utf8');

function runAtWidth(width, initial = {}) {
  const declarations = new Map(Object.entries(initial));
  const makeStyle = () => {
    const values = new Map();
    return {
      values,
      setProperty(name, value, priority) { values.set(name, { value, priority }); },
      removeProperty(name) { values.delete(name); },
    };
  };
  const price = { style: makeStyle() };
  const creatorLink = { style: makeStyle() };
  const copy = {
    style: {
      setProperty(name, value, priority) { declarations.set(name, { value, priority }); },
      removeProperty(name) { declarations.delete(name); },
    },
    querySelectorAll(selector) {
      return selector === '.pv-showcase-meta strong, .pv-showcase-byline a' ? [price, creatorLink] : [];
    },
  };
  const slide = {
    classList: { toggle() {} },
    setAttribute() {},
    querySelector() { return null; },
  };
  const panel = {
    dataset: { showcasePanel: 'latest' },
    hidden: false,
    querySelector() { return null; },
    querySelectorAll(selector) { return selector === '[data-showcase-slide]' ? [slide] : []; },
  };
  const tab = {
    dataset: { showcaseTab: 'latest' },
    classList: { toggle() {} },
    setAttribute() {},
    addEventListener() {},
  };
  const root = {
    dataset: {},
    querySelectorAll(selector) {
      if (selector === '[data-showcase-tab]') return [tab];
      if (selector === '[data-showcase-panel]') return [panel];
      if (selector === '[data-pv-showcase-copy]') return [copy];
      return [];
    },
    querySelector() { return null; },
    addEventListener() {},
    matches() { return false; },
    contains() { return false; },
  };
  const document = {
    hidden: false,
    activeElement: null,
    querySelector(selector) { return selector === '[data-pv-showcase]' ? root : null; },
    addEventListener() {},
  };
  const window = {
    matchMedia(query) {
      return {
        matches: query.includes('min-width') ? width >= 901 : false,
        addEventListener() {},
      };
    },
    addEventListener() {},
  };
  vm.runInNewContext(source, { document, window, Map, Math, String, Number });
  return { declarations, root, price, creatorLink };
}

test('desktop runtime keeps the left inset and clears the overshooting right-side text offset', () => {
  const { declarations, root, price, creatorLink } = runAtWidth(1366);
  const left = declarations.get('padding-left');
  const right = declarations.get('padding-right');
  assert.deepEqual(left, { value: 'clamp(76px, 6.8vw, 104px)', priority: 'important' });
  assert.deepEqual(right, { value: 'clamp(16px, 1.8vw, 24px)', priority: 'important' });
  assert.notDeepEqual(right, left);
  assert.equal(price.style.values.has('left'), false);
  assert.equal(creatorLink.style.values.has('left'), false);
  assert.equal(root.dataset.copyInsetRuntime, '20261118h');
});

test('mobile runtime removes the desktop-only padding overrides', () => {
  const { declarations, price, creatorLink } = runAtWidth(402, {
    'padding-left': { value: 'old', priority: 'important' },
    'padding-right': { value: 'old', priority: 'important' },
  });
  assert.equal(declarations.has('padding-left'), false);
  assert.equal(declarations.has('padding-right'), false);
  assert.equal(price.style.values.has('left'), false);
  assert.equal(creatorLink.style.values.has('left'), false);
});
