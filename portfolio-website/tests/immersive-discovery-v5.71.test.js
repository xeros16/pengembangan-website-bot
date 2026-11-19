import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../server.js', import.meta.url), 'utf8');
const rootPackage = JSON.parse(fs.readFileSync(new URL('../../package.json', import.meta.url), 'utf8'));
const websitePackage = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

test('v5.81.0 advances platform, website and public asset cache versions', () => {
  assert.equal(rootPackage.version, '6.7.2');
  assert.equal(websitePackage.version, '3.50.0');
  assert.ok(source.includes("version: '6.7.2'"));
  assert.ok(source.includes("const CACHE='pir-visuals-public-v46'"));
  assert.ok(source.includes('/icon.svg?v=6710'));
  assert.ok(source.includes('/public-ui.js?v=6710'));
  assert.ok(source.includes('/studio-upload.js?v=6712'));
});

test('v5.71.0 adds a grouped immersive lightbox with keyboard and touch navigation', () => {
  assert.ok(source.includes('data-pv-lightbox-group="case-${escapeHtml(work.itemId)}"'));
  assert.ok(source.includes('data-lightbox-prev'));
  assert.ok(source.includes('data-lightbox-next'));
  assert.ok(source.includes("event.key==='ArrowRight'"));
  assert.ok(source.includes("event.key==='ArrowLeft'"));
  assert.ok(source.includes('event.target.closest'));
  assert.ok(source.includes('touchend'));
  assert.ok(source.includes('if(opener?.isConnected)opener.focus();'));
});

test('v5.71.0 adds safe quick designer previews to reusable cards', () => {
  assert.ok(source.includes('data-pv-designer-preview'));
  assert.ok(source.includes('data-preview-name='));
  assert.ok(source.includes('id="pv-designer-quick-view"'));
  assert.ok(source.includes('fields.bio.textContent=trigger.dataset.previewBio'));
  assert.ok(source.includes('const safeAvatar=') && source.includes('/profile-avatar/') && source.includes("img.addEventListener('error'"));
});

test('v5.71.0 selected-work stream is filtered using approved works and public authors', () => {
  assert.ok(source.includes("const workConditions = [{ moderationStatus: 'approved' }];"));
  assert.ok(source.includes('data-pv-work-explorer'));
  assert.ok(source.includes('data-pv-work-filter='));
  assert.ok(source.includes('data-pv-work-search'));
  assert.ok(source.includes('data-pv-work-card'));
  assert.ok(source.includes('const workAuthorById = new Map'));
});

test('v5.71.0 Studio analytics switch uses existing stored daily metrics', () => {
  for (const field of ['data-views=', 'data-contacts=', 'data-portfolio=', 'data-pv-analytics-metric="views"', 'data-pv-analytics-metric="contacts"', 'data-pv-analytics-metric="portfolio"']) assert.ok(source.includes(field));
  assert.ok(source.includes("const copy={views:['Profile traffic.'"));
});

test('v5.71.0 upload preview validates and removes files without changing the upload route', () => {
  assert.ok(source.includes('data-pv-upload-form'));
  assert.ok(source.includes('data-pv-upload-status'));
  assert.ok(source.includes("const allowed=['image/jpeg','image/png','image/webp','image/svg+xml','application/svg+xml']"));
  assert.ok(source.includes('maxSize=15*1024*1024,maxFiles=5'));
  assert.ok(source.includes('new DataTransfer()'));
  assert.ok(source.includes('data-pv-upload-input'));
  assert.ok(source.includes('action="/studio/work/upload"'));
});

test('v5.71.0 new motion respects reduced-motion and Motion Off', () => {
  assert.ok(source.includes('@media(prefers-reduced-motion:reduce){.pv-quick-view-dialog[open]'));
  assert.ok(source.includes('html[data-pv-motion="off"] .pv-quick-view-dialog[open]'));
});
