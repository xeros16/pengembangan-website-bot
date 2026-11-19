import { randomBytes } from 'node:crypto';

export const DESIGN_SEASON_COMMANDS = new Set(['designseason']);
const CATEGORIES = new Set(['poster', 'branding', 'ui', 'social', 'packaging', 'illustration', 'typography', 'photography']);

function clean(value, max = 300) {
  return String(value ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/[*_~`]/g, '').replace(/\s+/g, ' ').trim().slice(0, max);
}
function makeCode(prefix = '') { return `${prefix}${randomBytes(4).toString('hex').toUpperCase()}`; }
function displayName(value, fallback = 'Anggota') {
  const name = clean(value, 60);
  const digits = name.replace(/\D/g, '');
  return !name || name.includes('@') || (digits.length >= 8 && /^[+\d\s().-]+$/.test(name)) ? fallback : name;
}
function publicHttps(value) {
  try {
    const url = new URL(String(value || '').trim());
    if (url.protocol !== 'https:' || url.username || url.password) return null;
    const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, '');
    if (!host.includes('.') || /^\d{1,3}(?:\.\d{1,3}){3}$/.test(host) || host.includes(':')) return null;
    if (/\.(?:local|internal|lan|home\.arpa|test|example|invalid)$/i.test(host)) return null;
    url.hash = '';
    return url.toString();
  } catch { return null; }
}
function formatTime(value) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return 'Belum dijadwalkan';
  return `${date.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })} WIB`;
}
function queryRows(query) { return query && typeof query.lean === 'function' ? query.lean() : query; }
function seasonHelp(prefix = '.') {
  return [
    '🏆 *PIR DESIGN SEASONS*',
    `${prefix}designseason buat Judul | brief tema | kategori — Admin membuat draft season.`,
    `${prefix}designseason ronde tambah KODE Judul ronde | brief | kategori | durasi-jam — tambah ronde (2–8 ronde).`,
    `${prefix}designseason mulai KODE — buka ronde pertama.`,
    `${prefix}designseason list — lihat season di grup.`,
    `${prefix}designseason lihat KODE — detail season dan ronde aktif.`,
    `${prefix}designseason submit KODE Judul karya | https://tautan | refleksi — kirim karya ronde aktif.`,
    `${prefix}designseason galeri KODE [KODE-RONDE] — lihat karya ronde.`,
    `${prefix}designseason feedback KODE-KARYA 5 masukan — peer review.`,
    `${prefix}designseason ronde tutup KODE — tutup ronde aktif.`,
    `${prefix}designseason ronde lanjut KODE — mulai ronde berikutnya.`,
    `${prefix}designseason hasil KODE — hasil setelah season selesai.`,
    `${prefix}designseason moderasi hide|restore KODE-KARYA [alasan] — Admin grup.`,
    `${prefix}designseason batal KODE — pembuat/Admin membatalkan season.`,
    '',
    'Aturan: 2–8 ronde, durasi 1–168 jam per ronde, satu season aktif per grup, satu kiriman aktif per anggota per ronde. Peer review adalah apresiasi komunitas, bukan sertifikasi kualitas.',
  ].join('\n');
}

function isOwner(ctx) {
  return typeof ctx.isBotOwner === 'function' && ctx.isBotOwner(ctx.userJid, ctx.senderIdentityAliases || []);
}
async function canManage(ctx, season = null) {
  if (isOwner(ctx) || (season && season.createdBy === ctx.userJid)) return true;
  if (typeof ctx.isGroupAdmin !== 'function') return false;
  return Boolean(await ctx.isGroupAdmin(ctx.sock, ctx.remoteJid, ctx.sender || ctx.userJid));
}
function currentRound(season) {
  return (season.rounds || []).find(round => round.code === season.activeRoundCode) || null;
}
async function saveSeason(DesignSeason, season, expectedStatus = season.status) {
  return DesignSeason.findOneAndUpdate(
    { groupJid: season.groupJid, code: season.code, status: expectedStatus },
    { $set: { rounds: season.rounds, activeRoundCode: season.activeRoundCode, status: season.status, closedAt: season.closedAt || null, closedBy: season.closedBy || '' } },
    { new: true },
  );
}
async function closeExpiredRound(DesignSeason, season, now = new Date()) {
  const expectedStatus = season.status;
  const round = currentRound(season);
  if (!round || round.status !== 'open' || new Date(round.endsAt).getTime() > now.getTime()) return season;
  round.status = 'closed';
  round.closedAt = now;
  round.closedBy = 'system';
  season.activeRoundCode = '';
  if (!(season.rounds || []).some(item => item.status === 'pending')) {
    season.status = 'completed';
    season.closedAt = now;
    season.closedBy = 'system';
  }
  try { return (await saveSeason(DesignSeason, season, expectedStatus)) || season; }
  catch (error) { console.warn('[DESIGN SEASON EXPIRY]', error?.message || error); return season; }
}
async function findSeason(DesignSeason, remoteJid, code) {
  return DesignSeason.findOne({ groupJid: remoteJid, code });
}

export async function handleDesignSeasonCommands(ctx) {
  const {
    args = [], reply, PREFIX = '.', isGroup, remoteJid, userJid, msg,
    DesignSeason, DesignSeasonSubmission, getDbReady = () => true, getImageTarget,
  } = ctx;
  const action = String(args[0] || 'help').toLowerCase();
  const code = clean(action === 'ronde' || action === 'round' ? args[2] : args[1], 16).toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (['help', 'bantuan', 'menu', ''].includes(action)) return reply(seasonHelp(PREFIX));
  if (!isGroup) return reply('Design Seasons hanya tersedia di grup komunitas agar ronde, galeri, dan peer review tetap berada di ruang asal.');
  if (!getDbReady() || !DesignSeason || !DesignSeasonSubmission) return reply('⚠️ Design Seasons membutuhkan MongoDB serta model DesignSeason dan DesignSeasonSubmission.');

  if (['buat', 'create'].includes(action)) {
    if (!await canManage(ctx)) return reply('⛔ Hanya Admin grup atau Owner bot yang dapat membuat Design Season.');
    const fields = args.slice(1).join(' ').split('|').map(value => clean(value, 500));
    const [title, brief, categoryRaw] = fields;
    const category = String(categoryRaw || '').toLowerCase();
    if (title.length < 5 || title.length > 80 || brief.length < 20 || !CATEGORIES.has(category)) {
      return reply(`Format: ${PREFIX}designseason buat Judul Season | brief tema minimal 20 karakter | kategori\nKategori: ${[...CATEGORIES].join(', ')}`);
    }
    try {
      let active = await DesignSeason.findOne({ groupJid: remoteJid, status: 'active' });
      if (active) active = await closeExpiredRound(DesignSeason, active);
      if (active?.status === 'active') return reply(`Masih ada season aktif: *${active.title}* [${active.code}]. Selesaikan ronde berikutnya atau batalkan sebelum memulai season baru.`);
      const season = await DesignSeason.create({
        code: makeCode('S'), groupJid: remoteJid, createdBy: userJid,
        createdByName: displayName(msg?.pushName, 'Admin grup'), title, brief, category,
        status: 'draft', rounds: [], activeRoundCode: '',
      });
      return reply(`📝 *DESIGN SEASON DIBUAT*\n${season.title} [${season.code}]\nStatus: Draft\n\nTambahkan minimal dua ronde:\n${PREFIX}designseason ronde tambah ${season.code} Babak 1 | Brief ronde pertama yang jelas. | ${category} | 24`);
    } catch (error) {
      console.warn('[DESIGN SEASON CREATE]', error?.message || error);
      if (Number(error?.code) === 11000) return reply('Season aktif lain baru saja dibuat untuk grup ini. Muat ulang dengan .designseason list.');
      return reply('⚠️ Draft season belum berhasil dibuat.');
    }
  }

  if (['list', 'daftar'].includes(action)) {
    try {
      const rows = await queryRows(DesignSeason.find({ groupJid: remoteJid, status: { $in: ['draft', 'active', 'completed'] } }).sort({ createdAt: -1 }).limit(10));
      return reply(rows.length ? `🏆 *DESIGN SEASONS GRUP INI*\n\n${rows.map(item => `${item.status === 'active' ? '🟢' : '📝'} *${clean(item.title, 80)}* [${item.code}]\n   ${item.status.toUpperCase()} · ${(item.rounds || []).length} ronde${item.activeRoundCode ? ` · Aktif: ${item.activeRoundCode}` : ''}`).join('\n\n')}` : 'Belum ada Design Season draft atau aktif di grup ini.');
    } catch { return reply('⚠️ Daftar season belum dapat dimuat.'); }
  }

  if (['moderasi', 'moderate'].includes(action)) {
    if (!await canManage(ctx)) return reply('⛔ Hanya Admin grup atau Owner bot yang dapat memoderasi kiriman season.');
    const sub = String(args[1] || '').toLowerCase(), entryCode = clean(args[2], 16).toUpperCase(), reason = clean(args.slice(3).join(' '), 240);
    if (!['hide', 'restore'].includes(sub) || !entryCode) return reply(`Format: ${PREFIX}designseason moderasi hide KODE-KARYA [alasan] atau restore KODE-KARYA`);
    try {
      const entry = await DesignSeasonSubmission.findOneAndUpdate(
        { groupJid: remoteJid, code: entryCode, status: sub === 'hide' ? 'active' : 'hidden' },
        { $set: { status: sub === 'hide' ? 'hidden' : 'active', moderationNote: sub === 'hide' ? reason : '', moderatedBy: userJid, moderatedAt: new Date() } },
        { new: true },
      );
      return reply(entry ? (sub === 'hide' ? `🙈 Karya ${entryCode} disembunyikan dari galeri.` : `✅ Karya ${entryCode} dipulihkan ke galeri.`) : 'Karya tidak ditemukan atau statusnya sudah berubah.');
    } catch { return reply('⚠️ Moderasi karya belum berhasil.'); }
  }

  if (['feedback', 'review'].includes(action)) {
    const entryCode = clean(args[1], 16).toUpperCase();
    const score = Number(args[2]);
    const comment = clean(args.slice(3).join(' '), 400);
    if (!entryCode || !Number.isInteger(score) || score < 1 || score > 5 || comment.length < 8) return reply(`Format: ${PREFIX}designseason feedback KODE-KARYA 1-5 masukan minimal 8 karakter.`);
    try {
      const entry = await DesignSeasonSubmission.findOne({ groupJid: remoteJid, code: entryCode, status: 'active' });
      if (!entry) return reply('Kode karya tidak ditemukan pada grup ini.');
      if (entry.userJid === userJid) return reply('Kamu tidak dapat memberi review pada karya sendiri.');
      const reviewSeason = await findSeason(DesignSeason, remoteJid, entry.seasonCode);
      const reviewRound = reviewSeason && (reviewSeason.rounds || []).find(item => item.code === entry.roundCode);
      if (!reviewSeason || reviewSeason.status !== 'active' || !reviewRound || reviewRound.status !== 'open' || new Date(reviewRound.endsAt).getTime() <= Date.now()) return reply('Periode peer review ronde ini sudah ditutup.');
      const updated = await DesignSeasonSubmission.findOneAndUpdate(
        { groupJid: remoteJid, code: entryCode, status: 'active', 'feedback.reviewerJid': { $ne: userJid } },
        { $push: { feedback: { reviewerJid: userJid, reviewerName: displayName(msg?.pushName), score, comment, createdAt: new Date() } } },
        { new: true },
      );
      return reply(updated ? '💬 *PEER REVIEW TERSIMPAN*\nTerima kasih atas masukan yang spesifik dan membangun.' : 'Kamu sudah memberi review pada karya ini atau status karya berubah.');
    } catch { return reply('⚠️ Peer review belum berhasil disimpan.'); }
  }

  if (!code) return reply(`Sertakan kode season. Ketik ${PREFIX}designseason list.`);
  let season;
  try { season = await findSeason(DesignSeason, remoteJid, code); }
  catch { return reply('⚠️ Data season belum dapat dimuat.'); }
  if (!season) return reply('Season tidak ditemukan pada grup ini.');
  season = await closeExpiredRound(DesignSeason, season);

  if (['lihat', 'detail', 'info'].includes(action)) {
    const round = currentRound(season);
    return reply([
      `🏆 *${clean(season.title, 80)}* [${season.code}]`,
      `Status: ${season.status.toUpperCase()}`,
      `Tema: ${clean(season.brief, 450)}`,
      `Kategori: ${season.category}`,
      `Ronde: ${(season.rounds || []).length}/8`,
      round ? `Ronde aktif: ${round.title} [${round.code}]\nBatas: ${formatTime(round.endsAt)}\nBrief: ${round.brief}` : 'Tidak ada ronde yang sedang dibuka.',
      ...(season.rounds || []).map((item, index) => `${index + 1}. ${item.title} [${item.code}] — ${item.status}`),
    ].join('\n'));
  }

  if (['ronde', 'round'].includes(action)) {
    const sub = String(args[1] || '').toLowerCase();
    if (sub === 'tambah' || sub === 'add') {
      if (!await canManage(ctx, season)) return reply('⛔ Hanya pembuat season, Admin grup, atau Owner bot yang dapat menambah ronde.');
      if (season.status !== 'draft') return reply('Ronde hanya dapat ditambahkan saat season masih Draft.');
      if ((season.rounds || []).length >= 8) return reply('Maksimal delapan ronde dalam satu season.');
      const fields = args.slice(3).join(' ').split('|').map(value => clean(value, 500));
      const [title, brief, categoryRaw, durationRaw] = fields;
      const category = String(categoryRaw || '').toLowerCase();
      const durationHours = durationRaw === undefined || durationRaw === '' ? 24 : Number(durationRaw);
      if (!title || title.length < 3 || brief.length < 20 || !CATEGORIES.has(category) || !Number.isInteger(durationHours) || durationHours < 1 || durationHours > 168) {
        return reply(`Format: ${PREFIX}designseason ronde tambah ${season.code} Judul ronde | brief minimal 20 karakter | kategori | durasi-jam`);
      }
      const round = { code: makeCode('R'), title, brief, category, durationHours, startsAt: null, endsAt: null, status: 'pending', closedAt: null, closedBy: '' };
      try {
        const updated = await DesignSeason.findOneAndUpdate(
          { groupJid: remoteJid, code: season.code, status: 'draft' },
          { $push: { rounds: round } }, { new: true },
        );
        return reply(updated ? `✅ Ronde *${round.title}* ditambahkan ke ${season.title}.\nKode ronde: ${round.code}\nTotal: ${updated.rounds.length}/8.` : 'Draft season berubah. Muat ulang detail season.');
      } catch { return reply('⚠️ Ronde belum berhasil ditambahkan.'); }
    }
    if (['tutup', 'close'].includes(sub)) {
      if (!await canManage(ctx, season)) return reply('⛔ Hanya pembuat season, Admin grup, atau Owner bot yang dapat menutup ronde.');
      const round = currentRound(season);
      if (!round || round.status !== 'open') return reply('Tidak ada ronde aktif yang dapat ditutup.');
      round.status = 'closed'; round.closedAt = new Date(); round.closedBy = userJid;
      season.activeRoundCode = '';
      if (!(season.rounds || []).some(item => item.status === 'pending')) {
        season.status = 'completed'; season.closedAt = new Date(); season.closedBy = userJid;
      }
      let updated;
      try { updated = await saveSeason(DesignSeason, season, 'active'); } catch (error) {
        console.warn('[DESIGN SEASON ROUND CLOSE]', error?.message || error);
        return reply('⚠️ Ronde belum berhasil ditutup. Coba muat ulang detail season.');
      }
      return reply(updated ? `🔒 Ronde *${round.title}* ditutup. ${updated.status === 'completed' ? 'Season selesai; hasil akhir kini tersedia.' : `Admin dapat membuka ronde berikutnya dengan ${PREFIX}designseason ronde lanjut ${season.code}.`}` : 'Status season berubah. Muat ulang detailnya.');
    }
    if (['lanjut', 'next', 'mulai'].includes(sub)) {
      if (!await canManage(ctx, season)) return reply('⛔ Hanya pembuat season, Admin grup, atau Owner bot yang dapat membuka ronde.');
      if (season.status !== 'active') return reply('Season harus sudah dimulai. Gunakan .designseason mulai KODE untuk membuka ronde pertama.');
      if (season.activeRoundCode) return reply('Masih ada ronde aktif. Tutup ronde tersebut sebelum membuka ronde berikutnya.');
      const next = (season.rounds || []).find(item => item.status === 'pending');
      if (!next) return reply('Tidak ada ronde pending. Season sudah selesai atau belum memiliki ronde.');
      if (season.status === 'draft' && season.rounds.length < 2) return reply('Tambahkan minimal dua ronde sebelum memulai Design Season.');
      const now = new Date();
      next.status = 'open'; next.startsAt = now; next.endsAt = new Date(now.getTime() + next.durationHours * 60 * 60 * 1000);
      season.activeRoundCode = next.code; season.status = 'active';
      let updated;
      try { updated = await saveSeason(DesignSeason, season, 'active'); } catch (error) {
        console.warn('[DESIGN SEASON ROUND OPEN]', error?.message || error);
        if (Number(error?.code) === 11000) return reply('Sudah ada Design Season aktif lain pada grup ini. Selesaikan season tersebut sebelum membuka ronde.');
        return reply('⚠️ Ronde berikutnya belum berhasil dibuka.');
      }
      return reply(updated ? `🚀 *RONDE DIBUKA*\n${updated.title}\n${next.title} [${next.code}]\nBatas: ${formatTime(next.endsAt)}\n\nPeserta dapat mengirim karya dengan ${PREFIX}designseason submit ${updated.code} Judul | https://tautan | refleksi` : 'Season berubah saat ronde dibuka. Muat ulang detailnya.');
    }
    return reply(`Subperintah ronde: tambah, tutup, lanjut. Ketik ${PREFIX}designseason help.`);
  }

  if (['mulai', 'start'].includes(action)) {
    if (!await canManage(ctx, season)) return reply('⛔ Hanya pembuat season, Admin grup, atau Owner bot yang dapat memulai season.');
    if (season.status !== 'draft') return reply('Season ini bukan Draft.');
    if ((season.rounds || []).length < 2) return reply('Tambahkan minimal dua ronde sebelum memulai season.');
    // Delegate to the same guarded round-opening path.
    const next = season.rounds.find(item => item.status === 'pending');
    if (!next) return reply('Tidak ada ronde pending.');
    const now = new Date(); next.status = 'open'; next.startsAt = now; next.endsAt = new Date(now.getTime() + next.durationHours * 60 * 60 * 1000);
    season.activeRoundCode = next.code; season.status = 'active';
    let updated;
    try { updated = await saveSeason(DesignSeason, season, 'draft'); } catch (error) {
      console.warn('[DESIGN SEASON START]', error?.message || error);
      if (Number(error?.code) === 11000) return reply('Grup ini sudah memiliki Design Season aktif. Selesaikan season tersebut sebelum memulai draft ini.');
      return reply('⚠️ Season belum berhasil dimulai.');
    }
    return reply(updated ? `🚀 *DESIGN SEASON DIMULAI*\n${updated.title}\nRonde 1: ${next.title} [${next.code}]\nBatas: ${formatTime(next.endsAt)}` : 'Draft season berubah. Muat ulang detailnya.');
  }

  if (['submit', 'kirim', 'ikut'].includes(action)) {
    const round = currentRound(season);
    if (season.status !== 'active' || !round || round.status !== 'open' || new Date(round.endsAt).getTime() <= Date.now()) return reply('Tidak ada ronde aktif. Tunggu Admin membuka ronde berikutnya.');
    const fields = args.slice(2).join(' ').split('|').map(value => value.trim());
    const title = clean(fields[0], 100), workUrl = publicHttps(fields[1] || ''), reflection = clean(fields.slice(2).join(' | '), 400);
    const hasImage = typeof getImageTarget === 'function' && Boolean(getImageTarget(msg));
    if (!title) return reply(`Format: ${PREFIX}designseason submit ${season.code} Judul karya | https://tautan | refleksi`);
    if (fields[1] && !workUrl) return reply('Tautan karya harus HTTPS publik tanpa username/password. Kosongkan tautan jika gambar dilampirkan pada pesan.');
    if (!workUrl && !hasImage) return reply('Lampirkan gambar pada pesan atau sertakan tautan karya HTTPS.');
    const challengeKey = `season:${season.code}:${round.code}`;
    try {
      const existing = await DesignSeasonSubmission.findOne({ groupJid: remoteJid, seasonCode: season.code, roundCode: round.code, userJid });
      if (existing?.status === 'hidden') return reply('Kiriman ronde ini disembunyikan Admin. Hubungi Admin untuk peninjauan; kiriman baru tidak dapat melewati moderasi.');
      const submission = await DesignSeasonSubmission.findOneAndUpdate(
        { groupJid: remoteJid, seasonCode: season.code, roundCode: round.code, userJid, status: { $ne: 'hidden' } },
        {
          $set: { title, workUrl: workUrl || '', reflection, userName: displayName(msg?.pushName), sourceMessageId: hasImage ? String(msg?.key?.id || '') : '', feedback: [], status: 'active', updatedAt: new Date() },
          $setOnInsert: { code: makeCode('E'), groupJid: remoteJid, seasonCode: season.code, roundCode: round.code, userJid, roundTitle: round.title, createdAt: new Date() },
        },
        { upsert: !existing, new: true, setDefaultsOnInsert: true },
      );
      if (!submission) return reply('Kiriman berubah saat disimpan. Minta Admin memeriksa status moderasinya.');
      return reply(`✅ *KARYA RONDE TERSIMPAN*\n${season.title} · ${round.title}\nKode karya: ${submission.code}\n${workUrl || 'Gambar tersedia pada pesan asli.'}\n\nKamu dapat memperbarui karya selama ronde terbuka; peer review sebelumnya akan direset.`);
    } catch (error) {
      console.warn('[DESIGN SEASON SUBMIT]', error?.message || error);
      return reply('⚠️ Karya belum berhasil disimpan.');
    }
  }

  if (['galeri', 'gallery'].includes(action)) {
    const roundCode = clean(args[2] || season.activeRoundCode || (season.rounds || []).filter(item => item.status === 'closed').at(-1)?.code || '', 12).toUpperCase();
    if (!roundCode) return reply('Belum ada ronde yang dapat ditampilkan.');
    const round = (season.rounds || []).find(item => item.code === roundCode);
    if (!round) return reply('Kode ronde tidak ditemukan pada season ini.');
    try {
      const entries = await queryRows(DesignSeasonSubmission.find({ groupJid: remoteJid, seasonCode: season.code, roundCode, status: 'active' }).sort({ updatedAt: -1 }).limit(30));
      return reply(entries.length ? `🖼️ *GALERI ${season.title} — ${round.title}*\n\n${entries.map((entry, index) => `${index + 1}. *${clean(entry.title, 100)}* — ${displayName(entry.userName)}\n   ${entry.code} · ${(entry.feedback || []).length} review${entry.workUrl ? `\n   ${entry.workUrl}` : '\n   Lihat gambar pada pesan asli pengirim.'}`).join('\n\n')}\n\nGunakan ${PREFIX}designseason feedback KODE-KARYA 5 Masukan yang membangun.` : `Belum ada karya pada ronde ${round.title}.`);
    } catch { return reply('⚠️ Galeri ronde belum dapat dimuat.'); }
  }

  if (['hasil', 'results'].includes(action)) {
    if (season.status !== 'completed') return reply('Hasil akhir baru tersedia setelah seluruh ronde ditutup dan season selesai.');
    try {
      const entries = await queryRows(DesignSeasonSubmission.find({ groupJid: remoteJid, seasonCode: season.code, status: 'active' }).sort({ updatedAt: -1 }).limit(200));
      if (!entries.length) return reply('Season selesai tanpa kiriman aktif.');
      const byDesigner = new Map();
      for (const entry of entries) {
        const reviews = Array.isArray(entry.feedback) ? entry.feedback : [];
        const row = byDesigner.get(entry.userJid) || { name: displayName(entry.userName), rounds: 0, reviews: 0, scoreTotal: 0 };
        row.rounds += 1; row.reviews += reviews.length;
        for (const review of reviews) row.scoreTotal += Number(review.score || 0);
        byDesigner.set(entry.userJid, row);
      }
      const rows = [...byDesigner.values()].map(row => ({ ...row, average: row.reviews ? (row.scoreTotal / row.reviews).toFixed(1) : '—' })).sort((a, b) => {
        if (a.average === '—' && b.average !== '—') return 1;
        if (b.average === '—' && a.average !== '—') return -1;
        if (a.average !== '—' && b.average !== '—') return Number(b.average) - Number(a.average);
        return b.rounds - a.rounds;
      });
      return reply(`🏆 *HASIL DESIGN SEASON — ${season.title}*\n\n${rows.map((row, index) => `${index + 1}. *${row.name}*\n   ${row.rounds} ronde · ${row.reviews} review · apresiasi rata-rata ${row.average}/5`).join('\n\n')}\n\nSkor adalah ringkasan peer review sukarela, bukan penilaian objektif atau sertifikasi. Partisipasi dan review tidak menyatakan kualitas profesional.`);
    } catch { return reply('⚠️ Hasil season belum dapat dihitung.'); }
  }

  if (['batal', 'cancel'].includes(action)) {
    if (!await canManage(ctx, season)) return reply('⛔ Hanya pembuat season, Admin grup, atau Owner bot yang dapat membatalkan season.');
    if (season.status === 'completed' || season.status === 'cancelled') return reply('Season sudah berakhir.');
    const updated = await DesignSeason.findOneAndUpdate(
      { groupJid: remoteJid, code: season.code, status: season.status },
      { $set: { status: 'cancelled', activeRoundCode: '', closedAt: new Date(), closedBy: userJid } },
      { new: true },
    );
    return reply(updated ? `Season *${season.title}* dibatalkan. Riwayat karya tetap tersimpan sesuai kebijakan grup.` : 'Status season berubah. Muat ulang detailnya.');
  }

  return reply(`Subperintah tidak dikenali. Ketik ${PREFIX}designseason help.`);
}
