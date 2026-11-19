import { createGamePersistence, getGameDateContext } from '../services/persistence.js';
import { createGameCombatHelpers } from '../services/combat-helpers.js';
import * as setupModule from './modules/setup.js';
import * as worldModule from './modules/world.js';
import * as combatModule from './modules/combat.js';
import * as questsModule from './modules/quests.js';
import * as economyModule from './modules/economy.js';
import * as pvpModule from './modules/pvp.js';
import * as progressionModule from './modules/progression.js';
import * as socialModule from './modules/social.js';

export async function handleGameCommand(context) {
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
    normalizeGameState
  } = context;
  {
if (!await requireDatabase(sock, remoteJid)) return;
const user = await User.findOneAndUpdate({ jid: userJid }, { $setOnInsert: { jid: userJid } }, { upsert: true, new: true, setDefaultsOnInsert: true });
const sub = (args[0] || 'menu').toLowerCase();
const { today, currentWeek } = getGameDateContext();
const locations = GAME_LOCATIONS;
const monsters = GAME_MONSTERS;
const classes = GAME_CLASSES;
const initGame = createInitialGameState;
let game = normalizeGameState(user.game || { started: false }, currentWeek);
const { petCatalog, heroArt, petLabel, petAttack, bossPhase, battleIntent, enemyRetaliation } = createGameCombatHelpers(game);
game.exploreCount = Number(game.exploreCount ?? 0); game.wins = Number(game.wins ?? 0); game.losses = Number(game.losses ?? 0);
game.questProgress = Math.max(0, Number(game.questProgress || 0)); game.questProgressDate = game.questProgressDate || '';
if (game.questProgressDate !== today) { game.questProgressDate = today; game.questProgress = 0; }
const saveGame = createGamePersistence({ User, userJid, getGame: () => game, user });
if (game.bountyDate !== today) { game.bountyDate = today; game.bountyWins = 0; game.bountyExplores = 0; }
const addExp = (amount) => {
  game.exp += amount;
  let messages = '';
  while (game.exp >= game.level * 25) {
    game.exp -= game.level * 25; game.level += 1; game.maxHp += 8; game.skillPoints = Number(game.skillPoints || 0) + 1; game.maxHp += Number(game.skillTree?.vitality || 0) > 0 ? 1 : 0;
    game.hp = Math.min(game.maxHp, game.hp + 18);
    game.attack = Number(game.attack ?? 11) + 2 + Math.min(2, Number(game.skillTree?.power || 0));
    messages += `\n🌟 *LEVEL UP!* Kamu sekarang level ${game.level}. ATK +2, HP maksimum +8.`;
  }
  return messages;
};
const bar = (value, max, size = 10) => {
  const filled = Math.max(0, Math.min(size, Math.round((value / Math.max(1, max)) * size)));
  return '▰'.repeat(filled) + '▱'.repeat(size - filled);
};
// Komponen visual fantasi untuk UI game WhatsApp (ASCII/emoji, tanpa gambar eksternal).
const gameTitle = (title, subtitle = 'PIXEL REALM BY @PIR.VISUALS') =>
  `╔══════════════════════╗\n` +
  `║ 🌙  PIXEL REALM  ✨   ║\n` +
  `╚══════════════════════╝\n` +
  `       🏔️  🏰  🏔️\n` +
  `    🌲🌲  🛤️  🌲🌲\n` +
  `       🧙‍♂️ ⚔️ 🐉\n\n` +
  `╭━━ ✦ ${title} ✦ ━━╮\n` +
  `_${subtitle}_`;
const statLine = (emoji, label, value) => `${emoji} ${label.padEnd(7, ' ')} ${value}`;
const hpPanel = (value, max, size = 12) => `${bar(value, max, size)}  ${value}/${max}`;
const noGame = `${gameTitle('🧭 BUAT PETUALANG', 'SETUP KARAKTER BARU')}\n\nBelum ada karakter yang aktif di akunmu.\n\n⛔ Kamu wajib menyelesaikan setup karakter sebelum memakai fitur gameplay.\n\nKita siapkan karakter pribadi yang progresnya tersimpan untuk nomor WhatsApp kamu.\n\n▶ Ketik *.pr mulai* untuk memulai setup.\n\n📝 Kamu akan mengisi nama karakter, memilih kelas, lalu mengonfirmasi sebelum petualangan dimulai.`;
const regions = {
  desa: { name: 'Desa Pemula', emoji: '🏡', level: 1, cost: 0, neighbors: ['hutan'], monsters: [{name:'Slime Glitch',emoji:'🟢',hp:24,atk:5,gold:12,exp:9},{name:'Tikus Pixel',emoji:'🐭',hp:28,atk:6,gold:14,exp:11}] },
  hutan: { name: 'Hutan Pixel', emoji: '🌲', level: 2, cost: 10, neighbors: ['desa','gua'], monsters: [{name:'Serigala Lumut',emoji:'🐺',hp:38,atk:8,gold:20,exp:17},{name:'Goblin Render',emoji:'👺',hp:42,atk:9,gold:22,exp:19}] },
  gua: { name: 'Gua Neon', emoji: '🪨', level: 4, cost: 18, neighbors: ['hutan','pantai'], monsters: [{name:'Kelelawar Neon',emoji:'🦇',hp:52,atk:11,gold:27,exp:24},{name:'Penjaga Kristal',emoji:'💎',hp:62,atk:12,gold:31,exp:28}] },
  pantai: { name: 'Pantai Sakura', emoji: '🌸', level: 6, cost: 25, neighbors: ['gua','reruntuhan'], monsters: [{name:'Kepiting Sakura',emoji:'🦀',hp:68,atk:13,gold:34,exp:30},{name:'Ubur Neon',emoji:'🪼',hp:72,atk:14,gold:37,exp:32}] },
  reruntuhan: { name: 'Reruntuhan RGB', emoji: '🏛️', level: 8, cost: 35, neighbors: ['pantai','lembah'], monsters: [{name:'Ksatria Glitch',emoji:'🤖',hp:86,atk:16,gold:44,exp:39},{name:'Golem RGB',emoji:'🗿',hp:96,atk:17,gold:48,exp:43}] },
  lembah: { name: 'Lembah Gradient', emoji: '🏔️', level: 10, cost: 45, neighbors: ['reruntuhan'], monsters: [{name:'Naga Neon',emoji:'🐉',hp:112,atk:19,gold:58,exp:52},{name:'Raja Bayangan',emoji:'👑',hp:125,atk:21,gold:65,exp:58}] }
};
const regionKey = () => Object.keys(regions).find(k => regions[k].name === game.location) || game.region || 'desa';



  const runtime = {
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
  };
  if (setupModule.matches(runtime)) return setupModule.handle(runtime);
  if (!game.started && game.setupStep) {
    if (game.setupStep === 'name') return reply('Setup sedang menunggu nama. Ketik *.pr nama NamaKarakter*.');
    if (game.setupStep === 'class') return reply('Setup sedang menunggu pilihan kelas. Ketik *.pr kelas pendekar*, *.pr kelas penyihir*, atau *.pr kelas penjelajah*.');
    if (game.setupStep === 'confirm') return reply('Periksa karakter lalu ketik *.pr konfirmasi* untuk memulai.');
  }
  if (!game.started) return reply(noGame);
  // PIXEL QUEST 2.0: dunia terhubung, cerita, bahan crafting, dan evolusi pet.

  const gameModules = [worldModule, combatModule, questsModule, economyModule, pvpModule, progressionModule, socialModule];
  for (const module of gameModules) {
    if (module.matches(runtime)) return module.handle(runtime);
  }

  return reply(`❓ Perintah game *${sub}* belum dikenal atau belum tersedia.\n\nKetik *.pr menu* untuk melihat seluruh perintah yang tercatat, atau *.pr bantuan* untuk panduan.`);
  }
}
