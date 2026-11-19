import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  jidNormalizedUser,
  fetchLatestBaileysVersion,
  downloadMediaMessage,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import qrcode from 'qrcode-terminal';
import fs from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import http from 'node:http';
import sharp from 'sharp';
import webpmux from 'node-webpmux';
import mongoose from 'mongoose';
import 'dotenv/config';
import { DEFAULT_GROUP_RULES } from './config/default-group-rules.js';
import {
  PartySchema, GuildSchema, AssetSchema, UserSchema, GroupSchema, FavoriteSchema,
  AssetAccessSchema, ReportSchema, TicketSchema, ModerationLogSchema, WarningSchema,
  GuildWarSchema, MarketListingSchema, WorldBossSchema, TerritorySchema, LearningSubmissionSchema,
  Party, Guild, GuildWar, MarketListing, WorldBoss, Territory, Asset, User, Group,
  Favorite, AssetAccess, Report, Ticket, Warning, ModerationLog, AccessList, LearningSubmission, DesignBriefSession,
  CommunityProfile, CommunityCollaboration, DesignBattle, DesignSeason, DesignSeasonSubmission, CreativeAsset, LearningCohort, LearningCohortCheckin,
} from './models/index.js';
import { handleGameCommand } from './games/pixel-realm/commands/game-handler.js';
import { createCommandHandler } from './features/command-handler.js';
import { createGroupModeration } from './features/group-moderation.js';
import { shouldSendGroupGreeting, buildGroupGreeting } from './features/group-greetings.js';
import { addStickerPackMetadata } from './features/sticker-metadata.js';
import { processedMessageIds, senderQueues, MESSAGE_DEDUPE_TTL_MS, MESSAGE_DEDUPE_MAX, rememberMessageId, serializeBySender } from './features/message-queue.js';
import { createWhatsAppUtils } from './features/whatsapp-utils.js';
import { GAME_LOCATIONS } from './games/pixel-realm/data/locations.js';
import { GAME_MONSTERS } from './games/pixel-realm/data/monsters.js';
import { GAME_CLASSES } from './games/pixel-realm/data/classes.js';
import { createInitialGameState } from './games/pixel-realm/services/initial-game-state.js';
import { normalizeGameState } from './games/pixel-realm/services/normalize-game.js';
import { isChatAllowed, isInboundChatAllowed, isDestinationAllowed, registerLinkedDesignerDestination, guardSocketOutbound, addAllowedContact, configureAccessListPersistence, restoreAccessListFromDatabase } from './features/access-control.js';
import { restoreMultiplayerPersistence } from './games/multiplayer/persistence.js';
import { DesignerProfile, DesignerNotification } from './models/design-marketplace.js';
import { createDesignerNotificationWorker } from './features/design-marketplace/notification-worker.js';

// Pixel Realm v20.7.0 — Owner access control + separate menu/help artwork + save hardening.
// Cross-document transactions still require MongoDB replica set/sharded cluster; do not claim full atomicity on standalone MongoDB.
const PREFIX = process.env.PREFIX || '.'; // Prefix dapat diatur melalui .env
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/bot_desain';
const AUTH_DIR = process.env.AUTH_DIR || 'auth_info_baileys';
const TEMP_DIR = path.resolve(process.env.TEMP_DIR || 'temp');
const WELCOME_IMAGE = path.resolve(process.env.WELCOME_IMAGE || 'welcome.jpg');
const BACKUP_DIR = path.resolve(process.env.BACKUP_DIR || 'backups');
const BACKUP_INTERVAL_HOURS = Math.max(1, Number(process.env.BACKUP_INTERVAL_HOURS || 24));
const backupRetentionSetting = Number(process.env.BACKUP_RETENTION_DAYS || 14);
const BACKUP_RETENTION_DAYS = Number.isFinite(backupRetentionSetting)
  ? Math.max(1, Math.min(3650, Math.trunc(backupRetentionSetting)))
  : 14;
const BACKUP_INCLUDE_LOCAL_STATE = String(process.env.BACKUP_INCLUDE_LOCAL_STATE || 'false').toLowerCase() === 'true';
const healthPort = Number(process.env.BOT_HEALTH_PORT || 3091);
const healthHost = process.env.BOT_HEALTH_HOST || '127.0.0.1';
const execFileAsync = promisify(execFile);
const MAX_IMAGE_BYTES = 12 * 1024 * 1024;
// Pemilik bot ditentukan hanya melalui .env, bukan status admin grup.
const OWNER_JIDS_RAW = process.env.OWNER_JIDS || ''; 
if (!OWNER_JIDS_RAW.trim()) console.warn('[OWNER] OWNER_JIDS kosong. Perintah Owner akan ditolak sampai .env dikonfigurasi dan bot direstart.');
else console.log(`[OWNER] OWNER_JIDS terbaca: ${OWNER_JIDS_RAW.split(',').filter(v => v.trim()).length} entri (nilai disembunyikan).`);
const {
  normalizeJid, ownerJidSet, ownerIdentityCandidates, isBotOwner, isGroupJid,
  unwrapMessage, getMessageText, getQuotedMessage, getImageTarget, downloadMedia,
} = createWhatsAppUtils({ jidNormalizedUser, OWNER_JIDS_RAW, downloadMediaMessage, MAX_IMAGE_BYTES });


fs.mkdirSync(TEMP_DIR, { recursive: true });

let dbReady = false;
let reconnecting = false;
let whatsappConnectionState = 'connecting';
let healthServer = null;
let backupInProgress = false;
let activeDesignerNotificationWorker = null;

function startBotHealthServer() {
  const localOnly = ['127.0.0.1', '::1', 'localhost'].includes(healthHost);
  if (!localOnly) {
    console.error('[HEALTH] BOT_HEALTH_HOST harus loopback. Health endpoint tidak dibuka ke jaringan publik.');
    return false;
  }
  if (!Number.isInteger(healthPort) || healthPort < 1 || healthPort > 65535) {
    console.error('[HEALTH] BOT_HEALTH_PORT tidak valid. Health endpoint tidak dijalankan.');
    return false;
  }
  if (healthServer) return true;
  healthServer = http.createServer((req, res) => {
    let pathname = '/';
    try { pathname = new URL(req.url || '/', 'http://localhost').pathname; }
    catch {
      res.writeHead(400, { 'cache-control': 'no-store' });
      return res.end();
    }
    if (!['GET', 'HEAD'].includes(req.method || '')) {
      res.writeHead(405, { 'allow': 'GET, HEAD', 'cache-control': 'no-store' });
      return res.end();
    }
    if (!['/health', '/ready'].includes(pathname)) {
      res.writeHead(404, { 'cache-control': 'no-store' });
      return res.end();
    }
    const ready = dbReady && whatsappConnectionState === 'open';
    const statusCode = pathname === '/ready' && !ready ? 503 : 200;
    const payload = {
      status: ready ? 'ready' : 'not_ready',
      ready,
      whatsapp: whatsappConnectionState,
      database: dbReady ? 'connected' : 'disconnected',
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    };
    res.writeHead(statusCode, {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store, max-age=0',
      'x-content-type-options': 'nosniff',
    });
    return res.end(req.method === 'HEAD' ? undefined : JSON.stringify(payload));
  });
  healthServer.on('error', error => console.error('[HEALTH SERVER]', error.message));
  healthServer.listen(healthPort, healthHost, () => {
    console.log(`[HEALTH] Local readiness endpoint aktif di http://${healthHost}:${healthPort}/ready`);
  });
  healthServer.unref?.();
  return true;
}


// Pixel Realm RPG v20.1.0 — Stability & Integration Update: serialized incoming processing, duplicate message guard, and MongoDB recovery retry.
// Multiplayer persistence for Pixel Quest v14.



async function isGroupAdmin(sock, groupJid, senderJid) {
  try {
    const metadata = await sock.groupMetadata(groupJid);
    const sender = normalizeJid(senderJid);
    const participant = metadata.participants.find(p => normalizeJid(p.id) === sender);
    return Boolean(participant?.admin === 'admin' || participant?.admin === 'superadmin');
  } catch (error) {
    console.error('[ADMIN CHECK]', error.message);
    return false;
  }
}

async function isBotAdmin(sock, groupJid) {
  try {
    const metadata = await sock.groupMetadata(groupJid);

    // WhatsApp/Baileys may identify the bot with a phone JID (@s.whatsapp.net)
    // or a LID (@lid). Compare all identifiers available on the socket and participant.
    const botIds = new Set(
      [sock.user?.id, sock.user?.lid, sock.user?.jid]
        .filter(Boolean)
        .map(id => normalizeJid(id))
    );

    const bot = metadata.participants.find(participant => {
      const participantIds = [participant.id, participant.phoneNumber, participant.lid]
        .filter(Boolean)
        .map(id => normalizeJid(id));
      return participantIds.some(id => botIds.has(id));
    });

    if (!bot) {
      console.warn('[BOT ADMIN CHECK] Tidak menemukan identitas bot di metadata grup.', {
        socketIds: [...botIds],
        participantIds: metadata.participants.map(p => ({ id: p.id, phoneNumber: p.phoneNumber, lid: p.lid, admin: p.admin })),
      });
      return false;
    }

    return bot.admin === 'admin' || bot.admin === 'superadmin';
  } catch (error) {
    console.error('[BOT ADMIN CHECK]', error.message);
    return false;
  }
}

async function sendText(sock, jid, text, quoted) {
  const safeText = String(text || '').slice(0, 3900);
  return sock.sendMessage(jid, { text: safeText || 'Tidak ada hasil.' }, quoted ? { quoted } : {});
}

async function requireDatabase(sock, jid) {
  if (dbReady && mongoose.connection.readyState === 1) return true;
  await sendText(sock, jid, '⚠️ Database belum terhubung. Pastikan MongoDB berjalan, lalu restart bot. Fitur yang memerlukan database sementara tidak tersedia.');
  return false;
}

async function connectDatabase() {
  try {
    await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 });
    dbReady = true;
    console.log('🍃 MongoDB terhubung:', mongoose.connection.name);
  } catch (error) {
    dbReady = false;
    console.error('[MONGODB ERROR]', error.message);
    console.log('Bot akan tetap mencoba online, tetapi fitur database tidak tersedia sampai MongoDB terhubung.');
  }
  mongoose.connection.on('connected', () => { dbReady = true; console.log('🍃 MongoDB connected'); });
  mongoose.connection.on('disconnected', () => { dbReady = false; console.error('⚠️ MongoDB disconnected'); });
  mongoose.connection.on('error', error => console.error('[MONGODB]', error.message));
}



const {
  logModeration, processGroupModeration, spamTracker,
  SPAM_WINDOW_MS, SPAM_MAX_MESSAGES, LINK_REGEX,
} = createGroupModeration({
  getDbReady: () => dbReady, Group, User, Warning, ModerationLog,
  isGroupJid, normalizeJid, isGroupAdmin, isBotAdmin, isBotOwner, getMessageText,
  isChatAllowed,
});

let handleCommand;
handleCommand = createCommandHandler({
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
  handleGameCommand,
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
  LearningSubmission,
  CommunityProfile,
  CommunityCollaboration,
  DesignBattle,
  DesignSeason,
  DesignSeasonSubmission,
  CreativeAsset,
  LearningCohort,
  LearningCohortCheckin,
  Asset,
  User,
  Group,
  Favorite,
  AssetAccess,
  Report,
  Ticket,
  Warning,
  ModerationLog,
  DesignBriefSession,
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
  createDatabaseBackup,
  startBot,
  getDbReady: () => dbReady,
  getReconnecting: () => reconnecting,
  getWhatsAppConnectionState: () => whatsappConnectionState,
});

async function createDatabaseBackup() {
  if (backupInProgress) {
    console.warn('[BACKUP] Backup sebelumnya masih berjalan; jadwal yang bertumpuk dilewati.');
    return false;
  }
  backupInProgress = true;
  let outputDir = '';
  try {
    await fs.promises.mkdir(BACKUP_DIR, { recursive: true, mode: 0o700 });
    await fs.promises.chmod(BACKUP_DIR, 0o700).catch(() => {});
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    outputDir = path.join(BACKUP_DIR, `backup-${stamp}`);
    await execFileAsync('mongodump', ['--uri', MONGO_URI, '--out', outputDir], {
      timeout: 120000,
      windowsHide: true,
      maxBuffer: 8 * 1024 * 1024,
    });

    await fs.promises.chmod(outputDir, 0o700).catch(() => {});
    const databaseEntries = await fs.promises.readdir(outputDir, { withFileTypes: true });
    if (!databaseEntries.length) throw new Error('mongodump selesai tetapi direktori dump kosong.');

    const dumpFiles = [];
    async function collectDumpFiles(directory) {
      for (const entry of await fs.promises.readdir(directory, { withFileTypes: true })) {
        const fullPath = path.join(directory, entry.name);
        if (entry.isDirectory()) await collectDumpFiles(fullPath);
        else if (entry.isFile()) dumpFiles.push(path.relative(outputDir, fullPath).replace(/\\/g, '/'));
      }
    }
    await collectDumpFiles(outputDir);
    if (!dumpFiles.some(file => file.endsWith('.bson'))) {
      throw new Error('Dump database tidak memiliki file BSON; backup tidak akan ditandai berhasil.');
    }

    const optionalLocalState = [];
    if (BACKUP_INCLUDE_LOCAL_STATE) {
      const botRoot = path.resolve(process.env.BOT_DATA_ROOT || process.cwd());
      const localSources = [
        { name: 'baileys-auth', source: path.resolve(AUTH_DIR) },
        { name: 'portfolio-media', source: path.resolve(botRoot, process.env.PORTFOLIO_UPLOAD_DIR || 'uploads/portfolio') },
      ];
      for (const entry of localSources) {
        try {
          const stat = await fs.promises.stat(entry.source);
          if (!stat.isDirectory()) continue;
          const destination = path.join(outputDir, entry.name);
          await fs.promises.cp(entry.source, destination, { recursive: true, errorOnExist: true, force: false });
          optionalLocalState.push(entry.name);
        } catch (error) {
          if (error?.code !== 'ENOENT') throw error;
        }
      }
    }

    const manifest = {
      formatVersion: 1,
      createdAt: new Date().toISOString(),
      database: mongoose.connection.name || 'configured-database',
      dumpFileCount: dumpFiles.length,
      dumpFiles,
      optionalLocalState,
      includesCredentials: optionalLocalState.includes('baileys-auth'),
      retentionDays: BACKUP_RETENTION_DAYS,
    };
    await fs.promises.writeFile(
      path.join(outputDir, 'backup-manifest.json'),
      `${JSON.stringify(manifest, null, 2)}\\n`,
      { flag: 'wx', mode: 0o600 },
    );

    const retentionCutoff = Date.now() - BACKUP_RETENTION_DAYS * 24 * 60 * 60 * 1000;
    const backupEntries = await fs.promises.readdir(BACKUP_DIR, { withFileTypes: true });
    for (const entry of backupEntries) {
      if (!entry.isDirectory() || !/^backup-\\d{4}-\\d{2}-\\d{2}T/.test(entry.name)) continue;
      const candidate = path.resolve(BACKUP_DIR, entry.name);
      if (path.dirname(candidate) !== path.resolve(BACKUP_DIR)) continue;
      const stat = await fs.promises.stat(candidate);
      if (candidate !== path.resolve(outputDir) && stat.mtimeMs < retentionCutoff) {
        await fs.promises.rm(candidate, { recursive: true, force: true });
      }
    }

    console.log('[BACKUP] Backup berhasil:', outputDir);
    return true;
  } catch (error) {
    console.error('[BACKUP ERROR]', error.message);
    if (outputDir) await fs.promises.rm(outputDir, { recursive: true, force: true }).catch(() => {});
    return false;
  } finally {
    backupInProgress = false;
  }
}

async function restoreLinkedDesignerPushDestinations() {
  if (!dbReady) return 0;
  try {
    const profiles = await DesignerProfile.find({
      whatsappPushEnabled: true,
      whatsappPushJid: { $ne: '' },
    }).select('whatsappPushJid').lean();
    let restored = 0;
    for (const profile of profiles) {
      if (registerLinkedDesignerDestination(profile.whatsappPushJid, { persistent: true })) restored += 1;
    }
    console.log(`[DESIGNER PUSH] ${restored} private opt-in destination(s) restored.`);
    return restored;
  } catch (error) {
    console.error('[DESIGNER PUSH RESTORE]', error.message);
    return 0;
  }
}

async function startBot() {
  whatsappConnectionState = 'connecting';
  startBotHealthServer();
  configureAccessListPersistence({ model: AccessList });
  await connectDatabase();
  if (dbReady) {
    await restoreLinkedDesignerPushDestinations();
    const accessRestore = await restoreAccessListFromDatabase();
    console.log(`[ACCESS LIST] ${accessRestore.source || 'belum dipulihkan'}: ${accessRestore.groups || 0} grup, ${accessRestore.contacts || 0} kontak.`);
    const restored = await restoreMultiplayerPersistence();
    console.log(`[MULTIPLAYER] Pemulihan: ${restored.rooms || 0} ruang, ${restored.challenges || 0} tantangan, ${restored.duels || 0} duel.`);
  }
  if (!globalThis.__mongoRetryTimerStarted) {
    globalThis.__mongoRetryTimerStarted = true;
    const retryTimer = setInterval(async () => {
      if (dbReady || mongoose.connection.readyState === 1 || mongoose.connection.readyState === 2) return;
      try {
        console.warn('[MONGODB RETRY] Mencoba menghubungkan ulang MongoDB...');
        await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 });
        dbReady = true;
        console.log('🍃 MongoDB tersambung kembali:', mongoose.connection.name);
        await restoreLinkedDesignerPushDestinations();
        const accessRestore = await restoreAccessListFromDatabase();
        console.log(`[ACCESS LIST] Pemulihan ulang: ${accessRestore.groups || 0} grup, ${accessRestore.contacts || 0} kontak.`);
      } catch (error) {
        dbReady = false;
        console.error('[MONGODB RETRY ERROR]', error.message);
      }
    }, 15000);
    retryTimer.unref?.();
  }
  if (!globalThis.__backupTimerStarted) {
    globalThis.__backupTimerStarted = true;
    setInterval(() => { if (dbReady) void createDatabaseBackup(); }, BACKUP_INTERVAL_HOURS * 60 * 60 * 1000).unref?.();
  }
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
  let version;
  try {
    ({ version } = await fetchLatestBaileysVersion());
  } catch (error) {
    console.error('[BAILEYS VERSION]', error.message);
  }

  const sock = makeWASocket({
    ...(version ? { version } : {}),
    printQRInTerminal: false,
    auth: state,
    browser: ['Bot-Grup-Desain', 'Chrome', '1.0.0'],
    markOnlineOnConnect: false,
    syncFullHistory: false,
  });

  // Central outbound gate: blocks every direct sendMessage call to unapproved
  // groups/contacts, including marketplace, reports, moderation and automations.
  guardSocketOutbound(sock);
  activeDesignerNotificationWorker?.stop?.();
  activeDesignerNotificationWorker = createDesignerNotificationWorker({
    DesignerProfile,
    DesignerNotification,
    sendMessage: (jid, payload) => sock.sendMessage(jid, payload),
    isDestinationAllowed,
    logger: console,
    isDatabaseReady: () => dbReady,
  });

  sock.ev.on('creds.update', saveCreds);
  sock.ev.on('connection.update', async ({ connection, lastDisconnect, qr }) => {
    if (connection) whatsappConnectionState = connection;
    if (qr) {
      console.log('--- SCAN QR CODE BELOW ---');
      qrcode.generate(qr, { small: true });
    }
    if (connection === 'open') {
      reconnecting = false;
      activeDesignerNotificationWorker?.start?.();
      console.log('✅ Bot WhatsApp online dan siap.');
    }
    if (connection === 'close') activeDesignerNotificationWorker?.stop?.();
    if (connection === 'close' && !reconnecting) {
      const statusCode = lastDisconnect?.error instanceof Boom
        ? lastDisconnect.error.output?.statusCode
        : lastDisconnect?.error?.output?.statusCode;
      if (statusCode === DisconnectReason.loggedOut) {
        console.error('WhatsApp logout. Hapus sesi hanya jika memang ingin memasangkan ulang perangkat.');
        return;
      }
      reconnecting = true;
      console.warn('Koneksi tertutup. Mencoba menghubungkan ulang dalam 3 detik...');
      setTimeout(() => startBot().catch(error => { reconnecting = false; console.error('[RECONNECT ERROR]', error); }), 3000);
    }
  });

  sock.ev.on('group-participants.update', async update => {
    if (!['add', 'remove'].includes(update.action)) return;
    // Jangan kirim sambutan/perpisahan otomatis ke grup yang belum diizinkan.
    if (!isChatAllowed({ remoteJid: update.id, isGroup: true })) return;
    try {
      const metadata = await sock.groupMetadata(update.id).catch(() => null);
      const group = dbReady ? await Group.findOne({ jid: update.id }).lean().catch(() => null) : null;
      const rules = group?.rules || DEFAULT_GROUP_RULES;
      for (const participant of update.participants || []) {
        const isWelcome = update.action === 'add';
        if (!shouldSendGroupGreeting(update.action, group || {})) continue;
        const template = isWelcome ? group?.welcomeMessage : group?.goodbyeMessage;
        const text = buildGroupGreeting({ action: update.action, participant, groupName: metadata?.subject || 'grup', rules, template });
        if (isWelcome && fs.existsSync(WELCOME_IMAGE)) {
          await sock.sendMessage(update.id, { image: fs.readFileSync(WELCOME_IMAGE), caption: text, mentions: [participant] });
        } else {
          await sock.sendMessage(update.id, { text, mentions: [participant] });
        }
      }
    } catch (error) { console.error('[GROUP GREETING ERROR]', error.message); }
  });

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    // Hanya pesan baru, supaya perintah lama dari sinkronisasi riwayat
    // tidak dijalankan ulang saat bot tersambung.
    if (type !== 'notify') return;
    for (const msg of messages || []) {
      try {
        if (!msg?.message || msg.key?.fromMe) continue;
        if (!rememberMessageId(msg.key?.id)) {
          console.warn('[DUPLICATE MESSAGE SKIPPED]', msg.key?.id || '(no-id)');
          continue;
        }
        const incomingText = getMessageText(msg.message).trim();
        const remote = msg.key?.remoteJid || '?';
        const sender = normalizeJid(msg.key?.participant || remote);
        const senderAliases = [
          msg.key?.participantAlt, msg.key?.remoteJidAlt, msg.key?.senderPn,
          msg.key?.senderLid, msg.key?.participantPn, msg.key?.participantLid,
        ].filter(value => typeof value === 'string' && value.length > 0);
        const isGroupMessage = remote.endsWith('@g.us');
        // Gate before moderation, XP, wizard, commands, or any other message side effect.
        // Owner may still manage access; outbound replies remain separately allowlisted.
        const senderIsOwner = isBotOwner(sender, senderAliases);
        const incomingLower = incomingText.toLowerCase();
        const notificationCommandBases = [`${PREFIX}portfolio notifikasi`, `${PREFIX}portofolio notifikasi`]
          .map(value => value.toLowerCase());
        const privateNotificationCommand = !isGroupMessage &&
          (remote.endsWith('@s.whatsapp.net') || remote.endsWith('@lid')) &&
          notificationCommandBases.some(base => incomingLower === base || incomingLower.startsWith(`${base} `));
        let linkedDesignerNotificationAccess = false;
        if (privateNotificationCommand && dbReady) {
          const linkedProfile = await DesignerProfile.findOne({
            ownerJid: { $in: [sender, remote] },
          }).select('designerId ownerJid').lean().catch(() => null);
          if (linkedProfile) {
            linkedDesignerNotificationAccess = true;
            registerLinkedDesignerDestination(remote);
          }
        }
        if (!isInboundChatAllowed({
          senderIsOwner, remoteJid: remote, isGroup: isGroupMessage,
          identityAliases: [sender, ...senderAliases],
        }) && !linkedDesignerNotificationAccess) {
          console.log(`[INBOUND BLOCKED] Chat ${isGroupMessage ? 'grup' : 'pribadi'} belum diizinkan.`);
          continue;
        }
        // Register only the exact private-chat JID of an identity already verified as Owner.
        // This lets the strict outbound gate reply to the same Owner phone JID or LID.
        // Group destinations are never auto-approved, even when the sender is Owner.
        if (senderIsOwner && !isGroupMessage &&
            (remote.endsWith('@lid') || remote.endsWith('@s.whatsapp.net'))) {
          const ownerPrivateJid = addAllowedContact(remote);
          if (ownerPrivateJid.ok) console.log('[OWNER ACCESS] Verified Owner private JID registered for replies.');
        }
        console.log(`[INCOMING] type=${type} from=${isGroupMessage ? 'group' : 'private'} content=${incomingText ? 'text' : 'non-text'}`);
        await serializeBySender(sender, async () => {
          const moderated = await processGroupModeration(sock, msg);
          if (!moderated) await handleCommand(sock, msg);
        });
      } catch (error) {
        console.error('[MESSAGE HANDLER]', error.stack || error.message);
      }
    }
  });
}

process.on('unhandledRejection', error => console.error('[UNHANDLED REJECTION]', error));
process.on('uncaughtException', error => {
  console.error('[UNCAUGHT EXCEPTION] Fatal error; exiting so the process manager can restart cleanly:', error.stack || error.message);
  process.exitCode = 1;
  setTimeout(() => process.exit(1), 1000).unref?.();
});

startBot().catch(error => {
  console.error('[STARTUP ERROR]', error.stack || error.message);
  process.exitCode = 1;
});
