// Generated from the original Pixel Realm handler; command logic is preserved.
export function matches(ctx) {
  const { sub, args, game } = ctx;
  return (sub === 'party' || sub === 'pesta') ||
    (sub === 'world' || sub === 'worldmap' || sub === 'dunia') ||
    (sub === 'transfer' || sub === 'kirim') ||
    (sub === 'worldboss' || sub === 'wboss' || sub === 'bosdunia') ||
    (sub === 'territory' || sub === 'wilayahguild' || sub === 'konkuis') ||
    (sub === 'seasonreward' || sub === 'hadiahmusim') ||
    (sub === 'guild' || sub === 'klan');
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
if (sub === 'party' || sub === 'pesta') {
  if (!isGroup) return reply('🤝 Party hanya bisa digunakan di grup WhatsApp.');
  const action = (args[1] || 'lihat').toLowerCase();
  const makeCode = () => Math.random().toString(36).slice(2, 8).toUpperCase();
  const memberParty = await Party.findOne({ groupJid: remoteJid, 'members.jid': userJid });
  if (action === 'buat' || action === 'create') {
    if (memberParty) return reply(`Kamu sudah berada di party *${memberParty.code}*. Gunakan *.pr party lihat*.`);
    let code = makeCode();
    for (let i = 0; await Party.exists({ code }); i++) {
      if (i > 8) return reply('Gagal membuat kode party. Coba lagi.');
      code = makeCode();
    }
    const party = await Party.create({
      code, groupJid: remoteJid, leaderJid: userJid,
      leaderName: game.name || 'Petualang',
      members: [{ jid: userJid, name: game.name || 'Petualang', level: game.level || 1 }],
      raid: null,
    });
    return reply(`${gameTitle('🤝 PARTY BERHASIL DIBUAT', 'SQUAD LOBBY • MAX 4')}

🔑 Kode party: *${party.code}*
👑 Pemimpin: ${game.name || 'Petualang'}
👥 Anggota: 1/4

Anggota grup dapat bergabung dengan:
*.pr party gabung ${party.code}*

Raid bersama tersedia lewat *.pr party raid mulai* setelah anggota bergabung.`);
  }
  if (action === 'gabung' || action === 'join') {
    if (memberParty) return reply(`Kamu sudah bergabung dengan party *${memberParty.code}*.`);
    const code = String(args[2] || '').toUpperCase().trim();
    if (!code) return reply('Format: *.pr party gabung KODE*');
    const party = await Party.findOne({ code, groupJid: remoteJid });
    if (!party) return reply('❌ Kode party tidak ditemukan di grup ini.');
    if ((party.members || []).length >= 4) return reply('❌ Party sudah penuh (maksimal 4 pemain).');
    party.members.push({ jid: userJid, name: game.name || 'Petualang', level: game.level || 1 });
    await party.save();
    return reply(`${gameTitle('✅ BERGABUNG KE PARTY', 'SQUAD MEMBER ADDED')}

👥 Party: *${party.code}*
${(party.members || []).map((m, i) => `${i === 0 ? '👑' : '⚔️'} ${m.name || 'Petualang'} (Lv.${m.level || 1})`).join('\n')}
Anggota: ${(party.members || []).length}/4`);
  }
  if (action === 'ketua' || action === 'leader' || action === 'transfer') {
    if (!ownGuild) return reply('Kamu belum bergabung dengan guild.');
    if (ownGuild.leaderJid !== userJid) return reply('Hanya ketua guild yang dapat memindahkan kepemimpinan.');
    const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const quoted = getQuotedMessage(msg);
    const targetRaw = mentioned[0] || quoted?.key?.participant;
    if (!targetRaw) return reply('Tag anggota guild atau balas pesannya.\nFormat: *.pr guild ketua @anggota*');
    const targetJid = normalizeJid(targetRaw);
    const targetMember = (ownGuild.members || []).find(m => normalizeJid(m.jid) === targetJid);
    if (!targetMember) return reply('Target harus menjadi anggota guild kamu terlebih dahulu.');
    if (targetJid === userJid) return reply('Kamu sudah menjadi ketua guild.');
    ownGuild.leaderJid = targetJid;
    await ownGuild.save();
    return reply(`👑 Kepemimpinan guild *${ownGuild.name}* sekarang diberikan kepada *${targetMember.name || 'Petualang'}*.`, [targetRaw]);
  }
  if (action === 'keluarkan' || action === 'kick') {
    if (!ownGuild) return reply('Kamu belum bergabung dengan guild.');
    if (ownGuild.leaderJid !== userJid) return reply('Hanya ketua guild yang dapat mengeluarkan anggota.');
    const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const quoted = getQuotedMessage(msg);
    const targetRaw = mentioned[0] || quoted?.key?.participant;
    if (!targetRaw) return reply('Tag anggota guild atau balas pesannya.\nFormat: *.pr guild keluarkan @anggota*');
    const targetJid = normalizeJid(targetRaw);
    if (targetJid === userJid) return reply('Ketua tidak bisa mengeluarkan dirinya sendiri. Gunakan perintah bubar atau pindahkan kepemimpinan.');
    const targetMember = (ownGuild.members || []).find(m => normalizeJid(m.jid) === targetJid);
    if (!targetMember) return reply('Target bukan anggota guild kamu.');
    ownGuild.members = (ownGuild.members || []).filter(m => normalizeJid(m.jid) !== targetJid);
    await ownGuild.save();
    return reply(`🚪 *${targetMember.name || 'Petualang'}* telah dikeluarkan dari guild *${ownGuild.name}*.`, [targetRaw]);
  }
  if (action === 'keluar' || action === 'leave') {
    if (!memberParty) return reply('Kamu belum bergabung dengan party.');
    if (memberParty.leaderJid === userJid) {
      await Party.deleteOne({ _id: memberParty._id });
      return reply('🧹 Party dibubarkan karena pemimpin keluar.');
    }
    memberParty.members = (memberParty.members || []).filter(m => m.jid !== userJid);
    await memberParty.save();
    return reply('🚪 Kamu sudah keluar dari party.');
  }
  if (action === 'bubar' || action === 'disband') {
    if (!memberParty) return reply('Kamu tidak memiliki party untuk dibubarkan.');
    if (memberParty.leaderJid !== userJid) return reply('Hanya pemimpin party yang dapat membubarkannya.');
    await Party.deleteOne({ _id: memberParty._id });
    return reply('🧹 Party berhasil dibubarkan.');
  }
  if (action === 'raid') {
    if (!memberParty) return reply('Buat atau gabung party dahulu: *.pr party buat*.');
    const raidAction = (args[2] || 'status').toLowerCase();
    const boss = { name: 'Colossus Prisma', maxHp: 800, atk: 14 };
    if (raidAction === 'mulai' || raidAction === 'start') {
      if ((memberParty.members || []).length < 2) return reply('⚠️ Raid party membutuhkan minimal 2 pemain.');
      if (memberParty.raid && !memberParty.raid.cleared) return reply('Raid party sedang berjalan. Gunakan *.pr party raid serang*.');
      memberParty.raid = { name: boss.name, hp: boss.maxHp, maxHp: boss.maxHp, atk: boss.atk, cleared: false, claimedJids: [], startedAt: new Date().toISOString() };
      await memberParty.save();
      return reply(`${gameTitle('🐲 PARTY RAID DIMULAI', 'CO-OP BOSS BATTLE')}

${boss.name} muncul dengan ${boss.maxHp} HP!
👥 Party: ${(memberParty.members || []).length}/4
⚔️ Semua anggota dapat menyerang dengan:
*.pr party raid serang*
Cek status: *.pr party raid status*`);
    }
    if (!memberParty.raid) return reply('Belum ada raid aktif. Mulai dengan *.pr party raid mulai*.');
    if (raidAction === 'status' || raidAction === 'info') {
      return reply(`${gameTitle('🐲 PARTY RAID STATUS', memberParty.raid.name || boss.name)}

❤️ ${bar(memberParty.raid.hp, memberParty.raid.maxHp, 14)} ${memberParty.raid.hp}/${memberParty.raid.maxHp}
${memberParty.raid.cleared ? '🏆 Boss dikalahkan! Hadiah siap diklaim.' : '⚔️ Raid masih berlangsung.'}
👥 Anggota: ${(memberParty.members || []).length}/4
Ketik *.pr party raid serang* untuk menyerang.`);
    }
    if (raidAction === 'serang' || raidAction === 'attack') {
      if (memberParty.raid.cleared) return reply('🏆 Boss sudah dikalahkan. Klaim hadiah dengan *.pr party raid klaim*.');
      const damage = Math.max(1, (game.attack || 1) + Math.floor(Math.random() * 10) + petAttack());
      memberParty.raid.hp = Math.max(0, memberParty.raid.hp - damage);
      const remaining = Math.max(0, memberParty.raid.hp);
      if (remaining <= 0) memberParty.raid.cleared = true;
      await memberParty.save();
      return reply(`${gameTitle(remaining <= 0 ? '🏆 RAID CLEAR!' : '⚔️ PARTY RAID', memberParty.raid.name || boss.name)}

💥 Damage kamu: ${damage}
❤️ HP boss tersisa: ${remaining}/${memberParty.raid.maxHp}
${remaining <= 0 ? '🎁 Semua anggota party dapat klaim hadiah.' : 'Anggota party lain dapat melanjutkan serangan.'}`);
    }
    if (raidAction === 'klaim' || raidAction === 'claim') {
      if (!memberParty.raid.cleared) return reply('Boss belum dikalahkan.');
      const claimed = await Party.findOneAndUpdate(
        { _id: memberParty._id, 'raid.cleared': true, 'raid.claimedJids': { $ne: userJid } },
        { $addToSet: { 'raid.claimedJids': userJid } },
        { new: true }
      );
      if (!claimed) return reply('Hadiah raid ini sudah kamu klaim.');
      game.gold = (game.gold || 0) + 80;
      game.materials.kristal = (game.materials.kristal || 0) + 2;
      const levelMessage = addExp(60);
      await saveGame();
      return reply(`${gameTitle('🎁 HADIAH PARTY RAID', 'CO-OP REWARD')}

🪙 +80 gold
✨ +60 EXP
💎 +2 kristal${levelMessage}`);
    }
    return reply('Gunakan: *.pr party raid mulai/serang/status/klaim*');
  }
  if (action === 'lihat' || action === 'info' || action === 'status') {
    const party = memberParty || await Party.findOne({ groupJid: remoteJid });
    if (!party) return reply(`${gameTitle('🤝 PARTY LOBBY', 'CO-OP ADVENTURE')}

Belum ada party di grup ini.
Buat party: *.pr party buat*`);
    return reply(`${gameTitle('🤝 PARTY LOBBY', 'SQUAD • MAX 4')}

🔑 Kode: *${party.code}*
👑 Pemimpin: ${party.leaderName || 'Petualang'}
👥 Anggota: ${(party.members || []).length}/4
${(party.members || []).map((m, i) => `${i === 0 ? '👑' : '⚔️'} ${m.name || 'Petualang'} • Lv.${m.level || 1}`).join('\n')}

Raid: ${party.raid ? `${party.raid.name} (${party.raid.hp}/${party.raid.maxHp} HP)` : 'Belum dimulai'}
Gunakan *.pr party raid mulai* untuk memulai raid (minimal 2 anggota).`);
  }
  return reply('Perintah party: buat, gabung <kode>, lihat, keluar, bubar, raid mulai/serang/status/klaim.');
}

if (sub === 'world' || sub === 'worldmap' || sub === 'dunia') {
  const worldRegions = [
    { key: 'desa', name: 'Desa Pemula', level: 1, reward: 'Bahan dasar', emoji: '🏡' },
    { key: 'hutan', name: 'Hutan Pixel', level: 2, reward: 'Kayu & serat', emoji: '🌲' },
    { key: 'gua', name: 'Gua Neon', level: 4, reward: 'Batu & kristal', emoji: '🪨' },
    { key: 'pantai', name: 'Pantai Sakura', level: 6, reward: 'Loot langka', emoji: '🌸' },
    { key: 'reruntuhan', name: 'Reruntuhan RGB', level: 8, reward: 'Relik kuno', emoji: '🏛️' },
    { key: 'lembah', name: 'Lembah Gradient', level: 10, reward: 'Material epik', emoji: '🏔️' },
  ];
  return reply(`${gameTitle('🌍 WORLD OF PIXEL REALM', 'PETA DUNIA PETUALANG')}` + '\n\n' + worldRegions.map(r => `${r.emoji} *${r.name}* — rekomendasi Lv.${r.level}\n   Hadiah: ${r.reward}`).join('\n\n') + '\n\nJelajahi wilayah lewat *.pr pergi <wilayah>* dan *.pr jelajah*.\nWilayah guild: *.pr territory daftar*.');
}

if (sub === 'transfer' || sub === 'kirim') {
  if (!isGroup) return reply('Transfer pemain hanya tersedia di grup WhatsApp.');
  const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || msg.message?.imageMessage?.contextInfo?.mentionedJid || [];
  const targetJid = mentioned[0] || '';
  const amount = Number(args.find(a => /^\d+$/.test(a)) || 0);
  if (!targetJid || !Number.isSafeInteger(amount) || amount < 1 || amount > 100000) return reply('Format: *.pr transfer @anggota jumlah*\nBatas transfer: 1–100.000 gold. Tag penerima.');
  if (targetJid === userJid) return reply('Kamu tidak bisa mengirim gold ke diri sendiri.');
  const receiver = await User.findOne({ jid: targetJid, 'game.started': true });
  if (!receiver) return reply('Penerima belum membuat karakter Pixel Realm.');
  // Conditional debit prevents spending more than the persisted balance.
  const debited = await User.findOneAndUpdate({ jid: userJid, 'game.started': true, 'game.gold': { $gte: amount } }, { $inc: { 'game.gold': -amount } }, { new: true });
  if (!debited) return reply('Saldo gold tidak cukup atau data karakter belum tersedia.');
  const credited = await User.findOneAndUpdate({ jid: targetJid, 'game.started': true }, { $inc: { 'game.gold': amount } }, { new: true });
  if (!credited) {
    await User.updateOne({ jid: userJid }, { $inc: { 'game.gold': amount } });
    return reply('Transfer gagal; saldo pengirim sudah dikembalikan. Coba lagi.');
  }
  game.gold = Number(debited.game?.gold ?? game.gold - amount);
  user.game = game; user.markModified('game');
  return reply(`💸 *TRANSFER BERHASIL*\n\nPengirim: *${game.name || 'Petualang'}*\nPenerima: *${credited.game?.name || 'Petualang'}*\nJumlah: *${amount.toLocaleString('id-ID')} gold*\nSaldo kamu: *${Number(debited.game?.gold || 0).toLocaleString('id-ID')} gold*`, [targetJid]);
}

if (sub === 'worldboss' || sub === 'wboss' || sub === 'bosdunia') {
  if (!isGroup) return reply('World Boss hanya bisa dimainkan di grup WhatsApp.');
  const action = (args[1] || 'status').toLowerCase();
  let boss = await WorldBoss.findOne({ groupJid: remoteJid });
  if (action === 'mulai' || action === 'start') {
    if (boss && boss.status === 'active' && boss.endsAt && boss.endsAt > new Date() && boss.hp > 0) return reply(`🐉 World Boss *${boss.name}* masih aktif!\nHP: ${boss.hp}/${boss.maxHp}\nSerang: *.pr worldboss serang*`);
    const cycle = Number(boss?.cycle || 0) + 1;
    const maxHp = 1800 + Math.min(1200, Number(game.level || 1) * 30);
    const payload = { name: cycle % 3 === 0 ? 'Raja Glitch' : cycle % 2 === 0 ? 'Naga Astral' : 'Colossus Neon', emoji: cycle % 3 === 0 ? '👾' : cycle % 2 === 0 ? '🐉' : '🗿', hp: maxHp, maxHp, status: 'active', endsAt: new Date(Date.now() + 24 * 60 * 60 * 1000), contributions: [], rewardClaims: [], cycle };
    boss = await WorldBoss.findOneAndUpdate({ groupJid: remoteJid }, { $set: payload, $setOnInsert: { groupJid: remoteJid } }, { upsert: true, new: true, setDefaultsOnInsert: true });
    return reply(`🌌 *WORLD BOSS MUNCUL!*

${boss.emoji} *${boss.name}*\n❤️ HP: ${boss.hp}/${boss.maxHp}\n⏳ Batas waktu: 24 jam\n
Semua pemain yang sudah membuat karakter bisa membantu!\n⚔️ Serang: *.pr worldboss serang*\n📊 Status: *.pr worldboss status*`);
  }
  if (!boss) return reply('Belum ada World Boss di grup ini. Mulai dengan *.pr worldboss mulai*.');
  if (action === 'serang' || action === 'attack') {
    if (boss.status !== 'active' || boss.hp <= 0 || (boss.endsAt && boss.endsAt <= new Date())) return reply('World Boss tidak aktif. Mulai siklus baru dengan *.pr worldboss mulai*.');
    const last = (boss.contributions || []).filter(c => c.jid === userJid).sort((a,b) => new Date(b.at) - new Date(a.at))[0];
    if (last && Date.now() - new Date(last.at).getTime() < 20000) return reply('⏳ Tunggu 20 detik sebelum menyerang World Boss lagi.');
    const damage = Math.max(5, Number(game.attack || 10) + Number(game.skillTree?.power || 0) * 3 + Math.floor(Math.random() * 12));
    const dealt = Math.min(damage, boss.hp);
    boss.hp = Math.max(0, Number(boss.hp) - dealt);
    boss.contributions.push({ jid: userJid, name: game.name || 'Petualang', damage: dealt, at: new Date() });
    if (boss.hp <= 0) boss.status = 'defeated';
    await boss.save();
    return reply(`${boss.hp <= 0 ? '💥 *SERANGAN TERAKHIR!*' : '⚔️ *SERANGAN WORLD BOSS*'}\n\n${boss.emoji} ${boss.name}\nDamage kamu: *${dealt}*\n❤️ HP tersisa: *${boss.hp}/${boss.maxHp}*\n📈 Total kontribusi kamu: *${(boss.contributions || []).filter(c => c.jid === userJid).reduce((n,c) => n + Number(c.damage || 0), 0)}*\n${boss.hp <= 0 ? '🏆 Bos tumbang! Pemain yang berkontribusi bisa klaim hadiah.' : 'Serang lagi setelah cooldown.'}`);
  }
  if (action === 'klaim' || action === 'claim') {
    if (boss.status !== 'defeated' || boss.hp > 0) return reply('World Boss belum dikalahkan.');
    if ((boss.rewardClaims || []).includes(userJid)) return reply('Kamu sudah mengklaim hadiah untuk siklus bos ini.');
    const contribution = (boss.contributions || []).filter(c => c.jid === userJid).reduce((n,c) => n + Number(c.damage || 0), 0);
    if (contribution <= 0) return reply('Kamu belum berkontribusi pada pertarungan ini.');
    // Reserve claim atomically so simultaneous repeated commands cannot pay twice.
    const reserved = await WorldBoss.findOneAndUpdate({ _id: boss._id, status: 'defeated', hp: { $lte: 0 }, rewardClaims: { $ne: userJid } }, { $addToSet: { rewardClaims: userJid } }, { new: true });
    if (!reserved) return reply('Hadiah sudah diklaim atau status bos berubah. Periksa *.pr worldboss status*.');
    const rewardGold = Math.max(10, Math.min(500, Math.floor(contribution / 5)));
    const rewardExp = Math.max(10, Math.floor(contribution / 3));
    game.gold = Number(game.gold || 0) + rewardGold;
    game.inventory = game.inventory || { ether: 0, bombs: 0, loot: [] };
    game.inventory.loot = Array.isArray(game.inventory.loot) ? game.inventory.loot : [];
    game.inventory.loot.push({ name: 'Inti World Boss', rarity: contribution >= 150 ? 'Epic' : contribution >= 60 ? 'Rare' : 'Uncommon', source: boss.name, at: new Date().toISOString() });
    game.achievements = Array.isArray(game.achievements) ? game.achievements : [];
    if (!game.achievements.includes('world_boss_contributor')) game.achievements.push('world_boss_contributor');
    addExp(rewardExp);
    await saveGame();
    return reply(`🎁 *HADIAH WORLD BOSS*\n\nKontribusi: ${contribution} damage\n🪙 Gold: +${rewardGold}\n✨ EXP: +${rewardExp}\n💎 Loot: *Inti World Boss*\n
Hadiah untuk siklus ini sudah diklaim.`);
  }
  if (action === 'ranking' || action === 'top') {
    const totals = new Map(); for (const c of boss.contributions || []) totals.set(c.jid, (totals.get(c.jid) || 0) + Number(c.damage || 0));
    const top = [...totals.entries()].sort((a,b) => b[1]-a[1]).slice(0,10);
    const rows = top.map(([jid,damage],i) => `${i+1}. ${boss.contributions.find(c => c.jid === jid)?.name || 'Petualang'} — ${damage} damage`);
    return reply(`🏆 *WORLD BOSS DAMAGE RANKING*\n\n${rows.length ? rows.join('\n') : 'Belum ada kontribusi.'}`);
  }
  return reply(`🐉 *WORLD BOSS — ${boss.name}*\nStatus: ${boss.status}\n❤️ HP: ${boss.hp}/${boss.maxHp}\n⏳ Batas: ${boss.endsAt ? new Date(boss.endsAt).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }) : '-'}\n
.worldboss mulai tidak perlu diketik dengan titik kedua. Gunakan:\n.pr worldboss mulai\n.pr worldboss serang\n.pr worldboss ranking\n.pr worldboss klaim`);
}

if (sub === 'territory' || sub === 'wilayahguild' || sub === 'konkuis') {
  if (!isGroup) return reply('Territory Conquest hanya bisa digunakan di grup WhatsApp.');
  const action = (args[1] || 'daftar').toLowerCase();
  const definitions = [
    { key: 'hutan', name: 'Hutan Pixel', level: 1, bonus: 'bonus material' },
    { key: 'gua', name: 'Gua Neon', level: 3, bonus: 'bonus gold' },
    { key: 'pantai', name: 'Pantai Sakura', level: 5, bonus: 'bonus loot' },
    { key: 'reruntuhan', name: 'Reruntuhan RGB', level: 7, bonus: 'bonus poin musim' },
    { key: 'lembah', name: 'Lembah Gradient', level: 9, bonus: 'bonus pertahanan' },
  ];
  if (action === 'daftar' || action === 'list' || action === 'map') {
    const records = await Territory.find({ groupJid: remoteJid }).lean();
    const rows = definitions.map(d => { const t = records.find(x => x.territoryKey === d.key); return `${d.key === 'hutan' ? '🌲' : d.key === 'gua' ? '🪨' : d.key === 'pantai' ? '🌸' : d.key === 'reruntuhan' ? '🏛️' : '🏔️'} *${d.name}* (Lv.${d.level})\n   Pemilik: ${t?.ownerGuildName || 'Netral'} • ${d.bonus}`; });
    return reply(`🏰 *TERRITORY CONQUEST*\n\n${rows.join('\n\n')}\n\nKetua guild: *.pr territory kuasai <kode>*\nBonus wilayah dihitung sebagai progres/rekor guild, bukan bonus tempur permanen.`);
  }
  if (action === 'kuasai' || action === 'claim' || action === 'serang') {
    const key = (args[2] || '').toLowerCase();
    const def = definitions.find(d => d.key === key || d.name.toLowerCase() === args.slice(2).join(' ').toLowerCase());
    if (!def) return reply('Pilih wilayah: hutan, gua, pantai, reruntuhan, atau lembah.\nContoh: *.pr territory kuasai hutan*');
    const guild = await Guild.findOne({ groupJid: remoteJid, 'members.jid': userJid });
    if (!guild) return reply('Kamu harus bergabung dengan guild terlebih dahulu.');
    if (guild.leaderJid !== userJid) return reply('Hanya ketua guild yang dapat menguasai wilayah.');
    if (Number(guild.level || 1) < def.level) return reply(`Wilayah ini membutuhkan guild Lv.${def.level}. Guild kamu Lv.${guild.level || 1}.`);
    const existing = await Territory.findOne({ groupJid: remoteJid, territoryKey: def.key });
    if (existing?.ownerGuildId === String(guild._id)) return reply(`Guild kamu sudah menguasai *${def.name}*.`);
    if (existing?.cooldownUntil && existing.cooldownUntil > new Date()) return reply(`Wilayah sedang dalam masa perlindungan sampai ${new Date(existing.cooldownUntil).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}.`);
    const fee = 200 * def.level;
    if (Number(guild.bank || 0) < fee) return reply(`Bank guild membutuhkan ${fee} gold untuk ekspedisi penaklukan. Saldo: ${guild.bank || 0}.`);
    guild.bank = Number(guild.bank || 0) - fee;
    guild.seasonPoints = Number(guild.seasonPoints || 0) + 25 * def.level;
    guild.memberContributions = Array.isArray(guild.memberContributions) ? guild.memberContributions : [];
    guild.memberContributions.push({ jid: userJid, type: 'territory', territory: def.key, at: new Date() });
    await guild.save();
    const t = await Territory.findOneAndUpdate({ groupJid: remoteJid, territoryKey: def.key }, { $set: { name: def.name, level: def.level, ownerGuildId: String(guild._id), ownerGuildName: guild.name, claimedAt: new Date(), cooldownUntil: new Date(Date.now() + 6 * 60 * 60 * 1000) }, $inc: { totalConquests: 1 }, $setOnInsert: { groupJid: remoteJid, territoryKey: def.key } }, { upsert: true, new: true, setDefaultsOnInsert: true });
    return reply(`🏰 *WILAYAH BERHASIL DIKUASAI!*\n\nGuild: *${guild.name}*\nWilayah: *${t.name}*\n🪙 Biaya ekspedisi: ${fee} gold dari bank guild\n🌟 Poin musim: +${25 * def.level}\n🛡️ Perlindungan wilayah: 6 jam\n\nLihat wilayah: *.pr territory daftar*`);
  }
  if (action === 'milikku' || action === 'mine') {
    const guild = await Guild.findOne({ groupJid: remoteJid, 'members.jid': userJid });
    if (!guild) return reply('Kamu belum bergabung dengan guild.');
    const rows = await Territory.find({ groupJid: remoteJid, ownerGuildId: String(guild._id) }).lean();
    return reply(`🏰 *WILAYAH GUILD ${guild.name}*\n\n${rows.length ? rows.map(t => `• ${t.name} — Lv.${t.level}`).join('\n') : 'Guild kamu belum menguasai wilayah.'}`);
  }
  return reply('Perintah territory: daftar, kuasai <hutan|gua|pantai|reruntuhan|lembah>, milikku.');
}

if (sub === 'seasonreward' || sub === 'hadiahmusim') {
  const seasonKey = (() => { const d = new Date(); return `${d.getUTCFullYear()}-S${Math.floor(d.getUTCMonth() / 3) + 1}`; })();
  if (game.seasonRewardClaimed === seasonKey) return reply(`Hadiah musim ${seasonKey} sudah kamu klaim.`);
  const wins = Number(game.wins || 0), level = Number(game.level || 1), bossCount = Number(game.bossDefeated || 0), pvp = Number(game.pvpWins || 0);
  const gold = Math.min(1000, 50 + wins * 3 + level * 10 + bossCount * 25 + pvp * 15);
  const rewardExp = Math.min(250, wins * 2 + bossCount * 10 + pvp * 5);
  // Atomic season marker and reward prevent double claims from repeated concurrent commands.
  const claimed = await User.findOneAndUpdate({ jid: userJid, 'game.started': true, 'game.seasonRewardClaimed': { $ne: seasonKey } }, { $inc: { 'game.gold': gold, 'game.exp': rewardExp }, $set: { 'game.seasonRewardClaimed': seasonKey }, $addToSet: { 'game.achievements': 'season_participant' } }, { new: true });
  if (!claimed) return reply(`Hadiah musim ${seasonKey} sudah diklaim atau data karakter berubah. Periksa *.pr status*.`);
  game.gold = Number(claimed.game?.gold ?? Number(game.gold || 0) + gold);
  game.exp = Number(claimed.game?.exp ?? Number(game.exp || 0) + rewardExp);
  game.seasonRewardClaimed = seasonKey;
  game.achievements = Array.isArray(game.achievements) ? game.achievements : [];
  if (!game.achievements.includes('season_participant')) game.achievements.push('season_participant');
  return reply(`🎖️ *SEASON REWARD — ${seasonKey}*\n\nBerdasarkan progres karakter:\n⚔️ Kemenangan PvE: ${wins}\n🐉 Bos dikalahkan: ${bossCount}\n🏆 Kemenangan PvP: ${pvp}\n🌟 Level: ${level}\n\n🪙 Gold: +${gold}\n✨ EXP: +${rewardExp}\n\nHadiah musim ini sudah diklaim. Poin hadiah dihitung dari progres karakter yang tersimpan.`);
}

if (sub === 'guild' || sub === 'klan') {
  if (!isGroup) return reply('🏰 Guild hanya bisa digunakan di grup WhatsApp.');
  const action = (args[1] || 'lihat').toLowerCase();
  const makeCode = () => Math.random().toString(36).slice(2, 8).toUpperCase();
  const ownGuild = await Guild.findOne({ groupJid: remoteJid, 'members.jid': userJid });
  const activeSeasonKey = (() => { const d = new Date(); const month = d.getUTCMonth() + 1; return `${d.getUTCFullYear()}-S${Math.floor((month - 1) / 3) + 1}`; })();
  if (ownGuild && ownGuild.seasonKey !== activeSeasonKey) { ownGuild.seasonKey = activeSeasonKey; ownGuild.seasonPoints = 0; await ownGuild.save(); }
  if (action === 'ranking' || action === 'leaderboard' || action === 'papan') {
    const topGuilds = await Guild.find({ groupJid: remoteJid }).sort({ seasonPoints: -1, warsWon: -1, level: -1 }).limit(10).lean();
    if (!topGuilds.length) return reply('Belum ada guild yang bisa ditampilkan. Buat guild dengan *.pr guild buat Nama Guild*.');
    return reply(`🏆 *FRONTIER GUILD LADDER*\n\n${topGuilds.map((g,i) => `${['🥇','🥈','🥉'][i] || `${i+1}.`} *${g.name}* [${g.code}]\n   🌟 ${g.seasonPoints || 0} poin musim • ⚔️ ${g.warsWon || 0}W/${g.warsLost || 0}L\n   🏰 Benteng Lv.${g.fortressLevel || 1} • Guild Lv.${g.level || 1}`).join('\n\n')}\n\nLihat seluruh papan: *.pr season*`);
  }
  if (action === 'benteng' || action === 'fortress') {
    if (!ownGuild) return reply('Kamu belum bergabung dengan guild.');
    const lvl = Math.max(1, Number(ownGuild.fortressLevel || 1));
    const nextCost = lvl * 250;
    return reply(`🏰 *BENTENG GUILD — ${ownGuild.name}*\n\n🛡️ Level benteng: *${lvl}/10*\n🏦 Bank guild: *${Number(ownGuild.bank || 0)} gold*\n⚔️ Rekor perang: *${ownGuild.warsWon || 0} menang / ${ownGuild.warsLost || 0} kalah*\n🌟 Poin musim: *${ownGuild.seasonPoints || 0}*\n\nBenteng yang lebih tinggi memberi bonus kontribusi saat Guild War.\nUpgrade berikutnya: *${nextCost} gold dari bank guild*\nPerintah: *.pr guild upgradebenteng*`);
  }
  if (action === 'upgradebenteng' || action === 'fortressup') {
    if (!ownGuild) return reply('Kamu belum bergabung dengan guild.');
    if (ownGuild.leaderJid !== userJid) return reply('Hanya ketua guild yang dapat meng-upgrade benteng.');
    const lvl = Math.max(1, Number(ownGuild.fortressLevel || 1));
    if (lvl >= 10) return reply('Benteng sudah mencapai level maksimum 10.');
    const cost = lvl * 250;
    if (Number(ownGuild.bank || 0) < cost) return reply(`Bank guild belum cukup. Dibutuhkan ${cost} gold, saldo bank ${ownGuild.bank || 0} gold.`);
    ownGuild.bank -= cost; ownGuild.fortressLevel = lvl + 1;
    ownGuild.seasonPoints = Number(ownGuild.seasonPoints || 0) + 10;
    await ownGuild.save();
    return reply(`🏰 *BENTENG BERHASIL DI-UPGRADE!*\n\nGuild: *${ownGuild.name}*\n🛡️ Benteng: Lv.${lvl} → Lv.${ownGuild.fortressLevel}\n🪙 Biaya: ${cost} gold dari bank guild\n🌟 Bonus: +10 poin musim\n\nGunakan *.pr guild benteng* untuk melihat status.`);
  }
  if (action === 'misi' || action === 'mission') {
    if (!ownGuild) return reply('Kamu belum bergabung dengan guild.');
    const dateKey = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' });
    const already = (ownGuild.missionClaims || []).some(x => x && x.jid === userJid && x.date === dateKey);
    if ((args[2] || '').toLowerCase() === 'klaim' || (args[2] || '').toLowerCase() === 'claim') {
      if (already) return reply('Kamu sudah menyelesaikan kontrak guild hari ini. Coba lagi setelah reset harian.');
      if (!game.started || !game.name) return reply('Buat karakter terlebih dahulu dengan *.pr mulai*.');
      if (Number(game.wins || 0) < 3) return reply(`Kontrak guild membutuhkan total 3 kemenangan PvE. Progres kamu: ${Math.min(3, Number(game.wins || 0))}/3 kemenangan. Lanjutkan dengan *.pr jelajah*.`);
      const cost = 50;
      if (Number(game.gold || 0) < cost) return reply(`Kontrak memerlukan biaya operasional ${cost} gold. Saldo kamu: ${game.gold || 0}.`);
      game.gold -= cost; game.exp = Number(game.exp || 0) + 25;
      let levelText = '';
      while (game.exp >= game.level * 25) { game.exp -= game.level * 25; game.level += 1; game.maxHp += 8; game.hp = Math.min(game.maxHp, game.hp + 18); game.attack += 2; game.skillPoints = Number(game.skillPoints || 0) + 1; levelText += `\n🌟 Level naik menjadi ${game.level}!`; }
      ownGuild.bank = Number(ownGuild.bank || 0) + 100;
      ownGuild.seasonPoints = Number(ownGuild.seasonPoints || 0) + 15;
      ownGuild.missionClaims = [...(ownGuild.missionClaims || []).filter(x => !(x && x.jid === userJid && x.date === dateKey)), { jid: userJid, date: dateKey, at: new Date() }].slice(-300);
      ownGuild.memberContributions = [...(ownGuild.memberContributions || []).filter(x => x && x.jid !== userJid), { jid: userJid, name: game.name || 'Petualang', total: Number((ownGuild.memberContributions || []).find(x => x && x.jid === userJid)?.total || 0) + 1 }].slice(-100);
      await Promise.all([ownGuild.save(), saveGame()]);
      return reply(`📜 *KONTRAK GUILD SELESAI!*\n\n🏰 ${ownGuild.name}\n🪙 Biaya operasional: -${cost} gold\n🏦 Bank guild: +100 gold\n🌟 Poin musim guild: +15\n✨ EXP karakter: +25${levelText}\n\nKontrak berikutnya tersedia setelah reset harian.`);
    }
    return reply(`📜 *KONTRAK HARIAN GUILD*\n\nMisi: raih minimal 3 kemenangan PvE sepanjang progres karakter.\nProgres tercatat: ${Math.min(3, Number(game.wins || 0))}/3 kemenangan total.\n\nKlaim memberi 25 EXP karakter, +100 gold ke bank guild, dan +15 poin musim; biaya operasional 50 gold.\nKlaim: *.pr guild misi klaim*\nCatatan: kontrak ini sekali per pemain setiap hari; kemenangan menggunakan statistik PvE karakter yang tersimpan.`);
  }
  if (action === 'perang' || action === 'war') {
    if (!isGroup) return reply('⚔️ Guild War hanya bisa digunakan di grup WhatsApp.');
    const warAction = String(args[2] || 'lihat').toLowerCase();
    const warCode = String(args[3] || '').toUpperCase().trim();
    if (warAction === 'bantuan' || warAction === 'help') return reply(
      '⚔️ *GUILD WAR — 24 JAM*\n\n' +
      '• *.pr guild perang tantang KODE_GUILD* — tantang guild lain\n' +
      '• *.pr guild perang terima KODE_PERANG* — terima tantangan\n' +
      '• *.pr guild perang serang KODE_PERANG* — serang (maks. 3 kali/pemain)\n' +
      '• *.pr guild perang status KODE_PERANG* — lihat skor\n' +
      '• *.pr guild perang klaim KODE_PERANG* — klaim hasil (ketua, setelah selesai)\n' +
      '• *.pr guild perang daftar* — perang terbaru di grup ini');
    if (warAction === 'tantang' || warAction === 'challenge') {
      if (!ownGuild) return reply('Kamu harus bergabung dengan guild terlebih dahulu.');
      if (ownGuild.leaderJid !== userJid) return reply('Hanya ketua guild yang dapat mengirim tantangan.');
      const targetCode = String(args[3] || '').toUpperCase().trim();
      if (!targetCode) return reply('Format: *.pr guild perang tantang KODE_GUILD*');
      const targetGuild = await Guild.findOne({ code: targetCode, groupJid: remoteJid });
      if (!targetGuild) return reply('Guild target tidak ditemukan di grup ini.');
      if (String(targetGuild._id) === String(ownGuild._id)) return reply('Guild tidak bisa menantang dirinya sendiri.');
      const pending = await GuildWar.findOne({ groupJid: remoteJid, status: 'pending', $or: [{ challengerGuildId: ownGuild._id, defenderGuildId: targetGuild._id }, { challengerGuildId: targetGuild._id, defenderGuildId: ownGuild._id }] });
      if (pending) return reply(`Masih ada tantangan yang menunggu keputusan: *${pending.code}*.`);
      const active = await GuildWar.findOne({ groupJid: remoteJid, status: 'active', endsAt: { $gt: new Date() }, $or: [{ challengerGuildId: ownGuild._id }, { defenderGuildId: ownGuild._id }, { challengerGuildId: targetGuild._id }, { defenderGuildId: targetGuild._id }] });
      if (active) return reply('Salah satu guild sedang terlibat dalam perang aktif. Selesaikan dulu sebelum menantang lagi.');
      const code = `GW${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
      const war = await GuildWar.create({ groupJid: remoteJid, code, challengerGuildId: ownGuild._id, challengerName: ownGuild.name, defenderGuildId: targetGuild._id, defenderName: targetGuild.name, status: 'pending' });
      return reply(`⚔️ *TANTANGAN GUILD WAR TERKIRIM!*\n\n🏰 Penantang: *${ownGuild.name}*\n🛡️ Target: *${targetGuild.name}*\n🔑 Kode perang: *${war.code}*\n\nKetua guild target menerima dengan:\n*.pr guild perang terima ${war.code}*`);
    }
    if (warAction === 'terima' || warAction === 'accept') {
      if (!ownGuild) return reply('Kamu harus bergabung dengan guild terlebih dahulu.');
      if (ownGuild.leaderJid !== userJid) return reply('Hanya ketua guild yang dapat menerima tantangan.');
      if (!warCode) return reply('Format: *.pr guild perang terima KODE_PERANG*');
      const war = await GuildWar.findOne({ code: warCode, groupJid: remoteJid, status: 'pending' });
      if (!war) return reply('Tantangan tidak ditemukan atau sudah diproses.');
      if (String(war.defenderGuildId) !== String(ownGuild._id)) return reply('Hanya guild yang ditantang yang dapat menerima perang ini.');
      const active = await GuildWar.findOne({ groupJid: remoteJid, status: 'active', endsAt: { $gt: new Date() }, $or: [{ challengerGuildId: ownGuild._id }, { defenderGuildId: ownGuild._id }] });
      if (active) return reply('Guild kamu masih memiliki perang aktif.');
      war.status = 'active'; war.startsAt = new Date(); war.endsAt = new Date(Date.now() + 24 * 60 * 60 * 1000); await war.save();
      return reply(`🔥 *GUILD WAR DIMULAI!*\n\n⚔️ *${war.challengerName}* vs *${war.defenderName}*\n⏳ Durasi: 24 jam\n🔑 Kode: *${war.code}*\n\nAnggota menyerang dengan *.pr guild perang serang ${war.code}* (maks. 3 serangan per pemain).`);
    }
    if (warAction === 'serang' || warAction === 'attack') {
      if (!ownGuild) return reply('Kamu harus bergabung dengan guild terlebih dahulu.');
      if (!warCode) return reply('Format: *.pr guild perang serang KODE_PERANG*');
      const war = await GuildWar.findOne({ code: warCode, groupJid: remoteJid, status: 'active', endsAt: { $gt: new Date() } });
      if (!war) return reply('Perang tidak aktif atau waktunya sudah habis. Gunakan *.pr guild perang status KODE*.');
      const isChallenger = String(war.challengerGuildId) === String(ownGuild._id);
      const isDefender = String(war.defenderGuildId) === String(ownGuild._id);
      if (!isChallenger && !isDefender) return reply('Guild kamu bukan peserta perang ini.');
      const used = (war.attacks || []).filter(a => a.jid === userJid).length;
      if (used >= 3) return reply('Batas seranganmu sudah habis (3 serangan per perang).');
      const enemyGuild = await Guild.findById(isChallenger ? war.defenderGuildId : war.challengerGuildId);
      const ownFortress = Math.max(1, Number(ownGuild.fortressLevel || 1));
      const enemyFortress = Math.max(1, Number(enemyGuild?.fortressLevel || 1));
      const rawPower = Math.max(1, Number(game.level || 1)) * 2 + Math.max(0, Number(game.attack || 10)) + Math.floor(Math.random() * 11) + (ownFortress - 1) * 2;
      const power = Math.max(1, rawPower - Math.floor((enemyFortress - 1) * 1.5));
      if (isChallenger) war.challengerScore += power; else war.defenderScore += power;
      war.attacks.push({ jid: userJid, guildId: String(ownGuild._id), power, at: new Date() });
      await war.save();
      return reply(`⚔️ *SERANGAN GUILD BERHASIL!*\n\n🏰 Guild: *${ownGuild.name}*\n💥 Kontribusi: *${power} poin*\n🎯 Jatah serangan: ${used + 1}/3\n\n📊 ${war.challengerName}: *${war.challengerScore}* poin\n📊 ${war.defenderName}: *${war.defenderScore}* poin`);
    }
    if (warAction === 'status' || warAction === 'lihat') {
      if (warCode) {
        const war = await GuildWar.findOne({ code: warCode, groupJid: remoteJid });
        if (!war) return reply('Kode perang tidak ditemukan.');
        const remaining = war.endsAt && war.status === 'active' ? Math.max(0, war.endsAt.getTime() - Date.now()) : 0;
        const hours = Math.floor(remaining / 3600000), mins = Math.floor((remaining % 3600000) / 60000);
        return reply(`⚔️ *GUILD WAR ${war.code}*\n\n🏰 ${war.challengerName}: *${war.challengerScore}* poin\n🛡️ ${war.defenderName}: *${war.defenderScore}* poin\n📌 Status: *${war.status.toUpperCase()}*${war.status === 'active' ? `\n⏳ Sisa waktu: ${hours} jam ${mins} menit` : ''}\n👊 Total serangan: ${(war.attacks || []).length}`);
      }
      const wars = await GuildWar.find({ groupJid: remoteJid }).sort({ createdAt: -1 }).limit(8).lean();
      if (!wars.length) return reply('Belum ada perang guild di grup ini. Gunakan *.pr guild perang tantang KODE_GUILD*.');
      return reply('⚔️ *GUILD WAR TERBARU*\n\n' + wars.map(w => `• *${w.code}* — ${w.challengerName} ${w.challengerScore} : ${w.defenderScore} ${w.defenderName}\n  Status: ${w.status}`).join('\n\n') + '\n\nGunakan *.pr guild perang status KODE*.');
    }
    if (warAction === 'klaim' || warAction === 'claim') {
      if (!ownGuild) return reply('Kamu harus bergabung dengan guild terlebih dahulu.');
      if (ownGuild.leaderJid !== userJid) return reply('Hanya ketua guild yang dapat mengklaim hasil perang.');
      if (!warCode) return reply('Format: *.pr guild perang klaim KODE_PERANG*');
      const war = await GuildWar.findOne({ code: warCode, groupJid: remoteJid, status: 'active' });
      if (!war) return reply('Perang tidak ditemukan atau hasilnya sudah diklaim.');
      if (war.endsAt && Date.now() < war.endsAt.getTime()) return reply('Perang masih berlangsung. Hasil hanya bisa diklaim setelah 24 jam.');
      const isChallenger = String(war.challengerGuildId) === String(ownGuild._id);
      const isDefender = String(war.defenderGuildId) === String(ownGuild._id);
      if (!isChallenger && !isDefender) return reply('Guild kamu bukan peserta perang ini.');
      if (war.challengerScore === war.defenderScore) { war.status = 'finished'; await war.save(); return reply(`🤝 Perang berakhir seri!\n${war.challengerName}: ${war.challengerScore} — ${war.defenderName}: ${war.defenderScore}\nTidak ada hadiah pemenang.`); }
      const winnerId = war.challengerScore > war.defenderScore ? String(war.challengerGuildId) : String(war.defenderGuildId);
      const winner = await Guild.findById(winnerId);
      if (!winner) { war.status = 'finished'; await war.save(); return reply('Guild pemenang tidak ditemukan; hasil ditandai selesai tanpa hadiah.'); }
      if (String(winner._id) !== String(ownGuild._id)) return reply('Guild kamu bukan pemenang. Ketua guild pemenang harus mengklaim hadiah.');
      winner.bank = Number(winner.bank || 0) + 500;
      winner.xp = Number(winner.xp || 0) + 100;
      winner.warsWon = Number(winner.warsWon || 0) + 1;
      winner.seasonPoints = Number(winner.seasonPoints || 0) + 100;
      const loserId = String(winner._id) === String(war.challengerGuildId) ? war.defenderGuildId : war.challengerGuildId;
      const loser = await Guild.findById(loserId);
      if (loser) { loser.warsLost = Number(loser.warsLost || 0) + 1; loser.seasonPoints = Number(loser.seasonPoints || 0) + 25; await loser.save(); }
      while (winner.xp >= winner.level * 100) { winner.xp -= winner.level * 100; winner.level += 1; }
      await winner.save(); war.status = 'claimed'; await war.save();
      return reply(`🏆 *GUILD WAR DIMENANGKAN!*\n\n🏰 *${winner.name}* mendapatkan hadiah!\n🪙 Bank guild +500 gold\n✨ Guild EXP +100\n📊 Skor akhir: ${war.challengerName} ${war.challengerScore} — ${war.defenderScore} ${war.defenderName}`);
    }
    return reply('Perintah Guild War: *.pr guild perang bantuan*');
  }
  if (action === 'buat' || action === 'create') {
    if (ownGuild) return reply(`Kamu sudah menjadi anggota guild *${ownGuild.name}*.`);
    const name = args.slice(2).join(' ').trim().slice(0, 24);
    if (name.length < 3) return reply('Format: *.pr guild buat Nama Guild* (3–24 karakter).');
    let code = makeCode();
    for (let i = 0; await Guild.exists({ code }); i++) {
      if (i > 8) return reply('Gagal membuat kode guild. Coba lagi.');
      code = makeCode();
    }
    const guild = await Guild.create({ code, groupJid: remoteJid, name, leaderJid: userJid, members: [{ jid: userJid, name: game.name || 'Petualang', level: game.level || 1 }], bank: 0, level: 1, xp: 0 });
    return reply(`${gameTitle('🏰 GUILD DIBENTUK!', 'GUILD HALL • LEVEL 1')}

🏰 Nama: *${guild.name}*
🔑 Kode undangan: *${guild.code}*
👑 Ketua: ${game.name || 'Petualang'}
👥 Anggota: 1

Anggota grup bisa bergabung:
*.pr guild gabung ${guild.code}*`);
  }
  if (action === 'gabung' || action === 'join') {
    if (ownGuild) return reply(`Kamu sudah menjadi anggota guild *${ownGuild.name}*.`);
    const code = String(args[2] || '').toUpperCase().trim();
    if (!code) return reply('Format: *.pr guild gabung KODE*');
    const guild = await Guild.findOne({ code, groupJid: remoteJid });
    if (!guild) return reply('❌ Kode guild tidak ditemukan di grup ini.');
    if ((guild.members || []).length >= 30) return reply('❌ Guild penuh (maksimal 30 anggota).');
    guild.members.push({ jid: userJid, name: game.name || 'Petualang', level: game.level || 1 });
    await guild.save();
    return reply(`✅ Bergabung ke guild *${guild.name}*!\n👥 Anggota: ${guild.members.length}/30`);
  }
  if (action === 'keluar' || action === 'leave') {
    if (!ownGuild) return reply('Kamu belum bergabung dengan guild.');
    if (ownGuild.leaderJid === userJid && ownGuild.members.length > 1) return reply('Ketua tidak bisa keluar saat anggota masih ada. pindahkan kepemimpinan dengan *.pr guild ketua @anggota* atau bubarkan guild dengan *.pr guild bubar*.');
    if (ownGuild.leaderJid === userJid) await Guild.deleteOne({ _id: ownGuild._id });
    else { ownGuild.members = ownGuild.members.filter(m => m.jid !== userJid); await ownGuild.save(); }
    return reply('🚪 Kamu sudah keluar dari guild.');
  }
  if (action === 'bubar' || action === 'disband') {
    if (!ownGuild) return reply('Kamu belum punya guild.');
    if (ownGuild.leaderJid !== userJid) return reply('Hanya ketua guild yang dapat membubarkan guild.');
    await Guild.deleteOne({ _id: ownGuild._id });
    return reply('🧹 Guild berhasil dibubarkan.');
  }
  if (action === 'kontribusi' || action === 'donate') {
    if (!ownGuild) return reply('Bergabung atau buat guild terlebih dahulu.');
    const amount = Math.floor(Number(args[2]));
    if (!Number.isFinite(amount) || amount < 1 || amount > 100000) return reply('Format: *.pr guild kontribusi <gold>* (1–100000).');
    if ((game.gold || 0) < amount) return reply(`Gold tidak cukup. Saldo kamu: ${game.gold}.`);
    game.gold -= amount;
    ownGuild.bank = (ownGuild.bank || 0) + amount;
    ownGuild.xp = (ownGuild.xp || 0) + Math.floor(amount / 10);
    while (ownGuild.xp >= ownGuild.level * 100) { ownGuild.xp -= ownGuild.level * 100; ownGuild.level += 1; }
    await ownGuild.save(); await saveGame();
    return reply(`${gameTitle('💎 KONTRIBUSI GUILD', 'GUILD BANK')}

🏰 ${ownGuild.name} • Lv.${ownGuild.level}
🪙 Disetor: ${amount} gold
🏦 Saldo bank: ${ownGuild.bank} gold
✨ Guild EXP: ${ownGuild.xp}/${ownGuild.level * 100}
Terima kasih telah mendukung guild!`);
  }
  if (action === 'lihat' || action === 'info' || action === 'status') {
    const guild = ownGuild || await Guild.findOne({ groupJid: remoteJid });
    if (!guild) return reply(`${gameTitle('🏰 GUILD HALL', 'SOCIAL ADVENTURE')}

Belum ada guild di grup ini.
Buat guild: *.pr guild buat Nama Guild*`);
    return reply(`${gameTitle('🏰 GUILD HALL', `LEVEL ${guild.level} • ${guild.name}`)}

🔑 Kode: *${guild.code}*
👑 Ketua: ${(guild.members || []).find(m => m.jid === guild.leaderJid)?.name || 'Petualang'}
👥 Anggota: ${(guild.members || []).length}/30
🏦 Bank guild: ${guild.bank || 0} gold
✨ EXP: ${guild.xp || 0}/${guild.level * 100}
${(guild.members || []).map((m, i) => `${i + 1}. ${m.name || 'Petualang'} • Lv.${m.level || 1}`).join('\n')}`);
  }
  return reply('Perintah guild: buat <nama>, gabung <kode>, lihat, kontribusi <gold>, ketua @anggota, keluarkan @anggota, perang bantuan, keluar, bubar.');
}
  return undefined;
}
