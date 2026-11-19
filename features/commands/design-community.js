import { randomBytes } from 'node:crypto';

export const DESIGN_COMMUNITY_COMMANDS = new Set(['designcommunity']);

const SKILL_ALIASES = Object.freeze({
  brand: 'branding', branding: 'branding', logo: 'branding', identitas: 'branding',
  poster: 'poster', editorial: 'poster', flyer: 'poster',
  ui: 'ui/ux', ux: 'ui/ux', uiux: 'ui/ux', 'ui/ux': 'ui/ux', aplikasi: 'ui/ux', web: 'ui/ux',
  ilustrasi: 'ilustrasi', illustration: 'ilustrasi', gambar: 'ilustrasi',
  tipografi: 'tipografi', typography: 'tipografi', font: 'tipografi', huruf: 'tipografi',
  motion: 'motion', animasi: 'motion', video: 'motion',
  fotografi: 'fotografi', photography: 'fotografi', foto: 'fotografi',
  packaging: 'kemasan', kemasan: 'kemasan', label: 'kemasan',
  social: 'social media', sosial: 'social media', sosmed: 'social media', 'social media': 'social media', konten: 'social media',
  layout: 'layout', komposisi: 'layout', grid: 'layout',
  riset: 'riset ux', research: 'riset ux', 'riset ux': 'riset ux',
  copywriting: 'copywriting', naskah: 'copywriting',
});

export const COMMUNITY_SKILLS = Object.freeze([...new Set(Object.values(SKILL_ALIASES))]);

function cleanText(value, maxLength = 240) {
  return String(value ?? '')
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

function normalizeSkill(value) {
  const key = cleanText(value, 50).toLowerCase();
  return SKILL_ALIASES[key] || '';
}

function inspectSkillInput(value) {
  const raw = (Array.isArray(value) ? value : String(value ?? '').split(','))
    .map(item => cleanText(item, 50))
    .filter(Boolean);
  const normalized = raw.map(normalizeSkill);
  return {
    topics: [...new Set(normalized.filter(Boolean))],
    invalid: raw.filter((item, index) => !normalized[index]),
    count: raw.length,
  };
}

export function parseCommunitySkills(value, { max = 4 } = {}) {
  return inspectSkillInput(value).topics.slice(0, max);
}

function containsPrivateContact(value) {
  const text = String(value || '');
  return /https?:\/\/|@(?:s\.whatsapp\.net|lid)|\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b|(?:\+?\d[\d\s().-]{7,}\d)/i.test(text);
}

function makeCode() {
  return randomBytes(4).toString('hex').toUpperCase();
}

function isGroupContext(ctx) {
  return Boolean(ctx?.isGroup && typeof ctx.remoteJid === 'string' && ctx.remoteJid.endsWith('@g.us'));
}

function isDatabaseReady(ctx) {
  try {
    return Boolean(typeof ctx?.getDbReady === 'function' && ctx.getDbReady());
  } catch {
    return false;
  }
}

function hasCommunityModels(ctx) {
  return Boolean(ctx?.CommunityProfile && ctx?.CommunityCollaboration && ctx?.User && ctx?.LearningSubmission);
}

function formatSkillList(skills = []) {
  return Array.isArray(skills) && skills.length ? skills.join(', ') : 'Belum diatur';
}

function getProfileName(ctx) {
  const name = cleanText(ctx?.msg?.pushName || 'Anggota', 60) || 'Anggota';
  return containsPrivateContact(name) ? 'Anggota' : name;
}

function safePublicName(value) {
  const name = cleanText(value || 'Anggota', 60) || 'Anggota';
  return containsPrivateContact(name) ? 'Anggota' : name;
}

function helpText(prefix = '.') {
  return [
    '🤝 *PIR VISUALS — COMMUNITY HUB*',
    'Bangun profil komunitas, temukan mentor, raih milestone aktivitas, dan cari rekan kolaborasi.',
    '',
    '*Profil & mentor matching*',
    `• ${prefix}designcommunity profil — lihat profil komunitasmu.`,
    `• ${prefix}designcommunity mentor branding,uiux — tampil sebagai mentor (opt-in).`,
    `• ${prefix}designcommunity belajar poster,tipografi — cari dukungan belajar (opt-in).`,
    `• ${prefix}designcommunity intro Saya senang membantu pemula memahami layout.`,
    `• ${prefix}designcommunity cari branding — temukan mentor di grup ini.`,
    `• ${prefix}designcommunity cari belajar poster — temukan anggota yang mencari dukungan belajar.`,
    `• ${prefix}designcommunity off — keluar dari direktori mentor/pembelajar.`,
    `• ${prefix}designcommunity hapus — hapus profil komunitasmu.`,
    '',
    '*Achievement & kolaborasi*',
    `• ${prefix}designcommunity badges — lihat milestone kontribusimu.`,
    `• ${prefix}designcommunity ringkasan — lihat profil kontribusi lengkapmu di grup ini.`,
    `• ${prefix}designcommunity growth — bandingkan aktivitas 30 hari terakhir dengan 30 hari sebelumnya.`,
    `• ${prefix}designcommunity collab buat Judul | brief singkat | ilustrasi,branding | 3`,
    `• ${prefix}designcommunity collab list — lihat proyek terbuka di grup.`,
    `• ${prefix}designcommunity collab join KODE — bergabung ke proyek.`,
    `• ${prefix}designcommunity collab leave KODE — keluar dari proyek.`,
    `• ${prefix}designcommunity collab tutup KODE — tutup proyek milikmu.`,
    '',
    `Topik: ${COMMUNITY_SKILLS.join(', ')}.`,
    'Semua pencarian dan proyek hanya terlihat di grup asal. Profil dan mentor matching harus diaktifkan sendiri.',
  ].join('\n');
}

function getBadgeList({ completedLessons, submissions, reviews, collaborations, mentorOptIn }) {
  const badges = [];
  if (completedLessons >= 1) badges.push('🌱 Langkah Pertama — menyelesaikan 1 modul');
  if (completedLessons >= 4) badges.push('📚 Penjelajah Materi — menyelesaikan 4 modul');
  if (completedLessons >= 12) badges.push('🎓 Tuntas 12 Modul — menyelesaikan seluruh kurikulum');
  if (submissions >= 1) badges.push('🖼️ Berbagi Karya — mengirim 1 karya tantangan');
  if (submissions >= 5) badges.push('✨ Kreator Aktif — mengirim 5 karya tantangan');
  if (reviews >= 3) badges.push('💬 Apresiasi Komunitas — memberi 3 peer review');
  if (collaborations >= 1) badges.push('🤝 Rekan Kolaborasi — ikut atau membuat 1 proyek');
  if (mentorOptIn) badges.push('🧭 Mentor Terbuka — bersedia berbagi keahlian');
  return badges;
}

async function handleBadges(ctx) {
  const { User, LearningSubmission, CommunityProfile, CommunityCollaboration, userJid, remoteJid, reply } = ctx;
  try {
    const [user, submissions, reviews, projectsCreated, projectsJoined, profile] = await Promise.all([
      User.findOne({ jid: userJid }),
      LearningSubmission.countDocuments({ groupJid: remoteJid, userJid, status: 'active' }),
      LearningSubmission.countDocuments({ groupJid: remoteJid, 'feedback.reviewerJid': userJid }),
      CommunityCollaboration.countDocuments({ groupJid: remoteJid, ownerJid: userJid }),
      CommunityCollaboration.countDocuments({ groupJid: remoteJid, 'collaborators.userJid': userJid }),
      CommunityProfile.findOne({ groupJid: remoteJid, userJid }),
    ]);
    const completedLessons = Array.isArray(user?.preferences?.learningProgress?.completedLessons)
      ? user.preferences.learningProgress.completedLessons.length
      : 0;
    const collaborations = projectsCreated + projectsJoined;
    const badges = getBadgeList({
      completedLessons,
      submissions: Number(submissions || 0),
      reviews: Number(reviews || 0),
      collaborations,
      mentorOptIn: Boolean(profile?.visible && profile?.mentorOptIn),
    });
    const lines = [
      '🏅 *MILESTONE KOMUNITASMU*',
      `Modul selesai: ${completedLessons}/12`,
      `Karya tantangan: ${Number(submissions || 0)}`,
      `Peer review diberikan: ${Number(reviews || 0)}`,
      `Proyek kolaborasi: ${collaborations}`,
      '',
      badges.length ? badges.map((badge, index) => `${index + 1}. ${badge}`).join('\n') : 'Belum ada milestone yang terbuka. Mulai dari satu materi atau bagikan karya pertamamu.',
      '',
      'Milestone dihitung dari aktivitas yang tercatat pada akun dan grup ini. Ini bukan sertifikasi, penilaian kualitas karya, atau peringkat anggota.',
    ];
    return reply(lines.join('\n'));
  } catch {
    return reply('⚠️ Milestone belum dapat dimuat. Pastikan MongoDB dan koleksi komunitas tersedia.');
  }
}


function timestampInRange(value, start, end) {
  const time = new Date(value || 0).getTime();
  return Number.isFinite(time) && time >= start && time < end;
}

export function summarizeGrowthActivity({ completionHistory = [], ownEntries = [], groupEntries = [], userJid = '', now = new Date() } = {}) {
  const end = new Date(now).getTime();
  const currentStart = end - 30 * 24 * 60 * 60 * 1000;
  const previousStart = end - 60 * 24 * 60 * 60 * 1000;
  const countHistory = (start, finish) => completionHistory.filter(item => timestampInRange(item.completedAt, start, finish)).length;
  const countSubmissions = (start, finish) => ownEntries.filter(item => timestampInRange(item.createdAt, start, finish)).length;
  const countFeedback = (entries, reviewerJid, start, finish) => entries.reduce((total, entry) => total + (Array.isArray(entry.feedback)
    ? entry.feedback.filter(item => (!reviewerJid || item.reviewerJid === reviewerJid) && timestampInRange(item.createdAt, start, finish)).length
    : 0), 0);
  return {
    current: {
      lessons: countHistory(currentStart, end),
      submissions: countSubmissions(currentStart, end),
      reviewsGiven: countFeedback(groupEntries, userJid, currentStart, end),
      reviewsReceived: countFeedback(ownEntries, '', currentStart, end),
    },
    previous: {
      lessons: countHistory(previousStart, currentStart),
      submissions: countSubmissions(previousStart, currentStart),
      reviewsGiven: countFeedback(groupEntries, userJid, previousStart, currentStart),
      reviewsReceived: countFeedback(ownEntries, '', previousStart, currentStart),
    },
  };
}

async function handleGrowthInsights(ctx) {
  const { User, LearningSubmission, userJid, remoteJid, reply } = ctx;
  try {
    const [user, ownEntries, groupEntries] = await Promise.all([
      User.findOne({ jid: userJid }),
      LearningSubmission.find({ groupJid: remoteJid, userJid, status: 'active' }).sort({ createdAt: -1 }).limit(200),
      LearningSubmission.find({ groupJid: remoteJid, status: 'active' }).sort({ updatedAt: -1 }).limit(500),
    ]);
    const history = Array.isArray(user?.preferences?.learningProgress?.completionHistory)
      ? user.preferences.learningProgress.completionHistory.slice(-24)
      : [];
    const rows = summarizeGrowthActivity({ completionHistory: history, ownEntries: ownEntries || [], groupEntries: groupEntries || [], userJid });
    const totalLessons = new Set(user?.preferences?.learningProgress?.completedLessons || []).size;
    const change = (current, previous) => current - previous;
    const deltaLabel = value => value > 0 ? `+${value}` : String(value);
    const recommendations = [];
    if (!rows.current.lessons && totalLessons < 12) recommendations.push('Lanjutkan satu materi melalui .designlearn lanjut, lalu tandai selesai setelah praktik.');
    if (!rows.current.submissions) recommendations.push('Bagikan satu latihan atau karya pada tantangan grup untuk mendapat masukan.');
    if (!rows.current.reviewsGiven) recommendations.push('Pilih satu karya anggota dan berikan peer review yang spesifik dan sopan.');
    if (!recommendations.length) recommendations.push('Pertahankan ritme belajar dan dokumentasikan alasan di balik keputusan desainmu.');
    return reply([
      '📈 *DESIGNER GROWTH INSIGHTS — PRIVAT*',
      'Perbandingan aktivitas tercatat: 30 hari terakhir vs 30 hari sebelumnya.',
      '',
      `Materi selesai: ${rows.current.lessons} (${deltaLabel(change(rows.current.lessons, rows.previous.lessons))}) · Total kurikulum: ${totalLessons}/12`,
      `Karya dikirim: ${rows.current.submissions} (${deltaLabel(change(rows.current.submissions, rows.previous.submissions))})`,
      `Peer review diberikan: ${rows.current.reviewsGiven} (${deltaLabel(change(rows.current.reviewsGiven, rows.previous.reviewsGiven))})`,
      `Masukan diterima: ${rows.current.reviewsReceived} (${deltaLabel(change(rows.current.reviewsReceived, rows.previous.reviewsReceived))})`,
      '',
      '*Langkah berikutnya*',
      ...recommendations.map((item, index) => `${index + 1}. ${item}`),
      '',
      'Insight ini hanya merangkum aktivitas yang tercatat pada akunmu dan grup saat ini; bukan penilaian kualitas karya, prediksi kemampuan, sertifikasi, atau peringkat publik. Riwayat detail dibatasi pada maksimal 200 karya milikmu dan 500 karya grup terbaru yang terbaca.',
    ].join('\n'));
  } catch {
    return reply('⚠️ Growth Insights belum dapat dimuat. Pastikan MongoDB dan data komunitas tersedia.');
  }
}

async function handleContributionSummary(ctx) {
  const { User, LearningSubmission, CommunityProfile, CommunityCollaboration, userJid, remoteJid, reply } = ctx;
  try {
    const [user, ownEntries, groupEntries, submissions, projectsCreated, projectsJoined, profile] = await Promise.all([
      User.findOne({ jid: userJid }),
      LearningSubmission.find({ groupJid: remoteJid, userJid, status: 'active' }).sort({ updatedAt: -1 }).limit(200),
      LearningSubmission.find({ groupJid: remoteJid, status: 'active' }).sort({ updatedAt: -1 }).limit(500),
      LearningSubmission.countDocuments({ groupJid: remoteJid, userJid, status: 'active' }),
      CommunityCollaboration.countDocuments({ groupJid: remoteJid, ownerJid: userJid }),
      CommunityCollaboration.countDocuments({ groupJid: remoteJid, 'collaborators.userJid': userJid }),
      CommunityProfile.findOne({ groupJid: remoteJid, userJid }),
    ]);
    const completedLessons = Array.isArray(user?.preferences?.learningProgress?.completedLessons)
      ? new Set(user.preferences.learningProgress.completedLessons).size
      : 0;
    const feedbackReceived = (Array.isArray(ownEntries) ? ownEntries : [])
      .reduce((sum, entry) => sum + (Array.isArray(entry.feedback) ? entry.feedback.length : 0), 0);
    const feedbackGiven = (Array.isArray(groupEntries) ? groupEntries : [])
      .reduce((sum, entry) => sum + (Array.isArray(entry.feedback)
        ? entry.feedback.filter(item => item.reviewerJid === userJid).length
        : 0), 0);
    const collaborations = Number(projectsCreated || 0) + Number(projectsJoined || 0);
    const badges = getBadgeList({
      completedLessons,
      submissions: Number(submissions || 0),
      reviews: feedbackGiven,
      collaborations,
      mentorOptIn: Boolean(profile?.visible && profile?.mentorOptIn),
    });
    return reply([
      '📊 *RINGKASAN KONTRIBUSI DESAINER*',
      `Materi belajar selesai: ${completedLessons}/12`,
      `Karya tantangan aktif: ${Number(submissions || 0)}`,
      `Peer review diberikan: ${feedbackGiven}`,
      `Masukan diterima: ${feedbackReceived}`,
      `Proyek kolaborasi dibuat: ${Number(projectsCreated || 0)}`,
      `Proyek kolaborasi diikuti: ${Number(projectsJoined || 0)}`,
      `Direktori mentor: ${profile?.visible && profile?.mentorOptIn ? `Aktif (${formatSkillList(profile.mentorTopics)})` : 'Tidak aktif'}`,
      '',
      badges.length ? badges.map((badge, index) => `${index + 1}. ${badge}`).join('\n') : 'Belum ada badge. Mulai dari materi, tantangan, peer review, atau kolaborasi.',
      '',
      'Ringkasan ini hanya untuk akunmu. Progress belajar berasal dari akunmu; karya, peer review, mentor, dan kolaborasi dibatasi pada grup saat ini. Tidak menampilkan nomor WhatsApp/JID dan tidak membuat profil publik. Detail feedback dihitung dari maksimal 200 karya milikmu dan 500 karya grup terbaru yang terbaca.',
    ].join('\n'));
  } catch {
    return reply('⚠️ Ringkasan kontribusi belum dapat dimuat. Pastikan MongoDB dan koleksi komunitas tersedia.');
  }
}

async function handleMentorCommands(ctx, action, args) {
  const { CommunityProfile, userJid, remoteJid, reply } = ctx;
  if (action === 'profil') {
    try {
      const profile = await CommunityProfile.findOne({ groupJid: remoteJid, userJid });
      if (!profile) return reply(`Belum ada profil komunitas. Aktifkan secara sukarela dengan:\n${ctx.PREFIX}designcommunity mentor branding,uiux\natau\n${ctx.PREFIX}designcommunity belajar poster,tipografi`);
      return reply([
        '👤 *PROFIL KOMUNITASMU*',
        `Status direktori: ${profile.visible ? 'Aktif' : 'Tidak ditampilkan'}`,
        `Mentor: ${profile.mentorOptIn ? formatSkillList(profile.mentorTopics) : 'Tidak aktif'}`,
        `Mencari mentor: ${profile.learnerOptIn ? formatSkillList(profile.seekingTopics) : 'Tidak aktif'}`,
        `Perkenalan: ${profile.intro || 'Belum diisi'}`,
        '',
        `Ubah perkenalan: ${ctx.PREFIX}designcommunity intro <teks>`,
        `Keluar direktori: ${ctx.PREFIX}designcommunity off`,
        `Hapus seluruh profil: ${ctx.PREFIX}designcommunity hapus`,
      ].join('\n'));
    } catch {
      return reply('⚠️ Profil komunitas belum dapat dimuat.');
    }
  }

  if (action === 'mentor' || action === 'belajar') {
    const topicInput = inspectSkillInput(args.join(' '));
    const topics = topicInput.topics;
    if (!topics.length || topicInput.invalid.length || topicInput.count > 4) return reply(`Masukkan 1–4 topik yang tersedia, dipisahkan koma.\n${topicInput.invalid.length ? `Topik tidak dikenal: ${topicInput.invalid.join(', ')}\n` : ''}Topik: ${COMMUNITY_SKILLS.join(', ')}\nContoh: ${ctx.PREFIX}designcommunity ${action} branding,uiux`);
    try {
      const isMentor = action === 'mentor';
      await CommunityProfile.findOneAndUpdate(
        { groupJid: remoteJid, userJid },
        {
          $set: {
            groupJid: remoteJid,
            userJid,
            displayName: getProfileName(ctx),
            visible: true,
            ...(isMentor ? { mentorOptIn: true, mentorTopics: topics } : { learnerOptIn: true, seekingTopics: topics }),
            consentAt: new Date(),
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );
      return reply(isMentor
        ? `✅ *PROFIL MENTOR DIAKTIFKAN*\nNama grup: ${getProfileName(ctx)}\nTopik: ${topics.join(', ')}\n\nAnggota grup dapat menemukanmu melalui .designcommunity cari <topik>. Tidak ada nomor kontak yang dipublikasikan oleh fitur ini. Gunakan .designcommunity off kapan saja untuk keluar dari direktori.`
        : `✅ *KEBUTUHAN BELAJAR TERCATAT*\nTopik yang ingin dipelajari: ${topics.join(', ')}\n\nKamu dapat mencari mentor yang sudah opt-in dengan .designcommunity cari <topik>. Profil hanya terlihat di grup ini dan dapat dinonaktifkan kapan saja.`);
    } catch {
      return reply('⚠️ Profil komunitas belum berhasil disimpan. Coba lagi setelah database stabil.');
    }
  }

  if (action === 'intro') {
    const rawIntro = String(args.join(' ') || '');
    const intro = cleanText(rawIntro, 200);
    if (intro.length < 8) return reply(`Perkenalan minimal 8 karakter.\nContoh: ${ctx.PREFIX}designcommunity intro Saya fokus pada branding dan senang berbagi proses desain.`);
    if (containsPrivateContact(rawIntro)) return reply('Jangan masukkan nomor telepon, JID, atau tautan kontak pada perkenalan. Gunakan deskripsi keahlian; komunikasi tetap dilakukan melalui grup.');
    try {
      const profile = await CommunityProfile.findOneAndUpdate(
        { groupJid: remoteJid, userJid },
        { $set: { displayName: getProfileName(ctx), intro } },
        { new: true },
      );
      if (!profile) return reply(`Aktifkan profil lebih dulu dengan .designcommunity mentor <topik> atau .designcommunity belajar <topik>.`);
      return reply('✅ Perkenalan profil komunitas diperbarui. Perkenalan hanya ditampilkan pada hasil pencarian mentor di grup ini.');
    } catch {
      return reply('⚠️ Perkenalan belum berhasil diperbarui.');
    }
  }

  if (action === 'cari') {
    const learnerSearch = ['belajar', 'pembelajar', 'learner'].includes(String(args[0] || '').toLowerCase());
    const topicArgs = learnerSearch ? args.slice(1) : args;
    const topicInput = inspectSkillInput(topicArgs.join(' '));
    const topic = topicInput.topics[0];
    if (!topic || topicInput.invalid.length || topicInput.count !== 1) return reply(`Format: ${ctx.PREFIX}designcommunity cari <topik> untuk mentor atau ${ctx.PREFIX}designcommunity cari belajar <topik> untuk pembelajar.\nTopik: ${COMMUNITY_SKILLS.join(', ')}.`);
    try {
      const filter = learnerSearch
        ? { groupJid: remoteJid, visible: true, learnerOptIn: true, seekingTopics: topic }
        : { groupJid: remoteJid, visible: true, mentorOptIn: true, mentorTopics: topic };
      const matches = await CommunityProfile.find(filter).sort({ updatedAt: -1 }).limit(10);
      const roleLabel = learnerSearch ? 'ANGGOTA YANG MENCARI DUKUNGAN' : 'MENTOR YANG TERSEDIA';
      if (!matches.length) return reply(learnerSearch
        ? `Belum ada anggota yang opt-in mencari dukungan untuk topik *${topic}* di grup ini.`
        : `Belum ada mentor yang opt-in untuk topik *${topic}* di grup ini. Kamu dapat meminta anggota yang berpengalaman untuk mendaftar dengan .designcommunity mentor ${topic}.`);
      const output = matches.map((member, index) => `${index + 1}. *${safePublicName(member.displayName)}*\n   ${learnerSearch ? 'Topik belajar' : 'Keahlian'}: ${formatSkillList(learnerSearch ? member.seekingTopics : member.mentorTopics)}${member.intro ? `\n   ${cleanText(member.intro, 200)}` : ''}`).join('\n\n');
      return reply(`🧭 *${roleLabel} — ${topic.toUpperCase()}*\n\n${output}\n\nHasil hanya berasal dari anggota yang mengaktifkan profil ${learnerSearch ? 'pembelajar' : 'mentor'} di grup ini. Hubungi dengan sopan melalui percakapan grup; bot tidak membagikan kontak pribadi.`);
    } catch {
      return reply('⚠️ Direktori komunitas belum dapat dicari.');
    }
  }

  if (action === 'off') {
    try {
      const profile = await CommunityProfile.findOneAndUpdate(
        { groupJid: remoteJid, userJid },
        { $set: { visible: false, mentorOptIn: false, learnerOptIn: false, mentorTopics: [], seekingTopics: [] } },
        { new: true },
      );
      if (!profile) return reply('Belum ada profil komunitas yang aktif.');
      return reply('✅ Profilmu dikeluarkan dari pencarian mentor dan pembelajar pada grup ini. Data profil tetap tersimpan agar dapat diaktifkan kembali; gunakan .designcommunity hapus untuk menghapusnya.');
    } catch {
      return reply('⚠️ Profil belum berhasil dinonaktifkan.');
    }
  }

  if (action === 'hapus') {
    try {
      const result = await CommunityProfile.deleteOne({ groupJid: remoteJid, userJid });
      return reply(result?.deletedCount
        ? '✅ Seluruh profil komunitasmu pada grup ini telah dihapus.'
        : 'Belum ada profil komunitas pada grup ini.');
    } catch {
      return reply('⚠️ Profil belum berhasil dihapus.');
    }
  }
  return false;
}

async function handleCollaborationCommands(ctx, action, args) {
  const { CommunityCollaboration, userJid, remoteJid, reply } = ctx;
  if (action === 'help' || !action) {
    return reply([
      '🤝 *DESIGNER COLLABORATION BOARD*',
      `• ${ctx.PREFIX}designcommunity collab buat Judul | brief | skill1,skill2 | slot`,
      `• ${ctx.PREFIX}designcommunity collab list`,
      `• ${ctx.PREFIX}designcommunity collab join KODE`,
      `• ${ctx.PREFIX}designcommunity collab leave KODE`,
      `• ${ctx.PREFIX}designcommunity collab tutup KODE`,
      'Setiap anggota dapat memiliki maksimal 3 proyek terbuka. Kapasitas 2–5 orang termasuk pemilik proyek.',
      'Proyek dan daftar anggota hanya terlihat di grup asal. Tidak ada transaksi atau pengelolaan pembayaran di fitur ini.',
    ].join('\n'));
  }

  if (action === 'buat' || action === 'create') {
    const fields = args.join(' ').split('|').map(value => cleanText(value, 300));
    const [title, brief, skillsRaw, slotsRaw] = fields;
    const skillInput = inspectSkillInput(skillsRaw || '');
    const skills = skillInput.topics;
    const slots = Number(slotsRaw || '3');
    if (!title || title.length < 5 || title.length > 80 || containsPrivateContact(title) || !brief || brief.length < 15 || containsPrivateContact(brief) || !skills.length || skillInput.invalid.length || skillInput.count > 4 || !Number.isInteger(slots) || slots < 2 || slots > 5) {
      return reply(`Format: ${ctx.PREFIX}designcommunity collab buat Judul proyek | brief minimal 15 karakter | branding,poster | 3\nJudul 5–80 karakter; brief 15–300 karakter tanpa nomor/tautan kontak; pilih 1–4 keahlian yang valid; kapasitas 2–5 orang termasuk pemilik.`);
    }
    try {
      const activeCount = await CommunityCollaboration.countDocuments({ groupJid: remoteJid, ownerJid: userJid, status: 'open' });
      if (activeCount >= 3) return reply('Kamu sudah memiliki 3 proyek terbuka di grup ini. Tutup proyek lama sebelum membuat yang baru.');
      const code = makeCode();
      await CommunityCollaboration.create({
        code,
        groupJid: remoteJid,
        ownerJid: userJid,
        ownerName: getProfileName(ctx),
        title,
        brief,
        skillsNeeded: skills,
        slots,
        collaborators: [],
        status: 'open',
      });
      return reply(`✅ *PROYEK KOLABORASI DIBUKA*\nKode: *${code}*\nJudul: ${title}\nBrief: ${brief}\nKeahlian dicari: ${skills.join(', ')}\nKapasitas: ${slots} orang termasuk pemilik\n\nAnggota grup dapat melihat melalui .designcommunity collab list dan bergabung dengan .designcommunity collab join ${code}. Tidak ada kontak pribadi yang dibagikan.`);
    } catch {
      return reply('⚠️ Proyek belum berhasil dibuat. Coba lagi setelah database stabil.');
    }
  }

  if (action === 'list' || action === 'daftar') {
    try {
      const projects = await CommunityCollaboration.find({ groupJid: remoteJid, status: 'open' }).sort({ createdAt: -1 }).limit(15);
      if (!projects.length) return reply(`Belum ada proyek kolaborasi terbuka. Buat proyek dengan .designcommunity collab buat Judul | brief | branding,poster | 3.`);
      const output = projects.map((project, index) => {
        const joined = Array.isArray(project.collaborators) ? project.collaborators.length : 0;
        const capacity = Number(project.slots || 2);
        return `${index + 1}. *${cleanText(project.title, 80)}* [${project.code}]\n   Pemilik: ${safePublicName(project.ownerName)}\n   Dicari: ${formatSkillList(project.skillsNeeded)}\n   Anggota: ${Math.min(capacity, joined + 1)}/${capacity}\n   ${cleanText(project.brief, 200)}`;
      }).join('\n\n');
      return reply(`🤝 *PROYEK KOLABORASI TERBUKA*\n\n${output}\n\nBergabung: .designcommunity collab join KODE\nDaftar ini hanya menampilkan proyek di grup ini.`);
    } catch {
      return reply('⚠️ Daftar proyek belum dapat dimuat.');
    }
  }

  const code = cleanText(args[0] || '', 16).toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (!code) return reply(`Sertakan kode proyek. Gunakan .designcommunity collab list untuk melihat proyek.`);

  if (action === 'join' || action === 'gabung') {
    try {
      const project = await CommunityCollaboration.findOne({ code, groupJid: remoteJid, status: 'open' });
      if (!project) return reply('Proyek tidak ditemukan, sudah ditutup, atau berasal dari grup lain.');
      if (project.ownerJid === userJid) return reply('Pemilik proyek sudah terdaftar otomatis sebagai anggota.');
      const collaborators = Array.isArray(project.collaborators) ? project.collaborators : [];
      if (collaborators.some(member => member.userJid === userJid)) return reply('Kamu sudah bergabung dengan proyek ini.');
      if (collaborators.length + 1 >= Number(project.slots || 2)) return reply('Kapasitas proyek sudah penuh.');
      const updated = await CommunityCollaboration.findOneAndUpdate(
        {
          code,
          groupJid: remoteJid,
          status: 'open',
          ownerJid: { $ne: userJid },
          'collaborators.userJid': { $ne: userJid },
          $expr: { $lt: [{ $size: { $ifNull: ['$collaborators', []] } }, { $subtract: ['$slots', 1] }] },
        },
        { $push: { collaborators: { userJid, userName: getProfileName(ctx), joinedAt: new Date() } } },
        { new: true },
      );
      if (!updated) return reply('Proyek baru saja berubah atau kapasitasnya telah penuh. Periksa kembali .designcommunity collab list.');
      return reply(`✅ Kamu bergabung dengan proyek *${cleanText(updated.title, 80)}* [${code}]. Diskusikan pembagian peran dan target di grup ini. Bergabung tidak membuat komitmen pembayaran atau kontrak.`);
    } catch {
      return reply('⚠️ Belum berhasil bergabung. Coba lagi setelah database stabil.');
    }
  }

  if (action === 'leave' || action === 'keluar') {
    try {
      const updated = await CommunityCollaboration.findOneAndUpdate(
        { code, groupJid: remoteJid, status: 'open', 'collaborators.userJid': userJid },
        { $pull: { collaborators: { userJid } } },
        { new: true },
      );
      if (!updated) return reply('Keanggotaan tidak ditemukan. Pemilik proyek menutup proyek melalui perintah tutup.');
      return reply(`Kamu sudah keluar dari proyek *${cleanText(updated.title, 80)}* [${code}].`);
    } catch {
      return reply('⚠️ Keanggotaan proyek belum berhasil diperbarui.');
    }
  }

  if (action === 'tutup' || action === 'close') {
    try {
      const project = await CommunityCollaboration.findOne({ code, groupJid: remoteJid, status: 'open' });
      if (!project) return reply('Proyek tidak ditemukan, sudah ditutup, atau berasal dari grup lain.');
      const isOwner = project.ownerJid === userJid;
      const isAdmin = typeof ctx.isGroupAdmin === 'function' && await ctx.isGroupAdmin(ctx.sock, remoteJid, userJid);
      if (!isOwner && !isAdmin) return reply('Hanya pemilik proyek atau Admin grup yang dapat menutup proyek ini.');
      const updated = await CommunityCollaboration.findOneAndUpdate(
        { code, groupJid: remoteJid, status: 'open' },
        { $set: { status: 'closed', closedAt: new Date(), closedBy: userJid } },
        { new: true },
      );
      if (!updated) return reply('Status proyek sudah berubah. Muat ulang daftar proyek.');
      return reply(`Proyek *${cleanText(updated.title, 80)}* [${code}] ditutup dan tidak menerima anggota baru.`);
    } catch {
      return reply('⚠️ Proyek belum berhasil ditutup.');
    }
  }

  return reply(`Subperintah kolaborasi tidak dikenali. Ketik .designcommunity collab help.`);
}

export async function handleDesignCommunityCommands(ctx) {
  const { args = [], reply, PREFIX = '.' } = ctx;
  const action = String(args[0] || 'help').toLowerCase();
  if (action === 'help') return reply(helpText(PREFIX));
  if (!isGroupContext(ctx)) return reply('Community Hub hanya tersedia di dalam grup. Ini menjaga pencarian mentor dan proyek tetap berada di komunitas asal.');
  if (!isDatabaseReady(ctx) || !hasCommunityModels(ctx)) return reply('⚠️ Community Hub membutuhkan MongoDB dan model komunitas yang aktif. Tidak ada profil atau proyek yang disimpan saat database belum siap.');
  if (action === 'badges' || action === 'achievement' || action === 'pencapaian') return handleBadges(ctx);
  if (['ringkasan', 'summary', 'kontribusi', 'stats'].includes(action)) return handleContributionSummary(ctx);
  if (['growth', 'insight', 'insights', 'perkembangan'].includes(action)) return handleGrowthInsights(ctx);
  if (action === 'collab' || action === 'kolaborasi') return handleCollaborationCommands(ctx, String(args[1] || '').toLowerCase(), args.slice(2));
  const result = await handleMentorCommands(ctx, action, args.slice(1));
  if (result !== false) return result;
  return reply(`Subperintah belum dikenali. Ketik ${PREFIX}designcommunity help untuk panduan.`);
}
