/** Build the existing inventory panel without changing game state. */
export function buildInventoryMessage(game, gameTitle) {
  const inventory = game.inventory || {};
  const equipment = game.equipment || {};
  return `${gameTitle('🎒 INVENTORI PETUALANG')}\n\n` +
    `🧪 Potion: *${Number(game.potions || 0)}*\n` +
    `🔷 Ether: *${Number(inventory.ether || 0)}* — pulihkan 25 HP\n` +
    `💣 Bom Pixel: *${Number(inventory.bombs || 0)}* — damage 20\n` +
    `🗡️ Senjata: *${equipment.weapon || 'none'}*\n` +
    `🛡️ Armor: *${equipment.armor || 'none'}*\n` +
    `🪙 Gold: *${Number(game.gold || 0)}*`;
}

/** Build the loot bag listing without mutating inventory. */
export function buildLootBagMessage(game, gameTitle) {
  const loot = Array.isArray(game.inventory?.loot) ? game.inventory.loot : [];
  if (!loot.length) {
    return `${gameTitle('🎒 LOOT BAG', 'ITEM HASIL PETUALANGAN')}\n\nTas loot masih kosong. Kalahkan monster untuk mendapatkan material dan item langka.`;
  }
  const counts = {};
  for (const item of loot) counts[item] = (counts[item] || 0) + 1;
  return `${gameTitle('🎒 LOOT BAG', 'ITEM HASIL PETUALANGAN')}\n\n` +
    `${Object.entries(counts).map(([name, count]) => `• ${name}: x${count}`).join('\n')}\n\n` +
    `Item tersimpan otomatis pada akun MongoDB kamu.`;
}
