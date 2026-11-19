import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { Script } from 'node:vm';
import { register } from 'node:module';
import { DesignerProfile, PortfolioItem, ClientMoodboard } from '../models.js';

register('./mock-sharp-loader.mjs', import.meta.url);
const { startPublicPortfolioServer } = await import('../server.js');

const root = new URL('../', import.meta.url);
const source = fs.readFileSync(new URL('../server.js', import.meta.url), 'utf8');
const security = fs.readFileSync(new URL('../security.js', import.meta.url), 'utf8');
const packageJson = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const rootPackage = JSON.parse(fs.readFileSync(new URL('../../package.json', import.meta.url), 'utf8'));

const editToken = 'c'.repeat(64);
const publicBoard = {
  _id: 'audit-board-id',
  slug: 'audit-board',
  title: 'Final Audit Collection',
  description: 'Collection used for final release response checks.',
  designerIds: [],
  itemIds: [],
  isPublic: true,
  viewCount: 0,
  editTokenHash: crypto.createHash('sha256').update(editToken).digest('hex'),
};
const profile = {
  designerId: 'DSN-A1B2C3D4',
  displayName: 'Audit Designer',
  slug: 'audit-designer',
  isPublic: true,
};
const originals = {};
let server;
let base;

function queryResult(value) {
  return {
    select() { return this; },
    sort() { return this; },
    limit() { return this; },
    lean: async () => value,
    distinct: async () => [],
  };
}

before(async () => {
  process.env.PORTFOLIO_WEB_HOST = '127.0.0.1';
  process.env.PORTFOLIO_WEB_PORT = '39188';
  process.env.PORTFOLIO_PUBLIC_BASE_URL = 'http://127.0.0.1:39188';
  base = process.env.PORTFOLIO_PUBLIC_BASE_URL;

  for (const [model, method, replacement] of [
    [DesignerProfile, 'findOne', () => queryResult(profile)],
    [DesignerProfile, 'find', () => queryResult([])],
    [PortfolioItem, 'find', () => queryResult([])],
    [ClientMoodboard, 'findOne', () => queryResult(publicBoard)],
    [ClientMoodboard, 'updateOne', async () => ({ matchedCount: 1 })],
  ]) {
    const key = `${model.modelName}.${method}`;
    originals[key] = model[method];
    model[method] = replacement;
  }

  server = startPublicPortfolioServer();
  if (!server.listening) await new Promise((resolve, reject) => {
    server.once('listening', resolve);
    server.once('error', reject);
  });
});

after(async () => {
  if (server?.listening) {
    await new Promise(resolve => server.close(resolve));
    server.closeAllConnections?.();
  }
  delete globalThis.__designerPortfolioServer;
  for (const [key, value] of Object.entries(originals)) {
    const [modelName, method] = key.split('.');
    const model = [DesignerProfile, PortfolioItem, ClientMoodboard].find(item => item.modelName === modelName);
    if (model) model[method] = value;
  }
});

test('release metadata and website assets are advanced together', () => {
  assert.equal(rootPackage.version, '6.7.2');
  assert.equal(packageJson.version, '3.50.0');
  assert.ok(source.includes("version: '6.7.2'"));
  assert.ok(source.includes("const CACHE='pir-visuals-public-v46'"));
  for (const asset of ['icon.svg?v=6710','public-ui.js?v=6710','pwa-register.js?v=6710','vendor/gsap.min.js?v=6710','vendor/ScrollTrigger.min.js?v=6710']) {
    assert.ok(source.includes(asset), `missing cache-busted asset ${asset}`);
  }
});

test('HTML policy explicitly allows only same-origin executable scripts and safe resources', () => {
  assert.ok(source.includes("script-src 'self'"));
  assert.ok(source.includes("connect-src 'self'"));
  assert.ok(source.includes("img-src 'self' data: https:"));
  assert.ok(source.includes("style-src 'self' 'unsafe-inline'"));
  assert.ok(source.includes("object-src 'none'"));
  assert.ok(source.includes("frame-ancestors 'none'"));
  assert.ok(security.includes("'x-frame-options': 'DENY'"));
});

test('HTML templates contain no inline event-handler attributes that CSP would block', () => {
  for (const attribute of ['onclick','onerror','onsubmit','onchange','oninput','onload','onfocus','onblur']) {
    assert.doesNotMatch(source, new RegExp(`\\b${attribute}\\s*=`, 'i'), `inline ${attribute} handler remains`);
  }
  assert.ok(source.includes('data-pv-confirm'));
  assert.ok(source.includes('data-pv-select-on-click'));
  assert.ok(source.includes('data-pv-hide-on-error'));
  assert.ok(source.includes("form[data-pv-confirm]"));
  assert.ok(source.includes("'[data-pv-select-on-click]'" ) || source.includes("[data-pv-select-on-click]"));
  assert.ok(source.includes("image.hasAttribute('data-pv-hide-on-error')"));
});

test('private collection edit-key responses are not cacheable, indexable or referrable', async () => {
  const response = await fetch(`${base}/collections/${publicBoard.slug}?key=${editToken}`);
  const html = await response.text();
  assert.equal(response.status, 200);
  assert.match(response.headers.get('cache-control') || '', /no-store/i);
  assert.equal(response.headers.get('referrer-policy'), 'no-referrer');
  assert.match(response.headers.get('x-robots-tag') || '', /noindex/i);
  assert.ok(html.includes('Curate this collection.'));
  assert.ok(html.includes('data-pv-select-on-click'));
});

test('public collection pages remain publicly cacheable only when no edit key is present', async () => {
  const response = await fetch(`${base}/collections/${publicBoard.slug}`);
  await response.text();
  assert.equal(response.status, 200);
  assert.match(response.headers.get('cache-control') || '', /public, max-age=60/i);
  assert.equal(response.headers.get('referrer-policy'), 'strict-origin-when-cross-origin');
  assert.match(response.headers.get('x-robots-tag') || '', /index, follow/i);
});

test('QR page uses the shared CSP and keeps both brand icon and QR image permitted', async () => {
  const response = await fetch(`${base}/qr/${profile.designerId}`);
  const html = await response.text();
  const csp = response.headers.get('content-security-policy') || '';
  assert.equal(response.status, 200);
  assert.match(csp, /img-src 'self' data: https:/);
  assert.ok(html.includes('/icon.svg?v=6710'));
  assert.ok(html.includes('https://api.qrserver.com/v1/create-qr-code/'));
  assert.ok(html.includes(`href="${base}/p/${profile.slug}"`));
  assert.match(response.headers.get('x-frame-options') || '', /DENY/i);
});

test('first-party browser bundles compile and are served with JavaScript content types', async () => {
  for (const route of ['/analytics-ui.js','/public-ui.js','/pwa-register.js','/studio-upload.js','/sw.js']) {
    const response = await fetch(`${base}${route}`);
    const body = await response.text();
    assert.equal(response.status, 200, route);
    assert.match(response.headers.get('content-type') || '', /javascript/i, route);
    assert.ok(body.length > 20, route);
    assert.doesNotThrow(() => new Script(body), `${route} must parse as JavaScript`);
  }
});

test('dark and light theme body, muted and primary-action colors meet WCAG AA contrast', () => {
  const extractTheme = name => {
    const matches = [...source.matchAll(new RegExp(`html\\[data-theme="${name}"\\]\\{([^}]+)\\}`, 'g'))];
    assert.ok(matches.length, `missing ${name} theme tokens`);
    return Object.fromEntries([...matches.at(-1)[1].matchAll(/--([a-z-]+):(#(?:[A-Fa-f0-9]{6}));/g)].map(match => [match[1],match[2]]));
  };
  const luminance = color => {
    const rgb = color.slice(1).match(/../g).map(value => parseInt(value,16)/255);
    const linear = rgb.map(value => value <= .04045 ? value/12.92 : ((value+.055)/1.055)**2.4);
    return .2126*linear[0]+.7152*linear[1]+.0722*linear[2];
  };
  const contrast = (left,right) => {
    const values = [luminance(left),luminance(right)].sort((a,b)=>b-a);
    return (values[0]+.05)/(values[1]+.05);
  };
  for (const themeName of ['dark','light']) {
    const theme = extractTheme(themeName);
    assert.ok(contrast(theme.text,theme.bg) >= 4.5, `${themeName} body text contrast`);
    assert.ok(contrast(theme.muted,theme.bg) >= 4.5, `${themeName} muted text contrast`);
    assert.ok(contrast(theme['accent-ink'],theme.accent) >= 4.5, `${themeName} primary action contrast`);
  }
});

test('public information and shortlist routes return the secured shell', async () => {
  for (const route of ['/about','/how-it-works','/privacy','/terms','/contact','/shortlist','/collections']) {
    const response = await fetch(`${base}${route}`);
    const html = await response.text();
    assert.equal(response.status, 200, route);
    assert.match(response.headers.get('content-security-policy') || '', /script-src 'self'/, route);
    assert.match(response.headers.get('x-content-type-options') || '', /nosniff/i, route);
    assert.ok(html.includes('name="viewport"'), route);
    assert.ok(!/<button[^>]*data-theme-toggle/.test(html), `theme toggle must not appear on ${route}`);
  }
});

test('health endpoint is read-only and does not accept mutating methods', async () => {
  const response = await fetch(`${base}/health`, { method: 'POST' });
  assert.equal(response.status, 405);
  assert.match(response.headers.get('allow') || '', /GET/);
  assert.match(response.headers.get('cache-control') || '', /no-store/i);
});

test('service worker only caches same-origin public GET responses and excludes private routes', () => {
  assert.match(source, /if\(r\.method!=='GET'\|\|u\.origin!==location\.origin/);
  assert.match(source, /studio\|dashboard\|admin\|media\|contact\|client/);
  assert.ok(source.includes("/studio-upload.js"));
  assert.ok(source.includes("res.headers.get('cache-control')||''"));
});

test('final smoke checklist includes all critical public and account entry points', () => {
  const smoke = fs.readFileSync(new URL('../scripts/smoke-test.js', import.meta.url), 'utf8');
  for (const route of ['/health','/','/robots.txt','/sitemap.xml','/manifest.webmanifest','/sw.js','/studio']) {
    assert.ok(smoke.includes(`'${route}'`), `missing ${route}`);
  }
  assert.ok(smoke.includes('PIR_CHECK_BOT_HEALTH'));
  assert.ok(smoke.includes("'/vendor/gsap.min.js'"));
  assert.ok(smoke.includes("'/vendor/ScrollTrigger.min.js'"));
  assert.ok(smoke.includes('INDEPENDENT CREATIVE TALENT PLATFORM'));
  assert.ok(smoke.includes('Temukan desainer'));
});

