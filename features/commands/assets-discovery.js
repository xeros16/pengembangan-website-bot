// Extracted command module. Logic preserved from the original handler.
export const ASSETS_DISCOVERY_COMMANDS = new Set(["assets", "kategoriassets", "newassets", "randomassets", "requestassets", "searchassets"]);
export async function handleAssetsDiscoveryCommands(ctx) {
  const { makeWASocket, DisconnectReason, useMultiFileAuthState, jidNormalizedUser, fetchLatestBaileysVersion, downloadMediaMessage, Boom, qrcode, fs, path, execFile, promisify, sharp, webpmux, mongoose, GAME_LOCATIONS, GAME_MONSTERS, GAME_CLASSES, createInitialGameState, normalizeGameState, handleGameCommand, PREFIX, MONGO_URI, AUTH_DIR, TEMP_DIR, WELCOME_IMAGE, BACKUP_DIR, BACKUP_INTERVAL_HOURS, execFileAsync, MAX_IMAGE_BYTES, OWNER_JIDS_RAW, DEFAULT_GROUP_RULES, processedMessageIds, senderQueues, MESSAGE_DEDUPE_TTL_MS, MESSAGE_DEDUPE_MAX, rememberMessageId, serializeBySender, PartySchema, GuildSchema, AssetSchema, UserSchema, GroupSchema, FavoriteSchema, AssetAccessSchema, ReportSchema, TicketSchema, ModerationLogSchema, WarningSchema, Party, Guild, GuildWarSchema, GuildWar, MarketListingSchema, MarketListing, WorldBossSchema, WorldBoss, TerritorySchema, Territory, Asset, User, Group, Favorite, AssetAccess, Report, Ticket, Warning, ModerationLog, spamTracker, SPAM_WINDOW_MS, SPAM_MAX_MESSAGES, LINK_REGEX, logModeration, processGroupModeration, normalizeJid, ownerJidSet, ownerIdentityCandidates, isBotOwner, isGroupJid, unwrapMessage, getMessageText, getQuotedMessage, getImageTarget, downloadMedia, isGroupAdmin, isBotAdmin, sendText, requireDatabase, connectDatabase, addStickerPackMetadata, createDatabaseBackup, startBot, getDbReady, getReconnecting, sock, msg, remoteJid, isGroup, messageText, parts, command, args, sender, userJid, senderIdentityAliases, reply } = ctx;
  switch (command) {
          case 'searchassets':
          case 'assets': {
            if (!await requireDatabase(sock, remoteJid)) return;
            const query = args.join(' ').trim();
            const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const filter = query ? { $or: [{ title: { $regex: escaped, $options: 'i' } }, { category: { $regex: escaped, $options: 'i' } }] } : {};
            const assets = await Asset.find(filter).sort({ createdAt: -1 }).limit(10).lean();
            if (!assets.length) return reply(query ? `Tidak ada aset yang cocok dengan "${query}".` : `Belum ada aset. Admin dapat menambahkan dengan ${PREFIX}addasset judul | URL | kategori`);
            msg._lastAssets = assets;
            await Promise.all(assets.map(a => AssetAccess.create({ jid: userJid, assetId: a._id }).catch(()=>{})));
            await Asset.updateMany({ _id: { $in: assets.map(a=>a._id) } }, { $inc: { views: 1 } });
            return reply(`📦 *Hasil Pencarian Aset*\n\n${assets.map((a,i)=>`${i+1}. *${a.title}* [${a.category}]\nID: ${a._id}\n${a.url}`).join('\n\n')}`);
          }
                    case 'kategoriassets': {
            if (!await requireDatabase(sock, remoteJid)) return;
            const categories = await Asset.distinct('category');
            return reply(categories.length ? '🗂️ *Kategori Aset*\n' + categories.map((c,i)=>`${i+1}. ${c}`).join('\n') : 'Belum ada kategori aset.');
          }
          case 'randomassets': {
            if (!await requireDatabase(sock, remoteJid)) return;
            const category = args.join(' ').trim();
            const filter = category ? { category: { $regex: category.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } } : {};
            const rows = await Asset.aggregate([{ $match: filter }, { $sample: { size: 1 } }]);
            if (!rows.length) return reply('Belum ada aset yang cocok.');
            const a = rows[0];
            await AssetAccess.create({ jid: userJid, assetId: a._id }).catch(()=>{});
            await Asset.updateOne({ _id: a._id }, { $inc: { views: 1 } });
            return reply(`🎲 *Rekomendasi Aset Acak*\n${a.title}\nKategori: ${a.category}\n${a.url}\n\nUntuk rekomendasi terkait gambar, fitur ini belum memakai AI; gunakan ${PREFIX}randomassets <kategori>.`);
          }
          case 'newassets': {
            if (!await requireDatabase(sock, remoteJid)) return;
            const assets = await Asset.find({}).sort({ createdAt: -1 }).limit(10).lean();
            return reply(assets.length ? '🆕 *Aset Terbaru*\n\n' + assets.map((a,i)=>`${i+1}. *${a.title}* [${a.category}]\nID: ${a._id}\n${a.url}`).join('\n\n') : 'Belum ada aset.');
          }
          case 'requestassets': {
            if (!await requireDatabase(sock, remoteJid)) return;
            const request = args.join(' ').trim();
            if (!request) return reply(`Contoh: ${PREFIX}requestassets texture pastel pink`);
            await Report.create({ groupJid: remoteJid, reporterJid: userJid, reason: `[REQUEST ASET] ${request}` });
            return reply('✅ Permintaan aset dicatat untuk ditinjau admin. Admin dapat melihatnya melalui .reports.');
          }

    default: return;
  }
}
