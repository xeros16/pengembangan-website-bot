import { randomBytes } from 'node:crypto';
import { isIP } from 'node:net';

export const ASSET_STUDIO_COMMANDS = new Set(['assetstudio']);

function clean(value, max = 180) {
  return String(value ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/[*_~`]/g, '').replace(/\s+/g, ' ').trim().slice(0, max);
}

function makeAssetCode() {
  return randomBytes(4).toString('hex').toUpperCase();
}

export function validateCreativeAssetUrl(value) {
  try {
    const url = new URL(String(value || '').trim());
    if (url.protocol !== 'https:' || url.username || url.password) return null;
    const hostname = url.hostname.toLowerCase().replace(/^\[|\]$/g, '');
    if (!hostname.includes('.') || ['localhost', 'localhost.localdomain'].includes(hostname)) return null;
    if (isIP(hostname)) return null;
    if (/\.(?:local|internal|lan|home|home\.arpa|test|example|invalid)$/i.test(hostname)) return null;
    url.hash = '';
    const normalized = url.toString();
    return normalized.length <= 500 ? normalized : null;
  } catch {
    return null;
  }
}

function usage(prefix = '.') {
  return [
    '🗂️ *PIR CREATIVE ASSET STUDIO*',
    `${prefix}assetstudio simpan Judul | kategori | https://tautan | lisensi | atribusi/catatan`,
    `${prefix}assetstudio saya — aset milikmu pada grup ini.`,
    `${prefix}assetstudio cari <kata kunci> — aset yang dibagikan ke grup.`,
    `${prefix}assetstudio detail KODE — detail aset sesuai izin akses.`,
    `${prefix}assetstudio bagikan KODE konfirmasi — tampilkan tautan aset ke grup.`,
    `${prefix}assetstudio privat KODE — tarik aset dari daftar grup.`,
    `${prefix}assetstudio hapus KODE konfirmasi — hapus aset milikmu.`,
    `${prefix}assetstudio moderasi hide|restore KODE [alasan] — Admin grup.`,
    '',
    'Aset disimpan sebagai metadata dan tautan, bukan file yang diunggah ulang. Berbagi tautan tidak otomatis memberi hak untuk memakai ulang karya. Periksa lisensi dan atribusi dari sumbernya.',
  ].join('\n');
}

function canManageGroup(ctx) {
  if (typeof ctx.isBotOwner === 'function' && ctx.isBotOwner(ctx.userJid, ctx.senderIdentityAliases || [])) return true;
  return typeof ctx.isGroupAdmin === 'function'
    ? ctx.isGroupAdmin(ctx.sock, ctx.remoteJid, ctx.sender || ctx.userJid)
    : false;
}

function formatAsset(asset, index = null) {
  const prefix = index === null ? '' : `${index + 1}. `;
  const tags = Array.isArray(asset.tags) && asset.tags.length ? `\n   Tag: ${asset.tags.join(', ')}` : '';
  return `${prefix}*${clean(asset.title, 100)}* [${asset.code}]\n   ${clean(asset.category, 50)} · ${asset.visibility === 'group' ? 'Dibagikan ke grup' : 'Privat'}\n   Lisensi: ${clean(asset.license, 60)}${tags}\n   ${asset.sourceUrl}`;
}

async function readQuery(query) {
  if (query && typeof query.lean === 'function') return query.lean();
  return query;
}

export async function handleAssetStudioCommand(ctx) {
  const {
    args = [], reply, PREFIX = '.', isGroup, remoteJid, userJid, msg,
    CreativeAsset, getDbReady = () => true,
  } = ctx;
  const action = String(args[0] || 'help').toLowerCase();
  if (['help', 'bantuan', 'menu', ''].includes(action)) return reply(usage(PREFIX));
  if (!isGroup) return reply('Creative Asset Studio saat ini hanya tersedia di grup agar koleksi dan moderasi tetap memiliki batas ruang yang jelas.');
  if (!getDbReady() || !CreativeAsset) return reply('⚠️ Creative Asset Studio membutuhkan MongoDB dan model CreativeAsset.');

  if (['simpan', 'save', 'add'].includes(action)) {
    const fields = args.slice(1).join(' ').split('|').map(value => value.trim());
    const [titleRaw, categoryRaw, urlRaw, licenseRaw, attributionRaw] = fields;
    const title = clean(titleRaw, 100);
    const category = clean(categoryRaw, 50);
    const sourceUrl = validateCreativeAssetUrl(urlRaw);
    const license = clean(licenseRaw, 80);
    const attribution = clean(attributionRaw, 240);
    if (fields.length < 4 || title.length < 3 || category.length < 2 || !sourceUrl || !license) {
      return reply(`Format: ${PREFIX}assetstudio simpan Judul | kategori | https://tautan | lisensi | atribusi/catatan\nContoh: ${PREFIX}assetstudio simpan Moodboard Kopi | branding | https://contoh.com/moodboard | referensi saja | Sumber: Studio X`);
    }
    if (license.length < 3) return reply('Label lisensi tidak valid. Cantumkan lisensi/sumber yang benar, atau gunakan “belum diketahui”.');
    try {
      const asset = await CreativeAsset.create({
        code: makeAssetCode(), groupJid: remoteJid, ownerJid: userJid,
        ownerName: clean(msg?.pushName || 'Anggota', 60) || 'Anggota',
        title, category, sourceUrl, license, attribution,
        tags: [...new Set(`${category} ${title}`.toLowerCase().split(/[^a-z0-9-]+/).filter(tag => tag.length > 2))].slice(0, 12),
        visibility: 'private', status: 'active',
      });
      return reply(`✅ *ASET DISIMPAN SECARA PRIVAT*\n${asset.title} [${asset.code}]\nKategori: ${asset.category}\nLisensi/sumber: ${asset.license}\n\nAset hanya terlihat olehmu. Bagikan dengan ${PREFIX}assetstudio bagikan ${asset.code} konfirmasi setelah memastikan informasi hak penggunaan dan atribusi benar.`);
    } catch (error) {
      console.warn('[ASSET STUDIO SAVE]', error?.message || error);
      return reply('⚠️ Aset belum berhasil disimpan. Coba lagi setelah koneksi database pulih.');
    }
  }

  if (['saya', 'mine', 'list'].includes(action)) {
    try {
      const query = CreativeAsset.find({ groupJid: remoteJid, ownerJid: userJid, status: { $ne: 'deleted' } }).sort({ updatedAt: -1 }).limit(15);
      const assets = await readQuery(query);
      return reply(assets.length ? `🗂️ *ASET MILIKMU DI GRUP INI*\n\n${assets.map(formatAsset).join('\n\n')}` : 'Belum ada aset yang kamu simpan di grup ini.');
    } catch {
      return reply('⚠️ Koleksi asetmu belum dapat dimuat.');
    }
  }

  if (['cari', 'search'].includes(action)) {
    const term = clean(args.slice(1).join(' '), 80);
    if (term.length < 2) return reply(`Masukkan kata kunci minimal 2 karakter. Contoh: ${PREFIX}assetstudio cari branding`);
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    try {
      const query = CreativeAsset.find({
        groupJid: remoteJid, visibility: 'group', status: 'active',
        $or: [
          { title: { $regex: escaped, $options: 'i' } },
          { category: { $regex: escaped, $options: 'i' } },
          { tags: { $regex: escaped, $options: 'i' } },
        ],
      }).sort({ updatedAt: -1 }).limit(10);
      const assets = await readQuery(query);
      return reply(assets.length ? `🔎 *ASET GRUP — ${term}*\n\n${assets.map(formatAsset).join('\n\n')}` : `Tidak ada aset grup yang cocok dengan “${term}”.`);
    } catch {
      return reply('⚠️ Pencarian aset belum dapat dilakukan.');
    }
  }

  if (['detail', 'info'].includes(action)) {
    const code = clean(args[1], 12).toUpperCase();
    if (!code) return reply(`Format: ${PREFIX}assetstudio detail KODE`);
    try {
      const asset = await CreativeAsset.findOne({ groupJid: remoteJid, code, status: { $ne: 'deleted' } });
      if (!asset || (asset.status === 'hidden' && asset.ownerJid !== userJid) || (asset.visibility !== 'group' && asset.ownerJid !== userJid)) return reply('Aset tidak ditemukan atau kamu tidak memiliki akses.');
      return reply(`📦 *DETAIL CREATIVE ASSET*\n${formatAsset(asset)}\nPemilik: ${asset.ownerName || 'Anggota'}\nCatatan/atribusi: ${asset.attribution || 'Tidak dicantumkan'}\nStatus: ${asset.status === 'active' ? 'Aktif' : 'Disembunyikan Admin'}\n\nCatatan: tautan hanya referensi. Pastikan izin penggunaan langsung pada sumber.`);
    } catch {
      return reply('⚠️ Detail aset belum dapat dimuat.');
    }
  }

  if (['bagikan', 'share', 'privat', 'private', 'hapus', 'delete'].includes(action)) {
    const code = clean(args[1], 12).toUpperCase();
    const confirm = String(args[2] || '').toLowerCase() === 'konfirmasi';
    if (!code) return reply(`Sertakan kode aset. Contoh: ${PREFIX}assetstudio bagikan KODE konfirmasi`);
    if (['bagikan', 'share', 'hapus', 'delete'].includes(action) && !confirm) {
      return reply(`Tindakan ini mengubah akses aset. Konfirmasi dengan ${PREFIX}assetstudio ${action} ${code} konfirmasi.`);
    }
    try {
      const asset = await CreativeAsset.findOne({ groupJid: remoteJid, code, status: { $ne: 'deleted' } });
      if (!asset) return reply('Aset tidak ditemukan pada grup ini.');
      if (asset.ownerJid !== userJid) return reply('Hanya pemilik aset yang dapat mengubah akses atau menghapus aset ini. Admin dapat menggunakan moderasi hide/restore.');
      if (['bagikan', 'share'].includes(action)) {
        if (asset.status !== 'active') return reply('Aset yang sedang dimoderasi tidak dapat dibagikan.');
        const updated = await CreativeAsset.findOneAndUpdate(
          { groupJid: remoteJid, code, ownerJid: userJid, status: 'active' },
          { $set: { visibility: 'group' } }, { new: true },
        );
        if (!updated) return reply('Aset berubah saat diproses. Muat ulang daftar milikmu.');
        return reply(`🔗 *ASET DIBAGIKAN KE GRUP*\n${asset.title} [${code}]\nLisensi/sumber: ${asset.license}\n\nAnggota dapat melihat tautan dan atribusi. Ini tidak memberikan hak pakai ulang di luar lisensi pemilik sumber.`);
      }
      if (['privat', 'private'].includes(action)) {
        const updated = await CreativeAsset.findOneAndUpdate(
          { groupJid: remoteJid, code, ownerJid: userJid, status: { $ne: 'deleted' } },
          { $set: { visibility: 'private' } }, { new: true },
        );
        if (!updated) return reply('Aset berubah saat diproses. Muat ulang daftar milikmu.');
        return reply(`🔒 Aset *${asset.title}* kembali privat. Anggota lain tidak dapat membukanya melalui pencarian grup.`);
      }
      const deleted = await CreativeAsset.findOneAndUpdate(
        { groupJid: remoteJid, code, ownerJid: userJid, status: { $ne: 'deleted' } },
        { $set: { status: 'deleted', visibility: 'private', deletedAt: new Date() } }, { new: true },
      );
      return reply(deleted ? `🗑️ Aset ${code} dihapus dari koleksimu.` : 'Aset berubah saat diproses. Muat ulang daftar milikmu.');
    } catch {
      return reply('⚠️ Perubahan aset belum berhasil disimpan.');
    }
  }

  if (['moderasi', 'moderate'].includes(action)) {
    if (!await canManageGroup(ctx)) return reply('⛔ Hanya Admin grup atau Owner bot yang dapat memoderasi aset grup.');
    const moderationAction = String(args[1] || '').toLowerCase();
    const code = clean(args[2], 12).toUpperCase();
    const reason = clean(args.slice(3).join(' '), 240);
    if (!['hide', 'restore'].includes(moderationAction) || !code) return reply(`Format: ${PREFIX}assetstudio moderasi hide KODE [alasan] atau ${PREFIX}assetstudio moderasi restore KODE`);
    try {
      const status = moderationAction === 'hide' ? 'hidden' : 'active';
      const asset = await CreativeAsset.findOneAndUpdate(
        { groupJid: remoteJid, code, visibility: 'group', status: { $ne: 'deleted' } },
        { $set: { status, moderationNote: moderationAction === 'hide' ? reason : '', moderatedBy: userJid, moderatedAt: new Date() } },
        { new: true },
      );
      if (!asset) return reply('Aset tidak ditemukan pada grup ini.');
      return reply(moderationAction === 'hide' ? `🙈 Aset ${code} disembunyikan dari pencarian grup.` : `✅ Aset ${code} dipulihkan ke pencarian grup jika pemilik membagikannya.`);
    } catch {
      return reply('⚠️ Moderasi aset belum berhasil.');
    }
  }

  return reply(`Subperintah tidak dikenali. Ketik ${PREFIX}assetstudio help.`);
}
