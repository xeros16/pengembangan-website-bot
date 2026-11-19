import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseDirectoryFilters, buildDirectoryMongoFilter } from '../directory-utils.js';
import {
  buildDesignerFitPipeline,
  hasDesignerMatchCriteria,
  parseBudgetPreset,
  scoreDesignerFit,
} from '../matchmaking-utils.js';

const escapeRegex = value => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

test('guided finder budget presets map to the expected IDR ranges', () => {
  assert.deepEqual(parseBudgetPreset('under-500k'), { budget: 'under-500k', min: 0, max: 500_000 });
  assert.deepEqual(parseBudgetPreset('500k-1.5m'), { budget: '500k-1.5m', min: 500_000, max: 1_500_000 });
  assert.deepEqual(parseBudgetPreset('above-5m'), { budget: 'above-5m', min: 5_000_000, max: 0 });
  assert.deepEqual(parseBudgetPreset('unknown'), { budget: 'any', min: 0, max: 0 });
});

test('directory parser supports fit sort only when at least one matching criterion exists', () => {
  const withCriteria = parseDirectoryFilters(new URLSearchParams('sort=fit&category=Branding&budget=500k-1.5m'));
  assert.equal(withCriteria.sort, 'fit');
  assert.equal(withCriteria.min, 500_000);
  assert.equal(withCriteria.max, 1_500_000);
  assert.equal(withCriteria.hasMatchCriteria, true);
  const empty = parseDirectoryFilters(new URLSearchParams('sort=fit'));
  assert.equal(empty.sort, 'featured');
  assert.equal(empty.hasMatchCriteria, false);
});

test('guided finder uses the existing overlapping price filter', () => {
  const filters = parseDirectoryFilters(new URLSearchParams('sort=fit&budget=500k-1.5m'));
  const mongo = buildDirectoryMongoFilter(filters, escapeRegex);
  assert.deepEqual(mongo.$expr, { $and: [
    { $lte: [{ $ifNull: ['$priceMin', 0] }, 1_500_000] },
    { $gte: [{ $cond: [
      { $gt: [{ $ifNull: ['$priceMax', 0] }, 0] },
      '$priceMax',
      { $ifNull: ['$priceMin', 0] },
    ] }, 500_000] },
  ] });
});

test('fit scoring is transparent and does not reward featured or reviewed status', () => {
  const criteria = { category: 'Branding', skill: 'identity', location: 'Bandung', min: 500_000, max: 1_500_000 };
  const exact = scoreDesignerFit({ category: 'Branding', specialties: ['Brand identity'], location: 'Bandung, Indonesia', priceMin: 700_000, priceMax: 1_200_000, isFeatured: false, isVerified: false }, criteria);
  const weak = scoreDesignerFit({ category: 'Photography', specialties: ['Portrait'], location: 'Jakarta', priceMin: 2_000_000, priceMax: 4_000_000, isFeatured: true, isVerified: true }, criteria);
  assert.equal(exact.score, 100);
  assert.deepEqual(exact.reasons, ['Bidang utama cocok', 'Spesialisasi cocok', 'Lokasi sesuai', 'Rentang anggaran cocok']);
  assert.equal(weak.score, 0);
});

test('budget fit signal is not awarded when a public profile has no advertised price', () => {
  const result = scoreDesignerFit({ category: 'Branding', priceMin: 0, priceMax: 0 }, { category: 'Branding', min: 500_000, max: 1_500_000 });
  assert.equal(result.score, 40);
  assert.deepEqual(result.reasons, ['Bidang utama cocok']);
});

test('keyword matching recognizes the public location field', () => {
  const result = scoreDesignerFit({ location: 'Bandung, Indonesia' }, { q: 'Bandung' });
  assert.equal(result.score, 15);
  assert.deepEqual(result.reasons, ['Kata kunci relevan']);
});

test('fit pipeline computes reasons before pagination and excludes featured/reviewed boosts', () => {
  const pipeline = buildDesignerFitPipeline({ isPublic: true }, { category: 'Branding', skill: 'identity' }, 24, 24, escapeRegex);
  assert.equal(pipeline[0].$match.isPublic, true);
  assert.ok(pipeline[1].$addFields._designerFitScore.$add.length >= 2);
  assert.ok(pipeline[2].$addFields._fitReasons.$filter);
  assert.deepEqual(pipeline[3].$sort, { _designerFitScore: -1, createdAt: -1, displayName: 1, _id: 1 });
  assert.deepEqual(pipeline[4], { $skip: 24 });
  assert.deepEqual(pipeline[5], { $limit: 24 });
  assert.equal(pipeline[6].$project._designerFitScore, 0);
});

test('match criteria detection ignores empty and whitespace-only inputs', () => {
  assert.equal(hasDesignerMatchCriteria({ category: '  ', skill: '', min: 0, max: 0 }), false);
  assert.equal(hasDesignerMatchCriteria({ location: 'Bandung' }), true);
});

test('directory UI exposes a beginner-friendly guided finder and honest match explanations', () => {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const source = fs.readFileSync(path.join(root, 'server.js'), 'utf8');
  assert.match(source, /GUIDED DESIGNER FINDER/);
  assert.match(source, /Temukan desainer yang cocok/);
  assert.match(source, /Pencocokan memakai data profil dan kisaran harga/);
  assert.match(source, /profil unggulan atau ditinjau tidak otomatis mendapat skor lebih tinggi/);
  assert.match(source, /designer-card-match-reasons/);
  assert.match(source, /buildDesignerFitPipeline\(filter, filters/);
});
