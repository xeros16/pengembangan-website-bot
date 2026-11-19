import { IMAGE_INFO_COMMANDS } from './commands/image-info.js';
import { IMAGE_PROCESSING_COMMANDS } from './commands/image-processing.js';
import { DESIGN_BRIEF_COMMANDS } from './commands/design-brief.js';
import { DESIGN_TOOLS_COMMANDS } from './commands/design-tools.js';
import { ASSETS_DISCOVERY_COMMANDS } from './commands/assets-discovery.js';
import { ASSETS_MANAGEMENT_COMMANDS } from './commands/assets-management.js';
import { SUPPORT_CENTER_COMMANDS } from './commands/support-center.js';
import { SUPPORT_ADMIN_COMMANDS } from './commands/support-admin.js';
import { MODERATION_SETTINGS_COMMANDS } from './commands/moderation-settings.js';
import { MODERATION_ACTIONS_COMMANDS } from './commands/moderation-actions.js';
import { GENERAL_OWNER_COMMANDS } from './commands/general-owner.js';
import { GROUP_IDENTIFIER_COMMANDS } from './commands/group-identifiers.js';
import { MEDIA_DOWNLOAD_COMMANDS } from './commands/media-download.js';
import { ANIME_DISCOVERY_COMMANDS } from './commands/anime-discovery.js';
import { MUSIC_DISCOVERY_COMMANDS } from './commands/music-discovery.js';
import { VOICE_EFFECT_COMMANDS, getVoiceEffectProfile } from './commands/voice-effects.js';
import { LOCAL_INFO_COMMANDS } from './commands/local-info.js';
import { PINTEREST_SEARCH_COMMANDS, BING_IMAGE_SEARCH_COMMANDS } from './commands/pinterest-search.js';
import { DESIGNER_ASSISTANT_COMMANDS } from './commands/designer-assistant.js';
import { DESIGN_PRODUCTION_COMMANDS } from './commands/design-production-tools.js';
import { DESIGN_LEARNING_COMMANDS } from './commands/design-learning.js';
import { DESIGN_COMMUNITY_COMMANDS } from './commands/design-community.js';
import { DESIGN_COHORT_COMMANDS } from './commands/design-cohort.js';
import { DESIGN_SEASON_COMMANDS } from './commands/design-seasons.js';
import { ASSET_STUDIO_COMMANDS } from './commands/asset-studio.js';
import { DESIGN_CRITIQUE_COMMANDS } from './commands/design-critique.js';
import { GAME_COMMAND_METADATA } from '../games/command-metadata.js';

const group = (category, commands, permission = 'Anggota; beberapa subperintah memerlukan izin tambahan') =>
  [...commands].map(command => ({ command, category, permission }));

const entries = [
  ...group('Tools Desain', DESIGNER_ASSISTANT_COMMANDS, 'Anggota; .brandkit dan .pricing khusus pelanggan aktif, .sub khusus Owner'),
  ...group('Tools Desain', DESIGN_PRODUCTION_COMMANDS, 'Anggota'),
  ...group('Inspirasi & Belajar Desain', DESIGN_LEARNING_COMMANDS, 'Anggota'),
  ...group('Komunitas Desain', DESIGN_COMMUNITY_COMMANDS, 'Anggota; fitur profil, mentor, dan kolaborasi memerlukan MongoDB serta konteks grup'),
  ...group('Belajar Desain', DESIGN_COHORT_COMMANDS, 'Anggota; wajib di grup dan MongoDB; cohort dibuat Admin/Owner, progress dibatasi peserta/fasilitator grup asal'),
  ...group('Komunitas Desain', DESIGN_SEASON_COMMANDS, 'Anggota; season dibuat pembuat/Admin/Owner, ronde dan galeri dibatasi grup asal'),
  ...group('Creative Asset Studio', ASSET_STUDIO_COMMANDS, 'Anggota; koleksi privat secara default, berbagi dan moderasi mengikuti izin pemilik/Admin grup'),
  ...group('Tools Desain', DESIGN_CRITIQUE_COMMANDS, 'Anggota; .critique dan .rate untuk peer-review grup'),
  ...group('Tools Desain', IMAGE_INFO_COMMANDS, 'Anggota'),
  ...group('Tools Desain', IMAGE_PROCESSING_COMMANDS, 'Anggota; membutuhkan gambar atau argumen sesuai perintah'),
  ...group('Downloader & Media', new Set([...MEDIA_DOWNLOAD_COMMANDS].filter(command => !['song', 'play', 'lagu'].includes(command))), 'Anggota; memerlukan yt-dlp terpasang dan tautan publik yang didukung'),
  ...group('Musik & Audio', new Set([...MUSIC_DISCOVERY_COMMANDS, 'song', 'play', 'lagu']), 'Anggota; pencarian metadata memakai Apple iTunes API; download audio memerlukan yt-dlp dan sumber yang diizinkan'),
  ...group('Musik & Audio', VOICE_EFFECT_COMMANDS, 'Anggota; balas voice note/audio/dokumen audio; FFmpeg wajib; input maks. 12 MB dan 10 menit, output MP3 maks. 15 MB'),
  ...group('Utilitas & Info', LOCAL_INFO_COMMANDS, 'Anggota; memerlukan koneksi internet; cuaca memakai Open-Meteo dan info gempa memakai BMKG'),
  ...group('Anime & Hiburan', ANIME_DISCOVERY_COMMANDS, 'Anggota; informasi dari Jikan API, memerlukan koneksi internet'),
  ...group('Asisten PIR', new Set(['asisten']), 'Anggota; pencarian intent berbasis katalog, tidak menjalankan perintah otomatis'),
  ...group('Tools Desain', PINTEREST_SEARCH_COMMANDS, 'Anggota; mengambil gambar pin publik tanpa API jika Pinterest mengizinkan akses'),
  ...group('Tools Desain', BING_IMAGE_SEARCH_COMMANDS, 'Anggota; pencarian gambar Bing terpisah dari Pinterest'),
  ...group('Belajar Desain', DESIGN_BRIEF_COMMANDS, 'Anggota'),
  ...group('Belajar Desain', DESIGN_TOOLS_COMMANDS, 'Anggota'),
  ...group('Tools Desain', ASSETS_DISCOVERY_COMMANDS, 'Anggota; database diperlukan untuk pencarian aset'),
  ...group('Tools Desain', ASSETS_MANAGEMENT_COMMANDS, 'Anggota; addasset khusus admin grup'),
  ...group('Proteksi Grup', new Set(['report', 'reports']), 'Anggota untuk melaporkan; laporan grup hanya dapat dilihat/ditutup Admin grup asal atau Owner'),
  ...group('Bantuan & Dukungan', new Set(['ticket']), 'Anggota; balas dibatasi Admin grup asal atau Owner; tutup oleh pemilik/Admin grup asal/Owner'),
  ...group('Bantuan & Dukungan', SUPPORT_CENTER_COMMANDS, 'Anggota; FAQ publik, tiket mengikuti hak pemilik/Admin grup/Owner'),
  ...group('Utilitas & Sistem', SUPPORT_ADMIN_COMMANDS, 'Bergantung perintah; backup khusus Owner bot'),
  ...group('Proteksi Grup', MODERATION_SETTINGS_COMMANDS, 'Admin grup untuk perubahan; rules dapat dibaca anggota'),
  ...group('Proteksi Grup', MODERATION_ACTIONS_COMMANDS, 'Bergantung subperintah; beberapa khusus admin grup'),
  ...group('Belajar Desain', new Set(['help', 'menu', 'tutorial', 'mulai', 'bantuan', 'tools', 'akun', 'panduan', 'alur', 'kebutuhan', 'commands', 'perintah', 'daftarperintah', 'cari', 'cepat', 'fitur', 'features', 'jelajah', 'cmd', 'c', 'h', 'm', 'ak']), 'Anggota'),
  ...group('Owner', GENERAL_OWNER_COMMANDS, 'Khusus Owner bot'),
  ...group('Proteksi Grup', GROUP_IDENTIFIER_COMMANDS, 'Anggota; daftar anggota dapat dibatasi admin/Owner'),
  { command: 'games', category: 'Game Komunitas', permission: 'Anggota', description: 'Pusat semua permainan: Pixel Realm, tebak-tebakan, angka, acak kata, misteri, dan multiplayer' },
  { command: 'multi', category: 'Game Multiplayer', permission: 'Anggota; game grup dan duel 1 lawan 1', description: 'Buat ruang Sambung Kata/Kuis Rebutan per kategori, gabung, papan skor, keluar ruang, dan duel Suit' },
  { command: 'player', category: 'Progres Pemain', permission: 'Anggota; membutuhkan MongoDB', description: 'Lihat profil, level, XP, koin, inventaris, pencapaian, peringkat XP, dan peringkat koin' },
  ...group('Ekonomi Pemain', new Set(['shop', 'buy', 'inventory', 'inv', 'wallet', 'saldo', 'daily']), 'Anggota; membutuhkan MongoDB'),
  { command: 'pr', category: 'RPG Pixel Realm', permission: 'Anggota', description: 'Pintasan singkat Pixel Realm; .pr mulai, .pr status, .pr fox' },
  { command: 'game', category: 'Game Komunitas', permission: 'Anggota', description: 'Pusat perintah game' },
  ...group('Designer Portfolio Directory', new Set(['cancel']), 'Anggota; membatalkan wizard portofolio aktif milik pengguna'),
  ...group('Designer Portfolio Directory', new Set(['portfolio', 'design', 'designer', 'studio', 'lapordesain', 'marketreport', 'marketadmin']), 'Bergantung subperintah; moderasi direktori khusus Owner'),
  ...GAME_COMMAND_METADATA.map(game => ({ command: game.command, category: ({ pixelrealm: 'RPG Pixel Realm', tebak: 'Game Tebak-Tebakan', angka: 'Game Tebak-Tebakan', acak: 'Game Kata', misteri: 'Game Misteri', multi: 'Game Multiplayer', player: 'Progres Pemain', mission: 'Misi & Hadiah' })[game.command] || 'Game Komunitas', permission: 'Anggota', description: game.description })),
];

const descriptions = {
  cuaca: 'Tampilkan kondisi cuaca saat ini, suhu terasa, kelembapan, curah hujan, angin, dan rentang suhu harian berdasarkan nama kota',
  weather: 'Alias perintah cuaca berdasarkan nama kota',
  gempa: 'Tampilkan informasi gempa terbaru dari BMKG beserta magnitudo, kedalaman, lokasi, koordinat, dan potensi dampak',
  fitur: 'Tampilkan seluruh command terdaftar dalam daftar teks yang dikelompokkan berdasarkan kategori; mendukung pencarian, filter kategori, katalog ringkas, dan workflow',
  features: 'Alias pusat penemuan semua fitur PIR Visuals',
  jelajah: 'Alias pusat penemuan semua fitur PIR Visuals',
  moodboard: 'Susun arah visual moodboard: suasana, palet warna awal, tipografi, imagery, komposisi, dan keyword referensi', briefbuilder: 'Wizard brief desain tujuh langkah untuk tujuan, audiens, platform, gaya, warna, dan batasan', designcritique: 'Rubrik evaluasi hierarki, komposisi, keterbacaan, warna, tipografi, kesesuaian brief, dan kesiapan produksi; analisis gambar AI opsional',
  designinspire: 'Cari inspirasi desain berdasarkan kategori dan tema; menghasilkan keyword referensi, arahan eksplorasi, latihan, dan tautan pencarian visual', designlearn: 'Learning Path 12 modul untuk pemula, menengah, dan lanjutan; simpan materi aktif, tandai selesai, lanjutkan pelajaran, dan pantau progress pribadi',
  designchallenge: 'Tantangan desain harian/mingguan dan Design Battle berbatas waktu per grup, satu kiriman aktif per peserta, galeri, peer review, ringkasan hasil, serta moderasi oleh Admin grup/Owner',
  designcommunity: 'Community Hub: profil opt-in per grup, ringkasan kontribusi pribadi, Designer Growth Insights 30 hari, badge/milestone, pencarian mentor, dan papan proyek kolaborasi',
  cohort: 'Learning Cohort: kelompok belajar 1–12 minggu, pendaftaran sukarela, fasilitator, milestone, check-in karya, review, dan progress privat/agregat per grup',
  designseason: 'Design Seasons: kompetisi desain 2–8 ronde per grup, satu ronde aktif pada satu waktu, pengumpulan karya, galeri, peer review, hasil akhir, dan moderasi Admin',
  assetstudio: 'Creative Asset Studio: koleksi tautan aset desain privat secara default, berbagi ke grup, pencarian, atribusi/lisensi, dan moderasi Admin',
  mediaformat: 'Media Format Explorer: inspeksi metadata format provider tanpa mengunduh file, daftar format pipeline, dan estimasi ukuran preset media',
  portfolioguide: 'Panduan portfolio, checklist publikasi, builder case study, dan bio desainer',
  fontstudio: 'Typography Pairing Studio 2.0: pairing font berdasarkan mood dan jenis desain, lengkap dengan contoh hierarki', layoutstudio: 'Layout & Composition Studio: grid, hierarki, dan komposisi poster, feed, banner, website', socialkit: 'Social Media Design Toolkit: ukuran kanvas, safe area, dan checklist carousel', resourcefind: 'Design Resource Finder: direktori sumber font, ikon, mockup, tekstur, dan aset beserta catatan lisensi',
  angka: 'Game tebak angka rahasia 1–50 dengan tujuh kesempatan dan sistem poin.', acak: 'Game menyusun huruf acak menjadi kata dari berbagai kategori.',
  allowlist: 'Kelola daftar chat yang diizinkan dan cari grup/kontak berdasarkan nama atau kata kunci; khusus Owner bot',
  antitoxic: 'Filter kata grup berbasis daftar kata yang disusun Admin; nonaktif secara default, pencocokan kata utuh, dan tidak menggunakan penilaian AI',
  pinsearch: 'Buka tautan pencarian Pinterest berdasarkan kata kunci', pinterest: 'Alias tautan pencarian Pinterest', bingsearch: 'Cari dan kirim gambar dari Bing Images saja', bingimages: 'Alias pencarian gambar Bing',
  anime: 'Cari judul anime, daftar populer, anime musim ini, dan detail melalui MyAnimeList/Jikan dengan AniList sebagai provider cadangan otomatis. Tidak menyediakan streaming atau unduhan.',
  music: 'Cari metadata lagu, album, artis, dan Top 10 chart Apple Indonesia; dapat mengirim preview audio publik resmi dari tautan lagu Apple jika tersedia. Tidak mengunduh lagu penuh atau melewati DRM.',
  modstatus: 'Lihat status read-only anti-link, anti-spam, filter kata, welcome, goodbye, dan aturan grup saat ini.',
  modpreset: 'Pratinjau preset proteksi grup lalu terapkan hanya dengan konfirmasi eksplisit Admin grup atau Owner; field yang tidak disebut tidak diubah.',
  asisten: 'PIR Assistant: pahami kebutuhan dalam bahasa sehari-hari lalu rekomendasikan perintah dan workflow dari katalog aktif. Saran tidak dieksekusi otomatis.',
  info: 'Tampilkan informasi gambar yang dikirim atau dibalas', imageinfo: 'Alias informasi gambar',
  ratio: 'Hitung rasio gambar', resize: 'Ubah ukuran gambar', crop: 'Potong gambar berdasarkan rasio', imgconvert: 'Konversi gambar ke JPG, PNG, atau WebP', compress: 'Kompres gambar', sticker: 'Buat stiker dari media yang didukung', 'sticker1:1': 'Buat stiker dengan rasio persegi dari media yang didukung', hd: 'Tingkatkan resolusi gambar jika dependensi dan format mendukung', palette: 'Fitur palet gambar untuk perintah pengolahan gambar', download: 'Unduh media dari tautan publik yang didukung; tautan Apple Music diarahkan ke preview resmi jika tersedia', dl: 'Unduh media publik yang didukung atau kirim preview resmi Apple Music dari tautan satu lagu; tidak melewati DRM', song: 'Cari lagu dan pilih hasil untuk diproses sebagai audio jika didukung', play: 'Alias pemutaran/pencarian lagu', lagu: 'Alias pencarian lagu',
  brief: 'Buat atau tampilkan template brief desain', fontpair: 'FontPair Studio: 33 pasangan kurasi, preview PNG/Google Fonts, pencarian, moodboard, favorit, dan AI Design Copilot multimodal dengan fallback kurasi lokal', typescale: 'Buat skala ukuran tipografi dengan rasio modular', typography: 'Typography Studio: hierarki font, panduan ukuran digital/cetak, dan pemeriksaan konsistensi tipografi', qareview: 'Design QA Review: periksa kontras, hierarki, tipografi, dan kesiapan produksi dari angka yang diisi', layout: 'Saran tata letak desain', explain: 'Penjelasan teknik desain', creative: 'Tiga arah konsep desain, arahan produksi, prompt siap salin, dan QA berdasarkan topik', designprompt: 'Buat prompt teks desain siap salin berdasarkan kebutuhan visual', designrender: 'Buat gambar konsep desain dengan AI image generation (memerlukan API key dan akses model gambar)', designscore: 'Hitung skor rubric desain dan urutkan prioritas perbaikan', designflow: 'Rancang alur produksi desain dari brief, konsep, layout, visual system, QA, hingga handoff; dapat disimpan sebagai proyek.', designproject: 'Designer Workspace 2.0: simpan preset pribadi, pantau progress enam tahap, buka panduan tahap, tandai selesai, buka ulang, duplikasi, dan export brief.',
  assets: 'Cari aset desain', kategoriassets: 'Daftar kategori aset', newassets: 'Aset terbaru', randomassets: 'Tampilkan aset acak', requestassets: 'Ajukan permintaan aset', searchassets: 'Cari aset dengan kata kunci',
  addasset: 'Tambahkan aset ke perpustakaan; admin grup', assetid: 'Detail aset berdasarkan ID', assetsinfo: 'Alias detail aset', assetsstats: 'Statistik perpustakaan aset', favoriteassets: 'Lihat atau kelola aset favorit',
  report: 'Laporkan dugaan pelanggaran di grup', reports: 'Daftar, detail, dan penyelesaian laporan; Admin grup atau Owner', ticket: 'Buat, baca percakapan, dan kelola tiket bantuan dengan pembatasan akses serta anti-spam', support: 'Pusat bantuan terpadu: panduan awal, FAQ, tiket, dan pelaporan masalah', backup: 'Cadangkan database; khusus Owner bot', level: 'Lihat level aktivitas dan XP',
  antilink: 'Atur filter tautan grup', antispam: 'Atur filter spam grup', welcome: 'Atur pesan selamat datang dan teks khusus anggota baru', goodbye: 'Atur pesan perpisahan anggota keluar', rules: 'Lihat aturan grup', setrules: 'Ubah aturan grup; admin grup',
  alltag: 'Sebut anggota grup', clearwarn: 'Hapus peringatan anggota', hidetag: 'Kirim pengumuman dengan tag tersembunyi', kick: 'Keluarkan anggota; admin grup', modlogs: 'Lihat riwayat moderasi', mute: 'Batasi pengiriman pesan grup', open: 'Buka kembali pengiriman pesan grup', polling: 'Buat polling bila didukung klien', warn: 'Beri peringatan kepada anggota', warnings: 'Lihat peringatan anggota',
  help: 'Panduan fungsi, format, dan contoh penggunaan perintah', cari: 'Temukan fitur dengan kalimat sehari-hari berdasarkan kebutuhan pengguna', cepat: 'Pusat akses pribadi untuk menyimpan hingga 8 perintah favorit dan melihat maksimal 8 perintah terakhir dengan riwayat opsional; hanya nama command yang disimpan, tanpa argumen atau isi pesan', commands: 'Daftar semua perintah beserta fungsi, contoh, kategori, dan akses', perintah: 'Alias daftar semua perintah', daftarperintah: 'Alias daftar semua perintah', menu: 'Menu utama dan kategori fitur berdasarkan kebutuhan', tutorial: 'Tutorial desain, Learning Path, Community Challenge, Community Hub, direktori portofolio, dan game', mulai: 'Onboarding interaktif untuk memilih kebutuhan dan tingkat pengalaman, lalu menerima rekomendasi fitur', bantuan: 'Alias bantuan penggunaan bot', tools: 'Pintasan menu tools desain', akun: 'Pintasan status peran dan langganan', panduan: 'Pintasan panduan pemula', alur: 'Panduan langkah demi langkah berdasarkan tujuan desain', kebutuhan: 'Alias pusat bantuan berdasarkan kebutuhan pengguna', owner: 'Panel Owner bot', ownerhelp: 'Alias panel Owner', stats: 'Dashboard statistik pengguna, grup, aset, laporan, dan tiket; Owner', activity: 'Riwayat moderasi terbaru; Owner', health: 'Periksa status proses bot, koneksi database, memori, dan antrean; Owner', groups: 'Daftar konfigurasi grup tersimpan; Owner', reports: 'Daftar laporan yang masih terbuka; Owner', tickets: 'Daftar tiket bantuan yang masih terbuka; Owner', textlist: 'Daftar teks yang bisa diedit Owner', textshow: 'Tampilkan teks berdasarkan kunci; Owner', textedit: 'Pratinjau perubahan teks; Owner', textsave: 'Konfirmasi dan simpan perubahan teks; Owner', textcancel: 'Batalkan perubahan teks; Owner', textbackups: 'Daftar backup konten; Owner', textrestore: 'Pulihkan backup konten berdasarkan nomor; Owner', jid: 'Lihat ID chat/akun', idgrup: 'Lihat ID grup', groupid: 'Alias ID grup', idanggota: 'Lihat ID anggota/akun', memberid: 'Alias ID anggota', daftaridanggota: 'Daftar ID anggota',
  wizard: 'Panduan percakapan untuk menyusun brief desain langkah demi langkah', briefwizard: 'Alias wizard brief desain', akses: 'Lihat peran dan status akses akun', sub: 'Kelola langganan fitur premium; khusus Owner untuk perubahan', colorpalette: 'Koleksi palet kurasi dengan preview warna PNG, pencarian, palet acak, dan generator harmoni HEX', palettekit: 'Ubah palet menjadi peran warna, token CSS siap salin, dan rekomendasi kontras WCAG', colorconvert: 'Konversi warna HEX, RGB, dan HSL dua arah', contrast: 'Hitung rasio kontras teks dan latar menurut WCAG', checklist: 'Checklist pemeriksaan desain sebelum publikasi', designqa: 'Checklist Design QA untuk memeriksa kesiapan poster, sosial, logo, cetak, kemasan, web, atau app', revision: 'Template brief revisi desain', brandkit: 'Buat brand kit awal berisi arah visual, palet, tipografi, tone, dan aturan penggunaan berdasarkan brief', pricing: 'Kalkulator estimasi harga desain; pelanggan aktif',
  games: 'Daftar game yang terdaftar', game: 'Buka pusat game', shop: 'Lihat toko item koleksi pemain', buy: 'Beli item menggunakan koin', inventory: 'Lihat inventaris item pemain', inv: 'Alias inventaris', wallet: 'Lihat saldo koin', saldo: 'Alias saldo', daily: 'Klaim bonus harian 100 koin dan 10 XP', player: 'Lihat profil, level, XP, item koleksi, pencapaian, papan peringkat XP atau koin', multi: 'Multiplayer: Sambung Kata, Kuis Rebutan kategori, Duel Suit, papan skor, dan keluar ruang', pixelrealm: 'Perintah utama Pixel Realm', pr: 'Pintasan singkat Pixel Realm', critique: 'Kirim karya untuk menerima kritik dalam grup', rate: 'Beri rating pada karya yang sedang dibahas', cancel: 'Batalkan wizard portofolio aktif', portfolio: 'Kelola profil/kontak/karya yang tersinkron dengan website, analytics, inbox, dan push notifikasi Designer Studio di chat pribadi', design: 'Temukan direktori desainer berdasarkan portofolio, kategori, gaya, dan lokasi', designer: 'Lihat portofolio publik dan kontak langsung desainer', studio: 'Ringkasan read-only website: profil, karya, layanan, koleksi, testimoni, ketersediaan, lead, project room, analytics dan notifikasi', lapordesain: 'Laporkan profil desainer atau karya portofolio', marketreport: 'Moderasi laporan direktori portofolio; Owner', marketadmin: 'Dashboard moderasi direktori portofolio; Owner',
};

const permissionOverrides = {
  commands: 'Anggota', cmd: 'Anggota', c: 'Anggota', h: 'Anggota', m: 'Anggota', ak: 'Anggota', perintah: 'Anggota', daftarperintah: 'Anggota', akses: 'Anggota', wizard: 'Anggota', briefwizard: 'Anggota', colorpalette: 'Anggota', palettekit: 'Anggota', contrast: 'Anggota', checklist: 'Anggota', revision: 'Anggota',
  sub: 'Khusus Owner bot untuk grant/revoke/list/status', backup: 'Khusus Owner bot', stats: 'Khusus Owner bot', activity: 'Khusus Owner bot', health: 'Khusus Owner bot', groups: 'Khusus Owner bot', reports: 'Khusus Owner bot', tickets: 'Khusus Owner bot', botconfig: 'Khusus Owner bot', allowlist: 'Khusus Owner bot', level: 'Anggota',
  brandkit: 'Pelanggan aktif atau Owner bot', pricing: 'Pelanggan aktif atau Owner bot',
  addasset: 'Admin grup', assetid: 'Anggota', assetsinfo: 'Anggota', assetsstats: 'Anggota', favoriteassets: 'Anggota',
  report: 'Anggota untuk membuat laporan di grup', reports: 'Admin grup untuk laporan grupnya; Owner untuk laporan global', ticket: 'Anggota; detail oleh pemilik/Admin grup asal/Owner; balas oleh Admin grup asal/Owner; tutup oleh pemilik/Admin grup asal/Owner', support: 'Anggota',
  welcome: 'Admin grup', goodbye: 'Admin grup', rules: 'Anggota untuk membaca; Admin grup untuk mengubah', setrules: 'Admin grup', antilink: 'Admin grup untuk mengubah pengaturan', antispam: 'Admin grup untuk mengubah pengaturan',
  modstatus: 'Anggota grup; hanya baca', modpreset: 'Admin grup atau Owner; preview lalu konfirmasi untuk menerapkan',
  kick: 'Admin grup', mute: 'Admin grup', open: 'Admin grup', warn: 'Admin grup', clearwarn: 'Admin grup', alltag: 'Admin grup', hidetag: 'Admin grup',
  jid: 'Anggota', idgrup: 'Anggota', groupid: 'Anggota', idanggota: 'Anggota', memberid: 'Anggota', daftaridanggota: 'Admin grup atau Owner bot',
  design: 'Anggota; membutuhkan MongoDB', designer: 'Anggota; membutuhkan MongoDB', studio: 'Pemilik profil desainer; hanya chat pribadi; membutuhkan MongoDB', designlearn: 'Anggota; penyimpanan progress membutuhkan MongoDB', designchallenge: 'Anggota; battle dibuat/ditutup Admin grup atau Owner; kiriman dan peer review opt-in di grup asal; hide/restore khusus Admin/Owner', designseason: 'Anggota; draft dan ronde dibuat pembuat/Admin/Owner; satu season aktif per grup; karya dan peer review dibatasi grup asal', assetstudio: 'Anggota; aset privat secara default; bagikan/hapus oleh pemilik; moderasi aset grup oleh Admin', designcommunity: 'Anggota; wajib di grup dan MongoDB; profil/mentor opt-in; proyek ditutup pemilik atau Admin grup', cohort: 'Anggota; grup asal saja; create Admin/Owner; milestone/review fasilitator; MongoDB', mediaformat: 'Anggota; pemeriksaan metadata memerlukan Python + yt-dlp; tidak mengunduh saat inspeksi', portfolio: 'Anggota pada grup komunitas yang diizinkan; notifikasi website hanya melalui chat pribadi; moderasi karya khusus Owner', cancel: 'Anggota; hanya wizard aktif milik sendiri',
  lapordesain: 'Anggota', marketadmin: 'Khusus Owner bot', marketreport: 'Khusus Owner bot', owner: 'Khusus Owner bot', ownerhelp: 'Khusus Owner bot', alias: 'Khusus Owner bot',
};

const examples = {
  fitur: '.fitur / .fitur cari download musik apple / .fitur kategori Creative Asset Studio / .fitur semua 2',
  features: '.features',
  jelajah: '.jelajah cari anime populer',
  briefbuilder: '.briefbuilder', moodboard: '.moodboard kedai kopi | sage dan krem | minimal natural', designcritique: '.designcritique poster acara',
  critique: 'Kirim/balas gambar dengan .critique', rate: '.rate 5 Komposisi kuat dan pesan jelas',
  designinspire: '.designinspire poster cyberpunk merah hitam', designlearn: '.designlearn mulai pemula warna / .designlearn progress / .designlearn selesai',
  designchallenge: '.designchallenge harian poster / .designchallenge battle buat Poster Komunitas | brief kompetisi desain | poster | 48 / .designchallenge battle submit KODE Judul | https://tautan | refleksi', designcommunity: '.designcommunity ringkasan / .designcommunity growth / .designcommunity mentor branding,uiux / .designcommunity cari branding / .designcommunity collab list', cohort: '.cohort buat Dasar Branding | Belajar identitas visual secara bertahap. | 4 / .cohort join KODE / .cohort milestone tambah KODE | Brief Visual | Buat eksplorasi tiga arah visual | 7 / .cohort ringkasan KODE', mediaformat: '.mediaformat / .mediaformat cek https://tautan-publik / .mediaformat estimasi video-wa 120', portfolioguide: '.portfolioguide case-study Kopi Senja | Branding | Brand belum dikenal | Riset dan eksplorasi logo | Identitas siap dipakai',
  fontstudio: '.fontstudio elegan poster', layoutstudio: '.layoutstudio poster', socialkit: '.socialkit instagram_story', resourcefind: '.resourcefind font serif',
  designseason: '.designseason buat Creative Season | Eksplorasi identitas visual komunitas. | branding', assetstudio: '.assetstudio simpan Moodboard Kopi | branding | https://contoh.com/moodboard | referensi saja | Sumber: Studio X',
  pinsearch: 'Ketik .pinsearch Yae Miko', pinterest: 'Ketik .pinterest Yae Miko', bingsearch: 'Ketik .bingsearch Yae Miko atau .bingsearch Yae Miko 3', bingimages: 'Ketik .bingimages Yae Miko',
  anime: '.anime cari Frieren / .anime populer / .anime musim / .anime detail 52991',
  music: '.music top / .music cari Nadin Amizah / .music album Untuk Dunia, Cinta, dan Kotornya / .music artis Tulus / .music detail 1440857781 / .music preview https://music.apple.com/id/album/judul/123?i=456',
  asisten: '.asisten aku ingin membuat poster promosi atau mencari musik',
  info: 'Kirim gambar lalu ketik .info', imageinfo: 'Kirim gambar lalu ketik .imageinfo', ratio: 'Balas gambar dengan .ratio',
  resize: 'Balas gambar dengan .resize 1080 1080', crop: 'Balas gambar dengan .crop 4:5', imgconvert: 'Balas gambar dengan .imgconvert webp 82', compress: 'Balas gambar dengan .compress', sticker: 'Balas gambar dengan .sticker',
  'sticker1:1': 'Balas gambar dengan .sticker1:1', hd: 'Balas gambar dengan .hd', palette: 'Balas gambar dengan .palette',
  download: '.download https://tautan-publik / .download https://music.apple.com/id/album/judul/123?i=456', dl: '.dl https://tautan-publik / .dl apple https://music.apple.com/id/album/judul/123?i=456', song: '.song lagu yang dicari', play: '.play lagu yang dicari', lagu: '.lagu lagu yang dicari',
  brief: '.brief poster acara sekolah', fontpair: '.fontpair ai poster festival musik futuristik', layout: '.layout poster promosi', explain: '.explain visual hierarchy', creative: '.creative kemasan kopi lokal | organik premium | pouch 250 gram', designprompt: '.designprompt poster | festival musik | remaja | futuristik neon', designrender: '.designrender poster | festival musik | anak muda | futuristik neon | ungu dan cyan', designflow: '.designflow web | toko kopi modern | pelanggan 18+ | mobile-first', designproject: '.designproject start Kopi Senja | web | toko kopi modern | pelanggan | mobile-first',
  assets: '.assets texture kertas', kategoriassets: '.kategoriassets', newassets: '.newassets', randomassets: '.randomassets', requestassets: '.requestassets tekstur kertas',
  searchassets: '.searchassets tekstur kertas', addasset: '.addasset (ikuti pertanyaan bot)', assetid: '.assetid AST-123', assetsinfo: '.assetsinfo AST-123', assetsstats: '.assetsstats', favoriteassets: '.favoriteassets',
  report: '.report @anggota | alasan laporan', reports: '.reports / .reports detail ID / .reports tutup ID', ticket: '.ticket buka Bot tidak merespons / .ticket saya / .ticket detail ID', support: '.support / .support faq / .support ticket', backup: '.backup', level: '.level',
  antilink: '.antilink on', antispam: '.antispam on', antitoxic: '.antitoxic tambah spamkata / .antitoxic on / .antitoxic daftar',
  modstatus: '.modstatus', modpreset: '.modpreset preview proteksi-dasar / .modpreset apply proteksi-dasar konfirmasi', welcome: '.welcome on atau .welcome teks Selamat datang {name} di {group}', goodbye: '.goodbye on atau .goodbye teks Sampai jumpa {name}', rules: '.rules', setrules: '.setrules Hormati anggota lain', alltag: '.alltag Pengumuman penting', clearwarn: '.clearwarn @anggota', hidetag: '.hidetag Pengumuman penting', kick: '.kick @anggota', modlogs: '.modlogs', mute: '.mute', open: '.open', polling: '.polling Pilih tema acara', warn: '.warn @anggota spam', warnings: '.warnings @anggota',
  cuaca: '.cuaca Bandung', weather: '.weather Bandung', gempa: '.gempa',
  help: '.help contrast', cari: '.cari bikin poster acara', cepat: '.cepat / .cepat tambah contrast / .cepat riwayat aktif', menu: '.menu warna', tutorial: '.tutorial desain', mulai: '.mulai', bantuan: '.bantuan', tools: '.tools', akun: '.akun', panduan: '.panduan', alur: '.alur poster', kebutuhan: '.kebutuhan logo',
  owner: '.owner (khusus Owner)', ownerhelp: '.ownerhelp (khusus Owner)', stats: '.stats (khusus Owner)', activity: '.activity 5 (khusus Owner)', health: '.health (khusus Owner)', groups: '.groups 10 (khusus Owner)', reports: '.reports 10 (khusus Owner)', tickets: '.tickets 10 (khusus Owner)', botconfig: '.botconfig maintenance on (khusus Owner)', textlist: '.textlist (khusus Owner)', textshow: '.textshow mainMenu (khusus Owner)', textedit: '.textedit mainMenu | Teks menu baru (khusus Owner)', textsave: '.textsave (khusus Owner)', textcancel: '.textcancel (khusus Owner)', textbackups: '.textbackups (khusus Owner)', textrestore: '.textrestore 1 (khusus Owner)', alias: '.alias add kontras contrast (khusus Owner)', allowlist: '.allowlist list; .allowlist search <kata>; .allowlist search group <kata>; .allowlist search contact <kata> (khusus Owner)',
  jid: '.jid', idgrup: '.idgrup', groupid: '.groupid', idanggota: '.idanggota', memberid: '.memberid', daftaridanggota: '.daftaridanggota',
  wizard: '.wizard', briefwizard: '.briefwizard', typescale: '.typescale 16 1.25 5', typography: '.typography check digital | Inter, Playfair Display | 12 14 16* 24 32 48 | 1.5', qareview: '.qareview web teks=#222222 latar=#FFFFFF body=16 judul=32 font=2 tap=44', akses: '.akses', sub: '.sub list (khusus Owner)', colorpalette: '.colorpalette ocean / .colorpalette random / .colorpalette search blue', palettekit: '.palettekit ocean', colorconvert: '.colorconvert #2D6CDF', contrast: '.contrast #222222 #FFFFFF', uxaudit: '.uxaudit bot', designsystem: '.designsystem futuristik', uxflow: '.uxflow marketplace', designflow: '.designflow web | toko kopi modern | pelanggan 18+ | mobile-first', designproject: '.designproject start Kopi Senja | web | toko kopi modern | pelanggan | mobile-first', checklist: '.checklist poster', designqa: '.designqa poster', revision: '.revision', brandkit: '.brandkit Kopi Senja | kopi lokal | pekerja kreatif | natural premium (premium)', pricing: '.pricing 5 50000 25000 (premium)',
  games: '.games', game: '.game', shop: '.shop', buy: '.buy badge_bintang 1', inventory: '.inventory', inv: '.inv', wallet: '.wallet', saldo: '.saldo', daily: '.daily', player: '.player, .player top, atau .player topkoin', multi: '.multi buat kuis sains atau .multi papan', angka: '.angka mulai', acak: '.acak mulai', pixelrealm: '.pixelrealm status', pr: '.pr mulai', critique: '.critique', rate: '.rate 5', cancel: '.cancel', portfolio: '.portfolio daftar / .portfolio analytics / .portfolio notifikasi / .portfolio notifikasi push status', design: '.design kategori Logo', designer: '.designer DSN-ID', studio: '.studio', lapordesain: '.lapordesain DSN-ID alasan', marketreport: '.marketreport (khusus Owner)', marketadmin: '.marketadmin (khusus Owner)',
  commands: '.commands tools', perintah: '.perintah', daftarperintah: '.daftarperintah', cmd: '.cmd tools', c: '.c tools', h: '.h contrast', m: '.m warna', ak: '.ak', tebak: '.tebak menu',
};

const seen = new Set();
export const COMMAND_CATALOG = Object.freeze(entries
  .filter(entry => {
    if (seen.has(entry.command)) return false;
    seen.add(entry.command);
    return true;
  })
  .map(entry => {
    const voiceProfile = VOICE_EFFECT_COMMANDS.has(entry.command) && !['voice', 'tempo'].includes(entry.command)
      ? getVoiceEffectProfile(entry.command)
      : null;
    const voiceDescription = entry.command === 'voice'
      ? 'Pusat Voice Lab: daftar efek audio, panduan pemakaian, dan penerapan efek pada audio yang dibalas'
      : entry.command === 'tempo'
        ? 'Ubah tempo audio yang dibalas dengan nilai 0.5 sampai 2.5 tanpa mengubah pitch secara sengaja'
        : voiceProfile
          ? `Terapkan efek ${voiceProfile.label} pada voice note atau audio yang dibalas. ${voiceProfile.note}`
          : '';
    const voiceExample = entry.command === 'voice'
      ? '.voice help'
      : entry.command === 'tempo'
        ? '.tempo 1.25'
        : `Balas audio dengan .${entry.command}`;
    return Object.freeze({
      ...entry,
      permission: permissionOverrides[entry.command] || entry.permission,
      description: entry.description || descriptions[entry.command] || voiceDescription || `Lihat ${entry.command} untuk petunjuk subperintah dan format lengkap.`,
      example: examples[entry.command] || (VOICE_EFFECT_COMMANDS.has(entry.command) ? voiceExample : `.help ${entry.command}`),
    });
  })
  .sort((a, b) => a.category.localeCompare(b.category, 'id') || a.command.localeCompare(b.command, 'id')));

export const COMMAND_WORKFLOWS = Object.freeze([
  Object.freeze({
    id: 'cohort-participant',
    title: 'Ikuti Learning Cohort',
    description: 'Alur peserta dari menemukan program sampai mengirim check-in milestone.',
    audience: 'Peserta',
    steps: ['.cohort list', '.cohort detail KODE', '.cohort join KODE', '.cohort milestone list KODE', '.cohort checkin KODE M01 | Catatan praktik minimal delapan karakter | https://tautan-karya', '.cohort progress KODE'],
  }),
  Object.freeze({
    id: 'cohort-facilitator',
    title: 'Kelola program belajar',
    description: 'Alur Admin/fasilitator untuk membuka program, menyusun milestone, dan meninjau check-in.',
    audience: 'Admin / Fasilitator',
    steps: ['.cohort buat Dasar Branding | Belajar identitas visual secara bertahap. | 4', '.cohort milestone tambah KODE | Brief Visual | Buat tiga alternatif arah visual. | 7', '.cohort mulai KODE', '.cohort kiriman KODE', '.cohort review KODE-CHECKIN approve | Hierarki dan kontras sudah jelas.'],
  }),
  Object.freeze({
    id: 'media-preflight',
    title: 'Periksa media sebelum download',
    description: 'Lihat format yang ditawarkan provider dan estimasi ukuran sebelum meminta file dikirim ke WhatsApp.',
    audience: 'Semua anggota',
    steps: ['.mediaformat', '.mediaformat cek https://tautan-publik', '.mediaformat estimasi video-wa 120', '.dl https://tautan-publik', '.dl status'],
  }),
  Object.freeze({
    id: 'apple-music-preview',
    title: 'Kirim preview resmi Apple Music',
    description: 'Ambil cuplikan audio publik yang disediakan Apple untuk satu lagu; tidak mengunduh lagu penuh atau melewati DRM.',
    audience: 'Semua anggota',
    steps: ['.music cari judul atau artis', '.music preview https://music.apple.com/id/album/judul/123?i=456', '.dl apple https://music.apple.com/id/album/judul/123?i=456'],
  }),
  Object.freeze({
    id: 'designer-growth',
    title: 'Evaluasi perkembangan desain',
    description: 'Gunakan aktivitas belajar, karya, dan peer review yang benar-benar tercatat untuk menentukan latihan berikutnya.',
    audience: 'Pribadi',
    steps: ['.designcommunity growth', '.designlearn progress', '.designchallenge harian', '.designcommunity ringkasan'],
  }),
  Object.freeze({
    id: 'design-season',
    title: 'Ikuti Design Season beberapa ronde',
    description: 'Kompetisi desain bertahap dengan satu ronde aktif, pengumpulan karya, galeri, dan peer review di grup asal.',
    audience: 'Peserta / Admin',
    steps: ['.designseason list', '.designseason lihat KODE', '.designseason submit KODE Judul karya | https://tautan | refleksi', '.designseason galeri KODE', '.designseason feedback KODE-KARYA 5 Masukan yang spesifik'],
  }),
  Object.freeze({
    id: 'creative-asset-library',
    title: 'Kelola referensi aset desain',
    description: 'Simpan tautan secara privat, cantumkan sumber/lisensi, lalu bagikan hanya jika siap dilihat anggota grup.',
    audience: 'Pribadi / Komunitas',
    steps: ['.assetstudio simpan Moodboard | branding | https://contoh.com/moodboard | referensi saja | Sumber: Studio X', '.assetstudio saya', '.assetstudio bagikan KODE konfirmasi', '.assetstudio cari branding', '.assetstudio detail KODE'],
  }),
  Object.freeze({
    id: 'voice-effects',
    title: 'Olah voice note dan audio',
    description: 'Balas voice note, audio, atau dokumen audio dengan efek suara, tempo, equalizer, dan pemrosesan sederhana.',
    audience: 'Semua anggota',
    steps: ['.voice help', '.bass (balas audio)', '.8d (balas audio)', '.karaoke (balas audio)', '.tempo 1.25 (balas audio)'],
  }),
  Object.freeze({
    id: 'local-information',
    title: 'Cek cuaca dan informasi gempa',
    description: 'Ambil kondisi cuaca sebuah kota dan informasi gempa terbaru dari sumber data publik.',
    audience: 'Semua anggota',
    steps: ['.cuaca Bandung', '.cuaca Jakarta', '.gempa'],
  }),
]);

export const COMMAND_CATEGORIES = Object.freeze([...new Set(COMMAND_CATALOG.map(entry => entry.category))]);

export function getCommandsByCategory(category) {
  return COMMAND_CATALOG.filter(entry => entry.category === category);
}

export function renderCommandCatalogMarkdown() {
  const lines = [
    '# Katalog Perintah Bot WhatsApp Komunitas Desain',
    '',
    '> Dibangkitkan otomatis dari registry perintah. Ringkasan akses tidak menggantikan pemeriksaan izin pada saat perintah dijalankan.',
    '',
    'Prefix default: `.` (dapat mengikuti konfigurasi `PREFIX`).',
    '',
    '## Ringkasan',
    '',
    `Jumlah nama perintah tingkat atas dalam katalog: **${COMMAND_CATALOG.length}**.`,
    '',
    '## Daftar perintah',
    '',
    '| Kategori | Perintah | Fungsi | Contoh | Akses umum |',
    '|---|---|---|---|---|',
    ...COMMAND_CATALOG.map(entry => `| ${entry.category} | \`${entry.command}\` | ${entry.description.replaceAll('|', '\\|')} | \`${entry.example.replaceAll('|', '\\|')}\` | ${entry.permission} |`),
    '',
    '## Catatan',
    '',
    '- Izin dapat berbeda per subperintah; teks kolom akses adalah ringkasan, bukan pengganti pemeriksaan izin runtime.',
    '- Marketplace menggunakan handler tersendiri dan beberapa perintah bergantung pada MongoDB.',
    '- `.game` menyediakan bantuan runtime untuk subperintah Pixel Realm.',
    '- Perintah yang muncul di katalog tidak menjamin semua dependensi eksternal sedang tersedia.',
    '',
  ];
  return lines.join('\n');
}
