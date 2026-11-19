// Generated from the original Pixel Realm handler; command logic is preserved.
export function matches(ctx) {
  const { sub, args, game } = ctx;
  return (sub === 'bazar' || sub === 'playermarket' || sub === 'pasar') ||
    (sub === 'pvpranking' || sub === 'pvpboard') ||
    (sub === 'toko' || sub === 'market') ||
    (sub === 'beli') ||
    (sub === 'istirahat') ||
    (sub === 'camp' || sub === 'kemah') ||
    (sub === 'season' || sub === 'musim' || sub === 'seasonboard');
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
if (sub === 'bazar' || sub === 'playermarket' || sub === 'pasar') {
  if (!isGroup) return reply('🏪 Pasar pemain hanya tersedia di grup WhatsApp.');
  const action = (args[1] || 'lihat').toLowerCase();
  if (action === 'jual' || action === 'sell') {
    const raw = args.slice(2).join(' ').split('|');
    if (raw.length < 2) return reply('Format: *.pr bazar jual NAMA_LOOT | HARGA_GOLD*\nContoh: *.pr bazar jual Kristal Langka | 50*');
    const itemName = raw[0].trim().slice(0, 80);
    const price = Number(raw[1].trim());
    if (!itemName || !Number.isInteger(price) || price < 1 || price > 1000000) return reply('Nama item wajib diisi dan harga harus 1–1.000.000 gold.');
    if (game.battle || game.arena) return reply('Selesaikan pertarungan sebelum memasang item di pasar.');
    const loot = Array.isArray(game.inventory?.loot) ? game.inventory.loot : [];
    const idx = loot.findIndex(x => String(x).toLowerCase() === itemName.toLowerCase());
    if (idx < 0) return reply(`Item *${itemName}* tidak ditemukan di koleksi loot kamu. Cek *.pr inventori* atau *.pr codex*.`);
    loot.splice(idx, 1);
    game.inventory.loot = loot;
    await saveGame();
    try {
      const listing = await MarketListing.create({ groupJid: remoteJid, sellerJid: userJid, sellerName: game.name || 'Petualang', itemName, price });
      return reply(`🏪 *ITEM DIPASANG DI PASAR PEMAIN*\n\n📦 Item: *${itemName}*\n🪙 Harga: *${price} gold*\n🆔 Listing: \`${listing._id}\`\n\nItem disimpan dalam escrow pasar hingga dibeli atau kamu membatalkan listing.\nGunakan *.pr bazar* untuk melihat pasar.`);
    } catch (e) {
      game.inventory.loot.push(itemName); await saveGame();
      console.error('[PLAYER MARKET LIST]', e.message);
      return reply('Gagal memasang item. Item dikembalikan ke inventori; coba lagi nanti.');
    }
  }
  if (action === 'beli' || action === 'buy') {
    const id = (args[2] || '').trim();
    if (!/^[a-f\d]{24}$/i.test(id)) return reply('Format: *.pr bazar beli ID_LISTING* (gunakan ID lengkap dari daftar pasar).');
    const listing = await MarketListing.findOne({ _id: id, groupJid: remoteJid, status: 'active' });
    if (!listing) return reply('Listing tidak ditemukan, sudah terjual, atau bukan berasal dari pasar grup ini.');
    if (listing.sellerJid === userJid) return reply('Kamu tidak bisa membeli listing milik sendiri. Gunakan *.pr bazar batal ID_LISTING* untuk menariknya.');
    if (game.gold < listing.price) return reply(`Gold tidak cukup. Harga ${listing.price}; saldo kamu ${game.gold}.`);
    const seller = await User.findOne({ jid: listing.sellerJid });
    if (!seller?.pr?.started) return reply('Data penjual tidak tersedia. Hubungi admin untuk memeriksa listing ini.');
    // Claim the listing atomically so two buyers cannot purchase it simultaneously.
    const claimed = await MarketListing.findOneAndUpdate({ _id: listing._id, status: 'active' }, { $set: { status: 'sold', buyerJid: userJid } }, { new: true });
    if (!claimed) return reply('Listing baru saja dibeli orang lain. Segarkan pasar dengan *.pr bazar*.');
    try {
      game.gold -= listing.price;
      game.inventory = game.inventory || { ether: 0, bombs: 0, loot: [] };
      game.inventory.loot = Array.isArray(game.inventory.loot) ? game.inventory.loot : [];
      game.inventory.loot.push(listing.itemName);
      seller.game.gold = Number(seller.game.gold || 0) + listing.price;
      user.game = game; user.markModified('game'); seller.markModified('game');
      await Promise.all([user.save(), seller.save()]);
      return reply(`✅ *PEMBELIAN BERHASIL*\n\n📦 Item: *${listing.itemName}*\n🪙 Dibayar: ${listing.price} gold\n💰 Sisa saldo: ${game.gold} gold\n👤 Penjual: ${listing.sellerName}\n\nItem sudah masuk ke koleksi loot kamu.`);
    } catch (e) {
      console.error('[PLAYER MARKET BUY]', e.message);
      await MarketListing.updateOne({ _id: listing._id, status: 'sold', buyerJid: userJid }, { $set: { status: 'active', buyerJid: '' } }).catch(() => {});
      return reply('Transaksi gagal disimpan. Listing dikembalikan ke pasar; periksa saldo dan inventori sebelum mencoba lagi.');
    }
  }
  if (action === 'batal' || action === 'cancel') {
    const id = (args[2] || '').trim();
    if (!/^[a-f\d]{24}$/i.test(id)) return reply('Format: *.pr bazar batal ID_LISTING*.');
    const listing = await MarketListing.findOneAndUpdate({ _id: id, groupJid: remoteJid, sellerJid: userJid, status: 'active' }, { $set: { status: 'cancelled' } }, { new: true });
    if (!listing) return reply('Listing aktif milikmu tidak ditemukan.');
    game.inventory = game.inventory || { ether: 0, bombs: 0, loot: [] };
    game.inventory.loot = Array.isArray(game.inventory.loot) ? game.inventory.loot : [];
    game.inventory.loot.push(listing.itemName);
    await saveGame();
    return reply(`↩️ Listing dibatalkan. *${listing.itemName}* dikembalikan ke inventori.`);
  }
  if (action === 'milikku' || action === 'mine') {
    const mine = await MarketListing.find({ groupJid: remoteJid, sellerJid: userJid, status: 'active' }).sort({ createdAt: -1 }).limit(10).lean();
    if (!mine.length) return reply('Kamu belum memiliki listing aktif.');
    return reply(`🧾 *LISTING MILIKMU*\n\n${mine.map(x => `📦 ${x.itemName}\n🪙 ${x.price} gold\n🆔 ${x._id}`).join('\n\n')}\n\nBatal: *.pr bazar batal ID_LISTING*`);
  }
  const listings = await MarketListing.find({ groupJid: remoteJid, status: 'active' }).sort({ createdAt: -1 }).limit(10).lean();
  if (!listings.length) return reply(`🏪 *PASAR PEMAIN PIXEL REALM*\n\nBelum ada item yang dijual di grup ini.\n\nJual loot: *.pr bazar jual NAMA_LOOT | HARGA*\nContoh: *.pr bazar jual Kristal Langka | 50*`);
  return reply(`🏪 *PASAR PEMAIN PIXEL REALM*\n_10 listing terbaru dalam grup ini_\n\n${listings.map((x, i) => `${i + 1}. 📦 *${x.itemName}*\n   👤 ${x.sellerName}\n   🪙 ${x.price} gold\n   🆔 ${x._id}`).join('\n\n')}\n\nBeli: *.pr bazar beli ID_LISTING*\nJual loot: *.pr bazar jual NAMA_LOOT | HARGA*\nListing milikmu: *.pr bazar milikku*`);
}

if (sub === 'pvpranking' || sub === 'pvpboard') {
  const top = await User.find({ 'game.started': true }).sort({ 'game.pvpWins': -1, 'game.pvpLosses': 1, 'game.level': -1 }).limit(10).lean();
  if (!top.length) return reply('Belum ada petualang di ranking PvP.');
  const rows = top.map((entry, i) => { const g = entry.game || {}; return `${['🥇','🥈','🥉'][i] || `${i + 1}.`} *${g.name || 'Petualang'}* — ${g.pvpWins || 0} menang / ${g.pvpLosses || 0} kalah • Lv.${g.level || 1}`; });
  return reply(`🏆 *PIXEL REALM — PVP RANKING*\n\n${rows.join('\n')}\n\nDuel: *.pr pvp @anggota*`);
}

if (sub === 'toko' || sub === 'market') {
  return reply(`${gameTitle('🏪 TOKO PETUALANG', 'PERLENGKAPAN & ITEM')}

` +
    `╭─ *CONSUMABLE*
│ 🧪 potion — 15 gold
│    Pulihkan hingga 35 HP.
│ 🔷 ether — 20 gold
│    Pulihkan 25 HP saat duel.
│ 💣 bom — 30 gold
│    Damage tambahan 20 saat duel.
╰──────────────────

` +
    `╭─ *PERLENGKAPAN*
│ 🗡️ pedang — 80 gold (+4 ATK)
│ 🛡️ armor — 70 gold (kurangi damage 3)
╰──────────────────

` +
    `Beli: *.pr beli <item> [jumlah]*
Contoh: *.pr beli potion 10
Perlengkapan dibeli satu per transaksi.*
🪙 Saldo kamu: *${game.gold} gold*`);
}

if (sub === 'beli') {
  const item = (args[1] || '').toLowerCase();
  const shop = { potion: { price: 15, label: 'Potion' }, ether: { price: 20, label: 'Ether' }, bom: { price: 30, label: 'Bom Pixel' }, pedang: { price: 80, label: 'Pedang Pixel', equipment: true }, armor: { price: 70, label: 'Armor Neon', equipment: true } };
  const product = shop[item];
  if (!product) return reply('Barang tidak ditemukan. Ketik *.pr toko* untuk katalog.');
  const rawQuantity = args[2] === undefined ? 1 : Number(args[2]);
  if (!Number.isInteger(rawQuantity) || rawQuantity < 1 || rawQuantity > 99) return reply('Jumlah pembelian harus bilangan bulat 1–99. Contoh: *.pr beli potion 10*.');
  const quantity = product.equipment ? 1 : rawQuantity;
  if (product.equipment && rawQuantity !== 1) return reply('Perlengkapan hanya bisa dibeli satu kali per transaksi.');
  if (item === 'pedang' && game.equipment.weapon !== 'none') return reply('Kamu sudah memakai Pedang Pixel. Pembelian senjata duplikat belum tersedia; simpan gold untuk item lain.');
  if (item === 'armor' && game.equipment.armor !== 'none') return reply('Kamu sudah memakai Armor Neon. Pembelian armor duplikat belum tersedia; simpan gold untuk item lain.');
  const totalPrice = product.price * quantity;
  const currentGold = Math.max(0, Number(game.gold || 0));
  if (currentGold < totalPrice) return reply(`Gold belum cukup untuk ${quantity}x ${product.label}. Total ${totalPrice} gold; saldo kamu ${currentGold} gold. Tidak ada gold yang dipotong.`);
  // Validasi seluruh transaksi lebih dulu agar pembelian gagal tidak mengurangi saldo.
  game.gold = currentGold - totalPrice;
  if (item === 'potion') game.potions = Number(game.potions || 0) + quantity;
  else if (item === 'ether') game.inventory.ether = Number(game.inventory.ether || 0) + quantity;
  else if (item === 'bom') game.inventory.bombs = Number(game.inventory.bombs || 0) + quantity;
  else if (item === 'pedang') { if (game.equipment.weapon === 'none') game.attack = Number(game.attack || 0) + 4; game.equipment.weapon = 'Pedang Pixel (+4 ATK)'; }
  else if (item === 'armor') game.equipment.armor = 'Armor Neon (-3 damage)';
  await saveGame();
  return reply(`${gameTitle('🛍️ PEMBELIAN BERHASIL!')}

📦 Item: *${product.label}*
🔢 Jumlah: *${quantity}x*
🪙 Harga satuan: ${product.price} gold
💸 Total: -${totalPrice} gold
💰 Saldo: *${game.gold} gold*

${item === 'pedang' ? '⚔️ ATK kamu meningkat +4.' : item === 'armor' ? '🛡️ Armor akan mengurangi damage yang diterima.' : `${quantity} item sudah ditambahkan ke inventori.`}
Ketik *.pr inventori* untuk melihat barangmu.`);
}

if (sub === 'istirahat') {
  if (game.hp >= game.maxHp) return reply(`❤️ HP kamu sudah penuh (${game.hp}/${game.maxHp}).`);
  if (game.gold < 8) return reply(`Gold tidak cukup untuk penginapan. Butuh 8 gold; saldo kamu ${game.gold}. Coba *.pr harian* atau *.pr jelajah*.`);
  const before = game.hp; game.gold -= 8; game.hp = Math.min(game.maxHp, game.hp + 35); game.battle = null;
  await saveGame(); return reply(`🛌 *Istirahat berhasil!*\nHP pulih +${game.hp - before}\n❤️ HP: ${game.hp}/${game.maxHp}\n🪙 Gold tersisa: ${game.gold}`);
}

if (sub === 'camp' || sub === 'kemah') {
  if (game.battle || game.arena) return reply('⚠️ Kamu tidak bisa berkemah saat sedang bertarung. Selesaikan pertarungan dulu.');
  if (game.campDate === today) return reply(`${gameTitle('🏕️ PERKEMAHAN PIXEL')}\n\nKamu sudah beristirahat di perkemahan hari ini.\n❤️ HP: ${game.hp}/${game.maxHp}\n🗓️ Kesempatan berikutnya tersedia setelah reset harian.`);
  if (game.hp >= game.maxHp) return reply(`❤️ HP kamu sudah penuh (${game.hp}/${game.maxHp}). Simpan kesempatan kemah untuk nanti.`);
  const before = game.hp; game.campDate = today; game.hp = Math.min(game.maxHp, game.hp + Math.max(15, Math.floor(game.maxHp * 0.2)));
  await saveGame();
  return reply(`${gameTitle('🏕️ PERKEMAHAN BERHASIL', 'DAILY CAMP • FREE REST')}\n\n🔥 Kamu beristirahat di dekat api unggun.\n❤️ HP pulih: +${game.hp-before}\n📊 HP sekarang: ${game.hp}/${game.maxHp}\n🗓️ Kesempatan kemah berikutnya: besok.\n\n💡 Perkemahan gratis sekali sehari. Untuk pemulihan tambahan gunakan *.pr istirahat*.`);
}

if (sub === 'season' || sub === 'musim' || sub === 'seasonboard') {
  const seasonKey = (() => { const d = new Date(); const month = d.getUTCMonth() + 1; return `${d.getUTCFullYear()}-S${Math.floor((month - 1) / 3) + 1}`; })();
  const seasonGuilds = await Guild.find({ groupJid: remoteJid });
  for (const g of seasonGuilds) { if (g.seasonKey !== seasonKey) { g.seasonKey = seasonKey; g.seasonPoints = 0; await g.save(); } }
  const guilds = await Guild.find({ groupJid: remoteJid }).sort({ seasonPoints: -1, warsWon: -1, level: -1 }).limit(10).lean();
  const players = await User.find({ 'game.started': true }).sort({ 'game.pvpWins': -1, 'game.level': -1 }).limit(5).lean();
  const guildRows = guilds.length ? guilds.map((g, i) => `${['🥇','🥈','🥉'][i] || `${i+1}.`} *${g.name}* — ${g.seasonPoints || 0} poin • ⚔️ ${g.warsWon || 0} menang / ${g.warsLost || 0} kalah • Benteng Lv.${g.fortressLevel || 1}`).join('\n') : 'Belum ada guild di grup ini.';
  const playerRows = players.length ? players.map((u,i) => `${i+1}. *${u.game?.name || 'Petualang'}* — ${u.game?.pvpWins || 0} kemenangan PvP • Lv.${u.game?.level || 1}`).join('\n') : 'Belum ada data petualang.';
  return reply(`🏆 *PIXEL REALM — FRONTIER SEASON*\nMusim aktif: *${seasonKey}*\n\n🏰 *GUILD LADDER*\n${guildRows}\n\n⚔️ *PVP HONOR BOARD*\n${playerRows}\n\nPoin musim diperoleh dari hasil Guild War. Benteng dan kontribusi guild: *.pr guild benteng* / *.pr guild upgradebenteng*.`);
}
  return undefined;
}
