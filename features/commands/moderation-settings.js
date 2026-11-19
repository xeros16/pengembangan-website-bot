// Extracted command module. Logic preserved from the original handler.
export const MODERATION_SETTINGS_COMMANDS = new Set(["antilink", "antispam", "antitoxic", "rules", "setrules", "welcome", "goodbye", "modstatus", "modpreset"]);

const MODERATION_PRESETS = Object.freeze({
  'proteksi-dasar': Object.freeze({ antiLink: true, antiSpam: true }),
  ramah: Object.freeze({ welcomeEnabled: true, goodbyeEnabled: true }),
  tenang: Object.freeze({ welcomeEnabled: false, goodbyeEnabled: false }),
});

const MODERATION_LABELS = Object.freeze({
  antiLink: 'Anti-link',
  antiSpam: 'Anti-spam',
  antiToxic: 'Filter kata',
  welcomeEnabled: 'Pesan welcome',
  goodbyeEnabled: 'Pesan goodbye',
});

const PRESET_PREVIEW_TTL_MS = 5 * 60 * 1000;
const pendingPresetPreviews = new Map();

async function readGroupSettings(Group, jid) {
  const query = Group.findOne({ jid });
  return typeof query?.lean === 'function' ? query.lean() : query;
}

function settingLabel(value) {
  return value === true ? 'AKTIF' : value === false ? 'NONAKTIF' : 'DEFAULT';
}

function presetHelp(prefix) {
  return [
    '🛡️ *GROUP SAFETY PRESETS*',
    `${prefix}modpreset preview proteksi-dasar — pratinjau anti-link + anti-spam ON.`,
    `${prefix}modpreset preview ramah — pratinjau welcome + goodbye ON.`,
    `${prefix}modpreset preview tenang — pratinjau welcome + goodbye OFF.`,
    `${prefix}modpreset apply <nama> konfirmasi — terapkan setelah meninjau pratinjau.`,
    '',
    'Preset hanya mengubah field yang disebutkan. Filter kata, aturan grup, dan pesan kustom tidak dihapus. Preview tidak mengubah database; konfirmasi harus berasal dari Admin yang sama dalam 5 menit dan akan ditolak jika field berubah.',
  ].join('\n');
}

async function handleModerationOverview(ctx) {
  const { Group, isGroup, remoteJid, requireDatabase, sock, reply, PREFIX = '.' } = ctx;
  if (!isGroup) return reply('Perintah ini hanya dapat digunakan di dalam grup.');
  if (!await requireDatabase(sock, remoteJid)) return;
  try {
    const current = await readGroupSettings(Group, remoteJid) || {};
    const blockedWords = Array.isArray(current.blockedWords) ? current.blockedWords.length : 0;
    return reply([
      '🛡️ *STATUS PROTEKSI GRUP*',
      `Anti-link: ${settingLabel(current.antiLink ?? true)}`,
      `Anti-spam: ${settingLabel(current.antiSpam ?? true)}`,
      `Filter kata: ${settingLabel(current.antiToxic ?? false)} (${blockedWords}/30 kata terdaftar)`,
      `Pesan welcome: ${settingLabel(current.welcomeEnabled ?? true)}`,
      `Pesan goodbye: ${settingLabel(current.goodbyeEnabled ?? false)}`,
      `Aturan grup: ${current.rules ? 'Tersimpan' : 'Menggunakan aturan bawaan'}`,
      '',
      `Pratinjau preset: ${PREFIX}modpreset preview proteksi-dasar`,
      'Ringkasan ini read-only; tidak ada pengaturan yang diubah.',
    ].join('\n'));
  } catch {
    return reply('⚠️ Status proteksi grup belum dapat dimuat.');
  }
}

async function handleModerationPreset(ctx) {
  const { Group, isGroup, remoteJid, sender, userJid, senderIdentityAliases = [], sock, isGroupAdmin, isBotOwner, requireDatabase, logModeration, reply, args = [], PREFIX = '.' } = ctx;
  if (!isGroup) return reply('Preset proteksi hanya dapat digunakan di dalam grup.');
  const action = String(args[0] || 'help').toLowerCase();
  if (['help', 'bantuan'].includes(action)) return reply(presetHelp(PREFIX));
  const presetName = String(args[1] || '').toLowerCase();
  const preset = MODERATION_PRESETS[presetName];
  if (!preset) return reply(`Preset tidak dikenal. Pilih: ${Object.keys(MODERATION_PRESETS).join(', ')}.\n${presetHelp(PREFIX)}`);
  if (!await requireDatabase(sock, remoteJid)) return;
  const isOwner = typeof isBotOwner === 'function' && isBotOwner(userJid, senderIdentityAliases);
  const isAdmin = typeof isGroupAdmin === 'function' && await isGroupAdmin(sock, remoteJid, sender);
  if (!isOwner && !isAdmin) return reply('⛔ Hanya Admin grup atau Owner bot yang dapat melihat pratinjau dan menerapkan preset.');
  let current;
  try {
    current = await readGroupSettings(Group, remoteJid) || {};
  } catch {
    return reply('⚠️ Pengaturan grup belum dapat dibaca.');
  }
  const changes = Object.entries(preset).map(([field, next]) => {
    const previous = current[field] ?? (field === 'antiLink' || field === 'antiSpam' || field === 'welcomeEnabled' ? true : false);
    return { field, previous, next };
  });
  const preview = [
    `🧾 *PRATINJAU PRESET: ${presetName.toUpperCase()}*`,
    ...changes.map(({ field, previous, next }) => `• ${MODERATION_LABELS[field]}: ${settingLabel(previous)} → ${settingLabel(next)}`),
    '',
    'Tidak ada perubahan yang disimpan pada tahap preview.',
  ].join('\n');
  const previewKey = `${remoteJid}:${userJid}:${presetName}`;
  const snapshot = JSON.stringify(changes.map(({ field, previous }) => [field, previous]));
  if (action === 'preview' || action === 'lihat') {
    const now = Date.now();
    for (const [key, value] of pendingPresetPreviews) {
      if (value.expiresAt <= now) pendingPresetPreviews.delete(key);
    }
    pendingPresetPreviews.set(previewKey, { snapshot, expiresAt: now + PRESET_PREVIEW_TTL_MS });
    while (pendingPresetPreviews.size > 200) pendingPresetPreviews.delete(pendingPresetPreviews.keys().next().value);
    return reply(`${preview}\n\nPratinjau berlaku 5 menit untuk Admin ini dan grup ini. Terapkan setelah meninjau: ${PREFIX}modpreset apply ${presetName} konfirmasi`);
  }
  if (action !== 'apply' || String(args[2] || '').toLowerCase() !== 'konfirmasi' || args.length !== 3) {
    return reply(`${preview}\n\nKonfirmasi penerapan: ${PREFIX}modpreset apply ${presetName} konfirmasi`);
  }
  const pending = pendingPresetPreviews.get(previewKey);
  if (!pending || pending.expiresAt <= Date.now()) {
    pendingPresetPreviews.delete(previewKey);
    return reply(`⏳ Belum ada pratinjau yang valid untuk preset ini. Jalankan ${PREFIX}modpreset preview ${presetName}, periksa perubahannya, lalu konfirmasi dalam 5 menit.`);
  }
  if (pending.snapshot !== snapshot) {
    pendingPresetPreviews.delete(previewKey);
    return reply(`⚠️ Pengaturan grup berubah sejak pratinjau. Jalankan ${PREFIX}modpreset preview ${presetName} lagi sebelum menerapkan.`);
  }
  try {
    await Group.findOneAndUpdate({ jid: remoteJid }, { $set: { jid: remoteJid, ...preset } }, { upsert: true, new: true, setDefaultsOnInsert: true });
    pendingPresetPreviews.delete(previewKey);
    if (typeof logModeration === 'function') {
      try { await logModeration(remoteJid, userJid, 'SETTING_PRESET_APPLIED', presetName); }
      catch (error) { console.warn('[MODERATION PRESET AUDIT]', error?.message || error); }
    }
    return reply(`✅ *PRESET ${presetName.toUpperCase()} DITERAPKAN*\n${changes.map(({ field, next }) => `• ${MODERATION_LABELS[field]}: ${settingLabel(next)}`).join('\n')}\n\nField lain, termasuk daftar kata dan aturan grup, tidak diubah.`);
  } catch {
    return reply('⚠️ Preset belum berhasil diterapkan. Pengaturan sebelumnya tetap dipertahankan.');
  }
}
export async function handleModerationSettingsCommands(ctx) {
  if (ctx.command === 'modstatus') return handleModerationOverview(ctx);
  if (ctx.command === 'modpreset') return handleModerationPreset(ctx);
  const { makeWASocket, DisconnectReason, useMultiFileAuthState, jidNormalizedUser, fetchLatestBaileysVersion, downloadMediaMessage, Boom, qrcode, fs, path, execFile, promisify, sharp, webpmux, mongoose, GAME_LOCATIONS, GAME_MONSTERS, GAME_CLASSES, createInitialGameState, normalizeGameState, handleGameCommand, PREFIX, MONGO_URI, AUTH_DIR, TEMP_DIR, WELCOME_IMAGE, BACKUP_DIR, BACKUP_INTERVAL_HOURS, execFileAsync, MAX_IMAGE_BYTES, OWNER_JIDS_RAW, DEFAULT_GROUP_RULES, processedMessageIds, senderQueues, MESSAGE_DEDUPE_TTL_MS, MESSAGE_DEDUPE_MAX, rememberMessageId, serializeBySender, PartySchema, GuildSchema, AssetSchema, UserSchema, GroupSchema, FavoriteSchema, AssetAccessSchema, ReportSchema, TicketSchema, ModerationLogSchema, WarningSchema, Party, Guild, GuildWarSchema, GuildWar, MarketListingSchema, MarketListing, WorldBossSchema, WorldBoss, TerritorySchema, Territory, Asset, User, Group, Favorite, AssetAccess, Report, Ticket, Warning, ModerationLog, spamTracker, SPAM_WINDOW_MS, SPAM_MAX_MESSAGES, LINK_REGEX, logModeration, processGroupModeration, normalizeJid, ownerJidSet, ownerIdentityCandidates, isBotOwner, isGroupJid, unwrapMessage, getMessageText, getQuotedMessage, getImageTarget, downloadMedia, isGroupAdmin, isBotAdmin, sendText, requireDatabase, connectDatabase, addStickerPackMetadata, createDatabaseBackup, startBot, getDbReady, getReconnecting, sock, msg, remoteJid, isGroup, messageText, parts, command, args, sender, userJid, senderIdentityAliases, reply } = ctx;
  switch (command) {
          case 'antitoxic': {
            if (!isGroup) return reply('Perintah ini hanya bisa dipakai di grup.');
            if (!await isGroupAdmin(sock, remoteJid, sender)) return reply('❌ Hanya admin grup yang bisa mengatur filter kata.');
            if (!await requireDatabase(sock, remoteJid)) return;
            const action = String(args[0] || 'status').toLowerCase();
            const current = await Group.findOneAndUpdate(
              { jid: remoteJid },
              { $setOnInsert: { jid: remoteJid } },
              { upsert: true, new: true, setDefaultsOnInsert: true },
            ).lean();
            const words = [...new Set((Array.isArray(current?.blockedWords) ? current.blockedWords : [])
              .map(value => String(value || '').normalize('NFKC').toLocaleLowerCase('id-ID').trim())
              .filter(value => /^[\p{L}\p{N}_-]{2,32}$/u.test(value)))];
            const usage = `Format: ${PREFIX}antitoxic on/off | daftar | tambah <kata> | hapus <kata> | reset`;
            if (['status', 'help', 'bantuan'].includes(action)) {
              return reply(`🛡️ *FILTER KATA GRUP*\nStatus: ${current?.antiToxic === true ? 'AKTIF' : 'NONAKTIF'}\nKata terdaftar: ${words.length}/30\nPencocokan hanya kata utuh; tidak memakai penilaian AI.\n\n${usage}`);
            }
            if (['daftar', 'list'].includes(action)) {
              return reply(words.length
                ? `🛡️ *DAFTAR KATA FILTER*\n${words.map((word, index) => `${index + 1}. ${word}`).join('\n')}\n\nStatus: ${current?.antiToxic === true ? 'AKTIF' : 'NONAKTIF'}`
                : `Belum ada kata yang didaftarkan.\n${usage}`);
            }
            if (action === 'on') {
              if (!words.length) return reply(`Tambahkan minimal satu kata sebelum mengaktifkan filter.\nContoh: ${PREFIX}antitoxic tambah spamkata`);
              await Group.findOneAndUpdate({ jid: remoteJid }, { $set: { antiToxic: true, blockedWords: words } }, { upsert: true });
              await logModeration(remoteJid, userJid, 'SETTING_CHANGED', 'antitoxic on');
              return reply('✅ Filter kata diaktifkan. Bot hanya mencocokkan kata utuh yang didaftarkan Admin.');
            }
            if (action === 'off') {
              await Group.findOneAndUpdate({ jid: remoteJid }, { $set: { antiToxic: false } }, { upsert: true });
              await logModeration(remoteJid, userJid, 'SETTING_CHANGED', 'antitoxic off');
              return reply('✅ Filter kata dinonaktifkan. Daftar kata tetap tersimpan untuk digunakan lagi.');
            }
            if (action === 'tambah' || action === 'add') {
              const word = String(args[1] || '').normalize('NFKC').toLocaleLowerCase('id-ID').trim();
              if (!/^[\p{L}\p{N}_-]{2,32}$/u.test(word)) return reply(`Kata harus satu token, 2–32 karakter, tanpa spasi atau simbol.\n${usage}`);
              if (words.includes(word)) return reply('Kata tersebut sudah ada di daftar filter.');
              if (words.length >= 30) return reply('Daftar filter sudah mencapai batas 30 kata. Hapus kata lama sebelum menambahkan yang baru.');
              const next = [...words, word];
              await Group.findOneAndUpdate({ jid: remoteJid }, { $set: { blockedWords: next } }, { upsert: true });
              await logModeration(remoteJid, userJid, 'SETTING_CHANGED', `antitoxic tambah (${word.length} karakter)`);
              return reply(`✅ Kata ditambahkan. Total: ${next.length}/30.\nFilter saat ini: ${current?.antiToxic === true ? 'AKTIF' : 'NONAKTIF'}; aktifkan dengan ${PREFIX}antitoxic on.`);
            }
            if (action === 'hapus' || action === 'remove') {
              const word = String(args[1] || '').normalize('NFKC').toLocaleLowerCase('id-ID').trim();
              if (!/^[\p{L}\p{N}_-]{2,32}$/u.test(word)) return reply(`Masukkan satu kata yang valid.\n${usage}`);
              if (!words.includes(word)) return reply('Kata tersebut tidak ditemukan di daftar filter.');
              const next = words.filter(item => item !== word);
              await Group.findOneAndUpdate({ jid: remoteJid }, { $set: { blockedWords: next, ...(next.length ? {} : { antiToxic: false }) } }, { upsert: true });
              await logModeration(remoteJid, userJid, 'SETTING_CHANGED', `antitoxic hapus (${word.length} karakter)`);
              return reply(`✅ Kata dihapus. Sisa: ${next.length}/30.${next.length ? '' : ' Filter otomatis dinonaktifkan karena daftar kosong.'}`);
            }
            if (['reset', 'hapussemua', 'clear'].includes(action)) {
              await Group.findOneAndUpdate({ jid: remoteJid }, { $set: { antiToxic: false, blockedWords: [] } }, { upsert: true });
              await logModeration(remoteJid, userJid, 'SETTING_CHANGED', 'antitoxic reset');
              return reply('✅ Filter kata dinonaktifkan dan seluruh daftar kata dihapus.');
            }
            return reply(usage);
          }
          case 'antilink':
          case 'antispam': {
            if (!isGroup) return reply('Perintah ini hanya bisa dipakai di grup.');
            if (!await isGroupAdmin(sock, remoteJid, sender)) return reply('❌ Hanya admin grup yang bisa mengubah pengaturan ini.');
            if (!await requireDatabase(sock, remoteJid)) return;
            const setting = args[0]?.toLowerCase();
            if (!['on', 'off'].includes(setting)) return reply(`Format: ${PREFIX}${command} on/off`);
            const field = command === 'antilink' ? 'antiLink' : 'antiSpam';
            await Group.findOneAndUpdate({ jid: remoteJid }, { $set: { jid: remoteJid, [field]: setting === 'on' } }, { upsert: true });
            await logModeration(remoteJid, userJid, 'SETTING_CHANGED', `${command} ${setting}`);
            return reply(`✅ ${command} sekarang *${setting.toUpperCase()}*.`);
          }
                    case 'welcome':
          case 'goodbye': {
            if (!isGroup) return reply('Perintah ini hanya bisa dipakai di grup.');
            if (!await isGroupAdmin(sock, remoteJid, sender)) return reply('❌ Hanya admin grup yang bisa mengubah pengaturan pesan anggota.');
            if (!await requireDatabase(sock, remoteJid)) return;
            const field = command === 'welcome' ? 'welcomeEnabled' : 'goodbyeEnabled';
            const messageField = command === 'welcome' ? 'welcomeMessage' : 'goodbyeMessage';
            const action = String(args[0] || '').toLowerCase();
            if (action === 'on' || action === 'off') {
              await Group.findOneAndUpdate({ jid: remoteJid }, { $set: { jid: remoteJid, [field]: action === 'on' } }, { upsert: true, setDefaultsOnInsert: true });
              await logModeration(remoteJid, userJid, 'SETTING_CHANGED', `${command} ${action}`);
              return reply(`✅ Pesan ${command === 'welcome' ? 'selamat datang' : 'perpisahan'} sekarang *${action.toUpperCase()}*.`);
            }
            if (action === 'teks') {
              const customText = args.slice(1).join(' ').trim();
              if (!customText) return reply(`Format: ${PREFIX}${command} teks <pesan>
Variabel: {name}, {group}, {rules}`);
              if (customText.length > 700) return reply('❌ Pesan maksimal 700 karakter.');
              await Group.findOneAndUpdate({ jid: remoteJid }, { $set: { jid: remoteJid, [messageField]: customText } }, { upsert: true, setDefaultsOnInsert: true });
              await logModeration(remoteJid, userJid, 'SETTING_CHANGED', `${command} custom message`);
              return reply(`✅ Teks ${command} berhasil disimpan. Variabel {name}, {group}, dan {rules} dapat digunakan.`);
            }
            if (action === 'reset') {
              await Group.findOneAndUpdate({ jid: remoteJid }, { $set: { jid: remoteJid, [messageField]: '' } }, { upsert: true, setDefaultsOnInsert: true });
              return reply(`✅ Teks ${command} dikembalikan ke pesan bawaan.`);
            }
            const current = await Group.findOne({ jid: remoteJid }).lean();
            return reply(`⚙️ *PENGATURAN ${command.toUpperCase()}*\nStatus: ${current?.[field] === false ? 'NONAKTIF' : current?.[field] === true ? 'AKTIF' : command === 'welcome' ? 'AKTIF (default)' : 'NONAKTIF (default)'}\nTeks khusus: ${current?.[messageField] ? 'ada' : 'tidak ada'}\n\n${PREFIX}${command} on/off\n${PREFIX}${command} teks <pesan>\n${PREFIX}${command} reset`);
          }
          case 'rules': {
            if (!isGroup) return reply('Perintah ini digunakan di grup.');
            if (!await requireDatabase(sock, remoteJid)) return;
            let group = await Group.findOneAndUpdate({ jid: remoteJid }, { $setOnInsert: { jid: remoteJid } }, { upsert: true, new: true, setDefaultsOnInsert: true });
            // Upgrade older records that still contain the previous placeholder rules.
            if (!group.rules || group.rules.trim() === 'Belum ada aturan grup.') {
              group.rules = DEFAULT_GROUP_RULES;
              await group.save();
            }
            return reply(`📜 *Aturan Grup*\n\n${group.rules}`);
          }
          case 'setrules': {
            if (!isGroup) return reply('Perintah ini hanya untuk grup.');
            if (!await isGroupAdmin(sock, remoteJid, sender)) return reply('❌ Hanya admin grup yang dapat mengubah aturan.');
            const rules = args.join(' ').trim();
            if (!rules) return reply(`Contoh: ${PREFIX}setrules Dilarang spam dan promosi tanpa izin.`);
            if (!await requireDatabase(sock, remoteJid)) return;
            await Group.findOneAndUpdate({ jid: remoteJid }, { $set: { rules }, $setOnInsert: { jid: remoteJid } }, { upsert: true, new: true });
            return reply('✅ Aturan grup berhasil diperbarui.');
          }

    default: return;
  }
}
