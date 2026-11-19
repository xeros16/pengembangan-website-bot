// Generated from the original Pixel Realm handler; command logic is preserved.
export function matches(ctx) {
  const { sub, args, game } = ctx;
  return (sub === 'menu' || sub === 'visual') ||
    (sub === 'help') ||
    (sub === 'bantuan') ||
    (sub === 'mulai') ||
    (sub === 'nama') ||
    (sub === 'resetnama' || sub === 'gantinama' || sub === 'rename') ||
    (sub === 'kelas') ||
    (sub === 'konfirmasi') ||
    (sub === 'batalsetup') ||
    (sub === 'ranking' || sub === 'leaderboard' || sub === 'papanperingkat');
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
if (sub === 'menu' || sub === 'visual') {
  const menuText =
    `${gameTitle('🌌 PIXEL QUEST FANTASY', 'THE FORGOTTEN KINGDOM • PETUALANGAN DIMULAI')}\n\n` +
    `Kisahmu dimulai di gerbang kerajaan yang terlupakan.\n` +
    `Pilih jalanmu, kumpulkan relik, temukan sekutu, dan hadapi naga yang menjaga rahasia dunia.\n\n` +
    `╭━━ 🧭 *GERBANG PETUALANG* ━━╮\n` +
    `┃ .pr mulai — buat/aktifkan setup\n` +
    `┃ .pr nama <nama> — isi nama karakter\n` +
    `┃ .pr kelas <kelas> — pilih kelas\n` +
    `┃ .pr konfirmasi — simpan karakter\n` +
    `┃ .pr batalsetup — batalkan setup\n` +
    `┃ .pr status / profil — kartu karakter\n` +
    `┃ .pr avatar — pilih hero/heroine\n` +
    `┃ .pr resetnama / gantinama / rename — ubah nama\n` +
    `┃ .pr statistik / stats — statistik lengkap\n` +
    `╰━━━━━━━━━━━━━━━━━━━━╯\n\n` +
    `╭━━ 🗺️ *PETA KERAJAAN & LORE* ━━╮\n` +
    `┃ .pr peta / map / dunia — peta dunia\n` +
    `┃ .pr pergi <wilayah> — pindah wilayah\n` +
    `┃ .pr jelajah — jelajahi dan cari musuh/hadiah\n` +
    `┃ .pr cerita / story — progres cerita utama\n` +
    `┃ .pr ceritaklaim — klaim hadiah cerita\n` +
    `┃ .pr kumpul — kumpulkan bahan crafting\n` +
    `┃ .pr bahan / material — tas bahan\n` +
    `┃ .pr resep / craft — daftar resep\n` +
    `┃ .pr buat <resep> — crafting barang\n` +
    `┃ .pr ramuan <potion/ether/bomb> — alchemy consumables\n` +
    `┃ .pr codex — ringkasan koleksi petualang\n` +
    `┃ .pr monsterdex [wilayah] — ensiklopedia monster\n` +
    `┃ .pr harian — hadiah + login streak\n` +
    `╰━━━━━━━━━━━━━━━━━━━━╯\n\n` +
    `╭━━ ⚔️ *PERTEMPURAN & DUNGEON* ━━╮\n` +
    `┃ .pr serang — serangan biasa + peluang critical\n` +
    `┃ .pr bertahan — kurangi damage serangan musuh\n` +
    `┃ .pr skill — skill kelas saat battle\n` +
    `┃ .pr potion / ether — item pemulih\n` +
    `┃ .pr bom — gunakan bom\n` +
    `┃ .pr kabur — mundur dari battle\n` +
    `┃ .pr dungeon — mulai/lihat dungeon\n` +
    `┃ .pr ruang <kiri/tengah/kanan> — pilih jalur\n` +
    `┃ .pr boss — tantang bos\n` +
    `┃ .pr arena — info Arena\n` +
    `┃ .pr arena <mulai/serang/skill/potion/kabur/klaim>\n` +
    `┃ .pr pvp @anggota — duel pemain (grup/reply)\n` +
    `╰━━━━━━━━━━━━━━━━━━━━╯\n\n` +
    `╭━━ 🐉 *PET, RELIK & TEMPAAN* ━━╮\n` +
    `┃ .pr pet — lihat pet aktif\n` +
    `┃ .pr pet toko — katalog pet\n` +
    `┃ .pr pet adopsi <slime/fox/wolf/dragon>\n` +
    `┃ .pr pet nama <nama> — beri nama pet\n` +
    `┃ .pr pet latih — latih pet\n` +
    `┃ .pr evolusi — evolusi pet\n` +
    `┃ .pr toko / market — toko item\n` +
    `┃ .pr beli <item> — beli item\n` +
    `┃ .pr inventori — tas item\n` +
    `┃ .pr latihan — naikkan ATK permanen\n` +
    `┃ .pr upgrade — upgrade senjata dengan bahan\n` +
    `┃ .pr equipment — lihat gear dan rarity\n` +
    `┃ .pr equip <item> — beli/pakai equipment\n` +
    `┃ .pr skilltree — skill tree & upgrade\n` +
    `┃ .pr loot — lihat loot bag\n` +
    `┃ .pr weeklyquest — quest mingguan\n` +
    `┃ .pr combat — detail mekanik pertarungan\n` +
    `┃ .pr forge <rarity> — tempa gear (common/rare/epic/legendary)\n` +
    `┃ .pr raid — raid bos harian\n` +
    `┃ .pr trial — uji coba 3 kemenangan\n` +
    `┃ .pr trial klaim — klaim hadiah trial\n` +
    `┃ .pr skillinfo — detail skill kelas\n` +
    `┃ .pr gelar — daftar/pasang gelar\n` +
    `┃ .pr koleksi — ensiklopedia progres\n` +
    `┃ .pr memancing — hadiah harian memancing\n` +
    `┃ .pr jual <bahan> <jumlah> — jual bahan\n` +
    `┃ .pr istirahat — pulihkan HP dengan gold\n` +
    `┃ .pr camp / kemah — pulihkan HP gratis 1x/hari\n` +
    `╰━━━━━━━━━━━━━━━━━━━━╯\n\n` +
    `╭━━ 📜 *KONTRAK, RELIK & KEMASYHURAN* ━━╮\n` +
    `┃ .pr quest — lihat misi harian\n` +
    `┃ .pr klaim — klaim misi harian\n` +
    `┃ .pr sidequest / sideklaim — misi sampingan/klaim\n` +
    `┃ .pr event — event dunia\n` +
    `┃ .pr harian — hadiah harian\n` +
    `┃ .pr streak / login — hadiah login beruntun\n` +
    `┃ .pr achievement / prestasi — daftar prestasi\n` +
    `┃ .pr achklaim <id> — klaim prestasi\n` +
    `┃ .pr tantangan — tantangan kemenangan\n` +
    `┃ .pr tantanganklaim — klaim tantangan\n` +
    `┃ .pr bounty / kontrak — kontrak 3 kemenangan\n` +
    `┃ .pr bounty klaim — klaim hadiah kontrak\n` +
    `┃ .pr ranking / leaderboard / papanperingkat\n` +
    `╰━━━━━━━━━━━━━━━━━━━━╯\n\n` +
    `╭━━ 🛡️ *PERSERIKAT & SEKUTU* ━━╮\n` +
    `┃ .pr party — lihat party grup\n` +
    `┃ .pr party buat — buat party (maks. 4)\n` +
    `┃ .pr party gabung <kode> — gabung party\n` +
    `┃ .pr party keluar / bubar — keluar / bubarkan\n` +
    `┃ .pr party raid mulai/serang/status/klaim\n` +
    `┃ .pr guild — lihat guild\n` +
    `┃ .pr guild buat <nama> — buat guild\n` +
    `┃ .pr guild gabung <kode> — gabung guild\n` +
    `┃ .pr guild kontribusi <gold> — setor ke bank\n` +
    `┃ .pr guild keluar — keluar dari guild\n` +
    `╰━━━━━━━━━━━━━━━━━━━━╯\n\n` +
    `╭━━ 🧭 *PANDUAN PENJELAJAH* ━━╮\n` +
    `┃ 1. .pr mulai → nama → kelas → konfirmasi\n` +
    `┃ 2. .pr harian dan .pr streak untuk hadiah\n` +
    `┃ 3. .pr jelajah untuk EXP dan gold\n` +
    `┃ 4. .pr kumpul lalu .pr upgrade untuk ATK\n` +
    `┃ 5. Gunakan .pr status untuk cek progres\n` +
    `╰━━━━━━━━━━━━━━━━━━━━╯\n\n` +
    `✨ Semua progres tersimpan pada database akun.\n` +
    `🖼️ Menu dilengkapi ilustrasi Pixel Quest.\n` +
    `❓ Jika perintah tidak dikenal, cek ejaan atau buka menu ini lagi.`;
  const menuImagePath = path.resolve(process.env.GAME_MENU_IMAGE || 'pixel_realm_menu.png');
  if (fs.existsSync(menuImagePath)) {
    try {
      const menuImage = fs.readFileSync(menuImagePath);
      return await sock.sendMessage(remoteJid, { image: menuImage, caption: menuText.slice(0, 3900) }, { quoted: msg });
    } catch (imageError) {
      console.error('[PIXEL REALM] Gagal mengirim gambar menu; fallback ke teks:', imageError?.message || imageError);
    }
  }
  return reply(`${menuText}\n\n🖼️ Gambar menu tidak ditemukan. Letakkan pixel_realm_menu.png di folder bot atau atur GAME_MENU_IMAGE di .env.`);
}

if (sub === 'help') {
  const helpText = `${gameTitle('📚 PIXEL REALM — PUSAT HELP', 'DAFTAR COMMAND BERDASARKAN KATEGORI')}\n\n` +
    `🧭 *PETUALANGAN & KARAKTER*\n.pr mulai • .pr status • .pr statistik • .pr peta\n.pr pergi <wilayah> • .pr jelajah • .pr cerita\n\n` +
    `⚔️ *PERTARUNGAN*\n.pr serang • .pr skill • .pr potion • .pr ether • .pr bom • .pr kabur\n.pr dungeon • .pr ruang <kiri/tengah/kanan> • .pr arena\n.pr worldboss • .pr raid • .pr ranking\n\n` +
    `🎒 *ITEM, TOKO & EQUIPMENT*\n.pr toko • .pr beli <item> <jumlah> • .pr inventori\n.pr bahan • .pr kumpul • .pr buat <resep> • .pr jual <item> <jumlah>\n.pr equipment • .pr equip <item> • .pr upgrade • .pr forge\n\n` +
    `🐾 *PET, SKILL & PROGRES*\n.pr pet • .pr pet toko • .pr evolusi • .pr skilltree\n.pr quest • .pr harian • .pr streak • .pr achievement\n.pr party • .pr guild • .pr monsterdex • .pr codex\n\n` +
    `💡 Contoh: *.pr beli potion 5* untuk membeli 5 potion sekaligus.\nKetik *.pr bantuan* untuk panduan cara menggunakan fitur.`;
  const helpImagePath = path.resolve(process.env.GAME_HELP_IMAGE || 'pixel_realm_help.png');
  if (fs.existsSync(helpImagePath)) {
    try {
      return await sock.sendMessage(remoteJid, { image: fs.readFileSync(helpImagePath), caption: helpText.slice(0, 3900) }, { quoted: msg });
    } catch (imageError) {
      console.error('[PIXEL REALM] Gagal mengirim gambar help; fallback ke teks:', imageError?.message || imageError);
    }
  }
  return reply(`${helpText}\n\n🖼️ Gambar help tidak ditemukan. Letakkan pixel_realm_help.png di folder bot atau atur GAME_HELP_IMAGE di .env.`);
}

if (sub === 'bantuan') {
  const bantuanText = `${gameTitle('🆘 PIXEL REALM — PANDUAN BANTUAN', 'CARA MEMULAI & MENGATASI MASALAH')}\n\n` +
    `1️⃣ *Mulai bermain*\n.pr mulai → isi nama → pilih kelas → .pr konfirmasi\n\n` +
    `2️⃣ *Cek karakter & progres*\n.pr status • .pr statistik • .pr inventori\n\n` +
    `3️⃣ *Berburu dan bertarung*\n.pr jelajah untuk mencari musuh. Gunakan .pr serang, .pr skill, atau item pemulihan.\nUntuk dungeon/boss, baca syarat dan biaya sebelum memulai.\n\n` +
    `4️⃣ *Toko & item*\nGunakan .pr toko untuk melihat katalog. Contoh pembelian banyak: .pr beli potion 5. Pastikan gold cukup.\n\n` +
    `5️⃣ *Jika command tidak berfungsi*\n• Periksa awalan titik: .pr ...\n• Tulis nama item/wilayah sesuai katalog.\n• Jangan spam command; tunggu respons dan cooldown.\n• Jika masalah berlanjut, simpan pesan error dari terminal untuk diperiksa admin.\n\n` +
    `🔐 Jangan bagikan file .env, kredensial, atau folder autentikasi WhatsApp.`;
  const bantuanImagePath = path.resolve(process.env.GAME_BANTUAN_IMAGE || 'pixel_realm_bantuan.png');
  if (fs.existsSync(bantuanImagePath)) {
    try {
      return await sock.sendMessage(remoteJid, { image: fs.readFileSync(bantuanImagePath), caption: bantuanText.slice(0, 3900) }, { quoted: msg });
    } catch (imageError) {
      console.error('[PIXEL REALM] Gagal mengirim gambar bantuan; fallback ke teks:', imageError?.message || imageError);
    }
  }
  return reply(`${bantuanText}\n\n🖼️ Gambar bantuan tidak ditemukan. Letakkan pixel_realm_bantuan.png di folder bot atau atur GAME_BANTUAN_IMAGE di .env.`);
}

if (sub === 'mulai') {
  if (game.started) return reply(`${gameTitle('✅ KARAKTER SUDAH TERSIMPAN')}\n\nKarakter *${game.name || 'Petualang'}* sudah ada di akunmu. Progres tidak akan direset.\n\nKetik *.pr status* untuk melihat profil atau *.pr jelajah* untuk lanjut bertualang.`);
  if (!game.setupStep) {
    game = { ...initGame(), started: false, name: '', class: '', setupStep: 'name', gold: 20, potions: 2 };
    await saveGame();
  }
  if (game.setupStep === 'name') return reply(`${gameTitle('📝 SETUP 1/3', 'IDENTITAS PETUALANG')}\n\nPilih nama karakter yang akan tampil di kartu profil dan ranking.\n\n📏 Panjang: 2–20 karakter.\n🚫 Hindari nomor telepon atau informasi pribadi.\n\nKetik: *.pr nama NamaKarakter*\nContoh: *.pr nama PixelFox*`);
  if (game.setupStep === 'class') return reply(`${gameTitle('⚔️ SETUP 2/3', 'PILIH KELAS')}\n\nNama karakter: *${game.name}*\n\nPilih gaya bermain:\n⚔️ *.pr kelas pendekar* — HP tinggi, serangan seimbang.\n🔮 *.pr kelas penyihir* — serangan kuat, HP lebih rendah.\n🏹 *.pr kelas penjelajah* — karakter seimbang.`);
  if (game.setupStep === 'confirm') return reply(`${gameTitle('🔎 SETUP 3/3', 'PERIKSA KARAKTER')}\n\nNama: *${game.name}*\nKelas: *${classes[game.class]?.emoji || '🧭'} ${classes[game.class]?.name || 'Penjelajah'}*\n❤️ HP awal: ${game.maxHp}\n⚔️ ATK awal: ${game.attack}\n🪙 Gold awal: ${game.gold}\n🧪 Potion awal: ${game.potions}\n\nJika sudah benar, ketik *.pr konfirmasi*.\nUntuk membatalkan setup, ketik *.pr batalsetup*.`);
  return reply(noGame);
}

if (sub === 'nama') {
  if (game.started) return reply('Karakter sudah dibuat. Nama tidak dapat diganti lewat setup awal.');
  if (!game.setupStep) return reply('Mulai setup terlebih dahulu dengan *.pr mulai*.');
  const name = args.slice(1).join(' ').trim().replace(/[\r\n]/g, ' ');
  if (name.length < 2 || name.length > 20) return reply('Nama harus terdiri dari 2–20 karakter.\nContoh: *.pr nama PixelFox*');
  if (/[@<>]/.test(name)) return reply('Nama tidak boleh mengandung @, <, atau >. Coba nama lain.');
  game.name = name;
  game.setupStep = 'class';
  await saveGame();
  return reply(`${gameTitle('✅ NAMA DISIMPAN', 'SETUP 2/3')}\n\nNama petualang: *${game.name}*\n\nSekarang pilih kelas:\n⚔️ *.pr kelas pendekar*\n🔮 *.pr kelas penyihir*\n🏹 *.pr kelas penjelajah*`);
}

if (sub === 'resetnama' || sub === 'gantinama' || sub === 'rename') {
  if (!game.started) return reply('Kamu belum punya karakter aktif. Ketik *.pr mulai* untuk setup karakter terlebih dahulu.');
  const newName = args.slice(1).join(' ').trim().replace(/[\r\n]/g, ' ');
  if (newName.length < 2 || newName.length > 20) return reply('Nama baru harus terdiri dari 2–20 karakter.\nContoh: *.pr resetnama PixelFox*\nProgres level, item, gold, dan statistik tidak akan direset.');
  if (/[@<>]/.test(newName)) return reply('Nama tidak boleh mengandung @, <, atau >. Coba nama lain.');
  if (newName.toLowerCase() === String(game.name || '').toLowerCase()) return reply(`Nama karakter kamu sudah *${game.name}*. Tidak ada perubahan.`);
  const oldName = game.name;
  game.name = newName;
  await saveGame();
  return reply(`${gameTitle('🪪 NAMA KARAKTER DIPERBARUI')}\n\nNama sebelumnya: *${oldName}*\nNama baru: *${game.name}*\n\n✅ Progres level, EXP, gold, item, kelas, quest, dan statistik tetap aman.\n🏆 Nama baru akan tampil di leaderboard.`);
}

if (sub === 'kelas') {
  if (game.started) return reply('Karakter sudah aktif. Kelas tidak dapat diubah lewat setup awal.');
  if (!game.setupStep || !game.name) return reply('Isi nama karakter dulu. Ketik *.pr mulai*, lalu *.pr nama NamaKarakter*.');
  const chosen = (args[1] || '').toLowerCase();
  const chosenClass = classes[chosen];
  if (!chosenClass) return reply('Kelas tidak ditemukan. Pilih salah satu:\n⚔️ pendekar\n🔮 penyihir\n🏹 penjelajah\n\nContoh: *.pr kelas penyihir*');
  game.class = chosen;
  game.hp = chosenClass.hp; game.maxHp = chosenClass.hp; game.attack = chosenClass.atk;
  game.skillName = chosenClass.skill; game.skillBonus = chosenClass.bonus;
  game.setupStep = 'confirm';
  await saveGame();
  return reply(`${gameTitle('🔎 SETUP 3/3', 'PERIKSA KARAKTER')}\n\n╭─ *KARTU PETUALANG*\n│ 🪪 Nama  : *${game.name}*\n│ ${chosenClass.emoji} Kelas : *${chosenClass.name}*\n│ ❤️ HP    : ${hpPanel(game.hp, game.maxHp)}\n│ ⚔️ ATK   : ${game.attack}\n│ 🧪 Potion: ${game.potions}\n│ 🪙 Gold  : ${game.gold}\n╰──────────────────\n\nKetik *.pr konfirmasi* untuk menyimpan karakter dan mulai.\nKetik *.pr batalsetup* jika ingin membatalkan.`);
}

if (sub === 'konfirmasi') {
  if (game.started) return reply('Karakter kamu sudah aktif. Ketik *.pr status* untuk melihat progres.');
  if (game.setupStep !== 'confirm' || !game.name || !classes[game.class]) return reply('Setup belum lengkap. Ketik *.pr mulai* untuk melanjutkan.');
  game.started = true; game.setupStep = '';
  game.location = 'Desa Pemula'; game.battle = null;
  await saveGame();
  return reply(`${gameTitle('🎉 PETUALANGAN DIMULAI!', 'SELAMAT DATANG DI PIXEL QUEST')}\n\nSelamat datang, *${game.name}*!\nKarakter kamu sudah disimpan khusus untuk akun WhatsApp ini. Anggota lain memiliki karakter dan progres masing-masing.\n\n▶ Ketik *.pr status* untuk melihat profil.\n🗺️ Ketik *.pr jelajah* untuk memulai petualangan.`);
}

if (sub === 'batalsetup') {
  if (game.started) return reply('Karakter sudah aktif; setup awal tidak bisa dibatalkan.');
  for (const key of Object.keys(game)) delete game[key];
  Object.assign(game, { started: false, setupStep: '', name: '' });
  await saveGame();
  return reply('Setup karakter dibatalkan. Jika ingin mencoba lagi, ketik *.pr mulai*.');
}

if (sub === 'ranking' || sub === 'leaderboard' || sub === 'papanperingkat') {
  const top = await User.find({ 'game.started': true }).sort({ 'game.level': -1, 'game.wins': -1, 'game.gold': -1 }).limit(10).lean();
  if (!top.length) return reply('Belum ada petualang di papan peringkat. Selesaikan setup dengan *.pr mulai* untuk masuk leaderboard.');
  const rows = top.map((entry, i) => {
    const g = entry.game || {};
    const medal = ['🥇', '🥈', '🥉'][i] || `${i + 1}.`;
    return `${medal} ${g.name || 'Petualang'} — Lv.${g.level || 1} | 🏆 ${g.wins || 0} menang | 🪙 ${g.gold || 0}`;
  });
  return reply(`╭━━━ 🏆 *LEADERBOARD PETUALANG* ━━━╮\n_10 petualang teratas_\n\n${rows.join('\n')}\n\nUrutan: level → jumlah kemenangan → gold.\nKetik *.pr ranking* atau *.pr leaderboard* kapan saja.`);
}
  return undefined;
}
