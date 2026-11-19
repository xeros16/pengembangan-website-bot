import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../server.js', import.meta.url), 'utf8');
const rootPackage = JSON.parse(fs.readFileSync(new URL('../../package.json', import.meta.url), 'utf8'));
const websitePackage = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

test('v5.73 advances package, service-worker and public-asset versions', () => {
  assert.equal(rootPackage.version, '6.7.2');
  assert.equal(websitePackage.version, '3.50.0');
  assert.ok(source.includes("version: '6.7.2'"));
  assert.ok(source.includes("const CACHE='pir-visuals-public-v46'"));
  assert.ok(source.includes('/icon.svg?v=6710'));
  assert.ok(source.includes('/public-ui.js?v=6710'));
  assert.ok(source.includes('/studio-upload.js?v=6712'));
});

test('the previous immersive motion language is retained', () => {
  for (const marker of [
    'pv-home-motion',
    'pv-hero-word',
    'pv-scroll-progress',
    'pv-soft-float',
    'pv-ribbon-travel',
    'pv-depth-active',
    'pv-magnetic',
    'pv-motion-ready',
    'data-pv-reveal'
  ]) assert.ok(source.includes(marker), `missing preserved motion marker: ${marker}`);
});

test('restoring Motion On reloads the page to reinitialize observers and pointer listeners', () => {
  assert.ok(source.includes("sessionStorage.setItem('pv_motion_restore_notice','1')"));
  assert.ok(source.includes("sessionStorage.getItem('pv_motion_restore_notice')==='1'"));
  assert.ok(source.includes('window.location.reload()'));
  assert.ok(source.includes('motionButton.dataset.motionState=systemMotionReduced?\'reduced\':off?\'off\':\'on\''));
});

test('same-origin page transitions are progressive and disabled for reduced motion', () => {
  assert.ok(source.includes('@view-transition{navigation:auto}'));
  assert.ok(source.includes('::view-transition-new(pv-main-content)'));
  assert.ok(source.includes('html[data-pv-motion="off"]::view-transition-new(root)'));
  assert.ok(source.includes('@media(prefers-reduced-motion:reduce)'));
});

test('case study gains batched cover parallax and chapter reading progress', () => {
  assert.ok(source.includes('--pv-case-parallax'));
  assert.ok(source.includes('--pv-chapter-progress'));
  assert.ok(source.includes('const caseStudy=document.querySelector'));
  assert.ok(source.includes('requestAnimationFrame(paintCaseCover)'));
});

test('gallery and filtered discovery cards use short motion-safe transitions', () => {
  assert.ok(source.includes("image.classList.add('is-changing')"));
  assert.ok(source.includes('pv-lightbox-image-enter'));
  assert.ok(source.includes('pv-filter-enter'));
  assert.ok(source.includes('if(visible&&wasHidden&&!motionReduced)') || source.includes('if(visible){shown++;if(wasHidden&&!motionReduced)'));
});
