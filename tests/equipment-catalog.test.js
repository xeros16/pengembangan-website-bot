import assert from 'node:assert/strict';
import { GAME_EQUIPMENT } from '../games/pixel-realm/data/equipment.js';

assert.equal(Object.keys(GAME_EQUIPMENT).length, 6);
assert.equal(GAME_EQUIPMENT.pedang_pixel.cost, 80);
assert.equal(GAME_EQUIPMENT.zirah_kristal.slot, 'armor');
assert.equal(GAME_EQUIPMENT.cincin_keberuntungan.luck, 0.05);
assert.equal(GAME_EQUIPMENT.jimat_naga.rarity, 'legendary');
assert.ok(Object.isFrozen(GAME_EQUIPMENT));
console.log('equipment-catalog.test.js: OK');
