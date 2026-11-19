// Factory state karakter baru. Nilai dipertahankan dari handler game versi sebelumnya.
export function createDefaultGame() {
  return ({
          name: '', hp: 100, maxHp: 100, gold: 20, level: 1, exp: 0, location: 'Desa Pemula',
          class: 'penjelajah', attack: 11, skillName: 'Bidikan Presisi', skillBonus: 10,
          potions: 2, exploreCount: 0, questClaimedDate: '', questProgressDate: '', questProgress: 0, dailyClaimedDate: '',
          inventory: { ether: 0, bombs: 0, loot: [] }, equipment: { weapon: 'none', armor: 'none', accessory: 'none' }, skillTree: { power: 0, vitality: 0, fortune: 0 }, skillPoints: 0, weeklyQuestWins: 0,
          sideQuestDate: '', sideQuestId: '', sideQuestProgress: 0, sideQuestClaimed: false,
          eventWins: 0, eventExplores: 0, battle: null, wins: 0, losses: 0, started: true, setupStep: '',
          dungeonFloor: 1, dungeonClears: 0, bossDefeated: 0, achievements: [],
          heroStyle: 'heroine', pet: { species: '', name: '', level: 1, exp: 0 },
  });
}
