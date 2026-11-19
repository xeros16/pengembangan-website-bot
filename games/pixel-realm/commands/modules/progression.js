// Generated from the original Pixel Realm handler; command logic is preserved.
export function matches(ctx) {
  const { sub, args, game } = ctx;
  return (sub === 'streak' || sub === 'login') ||
    (sub === 'bounty-klaim' || (sub === 'bounty' && args[1] === 'klaim') || (sub === 'kontrak' && args[1] === 'klaim')) ||
    (sub === 'statistik' || sub === 'stats') ||
    (sub === 'tantangan' || sub === 'challenge') ||
    (sub === 'tantanganklaim' || sub === 'challengeclaim') ||
    (sub === 'skillinfo' || sub === 'skill') ||
    (sub === 'latihan' || sub === 'train') ||
    (sub === 'memancing' || sub === 'mancing' || sub === 'fish') ||
    (sub === 'koleksi' || sub === 'collection' || sub === 'codex') ||
    (sub === 'gelar' || sub === 'title') ||
    (sub === 'upgrade' || sub === 'upgradeweapon') ||
    (sub === 'jual' || sub === 'sell') ||
    (sub === 'combat' || sub === 'battleinfo' || sub === 'mekanik') ||
    (sub === 'skilltree' || sub === 'skill-tree' || sub === 'pohonskill') ||
    (sub === 'loot' || sub === 'tasloot' || sub === 'drop') ||
    (sub === 'equipment' || sub === 'gear' || sub === 'perlengkapan') ||
    (sub === 'equip' || sub === 'pakai') ||
    (sub === 'forge' || sub === 'tempa') ||
    (sub === 'raid') ||
    (sub === 'trial' || sub === 'uji') ||
    (sub === 'pet-skill' || (sub === 'pet' && args[1] === 'skill')) ||
    (sub === 'bantuan' || sub === 'help');
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
if (sub === 'streak' || sub === 'login') {
  const yesterday = new Date(Date.now() - 86400000).toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' });
  if (game.streakClaimDate === today) return reply(`${gameTitle('🔥 HADIAH LOGIN HARIAN') }\n\nHadiah hari ini sudah diklaim.\n🔥 Streak saat ini: *${game.loginStreak} hari*\n🎁 Klaim besok untuk menjaga streak.`);
  game.loginStreak = game.lastStreakDate === yesterday ? Math.min(7, game.loginStreak + 1) : 1;
  game.streakClaimDate = today; game.lastStreakDate = today;
  const rewardGold = 10 + game.loginStreak * 3; const rewardExp = 5 + game.loginStreak * 2;
  game.gold += rewardGold; const levelMessage = addExp(rewardExp);
  if (game.loginStreak === 7) { game.potions += 1; game.inventory.ether += 1; }
  await saveGame();
  return reply(`${gameTitle('🔥 LOGIN STREAK!', `HARI KE-${game.loginStreak}`)}\n\n🎁 Gold: *+${rewardGold}*\n✨ EXP: *+${rewardExp}*${levelMessage}${game.loginStreak === 7 ? '\n🧪 Bonus 7 hari: Potion +1 dan Ether +1!' : ''}\n\nStreak maksimal: 7 hari. Klaim lagi besok dengan *.pr streak*.`);
}

if (sub === 'bounty-klaim' || (sub === 'bounty' && args[1] === 'klaim') || (sub === 'kontrak' && args[1] === 'klaim')) {
  if (game.bountyClaimDate === today) return reply('🎯 Hadiah kontrak hari ini sudah diklaim. Kembali besok!');
  if ((game.bountyWins || 0) < 3) return reply(`⏳ Kontrak belum selesai: ${Math.min(3, game.bountyWins || 0)}/3 kemenangan. Ketik *.pr bounty* untuk melihat progres.`);
  game.bountyClaimDate = today; game.gold += 35; game.potions += 1; const lm = addExp(25); await saveGame();
  return reply(`${gameTitle('🏆 KONTRAK DITUNTASKAN!', 'REWARD BERHASIL DIKLAIM')}\n\n╭━━ 🎁 *HADIAH* ━━╮\n│ 🪙 Gold  +35\n│ ✨ EXP   +25\n│ 🧪 Potion +1\n╰━━━━━━━━━━━━━━╯${lm}\n\n✨ Kontrak baru tersedia besok!`);
}

if (sub === 'statistik' || sub === 'stats') {
  const winRate = (game.wins + game.losses) ? Math.round(game.wins / (game.wins + game.losses) * 100) : 0;
  return reply(`${gameTitle('📊 STATISTIK PETUALANG') }\n\n🧑 Nama: *${game.name}*\n🎖️ Kelas: ${game.class}\n⭐ Level: ${game.level} (${game.exp} EXP)\n❤️ HP: ${game.hp}/${game.maxHp}\n⚔️ ATK: ${game.attack}\n🪙 Gold: ${game.gold}\n\n⚔️ Pertarungan: ${game.wins + game.losses}\n🏆 Menang: ${game.wins}\n💫 Kalah: ${game.losses}\n📈 Rasio menang: ${winRate}%\n🏰 Dungeon clear: ${game.dungeonClears}\n👑 Bos dikalahkan: ${game.bossDefeated}\n🔥 Login streak: ${game.loginStreak} hari\n🐾 Pet: ${petLabel()}\n📍 Wilayah: ${game.location}`);
}

if (sub === 'tantangan' || sub === 'challenge') {
  const progress = Math.min(5, Number(game.weeklyWins || 0));
  const claimed = game.weeklyClaimDate === currentWeek;
  return reply(`${gameTitle('🎯 TANTANGAN PETUALANG') }\n\nMenangkan 5 pertarungan dalam satu minggu.\n${bar(progress, 5, 5)} ${progress}/5\n\n🎁 Hadiah: 40 gold + 35 EXP + 1 Potion\nStatus: ${claimed ? '✅ Sudah diklaim minggu ini' : progress >= 5 ? '🎉 Siap diklaim!' : '⏳ Lanjutkan pertarungan'}\n\nKlaim dengan *.pr tantanganklaim*.`);
}

if (sub === 'tantanganklaim' || sub === 'challengeclaim') {
  if (game.weeklyClaimDate === currentWeek) return reply('🎯 Hadiah tantangan minggu ini sudah diklaim.');
  if (Number(game.weeklyWins || 0) < 5) return reply(`Kamu perlu 5 kemenangan minggu ini. Progres saat ini: ${Math.min(5, Number(game.weeklyWins || 0))}/5.`);
  game.weeklyClaimDate = currentWeek; game.gold += 40; game.potions += 1; const levelMessage = addExp(35); await saveGame();
  return reply(`${gameTitle('🏆 TANTANGAN SELESAI!')}\n\n🪙 Gold +40\n✨ EXP +35${levelMessage}\n🧪 Potion +1\n\nTerima kasih sudah bertualang!`);
}

if (sub === 'skillinfo' || sub === 'skill') {
  const cls = classes[game.class] || classes.penjelajah;
  const notes = {
    pendekar: 'Damage stabil dan daya tahan tinggi. Cocok untuk pertarungan panjang.',
    penyihir: 'Bonus skill paling besar, tetapi HP awal lebih rendah.',
    penjelajah: 'Gaya seimbang dan fleksibel untuk eksplorasi.'
  };
  return reply(`${gameTitle('✨ ARSIP SKILL', 'CLASS DATABASE • PIXEL QUEST')}

${cls.emoji} *${cls.name}*
🔮 Skill: *${game.skillName || cls.skill}*
⚔️ Bonus skill: +${game.skillBonus || cls.bonus} damage

${notes[game.class] || notes.penjelajah}

Gunakan *.pr skill* saat sedang bertarung. Skill dapat memiliki cooldown; perhatikan pesan giliran musuh.`);
}

if (sub === 'latihan' || sub === 'train') {
  const maxTraining = 10;
  if (game.battle || game.arena) return reply('⚠️ Latihan tidak bisa dilakukan saat sedang bertarung.');
  if (game.trainingLevel >= maxTraining) return reply(`${gameTitle('🏅 LATIHAN MAKSIMAL')}

ATK latihan sudah mencapai level ${maxTraining}/${maxTraining}.`);
  const cost = 25 + game.trainingLevel * 15;
  if (game.gold < cost) return reply(`🪙 Gold belum cukup. Latihan berikutnya butuh ${cost} gold; saldo kamu ${game.gold}.`);
  game.gold -= cost; game.trainingLevel += 1; game.attack += 1;
  await saveGame();
  return reply(`${gameTitle('💪 LATIHAN SELESAI!', 'PERMANENT STAT UPGRADE')}

⚔️ ATK permanen +1
📈 Latihan: ${bar(game.trainingLevel, maxTraining, 10)} ${game.trainingLevel}/${maxTraining}
🪙 Biaya: ${cost} gold
💰 Saldo: ${game.gold} gold

Latihan berikutnya: ${game.trainingLevel >= maxTraining ? 'Maksimal' : (25 + game.trainingLevel * 15) + ' gold'}.`);
}

if (sub === 'memancing' || sub === 'mancing' || sub === 'fish') {
  if (game.fishingDate === today) return reply(`${gameTitle('🎣 KOLAM PIXEL')}

Kamu sudah memancing hari ini. Coba lagi setelah reset harian pukul 00.00 WIB.
🐟 Total tangkapan: ${game.fishCaught}`);
  if (game.battle || game.arena) return reply('⚠️ Selesaikan pertarungan dulu sebelum memancing.');
  game.fishingDate = today;
  const roll = Math.random();
  let result;
  if (roll < 0.45) { const gold = 8 + Math.floor(Math.random()*13); game.gold += gold; result = `🪙 Kamu menemukan kantong koin di tepi kolam: +${gold} gold.`; }
  else if (roll < 0.78) { const fiber = 1 + (Math.random() < .25 ? 1 : 0); game.materials.serat += fiber; game.fishCaught += 1; result = `🐟 Kamu menangkap Ikan Pixel dan mendapat ${fiber} serat untuk crafting.`; }
  else if (roll < 0.94) { game.materials.kristal += 1; game.fishCaught += 1; result = '💎 Pancingmu mengangkat Kristal Neon langka! +1 kristal.'; }
  else { game.potions += 1; game.fishCaught += 1; result = '✨ Keberuntungan besar! Kamu menemukan Potion tersegel: +1 Potion.'; }
  await saveGame();
  return reply(`${gameTitle('🎣 HASIL MEMANCING', 'DAILY FISHING • PIXEL WORLD')}

${result}

🐠 Koleksi tangkapan: ${game.fishCaught}
🗓️ Kesempatan memancing berikutnya: besok.

Tip: bahan bisa dijual dengan *.pr jual serat 1* atau disimpan untuk crafting.`);
}

if (sub === 'koleksi' || sub === 'collection' || sub === 'codex') {
  const crafted = Array.isArray(game.crafted) ? game.crafted : [];
  const mats = game.materials || {};
  const totalMats = Object.values(mats).reduce((sum, value) => sum + Math.max(0, Number(value || 0)), 0);
  const ownedPet = game.pet?.species ? (petCatalog[game.pet.species]?.name || game.pet.species) : 'Belum ada';
  return reply(`${gameTitle('📚 KOLEKSI PETUALANG', 'COLLECTION CODEX • V4')}

╭━━━ 🧰 *KERAJINAN* ━━━╮
│ Resep/hasil craft: ${crafted.length}
│ Upgrade senjata: ${game.weaponUpgrade || 0}/5
│ Bahan tersimpan: ${totalMats}
╰━━━━━━━━━━━━━━━━━━╯

╭━━━ 🐾 *KOLEKSI* ━━━╮
│ Pet: ${ownedPet}
│ Pet level: ${game.pet?.species ? game.pet.level : '-'}
│ Ikan ditemukan: ${game.fishCaught || 0}
│ Kemenangan: ${game.wins || 0}
│ Bos dikalahkan: ${game.bossDefeated || 0}
╰━━━━━━━━━━━━━━━━━━╯

🪵 Kayu ${mats.kayu || 0} • 🪨 Batu ${mats.batu || 0}
💎 Kristal ${mats.kristal || 0} • 🌿 Serat ${mats.serat || 0}
🔮 Inti ${mats.inti || 0}

Ketik *.pr resep* untuk crafting atau *.pr upgrade* untuk memperkuat senjata.`);
}

if (sub === 'gelar' || sub === 'title') {
  const action = (args[1] || '').toLowerCase();
  const titles = {
    pemula: { label: '🌱 Petualang Pemula', wins: 0, level: 1 },
    pemburu: { label: '⚔️ Pemburu Pixel', wins: 10, level: 1 },
    veteran: { label: '🏆 Veteran Arena', wins: 25, level: 5 },
    penjelajah: { label: '🗺️ Penjelajah Dunia', wins: 10, level: 5 },
    legenda: { label: '👑 Legenda Pixel', wins: 50, level: 10 }
  };
  if (action === 'pasang' || action === 'pakai') {
    const id = (args[2] || '').toLowerCase(); const t = titles[id];
    if (!t) return reply('Gelar tidak ditemukan. Pilih: pemula, pemburu, veteran, penjelajah, legenda.');
    if ((game.wins || 0) < t.wins || (game.level || 1) < t.level) return reply(`🔒 Gelar *${t.label}* belum terbuka. Syarat: ${t.wins} kemenangan dan level ${t.level}.`);
    game.title = t.label; await saveGame();
    return reply(`${gameTitle('🏅 GELAR DIPASANG')}

Gelar aktif: *${t.label}*
Gelar akan tampil pada kartu petualang.`);
  }
  const rows = Object.entries(titles).map(([id,t]) => `${game.title === t.label ? '✅' : ((game.wins||0)>=t.wins && (game.level||1)>=t.level ? '🔓' : '🔒')} *${id}* — ${t.label}\n   Syarat: ${t.wins} menang, Lv.${t.level}`).join('\n');
  return reply(`${gameTitle('🏅 GALERI GELAR', 'TITLE COLLECTION')}

${rows}

Pasang gelar: *.pr gelar pasang <id>*
Contoh: *.pr gelar pasang pemburu*`);
}

if (sub === 'upgrade' || sub === 'upgradeweapon') {
  if (game.battle || game.arena) return reply('⚠️ Senjata tidak bisa di-upgrade saat sedang bertarung.');
  const lv = Number(game.weaponUpgrade || 0);
  if (lv >= 5) return reply(`${gameTitle('⚔️ SENJATA MAKSIMAL')}

Senjata sudah mencapai upgrade +5. ATK bonus dari upgrade: +${lv * 2}.`);
  const costs = [ {kayu:2,batu:1}, {kayu:2,batu:2,kristal:1}, {batu:3,kristal:2,serat:1}, {batu:4,kristal:3,inti:1}, {kristal:4,inti:2,serat:2} ];
  const cost = costs[lv]; const missing = Object.entries(cost).filter(([k,v]) => Number(game.materials[k]||0) < v);
  if (missing.length) return reply(`${gameTitle('🛠️ BAHAN BELUM CUKUP')}

Upgrade berikutnya: +${lv+1}
${Object.entries(cost).map(([k,v])=>`${({kayu:'🪵',batu:'🪨',kristal:'💎',serat:'🌿',inti:'🔮'})[k]} ${k}: ${game.materials[k]||0}/${v}`).join('\n')}

Ketik *.pr kumpul* di wilayah petualangan untuk mendapatkan bahan.`);
  for (const [k,v] of Object.entries(cost)) game.materials[k] -= v;
  game.weaponUpgrade = lv + 1; game.attack += 2;
  await saveGame();
  return reply(`${gameTitle('⚔️ SENJATA BERHASIL DI-UPGRADE!', 'FORGE SYSTEM')}

✨ Upgrade senjata: +${game.weaponUpgrade}/5
⚔️ ATK permanen +2

🧾 Bahan terpakai:
${Object.entries(cost).map(([k,v])=>`• ${k}: -${v}`).join('\n')}

Gunakan *.pr koleksi* untuk melihat progres forge.`);
}

if (sub === 'jual' || sub === 'sell') {
  const key = (args[1] || '').toLowerCase();
  const amount = Math.floor(Number(args[2] || 0));
  const prices = { kayu: 3, batu: 4, kristal: 12, serat: 3, inti: 20 };
  if (!Object.hasOwn(prices, key)) return reply('Bahan yang bisa dijual: kayu, batu, kristal, serat, inti.\nContoh: *.pr jual kristal 2*');
  if (!Number.isFinite(amount) || amount < 1 || amount > 99) return reply('Jumlah harus 1–99. Contoh: *.pr jual serat 3*');
  if (Number(game.materials[key] || 0) < amount) return reply(`Bahan ${key} tidak cukup. Kamu punya ${game.materials[key] || 0}.`);
  const earned = prices[key] * amount;
  game.materials[key] -= amount; game.gold += earned; game.materialsSold += amount;
  await saveGame();
  return reply(`${gameTitle('💰 PENJUALAN BERHASIL', 'MATERIAL MARKET')}

📦 Bahan: ${key} ×${amount}
🪙 Harga satuan: ${prices[key]} gold
💵 Gold diterima: +${earned}
💰 Saldo sekarang: ${game.gold} gold

Tip: kristal dan inti lebih langka—simpan sebagian untuk upgrade senjata.`);
}

if (sub === 'combat' || sub === 'battleinfo' || sub === 'mekanik') {
  const rarityCrit = game.gearRarity === 'legendary' ? 5 : game.gearRarity === 'epic' ? 3 : 0;
  const crit = Math.min(35, 10 + Math.floor(Number(game.level || 1) / 5) * 2 + rarityCrit);
  const dodge = Math.min(18, 6 + Math.floor(Number(game.level || 1) / 10) * 2);
  return reply(`${gameTitle('⚔️ COMBAT SYSTEM', 'PIXEL REALM • UPDATE 14.1.0')}

` +
    `🌟 *Critical Hit*
Peluang: *${crit}%* • Damage x1,7
Bonus rarity gear: ${rarityCrit ? '+' + rarityCrit + '%' : 'belum ada'}

` +
    `💨 *Evasion / Menghindar*
Peluang: *${dodge}%* • Serangan musuh dapat meleset sepenuhnya.

` +
    `🛡️ *Armor & level*
Armor mengurangi 3 damage; level juga memberi pengurangan damage kecil.

` +
    `🔥 *Amukan musuh*
Saat HP musuh ≤30%, serangan menjadi lebih kuat. Bos dapat memakai serangan berat lebih sering.

` +
    `🧭 Tips: tingkatkan level dan rarity gear melalui *.pr forge* untuk memperkuat karakter.`);
}

if (sub === 'skilltree' || sub === 'skill-tree' || sub === 'pohonskill') {
  const action = (args[1] || 'info').toLowerCase();
  const branches = { power: { label: '⚔️ Power', desc: '+1 bonus ATK per level skill', max: 10 }, vitality: { label: '❤️ Vitality', desc: '+5 HP maksimum per level skill', max: 10 }, fortune: { label: '🍀 Fortune', desc: '+2% peluang loot langka per level skill', max: 10 } };
  if (action === 'ambil' || action === 'upgrade' || action === 'naik') {
    const branch = (args[2] || '').toLowerCase();
    if (!branches[branch]) return reply('Pilih cabang: power, vitality, atau fortune. Contoh: *.pr skilltree upgrade power*');
    if (game.skillPoints < 1) return reply('Skill Point belum cukup. Dapatkan 1 Skill Point setiap naik level.');
    if (game.skillTree[branch] >= branches[branch].max) return reply('Cabang skill ini sudah mencapai level maksimum.');
    game.skillPoints -= 1; game.skillTree[branch] += 1;
    if (branch === 'power') game.attack += 1;
    if (branch === 'vitality') { game.maxHp += 5; game.hp += 5; }
    await saveGame();
    return reply(`${gameTitle('🌟 SKILL TREE UPGRADED', branches[branch].label)}\n\nLevel skill: *${game.skillTree[branch]}/10*\nSkill Point tersisa: *${game.skillPoints}*\n${branches[branch].desc}\n\nLihat cabang lain: *.pr skilltree*`);
  }
  return reply(`${gameTitle('🌳 SKILL TREE', 'SPESIALISASI PETUALANG')}\n\nSkill Point tersedia: *${game.skillPoints}*\n⚔️ Power: ${game.skillTree.power}/10 — bonus ATK\n❤️ Vitality: ${game.skillTree.vitality}/10 — bonus HP maksimum\n🍀 Fortune: ${game.skillTree.fortune}/10 — peluang loot langka\n\nNaikkan skill:\n.pr skilltree upgrade power\n.pr skilltree upgrade vitality\n.pr skilltree upgrade fortune\n\nKamu mendapat 1 Skill Point setiap naik level.`);
}

if (sub === 'loot' || sub === 'tasloot' || sub === 'drop') {
  const loot = Array.isArray(game.inventory.loot) ? game.inventory.loot : [];
  if (!loot.length) return reply(`${gameTitle('🎒 LOOT BAG', 'ITEM HASIL PETUALANGAN')}\n\nTas loot masih kosong. Kalahkan monster untuk mendapatkan material dan item langka.`);
  const counts = {}; for (const item of loot) counts[item] = (counts[item] || 0) + 1;
  return reply(`${gameTitle('🎒 LOOT BAG', 'ITEM HASIL PETUALANGAN')}\n\n${Object.entries(counts).map(([k,v]) => `• ${k}: x${v}`).join('\n')}\n\nItem tersimpan otomatis pada akun MongoDB kamu.`);
}

if (sub === 'equipment' || sub === 'gear' || sub === 'perlengkapan') {
  const rarityNames = { common: '⚪ Common', rare: '🔵 Rare', epic: '🟣 Epic', legendary: '🟠 Legendary' };
  const gearBonus = { common: 0, rare: 3, epic: 7, legendary: 12 };
  const upgradeBonus = Math.max(0, Number(game.weaponUpgrade || 0)) * 2;
  return reply(`${gameTitle('🛡️ ARMORY • EQUIPMENT', 'GEAR SCORE & RARITY')}

⚔️ Senjata: ${game.equipment?.weapon || 'none'}
🛡️ Zirah: ${game.equipment?.armor || 'none'}
✨ Rarity: ${rarityNames[game.gearRarity] || rarityNames.common}
📈 Gear score: ${game.gearScore || 0}
⚔️ ATK dasar: ${game.attack}
💥 Bonus forge: +${Number(game.forgeBonus ?? gearBonus[game.gearRarity] ?? 0)} ATK
🔨 Upgrade senjata: level ${Number(game.weaponUpgrade || 0)}/5 (+${upgradeBonus} ATK)

Tempa gear: *.pr forge rare*
Pilihan rarity: common, rare, epic, legendary.
Bahan dan gold diperlukan; rarity tinggi lebih mahal.`);
}

if (sub === 'equip' || sub === 'pakai') {
  const item = (args[1] || '').toLowerCase();
  const catalog = {
    pedang_pixel: { slot: 'weapon', name: 'Pedang Pixel', cost: 80, atk: 5, rarity: 'rare' },
    busur_neon: { slot: 'weapon', name: 'Busur Neon', cost: 100, atk: 6, rarity: 'rare' },
    zirah_kristal: { slot: 'armor', name: 'Zirah Kristal', cost: 90, hp: 20, def: 4, rarity: 'epic' },
    jubah_awan: { slot: 'armor', name: 'Jubah Awan', cost: 75, hp: 10, def: 2, rarity: 'rare' },
    cincin_keberuntungan: { slot: 'accessory', name: 'Cincin Keberuntungan', cost: 120, luck: 0.05, rarity: 'epic' },
    jimat_naga: { slot: 'accessory', name: 'Jimat Naga', cost: 160, atk: 3, hp: 10, rarity: 'legendary' }
  };
  const gear = catalog[item];
  if (!gear) return reply(`${gameTitle('🧰 EQUIPMENT CATALOG')}\n\n⚔️ pedang_pixel — 80 gold, +5 ATK\n🏹 busur_neon — 100 gold, +6 ATK\n🛡️ zirah_kristal — 90 gold, +20 HP, -4 damage\n🧥 jubah_awan — 75 gold, +10 HP, -2 damage\n💍 cincin_keberuntungan — 120 gold, +5% loot langka\n🐉 jimat_naga — 160 gold, +3 ATK, +10 HP\n\nBeli dan pakai: *.pr equip <nama_item>*`);
  const owned = Array.isArray(game.inventory.loot) ? game.inventory.loot : [];
  if (owned.includes(gear.name)) {
    const old = game.equipment[gear.slot];
    if (old === gear.name) return reply(`Kamu sudah memakai ${gear.name}.`);
    game.equipment[gear.slot] = gear.name;
    if (gear.atk) game.attack += gear.atk;
    if (gear.hp) { game.maxHp += gear.hp; game.hp = Math.min(game.maxHp, game.hp + gear.hp); }
    if (old && old !== 'none') return reply(`⚠️ Slot ${gear.slot} diganti menjadi ${gear.name}. Bonus item lama tidak otomatis dihitung ulang jika item lama berasal dari versi sebelumnya. Simpan data dan periksa *.pr equipment*.`);
    await saveGame(); return reply(`✅ ${gear.name} berhasil dipakai pada slot ${gear.slot}.`);
  }
  if (game.gold < gear.cost) return reply(`Gold tidak cukup. Harga ${gear.name}: ${gear.cost} gold. Saldo: ${game.gold}.`);
  game.gold -= gear.cost; owned.push(gear.name); game.inventory.loot = owned;
  game.equipment[gear.slot] = gear.name;
  if (gear.atk) game.attack += gear.atk;
  if (gear.hp) { game.maxHp += gear.hp; game.hp = Math.min(game.maxHp, game.hp + gear.hp); }
  await saveGame();
  return reply(`${gameTitle('✨ EQUIPMENT DIPASANG', gear.rarity.toUpperCase())}\n\n${gear.name}\nSlot: ${gear.slot}\n${gear.atk ? `⚔️ ATK +${gear.atk}\n` : ''}${gear.hp ? `❤️ HP maksimum +${gear.hp}\n` : ''}${gear.def ? `🛡️ Pengurangan damage +${gear.def}\n` : ''}${gear.luck ? '🍀 Peluang loot langka +5%\n' : ''}Gold tersisa: ${game.gold}`);
}

if (sub === 'forge' || sub === 'tempa') {
  const rarity = (args[1] || '').toLowerCase();
  const recipes = {
    common: { gold: 20, kristal: 0, inti: 0, bonus: 1, score: 10 },
    rare: { gold: 60, kristal: 3, inti: 0, bonus: 3, score: 25 },
    epic: { gold: 130, kristal: 5, inti: 2, bonus: 7, score: 55 },
    legendary: { gold: 250, kristal: 8, inti: 4, bonus: 12, score: 100 },
  };
  const r = recipes[rarity];
  if (!r) return reply(`${gameTitle('🔨 FORGE WORKSHOP')}

Pilih rarity:
⚪ common — 20 gold, +1 ATK
🔵 rare — 60 gold + 3 kristal, +3 ATK
🟣 epic — 130 gold + 5 kristal + 2 inti, +7 ATK
🟠 legendary — 250 gold + 8 kristal + 4 inti, +12 ATK

Contoh: *.pr forge epic*`);
  if (game.gold < r.gold || (game.materials.kristal || 0) < r.kristal || (game.materials.inti || 0) < r.inti) return reply(`❌ Bahan belum cukup untuk forge ${rarity}. Dibutuhkan: ${r.gold} gold, ${r.kristal} kristal, ${r.inti} inti.`);
  game.gold -= r.gold; game.materials.kristal -= r.kristal; game.materials.inti -= r.inti;
  const rarityBonus = { common: 1, rare: 3, epic: 7, legendary: 12 };
  const previousBonus = Number(game.forgeBonus ?? 0);
  const attackDelta = r.bonus - previousBonus;
  game.gearRarity = rarity; game.gearScore = r.score; game.attack = Math.max(1, game.attack + attackDelta); game.forgeBonus = r.bonus;
  await saveGame();
  return reply(`${gameTitle('✨ FORGE BERHASIL!', 'EQUIPMENT AWAKENED')}

Gear rarity baru: ${({common:'⚪ COMMON',rare:'🔵 RARE',epic:'🟣 EPIC',legendary:'🟠 LEGENDARY'})[rarity]}
⚔️ Perubahan ATK: ${attackDelta >= 0 ? '+' : ''}${attackDelta}
📈 Gear score: ${r.score}
🪙 Gold tersisa: ${game.gold}

Lihat detail: *.pr equipment*`);
}

if (sub === 'raid') {
  const action = (args[1] || 'info').toLowerCase();
  const raidBoss = { name: 'Naga Void', emoji: '🐉', hp: 260, atk: 16 };
  if (game.raidDate !== today) { game.raidDate = today; game.raid = null; }
  if (action === 'klaim' || action === 'claim') {
    if (game.raidClaimedDate === today) return reply('🏰 Hadiah raid sudah diklaim hari ini. Kembali besok!');
    if (!game.raid?.cleared) return reply('⚠️ Kalahkan Naga Void terlebih dahulu dengan *.pr raid mulai* dan *.pr raid serang*.');
    game.raidClaimedDate = today; game.gold += 100; game.materials.inti += 2; game.materials.kristal += 3; const lm = addExp(80); await saveGame();
    return reply(`${gameTitle('🏆 RAID CLEAR!', 'VOID DRAGON REWARD')}

🪙 +100 gold
✨ +80 EXP
🔮 +2 inti
💎 +3 kristal${lm}`);
  }
  if (action === 'mulai' || action === 'start') {
    if (game.raidClaimedDate === today) return reply('Hadiah raid hari ini sudah diklaim.');
    if (game.raid?.cleared) return reply('Raid sudah selesai. Gunakan *.pr raid klaim*.');
    if (game.raid) return reply('Raid sedang berlangsung. Gunakan *.pr raid serang*.');
    game.raid = { hp: raidBoss.hp, maxHp: raidBoss.hp, cleared: false, turn: 1 };
    await saveGame();
    return reply(`${gameTitle('🐉 VOID RAID DIMULAI', 'DAILY BOSS • SOLO RAID')}

${raidBoss.emoji} *${raidBoss.name}* muncul!
❤️ Boss HP: ${raidBoss.hp}/${raidBoss.hp}
⚔️ Boss ATK: ${raidBoss.atk}

Serang dengan *.pr raid serang*.
Hadiah: 100 gold, 80 EXP, 2 inti, 3 kristal.`);
  }
  if (action === 'serang' || action === 'attack') {
    if (!game.raid || game.raid.cleared) return reply('Mulai raid dengan *.pr raid mulai*.');
    const damage = Math.max(1, game.attack + Math.floor(Math.random() * 8) + petAttack());
    game.raid.hp = Math.max(0, game.raid.hp - damage);
    if (game.raid.hp <= 0) {
      game.raid.cleared = true; game.bossDefeated = (game.bossDefeated || 0) + 1; game.wins = (game.wins || 0) + 1; game.bountyWins = (game.bountyWins || 0) + 1; game.weeklyWins = Math.min(5, Number(game.weeklyWins || 0) + 1); game.weeklyQuestWins = Math.min(10, Number(game.weeklyQuestWins || 0) + 1); game.trialWins = game.trialDate === today ? Math.min(3, Number(game.trialWins || 0) + 1) : 1; game.trialDate = today;
      await saveGame();
      return reply(`${gameTitle('🏆 NAGA VOID DIKALAHKAN!', 'RAID BOSS DEFEATED')}

💥 Damage akhir: ${damage}
🐉 Boss HP: 0/${raidBoss.hp}
🎁 Hadiah menunggu untuk diklaim!
Ketik *.pr raid klaim*.`);
    }
    const incoming = Math.max(1, raidBoss.atk + Math.floor(Math.random()*7) - (game.equipment?.armor && game.equipment.armor !== 'none' ? 3 : 0) - Math.floor(game.level/3));
    game.hp = Math.max(1, game.hp - incoming); game.raid.turn += 1;
    await saveGame();
    return reply(`${gameTitle('⚔️ RAID BATTLE', 'VOID DRAGON • ROUND ' + game.raid.turn)}

🐉 Naga Void
${bar(game.raid.hp, game.raid.maxHp, 12)} ${game.raid.hp}/${game.raid.maxHp} HP
💥 Damage kamu: ${damage}
💢 Serangan boss: -${incoming} HP
❤️ HP kamu: ${game.hp}/${game.maxHp}

Ketik *.pr raid serang* lagi.`);
  }
  return reply(`${gameTitle('🏰 VOID RAID', 'DAILY BOSS CHALLENGE')}

🐉 Naga Void — 260 HP
Status: ${game.raid?.cleared ? '🏆 Boss dikalahkan, hadiah siap diklaim' : game.raid ? `⚔️ Pertarungan berjalan (${game.raid.hp}/${game.raid.maxHp} HP)` : '🕯️ Belum dimulai'}

• *.pr raid mulai* — mulai raid
• *.pr raid serang* — serang boss
• *.pr raid klaim* — klaim hadiah setelah menang

Hadiah: 100 gold, 80 EXP, 2 inti, 3 kristal.`);
}

if (sub === 'trial' || sub === 'uji') {
  const action = (args[1] || 'info').toLowerCase();
  if (game.trialDate !== today) { game.trialDate = today; game.trialWins = 0; }
  if (action === 'klaim' || action === 'claim') {
    if (game.trialClaimedDate === today) return reply('🏅 Hadiah Trial sudah diklaim hari ini.');
    if (game.trialWins < 3) return reply(`Progres Trial: ${game.trialWins}/3 kemenangan. Menangkan 3 pertarungan hari ini untuk mencatat progres otomatis.`);
    game.trialClaimedDate = today; game.gold += 60; game.materials.kristal += 2; const lm = addExp(50); await saveGame();
    return reply(`${gameTitle('🏅 TRIAL MASTER!', 'DAILY TRIAL COMPLETE')}

🪙 +60 gold • ✨ +50 EXP • 💎 +2 kristal${lm}`);
  }
  if (action === 'menang') return reply('⚠️ Progres Trial tercatat otomatis dari kemenangan pertarungan yang sah. Menangkan 3 pertarungan hari ini, lalu gunakan *.pr trial klaim*.');
  return reply(`${gameTitle('🏅 DAILY TRIAL', 'CHALLENGE YOUR LIMITS')}

Progres tercatat: ${game.trialWins}/3
Hadiah: 60 gold, 50 EXP, 2 kristal

Kemenangan dari pertarungan, Arena, dan Raid tercatat otomatis.
Klaim hadiah dengan *.pr trial klaim* setelah 3 kemenangan.`);
}

if (sub === 'pet-skill' || (sub === 'pet' && args[1] === 'skill')) {
  if (!game.pet?.species) return reply('Kamu belum memiliki pet. Gunakan *.pr pet toko* lalu *.pr pet adopsi fox*.');
  const catalog = petCatalog[game.pet.species];
  const evolved = Boolean(game.pet.evolved);
  return reply(`${gameTitle('🐾 PET SPECIAL SKILL', 'COMPANION ARCHIVE')}

${catalog?.emoji || '🐾'} *${game.pet.name || catalog?.name || game.pet.species}* Lv.${game.pet.level}
✨ Skill: ${evolved ? 'Evolved Burst' : 'Companion Strike'}
💥 Damage bantuan: ${petAttack()}
${evolved ? '🌟 Pet berevolusi: bonus damage aktif.' : '🔒 Evolusikan pet untuk bonus damage lebih besar.'}

Serangan pet otomatis membantu saat battle dan raid.`);
}

if (sub === 'bantuan' || sub === 'help') {
  return reply(`${gameTitle('📚 PANDUAN PIXEL QUEST FANTASY')}\n\n*PETUALANGAN*\n.pr peta • .pr pergi <wilayah> • .pr jelajah\n.pr cerita • .pr ceritaklaim • .pr dungeon\n.pr ruang kiri/tengah/kanan\n\n*BERTARUNG*\n.pr serang • .pr skill • .pr potion\n.pr ether • .pr bom • .pr kabur\n\n*PROGRES*\n.pr statistik • .pr streak • .pr tantangan
.pr arena • .pr arena mulai/serang/skill/potion
.pr arena klaim\n.pr tantanganklaim • .pr bounty / bounty klaim\n.pr ranking • .pr statistik\n\n*ITEM & PET*\n.pr toko • .pr inventori • .pr bahan\n.pr kumpul • .pr resep • .pr buat <resep>\n.pr pet • .pr pet toko • .pr evolusi
.pr latihan • .pr upgrade • .pr skillinfo
.pr gelar • .pr koleksi • .pr memancing
.pr jual <bahan> <jumlah>\n.pr equipment • .pr equip <item> • .pr forge <rarity>
.pr skilltree • .pr loot • .pr weeklyquest / weeklyquest klaim
.pr raid mulai/serang/klaim\n.pr trial • .pr trial menang/klaim\n.pr pet skill\n.pr worldboss mulai/serang/ranking/klaim\n.pr territory daftar/kuasai/milikku\n.pr transfer @anggota jumlah\n.pr seasonreward\n\nSemua progres tersimpan pada akun pemain di database.`);
}
  return undefined;
}
