import test from 'node:test';
import assert from 'node:assert/strict';
import { GUESS_CATEGORIES, GUESS_QUESTIONS, normalizeGuessAnswer } from '../games/guess-game/data-questions.js';

test('guess game has broad non-design categories', () => {
  for (const category of ['umum', 'sains', 'teknologi', 'geografi', 'hewan', 'makanan', 'olahraga', 'sejarah', 'desain', 'logika']) {
    assert.ok(GUESS_CATEGORIES[category], `missing category ${category}`);
    assert.ok(GUESS_QUESTIONS.some(question => question.category === category), `no questions for ${category}`);
  }
});

test('guess answer normalization ignores spaces and punctuation', () => {
  assert.equal(normalizeGuessAnswer('Lumba-lumba!'), 'LUMBALUMBA');
  assert.equal(normalizeGuessAnswer('Bulu Tangkis'), 'BULUTANGKIS');
});
