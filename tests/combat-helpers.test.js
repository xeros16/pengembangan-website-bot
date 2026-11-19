import test from 'node:test';
import assert from 'node:assert/strict';
import { createGameCombatHelpers } from '../games/pixel-realm/services/combat-helpers.js';

test('combat helpers expose pet catalog and labels', () => {
  const game = { heroStyle: 'heroine', pet: { species: 'fox', name: 'Kitsu', level: 2 }, level: 10, equipment: {} };
  const helpers = createGameCombatHelpers(game);
  assert.equal(helpers.petLabel(), '🦊 Kitsu Lv.2');
  assert.equal(helpers.petAttack(), 6);
  assert.match(helpers.heroArt(), /o\.o/);
});

test('boss phase responds to remaining health', () => {
  const { bossPhase } = createGameCombatHelpers({});
  assert.equal(bossPhase({ isBoss: true, hp: 80, maxHp: 100 }), 1);
  assert.equal(bossPhase({ isBoss: true, hp: 50, maxHp: 100 }), 2);
  assert.equal(bossPhase({ isBoss: true, hp: 20, maxHp: 100 }), 3);
  assert.equal(bossPhase({ hp: 20, maxHp: 100 }), 1);
});
