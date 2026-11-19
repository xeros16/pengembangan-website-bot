# PIR Visuals website 3.67.1

The 3.67 series refreshes the website and hardens its shared portfolio and client workflows. The bot version remains 6.7.13.

- [Installation and deployment](docs/PIR-3.67-DEPLOYMENT.md)
- [Technical audit](docs/PIR-3.67-AUDIT.md)
- [QA results](docs/PIR-3.67-QA.md)
- [3.67.1 release and verification](docs/PIR-3.67.1-RELEASE.md)
- [3.67.0 release notes](docs/PIR-3.67-RELEASE.md)

The project history follows.

## PIR Visuals Bot v6.7.6 — Upload Preview & Workspace Navigation Fix

- `.portfolio add` now accepts one JPEG, PNG, WebP, or SVG file directly in a private WhatsApp chat.
- Portfolio upload limit is 15 MB per file. The general-purpose bot media limit remains unchanged.
- Website Designer Studio accepts the same four formats, up to five files per work and 15 MB per file. SVG is converted in the browser to WebP before upload; server fallback uses 72 DPI for large Figma exports.
- SVG files are validated and converted to WebP before storage, preventing active SVG markup from being served to public visitors.
- Bot and website share the same `PORTFOLIO_UPLOAD_DIR` and `portfolioitems` collection. Owner moderation remains required.

# PIR Visuals Bot v6.7.3

# PIR Visuals — Bot WhatsApp Komunitas Desain

Bot komunitas untuk membantu desainer, mengelola komunitas, dan menyediakan Game Center dengan delapan permainan utama. Proyek ini menggunakan Node.js, Baileys, dan MongoDB. Rilis bot saat ini: **v6.7.3** (website PIR Visuals v3.50.0).

## PIR Visuals v6.7.3 — Text-Only Menu & Complete Feature Catalog

- Menghapus poster/gambar dari `.menu`, `.help` tanpa topik, dan `.fitur`; ketiganya sekarang hanya mengirim teks.
- Mengubah `.fitur` agar langsung menampilkan seluruh command terdaftar, dikelompokkan per kategori dengan format daftar teks seperti referensi yang diberikan.
- Katalog lengkap dibangun dari `COMMAND_CATALOG`, sehingga penambahan command pada registry otomatis ikut tampil.
- Mempertahankan pencarian `.fitur cari`, filter `.fitur kategori`, katalog ringkas `.fitur semua`, workflow `.fitur alur`, dan bantuan `.help <perintah>`.
- Tidak ada dependency baru, perubahan database, atau migrasi.

See `RELEASE-NOTES-v6.7.3.md`, `QA_REPORT_v6_7_3.md`, and `INSTALL_UPDATE_v6_7_3.md`.

## PIR Visuals v6.7.2 — Voice Lab & Local Information

- Menambahkan Voice Lab dengan efek bass, treble, clean, compressor, pitch, tempo, 8D, robot, echo, reverb, karaoke sederhana, dan lainnya.
- Efek diterapkan dengan membalas voice note/audio atau memakai `.voice <efek>`; memerlukan FFmpeg.
- Menambahkan `.cuaca <kota>` melalui Open-Meteo dan `.gempa` melalui feed gempa terbaru BMKG.
- Menyediakan menu kategori `.menu musik` dan `.menu info`, serta panduan `.help`, `.alur suara`, dan `.alur info`.
- Memperluas Command Explorer dan Creative Studio dengan panduan Voice Lab serta utilitas informasi lokal.
- Tidak ada dependency npm baru atau migrasi database.

See `RELEASE-NOTES-v6.7.2.md`, `QA_REPORT_v6_7_2.md`, and `INSTALL_UPDATE_v6_7_2.md`.

## PIR Visuals v6.7.1 — Illustrated Feature Menu (superseded in v6.7.3)

- `.menu`, `.help` tanpa topik, dan `.fitur` kini mengirim poster menu bergambar dengan enam kategori utama.
- Pesan teks lengkap tetap dikirim setelah poster agar command dapat disalin, dicari, dan dibaca oleh pembaca layar.
- Jika file gambar tidak tersedia atau pengiriman media gagal, bot otomatis kembali ke menu teks.
- Menu menampilkan command inti Design, Image & Media, Learning & Community, Portfolio, Group & Support, serta Games & Entertainment.
- Website package tetap 3.50.0; tidak ada dependency, database schema, atau index baru.

See `RELEASE-NOTES-v6.7.1.md`, `QA_REPORT_v6_7_1.md`, and `INSTALL_UPDATE_v6_7_1.md`.

## PIR Visuals v6.7.0 — Feature Discovery, Anime Resilience & Apple Music Preview

- Menambahkan `.fitur`, `.features`, dan `.jelajah` sebagai pusat penemuan semua kategori, pencarian bahasa sehari-hari, katalog berpaginasi, dan panduan workflow.
- Menampilkan tautan **Semua Fitur Bot** langsung pada navigasi utama website.
- Memperkuat `.anime` dengan AniList sebagai provider cadangan otomatis ketika Jikan/MyAnimeList gagal atau rate-limit.
- Menambahkan `.music preview`, `.dl apple`, dan deteksi langsung `.dl <tautan Apple Music>` untuk mengirim preview publik resmi dari Apple jika tersedia.
- Preview Apple dibatasi ke host CDN audio resmi, batas 15 MB, timeout, dan validasi content-type; tidak mengunduh lagu penuh atau melewati DRM.
- Bot package 6.7.0; website package 3.50.0. Tidak ada dependency runtime, koleksi MongoDB, atau index baru.

See `DOCUMENTATION-INDEX-v6.7.0.md`, `RELEASE-NOTES-v6.7.0.md`, `QA_REPORT_v6_7_0.md`, and `INSTALL_UPDATE_v6_7_0.md`.

## PIR Visuals v6.6.0 — Creative Asset Studio & Design Seasons

- Menambahkan Creative Asset Studio dengan koleksi referensi HTTPS privat secara default, atribusi/lisensi, berbagi eksplisit ke grup, kontrol pemilik, dan moderasi Admin. File sumber tidak diunggah ulang.
- Menambahkan Design Seasons dengan 2–8 ronde, satu ronde aktif pada satu waktu, satu season aktif per grup, pengiriman karya sukarela, galeri per grup, peer review, hasil ronde yang dibekukan, dan moderasi Admin.
- Mengembangkan Sticker Studio dengan crop bulat, optimasi ukuran stiker, serta batas resolusi dan ukuran gambar.
- Menambahkan `.music top` untuk metadata chart Apple Indonesia dan tautan resmi Apple Music/iTunes.
- Menambahkan panduan publik `/creative-studio` dan workflow baru pada Command Explorer.
- Menambahkan koleksi dan index MongoDB baru untuk Design Seasons, kiriman ronde, dan Creative Assets.

See `DOCUMENTATION-INDEX-v6.6.0.md`, `RELEASE-NOTES-v6.6.0.md`, `QA_REPORT_v6_6_0.md`, and `INSTALL_UPDATE_v6_6_0.md`.

## PIR Visuals v6.5.1 — Learning Lifecycle, Privacy & Visual System Refinement

- Learning Cohort duration and milestone deadlines now begin when the facilitator starts the program, not when Admin first opens registration.
- Former participants can still view their own retained progress and delete their own cohort data after leaving; their records are excluded from active review queues and active-member aggregates.
- Downloader URL validation rejects additional private/reserved IPv4 and IPv6 literals plus common private/reserved hostname suffixes.
- Added a same-origin website visual-system layer: restrained diagonal background motif, one asymmetrical organic shape, semantic Light/Dark tokens, unified card surfaces, and spaced mobile navigation actions.
- Command Explorer search now covers guided workflows as well as individual commands, with combined result counts, no-results feedback, and clearer copy fallback.
- Existing Learning Cohort/Checkin indexes remain additive; no new npm runtime dependency or destructive migration. DNS rebinding and redirects still require outbound network restrictions at deployment.

See `DOCUMENTATION-INDEX-v6.5.1.md`, `RELEASE-NOTES-v6.5.1.md`, `QA_REPORT_v6_5_1.md`, and `INSTALL_UPDATE_v6_5_1.md`.

## PIR Visuals v6.4.0 — Community Challenge & Downloader Reliability

- Added `.designcommunity ringkasan` for private, current-group contribution summaries without JID/phone disclosure.
- Added time-limited group-only `.designchallenge battle` creation, opt-in entries, gallery, peer review, final results, and Admin moderation.
- Added read-only `.modstatus` and preview-before-apply `.modpreset` with explicit confirmation.
- Added public `/commands` Command Explorer generated from the same command registry as WhatsApp help, including search, category filters, and copy-example buttons.
- Improved downloader with one retry only for network/429, per-user status and active cancellation, optional FFprobe metadata, and extension-based audio MIME.
- Bot package 6.4.0; website package 3.47.0. No new npm dependency; additive DesignBattle collection/indexes.
- Live WhatsApp, MongoDB, downloader, and browser staging remain required before Stable.

See `DOCUMENTATION-INDEX-v6.4.0.md`, `RELEASE-NOTES-v6.4.0.md`, `QA_REPORT_v6_4_0.md`, `INSTALL_UPDATE_v6_4_0.md`, and the feature documents in `docs/`.

## PIR Visuals v6.2.0 — Balanced Bot Expansion & Anime Discovery

- Added `.anime cari`, `.anime populer`, `.anime musim`, and `.anime detail` using the public Jikan API / MyAnimeList data.
- Anime discovery is search/information only; it does not provide streaming or copyrighted downloads.
- Added request pacing, short-lived response caching, safe-for-work API filtering, input validation, timeout handling, and clear API error messages.
- Registered the command in `.help`, `.menu anime`, `.commands`, natural-language search, and generated `docs/commands.md`.
- No new runtime dependency, database migration, or website package change.
- Established a balanced release policy: every release includes core PIR work plus at least one general/multifunction bot feature (anime, music, media, downloader, utilities, or similar).

See `RELEASE-NOTES-v6.2.0.md`, `QA_REPORT_v6_2_0.md`, `INSTALL_UPDATE_v6_2_0.md`, and `docs/ANIME-DISCOVERY-v6.2.0.md`.

## PIR Visuals v6.1.0 — WhatsApp Workflow & Group Safety Upgrade

- Design Brief Wizard now saves progress per account and chat in MongoDB for up to 24 hours; users can resume after a restart, go back, restart, check status, or delete a draft.
- Added `.antitoxic` as an Admin-managed per-group whole-word filter. It is OFF by default, has no AI classification, and never automatically kicks/bans members.
- Automatic moderation records warnings and gives an Admin review reminder at three warnings in a rolling 30-day window.
- Added a TTL index for expired brief drafts and a database verifier check for its compound/TTL indexes.
- Website remains unchanged; no new runtime dependency.

See `RELEASE-NOTES-v6.1.0.md`, `QA_REPORT_v6_1_0.md`, `INSTALL_UPDATE_v6_1_0.md`, and `docs/SHIROINE-BENCHMARK-v6.1.0.md`.

## PIR Visuals v6.0.0 — Bot Experience & Intelligence Upgrade

- `.cepat` gives members a private command center for up to eight favorites.
- Recent-command history is OFF by default, explicitly opt-in, and stores only public command names (never arguments or message content).
- Quick Access screens are private-chat only.
- Main menu, onboarding, command catalog, and natural-language search expose the new feature.
- Fixed hard-coded command prefixes in Learning Path, Challenge, Community Hub, and Design tutorials.
- Website remains v3.46.0; this is a bot-focused release with no schema migration or new runtime dependency.

See `RELEASE-NOTES-v6.0.0.md`, `QA_REPORT_v6_0_0.md`, `INSTALL_UPDATE_v6_0_0.md`, and `docs/QUICK-ACCESS-v6.0.0.md`.

## PIR Visuals v5.99.0 — Designer Intelligence & Platform Growth

- `/discover` now includes a guided finder for creative category, skill, budget, location, and optional keywords.
- Designer fit ordering uses transparent public-profile signals; featured and PIR-reviewed labels do not add ranking points.
- Match reasons are shown on results so visitors can understand why a profile appears.
- Designer Studio adds a private Portfolio Readiness checklist with actionable links to profile, portfolio, case-study, contact, and service sections.
- Readiness is a completeness checklist, not a professional-quality rating or public ranking.
- The bot remains a directory and direct-contact channel; optional website workspace remains non-transactional.

See `RELEASE-NOTES-v5.99.0.md`, `QA_REPORT_v5_99_0.md`, `INSTALL_UPDATE_v5_99_0.md`, and `docs/ROADMAP.md`.

## PIR Visuals v5.98.0 — Automation, Privacy & End-to-End Experience

- Push WhatsApp Designer Studio notifications now require explicit opt-in, use a private destination, default quiet hours (22.00–08.00 WIB), retry/lease queue, and keep the manual inbox as fallback.
- Linked designers can open their private notification inbox without broadening general inbound bot access or group permissions.
- Client Project Workspace supports designer-controlled revocation of all client sessions and pending invitation links; access/invite attempts are rate-limited.
- Added an isolated MongoDB + portfolio-media backup/restore verification command.
- Added optional Playwright browser E2E tests for public discovery, protected workspace routes, and mobile layout.
- Bot remains a directory/direct-contact channel; website workspace remains optional and non-transactional.

See `RELEASE-NOTES-v5.98.0.md`, `QA_REPORT_v5_98_0.md`, `INSTALL_UPDATE_v5_98_0.md`, and `docs/ROADMAP.md`.

## PIR Visuals v5.97.0 — Directory Quality, Trust & Hybrid Workspace

- Direktori website memiliki pagination 24 hasil, filtered count, relevance ranking, newest sorting, dan budget range-overlap.
- Badge `isVerified` ditampilkan sebagai “Profil ditinjau PIR”; testimoni membedakan verifikasi email dari verifikasi hubungan klien/transaksi.
- Designer dapat opt-in menampilkan tanggal/status availability pada profil publik; catatan kalender tetap privat.
- Project workspace tetap opsional di website, sementara bot tetap direktori portfolio dan kontak langsung.
- Tidak ada payment, checkout, komisi, escrow, atau transaksi PIR.

Lihat `RELEASE-NOTES-v5.97.0.md`, `QA_REPORT_v5_97_0.md`, dan `docs/PRODUCT-FEATURE-AUDIT-v5.97.0.md`.

## PIR Visuals v5.96.0 — Website ↔ Bot Integration

- Profil, portofolio, kontak publik, dan analytics memakai kontrak database bersama antara website dan bot.
- `.studio` menampilkan ringkasan read-only Designer Studio di chat pribadi.
- `.portfolio notifikasi` dan `.portfolio notifikasi semua` membaca inbox website secara privat.
- Kontak calon klien tetap diarahkan langsung ke desainer; tidak ada checkout, pembayaran, komisi, atau transaksi melalui bot.
- Menambahkan pemeriksaan konfigurasi integrasi, verifier koleksi/index database, deployment smoke test, dan CI workflow.
- Menambahkan panduan pengembangan lokal serta staging acceptance.

Lihat `RELEASE-NOTES-v5.96.0.md` dan `QA_REPORT_v5_96_0.md`.

## PIR Visuals v5.95.0 — Production Readiness & Support Hardening

- `.ticket detail <ID>` menampilkan percakapan terbaru untuk pemilik tiket, Admin grup asal, atau Owner tanpa membocorkan JID.
- Pemilik tiket dapat membaca tiket sendiri dari chat mana pun; Admin tetap dibatasi pada grup asal.
- Throttling best-effort membatasi lima tiket baru per akun per 24 jam dan tiga laporan per anggota/grup per 10 menit, di samping batas tiga tiket terbuka.
- Menambahkan indeks waktu untuk query pembatasan tiket dan laporan.
- Pengujian penuh dan staging produksi masih wajib sebelum stable release.

Lihat `docs/SUPPORT-CENTER.md`, `QA_REPORT_v5_95_0.md`, dan `INSTALL_UPDATE_v5_95_0.md`.

## PIR Visuals v5.94.0 — Product Stabilization & Support System

Rilis ini memulai fase stabilisasi produk dengan menyatukan jalur bantuan, memperbaiki isolasi akses tiket/laporan, dan meningkatkan diagnostik kesehatan bot.

- `.support` menyediakan pusat bantuan, FAQ dengan pencarian kata kunci, petunjuk tiket, dan pelaporan grup.
- `.ticket buka` membuat tiket dengan batas maksimal tiga tiket terbuka per akun; `.ticket saya` menampilkan tiket milik pengguna.
- Admin grup hanya dapat melihat, membalas, atau menutup tiket dari grup asal. Owner dapat menangani tiket lintas grup.
- Pemilik tiket dapat menutup tiket sendiri; balasan menyimpan maksimal 100 pesan terakhir.
- `.reports detail` dan `.reports tutup` memberi alur tindak lanjut laporan yang dibatasi ke grup asal; Owner memiliki akses global.
- Output tiket/laporan grup memakai display name dan tidak menampilkan JID internal.
- `.health` kini menampilkan status lifecycle koneksi WhatsApp selain status MongoDB, uptime, memori, dan antrean.
- `.support`, `.ticket`, `.report`, dan `.reports` tetap tersedia ketika maintenance mode aktif.
- Perubahan skema Report/Ticket bersifat additive; tidak ada migrasi destruktif.

Lihat [`docs/SUPPORT-CENTER.md`](docs/SUPPORT-CENTER.md), `QA_REPORT_v5_94_0.md`, dan `INSTALL_UPDATE_v5_94_0.md`.

## PIR Visuals v5.93.0 — Community Intelligence & Engagement

Rilis ini mengembangkan Learning Path dan Community Challenge menjadi Community Hub yang menghubungkan profil komunitas, mentor matching, milestone kontribusi, dan proyek kolaborasi.

- `.designcommunity mentor <topik>` mengaktifkan profil mentor secara sukarela; `.designcommunity belajar <topik>` mencatat topik yang ingin dipelajari.
- `.designcommunity cari <topik>` mencari mentor dan `.designcommunity cari belajar <topik>` menemukan pembelajar yang opt-in pada grup yang sama; `.designcommunity off` menonaktifkan visibilitas dan `.designcommunity hapus` menghapus profil komunitas pada grup tersebut.
- `.designcommunity badges` menghitung milestone dari progress belajar, karya tantangan, peer review, dan kolaborasi; milestone bukan sertifikasi atau penilaian kualitas.
- Collaboration Board mendukung pembuatan proyek, daftar proyek terbuka, bergabung, keluar, dan penutupan oleh pemilik/Admin grup.
- Proyek memiliki kapasitas 2–5 orang, maksimal tiga proyek terbuka per pemilik per grup, serta kode unik.
- Profil dan proyek dibatasi dengan `groupJid`; tidak ada nomor kontak pribadi, publikasi lintas grup, transaksi, kontrak, atau pembayaran.
- Menambahkan `CommunityProfile` dan `CommunityCollaboration` collections serta indeks unik dan pencarian grup.

Lihat [`docs/COMMUNITY-HUB.md`](docs/COMMUNITY-HUB.md), `QA_REPORT_v5_93_0.md`, dan `INSTALL_UPDATE_v5_93_0.md`.

## PIR Visuals v5.92.0 — Learning Path & Community Challenge

Rilis ini menghubungkan materi belajar, tantangan desain, galeri grup, dan peer review menjadi satu pengalaman komunitas.

- `.designlearn jalur` menampilkan kurikulum 12 modul untuk pemula, menengah, dan lanjutan.
- `.designlearn mulai <level> <topik>` menyimpan materi aktif per akun; `.designlearn selesai` menandai materi selesai berdasarkan konfirmasi mandiri.
- `.designlearn lanjut` mengarahkan ke materi berikutnya dan `.designlearn progress` menampilkan progress pribadi.
- Progress disimpan pada `User.preferences.learningProgress`; tidak memerlukan migrasi skema User.
- `.designchallenge harian|mingguan` memakai kalender WIB (Asia/Jakarta), bukan pergantian UTC.
- Anggota dapat mengirim karya ke grup, melihat galeri grup, memberi peer review satu kali per karya, dan melihat statistik partisipasi; Admin grup/Owner dapat menyembunyikan atau memulihkan kiriman.
- Profil, portofolio, analytics, dan notifikasi Designer Studio terintegrasi dengan website melalui database bersama; notifikasi dibaca secara privat melalui `.portfolio notifikasi`.
- Kiriman, galeri, feedback, dan papan kontributor dibatasi berdasarkan `groupJid`; tidak otomatis masuk ke direktori portofolio publik.
- Karya dikirim sebagai gambar pada pesan grup atau tautan HTTPS. Bot tidak mengambil/meng-host file karya dari tautan.
- Tidak ada penilaian AI, sertifikasi, hadiah otomatis, transaksi, atau publikasi karya lintas grup.

Lihat [`docs/LEARNING-COMMUNITY.md`](docs/LEARNING-COMMUNITY.md) dan `QA_REPORT_v5_92_0.md`.

## PIR Visuals v5.91.0 — Designer Portfolio & Direct Contact Directory

Rilis ini menetapkan batas produk marketplace bot secara tegas: **direktori portofolio dan kontak langsung saja**.

- Calon klien mencari desainer berdasarkan karya, kategori, gaya, lokasi, dan kata kunci melalui `.design`.
- `.designer DSN-ID` menampilkan profil, karya yang sudah disetujui, dan kanal kontak yang dicantumkan secara publik oleh desainer.
- Desainer membuat profil melalui `.portfolio daftar`; nomor WhatsApp hanya ditampilkan jika diisi secara eksplisit melalui wizard atau `.portfolio edit whatsapp 628...`.
- Kontak internal akun tidak pernah digunakan sebagai fallback kontak publik.
- Upload karya dapat dilakukan melalui `.portfolio add` di WhatsApp atau Designer Studio website. JPEG, PNG, WebP, dan SVG didukung hingga 15 MB per file; semua karya tetap melewati moderasi Owner.
- `.studio` sekarang berfokus pada status portofolio, profile views, portfolio views, dan contact clicks.
- Owner mengelola keamanan direktori melalui `.marketadmin designers`, `pending`, `reports`, dan `activity`.
- Brief pesanan, penawaran, pemilihan desainer, order state, checkout, payment gateway, ledger pembayaran manual, escrow, komisi, mediasi, dan sengketa tidak tersedia melalui bot.
- Perintah lama `.requestdesign`, `.client`, `.klien`, `.service`, dan `.layanan` hanya memberi pesan migrasi; tidak menjalankan alur transaksi.
- Skema database lama untuk pesanan/pembayaran dipertahankan tanpa dioperasikan agar data historis tidak terhapus saat update.

Lihat [`docs/MARKETPLACE.md`](docs/MARKETPLACE.md), [`features/design-marketplace/README.md`](features/design-marketplace/README.md), dan `QA_REPORT_v5_91_0.md`.

## PIR Visuals v5.90.0 — Designer Workflow 2.0

Rilis ini menyatukan brief dan tools desain yang sudah tersedia ke dalam pipeline proyek enam tahap tanpa menggandakan command studio.

- Pipeline proyek: Brief → Concept → Layout → Visual System → QA → Handoff.
- `.designproject start` membuat proyek pribadi dan memulai panduan tahap pertama.
- `.designproject step` memberi tujuan, checklist, dan command yang sesuai dengan jenis proyek.
- `.designproject done` menandai tahap aktif selesai berdasarkan konfirmasi pengguna; tahap berikutnya dibuka secara berurutan.
- `.designproject progress` dan `.designproject board` memperlihatkan kemajuan satu atau semua proyek.
- `.designproject reopen` membuka kembali tahap lama dan mengatur ulang tahap sesudahnya.
- Duplikasi proyek memulai workflow baru; progress proyek sumber tidak ikut tersalin.
- Data tetap berada di `User.preferences.designProjects`, tanpa migrasi skema. Proyek lama otomatis dimulai dari tahap Brief.
- Operasi mutasi workspace diserialisasi per akun dalam satu proses untuk mengurangi risiko lost update.

## PIR Visuals v5.89.0 — Beginner Experience & Guided Onboarding

Rilis ini mengembangkan pengalaman anggota baru tanpa mengganti arsitektur command atau menghapus perintah lama.

- `.mulai` menjadi onboarding interaktif dua langkah: pengguna memilih kebutuhan dan tingkat pengalaman.
- Rekomendasi fitur disesuaikan untuk membuat desain, belajar, mengolah gambar, mencari jasa, menawarkan jasa, aktivitas komunitas, atau bermain game.
- Preferensi onboarding disimpan pada `User.preferences.onboarding` jika MongoDB siap; tanpa database, alur tetap berfungsi dan preferensi sementara disimpan di memori proses.
- `.cari <kebutuhan>` menemukan command berdasarkan kalimat sehari-hari; `.commands cari <kata>` menggunakan mesin pencarian yang sama.
- `.alur` diperluas untuk direktori desainer, komunitas, dan game.
- Anggota baru yang mendapat pesan sambutan diarahkan ke `.mulai`, `.cari`, dan `.rules`.
- Semua alur tetap berbasis teks agar kompatibel dengan berbagai klien WhatsApp. Rincian validasi ada di `QA_REPORT_v5_91_0.md`.

## Kandidat v5.19.0 — Security & Access Control

- Bypass Owner hanya berlaku pada chat pribadi dengan identitas terverifikasi.
- Chat grup, termasuk pesan dari Owner, tetap wajib masuk allowlist.
- JID pribadi Owner yang terverifikasi dapat didaftarkan untuk memastikan balasan outbound lolos guard.
- Kandidat ini belum menjadi rilis resmi sampai audit dan pengujian akhir selesai.



## Finalisasi roadmap

Arah produk: **Designer Community & Creative Tools Platform**. Fokus aktif saat ini adalah menyelesaikan platform, bukan terus memperluas ruang lingkup:

- **v5.87.0** — Backend & Operational Stability.
- **v5.88.0** — Final Audit & Release Candidate.
- **v5.89.0** — Beginner Experience & Guided Onboarding.
- **v5.90.0** — Designer Workflow 2.0.
- **v5.94.0** — Product Stabilization & Support System.
- **v6.1.0** — WhatsApp Workflow & Group Safety Upgrade.
- **v6.0.0** — Bot Experience & Intelligence Upgrade.
- **v5.99.0** — Designer Intelligence & Platform Growth.
- **v5.98.0** — Automation, Privacy & End-to-End Experience.
- **v5.97.0** — Directory Quality, Trust & Hybrid Workspace.
- **v5.96.0** — Website ↔ Bot Integration.
- **v5.95.0** — Production Readiness & Support Hardening.
- **v5.93.0** — Community Intelligence & Engagement.
- **v5.92.0** — Learning Path & Community Challenge.
- **v5.91.0** — Designer Portfolio & Direct Contact Directory.
- **Staging** — integrasi WhatsApp, MongoDB, SMTP, media pipeline, dan pemulihan backup tetap harus diverifikasi sebelum produksi.

Catatan pengembangan v5.19–v5.23 di bawah ini dipertahankan sebagai riwayat rencana lama, bukan target aktif. Kriteria penyelesaian terbaru ada di [`docs/ROADMAP.md`](docs/ROADMAP.md).

## Game Center UX (v5.18.0)

- Game Center mencakup enam game utama: Pixel Realm, Tebak-Tebakan, Tebak Angka, Acak Kata, Misteri & Detektif, dan Multiplayer.
- Panduan Multiplayer menjelaskan alur Sambung Kata, Kuis Rebutan, Duel Suit, batas peserta, host, dan penyimpanan sesi.
- Pesan bantuan Multiplayer mengikuti prefix bot yang dikonfigurasi.
- Catatan audit dan batas pengujian: `docs/game-ux-audit-v5.18.0.md`.

## UX teks dan navigasi (v5.16.0)

- Semua menu menggunakan perintah teks, bukan tombol/list interaktif WhatsApp.
- `.menu` membuka beranda; `.menu tools`, `.menu market`, `.menu game`, dan `.menu owner` membuka kategori terkait.
- `.commands` menampilkan katalog perintah per 10 item; `.commands cari <kata>` mencari berdasarkan nama, fungsi, contoh, atau kategori.
- `.help <perintah>` menampilkan fungsi, format, contoh, kategori, dan ringkasan akses.
- Menu kategori historis pernah menampilkan Client Center dan pelacakan pesanan; alur tersebut dinonaktifkan pada v5.91.0.
- Balasan teks dinormalisasi untuk merapikan CRLF, newline literal, tab, karakter spasi khusus, dan escape ANSI.

## Designer Tools — Creative Concept Studio

- `.designflow <jenis> | <tema> | <audiens> | <platform>` — workflow terpadu brief, arahan visual, palet awal, tipografi, spesifikasi, prompt, QA, dan handoff.

- `.creative <topik> | <gaya opsional> | <platform/ukuran opsional>` — menghasilkan tiga arah konsep, arahan fokus/komposisi/warna/tipografi, checklist QA, dan prompt teks siap salin.
- Contoh: `.creative kemasan kopi lokal | organik premium | pouch 250 gram`.
- Kategori proyek yang dikenali: identitas brand, kemasan, antarmuka digital, konten sosial, banner, dan poster/editorial.
- Alur yang disarankan: `.wizard` → `.creative` → `.colorpalette` / `.colorconvert` → `.fontpair` → `.designreview`.
- Hasil merupakan rekomendasi berbasis template dan kata kunci, bukan generasi gambar atau analisis otomatis terhadap file desain.

### Designer Workspace 2.0 — `.designproject`

Preset dan progress proyek disimpan pada `User.preferences.designProjects`, dibatasi maksimal 10 proyek per akun WhatsApp. Setiap proyek memiliki pipeline enam tahap: **brief → concept → layout → visual → QA → handoff**.

- `.designproject start <nama> | <jenis> | <tema> | <audiens> | <platform>` — buat proyek baru dan mulai dari tahap Brief.
- `.designproject template <poster|logo|sosial|web|app|kemasan> | <nama>` — buat proyek dari template awal.
- `.designproject step <nama>` — tampilkan panduan, checklist, dan command yang relevan untuk tahap aktif.
- `.designproject done <nama>` — tandai tahap aktif selesai setelah pekerjaan benar-benar diperiksa; tahap berikutnya terbuka otomatis.
- `.designproject progress <nama>` / `.designproject board` — lihat progress satu proyek atau seluruh proyek.
- `.designproject reopen <nama> | <brief|concept|layout|visual|qa|handoff>` — buka ulang tahap; semua tahap sesudahnya kembali belum selesai.
- `.designproject flow <nama>` — tampilkan design direction dan ringkasan pipeline berdasarkan preset.
- `.designproject save <nama> | <jenis> | <tema> | <audiens> | <platform> | <palet> | <font>` — simpan atau perbarui preset.
- `.designproject edit <nama> | <jenis> | <tema> | <audiens> | <platform> | <palet> | <font>` — ubah field yang diisi; field kosong dipertahankan.
- `.designproject list status progress` atau `.designproject list jenis web` — filter proyek.
- `.designproject search <kata>` — cari nama, jenis, tema, audiens, platform, palet, atau font.
- `.designproject show <nama>` / `.designproject history <nama>` / `.designproject export <nama>` — detail, riwayat, dan ringkasan brief teks.
- `.designproject duplicate <nama> | <nama baru>` — duplikasi data brief sebagai proyek baru dengan workflow kembali ke tahap Brief.
- `.designproject status <nama> | <planning|progress|review|done>` dan `.designproject delete <nama>` — status administrasi proyek.

Fitur memerlukan profil pengguna dan koneksi database aktif. Proyek lama tanpa data workflow otomatis dimulai dari Brief; status proyek lama tidak dianggap sebagai bukti bahwa tahap produksi telah selesai. Setiap operasi membaca dokumen berdasarkan JID akun aktif; belum ada kolaborasi lintas akun atau sinkronisasi file desain. Perintah `done` adalah konfirmasi manual pengguna, bukan pemeriksaan otomatis atas file desain.

## Pencarian gambar Pinterest

- `.pinsearch <kata kunci>` — membuka tautan pencarian Pinterest; tidak memakai API, token, scraping, atau unduhan otomatis.
- `.pinterest <kata kunci>` — alias.
- Contoh: `.pinsearch Yae Miko`.
- Bot hanya membuat tautan pencarian Pinterest untuk dibuka pengguna. Bot tidak mengakses API Pinterest, tidak melakukan scraping, dan tidak mengunduh gambar dari Pinterest.
- Gunakan gambar sesuai lisensi, hak cipta, dan izin pemiliknya.

## Tutorial marketplace bergambar

- `.tutorial` — menu tutorial yang tersedia.
- `.tutorial portfolio` — panduan teks + gambar membuat profil dan menambah karya.
- `.tutorial order` — panduan menemukan profil dan menghubungi desainer secara langsung.
- `.tutorial bukti` — panduan komunikasi langsung dan pemeriksaan portofolio sebelum menyepakati pekerjaan.
- `.tutorial market` — ringkasan penggunaan marketplace.
- `.tutorial perintah` — membuka katalog perintah yang terdaftar.
- Tutorial teks dapat diedit Owner lewat `.textlist`, `.textshow tutorialPortfolio`, `.textedit tutorialPortfolio | teks baru`, lalu `.textsave`.

Aset PNG tutorial berada di `assets/images/tutorials/`. Jika aset gambar tidak tersedia, bot tetap mengirim teks tutorial.

## Katalog perintah dan pengeditan teks

- Ketik `.cari bikin poster acara` untuk menemukan fitur dengan kalimat sehari-hari.
- Ketik `.commands` untuk melihat daftar perintah, fungsi, contoh, kategori, dan akses. Daftar dikirim per halaman.
- Ketik `.commands tools` atau `.commands market` untuk memfilter kategori.
- Ketik `.commands cari ubah ukuran foto` untuk pencarian kebutuhan.
- Ketik `.commands contrast` atau `.help contrast` untuk melihat detail satu perintah.
- Alias daftar: `.perintah` dan `.daftarperintah`.
- Ubah teks menu/bantuan melalui `content/texts.json`; panduan ada di `docs/EDIT-BOT-TEXT.md`.
- Owner bot juga dapat menggunakan `.textlist`, `.textshow <kunci>`, `.textedit <kunci> | <teks>`, lalu `.textsave`.
- Jalankan `npm run docs:commands` untuk membangkitkan ulang `docs/commands.md` dari registry perintah.

## Pintasan Pixel Realm

Gunakan `.pr` sebagai perintah singkat Pixel Realm. Perintah lama `.pixelrealm` tetap didukung.

- `.pr` atau `.pr menu` — menu Pixel Realm.
- `.pr mulai` — mulai membuat karakter.
- `.pr nama NamaKarakter` — isi nama karakter.
- `.pr kelas pendekar` — pilih kelas (pendekar/penyihir/penjelajah).
- `.pr konfirmasi` — aktifkan karakter.
- `.pr status` — lihat profil dan progres.
- `.pr fox`, `.pr wolf`, `.pr slime`, `.pr dragon` — shortcut adopsi pet (setelah karakter aktif).
- `.pr jelajah`, `.pr inventori`, `.pr toko`, `.pr quest` — perintah permainan.

Alias bahasa Inggris juga tersedia: `.pr start`, `.pr name`, `.pr class`, `.pr confirm`, `.pr profile`, `.pr explore`, `.pr inventory`, `.pr shop`, dan `.pr help`.

## Mulai cepat

1. Instal **Node.js LTS** dan jalankan MongoDB.
2. Buka terminal di folder proyek, lalu jalankan `npm install`.
3. Salin `.env.example` menjadi `.env`.
4. Isi `MONGO_URI` dan `OWNER_JIDS` di `.env`. Tambahkan `DESIGN_COMMUNITY_GROUPS` jika fitur portofolio komunitas ingin digunakan.
5. Jalankan pemeriksaan dan tes: `npm run check` lalu `npm test`.
6. Jalankan bot dengan `npm start`, lalu ikuti instruksi QR di terminal untuk menautkan WhatsApp.
7. Di chat bot, ketik `.menu` untuk melihat panduan utama.

> Jangan membagikan `.env`, folder autentikasi WhatsApp, database, backup, atau foto portofolio privat. Rilis bersih ini sengaja tidak menyertakan data lokal atau sesi WhatsApp.

## Kalau baru pertama kali memakai bot

Tidak perlu menghafal semua perintah. Mulai dari pintasan berikut:

| Perintah | Untuk apa |
|---|---|
| `.mulai` | Onboarding interaktif sesuai kebutuhan dan pengalaman |
| `.mulai cepat` | Panduan ringkas tanpa pertanyaan |
| `.mulai profil` | Melihat rekomendasi yang tersimpan |
| `.mulai ulang` | Mengubah pilihan onboarding |
| `.cari bikin poster acara` | Mencari fitur dengan bahasa sehari-hari |
| `.menu` | Beranda dan kategori fitur |
| `.alur poster` | Urutan kerja dari brief sampai pemeriksaan desain |
| `.help contrast` | Fungsi, format, akses, dan contoh perintah |
| `.akses` | Melihat peran dan status langganan |
| `.menu premium` | Informasi fitur berlangganan |

## Fitur utama

### Alat desainer

- Brief desain bertahap: `.wizard`
- Ide kreatif: `.creative poster kopi`
- Saran layout: `.layout poster`
- Pasangan font dan preview visual PNG: `.fontpair`, `.fontpair <gaya>`, `.fontpair semua [halaman]`, `.fontpair preview <gaya|nomor>`
- Palet warna: `.colorpalette pastel`
- Rasio kontras: `.contrast #222222 #FFFFFF`
- Design QA: `.designqa <poster/sosial/logo/cetak/kemasan/web/app>` (alias `.checklist`).
- Design Handoff: `.handoff <proyek> | <jenis> | <ukuran/platform> | <format> | <warna> | <font>` untuk template serah-terima klien/developer.
- Format revisi klien: `.revision`
- Info gambar, resize, kompres, dan stiker: `.info`, `.ratio`, `.resize`, `.compress`, `.sticker`

Untuk melihat urutan yang direkomendasikan berdasarkan tujuan, gunakan `.alur poster`, `.alur logo`, `.alur sosial`, `.alur gambar`, `.alur revisi`, `.alur aset`, atau `.alur belajar`.

### Fitur premium

Pelanggan aktif dapat memakai `.brandkit NamaBrand` dan `.pricing <jam> <tarifPerJam> [biayaTambahan]`. Status akses bisa dicek melalui `.akses`. Owner bot mengelola langganan dengan `.sub grant <nomorWhatsApp> <hari>`, `.sub revoke <nomorWhatsApp>`, `.sub list`, dan `.sub status`.

Langganan masih dikelola manual oleh Owner; pembayaran otomatis belum disediakan. Admin grup tidak otomatis menjadi Owner bot.

### Komunitas dan marketplace desain

- `.design` — mencari desainer/karya.
- `.portfolio` — panduan mengelola profil dan portofolio.
- `.designer DSN-ID` — melihat portofolio dan kontak publik desainer.
- `.marketadmin` — moderasi direktori portofolio khusus Owner.
- Tidak ada brief, penawaran, pesanan, atau pembayaran melalui bot.
- `.rules`, `.antilink`, `.antispam`, `.antitoxic` — aturan dan proteksi grup sesuai izin. Filter kata `.antitoxic` disusun Admin, nonaktif secara default, dan mencocokkan kata utuh saja.

Untuk detail lengkap dan batas akses, baca [`docs/commands.md`](docs/commands.md) dan [`docs/ACCESS-CONTROL.md`](docs/ACCESS-CONTROL.md).

## Konfigurasi `.env`

- `MONGO_URI` — koneksi MongoDB.
- `OWNER_JIDS` — nomor/JID Owner bot, dipisahkan koma bila lebih dari satu.
- `AUTH_DIR` — direktori sesi Baileys.
- `TEMP_DIR` — direktori file sementara.
- `BACKUP_DIR` — direktori backup runtime.
- `DESIGN_COMMUNITY_GROUPS` — JID grup yang diizinkan mendaftarkan portofolio.
- `PORTFOLIO_UPLOAD_DIR` — lokasi penyimpanan gambar portofolio.

Contoh format grup hanya contoh. Gunakan JID grup milik komunitasmu sendiri.

## Pemeriksaan rilis

Lihat [`docs/RELEASE_AUDIT_v4.0.9.md`](docs/RELEASE_AUDIT_v4.0.9.md) untuk ringkasan modul yang ditemukan, temuan audit, hasil pengujian, dan daftar pekerjaan wajib sebelum v5.0.0. Jalankan `npm run doctor` sebelum menjalankan bot.

## Perintah pengembangan

```bash
npm run check       # periksa sintaks JavaScript
npm run doctor      # periksa kesiapan konfigurasi tanpa menampilkan rahasia
npm test            # jalankan tes otomatis
npm run docs:commands # bangun ulang katalog perintah
npm start           # jalankan bot
```

Tes otomatis tidak menggantikan uji langsung dengan akun WhatsApp uji dan MongoDB staging. Sebelum memasang pada bot aktif, cadangkan database dan sesi secara aman.

## Struktur proyek

```text
index.js                 titik masuk dan integrasi WhatsApp
config/                  konfigurasi default
models/                  model MongoDB
features/command-handler.js
features/commands/       perintah modular
features/design-marketplace/ marketplace desain
features/subscription-store.js penyimpanan langganan lokal
games/                   registry game dan Pixel Realm
assets/images/            aset visual game/menu
content/                  teks bantuan dan tutorial
scripts/                  pemeriksaan sintaks dan generator dokumentasi
tests/                    tes otomatis
docs/                     panduan dan katalog perintah
```

## Catatan rilis bersih

Arsip ini tidak menyertakan `.env`, sesi autentikasi, `node_modules`, backup, direktori Git, data grup lokal, atau unggahan portofolio. Setelah diekstrak, jalankan `npm install`, isi `.env` sendiri, lalu uji sebelum dipakai. Jika memperbarui instalasi yang sudah aktif, jangan menimpa folder sesi atau database lokal.

## Pintasan singkat

Lihat [docs/SHORTCUTS.md](docs/SHORTCUTS.md) untuk pintasan bawaan dan cara membuat alias sendiri melalui `config/command-aliases.json`. Katalog `.commands` menampilkan 10 perintah per halaman.

## Panel Owner dan pemantauan sistem

Owner dapat menggunakan `.owner` untuk melihat status bot, `.stats` untuk ringkasan data pengguna/grup/aset/laporan/tiket, dan `.activity [jumlah]` untuk membaca riwayat moderasi terbaru. Pengelolaan pintasan tersedia melalui `.alias`. Semua fitur Owner memerlukan identitas yang terdaftar pada `OWNER_JIDS`.



### Pusat operasi Owner (v3.20.0)

Gunakan `.health`, `.groups`, `.reports`, dan `.tickets` untuk memantau status proses serta data operasional. Seluruh perintah ini hanya dapat digunakan Owner dan bersifat baca-saja. Lihat `docs/OWNER-CONTROL.md`.


### Pengaturan runtime Owner (v3.21.0)

Owner dapat menjalankan `.botconfig` untuk melihat pengaturan, `.botconfig maintenance on/off` untuk membatasi command anggota selama pemeliharaan, serta `.botconfig notice <pesan>` untuk mengganti pemberitahuan. Gunakan `.botconfig notice reset` untuk mengembalikan pesan awal. Lihat `docs/OWNER-CONTROL.md` untuk batasan dan detailnya.


### Pengaturan sambutan grup (v3.22.0)

Admin grup dapat mengatur pesan anggota masuk dan keluar: `.welcome on/off`, `.welcome teks <pesan>`, `.welcome reset`, `.goodbye on/off`, `.goodbye teks <pesan>`, dan `.goodbye reset`. Template mendukung `{name}`, `{group}`, dan `{rules}`. Pesan perpisahan nonaktif secara default; sambutan tetap aktif secara default untuk mempertahankan perilaku sebelumnya.


## Kontrol akses whitelist

Secara default bot hanya merespons Owner dan grup/kontak yang disetujui. Otomasi grup seperti XP, notifikasi naik level, sambutan, dan perpisahan juga hanya berjalan pada grup yang disetujui. Lihat [panduan kontrol akses](docs/ACCESS-CONTROL.md) untuk perintah `.allowlist`.


## Pembaruan v3.29.0 — Whitelist ketat

- Semua pesan keluar sekarang dibatasi oleh whitelist tujuan, termasuk notifikasi marketplace dan notifikasi otomatis.
- Pesan masuk dari chat yang belum disetujui dihentikan sebelum XP, moderasi, wizard, dan command.
- Owner terverifikasi mendapat bypass allowlist hanya pada chat pribadi; grup, termasuk pesan Owner, tetap wajib masuk allowlist. JID pribadi Owner yang terverifikasi didaftarkan otomatis untuk balasan. Dari chat pribadi Owner, gunakan `.allowlist group add <JID-grup>` untuk mengizinkan grup baru.
- Saat update, pertahankan `.env`, folder sesi WhatsApp, `config/allowed-chats.json`, `config/command-aliases.json`, `content/texts.json`, database, dan folder uploads lokal. Jangan menimpa data lokal.

### Game Tebak-Tebakan Multikategori

Gunakan `.tebak menu` untuk bantuan, `.tebak kategori` untuk daftar kategori, dan `.tebak mulai [kategori]` untuk bermain. Kategori tersedia: campuran, umum, sains, teknologi, geografi, hewan, makanan, olahraga, sejarah, desain, dan logika. Jawaban dikirim melalui `.tebak <jawaban>`.

### Game tambahan (v3.30.1)
- `.angka` — menu Tebak Angka; `.angka mulai` untuk bermain, `.angka 25` untuk menebak, `.angka menyerah` untuk berhenti, `.angka skor` untuk statistik.
- `.acak` — menu Acak Kata; `.acak mulai` untuk bermain, `.acak <jawaban>` untuk menjawab, `.acak hint` untuk petunjuk, `.acak stop` untuk berhenti, `.acak skor` untuk statistik.
- Keduanya membutuhkan MongoDB aktif dan hanya berjalan di chat yang diizinkan oleh whitelist.


## Game Center — seluruh permainan

Gunakan `.games` untuk melihat seluruh permainan. Game yang tersedia bukan hanya Pixel Realm: `.tebak` (tebak multikategori), `.angka` (tebak angka), `.acak` (acak kata), `.misteri` (investigasi detektif), dan `.multi` (multiplayer). Pixel Realm tetap tersedia melalui `.pr`.

Sistem pendukung: `.player` untuk profil/progres dan `.mission` untuk misi harian. Panduan lengkap: `.tutorial game`; bantuan khusus: `.help <perintah>`.

## Game Misteri & Detektif

- `.misteri` — panduan.
- `.misteri mulai` — mulai kasus misteri fiksi.
- `.misteri petunjuk` — buka petunjuk bertahap.
- `.misteri tersangka` — lihat daftar tersangka.
- `.misteri tuduh <nama>` — ajukan dugaan.
- `.misteri menyerah` — tampilkan solusi.
- `.misteri skor` dan `.misteri papan` — statistik dan peringkat.


## Multiplayer v3.32.0

Gunakan `.multi` untuk membuka menu multiplayer. Di grup, buat ruang dengan `.multi buat sambung` atau `.multi buat kuis`; pemain lain bergabung dengan `.multi gabung`, lalu host menjalankan `.multi mulai`. Jawaban dikirim melalui `.multi jawab <jawaban>`. Untuk duel Suit 1 lawan 1 dalam grup, gunakan `.multi duel 628xxxxxxxxxx`; penerima memilih `.multi terima` atau `.multi tolak`, lalu kedua pemain mengirim `.multi suit batu|gunting|kertas`.

Sesi multiplayer masih bersifat sementara di memori proses dan akan reset saat bot restart. Pastikan grup dan kontak tujuan telah diizinkan dalam whitelist.

## Multiplayer v3.33.0

Fitur multiplayer diperluas:
- `.multi buat kuis sains` — kuis kategori sains.
- Kategori lain: `umum`, `teknologi`, `desain`, atau `semua`.
- `.multi papan` — lihat peringkat skor sementara di ruang.
- `.multi keluar` — keluar saat ruang masih lobi. Jika host keluar, host berpindah ke pemain pertama yang tersisa.
- Perintah sebelumnya tetap tersedia: `.multi buat sambung`, `.multi gabung`, `.multi mulai`, `.multi jawab <jawaban>`, `.multi status`, `.multi selesai`, dan duel Suit.

Catatan: sesi dan skor multiplayer belum disimpan permanen; restart bot akan menghapus ruang yang sedang berjalan.

## Ekonomi Pemain (Stage 11)

- `.shop` — lihat item koleksi dan harga.
- `.buy <id-item> [jumlah]` — beli 1–10 item memakai koin.
- `.inventory` atau `.inv` — lihat item yang dimiliki.
- `.wallet` atau `.saldo` — cek saldo koin.
- `.daily` — klaim bonus harian 100 koin + 10 XP (sekali per hari UTC).

Fitur ekonomi membutuhkan MongoDB aktif. Item toko pada versi ini bersifat koleksi dan belum memberi efek gameplay. Saldo tidak dapat diuangkan atau ditransfer ke pengguna lain.


## Arsip historis — Design Marketplace v4.0.0 (tidak aktif sejak v5.91.0)

> Semua bagian di bawah heading ini menjelaskan perilaku versi lama. Sejak v5.91.0, fitur marketplace bot hanya direktori portofolio dan kontak publik langsung; seluruh alur order, penawaran, paket, dan pembayaran tidak aktif.

- `.studio` — dashboard statistik pribadi desainer.
- `.service` — katalog publik layanan desain.
- `.service tambah BASIC | Judul | Kategori | Harga | Hari | Revisi | Deskripsi`
- `.service saya` / `.service lihat SVC-ID`
- `.service on SVC-ID` / `.service off SVC-ID` / `.service hapus SVC-ID`

Paket layanan yang didukung: BASIC, PRO, dan EXCLUSIVE. Katalog merupakan etalase; proses pemesanan resmi tetap dilakukan melalui `.requestdesign baru` dan alur penawaran.

## UX marketplace v4.0.1

- `.menu market` memisahkan pintasan untuk klien, desainer, dan pengelolaan pesanan.
- `.commands market` kini mencantumkan `.studio`, `.service`, dan alias `.layanan`.
- `.help studio`, `.help service`, dan `.help requestdesign` memberi petunjuk kontekstual.
- `.service bantuan` menjelaskan alur katalog untuk klien dan desainer.
- `.studio` menampilkan statistik serta langkah pengelolaan studio.
- Katalog layanan belum membuat transaksi otomatis; permintaan pekerjaan tetap melalui `.requestdesign baru`.

Versi source ini: **4.1.0**. Jalankan `npm install` setelah mengganti source, lalu `npm start` untuk menjalankan bot.

### Client Center (v4.0.2)

- `.client` / `.klien` menampilkan ringkasan pesanan pelanggan, status dalam bahasa yang mudah dipahami, serta pintasan untuk melihat penawaran, memeriksa hasil, meminta revisi, mengonfirmasi selesai, dan memberi ulasan.
- `.client` membutuhkan MongoDB. Perintah ini hanya menampilkan permintaan yang dibuat oleh akun yang sedang menggunakannya.

### Portfolio Upgrade (v4.0.3)

- `.portfolio unggulan ART-ID` menandai atau melepas karya unggulan milik sendiri.
- Maksimal 3 karya unggulan per desainer; hanya karya berstatus disetujui yang dapat dipilih.
- Karya unggulan ditampilkan lebih dahulu pada profil publik, dengan penanda ⭐.
- Karya lama otomatis dianggap bukan unggulan sehingga tidak perlu migrasi database manual.


### Public Designer Discovery (v4.0.4)
- Search results now show designer specialties, a short bio, starting price, approved-work count, featured-work count, and review summary.
- Added `.design unggulan` to discover designers with approved featured portfolio works.
- Search summaries use batched aggregation queries rather than per-designer count queries.
## v4.0.5 — Designer Order Workbench

Dashboard `.studio` kini menyertakan antrian hingga lima pesanan aktif terbaru untuk desainer, lengkap dengan status dan perintah langkah berikutnya. Antrian ini hanya membaca data; perubahan status tetap dilakukan melalui `.requestdesign`.


## v4.0.6 — Marketplace Notification Reliability
- Centralized private order notifications with recipient validation and failure logging.
- Added contextual follow-up commands to lifecycle messages.
- Replies distinguish saved order status from failed WhatsApp DMs; notification failure does not roll back MongoDB status.
- See `features/design-marketplace/README.md` for notification behavior.


### Marketplace Activity Log (v4.0.7)
Gunakan `.requestdesign activity BRF-ID` untuk melihat maksimal 15 catatan aktivitas terbaru. Akses dibatasi untuk pelanggan pemilik brief, desainer terpilih, dan Owner bot. Catatan menyimpan aktor, waktu, aksi, transisi status, serta alasan revisi/penolakan jika ada.


### v4.0.7 — Marketplace Activity Audit
Gunakan `.requestdesign activity BRF-ID` untuk memeriksa riwayat perubahan pesanan. Riwayat dibatasi untuk pelanggan, desainer terpilih, dan Owner bot. Sistem mencatat transisi penting dari pemilihan desainer sampai pesanan selesai, termasuk catatan revisi dan verifikasi.


### Marketplace Dispute Center (v4.0.8)

Fitur sengketa pesanan memungkinkan pelanggan atau desainer terpilih melaporkan masalah pada pesanan yang belum selesai/ditutup. Pihak terkait dapat melihat sengketa melalui `.requestdesign dispute-list`, sementara Owner menyelesaikannya melalui `.requestdesign dispute-resolve BRF-ID hasil alasan`. Keputusan dicatat dan notifikasi dikirim secara best-effort. Fitur ini tidak menyediakan escrow, penahanan dana, atau pembayaran otomatis.

## v4.1.0 — Pencatatan Pembayaran Manual Marketplace

- `.requestdesign payment BRF-ID` — pelanggan, desainer terpilih, atau Owner melihat catatan pembayaran pesanan.
- `.requestdesign payment-submit BRF-ID jumlah metode | referensi` — pelanggan mencatat pembayaran dan referensi bukti untuk pemeriksaan manual.
- `.requestdesign payment-verify PAY-ID` — Owner menandai catatan sebagai diverifikasi setelah memeriksa bukti di luar bot.
- `.requestdesign payment-reject PAY-ID alasan` — Owner menolak catatan dengan alasan.
- Catatan disimpan di koleksi `MarketplacePayment` dan masuk ke riwayat aktivitas pesanan.
- Fitur ini hanya ledger/catatan manual. Bot tidak membaca mutasi rekening, memproses pembayaran, menahan dana, atau menyediakan escrow. Status pembayaran tidak otomatis mengubah status pengerjaan pesanan.


## v5.0.0 — Owner Finance & Performance Dashboard

- `.marketadmin finance [YYYY-MM]`: ringkasan nominal catatan pembayaran bulanan berdasarkan status pending/verified/rejected.
- `.marketadmin payments [all|pending|verified|rejected]`: antrean catatan pembayaran terbaru dan shortcut pemeriksaan Owner.
- `.marketadmin performance`: peringkat desainer berdasarkan jumlah pesanan berstatus selesai.
- Seluruh laporan keuangan hanya membaca ledger manual. Angka bukan audit rekening, bukti dana masuk otomatis, omzet bersih, escrow, atau pendapatan platform.


## v5.0.0 — Penyegaran UI/UX

Dashboard Owner marketplace kini memiliki pusat bantuan `.marketadmin help` dan navigasi halaman untuk daftar pesanan, desainer, laporan, ulasan, pembayaran, serta performa. Setiap daftar menampilkan maksimal lima item per halaman agar pesan WhatsApp lebih ringkas. UI/UX akan terus menjadi bagian tetap dari setiap rilis, bukan pekerjaan sekali selesai.

### v5.2.0 — Marketplace Guided UX

- `.portfolio help` gives designers a guided quick-start path.
- `.cancel` reports the specific workflow cancelled and clears temporary wizard data.

## v5.1.0 — Marketplace Search UX

Pembaruan pencarian marketplace menambahkan navigasi `.design prev`, mempertahankan `.design next`, serta pesan batas halaman yang jelas agar hasil tidak berpindah diam-diam dari halaman terakhir ke halaman pertama.


## v5.3.0 — Order status guidance

Added `.requestdesign status BRF-ID` (aliases: `progress`, `lacak`) to show the current order state and the next action available to the caller's role. Access is limited to the client, selected designer, or bot Owner.


Versi 5.12.0: Access Manager menyimpan alias/catatan grup dan kontak, backup lokal, serta sinkronisasi MongoDB berbasis revision. Lihat `docs/ACCESS-CONTROL.md`.


## Navigasi cepat (v5.15.0)

- `.menu` — beranda dan kategori fitur.
- `.mulai` — panduan untuk pengguna baru.
- `.help <perintah>` — fungsi, format, contoh, dan akses perintah.
- `.commands` — katalog perintah per halaman.
- `.commands cari <kata kunci>` — cari perintah berdasarkan nama, kategori, fungsi, atau contoh.
- `.commands <kategori> [halaman]` — filter katalog, misalnya `.commands tools` atau `.commands market 2`.

Navigasi bot menggunakan pesan teks dan perintah, bukan tombol interaktif WhatsApp.


### Typography Studio & Design QA Review (kandidat v5.20.1)

- `.typography hierarchy web` — hierarki font per jenis desain (web, app, sosial, poster, cetak, kemasan).
- `.typography size digital` / `.typography size cetak` — pedoman ukuran dan line-height.
- `.typography check digital | Inter, Playfair Display | 12 14 16* 24 32 48 | 1.5` — periksa konsistensi tipografi; `*` menandai ukuran body.
- `.qareview web teks=#222222 latar=#FFFFFF body=16 judul=32 font=2 tap=44` — review QA berbasis angka dengan prioritas perbaikan.
- Aturan yang dipakai adalah pedoman umum; detail di `docs/DESIGN-STUDIO-v5.20.1.md`.

### Image Utilities (pengembangan v5.20.0)

- `.crop 1:1` / `.crop 4:5` / `.crop 16:9` — crop tengah berdasarkan rasio.
- `.imgconvert webp 82` / `.imgconvert jpg 85` / `.imgconvert png` — konversi format dan pengaturan kualitas.
- `.resize <lebar> <tinggi>` — ubah dimensi.
- `.compress` — kompres ke JPEG.
- Semua perintah pemrosesan membutuhkan gambar yang dikirim atau dibalas di chat.

### FontPair Studio Expansion

Perintah FontPair menggunakan prefix bot yang dikonfigurasi (contoh di bawah memakai `.`):

- `.fontpair [gaya]` / `.fontpair semua [halaman]` — rekomendasi 33 pasangan font.
- `.fontpair preview <nomor|gaya>` — kirim kartu PNG spesimen dengan fallback font sistem.
- `.fontpair google <font judul> | <font isi>` — kirim file HTML preview yang memuat kedua keluarga font asli dari Google Fonts CSS2 API; buka file dengan browser dan internet aktif. Jika hanya satu nama diberikan, Inter digunakan sebagai font isi.
- `.fontpair mood <brief brand>` / `.fontpair brand <brief>` — urutkan pasangan berdasar moodboard, karakter brand, dan industri.
- `.fontpair recommend <kebutuhan>` — rekomendasi pasangan berdasarkan kebutuhan desain.
- `.fontpair search <nama>` — cari di kurasi lokal dan buka pencarian Google Fonts.
- `.fontpair save <nomor>`, `.fontpair favorites`, `.fontpair unsave <nomor>` — simpan, lihat, dan hapus favorit pribadi. Fitur favorit memerlukan MongoDB aktif dan datanya dipisahkan berdasarkan JID WhatsApp.
- `.fontpair ai <brief>` — AI Design Copilot untuk review visual, hierarki, layout, tipografi, palet HEX, art direction, dan prioritas perbaikan. Kirim/balas gambar dengan caption perintah yang sama untuk analisis multimodal.

AI Vision menggunakan endpoint OpenAI-compatible Chat Completions. Atur `OPENAI_API_KEY`, opsional `OPENAI_BASE_URL`, dan `OPENAI_VISION_MODEL` di `.env`. Default model `gpt-4o-mini`; sesuaikan dengan model vision yang tersedia pada provider. Tanpa API key, bot otomatis memakai rekomendasi lokal dan menyatakan bahwa analisis visual penuh tidak aktif. Gambar dibatasi 8 MB. Jangan pernah menaruh API key di source code atau membagikan `.env`.

Preview Google Fonts membutuhkan koneksi internet saat validasi dan saat HTML dibuka. Ketersediaan font tidak menggantikan pemeriksaan lisensi dan dukungan karakter untuk proyek produksi.

## v5.22.0 — Designer Workspace

Menu Designer kini menjadi pusat navigasi tools desain. Buka dengan `.menu designer`. Kategori mencakup brief/workflow, typography, color, layout/social/UX, QA/produksi, resource/image, dan branding. Untuk menemukan perintah yang tidak tercantum, gunakan `.commands tools`, `.commands cari <kata>`, atau `.help <perintah>`.



## PIR Visuals v5.39.0 — Premium Website & Shared WhatsApp Accounts

- Premium pear-inspired identity based on the supplied PIR pear SVG, coordinated typography, accessible text contrast, and polished dark/light themes.
- Account-specific designer name/avatar in public portfolio and Designer Studio navigation.
- Website and WhatsApp bot share the same MongoDB designer profiles and portfolio records.
- Website-first signup can be linked securely to WhatsApp using `.portfolio link KODE`; WhatsApp-first profiles appear in the website immediately.
- WhatsApp OTP login via `.portfolio dashboard otp`.
- Portfolio image uploads are website-only and must be performed manually in Designer Studio.
- Run website separately using `npm run website:install` then `npm run website`, or `START-WEBSITE.bat`.
- See `RELEASE-NOTES-v5.39.0.md` and `docs/WEBSITE-WHATSAPP-SHARED-ACCOUNT-v5.39.0.md`.


## PIR Visuals v5.39.1 — Theme Contrast & SMTP Patch

- Dark mode uses graphite/charcoal surfaces with sage as a restrained accent, not a full-green background.
- Light mode forces readable contrast for Portal Desainer, dashboard headings, labels, fields, and buttons.
- Removed the decorative icon/watermark from the center of the homepage.
- Removed duplicate `expiresAt` schema index declarations while preserving the TTL index.
- SMTP setup: see `docs/SMTP-CONFIGURATION-ID.md`.


## PIR Visuals v5.40.0 — Homepage Carousel & Premium Dark UI
- Dimensional graphite dark mode with subtle gradients, glass navigation, layered cards and restrained sage accents.
- Homepage carousel for events, announcements, featured designers and recent portfolio work.
- Manage up to three custom slides from `/dashboard` without editing source code; additional featured designer and latest work slides are curated automatically.
- Carousel supports autoplay, manual controls, keyboard focus pause and reduced-motion preference.
- See `RELEASE-NOTES-v5.40.0.md`.


## PIR Visuals v5.41.0 — Designer Reputation
- Aggregate star rating and count from all Owner-approved, email-verified client reviews.
- Automatic Top Rated badge (minimum 5 reviews and average 4.5/5).
- Email verification, duplicate-email prevention per designer, and Owner-only approval.
- Designer can hide an approved review but cannot self-publish it.
- See `RELEASE-NOTES-v5.41.0.md`.


## PIR Visuals v5.42.0 — Client Collections & Moodboards
- Create multiple inspiration collections with public/private visibility.
- Add public designers and approved portfolio works using their visible IDs.
- Share public moodboards; manage private or public boards using a one-time secret management link.
- Edit, change visibility, or delete collections. See `RELEASE-NOTES-v5.42.0.md`.


## PIR Visuals v5.43.0 — Premium Editorial Homepage
- Premium editorial homepage hero, live creative network stats, clearer calls to action and refined carousel presentation.
- Responsive desktop/tablet/mobile styling with dark/light theme compatibility.
- Existing homepage CMS, MongoDB data, Baileys bot and separate game remain intact. See `RELEASE-NOTES-v5.43.0.md`.


## PIR Visuals v5.44.0 — Designer Showcase & Case Studies
- Editorial public designer profiles with capabilities, social links, services, reputation and direct contact.
- Standalone `/work/:itemId` case-study pages for approved portfolio items.
- Contextual profile SEO/Open Graph metadata and responsive/reduced-motion styling.
- Public pages no longer expose internal designer analytics counters. See `RELEASE-NOTES-v5.44.0.md`.


## PIR Visuals v5.45.0 — Discovery & Portfolio Experience
- Responsive masonry portfolio and accessible fullscreen lightbox.
- WebP media negotiation and optimized response resizing with original format fallback.
- Quick category shortcuts and sitemap entries for public approved case studies.
- No database migration; Baileys and game modules retained. See `RELEASE-NOTES-v5.45.0.md`.


## PIR Visuals v5.45.1 — Light Theme Correction
- Corrected light-mode contrast and colors across navigation, cards, typography, buttons, inputs, designer profiles and case studies.
- Dark mode retains layered charcoal surfaces and ambient lighting.
- No database migration or bot/game changes. See `RELEASE-NOTES-v5.45.1.md`.


## PIR Visuals v5.46.0 — Full Homepage Redesign
- Rebuilt the homepage into a distinctive editorial creative talent platform with a new hero, category gateways, designer showcase, selected project grid, manifesto, join CTA and FAQ.
- Preserves homepage CMS carousel content and existing directory/case-study routes.
- Responsive tablet/mobile layouts and reduced-motion support. See `RELEASE-NOTES-v5.46.0.md`.


## PIR Visuals v5.47.0 — Designer Workspace & Discovery
- Dedicated Designer Studio workspace with sidebar, responsive navigation, overview KPIs and organized existing management panels.
- Responsive multi-column discovery filters; all existing filter behavior preserved.
- No database migration or Baileys/game changes. See `RELEASE-NOTES-v5.47.0.md`.


## PIR Visuals v5.48.0 — Public Designer Profile Experience
- Sticky profile section navigation, project count, share-profile action with native/clipboard fallback, and responsive theme-aware styling.
- Preserves favorites, direct contacts, existing portfolio, services and review routes. No database migration or bot/game changes. See `RELEASE-NOTES-v5.48.0.md`.


## PIR Visuals v5.49.0 — Client Shortlist & Designer Comparison
- Added a client-side shortlist workspace at `/shortlist`, compare up to four public designers, compare price/specialty/location/verification/availability, remove and clear selections, and share a shortlist URL.
- No account or database migration required; uses local browser storage and the existing public designer API. See `RELEASE-NOTES-v5.49.0.md`.


## PIR Visuals v5.50.0 — Support Center & Light Theme Refinement
- Improved light-mode contrast and normalized spacing across shared components and key workspaces.
- Added `/contact` support center, email/WhatsApp contact channels, support ticket form, optional SMTP notification, and owner dashboard ticket inbox/status workflow.
- Configure `SUPPORT_EMAIL`, `SUPPORT_WHATSAPP`, `SUPPORT_HOURS`; SMTP notification additionally requires existing SMTP settings. See `RELEASE-NOTES-v5.50.0.md`.


## PIR Visuals v5.51.0 — Editorial Website Redesign
- Major website visual redesign inspired by the editorial rhythm, bold typography, and content presentation of Bettr Academy, adapted to PIR Visuals' designer discovery and portfolio use case.
- Rebuilt light-mode contrast (including the previously conflicting hero text and creative index), refined dark-mode layered surfaces, navigation, spacing, portfolio/category sections and responsive layouts. Existing homepage data and interactions remain connected. See `RELEASE-NOTES-v5.51.0.md`.


## PIR Visuals v5.52.0 — Case Study Builder & SEO Foundation
- Designers can now enrich portfolio projects with role, challenge, process, outcome, tools and duration. Approved work pages render these as structured editorial case studies.
- Added dynamic `/sitemap.xml` and `/robots.txt` for public profiles and approved works. Set `SITE_URL` to the deployed public origin. Existing collections, moderation and account systems are reused. See `RELEASE-NOTES-v5.52.0.md`.


## PIR Visuals v5.53.0 — Signature Brand Background System
- Added poster-inspired geometric diagonal linework and oversized organic circular arcs across both Light and Dark themes, including homepage, designer workspace and editorial pages. Light mode uses warm ivory/taupe/olive/forest; dark mode uses charcoal/deep forest/muted sage. Decorative layers are responsive and non-interactive. See `RELEASE-NOTES-v5.53.0.md`.


## PIR Visuals v5.53.1 — Visual Consistency & Responsive Refinement
- Based on user screenshots: reduced background line density, replaced regular concentric circles with asymmetric organic arcs, separated theme toggle spacing in desktop/mobile navigation, and corrected Light Mode shortlist contrast and workspace surfaces. See `RELEASE-NOTES-v5.53.1.md`.


## PIR Visuals v5.54.0 — Poster Identity & Corporate Footer
See `RELEASE-NOTES-v5.54.0.md` for the updated flowing poster-style linework, theme-consistent mobile navigation, and redesigned corporate footer.


## PIR Visuals v5.55.0 — Editorial Experience & Contrast Repair
See `RELEASE-NOTES-v5.55.0.md` for footer contrast repair, responsive navigation, and homepage editorial refinements.


## PIR Visuals v5.56.0 — Editorial Portfolio & Creative Index
The public category index, designer profile and project case-study pages now use a more expressive editorial layout. See `RELEASE-NOTES-v5.56.0.md` for details.


## PIR Visuals v5.57.0 — Visual Site Studio
Owner can now manage homepage sections, ordering, copy, FAQ, category visibility, banners and homepage SEO from the authenticated dashboard. See `RELEASE-NOTES-v5.57.0.md` for details.


## PIR Visuals v5.58.0 — Marketplace Intelligence & Visual Refresh
Owner growth intelligence now reports 30-day traffic, profile-to-contact funnel, lead pipeline, campaign clicks, category discovery and designer activity. Public website styling has been refreshed with a coordinated textured charcoal dark theme and warm editorial light theme. See `RELEASE-NOTES-v5.58.0.md`.


## PIR Visuals v5.59.0 — Experience 2.0
Designer Studio adds personal-brand storytelling, profile layout presets, profile SEO, richer case-study metadata, project-specific SEO, project-view analytics, and a 14-day designer traffic trend. Public portfolio galleries open in an accessible lightbox. Existing WhatsApp bot, account, moderation, and lead workflows are retained. See `RELEASE-NOTES-v5.59.0.md`.


## PIR Visuals v5.60.0 — Client Workspace & Motion Experience
A private client project room is created for each new designer brief. Single-use email magic links provide scoped client sessions; clients can track project stages and send feedback, while designers manage updates and invitations in Designer Studio. Website motion and interaction are upgraded with accessible scroll reveals, progress tracking, toast feedback, and swipe/keyboard carousel support. Configure SMTP and the public website URL to enable invitations. See `RELEASE-NOTES-v5.60.0.md`.


## PIR Visuals v5.61.0 — Bettr-inspired Editorial Motion
The homepage now has a more expressive motion language inspired by the editorial, image-led storytelling and featured-content structure of Bettr Academy. Added accessible kinetic headline reveals, scroll-triggered story sections, staggered category/talent/work reveals, count-up directory metrics, an animated creative ribbon, hero pointer lighting and scroll parallax, and a cinematic carousel image/text sequence. The treatment is implemented with native CSS and browser APIs, requires no animation framework, and respects `prefers-reduced-motion`. Website tests and syntax checks are recorded in `RELEASE-NOTES-v5.61.0.md`.


## PIR Visuals v5.63.0 — Responsive Editorial Refinement
The website navigation is now grouped into primary routes, secondary destinations, and utility controls, with an adaptive compact panel below 1180px. The homepage hero now uses a fluid, balanced headline measure and a single-column composition at narrower laptop/tablet widths to prevent visual crowding and text clipping. Existing dark/light themes, routes, quick search, motion controls, and reduced-motion behavior are preserved. See `RELEASE-NOTES-v5.63.0.md`.


## PIR Visuals v5.64.0 — Contrast, Navigation & Motion Refinement
The v5.63.0 upload is the direct base. This release adds a unified semantic contrast layer for both themes, repairs Light Mode readability across the public shell and core workspace components, refines mobile utility controls and spacing, and replaces the dense background grid with sparse diagonal linework plus one irregular organic form. Theme/motion controls now keep stable icon and label markup. Existing marketplace, Designer Studio, Client Workspace, bot, and route behavior are retained. See `RELEASE-NOTES-v5.64.0.md`.


## PIR Visuals v5.65.0 — Theme Contrast Repair
The v5.64.0 package is the direct base. This release fixes theme-specific contrast collisions in editorial category tiles, the Portal desainer navigation CTA, and the homepage hero/join CTAs. Category tiles now preserve their own palette text tokens across both themes, selected small-text palettes were adjusted to meet WCAG AA contrast, and primary navigation actions have explicit foreground/background pairs. The Light Mode join panel keeps its intentionally dark editorial surface with light text. The public service-worker cache is bumped to v11. See `RELEASE-NOTES-v5.65.0.md`.


## PIR Visuals v5.66.0 — Mobile Navigation Refinement
The v5.65.0 project is the direct base. This release improves phone navigation spacing and touch targets, aligns the expanded panel to the header width, gives Portal desainer and Cari their own full-width rows, and places Motion and Tema in a balanced two-column utility row. The mobile menu remains scrollable on short viewports, respects reduced-motion settings, and retains explicit light/dark utility surfaces. Website tests: 183/183 passed; 173 JavaScript files passed syntax checks; CSS parsing returned 0 errors. See `RELEASE-NOTES-v5.66.0.md`.


## PIR Visuals v5.70.0 — Portfolio Storytelling & Workspace Experience

- Collection & Moodboard receives an editorial cover, ordered artwork presentation, live builder preview, and an accessible reorder editor with drag, move-up/down, and remove controls.
- Public share actions copy the canonical public collection path; private edit tokens are not included in the share action.
- Portfolio case studies gain a contextual sticky chapter navigation when enough sections exist, with a lightweight active-section indicator.
- Designer Studio gains a data-derived setup checklist and completion meter linked to existing workspace sections.
- Existing bot, game, account, database models, upload storage, and route contracts are retained.
- Regression: 212/212 website tests and 387/387 root tests passed; 173 JavaScript files passed syntax checks; representative Playwright QA reports 0 browser errors and 0 broken images.
- See `RELEASE-NOTES-v5.70.0.md`, `TEST-REPORT-v5.70.0.md`, and `docs/MOTION-DESIGN-REFERENCES-v5.70.0.md`.


## PIR Visuals v5.71.0 — Immersive Discovery & Creative Workspace

- Case-study gallery upgrades to a grouped fullscreen viewer with previous/next, keyboard arrows, touch swipe, captions, and focus restoration.
- Designer cards add Quick View for public profile context without leaving the discovery page.
- `/discover` includes an approved Selected Work stream with category chips and instant keyword filtering.
- Designer Studio analytics can switch between profile views, contact clicks, and portfolio views using existing daily metrics.
- Studio upload previews validate the existing JPEG/PNG/WebP, 8 MB, and five-image constraints and allow removal before the existing multipart POST.
- Motion Off and reduced-motion preferences are respected; no database schema or runtime dependency changes.
- Regression: 219/219 website tests and 387/387 root tests passed. Browser fixture QA passed on desktop and mobile for quick view, work filters, gallery controls, analytics switching, and upload preview.
- See `RELEASE-NOTES-v5.71.0.md` and `TEST-REPORT-v5.71.0.md`.


## PIR Visuals v5.72.0 — Navigation Restoration & Content Integrity

- Fixed the native `Lainnya` disclosure menu: an author-level `display:grid` rule had overridden the browser's closed `<details>` behavior, leaving submenu links visible and overlapping the Portal, Search, Motion, and Theme controls. Closed submenu is now explicitly hidden; it only renders when expanded.
- Consolidated navigation state handling into one controller; Escape closes the active layer and restores keyboard focus, outside click closes the panel, and resize back to desktop clears stale mobile state.
- Added explicit `aria-expanded` state for the secondary menu and improved focus visibility.
- Added direct top-navigation access to Client Workspace and Contact & Support.
- Reworked compact submenu into a two-column layout and increased panel stacking order and touch-target reliability.
- Advanced public asset cache to `pir-visuals-public-v18` and cache-busting token to `v=5720`.
- No database schema, authentication, upload endpoint, WhatsApp session, or bot behavior changes.


## v5.96.0 documentation

- User guide: `docs/USER-GUIDE-v5.96.0.md`
- Staging acceptance: `docs/STAGING-ACCEPTANCE-v5.96.0.md`
- Install/update: `INSTALL_UPDATE_v5_96_0.md`
- Operations and recovery: `OPERATIONS_RUNBOOK_v5_96_0.md`
- QA report: `QA_REPORT_v5_96_0.md`

- Staging access requirements: `docs/STAGING-ACCESS-REQUIREMENTS-v5.96.0.md`
- CI workflow: `.github/workflows/ci.yml`


## Local development v5.96.0

- Local setup guide: `docs/LOCAL-DEVELOPMENT-v5.96.0.md`
- Start bot and website together: `npm run local:start`
- Default local MongoDB: `mongodb://127.0.0.1:27017/pir_visuals_local`


## Audit fitur produk

- Inventaris fitur dan prioritas v5.96: `docs/PRODUCT-FEATURE-AUDIT-v5.96.0.md`
- Audit implementasi v5.97: `docs/PRODUCT-FEATURE-AUDIT-v5.97.0.md`


## v5.97.0 documentation

- Release notes: `RELEASE-NOTES-v5.97.0.md`
- Update guide: `INSTALL_UPDATE_v5_97_0.md`
- QA report: `QA_REPORT_v5_97_0.md`
- Hybrid workspace policy: `docs/HYBRID-WORKSPACE-POLICY-v5.97.0.md`
- Profile review standard: `docs/VERIFICATION-STANDARD-v5.97.0.md`


## v5.98.0 documentation

- Notification push policy: `docs/NOTIFICATION-PUSH-v5.98.0.md`
- Workspace privacy: `docs/PROJECT-WORKSPACE-PRIVACY-v5.98.0.md`
- Playwright browser tests: `docs/PLAYWRIGHT-E2E-v5.98.0.md`
- Backup/restore verification: `docs/BACKUP-RESTORE-VERIFICATION-v5.98.0.md`


## v5.99.0 documentation

- Release notes: `RELEASE-NOTES-v5.99.0.md`
- Update guide: `INSTALL_UPDATE_v5_99_0.md`
- QA report: `QA_REPORT_v5_99_0.md`
- Feature audit: `docs/PRODUCT-FEATURE-AUDIT-v5.99.0.md`
- Guided matching: `docs/DESIGNER-MATCHING-v5.99.0.md`
- Private portfolio readiness: `docs/PORTFOLIO-READINESS-v5.99.0.md`


## v6.0.0 documentation

- Release notes: `RELEASE-NOTES-v6.0.0.md`
- Update guide: `INSTALL_UPDATE_v6_0_0.md`
- QA report: `QA_REPORT_v6_0_0.md`
- User guide: `docs/USER-GUIDE-v6.0.0.md`
- Quick Access privacy and commands: `docs/QUICK-ACCESS-v6.0.0.md`


## v6.1.0 documentation

- Release notes: `RELEASE-NOTES-v6.1.0.md`
- Update guide: `INSTALL_UPDATE_v6_1_0.md`
- QA report: `QA_REPORT_v6_1_0.md`
- User guide: `docs/USER-GUIDE-v6.1.0.md`
- Shiroine benchmark: `docs/SHIROINE-BENCHMARK-v6.1.0.md`
- Wizard persistence: `docs/WIZARD-PERSISTENCE-v6.1.0.md`
- Group safety: `docs/GROUP-SAFETY-v6.1.0.md`


## v6.7.6 — Designer Studio upload and navigation
- Website profile photo previews now decode and normalize PNG/JPG/WebP in the browser. Avatar server validation no longer depends on Sharp.
- SVG preview tries the original Figma export first and keeps the original SVG upload path as a fallback.
- Workspace icons have more breathing room and the sidebar uses explicit viewport scrolling with a fresh public-ui cache key.
