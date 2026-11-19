// Main navigation and feature discovery are text-only; COMMAND_CATALOG is the single source of truth.
import { COMMAND_CATALOG, COMMAND_CATEGORIES, COMMAND_WORKFLOWS } from '../command-catalog.js';
import { readBotTexts, renderBotText } from '../content-editor.js';
import { findSimilarCommands, searchCommandsByNeed } from '../command-suggestions.js';
import { startOnboarding, renderOnboardingQuickStart } from '../onboarding.js';
import { handleQuickAccessCommand } from '../quick-access.js';

export const GENERAL_HELP_COMMANDS = new Set(["help", "menu", "tutorial", "mulai", "bantuan", "tools", "akun", "panduan", "alur", "kebutuhan", "commands", "perintah", "daftarperintah", "cari", "cepat", "fitur", "features", "jelajah"]);



const PREFIX = (ctx) => ctx.PREFIX || '.';

const TEXT_KEY_BY_CATEGORY = {
  start: 'menuStart', colors: 'menuColors', images: 'menuImages', assets: 'menuAssets',
  account: 'menuAccount', premium: 'menuPremium', tools: 'menuTools', designer: 'menuDesigner', tutorial: 'menuTutorial',
  group: 'menuGroup', market: 'menuMarket', game: 'menuGame', owner: 'menuOwner', needs: 'menuNeeds',
};

async function categoryText(key, p) {
  const textKey = TEXT_KEY_BY_CATEGORY[key];
  if (!textKey) return '';
  const texts = await readBotTexts();
  return renderBotText(texts[textKey], { prefix: p });
}


const COMMAND_GUIDES = {
  support: { purpose: 'Pusat bantuan terpadu untuk panduan pemula, FAQ, tiket bantuan, dan pelaporan masalah.', usage: '.support | .support faq [kata kunci] | .support ticket | .support laporan', example: '.support faq bot tidak merespons' },
  fitur: { purpose: 'Menampilkan seluruh command terdaftar dalam daftar teks per kategori, mencari perintah berdasarkan kebutuhan, membuka kategori tertentu, dan melihat workflow.', usage: '.fitur | .fitur cari <kebutuhan> | .fitur kategori <nama kategori> | .fitur semua [halaman] | .fitur alur [ID workflow]', example: '.fitur cari download musik' },
  asisten: { purpose: 'PIR Assistant adalah pencarian intent berbasis katalog yang merekomendasikan perintah sesuai kebutuhan. Tidak menjalankan command secara otomatis dan bukan AI generatif.', usage: '.asisten <kebutuhan dalam bahasa sehari-hari>', example: '.asisten aku ingin membuat poster promosi' },
  music: { purpose: 'Mencari metadata lagu, album, dan artis, melihat chart Apple Indonesia, serta mengirim preview audio resmi Apple jika tersedia. Tidak mengunduh lagu penuh atau melewati DRM Apple Music.', usage: '.music top | .music cari <judul/artis> | .music album <judul> | .music artis <nama> | .music detail <track ID> | .music preview <tautan lagu Apple>', example: '.music preview https://music.apple.com/id/album/judul/123?i=456' },
  voice: { purpose: 'Voice Lab untuk mengolah voice note/audio dengan efek suara, equalizer, pitch, tempo, stereo, dan efek kreatif. Memerlukan FFmpeg.', usage: '.voice help | balas audio dengan .bass/.8d/.karaoke/.tempo 1.25 atau gunakan .voice <efek>', example: '.voice help' },
  cuaca: { purpose: 'Menampilkan kondisi cuaca saat ini, suhu terasa, kelembapan, curah hujan, angin, dan rentang suhu harian untuk sebuah kota melalui Open-Meteo.', usage: '.cuaca <nama kota>', example: '.cuaca Bandung' },
  gempa: { purpose: 'Menampilkan ringkasan gempa terbaru dari feed publik BMKG, termasuk magnitudo, kedalaman, wilayah, koordinat, dan potensi dampak jika tersedia.', usage: '.gempa', example: '.gempa' },
  allowlist: { purpose: 'Mengelola chat yang diizinkan memakai bot dan mencari entri grup/kontak. Khusus Owner bot.', usage: '.allowlist list | .allowlist search <kata> | .allowlist search group <kata> | .allowlist search contact <kata> | .allowlist group add <id> | .allowlist contact add <nomor>', example: '.allowlist search group komunitas' },
  antitoxic: { purpose: 'Filter kata per grup berdasarkan daftar yang disusun Admin. Filter nonaktif secara default dan hanya mencocokkan kata utuh; bot tidak melakukan klasifikasi toxic dengan AI.', usage: '.antitoxic [status|on|off|daftar|tambah <kata>|hapus <kata>|reset]', example: '.antitoxic tambah spamkata lalu .antitoxic on' },
  modstatus: { purpose: 'Ringkasan read-only status proteksi grup: anti-link, anti-spam, filter kata, welcome, goodbye, dan aturan grup.', usage: '.modstatus', example: '.modstatus' },
  modpreset: { purpose: 'Preset keamanan grup dengan tahap preview dan konfirmasi eksplisit. Preview tidak menyimpan perubahan; preset hanya mengubah field yang disebut.', usage: '.modpreset preview <proteksi-dasar|ramah|tenang> | .modpreset apply <nama> konfirmasi', example: '.modpreset preview proteksi-dasar' },
  studio: { purpose: 'Ringkasan read-only Designer Studio website: karya, layanan, koleksi, testimoni, ketersediaan, lead, project room, analytics, dan notifikasi.', usage: '.studio', example: '.studio' },
  service: { purpose: 'Alias lama. Katalog paket tidak lagi dikelola melalui bot; gunakan direktori portofolio dan kontak langsung desainer.', usage: '.service', example: '.design' },
  layanan: { purpose: 'Alias lama yang mengarahkan ke direktori portofolio desainer.', usage: '.layanan', example: '.design' },
  requestdesign: { purpose: 'Perintah lama yang dinonaktifkan. Bot hanya menampilkan portofolio dan kontak publik desainer; hubungi desainer secara langsung.', usage: '.design lalu .designer DSN-ID', example: '.designer DSN-A1B2C3D4' },
  portfolio: { purpose: 'Mengelola profil/kontak/karya yang tersinkron dengan website, analytics, inbox, dan pengaturan push Designer Studio secara privat.', usage: '.portfolio [daftar/add/karya/preview/edit/status/website/analytics/notifikasi]', example: '.portfolio notifikasi push status' },
  design: { purpose: 'Mencari direktori desainer berdasarkan karya, kategori, gaya, lokasi, atau kata kunci.', usage: '.design [kategori/gaya/lokasi/cari/unggulan]', example: '.design kategori Logo' },
  designer: { purpose: 'Melihat profil publik seorang desainer.', usage: '.designer DSN-ID', example: '.designer DSN-A1B2C3D4' },
  pinsearch: { purpose: 'Membuka tautan pencarian Pinterest berdasarkan kata kunci (tanpa API).', usage: '.pinsearch <kata kunci>', example: '.pinsearch Yae Miko' },
  pinterest: { purpose: 'Alias tautan pencarian Pinterest.', usage: '.pinterest <kata kunci>', example: '.pinterest Yae Miko' },
  bingsearch: { purpose: 'Mencari gambar melalui Bing Images saja; tidak dicampur dengan Pinterest.', usage: '.bingsearch <kata kunci> [jumlah 1-5]', example: '.bingsearch Yae Miko 3' },
  bingimages: { purpose: 'Alias pencarian gambar Bing.', usage: '.bingimages <kata kunci> [jumlah 1-5]', example: '.bingimages Furina' },
  info: { purpose: 'Melihat informasi gambar.', usage: 'Kirim gambar lalu ketik .info, atau balas gambar dengan .info.', example: 'Kirim foto di chat, lalu kirim .info.' },
  ratio: { purpose: 'Melihat rasio lebar dan tinggi gambar.', usage: 'Balas gambar dengan .ratio.', example: 'Balas sebuah gambar dengan .ratio.' },
  resize: { purpose: 'Mengubah ukuran gambar ke lebar dan tinggi yang kamu tentukan.', usage: '.resize <lebar> <tinggi> (balas gambar terlebih dahulu)', example: '.resize 1080 1080' },
  compress: { purpose: 'Mencoba mengurangi ukuran file gambar.', usage: 'Balas gambar dengan .compress.', example: 'Balas gambar besar dengan .compress.' },
  crop: { purpose: 'Memotong gambar dari tengah berdasarkan rasio yang dipilih.', usage: '.crop <1:1/4:5/16:9> (balas gambar terlebih dahulu)', example: 'Balas gambar dengan .crop 4:5.' },
  imgconvert: { purpose: 'Mengubah format gambar ke JPG, PNG, atau WebP dengan kontrol kualitas.', usage: '.imgconvert <jpg/png/webp> [kualitas 40-100] (balas gambar terlebih dahulu)', example: 'Balas gambar dengan .imgconvert webp 82.' },
  sticker: { purpose: 'Sticker Studio: membuat stiker statis transparan, crop bulat/persegi, atau stiker animasi dari media yang didukung; hasil statis dibatasi 1 MB.', usage: '.sticker [bulat|1:1|help] (kirim/balas media terlebih dahulu)', example: 'Balas gambar dengan .sticker bulat.' },
  brief: { purpose: 'Membantu menyusun kebutuhan desain sebelum mulai bekerja.', usage: '.brief <topik>', example: '.brief poster acara sekolah' },
  fontpair: { purpose: 'FontPair Studio: pasangan font, preview PNG/Google Fonts, pencarian, moodboard, favorit, dan AI Design Copilot multimodal (API key opsional; fallback kurasi lokal).', usage: '.fontpair [gaya|semua|preview|google|mood|recommend|search|ai|save|favorites|unsave]', example: '.fontpair ai brand skincare premium minimalis' },
  typescale: { purpose: 'Membuat skala ukuran tipografi modular untuk caption hingga display.', usage: '.typescale [base px] [ratio] [langkah]', example: '.typescale 16 1.25 5' },
  typography: { purpose: 'Typography Studio: hierarki font per jenis desain, panduan ukuran digital/cetak, dan pemeriksaan konsistensi tipografi.', usage: '.typography hierarchy <web|app|sosial|poster|cetak|kemasan>; size <digital|cetak>; check <digital|cetak> | <font, font> | <ukuran...> | [line-height]', example: '.typography check digital | Inter, Playfair Display | 12 14 16* 24 32 48 | 1.5' },
  qareview: { purpose: 'Design QA Review: memeriksa kontras, hierarki, tipografi, target sentuh, bleed, dan resolusi dari angka yang Anda isi, lalu mengurutkan prioritas perbaikan.', usage: '.qareview <poster/sosial/logo/cetak/kemasan/web/app> teks=#HEX latar=#HEX body=16 judul=32 font=2 ...', example: '.qareview web teks=#222222 latar=#FFFFFF body=16 judul=32 font=2 tap=44' },
  layout: { purpose: 'Mencari ide tata letak berdasarkan jenis desain.', usage: '.layout <jenis desain>', example: '.layout poster promosi' },
  explain: { purpose: 'Menjelaskan istilah atau teknik desain.', usage: '.explain <teknik>', example: '.explain hierarchy' },
  creative: { purpose: 'Menyusun tiga arah konsep, arahan produksi, prompt siap salin, dan QA.', usage: '.creative <topik> | <gaya opsional> | <platform/ukuran opsional>', example: '.creative kemasan kopi lokal | organik premium | pouch 250 gram' },
  designflow: { purpose: 'Menyusun arah produksi desain dari brief, konsep, layout, visual system, QA, hingga handoff. Simpan hasil sebagai proyek agar progress dapat dilacak.', usage: '.designflow <jenis> | <tema> | <audiens> | <platform>', example: '.designflow web | toko kopi modern | pelanggan 18+ | mobile-first' },
  designproject: { purpose: 'Designer Workspace pribadi. Kelola proyek, progress enam tahap produksi, panduan tahap aktif, penyelesaian dan pembukaan ulang tahap, riwayat, template, duplikasi, dan export brief.', usage: '.designproject start <nama> | <jenis> | <tema> | <audiens> | <platform>; step/progress/show <nama>; done <nama>; reopen <nama> | <brief|concept|layout|visual|qa|handoff>; board; edit/save/search/list/history/export/flow/template/status/delete', example: '.designproject start Kopi Senja | web | toko kopi modern | pelanggan | mobile-first' },
  designprompt: { purpose: 'Menyusun prompt teks desain siap salin berdasarkan jenis, tema, audiens, dan gaya.', usage: '.designprompt <jenis> | <tema> | <audiens> | <gaya>', example: '.designprompt poster | festival musik malam | remaja | futuristik neon' },
  designrender: { purpose: 'Membuat gambar konsep desain melalui model AI image generation; membutuhkan OPENAI_API_KEY dan akses model gambar.', usage: '.designrender <jenis> | <tema> | <audiens> | <gaya> | <detail opsional>', example: '.designrender poster | festival musik | anak muda | futuristik neon | ungu dan cyan' },
  designreview: { purpose: 'Rubrik review mandiri untuk poster, web, app, logo, sosial, atau marketplace.', usage: '.designreview <poster/web/app/logo/sosial/marketplace>', example: '.designreview web' },
  designscore: { purpose: 'Hitung skor rubric desain dari nilai 0–2 dan tampilkan prioritas perbaikan.', usage: '.designscore <jenis> | <nilai dipisah koma>', example: '.designscore web | 2,1,2,1,0,1' },
  colorpalette: { purpose: 'Menjelajahi koleksi palet kurasi ala Color Hunt dengan preview swatch PNG, pencarian, palet acak, dan generator harmoni HEX.', usage: '.colorpalette <nama/random/search kata> atau .colorpalette <HEX> [complementary/analogous/triadic/monochromatic]', example: '.colorpalette ocean' },
  paletteview: { purpose: 'Menerapkan palet warna ke mockup visual landing page, kartu produk, poster, atau dashboard dan mengirim preview PNG.', usage: '.paletteview <nama palet> [landing|product|poster|dashboard]', example: '.paletteview ocean landing' },
  palettekit: { purpose: 'Mengubah palet menjadi design tokens CSS, peran warna, dan pemeriksaan kontras WCAG.', usage: '.palettekit <nama palet>', example: '.palettekit ocean' },
  colorconvert: { purpose: 'Mengonversi warna HEX, RGB, dan HSL dua arah.', usage: '.colorconvert <HEX | RGB | HSL>', example: '.colorconvert #2D6CDF' },
  contrast: { purpose: 'Memeriksa apakah warna teks cukup kontras dengan warna latar.', usage: '.contrast <HEX teks> <HEX latar>', example: '.contrast #222222 #FFFFFF' },
  uxaudit: { purpose: 'Checklist UX/UI awal untuk web, app, bot, atau marketplace.', usage: '.uxaudit <web/app/bot/marketplace>', example: '.uxaudit bot' },
  designsystem: { purpose: 'Starter design system: palet, tipografi, radius, spacing, komponen, dan QA.', usage: '.designsystem <minimalis/futuristik/elegan/playful/alam>', example: '.designsystem futuristik' },
  uxflow: { purpose: 'Template user flow dan checklist UX untuk web, app, bot, marketplace, atau checkout.', usage: '.uxflow <web/app/bot/marketplace/checkout>', example: '.uxflow marketplace' },
  checklist: { purpose: 'Alias checklist Design QA untuk poster, sosial, logo, cetak, kemasan, web, dan app.', usage: '.checklist <poster/sosial/logo/cetak/kemasan/web/app>', example: '.checklist cetak' },
  designqa: { purpose: 'Checklist QA khusus untuk memeriksa kesiapan desain sebelum publikasi atau produksi.', usage: '.designqa <poster/sosial/logo/cetak/kemasan/web/app>', example: '.designqa kemasan' },
  handoff: { purpose: 'Membuat template spesifikasi serah-terima desain untuk klien atau developer.', usage: '.handoff <proyek> | <jenis> | <ukuran/platform> | <format> | <warna> | <font>', example: '.handoff Kopi Senja | logo | master vector | SVG, PDF, PNG | #20382C | Manrope' },
  revision: { purpose: 'Memberi format agar permintaan revisi dari klien lebih jelas.', usage: '.revision', example: 'Ketik .revision lalu salin template yang muncul.' },
  brandkit: { purpose: 'Menyusun brand kit awal: palet, tipografi, karakter suara, dan aturan visual.', usage: '.brandkit <nama> | <industri> | <audiens> | <kepribadian>', example: '.brandkit Kopi Senja | kopi lokal | pekerja kreatif | natural premium' },
  pricing: { purpose: 'Menghitung estimasi dasar harga berdasarkan jam kerja, tarif per jam, dan biaya tambahan; perlu langganan aktif.', usage: '.pricing <jam> <tarif per jam> [biaya tambahan]', example: '.pricing 5 50000 25000' },
  assets: { purpose: 'Mencari aset di perpustakaan bot.', usage: '.assets <kata kunci>', example: '.assets texture kertas' },
  akses: { purpose: 'Melihat peran akun dan status langganan.', usage: '.akses', example: '.akses' },
  menu: { purpose: 'Menampilkan beranda dan pintasan kategori.', usage: '.menu [kategori]', example: '.menu warna' },
  cari: { purpose: 'Menemukan fitur berdasarkan kebutuhan dengan kata sehari-hari, misalnya membuat poster, mengubah ukuran gambar, belajar desain, atau menemukan desainer.', usage: '.cari <kebutuhan atau kata kunci>', example: '.cari bikin poster acara' },
  mulai: { purpose: 'Panduan pemula interaktif untuk memilih kebutuhan dan tingkat pengalaman, lalu mendapatkan rekomendasi fitur yang sesuai.', usage: '.mulai | .mulai cepat | .mulai profil | .mulai ulang | .mulai batal', example: '.mulai' },
  alur: { purpose: 'Memberi urutan langkah sesuai tujuan desain, beserta alasan memakai setiap alat.', usage: '.alur <poster/logo/sosial/gambar/revisi/aset/belajar>', example: '.alur poster' },
  kebutuhan: { purpose: 'Alias untuk pusat bantuan berdasarkan kebutuhan desain.', usage: '.kebutuhan <poster/logo/sosial/gambar/revisi/aset/belajar>', example: '.kebutuhan logo' },
  wizard: { purpose: 'Memandu kamu menyusun brief desain dengan draft yang tersimpan hingga 24 jam agar dapat dilanjutkan setelah bot restart.', usage: '.wizard | .wizard lanjut | .wizard kembali | .wizard status | .wizard ulang | .wizard batal', example: '.wizard lanjut' },
  briefwizard: { purpose: 'Alias wizard penyusunan brief desain.', usage: '.briefwizard', example: '.briefwizard' },
  dl: { purpose: 'Mengunduh media dari tautan publik yang didukung bot.', usage: '.dl <tautan>', example: '.dl https://contoh-tautan-media' },
  cohort: { purpose: 'Learning Cohort grup 1–12 minggu dengan pendaftaran sukarela, fasilitator, milestone, check-in, review, progress pribadi, dan ringkasan agregat.', usage: '.cohort buat <judul> | <deskripsi> | <minggu> | .cohort join <kode> | .cohort milestone tambah <kode> | <judul> | <deskripsi> | <hari> | .cohort checkin <kode> M01 | <catatan> | <https-url>', example: '.cohort buat Dasar Branding | Belajar identitas visual secara bertahap. | 4' },
  designseason: { purpose: 'Kompetisi desain bertahap 2–8 ronde. Admin menyiapkan season dan brief setiap ronde; peserta mengirim karya, galeri dan peer review dibatasi grup asal.', usage: '.designseason buat <judul> | <brief tema> | <kategori> | .designseason ronde tambah <kode> <judul> | <brief> | <kategori> | <durasi jam> | .designseason mulai <kode>', example: '.designseason buat Creative Season | Eksplorasi identitas visual komunitas. | branding' },
  assetstudio: { purpose: 'Simpan tautan aset desain sebagai koleksi privat, cantumkan sumber/lisensi, lalu bagikan ke grup secara eksplisit. Tidak mengunggah ulang file atau memberikan lisensi baru.', usage: '.assetstudio simpan <judul> | <kategori> | <https-url> | <lisensi> | <atribusi> | .assetstudio saya | .assetstudio cari <kata>', example: '.assetstudio simpan Moodboard Kopi | branding | https://contoh.com/moodboard | referensi saja | Sumber: Studio X' },
  mediaformat: { purpose: 'Memeriksa metadata format publik tanpa mengunduh file dan memperkirakan ukuran media berdasarkan preset bitrate.', usage: '.mediaformat | .mediaformat cek <url-publik> | .mediaformat estimasi <preset> <durasi-detik>', example: '.mediaformat cek https://tautan-publik' },
  anime: { purpose: 'Mencari informasi anime melalui MyAnimeList/Jikan dengan AniList sebagai provider cadangan otomatis saat Jikan gagal. Menyediakan pencarian judul, daftar populer, anime musim ini, dan detail berdasarkan ID. Tidak menyediakan streaming atau unduhan.', usage: '.anime cari <judul> | .anime populer | .anime musim | .anime detail <ID>', example: '.anime cari Frieren' },
};

const HELP_ALIASES = {
  mulai: 'start', pemula: 'start', start: 'start', warna: 'colors', color: 'colors', colors: 'colors',
  gambar: 'images', image: 'images', foto: 'images', aset: 'assets', assets: 'assets',
  akun: 'account', akses: 'account', langganan: 'account', premium: 'premium', kebutuhan: 'needs', alur: 'needs', cari: 'needs',
  tools: 'tools', desain: 'tools', designer: 'designer', design: 'designer', desainer: 'designer', belajar: 'tutorial', tutorial: 'tutorial', grup: 'group', group: 'group',
  market: 'market', marketplace: 'market', game: 'game', pixelrealm: 'game', owner: 'owner',
};

async function renderMainMenu(p) {
  const texts = await readBotTexts();
  const base = renderBotText(texts.mainMenu, { prefix: p });
  return `${base}\n\n*JELAJAHI SELURUH FITUR*\n• ${p}fitur — daftar lengkap seluruh command berdasarkan kategori\n• ${p}fitur cari <kebutuhan> — cari fitur dengan bahasa biasa\n• ${p}fitur semua [halaman] — katalog ringkas berpaginasi\n• ${p}fitur alur — panduan workflow dari awal sampai selesai\n\nTidak menemukan fitur di menu utama? Cari melalui ${p}fitur.`;
}


const CATEGORY_ALIASES = {
  anime: 'Anime & Hiburan', hiburan: 'Anime & Hiburan',
  media: 'Downloader & Media', download: 'Downloader & Media', downloader: 'Downloader & Media', unduh: 'Downloader & Media',
  musik: 'Musik & Audio', music: 'Musik & Audio', audio: 'Musik & Audio',
  tools: 'Tools Desain', desain: 'Tools Desain', designer: 'Menu Designer', design: 'Menu Designer', desainer: 'Menu Designer', gambar: 'Tools Desain', warna: 'Tools Desain',
  belajar: 'Belajar Desain', tutorial: 'Belajar Desain', pemula: 'Belajar Desain',
  grup: 'Proteksi Grup', group: 'Proteksi Grup', moderasi: 'Proteksi Grup',
  market: 'Designer Portfolio Directory', marketplace: 'Designer Portfolio Directory',
  game: 'Pixel Realm', pixelrealm: 'Pixel Realm', owner: 'Owner',
  sistem: 'Utilitas & Sistem', utilitas: 'Utilitas & Sistem', info: 'Utilitas & Info', cuaca: 'Utilitas & Info', weather: 'Utilitas & Info', gempa: 'Utilitas & Info', bmkg: 'Utilitas & Info',
  all: null, semua: null,
};

const CATEGORY_COMMAND_KEY = {
  'Tools Desain': 'tools', 'Menu Designer': 'designer', 'Belajar Desain': 'belajar', 'Proteksi Grup': 'grup',
  'Designer Portfolio Directory': 'market', 'Pixel Realm': 'game', Owner: 'owner',
  'Utilitas & Sistem': 'sistem', 'Utilitas & Info': 'info',
  'Anime & Hiburan': 'anime', 'Musik & Audio': 'musik', 'Downloader & Media': 'media', 'Asisten PIR': 'asisten',
};

const COMMANDS_PER_PAGE = 10;

function normalizePrefixExample(example, p) {
  return String(example || '').replace(/(^|\s)\.(?=[a-zA-Z])/g, `$1${p}`);
}

function renderNeedSearch(rawQuery, p, limit = 8) {
  const query = String(rawQuery || '').replace(/[*_~`]/g, '').replace(/[\x00-\x1F\x7F]/g, ' ').trim().slice(0, 120);
  if (!query) {
    return `🔎 *TEMUKAN FITUR PIR VISUALS*\n\nTulis kebutuhanmu dengan bahasa sehari-hari. Tidak harus tahu nama perintah.\n\nContoh:\n• ${p}cari bikin poster acara\n• ${p}cari ubah ukuran gambar\n• ${p}cari belajar desain untuk pemula\n• ${p}cari menemukan desainer logo\n• ${p}cari membuat portofolio\n\nKamu juga bisa memakai ${p}commands cari <kata kunci>.`;
  }
  const matches = searchCommandsByNeed(query, COMMAND_CATALOG, limit);
  if (!matches.length) {
    return `🔎 *BELUM MENEMUKAN FITUR UNTUK: ${query}*\n\nCoba kata yang lebih sederhana, misalnya *poster*, *gambar*, *warna*, *belajar*, *desainer*, *portofolio*, atau *game*.\n\nBuka ${p}menu untuk kategori atau ${p}help <perintah> untuk petunjuk.`;
  }
  return `🔎 *HASIL PENCARIAN: ${query}*\n\n${matches.map((item, index) => `${index + 1}. *${p}${item.command}* — ${item.description}\n   Contoh: ${normalizePrefixExample(item.example, p)}\n   Detail: ${p}help ${item.command}`).join('\n\n')}\n\nPilih salah satu contoh di atas untuk mulai. Hasil pencarian hanya rekomendasi; perintah tidak dijalankan otomatis.\nCari lagi: ${p}cari <kebutuhan> • Katalog: ${p}commands`;
}

async function renderCommandList(args, p) {
  const texts = await readBotTexts();
  const raw = args.map(value => String(value)).join(' ').trim().toLowerCase();
  if (args.length && ['cari', 'search', 'find'].includes(String(args[0]).toLowerCase())) {
    const query = args.slice(1).join(' ').trim();
    return renderNeedSearch(query, p);
  }
  const categoryKeyForRaw = raw;
  const rawIsCategory = !['', 'all', 'semua'].includes(categoryKeyForRaw) &&
    (COMMAND_CATEGORIES.some(name => name.toLowerCase() === categoryKeyForRaw) || Object.hasOwn(CATEGORY_ALIASES, categoryKeyForRaw));
  const known = rawIsCategory ? null : COMMAND_CATALOG.find(item => item.command.toLowerCase() === raw.replace(/^\./, ''));
  if (known) {
    return `📖 *PERINTAH ${p}${known.command}*\n\n*Fungsi:* ${known.description}\n*Kategori:* ${known.category}\n*Contoh:* ${normalizePrefixExample(known.example, p)}\n*Akses:* ${known.permission}\n\nUntuk petunjuk lebih lengkap, ketik ${p}help ${known.command}.`;
  }

  let category = null;
  let page = 1;
  if (args.length) {
    const last = String(args[args.length - 1]);
    if (/^\d+$/.test(last)) page = Number(last);
    const categoryParts = /^\d+$/.test(last) ? args.slice(0, -1) : args;
    const categoryKey = categoryParts.join(' ').toLowerCase();
    if (categoryKey && !['all', 'semua'].includes(categoryKey)) {
      const exact = COMMAND_CATEGORIES.find(name => name.toLowerCase() === categoryKey);
      category = exact || CATEGORY_ALIASES[categoryKey];
      if (!category) {
        const singleCommand = COMMAND_CATALOG.find(item => item.command.toLowerCase() === categoryKey);
        if (singleCommand) return renderCommandList([singleCommand.command], p);
        return renderBotText(texts.commandListNoResults, { prefix: p });
      }
    }
  }
  if (!Number.isInteger(page) || page < 1) page = 1;
  const filtered = category ? COMMAND_CATALOG.filter(item => item.category === category) : COMMAND_CATALOG;
  if (!filtered.length) return renderBotText(texts.commandListNoResults, { prefix: p });
  const totalPages = Math.max(1, Math.ceil(filtered.length / COMMANDS_PER_PAGE));
  if (page > totalPages) page = totalPages;
  const start = (page - 1) * COMMANDS_PER_PAGE;
  const pageItems = filtered.slice(start, start + COMMANDS_PER_PAGE);
  const categoryLine = COMMAND_CATEGORIES.map(name => name).join(' • ');
  const intro = renderBotText(texts.commandListIntro, {
    prefix: p, total: String(COMMAND_CATALOG.length), categories: categoryLine,
  });
  const title = category ? `*Kategori: ${category}*` : '*Semua kategori*';
  const items = pageItems.map((item, index) => {
    const example = normalizePrefixExample(item.example, p);
    const description = item.description.length > 145 ? `${item.description.slice(0, 142).trimEnd()}…` : item.description;
    const access = /^(Anggota|Anggota;)/.test(item.permission) ? '' : `\n   Akses: ${item.permission}`;
    return `${start + index + 1}. *${p}${item.command}* — ${description}\n   Contoh: ${example}${access}`;
  }).join('\n\n');
  const categoryToken = category ? (CATEGORY_COMMAND_KEY[category] || category.toLowerCase()) : 'all';
  const previous = page > 1 ? `Sebelumnya: ${p}commands ${categoryToken} ${page - 1}` : '';
  const next = page < totalPages ? `Berikutnya: ${p}commands ${categoryToken} ${page + 1}` : 'Ini halaman terakhir.';
  const navigation = `Halaman ${page}/${totalPages} • ${pageItems.length} dari ${filtered.length} perintah.\n${[previous, next].filter(Boolean).join('\n')}\nCari: ${p}commands cari <kata kunci>\nDetail: ${p}help <perintah> • Semua fitur: ${p}fitur • Menu: ${p}menu`; 
  return `${intro}\n\n${title}\n\n${items}\n\n${navigation}`;
}

function renderCompleteFeatureCatalog(p) {
  const sections = COMMAND_CATEGORIES.map(category => {
    const items = COMMAND_CATALOG.filter(item => item.category === category);
    const lines = items.map(item => {
      const description = normalizePrefixExample(String(item.description || 'Lihat bantuan perintah untuk detail penggunaan.')
        .replace(/[\r\n]+/g, ' ')
        .replace(/\s{2,}/g, ' ')
        .trim(), p);
      const example = normalizePrefixExample(item.example, p);
      const exampleLine = example && example !== `${p}help ${item.command}`
        ? `\n│   Contoh: ${example}`
        : '';
      return `│ • *${p}${item.command}* — ${description}${exampleLine}`;
    });
    return `╭─「 *${category.toUpperCase()}* 」\n${lines.join('\n')}\n╰────────────────`;
  }).join('\n\n');

  return `📚 *DAFTAR LENGKAP FITUR PIR VISUALS*\n\n${COMMAND_CATALOG.length} command terdaftar dalam ${COMMAND_CATEGORIES.length} kategori. Daftar ini dibuat langsung dari command catalog bot agar fitur baru otomatis ikut tercantum.\n\n${sections}\n\n*PANDUAN*\n• ${p}help <perintah> — format, parameter, contoh, dan akses\n• ${p}fitur cari <kata kunci> — cari fitur tertentu\n• ${p}fitur kategori <nama> — tampilkan satu kategori\n• ${p}fitur semua [halaman] — katalog ringkas berpaginasi\n• ${p}fitur alur — panduan workflow`;
}

async function renderFeatureDirectory(args, p) {
  const action = String(args[0] || '').toLowerCase();
  if (!args.length || ['help', 'bantuan', 'menu'].includes(action)) {
    return renderCompleteFeatureCatalog(p);
  }

  if (['cari', 'search', 'find'].includes(action)) {
    return renderNeedSearch(args.slice(1).join(' '), p, 10);
  }
  if (['semua', 'all', 'commands', 'perintah'].includes(action)) {
    const page = args[1] ? String(args[1]) : '1';
    return renderCommandList(['all', page], p);
  }
  if (['kategori', 'category', 'cat'].includes(action)) {
    const categoryArgs = args.slice(1);
    if (!categoryArgs.length) return `Sertakan nama kategori. Ketik ${p}fitur untuk melihat seluruh kategori.`;
    return renderCommandList(categoryArgs, p);
  }
  if (['alur', 'workflow', 'workflows'].includes(action)) {
    const id = String(args[1] || '').toLowerCase();
    if (id) {
      const workflow = COMMAND_WORKFLOWS.find(item => item.id.toLowerCase() === id);
      if (!workflow) return `Workflow tidak ditemukan. Ketik ${p}fitur alur untuk melihat daftar.`;
      return `🧩 *${workflow.title.toUpperCase()}*\n\n${workflow.description}\n\nAudiens: ${workflow.audience}\n\n*LANGKAH*\n${workflow.steps.map((step, index) => `${index + 1}. ${step.replace(/^\./, p)}`).join('\n')}\n\nPerintah hanya ditampilkan sebagai panduan; jalankan satu per satu sesuai kebutuhan.`;
    }
    return `🧩 *WORKFLOW PIR VISUALS*\n\n${COMMAND_WORKFLOWS.map(item => `• *${item.title}*\n  ${item.description}\n  ${p}fitur alur ${item.id}`).join('\n\n')}\n\nWorkflow adalah urutan pemakaian fitur, bukan satu command otomatis.`;
  }

  const raw = args.join(' ').trim();
  if (/^\d+$/.test(raw)) return renderCommandList(['all', raw], p);
  const normalized = raw.toLowerCase().replace(/^\./, '');
  if (COMMAND_CATALOG.some(item => item.command.toLowerCase() === normalized)) return renderCommandList([normalized], p);
  if (COMMAND_CATEGORIES.some(category => category.toLowerCase() === normalized) || Object.hasOwn(CATEGORY_ALIASES, normalized)) {
    return renderCommandList(args, p);
  }
  return renderNeedSearch(raw, p, 10);
}

const NEED_WORKFLOWS = {
  poster: {
    title: 'Membuat poster',
    intro: 'Gunakan alur ini dari perencanaan sampai pemeriksaan akhir.',
    steps: [
      ['Susun kebutuhan', '.wizard', 'Menentukan tujuan, audiens, ukuran, gaya, dan teks penting. Jawab pertanyaan bot satu per satu.'],
      ['Cari arah konsep', '.creative poster acara sekolah', 'Mendapatkan beberapa ide konsep awal yang bisa kamu kembangkan.'],
      ['Atur komposisi', '.layout poster promosi', 'Mendapatkan saran susunan judul, gambar utama, informasi, dan ajakan bertindak.'],
      ['Pilih warna', '.colorpalette kontras', 'Memulai dari palet warna; sesuaikan lagi dengan identitas acara atau brand.'],
      ['Konversi warna', '.colorconvert #2D6CDF', 'Mengubah HEX, RGB, dan HSL tanpa layanan eksternal.'],
      ['Periksa hasil', '.designqa poster', 'Memastikan teks, hierarki, informasi, dan kesiapan publikasi sudah diperiksa.'],
      ['Siapkan serah-terima', '.handoff Proyek | logo | master vector | SVG, PDF, PNG', 'Menyusun spesifikasi file, warna, font, aset, dan catatan penggunaan.'],
    ],
  },
  logo: {
    title: 'Membuat logo',
    intro: 'Mulai dari karakter brand, bukan langsung memilih efek visual.',
    steps: [
      ['Tentukan arah brand', '.wizard', 'Merangkum nama, audiens, karakter, dan kebutuhan penggunaan logo.'],
      ['Cari konsep', '.creative logo kedai kopi', 'Mendapatkan ide konsep yang bisa dijadikan bahan eksplorasi.'],
      ['Tentukan tipografi', '.fontpair', 'Mengeksplorasi pasangan font sebagai referensi, bukan keputusan final otomatis.'],
      ['Periksa kesiapan', '.checklist logo', 'Mengecek keterbacaan, kesederhanaan, dan penggunaan pada berbagai ukuran.'],
    ],
  },
  sosial: {
    title: 'Membuat konten media sosial',
    intro: 'Cocok untuk post promosi, pengumuman, atau konten edukasi.',
    steps: [
      ['Susun brief', '.wizard', 'Menentukan platform, audiens, pesan, dan tujuan konten.'],
      ['Cari layout', '.layout konten Instagram', 'Mendapatkan saran tata letak sesuai isi konten.'],
      ['Atur warna', '.colorpalette pastel', 'Memilih palet awal yang selaras dengan pesan dan identitas brand.'],
      ['Cek keterbacaan', '.contrast #222222 #FFFFFF', 'Memeriksa kontras warna teks dan latar.'],
      ['Periksa akhir', '.checklist sosial', 'Mengecek pesan, ukuran, ejaan, dan konsistensi visual.'],
    ],
  },
  gambar: {
    title: 'Mengolah gambar',
    intro: 'Kirim gambar terlebih dahulu, atau balas gambar yang sudah ada di chat.',
    steps: [
      ['Kenali file', '.info', 'Menampilkan informasi gambar yang dikirim atau dibalas.'],
      ['Periksa proporsi', '.ratio', 'Melihat rasio lebar dan tinggi sebelum mengubah ukuran.'],
      ['Ubah ukuran', '.resize 1080 1080', 'Mencoba mengubah gambar ke ukuran piksel yang dibutuhkan. Balas gambar saat memakai perintah ini.'],
      ['Kurangi ukuran file', '.compress', 'Mencoba mengompres gambar untuk memudahkan pengiriman.'],
    ],
  },
  revisi: {
    title: 'Menangani revisi klien',
    intro: 'Tujuannya memperjelas masukan agar revisi tidak berputar-putar.',
    steps: [
      ['Rapikan permintaan', '.revision', 'Menghasilkan format brief revisi agar bagian yang diubah dan hasil yang diinginkan jelas.'],
      ['Pastikan tujuan', '.wizard', 'Menyusun ulang konteks desain jika brief awal belum jelas.'],
      ['Hitung estimasi', '.pricing 5 50000 25000', 'Kalkulasi dasar berdasarkan jam, tarif, dan biaya tambahan; fitur ini memerlukan langganan aktif.'],
    ],
  },
  aset: {
    title: 'Mencari aset desain',
    intro: 'Gunakan kata kunci spesifik, lalu perluas pencarian bila belum ada hasil.',
    steps: [
      ['Simpan aset privat', '.assetstudio simpan Moodboard | branding | https://contoh.com/moodboard | referensi saja | Sumber: Studio X', 'Simpan tautan dan catatan lisensi secara privat; tidak mengunggah ulang file.'],
      ['Lihat aset milikmu', '.assetstudio saya', 'Periksa koleksi privat dan aset yang pernah kamu bagikan ke grup.'],
      ['Cari aset grup', '.assetstudio cari branding', 'Cari tautan aset yang secara eksplisit dibagikan ke grup ini.'],
      ['Cari kata kunci lama', '.assets texture kertas', 'Mencari aset dalam perpustakaan bot lama jika database tersedia.'],
      ['Lihat kategori', '.kategoriassets', 'Mengetahui kategori aset yang bisa ditelusuri.'],
      ['Cari inspirasi acak', '.randomassets', 'Menemukan aset acak bila kamu belum punya kata kunci yang tepat.'],
      ['Minta aset baru', '.requestassets tekstur kertas daur ulang', 'Mengajukan permintaan jika aset yang dibutuhkan belum tersedia.'],
    ],
  },
  belajar: {
    title: 'Belajar teknik desain',
    intro: 'Mulai dari istilah yang ingin dipahami, lalu coba terapkan pada proyekmu.',
    steps: [
      ['Pelajari materi dasar', '.designlearn mulai pemula warna', 'Meminta materi bertahap sesuai tingkat kemampuan.'],
      ['Pelajari istilah', '.explain visual hierarchy', 'Meminta penjelasan teknik atau istilah desain.'],
      ['Eksplorasi tipografi', '.fontpair', 'Melihat ide pasangan font untuk judul dan teks isi.'],
      ['Pelajari layout', '.layout poster editorial', 'Mendapatkan saran komposisi untuk jenis desain tertentu.'],
      ['Buka bantuan perintah', '.help contrast', 'Mempelajari tujuan, format, dan contoh dari perintah tertentu.'],
    ],
  },
  cariJasa: {
    title: 'Menemukan portofolio desainer',
    intro: 'PIR Visuals membantu menemukan desainer melalui karya dan profil publik. Setelah menemukan yang cocok, hubungi kontak desainer secara langsung.',
    steps: [
      ['Cari desainer', '.design', 'Jelajahi direktori portofolio yang sudah dimoderasi.'],
      ['Saring hasil', '.design kategori Logo', 'Gunakan kategori, gaya, lokasi, atau kata kunci.'],
      ['Lihat portofolio dan kontak', '.designer DSN-ID', 'Periksa karya, spesialisasi, lokasi, dan kontak yang dicantumkan desainer.'],
      ['Hubungi desainer langsung', 'Kontak pada profil', 'Diskusikan kebutuhan, ruang lingkup, biaya, jadwal, dan ketentuan secara langsung di luar bot.'],
    ],
  },
  tawarkanJasa: {
    title: 'Menampilkan portofolio sebagai desainer',
    intro: 'Buat profil yang jelas, tampilkan karya yang berhak kamu publikasikan, dan cantumkan kanal kontak yang ingin dibagikan.',
    steps: [
      ['Daftarkan profil', '.portfolio daftar', 'Isi nama publik, bio, spesialisasi, lokasi, dan kontak publik opsional.'],
      ['Atur kanal kontak', '.portfolio edit whatsapp 6281234567890', 'Nomor hanya tampil jika kamu sengaja mencantumkannya. Kamu juga dapat menambahkan Instagram, Behance, Dribbble, atau website.'],
      ['Tambahkan karya', '.portfolio add', 'Upload karya melalui WhatsApp atau Designer Studio website (JPEG, PNG, WebP, SVG; maksimal 15 MB per file), lalu tunggu moderasi Owner.'],
      ['Periksa profil publik', '.portfolio preview', 'Pastikan deskripsi, karya, dan kontak sudah benar sebelum membagikan link.'],
      ['Pantau jangkauan', '.studio', 'Lihat tampilan profil, karya, dan klik kontak.'],
    ],
  },

  media: {
    title: 'Memeriksa media sebelum download',
    intro: 'Periksa metadata provider dan perkiraan ukuran sebelum meminta bot mengirim media. Pemeriksaan format tidak mengunduh file.',
    steps: [
      ['Baca format dan batas', '.mediaformat', 'Lihat container yang dikenali pipeline PIR dan batas ukuran pengiriman.'],
      ['Periksa metadata provider', '.mediaformat cek https://tautan-publik', 'yt-dlp membaca metadata menggunakan skip-download; akses provider tetap dapat membatasi hasil.'],
      ['Hitung perkiraan ukuran', '.mediaformat estimasi video-wa 120', 'Gunakan durasi dalam detik; hasil merupakan estimasi bitrate, bukan konversi atau ukuran pasti.'],
      ['Unduh jika diizinkan', '.dl https://tautan-publik', 'Gunakan hanya media publik yang kamu miliki atau diizinkan untuk diunduh.'],
      ['Pantau antrean', '.dl status', 'Periksa fase proses download milik akunmu.'],
    ],
  },
  komunitas: {
    title: 'Belajar dan berkolaborasi di komunitas desain',
    intro: 'Community Hub membantu anggota melihat kontribusi pribadi, menemukan mentor yang opt-in, membangun proyek bersama, dan mengikuti Design Battle dalam grup asal.',
    steps: [
      ['Baca aturan grup', '.rules', 'Pastikan aktivitas belajar, mentoring, dan kolaborasi sesuai aturan komunitas.'],
      ['Temukan mentor', '.designcommunity cari branding', 'Hasil hanya menampilkan anggota yang secara sukarela membuka profil mentor di grup ini.'],
      ['Atur profil komunitas', '.designcommunity mentor branding,uiux', 'Tampilkan keahlian atau kebutuhan belajar secara opt-in; gunakan .designcommunity off untuk keluar.'],
      ['Lihat ringkasan kontribusi', '.designcommunity ringkasan', 'Lihat progress belajar, karya, peer review, mentor opt-in, dan kolaborasi milikmu di grup ini tanpa menampilkan JID.'],
      ['Lihat perkembangan pribadi', '.designcommunity growth', 'Bandingkan aktivitas tercatat 30 hari terakhir dengan 30 hari sebelumnya; insight bersifat privat dan bukan penilaian kualitas.'],
      ['Temukan kelompok belajar', '.cohort list', 'Lihat program belajar yang dibuat Admin di grup ini dan bergabung secara sukarela.'],
      ['Ikuti milestone cohort', '.cohort join KODE', 'Bergabung ke program, baca milestone, lalu kirim check-in praktik.'],
      ['Lihat milestone', '.designcommunity badges', 'Pantau pencapaian berdasarkan materi selesai, karya, peer review, dan kolaborasi.'],
      ['Lihat Design Battle', '.designchallenge battle list', 'Temukan kompetisi desain yang dibuka Admin dan baca brief sebelum ikut.'],
      ['Kirim karya ke Battle', '.designchallenge battle submit KODE Judul | https://tautan | refleksi', 'Partisipasi sukarela; satu entri aktif per anggota dan grup asal.'],
      ['Lihat Design Seasons', '.designseason list', 'Ikuti kompetisi bertahap dengan ronde yang dibuka Admin satu per satu.'],
      ['Kirim karya ronde', '.designseason submit KODE Judul | https://tautan | refleksi', 'Satu kiriman aktif per anggota per ronde; peer review ditutup saat ronde berakhir.'],
      ['Cari proyek bersama', '.designcommunity collab list', 'Lihat proyek terbuka dan bergabung jika masih ada kapasitas.'],
      ['Buka proyek kolaborasi', '.designcommunity collab buat Judul | brief proyek desain yang jelas | poster,ilustrasi | 3', 'Buat proyek grup dengan peran, brief, dan kapasitas yang jelas.'],
    ],
  },
  game: {
    title: 'Bermain game komunitas',
    intro: 'Pilih permainan, pahami aturan, lalu pantau progresmu.',
    steps: [
      ['Lihat daftar permainan', '.games', 'Pilih game solo, RPG, investigasi, atau multiplayer.'],
      ['Lihat profil pemain', '.player', 'Periksa level, XP, koin, dan pencapaian.'],
      ['Lihat misi', '.mission', 'Temukan target dan hadiah yang tersedia.'],
    ],
  },
  musik: {
    title: 'Menjelajahi musik dan audio',
    intro: 'Temukan metadata lagu, album, dan artis melalui Apple iTunes; gunakan downloader terpisah hanya untuk audio yang memang boleh kamu unduh.',
    steps: [
      ['Lihat chart Indonesia', '.music top', 'Baca sepuluh lagu teratas dari Apple iTunes RSS chart dan buka tautan resminya.'],
      ['Cari lagu', '.music cari Nadin Amizah', 'Lihat artis, album, genre, tahun rilis, durasi, dan tautan Apple Music/iTunes.'],
      ['Cari album', '.music album Untuk Dunia, Cinta, dan Kotornya', 'Temukan informasi album dan jumlah track bila tersedia.'],
      ['Cari artis', '.music artis Tulus', 'Temukan profil artis dan tautan referensi.'],
      ['Baca detail lagu', '.music detail 1440857781', 'Gunakan track ID dari hasil pencarian untuk melihat metadata lebih lengkap.'],
      ['Cari audio untuk diunduh', '.song Hati-Hati di Jalan Tulus', 'Pencarian yt-dlp terpisah; unduh hanya konten yang kamu miliki atau diizinkan untuk diunduh.'],
    ],
  },
  voice: {
    title: 'Mengolah voice note dan audio',
    intro: 'Balas audio dengan efek suara yang diproses melalui FFmpeg.',
    steps: [
      ['Lihat efek', '.voice help', 'Membuka daftar efek dan batas pemrosesan.'],
      ['Bass', '.bass', 'Balas voice note/audio dengan command ini.'],
      ['Efek 8D', '.8d', 'Balas voice note/audio dengan command ini.'],
      ['Tempo', '.tempo 1.25', 'Balas audio untuk mengatur tempo 1,25×.'],
    ],
  },
  localinfo: {
    title: 'Memeriksa cuaca dan gempa',
    intro: 'Gunakan data cuaca publik dan ringkasan gempa terbaru dari BMKG.',
    steps: [
      ['Cuaca kota', '.cuaca Bandung', 'Ganti Bandung dengan nama kota yang ingin diperiksa.'],
      ['Cuaca kota lain', '.cuaca Jakarta', 'Melihat suhu, kelembapan, angin, dan curah hujan.'],
      ['Gempa terbaru', '.gempa', 'Membaca ringkasan gempa terbaru yang disediakan BMKG.'],
    ],
  },
  anime: {
    title: 'Menjelajahi anime',
    intro: 'Cari informasi judul, lihat daftar populer, atau temukan anime yang sedang tayang. Fitur ini menggunakan data MyAnimeList melalui Jikan API.',
    steps: [
      ['Cari judul', '.anime cari Frieren', 'Cari anime berdasarkan judul dan lihat sinopsis singkat serta tautan referensi.'],
      ['Lihat anime populer', '.anime populer', 'Jelajahi daftar populer berdasarkan data MyAnimeList.'],
      ['Lihat anime musim ini', '.anime musim', 'Temukan judul yang tercatat sedang tayang pada musim berjalan.'],
      ['Baca detail', '.anime detail 52991', 'Lihat sinopsis, genre, studio, status, dan skor dari ID MyAnimeList.'],
    ],
  },
};

const NEED_ALIASES = {
  poster: 'poster', flyer: 'poster', pamflet: 'poster',
  logo: 'logo', branding: 'logo', brand: 'logo',
  sosial: 'sosial', social: 'sosial', instagram: 'sosial', konten: 'sosial',
  gambar: 'gambar', edit: 'gambar', resize: 'gambar', foto: 'gambar',
  revisi: 'revisi', klien: 'revisi', client: 'revisi',
  aset: 'aset', asset: 'aset', assets: 'aset',
  belajar: 'belajar', teknik: 'belajar', tutorial: 'belajar', media: 'media', download: 'media', downloader: 'media', unduh: 'media',
  jasa: 'cariJasa', cari: 'cariJasa', desainer: 'cariJasa', marketplace: 'cariJasa',
  tawarkan: 'tawarkanJasa', portofolio: 'tawarkanJasa', portfolio: 'tawarkanJasa', layanan: 'tawarkanJasa',
  komunitas: 'komunitas', community: 'komunitas', grup: 'komunitas', group: 'komunitas', mentor: 'komunitas', mentoring: 'komunitas', kolaborasi: 'komunitas', collab: 'komunitas', collaboration: 'komunitas', proyek: 'komunitas', game: 'game', games: 'game', permainan: 'game',
  anime: 'anime', otaku: 'anime', hiburan: 'anime', musik: 'musik', music: 'musik', lagu: 'musik', audio: 'musik',
  suara: 'voice', voice: 'voice', efek: 'voice', cuaca: 'localinfo', weather: 'localinfo', gempa: 'localinfo', bmkg: 'localinfo', info: 'localinfo',
};

function renderNeedWorkflow(rawKey, p) {
  const key = NEED_ALIASES[String(rawKey || '').toLowerCase()];
  if (!key) {
    return `🧭 *PUSAT BANTUAN BERDASARKAN KEBUTUHAN*\n\nPilih salah satu alur berikut:\n• ${p}alur poster\n• ${p}alur logo\n• ${p}alur sosial\n• ${p}alur gambar\n• ${p}alur revisi\n• ${p}alur aset\n• ${p}alur belajar\n• ${p}alur media\n• ${p}alur desainer — menemukan portofolio dan kontak desainer\n• ${p}alur tawarkan — menampilkan portofolio sebagai desainer\n• ${p}alur komunitas — memakai fitur komunitas\n• ${p}alur game — bermain game\n• ${p}alur anime — mencari informasi anime\n• ${p}alur musik — mencari lagu, album, dan artis\n• ${p}alur voice — mengolah audio dan voice note\n• ${p}alur info — cuaca kota dan gempa terbaru\n\nKetik ${p}menu kebutuhan untuk melihat daftar ini lagi atau ${p}cari <kebutuhan> untuk menemukan fitur secara langsung.`;
  }
  const flow = NEED_WORKFLOWS[key];
  const steps = flow.steps.map(([label, command, reason], index) => `${index + 1}. *${label}*\n   Perintah: ${p}${command.slice(1)}\n   ${reason}`).join('\n\n');
  return `🧭 *ALUR: ${flow.title.toUpperCase()}*\n\n${flow.intro}\n\n${steps}\n\nTidak harus mengikuti semua langkah. Pilih yang sesuai kebutuhanmu. Ketik ${p}menu untuk kembali ke beranda; ${p}help <perintah> untuk petunjuk satu fitur.`;
}

export async function handleGeneralHelpCommands(ctx) {
  const { args = [], command, reply } = ctx;
  const p = PREFIX(ctx);
  const selected = String(args[0] || '').toLowerCase();

  if (command === 'fitur' || command === 'features' || command === 'jelajah') {
    const directory = await renderFeatureDirectory(args, p);
    return reply(directory);
  }

  if (command === 'commands' || command === 'perintah' || command === 'daftarperintah' || command === 'cmd' || command === 'c') return reply(await renderCommandList(args, p));

  if (command === 'cari') return reply(renderNeedSearch(args.join(' '), p));

  if (command === 'cepat') return handleQuickAccessCommand(ctx);

  if (command === 'alur' || command === 'kebutuhan') return reply(renderNeedWorkflow(selected, p));

  if (command === 'mulai') return startOnboarding(ctx, args);
  if (command === 'bantuan' || command === 'panduan') {
    if (selected) return reply(`Gunakan ${p}help ${selected} untuk melihat cara menggunakan perintah tersebut.\n\nUntuk panduan pemula, ketik ${p}mulai.`);
    return reply(renderOnboardingQuickStart(p));
  }
  if (command === 'tools') return reply(await categoryText('tools', p));
  if (command === 'akun') return reply(await categoryText('account', p));

  if (command === 'help' && selected) {
    const key = selected.replace(/^\./, '');
    const guide = COMMAND_GUIDES[key];
    if (guide) return reply(`📖 *CARA MENGGUNAKAN .${key}*\n\n*Untuk apa?*\n${guide.purpose}\n\n*Format:*\n${guide.usage.replaceAll('.' + key, p + key)}\n\n*Contoh:*\n${guide.example.replaceAll('.' + key, p + key)}\n\nKembali ke menu: ${p}menu`);
    const catalogItem = COMMAND_CATALOG.find(item => item.command === key);
    if (catalogItem) return reply(`📖 *BANTUAN PERINTAH ${p}${key}*\n\nFungsi: ${catalogItem.description}\nContoh: ${normalizePrefixExample(catalogItem.example, p)}\nKategori: ${catalogItem.category}\nAkses: ${catalogItem.permission || 'Lihat aturan akses pada subperintah.'}\n\nKetik ${p}commands ${key} untuk detail katalog atau ${p}menu untuk kembali ke beranda.`);
    const suggestions = findSimilarCommands(key);
    const suggestionText = suggestions.length
      ? `Mungkin yang kamu maksud:\n${suggestions.map(item => `• ${p}help ${item}`).join('\n')}\n\n`
      : '';
    return reply(`Aku belum menemukan panduan untuk “${key}”.\n\n${suggestionText}Coba ${p}fitur untuk melihat seluruh fitur, ${p}menu untuk beranda, atau ${p}mulai untuk panduan pemula.`);
  }

  if (command === 'tutorial') {
    const tutorialRoutes = {
      desain: { key: 'tutorialDesign' }, design: { key: 'tutorialDesign' },
      belajar: { key: 'tutorialLearning' }, learning: { key: 'tutorialLearning' }, pemula: { key: 'tutorialLearning' },
      tantangan: { key: 'tutorialChallenge' }, challenge: { key: 'tutorialChallenge' },
      komunitas: { key: 'tutorialCommunity' }, community: { key: 'tutorialCommunity' }, mentor: { key: 'tutorialCommunity' }, kolaborasi: { key: 'tutorialCommunity' },
      market: { key: 'tutorialMarketplace' }, marketplace: { key: 'tutorialMarketplace' },
      portfolio: { key: 'tutorialPortfolio', image: 'portfolio.png', caption: 'Panduan bergambar membuat dan mengelola portofolio.' },
      order: { key: 'tutorialOrder', image: 'portfolio.png', caption: 'Panduan menghubungi desainer secara langsung melalui profil publik.' },
      pesanan: { key: 'tutorialOrder', image: 'portfolio.png', caption: 'Panduan menghubungi desainer secara langsung melalui profil publik.' },
      bukti: { key: 'tutorialProof', image: 'portfolio.png', caption: 'Panduan komunikasi langsung dan keamanan saat memilih desainer.' },
      hasil: { key: 'tutorialProof', image: 'portfolio.png', caption: 'Panduan komunikasi langsung dan keamanan saat memilih desainer.' },
      game: { key: 'tutorialGame' }, pixelrealm: { key: 'tutorialGame' },
    };
    if (['perintah', 'commands', 'command'].includes(selected)) return reply(await renderCommandList([], p));
    const route = tutorialRoutes[selected];
    if (!route) return reply(`📚 *TUTORIAL PIR VISUALS BOT*\n\n${p}tutorial desain — dasar desain\n${p}tutorial belajar — learning path dan progress pribadi\n${p}tutorial tantangan — tantangan, galeri, dan peer review grup\n${p}tutorial komunitas — profil, mentor, achievement, dan kolaborasi\n${p}tutorial market — direktori portofolio dan kontak desainer\n${p}tutorial portfolio — profil dan karya desainer\n${p}tutorial order — menemukan profil dan menghubungi desainer\n${p}tutorial bukti — panduan komunikasi dan pemeriksaan portofolio\n${p}tutorial game — Pixel Realm\n${p}tutorial perintah — katalog perintah yang tersedia\n\nPanduan pemula: ${p}mulai\nPusat bantuan dan tiket: ${p}support\nDaftar perintah aktual: ${p}commands atau ${p}fitur.`);
    try {
      const texts = await readBotTexts();
      const body = renderBotText(texts[route.key], { prefix: p });
      await reply(body);
      if (route.image) {
        try {
          const imagePath = ctx.path.resolve(process.cwd(), 'assets', 'images', 'tutorials', route.image);
          const imageBuffer = await ctx.fs.promises.readFile(imagePath);
          await ctx.sock.sendMessage(ctx.remoteJid, { image: imageBuffer, caption: `📚 ${route.caption}` }, { quoted: ctx.msg });
        } catch (error) {
          console.error('[TUTORIAL IMAGE]', error.message);
          await reply(`Gambar tutorial tidak tersedia. Teks panduan tetap bisa digunakan; periksa aset assets/images/tutorials/${route.image}.`);
        }
      }
      return true;
    } catch { return reply('Tutorial belum dapat dibaca. Periksa file content/texts.json.'); }
  }

  if (command === 'menu' && ['belajar', 'learning', 'cohort'].includes(selected)) {
    return reply(`🎓 *BELAJAR DESAIN & LEARNING COHORT*\n\n• ${p}designlearn jalur — kurikulum 12 materi\n• ${p}designlearn mulai pemula dasar — mulai materi\n• ${p}designlearn progress — progress pribadi\n• ${p}cohort list — program belajar di grup ini\n• ${p}cohort join KODE — gabung secara sukarela\n• ${p}cohort progress KODE — progress pribadimu\n• ${p}designcommunity growth — insight perkembangan privat\n\nAdmin/fasilitator: ${p}cohort help untuk membuat program, milestone, dan review.\nBantuan: ${p}help cohort • ${p}help designlearn`);
  }

  if (command === 'menu' && ['media', 'download', 'downloader', 'unduh'].includes(selected)) {
    return reply(`📥 *DOWNLOADER & MEDIA*\n\n• ${p}mediaformat — daftar format dan batas ukuran\n• ${p}mediaformat cek <url> — inspeksi metadata tanpa download\n• ${p}mediaformat estimasi video-wa 120 — estimasi ukuran\n• ${p}dl <url> — unduh media publik yang didukung\n• ${p}dl status — status antrean\n• ${p}dl cancel — batalkan proses milikmu\n• ${p}dl health — cek yt-dlp, FFmpeg, dan FFprobe\n\nInspeksi format tidak mengunduh file. Gunakan downloader hanya untuk media yang kamu miliki atau diizinkan untuk diunduh.\nBantuan: ${p}help mediaformat • ${p}help dl`);
  }

  if (command === 'menu' && ['musik', 'music', 'audio'].includes(selected)) {
    return reply(`🎧 *MUSIK & AUDIO*\n\n• ${p}music cari <judul/artis> — metadata lagu dan tautan resmi\n• ${p}music album <judul> — pencarian album\n• ${p}music artis <nama> — pencarian artis\n• ${p}music detail <track ID> — detail lagu\n• ${p}music preview <tautan lagu Apple> — kirim preview resmi jika tersedia\n• ${p}dl apple <tautan lagu> — pintasan unduh preview Apple\n• ${p}song <judul> — cari pilihan audio melalui yt-dlp\n• ${p}song pilih <nomor> — unduh pilihan yang diizinkan\n• ${p}dl audio <tautan> — unduh audio dari tautan publik yang diizinkan\n• ${p}voice help — daftar efek Voice Lab\n• ${p}bass / ${p}8d / ${p}karaoke / ${p}tempo 1.25 — olah audio yang dibalas\n\nApple Music hanya menyediakan preview publik yang tersedia dari Apple, bukan lagu penuh/DRM.\nBantuan: ${p}help music • ${p}help song • ${p}help dl`);
  }

  if (command === 'menu' && ['info', 'utilitas', 'cuaca', 'weather', 'gempa', 'bmkg'].includes(selected)) {
    return reply(`🌦️ *UTILITAS & INFO LOKAL*\n\n• ${p}cuaca <kota> — kondisi cuaca dan rentang suhu harian\n• ${p}gempa — ringkasan gempa terbaru BMKG\n\nSumber: Open-Meteo dan BMKG. Informasi darurat tetap ikuti kanal resmi BMKG/BPBD.\nBantuan: ${p}help cuaca • ${p}help gempa`);
  }

  if (command === 'menu' && ['anime', 'hiburan'].includes(selected)) {
    return reply(`🎬 *ANIME & HIBURAN*\n\n• ${p}anime cari <judul> — cari anime dan sinopsis\n• ${p}anime populer — daftar anime populer\n• ${p}anime musim — anime yang tayang musim ini\n• ${p}anime detail <ID> — informasi lengkap anime\n• ${p}music cari <judul/artis> — metadata lagu dan tautan resmi\n• ${p}song <judul> — pencarian audio yang sudah tersedia di bot\n• ${p}dl <tautan> — unduh media publik yang didukung\n\nCatatan: anime menggunakan Jikan dengan AniList sebagai cadangan otomatis, dan hanya menampilkan informasi/tautan referensi, bukan streaming/unduhan. Gunakan downloader hanya untuk media yang kamu miliki atau diizinkan untuk diunduh.\n\nBantuan: ${p}help anime • ${p}help song • ${p}help dl`);
  }

  const categoryAliases = { ...HELP_ALIASES, desain: 'tools', tutorial: 'tutorial', belajar: 'tutorial', grup: 'group', proteksi: 'group' };
  if (command === 'menu' && categoryAliases[selected]) {
    const category = categoryAliases[selected];
    const fallback = await categoryText(category, p);
    return reply(fallback);
  }
  if (command === 'menu' && selected) return reply(`Kategori “${selected}” belum dikenal.\n\n${await renderMainMenu(p)}\n\nLihat kategori: ${p}commands\nCari fitur: ${p}commands cari <kata kunci>.`);
  return reply(await renderMainMenu(p));
}
