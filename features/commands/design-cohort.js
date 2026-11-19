import { randomBytes } from 'node:crypto';

export const DESIGN_COHORT_COMMANDS = new Set(['cohort']);
const MAX_COHORT_MEMBERS = 50;
const MAX_FACILITATORS = 5;
const MAX_MILESTONES = 12;
const MAX_ACTIVE_COHORTS_PER_GROUP = 3;

function cleanText(value, max = 300) {
  return String(value || '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
}

function safeDisplayName(value, fallback = 'Anggota') {
  const name = cleanText(value, 60);
  const digits = name.replace(/\D/g, '');
  if (!name || name.includes('@') || (digits.length >= 8 && /^[+\d\s().-]+$/.test(name))) return fallback;
  return name;
}

function makeCode(length = 8) {
  return randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length).toUpperCase();
}

function parseFields(tokens = []) {
  return tokens.join(' ').split('|').map(value => cleanText(value, 500));
}

function formatDate(value) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return 'Tidak ditentukan';
  return `${date.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })} WIB`;
}

function isGroupContext(ctx) {
  return Boolean(ctx?.isGroup && typeof ctx.remoteJid === 'string' && ctx.remoteJid.endsWith('@g.us'));
}

function databaseReady(ctx) {
  try { return Boolean(ctx?.getDbReady?.() && ctx.LearningCohort && ctx.LearningCohortCheckin); }
  catch { return false; }
}

function isOwner(ctx) {
  return Boolean(typeof ctx.isBotOwner === 'function' && ctx.isBotOwner(ctx.userJid, ctx.senderIdentityAliases || []));
}

async function isGroupAdmin(ctx) {
  if (isOwner(ctx)) return true;
  if (typeof ctx.isGroupAdmin !== 'function') return false;
  try { return Boolean(await ctx.isGroupAdmin(ctx.sock, ctx.remoteJid, ctx.sender || ctx.userJid)); }
  catch { return false; }
}

function getMentionedTarget(ctx) {
  const message = ctx?.msg?.message || {};
  const context = message.extendedTextMessage?.contextInfo
    || message.imageMessage?.contextInfo
    || message.videoMessage?.contextInfo
    || message.documentMessage?.contextInfo
    || {};
  const mentioned = Array.isArray(context.mentionedJid) ? context.mentionedJid[0] : '';
  if (mentioned) return mentioned;
  try { return ctx.getQuotedMessage?.(ctx.msg)?.key?.participant || ''; }
  catch { return ''; }
}

function isPublicHttpsUrl(value) {
  if (!value) return true;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password) return false;
    const host = url.hostname.toLowerCase();
    return Boolean(host && host !== 'localhost' && !host.endsWith('.localhost') && !host.endsWith('.local'));
  } catch { return false; }
}

function findMilestone(cohort, code) {
  return (cohort?.milestones || []).find(item => String(item.code).toUpperCase() === String(code).toUpperCase());
}

function resolveMilestoneDueDay(item, cohort) {
  let day = Number(item?.dueDay);
  if (!Number.isInteger(day) || day < 1) {
    const previousStart = new Date(cohort?.startsAt || 0).getTime();
    const previousDue = new Date(item?.dueAt || 0).getTime();
    if (Number.isFinite(previousStart) && Number.isFinite(previousDue) && previousStart > 0 && previousDue > previousStart) {
      day = Math.round((previousDue - previousStart) / (24 * 60 * 60 * 1000));
    }
  }
  if (!Number.isInteger(day) || day < 1) day = Number(item?.order) || 1;
  return Math.max(1, Math.min(Number(cohort?.weeks || 1) * 7, day));
}

function isParticipant(cohort, userJid) {
  return (cohort?.members || []).some(member => member.userJid === userJid);
}

function isFacilitator(cohort, userJid) {
  return cohort?.createdBy === userJid || (cohort?.facilitators || []).some(item => item.userJid === userJid);
}

async function canManage(ctx, cohort) {
  return isOwner(ctx) || await isGroupAdmin(ctx) || isFacilitator(cohort, ctx.userJid);
}

async function loadCohort(ctx, code) {
  return ctx.LearningCohort.findOne({ groupJid: ctx.remoteJid, code: String(code || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12) });
}

function helpText(prefix = '.') {
  return [
    '🎓 *PIR LEARNING COHORT*',
    'Kelompok belajar desain dengan pendaftaran sukarela, milestone, fasilitator, dan progress pribadi. Durasi 1–12 minggu baru dihitung setelah fasilitator menjalankan mulai.',
    '',
    '*Program & peserta*',
    `${prefix}cohort buat Judul Program | deskripsi singkat | 4 — Admin membuat cohort 1–12 minggu.`,
    `${prefix}cohort list — lihat cohort aktif di grup ini.`,
    `${prefix}cohort detail KODE — lihat brief, fasilitator, dan milestone.`,
    `${prefix}cohort join KODE — bergabung secara sukarela.`,
    `${prefix}cohort leave KODE — keluar dari cohort.`,
    `${prefix}cohort hapusdata KODE konfirmasi — hapus check-in dan keanggotaanmu, termasuk setelah keluar.`,
    `${prefix}cohort hapus KODE konfirmasi — creator/Admin menghapus seluruh cohort dan check-in.`,
    `${prefix}cohort mulai KODE — fasilitator memulai program.`,
    `${prefix}cohort tutup KODE — fasilitator menyelesaikan program.`,
    `${prefix}cohort batal KODE — creator/Admin membatalkan program.`,
    '',
    '*Fasilitator & milestone*',
    `${prefix}cohort fasilitator tambah KODE @anggota — creator/Admin menambahkan fasilitator.`,
    `${prefix}cohort milestone tambah KODE | Judul | deskripsi | hari-ke — maksimal 12 milestone.`,
    `${prefix}cohort milestone list KODE — lihat milestone.`,
    '',
    '*Check-in & progress*',
    `${prefix}cohort checkin KODE M01 | catatan praktik | https://tautan-karya`,
    `${prefix}cohort progress KODE — progress pribadimu.`,
    `${prefix}cohort ringkasan KODE — agregat milestone untuk fasilitator/Admin.`,
    `${prefix}cohort kiriman KODE — daftar check-in untuk fasilitator.`,
    `${prefix}cohort review KODE-CHECKIN approve|revisi | catatan — review fasilitator.`,
    '',
    `Maksimal ${MAX_COHORT_MEMBERS} peserta, ${MAX_FACILITATORS} fasilitator, ${MAX_MILESTONES} milestone per cohort, dan ${MAX_ACTIVE_COHORTS_PER_GROUP} cohort aktif per grup. Semua data hanya untuk grup asal; tidak ada ranking publik, biaya, atau sertifikasi otomatis.`,
  ].join('\n');
}

async function handleCreate(ctx, args) {
  const { reply, remoteJid, userJid, LearningCohort } = ctx;
  if (!await isGroupAdmin(ctx)) return reply('⛔ Hanya Admin grup atau Owner bot yang dapat membuat Learning Cohort.');
  const [title, description, weeksRaw] = parseFields(args.slice(1));
  const weeks = Number(weeksRaw);
  if (title.length < 5 || description.length < 15 || !Number.isInteger(weeks) || weeks < 1 || weeks > 12) {
    return reply(`Format: ${ctx.PREFIX || '.'}cohort buat Judul Program | deskripsi minimal 15 karakter | jumlah-minggu (1–12)\nContoh: ${ctx.PREFIX || '.'}cohort buat Dasar Branding | Belajar membangun identitas visual secara bertahap. | 4`);
  }
  try {
    const now = new Date();
    // Expire only programs that have actually started; an open registration must not
    // consume its learning duration before the facilitator starts the cohort.
    if (typeof LearningCohort.updateMany === 'function') {
      await LearningCohort.updateMany({ groupJid: remoteJid, status: 'active', endsAt: { $lte: now } }, { $set: { status: 'completed', completedAt: now, closedBy: 'system' } });
    }
    const [openCount, activeCount] = await Promise.all([
      LearningCohort.countDocuments({ groupJid: remoteJid, status: 'open' }),
      LearningCohort.countDocuments({ groupJid: remoteJid, status: 'active', endsAt: { $gt: now } }),
    ]);
    if (openCount + activeCount >= MAX_ACTIVE_COHORTS_PER_GROUP) return reply(`Grup ini sudah memiliki ${MAX_ACTIVE_COHORTS_PER_GROUP} cohort aktif/pendaftaran terbuka. Selesaikan salah satunya sebelum membuat program baru.`);
    const cohort = await LearningCohort.create({
      code: makeCode(), groupJid: remoteJid, title, description, weeks,
      startsAt: null, endsAt: null,
      status: 'open', createdBy: userJid, createdByName: safeDisplayName(ctx.msg?.pushName, 'Admin grup'),
      facilitators: [{ userJid, displayName: safeDisplayName(ctx.msg?.pushName, 'Fasilitator'), addedAt: now }],
      members: [], milestones: [],
    });
    return reply(`🎓 *LEARNING COHORT DIBUAT*\nProgram: *${cohort.title}*\nKode: *${cohort.code}*\nDurasi: ${weeks} minggu setelah program dimulai\nStatus: Pendaftaran dibuka\n\nAnggota dapat bergabung dengan .cohort join ${cohort.code}. Fasilitator dapat menambahkan milestone, lalu memulai program saat siap.`);
  } catch (error) {
    console.warn('[LEARNING COHORT CREATE]', error?.message || error);
    return reply('⚠️ Cohort belum berhasil dibuat. Periksa koneksi database dan coba lagi.');
  }
}

async function handleList(ctx) {
  const { LearningCohort, remoteJid, reply } = ctx;
  try {
    const now = new Date();
    if (typeof LearningCohort.updateMany === 'function') {
      await LearningCohort.updateMany({ groupJid: remoteJid, status: 'active', endsAt: { $lte: now } }, { $set: { status: 'completed', completedAt: now, closedBy: 'system' } });
    }
    const rows = await LearningCohort.find({ groupJid: remoteJid, status: { $in: ['open', 'active'] } }).sort({ createdAt: -1 }).limit(10);
    if (!rows.length) return reply('Belum ada Learning Cohort aktif di grup ini. Admin dapat membuatnya dengan .cohort buat.');
    return reply(['🎓 *LEARNING COHORT GRUP INI*', ...rows.map((item, index) => `${index + 1}. *${cleanText(item.title, 80)}* [${item.code}]\n   ${item.status === 'active' ? `Berjalan · berakhir ${formatDate(item.endsAt)}` : 'Pendaftaran dibuka · durasi mulai dihitung setelah fasilitator memulai'}\n   ${(item.members || []).length}/${MAX_COHORT_MEMBERS} peserta · ${item.weeks} minggu`), '', 'Gunakan .cohort detail KODE untuk membaca program.'].join('\n'));
  } catch {
    return reply('⚠️ Daftar cohort belum dapat dimuat.');
  }
}

async function handleJoin(ctx, code) {
  const { LearningCohort, remoteJid, userJid, reply } = ctx;
  const cohort = await loadCohort(ctx, code);
  if (!cohort) return reply('Kode cohort tidak ditemukan pada grup ini.');
  if (!['open', 'active'].includes(cohort.status) || (cohort.status === 'active' && new Date(cohort.endsAt).getTime() <= Date.now())) return reply('Pendaftaran cohort sudah ditutup atau program telah berakhir.');
  if (isParticipant(cohort, userJid)) return reply('Kamu sudah terdaftar sebagai peserta cohort ini.');
  if ((cohort.members || []).length >= MAX_COHORT_MEMBERS) return reply(`Kapasitas cohort sudah penuh (${MAX_COHORT_MEMBERS} peserta).`);
  try {
    const member = { userJid, displayName: safeDisplayName(ctx.msg?.pushName), joinedAt: new Date() };
    const updated = await LearningCohort.findOneAndUpdate(
      { _id: cohort._id, groupJid: remoteJid, code: cohort.code, status: { $in: ['open', 'active'] }, 'members.userJid': { $ne: userJid }, $expr: { $lt: [{ $size: { $ifNull: ['$members', []] } }, MAX_COHORT_MEMBERS] } },
      { $push: { members: member } },
      { new: true },
    );
    if (!updated) return reply('Pendaftaran tidak tersimpan. Cohort mungkin sudah penuh, ditutup, atau kamu sudah terdaftar.');
    return reply(`✅ Kamu berhasil bergabung ke *${cohort.title}* [${cohort.code}].\nPeserta: ${(updated.members || []).length}/${MAX_COHORT_MEMBERS}\nLihat milestone: .cohort milestone list ${cohort.code}\nLihat progress: .cohort progress ${cohort.code}`);
  } catch (error) {
    if (Number(error?.code) === 11000) return reply('Kamu sudah terdaftar pada cohort ini.');
    return reply('⚠️ Pendaftaran belum berhasil disimpan.');
  }
}

async function handleLeave(ctx, code) {
  const { LearningCohort, remoteJid, userJid, reply } = ctx;
  try {
    const updated = await LearningCohort.findOneAndUpdate(
      { groupJid: remoteJid, code: String(code || '').toUpperCase(), 'members.userJid': userJid },
      { $pull: { members: { userJid } } },
      { new: true },
    );
    if (!updated) return reply('Kamu tidak tercatat sebagai peserta cohort ini.');
    return reply(`Kamu telah keluar dari *${updated.title}*. Riwayat check-in tetap disimpan untuk catatan cohort dan tidak lagi dapat kamu ubah.`);
  } catch { return reply('⚠️ Kamu belum dapat keluar dari cohort.'); }
}

async function handleDetail(ctx, code) {
  const cohort = await loadCohort(ctx, code);
  if (!cohort) return ctx.reply('Kode cohort tidak ditemukan pada grup ini.');
  const members = (cohort.members || []).length;
  const milestones = (cohort.milestones || []).slice().sort((a, b) => Number(a.order) - Number(b.order));
  return ctx.reply([
    `🎓 *${cleanText(cohort.title, 80)}*`,
    `Kode: ${cohort.code} · Status: ${cohort.status}`,
    cleanText(cohort.description, 400),
    `Durasi: ${cohort.weeks} minggu · Peserta: ${members}/${MAX_COHORT_MEMBERS}`,
    `Periode: ${cohort.startedAt ? `${formatDate(cohort.startedAt)} – ${formatDate(cohort.endsAt)}` : 'Belum dimulai; durasi dihitung saat fasilitator memulai program.'}`,
    `Fasilitator: ${(cohort.facilitators || []).map(item => safeDisplayName(item.displayName, 'Fasilitator')).join(', ') || 'Belum ditentukan'}`,
    '',
    '*Milestone*',
    ...(milestones.length ? milestones.map(item => `${item.code}. ${cleanText(item.title, 80)} — ${item.dueAt ? `target ${formatDate(item.dueAt)}` : `hari ke-${Number(item.dueDay) || Number(item.order)}`}${item.status === 'closed' ? ' (ditutup)' : ''}`) : ['Belum ada milestone.']),
    '',
    `Gabung: .cohort join ${cohort.code}`,
    `Progress: .cohort progress ${cohort.code}`,
    'Informasi ini hanya tersedia pada grup asal cohort.',
  ].join('\n'));
}

async function handleFacilitator(ctx, args) {
  const { LearningCohort, remoteJid, reply } = ctx;
  const action = String(args[1] || '').toLowerCase();
  const code = String(args[2] || '').toUpperCase();
  const cohort = await loadCohort(ctx, code);
  if (!cohort) return reply('Kode cohort tidak ditemukan pada grup ini.');
  if (!['open', 'active'].includes(cohort.status)) return reply('Daftar fasilitator tidak dapat diubah setelah cohort ditutup.');
  if (!isOwner(ctx) && !(await isGroupAdmin(ctx)) && cohort.createdBy !== ctx.userJid) return reply('⛔ Hanya pembuat cohort, Admin grup, atau Owner yang dapat mengatur fasilitator.');
  const targetRaw = getMentionedTarget(ctx);
  const target = targetRaw && typeof ctx.normalizeJid === 'function' ? ctx.normalizeJid(targetRaw) : targetRaw;
  if (!target) return reply(`Tandai anggota atau balas pesannya: ${ctx.PREFIX || '.'}cohort fasilitator tambah ${code} @anggota`);
  if (target === cohort.createdBy) return reply('Pembuat cohort sudah menjadi fasilitator utama.');
  const current = cohort.facilitators || [];
  if (action === 'tambah' || action === 'add') {
    if (current.some(item => item.userJid === target)) return reply('Anggota tersebut sudah menjadi fasilitator.');
    if (current.length >= MAX_FACILITATORS) return reply(`Maksimal ${MAX_FACILITATORS} fasilitator per cohort.`);
    try {
      const updated = await LearningCohort.findOneAndUpdate(
        { _id: cohort._id, groupJid: remoteJid, 'facilitators.userJid': { $ne: target }, $expr: { $lt: [{ $size: { $ifNull: ['$facilitators', []] } }, MAX_FACILITATORS] } },
        { $push: { facilitators: { userJid: target, displayName: 'Fasilitator', addedAt: new Date() } } },
        { new: true },
      );
      if (!updated) return reply('Fasilitator tidak ditambahkan. Periksa kembali daftar fasilitator.');
      return reply('✅ Fasilitator baru berhasil ditambahkan. Nama akan ditampilkan tanpa nomor WhatsApp atau JID.');
    } catch { return reply('⚠️ Fasilitator belum berhasil ditambahkan.'); }
  }
  if (action === 'hapus' || action === 'remove') {
    try {
      const updated = await LearningCohort.findOneAndUpdate(
        { _id: cohort._id, groupJid: remoteJid, 'facilitators.userJid': target },
        { $pull: { facilitators: { userJid: target } } },
        { new: true },
      );
      if (!updated) return reply('Fasilitator tidak ditemukan.');
      return reply('Fasilitator berhasil dihapus.');
    } catch { return reply('⚠️ Fasilitator belum berhasil dihapus.'); }
  }
  return reply(`Gunakan: ${ctx.PREFIX || '.'}cohort fasilitator tambah|hapus KODE @anggota`);
}

async function handleMilestone(ctx, args) {
  const { LearningCohort, remoteJid, reply } = ctx;
  const action = String(args[1] || '').toLowerCase();
  const code = String(args[2] || '').toUpperCase();
  const cohort = await loadCohort(ctx, code);
  if (!cohort) return reply('Kode cohort tidak ditemukan pada grup ini.');
  if (action === 'list' || action === 'daftar') {
    const milestones = (cohort.milestones || []).slice().sort((a, b) => Number(a.order) - Number(b.order));
    return reply(milestones.length
      ? [`🗓️ *MILESTONE ${cohort.title.toUpperCase()}*`, ...milestones.map(item => `${item.code}. *${cleanText(item.title, 80)}*\n   ${cleanText(item.description, 240)}\n   Target: ${item.dueAt ? formatDate(item.dueAt) : `hari ke-${resolveMilestoneDueDay(item, cohort)} setelah program dimulai`} · ${item.status}`)].join('\n')
      : 'Belum ada milestone untuk cohort ini.');
  }
  if (action !== 'tambah' && action !== 'add') return reply(`Gunakan .cohort milestone list ${code} atau .cohort milestone tambah ${code} | Judul | deskripsi | hari-ke`);
  if (!await canManage(ctx, cohort)) return reply('⛔ Hanya fasilitator cohort, Admin grup, atau Owner yang dapat menambah milestone.');
  const milestoneTokens = args[3] === '|' ? args.slice(4) : args.slice(3);
  const [title, description, dayRaw] = parseFields(milestoneTokens);
  const day = Number(dayRaw);
  if (title.length < 4 || description.length < 10 || !Number.isInteger(day) || day < 1 || day > cohort.weeks * 7) {
    return reply(`Format: .cohort milestone tambah ${code} | Judul milestone | deskripsi praktik | hari-ke (1–${cohort.weeks * 7})`);
  }
  if (cohort.status === 'active' && new Date(cohort.endsAt).getTime() <= Date.now()) return reply('Cohort sudah melewati tanggal akhir dan tidak menerima milestone baru.');
  if ((cohort.milestones || []).length >= MAX_MILESTONES) return reply(`Maksimal ${MAX_MILESTONES} milestone per cohort.`);
  const nextOrder = (cohort.milestones || []).length + 1;
  const milestoneCode = `M${String(nextOrder).padStart(2, '0')}`;
  const dueAt = cohort.status === 'active' && cohort.startedAt
    ? new Date(new Date(cohort.startedAt).getTime() + day * 24 * 60 * 60 * 1000)
    : null;
  try {
    const updated = await LearningCohort.findOneAndUpdate(
      { _id: cohort._id, groupJid: remoteJid, status: { $in: ['open', 'active'] }, 'milestones.code': { $ne: milestoneCode } },
      { $push: { milestones: { code: milestoneCode, title, description, dueAt, dueDay: day, order: nextOrder, status: 'open' } } },
      { new: true },
    );
    if (!updated) return reply('Milestone tidak ditambahkan. Cohort mungkin sudah ditutup.');
    return reply(`✅ *MILESTONE DITAMBAHKAN*\n${milestoneCode}. ${title}\nTarget: ${dueAt ? formatDate(dueAt) : `hari ke-${day} setelah program dimulai`}\nPeserta dapat check-in dengan .cohort checkin ${code} ${milestoneCode} | catatan praktik | https://tautan-karya`);
  } catch { return reply('⚠️ Milestone belum berhasil disimpan.'); }
}

async function handleDeletePersonalData(ctx, code, confirmation) {
  const { LearningCohort, LearningCohortCheckin, remoteJid, userJid, reply } = ctx;
  if (String(confirmation || '').toLowerCase() !== 'konfirmasi') return reply(`Perintah ini menghapus seluruh check-in milikmu dan mengeluarkanmu dari cohort. Konfirmasi: .cohort hapusdata ${code} konfirmasi`);
  const cohort = await loadCohort(ctx, code);
  if (!cohort) return reply('Kode cohort tidak ditemukan pada grup ini.');
  try {
    const ownCheckins = await LearningCohortCheckin.countDocuments({ groupJid: remoteJid, cohortCode: cohort.code, userJid });
    if (!isParticipant(cohort, userJid) && ownCheckins === 0) return reply('Tidak ada keanggotaan atau check-in milikmu pada cohort ini.');
    const deleted = await LearningCohortCheckin.deleteMany({ groupJid: remoteJid, cohortCode: cohort.code, userJid });
    if (isParticipant(cohort, userJid)) {
      await LearningCohort.findOneAndUpdate({ _id: cohort._id, groupJid: remoteJid, 'members.userJid': userJid }, { $pull: { members: { userJid } } }, { new: true });
    }
    return reply(`🧹 Data cohort pribadimu dihapus. Check-in terhapus: ${Number(deleted?.deletedCount || 0)}. Data peserta lain tidak berubah. Perintah ini juga tersedia setelah kamu keluar dari cohort.`);
  } catch { return reply('⚠️ Data cohort pribadi belum berhasil dihapus.'); }
}

async function handleDeleteCohort(ctx, code, confirmation) {
  const { LearningCohort, LearningCohortCheckin, remoteJid, reply, userJid } = ctx;
  const cohort = await loadCohort(ctx, code);
  if (!cohort) return reply('Kode cohort tidak ditemukan pada grup ini.');
  if (!isOwner(ctx) && !(await isGroupAdmin(ctx)) && cohort.createdBy !== userJid) return reply('⛔ Hanya pembuat cohort, Admin grup, atau Owner yang dapat menghapus seluruh cohort.');
  if (String(confirmation || '').toLowerCase() !== 'konfirmasi') return reply(`⚠️ Penghapusan ini menghapus cohort dan semua check-in peserta secara permanen. Konfirmasi: .cohort hapus ${cohort.code} konfirmasi`);
  try {
    const deletedCohort = await LearningCohort.deleteOne({ _id: cohort._id, groupJid: remoteJid });
    if (!deletedCohort?.deletedCount) return reply('Cohort berubah sebelum penghapusan selesai. Muat ulang daftar cohort.');
    let deletedCount = 0;
    try { deletedCount = Number((await LearningCohortCheckin.deleteMany({ groupJid: remoteJid, cohortCode: cohort.code }))?.deletedCount || 0); }
    catch { return reply(`Cohort *${cohort.title}* sudah dihapus, tetapi pembersihan check-in tertunda. Jalankan verifier/cleanup database sebelum rilis.`); }
    return reply(`🗑️ Cohort *${cohort.title}* dihapus. Check-in peserta terhapus: ${deletedCount}.`);
  } catch { return reply('⚠️ Cohort belum berhasil dihapus.'); }
}

async function handleStartOrClose(ctx, action, code) {
  const { LearningCohort, remoteJid, reply, userJid } = ctx;
  const cohort = await loadCohort(ctx, code);
  if (!cohort) return reply('Kode cohort tidak ditemukan pada grup ini.');
  if (!await canManage(ctx, cohort)) return reply('⛔ Hanya fasilitator cohort, Admin grup, atau Owner yang dapat mengubah status program.');
  if (action === 'mulai' || action === 'start') {
    if (cohort.status !== 'open') return reply('Cohort hanya dapat dimulai ketika pendaftaran masih dibuka.');
    const startedAt = new Date();
    const endsAt = new Date(startedAt.getTime() + Number(cohort.weeks) * 7 * 24 * 60 * 60 * 1000);
    const milestones = (cohort.milestones || []).map(item => ({
      ...item.toObject?.() || item,
      dueDay: resolveMilestoneDueDay(item, cohort),
      dueAt: new Date(startedAt.getTime() + resolveMilestoneDueDay(item, cohort) * 24 * 60 * 60 * 1000),
    }));
    const updated = await LearningCohort.findOneAndUpdate(
      { _id: cohort._id, groupJid: remoteJid, status: 'open' },
      { $set: { status: 'active', startsAt: startedAt, startedAt, endsAt, startedBy: userJid, milestones } },
      { new: true },
    );
    return reply(updated ? `🚀 *COHORT DIMULAI*\n${updated.title}\nDurasi ${updated.weeks} minggu dimulai sekarang. Batas akhir: ${formatDate(updated.endsAt)}\nPeserta yang sudah bergabung dapat mengikuti milestone dan mengirim check-in.` : 'Status cohort berubah sebelum pembaruan selesai.');
  }
  if (action === 'tutup' || action === 'close' || action === 'selesai') {
    if (!['open', 'active'].includes(cohort.status)) return reply('Cohort sudah ditutup atau dibatalkan.');
    const updated = await LearningCohort.findOneAndUpdate({ _id: cohort._id, groupJid: remoteJid, status: { $in: ['open', 'active'] } }, { $set: { status: 'completed', completedAt: new Date(), closedBy: userJid } }, { new: true });
    return reply(updated ? `🏁 *COHORT DISELESAIKAN*\n${updated.title}\nCheck-in baru ditutup. Peserta tetap dapat melihat progress dan riwayat mereka.` : 'Status cohort berubah sebelum pembaruan selesai.');
  }
  if (action === 'batal' || action === 'cancel') {
    if (!isOwner(ctx) && !(await isGroupAdmin(ctx)) && cohort.createdBy !== userJid) return reply('⛔ Hanya pembuat cohort, Admin grup, atau Owner yang dapat membatalkan program.');
    if (!['open', 'active'].includes(cohort.status)) return reply('Cohort sudah ditutup atau dibatalkan.');
    const updated = await LearningCohort.findOneAndUpdate({ _id: cohort._id, groupJid: remoteJid, status: { $in: ['open', 'active'] } }, { $set: { status: 'cancelled', completedAt: new Date(), closedBy: userJid } }, { new: true });
    return reply(updated ? `⚠️ *COHORT DIBATALKAN*\n${updated.title}\nCheck-in baru dan review ditutup. Data riwayat tetap tersimpan sampai dihapus oleh peserta atau creator/Admin.` : 'Status cohort berubah sebelum pembaruan selesai.');
  }
  return reply('Status cohort tidak dikenali.');
}

async function handleCheckin(ctx, args) {
  const { LearningCohortCheckin, remoteJid, userJid, reply } = ctx;
  const [identity, note, workUrl = ''] = parseFields(args.slice(1));
  const [cohortCode, milestoneCode] = identity.split(/\s+/);
  const cohort = await loadCohort(ctx, cohortCode);
  if (!cohort) return reply('Kode cohort tidak ditemukan pada grup ini.');
  if (cohort.status !== 'active' || new Date(cohort.endsAt).getTime() <= Date.now()) return reply('Check-in hanya dapat dikirim selama cohort berstatus berjalan.');
  if (!isParticipant(cohort, userJid)) return reply(`Kamu belum bergabung. Gunakan .cohort join ${cohort.code} terlebih dahulu.`);
  const milestone = findMilestone(cohort, milestoneCode);
  if (!milestone || milestone.status !== 'open') return reply('Kode milestone tidak ditemukan atau sudah ditutup.');
  if (note.length < 8 || note.length > 300 || !isPublicHttpsUrl(workUrl)) {
    return reply(`Format: .cohort checkin ${cohort.code} ${milestone?.code || 'M01'} | catatan praktik minimal 8 karakter | https://tautan-karya (opsional)`);
  }
  try {
    const existing = await LearningCohortCheckin.findOne({ groupJid: remoteJid, cohortCode: cohort.code, milestoneCode: milestone.code, userJid });
    const checkinCode = existing?.code || makeCode(8);
    const checkin = await LearningCohortCheckin.findOneAndUpdate(
      { groupJid: remoteJid, cohortCode: cohort.code, milestoneCode: milestone.code, userJid },
      { $set: { code: checkinCode, userName: safeDisplayName(ctx.msg?.pushName), note, workUrl, status: 'submitted', reviewerNote: '', reviewerJid: '', reviewedAt: null, submittedAt: new Date() } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    return reply(`✅ *CHECK-IN TERSIMPAN*\nProgram: ${cohort.title}\nMilestone: ${milestone.code} · ${milestone.title}\nKode check-in: *${checkin.code}*\nStatus: Menunggu review fasilitator\n${workUrl ? `Karya: ${workUrl}\n` : ''}\nKamu dapat memperbarui check-in dengan mengirim ulang perintah yang sama. Catatan hanya terlihat pada grup cohort ini.`);
  } catch (error) {
    if (Number(error?.code) === 11000) return reply('Check-in sedang diperbarui. Tunggu sebentar lalu coba lagi.');
    return reply('⚠️ Check-in belum berhasil disimpan.');
  }
}

async function handleProgress(ctx, code, forceAggregate = false) {
  const { LearningCohortCheckin, remoteJid, userJid, reply } = ctx;
  const cohort = await loadCohort(ctx, code);
  if (!cohort) return reply('Kode cohort tidak ditemukan pada grup ini.');
  const participant = isParticipant(cohort, userJid);
  const facilitator = isFacilitator(cohort, userJid);
  const owner = isOwner(ctx);
  const admin = await isGroupAdmin(ctx);
  try {
    const checkins = await LearningCohortCheckin.find({ groupJid: remoteJid, cohortCode: cohort.code }).sort({ updatedAt: -1 }).limit(600);
    const mine = checkins.filter(item => item.userJid === userJid);
    const activeMemberIds = new Set((cohort.members || []).map(member => member.userJid));
    const activeCheckins = checkins.filter(item => activeMemberIds.has(item.userJid));
    if (!participant && !mine.length && !facilitator && !owner && !admin) return reply('Progress cohort hanya tersedia bagi peserta, mantan peserta dengan riwayat check-in, dan fasilitator yang berwenang.');
    if (forceAggregate && !facilitator && !owner && !admin) return reply('⛔ Ringkasan agregat hanya tersedia bagi fasilitator, Admin grup, atau Owner.');
    const milestones = (cohort.milestones || []).slice().sort((a, b) => Number(a.order) - Number(b.order));
    if ((participant || mine.length) && !forceAggregate) {
      const approved = mine.filter(item => item.status === 'approved').length;
      return reply([`📈 *PROGRESS COHORT PRIBADI*`, `Program: ${cohort.title}`, `Milestone disetujui: ${approved}/${milestones.length}`, `Check-in terkirim: ${mine.length}`, '', ...milestones.map(item => {
        const checkin = mine.find(entry => entry.milestoneCode === item.code);
        return `${checkin?.status === 'approved' ? '✅' : checkin?.status === 'revision' ? '↻' : checkin ? '🕓' : '▫️'} ${item.code} ${item.title}${checkin ? ` — ${checkin.status}` : ' — belum check-in'}`;
      }), '', 'Progress ini hanya untuk akunmu. Status persetujuan berasal dari fasilitator, bukan penilaian otomatis AI.'].join('\n'));
    }
    const memberCount = (cohort.members || []).length;
    return reply([`📊 *RINGKASAN COHORT*`, `Program: ${cohort.title}`, `Peserta aktif: ${memberCount}`, `Fasilitator: ${(cohort.facilitators || []).length}`, '', ...milestones.map(item => {
      const rows = activeCheckins.filter(entry => entry.milestoneCode === item.code);
      const approved = rows.filter(entry => entry.status === 'approved').length;
      const pending = rows.filter(entry => entry.status === 'submitted').length;
      const revision = rows.filter(entry => entry.status === 'revision').length;
      return `${item.code} ${item.title}\n   Disetujui ${approved}/${memberCount} · Menunggu ${pending} · Revisi ${revision}`;
    }), '', 'Ringkasan ini agregat dan tidak menampilkan identitas atau peringkat peserta.'].join('\n'));
  } catch { return reply('⚠️ Progress cohort belum dapat dimuat.'); }
}

async function handleSubmissions(ctx, code) {
  const { LearningCohortCheckin, remoteJid, reply } = ctx;
  const cohort = await loadCohort(ctx, code);
  if (!cohort) return reply('Kode cohort tidak ditemukan pada grup ini.');
  if (!await canManage(ctx, cohort)) return reply('⛔ Daftar check-in hanya tersedia bagi fasilitator, Admin grup, atau Owner.');
  try {
    const activeMemberIds = (cohort.members || []).map(member => member.userJid);
    const rows = await LearningCohortCheckin.find({ groupJid: remoteJid, cohortCode: cohort.code, userJid: { $in: activeMemberIds } })
      .sort({ updatedAt: -1 }).limit(30);
    if (!rows.length) return reply('Belum ada check-in dari peserta aktif cohort ini. Riwayat mantan peserta tetap tersimpan untuk progress pribadi mereka.');
    return reply([`📥 *CHECK-IN COHORT ${cohort.code}*`, ...rows.slice(0, 20).map(item => `${item.code} · ${item.milestoneCode} · ${safeDisplayName(item.userName)}\n   Status: ${item.status}${item.workUrl ? `\n   Karya: ${item.workUrl}` : ''}\n   Catatan: ${cleanText(item.note, 180)}`), '', `Review: .cohort review KODE-CHECKIN approve|revisi | catatan`].join('\n'));
  } catch { return reply('⚠️ Daftar check-in belum dapat dimuat.'); }
}

async function handleReview(ctx, args) {
  const { LearningCohortCheckin, remoteJid, userJid, reply } = ctx;
  const [identity, note] = parseFields(args.slice(1));
  const [checkinCode, decisionRaw] = identity.split(/\s+/);
  const decision = String(decisionRaw || '').toLowerCase();
  if (!checkinCode || !['approve', 'approved', 'revisi', 'revision'].includes(decision) || note.length < 5) {
    return reply(`Format: .cohort review KODE-CHECKIN approve|revisi | catatan minimal 5 karakter`);
  }
  try {
    const checkin = await LearningCohortCheckin.findOne({ groupJid: remoteJid, code: checkinCode.toUpperCase() });
    if (!checkin) return reply('Kode check-in tidak ditemukan pada grup ini.');
    const cohort = await loadCohort(ctx, checkin.cohortCode);
    if (!cohort || !await canManage(ctx, cohort)) return reply('⛔ Hanya fasilitator cohort, Admin grup, atau Owner yang dapat meninjau check-in.');
    if (cohort.status === 'completed' || cohort.status === 'cancelled' || new Date(cohort.endsAt).getTime() <= Date.now()) return reply('Review baru tidak dapat diberikan setelah cohort ditutup atau melewati tanggal akhir.');
    if (!isParticipant(cohort, checkin.userJid)) return reply('Check-in mantan peserta tidak lagi masuk antrean review aktif. Riwayat tetap tersimpan untuk progress pribadi sampai pemilik menghapusnya.');
    if (checkin.userJid === userJid) return reply('Fasilitator tidak dapat meninjau check-in miliknya sendiri.');
    const status = ['approve', 'approved'].includes(decision) ? 'approved' : 'revision';
    const updated = await LearningCohortCheckin.findOneAndUpdate(
      { _id: checkin._id, groupJid: remoteJid, status: { $in: ['submitted', 'revision', 'approved'] } },
      { $set: { status, reviewerJid: userJid, reviewerNote: note, reviewedAt: new Date() } },
      { new: true },
    );
    return reply(updated ? `📝 *CHECK-IN DITINJAU*\nKode: ${updated.code}\nStatus: ${status === 'approved' ? 'Disetujui' : 'Perlu revisi'}\nCatatan: ${note}` : 'Check-in berubah sebelum review tersimpan.');
  } catch { return reply('⚠️ Review belum berhasil disimpan.'); }
}

export async function handleDesignCohortCommands(ctx) {
  const { args = [], reply } = ctx;
  if (!DESIGN_COHORT_COMMANDS.has(ctx.command)) return;
  if (!isGroupContext(ctx)) return reply('Learning Cohort hanya tersedia di grup WhatsApp agar progress dan fasilitator tetap berada dalam komunitas asal.');
  if (!databaseReady(ctx)) return reply('⚠️ Learning Cohort membutuhkan MongoDB yang terhubung.');
  const action = String(args[0] || 'help').toLowerCase();
  if (['help', 'bantuan'].includes(action)) return reply(helpText(ctx.PREFIX || '.'));
  try {
    if (action === 'buat' || action === 'create') return await handleCreate(ctx, args);
    if (action === 'list' || action === 'daftar') return await handleList(ctx);
    if (action === 'join' || action === 'gabung') return await handleJoin(ctx, args[1]);
    if (action === 'leave' || action === 'keluar') return await handleLeave(ctx, args[1]);
    if (action === 'hapusdata' || action === 'delete-my-data') return await handleDeletePersonalData(ctx, args[1], args[2]);
    if (action === 'hapus' || action === 'delete') return await handleDeleteCohort(ctx, args[1], args[2]);
    if (action === 'detail' || action === 'lihat') return await handleDetail(ctx, args[1]);
    if (action === 'fasilitator' || action === 'facilitator') return await handleFacilitator(ctx, args);
    if (action === 'milestone') return await handleMilestone(ctx, args);
    if (action === 'mulai' || action === 'start' || action === 'tutup' || action === 'close' || action === 'selesai' || action === 'batal' || action === 'cancel') return await handleStartOrClose(ctx, action, args[1]);
    if (action === 'checkin' || action === 'check-in') return await handleCheckin(ctx, args);
    if (action === 'progress' || action === 'status') return await handleProgress(ctx, args[1]);
    if (action === 'ringkasan' || action === 'summary') return await handleProgress(ctx, args[1], true);
    if (action === 'kiriman' || action === 'submissions') return await handleSubmissions(ctx, args[1]);
    if (action === 'review') return await handleReview(ctx, args);
    return reply(`Subperintah belum dikenali. Ketik ${ctx.PREFIX || '.'}cohort help untuk panduan.`);
  } catch (error) {
    console.warn('[LEARNING COHORT]', error?.message || error);
    return reply('⚠️ Permintaan cohort belum berhasil diproses. Periksa database dan coba lagi.');
  }
}
