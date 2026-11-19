import test from 'node:test';
import assert from 'node:assert/strict';
import { MYSTERY_CASES, normalizeMysteryAnswer, getMysteryCase } from '../games/misteri/cases.js';

test('mystery game has several complete cases with valid culprit and clues', () => {
  assert.ok(MYSTERY_CASES.length >= 4);
  for (const item of MYSTERY_CASES) {
    assert.ok(item.title && item.story && item.solution);
    assert.ok(item.clues.length >= 3);
    assert.ok(item.suspects.some(name => normalizeMysteryAnswer(name) === normalizeMysteryAnswer(item.culprit)));
    assert.ok(item.locations?.length >= 3, `${item.id} needs at least three locations`);
    assert.ok(item.evidence?.length >= 3, `${item.id} needs at least three evidence items`);
    assert.ok(item.interviews && Object.keys(item.interviews).length === item.suspects.length, `${item.id} needs an interview for every suspect`);
    for (const evidence of item.evidence) assert.ok(item.locations.some(location => location.code === evidence.location));
  }
});

test('mystery answer normalization ignores case and punctuation', () => {
  assert.equal(normalizeMysteryAnswer('  Siska! '), 'siska');
  assert.equal(normalizeMysteryAnswer('Nara-Wijaya'), 'nara wijaya');
});

test('mystery case lookup returns null for unknown ids', () => {
  assert.equal(getMysteryCase('not-a-case'), null);
  assert.equal(getMysteryCase(MYSTERY_CASES[0].id).title, MYSTERY_CASES[0].title);
});
