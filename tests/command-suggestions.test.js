import test from 'node:test';
import assert from 'node:assert/strict';
import { findSimilarCommands, searchCommandsByNeed } from '../features/command-suggestions.js';

test('suggests likely command when a user makes a small typo', () => {
  assert.ok(findSimilarCommands('contrst').includes('contrast'));
  assert.ok(findSimilarCommands('colrpalette').includes('colorpalette'));
});

test('accepts an optional prefix and normalizes case', () => {
  assert.ok(findSimilarCommands('.CONTRST').includes('contrast'));
});

test('does not suggest anything for blank or excessively long input', () => {
  assert.deepEqual(findSimilarCommands(''), []);
  assert.deepEqual(findSimilarCommands('x'.repeat(41)), []);
});

test('does not return the exact command as its own suggestion', () => {
  assert.equal(findSimilarCommands('contrast').includes('contrast'), false);
});

test('limits the number of suggestions', () => {
  assert.ok(findSimilarCommands('color', undefined, 2).length <= 2);
});

test('need search recommends Community Hub for mentoring and collaboration', () => {
  const mentor = searchCommandsByNeed('cari mentor branding');
  const collab = searchCommandsByNeed('proyek kolaborasi desainer');
  assert.ok(mentor.some(item => item.command === 'designcommunity'));
  assert.ok(collab.some(item => item.command === 'designcommunity'));
});

test('need search recommends Learning Cohort, Growth Insights, and Media Format Explorer', () => {
  assert.ok(searchCommandsByNeed('kelompok belajar desain dan milestone').some(item => item.command === 'cohort'));
  assert.ok(searchCommandsByNeed('perkembangan desainer').some(item => item.command === 'designcommunity'));
  assert.ok(searchCommandsByNeed('cek format media sebelum download').some(item => item.command === 'mediaformat'));
});
