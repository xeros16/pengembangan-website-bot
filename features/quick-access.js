import { COMMAND_CATALOG } from './command-catalog.js';
import { normalizeShortCommand } from './command-aliases.js';

const MAX_FAVORITES = 8;
const MAX_RECENT = 8;
const CACHE_TTL_MS = 5 * 60 * 1000;
const MAX_CACHE_ENTRIES = 5000;
const cache = new Map();

const NAVIGATION_COMMANDS = new Set([
  'cepat', 'help', 'menu', 'tutorial', 'mulai', 'bantuan', 'tools', 'akun',
  'panduan', 'alur', 'kebutuhan', 'commands', 'perintah', 'daftarperintah',
  'cari', 'cmd', 'c', 'h', 'm', 'ak',
]);

const cleanCommand = value => normalizeShortCommand(String(value || '').trim()
  .replace(/^[^\p{L}\p{N}]+/u, '').split(/\s+/)[0].toLocaleLowerCase('id-ID'));

function identityOf(ctx) {
  return String(ctx?.userJid || ctx?.phoneJid || ctx?.sender || '').trim();
}

function databaseReady(ctx) {
  try {
    if (typeof ctx?.getDbReady === 'function') return Boolean(ctx.getDbReady());
    return Boolean(ctx?.dbReady);
  } catch { return false; }
}

function isPublicCommand(command) {
  const entry = COMMAND_CATALOG.find(item => item.command === command);
  if (!entry || NAVIGATION_COMMANDS.has(command)) return false;
  return String(entry.permission || '').trim().toLocaleLowerCase('id-ID').startsWith('anggota');
}


function cacheData(identity, data, persisted) {
  if (!identity) return;
  cache.delete(identity);
  cache.set(identity, { data, persisted, cachedAt: Date.now() });
  while (cache.size > MAX_CACHE_ENTRIES) cache.delete(cache.keys().next().value);
}

function normalizeData(value = {}) {
  value = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  const favorites = [...new Set(
    (Array.isArray(value.favorites) ? value.favorites : [])
      .map(cleanCommand).filter(isPublicCommand),
  )].slice(0, MAX_FAVORITES);

  const seen = new Set();
  const recent = [];
  for (const item of Array.isArray(value.recent) ? value.recent : []) {
    const command = cleanCommand(typeof item === 'string' ? item : item?.command);
    if (!isPublicCommand(command) || seen.has(command)) continue;
    seen.add(command);
    recent.push({ command, usedAt: Number.isFinite(Number(item?.usedAt)) ? Number(item.usedAt) : 0 });
    if (recent.length >= MAX_RECENT) break;
  }

  return {
    version: 1, favorites, recent,
    historyEnabled: value.historyEnabled === true,
    updatedAt: Number(value.updatedAt) || Date.now(),
  };
}

async function loadData(ctx) {
  const jid = identityOf(ctx);
  if (!jid) return { data: normalizeData(), persisted: false, identity: '' };

  const cached = cache.get(jid);
  if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
    return { data: normalizeData(cached.data), persisted: cached.persisted, identity: jid };
  }

  if (databaseReady(ctx) && ctx?.User?.findOne) {
    try {
      let query = ctx.User.findOne({ jid });
      if (query?.select) query = query.select('preferences.quickAccess');
      if (query?.lean) query = query.lean();
      const user = await query;
      const data = normalizeData(user?.preferences?.quickAccess);
      cacheData(jid, data, true);
      return { data, persisted: true, identity: jid };
    } catch (error) {
      console.warn('[QUICK ACCESS] Tidak dapat membaca preferensi:', error.message);
    }
  }

  const data = normalizeData(cached?.data);
  cacheData(jid, data, false);
  return { data, persisted: false, identity: jid };
}

async function saveData(ctx, identity, data, previouslyPersisted = false) {
  const normalized = normalizeData({ ...data, updatedAt: Date.now() });
  let persisted = previouslyPersisted;

  if (databaseReady(ctx) && ctx?.User?.updateOne && identity) {
    try {
      await ctx.User.updateOne(
        { jid: identity },
        { $set: { 'preferences.quickAccess': normalized } },
        { upsert: true },
      );
      persisted = true;
    } catch (error) {
      persisted = false;
      console.warn('[QUICK ACCESS] Tidak dapat menyimpan preferensi:', error.message);
    }
  } else persisted = false;

  cacheData(identity, normalized, persisted);
  return { data: normalized, persisted };
}

function storageNote(persisted) {
  return persisted
    ? 'Tersimpan di akunmu dan dapat digunakan kembali setelah bot dimulai ulang.'
    : 'Tersimpan sementara di memori bot. Hubungkan MongoDB agar pengaturan bertahan setelah bot dimulai ulang.';
}

export async function handleQuickAccessCommand(ctx) {
  const prefix = ctx.PREFIX || '.';
  if (ctx.isGroup === true) {
    return ctx.reply(`🔒 Akses cepat berisi preferensi pribadimu. Gunakan ${prefix}cepat melalui chat pribadi dengan bot agar favorit dan riwayat tidak terlihat anggota grup.`);
  }
  const args = Array.isArray(ctx.args) ? ctx.args : [];
  const action = String(args[0] || 'lihat').toLocaleLowerCase('id-ID');
  const { data, persisted, identity } = await loadData(ctx);

  if (!identity) return ctx.reply('Aku belum dapat mengenali akun pengirim. Periksa identitas WhatsApp lalu coba lagi.');

  if (['help', 'bantuan'].includes(action)) {
    return ctx.reply([
      '⚡ *AKSES CEPAT PIR VISUALS*', '',
      `${prefix}cepat — lihat favorit dan perintah terakhir.`,
      `${prefix}cepat tambah <perintah> — simpan perintah favorit.`,
      `${prefix}cepat hapus <perintah> — hapus satu favorit.`,
      `${prefix}cepat riwayat aktif — izinkan penyimpanan nama perintah terakhir.`,
      `${prefix}cepat riwayat nonaktif — hentikan pencatatan perintah terakhir.`,
      `${prefix}cepat riwayat lihat — lihat riwayat yang tersimpan.`,
      `${prefix}cepat riwayat hapus — hapus riwayat.`,
      `${prefix}cepat reset — hapus favorit dan riwayat serta nonaktifkan pencatatan.`,
      '',
      'Privasi: riwayat bersifat opsional. Bot hanya menyimpan nama perintah, bukan isi pesan, argumen, atau media.',
    ].join('\n'));
  }

  if (['tambah', 'add', 'favorit', 'favorite'].includes(action)) {
    const command = cleanCommand(args[1]);
    if (!command) return ctx.reply(`Format: ${prefix}cepat tambah <perintah>\nContoh: ${prefix}cepat tambah contrast`);
    if (!isPublicCommand(command)) return ctx.reply(`Perintah *${command}* tidak tersedia untuk disimpan. Pilih perintah publik dari ${prefix}commands.`);
    if (data.favorites.includes(command)) return ctx.reply(`⭐ *${prefix}${command}* sudah ada di daftar favoritmu.`);
    if (data.favorites.length >= MAX_FAVORITES) return ctx.reply(`Daftar favorit mencapai ${MAX_FAVORITES} perintah. Hapus satu dulu dengan ${prefix}cepat hapus <perintah>.`);
    const saved = await saveData(ctx, identity, { ...data, favorites: [...data.favorites, command] }, persisted);
    return ctx.reply(`⭐ *${prefix}${command}* ditambahkan ke akses cepat.\n\n${storageNote(saved.persisted)}`);
  }

  if (['hapus', 'remove', 'delete'].includes(action)) {
    const command = cleanCommand(args[1]);
    if (!command) return ctx.reply(`Format: ${prefix}cepat hapus <perintah>`);
    if (!data.favorites.includes(command)) return ctx.reply(`*${prefix}${command}* tidak ada di daftar favorit.`);
    const saved = await saveData(ctx, identity, { ...data, favorites: data.favorites.filter(item => item !== command) }, persisted);
    return ctx.reply(`🗑️ *${prefix}${command}* dihapus dari favorit.\n\n${storageNote(saved.persisted)}`);
  }

  if (['riwayat', 'history', 'recent'].includes(action)) {
    const setting = String(args[1] || 'status').toLocaleLowerCase('id-ID');
    if (['aktif', 'on', 'enable', 'nyalakan'].includes(setting)) {
      const saved = await saveData(ctx, identity, { ...data, historyEnabled: true }, persisted);
      return ctx.reply(`🕘 Riwayat perintah *diaktifkan*.\nBot hanya menyimpan nama perintah publik, tanpa argumen, isi pesan, atau media. Maksimal ${MAX_RECENT} perintah terakhir disimpan.\n\n${storageNote(saved.persisted)}`);
    }
    if (['nonaktif', 'off', 'disable', 'matikan'].includes(setting)) {
      const saved = await saveData(ctx, identity, { ...data, historyEnabled: false }, persisted);
      return ctx.reply(`🔕 Riwayat perintah *dinonaktifkan*. Riwayat lama tetap tersimpan sampai kamu menghapusnya.\n\n${storageNote(saved.persisted)}`);
    }
    if (['hapus', 'clear', 'delete'].includes(setting)) {
      const saved = await saveData(ctx, identity, { ...data, recent: [] }, persisted);
      return ctx.reply(`🧹 Riwayat perintah sudah dihapus.\n\n${storageNote(saved.persisted)}`);
    }
    const rows = data.historyEnabled && data.recent.length
      ? data.recent.map((item, index) => `${index + 1}. ${prefix}${item.command}`).join('\n')
      : 'Belum ada riwayat yang ditampilkan.';
    return ctx.reply(`🕘 *PENGATURAN RIWAYAT PERINTAH*\n\nStatus: *${data.historyEnabled ? 'Aktif' : 'Nonaktif'}*\n\n${rows}\n\nAktifkan: ${prefix}cepat riwayat aktif\nNonaktifkan: ${prefix}cepat riwayat nonaktif\nHapus data: ${prefix}cepat riwayat hapus\n\nRiwayat hanya berisi nama perintah, bukan argumen atau isi pesan.`);
  }

  if (['reset', 'bersihkan', 'clear'].includes(action)) {
    const saved = await saveData(ctx, identity, { favorites: [], recent: [], historyEnabled: false }, persisted);
    return ctx.reply(`♻️ Akses cepat direset. Semua favorit dan riwayat dihapus, pencatatan riwayat dinonaktifkan.\n\n${storageNote(saved.persisted)}`);
  }

  const favoriteRows = data.favorites.length
    ? data.favorites.map(command => `• *${prefix}${command}* — ${COMMAND_CATALOG.find(item => item.command === command)?.description || 'Buka fitur ini.'}`).join('\n')
    : `Belum ada favorit. Simpan dengan ${prefix}cepat tambah <perintah>.`;
  const recentRows = data.historyEnabled
    ? (data.recent.length ? data.recent.map((item, index) => `${index + 1}. ${prefix}${item.command}`).join('\n') : 'Belum ada perintah tercatat.')
    : `Nonaktif. Aktifkan secara sukarela dengan ${prefix}cepat riwayat aktif.`;

  return ctx.reply([
    '⚡ *AKSES CEPAT PIR VISUALS*', '',
    `⭐ *FAVORIT (${data.favorites.length}/${MAX_FAVORITES})*`, favoriteRows, '',
    `🕘 *TERAKHIR DIGUNAKAN (${data.historyEnabled ? 'AKTIF' : 'NONAKTIF'})*`, recentRows, '',
    `Tambah: ${prefix}cepat tambah <perintah>`,
    `Hapus: ${prefix}cepat hapus <perintah>`,
    `Pengaturan riwayat: ${prefix}cepat riwayat`,
    `Bantuan: ${prefix}cepat bantuan`, '',
    'Privasi: riwayat nonaktif sampai kamu mengaktifkannya; jika aktif, hanya nama perintah yang disimpan; bot tidak menyimpan isi pesan, argumen, atau media.',
    'Perintah favorit hanya ditampilkan sebagai pintasan. Bot tidak menjalankan perintah secara otomatis.',
  ].join('\n'));
}

/** Stores a public command name only; arguments, messages and media are never stored. */
export async function recordRecentCommand(ctx, commandInput) {
  const command = cleanCommand(commandInput);
  if (!isPublicCommand(command)) return false;
  const { data, persisted, identity } = await loadData(ctx);
  if (!identity || !data.historyEnabled) return false;

  const now = Date.now();
  const first = data.recent[0];
  if (first?.command === command && now - Number(first.usedAt || 0) < 20_000) return false;
  const recent = [{ command, usedAt: now }, ...data.recent.filter(item => item.command !== command)].slice(0, MAX_RECENT);
  await saveData(ctx, identity, { ...data, recent }, persisted);
  return true;
}

export function resetQuickAccessForTests() {
  cache.clear();
}
