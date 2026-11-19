// Generated from the original Pixel Realm handler; command logic is preserved.
export function matches(ctx) {
  const { sub, args, game } = ctx;
  return (sub === 'event') ||
    (sub === 'sidequest') ||
    (sub === 'sideklaim') ||
    (sub === 'inventori') ||
    (sub === 'weeklyquest' || sub === 'questmingguan' || sub === 'mingguan') ||
    (sub === 'quest') ||
    (sub === 'klaim') ||
    (sub === 'harian' || sub === 'daily') ||
    (sub === 'ramuan' || sub === 'alchemy' || sub === 'buatramuan') ||
    (sub === 'monsterdex' || sub === 'monsterbook' || sub === 'monster') ||
    (sub === 'codex' || sub === 'buku' || sub === 'koleksi');
}

export async function handle(ctx) {
  const {
    sock,
    msg,
    remoteJid,
    isGroup,
    messageText,
    command,
    args,
    sender,
    userJid,
    senderIdentityAliases,
    reply,
    PREFIX,
    MONGO_URI,
    AUTH_DIR,
    TEMP_DIR,
    WELCOME_IMAGE,
    BACKUP_DIR,
    BACKUP_INTERVAL_HOURS,
    execFileAsync,
    MAX_IMAGE_BYTES,
    OWNER_JIDS_RAW,
    DEFAULT_GROUP_RULES,
    dbReady,
    reconnecting,
    processedMessageIds,
    senderQueues,
    MESSAGE_DEDUPE_TTL_MS,
    MESSAGE_DEDUPE_MAX,
    rememberMessageId,
    serializeBySender,
    PartySchema,
    GuildSchema,
    AssetSchema,
    UserSchema,
    GroupSchema,
    FavoriteSchema,
    AssetAccessSchema,
    ReportSchema,
    TicketSchema,
    ModerationLogSchema,
    WarningSchema,
    Party,
    Guild,
    GuildWarSchema,
    GuildWar,
    MarketListingSchema,
    MarketListing,
    WorldBossSchema,
    WorldBoss,
    TerritorySchema,
    Territory,
    Asset,
    User,
    Group,
    Favorite,
    AssetAccess,
    Report,
    Ticket,
    Warning,
    ModerationLog,
    spamTracker,
    SPAM_WINDOW_MS,
    SPAM_MAX_MESSAGES,
    LINK_REGEX,
    logModeration,
    processGroupModeration,
    normalizeJid,
    ownerJidSet,
    ownerIdentityCandidates,
    isBotOwner,
    isGroupJid,
    unwrapMessage,
    getMessageText,
    getQuotedMessage,
    getImageTarget,
    downloadMedia,
    isGroupAdmin,
    isBotAdmin,
    sendText,
    requireDatabase,
    connectDatabase,
    addStickerPackMetadata,
    handleCommand,
    makeWASocket,
    DisconnectReason,
    useMultiFileAuthState,
    jidNormalizedUser,
    fetchLatestBaileysVersion,
    downloadMediaMessage,
    Boom,
    qrcode,
    fs,
    path,
    execFile,
    promisify,
    sharp,
    webpmux,
    mongoose,
    GAME_LOCATIONS,
    GAME_MONSTERS,
    GAME_CLASSES,
    createInitialGameState,
    normalizeGameState,
    user,
    sub,
    today,
    currentWeek,
    locations,
    monsters,
    classes,
    initGame,
    game,
    petCatalog,
    heroArt,
    petLabel,
    petAttack,
    bossPhase,
    battleIntent,
    enemyRetaliation,
    saveGame,
    addExp,
    bar,
    gameTitle,
    statLine,
    hpPanel,
    noGame,
    regions,
    regionKey
  } = ctx;
if (sub === 'event') {
  const eventList = [
    { name: 'Hujan Bintang', desc: 'Fragmen bintang jatuh membawa gold dan EXP.', reward: 'Bonus gold dan EXP saat event muncul.' },
    { name: 'Karnaval Pixel', desc: 'Festival mini dengan hadiah item.', reward: 'Bisa mendapatkan potion dan ether.' },
    { name: 'Anomali Glitch', desc: 'Zona tidak stabil; hati-hati saat menjelajah.', reward: 'Kejutan berisiko dengan HP sebagai taruhan.' },
  ];
  const week = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));
  const active = eventList[week % eventList.length];
  return reply(`${gameTitle('🎪 EVENT DUNIA', `ROTASI MINGGU ${week % eventList.length + 1}`)}\n\n🌟 *${active.name}*\n${active.desc}\n\n🎁 ${active.reward}\n\nEvent acak dapat muncul saat *.pr jelajah*. Event dunia berganti setiap minggu.`);
}

if (sub === 'sidequest') {
  const sideQuests = [
    { id: 'explore', name: 'Pemetaan Dunia', desc: 'Lakukan 5 kali penjelajahan.', target: 5, gold: 45, exp: 25 },
    { id: 'wins', name: 'Pemburu Glitch', desc: 'Menangkan 3 pertarungan.', target: 3, gold: 60, exp: 35 },
    { id: 'chest', name: 'Kolektor Relik', desc: 'Temukan 3 peti harta.', target: 3, gold: 50, exp: 30 },
  ];
  if (game.sideQuestDate !== today || !game.sideQuestId) {
    const seed = [...today].reduce((n, c) => n + c.charCodeAt(0), 0) + Number(game.level || 1);
    const chosen = sideQuests[seed % sideQuests.length];
    game.sideQuestDate = today; game.sideQuestId = chosen.id; game.sideQuestProgress = 0; game.sideQuestClaimed = false;
  }
  const q = sideQuests.find(item => item.id === game.sideQuestId) || sideQuests[0];
  await saveGame();
  return reply(`${gameTitle('🧭 MISI SAMPINGAN', 'SIDE QUEST HARIAN')}\n\n📜 *${q.name}*\n${q.desc}\n\n${bar(Math.min(q.target, game.sideQuestProgress), q.target, 10)} ${Math.min(q.target, game.sideQuestProgress)}/${q.target}\n\n🎁 Hadiah: 🪙 ${q.gold} gold + ✨ ${q.exp} EXP\nStatus: ${game.sideQuestClaimed ? '✅ Sudah diklaim' : game.sideQuestProgress >= q.target ? '🎉 Selesai! Ketik *.pr sideklaim*' : '⏳ Dalam progres'}\n\nMisi berganti setiap hari.`);
}

if (sub === 'sideklaim') {
  const rewards = { explore: { target: 5, gold: 45, exp: 25 }, wins: { target: 3, gold: 60, exp: 35 }, chest: { target: 3, gold: 50, exp: 30 } };
  const q = rewards[game.sideQuestId];
  if (!q) return reply('Belum ada misi sampingan. Ketik *.pr sidequest* untuk mengambil misi hari ini.');
  if (game.sideQuestClaimed) return reply('Hadiah side quest hari ini sudah diklaim. Coba lagi besok!');
  if (game.sideQuestProgress < q.target) return reply(`Misi belum selesai: ${game.sideQuestProgress}/${q.target}. Ketik *.pr sidequest* untuk melihat detail.`);
  game.sideQuestClaimed = true; game.gold += q.gold; const levelMessage = addExp(q.exp); await saveGame();
  return reply(`${gameTitle('🏅 SIDE QUEST SELESAI!')}\n\n🪙 Gold: +${q.gold}\n✨ EXP: +${q.exp}${levelMessage}\n\nMisi baru tersedia besok.`);
}

if (sub === 'inventori') {
  return reply(`${gameTitle('🎒 INVENTORI PETUALANG')}\n\n🧪 Potion: *${game.potions}*\n🔷 Ether: *${game.inventory.ether}* — pulihkan 25 HP\n💣 Bom Pixel: *${game.inventory.bombs}* — damage 20\n🗡️ Senjata: *${game.equipment.weapon}*\n🛡️ Armor: *${game.equipment.armor}*\n🪙 Gold: *${game.gold}*`);
}

if (sub === 'weeklyquest' || sub === 'questmingguan' || sub === 'mingguan') {
  const action = (args[1] || 'info').toLowerCase();
  if (action === 'klaim' || action === 'claim') {
    if (game.weeklyClaimDate === currentWeek) return reply('Hadiah quest mingguan sudah diklaim minggu ini.');
    if (Number(game.weeklyQuestWins || 0) < 10) return reply(`Quest mingguan: ${game.weeklyQuestWins || 0}/10 kemenangan. Menangkan pertarungan untuk menyelesaikannya.`);
    game.weeklyClaimDate = currentWeek; game.gold += 250; game.materials.inti += 2; const lm = addExp(150); await saveGame();
    return reply(`${gameTitle('🏆 QUEST MINGGUAN SELESAI')}\n\n🪙 +250 gold\n🔮 +2 inti\n✨ +150 EXP${lm}`);
  }
  return reply(`${gameTitle('📅 QUEST MINGGUAN', currentWeek)}\n\n⚔️ Menangkan 10 pertarungan\nProgres: ${Math.min(10, Number(game.weeklyQuestWins || 0))}/10\nHadiah: 250 gold, 2 inti, 150 EXP\nStatus: ${game.weeklyClaimDate === currentWeek ? 'sudah diklaim' : Number(game.weeklyQuestWins || 0) >= 10 ? 'siap diklaim: .pr weeklyquest klaim' : 'berjalan'}`);
}

if (sub === 'quest') {
  const progress = Math.min(3, Number(game.questProgress || 0));
  return reply(`╭━━━ 📜 *MISI HARIAN* ━━━╮\n\n🧭 Jelajahi dunia sebanyak 3 kali\n${bar(progress, 3, 3)} ${progress}/3\n\n🎁 Hadiah: 30 gold + 20 EXP\nStatus: ${game.questClaimedDate === today ? '✅ Sudah diklaim hari ini' : progress >= 3 ? '🎉 Siap diklaim! Ketik *.pr klaim*' : '⏳ Belum selesai'}\n\nJelajah juga bisa menemukan peti, mata air, pedagang, atau monster.`);
}

if (sub === 'klaim') {
  if (game.questClaimedDate === today) return reply('✅ Hadiah misi hari ini sudah kamu klaim. Coba lagi besok!');
  if (game.questProgressDate !== today || Number(game.questProgress || 0) < 3) return reply(`Misi belum selesai: ${Math.min(3, Number(game.questProgress || 0))}/3 penjelajahan hari ini. Ketik *.pr jelajah* lagi.`);
  game.questClaimedDate = today; game.gold += 30;
  const levelMessage = addExp(20); await saveGame();
  return reply(`🎉 *MISI SELESAI!*\n\n🪙 Hadiah: +30 gold\n✨ EXP: +20${levelMessage}\n\nMisi baru tersedia. Ketik *.pr quest* untuk melihat progres.`);
}

if (sub === 'harian' || sub === 'daily') {
  if (game.dailyClaimedDate === today) return reply(`🎁 *HADIAH HARIAN*\n\nHadiah hari ini sudah diambil.\n🔥 Streak saat ini: ${Number(game.loginStreak || 0)} hari\nKembali besok untuk mempertahankan streak!`);
  const yesterdayDate = new Date(`${today}T12:00:00+07:00`);
  yesterdayDate.setUTCDate(yesterdayDate.getUTCDate() - 1);
  const yesterday = yesterdayDate.toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' });
  game.loginStreak = game.lastStreakDate === yesterday ? Number(game.loginStreak || 0) + 1 : 1;
  game.lastStreakDate = today;
  game.streakClaimDate = today;
  game.dailyClaimedDate = today;
  const streakBonus = Math.min(35, Math.max(0, game.loginStreak - 1) * 5);
  const goldReward = 15 + streakBonus;
  const potionReward = game.loginStreak % 7 === 0 ? 3 : 1;
  game.gold += goldReward;
  game.potions += potionReward;
  const expReward = 5 + Math.min(20, game.loginStreak);
  const levelMessage = addExp(expReward); await saveGame();
  return reply(`🎁 *HADIAH HARIAN DIKLAIM!*\n\n🔥 Login streak: *${game.loginStreak} hari*\n🪙 Gold: *+${goldReward}*${streakBonus ? ` (termasuk bonus streak +${streakBonus})` : ''}\n🧪 Potion: *+${potionReward}*${game.loginStreak % 7 === 0 ? ' — bonus 7 hari!' : ''}\n✨ EXP: *+${expReward}*${levelMessage}\n\n${game.loginStreak % 7 === 0 ? '🏅 Bonus mingguan berhasil dibuka!' : `Login besok untuk menjaga streak ${game.loginStreak} hari.`}`);
}

if (sub === 'ramuan' || sub === 'alchemy' || sub === 'buatramuan') {
  const recipe = (args[1] || 'menu').toLowerCase();
  const recipes = {
    potion: { label: 'Potion', cost: { serat: 2, kayu: 1 }, amount: 1, desc: 'Memulihkan HP saat bertarung.' },
    ether: { label: 'Ether', cost: { kristal: 1, serat: 2 }, amount: 1, desc: 'Memulihkan MP/energi sesuai sistem karakter.' },
    bomb: { label: 'Bom Pixel', cost: { batu: 2, kayu: 1 }, amount: 1, desc: 'Bom untuk memberikan damage saat bertarung.' }
  };
  if (recipe === 'menu' || recipe === 'resep' || recipe === 'info') return reply(`🧪 *ALCHEMY LAB — RESEP RAMUAN*\n\n🧪 potion — 2 serat + 1 kayu\n🔷 ether — 1 kristal + 2 serat\n💣 bomb — 2 batu + 1 kayu\n\nBuat: *.pr ramuan <potion/ether/bomb>*\nBahan bisa dikumpulkan dengan *.pr kumpul*.`);
  const r = recipes[recipe];
  if (!r) return reply('Resep tidak dikenal. Ketik *.pr ramuan* untuk melihat resep.');
  const missing = Object.entries(r.cost).filter(([k, v]) => Number(game.materials[k] || 0) < v);
  if (missing.length) return reply(`❌ Bahan belum cukup untuk ${r.label}.\n${Object.entries(r.cost).map(([k,v]) => `• ${k}: ${Number(game.materials[k]||0)}/${v}`).join('\n')}`);
  for (const [k, v] of Object.entries(r.cost)) game.materials[k] = Number(game.materials[k] || 0) - v;
  if (recipe === 'potion') game.potions = Number(game.potions || 0) + r.amount;
  if (recipe === 'ether') game.inventory.ether = Number(game.inventory.ether || 0) + r.amount;
  if (recipe === 'bomb') game.inventory.bombs = Number(game.inventory.bombs || 0) + r.amount;
  await saveGame();
  return reply(`✨ *CRAFTING BERHASIL — ${r.label.toUpperCase()}*\n\n${r.desc}\nBahan terpakai:\n${Object.entries(r.cost).map(([k,v])=>`• ${k}: -${v}`).join('\n')}\n\n🧪 Potion: ${game.potions} • 🔷 Ether: ${game.inventory.ether} • 💣 Bom: ${game.inventory.bombs}`);
}

if (sub === 'monsterdex' || sub === 'monsterbook' || sub === 'monster') {
  // Catalog mengikuti monster yang sudah ada di sistem jelajah dan dungeon.
  const monsterCatalog = [
    { region: 'Desa Pemula', key: 'desa', name: 'Slime Glitch', emoji: '🟢', hp: 24, atk: 5, gold: '12+', exp: '9+' },
    { region: 'Desa Pemula', key: 'desa', name: 'Tikus Pixel', emoji: '🐭', hp: 28, atk: 6, gold: '14+', exp: '11+' },
    { region: 'Hutan Pixel', key: 'hutan', name: 'Serigala Lumut', emoji: '🐺', hp: 38, atk: 8, gold: '20+', exp: '17+' },
    { region: 'Hutan Pixel', key: 'hutan', name: 'Goblin Render', emoji: '👺', hp: 42, atk: 9, gold: '22+', exp: '19+' },
    { region: 'Gua Neon', key: 'gua', name: 'Kelelawar Neon', emoji: '🦇', hp: 52, atk: 11, gold: '27+', exp: '24+' },
    { region: 'Gua Neon', key: 'gua', name: 'Penjaga Kristal', emoji: '💎', hp: 62, atk: 12, gold: '31+', exp: '28+' },
    { region: 'Pantai Sakura', key: 'pantai', name: 'Kepiting Sakura', emoji: '🦀', hp: 68, atk: 13, gold: '34+', exp: '30+' },
    { region: 'Pantai Sakura', key: 'pantai', name: 'Ubur Neon', emoji: '🪼', hp: 72, atk: 14, gold: '37+', exp: '32+' },
    { region: 'Reruntuhan RGB', key: 'reruntuhan', name: 'Ksatria Glitch', emoji: '🤖', hp: 86, atk: 16, gold: '44+', exp: '39+' },
    { region: 'Reruntuhan RGB', key: 'reruntuhan', name: 'Golem RGB', emoji: '🗿', hp: 96, atk: 17, gold: '48+', exp: '43+' },
    { region: 'Lembah Gradient', key: 'lembah', name: 'Naga Neon', emoji: '🐉', hp: 112, atk: 19, gold: '58+', exp: '52+' },
    { region: 'Lembah Gradient', key: 'lembah', name: 'Raja Bayangan', emoji: '👑', hp: 125, atk: 21, gold: '65+', exp: '58+' },
    { region: 'Dungeon', key: 'dungeon', name: 'Penjaga Batu', emoji: '🗿', hp: 35, atk: 8, gold: '20+', exp: '18+' },
    { region: 'Dungeon', key: 'dungeon', name: 'Serigala Bayangan', emoji: '🐺', hp: 42, atk: 10, gold: '24+', exp: '21+' },
    { region: 'Dungeon', key: 'dungeon', name: 'Ksatria Glitch', emoji: '🤖', hp: 50, atk: 11, gold: '28+', exp: '25+' },
    { region: 'Dungeon', key: 'dungeon', name: 'Naga Neon', emoji: '🐉', hp: 68, atk: 13, gold: '38+', exp: '32+' },
    { region: 'Dungeon Boss', key: 'boss', name: 'Bos Dungeon', emoji: '👹', hp: 85, atk: 15, gold: '75+', exp: '65+' },
    { region: 'Boss', key: 'boss', name: 'Raja Glitch', emoji: '👑', hp: 110, atk: 16, gold: '100+', exp: '85+' },
    { region: 'Dungeon Rahasia', key: 'dungeon', name: 'Penjaga Ruang Rahasia', emoji: '👹', hp: 65, atk: 12, gold: '45', exp: '35' },
  ];
  const aliases = {
    desa: 'desa', 'desa pemula': 'desa', hutan: 'hutan', 'hutan pixel': 'hutan',
    gua: 'gua', 'gua neon': 'gua', pantai: 'pantai', 'pantai sakura': 'pantai',
    reruntuhan: 'reruntuhan', 'reruntuhan rgb': 'reruntuhan', lembah: 'lembah',
    'lembah gradient': 'lembah', dungeon: 'dungeon', boss: 'boss'
  };
  const filterText = args.slice(1).join(' ').trim().toLowerCase();
  const filterKey = filterText ? aliases[filterText] : null;
  if (filterText && !filterKey) return reply('Wilayah tidak dikenal. Pilih: desa, hutan, gua, pantai, reruntuhan, lembah, dungeon, atau boss.');
  const entries = monsterCatalog.filter(m => !filterKey || m.key === filterKey);
  const lines = entries.map(m => `${m.emoji} *${m.name}* — ${m.region}\n   ❤️ HP dasar: ${m.hp} • ⚔️ ATK dasar: ${m.atk}\n   🪙 Hadiah dasar: ${m.gold} gold • ✨ EXP: ${m.exp}`);
  return reply(`📚 *MONSTER CODEX — PIXEL REALM*\n\n${filterText ? `Wilayah: *${filterText}*\n\n` : 'Daftar monster dan boss yang sudah terdaftar.\nStatistik pertarungan dapat meningkat mengikuti level atau lantai dungeon.\n\n'}${lines.join('\n\n')}\n\n🔎 Filter wilayah: *.pr monsterdex hutan*\n📖 Koleksi petualang: *.pr codex*`);
}

if (sub === 'codex' || sub === 'buku' || sub === 'koleksi') {
  const loot = Array.isArray(game.inventory.loot) ? game.inventory.loot : [];
  const uniqueLoot = [...new Set(loot)];
  const totalMaterials = Object.values(game.materials || {}).reduce((sum, n) => sum + Math.max(0, Number(n || 0)), 0);
  const achievementCount = Array.isArray(game.achievements) ? game.achievements.length : 0;
  const equipmentCount = ['weapon', 'armor', 'accessory'].filter(slot => game.equipment?.[slot] && game.equipment[slot] !== 'none').length;
  return reply(`📖 *PETUALANG CODEX*\n\n👤 ${game.name || 'Petualang'} • Lv.${game.level}\n⚔️ Kemenangan: ${game.wins || 0}\n👑 Bos dikalahkan: ${game.bossDefeated || 0}\n🏰 Dungeon clear: ${game.dungeonClears || 0}\n🏅 Achievement: ${achievementCount}\n🛡️ Slot equipment terisi: ${equipmentCount}/3\n🎁 Jenis loot terkumpul: ${uniqueLoot.length}\n🧰 Total bahan: ${totalMaterials}\n🔥 Login streak: ${game.loginStreak || 0} hari\n\nLanjutkan koleksi melalui *.pr loot*, *.pr equipment*, dan *.pr achievement*.`);
}
  return undefined;
}
