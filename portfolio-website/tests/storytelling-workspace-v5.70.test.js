import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../server.js', import.meta.url), 'utf8');
const rootPackage = JSON.parse(fs.readFileSync(new URL('../../package.json', import.meta.url), 'utf8'));
const websitePackage = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

test('v5.81.0 keeps current release metadata and refreshed public asset caches', () => {
  assert.equal(rootPackage.version, '6.7.2');
  assert.equal(websitePackage.version, '3.50.0');
  assert.ok(source.includes("version: '6.7.2'"));
  assert.ok(source.includes("const CACHE='pir-visuals-public-v46'"));
  assert.ok(source.includes('/icon.svg?v=6710'));
});

test('v5.70.0 collection detail preserves curator order and uses editorial board presentation', () => {
  assert.ok(source.includes('const orderedWorks = (board.itemIds || []).map(id => workById.get(id)).filter(Boolean)'));
  assert.ok(source.includes('class="pv-collection-cover"'));
  assert.ok(source.includes('.pv-collection-cover-copy h2{color:#fff!important}'));
  assert.ok(source.includes('.pv-collection-cover-copy p{color:rgba(255,255,255,.88)!important}'));
  assert.ok(source.includes('class="pv-collection-work-grid"'));
  assert.ok(source.includes('const orderedDesigners = (board.designerIds || []).map(id => designerById.get(id)).filter(Boolean)'));
  assert.ok(source.includes('data-share-board'));
  assert.ok(source.includes('data-share-url="/collections/${encodeURIComponent(board.slug)}"'));
  assert.ok(source.includes('board.isPublic ? `<button class=\"btn btn-secondary\" type=\"button\" data-share-board'));
  assert.ok(source.includes('board.itemIds=itemIds'));
  assert.ok(source.includes('designerIds, itemIds, isPublic: form.get(\'isPublic\')'));
});

test('v5.70.0 collection editor supports drag ordering and keyboard move controls without a new endpoint', () => {
  assert.ok(source.includes('data-pv-order-editor'));
  assert.ok(source.includes('data-pv-sort-item'));
  assert.ok(source.includes('data-pv-order-move="up"'));
  assert.ok(source.includes('data-pv-order-move="down"'));
  assert.ok(source.includes('data-pv-order-remove'));
  assert.ok(source.includes('if(removeButton){const focusTarget=item.nextElementSibling||item.previousElementSibling;item.remove();sync(true);const focusButton=focusTarget?.querySelector(\'button:not(:disabled)\')||input;focusButton?.focus();return;}'));
  assert.ok(source.includes('data-pv-order-input'));
  assert.ok(source.includes("list.insertBefore(item,item.previousElementSibling)"));
  assert.ok(source.includes("input.value=rows.map(item=>item.dataset.itemId).join(', ')"));
});

test('v5.70.0 collection builder provides a live preview while retaining the existing POST contract', () => {
  assert.ok(source.includes('data-pv-collection-form'));
  assert.ok(source.includes('data-pv-preview-title'));
  assert.ok(source.includes('data-pv-preview-designers'));
  assert.ok(source.includes('data-pv-preview-works'));
  assert.ok(source.includes('DESIGNER IDS'));
  assert.ok(source.includes('WORK IDS'));
  assert.ok(source.includes('pv-field-help'));
  assert.ok(source.includes("new Set(String(value||'').split(',').map(part=>part.trim().toUpperCase()).filter(Boolean)).size"));
  assert.ok(source.includes('action="/collections/create"'));
  assert.ok(source.includes("parts[1] === 'create' && req.method === 'POST'"));
});

test('v5.70.0 case studies have contextual chapter navigation and real section anchors', () => {
  for (const id of ['case-overview','case-meta','case-cover','case-gallery','case-highlight','case-process','case-creator','case-related']) {
    assert.ok(source.includes(id), `missing case-study chapter ${id}`);
  }
  assert.ok(source.includes('class="pv-case-chapters"'));
  assert.ok(source.includes('data-pv-section-link'));
  assert.ok(source.includes("const sectionLinks=[...document.querySelectorAll('[data-pv-section-link]')]"));
});

test('v5.70.0 Designer Studio setup progress is derived from persisted profile and workspace data', () => {
  assert.ok(source.includes('const studioSetupTasks = ['));
  assert.ok(source.includes("works.some(item => item.moderationStatus === 'approved')"));
  assert.ok(source.includes('services.some(item => item.isActive)'));
  assert.ok(source.includes('availability.length > 0'));
  assert.ok(source.includes('role="progressbar"'));
  assert.ok(source.includes('${studioSetupPanel}'));
});

test('v5.70.0 respects reduced motion and keeps new collection/studio interactions progressive', () => {
  assert.ok(source.includes('@media(prefers-reduced-motion:reduce){.pv-collection-work-image img'));
  assert.ok(source.includes('.pv-collection-create .btn{color:var(--accent-ink)!important'));
  assert.ok(source.includes('html[data-pv-motion="off"] .pv-collection-work-image img'));
  assert.ok(source.includes("mountSectionNav(sectionLinks,.28,'is-active')"));
  assert.ok(source.includes("mountSectionNav(studioLinks,.25,'active')"));
  assert.ok(source.includes('data-pv-order-list'));
  assert.ok(source.includes('data-pv-order-status'));
  assert.ok(source.includes('role="status" aria-live="polite"'));
  assert.ok(source.includes('caseChapterItems.length >= 4 ?'));
});
