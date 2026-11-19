import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeNumberGuess } from '../games/tebak-angka/utils.js';
import { normalizeScrambleAnswer, scrambleWord } from '../games/acak-kata/utils.js';
import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve('games/index.js');
const registrySource = fs.readFileSync(root, 'utf8');

test('registry mencantumkan dua game baru', () => {
  assert.match(registrySource, /numberGuessGame/);
  assert.match(registrySource, /scrambleWordGame/);
});

test('normalisasi tebakan angka hanya menerima angka bulat', () => {
  assert.equal(normalizeNumberGuess(' 42 '), 42);
  assert.equal(normalizeNumberGuess('4.2'), null);
  assert.equal(normalizeNumberGuess('-2'), null);
  assert.equal(normalizeNumberGuess('abc'), null);
});

test('normalisasi jawaban acak kata mengabaikan spasi dan tanda baca', () => {
  assert.equal(normalizeScrambleAnswer('Foto Sintesis!'), 'FOTOSINTESIS');
});

test('acak kata menghasilkan susunan berbeda untuk kata multi-huruf', () => {
  const result = scrambleWord('KAMERA', () => 0.2);
  assert.equal(result.length, 6);
  assert.notEqual(result, 'KAMERA');
});

