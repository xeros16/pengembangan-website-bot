import { GAME_EQUIPMENT } from '../data/equipment.js';

/**
 * Handle .pr equip / .pr pakai.
 * Dependencies are injected from the main bot so persistence and replies keep
 * using the existing MongoDB-backed state lifecycle.
 */
export async function handleEquipCommand({ args, game, gameTitle, saveGame }) {
  const item = (args[1] || '').toLowerCase();
  const gear = GAME_EQUIPMENT[item];
  if (!gear) return `${gameTitle('🧰 EQUIPMENT CATALOG')}\n\n⚔️ pedang_pixel — 80 gold, +5 ATK\n🏹 busur_neon — 100 gold, +6 ATK\n🛡️ zirah_kristal — 90 gold, +20 HP, -4 damage\n🧥 jubah_awan — 75 gold, +10 HP, -2 damage\n💍 cincin_keberuntungan — 120 gold, +5% loot langka\n🐉 jimat_naga — 160 gold, +3 ATK, +10 HP\n\nBeli dan pakai: *.pr equip <nama_item>*`;

  if (!game.inventory || typeof game.inventory !== 'object') game.inventory = {};
  if (!game.equipment || typeof game.equipment !== 'object') game.equipment = {};
  const owned = Array.isArray(game.inventory.loot) ? game.inventory.loot : [];

  if (owned.includes(gear.name)) {
    const old = game.equipment[gear.slot];
    if (old === gear.name) return `Kamu sudah memakai ${gear.name}.`;
    game.equipment[gear.slot] = gear.name;
    if (gear.atk) game.attack += gear.atk;
    if (gear.hp) { game.maxHp += gear.hp; game.hp = Math.min(game.maxHp, game.hp + gear.hp); }
    await saveGame();
    if (old && old !== 'none') return `⚠️ Slot ${gear.slot} diganti menjadi ${gear.name}. Bonus item lama tidak otomatis dihitung ulang jika item lama berasal dari versi sebelumnya. Simpan data dan periksa *.pr equipment*.`;
    return `✅ ${gear.name} berhasil dipakai pada slot ${gear.slot}.`;
  }

  if (game.gold < gear.cost) return `Gold tidak cukup. Harga ${gear.name}: ${gear.cost} gold. Saldo: ${game.gold}.`;
  game.gold -= gear.cost;
  owned.push(gear.name);
  game.inventory.loot = owned;
  game.equipment[gear.slot] = gear.name;
  if (gear.atk) game.attack += gear.atk;
  if (gear.hp) { game.maxHp += gear.hp; game.hp = Math.min(game.maxHp, game.hp + gear.hp); }
  await saveGame();
  return `${gameTitle('✨ EQUIPMENT DIPASANG', gear.rarity.toUpperCase())}\n\n${gear.name}\nSlot: ${gear.slot}\n${gear.atk ? `⚔️ ATK +${gear.atk}\n` : ''}${gear.hp ? `❤️ HP maksimum +${gear.hp}\n` : ''}${gear.def ? `🛡️ Pengurangan damage +${gear.def}\n` : ''}${gear.luck ? '🍀 Peluang loot langka +5%\n' : ''}Gold tersisa: ${game.gold}`;
}
