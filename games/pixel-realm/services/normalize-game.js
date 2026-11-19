// Normalisasi state karakter yang dipakai setiap kali command .pr diproses.
// Mutasi objek dipertahankan agar perilaku kompatibel dengan handler lama.
export function normalizeGameState(game, currentWeek) {
  if (!game || typeof game !== 'object') game = { started: false };
  // Migrasi aman: karakter dianggap aktif hanya jika nama dan kelas valid.
          // Ini mencegah data default versi lama melewati setup karakter.
          if (game.started === undefined) game.started = Boolean(game.name && ['pendekar', 'penyihir', 'penjelajah'].includes(game.class));
          if (!game.name || !['pendekar', 'penyihir', 'penjelajah'].includes(game.class)) {
            game.started = false;
            if (!game.setupStep) game.setupStep = '';
          }
          game.hp = Number(game.hp ?? 100); game.maxHp = Number(game.maxHp ?? 100);
          game.gold = Number(game.gold ?? 0); game.level = Number(game.level ?? 1); game.exp = Number(game.exp ?? 0);
          game.location = game.location || 'Desa Pemula'; game.potions = Number(game.potions ?? 0);
          game.class = game.class || 'penjelajah'; game.attack = Number(game.attack ?? 11);
          game.skillName = game.skillName || 'Bidikan Presisi'; game.skillBonus = Number(game.skillBonus ?? 10);
          game.battle = game.battle || null;
          game.inventory = { ether: 0, bombs: 0, loot: [], ...(game.inventory || {}) };
          if (!Array.isArray(game.inventory.loot)) game.inventory.loot = [];
          game.equipment = { weapon: 'none', armor: 'none', accessory: 'none', ...(game.equipment || {}) };
          game.skillTree = { power: 0, vitality: 0, fortune: 0, ...(game.skillTree || {}) };
          for (const k of ['power','vitality','fortune']) game.skillTree[k] = Math.max(0, Math.min(10, Number(game.skillTree[k] || 0)));
          game.skillPoints = Math.max(0, Number(game.skillPoints || 0));
          game.weeklyQuestWins = Math.max(0, Number(game.weeklyQuestWins || 0));
          game.sideQuestDate = game.sideQuestDate || ''; game.sideQuestId = game.sideQuestId || '';
          game.sideQuestProgress = Number(game.sideQuestProgress || 0); game.sideQuestClaimed = Boolean(game.sideQuestClaimed);
          game.eventWins = Number(game.eventWins || 0); game.eventExplores = Number(game.eventExplores || 0);
          game.dungeonFloor = Math.max(1, Number(game.dungeonFloor || 1)); game.dungeonClears = Number(game.dungeonClears || 0); game.bossDefeated = Number(game.bossDefeated || 0); game.achievements = Array.isArray(game.achievements) ? game.achievements : [];
          game.heroStyle = ['hero', 'heroine'].includes(game.heroStyle) ? game.heroStyle : 'heroine';
          game.pet = { species: '', name: '', level: 1, exp: 0, ...(game.pet || {}) };
          game.pet.level = Math.max(1, Number(game.pet.level || 1)); game.pet.exp = Math.max(0, Number(game.pet.exp || 0));
          game.region = game.region || 'desa'; game.storyChapter = Math.max(1, Number(game.storyChapter || 1)); game.storyClaimed = Array.isArray(game.storyClaimed) ? game.storyClaimed : [];
          game.materials = { kayu: 0, batu: 0, kristal: 0, serat: 0, inti: 0, ...(game.materials || {}) }; game.crafted = Array.isArray(game.crafted) ? game.crafted : []; game.dungeonChoice = game.dungeonChoice || null;
          game.arena = game.arena && typeof game.arena === 'object' ? game.arena : null; game.arenaClaimDate = game.arenaClaimDate || ''; game.arenaWins = Math.max(0, Number(game.arenaWins || 0)); game.arenaReady = Boolean(game.arenaReady);
          game.loginStreak = Math.max(0, Number(game.loginStreak || 0)); game.streakClaimDate = game.streakClaimDate || ''; game.lastStreakDate = game.lastStreakDate || ''; game.weeklyWins = Math.max(0, Number(game.weeklyWins || 0)); game.weeklyProgressWeek = game.weeklyProgressWeek || ''; game.weeklyClaimDate = game.weeklyClaimDate || '';
          if (game.weeklyProgressWeek !== currentWeek) { game.weeklyProgressWeek = currentWeek; game.weeklyWins = 0; game.weeklyQuestWins = 0; } game.pvpWins = Math.max(0, Number(game.pvpWins || 0)); game.pvpLosses = Math.max(0, Number(game.pvpLosses || 0));
          game.bountyDate = game.bountyDate || ''; game.bountyWins = Math.max(0, Number(game.bountyWins || 0)); game.bountyClaimDate = game.bountyClaimDate || ''; game.bountyExplores = Math.max(0, Number(game.bountyExplores || 0));
          game.campDate = game.campDate || ''; game.trainingLevel = Math.max(0, Number(game.trainingLevel || 0)); game.fishingDate = game.fishingDate || ''; game.title = game.title || ''; game.weaponUpgrade = Math.max(0, Number(game.weaponUpgrade || 0)); game.fishCaught = Math.max(0, Number(game.fishCaught || 0)); game.materialsSold = Math.max(0, Number(game.materialsSold || 0));
          game.gearRarity = game.gearRarity || 'common'; game.gearScore = Math.max(0, Number(game.gearScore || 0));
          const legacyForgeBonus = { common: 1, rare: 3, epic: 7, legendary: 12 };
          if (game.forgeBonus === undefined) game.forgeBonus = game.gearScore > 0 ? (legacyForgeBonus[game.gearRarity] || 0) : 0;
          if (Number(game.weaponUpgrade || 0) > 5 || (game.gearScore > 0 && Number(game.weaponUpgrade || 0) === (legacyForgeBonus[game.gearRarity] || -1))) game.weaponUpgrade = 0;
          game.raidDate = game.raidDate || ''; game.raid = game.raid && typeof game.raid === 'object' ? game.raid : null; game.raidClaimedDate = game.raidClaimedDate || ''; game.trialDate = game.trialDate || ''; game.trialWins = Math.max(0, Number(game.trialWins || 0)); game.trialClaimedDate = game.trialClaimedDate || ''; game.petSkillUses = Math.max(0, Number(game.petSkillUses || 0));
  return game;
}
