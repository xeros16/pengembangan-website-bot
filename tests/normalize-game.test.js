import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeGameState } from '../games/pixel-realm/services/normalize-game.js';

test('normalizes legacy state and preserves valid character', () => {
  const state = { name: 'Tester', class: 'pendekar', started: true, hp: '35', gold: '8', inventory: { loot: 'bad' }, skillTree: { power: 20 } };
  const result = normalizeGameState(state, '2026-W44');
  assert.equal(result.name, 'Tester');
  assert.equal(result.hp, 35);
  assert.equal(result.gold, 8);
  assert.equal(result.started, true);
  assert.deepEqual(result.inventory.loot, []);
  assert.equal(result.skillTree.power, 10);
  assert.equal(result.weeklyProgressWeek, '2026-W44');
});

test('forces setup when character name/class are invalid', () => {
  const result = normalizeGameState({ name: '', class: 'unknown', started: true }, '2026-W44');
  assert.equal(result.started, false);
  assert.equal(result.class, 'unknown');
  assert.equal(result.hp, 100);
});
