// Extracted command module. Logic preserved from the original handler.
export const MODERATION_ACTIONS_COMMANDS = new Set(["alltag", "clearwarn", "hidetag", "kick", "modlogs", "mute", "open", "polling", "warn", "warnings"]);
export async function handleModerationActionsCommands(ctx) {
  const { makeWASocket, DisconnectReason, useMultiFileAuthState, jidNormalizedUser, fetchLatestBaileysVersion, downloadMediaMessage, Boom, qrcode, fs, path, execFile, promisify, sharp, webpmux, mongoose, GAME_LOCATIONS, GAME_MONSTERS, GAME_CLASSES, createInitialGameState, normalizeGameState, handleGameCommand, PREFIX, MONGO_URI, AUTH_DIR, TEMP_DIR, WELCOME_IMAGE, BACKUP_DIR, BACKUP_INTERVAL_HOURS, execFileAsync, MAX_IMAGE_BYTES, OWNER_JIDS_RAW, DEFAULT_GROUP_RULES, processedMessageIds, senderQueues, MESSAGE_DEDUPE_TTL_MS, MESSAGE_DEDUPE_MAX, rememberMessageId, serializeBySender, PartySchema, GuildSchema, AssetSchema, UserSchema, GroupSchema, FavoriteSchema, AssetAccessSchema, ReportSchema, TicketSchema, ModerationLogSchema, WarningSchema, Party, Guild, GuildWarSchema, GuildWar, MarketListingSchema, MarketListing, WorldBossSchema, WorldBoss, TerritorySchema, Territory, Asset, User, Group, Favorite, AssetAccess, Report, Ticket, Warning, ModerationLog, spamTracker, SPAM_WINDOW_MS, SPAM_MAX_MESSAGES, LINK_REGEX, logModeration, processGroupModeration, normalizeJid, ownerJidSet, ownerIdentityCandidates, isBotOwner, isGroupJid, unwrapMessage, getMessageText, getQuotedMessage, getImageTarget, downloadMedia, isGroupAdmin, isBotAdmin, sendText, requireDatabase, connectDatabase, addStickerPackMetadata, createDatabaseBackup, startBot, getDbReady, getReconnecting, sock, msg, remoteJid, isGroup, messageText, parts, command, args, sender, userJid, senderIdentityAliases, reply } = ctx;
  switch (command) {
          case 'modlogs': {
            if (!isGroup) return reply('Perintah ini hanya bisa dipakai di grup.');
            if (!await isGroupAdmin(sock, remoteJid, sender)) return reply('❌ Khusus admin grup.');
            if (!await requireDatabase(sock, remoteJid)) return;
            const logs = await ModerationLog.find({ groupJid: remoteJid }).sort({ createdAt: -1 }).limit(10).lean();
            return reply(logs.length ? `📋 *Log Moderasi Terbaru*\n\n${logs.map((x, i) => `${i + 1}. ${x.action} — ${x.reason || '-'}\nAnggota: ${x.userJid ? '@' + x.userJid.split('@')[0] : '-'}\nWaktu: ${new Date(x.createdAt).toLocaleString('id-ID')}`).join('\n\n')}` : 'Belum ada log moderasi.');
          }
          case 'hidetag':
          case 'alltag': {
            if (!isGroup) return reply('Perintah ini hanya dapat digunakan di grup.');
            if (!await isGroupAdmin(sock, remoteJid, sender)) return reply('❌ Hanya admin grup yang dapat menggunakan perintah ini.');
            const metadata = await sock.groupMetadata(remoteJid);
            const participants = (metadata.participants || []).map(p => p.id).filter(Boolean);
            if (!participants.length) return reply('Tidak dapat membaca daftar anggota grup.');
            const announcement = args.join(' ').trim() || (command === 'hidetag' ? '📢 Pengumuman untuk semua anggota.' : '📢 Perhatian semua anggota!');
            if (command === 'hidetag') {
              // Mentions are attached as metadata; the message text itself contains no visible @mentions.
              return sock.sendMessage(remoteJid, { text: announcement, mentions: participants }, { quoted: msg });
            }
            const visibleTags = participants.map(jid => `@${jid.split('@')[0]}`).join(' ');
            const text = `${announcement}\n\n${visibleTags}`;
            return sock.sendMessage(remoteJid, { text: text.slice(0, 3900), mentions: participants }, { quoted: msg });
          }
                    case 'warn':
          case 'warnings':
          case 'clearwarn': {
            if (!isGroup) return reply('Perintah ini hanya dapat digunakan di grup.');
            if (!await isGroupAdmin(sock, remoteJid, sender)) return reply('❌ Hanya admin grup yang dapat menggunakan sistem peringatan.');
            if (!await requireDatabase(sock, remoteJid)) return;
            const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
            const quoted = getQuotedMessage(msg);
            const target = mentioned[0] || quoted?.key?.participant;
            if (!target) return reply(`Tag anggota atau balas pesannya.\nContoh: ${PREFIX}${command} @anggota [alasan]`);
            const targetJid = normalizeJid(target);
            if (command === 'warn') {
              const reason = args.filter(a => !/^@/.test(a)).join(' ').trim() || 'Tidak mematuhi aturan grup';
              const warning = await Warning.create({ groupJid: remoteJid, targetJid, adminJid: userJid, reason });
              const count = await Warning.countDocuments({ groupJid: remoteJid, targetJid });
              await logModeration(remoteJid, targetJid, 'WARN', reason, `Admin: ${userJid}; total peringatan: ${count}`);
              return reply(`⚠️ Peringatan dicatat untuk @${targetJid.split('@')[0]}.\nJumlah peringatan: ${count}\nAlasan: ${reason}\nID: ${warning._id}`, [target]);
            }
            if (command === 'warnings') {
              const rows = await Warning.find({ groupJid: remoteJid, targetJid }).sort({ createdAt: -1 }).limit(10).lean();
              return reply(rows.length ? `⚠️ *Riwayat Peringatan*\nAnggota: @${targetJid.split('@')[0]}\nTotal: ${await Warning.countDocuments({ groupJid: remoteJid, targetJid })}\n\n` + rows.map((w,i)=>`${i+1}. ${w.reason} — ${new Date(w.createdAt).toLocaleString('id-ID')}`).join('\n') : `Anggota @${targetJid.split('@')[0]} belum memiliki peringatan.`, [target]);
            }
            const result = await Warning.deleteMany({ groupJid: remoteJid, targetJid });
            await logModeration(remoteJid, targetJid, 'CLEAR_WARNINGS', 'Riwayat peringatan dihapus', `Admin: ${userJid}; total dihapus: ${result.deletedCount}`);
            return reply(`✅ Peringatan @${targetJid.split('@')[0]} dihapus. Total dihapus: ${result.deletedCount}.`, [target]);
          }
                    case 'kick': {
            if (!isGroup) return reply('Perintah ini hanya untuk grup.');
            if (!await isGroupAdmin(sock, remoteJid, sender)) return reply('❌ Hanya admin grup yang dapat mengeluarkan anggota.');
            if (!await isBotAdmin(sock, remoteJid)) return reply('❌ Jadikan bot sebagai admin terlebih dahulu.');
            const context = msg.message?.extendedTextMessage?.contextInfo;
            const mentioned = context?.mentionedJid || [];
            const quoted = getQuotedMessage(msg);
            const targetJid = mentioned[0] || quoted?.key?.participant;
            if (!targetJid) return reply(`Tag anggota atau balas pesannya.\nContoh: ${PREFIX}kick @anggota`);
            if (normalizeJid(targetJid) === normalizeJid(sock.user?.id)) return reply('Bot tidak bisa mengeluarkan dirinya sendiri.');
            await sock.groupParticipantsUpdate(remoteJid, [targetJid], 'remove');
            await logModeration(remoteJid, targetJid, 'KICK', 'Dikeluarkan oleh admin', `Admin: ${userJid}`);
            return reply('✅ Permintaan mengeluarkan anggota berhasil dikirim ke WhatsApp.');
          }
          case 'mute':
          case 'open': {
            if (!isGroup) return reply('Perintah ini hanya untuk grup.');
            if (!await isGroupAdmin(sock, remoteJid, sender)) return reply('❌ Hanya admin grup yang dapat menggunakan perintah ini.');
            if (!await isBotAdmin(sock, remoteJid)) return reply('❌ Jadikan bot sebagai admin terlebih dahulu.');
            await sock.groupSettingUpdate(remoteJid, command === 'mute' ? 'announcement' : 'not_announcement');
            await logModeration(remoteJid, userJid, command.toUpperCase(), command === 'mute' ? 'Grup dibatasi untuk admin' : 'Grup dibuka untuk semua anggota');
            return reply(command === 'mute' ? '🔒 Grup sekarang hanya dapat mengirim pesan oleh admin.' : '🔓 Grup dibuka, semua anggota dapat mengirim pesan.');
          }
                    case 'polling': {
            if (!isGroup) return reply('Perintah ini hanya untuk grup.');
            if (!await isGroupAdmin(sock, remoteJid, sender)) return reply('❌ Hanya admin grup yang dapat membuat polling.');
            const question = args.join(' ').trim();
            if (!question) return reply(`Contoh: ${PREFIX}polling Tema desain berikutnya?`);
            return sock.sendMessage(remoteJid, { poll: { name: question.slice(0, 250), values: ['GFX Anime', 'Poster', 'Logo'], selectableCount: 1 } }, { quoted: msg });
          }


    default: return;
  }
}
