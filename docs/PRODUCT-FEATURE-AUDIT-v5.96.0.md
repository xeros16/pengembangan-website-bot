# Audit Fitur Produk PIR Visuals v5.96.0

Tanggal audit: 13 November 2026  
Basis audit: source code bot, website, model MongoDB, katalog command, dokumentasi, dan test suite yang tersedia pada paket v5.96.0.

Audit ini menilai keberadaan dan konsistensi fitur pada source. Ini bukan bukti bahwa semua alur telah berhasil diuji pada WhatsApp/MongoDB lokal pengguna.

## Ringkasan eksekutif

PIR Visuals sudah memiliki cakupan fitur yang luas. Pengembangan berikutnya sebaiknya berfokus pada kualitas direktori, kejelasan trust signal, penyederhanaan pengalaman pengguna, dan pengujian end-to-end — bukan menambah banyak fitur yang tidak saling mendukung.

Tiga pilar yang sudah tampak pada source:
1. Creative Tools untuk membantu proses desain.
2. Designer Community untuk belajar, tantangan, mentor, dan kolaborasi.
3. Portfolio Directory untuk menemukan desainer dan menghubungi mereka secara langsung.

## Inventaris fitur yang sudah ada

### A. WhatsApp bot

| Area | Fitur pada source |
|---|---|
| Onboarding | `.mulai`, `.mulai cepat`, preferensi kebutuhan/level, rekomendasi |
| Discovery command | `.cari`, `.help`, `.menu`, `.commands`, `.alur` |
| Creative tools | Brief wizard, creative direction, layout, typography, color palette, contrast, QA, handoff, revision |
| AI design | Prompt builder dan image generation yang memerlukan konfigurasi provider/API |
| Image utilities | Image info, resize, crop, convert, compress, sticker, palette |
| Asset discovery | Pencarian dan pengelolaan aset dengan MongoDB |
| Learning | Learning Path 12 modul dan progress personal |
| Community | Daily/weekly challenge, gallery per grup, peer feedback, mentor opt-in, collaboration board |
| Portfolio directory | Cari desainer/karya, lihat profil, kontak publik, favorit, report, moderasi Owner |
| Website bridge | Shared profile/contact, analytics, private `.studio`, inbox notifikasi |
| Support | FAQ, ticket, report, akses Owner/Admin yang dibatasi grup |
| Group safety | Anti-link, anti-spam, welcome/goodbye, rules, warning, moderation |
| Game Center | Game single/multiplayer, player profile, XP, inventory, economy, missions |
| Premium | Subscription manual yang dikelola Owner |

Katalog dokumentasi saat audit mencantumkan 167 nama command tingkat atas. Untuk pengguna baru, jumlah ini perlu disajikan melalui jalur berbasis tujuan, bukan daftar panjang.

### B. Website

| Area | Fitur pada source |
|---|---|
| Homepage | Editorial landing page, featured work, category discovery, CMS-managed sections |
| Directory | Keyword, skill, category, location, price, verified, featured, accepting-project filter |
| Designer profile | Bio, specialties, social links, services, portfolio, collections, case study, reviews |
| Case study | Cover, gallery, challenge, solution, outcome, role, tools, scope, SEO |
| Favorites | Save designer dan halaman favorites |
| Shortlist | Bandingkan hingga empat desainer dan share shortlist |
| Client moodboard | Moodboard privat/publik dengan edit secret |
| Designer Studio | Setup progress, profile editor, portfolio upload, collections, services, testimonials, analytics, leads, availability, notifications |
| Moderation | Approval karya, laporan, Owner dashboard, CMS |
| Support | Customer support form, ticket, optional email/WhatsApp channel |
| Security | Password/OTP/email flow, sessions, CSRF, CSP, rate limits, private routes |
| SEO/PWA | Sitemap, robots, metadata, service worker, offline public cache |
| Accessibility | Keyboard navigation, focus, reduced motion, light/dark theme, responsive layouts |

## Temuan dan rekomendasi prioritas

### P0 — Pastikan batas produk direktori langsung konsisten

**Sudah sesuai pada bot:** command marketplace bot berfokus pada profil, karya yang disetujui, dan kontak publik. Bot tidak mengelola brief, order, checkout, pembayaran, komisi, escrow, atau sengketa.

**Temuan pada website:** public profile CTA saat ini menggunakan route `/out/:designerId` untuk mengarahkan pengunjung langsung ke WhatsApp desainer. Namun route lama `/contact/:designerId` masih aktif. Route tersebut menerima nama, email, WhatsApp, dan brief; menyimpan `DesignerLead`; membuat `ClientProject` dan `ClientProjectUpdate`; serta menambahkan notifikasi.

Route lama itu tidak dipakai oleh CTA utama profil yang sekarang, tetapi tetap dapat diakses langsung melalui URL.

**Keputusan produk yang diperlukan:**
- Jika seluruh PIR Visuals harus menjadi direktori + kontak langsung saja, nonaktifkan/redirect route `/contact/:designerId`, dan hapus navigasi Project Rooms/Leads yang tidak lagi dibutuhkan.
- Jika batas “tanpa perantara” hanya berlaku pada bot, website boleh mempertahankan client workspace sebagai fitur opsional, tetapi harus dipisahkan dan dijelaskan sebagai alat kolaborasi langsung designer-client, bukan layanan transaksi PIR.

Jangan menambahkan payment atau order workflow ke bot.

### P1 — Perbaiki kualitas pencarian direktori

Temuan source pada `renderDirectory()`:
- Query desainer dibatasi maksimal 60 hasil.
- Belum ada paginasi halaman atau load-more pada hasil desainer.
- Angka “total desainer publik” menghitung semua profil publik, bukan jumlah hasil setelah filter.
- Filter harga membatasi `priceMin` dengan `$gte` dan `$lte`. Ini dapat mengecualikan rentang harga yang sebenarnya beririsan dengan budget pencari.

Rekomendasi:
1. Tambahkan pagination atau load-more dengan page size 24.
2. Hitung `filteredTotal` menggunakan filter yang sama dengan hasil.
3. Ubah logika harga menjadi range overlap: `designer.priceMin <= budgetMax` dan `designer.priceMax >= budgetMin`, dengan fallback yang aman untuk profil lama yang belum memiliki `priceMax`.
4. Tambahkan sorting “terbaru” dan “paling relevan”; jangan menjadikan jumlah view sebagai satu-satunya sinyal ranking.
5. Pertahankan filter yang ada: skill, kategori, lokasi, budget, featured, verified, dan menerima proyek.

### P1 — Perjelas trust dan reputasi

Temuan source:
- Badge `isVerified` diatur Owner melalui command moderasi.
- Ulasan publik memerlukan verifikasi email dan persetujuan Owner.
- Halaman profil menyebutnya “ulasan terverifikasi”, tetapi mekanisme saat ini membuktikan email dapat diverifikasi — bukan bahwa pengulas pasti klien yang pernah bertransaksi dengan desainer.
- Sistem tidak memiliki transaksi PIR, sehingga tidak boleh menyiratkan “verified purchase” atau “verified client”.

Rekomendasi:
1. Publikasikan kriteria badge desainer terverifikasi.
2. Jika verifikasi hanya pemeriksaan manual profil/portofolio oleh Owner, gunakan label yang sesuai seperti “Profil ditinjau PIR”.
3. Ubah label ulasan menjadi “Email terverifikasi” dan beri penjelasan bahwa hubungan klien tidak diverifikasi oleh PIR.
4. Sediakan alasan penolakan moderasi dan jalur banding sederhana.
5. Pertahankan report profile/work dan audit moderator.

### P1 — Jelaskan fungsi kalender ketersediaan

Temuan source:
- Designer Studio menyimpan `DesignerAvailability` dan menampilkan kalender kepada desainer.
- `.studio` merangkum jumlah slot `available` dalam 30 hari.
- Public profile dan directory filter tidak membaca kalender tanggal tersebut. Filter “Menerima proyek” saat ini memakai flag `acceptsOrders`, bukan slot kalender.

Rekomendasi:
- Jika kalender memang untuk pengunjung, tambahkan opt-in “Tampilkan ketersediaan publik” dan tampilkan hanya tanggal/status yang dipilih desainer.
- Jika kalender hanya untuk catatan pribadi, ubah label ringkasan agar tidak memberi kesan calon klien dapat melihat jadwal.

### P1 — Ubah notifikasi pull-only menjadi pilihan opt-in

Temuan source:
- Website membuat dokumen `designernotifications`.
- Bot membaca notifikasi dengan `.portfolio notifikasi` dan `.portfolio notifikasi semua` pada chat pribadi.
- Belum ada pengiriman WhatsApp otomatis saat notifikasi dibuat.

Rekomendasi:
1. Pertahankan inbox pull sebagai fallback.
2. Tambahkan pengaturan opt-in untuk notifikasi push privat.
3. Gunakan queue, retry, deduplication, quiet hours, dan batas frekuensi.
4. Jangan pernah mengirim data klien/brief ke grup.
5. Pengguna harus bisa mematikan push notification kapan saja.

### P1 — Tambahkan end-to-end browser testing

Temuan source:
- Website memiliki banyak test Node.js yang memeriksa source/template, keamanan, dan fungsi tertentu.
- Tidak ditemukan dependency Playwright/Puppeteer/WebDriver pada package root maupun website.
- Belum ada browser automation yang menjalankan alur pengguna penuh dari halaman publik sampai Designer Studio.

Rekomendasi minimal:
- Browser: Playwright.
- Flow publik: homepage → discover → filter → profile → case study → direct WhatsApp redirect.
- Flow designer: register/link → login → setup checklist → upload → edit → preview → publish.
- Flow admin: review pending work → approve/reject → report handling.
- Flow theme/mobile: light/dark, mobile menu, command palette, reduced motion, keyboard navigation.
- Gunakan database test terisolasi dan reset fixture yang aman.

### P2 — Perkuat pengalaman pengguna baru

Yang sudah ada:
- Bot `.mulai` dan `.cari`.
- Website Designer Studio setup checklist dan persentase kelengkapan.
- Preview profil dan case-study builder.

Pengembangan yang disarankan:
1. Buat satu “first 10 minutes” flow: pilih tujuan → lengkapi profil → tambahkan kontak publik → upload 3 karya → preview → publish.
2. Tambahkan empty state yang menjelaskan tindakan berikutnya pada portfolio, collection, analytics, dan favorites.
3. Buat glossary singkat untuk istilah seperti case study, collection, lead, featured, verified, dan availability.
4. Tampilkan contoh profil/karya demo yang diberi label contoh, bukan data pengguna palsu.
5. Sediakan quick actions sesuai peran: pencari desainer, desainer, anggota komunitas, Admin, Owner.

### P2 — Kurangi ketergantungan eksternal kecil

- Halaman QR memakai layanan QR pihak ketiga. Pertimbangkan generator QR lokal agar lebih privat dan tidak bergantung pada pihak eksternal.
- Pinterest/Bing/media downloader dan AI image generation bergantung pada layanan/API atau tool eksternal; tampilkan status dependency yang jelas dan fallback.
- SMTP belum wajib untuk bot lokal, tetapi email verification, password recovery, dan client invitation memerlukan SMTP untuk diuji penuh.

### P2 — Operasional dan skalabilitas

1. Uji pagination, search latency, image processing, dan concurrent upload dengan data realistis.
2. Buat backup terjadwal untuk MongoDB dan folder media; lakukan restore drill rutin.
3. Pastikan log memiliki correlation ID tanpa menyimpan OTP, password, session token, email, atau nomor privat secara berlebihan.
4. Buat retention policy untuk lead, support ticket, notification, dan analytics.
5. Pastikan media backup dan database backup selalu dipulihkan bersama saat dibutuhkan.

## Perbaikan yang dilakukan selama audit ini

- Menyamakan README dan roadmap dengan bot v5.96.0 / website v3.43.0.
- Memperbarui browser asset cache-busting dari `v=5880` ke `v=5960`.
- Menaikkan public service-worker cache dari `pir-visuals-public-v39` ke `pir-visuals-public-v40`.
- Service worker kini menghapus cache publik versi lama saat aktivasi, tanpa menyentuh private routes.
- Memperbarui test lama yang masih mengharapkan perintah `npm install`; installer saat ini sengaja menggunakan `npm ci` berdasarkan lockfile.

## Hasil validasi source setelah perbaikan

- `npm run check`: PASS — 238 file JavaScript.
- `npm run website:check`: PASS.
- `npm run audit:release`: PASS.
- Website tests: 372/373 PASS pada environment audit ini. Satu test file tidak dapat dimuat karena package `mongoose` tidak tersedia pada `portfolio-website/node_modules`. Ini adalah kegagalan environment/dependency, bukan assertion produk yang gagal.
- Root full test suite tidak dapat diverifikasi pada environment audit ini karena dependency root `mongoose` tidak tersedia.
- Tidak ada browser E2E atau live WhatsApp/MongoDB test yang dapat diklaim dari audit source ini.

## Rekomendasi roadmap berikutnya

**v5.97.0 — Directory Quality, Trust & Scope Alignment**
1. Putuskan apakah route website `/contact/:designerId` dinonaktifkan atau dipertahankan sebagai workspace opsional.
2. Paginasi, count filter, dan filter harga yang benar.
3. Definisi badge verifikasi dan transparansi testimoni.
4. Kejelasan kalender ketersediaan.
5. Audit notifikasi push opt-in.
6. Playwright E2E untuk alur utama website dan bot.
7. Sinkronisasi dokumentasi, command catalog, release metadata, dan cache.

**Jangan menambah payment, checkout, komisi, escrow, atau order workflow ke bot.** PIR Visuals bot tetap menjadi direktori portofolio dan jalur kontak langsung.
