// Pembentuk teks kartu profil Pixel Realm. Tidak mengakses database atau mengubah state.
export function buildProfileMessage({ game, classes, petCatalog, heroArt, petLabel, bar, hpPanel, gameTitle }) {
  const battle = game.battle;
  return `${gameTitle('🧙 KARTU PETUALANG', 'PIXEL QUEST • CHARACTER PROFILE')}\n\n` +
    `${heroArt()}\n╭─ *${classes[game.class]?.emoji || '🧭'} ${classes[game.class]?.name || game.class || 'Penjelajah'} • ${game.heroStyle === 'heroine' ? 'HEROINE' : 'HERO'}*\n` +
    `│ 🪪 Nama  : *${game.name || 'Petualang'}*\n` +
    `│ ⭐ Level : *${game.level}*\n` +
    `│ ✨ EXP   : ${bar(game.exp, game.level * 25, 10)} ${game.exp}/${game.level * 25}\n` +
    `│ ❤️ HP    : ${hpPanel(game.hp, game.maxHp)}\n` +
    `│ ⚔️ ATK   : ${game.attack || 11}\n` +
    `│ 🪙 Gold  : ${game.gold}\n` +
    `│ 🏅 Gelar : ${game.title || 'Petualang Baru'}\n` +
    `│ 🧪 Potion: ${game.potions}\n` +
    `│ 🔷 Ether/Bom: ${game.inventory.ether}/${game.inventory.bombs}\n` +
    `│ 🗡️ Senjata: ${game.equipment.weapon}\n│ 🛡️ Armor: ${game.equipment.armor}\n│ 🐾 Pet: ${petLabel()}\n` +
    `╰──────────────────\n` +
    `🏆 Menang ${game.wins}  •  💫 Kalah ${game.losses}\n🏰 Dungeon: lantai ${game.dungeonFloor} • clear ${game.dungeonClears}\n📍 ${game.location}\n` +
    (battle ? `\n╭─ 🚨 *SEDANG BERTARUNG*\n│ ${battle.emoji || '👾'} ${battle.name}\n│ ❤️ Musuh: ${hpPanel(battle.hp, battle.maxHp)}\n╰──────────────────\nPilih: *.pr serang* / *.pr skill* / *.pr potion* / *.pr bom*` : `\n🟢 *Kondisi:* Aman, siap bertualang.`);
}
