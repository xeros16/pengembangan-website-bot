import assert from 'node:assert/strict';
import { buildInventoryMessage, buildLootBagMessage } from '../games/pixel-realm/commands/inventory.js';
import { buildEquipmentMessage } from '../games/pixel-realm/commands/equipment-display.js';
const title = (a, b='') => `[${a}${b ? ` ${b}` : ''}]`;
const game = { potions: 2, gold: 45, attack: 12, gearRarity: 'rare', gearScore: 25, weaponUpgrade: 2, forgeBonus: 3,
  inventory: { ether: 3, bombs: 1, loot: ['Slime Core', 'Slime Core', 'Pixel Shard'] },
  equipment: { weapon: 'Pedang Pixel', armor: 'Zirah Kristal' } };
const inv = buildInventoryMessage(game, title);
assert.match(inv, /Potion: \*2\*/);
assert.match(inv, /Ether: \*3\*/);
assert.match(inv, /Gold: \*45\*/);
const loot = buildLootBagMessage(game, title);
assert.match(loot, /Slime Core: x2/);
assert.match(loot, /Pixel Shard: x1/);
assert.match(buildLootBagMessage({ inventory: { loot: [] } }, title), /Tas loot masih kosong/);
const equipment = buildEquipmentMessage(game, title);
assert.match(equipment, /Pedang Pixel/);
assert.match(equipment, /level 2\/5 \(\+4 ATK\)/);
console.log('inventory/equipment display tests passed');
