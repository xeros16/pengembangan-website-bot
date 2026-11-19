import assert from 'node:assert/strict';
import { handleEquipCommand } from '../games/pixel-realm/commands/equip.js';

const makeGame = (overrides = {}) => ({
  gold: 100, attack: 10, hp: 50, maxHp: 50,
  inventory: { loot: [] }, equipment: {}, ...overrides,
});
const title = (a, b = '') => [a, b].filter(Boolean).join(' ');

let saves = 0;
let game = makeGame();
let msg = await handleEquipCommand({ args: ['equip', 'pedang_pixel'], game, gameTitle: title, saveGame: async () => { saves++; } });
assert.match(msg, /EQUIPMENT DIPASANG/);
assert.equal(game.gold, 20);
assert.equal(game.attack, 15);
assert.deepEqual(game.inventory.loot, ['Pedang Pixel']);
assert.equal(game.equipment.weapon, 'Pedang Pixel');
assert.equal(saves, 1);

game = makeGame({ gold: 10 });
msg = await handleEquipCommand({ args: ['equip', 'pedang_pixel'], game, gameTitle: title, saveGame: async () => { saves++; } });
assert.match(msg, /Gold tidak cukup/);
assert.equal(game.gold, 10);

game = makeGame({ inventory: { loot: ['Pedang Pixel'] }, equipment: { weapon: 'none' } });
msg = await handleEquipCommand({ args: ['equip', 'pedang_pixel'], game, gameTitle: title, saveGame: async () => { saves++; } });
assert.match(msg, /berhasil dipakai/);
assert.equal(game.attack, 15);
assert.equal(saves, 2);

msg = await handleEquipCommand({ args: ['equip', 'tidak_ada'], game: makeGame(), gameTitle: title, saveGame: async () => {} });
assert.match(msg, /EQUIPMENT CATALOG/);
console.log('equip-command tests passed');
