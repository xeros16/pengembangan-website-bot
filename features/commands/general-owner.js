// Owner panel dan editor konten berbasis teks aman.
import { handleContentEditorCommand } from '../content-editor.js';
import { addCustomAlias, listCustomAliases, removeCustomAlias } from '../command-aliases.js';
import { readBotSettings, updateBotSettings, renderBotSettings } from '../bot-settings.js';
import { readAccessList, addAllowedGroup, removeAllowedGroup, addAllowedContact, removeAllowedContact, setAllowedGroupProfile, setAllowedContactProfile, normalizeAccessJid, flushAccessListPersistence, searchAccessIdentities } from '../access-control.js';
export const GENERAL_OWNER_COMMANDS = new Set(["owner", "ownerhelp", "textlist", "textshow", "textedit", "textsave", "textcancel", "textbackups", "textrestore", "alias", "stats", "activity", "health", "groups", "reports", "tickets", "botconfig", "allowlist"]);
export async function handleGeneralOwnerCommands(ctx) {
  const { makeWASocket, DisconnectReason, useMultiFileAuthState, jidNormalizedUser, fetchLatestBaileysVersion, downloadMediaMessage, Boom, qrcode, fs, path, execFile, promisify, sharp, webpmux, mongoose, GAME_LOCATIONS, GAME_MONSTERS, GAME_CLASSES, createInitialGameState, normalizeGameState, handleGameCommand, PREFIX, MONGO_URI, AUTH_DIR, TEMP_DIR, WELCOME_IMAGE, BACKUP_DIR, BACKUP_INTERVAL_HOURS, execFileAsync, MAX_IMAGE_BYTES, OWNER_JIDS_RAW, DEFAULT_GROUP_RULES, processedMessageIds, senderQueues, MESSAGE_DEDUPE_TTL_MS, MESSAGE_DEDUPE_MAX, rememberMessageId, serializeBySender, PartySchema, GuildSchema, AssetSchema, UserSchema, GroupSchema, FavoriteSchema, AssetAccessSchema, ReportSchema, TicketSchema, ModerationLogSchema, WarningSchema, Party, Guild, GuildWarSchema, GuildWar, MarketListingSchema, MarketListing, WorldBossSchema, WorldBoss, TerritorySchema, Territory, Asset, User, Group, Favorite, AssetAccess, Report, Ticket, Warning, ModerationLog, spamTracker, SPAM_WINDOW_MS, SPAM_MAX_MESSAGES, LINK_REGEX, logModeration, processGroupModeration, normalizeJid, ownerJidSet, ownerIdentityCandidates, isBotOwner, isGroupJid, unwrapMessage, getMessageText, getQuotedMessage, getImageTarget, downloadMedia, isGroupAdmin, isBotAdmin, sendText, requireDatabase, connectDatabase, addStickerPackMetadata, createDatabaseBackup, startBot, getDbReady, getReconnecting, getWhatsAppConnectionState, sock, msg, remoteJid, isGroup, messageText, parts, command, args, sender, userJid, senderIdentityAliases, reply } = ctx;
  if (await handleContentEditorCommand(ctx)) return;
  if (['health', 'groups', 'reports', 'tickets'].includes(command)) {
    if (!isBotOwner(userJid, senderIdentityAliases)) return reply('⛔ Pusat kontrol sistem hanya untuk Owner bot.');
    const safeDate = value => value ? new Date(value).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Asia/Jakarta' }) : '-';
    try {
      if (command === 'health') {
        const memory = process.memoryUsage();
        const queueCount = senderQueues instanceof Map ? senderQueues.size : (senderQueues && typeof senderQueues === 'object' ? Object.keys(senderQueues).length : 0);
        const stateLabels = { 0: 'terputus', 1: 'terhubung', 2: 'menghubungkan', 3: 'memutuskan' };
        const dbState = mongoose?.connection?.readyState;
        const whatsappState = typeof getWhatsAppConnectionState === 'function'
          ? getWhatsAppConnectionState()
          : 'tidak tersedia';
        const databaseReady = Boolean(getDbReady());
        const whatsappReady = whatsappState === 'open';
        const whatsappLabels = { open: 'terhubung', close: 'terputus', connecting: 'menghubungkan', closing: 'memutuskan' };
        const whatsappLabel = whatsappLabels[whatsappState] || 'status tidak diketahui';
        const overallReady = databaseReady && whatsappReady;
        return reply(`🩺 *PEMERIKSAAN KESEHATAN BOT*\n\n` +
          `🚦 Kesiapan layanan: ${overallReady ? 'SIAP' : 'PERLU DIPERIKSA'}\n` +
          `📱 WhatsApp: ${whatsappLabel}\n` +
          `🗄️ Database: ${databaseReady ? 'siap' : 'belum siap'} (${stateLabels[dbState] || 'status tidak diketahui'})\n` +
          `🔄 Reconnect: ${getReconnecting() ? 'sedang mencoba' : 'tidak'}\n` + `⏱️ Uptime: ${Math.floor(process.uptime() / 3600)} jam ${Math.floor((process.uptime() % 3600) / 60)} menit\n` +
          `🧠 RAM proses: ${Math.round(memory.rss / 1024 / 1024)} MB (heap ${Math.round(memory.heapUsed / 1024 / 1024)}/${Math.round(memory.heapTotal / 1024 / 1024)} MB)\n` +
          `📬 Antrean pengirim aktif: ${queueCount}\n` + `🟩 Node.js: ${process.version}\n\n` +
          `Status koneksi tidak menjamin pengiriman pesan ke setiap penerima. Endpoint lokal: /health dan /ready.`);
      }
      if (!getDbReady()) return reply('⚠️ Database belum siap. Periksa koneksi MongoDB terlebih dahulu.');
      const limitRaw = Number.parseInt(args[0] || '10', 10);
      const limit = Number.isFinite(limitRaw) ? Math.min(15, Math.max(1, limitRaw)) : 10;
      if (command === 'groups') {
        const rows = await Group.find({}).sort({ updatedAt: -1 }).limit(limit).lean();
        if (!rows.length) return reply('💬 *GRUP TERSIMPAN*\n\nBelum ada konfigurasi grup di database.');
        const lines = rows.map((item, i) => `${i + 1}. ${item.jid}\n   Anti-link: ${item.antiLink ? 'aktif' : 'nonaktif'} • Anti-spam: ${item.antiSpam ? 'aktif' : 'nonaktif'}\n   Diperbarui: ${safeDate(item.updatedAt)}`);
        return reply(`💬 *GRUP TERSIMPAN*\nMenampilkan ${rows.length} grup (maks. ${limit})\n\n${lines.join('\n\n')}\n\nCatatan: daftar ini berasal dari konfigurasi grup di database, bukan daftar semua grup WhatsApp yang diikuti bot.`);
      }
      if (command === 'reports') {
        const action = String(args[0] || 'list').toLowerCase();
        if (action === 'tutup' || action === 'close') {
          const id = String(args[1] || '').trim();
          const resolution = String(args.slice(2).join(' ')).replace(/[\x00-\x1f\x7f]/g, ' ').trim().slice(0, 240);
          if (!id) return reply(`Format: ${PREFIX}reports tutup <ID> [catatan penyelesaian]`);
          const updated = await Report.findOneAndUpdate(
            { _id: id, status: 'open' },
            { $set: { status: 'closed', reviewedBy: userJid, reviewedAt: new Date(), resolution } },
            { new: true },
          );
          return reply(updated ? `✅ Laporan ${id} ditandai selesai.` : 'Laporan tidak ditemukan atau sudah ditutup.');
        }
        if (action === 'detail') {
          const id = String(args[1] || '').trim();
          if (!id) return reply(`Format: ${PREFIX}reports detail <ID>`);
          const item = await Report.findOne({ _id: id }).lean();
          if (!item) return reply('Laporan tidak ditemukan.');
          return reply(`🚩 *DETAIL LAPORAN*\nID: ${item._id}\nGrup: ${item.groupJid}\nStatus: ${item.status}\nPelapor: ${String(item.reporterName || 'Anggota').slice(0, 50)}\nTarget: ${item.targetJid ? 'Anggota yang dilaporkan' : '-'}\nAlasan: ${String(item.reason || '-').slice(0, 500)}\nCatatan: ${String(item.resolution || '-').slice(0, 240)}`);
        }
        const rows = await Report.find({ status: 'open' }).sort({ createdAt: -1 }).limit(limit).lean();
        if (!rows.length) return reply('📨 *LAPORAN TERBUKA*\n\nTidak ada laporan terbuka.');
        const lines = rows.map((item, i) => `${i + 1}. ID: *${item._id}*\n   Grup: ${item.groupJid}\n   Pelapor: ${String(item.reporterName || 'Anggota').slice(0, 50)}\n   Target: ${item.targetJid ? 'Anggota yang dilaporkan' : '-'}\n   Alasan: ${String(item.reason || '-').slice(0, 180)}\n   Dibuat: ${safeDate(item.createdAt)}`);
        return reply(`📨 *LAPORAN TERBUKA*\nMenampilkan ${rows.length} laporan (maks. ${limit})\n\n${lines.join('\n\n')}\n\nTutup: ${PREFIX}reports tutup <ID> [catatan]`);
      }
      const rows = await Ticket.find({ status: 'open' }).sort({ updatedAt: -1 }).limit(limit).lean();
      if (!rows.length) return reply('🎫 *TIKET TERBUKA*\n\nTidak ada tiket terbuka.');
      const lines = rows.map((item, i) => `${i + 1}. ID: *${item._id}*\n   Subjek: ${String(item.subject || 'Tanpa subjek').slice(0, 100)}\n   Grup: ${item.groupJid}\n   Pengguna: ${String(item.userName || 'Anggota').slice(0, 50)}\n   Pesan: ${(item.messages || []).length}\n   Diperbarui: ${safeDate(item.updatedAt)}`);
      return reply(`🎫 *TIKET TERBUKA*\nMenampilkan ${rows.length} tiket (maks. ${limit})\n\n${lines.join('\n\n')}\n\nBalas tiket dengan .ticket balas <ID> <pesan> sebagai Owner.`);
    } catch (error) {
      console.error(`[OWNER ${command.toUpperCase()}]`, error.stack || error.message);
      return reply(`❌ Data ${command} gagal dibaca. Periksa koneksi database dan log terminal.`);
    }
  }
  if (command === 'stats' || command === 'activity') {
    if (!isBotOwner(userJid, senderIdentityAliases)) return reply('⛔ Dashboard sistem hanya untuk Owner bot.');
    if (!getDbReady()) return reply('⚠️ Database belum siap. Statistik dan riwayat belum dapat dibaca.');
    const formatDate = value => value ? new Date(value).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Asia/Jakarta' }) : 'waktu tidak tersedia';
    if (command === 'stats') {
      try {
        const [users, groups, assets, openReports, openTickets, warnings, moderationLogs, topUsers] = await Promise.all([
          User.countDocuments({}), Group.countDocuments({}), Asset.countDocuments({}),
          Report.countDocuments({ status: 'open' }), Ticket.countDocuments({ status: 'open' }),
          Warning.countDocuments({}), ModerationLog.countDocuments({}),
          User.find({}).sort({ 'activity.messages': -1 }).limit(5).select({ jid: 1, 'activity.messages': 1, 'activity.level': 1 }).lean(),
        ]);
        const leaderboard = topUsers.length ? topUsers.map((item, index) => `${index + 1}. ${item.jid} — ${Number(item.activity?.messages || 0)} pesan • Lv.${Number(item.activity?.level || 1)}`).join('\n') : 'Belum ada aktivitas pengguna.';
        return reply(`📊 *DASHBOARD SISTEM PIR VISUALS*\n\n` +
          `👥 Pengguna terdata: *${users}*\n` + `💬 Grup terdata: *${groups}*\n` +
          `🎨 Aset tersimpan: *${assets}*\n` + `📨 Laporan terbuka: *${openReports}*\n` +
          `🎫 Tiket terbuka: *${openTickets}*\n` + `⚠️ Total peringatan: *${warnings}*\n` +
          `🛡️ Catatan moderasi: *${moderationLogs}*\n\n` +
          `🏅 *5 pengguna paling aktif*\n${leaderboard}\n\n` +
          `Database: ${getDbReady() ? 'terhubung' : 'tidak siap'} • Memori: ${Math.round(process.memoryUsage().rss / 1024 / 1024)} MB\n` +
          `Riwayat moderasi: ${PREFIX}activity [jumlah]`);
      } catch (error) {
        console.error('[OWNER STATS]', error.stack || error.message);
        return reply('❌ Statistik gagal dibaca. Periksa koneksi database dan log terminal.');
      }
    }
    const requested = Number.parseInt(args[0] || '5', 10);
    const limit = Number.isFinite(requested) ? Math.min(10, Math.max(1, requested)) : 5;
    try {
      const rows = await ModerationLog.find({}).sort({ createdAt: -1 }).limit(limit).lean();
      if (!rows.length) return reply('🛡️ *RIWAYAT MODERASI*\n\nBelum ada catatan moderasi di database.');
      const lines = rows.map((item, index) => `${index + 1}. *${item.action || 'AKSI'}*\n   Grup: ${item.groupJid}\n   Anggota: ${item.userJid || '-'}\n   Alasan: ${item.reason || '-'}\n   Waktu: ${formatDate(item.createdAt)}`);
      return reply(`🛡️ *RIWAYAT MODERASI TERBARU*\nMenampilkan ${rows.length} dari maksimal ${limit} catatan\n\n${lines.join('\n\n')}\n\nGunakan ${PREFIX}activity 10 untuk menampilkan hingga 10 catatan.`);
    } catch (error) {
      console.error('[OWNER ACTIVITY]', error.stack || error.message);
      return reply('❌ Riwayat moderasi gagal dibaca. Periksa log terminal.');
    }
  }
  if (command === 'allowlist') {
    if (!isBotOwner(userJid, senderIdentityAliases)) return reply('⛔ Pengaturan allowlist hanya untuk Owner bot.');
    const [scope, action, value] = args;
    const list = readAccessList();
    const showGroups = list.groups.length ? list.groups.map((jid, i) => {
      const p = list.groupProfiles?.[jid] || {};
      return `${i + 1}. *${p.alias || p.waName || '(Belum diberi nama)'}*\\n   Nama WhatsApp: ${p.waName || '-'}\\n   ID: ${jid}${p.note ? `\\n   Catatan: ${p.note}` : ''}`;
    }).join('\\n') : 'Belum ada grup yang diizinkan.';
    const showContacts = list.contacts.length ? list.contacts.map((jid, i) => {
      const p = list.contactProfiles?.[jid] || {};
      return `${i + 1}. *${p.alias || p.waName || '(Belum diberi nama)'}*\\n   Nama WhatsApp: ${p.waName || '-'}\\n   Kontak: ${jid}${p.note ? `\\n   Catatan: ${p.note}` : ''}`;
    }).join('\\n') : 'Belum ada kontak yang diizinkan.';
    if (!scope || scope === 'list' || scope === 'status') {
      return reply(`🔐 *ACCESS MANAGER*\\nStatus: ${list.enabled ? 'AKTIF (default deny)' : 'NONAKTIF'}\\n\\n💬 *Grup diizinkan (${list.groups.length})*\\n${showGroups}\\n\\n👤 *Kontak diizinkan (${list.contacts.length})*\\n${showContacts}\\n\\n*Perintah:*\\n• ${PREFIX}allowlist group add <JID-grup> — izinkan grup dari chat pribadi\\n• ${PREFIX}allowlist group remove <JID-grup> — cabut grup dari chat pribadi\\n• ${PREFIX}allowlist group name <alias> — beri nama grup ini\\n• ${PREFIX}allowlist group note <catatan> — catatan grup ini\\n• ${PREFIX}allowlist contact add <nomor> — izinkan kontak\\n• ${PREFIX}allowlist contact remove <nomor> — cabut kontak\\n• ${PREFIX}allowlist contact name <nomor> <alias> — beri nama kontak\\n• ${PREFIX}allowlist contact note <nomor> <catatan> — catatan kontak\\n• ${PREFIX}allowlist search <kata> — cari alias, nama, ID, atau catatan\\n• ${PREFIX}allowlist search group <kata> — cari grup\\n• ${PREFIX}allowlist search contact <kata> — cari kontak\\n• ${PREFIX}allowlist list — lihat semua identitas`);
    }
    if (scope === 'search') {
      const requestedType = ['group', 'contact', 'kontak'].includes(String(action || '').toLowerCase())
        ? (String(action).toLowerCase() === 'group' ? 'group' : 'contact')
        : 'all';
      const query = args.slice(requestedType === 'all' ? 1 : 2).join(' ').trim();
      if (!query) return reply(`Format: ${PREFIX}allowlist search <kata kunci>\\nOpsional: ${PREFIX}allowlist search group <kata kunci> atau contact <kata kunci>.`);
      const results = searchAccessIdentities(query, { type: requestedType, limit: 10 });
      if (!results.length) return reply(`🔎 Tidak ada identitas allowlist yang cocok dengan “${query.slice(0, 80)}”.`);
      const lines = results.map((entry, index) => {
        const label = entry.alias || entry.waName || '(Belum diberi nama)';
        const typeLabel = entry.type === 'group' ? 'GRUP' : 'KONTAK';
        const nameLine = entry.waName && entry.waName !== label ? `\\n   Nama WhatsApp: ${entry.waName}` : '';
        const noteLine = entry.note ? `\\n   Catatan: ${entry.note.slice(0, 100)}` : '';
        return `${index + 1}. *${label}* [${typeLabel}]\\n   ID: ${entry.jid}${nameLine}${noteLine}`;
      });
      return reply(`🔎 *HASIL PENCARIAN ALLOWLIST*\\nKata kunci: ${query.slice(0, 80)}\\nHasil ditampilkan: ${results.length} (maks. 10)\\n\\n${lines.join('\\n\\n')}`);
    }
    if (scope === 'group') {
      const requestedJid = args.slice(2).join(' ').trim();
      const targetGroupJid = requestedJid || (isGroup ? remoteJid : '');
      if (action === 'add' || action === 'remove') {
        if (!targetGroupJid) return reply(`Format: ${PREFIX}allowlist group ${action} <JID-grup> (atau jalankan tanpa JID dari dalam grup).`);
        const result = action === 'add' ? addAllowedGroup(targetGroupJid) : removeAllowedGroup(targetGroupJid);
        if (result.ok && action === 'add') {
          try {
            const metadata = await sock.groupMetadata(targetGroupJid);
            setAllowedGroupProfile(targetGroupJid, { waName: metadata.subject || '' });
          } catch {}
        }
        const saved = result.ok ? await flushAccessListPersistence() : null;
        const storageNote = saved?.ok ? ' Tersimpan di file lokal dan MongoDB.' : ' Tersimpan lokal; sinkronisasi MongoDB belum terkonfirmasi.';
        return reply(result.ok ? `✅ Akses grup ${action === 'add' ? 'diizinkan' : 'dicabut'}: ${targetGroupJid}${result.changed === false ? ' (sudah terdaftar)' : ''}.${storageNote}` : `❌ ${result.message}`);
      }
      if (action === 'name' || action === 'note') {
        const target = isGroup ? remoteJid : normalizeAccessJid(args[2]);
        const text = (isGroup ? args.slice(2) : args.slice(3)).join(' ').trim();
        if (!target?.endsWith('@g.us')) return reply(`Format: ${PREFIX}allowlist group ${action} <JID-grup> <teks> atau jalankan di grup.`);
        if (!text) return reply(`Format: ${PREFIX}allowlist group ${action} <teks>`);
        let waName = '';
        if (action === 'name') {
          try { waName = (await sock.groupMetadata(target)).subject || ''; } catch {}
        }
        const result = setAllowedGroupProfile(target, action === 'name' ? { alias: text, waName } : { note: text });
        if (result.ok) await flushAccessListPersistence();
        return reply(result.ok ? `✅ Identitas grup disimpan.\\nAlias: ${action === 'name' ? text : (result.list.groupProfiles[target]?.alias || '-')}\\nID: ${target}` : `❌ ${result.message}`);
      }
    }
    if (scope === 'contact') {
      if (action === 'add' || action === 'remove') {
        if (!value) return reply(`Format: ${PREFIX}allowlist contact ${action} 628123456789`);
        const result = action === 'add' ? addAllowedContact(value) : removeAllowedContact(value);
        if (result.ok && action === 'add') {
          const contactJid = normalizeAccessJid(value);
          const contact = sock?.store?.contacts?.[contactJid] || {};
          const waName = contact.name || contact.notify || contact.verifiedName || '';
          if (waName) setAllowedContactProfile(contactJid, { waName });
        }
        const saved = result.ok ? await flushAccessListPersistence() : null;
        return reply(result.ok ? `✅ Akses kontak ${value} ${action === 'add' ? 'diizinkan' : 'dicabut'}.${saved?.ok ? ' Tersimpan di MongoDB.' : ' Sinkronisasi database belum terkonfirmasi.'}` : `❌ ${result.message}`);
      }
      if (action === 'name' || action === 'note') {
        const jid = value;
        const text = args.slice(3).join(' ').trim();
        if (!jid || !text) return reply(`Format: ${PREFIX}allowlist contact ${action} <nomor> <teks>`);
        const contactJid = normalizeAccessJid(jid);
        const contact = sock?.store?.contacts?.[contactJid] || {};
        const waName = contact.name || contact.notify || contact.verifiedName || '';
        const result = setAllowedContactProfile(jid, action === 'name' ? { alias: text, ...(waName ? { waName } : {}) } : { note: text });
        if (result.ok) await flushAccessListPersistence();
        return reply(result.ok ? `✅ Identitas kontak disimpan.\\nAlias: ${action === 'name' ? text : 'diperbarui'}\\nKontak: ${jid}` : `❌ ${result.message}`);
      }
    }
    return reply(`Format allowlist tidak dikenali. Ketik ${PREFIX}allowlist untuk melihat panduan.`);
  }
  if (command === 'botconfig') {
    if (!isBotOwner(userJid, senderIdentityAliases)) return reply('⛔ Pengaturan bot hanya dapat diubah Owner.');
    const [section, value] = args;
    if (!section) return reply(renderBotSettings());
    if (section === 'maintenance') {
      if (!['on', 'off'].includes(String(value || '').toLowerCase())) return reply(`Format: ${PREFIX}botconfig maintenance on/off`);
      const settings = updateBotSettings({ maintenanceMode: value.toLowerCase() === 'on' });
      return reply(`✅ Mode pemeliharaan ${settings.maintenanceMode ? 'diaktifkan' : 'dinonaktifkan'}.

${renderBotSettings(settings)}`);
    }
    if (section === 'notice') {
      const notice = args.slice(1).join(' ').trim();
      if (!notice) return reply(`Format: ${PREFIX}botconfig notice <pesan>
Atau: ${PREFIX}botconfig notice reset`);
      const settings = updateBotSettings({ maintenanceNotice: notice.toLowerCase() === 'reset' ? 'Bot sedang dalam pemeliharaan. Silakan coba lagi nanti.' : notice });
      return reply(`✅ Pesan pemeliharaan diperbarui.

${renderBotSettings(settings)}`);
    }
    return reply(`Bagian tidak dikenal. Gunakan ${PREFIX}botconfig untuk melihat bantuan.`);
  }
  if (command === 'alias') {
    if (!isBotOwner(userJid, senderIdentityAliases)) return reply('⛔ Pengelolaan pintasan hanya untuk Owner bot.');
    const [action, alias, target] = args;
    if (action === 'add') {
      if (!alias || !target) return reply(`Format: ${PREFIX}alias add <pintasan> <perintah>\nContoh: ${PREFIX}alias add kontras contrast`);
      const result = addCustomAlias(alias, target, ctx.commandNames || []);
      return reply(result.ok ? `✅ Pintasan ${PREFIX}${result.alias} → ${PREFIX}${result.target} berhasil disimpan dan langsung aktif.` : `❌ ${result.message}`);
    }
    if (action === 'remove' || action === 'hapus') {
      if (!alias) return reply(`Format: ${PREFIX}alias remove <pintasan>`);
      const result = removeCustomAlias(alias);
      return reply(result.ok ? `✅ Pintasan ${PREFIX}${result.alias} berhasil dihapus.` : `❌ ${result.message}`);
    }
    const rows = listCustomAliases();
    return reply(`🧩 *PENGELOLA PINTASAN*\n\n${rows.length ? rows.map(([key, value]) => `• ${PREFIX}${key} → ${PREFIX}${value}`).join('\n') : 'Belum ada pintasan khusus.'}\n\nTambah: ${PREFIX}alias add <nama> <perintah>\nHapus: ${PREFIX}alias remove <nama>\nDaftar perintah: ${PREFIX}commands\n\nPintasan tersimpan di config/command-aliases.json.`);
  }
  switch (command) {
          case 'owner':
          case 'ownerhelp': {
            if (!isBotOwner(userJid, senderIdentityAliases)) return reply('⛔ Perintah ini khusus Owner bot. Status admin grup tidak memberikan akses Owner.');
            return reply(
              `👑 *PANEL OWNER PIR VISUALS*\n\n` +
              `Owner terverifikasi: ${userJid}\n` +
              `Database: ${getDbReady() ? 'terhubung' : 'tidak siap'}\n` +
              `Node.js: ${process.version} • Uptime: ${Math.floor(process.uptime() / 3600)} jam ${Math.floor((process.uptime() % 3600) / 60)} menit\n` +
              `Memori proses: ${Math.round(process.memoryUsage().rss / 1024 / 1024)} MB\n\n` +
              `🔐 *Perintah khusus Owner*\n` +
              `• ${PREFIX}owner — tampilkan panel Owner\n` +
              `• ${PREFIX}backup — buat cadangan database\n` +
              `• ${PREFIX}textlist / textedit / textsave — kelola teks bot\n` +
              `• ${PREFIX}textbackups / textrestore <nomor> — pulihkan teks\n` +
              `• ${PREFIX}alias — kelola pintasan perintah\n` +
              `• ${PREFIX}alias add <nama> <perintah> — tambah pintasan\n` +
              `• ${PREFIX}alias remove <nama> — hapus pintasan\n` +
              `• ${PREFIX}botconfig — lihat pengaturan runtime\n` +
              `• ${PREFIX}allowlist — kelola grup dan kontak yang diizinkan\n` +
              `• ${PREFIX}botconfig maintenance on/off — aktifkan/nonaktifkan mode pemeliharaan\n` +
              `• ${PREFIX}botconfig notice <pesan> — ubah pesan pemeliharaan\n` +
              `• ${PREFIX}stats — statistik pengguna, grup, aset, laporan, dan tiket\n` +
              `• ${PREFIX}activity [jumlah] — riwayat moderasi terbaru\n` +
              `• ${PREFIX}health — pemeriksaan status proses dan database\n` +
              `• ${PREFIX}groups [jumlah] — konfigurasi grup tersimpan\n` +
              `• ${PREFIX}reports [jumlah] — laporan yang masih terbuka\n` +
              `• ${PREFIX}tickets [jumlah] — tiket bantuan yang masih terbuka\n\n` +
              `Owner ditentukan lewat OWNER_JIDS di file .env. Tidak ada command chat untuk mengangkat Owner baru.\n` +
              `Perintah moderasi grup tetap mengikuti izin admin grup.`
            );
          }
          
    default: return;
  }
}
