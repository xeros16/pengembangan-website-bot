// Generated from the original Pixel Realm handler; command logic is preserved.
export function matches(ctx) {
  const { sub, args, game } = ctx;
  return (sub === 'pvp' || sub === 'duel') ||
    (sub === 'arena');
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
if (sub === 'pvp' || sub === 'duel') {
  if (!isGroup) return reply('⚔️ Duel PvP hanya bisa dimainkan di grup.');
  const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || msg.message?.imageMessage?.contextInfo?.mentionedJid || [];
  const quotedJid = msg.message?.extendedTextMessage?.contextInfo?.participant || '';
  const targetJid = normalizeJid(mentioned[0] || quotedJid || '');
  if (!targetJid) return reply('Format: *.pr pvp @anggota* — tag anggota yang ingin diajak duel.');
  if (targetJid === normalizeJid(userJid)) return reply('Kamu tidak bisa menantang diri sendiri.');
  const targetUser = await User.findOne({ jid: targetJid });
  const targetGame = targetUser?.pr;
  if (!targetUser || !targetGame?.started || !targetGame?.name || !['pendekar','penyihir','penjelajah'].includes(targetGame.class)) return reply('Lawan belum membuat karakter Pixel Quest. Minta dia menjalankan *.pr mulai*.');
  if (!game.started || !game.name) return reply('Buat karakter dulu dengan *.pr mulai*.');
  if (game.battle || game.arena || targetGame.battle || targetGame.arena) return reply('Salah satu pemain sedang bertarung atau berada di Arena. Selesaikan dulu sebelum PvP.');
  // Cooldown untuk kedua pemain mencegah duel berulang akibat spam dan mengurangi gold terus-menerus.
  const nowPvp = Date.now();
  const pvpCooldownMs = 60 * 1000;
  const myPvpUntil = Number(game.pvpCooldownUntil || 0);
  const targetPvpUntil = Number(targetGame.pvpCooldownUntil || 0);
  if (myPvpUntil > nowPvp) return reply(`⏳ PvP kamu sedang cooldown. Coba lagi dalam ${Math.ceil((myPvpUntil - nowPvp) / 1000)} detik.`);
  if (targetPvpUntil > nowPvp) return reply(`🛡️ Lawan masih cooldown PvP selama ${Math.ceil((targetPvpUntil - nowPvp) / 1000)} detik, jadi tidak bisa ditantang terus-menerus.`);
  const powerA = Number(game.attack || 0) + Number(game.level || 1) * 2 + petAttack() + Math.floor(Math.random() * 12);
  const targetPetCatalog = { fox:{atk:4}, wolf:{atk:6}, slime:{atk:3}, dragon:{atk:9} };
  const targetPet = targetGame.pet || {};
  const targetPetAtk = targetPet.species && targetPetCatalog[targetPet.species] ? targetPetCatalog[targetPet.species].atk + (Math.max(1, Number(targetPet.level || 1)) - 1) * 2 + (targetPet.evolved ? 8 : 0) : 0;
  const powerB = Number(targetGame.attack || 0) + Number(targetGame.level || 1) * 2 + targetPetAtk + Math.floor(Math.random() * 12);
  const draw = powerA === powerB;
  const winnerIsMe = powerA > powerB;
  if (!draw) {
    if (winnerIsMe) {
      game.pvpWins = Number(game.pvpWins || 0) + 1; game.gold = Number(game.gold || 0) + 10;
      targetGame.pvpLosses = Number(targetGame.pvpLosses || 0) + 1; targetGame.gold = Math.max(0, Number(targetGame.gold || 0) - 5);
    } else {
      game.pvpLosses = Number(game.pvpLosses || 0) + 1; game.gold = Math.max(0, Number(game.gold || 0) - 5);
      targetGame.pvpWins = Number(targetGame.pvpWins || 0) + 1; targetGame.gold = Number(targetGame.gold || 0) + 10;
    }
  }
  game.pvpCooldownUntil = nowPvp + pvpCooldownMs;
  targetGame.pvpCooldownUntil = nowPvp + pvpCooldownMs;
  user.game = game; user.markModified('game'); targetUser.game = targetGame; targetUser.markModified('game');
  await Promise.all([user.save(), targetUser.save()]);
  const winnerText = draw ? '🤝 Hasil seri! Tidak ada perubahan gold.' : winnerIsMe ? `🏆 Pemenang: *${game.name}* (+10 gold). ${targetGame.name} kehilangan 5 gold (maksimal sampai 0).` : `🏆 Pemenang: *${targetGame.name}* (+10 gold). ${game.name} kehilangan 5 gold (maksimal sampai 0).`;
  return reply(`╭─ *⚔️ PIXEL PvP DUEL* ─╮\n│ 🧑 ${game.name} — Power ${powerA}\n│ 🧑 ${targetGame.name} — Power ${powerB}\n╰────────────────────╯\n\n${winnerText}\n\n📊 Rekor kamu: ${game.pvpWins || 0} menang / ${game.pvpLosses || 0} kalah\n💡 Power dihitung dari ATK, level, pet, dan faktor acak. Duel ini langsung selesai; tidak mengurangi HP.`);
}

if (sub === 'arena') {
  const action = (args[1] || '').toLowerCase();
  const todayDate = today;
  const arenaEnemies = [
    { name: 'Slime Gladiator', emoji: '🟢', hp: 32, atk: 6, gold: 18, exp: 12 },
    { name: 'Ksatria Glitch', emoji: '🛡️', hp: 46, atk: 9, gold: 26, exp: 18 },
    { name: 'Naga Arena', emoji: '🐉', hp: 68, atk: 12, gold: 45, exp: 32 },
  ];
  if (action === 'klaim' || action === 'claim') {
    if (game.arenaClaimDate === todayDate) return reply('🏟️ Hadiah Arena sudah diklaim hari ini. Coba lagi besok.');
    if (!game.arenaReady) return reply('Kamu perlu menuntaskan 3 ronde Arena terlebih dahulu hari ini. Gunakan *.pr arena mulai*.');
    game.arenaClaimDate = todayDate; game.arenaReady = false; game.gold += 50; game.potions += 2; game.inventory.ether += 1; const lm = addExp(40); await saveGame();
    return reply(`${gameTitle('🏆 HADIAH ARENA') }\n\n🪙 +50 gold\n🧪 +2 Potion\n🔮 +1 Ether\n✨ +40 EXP${lm}\n\nHadiah Arena dapat diklaim sekali sehari.`);
  }
  if (!action || action === 'menu' || action === 'info') {
    const arena = game.arena;
    return reply(`${gameTitle('🏟️ PIXEL ARENA') }\n\nTuntaskan 3 ronde musuh yang semakin kuat.\nRonde tersimpan: ${arena ? `${arena.round}/3 — ${arena.enemyName} (${arena.enemyHp}/${arena.enemyMaxHp} HP)` : 'belum dimulai'}\nRonde selesai: ${game.arenaWins || 0}/3\n\n• *.pr arena mulai* — mulai tantangan\n• *.pr arena serang* — serang musuh\n• *.pr arena skill* — gunakan skill kelas\n• *.pr arena potion* — pulihkan HP\n• *.pr arena kabur* — batalkan tantangan\n• *.pr arena klaim* — klaim hadiah setelah 3 ronde\n\n🎁 Hadiah: 50 gold, 40 EXP, 2 Potion, 1 Ether.`);
  }
  if (action === 'mulai' || action === 'start') {
    if (game.arena) return reply('🏟️ Tantangan Arena masih berjalan. Gunakan *.pr arena serang* atau *.pr arena kabur*.');
    if (game.hp < 20) return reply('❤️ HP terlalu rendah untuk masuk Arena. Pulihkan HP terlebih dahulu.');
    const e = arenaEnemies[0]; game.arena = { round: 1, enemyName: e.name, enemyEmoji: e.emoji, enemyHp: e.hp, enemyMaxHp: e.hp, enemyAtk: e.atk, rewardGold: e.gold, rewardExp: e.exp, turn: 1 };
    await saveGame(); return reply(`${gameTitle('🏟️ ARENA DIMULAI') }\n\n${e.emoji} *${e.name}* muncul!\n❤️ HP musuh: ${e.hp}\n❤️ HP kamu: ${game.hp}/${game.maxHp}\n\nKetik *.pr arena serang* atau *.pr arena skill*.`);
  }
  if (action === 'kabur' || action === 'lari') {
    if (!game.arena) return reply('Kamu tidak sedang berada di Arena.'); game.arena = null; await saveGame(); return reply('🏃 Kamu meninggalkan Arena. Progres ronde saat ini dibatalkan, HP dan item yang sudah terpakai tidak dikembalikan.');
  }
  if (!['serang','skill','potion'].includes(action)) return reply('Perintah Arena: *.pr arena mulai/serang/skill/potion/kabur/klaim*.');
  if (!game.arena) return reply('Belum ada tantangan Arena. Ketik *.pr arena mulai*.');
  const a = game.arena;
  if (action === 'potion') {
    if (game.potions < 1) return reply('🧪 Potion kamu habis. Beli di *.pr toko*.');
    if (game.hp >= game.maxHp) return reply('❤️ HP kamu sudah penuh.');
    game.potions--; const heal = Math.min(35, game.maxHp - game.hp); game.hp += heal;
  } else {
    let damage = Math.max(1, game.attack + Math.floor(Math.random()*5) + petAttack());
    if (action === 'skill') {
      if (a.skillCooldown && a.skillCooldown > 0) return reply(`⏳ Skill masih cooldown ${a.skillCooldown} giliran. Gunakan *.pr arena serang* dulu.`);
      damage += game.skillBonus || 10; a.skillCooldown = 2;
    } else if (a.skillCooldown > 0) a.skillCooldown--;
    a.enemyHp = Math.max(0, a.enemyHp - damage);
    if (a.enemyHp <= 0) {
      game.gold += a.rewardGold; const lm = addExp(a.rewardExp); game.wins = (game.wins || 0) + 1; game.bountyWins = (game.bountyWins || 0) + 1; game.weeklyWins = Math.min(5, Number(game.weeklyWins || 0) + 1); game.weeklyQuestWins = Math.min(10, Number(game.weeklyQuestWins || 0) + 1); game.trialWins = game.trialDate === today ? Math.min(3, Number(game.trialWins || 0) + 1) : 1; game.trialDate = today; game.arenaWins = Math.min(3, (game.arenaWins || 0) + 1);
      const finishedRound = a.round;
      if (finishedRound >= 3) { game.arena = null; game.arenaReady = true; }
      else { const e = arenaEnemies[finishedRound]; game.arena = { round: finishedRound+1, enemyName:e.name, enemyEmoji:e.emoji, enemyHp:e.hp, enemyMaxHp:e.hp, enemyAtk:e.atk, rewardGold:e.gold, rewardExp:e.exp, turn:1 }; }
      await saveGame();
      return reply(`${gameTitle(finishedRound >= 3 ? '🏆 ARENA DITAKLUKKAN!' : '⚔️ RONDE DIMENANGKAN!') }\n\n💥 Seranganmu memberikan *${damage} damage*.\n🪙 +${a.rewardGold} gold • ✨ +${a.rewardExp} EXP${lm}\n${finishedRound >= 3 ? '\n🎉 Semua 3 ronde selesai! Klaim hadiah dengan *.pr arena klaim*.' : `\nMusuh berikutnya: ${game.arena.enemyEmoji} *${game.arena.enemyName}* (${game.arena.enemyHp} HP).`}\n❤️ HP kamu: ${game.hp}/${game.maxHp}`);
    }
  }
  const incoming = Math.max(1, a.enemyAtk + Math.floor(Math.random()*4) - (game.equipment?.armor && game.equipment.armor !== 'none' ? 3 : 0) - Math.floor((game.level || 1)/3));
  game.hp = Math.max(0, game.hp - incoming); a.turn = (a.turn || 1) + 1;
  if (game.hp <= 0) { game.losses = (game.losses || 0) + 1; game.gold = Math.max(0, game.gold - Math.min(5, game.gold)); game.hp = Math.max(1, Math.floor(game.maxHp*0.3)); game.arena = null; await saveGame(); return reply(`💫 Kamu kalah di Arena! Kehilangan hingga 5 gold dan dipulihkan ke ${game.hp} HP. Tantangan dibatalkan.`); }
  await saveGame(); return reply(`${gameTitle('🏟️ PERTARUNGAN ARENA') }\n\n${a.enemyEmoji} *${a.enemyName}*\n❤️ HP musuh: ${a.enemyHp}/${a.enemyMaxHp}\n💥 Musuh menyerang balik: -${incoming} HP\n❤️ HP kamu: ${game.hp}/${game.maxHp}\n${action === 'potion' ? '🧪 Potion digunakan.' : `⚔️ Aksi: ${action === 'skill' ? game.skillName : 'Serangan biasa'}.`}\n\nLanjutkan dengan *.pr arena serang* atau *.pr arena skill*.`);
}
  return undefined;
}
