// Command router hasil pemisahan dari index.js. Dependency injection menjaga integrasi dengan model/helper yang sudah ada.
import { handleImageInfoCommands, IMAGE_INFO_COMMANDS } from './commands/image-info.js';
import { handleImageProcessingCommands, IMAGE_PROCESSING_COMMANDS } from './commands/image-processing.js';
import { handleDesignBriefCommands, DESIGN_BRIEF_COMMANDS } from './commands/design-brief.js';
import { handleDesignToolsCommands, DESIGN_TOOLS_COMMANDS } from './commands/design-tools.js';
import { handleAssetsDiscoveryCommands, ASSETS_DISCOVERY_COMMANDS } from './commands/assets-discovery.js';
import { handleAssetsManagementCommands, ASSETS_MANAGEMENT_COMMANDS } from './commands/assets-management.js';
import { handleSupportReportsCommands, SUPPORT_REPORTS_COMMANDS } from './commands/support-reports.js';
import { handleSupportCenterCommands, SUPPORT_CENTER_COMMANDS } from './commands/support-center.js';
import { handleSupportAdminCommands, SUPPORT_ADMIN_COMMANDS } from './commands/support-admin.js';
import { handleModerationSettingsCommands, MODERATION_SETTINGS_COMMANDS } from './commands/moderation-settings.js';
import { handleModerationActionsCommands, MODERATION_ACTIONS_COMMANDS } from './commands/moderation-actions.js';
import { handleGeneralHelpCommands, GENERAL_HELP_COMMANDS } from './commands/general-help.js';
import { consumeOnboardingMessage } from './onboarding.js';
import { handleGeneralOwnerCommands, GENERAL_OWNER_COMMANDS } from './commands/general-owner.js';
import { getAvailableGames, dispatchGameCommand } from '../games/index.js';
import { handleMultiplayer } from '../games/multiplayer/index.js';
import { normalizePixelRealmArgs } from '../games/pixel-realm/command-aliases.js';
import { handleDesignMarketplaceMessage } from './design-marketplace/index.js';
import { handleGroupIdentifierCommands, GROUP_IDENTIFIER_COMMANDS } from './commands/group-identifiers.js';
import { recordMissionProgress } from '../games/rewards/index.js';
import { ECONOMY_COMMANDS, handleEconomyCommand } from '../games/economy/index.js';
import { handleDesignCritiqueCommands, DESIGN_CRITIQUE_COMMANDS } from './commands/design-critique.js';
import { handleMediaDownloadCommands, MEDIA_DOWNLOAD_COMMANDS } from './commands/media-download.js';
import { handleAnimeDiscoveryCommand, ANIME_DISCOVERY_COMMANDS } from './commands/anime-discovery.js';
import { handleMusicDiscoveryCommand, MUSIC_DISCOVERY_COMMANDS } from './commands/music-discovery.js';
import { handleVoiceEffectCommands, VOICE_EFFECT_COMMANDS } from './commands/voice-effects.js';
import { handleLocalInfoCommands, LOCAL_INFO_COMMANDS } from './commands/local-info.js';
import { handlePirAssistantCommand, PIR_ASSISTANT_COMMANDS } from './commands/pir-assistant.js';
import { handlePinterestSearchCommands, PINTEREST_SEARCH_COMMANDS, BING_IMAGE_SEARCH_COMMANDS } from './commands/pinterest-search.js';
import { createAttributedSocket } from './command-attribution.js';
import { handleDesignerAssistantCommands, DESIGNER_ASSISTANT_COMMANDS } from './commands/designer-assistant.js';
import { handleDesignProductionCommands, DESIGN_PRODUCTION_COMMANDS } from './commands/design-production-tools.js';
import { handleDesignLearningCommands, DESIGN_LEARNING_COMMANDS } from './commands/design-learning.js';
import { handleDesignCommunityCommands, DESIGN_COMMUNITY_COMMANDS } from './commands/design-community.js';
import { handleDesignCohortCommands, DESIGN_COHORT_COMMANDS } from './commands/design-cohort.js';
import { handleDesignSeasonCommands, DESIGN_SEASON_COMMANDS } from './commands/design-seasons.js';
import { handleAssetStudioCommand, ASSET_STUDIO_COMMANDS } from './commands/asset-studio.js';
import { consumeDesignBriefWizardMessage } from './commands/design-brief-wizard.js';
import { normalizeShortCommand, SHORT_COMMAND_ALIASES } from './command-aliases.js';
import { findSimilarCommands, searchCommandsByNeed } from './command-suggestions.js';
import { readBotTexts, renderBotText } from './content-editor.js';
import { COMMAND_CATALOG } from './command-catalog.js';
import { cleanWhatsAppText } from './content-editor.js';
import { readBotSettings } from './bot-settings.js';
import { isInboundChatAllowed } from './access-control.js';
import { recordRecentCommand } from './quick-access.js';
export function createCommandHandler(deps) {
  const {
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
    createDatabaseBackup,
    startBot,
    getDbReady,
    getReconnecting,
  } = deps;
  async function handleCommand(sock, msg) {
  if (!msg.message || msg.key.fromMe) return;
  msg.message = unwrapMessage(msg.message);
  const remoteJid = msg.key.remoteJid;
  if (!remoteJid || remoteJid === 'status@broadcast') return;
  const isGroup = isGroupJid(remoteJid);
  let messageText = getMessageText(msg.message).trim();
  const isCommand = messageText.startsWith(PREFIX);
  const parts = isCommand ? messageText.slice(PREFIX.length).trim().split(/\s+/) : [];
  const parsedCommand = isCommand ? (parts.shift() || '').toLowerCase() : '';
  const isCanonicalCommand = COMMAND_CATALOG.some(item => item.command === parsedCommand) && !Object.hasOwn(SHORT_COMMAND_ALIASES, parsedCommand);
  const command = isCanonicalCommand ? parsedCommand : normalizeShortCommand(parsedCommand);
  const args = parts;
  const sender = msg.key.participant || remoteJid;
  const userJid = normalizeJid(sender);
  // Include Baileys alternate identities where available; this fixes Owner checks for accounts
  // whose message sender is represented as @lid while .env contains the phone-number JID.
  const senderIdentityAliases = [
    msg.key.participantAlt,
    msg.key.remoteJidAlt,
    msg.key.senderPn,
    msg.key.senderLid,
    msg.key.participantPn,
    msg.key.participantLid,
  ].filter(value => typeof value === 'string' && value.length > 0);
  const phoneJid = [sender, ...senderIdentityAliases]
    .find(value => typeof value === 'string' && value.endsWith('@s.whatsapp.net')) || '';
  // Owner bypasses the allowlist; every other chat is denied unless explicitly approved.
  if (!isInboundChatAllowed({ senderIsOwner: deps.isBotOwner(userJid, senderIdentityAliases), remoteJid, isGroup, identityAliases: [sender, ...senderIdentityAliases] })) return;
  const commandSock = createAttributedSocket(sock, {
    remoteJid,
    isGroup,
    senderJid: sender,
    phoneJid,
    quotedMessage: msg,
  });
  let shouldRecordUsage = isCommand && COMMAND_CATALOG.some(item => item.command === command);
  let commandExecutionFailed = false;
  const reply = async (text, mentions = []) => {
    const normalized = cleanWhatsAppText(text);
    const maxChunk = 3400;
    if (normalized.length <= maxChunk) {
      return commandSock.sendMessage(remoteJid, { text: normalized, ...(mentions.length ? { mentions } : {}) }, { quoted: msg });
    }
    // Split only at paragraph/line boundaries so long help output is not silently truncated.
    const chunks = [];
    let remaining = normalized;
    while (remaining.length > maxChunk) {
      let cut = remaining.lastIndexOf('\n\n', maxChunk);
      if (cut < Math.floor(maxChunk * 0.55)) cut = remaining.lastIndexOf('\n', maxChunk);
      if (cut < Math.floor(maxChunk * 0.55)) cut = maxChunk;
      chunks.push(remaining.slice(0, cut).trim());
      remaining = remaining.slice(cut).trim();
    }
    if (remaining) chunks.push(remaining);
    for (let index = 0; index < chunks.length; index += 1) {
      await commandSock.sendMessage(remoteJid, { text: chunks[index], ...(index === 0 && mentions.length ? { mentions } : {}) }, { quoted: index === 0 ? msg : undefined });
    }
  };

  try {
    const ctx = { ...deps, commandNames: COMMAND_CATALOG.map(item => item.command), sock: commandSock, msg, remoteJid, isGroup, isCommand, messageText, parts, command, args, sender, userJid, phoneJid, senderIdentityAliases, reply };
    if (await consumeOnboardingMessage(ctx)) return;
    if (!isCommand && await consumeDesignBriefWizardMessage(ctx)) return;
    if (await handleDesignMarketplaceMessage(ctx)) return;
    if (!isCommand) return;
    const botSettings = readBotSettings();
    const ownerCommand = GENERAL_OWNER_COMMANDS.has(command) && deps.isBotOwner(userJid, senderIdentityAliases);
    const maintenanceAllowed = new Set(['help', 'menu', 'mulai', 'akses', 'commands', 'perintah', 'daftarperintah', 'cari', 'support', 'ticket', 'report', 'reports', 'cepat', 'asisten']);
    if (botSettings.maintenanceMode && !ownerCommand && !maintenanceAllowed.has(command)) {
      shouldRecordUsage = false;
      return reply(`🛠️ *MODE PEMELIHARAAN*\n\n${botSettings.maintenanceNotice}\n\nPerintah bantuan tetap tersedia: ${PREFIX}help atau ${PREFIX}menu.`);
    }
    if (DESIGNER_ASSISTANT_COMMANDS.has(command)) return await handleDesignerAssistantCommands(ctx);
    if (DESIGN_PRODUCTION_COMMANDS.has(command)) return await handleDesignProductionCommands(ctx);
    if (DESIGN_LEARNING_COMMANDS.has(command)) return await handleDesignLearningCommands(ctx);
    if (DESIGN_COMMUNITY_COMMANDS.has(command)) return await handleDesignCommunityCommands(ctx);
    if (DESIGN_COHORT_COMMANDS.has(command)) return await handleDesignCohortCommands(ctx);
    if (DESIGN_SEASON_COMMANDS.has(command)) return await handleDesignSeasonCommands(ctx);
    if (ASSET_STUDIO_COMMANDS.has(command)) return await handleAssetStudioCommand(ctx);
    if (SUPPORT_CENTER_COMMANDS.has(command)) return await handleSupportCenterCommands(ctx);
    if (PINTEREST_SEARCH_COMMANDS.has(command) || BING_IMAGE_SEARCH_COMMANDS.has(command)) return await handlePinterestSearchCommands(ctx);
    if (ANIME_DISCOVERY_COMMANDS.has(command)) return await handleAnimeDiscoveryCommand(ctx);
    if (MUSIC_DISCOVERY_COMMANDS.has(command)) return await handleMusicDiscoveryCommand(ctx);
    if (VOICE_EFFECT_COMMANDS.has(command)) return await handleVoiceEffectCommands(ctx);
    if (LOCAL_INFO_COMMANDS.has(command)) return await handleLocalInfoCommands(ctx);
    if (PIR_ASSISTANT_COMMANDS.has(command)) return await handlePirAssistantCommand(ctx);
    if (MEDIA_DOWNLOAD_COMMANDS.has(command)) return await handleMediaDownloadCommands(ctx);
    if (GROUP_IDENTIFIER_COMMANDS.has(command)) return await handleGroupIdentifierCommands(ctx);
    if (IMAGE_INFO_COMMANDS.has(command)) return await handleImageInfoCommands(ctx);
    if (IMAGE_PROCESSING_COMMANDS.has(command)) return await handleImageProcessingCommands(ctx);
    if (DESIGN_BRIEF_COMMANDS.has(command)) return await handleDesignBriefCommands(ctx);
    if (DESIGN_TOOLS_COMMANDS.has(command)) return await handleDesignToolsCommands(ctx);
    if (ASSETS_DISCOVERY_COMMANDS.has(command)) return await handleAssetsDiscoveryCommands(ctx);
    if (ASSETS_MANAGEMENT_COMMANDS.has(command)) return await handleAssetsManagementCommands(ctx);
    // `.reports` is intentionally shared: Owner sees global reports; other authorized group admins see reports for their current group.
    if (command === 'reports') {
      if (deps.isBotOwner(userJid, senderIdentityAliases)) return await handleGeneralOwnerCommands(ctx);
      return await handleSupportReportsCommands(ctx);
    }
    if (SUPPORT_REPORTS_COMMANDS.has(command)) return await handleSupportReportsCommands(ctx);
    if (SUPPORT_ADMIN_COMMANDS.has(command)) return await handleSupportAdminCommands(ctx);
    if (MODERATION_SETTINGS_COMMANDS.has(command)) return await handleModerationSettingsCommands(ctx);
    if (MODERATION_ACTIONS_COMMANDS.has(command)) return await handleModerationActionsCommands(ctx);
    if (GENERAL_HELP_COMMANDS.has(command)) return await handleGeneralHelpCommands(ctx);
    if (GENERAL_OWNER_COMMANDS.has(command)) return await handleGeneralOwnerCommands(ctx);
    if (DESIGN_CRITIQUE_COMMANDS.has(command)) return await handleDesignCritiqueCommands(ctx);
    if (command === 'multi') {
      if (ctx.User && getDbReady()) await recordMissionProgress(ctx.User, ctx.userJid || ctx.phoneJid, 'games').catch(() => {});
      return await handleMultiplayer(ctx);
    }
    if (ECONOMY_COMMANDS.has(command)) return await handleEconomyCommand({ ...ctx, getDbReady });
    if (command === 'player') return await dispatchGameCommand('player', { ...ctx, getDbReady });
    if (command === 'mission') return await dispatchGameCommand('mission', { ...ctx, getDbReady });
    if (command === 'tebak') return await dispatchGameCommand('tebak', { ...ctx, getDbReady });
    if (['angka', 'acak', 'misteri'].includes(command)) return await dispatchGameCommand(command, ctx);
    if (command === 'game' || command === 'games') {
      // `.game` tanpa argumen tetap membuka Game Center. Jika ada subperintah,
      // teruskan ke Pixel Realm agar `.game mulai` tidak berhenti di menu katalog.
      if (command === 'game' && args.length > 0) {
        const gameContext = {
          sock: commandSock, msg, remoteJid, isGroup, messageText, command: 'game', args, sender, userJid,
          senderIdentityAliases, reply, PREFIX, MONGO_URI, AUTH_DIR, TEMP_DIR, WELCOME_IMAGE,
          BACKUP_DIR, BACKUP_INTERVAL_HOURS, execFileAsync, MAX_IMAGE_BYTES, OWNER_JIDS_RAW,
          DEFAULT_GROUP_RULES, dbReady: getDbReady(), reconnecting: getReconnecting(),
          processedMessageIds, senderQueues, MESSAGE_DEDUPE_TTL_MS, MESSAGE_DEDUPE_MAX,
          rememberMessageId, serializeBySender, PartySchema, GuildSchema, AssetSchema, UserSchema,
          GroupSchema, FavoriteSchema, AssetAccessSchema, ReportSchema, TicketSchema,
          ModerationLogSchema, WarningSchema, Party, Guild, GuildWarSchema, GuildWar,
          MarketListingSchema, MarketListing, WorldBossSchema, WorldBoss, TerritorySchema,
          Territory, Asset, User, Group, Favorite, AssetAccess, Report, Ticket, Warning,
          ModerationLog, spamTracker, SPAM_WINDOW_MS, SPAM_MAX_MESSAGES, LINK_REGEX,
          logModeration, processGroupModeration, normalizeJid, ownerJidSet, ownerIdentityCandidates,
          isBotOwner, isGroupJid, unwrapMessage, getMessageText, getQuotedMessage, getImageTarget,
          downloadMedia, isGroupAdmin, isBotAdmin, sendText, requireDatabase, connectDatabase,
          addStickerPackMetadata, createDatabaseBackup, startBot, getDbReady, getReconnecting,
          makeWASocket, DisconnectReason, useMultiFileAuthState, jidNormalizedUser,
          fetchLatestBaileysVersion, downloadMediaMessage, Boom, qrcode, fs, path, execFile,
          promisify, sharp, webpmux, mongoose, GAME_LOCATIONS, GAME_MONSTERS, GAME_CLASSES,
          createInitialGameState, normalizeGameState
        };
        return await dispatchGameCommand('pixelrealm', gameContext);
      }
      const available = getAvailableGames();
      const gameCommands = new Set(['pixelrealm', 'tebak', 'angka', 'acak', 'misteri', 'multi']);
      const playable = available.filter(game => gameCommands.has(game.command));
      const byCommand = new Map(playable.map(game => [game.command, game]));
      const sections = [
        {
          title: '🧭 RPG & PETUALANGAN',
          commands: ['pixelrealm'],
          note: `Mulai karakter dan petualangan: ${PREFIX}pr mulai`,
        },
        {
          title: '🧠 GAME TEBAK & KATA',
          commands: ['tebak', 'angka', 'acak'],
          note: `Cocok untuk bermain sendiri. Gunakan menu masing-masing untuk aturan dan skor.`,
        },
        {
          title: '🕵️ INVESTIGASI',
          commands: ['misteri'],
          note: `Pecahkan kasus fiksi melalui lokasi, bukti, wawancara, dan jurnal.`,
        },
        {
          title: '👥 MULTIPLAYER',
          commands: ['multi'],
          note: `Bermain bersama di grup: Sambung Kata, Kuis Rebutan, dan Duel Suit.`,
        },
      ];
      const sectionText = sections.map(section => {
        const rows = section.commands.map((key, index) => {
          const game = byCommand.get(key);
          if (!game) return null;
          return `${index + 1}. *${game.name}*\n   ${game.description}\n   Mulai/panduan: ${PREFIX}${game.command}`;
        }).filter(Boolean).join('\n\n');
        return `${section.title}\n${rows}\n${section.note}`;
      }).join('\n\n━━━━━━━━━━━━━━━━━━\n\n');
      const support = [
        `👤 *PROFIL PEMAIN & PROGRES*\n• ${PREFIX}player — profil, level, XP, koin, pencapaian\n• ${PREFIX}player top — peringkat XP\n• ${PREFIX}player topkoin — peringkat koin`,
        `🎯 *MISI & HADIAH HARIAN*\n• ${PREFIX}mission — lihat target dan progres misi\n• ${PREFIX}mission claim <id> — klaim hadiah setelah target tercapai`,
      ].join('\n\n');
      return reply(`🎮 *GAME CENTER PIR VISUALS*\n_Pilih permainan sesuai yang ingin kamu lakukan._\n\n${sectionText}\n\n━━━━━━━━━━━━━━━━━━\n\n${support}\n\n*PANDUAN CEPAT*\n• ${PREFIX}games — buka daftar permainan ini\n• ${PREFIX}help <perintah> — cara pakai dan contoh\n• ${PREFIX}commands cari <kata> — cari perintah\n\nCatatan: beberapa game membutuhkan MongoDB untuk menyimpan progres/skor. Multiplayer dimainkan di grup yang diizinkan bot.`);
    }
    if (command === 'pixelrealm' || command === 'pr') {
      const pixelRealmArgs = normalizePixelRealmArgs(args);
      const gameContext = {
          sock: commandSock, msg, remoteJid, isGroup, messageText, command: 'pixelrealm', args: pixelRealmArgs, sender, userJid,
          senderIdentityAliases, reply, PREFIX, MONGO_URI, AUTH_DIR, TEMP_DIR, WELCOME_IMAGE,
          BACKUP_DIR, BACKUP_INTERVAL_HOURS, execFileAsync, MAX_IMAGE_BYTES, OWNER_JIDS_RAW,
          DEFAULT_GROUP_RULES, dbReady: getDbReady(), reconnecting: getReconnecting(),
          processedMessageIds, senderQueues, MESSAGE_DEDUPE_TTL_MS, MESSAGE_DEDUPE_MAX,
          rememberMessageId, serializeBySender, PartySchema, GuildSchema, AssetSchema, UserSchema,
          GroupSchema, FavoriteSchema, AssetAccessSchema, ReportSchema, TicketSchema,
          ModerationLogSchema, WarningSchema, Party, Guild, GuildWarSchema, GuildWar,
          MarketListingSchema, MarketListing, WorldBossSchema, WorldBoss, TerritorySchema,
          Territory, Asset, User, Group, Favorite, AssetAccess, Report, Ticket, Warning,
          ModerationLog, spamTracker, SPAM_WINDOW_MS, SPAM_MAX_MESSAGES, LINK_REGEX,
          logModeration, processGroupModeration, normalizeJid, ownerJidSet, ownerIdentityCandidates,
          isBotOwner, isGroupJid, unwrapMessage, getMessageText, getQuotedMessage, getImageTarget,
          downloadMedia, isGroupAdmin, isBotAdmin, sendText, requireDatabase, connectDatabase,
          addStickerPackMetadata, createDatabaseBackup, startBot, getDbReady, getReconnecting,
          makeWASocket, DisconnectReason, useMultiFileAuthState, jidNormalizedUser,
          fetchLatestBaileysVersion, downloadMediaMessage, Boom, qrcode, fs, path, execFile,
          promisify, sharp, webpmux, mongoose, GAME_LOCATIONS, GAME_MONSTERS, GAME_CLASSES,
          createInitialGameState, normalizeGameState
      };
      return await dispatchGameCommand('pixelrealm', gameContext);
    }
    // Unknown-command guidance: suggest likely spellings, but never auto-run a command.
    const suggestions = findSimilarCommands(command);
    const needMatches = searchCommandsByNeed(command, COMMAND_CATALOG, 3);
    const suggestionText = suggestions.length
      ? `Mungkin yang kamu maksud:\n${suggestions.map(item => `• ${PREFIX}${item}`).join('\n')}\n\nKetik ${PREFIX}help <perintah> untuk melihat fungsi dan contoh.`
      : needMatches.length
        ? `Mungkin fitur yang kamu cari:\n${needMatches.map(item => `• ${PREFIX}${item.command} — ${item.description}`).join('\n')}\n\nCari dengan kalimat biasa: ${PREFIX}cari ${command}.`
        : `Ketik ${PREFIX}cari <kebutuhan> untuk menemukan fitur dengan bahasa sehari-hari, atau ${PREFIX}commands untuk melihat katalog.`;
    try {
      const texts = await readBotTexts();
      return reply(renderBotText(texts.unknownCommand, { prefix: PREFIX, command, suggestions: suggestionText }));
    } catch {
      return reply(`❔ Aku belum mengenali perintah *${PREFIX}${command}*.\n\n${suggestionText}\n\nKetik ${PREFIX}menu kapan saja untuk kembali ke beranda.`);
    }
  } catch (error) {
    commandExecutionFailed = true;
    console.error(`[COMMAND ERROR: ${command}]`, error.stack || error.message);
    return sendText(commandSock, remoteJid, `❌ Perintah ${PREFIX}${command} gagal dijalankan.\n${process.env.NODE_ENV === 'development' ? error.message : 'Periksa log terminal atau konfigurasi bot.'}`, msg).catch(() => {});
  } finally {
    if (shouldRecordUsage && !commandExecutionFailed) {
      await recordRecentCommand({ ...deps, userJid, phoneJid, sender }, command).catch(error => {
        console.warn('[QUICK ACCESS] Riwayat perintah tidak tercatat:', error.message);
      });
    }
  }
}

  return handleCommand;
}
