import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../server.js', import.meta.url), 'utf8');
const rootPackage = JSON.parse(fs.readFileSync(new URL('../../package.json', import.meta.url), 'utf8'));
const websitePackage = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const websiteLock = JSON.parse(fs.readFileSync(new URL('../package-lock.json', import.meta.url), 'utf8'));

function luminance(hex) {
  const values = [1, 3, 5].map(index => parseInt(hex.slice(index, index + 2), 16) / 255);
  const linear = values.map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}
function contrast(foreground, background) {
  const [light, dark] = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (light + 0.05) / (dark + 0.05);
}

test('v5.81.0 release metadata, asset versions and service-worker cache are aligned', () => {
  assert.equal(rootPackage.version, '6.7.2');
  assert.equal(websitePackage.version, '3.50.0');
  assert.equal(websiteLock.version, '3.50.0');
  assert.ok(source.includes("version: '6.7.2'"));
  assert.ok(source.includes("const CACHE='pir-visuals-public-v46'"));
  for (const asset of ['/icon.svg?v=6710', '/public-ui.js?v=6710', '/pwa-register.js?v=6710', '/studio-upload.js?v=6712']) {
    assert.ok(source.includes(asset), `missing ${asset}`);
  }
});

test('GSAP and ScrollTrigger are pinned in website dependencies and lockfile', () => {
  assert.equal(websitePackage.dependencies.gsap, '3.15.1');
  assert.equal(websiteLock.packages[''].dependencies.gsap, '3.15.1');
  assert.equal(websiteLock.packages['node_modules/gsap'].version, '3.15.1');
  assert.ok(websiteLock.packages['node_modules/gsap'].resolved.endsWith('/gsap-3.15.1.tgz'));
  assert.ok(rootPackage.scripts['website:install'].includes('npm ci --prefix portfolio-website'));
});

test('GSAP browser assets load locally in the correct order before the public UI', () => {
  const core = source.indexOf('/vendor/gsap.min.js?v=6710');
  const scroll = source.indexOf('/vendor/ScrollTrigger.min.js?v=6710');
  const ui = source.indexOf('/public-ui.js?v=6710');
  assert.ok(core >= 0 && scroll > core && ui > scroll);
  assert.match(source, /parts\[0\] === 'vendor' && parts\.length === 2/);
  assert.match(source, /\['gsap\.min\.js','ScrollTrigger\.min\.js'\]\.includes\(parts\[1\]\)/);
  assert.match(source, /node_modules', 'gsap', 'dist', parts\[1\]/);
  assert.match(source, /GSAP belum terpasang/);
});

test('GSAP powers homepage timelines, count-ups, staggered scroll reveals and ribbon motion', () => {
  assert.ok(source.includes('gsapMotion.registerPlugin(window.ScrollTrigger)'));
  assert.ok(source.includes('gsapMotion.timeline('));
  assert.ok(source.includes('gsapMotion.fromTo('));
  assert.ok(source.includes('gsapMotion.to(ribbonTrack'));
  assert.ok(source.includes('data-pv-gsap-story-item'));
  assert.ok(source.includes('window.ScrollTrigger.refresh()'));
  assert.ok(source.includes("duration:1.4,ease:'power4.out'"));
});

test('Existing IntersectionObserver and CSS motion remain as a graceful fallback', () => {
  assert.ok(source.includes("(!gsapMotion&&'IntersectionObserver' in window && !motionReduced)"));
  assert.ok(source.includes('else if(revealObserver)revealObserver.observe(el)'));
  assert.ok(source.includes("else storyNodes.forEach(node=>node.classList.add('is-visible'))"));
  assert.ok(source.includes('pv-motion-ready'));
});

test('Reduced-motion preference and the website motion toggle disable GSAP motion', () => {
  assert.ok(source.includes("window.matchMedia('(prefers-reduced-motion: reduce)').matches"));
  assert.ok(source.includes("const gsapMotion=(!motionReduced&&window.gsap&&window.ScrollTrigger)?window.gsap:null"));
  assert.ok(source.includes('gsapMotion.globalTimeline.pause()'));
  assert.ok(source.includes("document.documentElement.dataset.pvMotion=off?'off':'on'"));
  assert.ok(source.includes('@media(prefers-reduced-motion:reduce)'));
});

test('Light Mode hero index copy is dark enough on the ivory card', () => {
  assert.ok(source.includes('html[data-theme="light"] #main-content .pv-hero .pv-index > p'));
  assert.ok(source.includes('color:#4B594E!important'));
  assert.ok(source.includes('-webkit-text-fill-color:#4B594E!important'));
  assert.ok(contrast('#4B594E', '#FFFEFA') >= 4.5);
  assert.ok(source.includes('font-size:11px'));
  assert.ok(source.includes('font-size:8px'));
});

test('Light Mode hero index headings, metric labels and supporting copy all receive explicit contrast overrides', () => {
  for (const selector of [
    '.pv-index .pv-index-heading',
    '.pv-index .pv-index-total span',
    '.pv-index .pv-index-metrics small',
    '.pv-index > p'
  ]) {
    assert.ok(source.includes(selector), `missing contrast selector ${selector}`);
  }
  assert.ok(source.includes('background:#FFFEFA!important'));
  assert.ok(source.includes('border-color:#CDD7CC!important'));
});

test('GSAP timelines use valid relative position offsets for overlap sequencing', () => {
  for (const offset of ["'-=0.08'", "'-=0.18'", "'-=0.30'", "'-=0.68'", "'-=0.12'"]) {
    assert.ok(source.includes(offset), `missing timeline offset ${offset}`);
  }
  assert.ok(!source.includes("'-.08'"));
  assert.ok(!source.includes("'-.30'"));
});
