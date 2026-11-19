// Generated from the original Pixel Realm handler; command logic is preserved.
export function matches(ctx) {
  const { sub, args, game } = ctx;
  return (sub === 'peta' || sub === 'map' || sub === 'dunia') ||
    (sub === 'pergi' || sub === 'travel' || sub === 'pindah') ||
    (sub === 'cerita' || sub === 'story') ||
    (sub === 'ceritaklaim' || sub === 'storyclaim') ||
    (sub === 'kumpul' || sub === 'gather') ||
    (sub === 'bahan' || sub === 'material') ||
    (sub === 'resep' || sub === 'craft') ||
    (sub === 'buat' || sub === 'craftbuat') ||
    (sub === 'evolusi' || sub === 'evolve') ||
    (sub === 'dungeonpilih' || sub === 'ruang') ||
    (sub === 'avatar' || sub === 'hero' || sub === 'heroine') ||
    (sub === 'peta' || sub === 'map') ||
    (sub === 'pet') ||
    (sub === 'status' || sub === 'profil' || sub === 'profile' || sub === 'kartu') ||
    (sub === 'jelajah') ||
    (sub === 'dungeon') ||
    (sub === 'boss') ||
    (sub === 'achievement' || sub === 'prestasi') ||
    (sub === 'achklaim');
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
if (sub === 'peta' || sub === 'map' || sub === 'dunia') {
  const key = regionKey(); game.region = key;
  const rows = Object.entries(regions).map(([k,r]) => `${k === key ? '📍' : game.level >= r.level ? '🟢' : '🔒'} ${r.emoji} *${r.name}* — Lv.${r.level}+ | tiket ${r.cost} gold${r.neighbors.includes(key) ? ' | terhubung' : ''}`).join('\n');
  return reply(`${gameTitle('🗺️ PETA DUNIA PIXEL QUEST 2.0','WILAYAH TERHUBUNG') }\n\n🏡 Desa Pemula ─ 🌲 Hutan Pixel ─ 🪨 Gua Neon\n                                      │\n🌸 Pantai Sakura ─ 🏛️ Reruntuhan RGB ─ 🏔️ Lembah Gradient\n\n${rows}\n\nPindah ke wilayah tetangga: *.pr pergi hutan*\nWilayah yang terkunci perlu level yang cukup. Tiket perjalanan dibayar sekali tiap pindah.`);
}

if (sub === 'pergi' || sub === 'travel' || sub === 'pindah') {
  if (game.battle) return reply('Selesaikan pertarungan sebelum pindah wilayah.');
  const dest = (args[1] || '').toLowerCase(); const target = regions[dest]; const here = regionKey();
  if (!target) return reply('Wilayah: desa, hutan, gua, pantai, reruntuhan, lembah. Lihat *.pr peta*.');
  if (!regions[here].neighbors.includes(dest)) return reply(`🚧 *Rute belum tersambung.* Dari ${regions[here].name}, kamu hanya bisa menuju: ${regions[here].neighbors.map(k=>regions[k].name).join(', ')}.`);
  if (game.level < target.level) return reply(`🔒 ${target.name} membutuhkan level ${target.level}. Level kamu sekarang ${game.level}.`);
  if (game.gold < target.cost) return reply(`Tiket perjalanan ${target.cost} gold; saldo kamu ${game.gold}.`);
  game.gold -= target.cost; game.region = dest; game.location = target.name; await saveGame();
  return reply(`${gameTitle('🧭 PERJALANAN BERHASIL',target.name.toUpperCase())}\n\nKamu tiba di ${target.emoji} *${target.name}*.\n🪙 Tiket: -${target.cost} gold\n⭐ Level rekomendasi: ${target.level}+\n\nGunakan *.pr jelajah* untuk menghadapi monster khas wilayah ini atau *.pr kumpul* untuk mencari bahan crafting.`);
}

if (sub === 'cerita' || sub === 'story') {
  const chapters = [
    { title:'Sinyal dari Desa', need:0, desc:'Penduduk Desa Pemula melaporkan retakan pixel di Hutan Pixel. Kalahkan 2 musuh untuk membuktikan kemampuanmu.', ok:game.wins>=2, reward:30 },
    { title:'Kristal yang Hilang', need:2, desc:'Energi hutan mengarah ke Gua Neon. Capai level 4 dan kumpulkan 3 kristal.', ok:game.level>=4 && game.materials.kristal>=3, reward:55 },
    { title:'Rahasia Pantai Sakura', need:3, desc:'Temukan jejak penjaga kuno. Menangkan 5 pertarungan dan kunjungi Pantai Sakura.', ok:game.wins>=5 && regionKey()==='pantai', reward:80 },
    { title:'Gerbang RGB', need:4, desc:'Reruntuhan menyimpan kunci menuju Lembah Gradient. Capai level 8 dan miliki 2 inti.', ok:game.level>=8 && game.materials.inti>=2, reward:120 },
    { title:'Raja Glitch', need:5, desc:'Akhiri kekacauan dengan mengalahkan Raja Glitch setidaknya sekali.', ok:game.bossDefeated>=1, reward:200 }
  ];
  const idx=Math.min(chapters.length-1,Math.max(0,game.storyChapter-1)); const c=chapters[idx];
  return reply(`${gameTitle('📖 CERITA UTAMA',`BAB ${idx+1}/${chapters.length} • ${c.title.toUpperCase()}`)}\n\n${c.desc}\n\nStatus: ${c.ok?'✅ Syarat selesai!':'🧩 Belum selesai'}\nHadiah bab: ${c.reward} gold\n${c.ok?`Klaim hadiah: *.pr ceritaklaim*`:'Lanjutkan petualangan untuk menyelesaikan bab.'}\n\nBab berikutnya terbuka setelah hadiah bab ini diklaim.`);
}

if (sub === 'ceritaklaim' || sub === 'storyclaim') {
  const chapters=[{ok:game.wins>=2,reward:30},{ok:game.level>=4&&game.materials.kristal>=3,reward:55},{ok:game.wins>=5&&regionKey()==='pantai',reward:80},{ok:game.level>=8&&game.materials.inti>=2,reward:120},{ok:game.bossDefeated>=1,reward:200}];
  const idx=game.storyChapter-1; const c=chapters[idx];
  if(!c) return reply('🎉 Semua bab cerita utama sudah selesai!');
  if(!c.ok) return reply('Syarat bab belum selesai. Ketik *.pr cerita* untuk melihat objektif.');
  if(game.storyClaimed.includes(idx+1)) return reply('Hadiah bab ini sudah diklaim.');
  game.gold+=c.reward; game.storyClaimed.push(idx+1); game.storyChapter++; await saveGame();
  return reply(`${gameTitle('🎁 BAB CERITA SELESAI')}\n\n🪙 Hadiah: +${c.reward} gold\n📖 Bab berikutnya terbuka! Ketik *.pr cerita* untuk melanjutkan.`);
}

if (sub === 'kumpul' || sub === 'gather') {
  if(game.battle) return reply('Tidak bisa mengumpulkan bahan saat bertarung.');
  const key=regionKey(); const drops={desa:[['kayu',2,4],['serat',1,3]],hutan:[['kayu',2,5],['serat',1,4]],gua:[['batu',2,5],['kristal',1,3]],pantai:[['serat',2,4],['kristal',1,2]],reruntuhan:[['batu',2,5],['inti',1,2]],lembah:[['kristal',2,4],['inti',1,3]]}[key]||[['kayu',1,2]];
  const [mat,min,max]=drops[Math.floor(Math.random()*drops.length)]; const amount=min+Math.floor(Math.random()*(max-min+1)); game.materials[mat]=(game.materials[mat]||0)+amount;
  const exp=3+Math.floor(Math.random()*5); const levelMsg=addExp(exp); await saveGame();
  return reply(`${gameTitle('⛏️ PENGUMPULAN BAHAN',regions[key].name.toUpperCase())}\n\nKamu mengumpulkan *${amount} ${mat}*.\n✨ EXP +${exp}${levelMsg}\n\nTas bahan: 🪵 ${game.materials.kayu} kayu • 🪨 ${game.materials.batu} batu • 💎 ${game.materials.kristal} kristal • 🌿 ${game.materials.serat} serat • 🔮 ${game.materials.inti} inti\n\nResep crafting: *.pr resep*`);
}

if (sub === 'bahan' || sub === 'material') return reply(`${gameTitle('🎒 TAS BAHAN CRAFTING')}\n\n🪵 Kayu: ${game.materials.kayu}\n🪨 Batu: ${game.materials.batu}\n💎 Kristal: ${game.materials.kristal}\n🌿 Serat: ${game.materials.serat}\n🔮 Inti Glitch: ${game.materials.inti}\n\nKumpulkan di tiap wilayah dengan *.pr kumpul*.`);

if (sub === 'resep' || sub === 'craft') {
  const recipes=[['pedang_pixel','Pedang Pixel','kayu 3 + batu 2 + kristal 1','ATK +5', 'weapon'],['zirah_kristal','Zirah Kristal','batu 4 + kristal 3 + serat 2','perlindungan +3 (armor)', 'armor'],['inti_pet','Inti Pet','kristal 3 + inti 1 + serat 2','bahan evolusi pet', 'core']];
  return reply(`${gameTitle('🛠️ BENGKEL CRAFTING','RESEP PERALATAN') }\n\n${recipes.map(r=>`• *${r[1]}* — .pr buat ${r[0]}\n  Bahan: ${r[2]}\n  Efek: ${r[3]}`).join('\n\n')}\n\nBahan milikmu: kayu ${game.materials.kayu}, batu ${game.materials.batu}, kristal ${game.materials.kristal}, serat ${game.materials.serat}, inti ${game.materials.inti}.`);
}

if (sub === 'buat' || sub === 'craftbuat') {
  const item=(args[1]||'').toLowerCase(); const recipes={pedang_pixel:{cost:{kayu:3,batu:2,kristal:1},label:'Pedang Pixel'},zirah_kristal:{cost:{batu:4,kristal:3,serat:2},label:'Zirah Kristal'},inti_pet:{cost:{kristal:3,inti:1,serat:2},label:'Inti Pet'}}; const r=recipes[item];
  if(!r) return reply('Resep tidak dikenal. Ketik *.pr resep*.');
  if(item==='pedang_pixel' && game.crafted.includes(item)) return reply('Pedang Pixel sudah pernah dibuat. ATK tidak akan ditambahkan berulang kali.');
  if(item==='zirah_kristal' && game.crafted.includes(item)) return reply('Zirah Kristal sudah pernah dibuat. Armor tidak bisa ditumpuk.');
  const missing=Object.entries(r.cost).filter(([k,v])=>(game.materials[k]||0)<v);
  if(missing.length) return reply(`Bahan belum cukup untuk ${r.label}: ${missing.map(([k,v])=>`${k} kurang ${v-(game.materials[k]||0)}`).join(', ')}.`);
  for(const [k,v] of Object.entries(r.cost)) game.materials[k]-=v;
  if(item==='pedang_pixel'){game.attack+=5;game.equipment.weapon='Pedang Pixel';}
  if(item==='zirah_kristal'){game.equipment.armor='Zirah Kristal';}
  if(item==='inti_pet') game.inventory.petCore=(game.inventory.petCore||0)+1;
  game.crafted.push(item); await saveGame(); return reply(`${gameTitle('✨ CRAFTING BERHASIL',r.label.toUpperCase())}\n\nItem berhasil dibuat dan bahan sudah digunakan.\n${item==='pedang_pixel'?'⚔️ ATK +5.':item==='zirah_kristal'?'🛡️ Armor Kristal aktif.':'🔮 Inti Pet masuk inventori.'}\nKetik *.pr bahan* untuk mengecek sisa bahan.`);
}

if (sub === 'evolusi' || sub === 'evolve') {
  if(!game.pet.species || !petCatalog[game.pet.species]) return reply('Kamu belum punya pet. Adopsi lewat *.pr pet toko*.');
  if(game.pet.level<5) return reply(`Pet perlu level 5 untuk berevolusi. Level sekarang ${game.pet.level}. Latih dengan *.pr pet latih* atau menangkan pertarungan.`);
  if((game.inventory.petCore||0)<1) return reply('Evolusi membutuhkan 1 Inti Pet. Kumpulkan bahan lalu ketik *.pr buat inti_pet*.');
  if(game.pet.evolved) return reply('Pet kamu sudah berevolusi dan berada di bentuk akhir saat ini.');
  game.inventory.petCore--; game.pet.evolved=true; game.pet.level+=1; game.pet.exp=0; game.pet.bonusSkill=true; await saveGame();
  return reply(`${gameTitle('🌟 EVOLUSI PET BERHASIL','BENTUK BARU TERBUKA!')}\n\n${petLabel()}\n✨ Pet berevolusi!\n⚔️ Damage dasar pet meningkat melalui bonus evolusi +8.\n💫 Skill spesial aktif: serangan pet mendapat bonus tambahan.\n\nPet sekarang membantu lebih kuat dalam setiap duel.`);
}

if (sub === 'dungeonpilih' || sub === 'ruang') {
  const choice=(args[1]||'').toLowerCase(); if(!['kiri','tengah','kanan'].includes(choice)) return reply(`${gameTitle('🏰 PERSIMPANGAN DUNGEON')}\n\nPilih jalur: *.pr ruang kiri*, *.pr ruang tengah*, atau *.pr ruang kanan*.\n🛡️ Kiri: jalur aman, hadiah kecil.\n💎 Tengah: peti bahan, ada risiko jebakan.\n👹 Kanan: peluang hadiah besar dan musuh kuat.`);
  if(game.battle) return reply('Selesaikan duel sebelum memilih jalur dungeon.');
  const roll=Math.random(); let msg='';
  if(choice==='kiri'){const heal=Math.min(20,game.maxHp-game.hp);game.hp+=heal;game.gold+=5;msg=`Jalur aman! ❤️ HP +${heal}, 🪙 gold +5.`;}
  else if(choice==='tengah'){if(roll<0.65){game.materials.kristal+=2;game.materials.batu+=2;msg='Peti bahan ditemukan! 💎 Kristal +2, 🪨 batu +2.';}else{const d=Math.min(game.hp-1,12);game.hp-=d;msg=`Jebakan aktif! ❤️ HP -${d}, tetapi kamu tetap selamat.`;}}
  else {if(roll<0.6){game.gold+=30;game.materials.inti+=1;msg='Kamu menemukan ruang harta! 🪙 Gold +30, 🔮 inti +1.';}else{const b={name:'Penjaga Ruang Rahasia',emoji:'👹',hp:65+game.level*4,maxHp:65+game.level*4,atk:12+game.level,gold:45,exp:35,mode:'dungeon',isBoss:true,turn:1,skillReadyTurn:1};game.battle=b;msg=`Bos menjaga jalur kanan! ${b.emoji} *${b.name}* muncul dengan HP ${b.hp}. Gunakan *.pr serang* atau *.pr skill*.`;}}
  await saveGame(); return reply(`${gameTitle('🧭 PILIHAN DUNGEON',choice.toUpperCase())}\n\n${msg}`);
}

if (sub === 'avatar' || sub === 'hero' || sub === 'heroine') {
  const choice = (args[1] || '').toLowerCase();
  if (['hero', 'pria', 'male'].includes(choice)) game.heroStyle = 'hero';
  else if (['heroine', 'wanita', 'perempuan', 'female'].includes(choice)) game.heroStyle = 'heroine';
  else return reply(`${gameTitle('🧑‍🎤 PILIH AVATAR HERO') }\n\n*1. HERO* ⚔️\n       .-^- .\n      /  ⚔  \\n     |  o o  |\n      \\  ^  /\n       /|_|\\\n        / \\n\n*2. HEROINE* ✨\n      /\\_/\\\n     ( o.o )  ✦\n      > ^ <\n     /|   |\\\n      /   \\n\nPilih tampilan kartu petualang:\n• *.pr avatar hero*\n• *.pr avatar heroine*\n\nIni hanya mengubah ilustrasi teks, bukan kelas atau statistik karakter.`);
  await saveGame();
  return reply(`${gameTitle('✨ AVATAR DIPERBARUI')}\n\n${heroArt()}\n\nAvatar sekarang: *${game.heroStyle === 'heroine' ? 'Heroine' : 'Hero'}*\nStatistik dan progres tetap sama.`);
}

if (sub === 'peta' || sub === 'map') {
  return reply(`${gameTitle('🗺️ PETA DUNIA PIXEL', game.location.toUpperCase())}\n\n        🏔️ *Gunung Kristal*\n              │\n🌲 Hutan Pixel ─ 🏰 Desa Pemula ─ 🌸 Pantai Sakura\n      │             │              │\n🕳️ Gua Neon ─── 🌀 Gerbang Dungeon ─ 🏛️ Reruntuhan RGB\n              │\n        🌋 Sarang Raja Glitch\n\n📍 Lokasi saat ini: *${game.location}*\n🧭 Untuk berpindah dan menemukan kejadian: *.pr jelajah*\n🏰 Untuk turun ke dungeon: *.pr dungeon*\n👑 Untuk melawan Raja Glitch: *.pr boss*`);
}

if (sub === 'pet') {
  const action = (args[1] || '').toLowerCase();
  if (!action || action === 'profil' || action === 'status') {
    if (!game.pet.species || !petCatalog[game.pet.species]) return reply(`${gameTitle('🐾 PENDAMPING PET', 'KOMPANION PETUALANG') }\n\n     /\_/\\\n    ( o.o )  *?*\n     > ^ <\n\nKamu belum punya pet. Pet akan menemani perjalanan dan membantu menyerang musuh setiap giliran.\n\nKetik *.pr pet toko* untuk melihat pet.\nContoh adopsi: *.pr pet adopsi fox*`);
    const pet = petCatalog[game.pet.species];
    return reply(`${gameTitle('🐾 KARTU PET', 'PENDAMPING SETIA')}\n\n       ${pet.emoji}\n   *${game.pet.name || pet.name}*\n   Level ${game.pet.level}\n\n╭─ STATUS PET\n│ ⚔️ Bantuan serang: *${petAttack()} damage*\n│ ✨ EXP pet: ${game.pet.exp}/${game.pet.level * 20}\n│ 💞 Ikatan: Pendamping aktif\n╰──────────────────\n\n*.pr pet toko* — katalog pet\n*.pr pet nama <nama>* — ganti nama pet\n*.pr pet latih* — latih pet (10 gold)`);
  }
  if (action === 'toko' || action === 'shop') return reply(`${gameTitle('🏪 TOKO PET', 'PILIH PENDAMPING') }\n\n╭─ 🟢 *SLIME MINI*\n│ ID: *slime* • Harga: 45 gold\n│ Serangan bantuan: 3 + level\n╰──────────────────\n\n╭─ 🦊 *RUBAH SENJA*\n│ ID: *fox* • Harga: 60 gold\n│ Lincah dan seimbang\n╰──────────────────\n\n╭─ 🐺 *SERIGALA BULAN*\n│ ID: *wolf* • Harga: 85 gold\n│ Serangan bantuan kuat\n╰──────────────────\n\n╭─ 🐉 *NAGA MINI*\n│ ID: *dragon* • Harga: 160 gold\n│ Pet paling kuat\n╰──────────────────\n\nAdopsi: *.pr pet adopsi fox*\n🪙 Gold kamu: *${game.gold}*\nCatatan: hanya satu pet aktif; adopsi lain saat sudah punya pet belum didukung.`);
  if (action === 'adopsi' || action === 'adopt') {
    const species = (args[2] || '').toLowerCase(); const pet = petCatalog[species];
    if (!pet) return reply('Jenis pet tidak dikenal. Pilih: slime, fox, wolf, atau dragon. Ketik *.pr pet toko*.');
    if (game.pet.species && petCatalog[game.pet.species]) return reply(`Kamu sudah memiliki ${petCatalog[game.pet.species].emoji} *${game.pet.name || petCatalog[game.pet.species].name}*. Sistem pergantian/adopsi pet tambahan belum tersedia, jadi pet lama tetap aman.`);
    if (game.gold < pet.price) return reply(`Gold belum cukup. ${pet.name} butuh ${pet.price} gold; saldo kamu ${game.gold}.`);
    game.gold -= pet.price; game.pet = { species, name: pet.name, level: 1, exp: 0 };
    await saveGame(); return reply(`${gameTitle('🎉 PET BERHASIL DIADOPSI!')}\n\n        ${pet.emoji}\n  *${pet.name}* bergabung!\n\n⚔️ Bantuan serang: *${pet.atk} damage* per giliran\n🪙 Biaya adopsi: -${pet.price} gold\n💰 Sisa gold: ${game.gold}\n\nRawat dan latih pet dengan *.pr pet latih*.`);
  }
  if (action === 'nama') {
    if (!game.pet.species || !petCatalog[game.pet.species]) return reply('Kamu belum punya pet. Ketik *.pr pet toko* terlebih dahulu.');
    const name = args.slice(2).join(' ').trim().replace(/[\r\n]/g, ' ');
    if (name.length < 2 || name.length > 16 || /[@<>]/.test(name)) return reply('Nama pet harus 2–16 karakter dan tidak boleh mengandung @, <, atau >. Contoh: *.pr pet nama Mochi*');
    const old = game.pet.name; game.pet.name = name; await saveGame(); return reply(`🏷️ Nama pet diubah: *${old}* → *${name}*\nLevel dan statistik pet tetap aman.`);
  }
  if (action === 'latih' || action === 'train') {
    if (!game.pet.species || !petCatalog[game.pet.species]) return reply('Kamu belum punya pet. Ketik *.pr pet toko* untuk mengadopsi.');
    if (game.gold < 10) return reply('Latihan membutuhkan 10 gold. Kumpulkan gold lewat *.pr jelajah*.');
    game.gold -= 10; game.pet.exp += 10; let levelText = '';
    while (game.pet.exp >= game.pet.level * 20) { game.pet.exp -= game.pet.level * 20; game.pet.level += 1; levelText += `\n🌟 Pet naik ke level ${game.pet.level}! Damage bantuan meningkat.`; }
    await saveGame(); return reply(`${gameTitle('🐾 LATIHAN PET SELESAI')}\n\n${petCatalog[game.pet.species].emoji} *${game.pet.name}*\n✨ EXP pet +10\n⚔️ Bantuan serang sekarang: ${petAttack()} damage\n🪙 Biaya latihan: 10 gold${levelText}`);
  }
  return reply('Menu pet: *.pr pet*, *.pr pet toko*, *.pr pet adopsi <slime/fox/wolf/dragon>*, *.pr pet nama <nama>*, *.pr pet latih*.');
}

if (sub === 'status' || sub === 'profil' || sub === 'profile' || sub === 'kartu') {
  const battle = game.battle;
  return reply(`${gameTitle('🧙 KARTU PETUALANG', 'PIXEL QUEST • CHARACTER PROFILE')}\n\n` +
    `${heroArt()}\n╭─ *${classes[game.class]?.emoji || '🧭'} ${classes[game.class]?.name || game.class || 'Penjelajah'} • ${game.heroStyle === 'heroine' ? 'HEROINE' : 'HERO'}*\n` +
    `│ 🪪 Nama  : *${game.name || 'Petualang'}*\n` +
    `│ ⭐ Level : *${game.level}*\n` +
    `│ ✨ EXP   : ${bar(game.exp, game.level * 25, 10)} ${game.exp}/${game.level * 25}\n` +
    `│ ❤️ HP    : ${hpPanel(game.hp, game.maxHp)}\n` +
    `│ ⚔️ ATK   : ${game.attack || 11}\n` +
    `│ 🪙 Gold  : ${game.gold}\n` +
    `│ 🏅 Gelar : ${game.title || 'Petualang Baru'}\n` +
    `│ 🧪 Potion: ${game.potions}\n` +
    `│ 🔷 Ether/Bom: ${game.inventory.ether}/${game.inventory.bombs}\n` +
    `│ 🗡️ Senjata: ${game.equipment.weapon}\n│ 🛡️ Armor: ${game.equipment.armor}\n│ 🐾 Pet: ${petLabel()}\n` +
    `╰──────────────────\n` +
    `🏆 Menang ${game.wins}  •  💫 Kalah ${game.losses}\n🏰 Dungeon: lantai ${game.dungeonFloor} • clear ${game.dungeonClears}\n📍 ${game.location}\n` +
    (battle ? `\n╭─ 🚨 *SEDANG BERTARUNG*\n│ ${battle.emoji || '👾'} ${battle.name}\n│ ❤️ Musuh: ${hpPanel(battle.hp, battle.maxHp)}\n╰──────────────────\nPilih: *.pr serang* / *.pr skill* / *.pr potion* / *.pr bom*` : `\n🟢 *Kondisi:* Aman, siap bertualang.`));
}

if (sub === 'jelajah') {
  if (game.hp <= 0) return reply(`💤 HP kamu habis. Gunakan *.pr istirahat* jika punya gold, atau mulai ulang dengan *.pr mulai penjelajah*.`);
  if (game.battle) return reply(`⚔️ Kamu masih bertarung melawan *${game.battle.name}*. Pilih *.pr serang*, *.pr skill*, *.pr potion*, atau *.pr bom*, *.pr potion*, *.pr kabur*.`);
  game.location = locations[Math.floor(Math.random() * locations.length)];
  game.exploreCount += 1; game.eventExplores += 1;
  game.questProgress = Math.min(3, Number(game.questProgress || 0) + 1);
  if (game.sideQuestId === 'explore' && !game.sideQuestClaimed) game.sideQuestProgress += 1;
  const roll = Math.random();
  if (roll < 0.12) {
    const eventRoll = Math.random();
    if (eventRoll < 0.34) {
      const gold = 20 + Math.floor(Math.random() * 16); game.gold += gold;
      const exp = 8 + Math.floor(Math.random() * 8); const levelMessage = addExp(exp);
      await saveGame();
      return reply(`${gameTitle('🌠 EVENT: HUJAN BINTANG', game.location.toUpperCase())}\n\nLangit Pixel menyala! Fragmen bintang jatuh di dekatmu.\n\n🪙 Gold: *+${gold}*\n✨ EXP: *+${exp}*${levelMessage}\n🎁 Event bonus ditemukan saat eksplorasi!`);
    }
    if (eventRoll < 0.67) {
      game.potions += 1; game.inventory.ether += 1;
      await saveGame();
      return reply(`${gameTitle('🎪 EVENT: KARNAVAL PIXEL', game.location.toUpperCase())}\n\nKamu ikut permainan lempar cincin dan menang hadiah!\n\n🧪 Potion *+1*\n🔷 Ether *+1*\n🎉 Barang hadiah masuk inventori.`);
    }
    const damage = Math.min(Math.max(0, game.hp - 1), 8 + Math.floor(Math.random() * 8));
    game.hp = Math.max(1, game.hp - damage); await saveGame();
    return reply(`${gameTitle('🌀 EVENT: ANOMALI GLITCH', game.location.toUpperCase())}\n\nRuang di sekitarmu terdistorsi. Kamu berhasil keluar, tetapi terkena energi glitch.\n\n❤️ HP: -${damage}\n${hpPanel(game.hp, game.maxHp)}\n\nPetualangan selalu punya kejutan!`);
  }
  if (roll < 0.27) {
    const gold = 8 + Math.floor(Math.random() * 13);
    game.gold += gold;
    if (game.sideQuestId === 'chest' && !game.sideQuestClaimed) game.sideQuestProgress += 1;
    const exp = 4 + Math.floor(Math.random() * 5);
    const levelMessage = addExp(exp);
    await saveGame();
    return reply(`${gameTitle('🧰 PETI HARTA DITEMUKAN!', game.location.toUpperCase())}\n\n` +
      `      ╭────────╮\n      │  💎 💰  │\n      ╰────────╯\n` +
      `Kamu menemukan peti tersembunyi di balik reruntuhan!\n\n` +
      `╭─ *HADIAH*\n│ 🪙 Gold : *+${gold}*\n│ ✨ EXP  : *+${exp}*\n╰──────────────────${levelMessage}\n\n` +
      `🧭 Misi jelajah: ${Math.min(game.exploreCount, 3)}/3\n▶ Ketik *.pr jelajah* untuk lanjut.`);
  }
  if (roll < 0.43) {
    game.hp = Math.min(game.maxHp, game.hp + 12);
    await saveGame();
    return reply(`${gameTitle('🌸 MATA AIR AJAIB', game.location.toUpperCase())}\n\n` +
      `       ♨️  💧  ♨️\n` +
      `Kamu beristirahat di mata air dan merasa lebih kuat.\n\n` +
      `❤️ HP pulih: *+12*\n${hpPanel(game.hp, game.maxHp)}\n\n` +
      `🧭 Misi jelajah: ${Math.min(game.exploreCount, 3)}/3`);
  }
  if (roll < 0.58) {
    const gold = 5 + Math.floor(Math.random() * 8); game.gold += gold;
    await saveGame();
    return reply(`${gameTitle('🧑‍🎨 PEDAGANG KELILING', game.location.toUpperCase())}\n\n` +
      `Pedagang membutuhkan bantuan membawa kotak aset. Kamu membantunya dan mendapat upah!\n\n` +
      `╭─ *TRANSAKSI BERHASIL*\n│ 🪙 Gold diterima: *+${gold}*\n╰──────────────────\n\n` +
      `🧭 Misi jelajah: ${Math.min(game.exploreCount, 3)}/3`);
  }
  const regionMap = { desa: [{ name: 'Slime Glitch', emoji: '🟢', hp: 24, atk: 5, gold: 12, exp: 9 }, { name: 'Tikus Pixel', emoji: '🐭', hp: 28, atk: 6, gold: 14, exp: 11 }], hutan: [{ name: 'Serigala Lumut', emoji: '🐺', hp: 38, atk: 8, gold: 20, exp: 17 }, { name: 'Goblin Render', emoji: '👺', hp: 42, atk: 9, gold: 22, exp: 19 }], gua: [{ name: 'Kelelawar Neon', emoji: '🦇', hp: 52, atk: 11, gold: 27, exp: 24 }, { name: 'Penjaga Kristal', emoji: '💎', hp: 62, atk: 12, gold: 31, exp: 28 }], pantai: [{ name: 'Kepiting Sakura', emoji: '🦀', hp: 68, atk: 13, gold: 34, exp: 30 }, { name: 'Ubur Neon', emoji: '🪼', hp: 72, atk: 14, gold: 37, exp: 32 }], reruntuhan: [{ name: 'Ksatria Glitch', emoji: '🤖', hp: 86, atk: 16, gold: 44, exp: 39 }, { name: 'Golem RGB', emoji: '🗿', hp: 96, atk: 17, gold: 48, exp: 43 }], lembah: [{ name: 'Naga Neon', emoji: '🐉', hp: 112, atk: 19, gold: 58, exp: 52 }, { name: 'Raja Bayangan', emoji: '👑', hp: 125, atk: 21, gold: 65, exp: 58 }] };
  const rKey = Object.keys(regionMap).find(k => ({desa:'Desa Pemula',hutan:'Hutan Pixel',gua:'Gua Neon',pantai:'Pantai Sakura',reruntuhan:'Reruntuhan RGB',lembah:'Lembah Gradient'})[k] === game.location) || 'desa';
  const pool = regionMap[rKey].filter(m => m.hp <= 30 + game.level * 15);
  const template = pool[Math.floor(Math.random() * pool.length)] || regionMap[rKey][0];
  const scale = 1 + Math.max(0, game.level - 1) * 0.12;
  game.battle = { name: template.name, emoji: template.emoji, hp: Math.round(template.hp * scale), maxHp: Math.round(template.hp * scale), atk: Math.round(template.atk * scale), gold: template.gold + game.level * 2, exp: template.exp + game.level * 2, turn: 1, skillReadyTurn: 1 };
  await saveGame();
  return reply(`${gameTitle('🚨 MUSUH MUNCUL!', game.location.toUpperCase())}\n\n` +
    `╭─────── ⚔️ DUEL DIMULAI ───────╮\n        ${heroArt()}\n        VS\n        ${template.emoji}\n   *${game.battle.name}*\n╰──────────────────────────────╯\n` +
    `╭─ STATUS MUSUH\n│ ❤️ HP  ${hpPanel(game.battle.hp, game.battle.maxHp)}\n│ ⚔️ ATK ${game.battle.atk}\n╰──────────────────\n\n` +
    `Kamu berhadapan dengan musuh! Pilih aksi:\n` +
    `⚔️ *.pr serang*  │ serangan biasa\n✨ *.pr skill*   │ jurus spesial\n🛡️ *.pr bertahan* │ kurangi damage musuh\n🧪 *.pr potion*  │ pulihkan HP\n🔷 *.pr ether*   │ pulihkan 25 HP\n💣 *.pr bom*     │ damage 20\n🏃 *.pr kabur*   │ mundur dari duel`);
}

if (sub === 'dungeon') {
  if (game.battle) return reply(`Kamu masih bertarung melawan *${game.battle.name}*. Selesaikan duel dulu.`);
  if (game.hp <= 0) return reply('HP kamu habis. Pulihkan diri dengan *.pr istirahat* terlebih dahulu.');
  const entryFee = 10;
  if (game.gold < entryFee) return reply(`Untuk masuk dungeon butuh ${entryFee} gold. Saldo kamu ${game.gold}.`);
  game.gold -= entryFee;
  const floor = game.dungeonFloor;
  const isBoss = floor % 5 === 0;
  const dungeonPool = [
    { name: 'Penjaga Batu', emoji: '🗿', hp: 35, atk: 8, gold: 20, exp: 18 },
    { name: 'Serigala Bayangan', emoji: '🐺', hp: 42, atk: 10, gold: 24, exp: 21 },
    { name: 'Ksatria Glitch', emoji: '🤖', hp: 50, atk: 11, gold: 28, exp: 25 },
    { name: 'Naga Neon', emoji: '🐉', hp: 68, atk: 13, gold: 38, exp: 32 },
  ];
  const base = isBoss
    ? { name: `BOS DUNGEON LANTAI ${floor}`, emoji: '👹', hp: 85, atk: 15, gold: 75, exp: 65 }
    : dungeonPool[Math.floor(Math.random() * dungeonPool.length)];
  const scale = 1 + (floor - 1) * 0.18 + Math.max(0, game.level - 1) * 0.06;
  game.battle = { name: base.name, emoji: base.emoji, hp: Math.round(base.hp * scale), maxHp: Math.round(base.hp * scale), atk: Math.round(base.atk * scale), gold: base.gold + floor * 3, exp: base.exp + floor * 2, mode: 'dungeon', floor, isBoss, turn: 1, skillReadyTurn: 1 };
  await saveGame();
  return reply(`${gameTitle(isBoss ? '👹 BOS DUNGEON!' : '🏰 DUNGEON DIMASUKI', `LANTAI ${floor} • RUANG BAWAH TANAH`)}\n\nKamu membayar tiket masuk ${entryFee} gold dan memasuki lorong berbahaya.\n\n${base.emoji} *${game.battle.name}*${isBoss ? '\n⚠️ Bos muncul setiap lantai kelipatan 5!' : ''}\n❤️ HP musuh: ${hpPanel(game.battle.hp, game.battle.maxHp)}\n⚔️ ATK musuh: ${game.battle.atk}\n\nPilih aksi: *.pr serang*, *.pr skill*, *.pr potion*, *.pr ether*, *.pr bom*, atau *.pr kabur*.`);
}

if (sub === 'boss') {
  if (game.battle) return reply('Selesaikan pertarungan yang sedang berlangsung terlebih dahulu.');
  if (game.hp <= 0) return reply('HP kamu habis. Pulihkan diri dengan *.pr istirahat* terlebih dahulu.');
  const fee = 25;
  if (game.gold < fee) return reply(`Tantangan bos membutuhkan ${fee} gold. Saldo kamu ${game.gold}.`);
  game.gold -= fee;
  const scale = 1 + Math.max(0, game.level - 1) * 0.22;
  game.battle = { name: 'Raja Glitch', emoji: '👑', hp: Math.round(110 * scale), maxHp: Math.round(110 * scale), atk: Math.round(16 * scale), gold: 100 + game.level * 8, exp: 85 + game.level * 6, mode: 'boss', isBoss: true, turn: 1, skillReadyTurn: 1 };
  await saveGame();
  return reply(`${gameTitle('👑 TANTANGAN RAJA GLITCH', 'BOSS BATTLE') }\n\nTiket tantangan: -${fee} gold.\n\n👑 *Raja Glitch*\n❤️ HP: ${hpPanel(game.battle.hp, game.battle.maxHp)}\n⚔️ ATK: ${game.battle.atk}\n\nHadiah besar menanti jika menang. Gunakan item dengan bijak!\n⚔️ *.pr serang* • ✨ *.pr skill* • 🧪 *.pr potion* • 🔷 *.pr ether* • 💣 *.pr bom* • 🏃 *.pr kabur*`);
}

if (sub === 'achievement' || sub === 'prestasi') {
  const checks = [
    { id: 'first_win', label: '⚔️ Kemenangan Pertama', desc: 'Menangkan 1 pertarungan.', ok: game.wins >= 1, reward: 15 },
    { id: 'explorer', label: '🧭 Penjelajah', desc: 'Jelajahi 10 kali.', ok: game.eventExplores >= 10, reward: 25 },
    { id: 'veteran', label: '🏆 Veteran', desc: 'Menangkan 10 pertarungan.', ok: game.wins >= 10, reward: 50 },
    { id: 'level5', label: '🌟 Petualang Berpengalaman', desc: 'Capai level 5.', ok: game.level >= 5, reward: 40 },
    { id: 'dungeon5', label: '🏰 Penakluk Dungeon', desc: 'Selesaikan 5 pertarungan dungeon.', ok: game.dungeonClears >= 5, reward: 60 },
    { id: 'boss', label: '👑 Pemburu Bos', desc: 'Kalahkan 1 bos.', ok: game.bossDefeated >= 1, reward: 75 },
  ];
  const lines = checks.map(a => `${game.achievements.includes(a.id) ? '✅' : a.ok ? '🎁' : '🔒'} *${a.label}*\n   ${a.desc}\n   Hadiah: ${a.reward} gold${a.ok && !game.achievements.includes(a.id) ? ' — ketik *.pr achklaim ' + a.id + '*' : ''}`).join('\n\n');
  return reply(`${gameTitle('🏅 PRESTASI PETUALANG', 'ACHIEVEMENTS') }\n\n${lines}\n\nHadiah prestasi hanya bisa diklaim sekali.`);
}

if (sub === 'achklaim') {
  const checks = {
    first_win: { label: 'Kemenangan Pertama', ok: game.wins >= 1, reward: 15 },
    explorer: { label: 'Penjelajah', ok: game.eventExplores >= 10, reward: 25 },
    veteran: { label: 'Veteran', ok: game.wins >= 10, reward: 50 },
    level5: { label: 'Petualang Berpengalaman', ok: game.level >= 5, reward: 40 },
    dungeon5: { label: 'Penakluk Dungeon', ok: game.dungeonClears >= 5, reward: 60 },
    boss: { label: 'Pemburu Bos', ok: game.bossDefeated >= 1, reward: 75 },
  };
  const id = (args[1] || '').toLowerCase(); const ach = checks[id];
  if (!ach) return reply('ID prestasi tidak valid. Ketik *.pr achievement* untuk daftar dan ID klaim.');
  if (!ach.ok) return reply('Prestasi belum tercapai. Selesaikan syaratnya dahulu.');
  if (game.achievements.includes(id)) return reply('Hadiah prestasi ini sudah pernah diklaim.');
  game.achievements.push(id); game.gold += ach.reward; await saveGame();
  return reply(`🏅 *PRESTASI TERBUKA!*\n${ach.label}\n🪙 Hadiah: +${ach.reward} gold\n💰 Saldo: ${game.gold} gold`);
}
  return undefined;
}
