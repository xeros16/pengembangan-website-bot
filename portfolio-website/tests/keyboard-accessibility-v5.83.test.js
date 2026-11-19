import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../server.js', import.meta.url), 'utf8');
const rootPackage = JSON.parse(fs.readFileSync(new URL('../../package.json', import.meta.url), 'utf8'));
const websitePackage = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const websiteLock = JSON.parse(fs.readFileSync(new URL('../package-lock.json', import.meta.url), 'utf8'));

test('v5.86.0 updates platform, website package, public assets and service-worker cache together', () => {
  assert.equal(rootPackage.version, '6.7.2');
  assert.equal(websitePackage.version, '3.50.0');
  assert.equal(websiteLock.version, '3.50.0');
  assert.ok(source.includes("version: '6.7.2'"));
  assert.ok(source.includes("const CACHE='pir-visuals-public-v46'"));
  for (const asset of ['/icon.svg?v=6710', '/public-ui.js?v=6710', '/pwa-register.js?v=6710', '/vendor/gsap.min.js?v=6710', '/vendor/ScrollTrigger.min.js?v=6710']) {
    assert.ok(source.includes(asset), 'missing cache-busted asset ' + asset);
  }
});

test('command palette announces the number of destinations and an empty search state', () => {
  assert.ok(source.includes('id="pv-command-status" role="status" aria-live="polite" aria-atomic="true"'));
  assert.ok(source.includes('const updateCommandResults=()=>'));
  assert.ok(source.includes('tujuan tersedia'));
  assert.ok(source.includes('Tidak ada tujuan yang cocok. Coba kata kunci lain.'));
  assert.ok(source.includes('updateCommandResults();'));
});

test('command palette supports arrow, Home and End keyboard navigation across visible destinations', () => {
  assert.ok(source.includes("commandDialog?.addEventListener('keydown',event=>"));
  assert.ok(source.includes("!['ArrowDown','ArrowUp','Home','End'].includes(event.key)"));
  assert.ok(source.includes("const visible=commandItems.filter(button=>!button.hidden&&!button.disabled)"));
  assert.ok(source.includes('visible[next].focus()'));
  assert.ok(source.includes("button.setAttribute('aria-keyshortcuts','Control+K Meta+K /')"));
  assert.ok(source.includes('.pv-command-items button:focus-visible'));
});

test('global command shortcuts do not interrupt another open modal dialog', () => {
  assert.ok(source.includes("activeDialog=document.querySelector('dialog[open]')"));
  assert.ok(source.includes('if(activeDialog&&activeDialog!==commandDialog)return'));
});

test('command palette restores focus and clears its search state after closing', () => {
  assert.ok(source.includes("commandDialog?.addEventListener('close',()=>"));
  assert.ok(source.includes('commandItems.forEach(button=>button.hidden=false);updateCommandResults();'));
  assert.ok(source.includes('commandReturnFocus.focus()'));
});

test('portfolio image lightbox announces image position and connects image description to its caption', () => {
  assert.ok(source.includes('data-lightbox-counter role="status" aria-live="polite" aria-atomic="true"'));
  assert.ok(source.includes('aria-describedby="pir-lightbox-caption"'));
  assert.ok(source.includes('class="lightbox-caption" id="pir-lightbox-caption"'));
  assert.ok(source.includes("counter.textContent=String(active+1).padStart(2,'0')"));
});

test('portfolio image lightbox keeps keyboard navigation and restores focus to its opener', () => {
  assert.ok(source.includes("if(event.key==='ArrowRight'){event.preventDefault();dialog._move?.(1);}"));
  assert.ok(source.includes("else if(event.key==='ArrowLeft'){event.preventDefault();dialog._move?.(-1);}"));
  assert.ok(source.includes('if(opener?.isConnected)opener.focus()'));
});

test('native quick-view and image dialogs remain modal and support explicit close controls', () => {
  assert.ok(source.includes('quickDialog.showModal()'));
  assert.ok(source.includes("quickDialog.querySelectorAll('[data-pv-quick-close]')"));
  assert.ok(source.includes('dialog.showModal()'));
  assert.ok(source.includes("dialog.querySelector('.lightbox-close').addEventListener('click',()=>dialog.close())"));
});
