# Product Feature Audit — PIR Visuals v5.97.0

Tanggal: 13 November 2026  
Status: development candidate; local acceptance still required.

## Keputusan produk yang dikunci

PIR Visuals memakai model **hybrid**:

- WhatsApp bot tetap menjadi direktori portofolio dan jalur kontak langsung. Bot tidak membuat brief, lead, project room, order, checkout, payment, komisi, escrow, atau mediasi transaksi.
- Website mempertahankan project workspace sebagai fitur opsional. Direct WhatsApp contact tetap menjadi jalur utama; workspace hanya membantu klien dan desainer mencatat brief, progres, dan feedback.
- PIR Visuals tidak memproses pembayaran, menahan dana, mengambil komisi, menjadi pihak kontrak, atau menjamin hasil kerja/pembayaran.

## Perubahan v5.97.0

### Directory quality — implemented

- Pagination 24 desainer per halaman.
- Filtered result count, range hasil, dan pagination links yang mempertahankan parameter pencarian.
- Relevance ranking berdasarkan exact name, name text, specialties, bio, dan location.
- Sorting terbaru, nama, harga minimum, dan featured.
- Budget filter memakai irisan rentang harga: `designer.priceMin <= budgetMax` dan `designer.priceMax >= budgetMin`.
- Profil lama dengan `priceMax` hilang atau bernilai nol diperlakukan sebagai titik harga `priceMin`.
- Rentang min/max terbalik menampilkan peringatan dan tidak mengembalikan hasil.
- Index tambahan untuk sorting newest dan price tersedia di kedua model profil bersama; ada script additive `npm run db:ensure-directory-indexes`.

### Trust & reputation — implemented

- `isVerified` tetap dipertahankan untuk kompatibilitas, tetapi label publik berubah menjadi “Profil ditinjau PIR”.
- Dokumen standar review profil membatasi arti badge: bukan sertifikasi identitas hukum, bukti transaksi, jaminan kualitas, atau garansi delivery.
- Testimonial menggunakan istilah “Email terverifikasi” dan menjelaskan bahwa PIR tidak memverifikasi hubungan klien/proyek/transaksi.
- Label rating tinggi juga menjelaskan bahwa rating berasal dari ulasan email-terverifikasi dan moderasi, bukan rating transaksi.

### Availability — implemented

- `availabilityPublic` bersifat opt-in dan default `false`.
- Desainer dapat mengaktifkan kalender publik dari Designer Studio.
- Hanya tanggal dan status yang tampil; catatan internal kalender tidak pernah dirender pada profil publik.
- Pengunjung diminta mengonfirmasi jadwal secara langsung kepada desainer.

### Hybrid workspace — implemented

- Website tetap menyediakan route brief dan private project room sebagai fitur opsional saat desainer mengaktifkan penerimaan brief workspace.
- Public profile menempatkan kontak WhatsApp langsung sebagai jalur utama dan menampilkan CTA workspace sebagai pilihan sekunder.
- Intake page dan kedua sisi workspace menegaskan tidak ada payment, checkout, komisi, escrow, atau mediasi transaksi PIR.
- Bot tetap direktori langsung dan tidak mengelola workspace website.

## Belum selesai / next release

1. WhatsApp push notifications opt-in. Saat ini website menulis inbox notification dan bot membacanya secara privat; push memerlukan worker lintas proses, outbox/queue, retry, deduplication, quiet hours, dan kontrol opt-out.
2. Playwright browser E2E untuk directory, profile, Designer Studio, moderation, dan optional workspace.
3. Live MongoDB acceptance untuk query `$expr`, aggregation relevance, dan index creation.
4. SMTP invite test untuk optional workspace.
5. Fresh WhatsApp account acceptance dan backup/restore database plus media.

## Validasi source pada environment pengembangan

- `npm run check`: PASS — 241 JavaScript files.
- `npm run website:check`: PASS.
- `npm run audit:release`: PASS.
- v5.97 regression tests: 14/14 PASS.
- Website suite: 386/387 PASS; satu test integration (`final-audit-v5.88.test.js`) tidak dapat dimuat karena `mongoose` tidak tersedia pada `portfolio-website/node_modules` environment ini.
- Root suite: 454/462 PASS; delapan test memerlukan `mongoose` yang tidak tersedia di root `node_modules`.

## Keputusan rilis

v5.97.0 belum boleh disebut Stable Release. Jalankan `npm ci` dan `npm run website:install` pada komputer lokal, lalu ulangi seluruh suite dan acceptance checklist sebelum rilis stabil.
