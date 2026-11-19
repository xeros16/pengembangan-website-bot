import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../server.js', import.meta.url), 'utf8');
const directoryUtils = fs.readFileSync(new URL('../directory-utils.js', import.meta.url), 'utf8');
const rootPackage = JSON.parse(fs.readFileSync(new URL('../../package.json', import.meta.url), 'utf8'));
const websitePackage = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

test('v5.81.0 retains the current release metadata and PWA cache contract', () => {
  assert.equal(rootPackage.version, '6.7.2');
  assert.equal(websitePackage.version, '3.50.0');
  assert.ok(source.includes("version: '6.7.2'"));
  assert.ok(source.includes("const CACHE='pir-visuals-public-v46'"));
  assert.ok(source.includes('/icon.svg?v=6710'));
});

test('v5.69.0 expands reveal coverage across categories, case studies, collections and studio', () => {
  for (const selector of ['.category-intro-copy','.category-intro-note','.category-index-heading','.category-recent-card','.showcase-jumpnav','.showcase-facts','.case-gallery-item','.case-related-card','.shortlist-hero','.shortlist-toolbar','.support-success','.pv-faq details','.studio-sidebar','.case-heading','.case-meta-strip','.case-cover','.case-result-highlight','.case-narrative','.case-creator-card','.case-related-heading','.case-footer']) {
    assert.ok(source.includes(selector), `missing reveal selector ${selector}`);
  }
  assert.ok(source.includes("?'heading':'content'"));
  assert.ok(source.includes('transition-duration:.86s'));
});

test('v5.69.0 adds bounded fine-pointer image depth without transforming card text', () => {
  assert.ok(source.includes("const depthSelector='.showcase-work-image,.home-project-image,.category-tile-art,.category-recent-image,.case-related-image,.case-gallery-item,.case-cover,.designer-portrait'"));
  assert.ok(source.includes('Math.max(1,rect.width)-.5'));
  assert.ok(source.includes('(-ny*3.2).toFixed(2)'));
  assert.ok(source.includes('(nx*4.1).toFixed(2)'));
  assert.ok(source.includes('html[data-pv-motion="off"] .pv-depth-active'));
  assert.ok(source.includes('.pv-depth-active,.pv-depth-active img{transform:none!important;transition:none!important'));
});

test('v5.69.0 Motion Off clears depth state and keeps reveal content visible', () => {
  assert.ok(source.includes("document.querySelectorAll('.pv-depth-active').forEach(el=>{el.classList.remove('pv-depth-active')"));
  assert.ok(source.includes('html[data-pv-motion="off"] [data-pv-reveal]'));
  assert.ok(source.includes('html[data-pv-motion="off"] [data-pv-story]'));
});

test('v5.69.0 discovery filters retain existing query semantics and add accessible mobile disclosure', () => {
  assert.ok(source.includes('class="search-panel pv-discovery-filters" data-discovery-filters'));
  assert.ok(source.includes('name="q"'));
  for (const name of ['skill','category','location','sort','min','max','verified','featured','available']) assert.ok(source.includes(`name="${name}"`));
  assert.ok(source.includes('data-filter-toggle aria-expanded='));
  assert.ok(source.includes('aria-controls="pv-filter-panel"'));
  assert.ok(source.includes('data-filter-count'));
  assert.ok(source.includes("filterPanel.classList.toggle('is-expanded',open)"));
  assert.ok(source.includes("discoveryForm.addEventListener('submit'"));
});

test('v5.69.0 mobile filter disclosure is progressive-enhancement safe', () => {
  const cssStart = source.indexOf('/* v5.69.0 — immersive motion choreography');
  const cssEnd = source.indexOf('</style></head><body>', cssStart);
  const css = source.slice(cssStart, cssEnd);
  assert.ok(css.includes('@media(max-width:760px)'));
  assert.ok(css.includes('.pv-motion-ready .pv-filter-toggle{display:flex}'));
  assert.ok(css.includes('.pv-motion-ready .pv-filter-panel{grid-template-rows:0fr'));
  assert.ok(css.includes('.pv-motion-ready .pv-filter-panel.is-expanded{grid-template-rows:1fr'));
  assert.ok(css.includes('.pv-filter-toggle{display:none'));
});

test('v5.69.0 adds focus, dialog, FAQ and toast feedback while respecting reduced motion', () => {
  assert.ok(source.includes(':where(a,button,input,select,textarea,[tabindex]):focus-visible'));
  assert.ok(source.includes('.pv-command-dialog[open]{animation:pv-dialog-enter'));
  assert.ok(source.includes('.pv-faq-list details[open] p{animation:pv-faq-enter'));
  assert.ok(source.includes('.pv-toast-region.is-visible{animation:pv-toast-enter'));
  assert.ok(source.includes('@media(prefers-reduced-motion:reduce)'));
  assert.ok(source.includes('html[data-pv-motion="off"] .pv-command-dialog[open]'));
});

test('v5.69.0 keeps a single navbar and does not add a second navbar entrance animation', () => {
  assert.equal((source.match(/<header class="site-nav">/g) || []).length, 1);
  assert.ok(source.includes('.pv-motion-ready .site-nav{animation:none!important;opacity:1!important;transform:none!important}'));
  assert.ok(!source.includes('.site-nav{animation:pv-nav-enter'));
});

test('v5.69.0 preserves the existing mobile menu and native search GET behavior', () => {
  assert.ok(source.includes('class="nav-toggle" type="button" aria-expanded="false" aria-controls="main-nav"'));
  assert.ok(source.includes('method="get" action="/discover" class="search-panel pv-discovery-filters"'));
  assert.ok(directoryUtils.includes("const q = String(searchParams.get('q') || '')"));
  assert.ok(directoryUtils.includes("acceptingOnly: searchParams.get('available') === '1'"));
});
