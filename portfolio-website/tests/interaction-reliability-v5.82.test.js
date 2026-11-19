import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const root = new URL('../../', import.meta.url);
const source = fs.readFileSync(new URL('../server.js', import.meta.url), 'utf8');
const rootPackage = JSON.parse(fs.readFileSync(new URL('../../package.json', import.meta.url), 'utf8'));
const websitePackage = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const websiteLock = JSON.parse(fs.readFileSync(new URL('../package-lock.json', import.meta.url), 'utf8'));

test('v5.82.0 advances platform, website, public assets and service-worker cache together', () => {
  assert.equal(rootPackage.version, '6.7.2');
  assert.equal(websitePackage.version, '3.50.0');
  assert.equal(websiteLock.version, '3.50.0');
  assert.ok(source.includes("version: '6.7.2'"));
  assert.ok(source.includes("const CACHE='pir-visuals-public-v46'"));
  for (const asset of ['/icon.svg?v=6710', '/public-ui.js?v=6710', '/pwa-register.js?v=6710', '/vendor/gsap.min.js?v=6710', '/studio-upload.js?v=6712']) {
    assert.ok(source.includes(asset), 'missing cache-busted asset ' + asset);
  }
});

test('clipboard helper retries with a local selection fallback when Clipboard API is denied', () => {
  assert.ok(source.includes('const copyText=async value=>'));
  assert.ok(source.includes('navigator.clipboard?.writeText'));
  assert.ok(source.includes("document.execCommand('copy')"));
  assert.ok(source.includes("if(!copied)throw new Error('copy-unavailable')"));
  assert.ok(source.includes("field.setSelectionRange(0,field.value.length)"));
  assert.ok(source.includes('const previousFocus=document.activeElement'));
  assert.ok(source.includes('previousFocus.focus({preventScroll:true})'));
});

test('one-time WhatsApp verification code uses the accessible shared copy action', () => {
  assert.ok(source.includes('data-pv-copy-text="${escapeHtml(token)}"'));
  assert.ok(source.includes("event.target.closest('[data-pv-copy-text],[data-copy-support-ticket]')"));
  assert.ok(source.includes('Kode berhasil disalin.'));
  assert.ok(source.includes('Salin manual kode yang tampil di atas.'));
});

test('support ticket copy uses the shared clipboard fallback and live status', () => {
  assert.ok(source.includes('data-copy-support-ticket="${ticketId}"'));
  assert.ok(source.includes('Nomor tiket berhasil disalin.'));
  assert.ok(source.includes('Salin manual nomor tiket yang tampil di atas.'));
  assert.ok(source.includes('[data-support-copy-status]'));
});

test('profile, collection and shortlist sharing all use the same clipboard fallback', () => {
  assert.ok(source.includes("document.querySelectorAll('[data-share-profile]')"));
  assert.ok(source.includes("await copyText(payload.url)"));
  assert.ok(source.includes("document.querySelectorAll('[data-share-board]')"));
  assert.ok(source.includes('await copyText(shareUrl)'));
  assert.ok(source.includes("document.querySelector('[data-shortlist-share]')"));
  assert.ok(source.includes('await copyText(url.href)'));
  assert.ok(source.includes('Link shortlist berhasil disalin.'));
});

test('native POST forms receive a duplicate-submit guard only after existing validation accepts the submit', () => {
  assert.ok(source.includes("if(event.defaultPrevented)return"));
  assert.ok(source.includes("if(form.dataset.pvSubmitLocked==='true'){event.preventDefault();return;}"));
  assert.ok(source.includes("form.dataset.pvSubmitLocked='true'"));
  assert.ok(source.includes("form.setAttribute('aria-busy','true')"));
  assert.ok(source.includes("control.setAttribute('aria-disabled','true')"));
  assert.ok(source.includes('Sedang mengirim formulir…'));
});

test('password and confirmation fields receive client-side equality validation without replacing server validation', () => {
  assert.ok(source.includes("form.elements.namedItem('confirmPassword')"));
  assert.ok(source.includes("form.elements.namedItem('newPassword')||form.elements.namedItem('password')"));
  assert.ok(source.includes("confirmField.setCustomValidity(mismatch?'Konfirmasi password belum sama.':''"));
  assert.ok(source.includes("primaryField.addEventListener('input',sync)"));
  assert.ok(source.includes("confirmField.addEventListener('input',sync)"));
});

test('form feedback styles are visible, reduced-motion-safe and do not disable native form submission controls', () => {
  assert.ok(source.includes('.pv-form-submitting button[type=submit]'));
  assert.ok(source.includes('.pv-submit-locked:after'));
  assert.ok(source.includes('.pv-form-submit-status'));
  assert.ok(source.includes('@media(prefers-reduced-motion:reduce){.pv-submit-locked:after{animation:none'));
  assert.ok(!source.includes('control.disabled=true'));
});
