import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  DIRECTORY_PAGE_SIZE,
  buildDirectoryMongoFilter,
  buildDirectoryPageUrl,
  buildDirectoryRelevancePipeline,
  buildDirectorySort,
  getDirectoryPagination,
  parseDirectoryFilters,
} from '../directory-utils.js';

const escapeRegex = value => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

test('directory uses a bounded page size and parses filters without losing the query', () => {
  const filters = parseDirectoryFilters(new URLSearchParams('q=brand%20identity&skill=Branding&page=3&verified=1'));
  assert.equal(DIRECTORY_PAGE_SIZE, 24);
  assert.equal(filters.q, 'brand identity');
  assert.equal(filters.skill, 'Branding');
  assert.equal(filters.page, 3);
  assert.equal(filters.verifiedOnly, true);
  assert.equal(filters.sort, 'relevance');
});

test('directory pagination clamps out-of-range pages and calculates result ranges', () => {
  assert.deepEqual(getDirectoryPagination(99, 51), {
    page: 3, pageSize: 24, total: 51, totalPages: 3, skip: 48,
    start: 49, end: 51, hasPrevious: true, hasNext: false, pages: [1, 2, 3],
  });
  assert.equal(getDirectoryPagination(1, 0).start, 0);
  assert.equal(getDirectoryPagination(1, 0).end, 0);
});

test('directory page links preserve active filters and remove page one', () => {
  const params = new URLSearchParams('q=logo&skill=branding&verified=1&page=4');
  assert.equal(buildDirectoryPageUrl(params, 2), '/discover?q=logo&skill=branding&verified=1&page=2');
  assert.equal(buildDirectoryPageUrl(params, 1), '/discover?q=logo&skill=branding&verified=1');
});

test('budget filter uses range overlap and supports legacy single-price profiles', () => {
  const filters = parseDirectoryFilters(new URLSearchParams('min=500000&max=1500000'));
  const mongo = buildDirectoryMongoFilter(filters, escapeRegex);
  assert.deepEqual(mongo.$expr, { $and: [
    { $lte: [{ $ifNull: ['$priceMin', 0] }, 1500000] },
    { $gte: [{ $cond: [
      { $gt: [{ $ifNull: ['$priceMax', 0] }, 0] },
      '$priceMax',
      { $ifNull: ['$priceMin', 0] },
    ] }, 500000] },
  ] });
});

test('invalid inverted budget returns no matches instead of silently changing intent', () => {
  const filters = parseDirectoryFilters(new URLSearchParams('min=2000000&max=1000000'));
  assert.equal(filters.budgetInvalid, true);
  assert.deepEqual(buildDirectoryMongoFilter(filters, escapeRegex)._id, { $exists: false });
});

test('relevance search ranks exact names, names, skills and bios before pagination', () => {
  const pipeline = buildDirectoryRelevancePipeline({ isPublic: true }, 'Studio', 24, 24, escapeRegex);
  assert.equal(pipeline[0].$match.isPublic, true);
  assert.ok(pipeline[1].$addFields._directoryRelevance.$add.length >= 4);
  assert.deepEqual(pipeline[2].$sort, { _directoryRelevance: -1, isFeatured: -1, isVerified: -1, createdAt: -1, displayName: 1, _id: 1 });
  assert.deepEqual(pipeline[3], { $skip: 24 });
  assert.deepEqual(pipeline[4], { $limit: 24 });
});

test('directory supports newest and stable fallback sorting', () => {
  assert.deepEqual(buildDirectorySort('newest'), { createdAt: -1, displayName: 1, _id: 1 });
  assert.deepEqual(buildDirectorySort('unknown'), { isFeatured: -1, isVerified: -1, displayName: 1, _id: 1 });
});

test('relevance sort falls back to featured when no keyword is present', () => {
  const filters = parseDirectoryFilters(new URLSearchParams('sort=relevance'));
  assert.equal(filters.sort, 'featured');
});


test('website directory uses filtered totals, page-size pagination and explicit relevance sorting', () => {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const source = fs.readFileSync(path.join(root, 'server.js'), 'utf8');
  assert.match(source, /DesignerProfile\.countDocuments\(filter\)/);
  assert.match(source, /\.skip\(pagination\.skip\)/);
  assert.match(source, /\.limit\(pagination\.pageSize\)/);
  assert.match(source, /buildDirectoryRelevancePipeline\(filter, q, pagination\.skip, pagination\.pageSize/);
  assert.match(source, /pv-directory-pagination/);
  assert.doesNotMatch(source, /Menampilkan \$\{designers\.length\} dari maksimal 60/);
});

test('hybrid project workspace is explicitly optional and does not imply PIR-mediated transactions', () => {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const source = fs.readFileSync(path.join(root, 'server.js'), 'utf8');
  assert.match(source, /Gunakan project workspace opsional/);
  assert.match(source, /Workspace ini hanya membantu klien dan desainer/);
  assert.match(source, /tidak memproses pembayaran, tidak mengambil komisi/);
  assert.match(source, /Negosiasi, kontrak, dan pembayaran dilakukan langsung/);
});

test('public availability requires designer opt-in and never renders private calendar notes', () => {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const source = fs.readFileSync(path.join(root, 'server.js'), 'utf8');
  const models = fs.readFileSync(path.join(root, 'models.js'), 'utf8');
  assert.match(models, /availabilityPublic: \{ type: Boolean, default: false \}/);
  assert.match(source, /profile\.availabilityPublic \? DesignerAvailability\.find/);
  assert.match(source, /name="availabilityPublic"/);
  assert.match(source, /publicAvailability\.map\(slot =>/);
  assert.match(source, /Konfirmasikan jadwal secara langsung/);
  assert.doesNotMatch(source, /escapeHtml\(slot\.note\)/);
});

test('review labels distinguish email verification from client or transaction verification', () => {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const source = fs.readFileSync(path.join(root, 'server.js'), 'utf8');
  assert.match(source, /ulasan dengan email terverifikasi/);
  assert.match(source, /PIR tidak memverifikasi hubungan klien, proyek, atau transaksi/);
  assert.match(source, /Profil telah ditinjau tim PIR/);
});


test('directory sort indexes are declared in both shared profile models and database verifier', () => {
  const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
  const websiteModels = fs.readFileSync(path.join(projectRoot, 'portfolio-website', 'models.js'), 'utf8');
  const botModels = fs.readFileSync(path.join(projectRoot, 'models', 'design-marketplace.js'), 'utf8');
  const verifier = fs.readFileSync(path.join(projectRoot, 'scripts', 'verify-shared-db.js'), 'utf8');
  for (const source of [websiteModels, botModels]) {
    assert.match(source, /isPublic: 1, createdAt: -1, displayName: 1/);
    assert.match(source, /isPublic: 1, priceMin: 1, displayName: 1/);
  }
  assert.match(verifier, /isPublic_1_createdAt_-1_displayName_1/);
  assert.match(verifier, /isPublic_1_priceMin_1_displayName_1/);
});

test('WhatsApp marketplace feature remains directory and direct-contact only', () => {
  const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
  const botFeature = fs.readFileSync(path.join(projectRoot, 'features', 'design-marketplace', 'index.js'), 'utf8');
  assert.doesNotMatch(botFeature, /ClientProject\.create|DesignerLead\.create|PaymentGateway|EscrowAccount/i);
  assert.match(botFeature, /Lihat portofolio & kontak/);
  assert.match(botFeature, /Hubungi desainer/);
});
