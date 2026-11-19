# PIR Visuals v5.99.0 — Designer Intelligence & Platform Growth

**Status:** Development Candidate — local acceptance required.  
**Bot package:** 5.99.0  
**Website package:** 3.46.0

## Ringkasan

v5.99.0 berfokus pada peningkatan discovery untuk pengunjung baru dan alat bantu kelengkapan portfolio bagi desainer. Pengembangan ini mempertahankan model hybrid dan tidak menambahkan transaksi melalui PIR.

## Fitur baru

### 1. Guided Designer Finder

- Menambahkan panduan pencarian pada `/discover` untuk memilih bidang kreatif, skill, rentang anggaran, lokasi, dan kata kunci.
- Preset anggaran: di bawah Rp500 ribu, Rp500 ribu–Rp1,5 juta, Rp1,5–5 juta, dan di atas Rp5 juta.
- Hasil diurutkan menggunakan sinyal transparan: bidang utama (40), spesialisasi (35), lokasi (15), rentang harga yang tumpang tindih (10), dan kata kunci (15).
- Profil unggulan dan profil ditinjau PIR tidak menerima bonus skor; pengguna dapat menggunakan filter trust secara eksplisit.
- Setiap kartu hasil menampilkan alasan kecocokan yang tersedia.
- Hasil bukan rating kualitas, rekomendasi transaksi, atau jaminan ketersediaan. Pengunjung tetap menghubungi desainer secara langsung.
- Query pencarian tidak disimpan sebagai preferensi pengguna atau lead oleh fitur ini.

### 2. Private Portfolio Readiness

- Designer Studio menampilkan checklist kelengkapan profil dan portfolio.
- Mengukur identitas, positioning, jumlah karya disetujui, kelengkapan case study, kontak langsung, layanan aktif, dan cerita kreatif.
- Jumlah karya disetujui dihitung langsung dari database; tidak hanya dari 30 karya terbaru yang ditampilkan di workspace.
- Hanya tampil di Designer Studio pemilik akun.
- Skor bukan penilaian estetika, kemampuan profesional, popularitas, kualitas hasil, atau peluang mendapatkan klien.
- Setiap item checklist memiliki tautan ke bagian pengaturan yang relevan.

### 3. UX & accessibility

- Guided finder memiliki label form, target sentuh, layout responsif, dan penjelasan cara kerja.
- Kartu hasil menampilkan sinyal kecocokan tanpa menyembunyikan informasi harga/kontak.
- Portfolio readiness menyediakan progressbar berlabel dan checklist yang dapat diakses.
- Tema menggunakan token desain website yang sudah ada; tidak menambah warna tema terpisah.

## Kompatibilitas

- Tidak ada perubahan skema database.
- Tidak ada migrasi data.
- Tidak mengubah command bot, permission, pairing WhatsApp, atau data sesi.
- Bot tetap direktori dan kontak langsung.
- Project workspace website tetap opsional.
- Tidak ada payment, checkout, komisi, escrow, atau mediasi transaksi PIR.

## Validasi

- JavaScript syntax scan: 253 file lulus.
- Focused tests v5.99: 12/12 lulus.
- Directory quality regression v5.97: 14/14 lulus.
- Combined focused website tests: 28/28 lulus.
- Full website suite: 406/407; satu file audit lama tidak dapat dimuat karena dependency `mongoose` tidak tersedia pada environment ini.
- Full root suite: 479/487; delapan file/subtest membutuhkan `mongoose` yang tidak tersedia pada environment ini.
- Live MongoDB aggregation, rendered browser UI, mobile device, dan data riil masih harus diuji pada komputer lokal.

- Paket source dibagi menjadi dua ZIP; 609 file diverifikasi SHA-256 saat rekonstruksi gabungan. ZIP CRC lulus dan secret/runtime state dikecualikan.

## Gate rilis

Jangan menandai Stable sebelum seluruh test suite, Playwright, query MongoDB, akses Designer Studio, dan uji akun baru lulus pada komputer lokal.
