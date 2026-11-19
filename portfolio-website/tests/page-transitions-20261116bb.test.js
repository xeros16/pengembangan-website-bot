import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const server = fs.readFileSync(new URL('../server.js', import.meta.url), 'utf8');
const css = fs.readFileSync(new URL('../pir-page-transitions.css', import.meta.url), 'utf8');
const controller = fs.readFileSync(new URL('../pir-page-transitions.js', import.meta.url), 'utf8');

function createBrowser({ native = false, reduced = false, motionOff = false } = {}) {
  const listeners = new Map();
  const tasks = [];
  const navigated = [];
  const storage = new Map();
  class Element {
    constructor(link) { this.link = link; }
    closest(selector) { return selector === 'a[href]' ? this.link : null; }
  }
  const location = {
    href: 'https://pir.example/about', origin: 'https://pir.example',
    pathname: '/about', search: '', assign(value) { navigated.push(value); }
  };
  const window = {
    location,
    matchMedia: () => ({ matches: reduced }),
    setTimeout(callback, ms) { tasks.push({ callback, ms }); return tasks.length; },
    addEventListener(type, callback) { listeners.set('window:' + type, callback); }
  };
  if (native) { window.onpageswap = null; window.onpagereveal = null; }
  const documentElement = { dataset: { pvMotion: motionOff ? 'off' : 'on' } };
  const document = {
    documentElement,
    addEventListener(type, callback) { listeners.set('document:' + type, callback); }
  };
  const localStorage = {
    getItem: () => motionOff ? 'off' : 'on'
  };
  const sessionStorage = {
    getItem: name => storage.get(name) || null,
    setItem: (name, value) => storage.set(name, value),
    removeItem: name => storage.delete(name)
  };
  vm.runInNewContext(controller, {
    window, document, location, Element, sessionStorage, localStorage, URL, Date
  });
  const click = (href, flags = {}) => {
    const link = {
      href,
      hasAttribute: attr => attr === 'download' ? Boolean(flags.download) : attr === 'data-no-page-transition' ? Boolean(flags.excluded) : false,
      getAttribute: attr => attr === 'target' ? flags.target || null : null,
      relList: { contains: rel => rel === 'external' && Boolean(flags.externalRel) }
    };
    let prevented = false;
    const event = {
      target: new Element(link), button: flags.button || 0,
      metaKey: !!flags.metaKey, ctrlKey: !!flags.ctrlKey,
      shiftKey: !!flags.shiftKey, altKey: !!flags.altKey,
      defaultPrevented: !!flags.defaultPrevented,
      preventDefault() { prevented = true; }
    };
    listeners.get('document:click')?.(event);
    return prevented;
  };
  return { listeners, tasks, navigated, storage, html:documentElement, click };
}

test('page shell serves versioned transition stylesheet and script', () => {
  assert.match(server, /pir-page-transitions\.css\?v=20261116bd/);
  assert.match(server, /pir-page-transitions\.js\?v=20261116bd/);
  assert.match(server, /'pir-page-transitions\.css', 'pir-page-transitions\.js'/);
});

test('native browser uses view transitions and keeps navigation untouched', () => {
  const browser = createBrowser({ native:true });
  assert.equal(browser.html.dataset.pvRouteFallback, undefined);
  assert.equal(browser.listeners.has('document:click'), false);
  assert.match(css, /@view-transition\s*\{\s*navigation:\s*auto;/);
  assert.match(css, /::view-transition-new\(root\)/);
  assert.match(css, /::view-transition-old\(pv-site-nav\)/);
});

test('older browser gently exits, then performs normal same-origin navigation', () => {
  const browser = createBrowser();
  assert.equal(browser.html.dataset.pvRouteFallback, 'true');
  assert.equal(browser.click('https://pir.example/discover'), true);
  assert.equal(browser.html.dataset.pvRouteLeaving, 'true');
  assert.equal(browser.navigated.length, 0);
  assert.equal(browser.tasks.find(task => task.ms === 210) !== undefined, true);
  browser.tasks.find(task => task.ms === 210).callback();
  assert.deepEqual(browser.navigated, ['https://pir.example/discover']);
  assert.equal(browser.storage.size, 1);
});

test('external links, same page, resource downloads and modified clicks stay native', () => {
  const browser = createBrowser();
  const candidates = [
    ['https://elsewhere.example/portfolio', {}],
    ['https://pir.example/about#section', {}],
    ['https://pir.example/api/status', {}],
    ['https://pir.example/images/logo.png', {}],
    ['https://pir.example/contact', {download:true}],
    ['https://pir.example/contact', {target:'_blank'}],
    ['https://pir.example/contact', {ctrlKey:true}],
    ['https://pir.example/contact', {metaKey:true}],
    ['https://pir.example/contact', {defaultPrevented:true}],
    ['https://pir.example/contact', {excluded:true}]
  ];
  for (const [href, flags] of candidates) assert.equal(browser.click(href,flags), false);
  assert.equal(browser.tasks.length, 0);
});

test('reduced motion and On/Off toggle disable fallback transitions', () => {
  for (const options of [{ reduced:true },{ motionOff:true }]) {
    const browser = createBrowser(options);
    assert.equal(browser.click('https://pir.example/categories'), false);
    assert.equal(browser.tasks.length, 0);
  }
  assert.match(css, /@media\s*\(prefers-reduced-motion:reduce\)/);
  assert.match(css, /html\[data-pv-motion="off"\]/);
});

test('return via back-forward cache clears stale exit animation', () => {
  const browser = createBrowser();
  browser.click('https://pir.example/creative-studio');
  browser.listeners.get('window:pageshow')?.({ persisted:true });
  assert.equal(browser.html.dataset.pvRouteLeaving, undefined);
  assert.equal(browser.click('https://pir.example/categories'), true);
});
