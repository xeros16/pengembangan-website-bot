import { randomBytes } from 'node:crypto';
import { isIP } from 'node:net';

// Curated, offline-first tools for design inspiration and structured learning.
export const DESIGN_LEARNING_COMMANDS = new Set(['designinspire', 'designlearn', 'designchallenge', 'portfolioguide']);

const inspirationLibrary = [
  { key: 'poster', label: 'Poster & editorial', terms: 'editorial poster layout, typographic poster, Swiss grid poster, experimental typography', direction: 'Tentukan satu focal point, susun headline sebagai elemen utama, lalu gunakan grid dan ruang kosong untuk menjaga alur baca.', exercise: 'Buat 3 thumbnail komposisi hitam-putih sebelum memilih satu arah.' },
  { key: 'branding', label: 'Branding & logo', terms: 'minimal brand identity, logo construction, visual identity system, brand guidelines', direction: 'Mulai dari karakter brand dan kebutuhan pengguna; eksplorasi wordmark, simbol, dan sistem identitas dalam versi monokrom.', exercise: 'Buat 10 sketsa siluet logo sederhana, lalu uji pada ukuran avatar.' },
  { key: 'ui', label: 'UI/UX & web', terms: 'web design layout, mobile app interface, dashboard UI, design system', direction: 'Fokus pada kebutuhan pengguna, hierarki informasi, konsistensi komponen, dan state antarmuka.', exercise: 'Rancang satu layar utama dan dokumentasikan state kosong, loading, error, serta sukses.' },
  { key: 'social', label: 'Social media', terms: 'instagram carousel design, social media campaign, bold social media layout', direction: 'Bangun hook yang terbaca cepat, satu pesan per slide, dan sistem visual konsisten antar-konten.', exercise: 'Susun carousel 5 slide: hook, masalah, insight, solusi, CTA.' },
  { key: 'packaging', label: 'Packaging', terms: 'modern packaging design, coffee packaging, label design, packaging dieline', direction: 'Prioritaskan nama produk, varian, informasi penting, dan keterbacaan pada bidang kemasan.', exercise: 'Buat tampak depan kemasan dengan tiga tingkat hierarki informasi.' },
  { key: 'illustration', label: 'Ilustrasi', terms: 'editorial illustration, geometric illustration, character design, visual storytelling', direction: 'Pilih bahasa bentuk, batasan palet, dan sudut pandang cerita agar ilustrasi terasa konsisten.', exercise: 'Gambar satu objek dengan tiga pendekatan: geometris, organik, dan minimal.' },
  { key: 'typography', label: 'Typography', terms: 'typography specimen, type hierarchy poster, expressive typography, font pairing', direction: 'Eksplorasi kontras ukuran, bobot, lebar, dan ritme; jangan mengandalkan banyak keluarga font.', exercise: 'Buat satu komposisi dari headline, subjudul, dan body menggunakan maksimal dua keluarga font.' },
  { key: 'photography', label: 'Fotografi & art direction', terms: 'product photography art direction, editorial photography, color lighting moodboard', direction: 'Tentukan subjek, pencahayaan, sudut kamera, latar, dan palet sebelum mengambil atau memilih gambar.', exercise: 'Buat shot list 5 frame untuk satu produk dengan satu sumber cahaya.' },
];

const lessons = {
  pemula: {
    title: 'Jalur Pemula',
    topics: {
      dasar: ['Prinsip desain: kontras, repetisi, alignment, proximity', 'Hierarki visual dan focal point', 'Warna: hue, saturation, value, dan harmoni sederhana', 'Tipografi: keterbacaan, ukuran, dan pasangan font', 'Grid, alignment, spacing, dan negative space'],
      warna: ['Bedakan hue, saturation, dan value', 'Gunakan palet 2–4 warna untuk latihan awal', 'Pastikan kontras teks dan latar memadai', 'Buat variasi terang-gelap dari satu warna utama'],
      tipografi: ['Kenali serif, sans-serif, display, dan monospace', 'Bedakan heading, subheading, dan body', 'Atur ukuran, line-height, dan panjang baris', 'Batasi jumlah keluarga font'],
      layout: ['Tentukan satu pesan utama', 'Buat grid sederhana', 'Atur alignment dan jarak', 'Uji keterbacaan pada ukuran thumbnail'],
    },
    task: 'Buat poster sederhana berisi satu judul, satu visual utama, tiga informasi pendukung, dan satu CTA.'
  },
  menengah: {
    title: 'Jalur Menengah',
    topics: {
      dasar: ['Sistem grid modular dan responsive layout', 'Komposisi dinamis dan visual storytelling', 'Sistem warna dan semantic color roles', 'Sistem tipografi dan skala modular', 'Konsistensi komponen dan design system'],
      warna: ['Bangun palet dengan peran primary, secondary, surface, dan accent', 'Uji kombinasi pada konteks teks dan UI', 'Rancang variasi tema terang dan gelap', 'Dokumentasikan token warna'],
      tipografi: ['Bangun type scale', 'Atur hierarchy lintas breakpoint', 'Evaluasi readability dan accessibility', 'Dokumentasikan style heading, body, caption'],
      layout: ['Gunakan grid modular', 'Atur ritme dan density konten', 'Rancang variasi layout untuk beberapa ukuran', 'Evaluasi konsistensi antarhalaman'],
    },
    task: 'Redesain satu halaman produk dengan dua breakpoint, sistem warna, type scale, dan komponen konsisten.'
  },
  lanjutan: {
    title: 'Jalur Lanjutan',
    topics: {
      dasar: ['Strategi visual berbasis positioning brand', 'Design system berskala dan governance', 'Accessibility dan evaluasi berbasis bukti', 'Art direction lintas kanal', 'Eksperimen desain dan pengukuran dampak'],
      warna: ['Bangun token warna kontekstual dan adaptif', 'Evaluasi kontras untuk berbagai state', 'Uji palet pada simulasi kondisi penggunaan', 'Rancang governance perubahan token'],
      tipografi: ['Rancang sistem tipografi lintas platform', 'Evaluasi font loading dan fallback', 'Atur hierarchy untuk konten kompleks', 'Uji aksesibilitas dan lokalisasi'],
      layout: ['Rancang sistem layout lintas breakpoint', 'Tentukan aturan adaptasi komponen', 'Uji skenario konten ekstrem', 'Dokumentasikan keputusan dan trade-off'],
    },
    task: 'Susun mini case study yang menjelaskan masalah, riset singkat, keputusan visual, iterasi, dan alasan hasil akhir.'
  }
};

const topicAliases = { fundamental: 'dasar', basic: 'dasar', color: 'warna', colors: 'warna', typography: 'tipografi', type: 'tipografi', composition: 'layout', ui: 'layout' };

export function buildDesignInspiration(args = []) {
  const raw = args.join(' ').trim();
  if (!raw) return '💡 *DESIGN INSPIRATION*\nTemukan arah eksplorasi berdasarkan kategori.\n\nFormat: .designinspire <kategori> [tema/gaya]\nKategori: poster, branding, ui, social, packaging, illustration, typography, photography\nContoh: .designinspire branding kopi modern\nContoh: .designinspire poster cyberpunk merah hitam';
  const tokens = raw.toLowerCase().split(/\s+/);
  const aliases = { logo: 'branding', brand: 'branding', web: 'ui', app: 'ui', aplikasi: 'ui', feed: 'social', carousel: 'social', kemasan: 'packaging', ilustrasi: 'illustration', huruf: 'typography', foto: 'photography', fotografi: 'photography' };
  const category = aliases[tokens[0]] || tokens[0];
  const item = inspirationLibrary.find(entry => entry.key === category);
  if (!item) return `Kategori “${tokens[0]}” belum tersedia. Pilih: ${inspirationLibrary.map(entry => entry.key).join(', ')}.\nContoh: .designinspire poster cyberpunk merah hitam`;
  const theme = raw.split(/\s+/).slice(1).join(' ') || 'eksplorasi bebas';
  const query = `${item.terms}, ${theme}`;
  const pinterest = `https://www.pinterest.com/search/pins/?q=${encodeURIComponent(query)}`;
  const bing = `https://www.bing.com/images/search?q=${encodeURIComponent(query)}`;
  return `💡 *DESIGN INSPIRATION — ${item.label.toUpperCase()}*\nTema: ${theme}\n\n*Keyword referensi*\n${query}\n\n*Arah eksplorasi*\n${item.direction}\n\n*Tantangan kecil*\n${item.exercise}\n\n*Cari referensi visual*\nPinterest: ${pinterest}\nBing Images: ${bing}\n\nCatatan: tautan membuka hasil pencarian eksternal; bot belum mengkurasi atau memverifikasi hak penggunaan tiap gambar. Gunakan referensi untuk belajar, bukan menyalin karya.'`;
}

export function buildDesignLearning(args = []) {
  const raw = args.join(' ').trim().toLowerCase();
  if (!raw) return [
    '📚 *LEARNING CENTER PIR VISUALS*',
    'Belajar desain berdasarkan tingkat kemampuan, dengan progress yang dapat disimpan.',
    '',
    '*Mulai cepat*',
    '• .designlearn jalur — lihat kurikulum.',
    '• .designlearn mulai pemula dasar — mulai materi pertama.',
    '• .designlearn lanjut — buka materi berikutnya.',
    '• .designlearn selesai — tandai materi selesai.',
    '• .designlearn progress — lihat perkembangan belajar.',
    '',
    '*Topik:* dasar, warna, tipografi, layout.',
    '*Level:* pemula, menengah, lanjutan.',
    '',
    'Materi dapat dibaca tanpa database. Penyimpanan progress memerlukan MongoDB.',
  ].join('\n');
  const [levelRaw, ...topicParts] = raw.split(/\s+/);
  const levelAliases = { beginner: 'pemula', intermediate: 'menengah', advanced: 'lanjutan' };
  const level = levelAliases[levelRaw] || levelRaw;
  const path = lessons[level];
  if (!path) return 'Tingkat belum dikenali. Pilih: pemula, menengah, atau lanjutan.\nContoh: .designlearn pemula warna';
  const requestedTopic = topicAliases[topicParts.join(' ')] || topicParts.join(' ') || 'dasar';
  if (!path.topics[requestedTopic]) {
    return `Topik “${requestedTopic}” belum tersedia untuk ${level}. Pilih: ${Object.keys(path.topics).join(', ')}.`;
  }
  const topic = requestedTopic;
  const list = path.topics[topic].map((entry, index) => `${index + 1}. ${entry}`).join('\n');
  const topicLabel = ({ dasar: 'Dasar desain', warna: 'Warna', tipografi: 'Tipografi', layout: 'Layout & komposisi' })[topic] || topic;
  const practiceByTopic = {
    dasar: 'Buat satu poster sederhana. Tandai focal point, urutan baca, alignment, dan ruang kosong.',
    warna: 'Buat palet 3–4 warna. Uji teks utama, teks sekunder, latar, dan tombol/aksen pada ukuran nyata.',
    tipografi: 'Buat satu komposisi dengan headline, subjudul, dan body. Batasi maksimal dua keluarga font.',
    layout: 'Buat wireframe atau thumbnail sebelum desain final. Periksa alignment, ritme, dan jarak antar-elemen.',
  };
  const reviewByTopic = {
    dasar: 'Apakah pesan utama langsung terlihat? Apakah jarak dan alignment terasa disengaja?',
    warna: 'Apakah teks tetap terbaca? Apakah warna memiliki peran yang jelas dan tidak saling berebut perhatian?',
    tipografi: 'Apakah urutan judul, subjudul, dan isi mudah dipahami? Apakah ukuran dan line-height nyaman dibaca?',
    layout: 'Apakah alur baca jelas? Apakah elemen memiliki jarak konsisten dan ruang kosong yang cukup?',
  };
  return [
    `📚 *DESIGN LEARNING — ${path.title.toUpperCase()}*`,
    `Topik: *${topicLabel}*`,
    '',
    '*Tujuan materi*',
    `Memahami dan menerapkan ${topicLabel.toLowerCase()} pada proyek desain nyata sesuai tingkat ${level}.`,
    '',
    '*Materi inti*',
    list,
    '',
    '*Latihan praktik*',
    practiceByTopic[topic],
    '',
    '*Checklist evaluasi mandiri*',
    reviewByTopic[topic],
    '• Minta satu orang lain membaca atau mencoba hasil desain.',
    '• Catat satu hal yang berhasil dan satu hal yang perlu diperbaiki.',
    '',
    '*Langkah berikutnya*',
    'Simpan materi sebagai jalur aktif: .designlearn mulai ' + level + ' ' + topic,
    'Setelah latihan, tandai selesai: .designlearn selesai',
    'Lihat perkembangan: .designlearn progress',
    '',
    'Catatan: materi adalah panduan belajar, bukan sertifikasi atau penilaian profesional otomatis.',
  ].join('\n');
}

export async function handleDesignLearningCommands(ctx) {
  const { command, args = [], reply } = ctx;
  if (command === 'designinspire') return reply(buildDesignInspiration(args));
  if (command === 'designlearn') return handleLearningPathCommand(ctx);
  if (command === 'designchallenge') return handleCommunityChallengeCommand(ctx);
  if (command === 'portfolioguide') return reply(buildPortfolioGuide(args));
}

const challengeLibrary = [
  { category: 'poster', title: 'Satu Pesan, Satu Fokus', brief: 'Rancang poster acara komunitas dengan satu pesan utama yang langsung terbaca.', constraints: ['Gunakan maksimal dua keluarga font.', 'Batasi palet menjadi tiga warna.', 'Sediakan satu focal point yang jelas.'], deliverables: '1 poster utama + 1 versi thumbnail.', review: 'Apakah judul terbaca dalam 3 detik? Apakah informasi waktu dan tempat mudah ditemukan?' },
  { category: 'branding', title: 'Identitas dari Tiga Kata', brief: 'Buat arah identitas visual untuk brand fiktif berdasarkan tiga kata karakter pilihanmu.', constraints: ['Mulai dari versi monokrom.', 'Buat wordmark atau simbol sederhana.', 'Tentukan aturan penggunaan minimum.'], deliverables: 'Logo utama, versi alternatif, dan palet warna.', review: 'Apakah identitas tetap dikenali pada ukuran kecil dan tanpa warna?' },
  { category: 'ui', title: 'Dashboard yang Tidak Membingungkan', brief: 'Rancang satu layar dashboard untuk pengguna baru yang perlu memahami satu metrik penting.', constraints: ['Tampilkan maksimal lima kelompok informasi.', 'Sediakan state kosong atau belum ada data.', 'Gunakan hierarki yang konsisten.'], deliverables: '1 layar desktop atau mobile + catatan komponen.', review: 'Bisakah pengguna menemukan informasi utama tanpa membaca semua label?' },
  { category: 'social', title: 'Carousel Lima Slide', brief: 'Buat carousel edukasi singkat tentang satu tips desain yang sering dilupakan.', constraints: ['Slide pertama harus memiliki hook.', 'Satu gagasan utama per slide.', 'Akhiri dengan CTA yang relevan.'], deliverables: 'Carousel 5 slide dengan sistem visual konsisten.', review: 'Apakah alur tetap masuk akal jika dibaca berurutan dan tiap slide berdiri sendiri?' },
  { category: 'packaging', title: 'Kemasan di Rak', brief: 'Rancang tampak depan kemasan produk lokal agar mudah dikenali dari kejauhan.', constraints: ['Nama produk harus menjadi prioritas.', 'Tampilkan satu pembeda produk.', 'Periksa keterbacaan pada skala kecil.'], deliverables: 'Tampak depan kemasan + satu mockup presentasi.', review: 'Apakah produk dan variannya bisa dikenali dalam beberapa detik?' },
  { category: 'typography', title: 'Poster Tanpa Foto', brief: 'Bangun poster yang mengandalkan tipografi sebagai elemen visual utama.', constraints: ['Maksimal dua keluarga font.', 'Gunakan kontras ukuran atau bobot yang disengaja.', 'Jaga ritme dan ruang kosong.'], deliverables: '1 poster tipografi + spesimen font yang dipakai.', review: 'Apakah hierarki tetap jelas tanpa bantuan ilustrasi atau foto?' },
  { category: 'illustration', title: 'Satu Objek, Tiga Gaya', brief: 'Pilih satu objek sehari-hari dan gambarkan dalam tiga bahasa visual berbeda.', constraints: ['Pertahankan objek yang sama.', 'Bedakan pendekatan bentuk dan tekstur.', 'Gunakan palet terbatas.'], deliverables: '3 eksplorasi ilustrasi dalam satu lembar.', review: 'Apakah perbedaan gaya terlihat jelas dan tetap punya karakter?' },
  { category: 'photography', title: 'Art Direction Produk', brief: 'Susun konsep pemotretan produk sederhana dengan properti yang tersedia.', constraints: ['Gunakan satu sumber cahaya utama.', 'Tentukan sudut kamera dan latar.', 'Hindari properti yang mengalihkan fokus.'], deliverables: 'Shot list 4 frame + satu foto hero atau sketsa art direction.', review: 'Apakah pencahayaan, sudut, dan properti mendukung karakter produk?' },
  { category: 'poster', title: 'Grid Eksperimental', brief: 'Buat poster editorial dengan grid yang konsisten tetapi komposisi tidak simetris.', constraints: ['Tentukan grid sebelum menata elemen.', 'Gunakan alignment sebagai jangkar.', 'Sisakan area kosong yang disengaja.'], deliverables: '1 poster + anotasi grid.', review: 'Apakah komposisi terasa dinamis tanpa kehilangan keteraturan?' },
  { category: 'branding', title: 'Sistem Identitas Fleksibel', brief: 'Buat sistem identitas untuk komunitas yang tampil di avatar, poster, dan header digital.', constraints: ['Sediakan versi horizontal dan ringkas.', 'Gunakan warna dengan fungsi yang jelas.', 'Tentukan clear space sederhana.'], deliverables: 'Logo responsive, palet, dan contoh aplikasi.', review: 'Apakah sistem konsisten di tiga konteks yang berbeda?' },
];

const challengeCategoryAliases = {
  logo: 'branding', brand: 'branding', web: 'ui', app: 'ui', aplikasi: 'ui',
  feed: 'social', carousel: 'social', kemasan: 'packaging', ilustrasi: 'illustration',
  huruf: 'typography', foto: 'photography', fotografi: 'photography',
};

function stableHash(value) {
  let hash = 2166136261;
  for (const char of String(value)) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function getJakartaDateKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function isoWeekKeyFromDateKey(dateKey) {
  const [year, month, day] = dateKey.split('-').map(Number);
  const value = new Date(Date.UTC(year, month - 1, day, 12));
  const weekday = value.getUTCDay() || 7;
  value.setUTCDate(value.getUTCDate() + 4 - weekday);
  const yearStart = new Date(Date.UTC(value.getUTCFullYear(), 0, 1, 12));
  const week = Math.ceil((((value - yearStart) / 86400000) + 1) / 7);
  return `${value.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}
function resolveChallengeCategory(raw) {
  const value = challengeCategoryAliases[String(raw || '').toLowerCase()] || String(raw || '').toLowerCase();
  return challengeLibrary.some(item => item.category === value) ? value : '';
}

export function resolveDesignChallenge(args = [], now = new Date()) {
  const tokens = args.map(value => String(value || '').trim()).filter(Boolean);
  const modeRaw = (tokens[0] || 'harian').toLowerCase();
  const modeAliases = { daily: 'harian', today: 'harian', weekly: 'mingguan', week: 'mingguan', mulai: 'harian' };
  const mode = modeAliases[modeRaw] || modeRaw;
  if (!['harian', 'mingguan'].includes(mode)) return { error: 'Mode tidak dikenali. Pilih harian atau mingguan.' };

  const categoryRaw = tokens[1] || '';
  const category = categoryRaw ? resolveChallengeCategory(categoryRaw) : '';
  if (categoryRaw && !category) {
    return { error: `Kategori “${categoryRaw}” belum tersedia. Pilih: poster, branding, ui, social, packaging, illustration, typography, photography.` };
  }

  const pool = challengeLibrary.filter(item => !category || item.category === category);
  const dateKey = getJakartaDateKey(now);
  const periodKey = mode === 'harian' ? dateKey : isoWeekKeyFromDateKey(dateKey);
  const challenge = pool[stableHash(`${mode}:${periodKey}:${category || 'all'}`) % pool.length];
  return {
    mode,
    dateKey,
    periodKey,
    category: category || 'all',
    challengeKey: `${mode}:${periodKey}:${category || 'all'}`,
    challenge,
    periodLabel: mode === 'harian' ? `Harian · ${dateKey} WIB` : `Mingguan · ${periodKey} WIB`,
  };
}

export function buildDesignChallenge(args = [], now = new Date()) {
  const result = resolveDesignChallenge(args, now);
  if (result.error) {
    return `🎯 *DESIGN CHALLENGE*\n${result.error}\nFormat: .designchallenge <harian|mingguan> [kategori]\nContoh: .designchallenge harian poster\nContoh: .designchallenge mingguan`;
  }
  const { mode, periodLabel, challenge } = result;
  return [
    `🎯 *DESIGN CHALLENGE — ${periodLabel.toUpperCase()}*`,
    `Kategori: ${challenge.category}`,
    `*${challenge.title}*`,
    '',
    `*Brief:* ${challenge.brief}`,
    '',
    '*Batasan:*',
    ...challenge.constraints.map((item, index) => `${index + 1}. ${item}`),
    '',
    `*Output:* ${challenge.deliverables}`,
    `*Evaluasi mandiri:* ${challenge.review}`,
    '',
    '*Ikut tantangan bersama komunitas*',
    `• Kirim karya: .designchallenge submit ${mode} ${challenge.category} Judul karya | https://tautan-karya | refleksi singkat`,
    '• Lihat karya anggota: .designchallenge galeri',
    '• Beri masukan: .designchallenge feedback KODE 5 Masukan yang spesifik dan membangun',
    '',
    'Tautan karya harus menggunakan HTTPS. Kamu juga dapat mengirim gambar di grup dengan caption perintah submit.',
    'Catatan: tantangan dipilih deterministik dari pustaka lokal. Bot tidak mengklaim menilai kualitas karya secara otomatis.',
  ].join('\n');
}

const portfolioChecklist = [
  'Pilih 3–6 proyek terbaik yang relevan dengan jenis pekerjaan yang dituju.',
  'Jelaskan konteks, masalah, tujuan, peran, dan batasan proyek.',
  'Tampilkan proses: riset, eksplorasi, alternatif, iterasi, dan keputusan desain.',
  'Tunjukkan hasil akhir dalam konteks penggunaan, bukan hanya gambar lepas.',
  'Cantumkan kontribusi pribadi dan kolaborator secara jujur.',
  'Pastikan izin publikasi, hak aset, font, foto, dan informasi klien.',
  'Periksa ejaan, tautan, konsistensi layout, dan tampilan mobile.',
];

function cleanPortfolioField(value, fallback = '[lengkapi bagian ini]') {
  const cleaned = String(value || '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 280);
  return cleaned || fallback;
}

function splitPortfolioFields(values) {
  return values.join(' ').split('|').map(value => value.trim());
}

export function buildPortfolioGuide(args = []) {
  const raw = args.map(value => String(value || '')).join(' ').trim();
  const [actionRaw = 'mulai', ...rest] = raw.split(/\s+/);
  const action = actionRaw.toLowerCase();

  if (['mulai', 'start', 'help', 'bantuan'].includes(action)) {
    return [
      '🗂️ *PORTFOLIO GUIDE*',
      'Panduan menyusun portfolio dan case study desain.',
      '',
      '*Perintah:*',
      '• .portfolioguide checklist — checklist sebelum publikasi.',
      '• .portfolioguide case-study Judul | Jenis | Masalah | Proses | Hasil',
      '• .portfolioguide bio Spesialisasi | Pengalaman | Tools',
      '',
      'Susun portfolio berdasarkan kualitas dan relevansi karya, bukan jumlah halaman. Jangan tampilkan materi klien tanpa izin.',
    ].join('\n');
  }

  if (['checklist', 'cek'].includes(action)) {
    return ['🗂️ *PORTFOLIO CHECKLIST*', ...portfolioChecklist.map((item, index) => `${index + 1}. ${item}`)].join('\n');
  }

  if (['case-study', 'casestudy', 'studi-kasus', 'project'].includes(action)) {
    const fields = splitPortfolioFields(rest);
    const [title, type, problem, process, outcome] = fields;
    if (!fields.length) {
      return 'Format: .portfolioguide case-study Judul proyek | Jenis desain | Masalah | Proses | Hasil';
    }
    return [
      `📘 *CASE STUDY — ${cleanPortfolioField(title, 'PROYEK TANPA JUDUL').toUpperCase()}*`,
      '',
      `*Jenis proyek:* ${cleanPortfolioField(type)}`,
      `*Konteks & masalah:* ${cleanPortfolioField(problem)}`,
      `*Proses & keputusan desain:* ${cleanPortfolioField(process)}`,
      `*Hasil & dampak:* ${cleanPortfolioField(outcome)}`,
      '',
      '*Bagian yang perlu kamu lengkapi:*',
      '1. Peran dan tanggung jawabmu.',
      '2. Timeline serta batasan proyek.',
      '3. Artefak proses (sketsa, wireframe, eksplorasi, iterasi).',
      '4. Visual hasil akhir dalam konteks penggunaan.',
      '5. Pelajaran yang didapat dan hal yang akan ditingkatkan.',
      '',
      'Gunakan data hasil yang dapat dibuktikan. Jika tidak ada metrik, jelaskan hasil kualitatif tanpa mengarang angka.',
    ].join('\n');
  }

  if (['bio', 'profil', 'about'].includes(action)) {
    const fields = splitPortfolioFields(rest);
    const [specialty, experience, tools] = fields;
    return [
      '👤 *PORTFOLIO BIO BUILDER*',
      '',
      `Saya seorang desainer ${cleanPortfolioField(specialty, '[spesialisasi]')}.`,
      `Saya memiliki pengalaman ${cleanPortfolioField(experience, '[pengalaman atau fokus proyek]')}.`,
      `Saya terbiasa menggunakan ${cleanPortfolioField(tools, '[tools yang benar-benar dikuasai]')}.`,
      '',
      'Tambahkan jenis klien/proyek yang ingin kamu bantu, pendekatan kerja, dan kontak profesional. Pastikan semua klaim sesuai pengalaman nyata.',
      'Format: .portfolioguide bio Spesialisasi | Pengalaman | Tools',
    ].join('\n');
  }

  return 'Subperintah belum dikenali. Gunakan .portfolioguide mulai, checklist, case-study, atau bio.';
}


const LEARNING_LEVELS = ['pemula', 'menengah', 'lanjutan'];
const LEARNING_TOPICS = ['dasar', 'warna', 'tipografi', 'layout'];
const TOTAL_LEARNING_MODULES = LEARNING_LEVELS.length * LEARNING_TOPICS.length;

function normalizeLearningProgress(value = {}) {
  return {
    currentLevel: LEARNING_LEVELS.includes(value.currentLevel) ? value.currentLevel : '',
    currentTopic: LEARNING_TOPICS.includes(value.currentTopic) ? value.currentTopic : '',
    completedLessons: [...new Set(Array.isArray(value.completedLessons) ? value.completedLessons.filter(key => {
      const [level, topic] = String(key).split(':');
      return LEARNING_LEVELS.includes(level) && LEARNING_TOPICS.includes(topic);
    }) : [])],
    completionHistory: Array.isArray(value.completionHistory) ? value.completionHistory.slice(-24) : [],
    lastActivityAt: value.lastActivityAt || null,
    updatedAt: value.updatedAt || null,
  };
}

function learningModuleKey(level, topic) {
  return `${level}:${topic}`;
}

function formatLearningProgress(progress) {
  const completed = progress.completedLessons.length;
  const percent = Math.round((completed / TOTAL_LEARNING_MODULES) * 100);
  const current = progress.currentLevel && progress.currentTopic
    ? `${progress.currentLevel} · ${progress.currentTopic}`
    : 'Belum memilih materi';
  const rows = LEARNING_LEVELS.map(level => {
    const done = LEARNING_TOPICS.filter(topic => progress.completedLessons.includes(learningModuleKey(level, topic))).length;
    return `• ${lessons[level].title}: ${done}/${LEARNING_TOPICS.length} materi`;
  });
  return [
    '📈 *PROGRESS BELAJAR DESAIN*',
    `Materi selesai: *${completed}/${TOTAL_LEARNING_MODULES}* (${percent}%)`,
    `Materi aktif: *${current}*`,
    '',
    ...rows,
    '',
    completed === TOTAL_LEARNING_MODULES
      ? '🎉 Semua materi dalam kurikulum dasar sudah ditandai selesai. Kamu bisa mengulang materi atau mencoba tantangan komunitas.'
      : 'Lanjutkan dari materi aktif: .designlearn lanjut',
    'Progress tersimpan per akun WhatsApp dan bukan sertifikasi kemampuan.',
  ].join('\n');
}

function formatLearningPath(progress) {
  const rows = [];
  for (const level of LEARNING_LEVELS) {
    rows.push(`*${lessons[level].title}*`);
    for (const topic of LEARNING_TOPICS) {
      const complete = progress.completedLessons.includes(learningModuleKey(level, topic));
      const active = progress.currentLevel === level && progress.currentTopic === topic;
      rows.push(`${complete ? '✅' : active ? '➡️' : '▫️'} ${topic}`);
    }
    rows.push('');
  }
  return [
    '🧭 *LEARNING PATH — 12 MATERI*',
    ...rows,
    'Pilih materi: .designlearn mulai <pemula|menengah|lanjutan> <dasar|warna|tipografi|layout>',
    'Lihat progress: .designlearn progress',
  ].join('\n');
}

async function loadLearningProgress(ctx) {
  const { User, userJid, getDbReady } = ctx;
  if (typeof getDbReady === 'function' && !getDbReady()) return { ok: false, reason: 'MongoDB belum terhubung.' };
  if (!User || typeof User.findOne !== 'function' || !userJid) return { ok: false, reason: 'Penyimpanan progress belum tersedia.' };
  const user = await User.findOne({ jid: userJid });
  return { ok: true, progress: normalizeLearningProgress(user?.preferences?.learningProgress || {}) };
}

async function saveLearningProgress(ctx, progress) {
  const { User, userJid, getDbReady } = ctx;
  if (typeof getDbReady === 'function' && !getDbReady()) return false;
  if (!User || typeof User.findOneAndUpdate !== 'function' || !userJid) return false;
  const next = normalizeLearningProgress({ ...progress, lastActivityAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  await User.findOneAndUpdate(
    { jid: userJid },
    { $set: { 'preferences.learningProgress': next } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  return true;
}

async function handleLearningPathCommand(ctx) {
  const { args = [], reply, PREFIX = '.' } = ctx;
  const actionRaw = String(args[0] || 'help').toLowerCase();
  const levelAliases = { beginner: 'pemula', intermediate: 'menengah', advanced: 'lanjutan' };
  const action = levelAliases[actionRaw] || actionRaw;

  if (['help', 'bantuan'].includes(action)) return reply(buildDesignLearning([]));
  if (action === 'jalur' || action === 'path') {
    const state = await loadLearningProgress(ctx);
    if (!state.ok) return reply(`${formatLearningPath(normalizeLearningProgress())}\n\nℹ️ ${state.reason} Materi tetap dapat dibaca tanpa penyimpanan.`);
    return reply(formatLearningPath(state.progress));
  }

  if (action === 'progress' || action === 'status') {
    const state = await loadLearningProgress(ctx);
    if (!state.ok) return reply(`⚠️ ${state.reason}\nProgress pribadi membutuhkan database.`);
    return reply(formatLearningProgress(state.progress));
  }

  if (action === 'reset') {
    if (String(args[1] || '').toLowerCase() !== 'konfirmasi') {
      return reply(`Reset akan menghapus progress belajar akunmu, bukan materi atau data anggota lain.\nKetik: ${PREFIX}designlearn reset konfirmasi`);
    }
    const saved = await saveLearningProgress(ctx, normalizeLearningProgress());
    return reply(saved ? '♻️ Progress belajar pribadi berhasil direset. Materi dan data komunitas tidak berubah.' : '⚠️ Progress belum dapat direset karena database atau identitas pengguna tidak tersedia.');
  }

  const state = await loadLearningProgress(ctx);
  if (!state.ok && ['selesai'].includes(action)) {
    return reply(`⚠️ ${state.reason}\nKamu tetap bisa membaca materi dengan format lama: ${PREFIX}designlearn pemula warna.`);
  }
  const progress = state.ok ? state.progress : normalizeLearningProgress();

  if (action === 'selesai' || action === 'done') {
    if (!progress.currentLevel || !progress.currentTopic) {
      return reply(`Belum ada materi aktif. Mulai dulu: ${PREFIX}designlearn mulai pemula dasar`);
    }
    const key = learningModuleKey(progress.currentLevel, progress.currentTopic);
    if (progress.completedLessons.includes(key)) return reply(`ℹ️ Materi *${progress.currentLevel} · ${progress.currentTopic}* sudah pernah ditandai selesai. Lanjutkan dengan ${PREFIX}designlearn lanjut.`);
    const note = args.slice(1).join(' ').trim().replace(/[\u0000-\u001f\u007f]/g, ' ').slice(0, 240);
    progress.completedLessons.push(key);
    progress.completionHistory.push({ key, completedAt: new Date().toISOString(), note });
    progress.completionHistory = progress.completionHistory.slice(-24);
    const saved = await saveLearningProgress(ctx, progress);
    if (!saved) return reply('⚠️ Progress belum tersimpan. Pastikan MongoDB dan identitas akun tersedia.');
    return reply(`✅ *MATERI DITANDAI SELESAI*\n${progress.currentLevel} · ${progress.currentTopic}\nProgress kurikulum: ${progress.completedLessons.length}/${TOTAL_LEARNING_MODULES}\n${note ? `Catatanmu: ${note}\n` : ''}\nLanjut: ${PREFIX}designlearn lanjut\nProgress: ${PREFIX}designlearn progress\n\nPenandaan ini berdasarkan konfirmasi mandiri, bukan penilaian otomatis.`);
  }

  if (action === 'lanjut' || action === 'next') {
    if (progress.currentLevel && progress.currentTopic && !progress.completedLessons.includes(learningModuleKey(progress.currentLevel, progress.currentTopic))) {
      return reply(`Materi aktif *${progress.currentLevel} · ${progress.currentTopic}* belum ditandai selesai. Praktikkan dulu, lalu gunakan ${PREFIX}designlearn selesai.\n\n${buildDesignLearning([progress.currentLevel, progress.currentTopic])}`);
    }
    let level = progress.currentLevel || 'pemula';
    let startIndex = progress.currentLevel ? LEARNING_TOPICS.indexOf(progress.currentTopic) + 1 : 0;
    let next = null;
    for (let levelIndex = LEARNING_LEVELS.indexOf(level); levelIndex < LEARNING_LEVELS.length && !next; levelIndex += 1) {
      const candidateLevel = LEARNING_LEVELS[levelIndex];
      const topics = levelIndex === LEARNING_LEVELS.indexOf(level) ? LEARNING_TOPICS.slice(Math.max(0, startIndex)) : LEARNING_TOPICS;
      const topic = topics.find(item => !progress.completedLessons.includes(learningModuleKey(candidateLevel, item)));
      if (topic) next = { level: candidateLevel, topic };
    }
    if (!next) return reply('🎉 Semua materi dalam jalur 12 modul sudah ditandai selesai. Kamu bisa mengulang materi atau mengikuti .designchallenge mingguan.');
    progress.currentLevel = next.level;
    progress.currentTopic = next.topic;
    const saved = await saveLearningProgress(ctx, progress);
    const material = buildDesignLearning([next.level, next.topic]);
    return reply(`${material}\n\n${saved ? '📌 Materi ini disimpan sebagai materi aktif.' : 'ℹ️ Materi tampil tanpa penyimpanan progress.'}`);
  }

  if (action === 'mulai' || action === 'pilih' || LEARNING_LEVELS.includes(action)) {
    const level = action === 'mulai' || action === 'pilih'
      ? (levelAliases[String(args[1] || '').toLowerCase()] || String(args[1] || '').toLowerCase())
      : action;
    const topicRaw = action === 'mulai' || action === 'pilih' ? args.slice(2).join(' ').toLowerCase() : args.slice(1).join(' ').toLowerCase();
    const topic = topicAliases[topicRaw] || topicRaw || 'dasar';
    if (!LEARNING_LEVELS.includes(level)) return reply(`Pilih level: pemula, menengah, atau lanjutan.\nContoh: ${PREFIX}designlearn mulai pemula warna`);
    if (!LEARNING_TOPICS.includes(topic)) return reply(`Topik belum tersedia. Pilih: ${LEARNING_TOPICS.join(', ')}.`);
    progress.currentLevel = level;
    progress.currentTopic = topic;
    const saved = await saveLearningProgress(ctx, progress);
    return reply(`${buildDesignLearning([level, topic])}\n\n${saved ? '📌 Materi aktif tersimpan. Setelah praktik, gunakan .designlearn selesai.' : 'ℹ️ Materi ditampilkan tanpa penyimpanan progress.'}`);
  }

  // Backward-compatible syntax: .designlearn pemula warna.
  if (LEARNING_LEVELS.includes(action)) {
    return reply(buildDesignLearning(args));
  }
  return reply(`Perintah belajar belum dikenali.\n${PREFIX}designlearn jalur\n${PREFIX}designlearn mulai pemula dasar\n${PREFIX}designlearn lanjut\n${PREFIX}designlearn selesai\n${PREFIX}designlearn progress`);
}

function safePublicWorkUrl(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (raw.length > 500) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== 'https:' || !url.hostname.includes('.') || url.username || url.password || isIP(url.hostname)) return null;
    if (['localhost', '127.0.0.1', '::1'].includes(url.hostname.toLowerCase())) return null;
    return url.toString();
  } catch {
    return null;
  }
}

function cleanCommunityText(value, max = 160) {
  return String(value || '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
}

function makeSubmissionCode() {
  return randomBytes(4).toString('hex').toUpperCase();
}

function parseChallengeSelection(tokens = [], now = new Date()) {
  let mode = 'harian';
  let category = '';
  let index = 0;
  const first = String(tokens[index] || '').toLowerCase();
  const modeWasExplicit = ['harian', 'mingguan', 'daily', 'weekly', 'week', 'today'].includes(first);
  if (modeWasExplicit) {
    mode = first;
    index += 1;
    const possibleCategory = String(tokens[index] || '').toLowerCase();
    if (possibleCategory && resolveChallengeCategory(possibleCategory)) {
      category = possibleCategory;
      index += 1;
    }
  }
  const challenge = resolveDesignChallenge([mode, category].filter(Boolean), now);
  return { challenge, remaining: tokens.slice(index) };
}

function ensureChallengeDatabase(ctx) {
  const ready = typeof ctx.getDbReady === 'function' ? ctx.getDbReady() : true;
  return ready && ctx.LearningSubmission && ctx.userJid;
}


function isBattleManager(ctx) {
  const owner = typeof ctx.isBotOwner === 'function'
    && ctx.isBotOwner(ctx.userJid, ctx.senderIdentityAliases || []);
  return Boolean(owner);
}

async function canManageBattle(ctx) {
  if (isBattleManager(ctx)) return true;
  if (typeof ctx.isGroupAdmin !== 'function') return false;
  return Boolean(await ctx.isGroupAdmin(ctx.sock, ctx.remoteJid, ctx.sender || ctx.userJid));
}

function safeChallengeDisplayName(value, fallback = 'Anggota') {
  const name = cleanCommunityText(value, 60);
  const digits = name.replace(/\D/g, '');
  if (!name || name.includes('@') || (digits.length >= 8 && /^[+\d\s().-]+$/.test(name))) return fallback;
  return name;
}

function formatBattleTime(value) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return 'Waktu tidak tersedia';
  return date.toLocaleString('id-ID', {
    timeZone: 'Asia/Jakarta',
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }) + ' WIB';
}

function battleHelp(prefix = '.') {
  return [
    '⚔️ *DESIGN BATTLE — KOMPETISI KOMUNITAS*',
    `${prefix}designchallenge battle buat Judul | brief | kategori | durasi-jam — Admin membuat battle.`,
    `${prefix}designchallenge battle list — lihat battle yang masih terbuka.`,
    `${prefix}designchallenge battle lihat KODE — baca brief dan batas waktu.`,
    `${prefix}designchallenge battle submit KODE Judul karya | https://tautan | refleksi — ikut secara sukarela.`,
    `${prefix}designchallenge battle galeri KODE — lihat kiriman battle.`,
    `${prefix}designchallenge battle hasil KODE — ringkasan peer review setelah battle.`,
    `${prefix}designchallenge battle tutup KODE — Admin atau pembuat menutup battle.`,
    `${prefix}designchallenge feedback KODE-KARYA 5 Masukan yang spesifik — beri peer review.`,
    '',
    'Aturan: 1–168 jam, satu kiriman aktif per anggota, HTTPS atau gambar terlampir, feedback satu kali per karya, dan semua data hanya untuk grup asal.',
    'Tidak ada penilaian AI, hadiah otomatis, atau publikasi ke luar grup. Peer review adalah apresiasi komunitas, bukan sertifikasi kualitas.',
  ].join('\n');
}

async function handleDesignBattleCommands(ctx, args = []) {
  const {
    DesignBattle, LearningSubmission, remoteJid, userJid, isGroup, msg,
    getImageTarget, reply, PREFIX = '.', senderIdentityAliases = [],
  } = ctx;
  const action = String(args[0] || 'help').toLowerCase();
  const code = cleanCommunityText(args[1] || '', 16).toUpperCase().replace(/[^A-Z0-9]/g, '');

  if (['help', 'bantuan', ''].includes(action)) return reply(battleHelp(PREFIX));
  if (!isGroup) return reply('Design Battle hanya tersedia di grup komunitas agar partisipasi, galeri, dan peer review tetap berada di ruang yang sama.');
  if (!ensureChallengeDatabase(ctx) || !DesignBattle) {
    return reply('⚠️ Design Battle membutuhkan MongoDB serta model DesignBattle dan LearningSubmission yang aktif.');
  }

  if (['buat', 'create', 'mulai'].includes(action)) {
    if (!await canManageBattle(ctx)) return reply('⛔ Hanya Admin grup atau Owner bot yang dapat membuat Design Battle.');
    const fields = args.slice(1).join(' ').split('|').map(value => cleanCommunityText(value, 520));
    const [title, brief, categoryRaw, durationRaw] = fields;
    const category = resolveChallengeCategory(categoryRaw);
    const durationHours = durationRaw === undefined || durationRaw === '' ? 48 : Number(durationRaw);
    if (!title || title.length < 5 || title.length > 80 || !brief || brief.length < 20 || brief.length > 500
      || !category || !Number.isInteger(durationHours) || durationHours < 1 || durationHours > 168) {
      return reply(`Format: ${PREFIX}designchallenge battle buat Judul Battle | brief minimal 20 karakter | poster | 48\nJudul 5–80 karakter, brief 20–500 karakter, kategori: poster, branding, ui, social, packaging, illustration, typography, photography, durasi 1–168 jam.`);
    }
    const now = new Date();
    try {
      await DesignBattle.updateMany(
        { groupJid: remoteJid, status: 'open', endsAt: { $lte: now } },
        { $set: { status: 'closed', closedAt: now, closedBy: 'system' } },
      );
      const existing = await DesignBattle.findOne({ groupJid: remoteJid, status: 'open' });
      if (existing) {
        return reply(`Masih ada Design Battle aktif: *${cleanCommunityText(existing.title, 80)}* [${existing.code}]. Tutup atau tunggu battle tersebut sebelum membuat yang baru.`);
      }
      const battleCode = makeSubmissionCode();
      const battle = await DesignBattle.create({
        code: battleCode,
        groupJid: remoteJid,
        createdBy: userJid,
        createdByName: safeChallengeDisplayName(msg?.pushName, 'Admin grup'),
        title,
        brief,
        category,
        startsAt: now,
        endsAt: new Date(now.getTime() + durationHours * 60 * 60 * 1000),
        status: 'open',
      });
      return reply([
        '⚔️ *DESIGN BATTLE DIBUKA*',
        `Kode: *${battle.code}*`,
        `Judul: ${battle.title}`,
        `Kategori: ${battle.category}`,
        `Brief: ${battle.brief}`,
        `Mulai: ${formatBattleTime(battle.startsAt)}`,
        `Batas akhir: ${formatBattleTime(battle.endsAt)}`,
        '',
        `Peserta dapat ikut dengan ${PREFIX}designchallenge battle submit ${battle.code} Judul karya | https://tautan-karya | refleksi.`,
        `Galeri: ${PREFIX}designchallenge battle galeri ${battle.code}`,
        'Partisipasi bersifat sukarela dan hanya terlihat di grup ini.',
      ].join('\n'));
    } catch (error) {
      console.warn('[DESIGN BATTLE CREATE]', error?.message || error);
      if (Number(error?.code) === 11000) return reply('Battle aktif lain baru saja dibuat untuk grup ini. Lihat dengan .designchallenge battle list.');
      return reply('⚠️ Design Battle belum berhasil dibuat. Periksa koneksi database dan coba lagi.');
    }
  }

  if (['list', 'daftar'].includes(action)) {
    try {
      const battles = await DesignBattle.find({ groupJid: remoteJid, status: 'open' }).sort({ endsAt: 1 }).limit(10);
      const current = battles.filter(item => new Date(item.endsAt).getTime() > Date.now());
      if (!current.length) return reply(`Belum ada Design Battle terbuka di grup ini.\nAdmin dapat membuatnya dengan ${PREFIX}designchallenge battle buat Judul | brief | poster | 48.`);
      return reply(`⚔️ *DESIGN BATTLE TERBUKA*\n\n${current.map((item, index) => `${index + 1}. *${cleanCommunityText(item.title, 80)}* [${item.code}]\n   Kategori: ${item.category} · Berakhir: ${formatBattleTime(item.endsAt)}`).join('\n\n')}\n\nGunakan ${PREFIX}designchallenge battle lihat KODE untuk membaca brief.`);
    } catch {
      return reply('⚠️ Daftar Design Battle belum dapat dimuat.');
    }
  }

  if (!code) return reply(`Sertakan kode battle. Gunakan ${PREFIX}designchallenge battle list.`);
  let battle;
  try {
    battle = await DesignBattle.findOne({ groupJid: remoteJid, code });
  } catch {
    return reply('⚠️ Data Design Battle belum dapat dimuat.');
  }
  if (!battle) return reply('Battle tidak ditemukan pada grup ini.');

  if (['lihat', 'detail', 'info'].includes(action)) {
    const isOpen = battle.status === 'open' && new Date(battle.endsAt).getTime() > Date.now();
    return reply([
      `⚔️ *${cleanCommunityText(battle.title, 80)}* [${battle.code}]`,
      `Status: ${isOpen ? 'TERBUKA' : 'DITUTUP'}`,
      `Kategori: ${battle.category}`,
      `Brief: ${cleanCommunityText(battle.brief, 500)}`,
      `Dibuka: ${formatBattleTime(battle.startsAt)}`,
      `Batas akhir: ${formatBattleTime(battle.endsAt)}`,
      '',
      isOpen
        ? `Ikut: ${PREFIX}designchallenge battle submit ${battle.code} Judul karya | https://tautan | refleksi`
        : `Lihat hasil: ${PREFIX}designchallenge battle hasil ${battle.code}`,
    ].join('\n'));
  }

  if (['submit', 'kirim', 'ikut'].includes(action)) {
    const isOpen = battle.status === 'open' && new Date(battle.endsAt).getTime() > Date.now();
    if (!isOpen) return reply('Battle sudah ditutup atau melewati batas waktu. Kiriman baru tidak diterima.');
    const fields = args.slice(2).join(' ').split('|').map(value => value.trim());
    const title = cleanCommunityText(fields[0], 100);
    const workUrl = safePublicWorkUrl(fields[1] || '');
    const reflection = cleanCommunityText(fields.slice(2).join(' | '), 400);
    const hasImage = typeof getImageTarget === 'function' ? Boolean(getImageTarget(msg)) : false;
    if (!title) return reply(`Format: ${PREFIX}designchallenge battle submit ${battle.code} Judul karya | https://tautan | refleksi`);
    if (fields[1] && workUrl === null) return reply('Tautan karya harus HTTPS yang valid tanpa username/password. Kosongkan kolom tautan jika gambar dilampirkan pada pesan.');
    if (!workUrl && !hasImage) return reply('Lampirkan gambar pada pesan atau sertakan tautan karya HTTPS agar peserta lain dapat melihat hasilmu.');
    const now = new Date();
    const challengeKey = `battle:${battle.code}`;
    try {
      const existingEntry = await LearningSubmission.findOne({ groupJid: remoteJid, challengeKey, userJid });
      if (existingEntry?.status === 'hidden') {
        return reply('Kiriman ini sedang disembunyikan Admin karena moderasi. Hubungi Admin untuk meminta peninjauan; kiriman baru tidak dapat digunakan untuk melewati moderasi.');
      }
      const submission = await LearningSubmission.findOneAndUpdate(
        { groupJid: remoteJid, challengeKey, userJid, status: { $ne: 'hidden' } },
        {
          $set: {
            challengeMode: 'battle',
            challengeDate: battle.code,
            challengeCategory: battle.category,
            challengeTitle: battle.title,
            title,
            workUrl: workUrl || '',
            sourceMessageId: hasImage ? String(msg?.key?.id || '') : '',
            reflection,
            userName: safeChallengeDisplayName(msg?.pushName, 'Anggota'),
            feedback: [],
            status: 'active',
            updatedAt: now,
          },
          $setOnInsert: { code: makeSubmissionCode(), createdAt: now },
        },
        { upsert: !existingEntry, new: true, setDefaultsOnInsert: true },
      );
      if (!submission) return reply('Kiriman tidak diperbarui karena status moderasinya berubah. Minta Admin memeriksa galeri.');
      return reply(`✅ *KARYA MASUK DESIGN BATTLE*\nKode karya: *${submission.code}*\nBattle: ${battle.title}\nJudul: ${title}\n${workUrl ? `Tautan: ${workUrl}` : 'Gambar: tersedia pada pesan asli di grup.'}\n\nSatu anggota memiliki satu entri aktif dan dapat memperbaruinya sebelum battle ditutup; mengganti karya akan mereset peer review lama agar penilaian tidak tertukar. Beri peer review pada karya lain melalui ${PREFIX}designchallenge feedback ${submission.code} 5 Masukan yang spesifik.`);
    } catch (error) {
      console.warn('[DESIGN BATTLE SUBMIT]', error?.message || error);
      return reply('⚠️ Karya belum berhasil disimpan. Pastikan battle masih aktif dan database tersedia.');
    }
  }

  if (['galeri', 'gallery'].includes(action)) {
    try {
      const entries = await LearningSubmission.find({
        groupJid: remoteJid, challengeKey: `battle:${battle.code}`, status: 'active',
      }).sort({ updatedAt: -1 }).limit(30);
      if (!entries.length) return reply(`Belum ada kiriman untuk *${battle.title}*. Bagikan karya pertama melalui ${PREFIX}designchallenge battle submit ${battle.code} ...`);
      return reply(`🖼️ *GALERI DESIGN BATTLE — ${battle.title}*\n\n${entries.map((entry, index) => `${index + 1}. *${cleanCommunityText(entry.title, 100)}* — ${cleanCommunityText(entry.userName || 'Anggota', 60)}\n   Kode karya: ${entry.code} · ${Array.isArray(entry.feedback) ? entry.feedback.length : 0} peer review${entry.workUrl ? `\n   Karya: ${entry.workUrl}` : '\n   Gambar: lihat pesan asli pengirim di grup'}`).join('\n\n')}\n\nBeri masukan yang spesifik, sopan, dan membangun. Galeri hanya tersedia di grup ini.`);
    } catch {
      return reply('⚠️ Galeri Design Battle belum dapat dimuat.');
    }
  }

  if (['hasil', 'results'].includes(action)) {
    if (battle.status === 'open' && new Date(battle.endsAt).getTime() > Date.now()) {
      return reply('Ringkasan hasil akhir baru tersedia setelah Admin atau pembuat menutup battle. Gunakan galeri untuk melihat karya yang sudah masuk.');
    }
    try {
      const entries = await LearningSubmission.find({
        groupJid: remoteJid, challengeKey: `battle:${battle.code}`, status: 'active',
      }).sort({ updatedAt: -1 }).limit(50);
      if (!entries.length) return reply('Belum ada kiriman pada battle ini.');
      const rows = entries.map(entry => {
        const feedback = Array.isArray(entry.feedback) ? entry.feedback : [];
        const average = feedback.length
          ? (feedback.reduce((sum, item) => sum + Number(item.score || 0), 0) / feedback.length).toFixed(1)
          : '—';
        return { title: cleanCommunityText(entry.title, 100), name: cleanCommunityText(entry.userName || 'Anggota', 60), code: entry.code, average, reviews: feedback.length };
      }).sort((a, b) => (b.average === '—' ? -1 : a.average === '—' ? 1 : Number(b.average) - Number(a.average)) || b.reviews - a.reviews);
      return reply(`📊 *RINGKASAN PEER REVIEW — ${battle.title}*\n\n${rows.map((item, index) => `${index + 1}. *${item.title}* — ${item.name}\n   Kode ${item.code} · Rata-rata ${item.average}/5 · ${item.reviews} review`).join('\n\n')}\n\nUrutan ini hanya ringkasan skor apresiasi yang diberikan peserta; bukan penilaian objektif atau sertifikasi kualitas desain.`);
    } catch {
      return reply('⚠️ Hasil Design Battle belum dapat dimuat.');
    }
  }

  if (['tutup', 'close'].includes(action)) {
    const manager = await canManageBattle(ctx);
    const creator = battle.createdBy === userJid;
    if (!manager && !creator) return reply('Hanya pembuat battle, Admin grup, atau Owner bot yang dapat menutupnya.');
    if (battle.status !== 'open') return reply('Battle ini sudah ditutup.');
    try {
      const updated = await DesignBattle.findOneAndUpdate(
        { groupJid: remoteJid, code: battle.code, status: 'open' },
        { $set: { status: 'closed', closedBy: userJid, closedAt: new Date() } },
        { new: true },
      );
      if (!updated) return reply('Status battle sudah berubah. Muat ulang detail battle.');
      return reply(`🔒 *DESIGN BATTLE DITUTUP*\n${battle.title} [${battle.code}]\nKiriman baru tidak lagi diterima. Galeri dan ringkasan peer review tetap dapat dibaca.`);
    } catch {
      return reply('⚠️ Battle belum berhasil ditutup.');
    }
  }

  return reply(`Subperintah battle tidak dikenali. Ketik ${PREFIX}designchallenge battle help.`);
}

async function handleCommunityChallengeCommand(ctx) {
  const { args = [], reply, PREFIX = '.', isGroup, remoteJid, userJid, msg, getImageTarget, LearningSubmission, DesignBattle, sock, isGroupAdmin, isBotOwner, senderIdentityAliases = [] } = ctx;
  const action = String(args[0] || 'today').toLowerCase();
  const aliases = { today: 'harian', daily: 'harian', week: 'mingguan', weekly: 'mingguan', kirim: 'submit', lihat: 'galeri', saya: 'progress', papan: 'kontributor' };
  const normalizedAction = aliases[action] || action;

  if (normalizedAction === 'battle') return handleDesignBattleCommands(ctx, args.slice(1));

  if (['harian', 'mingguan'].includes(normalizedAction) || action === 'today') {
    return reply(buildDesignChallenge(args[0] === 'today' ? ['harian', ...args.slice(1)] : args));
  }
  if (['help', 'bantuan'].includes(normalizedAction)) {
    return reply([
      '🎯 *COMMUNITY DESIGN CHALLENGE*',
      `${PREFIX}designchallenge harian [kategori] — tantangan hari ini.`,
      `${PREFIX}designchallenge mingguan [kategori] — tantangan minggu ini.`,
      `${PREFIX}designchallenge submit <judul> | <tautan HTTPS> | <refleksi> — kirim ke tantangan harian.`,
      `${PREFIX}designchallenge submit harian poster <judul> | <tautan HTTPS> | <refleksi> — pilih tantangan mingguan/harian dan kategori.`,
      `${PREFIX}designchallenge galeri [harian|mingguan] [kategori] — lihat karya peserta di grup ini.`,
      `${PREFIX}designchallenge feedback <KODE> <1-5> <masukan> — beri peer review.`,
      `${PREFIX}designchallenge progress — statistik partisipasimu.`,
      `${PREFIX}designchallenge kontributor — anggota paling aktif.`,
      `${PREFIX}designchallenge hide <KODE> <alasan> — sembunyikan kiriman (Admin grup/Owner).`,
      `${PREFIX}designchallenge restore <KODE> — pulihkan kiriman (Admin grup/Owner).`,
      '',
      'Kamu juga bisa mengirim gambar ke grup dengan caption perintah submit.',
      'Satu entri aktif per anggota untuk setiap tantangan; kiriman berikutnya memperbarui entri sendiri.',
      'Tidak ada penilaian AI, hadiah otomatis, atau publikasi ke luar grup.',
    ].join('\n'));
  }

  if (normalizedAction === 'submit') {
    if (!isGroup) return reply('Kirim karya tantangan hanya tersedia di grup komunitas agar galeri tetap berada di ruang yang sama.');
    if (!ensureChallengeDatabase(ctx)) return reply('⚠️ Penyimpanan tantangan belum tersedia. Pastikan MongoDB terhubung dan model LearningSubmission aktif.');
    const { challenge, remaining } = parseChallengeSelection(args.slice(1));
    if (challenge.error) return reply(challenge.error);
    // Without an explicit category, submit to the featured category selected by the current challenge.
    if (challenge.category === 'all') {
      challenge.category = challenge.challenge.category;
      challenge.challengeKey = `${challenge.mode}:${challenge.periodKey}:${challenge.category}`;
    }
    const fields = remaining.join(' ').split('|').map(value => value.trim());
    const title = cleanCommunityText(fields[0], 100);
    const workUrl = safePublicWorkUrl(fields[1] || '');
    const reflection = cleanCommunityText(fields.slice(2).join(' | '), 400);
    const hasImage = typeof getImageTarget === 'function' ? Boolean(getImageTarget(msg)) : false;
    if (!title) return reply(`Format: ${PREFIX}designchallenge submit <judul> | <tautan HTTPS> | <refleksi>\nOpsional: tambahkan harian/mingguan dan kategori setelah submit. Kirim gambar di grup dengan caption perintah submit.`);
    if (fields[1] && workUrl === null) return reply('Tautan karya harus HTTPS yang valid, tanpa username/password. Kosongkan kolom tautan jika gambar sudah dilampirkan.');
    if (!workUrl && !hasImage) return reply('Lampirkan gambar pada pesan ini atau sertakan tautan karya HTTPS agar anggota lain dapat melihat hasilmu.');
    const now = new Date();
    const code = makeSubmissionCode();
    try {
      const submission = await LearningSubmission.findOneAndUpdate(
        { groupJid: remoteJid, challengeKey: challenge.challengeKey, userJid },
        {
          $set: {
            challengeMode: challenge.mode,
            challengeDate: challenge.periodKey,
            challengeCategory: challenge.challenge.category,
            challengeTitle: challenge.challenge.title,
            title,
            workUrl: workUrl || '',
            sourceMessageId: hasImage ? String(msg?.key?.id || '') : '',
            reflection,
            userName: cleanCommunityText(msg?.pushName || 'Anggota', 60) || 'Anggota',
            status: 'active',
            updatedAt: now,
          },
          $setOnInsert: { code, createdAt: now, feedback: [] },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );
      return reply(`✅ *KARYA TERCATAT DI COMMUNITY CHALLENGE*\nKode: *${submission.code}*\nTantangan: ${challenge.challenge.title}\nJudul karya: ${title}\n${workUrl ? `Tautan: ${workUrl}\n` : 'Gambar: tersedia pada pesan yang kamu kirim di grup.\n'}${reflection ? `Refleksi: ${reflection}\n` : ''}\nAnggota grup dapat melihat karya melalui .designchallenge galeri dan memberi masukan dengan .designchallenge feedback ${submission.code} 5 Masukan yang spesifik.\n\nEntri ini hanya tampil di grup ini; tidak otomatis masuk ke direktori portofolio publik.`);
    } catch (error) {
      return reply(`⚠️ Karya belum berhasil disimpan. Coba lagi setelah database stabil. (${String(error?.message || 'database error').slice(0, 100)})`);
    }
  }

  if (normalizedAction === 'galeri' || normalizedAction === 'gallery') {
    if (!isGroup) return reply('Galeri tantangan hanya tersedia di grup tempat karya dikirim.');
    if (!ensureChallengeDatabase(ctx)) return reply('⚠️ Database tantangan belum tersedia.');
    const { challenge } = parseChallengeSelection(args.slice(1));
    if (challenge.error) return reply(challenge.error);
    const filter = { groupJid: remoteJid, challengeMode: challenge.mode, challengeDate: challenge.periodKey, status: 'active' };
    if (challenge.category !== 'all') filter.challengeCategory = challenge.category;
    try {
      const rows = await LearningSubmission.find(filter).sort({ updatedAt: -1 }).limit(10);
      if (!rows.length) return reply(`Belum ada karya untuk tantangan ${challenge.challenge.title} di grup ini.\nJadilah yang pertama: ${PREFIX}designchallenge submit Judul | https://tautan-karya | refleksi`);
      const output = rows.map((row, index) => {
        const link = row.workUrl ? `\n   Karya: ${row.workUrl}` : '\n   Gambar: lihat pesan asli pengirim di grup';
        return `${index + 1}. *${cleanCommunityText(row.title, 100)}* — ${cleanCommunityText(row.userName || 'Anggota', 60)}\n   Kode: ${row.code} · ${Array.isArray(row.feedback) ? row.feedback.length : 0} masukan${link}`;
      });
      return reply(`🖼️ *GALERI COMMUNITY CHALLENGE*\n${challenge.periodLabel}\n${challenge.category === 'all' ? 'Semua kategori' : challenge.challenge.title}\n\n${output.join('\n\n')}\n\nBeri masukan dengan: ${PREFIX}designchallenge feedback <KODE> <1-5> <masukan>\nGaleri ini hanya menampilkan kiriman pada grup ini.`);
    } catch {
      return reply('⚠️ Galeri belum dapat dimuat. Coba lagi beberapa saat.');
    }
  }

  if (normalizedAction === 'feedback') {
    if (!isGroup) return reply('Peer review hanya tersedia di grup komunitas.');
    if (!ensureChallengeDatabase(ctx)) return reply('⚠️ Database peer review belum tersedia.');
    const code = String(args[1] || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12);
    const score = Number(args[2]);
    const comment = cleanCommunityText(args.slice(3).join(' '), 400);
    if (!code || !Number.isInteger(score) || score < 1 || score > 5 || comment.length < 12) {
      return reply(`Format: ${PREFIX}designchallenge feedback <KODE> <1-5> <masukan minimal 12 karakter>\nContoh: ${PREFIX}designchallenge feedback ABC2345 5 Hierarki judul sudah kuat, coba tambah ruang antarbagian.`);
    }
    try {
      const existing = await LearningSubmission.findOne({ code, groupJid: remoteJid, status: 'active' });
      if (!existing) return reply('Kode karya tidak ditemukan pada grup ini.');
      if (existing.challengeMode === 'battle') {
        const battle = DesignBattle ? await DesignBattle.findOne({ groupJid: remoteJid, code: existing.challengeDate }) : null;
        if (!battle || battle.status !== 'open' || new Date(battle.endsAt).getTime() <= Date.now()) {
          return reply('Periode peer review Design Battle sudah ditutup. Ringkasan hasil akhir tersedia melalui .designchallenge battle hasil KODE-BATTLE.');
        }
      }
      if (existing.userJid === userJid) return reply('Kamu tidak dapat memberi feedback pada karya sendiri. Minta anggota lain melakukan review.');
      const already = (existing.feedback || []).some(item => item.reviewerJid === userJid);
      if (already) return reply('Kamu sudah memberi feedback pada karya ini. Satu anggota hanya dapat memberi satu feedback per karya.');
      const updated = await LearningSubmission.findOneAndUpdate(
        { _id: existing._id, userJid: { $ne: userJid }, 'feedback.reviewerJid': { $ne: userJid } },
        { $push: { feedback: { reviewerJid: userJid, reviewerName: cleanCommunityText(msg?.pushName || 'Anggota', 60), score, comment, createdAt: new Date() } } },
        { new: true },
      );
      if (!updated) return reply('Feedback tidak tersimpan. Mungkin kamu sudah memberi masukan pada karya ini.');
      return reply(`💬 *PEER REVIEW TERSIMPAN*\nKarya: ${cleanCommunityText(existing.title, 100)}\nSkor apresiasi: ${score}/5\nMasukan: ${comment}\n\nTerima kasih. Utamakan masukan yang spesifik, sopan, dan dapat ditindaklanjuti.`);
    } catch {
      return reply('⚠️ Feedback belum berhasil disimpan. Coba lagi setelah database stabil.');
    }
  }

  if (normalizedAction === 'hide' || normalizedAction === 'restore') {
    if (!isGroup) return reply('Moderasi kiriman tantangan hanya tersedia di grup.');
    if (!ensureChallengeDatabase(ctx)) return reply('⚠️ Database tantangan belum tersedia.');
    const owner = typeof isBotOwner === 'function' && isBotOwner(userJid, senderIdentityAliases);
    const admin = typeof isGroupAdmin === 'function' ? await isGroupAdmin(sock, remoteJid, userJid) : false;
    if (!owner && !admin) return reply('⛔ Hanya Admin grup atau Owner bot yang dapat memoderasi kiriman tantangan.');
    const code = String(args[1] || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12);
    if (!code) return reply(`Format: ${PREFIX}designchallenge ${normalizedAction} <KODE>${normalizedAction === 'hide' ? ' <alasan>' : ''}`);
    const note = normalizedAction === 'hide' ? cleanCommunityText(args.slice(2).join(' '), 240) : '';
    if (normalizedAction === 'hide' && note.length < 5) return reply('Tambahkan alasan singkat minimal 5 karakter agar tindakan moderasi dapat dipahami.');
    try {
      const updated = await LearningSubmission.findOneAndUpdate(
        { code, groupJid: remoteJid, status: normalizedAction === 'hide' ? 'active' : 'hidden' },
        { $set: {
          status: normalizedAction === 'hide' ? 'hidden' : 'active',
          moderationNote: note,
          moderatedBy: userJid,
          moderatedAt: new Date(),
        } },
        { new: true },
      );
      if (!updated) return reply('Kode kiriman tidak ditemukan atau statusnya sudah berubah.');
      return reply(normalizedAction === 'hide'
        ? `🛡️ Kiriman *${code}* disembunyikan dari galeri grup. Alasan moderasi dicatat secara internal.`
        : `✅ Kiriman *${code}* dipulihkan dan kembali terlihat di galeri grup.`);
    } catch {
      return reply('⚠️ Status moderasi belum berhasil diperbarui.');
    }
  }

  if (normalizedAction === 'progress') {
    if (!isGroup) return reply('Statistik tantangan tersedia di grup tempat kamu berpartisipasi.');
    if (!ensureChallengeDatabase(ctx)) return reply('⚠️ Database tantangan belum tersedia.');
    try {
      const [submittedCount, feedbackTotals, feedbackGivenCount] = await Promise.all([
        LearningSubmission.countDocuments({ groupJid: remoteJid, userJid, status: 'active' }),
        LearningSubmission.aggregate([
          { $match: { groupJid: remoteJid, userJid, status: 'active' } },
          { $project: { feedbackCount: { $size: { $ifNull: ['$feedback', []] } } } },
          { $group: { _id: null, total: { $sum: '$feedbackCount' } } },
        ]),
        LearningSubmission.countDocuments({ groupJid: remoteJid, 'feedback.reviewerJid': userJid }),
      ]);
      const feedbackReceived = Number(feedbackTotals?.[0]?.total || 0);
      return reply(`📊 *PARTISIPASI TANTANGANMU*\nKarya dikirim: *${submittedCount}*\nMasukan diterima: *${feedbackReceived}*\nKarya yang kamu review: *${feedbackGivenCount}*\n\nTerus berlatih dan bantu anggota lain berkembang. Statistik hanya menghitung aktivitas yang tercatat pada grup ini.`);
    } catch {
      return reply('⚠️ Statistik partisipasi belum dapat dimuat.');
    }
  }

  if (normalizedAction === 'kontributor' || normalizedAction === 'contributors') {
    if (!isGroup) return reply('Papan kontributor hanya tersedia di grup komunitas.');
    if (!ensureChallengeDatabase(ctx)) return reply('⚠️ Database tantangan belum tersedia.');
    try {
      const rows = await LearningSubmission.find({ groupJid: remoteJid, status: 'active' }).sort({ updatedAt: -1 }).limit(200);
      const counts = new Map();
      for (const row of rows) {
        const key = row.userJid;
        const current = counts.get(key) || { name: cleanCommunityText(row.userName || 'Anggota', 60), total: 0, feedback: 0 };
        current.total += 1;
        current.feedback += Array.isArray(row.feedback) ? row.feedback.length : 0;
        counts.set(key, current);
      }
      const leaders = [...counts.values()].sort((a, b) => b.total - a.total || b.feedback - a.feedback).slice(0, 5);
      if (!leaders.length) return reply('Belum ada kontributor. Mulai tantangan dan bagikan karya pertamamu!');
      return reply(`🌱 *KONTRIBUTOR KOMUNITAS*\n\n${leaders.map((item, index) => `${index + 1}. ${item.name} — ${item.total} karya · ${item.feedback} masukan diterima`).join('\n')}\n\nBerdasarkan maksimal 200 kiriman aktif terbaru. Peringkat berdasarkan partisipasi, bukan kualitas atau nilai komersial karya.`);
    } catch {
      return reply('⚠️ Papan kontributor belum dapat dimuat.');
    }
  }

  return reply(`Subperintah belum dikenali. Ketik ${PREFIX}designchallenge help untuk panduan lengkap.`);
}
