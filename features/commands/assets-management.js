// Extracted command module. Logic preserved from the original handler.
export const ASSETS_MANAGEMENT_COMMANDS = new Set(["addasset", "assetid", "assetsinfo", "assetsstats", "favoriteassets"]);
export async function handleAssetsManagementCommands(ctx) {
  const { makeWASocket, DisconnectReason, useMultiFileAuthState, jidNormalizedUser, fetchLatestBaileysVersion, downloadMediaMessage, Boom, qrcode, fs, path, execFile, promisify, sharp, webpmux, mongoose, GAME_LOCATIONS, GAME_MONSTERS, GAME_CLASSES, createInitialGameState, normalizeGameState, handleGameCommand, PREFIX, MONGO_URI, AUTH_DIR, TEMP_DIR, WELCOME_IMAGE, BACKUP_DIR, BACKUP_INTERVAL_HOURS, execFileAsync, MAX_IMAGE_BYTES, OWNER_JIDS_RAW, DEFAULT_GROUP_RULES, processedMessageIds, senderQueues, MESSAGE_DEDUPE_TTL_MS, MESSAGE_DEDUPE_MAX, rememberMessageId, serializeBySender, PartySchema, GuildSchema, AssetSchema, UserSchema, GroupSchema, FavoriteSchema, AssetAccessSchema, ReportSchema, TicketSchema, ModerationLogSchema, WarningSchema, Party, Guild, GuildWarSchema, GuildWar, MarketListingSchema, MarketListing, WorldBossSchema, WorldBoss, TerritorySchema, Territory, Asset, User, Group, Favorite, AssetAccess, Report, Ticket, Warning, ModerationLog, spamTracker, SPAM_WINDOW_MS, SPAM_MAX_MESSAGES, LINK_REGEX, logModeration, processGroupModeration, normalizeJid, ownerJidSet, ownerIdentityCandidates, isBotOwner, isGroupJid, unwrapMessage, getMessageText, getQuotedMessage, getImageTarget, downloadMedia, isGroupAdmin, isBotAdmin, sendText, requireDatabase, connectDatabase, addStickerPackMetadata, createDatabaseBackup, startBot, getDbReady, getReconnecting, sock, msg, remoteJid, isGroup, messageText, parts, command, args, sender, userJid, senderIdentityAliases, reply } = ctx;
  switch (command) {
          case 'favoriteassets': {
            if (!await requireDatabase(sock, remoteJid)) return;
            const sub = (args[0] || '').toLowerCase();
            if (sub === 'add') {
              const index = Number(args[1]);
              const recent = await Asset.find({}).sort({ createdAt: -1 }).limit(10).lean();
              const asset = recent[index-1];
              if (!asset) return reply(`Gunakan ${PREFIX}newassets lalu ${PREFIX}favoriteassets add <nomor 1-10>.`);
              await Favorite.updateOne({ jid: userJid, assetId: asset._id }, { $setOnInsert: { jid: userJid, assetId: asset._id } }, { upsert: true });
              return reply(`⭐ Aset "${asset.title}" disimpan sebagai favorit.`);
            }
            const favorites = await Favorite.find({ jid: userJid }).populate('assetId').sort({ createdAt: -1 }).limit(20).lean();
            return reply(favorites.length ? '⭐ *Aset Favorit*\n' + favorites.map((f,i)=>f.assetId ? `${i+1}. ${f.assetId.title}\n${f.assetId.url}` : '').filter(Boolean).join('\n\n') : `Belum ada favorit. Lihat .newassets, lalu gunakan .favoriteassets add <nomor>.`);
          }
          case 'assetid':
          case 'assetsinfo': {
            if (!await requireDatabase(sock, remoteJid)) return;
            const asset = await Asset.findById(args[0]).lean().catch(()=>null);
            if (!asset) return reply(`Gunakan ${PREFIX}assetsinfo <ID aset>. ID tersedia dari database/admin.`);
            const accesses = await AssetAccess.countDocuments({ assetId: asset._id });
            return reply(`📦 *Info Aset*\nNama: ${asset.title}\nKategori: ${asset.category}\nURL: ${asset.url}\nDilihat: ${asset.views || 0}\nRiwayat akses: ${accesses}\nDitambahkan: ${asset.createdAt ? new Date(asset.createdAt).toLocaleString('id-ID') : '-'}`);
          }
                    case 'assetsstats': {
            if (!await requireDatabase(sock, remoteJid)) return;
            const total = await Asset.countDocuments();
            const accesses = await AssetAccess.countDocuments({ jid: userJid });
            const uniqueViewed = await AssetAccess.distinct('assetId', { jid: userJid });
            const top = await Asset.find({}).sort({ views: -1 }).limit(5).lean();
            return reply(`📊 *Statistik Aset*\nTotal aset: ${total}\nAkses aset oleh kamu: ${accesses}\nAset unik yang pernah kamu akses: ${uniqueViewed.length}\n\n*Paling sering dilihat:*\n${top.map((a,i)=>`${i+1}. ${a.title} — ${a.views || 0} kali`).join('\n') || 'Belum ada data'}`);
          }
          case 'addasset': {
            if (!isGroup) return reply('Perintah ini hanya untuk grup.');
            if (!await isGroupAdmin(sock, remoteJid, sender)) return reply('❌ Hanya admin grup yang dapat menambahkan aset.');
            if (!await requireDatabase(sock, remoteJid)) return;
            const fields = args.join(' ').split('|').map(value => value.trim());
            if (fields.length < 3 || !fields[0] || !/^https?:\/\//i.test(fields[1])) return reply(`Format: ${PREFIX}addasset judul | https://tautan-aset | kategori`);
            await Asset.create({ title: fields[0].slice(0, 120), url: fields[1], category: fields[2].slice(0, 60), addedBy: userJid });
            return reply('✅ Aset berhasil ditambahkan ke Asset Library. Pastikan tautan dan lisensinya sesuai.');
          }

    default: return;
  }
}
