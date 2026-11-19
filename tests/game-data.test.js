import test from 'node:test';
import assert from 'node:assert/strict';
import { GAME_LOCATIONS } from '../games/pixel-realm/data/locations.js';
import { GAME_MONSTERS } from '../games/pixel-realm/data/monsters.js';
import { GAME_CLASSES } from '../games/pixel-realm/data/classes.js';
import { createInitialGameState } from '../games/pixel-realm/services/initial-game-state.js';

test('catalogs retain expected base entries', () => {
  assert.ok(GAME_LOCATIONS.includes('Hutan Pixel'));
  assert.ok(GAME_MONSTERS.some(m => m.name === 'Slime Glitch'));
  assert.ok(GAME_CLASSES.pendekar);
});
test('initial state includes core game fields', () => {
  const state = createInitialGameState();
  assert.equal(state.level, 1);
  assert.equal(state.gold, 20);
  assert.ok(state.inventory);
  assert.ok(state.equipment);
});
