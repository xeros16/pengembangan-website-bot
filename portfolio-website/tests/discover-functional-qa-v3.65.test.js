import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { parseDirectoryFilters, buildDirectoryMongoFilter, buildDirectoryPageUrl } from '../directory-utils.js';
import { scoreDesignerFit } from '../matchmaking-utils.js';

const root = new URL('..', import.meta.url);
const server = fs.readFileSync(new URL('../server.js', import.meta.url), 'utf8');
const css = fs.readFileSync(new URL('../pir-functional-qa-v3.65.css', import.meta.url), 'utf8');
const escapeRegex = value => String(value).replace(/[.*+?^${}()|[\\]\\]/g, '\\$&');

test('Discover wraps the filter rail and result column in a bounded directory layout', () => {
  assert.match(server, /<div class="pv-directory-layout"><section class="pv-discovery-search-band"/);
  assert.match(server, /<div class="pv-directory-results"><div class="section-head"><div><span class="eyebrow">Directory/);
  assert.match(server, /\$\{paginationMarkup\}<\/div><\/div>\$\{selectedWorkSection\}/);
});

test('desktop filter stickiness is constrained to the directory layout and disabled on tablet/mobile', () => {
  assert.match(css, /\.pv-directory-layout\s*\{[\s\S]*?display:\s*grid/);
  assert.match(css, /\.pv-directory-layout\s*>\s*\.pv-discovery-search-band\s*\{[\s\S]*?position:\s*sticky/);
  assert.match(css, /@media\s*\(max-width:\s*1179px\)[\s\S]*?\.pv-directory-layout\s*>\s*\.pv-discovery-search-band\s*\{[\s\S]*?position:\s*relative/);
});

test('Discover keeps the existing GET filter fields and guided finder parameters', () => {
  for (const field of ['name="q"', 'name="skill"', 'name="category"', 'name="location"', 'name="sort"', 'name="min"', 'name="max"', 'name="verified"', 'name="featured"', 'name="available"', 'name="budget"']) {
    assert.ok(server.includes(field), `Missing filter field ${field}`);
  }
  assert.match(server, /method="get" action="\/discover" class="search-panel pv-discovery-filters"/);
  assert.match(server, /method="get" action="\/discover" class="pv-match-finder-form"/);
});

test('query, skill, category, location, verification and availability combine without losing sort', () => {
  const filters = parseDirectoryFilters(new URLSearchParams('q=brand&skill=identity&category=Branding&location=Bandung&sort=newest&verified=1&available=1'));
  assert.equal(filters.q, 'brand');
  assert.equal(filters.skill, 'identity');
  assert.equal(filters.category, 'Branding');
  assert.equal(filters.location, 'Bandung');
  assert.equal(filters.sort, 'newest');
  assert.equal(filters.verifiedOnly, true);
  assert.equal(filters.acceptingOnly, true);
  const mongo = buildDirectoryMongoFilter(filters, escapeRegex);
  assert.equal(mongo.isPublic, true);
  assert.equal(mongo.isVerified, true);
  assert.equal(mongo.acceptsOrders, true);
  assert.equal(mongo.category.$options, 'i');
  assert.equal(mongo.location.$options, 'i');
  assert.ok(mongo.$or.length >= 4);
});

test('guided finder budget and fit score are transparent and do not boost editorial badges', () => {
  const filters = parseDirectoryFilters(new URLSearchParams('sort=fit&category=Branding&skill=identity&location=Bandung&budget=500k-1.5m'));
  assert.equal(filters.sort, 'fit');
  assert.equal(filters.min, 500000);
  assert.equal(filters.max, 1500000);
  const fit = scoreDesignerFit({ category: 'Branding', specialties: ['Brand identity'], location: 'Bandung, Indonesia', priceMin: 700000, priceMax: 1200000, isFeatured: false, isVerified: false }, filters);
  const sameFitWithBadges = scoreDesignerFit({ category: 'Branding', specialties: ['Brand identity'], location: 'Bandung, Indonesia', priceMin: 700000, priceMax: 1200000, isFeatured: true, isVerified: true }, filters);
  assert.equal(fit.score, sameFitWithBadges.score);
  assert.ok(fit.reasons.length >= 3);
});

test('pagination preserves the active Discover filters when moving between result pages', () => {
  const params = new URLSearchParams('q=brand&category=Branding&location=Bandung&sort=newest&verified=1&page=4');
  assert.equal(buildDirectoryPageUrl(params, 2), '/discover?q=brand&category=Branding&location=Bandung&sort=newest&verified=1&page=2');
  assert.equal(buildDirectoryPageUrl(params, 1), '/discover?q=brand&category=Branding&location=Bandung&sort=newest&verified=1');
});

test('Selected Work explorer retains category chips, text search, live result count and project links', () => {
  assert.match(server, /data-pv-work-filter=/);
  assert.match(server, /data-pv-work-search/);
  assert.match(server, /data-pv-work-filter-status role="status" aria-live="polite"/);
  assert.match(server, /href="\/work\/\$\{encodeURIComponent\(work\.itemId\)\}"/);
  assert.match(server, /matchesCategory=active==='all'\|\|category===normalize\(active\)/);
  assert.match(server, /matchesQuery=!query\|\|text\.includes\(query\)/);
  assert.match(server, /setAttribute\('aria-pressed',String\(chip\.dataset\.pvWorkFilter===active\)\)/);
});

test('favorites and shortlist restore saved state on load and cap comparison at four profiles', () => {
  assert.match(server, /update\(\);shortlistUpdate\(\);/);
  assert.match(server, /slice\(0,4\)/);
  assert.match(server, /if\(ids\.length>=4\)/);
  assert.match(server, /localStorage\.setItem\(shortlistKey/);
});

test('selected-work filters can actually hide unmatched cards despite collection display styles', () => {
  assert.match(css, /pv-selected-work-card\[hidden\]\s*\{\s*display:\s*none\s*!important/);
});

test('the new functional QA stylesheet is linked and served with cache revalidation', () => {
  assert.match(server, /pir-functional-qa-v3\.65\.css\?v=20261119a/);
  assert.equal((server.match(/'pir-functional-qa-v3\.65\.css'/g) || []).length, 2);
});
