import { clearDesignBriefWizardSession } from './commands/design-brief-wizard.js';

const SESSION_TTL_MS = 30 * 60 * 1000;
const PROFILE_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const MAX_SESSIONS = 5000;
const sessions = new Map();
const volatileProfiles = new Map();

const GOALS = [
  { key: 'design', label: 'Membuat desain', hint: 'poster, logo, konten sosial, brand' },
  { key: 'learn', label: 'Belajar desain', hint: 'materi, teknik, latihan, tantangan' },
  { key: 'image', label: 'Mengolah gambar', hint: 'info, resize, kompres, crop, stiker' },
  { key: 'hire', label: 'Mencari desainer', hint: 'jelajahi portofolio, lihat kontak, hubungi langsung' },
  { key: 'offer', label: 'Menampilkan portofolio', hint: 'profil desainer, karya, kontak publik, statistik' },
  { key: 'community', label: 'Menggunakan fitur komunitas', hint: 'aturan, bantuan, aktivitas grup' },
  { key: 'game', label: 'Bermain game', hint: 'game, progres, misi, multiplayer' },
];

const LEVELS = [
  { key: 'beginner', label: 'Baru mulai', hint: 'saya ingin dipandu dari dasar' },
  { key: 'intermediate', label: 'Sudah memahami dasar', hint: 'saya sudah pernah menggunakan tools desain' },
  { key: 'advanced', label: 'Berpengalaman', hint: 'saya ingin akses workflow yang lebih lengkap' },
];

const clean = value => String(value ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 240);
const lower = value => clean(value).toLocaleLowerCase('id-ID');
const prefixOf = ctx => ctx.PREFIX || '.';

function sessionKey(ctx) {
  const user = ctx.userJid || ctx.phoneJid || ctx.sender;
  if (!user) return null;
  return `${ctx.remoteJid || 'private'}::${user}`;
}

function prune(now = Date.now()) {
  for (const [key, session] of sessions) {
    if (now - session.updatedAt > SESSION_TTL_MS) sessions.delete(key);
  }
  for (const [key, profile] of volatileProfiles) {
    if (now - Number(profile.updatedAt || 0) > PROFILE_TTL_MS) volatileProfiles.delete(key);
  }
  if (sessions.size > MAX_SESSIONS) {
    const oldest = [...sessions.entries()].sort((a, b) => a[1].updatedAt - b[1].updatedAt);
    for (const [key] of oldest.slice(0, sessions.size - MAX_SESSIONS)) sessions.delete(key);
  }
}

function normalizeGoal(value) {
  const input = lower(value);
  const byNumber = GOALS[Number(input) - 1];
  if (/^[1-7]$/.test(input) && byNumber) return byNumber.key;
  const patterns = [
    ['hire', /cari jasa|mencari jasa|cari desainer|mencari desainer|butuh desainer|butuh jasa|jasa desain/],
    ['offer', /menawarkan jasa|jual jasa|jadi desainer|portofolio|portfolio|pasang layanan|tawarkan jasa/],
    ['image', /gambar|foto|image|resize|kompres|compress|crop|stiker|sticker|ubah ukuran/],
    ['learn', /belajar|pemula|tutorial|materi|teknik|latihan|kursus/],
    ['community', /komunitas|grup|group|aturan|anggota|bantuan komunitas/],
    ['game', /game|main|bermain|permainan|rpg|multiplayer/],
    ['design', /poster|logo|desain|design|branding|brand|flyer|pamflet|konten sosial|feed|banner|kemasan/],
  ];
  return patterns.find(([, pattern]) => pattern.test(input))?.[0] || '';
}

function normalizeLevel(value) {
  const input = lower(value);
  if (['1', 'pemula', 'baru', 'baru mulai', 'beginner', 'dasar'].includes(input)) return 'beginner';
  if (['2', 'menengah', 'intermediate', 'sudah memahami dasar', 'pernah'].includes(input)) return 'intermediate';
  if (['3', 'mahir', 'lanjutan', 'advanced', 'profesional', 'berpengalaman'].includes(input)) return 'advanced';
  return '';
}

function isDatabaseReady(ctx) {
  try {
    if (typeof ctx.getDbReady === 'function') return Boolean(ctx.getDbReady());
    return Boolean(ctx.dbReady);
  } catch {
    return false;
  }
}

async function readSavedProfile(ctx, key) {
  const memoryProfile = key ? volatileProfiles.get(key) : null;
  if (memoryProfile) return memoryProfile;
  if (!isDatabaseReady(ctx) || !ctx.User || !ctx.userJid || typeof ctx.User.findOne !== 'function') return null;
  try {
    let query = ctx.User.findOne({ jid: ctx.userJid });
    if (query?.select) query = query.select('preferences.onboarding');
    if (query?.lean) query = query.lean();
    const user = await query;
    const profile = user?.preferences?.onboarding;
    if (!profile || profile.version !== 1 || !GOALS.some(goal => goal.key === profile.goal) || !LEVELS.some(level => level.key === profile.level)) return null;
    if (key) volatileProfiles.set(key, profile);
    return profile;
  } catch (error) {
    console.warn('[ONBOARDING] Tidak dapat membaca preferensi pengguna:', error.message);
    return null;
  }
}

async function saveProfile(ctx, key, profile) {
  if (key) volatileProfiles.set(key, profile);
  if (!isDatabaseReady(ctx) || !ctx.User || !ctx.userJid || typeof ctx.User.updateOne !== 'function') return false;
  try {
    await ctx.User.updateOne(
      { jid: ctx.userJid },
      { $set: { 'preferences.onboarding': profile } },
      { upsert: true },
    );
    return true;
  } catch (error) {
    console.warn('[ONBOARDING] Preferensi belum tersimpan ke database:', error.message);
    return false;
  }
}

function recommendationRows(goal, level, prefix) {
  const rows = {
    design: {
      beginner: [
        ['Susun brief desain', 'wizard', `${prefix}wizard`, 'Bot akan menanyakan kebutuhan desain satu per satu.'],
        ['Cari ide konsep', 'creative', `${prefix}creative poster acara sekolah`, 'Dapatkan tiga arah konsep sebagai titik awal.'],
        ['Periksa hasil desain', 'designqa', `${prefix}designqa poster`, 'Gunakan checklist sebelum desain dipublikasikan.'],
      ],
      intermediate: [
        ['Bangun workflow desain', 'designflow', `${prefix}designflow poster | festival musik | remaja | Instagram`, 'Hubungkan brief, konsep, dan pemeriksaan desain.'],
        ['Eksplorasi tipografi', 'fontstudio', `${prefix}fontstudio modern poster`, 'Cari pasangan font sesuai mood dan jenis desain.'],
        ['Atur palet warna', 'colorpalette', `${prefix}colorpalette ocean`, 'Jelajahi palet dan preview warna.'],
        ['Periksa hasil desain', 'designqa', `${prefix}designqa poster`, 'Periksa kesiapan sebelum publikasi.'],
      ],
      advanced: [
        ['Kelola preset proyek', 'designproject', `${prefix}designproject`, 'Simpan brief dan riwayat proyek agar pekerjaan lebih konsisten.'],
        ['Bangun sistem visual', 'designsystem', `${prefix}designsystem elegan`, 'Susun token warna, tipografi, spacing, dan komponen.'],
        ['Review kualitas desain', 'designcritique', `${prefix}designcritique poster`, 'Gunakan rubrik evaluasi dan masukan komunitas.'],
        ['Siapkan handoff', 'handoff', `${prefix}handoff Kopi Senja | logo | master vector | SVG, PDF, PNG | #20382C | Manrope`, 'Rapikan spesifikasi untuk klien atau developer.'],
      ],
    },
    learn: {
      beginner: [
        ['Mulai jalur belajar', 'designlearn', `${prefix}designlearn mulai pemula warna`, 'Pelajari materi dasar dengan latihan praktik.'],
        ['Pahami istilah desain', 'explain', `${prefix}explain visual hierarchy`, 'Minta penjelasan istilah dengan bahasa sederhana.'],
        ['Coba tantangan desain', 'designchallenge', `${prefix}designchallenge harian poster`, 'Latihan dengan brief dan batasan yang jelas.'],
      ],
      intermediate: [
        ['Belajar topik lanjutan', 'designlearn', `${prefix}designlearn mulai menengah tipografi`, 'Pilih materi sesuai kemampuan dan topik.'],
        ['Cari inspirasi terarah', 'designinspire', `${prefix}designinspire poster editorial`, 'Dapatkan kata kunci, arahan eksplorasi, dan latihan.'],
        ['Eksplorasi tipografi', 'typography', `${prefix}typography hierarchy poster`, 'Pelajari hierarki dan ukuran tipografi.'],
      ],
      advanced: [
        ['Dalami design system', 'designlearn', `${prefix}designlearn mulai lanjutan dasar`, 'Perluas pemahaman sistem desain.'],
        ['Audit UX/UI', 'uxaudit', `${prefix}uxaudit marketplace`, 'Evaluasi pengalaman produk secara terstruktur.'],
        ['Buat tantangan', 'designchallenge', `${prefix}designchallenge mingguan branding`, 'Latih konsistensi dan eksplorasi konsep.'],
      ],
    },
    image: {
      beginner: [
        ['Kenali file gambar', 'info', `${prefix}info`, 'Kirim atau balas gambar, lalu jalankan perintah ini.'],
        ['Ubah ukuran gambar', 'resize', `${prefix}resize 1080 1080`, 'Balas gambar terlebih dahulu, lalu jalankan perintah.'],
        ['Kompres gambar', 'compress', `${prefix}compress`, 'Balas gambar untuk mencoba mengurangi ukuran file.'],
      ],
      intermediate: [
        ['Periksa rasio gambar', 'ratio', `${prefix}ratio`, 'Balas gambar untuk melihat rasio dan dimensinya.'],
        ['Potong gambar', 'crop', `${prefix}crop 4:5`, 'Balas gambar untuk crop ke rasio yang dibutuhkan.'],
        ['Konversi format', 'imgconvert', `${prefix}imgconvert webp 82`, 'Balas gambar untuk mengubah format file.'],
      ],
      advanced: [
        ['Konversi format terkontrol', 'imgconvert', `${prefix}imgconvert webp 90`, 'Pilih format dan kualitas output.'],
        ['Tingkatkan resolusi', 'hd', `${prefix}hd`, 'Balas gambar; hasil bergantung pada format dan dependensi yang tersedia.'],
        ['Lihat metadata gambar', 'info', `${prefix}info`, 'Periksa metadata sebelum menyiapkan file produksi.'],
      ],
    },
    hire: {
      beginner: [
        ['Jelajahi direktori desainer', 'design', `${prefix}design`, 'Lihat desainer yang memiliki karya portofolio disetujui.'],
        ['Cari berdasarkan kategori', 'design', `${prefix}design kategori Logo`, 'Saring hasil berdasarkan jenis karya yang kamu butuhkan.'],
        ['Lihat karya dan kontak', 'designer', `${prefix}designer DSN-ID`, 'Buka profil untuk melihat portofolio dan kanal kontak publik.'],
      ],
      intermediate: [
        ['Cari berdasarkan kata kunci', 'design', `${prefix}design cari branding minimalis`, 'Cari nama karya, spesialisasi, bio, atau lokasi desainer.'],
        ['Saring berdasarkan lokasi', 'design', `${prefix}design lokasi Bandung`, 'Temukan profil berdasarkan lokasi yang dicantumkan.'],
        ['Simpan desainer favorit', 'design', `${prefix}design simpan DSN-ID`, 'Simpan profil untuk dibandingkan kembali.'],
      ],
      advanced: [
        ['Temukan karya unggulan', 'design', `${prefix}design unggulan`, 'Lihat desainer dengan karya yang ditandai unggulan.'],
        ['Bandingkan beberapa profil', 'design', `${prefix}design`, 'Evaluasi spesialisasi, gaya, lokasi, dan kualitas karya.'],
        ['Hubungi desainer langsung', 'designer', `${prefix}designer DSN-ID`, 'Negosiasi dan kesepakatan dilakukan langsung di kanal desainer, bukan melalui bot.'],
      ],
    },
    offer: {
      beginner: [
        ['Buat profil desainer', 'portfolio', `${prefix}portfolio daftar`, 'Isi nama, bio, spesialisasi, lokasi, dan kontak publik opsional.'],
        ['Tambahkan kontak publik', 'portfolio', `${prefix}portfolio edit whatsapp 6281234567890`, 'Nomor ini akan terlihat publik; cantumkan hanya jika kamu setuju.'],
        ['Lihat panduan upload karya', 'portfolio', `${prefix}portfolio add`, 'Upload karya melalui WhatsApp atau Designer Studio website (JPEG, PNG, WebP, SVG; maksimal 15 MB per file), lalu tunggu moderasi Owner.'],
      ],
      intermediate: [
        ['Rapikan profil dan spesialisasi', 'portfolio', `${prefix}portfolio`, 'Pastikan bio dan kategori mudah dipahami calon klien.'],
        ['Periksa profil publik', 'portfolio', `${prefix}portfolio preview`, 'Pastikan kontak yang kamu cantumkan memang ingin dibagikan.'],
        ['Bagikan link portofolio', 'portfolio', `${prefix}portfolio website`, 'Gunakan link publik pada bio atau kanal sosialmu.'],
      ],
      advanced: [
        ['Optimalkan karya unggulan', 'portfolio', `${prefix}portfolio unggulan ART-ID`, 'Tampilkan maksimal tiga karya terbaik di bagian atas.'],
        ['Pantau jangkauan portofolio', 'studio', `${prefix}studio`, 'Lihat profile views, portfolio views, dan contact clicks.'],
        ['Baca notifikasi website', 'portfolio', `${prefix}portfolio notifikasi`, 'Baca aktivitas Designer Studio secara pribadi di chat dengan bot.'],
        ['Atur push notifikasi Designer Studio', 'portfolio', `${prefix}portfolio notifikasi push status`, 'Aktifkan push privat secara sukarela dan atur jam tenang.'],
        ['Atur visibilitas profil', 'portfolio', `${prefix}portfolio status on`, 'Sembunyikan atau publikasikan profil sesuai kesiapan portofolio.'],
      ],
    },
    community: {
      beginner: [
        ['Baca aturan grup', 'rules', `${prefix}rules`, 'Pahami aturan dan kebiasaan komunitas.'],
        ['Lihat fitur komunitas', 'menu', `${prefix}menu grup`, 'Kenali fitur grup yang tersedia.'],
        ['Ikut tantangan desain', 'designchallenge', `${prefix}designchallenge harian`, 'Berlatih dan berbagi karya di grup.'],
        ['Temukan mentor', 'designcommunity', `${prefix}designcommunity cari branding`, 'Cari anggota yang bersedia berbagi keahlian.'],
        ['Lihat kolaborasi', 'designcommunity', `${prefix}designcommunity collab list`, 'Temukan proyek terbuka di grup.'],
        ['Minta bantuan', 'ticket', `${prefix}ticket buka Butuh bantuan menggunakan bot`, 'Buat tiket jika mengalami kendala.'],
      ],
      intermediate: [
        ['Lihat aturan grup', 'rules', `${prefix}rules`, 'Pastikan aktivitas sesuai aturan komunitas.'],
        ['Ikut tantangan desain', 'designchallenge', `${prefix}designchallenge harian`, 'Bagikan karya dan minta peer review.'],
        ['Beri masukan karya', 'designchallenge', `${prefix}designchallenge galeri`, 'Lihat karya anggota dan beri feedback yang spesifik.'],
        ['Atur profil komunitas', 'designcommunity', `${prefix}designcommunity profil`, 'Tampilkan keahlian atau kebutuhan belajar secara sukarela.'],
        ['Bergabung kolaborasi', 'designcommunity', `${prefix}designcommunity collab list`, 'Cari proyek yang sesuai dengan kemampuanmu.'],
        ['Buat laporan', 'report', `${prefix}report`, 'Gunakan jika perlu melaporkan masalah kepada admin.'],
      ],
      advanced: [
        ['Kelola interaksi komunitas', 'menu', `${prefix}menu grup`, 'Lihat alat moderasi yang sesuai peran.'],
        ['Buka program mentor', 'designcommunity', `${prefix}designcommunity mentor branding,uiux`, 'Bagikan keahlian secara sukarela di grup.'],
        ['Buat proyek kolaborasi', 'designcommunity', `${prefix}designcommunity collab buat Judul | brief kolaborasi desain yang jelas | poster,ilustrasi | 3`, 'Ajak anggota menyusun karya bersama.'],
        ['Baca aturan dan status akun', 'akses', `${prefix}akses`, 'Pastikan peran dan akses akun sudah benar.'],
        ['Buka tiket bantuan', 'ticket', `${prefix}ticket buka Dukungan komunitas`, 'Catat masalah agar dapat ditindaklanjuti.'],
      ],
    },
    game: {
      beginner: [
        ['Lihat semua permainan', 'games', `${prefix}games`, 'Pilih game dan baca aturan singkatnya.'],
        ['Lihat profil pemain', 'player', `${prefix}player`, 'Periksa level, XP, koin, dan progres.'],
        ['Lihat misi', 'mission', `${prefix}mission`, 'Temukan target dan hadiah yang bisa diklaim.'],
      ],
      intermediate: [
        ['Pilih permainan', 'games', `${prefix}games`, 'Jelajahi game solo dan multiplayer.'],
        ['Cek progres', 'player', `${prefix}player`, 'Pantau level dan pencapaian.'],
        ['Ikuti misi', 'mission', `${prefix}mission`, 'Selesaikan target aktivitas.'],
      ],
      advanced: [
        ['Buka Game Center', 'games', `${prefix}games`, 'Pilih game solo, RPG, investigasi, atau multiplayer.'],
        ['Pantau peringkat', 'player', `${prefix}player top`, 'Lihat peringkat XP komunitas.'],
        ['Ikuti misi', 'mission', `${prefix}mission`, 'Optimalkan progres dan hadiah.'],
      ],
    },
  };
  return rows[goal]?.[level] || rows.design.beginner;
}

function renderQuestion(session, prefix) {
  if (session.step === 0) {
    const options = GOALS.map((goal, index) => `${index + 1}. *${goal.label}*\n   _${goal.hint}_`).join('\n');
    return `👋 *SELAMAT DATANG DI PIR VISUALS!*\n\nKamu tidak perlu menghafal perintah. Aku akan membantu memilih fitur yang paling sesuai dengan kebutuhanmu.\n\n*1/2 — Apa yang ingin kamu lakukan?*\n${options}\n\nBalas dengan nomor atau nama kebutuhan. Ketik *batal* untuk berhenti.\n\nButuh langsung mulai? Gunakan ${prefix}wizard untuk membuat brief desain atau ${prefix}menu untuk menjelajahi fitur.`;
  }
  return `✅ Kebutuhanmu sudah dicatat.\n\n*2/2 — Seberapa berpengalaman kamu?*\n1. *Baru mulai* — pandu saya dari dasar.\n2. *Sudah memahami dasar* — saya sudah pernah memakai tools desain.\n3. *Berpengalaman* — saya ingin workflow lebih lengkap.\n\nBalas dengan nomor 1, 2, atau 3. Ketik *batal* untuk berhenti.`;
}

export function renderOnboardingGuide(profile, prefix = '.') {
  const goal = GOALS.find(item => item.key === profile?.goal) || GOALS[0];
  const level = LEVELS.find(item => item.key === profile?.level) || LEVELS[0];
  const recommendations = recommendationRows(goal.key, level.key, prefix);
  const rows = recommendations.map(([label, command, example, reason], index) =>
    `${index + 1}. *${label}*\n   Mulai: ${example}\n   ${reason}\n   Detail: ${prefix}help ${command}`
  ).join('\n\n');
  return [
    '🎯 *PANDUAN PIR VISUALS UNTUKMU*',
    '',
    `Kebutuhan: *${goal.label}*`,
    `Pengalaman: *${level.label}*`,
    '',
    '*Mulai dari sini:*',
    rows,
    '',
    '*Pintasan kapan saja:*',
    `• ${prefix}cari <kebutuhan> — cari fitur dengan bahasa sehari-hari.`,
    `• ${prefix}menu — kembali ke beranda.`,
    `• ${prefix}cepat — buka perintah favoritmu.`,
    `• ${prefix}alur <kebutuhan> — lihat urutan kerja.`,
    `• ${prefix}mulai ulang — ubah pilihan panduan.`,
    '',
    'Pilih satu langkah saja dulu. Jika belum yakin, mulai dari langkah nomor 1.',
  ].join('\n');
}

export function renderOnboardingQuickStart(prefix = '.') {
  return [
    '🧭 *MULAI DI SINI — PANDUAN PEMULA*',
    '',
    'Tidak perlu menghafal perintah. Aku akan memandu langkah demi langkah; pilih satu kebutuhan, lalu ikuti arahan bot.',
    '',
    '*Ingin membuat desain?*',
    `• ${prefix}wizard — susun brief melalui tanya-jawab.`,
    `• ${prefix}creative poster acara sekolah — cari ide konsep.`,
    `• ${prefix}checklist poster — checklist publikasi desain.`,
    `• ${prefix}designqa poster — periksa hasil desain.`,
    '',
    '*Ingin mengolah gambar?*',
    `• Kirim/balas gambar lalu gunakan ${prefix}info, ${prefix}resize 1080 1080, atau ${prefix}compress.`,
    '',
    '*Ingin belajar?*',
    `• ${prefix}designlearn pemula warna — mulai belajar dari dasar.`,
    `• ${prefix}explain visual hierarchy — pahami istilah desain.`,
    '',
    '*Ingin mencari jasa atau menawarkan jasa?*',
    `• ${prefix}design — cari desainer.`,
    `• ${prefix}portfolio daftar — mulai profil desainer.`,
    '',
    '*Ingin hal lain?*',
    `• ${prefix}games — permainan komunitas.`,
    `• ${prefix}rules — aturan grup.`,
    `• ${prefix}cari poster — temukan fitur berdasarkan kebutuhan.`,
    `• ${prefix}cepat — simpan fitur favorit dan buka pintasan pribadimu.`,
    '',
    `Untuk panduan yang lebih sesuai, ketik ${prefix}mulai ulang.`,
  ].join('\n');
}

export async function startOnboarding(ctx, args = []) {
  prune();
  const prefix = prefixOf(ctx);
  const key = sessionKey(ctx);
  const action = lower(args[0] || '');

  if (action === 'batal' || action === 'cancel') {
    if (key) sessions.delete(key);
    return ctx.reply(`✅ Panduan pemula dibatalkan. Kamu tetap bisa memakai ${prefix}menu atau ${prefix}mulai kapan saja.`);
  }
  if (action === 'cepat' || action === 'quick') {
    return ctx.reply(renderOnboardingQuickStart(prefix));
  }
  if (action === 'profil' || action === 'profile' || action === 'rekomendasi') {
    const profile = await readSavedProfile(ctx, key);
    return ctx.reply(profile
      ? renderOnboardingGuide(profile, prefix)
      : `Belum ada preferensi panduan yang tersimpan. Ketik ${prefix}mulai untuk memilih kebutuhan dan tingkat pengalaman.`);
  }

  if (key && !['ulang', 'reset', 'ubah'].includes(action)) {
    const saved = await readSavedProfile(ctx, key);
    if (saved) return ctx.reply(renderOnboardingGuide(saved, prefix));
  }

  if (!key) return ctx.reply(renderOnboardingQuickStart(prefix));
  await clearDesignBriefWizardSession(ctx);
  sessions.set(key, { step: 0, goal: '', updatedAt: Date.now() });
  return ctx.reply(renderQuestion(sessions.get(key), prefix));
}

export async function consumeOnboardingMessage(ctx) {
  prune();
  const key = sessionKey(ctx);
  if (!key) return false;
  const session = sessions.get(key);
  if (!session) return false;

  if (ctx.isCommand) {
    const command = String(ctx.command || '').toLowerCase();
    const subcommand = lower(ctx.args?.[0] || '');
    sessions.delete(key);
    if ((command === 'mulai' && ['batal', 'cancel'].includes(subcommand)) || command === 'cancel') {
      await ctx.reply(`✅ Panduan pemula dibatalkan. Gunakan ${prefixOf(ctx)}menu untuk kembali ke beranda.`);
      return true;
    }
    return false;
  }

  const answer = clean(ctx.messageText);
  if (!answer) return true;
  if (/^(batal|cancel|stop)$/i.test(answer)) {
    sessions.delete(key);
    await ctx.reply(`✅ Panduan pemula dibatalkan. Ketik ${prefixOf(ctx)}mulai jika ingin mencoba lagi.`);
    return true;
  }

  if (session.step === 0) {
    const goal = normalizeGoal(answer);
    if (!goal) {
      await ctx.reply(`Aku belum mengenali pilihan itu. Balas dengan angka 1–7 atau nama kebutuhan seperti *desain*, *belajar*, *gambar*, *mencari jasa*, *menawarkan jasa*, *komunitas*, atau *game*.\n\n${renderQuestion(session, prefixOf(ctx))}`);
      return true;
    }
    session.goal = goal;
    session.step = 1;
    session.updatedAt = Date.now();
    await ctx.reply(renderQuestion(session, prefixOf(ctx)));
    return true;
  }

  const level = normalizeLevel(answer);
  if (!level && !['lewati', 'skip', 'belum tahu'].includes(lower(answer))) {
    await ctx.reply('Pilih 1 (baru mulai), 2 (sudah memahami dasar), atau 3 (berpengalaman). Kamu juga bisa mengetik *lewati* untuk memakai panduan pemula.');
    return true;
  }

  const profile = {
    version: 1,
    goal: session.goal || 'design',
    level: level || 'beginner',
    updatedAt: Date.now(),
  };
  sessions.delete(key);
  const persisted = await saveProfile(ctx, key, profile);
  const status = persisted
    ? `Preferensimu tersimpan. Ketik ${prefixOf(ctx)}mulai profil untuk melihat rekomendasi ini lagi.`
    : `Panduan ini sudah siap. Preferensi belum tersimpan ke database, jadi gunakan ${prefixOf(ctx)}mulai untuk mengaturnya lagi jika bot dimulai ulang.`;
  await ctx.reply(`${renderOnboardingGuide(profile, prefixOf(ctx))}\n\n${status}`);
  return true;
}

export function resetOnboardingSessionsForTests() {
  sessions.clear();
  volatileProfiles.clear();
}
