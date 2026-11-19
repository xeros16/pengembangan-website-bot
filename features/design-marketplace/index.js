import fs from 'node:fs';
import path from 'node:path';
import { randomBytes, randomInt as cryptoRandomInt, createHash } from 'node:crypto';
import { DesignerProfile, PortfolioItem, DesignService, MarketplaceFavorite, MarketplaceReport, DesignerDashboardAuth, DesignerSignupRequest, DesignerNotification } from '../../models/design-marketplace.js';
import { DesignerAnalytics } from '../../models/designer-growth.js';
import { PortfolioCollection, DesignerTestimonial, DesignerLead, DesignerAvailability, ClientProject } from '../../models/website-integration.js';
import { isPrivateNotificationContext, formatWebsiteNotificationRows } from './notifications.js';
import { detectPortfolioFormat, PORTFOLIO_MAX_FILE_BYTES, processPortfolioImageBuffer } from '../../portfolio-website/portfolio-media.js';
import { registerLinkedDesignerDestination, unregisterLinkedDesignerDestination } from '../access-control.js';
import { DESIGN_CATEGORIES, DESIGN_STYLES, formatProfile, getCommunityGroupIds, normalizeTags, isDesignerId, isPortfolioItemId, isMarketplaceReportId, isValidReportReason, normalizePublicWhatsApp } from './services/marketplace-service.js';

const activeWizards = new Map();
const searchPages = new Map();
const PAGE_SIZE = 5;

export function hasActivePortfolioWizard(userJid) {
  return activeWizards.has(String(userJid || ''));
}

function newId(prefix, bytes = 4) {
  return `${prefix}-${randomBytes(bytes).toString('hex').toUpperCase()}`;
}

function safeText(value, max = 600) {
  return String(value || '').trim().replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').slice(0, max);
}

function cleanImagePath(value) {
  const normalized = String(value || '').replace(/\\/g, '/');
  if (!normalized || path.isAbsolute(normalized)) return null;
  const candidate = path.resolve(process.cwd(), normalized);
  const uploadRoot = path.resolve(process.cwd(), process.env.PORTFOLIO_UPLOAD_DIR || 'uploads/portfolio');
  if (!candidate.startsWith(`${uploadRoot}${path.sep}`)) return null;
  return candidate;
}

async function removeDraftImage(relativePath) {
  const filePath = cleanImagePath(relativePath);
  if (filePath) await fs.promises.unlink(filePath).catch(() => {});
}

function configuredCommunityGroups() {
  return getCommunityGroupIds(process.env.DESIGN_COMMUNITY_GROUPS || '');
}

async function findCommunityMembership(ctx) {
  const allowedGroups = configuredCommunityGroups();
  if (!allowedGroups.length) return { ok: false, reason: 'DESIGN_COMMUNITY_GROUPS belum dikonfigurasi di .env.' };
  const identities = new Set([ctx.userJid, ...(ctx.senderIdentityAliases || [])].filter(Boolean).map(v => ctx.normalizeJid(v)));
  if (ctx.isGroup && allowedGroups.includes(ctx.remoteJid)) {
    try {
      const metadata = await ctx.sock.groupMetadata(ctx.remoteJid);
      const participant = (metadata.participants || []).find(p => [p.id, p.phoneNumber, p.lid].filter(Boolean).some(id => identities.has(ctx.normalizeJid(id))));
      if (participant) return { ok: true, groupJid: ctx.remoteJid };
      return { ok: false, reason: 'Pengirim tidak ditemukan sebagai anggota grup komunitas yang diizinkan.' };
    } catch {
      return { ok: false, reason: 'Bot tidak dapat memverifikasi keanggotaan grup. Coba lagi dari grup komunitas.' };
    }
  }
  for (const groupJid of allowedGroups) {
    try {
      const metadata = await ctx.sock.groupMetadata(groupJid);
      const participant = (metadata.participants || []).find(p => [p.id, p.phoneNumber, p.lid].filter(Boolean).some(id => identities.has(ctx.normalizeJid(id))));
      if (participant) return { ok: true, groupJid };
    } catch { /* Group metadata can fail temporarily; try the next configured group. */ }
  }
  return { ok: false, reason: 'Fitur membuat portofolio hanya untuk anggota grup komunitas desain yang terdaftar.' };
}

async function requireMember(ctx) {
  const membership = await findCommunityMembership(ctx);
  if (!membership.ok) {
    await ctx.reply(`⛔ ${membership.reason}\n\nAdmin bot perlu mengatur DESIGN_COMMUNITY_GROUPS dengan JID grup komunitas.`);
    return null;
  }
  return membership;
}

async function startProfileWizard(ctx) {
  const membership = await requireMember(ctx);
  if (!membership) return true;
  activeWizards.set(ctx.userJid, {
    type: 'profile', step: 'name', membershipGroupJid: membership.groupJid,
    draft: {}, startedBy: ctx.userJid,
  });
  await ctx.reply('🎨 *Pendaftaran profil portofolio* (1/5)\n\nApa nama publik yang ingin ditampilkan?\n\nBot hanya menampilkan portofolio dan kontak yang kamu cantumkan. Komunikasi dilakukan langsung antara klien dan desainer.\nKetik .cancel untuk membatalkan.');
  return true;
}

async function startItemWizard(ctx) {
  if (!isPrivateNotificationContext(ctx)) {
    return ctx.reply('🔒 Upload karya melalui bot hanya tersedia di chat pribadi. Buka chat pribadi bot, lalu kirim `.portfolio add`.');
  }
  const profile = await DesignerProfile.findOne({ ownerJid: ctx.userJid }).lean();
  if (!profile) return ctx.reply('Buat profil terlebih dahulu dengan `.portfolio daftar`.');
  const membership = await requireMember(ctx);
  if (!membership) return true;
  const previousWizard = activeWizards.get(ctx.userJid);
  if (previousWizard?.type === 'item' && previousWizard.draft?.absolutePath) {
    await fs.promises.unlink(previousWizard.draft.absolutePath).catch(() => {});
  }
  activeWizards.set(ctx.userJid, {
    type: 'item', step: 'file', designerId: profile.designerId,
    membershipGroupJid: membership.groupJid, draft: {},
  });
  return ctx.reply(`🖼️ *TAMBAH KARYA PORTOFOLIO*\n\nKirim satu file karya sebagai pesan berikutnya. Format: JPEG, PNG, WebP, atau SVG (SVG kirim sebagai *Dokumen*).\nBatas ukuran: *15 MB per file*. File akan diproses menjadi WebP untuk pratinjau website, lalu masuk antrean moderasi Owner.\n\nSetelah file diterima, bot akan meminta judul, kategori, dan deskripsi karya.\nKetik .cancel kapan saja untuk membatalkan.`);
}

function getPortfolioAttachment(ctx) {
  const message = ctx.unwrapMessage?.(ctx.msg?.message) || ctx.msg?.message || {};
  const document = message.documentMessage || null;
  const image = message.imageMessage || null;
  if (document) {
    return {
      filename: String(document.fileName || (String(document.mimetype || '').toLowerCase() === 'image/svg+xml' ? 'portfolio.svg' : 'portfolio-upload')).slice(0, 180),
      contentType: String(document.mimetype || 'application/octet-stream').toLowerCase(),
      fileLength: Number(document.fileLength || 0),
    };
  }
  if (image) {
    const contentType = String(image.mimetype || 'image/jpeg').toLowerCase();
    const extension = ({ 'image/jpeg': '.jpg', 'image/jpg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' })[contentType] || '';
    return {
      filename: `portfolio-upload${extension}`,
      contentType,
      fileLength: Number(image.fileLength || 0),
    };
  }
  return null;
}

async function handleItemWizardMessage(ctx, wizard, text) {
  if (!isPrivateNotificationContext(ctx)) return false;
  if (wizard.step === 'file') {
    const attachment = getPortfolioAttachment(ctx);
    if (!attachment) {
      return ctx.reply('Kirim satu file JPEG, PNG, WebP, atau SVG sebagai Dokumen. Maksimal 15 MB per file.');
    }
    if (!detectPortfolioFormat(attachment)) {
      return ctx.reply('Format belum didukung. Gunakan JPEG, PNG, WebP, atau SVG.');
    }
    if (attachment.fileLength > PORTFOLIO_MAX_FILE_BYTES) {
      return ctx.reply('Ukuran file melebihi batas 15 MB. Kompres file lalu kirim ulang.');
    }
    let outputPath = '';
    try {
      const buffer = await ctx.downloadMedia(ctx.sock, ctx.msg, PORTFOLIO_MAX_FILE_BYTES);
      const output = await processPortfolioImageBuffer(buffer, {
        filename: attachment.filename,
        contentType: attachment.contentType,
        cropMode: 'original',
      });
      const botRoot = path.resolve(process.env.BOT_DATA_ROOT || process.cwd());
      const uploadRoot = path.resolve(botRoot, process.env.PORTFOLIO_UPLOAD_DIR || 'uploads/portfolio');
      await fs.promises.mkdir(uploadRoot, { recursive: true });
      outputPath = path.join(uploadRoot, `wa-${randomBytes(16).toString('hex')}.webp`);
      await fs.promises.writeFile(outputPath, output, { flag: 'wx', mode: 0o600 });
      wizard.draft.imagePath = path.relative(botRoot, outputPath).replace(/\\/g, '/');
      wizard.draft.absolutePath = outputPath;
      wizard.step = 'title';
      return ctx.reply(`✅ File *${safeText(attachment.filename, 100)}* diterima (${(buffer.length / 1024 / 1024).toFixed(2)} MB) dan berhasil diproses.\n\n(1/3) Kirim *judul karya* (maksimal 100 karakter).`);
    } catch (error) {
      if (outputPath) await fs.promises.unlink(outputPath).catch(() => {});
      return ctx.reply(`❌ Upload gagal: ${safeText(error.message, 240)}\n\nKirim ulang file yang valid (JPEG, PNG, WebP, atau SVG), maksimal 15 MB.`);
    }
  }

  if (wizard.step === 'title') {
    if (text.length < 2) return ctx.reply('Judul minimal 2 karakter. Coba lagi.');
    wizard.draft.title = text.slice(0, 100);
    wizard.step = 'category';
    return ctx.reply('(2/3) Kirim *kategori karya* (maksimal 60 karakter), misalnya Logo & Branding, UI/UX, GFX, atau Ilustrasi.');
  }
  if (wizard.step === 'category') {
    if (text.length < 2) return ctx.reply('Kategori minimal 2 karakter. Coba lagi.');
    wizard.draft.category = text.slice(0, 60);
    wizard.step = 'description';
    return ctx.reply('(3/3) Tulis deskripsi singkat karya (maksimal 800 karakter), atau ketik `-` jika ingin melewati.');
  }
  if (wizard.step === 'description') {
    wizard.draft.description = ['-', 'skip', 'lewati'].includes(text.toLowerCase()) ? '' : text.slice(0, 800);
    const profile = await DesignerProfile.findOne({ designerId: wizard.designerId, ownerJid: ctx.userJid }).lean();
    if (!profile) {
      if (wizard.draft.absolutePath) await fs.promises.unlink(wizard.draft.absolutePath).catch(() => {});
      activeWizards.delete(ctx.userJid);
      return ctx.reply('Profil desainer tidak ditemukan. File sementara sudah dibersihkan; buat profil kembali dengan `.portfolio daftar`.');
    }
    try {
      const itemId = newId('ART', 4);
      await PortfolioItem.create({
        itemId, designerId: profile.designerId, ownerJid: profile.ownerJid,
        title: wizard.draft.title, category: wizard.draft.category,
        description: wizard.draft.description || '',
        styles: [], priceFrom: 0, featured: false, sourceType: 'personal',
        imagePath: wizard.draft.imagePath, galleryPaths: [wizard.draft.imagePath],
        moderationStatus: 'pending',
      });
      activeWizards.delete(ctx.userJid);
      return ctx.reply(`✅ *Karya berhasil diunggah.*\n\nJudul: ${wizard.draft.title}\nKategori: ${wizard.draft.category}\nID: *${itemId}*\nStatus: *Menunggu moderasi Owner*\n\nKarya akan tampil di website setelah disetujui. Cek status dengan perintah .portfolio karya atau tambahkan karya lain dengan perintah .portfolio add.`);
    } catch (error) {
      if (wizard.draft.absolutePath) await fs.promises.unlink(wizard.draft.absolutePath).catch(() => {});
      activeWizards.delete(ctx.userJid);
      return ctx.reply(`❌ Karya belum tersimpan: ${safeText(error.message, 220)}. Silakan ulangi dengan perintah .portfolio add.`);
    }
  }
  return false;
}

async function handleWizardMessage(ctx) {
  const wizard = activeWizards.get(ctx.userJid);
  if (!wizard || ctx.isCommand) return false;
  const text = safeText(ctx.messageText, 1000);
  if (wizard.type === 'item') return Boolean(await handleItemWizardMessage(ctx, wizard, text));
  if (wizard.type !== 'profile') return false;

  if (wizard.step === 'name') {
    if (text.length < 2) return ctx.reply('Nama minimal 2 karakter. Coba lagi.');
    wizard.draft.displayName = text.slice(0, 80); wizard.step = 'bio';
    return ctx.reply('(2/5) Tulis deskripsi singkat tentang dirimu dan jenis karya yang kamu buat. Maksimal 600 karakter.');
  }
  if (wizard.step === 'bio') {
    wizard.draft.bio = text.slice(0, 600); wizard.step = 'specialties';
    return ctx.reply(`(3/5) Tulis spesialisasi, pisahkan dengan koma.\nContoh: Logo, GFX, Thumbnail\n\nKategori: ${DESIGN_CATEGORIES.join(' • ')}`);
  }
  if (wizard.step === 'specialties') {
    wizard.draft.specialties = normalizeTags(text); wizard.step = 'location';
    return ctx.reply('(4/5) Kota atau lokasi kerja? Contoh: Bandung, Indonesia. Ketik - jika tidak ingin mencantumkannya.');
  }
  if (wizard.step === 'location') {
    wizard.draft.location = ['-', 'skip', 'lewati'].includes(text.toLowerCase()) ? '' : text.slice(0, 100);
    wizard.step = 'publicWhatsApp';
    return ctx.reply('(5/5) Nomor WhatsApp yang ingin ditampilkan pada profil publik? Masukkan format internasional, misalnya 6281234567890. Ketik - jika tidak ingin menampilkan nomor. Nomor ini akan dapat dihubungi siapa pun yang melihat profilmu.');
  }
  if (wizard.step === 'publicWhatsApp') {
    const phone = normalizePublicWhatsApp(text);
    if (phone === null) return ctx.reply('Nomor tidak valid. Gunakan 8–15 digit, misalnya 6281234567890, atau ketik - untuk tidak menampilkan nomor.');
    wizard.draft.publicWhatsApp = phone;
    wizard.draft.contactPhone = phone;
    const existing = await DesignerProfile.findOne({ ownerJid: ctx.userJid }).lean();
    const profile = existing
      ? await DesignerProfile.findOneAndUpdate({ ownerJid: ctx.userJid }, { $set: { ...wizard.draft, membershipGroupJid: wizard.membershipGroupJid, isPublic: true } }, { new: true, runValidators: true })
      : await DesignerProfile.create({ ...wizard.draft, ownerJid: ctx.userJid, contactJid: (ctx.senderIdentityAliases || []).find(id => String(id).endsWith('@s.whatsapp.net')) || ctx.userJid, designerId: newId('DSN', 4), membershipGroupJid: wizard.membershipGroupJid, isPublic: true });
    activeWizards.delete(ctx.userJid);
    return ctx.reply(`✅ *Profil portofolio tersimpan dan dipublikasikan.*\n\n${formatProfile(profile, 0, { includeContact: true })}\n\nLangkah berikutnya:\n1. Tambahkan karya langsung melalui WhatsApp dengan .portfolio add atau lewat Designer Studio website.\n2. Cek profil dengan .portfolio preview.\n3. Bagikan profil melalui .portfolio website.\n\nPIR Visuals hanya direktori. Calon klien menghubungimu langsung; tidak ada pemesanan atau pembayaran melalui bot.`);
  }
  return false;
}

async function editProfile(ctx) {
  if (!await requireMember(ctx)) return true;
  const profile = await DesignerProfile.findOne({ ownerJid: ctx.userJid });
  if (!profile) return ctx.reply('Buat profil dulu dengan `.portfolio daftar`.');
  const [field, ...values] = ctx.args.slice(1);
  const value = values.join(' ').trim();
  if (!field || !value) return ctx.reply('Format: `.portfolio edit nama <nama>`, `bio <teks>`, `spesialisasi <tag, tag>`, `lokasi <kota>`, `whatsapp <628...|off>`, `instagram <username>`, `behance <username/link>`, `dribbble <username/link>`, atau `website <url>`.');
  if (field === 'nama') profile.displayName = safeText(value, 80);
  else if (field === 'bio') profile.bio = safeText(value, 600);
  else if (field === 'spesialisasi') profile.specialties = normalizeTags(value);
  else if (field === 'lokasi') profile.location = ['-', 'hapus', 'off'].includes(value.toLowerCase()) ? '' : safeText(value, 100);
  else if (field === 'whatsapp') {
    const phone = normalizePublicWhatsApp(value);
    if (phone === null) return ctx.reply('Nomor WhatsApp tidak valid. Gunakan format 6281234567890 atau `off` untuk menghapus kontak publik.');
    profile.publicWhatsApp = phone;
    profile.contactPhone = phone;
  } else if (field === 'instagram') profile.instagram = ['-', 'hapus', 'off'].includes(value.toLowerCase()) ? '' : safeText(value.replace(/^@/, ''), 120);
  else if (field === 'behance') profile.behance = ['-', 'hapus', 'off'].includes(value.toLowerCase()) ? '' : safeText(value, 200);
  else if (field === 'dribbble') profile.dribbble = ['-', 'hapus', 'off'].includes(value.toLowerCase()) ? '' : safeText(value, 200);
  else if (field === 'website') profile.website = ['-', 'hapus', 'off'].includes(value.toLowerCase()) ? '' : safeText(value, 200);
  else return ctx.reply('Field tidak dikenal. Gunakan nama, bio, spesialisasi, lokasi, whatsapp, instagram, behance, dribbble, atau website.');
  await profile.save();
  return ctx.reply(`✅ Profil diperbarui.\n${formatProfile(profile, await PortfolioItem.countDocuments({ ownerJid: ctx.userJid, moderationStatus: 'approved' }), { includeContact: true })}`);
}

async function listOwnWorks(ctx) {
  const items = await PortfolioItem.find({ ownerJid: ctx.userJid }).sort({ createdAt: -1 }).limit(20).lean();
  if (!items.length) return ctx.reply('Belum ada karya. Tambahkan dengan `.portfolio add`.');
  return ctx.reply(`🖼️ *Karya portofolio kamu*\n\n${items.map((item, i) => `${i + 1}. *${item.featured ? '⭐ UNGGULAN • ' : ''}${item.title}* — ${item.itemId}\n   ${item.category} • ${item.styles.join(', ') || 'tanpa tag'}\n   Status: ${item.moderationStatus}${item.moderationReason ? ` (${item.moderationReason})` : ''}`).join('\n\n')}\n\n⭐ Tandai/lepas karya unggulan: .portfolio unggulan ART-ID (maksimal 3 karya disetujui)`);
}

async function toggleFeaturedWork(ctx, itemId) {
  if (!await requireMember(ctx)) return true;
  if (!itemId) return ctx.reply('Format: `.portfolio unggulan ART-ID`. Maksimal 3 karya unggulan.');
  const item = await PortfolioItem.findOne({ itemId: itemId.toUpperCase(), ownerJid: ctx.userJid });
  if (!item) return ctx.reply('Karya tidak ditemukan atau bukan milikmu.');
  if (item.moderationStatus !== 'approved') return ctx.reply('Hanya karya yang sudah disetujui Owner yang bisa dijadikan unggulan.');
  if (item.featured) {
    item.featured = false;
    await item.save();
    return ctx.reply(`☆ Karya *${item.title}* tidak lagi ditandai sebagai unggulan.`);
  }
  const count = await PortfolioItem.countDocuments({ ownerJid: ctx.userJid, featured: true, moderationStatus: 'approved' });
  if (count >= 3) return ctx.reply('Batas 3 karya unggulan sudah tercapai. Nonaktifkan salah satu dengan `.portfolio unggulan ART-ID`, lalu coba lagi.');
  item.featured = true;
  await item.save();
  return ctx.reply(`⭐ Karya *${item.title}* ditandai sebagai unggulan dan akan ditampilkan lebih dulu di profil publik.`);
}

async function deleteOwnWork(ctx, itemId) {
  if (!itemId) return ctx.reply('Format: `.portfolio delete ART-ID`. Lihat ID melalui `.portfolio karya`.');
  const item = await PortfolioItem.findOneAndDelete({ itemId: itemId.toUpperCase(), ownerJid: ctx.userJid });
  if (!item) return ctx.reply('Karya tidak ditemukan atau bukan milikmu.');
  await removeDraftImage(item.imagePath);
  return ctx.reply(`🗑️ Karya ${item.title} berhasil dihapus.`);
}

async function moderateWork(ctx, action, itemId, reason = '') {
  if (!ctx.isBotOwner(ctx.userJid, ctx.senderIdentityAliases)) return ctx.reply('⛔ Hanya Owner bot yang dapat memoderasi karya pada versi awal ini.');
  if (action === 'pending') {
    const rows = await PortfolioItem.find({ moderationStatus: 'pending' }).sort({ createdAt: 1 }).limit(15).lean();
    return ctx.reply(rows.length ? `🛡️ *Karya menunggu moderasi*\n\n${rows.map(item => `${item.itemId} — ${item.title}\nDesainer: ${item.designerId}\nKategori: ${item.category}\nSetujui: .portfolio approve ${item.itemId}\nTolak: .portfolio reject ${item.itemId} alasan`).join('\n\n')}` : 'Tidak ada karya yang menunggu moderasi.');
  }
  if (!itemId) return ctx.reply(`Format: .portfolio ${action} ART-ID${action === 'reject' ? ' alasan' : ''}`);
  const update = action === 'approve'
    ? { moderationStatus: 'approved', moderationReason: '', reviewedBy: ctx.userJid, reviewedAt: new Date() }
    : { moderationStatus: 'rejected', moderationReason: safeText(reason || 'Perlu diperbaiki', 300), reviewedBy: ctx.userJid, reviewedAt: new Date() };
  const item = await PortfolioItem.findOneAndUpdate({ itemId: itemId.toUpperCase(), moderationStatus: 'pending' }, { $set: update }, { new: true });
  if (!item) return ctx.reply('Karya pending tidak ditemukan. Periksa ID atau statusnya.');
  return ctx.reply(action === 'approve' ? `✅ Karya ${item.itemId} disetujui dan tampil pada portofolio publik.` : `❌ Karya ${item.itemId} ditolak. Alasan: ${update.moderationReason}`);
}

async function searchDesigners(ctx, mode, value = '') {
  let filters = searchPages.get(ctx.userJid)?.filters || {};
  if (mode === 'reset') filters = {};
  else if (mode === 'category') filters.category = value;
  else if (mode === 'style') filters.style = value;
  else if (mode === 'location') filters.location = value;
  else if (mode === 'query') filters.query = value;
  else if (mode === 'featured') filters.featured = true;
  const itemQuery = { moderationStatus: 'approved' };
  if (filters.featured) itemQuery.featured = true;
  if (filters.category) itemQuery.category = { $regex: filters.category.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
  if (filters.style) itemQuery.styles = { $regex: filters.style.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
  if (filters.query) itemQuery.$or = [
    { title: { $regex: filters.query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } },
    { description: { $regex: filters.query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } },
    { category: { $regex: filters.query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } },
    { styles: { $regex: filters.query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } },
  ];
  const items = await PortfolioItem.find(itemQuery).select('ownerJid').lean();
  const owners = new Set(items.map(item => item.ownerJid));
  const eligibleOwners = new Set(await PortfolioItem.distinct('ownerJid', { moderationStatus: 'approved' }));
  if (filters.query) {
    const safeQuery = filters.query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const profileMatches = await DesignerProfile.find({ isPublic: true, $or: [
      { displayName: { $regex: safeQuery, $options: 'i' } },
      { bio: { $regex: safeQuery, $options: 'i' } },
      { specialties: { $regex: safeQuery, $options: 'i' } },
      { location: { $regex: safeQuery, $options: 'i' } },
    ] }).select('ownerJid').lean();
    if (!filters.category && !filters.style && !filters.featured) {
      for (const profile of profileMatches) if (eligibleOwners.has(profile.ownerJid)) owners.add(profile.ownerJid);
    }
  }
  const profileQuery = { ownerJid: { $in: [...owners] }, isPublic: true };
  if (filters.location) profileQuery.location = { $regex: filters.location.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
  const profiles = await DesignerProfile.find(profileQuery).sort({ updatedAt: -1 }).lean();
  searchPages.set(ctx.userJid, { filters, profiles, page: mode === 'next' ? (searchPages.get(ctx.userJid)?.page || 0) + 1 : 0 });
  return renderSearchPage(ctx, searchPages.get(ctx.userJid));
}

async function renderSearchPage(ctx, state) {
  if (!state?.profiles?.length) return ctx.reply('Belum ada desainer yang cocok. Coba hapus sebagian filter dengan `.design`, atau cari kategori dan gaya lain.');
  const pageCount = Math.ceil(state.profiles.length / PAGE_SIZE);
  if (state.page >= pageCount) {
    state.page = pageCount - 1;
    return ctx.reply(`Kamu sudah mencapai halaman terakhir (${pageCount}/${pageCount}).\nGunakan .design prev untuk kembali atau .design reset untuk menghapus filter.`);
  }
  if (state.page < 0) {
    state.page = 0;
    return ctx.reply('Kamu sedang berada di halaman pertama. Tidak ada halaman sebelumnya.');
  }
  const pageRows = state.profiles.slice(state.page * PAGE_SIZE, state.page * PAGE_SIZE + PAGE_SIZE);
  const ownerIds = pageRows.map(profile => profile.ownerJid);
  const workStats = await PortfolioItem.aggregate([
    { $match: { ownerJid: { $in: ownerIds }, moderationStatus: 'approved' } },
    { $group: { _id: '$ownerJid', total: { $sum: 1 }, featured: { $sum: { $cond: ['$featured', 1, 0] } } } },
  ]);
  const worksByOwner = new Map(workStats.map(row => [row._id, row]));
  const rows = pageRows.map((profile, index) => {
    const works = worksByOwner.get(profile.ownerJid) || { total: 0, featured: 0 };
    const badges = [profile.isVerified ? '✓ Profil ditinjau PIR' : '', works.featured ? `⭐ ${works.featured} unggulan` : ''].filter(Boolean).join(' • ');
    const bio = safeText(profile.bio, 100);
    return `${index + 1 + state.page * PAGE_SIZE}. ${works.featured ? '🌟 ' : ''}*${profile.displayName}* — ${profile.designerId}\n   ${profile.specialties.join(', ') || 'Spesialisasi belum diisi'}\n   ${profile.location ? `📍 ${profile.location}\n   ` : ''}${bio ? `${bio}\n   ` : ''}🖼️ ${works.total} karya disetujui${badges ? `\n   ${badges}` : ''}\n   Lihat portofolio & kontak: .designer ${profile.designerId}`;
  });
  const filterText = Object.entries(state.filters).map(([k, v]) => `${k}: ${v === true ? 'ya' : v}`).join(' • ') || 'semua';
  const navigation = [state.page > 0 ? 'Sebelumnya: .design prev' : '', state.page + 1 < pageCount ? 'Berikutnya: .design next' : 'Kamu berada di halaman terakhir'].filter(Boolean).join(' • ');
  return ctx.reply(`🔎 *DIREKTORI DESAINER PIR VISUALS*\n${state.profiles.length} desainer cocok • Filter: ${filterText}\n\n${rows.join('\n\n')}\n\nHalaman ${state.page + 1}/${pageCount}\n${navigation}\nSimpan favorit: .design simpan DSN-ID • Reset filter: .design reset\n\nPIR Visuals hanya menampilkan portofolio. Hubungi desainer secara langsung melalui profilnya.`);
}

async function showDesigner(ctx, designerId) {
  const profile = await DesignerProfile.findOne({ designerId: String(designerId || '').toUpperCase(), isPublic: true }).lean();
  if (!profile) return ctx.reply('Profil desainer tidak ditemukan atau tidak publik.');
  const [items, approvedCount] = await Promise.all([
    PortfolioItem.find({ designerId: profile.designerId, moderationStatus: 'approved' }).sort({ featured: -1, createdAt: -1 }).limit(8).lean(),
    PortfolioItem.countDocuments({ designerId: profile.designerId, moderationStatus: 'approved' }),
  ]);
  await ctx.reply(`${formatProfile(profile, approvedCount, { includeContact: true })}\n\n🖼️ *PORTOFOLIO KARYA*\n${items.length ? items.map((item, i) => `${i + 1}. ${item.featured ? '⭐ ' : ''}*${item.title}* — ${item.category}\n   ${item.styles.join(', ') || 'tanpa tag'}\n   ${safeText(item.description, 160)}`).join('\n\n') : 'Belum ada karya yang disetujui.'}\n\n📌 *Cara menghubungi*\nPilih salah satu kontak yang dicantumkan desainer di atas. Setelah itu, diskusikan kebutuhan dan kesepakatan secara langsung. Bot tidak menerima brief, penawaran, pesanan, atau pembayaran.`);
  for (const item of items.slice(0, 3)) {
    const filePath = cleanImagePath(item.imagePath);
    if (!filePath) continue;
    try {
      const image = await fs.promises.readFile(filePath);
      await ctx.sock.sendMessage(ctx.remoteJid, { image, caption: `${item.title}\n${item.category}\nID: ${item.itemId}` }, { quoted: ctx.msg });
    } catch { /* A missing local image should not break the profile view. */ }
  }
}

async function handleFavoriteCommand(ctx, action, designerId) {
  const normalizedId = String(designerId || '').toUpperCase();
  if (action === 'list' || action === 'daftar' || action === 'favorit' || !action) {
    const favorites = await MarketplaceFavorite.find({ userJid: ctx.userJid }).sort({ createdAt: -1 }).limit(30).lean();
    if (!favorites.length) return ctx.reply('Belum ada desainer favorit. Simpan dengan `.design simpan DSN-ID`.');
    const profiles = await DesignerProfile.find({ designerId: { $in: favorites.map(v => v.designerId) }, isPublic: true }).lean();
    const byId = new Map(profiles.map(v => [v.designerId, v]));
    const rows = favorites.map((fav, i) => {
      const profile = byId.get(fav.designerId);
      return profile ? `${i + 1}. *${profile.displayName}* — ${profile.designerId}\n   ${profile.specialties.join(', ') || 'Spesialisasi belum diisi'}\n   Buka: .designer ${profile.designerId}\n   Hapus: .design batal ${profile.designerId}` : null;
    }).filter(Boolean);
    return ctx.reply(rows.length ? `⭐ *DESAINER FAVORIT*\n\n${rows.join('\n\n')}` : 'Daftar favorit kosong; profil yang disimpan mungkin sudah tidak publik.');
  }
  if (!isDesignerId(normalizedId)) return ctx.reply('Format: `.design simpan DSN-ID` atau `.design batal DSN-ID`.');
  if (action === 'simpan' || action === 'save' || action === 'favorit') {
    const profile = await DesignerProfile.findOne({ designerId: normalizedId, isPublic: true }).lean();
    if (!profile) return ctx.reply('Profil desainer tidak ditemukan atau tidak publik.');
    if (profile.ownerJid === ctx.userJid) return ctx.reply('Kamu tidak perlu menyimpan profil sendiri sebagai favorit.');
    try { await MarketplaceFavorite.create({ userJid: ctx.userJid, designerId: normalizedId }); }
    catch (error) {
      if (error?.code === 11000) return ctx.reply('Desainer ini sudah ada di daftar favoritmu.');
      throw error;
    }
    return ctx.reply(`⭐ ${profile.displayName} (${normalizedId}) ditambahkan ke favorit.\nLihat daftar: .design favorit`);
  }
  if (action === 'batal' || action === 'hapus' || action === 'remove') {
    const result = await MarketplaceFavorite.deleteOne({ userJid: ctx.userJid, designerId: normalizedId });
    return ctx.reply(result.deletedCount ? `Desainer ${normalizedId} dihapus dari favorit.` : 'Desainer ini tidak ada di daftar favoritmu.');
  }
  return ctx.reply('Gunakan `.design simpan DSN-ID`, `.design favorit`, atau `.design batal DSN-ID`.');
}

async function reportMarketplaceTarget(ctx) {
  const [targetIdRaw, ...reasonParts] = ctx.args;
  const targetId = String(targetIdRaw || '').toUpperCase();
  const reason = safeText(reasonParts.join(' '), 500);
  if (!targetId || !isValidReportReason(reason)) return ctx.reply('Format: `.lapordesain DSN-ID alasan yang jelas` atau `.lapordesain ART-ID alasan yang jelas` (minimal 5 karakter).');
  let targetType;
  let ownerJid;
  if (isDesignerId(targetId)) {
    const profile = await DesignerProfile.findOne({ designerId: targetId, isPublic: true }).lean();
    if (!profile) return ctx.reply('Profil desainer tidak ditemukan atau tidak publik.');
    targetType = 'designer'; ownerJid = profile.ownerJid;
  } else if (isPortfolioItemId(targetId)) {
    const item = await PortfolioItem.findOne({ itemId: targetId, moderationStatus: 'approved' }).lean();
    if (!item) return ctx.reply('Karya tidak ditemukan atau tidak tampil publik.');
    targetType = 'portfolio'; ownerJid = item.ownerJid;
  } else return ctx.reply('ID tidak valid. Gunakan ID DSN-... untuk desainer atau ART-... untuk karya.');
  if (ownerJid === ctx.userJid) return ctx.reply('Kamu tidak bisa melaporkan profil atau karya milik sendiri.');
  const existing = await MarketplaceReport.findOne({ reporterJid: ctx.userJid, targetType, targetId, status: 'open' }).lean();
  if (existing) return ctx.reply(`Laporan untuk ${targetId} masih diproses. ID laporan: ${existing.reportId}`);
  const reportId = newId('RPT', 4);
  await MarketplaceReport.create({ reportId, reporterJid: ctx.userJid, targetType, targetId, reason, status: 'open' });
  return ctx.reply(`🚩 Laporan berhasil dikirim ke Owner untuk ditinjau.\nID laporan: ${reportId}\nTarget: ${targetId}\nStatus: menunggu tinjauan`);
}

async function moderateMarketplaceReports(ctx) {
  if (!ctx.isBotOwner(ctx.userJid, ctx.senderIdentityAliases)) return ctx.reply('⛔ Perintah ini hanya untuk Owner bot.');
  const sub = String(ctx.args[0] || 'list').toLowerCase();
  if (['list', 'daftar', ''].includes(sub)) {
    const reports = await MarketplaceReport.find({ status: 'open' }).sort({ createdAt: 1 }).limit(20).lean();
    return ctx.reply(reports.length ? `🚩 *LAPORAN DIREKTORI TERBUKA*\n\n${reports.map(r => `${r.reportId} — ${r.targetType} ${r.targetId}\nPelapor: ${r.reporterJid}\nAlasan: ${r.reason}\nTutup: .marketreport tutup ${r.reportId} catatan\nAbaikan: .marketreport abaikan ${r.reportId} catatan`).join('\n\n')}` : 'Tidak ada laporan marketplace yang terbuka.');
  }
  if (!['tutup', 'resolve', 'abaikan', 'dismiss'].includes(sub)) return ctx.reply('Format: `.marketreport` atau `.marketreport tutup RPT-ID catatan` / `.marketreport abaikan RPT-ID catatan`.');
  const reportId = String(ctx.args[1] || '').toUpperCase();
  if (!isMarketplaceReportId(reportId)) return ctx.reply('ID laporan tidak valid. Contoh: RPT-1A2B3C4D.');
  const resolutionNote = safeText(ctx.args.slice(2).join(' ') || (sub === 'abaikan' || sub === 'dismiss' ? 'Laporan ditinjau dan tidak ditindaklanjuti.' : 'Laporan telah ditinjau.'), 500);
  const status = ['abaikan', 'dismiss'].includes(sub) ? 'dismissed' : 'resolved';
  const report = await MarketplaceReport.findOneAndUpdate({ reportId, status: 'open' }, { $set: { status, resolutionNote, reviewedBy: ctx.userJid, reviewedAt: new Date() } }, { new: true });
  return ctx.reply(report ? `✅ Laporan ${reportId} ditandai ${status === 'resolved' ? 'selesai' : 'diabaikan'}.` : 'Laporan terbuka tidak ditemukan. Periksa ID atau statusnya.');
}

async function handleMarketAdmin(ctx) {
  if (!ctx.isBotOwner(ctx.userJid, ctx.senderIdentityAliases)) {
    return ctx.reply('⛔ Dashboard direktori portofolio hanya dapat diakses Owner bot.');
  }
  const sub = String(ctx.args[0] || 'dashboard').toLowerCase();
  const pageSize = 8;
  const parsePage = value => { const n = Number.parseInt(value, 10); return Number.isFinite(n) && n > 0 ? Math.min(n, 1000) : 1; };
  const pageInfo = (page, total) => `Halaman ${page}/${Math.max(1, Math.ceil(total / pageSize))}`;
  const dateText = value => value ? new Date(value).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }) : '—';

  if (['help', 'bantuan', 'panduan'].includes(sub)) {
    return ctx.reply(`🧭 *PUSAT MODERASI DIREKTORI PORTOFOLIO*\n\n📊 *.marketadmin* — ringkasan direktori\n👨‍🎨 *.marketadmin designers [halaman]* — profil publik\n🖼️ *.marketadmin pending [halaman]* — karya menunggu moderasi\n🚩 *.marketadmin reports [halaman]* — laporan terbuka\n🕒 *.marketadmin activity* — aktivitas profil dan karya\n\nTidak ada pengelolaan pesanan, penawaran, pembayaran, komisi, atau sengketa melalui bot. Hubungan klien dan desainer berlangsung langsung.`);
  }

  if (['dashboard', 'home', ''].includes(sub)) {
    const [designers, hidden, approvedWorks, pendingWorks, rejectedWorks, openReports, featuredDesigners] = await Promise.all([
      DesignerProfile.countDocuments({ isPublic: true }),
      DesignerProfile.countDocuments({ isPublic: false }),
      PortfolioItem.countDocuments({ moderationStatus: 'approved' }),
      PortfolioItem.countDocuments({ moderationStatus: 'pending' }),
      PortfolioItem.countDocuments({ moderationStatus: 'rejected' }),
      MarketplaceReport.countDocuments({ status: 'open' }),
      DesignerProfile.countDocuments({ isPublic: true, isFeatured: true }),
    ]);
    return ctx.reply(`╭━━〔 🎨 PORTFOLIO DIRECTORY ADMIN 〕━━╮\n┃ 👨‍🎨 Profil publik: ${designers}\n┃ 🙈 Profil disembunyikan: ${hidden}\n┃ 🖼️ Karya disetujui: ${approvedWorks}\n┃ 🕒 Karya menunggu moderasi: ${pendingWorks}\n┃ ⚪ Karya ditolak: ${rejectedWorks}\n┃ ⭐ Desainer unggulan: ${featuredDesigners}\n┃ 🚩 Laporan terbuka: ${openReports}\n╰━━━━━━━━━━━━━━━━━━━━━━╯\n\nMenu Owner:\n.marketadmin designers 1\n.marketadmin pending 1\n.marketadmin reports 1\n.marketadmin activity\n.marketadmin help\n\nPIR Visuals berfungsi sebagai direktori portofolio dan penghubung kontak langsung saja.`);
  }

  if (['designers', 'desainer'].includes(sub)) {
    const page = parsePage(ctx.args[1]);
    const [total, profiles] = await Promise.all([
      DesignerProfile.countDocuments({ isPublic: true }),
      DesignerProfile.find({ isPublic: true }).sort({ isFeatured: -1, updatedAt: -1 }).skip((page - 1) * pageSize).limit(pageSize).lean(),
    ]);
    if (!profiles.length) return ctx.reply('Belum ada profil desainer publik.');
    const rows = await Promise.all(profiles.map(async profile => {
      const [works, contact] = await Promise.all([
        PortfolioItem.countDocuments({ designerId: profile.designerId, moderationStatus: 'approved' }),
        Promise.resolve(Boolean(profile.publicWhatsApp || profile.contactPhone || profile.instagram || profile.behance || profile.dribbble || profile.website)),
      ]);
      return `${profile.isFeatured ? '⭐ ' : ''}${profile.isVerified ? '✓ Ditinjau PIR ' : ''}*${profile.displayName}* — ${profile.designerId}\n${profile.specialties.join(', ') || 'Spesialisasi belum diisi'}${profile.location ? ` • ${profile.location}` : ''}\n${works} karya disetujui • Kontak ${contact ? 'tersedia' : 'belum dicantumkan'}\nProfil: .designer ${profile.designerId}`;
    }));
    return ctx.reply(`👨‍🎨 *PROFIL DESAINER PUBLIK* — ${pageInfo(page, total)}\nTotal: ${total}\n\n${rows.join('\n\n')}\n\nHalaman berikutnya: .marketadmin designers ${page + 1}`);
  }

  if (['pending', 'moderasi', 'works', 'karya'].includes(sub)) {
    const page = parsePage(ctx.args[1]);
    const [total, works] = await Promise.all([
      PortfolioItem.countDocuments({ moderationStatus: 'pending' }),
      PortfolioItem.find({ moderationStatus: 'pending' }).sort({ createdAt: 1 }).skip((page - 1) * pageSize).limit(pageSize).lean(),
    ]);
    return ctx.reply(works.length
      ? `🖼️ *KARYA MENUNGGU MODERASI* — ${pageInfo(page, total)}\n\n${works.map(item => `${item.itemId} — *${item.title}*\nDesainer: ${item.designerId}\nKategori: ${item.category}\nSetujui: .portfolio approve ${item.itemId}\nTolak: .portfolio reject ${item.itemId} alasan`).join('\n\n')}\n\nHalaman berikutnya: .marketadmin pending ${page + 1}`
      : 'Tidak ada karya yang menunggu moderasi.');
  }

  if (['reports', 'laporan'].includes(sub)) {
    const page = parsePage(ctx.args[1]);
    const [total, reports] = await Promise.all([
      MarketplaceReport.countDocuments({ status: 'open' }),
      MarketplaceReport.find({ status: 'open' }).sort({ createdAt: 1 }).skip((page - 1) * pageSize).limit(pageSize).lean(),
    ]);
    return ctx.reply(reports.length
      ? `🚩 *LAPORAN BELUM DITANGANI* — ${pageInfo(page, total)}\n\n${reports.map(report => `${report.reportId} — ${report.targetType} ${report.targetId}\nAlasan: ${report.reason}\nPelapor: ${report.reporterJid}\nTutup: .marketreport tutup ${report.reportId} catatan\nAbaikan: .marketreport abaikan ${report.reportId} catatan`).join('\n\n')}\n\nHalaman berikutnya: .marketadmin reports ${page + 1}`
      : '✅ Tidak ada laporan direktori yang menunggu penanganan.');
  }

  if (['activity', 'aktivitas'].includes(sub)) {
    const [profiles, works, reports] = await Promise.all([
      DesignerProfile.find({}).sort({ updatedAt: -1 }).limit(8).select('designerId displayName isPublic updatedAt').lean(),
      PortfolioItem.find({}).sort({ updatedAt: -1 }).limit(8).select('itemId title moderationStatus updatedAt').lean(),
      MarketplaceReport.find({}).sort({ updatedAt: -1 }).limit(5).select('reportId targetType targetId status updatedAt').lean(),
    ]);
    return ctx.reply(`🕒 *AKTIVITAS DIREKTORI*\n\n*Profil terbaru*\n${profiles.length ? profiles.map(row => `${row.designerId} ${row.displayName} — ${row.isPublic ? 'publik' : 'disembunyikan'} (${dateText(row.updatedAt)})`).join('\n') : 'Belum ada'}\n\n*Karya terbaru*\n${works.length ? works.map(row => `${row.itemId} ${row.title} — ${row.moderationStatus} (${dateText(row.updatedAt)})`).join('\n') : 'Belum ada'}\n\n*Laporan terbaru*\n${reports.length ? reports.map(row => `${row.reportId} ${row.targetType} ${row.targetId} — ${row.status} (${dateText(row.updatedAt)})`).join('\n') : 'Belum ada'}`);
  }

  if (['orders', 'pesanan', 'payments', 'pembayaran', 'finance', 'keuangan', 'performance', 'performa', 'ratings', 'rating', 'ulasan'].includes(sub)) {
    return ctx.reply('Fitur pesanan, penawaran, rating transaksi, dan pembayaran tidak digunakan di PIR Visuals. Bot hanya menampilkan portofolio dan kontak publik desainer. Gunakan `.marketadmin help` untuk menu moderasi direktori.');
  }
  return ctx.reply(`Perintah belum dikenali: *${sub}*.\n\nKetik .marketadmin help untuk menu moderasi direktori.`);
}

function dashboardIdentityJids(ctx) {
  return [...new Set([ctx.userJid, ...(ctx.senderIdentityAliases || [])].filter(Boolean).map(String))];
}
function dashboardPhoneDigits(ctx) {
  return dashboardIdentityJids(ctx)
    .filter(jid => /@(s\.whatsapp\.net|c\.us)$/i.test(jid))
    .map(jid => jid.split('@')[0].replace(/\D/g, ''))
    .filter(Boolean);
}
async function linkWebsiteSignup(ctx, token) {
  if (!isPrivateNotificationContext(ctx)) {
    return ctx.reply('🔐 Demi keamanan, kirim `.portfolio link KODE` melalui chat pribadi dengan bot.');
  }
  if (!/^[a-f0-9]{40,80}$/i.test(String(token || ''))) {
    return ctx.reply('Format kode tidak valid. Salin kode aktivasi dari halaman pendaftaran website.');
  }
  const membership = await requireMember(ctx);
  if (!membership) return true;
  const phoneDigits = dashboardPhoneDigits(ctx);
  const request = await DesignerSignupRequest.findOne({
    tokenHash: createHash('sha256').update(String(token)).digest('hex'),
    consumedAt: null,
    expiresAt: { $gt: new Date() },
  });
  if (!request) return ctx.reply('Kode pendaftaran tidak ditemukan, sudah digunakan, atau kedaluwarsa. Buat permintaan baru di website.');
  if (!phoneDigits.includes(String(request.phoneE164).replace(/\D/g, ''))) {
    return ctx.reply('Nomor WhatsApp ini tidak cocok dengan nomor yang didaftarkan di website. Gunakan nomor yang sama.');
  }
  const identities = dashboardIdentityJids(ctx);
  let profile = await DesignerProfile.findOne({
    $or: [
      { ownerJid: { $in: identities } },
      { contactJid: { $in: identities } },
    ],
  });
  if (!profile) {
    const phoneJid = identities.find(jid => /@(s\.whatsapp\.net|c\.us)$/i.test(jid)) || ctx.userJid;
    profile = await DesignerProfile.create({
      designerId: newId('DSN', 4),
      ownerJid: ctx.userJid,
      contactJid: phoneJid,
      membershipGroupJid: membership.groupJid,
      displayName: request.displayName,
      bio: request.bio || '',
      specialties: request.specialties || [],
      isPublic: true,
    });
  } else if (String(profile.ownerJid) !== String(ctx.userJid)) {
    // Keep the established owner JID; only refresh the verified phone contact alias.
    const phoneJid = identities.find(jid => /@(s\.whatsapp\.net|c\.us)$/i.test(jid));
    if (phoneJid) profile.contactJid = phoneJid;
    await profile.save();
  }
  const existingAccount = await DesignerDashboardAuth.findOne({
    $or: [{ designerId: profile.designerId }, { email: request.email }],
  }).lean();
  if (existingAccount) {
    return ctx.reply('Akun website untuk profil atau email ini sudah terdaftar. Silakan login atau gunakan fitur pemulihan akun di website.');
  }
  await DesignerDashboardAuth.create({
    designerId: profile.designerId,
    email: request.email,
    passwordHash: request.passwordHash,
    emailVerified: false,
    otpAttempts: 0,
  });
  await DesignerSignupRequest.updateOne(
    { _id: request._id, consumedAt: null },
    { $set: { consumedAt: new Date(), linkedDesignerId: profile.designerId } },
  );
  return ctx.reply(`✅ *Akun PIR Visuals berhasil ditautkan!*

Nama: ${profile.displayName}
ID desainer: ${profile.designerId}
Email: ${request.email}

Profil WhatsApp dan website sekarang memakai data yang sama.

Langkah berikutnya:
1. Buka website → Designer Studio → kirim ulang verifikasi email.
2. Verifikasi email dari inbox.
3. Kirim \`.portfolio dashboard otp\` melalui chat pribadi untuk menerima OTP login.
4. Login ke website menggunakan email, password, dan OTP.

Catatan: gambar portfolio tetap harus diunggah manual melalui website.`);
}
async function sendDesignerDashboardOtp(ctx) {
  if (ctx.isGroup || String(ctx.remoteJid || '').endsWith('@g.us')) {
    return ctx.reply('🔐 OTP hanya dapat dikirim melalui chat pribadi dengan bot.');
  }
  const identities = dashboardIdentityJids(ctx);
  const profile = await DesignerProfile.findOne({
    $or: [{ ownerJid: { $in: identities } }, { contactJid: { $in: identities } }],
  }).lean();
  if (!profile) return ctx.reply('Profil desainer belum ditemukan. Daftar melalui `.portfolio daftar` atau tautkan pendaftaran website dengan `.portfolio link KODE`.');
  const account = await DesignerDashboardAuth.findOne({ designerId: profile.designerId });
  if (!account || !account.passwordHash) return ctx.reply('Akun website belum diaktifkan. Daftar di website, lalu tautkan dengan `.portfolio link KODE`.');
  if (account.emailVerified !== true) return ctx.reply('Email belum diverifikasi. Verifikasi email terlebih dahulu melalui website Designer Studio.');
  const otp = String(cryptoRandomInt(100000, 1000000));
  account.otpHash = createHash('sha256').update(otp).digest('hex');
  account.otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);
  account.otpAttempts = 0;
  await account.save();
  return ctx.reply(`🔐 *OTP PIR Visuals*
Kode: *${otp}*
Berlaku 5 menit.
Jangan bagikan kode ini kepada siapa pun.`);
}

async function sendDesignerDashboardSetupToken(ctx) {
  if (ctx.isGroup || String(ctx.remoteJid || '').endsWith('@g.us')) {
    return ctx.reply('🔐 Token aktivasi hanya dapat diminta melalui chat pribadi dengan bot.');
  }
  const ownerAliases = [...new Set([ctx.userJid, ...(ctx.senderIdentityAliases || [])].filter(Boolean).map(String))];
  const profile = await DesignerProfile.findOne({ ownerJid: ctx.userJid }).lean()
    || await DesignerProfile.findOne({ ownerJid: { $in: ownerAliases } }).lean();
  if (!profile) return ctx.reply('Profil desainer milik akun ini belum ditemukan. Daftar melalui `.portfolio daftar` terlebih dahulu.');
  const existing = await DesignerDashboardAuth.findOne({ designerId: profile.designerId });
  if (existing?.passwordHash) return ctx.reply('Akun Designer Studio sudah diaktifkan. Gunakan `.portfolio dashboard otp` untuk meminta kode login.');
  const token = randomBytes(32).toString('hex');
  const setupTokenHash = createHash('sha256').update(token).digest('hex');
  const setupTokenExpiresAt = new Date(Date.now() + 20 * 60 * 1000);
  if (existing) {
    const result = await DesignerDashboardAuth.updateOne(
      { _id: existing._id, $or: [{ passwordHash: { $exists: false } }, { passwordHash: '' }, { passwordHash: null }] },
      { $set: { setupTokenHash, setupTokenExpiresAt } },
    );
    if (!result.matchedCount) return ctx.reply('Akun Designer Studio baru saja diaktifkan. Gunakan `.portfolio dashboard otp` untuk login.');
  } else {
    try {
      await DesignerDashboardAuth.create({ designerId: profile.designerId, setupTokenHash, setupTokenExpiresAt, emailVerified: false, otpAttempts: 0 });
    } catch (error) {
      if (error?.code === 11000) return ctx.reply('Permintaan aktivasi sedang diproses. Coba kembali beberapa saat lagi.');
      throw error;
    }
  }
  const base = String(process.env.PORTFOLIO_PUBLIC_BASE_URL || process.env.SITE_URL || '').replace(/\/$/, '');
  const setupUrl = base ? `${base}/studio/setup` : 'halaman /studio/setup pada website PIR Visuals';
  return ctx.reply(`🔐 *TOKEN AKTIVASI DESIGNER STUDIO*
ID desainer: ${profile.designerId}
Token: *${token}*
Berlaku 20 menit dan hanya dapat digunakan sekali.

Buka ${setupUrl}, masukkan ID desainer, email, token, lalu buat password minimal 12 karakter.
Jangan teruskan token ini kepada siapa pun.`);
}

async function handleDesignerDashboardAction(ctx, action) {
  if (action === 'setup') return sendDesignerDashboardSetupToken(ctx);
  if (action === 'otp') return sendDesignerDashboardOtp(ctx);
  return ctx.reply('Gunakan `.portfolio dashboard setup` untuk aktivasi awal atau `.portfolio dashboard otp` untuk meminta kode login Designer Studio.');
}


async function handlePortfolioPushPreferences(ctx, args = []) {
  if (!isPrivateNotificationContext(ctx)) {
    return ctx.reply('🔒 Pengaturan push notifikasi hanya dapat diubah melalui chat pribadi dengan bot.');
  }
  const profile = await DesignerProfile.findOne({ ownerJid: { $in: [ctx.userJid, ctx.remoteJid].filter(Boolean) } }).select(
    'designerId displayName whatsappPushEnabled whatsappPushEnabledAt whatsappPushQuietHoursEnabled whatsappPushQuietHoursStart whatsappPushQuietHoursEnd',
  );
  if (!profile) return ctx.reply('Kamu belum memiliki profil desainer. Mulai dengan `.portfolio daftar`.');
  const action = String(args[0] || 'status').toLowerCase();

  if (['aktif', 'on', 'enable'].includes(action)) {
    const destination = String(ctx.remoteJid || '').trim();
    if (!destination.endsWith('@s.whatsapp.net') && !destination.endsWith('@lid')) {
      return ctx.reply('JID chat pribadi tidak valid. Kirim perintah ini dari chat pribadi yang sama dengan bot.');
    }
    profile.whatsappPushEnabled = true;
    profile.whatsappPushJid = destination;
    profile.whatsappPushEnabledAt = new Date();
    registerLinkedDesignerDestination(destination, { persistent: true });
    await profile.save();
    return ctx.reply('✅ *Push notifikasi diaktifkan.*\nBot akan mengirim ringkasan aktivitas Designer Studio ke chat pribadi ini. Jam tenang aktif pukul 22.00–08.00 WIB secara default.\n\nMatikan kapan saja dengan `.portfolio notifikasi push nonaktif`.');
  }

  if (['nonaktif', 'off', 'disable'].includes(action)) {
    profile.whatsappPushEnabled = false;
    profile.whatsappPushJid = '';
    profile.whatsappPushEnabledAt = null;
    await profile.save();
    await DesignerNotification.updateMany(
      { designerId: profile.designerId, whatsappDeliveryStatus: { $in: ['pending', 'processing'] } },
      { $set: { whatsappDeliveryStatus: 'skipped', whatsappLeaseToken: '', whatsappLeaseUntil: null, whatsappLastError: 'Owner opted out.' } },
    );
    const reply = await ctx.reply('🔕 *Push notifikasi dinonaktifkan.* Inbox website tetap tersedia melalui `.portfolio notifikasi`. Tidak ada push baru yang akan dikirim.');
    unregisterLinkedDesignerDestination(ctx.remoteJid);
    return reply;
  }

  if (['jam', 'quiet', 'tenang'].includes(action)) {
    const range = String(args[1] || '').trim();
    const match = range.match(/^([01]\d|2[0-3]):([0-5]\d)-([01]\d|2[0-3]):([0-5]\d)$/);
    if (!match) return ctx.reply('Format jam tenang: `.portfolio notifikasi push jam 22:00-08:00`.\nGunakan format 24 jam WIB.');
    const start = `${match[1]}:${match[2]}`;
    const end = `${match[3]}:${match[4]}`;
    if (start === end) return ctx.reply('Jam mulai dan selesai tidak boleh sama.');
    profile.whatsappPushQuietHoursEnabled = true;
    profile.whatsappPushQuietHoursStart = start;
    profile.whatsappPushQuietHoursEnd = end;
    await profile.save();
    return ctx.reply(`✅ Jam tenang diperbarui: *${start}–${end} WIB*. Notifikasi akan ditunda selama periode tersebut.`);
  }

  if (['tanpa-jam-tenang', 'quiet-off'].includes(action)) {
    profile.whatsappPushQuietHoursEnabled = false;
    await profile.save();
    return ctx.reply('Jam tenang dinonaktifkan. Push dapat dikirim kapan saja selama layanan WhatsApp online.');
  }

  if (['jam-tenang', 'quiet-on'].includes(action)) {
    profile.whatsappPushQuietHoursEnabled = true;
    await profile.save();
    return ctx.reply(`Jam tenang diaktifkan: *${profile.whatsappPushQuietHoursStart || '22:00'}–${profile.whatsappPushQuietHoursEnd || '08:00'} WIB*.`);
  }

  return ctx.reply(`🔔 *PENGATURAN PUSH DESIGNER STUDIO*
Status: ${profile.whatsappPushEnabled ? '🟢 Aktif' : '⚪ Nonaktif'}
Jam tenang: ${profile.whatsappPushQuietHoursEnabled === false ? 'Nonaktif' : `${profile.whatsappPushQuietHoursStart || '22:00'}–${profile.whatsappPushQuietHoursEnd || '08:00'} WIB`}
Zona waktu: Asia/Jakarta

Perintah:
• .portfolio notifikasi push aktif
• .portfolio notifikasi push nonaktif
• .portfolio notifikasi push status
• .portfolio notifikasi push jam 22:00-08:00
• .portfolio notifikasi push tanpa-jam-tenang
• .portfolio notifikasi push jam-tenang

Push hanya dikirim ke chat pribadi yang kamu setujui. Inbox manual tetap tersedia melalui .portfolio notifikasi.`);
}

async function handlePortfolioNotifications(ctx, mode = 'unread') {
  if (!isPrivateNotificationContext(ctx)) {
    return ctx.reply('🔒 Notifikasi Designer Studio bersifat pribadi. Buka chat pribadi dengan bot untuk membacanya.');
  }
  const profile = await DesignerProfile.findOne({ ownerJid: { $in: [ctx.userJid, ctx.remoteJid].filter(Boolean) } }).select('designerId displayName').lean();
  if (!profile) return ctx.reply('Kamu belum memiliki profil desainer. Mulai dengan `.portfolio daftar`.');
  const filter = { designerId: profile.designerId };
  if (mode !== 'all') filter.readAt = null;
  const rows = await DesignerNotification.find(filter).sort({ createdAt: -1 }).limit(10).lean();
  if (!rows.length) {
    const unread = await DesignerNotification.countDocuments({ designerId: profile.designerId, readAt: null });
    return ctx.reply(mode === 'all'
      ? 'Belum ada notifikasi website untuk profilmu.'
      : `🔔 Tidak ada notifikasi baru.${unread ? ` Masih ada ${unread} notifikasi yang belum dibaca.` : ''}\nGunakan portfolio notifikasi semua untuk melihat riwayat terbaru.`);
  }
  if (mode !== 'all') {
    const ids = rows.map(row => row.notificationId).filter(Boolean);
    if (ids.length) await DesignerNotification.updateMany(
      { designerId: profile.designerId, notificationId: { $in: ids }, readAt: null },
      { $set: { readAt: new Date() } },
    );
  }
  const unread = await DesignerNotification.countDocuments({ designerId: profile.designerId, readAt: null });
  return ctx.reply(formatWebsiteNotificationRows(rows, profile.displayName, mode, unread));
}

async function handlePortfolioCommand(ctx) {
  const sub = (ctx.args[0] || '').toLowerCase();
  if (!sub || ['help', 'bantuan', '?'].includes(sub)) return ctx.reply(`🎨 *PORTOFOLIO DESAINER*

*Mulai cepat*
1. .portfolio daftar — buat profil publik
2. .portfolio add — upload di chat pribadi (JPEG/PNG/WebP/SVG, maks. 15 MB; SVG sebagai Dokumen)
3. Tunggu moderasi Owner agar karya tampil di direktori
4. .portfolio edit whatsapp 6281234567890 — cantumkan kontak publik (opsional)
5. .portfolio preview — cek profil dan kontak publik
6. .portfolio website — bagikan link portofolio

*Kelola profil dan karya*
.portfolio daftar — buat/edit profil
.portfolio add — upload karya melalui WhatsApp atau website
.portfolio karya — daftar karya sendiri
.portfolio preview — pratinjau profil publik
.portfolio edit nama|bio|spesialisasi|lokasi|whatsapp|instagram|behance|dribbble|website ...
.portfolio edit whatsapp off — sembunyikan nomor WhatsApp
.portfolio status on/off — tampilkan/sembunyikan profil
.portfolio website / qr — bagikan profil publik
.portfolio analytics — statistik tampilan dan klik kontak
.portfolio notifikasi — baca notifikasi website yang belum dibaca
.portfolio notifikasi semua — lihat 10 notifikasi terbaru
.portfolio notifikasi push aktif/nonaktif/status — atur push privat dan jam tenang
.portfolio bahasa id|en — bahasa profil publik
.portfolio watermark on|off — watermark karya
.portfolio delete ART-ID — hapus karya sendiri
.portfolio unggulan ART-ID — unggulan karya (maks. 3)

Moderasi Owner: .portfolio pending / approve ART-ID / reject ART-ID alasan
Owner: .portfolio verified DSN-ID on|off / .portfolio popular DSN-ID on|off

PIR Visuals hanya direktori portofolio. Calon klien menghubungi desainer secara langsung. Tidak ada brief pesanan, penawaran, checkout, pembayaran, komisi, atau sengketa melalui bot.`);
  if (sub === 'daftar' || sub === 'register') return startProfileWizard(ctx);
  if (sub === 'link') return linkWebsiteSignup(ctx, ctx.args[1]);
  if (sub === 'dashboard') return handleDesignerDashboardAction(ctx, String(ctx.args[1] || '').toLowerCase());
  if (['notifikasi', 'notifications', 'notification', 'notif'].includes(sub)) {
    if ((ctx.args[1] || '').toLowerCase() === 'push') {
      return handlePortfolioPushPreferences(ctx, ctx.args.slice(2));
    }
    const mode = ['semua', 'all', 'riwayat'].includes(String(ctx.args[1] || '').toLowerCase()) ? 'all' : 'unread';
    return handlePortfolioNotifications(ctx, mode);
  }
  if (sub === 'website') {
    const profile = await DesignerProfile.findOne({ ownerJid: ctx.userJid }).select('designerId slug displayName isPublic').lean();
    if (!profile) return ctx.reply('Kamu belum punya profil. Gunakan `.portfolio daftar`.');
    const base = String(process.env.PORTFOLIO_PUBLIC_BASE_URL || process.env.SITE_URL || '').replace(/\/$/, '');
    const route = profile.slug ? `/p/${encodeURIComponent(profile.slug)}` : `/designer/${encodeURIComponent(profile.designerId)}`;
    return ctx.reply(`🌐 *PORTFOLIO PUBLIK*\nNama: ${profile.displayName}\nStatus: ${profile.isPublic ? 'Publik' : 'Disembunyikan'}\nLink: ${base ? `${base}${route}` : route}`);
  }
  if (sub === 'qr') {
    const profile = await DesignerProfile.findOne({ ownerJid: ctx.userJid }).select('designerId displayName isPublic').lean();
    if (!profile) return ctx.reply('Kamu belum punya profil. Gunakan `.portfolio daftar`.');
    if (!profile.isPublic) return ctx.reply('Profil sedang disembunyikan. Aktifkan kembali sebelum membagikan QR.');
    const base = String(process.env.PORTFOLIO_PUBLIC_BASE_URL || process.env.SITE_URL || '').replace(/\/$/, '');
    const route = `/qr/${encodeURIComponent(profile.designerId)}`;
    return ctx.reply(`▦ *QR PORTFOLIO ${profile.displayName}*\n${base ? `${base}${route}` : route}\n\nBuka tautan tersebut untuk menampilkan QR yang dapat dipindai.`);
  }
  if (sub === 'analytics') {
    if (!isPrivateNotificationContext(ctx)) return ctx.reply('🔒 Analytics Designer Studio hanya dapat dibaca melalui chat pribadi dengan bot.');
    const profile = await DesignerProfile.findOne({ ownerJid: ctx.userJid }).select('designerId displayName').lean();
    if (!profile) return ctx.reply('Kamu belum punya profil. Gunakan `.portfolio daftar`.');
    const stats = await DesignerAnalytics.findOne({ designerId: profile.designerId }).lean() || {};
    return ctx.reply(`📊 *ANALYTICS · ${profile.displayName}*\nProfile views: ${Number(stats.profileViews || 0).toLocaleString('id-ID')}\nPortfolio views: ${Number(stats.portfolioViews || 0).toLocaleString('id-ID')}\nContact clicks: ${Number(stats.contactClicks || 0).toLocaleString('id-ID')}\n\nStatistik dihitung dari aktivitas yang tercatat pada website. Klik kontak mengarahkan calon klien langsung ke kanal yang dicantumkan desainer.`);
  }
  if (sub === 'bahasa' || sub === 'language') {
    const language = String(ctx.args[1] || '').toLowerCase();
    if (!['id', 'en'].includes(language)) return ctx.reply('Format: `.portfolio bahasa id` atau `.portfolio bahasa en`.');
    const profile = await DesignerProfile.findOneAndUpdate({ ownerJid: ctx.userJid }, { $set: { language } }, { new: true, runValidators: true });
    return ctx.reply(profile ? `🌐 Bahasa portfolio publik diatur ke ${language === 'id' ? 'Bahasa Indonesia' : 'English'}.` : 'Kamu belum punya profil.');
  }
  if (sub === 'watermark') {
    const setting = String(ctx.args[1] || '').toLowerCase();
    if (!['on', 'off'].includes(setting)) return ctx.reply('Format: `.portfolio watermark on` atau `.portfolio watermark off`.');
    const profile = await DesignerProfile.findOneAndUpdate({ ownerJid: ctx.userJid }, { $set: { watermarkEnabled: setting === 'on' } }, { new: true });
    return ctx.reply(profile ? `Watermark portfolio ${profile.watermarkEnabled ? 'diaktifkan' : 'dinonaktifkan'}.` : 'Kamu belum punya profil.');
  }
  if (sub === 'verified' || sub === 'popular') {
    if (!ctx.isBotOwner(ctx.userJid, ctx.senderIdentityAliases)) return ctx.reply('⛔ Hanya Owner bot yang dapat menandai profil ditinjau PIR atau mengatur featured desainer.');
    const designerId = String(ctx.args[1] || '').trim().toUpperCase();
    const setting = String(ctx.args[2] || '').toLowerCase();
    if (!/^DSN-[A-F0-9]{4,16}$/.test(designerId) || !['on', 'off'].includes(setting)) {
      return ctx.reply('Format: .portfolio ' + sub + ' DSN-ID on|off');
    }
    const field = sub === 'verified' ? 'isVerified' : 'isFeatured';
    const profile = await DesignerProfile.findOneAndUpdate({ designerId }, { $set: { [field]: setting === 'on' } }, { new: true });
    return ctx.reply(profile ? `${sub === 'verified' ? '✓ Profil ditinjau PIR' : '★ Featured'} untuk ${profile.displayName}: ${setting === 'on' ? 'aktif' : 'nonaktif'}.` : 'Profil desainer tidak ditemukan.');
  }
  if (sub === 'add' || sub === 'tambah') return startItemWizard(ctx);
  if (sub === 'karya' || sub === 'list') return listOwnWorks(ctx);
  if (sub === 'preview') {
    const profile = await DesignerProfile.findOne({ ownerJid: ctx.userJid }).lean();
    if (!profile) return ctx.reply('Kamu belum punya profil. Gunakan `.portfolio daftar`.');
    const count = await PortfolioItem.countDocuments({ ownerJid: ctx.userJid, moderationStatus: 'approved' });
    return ctx.reply(`${formatProfile(profile, count, { includeContact: true })}\n\nIni pratinjau profil publikmu.`);
  }
  if (sub === 'edit') return editProfile(ctx);
  if (sub === 'status') {
    const status = (ctx.args[1] || '').toLowerCase();
    if (!['on', 'off'].includes(status)) return ctx.reply('Format: `.portfolio status on` atau `.portfolio status off`.');
    if (status === 'on' && !await requireMember(ctx)) return true;
    const profile = await DesignerProfile.findOneAndUpdate({ ownerJid: ctx.userJid }, { $set: { isPublic: status === 'on' } }, { new: true });
    return ctx.reply(profile ? `Profil portofolio sekarang ${profile.isPublic ? '🟢 PUBLIK dan dapat ditemukan' : '⚪ DISEMBUNYIKAN dari direktori'}.` : 'Kamu belum punya profil.');
  }
  if (sub === 'delete' || sub === 'hapus') return deleteOwnWork(ctx, ctx.args[1]);
  if (sub === 'unggulan' || sub === 'featured') return toggleFeaturedWork(ctx, ctx.args[1]);
  if (['pending', 'approve', 'reject'].includes(sub)) return moderateWork(ctx, sub, ctx.args[1], ctx.args.slice(2).join(' '));
  return ctx.reply('Subperintah tidak dikenal. Ketik `.portfolio` untuk melihat bantuan.');
}

async function handleDesignerStudio(ctx) {
  if (!isPrivateNotificationContext(ctx)) return ctx.reply('🔒 Ringkasan Designer Studio hanya dapat dibaca melalui chat pribadi dengan bot.');
  const profile = await DesignerProfile.findOne({ ownerJid: ctx.userJid }).lean();
  if (!profile) return ctx.reply('Kamu belum memiliki profil desainer. Mulai dengan `.portfolio daftar`.');
  const dateInWib = value => new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(value);
  const todayWib = dateInWib(new Date());
  const next30Wib = dateInWib(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
  const [
    approved, pending, rejected, analytics,
    activeServices, publicCollections, publishedTestimonials,
    upcomingAvailability, newLeads, activeProjects, unreadNotifications,
  ] = await Promise.all([
    PortfolioItem.countDocuments({ designerId: profile.designerId, moderationStatus: 'approved' }),
    PortfolioItem.countDocuments({ designerId: profile.designerId, moderationStatus: 'pending' }),
    PortfolioItem.countDocuments({ designerId: profile.designerId, moderationStatus: 'rejected' }),
    DesignerAnalytics.findOne({ designerId: profile.designerId }).lean(),
    DesignService.countDocuments({ designerId: profile.designerId, isActive: true }),
    PortfolioCollection.countDocuments({ designerId: profile.designerId, isPublic: true }),
    DesignerTestimonial.countDocuments({ designerId: profile.designerId, isPublished: true, emailVerified: true }),
    DesignerAvailability.countDocuments({ designerId: profile.designerId, date: { $gte: todayWib, $lte: next30Wib }, status: 'available' }),
    DesignerLead.countDocuments({ designerId: profile.designerId, status: 'new' }),
    ClientProject.countDocuments({ designerId: profile.designerId, status: { $nin: ['completed', 'cancelled'] } }),
    DesignerNotification.countDocuments({ designerId: profile.designerId, readAt: null }),
  ]);
  const base = String(process.env.PORTFOLIO_PUBLIC_BASE_URL || process.env.SITE_URL || '').replace(/\/$/, '');
  const route = profile.slug ? `/p/${encodeURIComponent(profile.slug)}` : `/designer/${encodeURIComponent(profile.designerId)}`;
  const publicUrl = base ? `${base}${route}` : route;
  return ctx.reply(`🎨 *DESIGNER STUDIO — RINGKASAN WEBSITE*
${profile.displayName} • ${profile.designerId}
━━━━━━━━━━━━━━━━━━
*Profil & portofolio*
Status profil: ${profile.isPublic ? '🟢 Publik' : '⚪ Disembunyikan'}
Karya disetujui: ${approved}
Menunggu moderasi: ${pending}
Perlu perbaikan: ${rejected}
Koleksi publik: ${publicCollections}

*Fitur website*
Layanan aktif: ${activeServices}
Testimoni dengan email terverifikasi: ${publishedTestimonials}
Slot tersedia 30 hari ke depan: ${upcomingAvailability}
Calon klien baru: ${newLeads}
Project room aktif: ${activeProjects}
Notifikasi belum dibaca: ${unreadNotifications}

*Analytics*
Profile views: ${Number(analytics?.profileViews || 0).toLocaleString('id-ID')}
Portfolio views: ${Number(analytics?.portfolioViews || 0).toLocaleString('id-ID')}
Contact clicks: ${Number(analytics?.contactClicks || 0).toLocaleString('id-ID')}

*Link portofolio*
${publicUrl}

*Kelola dari WhatsApp*
1. .portfolio preview — pratinjau profil
2. .portfolio edit — ubah data dan kontak publik
3. .portfolio add — upload karya JPEG/PNG/WebP/SVG (maks. 15 MB)
4. .portfolio karya — status karya
5. .portfolio analytics — statistik website
6. .portfolio notifikasi — baca notifikasi website

Detail klien, email, nomor pribadi, brief, dan percakapan tidak ditampilkan dalam ringkasan ini. Kelola detail privat melalui Designer Studio website.

PIR Visuals adalah direktori dan alat pendukung desainer. Kontak calon klien, negosiasi, kesepakatan, dan pembayaran berlangsung langsung di luar bot; tidak ada checkout atau pembayaran melalui bot.`);
}

async function handleServiceCommand(ctx) {
  return ctx.reply(`🗂️ *KATALOG LAYANAN TELAH DISEDERHANAKAN*\n\nPIR Visuals sekarang berfokus pada direktori portofolio desainer, bukan pemesanan paket.\n\n• Cari desainer: .design\n• Lihat portofolio dan kontak: .designer DSN-ID\n• Kelola profilmu: .portfolio\n\nUntuk menampilkan jenis pekerjaan yang kamu tawarkan, jelaskan pada bio dan spesialisasi profil atau tambahkan karya relevan di portofolio. Hubungi desainer secara langsung. Tidak ada checkout, penawaran, atau pembayaran melalui bot.`);
}

async function handleDesignCommand(ctx) {
  const sub = (ctx.args[0] || '').toLowerCase();
  if (!sub) return ctx.reply(`╭━━〔 🎨 DIREKTORI DESAINER 〕━━╮\n┃ Temukan desainer berdasarkan\n┃ portofolio, kategori, gaya, dan lokasi.\n╰━━━━━━━━━━━━━━━━━━━━━━╯\n\n.design kategori <nama>\n.design gaya <nama>\n.design lokasi <kota>\n.design cari <kata kunci>\n.design unggulan — desainer dengan karya unggulan\n.design next / prev — navigasi hasil\n.design reset — hapus filter\n.design simpan DSN-ID — simpan favorit\n.design favorit — daftar favorit\n.designer DSN-ID — profil, karya, dan kontak\n.lapordesain DSN-ID/ART-ID alasan\n.marketreport / .marketadmin — moderasi Owner\n\nPIR Visuals hanya direktori portofolio. Hubungi desainer secara langsung; tidak ada pesanan atau pembayaran melalui bot.`);
  if (sub === 'kategori' || sub === 'category') {
    const value = ctx.args.slice(1).join(' ').trim();
    if (!value) return ctx.reply(`Pilih kategori. Contoh: .design kategori Logo\n${DESIGN_CATEGORIES.join(', ')}`);
    return searchDesigners(ctx, 'category', value);
  }
  if (sub === 'harga' || sub === 'budget') return ctx.reply('Filter harga tidak digunakan di direktori portofolio. Lihat karya dan hubungi desainer langsung untuk mendiskusikan ruang lingkup serta biaya.');
  if (sub === 'gaya' || sub === 'style') {
    const value = ctx.args.slice(1).join(' ').trim();
    if (!value) return ctx.reply(`Masukkan gaya visual. Contoh: .design gaya Anime\n${DESIGN_STYLES.join(', ')}`);
    return searchDesigners(ctx, 'style', value);
  }
  if (sub === 'lokasi' || sub === 'location') {
    const value = ctx.args.slice(1).join(' ').trim();
    if (!value) return ctx.reply('Contoh: `.design lokasi Bandung`.');
    return searchDesigners(ctx, 'location', value);
  }
  if (sub === 'reset' || sub === 'ulang') return searchDesigners(ctx, 'reset');
  if (sub === 'unggulan' || sub === 'featured') return searchDesigners(ctx, 'featured');
  if (sub === 'cari' || sub === 'search') {
    const value = ctx.args.slice(1).join(' ').trim();
    if (!value) return ctx.reply('Masukkan kata kunci. Contoh: .design cari futuristik');
    return searchDesigners(ctx, 'query', value);
  }
  if (['next', 'prev'].includes(sub)) {
    const state = searchPages.get(ctx.userJid);
    if (!state) return ctx.reply('Lakukan pencarian dulu, misalnya `.design kategori logo`.');
    state.page += sub === 'next' ? 1 : -1;
    return renderSearchPage(ctx, state);
  }
  if (['simpan', 'save', 'favorit', 'batal', 'hapus'].includes(sub)) return handleFavoriteCommand(ctx, sub, ctx.args[1]);
  return ctx.reply('Subperintah tidak dikenal. Ketik `.design` untuk menu bantuan. Navigasi hasil: `.design next` atau `.design prev`.');
}

export async function handleDesignMarketplaceMessage(ctx) {
  if (ctx.isCommand && ctx.command === 'cancel') {
    const wizard = activeWizards.get(ctx.userJid);
    if (!wizard) return false;
    activeWizards.delete(ctx.userJid);
    if (wizard.type === 'item' && wizard.draft?.absolutePath) {
      await fs.promises.unlink(wizard.draft.absolutePath).catch(() => {});
    }
    const labels = { profile: 'Pembuatan/edit profil desainer', item: 'Penambahan karya portofolio' };
    await ctx.reply(`❎ ${labels[wizard.type] || 'Proses'} dibatalkan. Data sementara dibersihkan; kamu bisa memulai lagi kapan saja.`);
    return true;
  }
  if (!ctx.isCommand && activeWizards.has(ctx.userJid)) return Boolean(await handleWizardMessage(ctx));
  if (!ctx.isCommand) return false;
  if (ctx.command === 'client' || ctx.command === 'klien') {
    await ctx.reply('Pusat pelanggan tidak lagi mengelola pesanan melalui bot. Cari desainer dengan `.design`, lalu hubungi kontak pada `.designer DSN-ID` secara langsung.');
    return true;
  }
  if (ctx.command === 'studio') {
    if (await ctx.requireDatabase(ctx.sock, ctx.remoteJid) === false) return true;
    await handleDesignerStudio(ctx);
    return true;
  }
  if (ctx.command === 'service' || ctx.command === 'layanan') {
    await handleServiceCommand(ctx);
    return true;
  }
  if (ctx.command === 'requestdesign') {
    await ctx.reply('Fitur brief, penawaran, dan pesanan melalui bot sudah dinonaktifkan. PIR Visuals hanya direktori portofolio. Cari desainer dengan `.design`, buka `.designer DSN-ID`, lalu hubungi kontak yang dicantumkan secara langsung. Tidak ada payment atau transaksi melalui bot.');
    return true;
  }
  if (ctx.command === 'portfolio') {
    if (await ctx.requireDatabase(ctx.sock, ctx.remoteJid) === false) return true;
    return Boolean(await handlePortfolioCommand(ctx));
  }
  if (ctx.command === 'design') {
    if (await ctx.requireDatabase(ctx.sock, ctx.remoteJid) === false) return true;
    return Boolean(await handleDesignCommand(ctx));
  }
  if (ctx.command === 'designer') {
    if (await ctx.requireDatabase(ctx.sock, ctx.remoteJid) === false) return true;
    await showDesigner(ctx, ctx.args[0]);
    return true;
  }
  if (ctx.command === 'lapordesain') {
    if (await ctx.requireDatabase(ctx.sock, ctx.remoteJid) === false) return true;
    await reportMarketplaceTarget(ctx);
    return true;
  }
  if (ctx.command === 'marketreport') {
    if (await ctx.requireDatabase(ctx.sock, ctx.remoteJid) === false) return true;
    await moderateMarketplaceReports(ctx);
    return true;
  }
  if (ctx.command === 'marketadmin') {
    if (await ctx.requireDatabase(ctx.sock, ctx.remoteJid) === false) return true;
    await handleMarketAdmin(ctx);
    return true;
  }
  return false;
}
