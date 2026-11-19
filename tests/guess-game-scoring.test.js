import test from 'node:test';
import assert from 'node:assert/strict';
import { GUESS_QUESTIONS, classifyGuessDifficulty } from '../games/guess-game/data-questions.js';
const GUESS_DIFFICULTIES = { mudah: { points: 10 }, sedang: { points: 20 }, sulit: { points: 30 } };

test('guess game has three difficulty tiers with increasing rewards', () => {
  assert.deepEqual(Object.keys(GUESS_DIFFICULTIES), ['mudah', 'sedang', 'sulit']);
  assert.ok(GUESS_DIFFICULTIES.mudah.points < GUESS_DIFFICULTIES.sedang.points);
  assert.ok(GUESS_DIFFICULTIES.sedang.points < GUESS_DIFFICULTIES.sulit.points);
});

test('every question maps to a supported difficulty tier', () => {
  for (const question of GUESS_QUESTIONS) {
    assert.ok(GUESS_DIFFICULTIES[classifyGuessDifficulty(question)]);
  }
});

test('long answers are classified as hard', () => {
  assert.equal(classifyGuessDifficulty({ answer: 'FOTOSINTESIS' }), 'sulit');
});
