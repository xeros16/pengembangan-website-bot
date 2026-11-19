// Extracted command module. Logic preserved from the original handler.
export const SUPPORT_ADMIN_COMMANDS = new Set(["backup", "level"]);
export async function handleSupportAdminCommands(ctx) {
  const { makeWASocket, DisconnectReason, useMultiFileAuthState, jidNormalizedUser, fetchLatestBaileysVersion, downloadMediaMessage, Boom, qrcode, fs, path, execFile, promisify, sharp, webpmux, mongoose, GAME_LOCATIONS, GAME_MONSTERS, GAME_CLASSES, createInitialGameState, normalizeGameState, handleGameCommand, PREFIX, MONGO_URI, AUTH_DIR, TEMP_DIR, WELCOME_IMAGE, BACKUP_DIR, BACKUP_INTERVAL_HOURS, execFileAsync, MAX_IMAGE_BYTES, OWNER_JIDS_RAW, DEFAULT_GROUP_RULES, processedMessageIds, senderQueues, MESSAGE_DEDUPE_TTL_MS, MESSAGE_DEDUPE_MAX, rememberMessageId, serializeBySender, PartySchema, GuildSchema, AssetSchema, UserSchema, GroupSchema, FavoriteSchema, AssetAccessSchema, ReportSchema, TicketSchema, ModerationLogSchema, WarningSchema, Party, Guild, GuildWarSchema, GuildWar, MarketListingSchema, MarketListing, WorldBossSchema, WorldBoss, TerritorySchema, Territory, Asset, User, Group, Favorite, AssetAccess, Report, Ticket, Warning, ModerationLog, spamTracker, SPAM_WINDOW_MS, SPAM_MAX_MESSAGES, LINK_REGEX, logModeration, processGroupModeration, normalizeJid, ownerJidSet, ownerIdentityCandidates, isBotOwner, isGroupJid, unwrapMessage, getMessageText, getQuotedMessage, getImageTarget, downloadMedia, isGroupAdmin, isBotAdmin, sendText, requireDatabase, connectDatabase, addStickerPackMetadata, createDatabaseBackup, startBot, getDbReady, getReconnecting, sock, msg, remoteJid, isGroup, messageText, parts, command, args, sender, userJid, senderIdentityAliases, reply } = ctx;
  switch (command) {
          case 'backup': {
            if (!isBotOwner(userJid, senderIdentityAliases)) return reply('⛔ Cadangan database adalah perintah khusus Owner bot. Admin grup tidak memiliki akses ini.');
            const ok = await createDatabaseBackup();
            return reply(ok ? `✅ Cadangan database berhasil dibuat di folder ${BACKUP_DIR}.` : '❌ Cadangan gagal. Pastikan MongoDB berjalan dan perintah mongodump tersedia di PATH.');
          }
          case 'level': {
            if (!await requireDatabase(sock, remoteJid)) return;
            const user = await User.findOne({ jid: userJid }).lean();
            const activity = user?.activity || {};
            const xp = Number(activity.xp || 0);
            const level = Number(activity.level || (Math.floor(xp / 25) + 1));
            return reply(`🏅 *Level Aktivitas*\nLevel: ${level}\nXP: ${xp}\nPesan tercatat: ${Number(activity.messages || 0)}\nXP menuju level berikutnya: ${25 - (xp % 25)}`);
          }

    default: return;
  }
}
