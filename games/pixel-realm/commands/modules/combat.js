// Generated from the original Pixel Realm handler; command logic is preserved.
export function matches(ctx) {
  const { sub, args, game } = ctx;
  return (sub === 'bertahan' || sub === 'guard' || sub === 'defend') ||
    (sub === 'serang' || (sub === 'skill' && Boolean(game.battle))) ||
    (sub === 'bom') ||
    (sub === 'ether') ||
    (sub === 'potion') ||
    (sub === 'kabur');
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
if (sub === 'bertahan' || sub === 'guard' || sub === 'defend') {
  if (!game.battle) return reply('🛡️ Tidak ada musuh yang perlu dihadapi. Ketik *.pr jelajah* untuk memulai petualangan.');
  if (game.hp <= 0) return reply('❤️ HP kamu habis. Pulihkan diri dengan *.pr istirahat* terlebih dahulu.');
  const enemy = game.battle;
  const retaliation = enemyRetaliation(enemy);
  const reducedDamage = Math.max(1, Math.ceil(retaliation.hit * 0.4));
  game.hp = Math.max(0, game.hp - reducedDamage);
  let output = `${gameTitle('🛡️ PERTAHANAN BERHASIL', 'BERTAHAN • ATUR NAPAS') }\n\n` +
    `Kamu memasang posisi bertahan dan membaca gerakan musuh.\n` +
    `👾 ${retaliation.text}!\n` +
    `🛡️ Damage dikurangi: ${retaliation.hit - reducedDamage}\n` +
    `💥 Damage diterima: *${reducedDamage}* (normal ${retaliation.hit})\n` +
    `❤️ HP kamu: ${hpPanel(game.hp, game.maxHp)}\n`;
  if (game.hp <= 0) {
    game.battle = null; game.losses += 1;
    const lost = Math.min(game.gold, 5); game.gold -= lost;
    output += `\n💫 *KAMU TUMBANG*\nGold hilang: -${lost}. Level dan EXP tetap aman.\nGunakan *.pr istirahat* untuk pulih.`;
  } else {
    output += `\n${battleIntent(enemy)}\n▶ Giliran berikutnya: ${enemy.turn}\n⚔️ *.pr serang* • ✨ *.pr skill*\n🧪 *.pr potion* • 💣 *.pr bom* • 🛡️ *.pr bertahan*`;
  }
  await saveGame();
  return reply(output);
}

if (sub === 'serang' || (sub === 'skill' && Boolean(game.battle))) {
  if (!game.battle) return reply(`Tidak ada musuh di hadapanmu. Ketik *.pr jelajah* untuk mencari petualangan.`);
  if (game.hp <= 0) return reply(`❤️ HP kamu habis. Gunakan *.pr istirahat* atau mulai ulang petualangan.`);
  const enemy = game.battle;
  const isSkill = sub === 'skill';
  const turn = Math.max(1, Number(enemy.turn || 1));
  enemy.skillReadyTurn = Math.max(1, Number(enemy.skillReadyTurn || 1));
  if (isSkill && turn < enemy.skillReadyTurn) {
    const wait = enemy.skillReadyTurn - turn;
    return reply(`${gameTitle('⏳ JURUS MASIH COOLDOWN', 'ATUR STRATEGI') }\n\n✨ *${game.skillName || 'Jurus Khusus'}* belum siap digunakan.\n⌛ Tunggu *${wait} giliran* dengan memakai serangan biasa atau item.\n\n${battleIntent(enemy)}\n⚔️ *.pr serang* • 🧪 *.pr potion* • 💣 *.pr bom*`);
  }
  let damage = Number(game.attack || 11) + Math.floor(Math.random() * 7);
  if (isSkill) {
    damage += Number(game.skillBonus || 10);
    enemy.skillReadyTurn = turn + 3;
  }
  const critChance = Math.min(0.35, 0.10 + Math.floor(Number(game.level || 1) / 5) * 0.02 + (game.gearRarity === 'legendary' ? 0.05 : game.gearRarity === 'epic' ? 0.03 : 0));
  const critical = Math.random() < critChance;
  if (critical) damage = Math.ceil(damage * 1.7);
  const companionDamage = petAttack();
  enemy.hp = Math.max(0, enemy.hp - damage - companionDamage);
  let result = `${gameTitle(isSkill ? '✨ JURUS KHUSUS!' : '⚔️ SERANGAN!')}\n\n` +
    `🧑‍🚀 *${game.name}* menggunakan ${isSkill ? (game.skillName || 'Jurus Khusus') : 'serangan biasa'}!\n` +
    `💥 Damage hero: *${damage}*${critical ? ' 🌟 *CRITICAL HIT! x1.7*' : ''}${companionDamage ? `\n🐾 ${game.pet.name || petCatalog[game.pet.species].name} membantu menyerang: *+${companionDamage}*` : ''}\n` +
    `⚡ Total damage: *${damage + companionDamage}*\n` +
    `${enemy.emoji || '👾'} *${enemy.name}*\n` +
    `❤️ HP musuh: ${hpPanel(enemy.hp, enemy.maxHp)}\n`;
  if (enemy.hp <= 0) {
    game.battle = null; game.wins += 1; game.eventWins += 1; game.bountyWins = (game.bountyWins || 0) + 1; game.weeklyWins = Math.min(5, Number(game.weeklyWins || 0) + 1); game.weeklyQuestWins = Math.min(10, Number(game.weeklyQuestWins || 0) + 1); game.trialWins = game.trialDate === today ? Math.min(3, Number(game.trialWins || 0) + 1) : 1; game.trialDate = today; game.gold += enemy.gold;
    if (game.pet?.species) { game.pet.exp = Number(game.pet.exp || 0) + Math.max(1, Math.floor(enemy.exp / 5)); while (game.pet.exp >= Number(game.pet.level || 1) * 20) { game.pet.exp -= Number(game.pet.level || 1) * 20; game.pet.level = Number(game.pet.level || 1) + 1; } }
    if (enemy.mode === 'dungeon') { game.dungeonClears += 1; game.dungeonFloor = Math.max(game.dungeonFloor, Number(enemy.floor || game.dungeonFloor) + 1); }
    if (enemy.isBoss || enemy.mode === 'boss') game.bossDefeated += 1;
    // Loot drop: guaranteed basic material + rarity roll, persisted with player data.
    const lootRoll = Math.random(); const fortuneBonus = Math.min(0.20, Number(game.skillTree?.fortune || 0) * 0.02 + (String(game.equipment?.accessory || '').includes('Keberuntungan') ? 0.05 : 0));
    const lootDrop = lootRoll < 0.06 + fortuneBonus ? 'Relik Langka' : lootRoll < 0.24 + fortuneBonus ? 'Kristal Pixel' : lootRoll < 0.52 ? 'Serat Neon' : 'Kayu Pixel';
    game.inventory.loot = Array.isArray(game.inventory.loot) ? game.inventory.loot : []; game.inventory.loot.push(lootDrop);
    if (lootDrop === 'Kristal Pixel') game.materials.kristal = Number(game.materials.kristal || 0) + 1;
    if (lootDrop === 'Serat Neon') game.materials.serat = Number(game.materials.serat || 0) + 1;
    if (lootDrop === 'Kayu Pixel') game.materials.kayu = Number(game.materials.kayu || 0) + 1;
    if (game.sideQuestId === 'wins' && !game.sideQuestClaimed) game.sideQuestProgress += 1;
    const exp = enemy.exp; const levelMessage = addExp(exp);
    result += `\n\n╭━━ 🏆 *VICTORY!* ━━╮\n│ ${enemy.emoji || '👾'} ${enemy.name} dikalahkan!\n│ 🪙 Gold : *+${enemy.gold}*\n│ ✨ EXP  : *+${exp}*\n│ 🎁 Loot: *${lootDrop}*\n╰━━━━━━━━━━━━━━━━━━╯${enemy.mode === 'dungeon' ? `\n🏰 Dungeon clear! Lantai berikutnya: ${game.dungeonFloor}.` : ''}${enemy.isBoss || enemy.mode === 'boss' ? '\n👑 Bos dikalahkan! Cek *.pr achievement*.' : ''}${levelMessage}\n\n▶ Ketik *.pr jelajah* atau *.pr dungeon* untuk lanjut.`;
    await saveGame(); return reply(result);
  }
  const retaliation = enemyRetaliation(enemy);
  const received = retaliation.hit;
  game.hp = Math.max(0, game.hp - received);
  result += `\n╭─ 🔁 *GILIRAN MUSUH • ${Number(enemy.turn || 2) - 1}*\n` +
    `│ ${enemy.emoji || '👾'} ${retaliation.text}!\n` +
    `│ 💥 Damage diterima: *${received}*\n` +
    `│ ❤️ HP kamu : ${hpPanel(game.hp, game.maxHp)}\n` +
    `│ 👾 HP musuh: ${hpPanel(enemy.hp, enemy.maxHp)}\n` +
    `╰──────────────────\n`;
  if (game.hp <= 0) {
    game.battle = null; game.losses += 1;
    const lost = Math.min(game.gold, 5); game.gold -= lost;
    result += `\n\n╭━━ 💫 *KAMU TUMBANG* ━━╮\n│ Gold hilang: -${lost}\n│ Level dan EXP tetap aman.\n╰━━━━━━━━━━━━━━━━━━╯\nGunakan *.pr istirahat* untuk pulih.`;
  } else result += `\n${battleIntent(enemy)}\n▶ *Giliran berikutnya: ${enemy.turn}*\n⚔️ *.pr serang*  •  ✨ *.pr skill*\n🧪 *.pr potion* • 💣 *.pr bom*`;
  await saveGame(); return reply(result);
}

if (sub === 'bom') {
  if (!game.battle) return reply('💣 Bom Pixel hanya bisa digunakan saat bertarung.');
  if (game.inventory.bombs <= 0) return reply('Bom Pixel kamu habis. Beli di *.pr toko* dengan *.pr beli bom*.');
  const enemy = game.battle; const damage = 20; const companionDamage = petAttack(); game.inventory.bombs -= 1; enemy.hp = Math.max(0, enemy.hp - damage - companionDamage);
  let output = `${gameTitle('💣 BOM PIXEL AKTIF!')}\n\nLedakan energi mengenai *${enemy.name}*!\n💥 Damage bom: *${damage}*${companionDamage ? `\n🐾 ${game.pet.name || petCatalog[game.pet.species].name} ikut menyerang: *+${companionDamage}*` : ''}\n⚡ Total damage: *${damage + companionDamage}*\n❤️ HP musuh: ${hpPanel(enemy.hp, enemy.maxHp)}`;
  if (enemy.hp <= 0) {
    game.battle = null; game.wins += 1; game.eventWins += 1; game.bountyWins = (game.bountyWins || 0) + 1; game.weeklyWins = Math.min(5, Number(game.weeklyWins || 0) + 1); game.weeklyQuestWins = Math.min(10, Number(game.weeklyQuestWins || 0) + 1); game.trialWins = game.trialDate === today ? Math.min(3, Number(game.trialWins || 0) + 1) : 1; game.trialDate = today; game.gold += enemy.gold;
    if (game.pet?.species) { game.pet.exp = Number(game.pet.exp || 0) + Math.max(1, Math.floor(enemy.exp / 5)); while (game.pet.exp >= Number(game.pet.level || 1) * 20) { game.pet.exp -= Number(game.pet.level || 1) * 20; game.pet.level = Number(game.pet.level || 1) + 1; } }
    if (enemy.mode === 'dungeon') { game.dungeonClears += 1; game.dungeonFloor = Math.max(game.dungeonFloor, Number(enemy.floor || game.dungeonFloor) + 1); }
    if (enemy.isBoss || enemy.mode === 'boss') game.bossDefeated += 1;
    // Loot drop: guaranteed basic material + rarity roll, persisted with player data.
    const lootRoll = Math.random(); const fortuneBonus = Math.min(0.20, Number(game.skillTree?.fortune || 0) * 0.02 + (String(game.equipment?.accessory || '').includes('Keberuntungan') ? 0.05 : 0));
    const lootDrop = lootRoll < 0.06 + fortuneBonus ? 'Relik Langka' : lootRoll < 0.24 + fortuneBonus ? 'Kristal Pixel' : lootRoll < 0.52 ? 'Serat Neon' : 'Kayu Pixel';
    game.inventory.loot = Array.isArray(game.inventory.loot) ? game.inventory.loot : []; game.inventory.loot.push(lootDrop);
    if (lootDrop === 'Kristal Pixel') game.materials.kristal = Number(game.materials.kristal || 0) + 1;
    if (lootDrop === 'Serat Neon') game.materials.serat = Number(game.materials.serat || 0) + 1;
    if (lootDrop === 'Kayu Pixel') game.materials.kayu = Number(game.materials.kayu || 0) + 1;
    if (game.sideQuestId === 'wins' && !game.sideQuestClaimed) game.sideQuestProgress += 1;
    const levelMessage = addExp(enemy.exp);
    output += `\n\n🏆 *VICTORY!*\n🪙 +${enemy.gold} gold\n✨ +${enemy.exp} EXP\n🎁 Loot: *${lootDrop}*${enemy.mode === 'dungeon' ? `\n🏰 Dungeon clear! Lantai berikutnya: ${game.dungeonFloor}.` : ''}${enemy.isBoss || enemy.mode === 'boss' ? '\n👑 Bos dikalahkan! Cek *.pr achievement*.' : ''}${levelMessage}`;
  } else {
    const retaliation = enemyRetaliation(enemy); game.hp = Math.max(0, game.hp - retaliation.hit);
    output += `\n\n👾 ${retaliation.text}! (-${retaliation.hit} HP)\n❤️ HP kamu: ${game.hp}/${game.maxHp}\n${battleIntent(enemy)}`;
    if (game.hp <= 0) { game.battle = null; game.losses += 1; const lost = Math.min(game.gold, 5); game.gold -= lost; output += `\n💫 Kamu tumbang. Gold hilang: -${lost}. Gunakan *.pr istirahat*.`; }
  }
  await saveGame(); return reply(output);
}

if (sub === 'ether') {
  if (game.inventory.ether <= 0) return reply('🔷 Ether habis. Beli dengan *.pr beli ether*.');
  if (game.hp >= game.maxHp) return reply('❤️ HP sudah penuh. Simpan Ether untuk nanti.');
  const before = game.hp; game.inventory.ether -= 1; game.hp = Math.min(game.maxHp, game.hp + 25);
  let etherText = `${gameTitle('🔷 ETHER DIGUNAKAN')}\n\n❤️ HP pulih: +${game.hp - before}\n${hpPanel(game.hp, game.maxHp)}\n🔷 Ether tersisa: ${game.inventory.ether}`;
  if (game.battle) {
    const retaliation = enemyRetaliation(game.battle); game.hp = Math.max(0, game.hp - retaliation.hit);
    etherText += `\n\n⚠️ Giliran musuh: ${retaliation.text} (-${retaliation.hit} HP).\n❤️ HP sekarang: ${game.hp}/${game.maxHp}\n${battleIntent(game.battle)}`;
    if (game.hp <= 0) { game.battle = null; game.losses += 1; const lost = Math.min(game.gold, 5); game.gold -= lost; etherText += `\n\n╭━━ 💫 *KAMU TUMBANG* ━━╮\n│ Gold hilang: -${lost}\n│ Level dan EXP tetap aman.\n╰━━━━━━━━━━━━━━━━━━╯\nGunakan *.pr istirahat* untuk pulih.`; }
  }
  await saveGame(); return reply(etherText);
}

if (sub === 'potion') {
  if (game.potions <= 0) return reply(`🧪 Potion kamu habis. Beli lagi dengan *.pr beli potion* (15 gold).`);
  if (game.hp >= game.maxHp) return reply(`❤️ HP kamu sudah penuh (${game.hp}/${game.maxHp}). Simpan potion untuk nanti.`);
  const before = game.hp; game.potions -= 1; game.hp = Math.min(game.maxHp, game.hp + 35);
  let result = `🧪 *POTION DIGUNAKAN*\nHP pulih: +${game.hp - before}\n❤️ HP: ${game.hp}/${game.maxHp}\nPotion tersisa: ${game.potions}`;
  if (game.battle && game.hp > 0) {
    const retaliation = enemyRetaliation(game.battle);
    const hit = retaliation.hit; game.hp = Math.max(0, game.hp - hit);
    result += `\n\n⚠️ Saat kamu minum, ${retaliation.text} (-${hit} HP).\n❤️ HP sekarang: ${game.hp}/${game.maxHp}\n${game.battle ? battleIntent(game.battle) : ''}`;
    if (game.hp <= 0) { game.battle = null; game.losses += 1; const lost = Math.min(game.gold, 5); game.gold -= lost; result += `\n\n╭━━ 💫 *KAMU TUMBANG* ━━╮\n│ Gold hilang: -${lost}\n│ Level dan EXP tetap aman.\n╰━━━━━━━━━━━━━━━━━━╯\nGunakan *.pr istirahat* untuk pulih.`; }
  }
  await saveGame(); return reply(result);
}

if (sub === 'kabur') {
  if (!game.battle) return reply('Tidak ada pertarungan yang perlu ditinggalkan.');
  game.battle = null; game.hp = Math.max(1, game.hp - 5);
  await saveGame(); return reply(`🏃 Kamu berhasil kabur, tetapi kehilangan 5 HP saat melarikan diri.\n❤️ HP: ${game.hp}/${game.maxHp}\nKetik *.pr jelajah* jika siap mencoba lagi.`);
}
  return undefined;
}
