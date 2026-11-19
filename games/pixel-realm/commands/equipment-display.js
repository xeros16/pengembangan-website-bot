/** Format the current equipment summary without changing player state. */
export function buildEquipmentMessage(game, gameTitle) {
  const rarityNames = { common: '⚪ Common', rare: '🔵 Rare', epic: '🟣 Epic', legendary: '🟠 Legendary' };
  const gearBonus = { common: 0, rare: 3, epic: 7, legendary: 12 };
  const rarity = game.gearRarity || 'common';
  const upgradeBonus = Math.max(0, Number(game.weaponUpgrade || 0)) * 2;
  return `${gameTitle('🛡️ ARMORY • EQUIPMENT', 'GEAR SCORE & RARITY')}\n\n` +
    `⚔️ Senjata: ${game.equipment?.weapon || 'none'}\n` +
    `🛡️ Zirah: ${game.equipment?.armor || 'none'}\n` +
    `✨ Rarity: ${rarityNames[rarity] || rarityNames.common}\n` +
    `📈 Gear score: ${game.gearScore || 0}\n` +
    `⚔️ ATK dasar: ${game.attack}\n` +
    `💥 Bonus forge: +${Number(game.forgeBonus ?? gearBonus[rarity] ?? 0)} ATK\n` +
    `🔨 Upgrade senjata: level ${Number(game.weaponUpgrade || 0)}/5 (+${upgradeBonus} ATK)\n\n` +
    `Tempa gear: *.pr forge rare*\n` +
    `Pilihan rarity: common, rare, epic, legendary.\n` +
    `Bahan dan gold diperlukan; rarity tinggi lebih mahal.`;
}
