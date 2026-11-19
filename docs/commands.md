# Katalog Perintah Bot WhatsApp Komunitas Desain

> Dibangkitkan otomatis dari registry perintah. Ringkasan akses tidak menggantikan pemeriksaan izin pada saat perintah dijalankan.

Prefix default: `.` (dapat mengikuti konfigurasi `PREFIX`).

## Ringkasan

Jumlah nama perintah tingkat atas dalam katalog: **230**.

## Daftar perintah

| Kategori | Perintah | Fungsi | Contoh | Akses umum |
|---|---|---|---|---|
| Anime & Hiburan | `anime` | Cari judul anime, daftar populer, anime musim ini, dan detail melalui MyAnimeList/Jikan dengan AniList sebagai provider cadangan otomatis. Tidak menyediakan streaming atau unduhan. | `.anime cari Frieren / .anime populer / .anime musim / .anime detail 52991` | Anggota; informasi dari Jikan API, memerlukan koneksi internet |
| Asisten PIR | `asisten` | PIR Assistant: pahami kebutuhan dalam bahasa sehari-hari lalu rekomendasikan perintah dan workflow dari katalog aktif. Saran tidak dieksekusi otomatis. | `.asisten aku ingin membuat poster promosi atau mencari musik` | Anggota; pencarian intent berbasis katalog, tidak menjalankan perintah otomatis |
| Bantuan & Dukungan | `support` | Pusat bantuan terpadu: panduan awal, FAQ, tiket, dan pelaporan masalah | `.support / .support faq / .support ticket` | Anggota |
| Bantuan & Dukungan | `ticket` | Buat, baca percakapan, dan kelola tiket bantuan dengan pembatasan akses serta anti-spam | `.ticket buka Bot tidak merespons / .ticket saya / .ticket detail ID` | Anggota; detail oleh pemilik/Admin grup asal/Owner; balas oleh Admin grup asal/Owner; tutup oleh pemilik/Admin grup asal/Owner |
| Belajar Desain | `ak` | Lihat ak untuk petunjuk subperintah dan format lengkap. | `.ak` | Anggota |
| Belajar Desain | `akun` | Pintasan status peran dan langganan | `.akun` | Anggota |
| Belajar Desain | `alur` | Panduan langkah demi langkah berdasarkan tujuan desain | `.alur poster` | Anggota |
| Belajar Desain | `bantuan` | Alias bantuan penggunaan bot | `.bantuan` | Anggota |
| Belajar Desain | `brief` | Buat atau tampilkan template brief desain | `.brief poster acara sekolah` | Anggota |
| Belajar Desain | `c` | Lihat c untuk petunjuk subperintah dan format lengkap. | `.c tools` | Anggota |
| Belajar Desain | `cari` | Temukan fitur dengan kalimat sehari-hari berdasarkan kebutuhan pengguna | `.cari bikin poster acara` | Anggota |
| Belajar Desain | `cepat` | Pusat akses pribadi untuk menyimpan hingga 8 perintah favorit dan melihat maksimal 8 perintah terakhir dengan riwayat opsional; hanya nama command yang disimpan, tanpa argumen atau isi pesan | `.cepat / .cepat tambah contrast / .cepat riwayat aktif` | Anggota |
| Belajar Desain | `cmd` | Lihat cmd untuk petunjuk subperintah dan format lengkap. | `.cmd tools` | Anggota |
| Belajar Desain | `cohort` | Learning Cohort: kelompok belajar 1–12 minggu, pendaftaran sukarela, fasilitator, milestone, check-in karya, review, dan progress privat/agregat per grup | `.cohort buat Dasar Branding \| Belajar identitas visual secara bertahap. \| 4 / .cohort join KODE / .cohort milestone tambah KODE \| Brief Visual \| Buat eksplorasi tiga arah visual \| 7 / .cohort ringkasan KODE` | Anggota; grup asal saja; create Admin/Owner; milestone/review fasilitator; MongoDB |
| Belajar Desain | `commands` | Daftar semua perintah beserta fungsi, contoh, kategori, dan akses | `.commands tools` | Anggota |
| Belajar Desain | `creative` | Tiga arah konsep desain, arahan produksi, prompt siap salin, dan QA berdasarkan topik | `.creative kemasan kopi lokal \| organik premium \| pouch 250 gram` | Anggota |
| Belajar Desain | `daftarperintah` | Alias daftar semua perintah | `.daftarperintah` | Anggota |
| Belajar Desain | `designprompt` | Buat prompt teks desain siap salin berdasarkan kebutuhan visual | `.designprompt poster \| festival musik \| remaja \| futuristik neon` | Anggota |
| Belajar Desain | `designrender` | Buat gambar konsep desain dengan AI image generation (memerlukan API key dan akses model gambar) | `.designrender poster \| festival musik \| anak muda \| futuristik neon \| ungu dan cyan` | Anggota |
| Belajar Desain | `designreview` | Lihat designreview untuk petunjuk subperintah dan format lengkap. | `.help designreview` | Anggota |
| Belajar Desain | `designscore` | Hitung skor rubric desain dan urutkan prioritas perbaikan | `.help designscore` | Anggota |
| Belajar Desain | `explain` | Penjelasan teknik desain | `.explain visual hierarchy` | Anggota |
| Belajar Desain | `features` | Alias pusat penemuan semua fitur PIR Visuals | `.features` | Anggota |
| Belajar Desain | `fitur` | Tampilkan seluruh command terdaftar dalam daftar teks yang dikelompokkan berdasarkan kategori; mendukung pencarian, filter kategori, katalog ringkas, dan workflow | `.fitur / .fitur cari download musik apple / .fitur kategori Creative Asset Studio / .fitur semua 2` | Anggota |
| Belajar Desain | `fontpair` | FontPair Studio: 33 pasangan kurasi, preview PNG/Google Fonts, pencarian, moodboard, favorit, dan AI Design Copilot multimodal dengan fallback kurasi lokal | `.fontpair ai poster festival musik futuristik` | Anggota |
| Belajar Desain | `h` | Lihat h untuk petunjuk subperintah dan format lengkap. | `.h contrast` | Anggota |
| Belajar Desain | `help` | Panduan fungsi, format, dan contoh penggunaan perintah | `.help contrast` | Anggota |
| Belajar Desain | `jelajah` | Alias pusat penemuan semua fitur PIR Visuals | `.jelajah cari anime populer` | Anggota |
| Belajar Desain | `kebutuhan` | Alias pusat bantuan berdasarkan kebutuhan pengguna | `.kebutuhan logo` | Anggota |
| Belajar Desain | `layout` | Saran tata letak desain | `.layout poster promosi` | Anggota |
| Belajar Desain | `m` | Lihat m untuk petunjuk subperintah dan format lengkap. | `.m warna` | Anggota |
| Belajar Desain | `menu` | Menu utama dan kategori fitur berdasarkan kebutuhan | `.menu warna` | Anggota |
| Belajar Desain | `mulai` | Onboarding interaktif untuk memilih kebutuhan dan tingkat pengalaman, lalu menerima rekomendasi fitur | `.mulai` | Anggota |
| Belajar Desain | `panduan` | Pintasan panduan pemula | `.panduan` | Anggota |
| Belajar Desain | `perintah` | Alias daftar semua perintah | `.perintah` | Anggota |
| Belajar Desain | `tools` | Pintasan menu tools desain | `.tools` | Anggota |
| Belajar Desain | `tutorial` | Tutorial desain, Learning Path, Community Challenge, Community Hub, direktori portofolio, dan game | `.tutorial desain` | Anggota |
| Creative Asset Studio | `assetstudio` | Creative Asset Studio: koleksi tautan aset desain privat secara default, berbagi ke grup, pencarian, atribusi/lisensi, dan moderasi Admin | `.assetstudio simpan Moodboard Kopi \| branding \| https://contoh.com/moodboard \| referensi saja \| Sumber: Studio X` | Anggota; aset privat secara default; bagikan/hapus oleh pemilik; moderasi aset grup oleh Admin |
| Designer Portfolio Directory | `cancel` | Batalkan wizard portofolio aktif | `.cancel` | Anggota; hanya wizard aktif milik sendiri |
| Designer Portfolio Directory | `design` | Temukan direktori desainer berdasarkan portofolio, kategori, gaya, dan lokasi | `.design kategori Logo` | Anggota; membutuhkan MongoDB |
| Designer Portfolio Directory | `designer` | Lihat portofolio publik dan kontak langsung desainer | `.designer DSN-ID` | Anggota; membutuhkan MongoDB |
| Designer Portfolio Directory | `lapordesain` | Laporkan profil desainer atau karya portofolio | `.lapordesain DSN-ID alasan` | Anggota |
| Designer Portfolio Directory | `marketadmin` | Dashboard moderasi direktori portofolio; Owner | `.marketadmin (khusus Owner)` | Khusus Owner bot |
| Designer Portfolio Directory | `marketreport` | Moderasi laporan direktori portofolio; Owner | `.marketreport (khusus Owner)` | Khusus Owner bot |
| Designer Portfolio Directory | `portfolio` | Kelola profil/kontak/karya yang tersinkron dengan website, analytics, inbox, dan push notifikasi Designer Studio di chat pribadi | `.portfolio daftar / .portfolio analytics / .portfolio notifikasi / .portfolio notifikasi push status` | Anggota pada grup komunitas yang diizinkan; notifikasi website hanya melalui chat pribadi; moderasi karya khusus Owner |
| Designer Portfolio Directory | `studio` | Ringkasan read-only website: profil, karya, layanan, koleksi, testimoni, ketersediaan, lead, project room, analytics dan notifikasi | `.studio` | Pemilik profil desainer; hanya chat pribadi; membutuhkan MongoDB |
| Downloader & Media | `dl` | Unduh media publik yang didukung atau kirim preview resmi Apple Music dari tautan satu lagu; tidak melewati DRM | `.dl https://tautan-publik / .dl apple https://music.apple.com/id/album/judul/123?i=456` | Anggota; memerlukan yt-dlp terpasang dan tautan publik yang didukung |
| Downloader & Media | `download` | Unduh media dari tautan publik yang didukung; tautan Apple Music diarahkan ke preview resmi jika tersedia | `.download https://tautan-publik / .download https://music.apple.com/id/album/judul/123?i=456` | Anggota; memerlukan yt-dlp terpasang dan tautan publik yang didukung |
| Downloader & Media | `mediaformat` | Media Format Explorer: inspeksi metadata format provider tanpa mengunduh file, daftar format pipeline, dan estimasi ukuran preset media | `.mediaformat / .mediaformat cek https://tautan-publik / .mediaformat estimasi video-wa 120` | Anggota; pemeriksaan metadata memerlukan Python + yt-dlp; tidak mengunduh saat inspeksi |
| Ekonomi Pemain | `buy` | Beli item menggunakan koin | `.buy badge_bintang 1` | Anggota; membutuhkan MongoDB |
| Ekonomi Pemain | `daily` | Klaim bonus harian 100 koin dan 10 XP | `.daily` | Anggota; membutuhkan MongoDB |
| Ekonomi Pemain | `inv` | Alias inventaris | `.inv` | Anggota; membutuhkan MongoDB |
| Ekonomi Pemain | `inventory` | Lihat inventaris item pemain | `.inventory` | Anggota; membutuhkan MongoDB |
| Ekonomi Pemain | `saldo` | Alias saldo | `.saldo` | Anggota; membutuhkan MongoDB |
| Ekonomi Pemain | `shop` | Lihat toko item koleksi pemain | `.shop` | Anggota; membutuhkan MongoDB |
| Ekonomi Pemain | `wallet` | Lihat saldo koin | `.wallet` | Anggota; membutuhkan MongoDB |
| Game Kata | `acak` | Susun huruf acak menjadi kata dari kategori pengetahuan umum, sains, teknologi, dan lainnya. | `.acak mulai` | Anggota |
| Game Komunitas | `game` | Pusat perintah game | `.game` | Anggota |
| Game Komunitas | `games` | Pusat semua permainan: Pixel Realm, tebak-tebakan, angka, acak kata, misteri, dan multiplayer | `.games` | Anggota |
| Game Misteri | `misteri` | Investigasi episodik: kunjungi lokasi, periksa bukti, interogasi saksi, dan pecahkan kasus fiksi. | `.help misteri` | Anggota |
| Game Multiplayer | `multi` | Buat ruang Sambung Kata/Kuis Rebutan per kategori, gabung, papan skor, keluar ruang, dan duel Suit | `.multi buat kuis sains atau .multi papan` | Anggota; game grup dan duel 1 lawan 1 |
| Game Tebak-Tebakan | `angka` | Tebak angka rahasia 1–50 dengan 7 kesempatan dan kumpulkan poin. | `.angka mulai` | Anggota |
| Game Tebak-Tebakan | `tebak` | Tebak kata dari pengetahuan umum, sains, teknologi, geografi, hewan, makanan, olahraga, sejarah, desain, dan logika. | `.tebak menu` | Anggota |
| Inspirasi & Belajar Desain | `designchallenge` | Tantangan desain harian/mingguan dan Design Battle berbatas waktu per grup, satu kiriman aktif per peserta, galeri, peer review, ringkasan hasil, serta moderasi oleh Admin grup/Owner | `.designchallenge harian poster / .designchallenge battle buat Poster Komunitas \| brief kompetisi desain \| poster \| 48 / .designchallenge battle submit KODE Judul \| https://tautan \| refleksi` | Anggota; battle dibuat/ditutup Admin grup atau Owner; kiriman dan peer review opt-in di grup asal; hide/restore khusus Admin/Owner |
| Inspirasi & Belajar Desain | `designinspire` | Cari inspirasi desain berdasarkan kategori dan tema; menghasilkan keyword referensi, arahan eksplorasi, latihan, dan tautan pencarian visual | `.designinspire poster cyberpunk merah hitam` | Anggota |
| Inspirasi & Belajar Desain | `designlearn` | Learning Path 12 modul untuk pemula, menengah, dan lanjutan; simpan materi aktif, tandai selesai, lanjutkan pelajaran, dan pantau progress pribadi | `.designlearn mulai pemula warna / .designlearn progress / .designlearn selesai` | Anggota; penyimpanan progress membutuhkan MongoDB |
| Inspirasi & Belajar Desain | `portfolioguide` | Panduan portfolio, checklist publikasi, builder case study, dan bio desainer | `.portfolioguide case-study Kopi Senja \| Branding \| Brand belum dikenal \| Riset dan eksplorasi logo \| Identitas siap dipakai` | Anggota |
| Komunitas Desain | `designcommunity` | Community Hub: profil opt-in per grup, ringkasan kontribusi pribadi, Designer Growth Insights 30 hari, badge/milestone, pencarian mentor, dan papan proyek kolaborasi | `.designcommunity ringkasan / .designcommunity growth / .designcommunity mentor branding,uiux / .designcommunity cari branding / .designcommunity collab list` | Anggota; wajib di grup dan MongoDB; profil/mentor opt-in; proyek ditutup pemilik atau Admin grup |
| Komunitas Desain | `designseason` | Design Seasons: kompetisi desain 2–8 ronde per grup, satu ronde aktif pada satu waktu, pengumpulan karya, galeri, peer review, hasil akhir, dan moderasi Admin | `.designseason buat Creative Season \| Eksplorasi identitas visual komunitas. \| branding` | Anggota; draft dan ronde dibuat pembuat/Admin/Owner; satu season aktif per grup; karya dan peer review dibatasi grup asal |
| Misi & Hadiah | `mission` | Selesaikan misi harian untuk mendapatkan koin dan XP. | `.help mission` | Anggota |
| Musik & Audio | `8d` | Terapkan efek 8D Audio pada voice note atau audio yang dibalas. Efek stereo berputar. | `Balas audio dengan .8d` | Anggota; balas voice note/audio/dokumen audio; FFmpeg wajib; input maks. 12 MB dan 10 menit, output MP3 maks. 15 MB |
| Musik & Audio | `bass` | Terapkan efek Bass Boost pada voice note atau audio yang dibalas. Memperkuat frekuensi bass. | `Balas audio dengan .bass` | Anggota; balas voice note/audio/dokumen audio; FFmpeg wajib; input maks. 12 MB dan 10 menit, output MP3 maks. 15 MB |
| Musik & Audio | `bass2` | Terapkan efek Bass Boost Plus pada voice note atau audio yang dibalas. Bass lebih tebal dengan limiter. | `Balas audio dengan .bass2` | Anggota; balas voice note/audio/dokumen audio; FFmpeg wajib; input maks. 12 MB dan 10 menit, output MP3 maks. 15 MB |
| Musik & Audio | `bassboost` | Terapkan efek Bass Boost pada voice note atau audio yang dibalas. Memperkuat frekuensi bass. | `Balas audio dengan .bassboost` | Anggota; balas voice note/audio/dokumen audio; FFmpeg wajib; input maks. 12 MB dan 10 menit, output MP3 maks. 15 MB |
| Musik & Audio | `blown` | Terapkan efek Compressed Punch pada voice note atau audio yang dibalas. Kompresi dinamis yang lebih tegas. | `Balas audio dengan .blown` | Anggota; balas voice note/audio/dokumen audio; FFmpeg wajib; input maks. 12 MB dan 10 menit, output MP3 maks. 15 MB |
| Musik & Audio | `chipmunk` | Terapkan efek Chipmunk pada voice note atau audio yang dibalas. Pitch lebih tinggi dan durasi lebih singkat. | `Balas audio dengan .chipmunk` | Anggota; balas voice note/audio/dokumen audio; FFmpeg wajib; input maks. 12 MB dan 10 menit, output MP3 maks. 15 MB |
| Musik & Audio | `clean` | Terapkan efek Clean Voice pada voice note atau audio yang dibalas. Filter dasar dan pengurangan noise; bukan pengganti rekaman studio. | `Balas audio dengan .clean` | Anggota; balas voice note/audio/dokumen audio; FFmpeg wajib; input maks. 12 MB dan 10 menit, output MP3 maks. 15 MB |
| Musik & Audio | `compressor` | Terapkan efek Compressor pada voice note atau audio yang dibalas. Meratakan dinamika audio. | `Balas audio dengan .compressor` | Anggota; balas voice note/audio/dokumen audio; FFmpeg wajib; input maks. 12 MB dan 10 menit, output MP3 maks. 15 MB |
| Musik & Audio | `deep` | Terapkan efek Deep Voice pada voice note atau audio yang dibalas. Pitch suara lebih rendah. | `Balas audio dengan .deep` | Anggota; balas voice note/audio/dokumen audio; FFmpeg wajib; input maks. 12 MB dan 10 menit, output MP3 maks. 15 MB |
| Musik & Audio | `demon` | Terapkan efek Deep Voice pada voice note atau audio yang dibalas. Pitch suara lebih rendah. | `Balas audio dengan .demon` | Anggota; balas voice note/audio/dokumen audio; FFmpeg wajib; input maks. 12 MB dan 10 menit, output MP3 maks. 15 MB |
| Musik & Audio | `distortion` | Terapkan efek Lo-fi Distortion pada voice note atau audio yang dibalas. Tekstur lo-fi ringan dengan pembatas level. | `Balas audio dengan .distortion` | Anggota; balas voice note/audio/dokumen audio; FFmpeg wajib; input maks. 12 MB dan 10 menit, output MP3 maks. 15 MB |
| Musik & Audio | `echo` | Terapkan efek Echo pada voice note atau audio yang dibalas. Gema pendek. | `Balas audio dengan .echo` | Anggota; balas voice note/audio/dokumen audio; FFmpeg wajib; input maks. 12 MB dan 10 menit, output MP3 maks. 15 MB |
| Musik & Audio | `echo2` | Terapkan efek Echo Wide pada voice note atau audio yang dibalas. Gema bertingkat. | `Balas audio dengan .echo2` | Anggota; balas voice note/audio/dokumen audio; FFmpeg wajib; input maks. 12 MB dan 10 menit, output MP3 maks. 15 MB |
| Musik & Audio | `fast` | Terapkan efek Fast pada voice note atau audio yang dibalas. Tempo 1,25× tanpa menaikkan pitch secara sengaja. | `Balas audio dengan .fast` | Anggota; balas voice note/audio/dokumen audio; FFmpeg wajib; input maks. 12 MB dan 10 menit, output MP3 maks. 15 MB |
| Musik & Audio | `fat` | Terapkan efek Bass Boost pada voice note atau audio yang dibalas. Memperkuat frekuensi bass. | `Balas audio dengan .fat` | Anggota; balas voice note/audio/dokumen audio; FFmpeg wajib; input maks. 12 MB dan 10 menit, output MP3 maks. 15 MB |
| Musik & Audio | `ghost` | Terapkan efek Ghost pada voice note atau audio yang dibalas. Gema panjang dan lembut. | `Balas audio dengan .ghost` | Anggota; balas voice note/audio/dokumen audio; FFmpeg wajib; input maks. 12 MB dan 10 menit, output MP3 maks. 15 MB |
| Musik & Audio | `haunted` | Terapkan efek Haunted pada voice note atau audio yang dibalas. Gema panjang untuk nuansa menyeramkan. | `Balas audio dengan .haunted` | Anggota; balas voice note/audio/dokumen audio; FFmpeg wajib; input maks. 12 MB dan 10 menit, output MP3 maks. 15 MB |
| Musik & Audio | `helium` | Terapkan efek Chipmunk pada voice note atau audio yang dibalas. Pitch lebih tinggi dan durasi lebih singkat. | `Balas audio dengan .helium` | Anggota; balas voice note/audio/dokumen audio; FFmpeg wajib; input maks. 12 MB dan 10 menit, output MP3 maks. 15 MB |
| Musik & Audio | `karaoke` | Terapkan efek Karaoke Reduce pada voice note atau audio yang dibalas. Mengurangi suara yang berada di tengah pada audio stereo. Hasil bergantung pada mixing lagu dan bukan pemisahan vokal berbasis AI. | `Balas audio dengan .karaoke` | Anggota; balas voice note/audio/dokumen audio; FFmpeg wajib; input maks. 12 MB dan 10 menit, output MP3 maks. 15 MB |
| Musik & Audio | `lagu` | Alias pencarian lagu | `.lagu lagu yang dicari` | Anggota; pencarian metadata memakai Apple iTunes API; download audio memerlukan yt-dlp dan sumber yang diizinkan |
| Musik & Audio | `loud` | Terapkan efek Normalize pada voice note atau audio yang dibalas. Menormalkan loudness dengan true-peak ceiling. | `Balas audio dengan .loud` | Anggota; balas voice note/audio/dokumen audio; FFmpeg wajib; input maks. 12 MB dan 10 menit, output MP3 maks. 15 MB |
| Musik & Audio | `megaphone` | Terapkan efek Megaphone pada voice note atau audio yang dibalas. Warna suara seperti pengeras suara. | `Balas audio dengan .megaphone` | Anggota; balas voice note/audio/dokumen audio; FFmpeg wajib; input maks. 12 MB dan 10 menit, output MP3 maks. 15 MB |
| Musik & Audio | `metal` | Terapkan efek Metallic pada voice note atau audio yang dibalas. Tekstur digital metalik. | `Balas audio dengan .metal` | Anggota; balas voice note/audio/dokumen audio; FFmpeg wajib; input maks. 12 MB dan 10 menit, output MP3 maks. 15 MB |
| Musik & Audio | `music` | Cari metadata lagu, album, artis, dan Top 10 chart Apple Indonesia; dapat mengirim preview audio publik resmi dari tautan lagu Apple jika tersedia. Tidak mengunduh lagu penuh atau melewati DRM. | `.music top / .music cari Nadin Amizah / .music album Untuk Dunia, Cinta, dan Kotornya / .music artis Tulus / .music detail 1440857781 / .music preview https://music.apple.com/id/album/judul/123?i=456` | Anggota; pencarian metadata memakai Apple iTunes API; download audio memerlukan yt-dlp dan sumber yang diizinkan |
| Musik & Audio | `nightcore` | Terapkan efek Nightcore pada voice note atau audio yang dibalas. Pitch dan tempo lebih tinggi. | `Balas audio dengan .nightcore` | Anggota; balas voice note/audio/dokumen audio; FFmpeg wajib; input maks. 12 MB dan 10 menit, output MP3 maks. 15 MB |
| Musik & Audio | `normalize` | Terapkan efek Normalize pada voice note atau audio yang dibalas. Menormalkan loudness dengan true-peak ceiling. | `Balas audio dengan .normalize` | Anggota; balas voice note/audio/dokumen audio; FFmpeg wajib; input maks. 12 MB dan 10 menit, output MP3 maks. 15 MB |
| Musik & Audio | `play` | Alias pemutaran/pencarian lagu | `.play lagu yang dicari` | Anggota; pencarian metadata memakai Apple iTunes API; download audio memerlukan yt-dlp dan sumber yang diizinkan |
| Musik & Audio | `radio` | Terapkan efek Radio pada voice note atau audio yang dibalas. Band-pass seperti audio radio. | `Balas audio dengan .radio` | Anggota; balas voice note/audio/dokumen audio; FFmpeg wajib; input maks. 12 MB dan 10 menit, output MP3 maks. 15 MB |
| Musik & Audio | `reverb` | Terapkan efek Reverb pada voice note atau audio yang dibalas. Ruang gema ringan. | `Balas audio dengan .reverb` | Anggota; balas voice note/audio/dokumen audio; FFmpeg wajib; input maks. 12 MB dan 10 menit, output MP3 maks. 15 MB |
| Musik & Audio | `reverb2` | Terapkan efek Reverb Hall pada voice note atau audio yang dibalas. Ruang gema lebih panjang. | `Balas audio dengan .reverb2` | Anggota; balas voice note/audio/dokumen audio; FFmpeg wajib; input maks. 12 MB dan 10 menit, output MP3 maks. 15 MB |
| Musik & Audio | `reverse` | Terapkan efek Reverse pada voice note atau audio yang dibalas. Memutar audio dari belakang. | `Balas audio dengan .reverse` | Anggota; balas voice note/audio/dokumen audio; FFmpeg wajib; input maks. 12 MB dan 10 menit, output MP3 maks. 15 MB |
| Musik & Audio | `robot` | Terapkan efek Robot pada voice note atau audio yang dibalas. Modulasi suara robotik. | `Balas audio dengan .robot` | Anggota; balas voice note/audio/dokumen audio; FFmpeg wajib; input maks. 12 MB dan 10 menit, output MP3 maks. 15 MB |
| Musik & Audio | `slow` | Terapkan efek Slow pada voice note atau audio yang dibalas. Tempo 0,8× tanpa menurunkan pitch secara sengaja. | `Balas audio dengan .slow` | Anggota; balas voice note/audio/dokumen audio; FFmpeg wajib; input maks. 12 MB dan 10 menit, output MP3 maks. 15 MB |
| Musik & Audio | `smooth` | Terapkan efek Smooth pada voice note atau audio yang dibalas. Kompresi lembut dan high-cut ringan. | `Balas audio dengan .smooth` | Anggota; balas voice note/audio/dokumen audio; FFmpeg wajib; input maks. 12 MB dan 10 menit, output MP3 maks. 15 MB |
| Musik & Audio | `soft` | Terapkan efek Soft pada voice note atau audio yang dibalas. Volume dan frekuensi tinggi diturunkan. | `Balas audio dengan .soft` | Anggota; balas voice note/audio/dokumen audio; FFmpeg wajib; input maks. 12 MB dan 10 menit, output MP3 maks. 15 MB |
| Musik & Audio | `song` | Cari lagu dan pilih hasil untuk diproses sebagai audio jika didukung | `.song lagu yang dicari` | Anggota; pencarian metadata memakai Apple iTunes API; download audio memerlukan yt-dlp dan sumber yang diizinkan |
| Musik & Audio | `squirrel` | Terapkan efek Chipmunk pada voice note atau audio yang dibalas. Pitch lebih tinggi dan durasi lebih singkat. | `Balas audio dengan .squirrel` | Anggota; balas voice note/audio/dokumen audio; FFmpeg wajib; input maks. 12 MB dan 10 menit, output MP3 maks. 15 MB |
| Musik & Audio | `stereo` | Terapkan efek Stereo pada voice note atau audio yang dibalas. Memperlebar komponen stereo. | `Balas audio dengan .stereo` | Anggota; balas voice note/audio/dokumen audio; FFmpeg wajib; input maks. 12 MB dan 10 menit, output MP3 maks. 15 MB |
| Musik & Audio | `telephone` | Terapkan efek Telephone pada voice note atau audio yang dibalas. Rentang frekuensi seperti telepon. | `Balas audio dengan .telephone` | Anggota; balas voice note/audio/dokumen audio; FFmpeg wajib; input maks. 12 MB dan 10 menit, output MP3 maks. 15 MB |
| Musik & Audio | `tempo` | Ubah tempo audio yang dibalas dengan nilai 0.5 sampai 2.5 tanpa mengubah pitch secara sengaja | `.tempo 1.25` | Anggota; balas voice note/audio/dokumen audio; FFmpeg wajib; input maks. 12 MB dan 10 menit, output MP3 maks. 15 MB |
| Musik & Audio | `treble` | Terapkan efek Treble Boost pada voice note atau audio yang dibalas. Memperkuat frekuensi tinggi. | `Balas audio dengan .treble` | Anggota; balas voice note/audio/dokumen audio; FFmpeg wajib; input maks. 12 MB dan 10 menit, output MP3 maks. 15 MB |
| Musik & Audio | `treble2` | Terapkan efek Treble Boost Plus pada voice note atau audio yang dibalas. Treble lebih kuat. | `Balas audio dengan .treble2` | Anggota; balas voice note/audio/dokumen audio; FFmpeg wajib; input maks. 12 MB dan 10 menit, output MP3 maks. 15 MB |
| Musik & Audio | `tremolo` | Terapkan efek Tremolo pada voice note atau audio yang dibalas. Volume berdenyut secara periodik. | `Balas audio dengan .tremolo` | Anggota; balas voice note/audio/dokumen audio; FFmpeg wajib; input maks. 12 MB dan 10 menit, output MP3 maks. 15 MB |
| Musik & Audio | `tupai` | Terapkan efek Chipmunk pada voice note atau audio yang dibalas. Pitch lebih tinggi dan durasi lebih singkat. | `Balas audio dengan .tupai` | Anggota; balas voice note/audio/dokumen audio; FFmpeg wajib; input maks. 12 MB dan 10 menit, output MP3 maks. 15 MB |
| Musik & Audio | `underwater` | Terapkan efek Underwater pada voice note atau audio yang dibalas. Frekuensi tinggi diredam dengan gema pendek. | `Balas audio dengan .underwater` | Anggota; balas voice note/audio/dokumen audio; FFmpeg wajib; input maks. 12 MB dan 10 menit, output MP3 maks. 15 MB |
| Musik & Audio | `vibra` | Terapkan efek Vibrato pada voice note atau audio yang dibalas. Pitch bergetar secara halus. | `Balas audio dengan .vibra` | Anggota; balas voice note/audio/dokumen audio; FFmpeg wajib; input maks. 12 MB dan 10 menit, output MP3 maks. 15 MB |
| Musik & Audio | `voice` | Pusat Voice Lab: daftar efek audio, panduan pemakaian, dan penerapan efek pada audio yang dibalas | `.voice help` | Anggota; balas voice note/audio/dokumen audio; FFmpeg wajib; input maks. 12 MB dan 10 menit, output MP3 maks. 15 MB |
| Musik & Audio | `volumedown` | Terapkan efek Volume Down pada voice note atau audio yang dibalas. Volume diturunkan. | `Balas audio dengan .volumedown` | Anggota; balas voice note/audio/dokumen audio; FFmpeg wajib; input maks. 12 MB dan 10 menit, output MP3 maks. 15 MB |
| Musik & Audio | `volumeup` | Terapkan efek Volume Up pada voice note atau audio yang dibalas. Volume dinaikkan dengan limiter. | `Balas audio dengan .volumeup` | Anggota; balas voice note/audio/dokumen audio; FFmpeg wajib; input maks. 12 MB dan 10 menit, output MP3 maks. 15 MB |
| Musik & Audio | `wide` | Terapkan efek Wide Stereo pada voice note atau audio yang dibalas. Lebar stereo ditingkatkan. | `Balas audio dengan .wide` | Anggota; balas voice note/audio/dokumen audio; FFmpeg wajib; input maks. 12 MB dan 10 menit, output MP3 maks. 15 MB |
| Owner | `activity` | Riwayat moderasi terbaru; Owner | `.activity 5 (khusus Owner)` | Khusus Owner bot |
| Owner | `alias` | Lihat alias untuk petunjuk subperintah dan format lengkap. | `.alias add kontras contrast (khusus Owner)` | Khusus Owner bot |
| Owner | `allowlist` | Kelola daftar chat yang diizinkan dan cari grup/kontak berdasarkan nama atau kata kunci; khusus Owner bot | `.allowlist list; .allowlist search <kata>; .allowlist search group <kata>; .allowlist search contact <kata> (khusus Owner)` | Khusus Owner bot |
| Owner | `botconfig` | Lihat botconfig untuk petunjuk subperintah dan format lengkap. | `.botconfig maintenance on (khusus Owner)` | Khusus Owner bot |
| Owner | `groups` | Daftar konfigurasi grup tersimpan; Owner | `.groups 10 (khusus Owner)` | Khusus Owner bot |
| Owner | `health` | Periksa status proses bot, koneksi database, memori, dan antrean; Owner | `.health (khusus Owner)` | Khusus Owner bot |
| Owner | `owner` | Panel Owner bot | `.owner (khusus Owner)` | Khusus Owner bot |
| Owner | `ownerhelp` | Alias panel Owner | `.ownerhelp (khusus Owner)` | Khusus Owner bot |
| Owner | `stats` | Dashboard statistik pengguna, grup, aset, laporan, dan tiket; Owner | `.stats (khusus Owner)` | Khusus Owner bot |
| Owner | `textbackups` | Daftar backup konten; Owner | `.textbackups (khusus Owner)` | Khusus Owner bot |
| Owner | `textcancel` | Batalkan perubahan teks; Owner | `.textcancel (khusus Owner)` | Khusus Owner bot |
| Owner | `textedit` | Pratinjau perubahan teks; Owner | `.textedit mainMenu \| Teks menu baru (khusus Owner)` | Khusus Owner bot |
| Owner | `textlist` | Daftar teks yang bisa diedit Owner | `.textlist (khusus Owner)` | Khusus Owner bot |
| Owner | `textrestore` | Pulihkan backup konten berdasarkan nomor; Owner | `.textrestore 1 (khusus Owner)` | Khusus Owner bot |
| Owner | `textsave` | Konfirmasi dan simpan perubahan teks; Owner | `.textsave (khusus Owner)` | Khusus Owner bot |
| Owner | `textshow` | Tampilkan teks berdasarkan kunci; Owner | `.textshow mainMenu (khusus Owner)` | Khusus Owner bot |
| Owner | `tickets` | Daftar tiket bantuan yang masih terbuka; Owner | `.tickets 10 (khusus Owner)` | Khusus Owner bot |
| Progres Pemain | `player` | Lihat profil, level, XP, koin, inventaris, pencapaian, peringkat XP, dan peringkat koin | `.player, .player top, atau .player topkoin` | Anggota; membutuhkan MongoDB |
| Proteksi Grup | `alltag` | Sebut anggota grup | `.alltag Pengumuman penting` | Admin grup |
| Proteksi Grup | `antilink` | Atur filter tautan grup | `.antilink on` | Admin grup untuk mengubah pengaturan |
| Proteksi Grup | `antispam` | Atur filter spam grup | `.antispam on` | Admin grup untuk mengubah pengaturan |
| Proteksi Grup | `antitoxic` | Filter kata grup berbasis daftar kata yang disusun Admin; nonaktif secara default, pencocokan kata utuh, dan tidak menggunakan penilaian AI | `.antitoxic tambah spamkata / .antitoxic on / .antitoxic daftar` | Admin grup untuk perubahan; rules dapat dibaca anggota |
| Proteksi Grup | `clearwarn` | Hapus peringatan anggota | `.clearwarn @anggota` | Admin grup |
| Proteksi Grup | `daftaridanggota` | Daftar ID anggota | `.daftaridanggota` | Admin grup atau Owner bot |
| Proteksi Grup | `goodbye` | Atur pesan perpisahan anggota keluar | `.goodbye on atau .goodbye teks Sampai jumpa {name}` | Admin grup |
| Proteksi Grup | `groupid` | Alias ID grup | `.groupid` | Anggota |
| Proteksi Grup | `hidetag` | Kirim pengumuman dengan tag tersembunyi | `.hidetag Pengumuman penting` | Admin grup |
| Proteksi Grup | `idanggota` | Lihat ID anggota/akun | `.idanggota` | Anggota |
| Proteksi Grup | `idgrup` | Lihat ID grup | `.idgrup` | Anggota |
| Proteksi Grup | `jid` | Lihat ID chat/akun | `.jid` | Anggota |
| Proteksi Grup | `kick` | Keluarkan anggota; admin grup | `.kick @anggota` | Admin grup |
| Proteksi Grup | `memberid` | Alias ID anggota | `.memberid` | Anggota |
| Proteksi Grup | `modlogs` | Lihat riwayat moderasi | `.modlogs` | Bergantung subperintah; beberapa khusus admin grup |
| Proteksi Grup | `modpreset` | Pratinjau preset proteksi grup lalu terapkan hanya dengan konfirmasi eksplisit Admin grup atau Owner; field yang tidak disebut tidak diubah. | `.modpreset preview proteksi-dasar / .modpreset apply proteksi-dasar konfirmasi` | Admin grup atau Owner; preview lalu konfirmasi untuk menerapkan |
| Proteksi Grup | `modstatus` | Lihat status read-only anti-link, anti-spam, filter kata, welcome, goodbye, dan aturan grup saat ini. | `.modstatus` | Anggota grup; hanya baca |
| Proteksi Grup | `mute` | Batasi pengiriman pesan grup | `.mute` | Admin grup |
| Proteksi Grup | `open` | Buka kembali pengiriman pesan grup | `.open` | Admin grup |
| Proteksi Grup | `polling` | Buat polling bila didukung klien | `.polling Pilih tema acara` | Bergantung subperintah; beberapa khusus admin grup |
| Proteksi Grup | `report` | Laporkan dugaan pelanggaran di grup | `.report @anggota \| alasan laporan` | Anggota untuk membuat laporan di grup |
| Proteksi Grup | `reports` | Daftar laporan yang masih terbuka; Owner | `.reports 10 (khusus Owner)` | Admin grup untuk laporan grupnya; Owner untuk laporan global |
| Proteksi Grup | `rules` | Lihat aturan grup | `.rules` | Anggota untuk membaca; Admin grup untuk mengubah |
| Proteksi Grup | `setrules` | Ubah aturan grup; admin grup | `.setrules Hormati anggota lain` | Admin grup |
| Proteksi Grup | `warn` | Beri peringatan kepada anggota | `.warn @anggota spam` | Admin grup |
| Proteksi Grup | `warnings` | Lihat peringatan anggota | `.warnings @anggota` | Bergantung subperintah; beberapa khusus admin grup |
| Proteksi Grup | `welcome` | Atur pesan selamat datang dan teks khusus anggota baru | `.welcome on atau .welcome teks Selamat datang {name} di {group}` | Admin grup |
| RPG Pixel Realm | `pixelrealm` | RPG petualangan WhatsApp dengan karakter, pertarungan, crafting, guild, dan progres tersimpan. | `.pixelrealm status` | Anggota |
| RPG Pixel Realm | `pr` | Pintasan singkat Pixel Realm; .pr mulai, .pr status, .pr fox | `.pr mulai` | Anggota |
| Tools Desain | `addasset` | Tambahkan aset ke perpustakaan; admin grup | `.addasset (ikuti pertanyaan bot)` | Admin grup |
| Tools Desain | `akses` | Lihat peran dan status akses akun | `.akses` | Anggota |
| Tools Desain | `assetid` | Detail aset berdasarkan ID | `.assetid AST-123` | Anggota |
| Tools Desain | `assets` | Cari aset desain | `.assets texture kertas` | Anggota; database diperlukan untuk pencarian aset |
| Tools Desain | `assetsinfo` | Alias detail aset | `.assetsinfo AST-123` | Anggota |
| Tools Desain | `assetsstats` | Statistik perpustakaan aset | `.assetsstats` | Anggota |
| Tools Desain | `bingimages` | Alias pencarian gambar Bing | `Ketik .bingimages Yae Miko` | Anggota; pencarian gambar Bing terpisah dari Pinterest |
| Tools Desain | `bingsearch` | Cari dan kirim gambar dari Bing Images saja | `Ketik .bingsearch Yae Miko atau .bingsearch Yae Miko 3` | Anggota; pencarian gambar Bing terpisah dari Pinterest |
| Tools Desain | `brandkit` | Buat brand kit awal berisi arah visual, palet, tipografi, tone, dan aturan penggunaan berdasarkan brief | `.brandkit Kopi Senja \| kopi lokal \| pekerja kreatif \| natural premium (premium)` | Pelanggan aktif atau Owner bot |
| Tools Desain | `briefbuilder` | Wizard brief desain tujuh langkah untuk tujuan, audiens, platform, gaya, warna, dan batasan | `.briefbuilder` | Anggota; .brandkit dan .pricing khusus pelanggan aktif, .sub khusus Owner |
| Tools Desain | `briefwizard` | Alias wizard brief desain | `.briefwizard` | Anggota |
| Tools Desain | `checklist` | Checklist pemeriksaan desain sebelum publikasi | `.checklist poster` | Anggota |
| Tools Desain | `colorconvert` | Konversi warna HEX, RGB, dan HSL dua arah | `.colorconvert #2D6CDF` | Anggota; .brandkit dan .pricing khusus pelanggan aktif, .sub khusus Owner |
| Tools Desain | `colorpalette` | Koleksi palet kurasi dengan preview warna PNG, pencarian, palet acak, dan generator harmoni HEX | `.colorpalette ocean / .colorpalette random / .colorpalette search blue` | Anggota |
| Tools Desain | `compress` | Kompres gambar | `Balas gambar dengan .compress` | Anggota; membutuhkan gambar atau argumen sesuai perintah |
| Tools Desain | `contrast` | Hitung rasio kontras teks dan latar menurut WCAG | `.contrast #222222 #FFFFFF` | Anggota |
| Tools Desain | `critique` | Kirim karya untuk menerima kritik dalam grup | `.critique` | Anggota; .critique dan .rate untuk peer-review grup |
| Tools Desain | `crop` | Potong gambar berdasarkan rasio | `Balas gambar dengan .crop 4:5` | Anggota; membutuhkan gambar atau argumen sesuai perintah |
| Tools Desain | `designcritique` | Rubrik evaluasi hierarki, komposisi, keterbacaan, warna, tipografi, kesesuaian brief, dan kesiapan produksi; analisis gambar AI opsional | `.designcritique poster acara` | Anggota; .critique dan .rate untuk peer-review grup |
| Tools Desain | `designflow` | Rancang alur produksi desain dari brief, konsep, layout, visual system, QA, hingga handoff; dapat disimpan sebagai proyek. | `.designflow web \| toko kopi modern \| pelanggan 18+ \| mobile-first` | Anggota; .brandkit dan .pricing khusus pelanggan aktif, .sub khusus Owner |
| Tools Desain | `designproject` | Designer Workspace 2.0: simpan preset pribadi, pantau progress enam tahap, buka panduan tahap, tandai selesai, buka ulang, duplikasi, dan export brief. | `.designproject start Kopi Senja \| web \| toko kopi modern \| pelanggan \| mobile-first` | Anggota; .brandkit dan .pricing khusus pelanggan aktif, .sub khusus Owner |
| Tools Desain | `designqa` | Checklist Design QA untuk memeriksa kesiapan poster, sosial, logo, cetak, kemasan, web, atau app | `.designqa poster` | Anggota; .brandkit dan .pricing khusus pelanggan aktif, .sub khusus Owner |
| Tools Desain | `designsystem` | Lihat designsystem untuk petunjuk subperintah dan format lengkap. | `.designsystem futuristik` | Anggota; .brandkit dan .pricing khusus pelanggan aktif, .sub khusus Owner |
| Tools Desain | `favoriteassets` | Lihat atau kelola aset favorit | `.favoriteassets` | Anggota |
| Tools Desain | `fontstudio` | Typography Pairing Studio 2.0: pairing font berdasarkan mood dan jenis desain, lengkap dengan contoh hierarki | `.fontstudio elegan poster` | Anggota |
| Tools Desain | `handoff` | Lihat handoff untuk petunjuk subperintah dan format lengkap. | `.help handoff` | Anggota; .brandkit dan .pricing khusus pelanggan aktif, .sub khusus Owner |
| Tools Desain | `hd` | Tingkatkan resolusi gambar jika dependensi dan format mendukung | `Balas gambar dengan .hd` | Anggota; membutuhkan gambar atau argumen sesuai perintah |
| Tools Desain | `imageinfo` | Alias informasi gambar | `Kirim gambar lalu ketik .imageinfo` | Anggota |
| Tools Desain | `imgconvert` | Konversi gambar ke JPG, PNG, atau WebP | `Balas gambar dengan .imgconvert webp 82` | Anggota; membutuhkan gambar atau argumen sesuai perintah |
| Tools Desain | `info` | Tampilkan informasi gambar yang dikirim atau dibalas | `Kirim gambar lalu ketik .info` | Anggota |
| Tools Desain | `kategoriassets` | Daftar kategori aset | `.kategoriassets` | Anggota; database diperlukan untuk pencarian aset |
| Tools Desain | `layoutstudio` | Layout & Composition Studio: grid, hierarki, dan komposisi poster, feed, banner, website | `.layoutstudio poster` | Anggota |
| Tools Desain | `moodboard` | Susun arah visual moodboard: suasana, palet warna awal, tipografi, imagery, komposisi, dan keyword referensi | `.moodboard kedai kopi \| sage dan krem \| minimal natural` | Anggota; .brandkit dan .pricing khusus pelanggan aktif, .sub khusus Owner |
| Tools Desain | `newassets` | Aset terbaru | `.newassets` | Anggota; database diperlukan untuk pencarian aset |
| Tools Desain | `palette` | Fitur palet gambar untuk perintah pengolahan gambar | `Balas gambar dengan .palette` | Anggota; membutuhkan gambar atau argumen sesuai perintah |
| Tools Desain | `palettekit` | Ubah palet menjadi peran warna, token CSS siap salin, dan rekomendasi kontras WCAG | `.palettekit ocean` | Anggota |
| Tools Desain | `paletteview` | Lihat paletteview untuk petunjuk subperintah dan format lengkap. | `.help paletteview` | Anggota; .brandkit dan .pricing khusus pelanggan aktif, .sub khusus Owner |
| Tools Desain | `pinsearch` | Buka tautan pencarian Pinterest berdasarkan kata kunci | `Ketik .pinsearch Yae Miko` | Anggota; mengambil gambar pin publik tanpa API jika Pinterest mengizinkan akses |
| Tools Desain | `pinterest` | Alias tautan pencarian Pinterest | `Ketik .pinterest Yae Miko` | Anggota; mengambil gambar pin publik tanpa API jika Pinterest mengizinkan akses |
| Tools Desain | `pricing` | Kalkulator estimasi harga desain; pelanggan aktif | `.pricing 5 50000 25000 (premium)` | Pelanggan aktif atau Owner bot |
| Tools Desain | `qareview` | Design QA Review: periksa kontras, hierarki, tipografi, dan kesiapan produksi dari angka yang diisi | `.qareview web teks=#222222 latar=#FFFFFF body=16 judul=32 font=2 tap=44` | Anggota; .brandkit dan .pricing khusus pelanggan aktif, .sub khusus Owner |
| Tools Desain | `randomassets` | Tampilkan aset acak | `.randomassets` | Anggota; database diperlukan untuk pencarian aset |
| Tools Desain | `rate` | Beri rating pada karya yang sedang dibahas | `.rate 5` | Anggota; .critique dan .rate untuk peer-review grup |
| Tools Desain | `ratio` | Hitung rasio gambar | `Balas gambar dengan .ratio` | Anggota; membutuhkan gambar atau argumen sesuai perintah |
| Tools Desain | `requestassets` | Ajukan permintaan aset | `.requestassets tekstur kertas` | Anggota; database diperlukan untuk pencarian aset |
| Tools Desain | `resize` | Ubah ukuran gambar | `Balas gambar dengan .resize 1080 1080` | Anggota; membutuhkan gambar atau argumen sesuai perintah |
| Tools Desain | `resourcefind` | Design Resource Finder: direktori sumber font, ikon, mockup, tekstur, dan aset beserta catatan lisensi | `.resourcefind font serif` | Anggota |
| Tools Desain | `revision` | Template brief revisi desain | `.revision` | Anggota |
| Tools Desain | `searchassets` | Cari aset dengan kata kunci | `.searchassets tekstur kertas` | Anggota; database diperlukan untuk pencarian aset |
| Tools Desain | `socialkit` | Social Media Design Toolkit: ukuran kanvas, safe area, dan checklist carousel | `.socialkit instagram_story` | Anggota |
| Tools Desain | `sticker` | Buat stiker dari media yang didukung | `Balas gambar dengan .sticker` | Anggota; membutuhkan gambar atau argumen sesuai perintah |
| Tools Desain | `sticker1:1` | Buat stiker dengan rasio persegi dari media yang didukung | `Balas gambar dengan .sticker1:1` | Anggota; membutuhkan gambar atau argumen sesuai perintah |
| Tools Desain | `sub` | Kelola langganan fitur premium; khusus Owner untuk perubahan | `.sub list (khusus Owner)` | Khusus Owner bot untuk grant/revoke/list/status |
| Tools Desain | `typescale` | Buat skala ukuran tipografi dengan rasio modular | `.typescale 16 1.25 5` | Anggota; .brandkit dan .pricing khusus pelanggan aktif, .sub khusus Owner |
| Tools Desain | `typography` | Typography Studio: hierarki font, panduan ukuran digital/cetak, dan pemeriksaan konsistensi tipografi | `.typography check digital \| Inter, Playfair Display \| 12 14 16* 24 32 48 \| 1.5` | Anggota; .brandkit dan .pricing khusus pelanggan aktif, .sub khusus Owner |
| Tools Desain | `uxaudit` | Lihat uxaudit untuk petunjuk subperintah dan format lengkap. | `.uxaudit bot` | Anggota; .brandkit dan .pricing khusus pelanggan aktif, .sub khusus Owner |
| Tools Desain | `uxflow` | Lihat uxflow untuk petunjuk subperintah dan format lengkap. | `.uxflow marketplace` | Anggota; .brandkit dan .pricing khusus pelanggan aktif, .sub khusus Owner |
| Tools Desain | `wizard` | Panduan percakapan untuk menyusun brief desain langkah demi langkah | `.wizard` | Anggota |
| Utilitas & Info | `cuaca` | Tampilkan kondisi cuaca saat ini, suhu terasa, kelembapan, curah hujan, angin, dan rentang suhu harian berdasarkan nama kota | `.cuaca Bandung` | Anggota; memerlukan koneksi internet; cuaca memakai Open-Meteo dan info gempa memakai BMKG |
| Utilitas & Info | `gempa` | Tampilkan informasi gempa terbaru dari BMKG beserta magnitudo, kedalaman, lokasi, koordinat, dan potensi dampak | `.gempa` | Anggota; memerlukan koneksi internet; cuaca memakai Open-Meteo dan info gempa memakai BMKG |
| Utilitas & Info | `weather` | Alias perintah cuaca berdasarkan nama kota | `.weather Bandung` | Anggota; memerlukan koneksi internet; cuaca memakai Open-Meteo dan info gempa memakai BMKG |
| Utilitas & Sistem | `backup` | Cadangkan database; khusus Owner bot | `.backup` | Khusus Owner bot |
| Utilitas & Sistem | `level` | Lihat level aktivitas dan XP | `.level` | Anggota |

## Catatan

- Izin dapat berbeda per subperintah; teks kolom akses adalah ringkasan, bukan pengganti pemeriksaan izin runtime.
- Marketplace menggunakan handler tersendiri dan beberapa perintah bergantung pada MongoDB.
- `.game` menyediakan bantuan runtime untuk subperintah Pixel Realm.
- Perintah yang muncul di katalog tidak menjamin semua dependensi eksternal sedang tersedia.
