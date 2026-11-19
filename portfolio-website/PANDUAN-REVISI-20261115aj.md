# PANDUAN REVISI PIR VISUALS — 2026-11-15 (putaran AJ)

## Fokus revisi
Putaran ini merapikan konsistensi visual pada halaman publik yang masih belum seragam setelah revisi sebelumnya.

### Permintaan yang ditangani
1. **Cari Talenta / Discover**
   - menambahkan band/kotak full kiri-kanan untuk section **Cari talenta**,
   - meningkatkan kontras warna kotak terhadap latar,
   - menjaga section lebih terasa seperti satu stage penuh.

2. **Dekorasi kanan**
   - memindahkan dekorasi orbit/seal agar berada di **tengah sisi kanan**, bukan terlalu naik ke atas.

3. **Menu Untuk Bisnis**
   - merapikan gap atas-bawah agar seimbang,
   - menghilangkan gap atas judul yang terlalu besar,
   - membuat warna 3 kartu lebih berbeda dari latar.

4. **Halaman publik lain yang ikut dirapikan**
   - Semua Fitur Bot / Command Explorer
   - Favorit
   - Moodboard / Collections
   - Tentang
   - Kategori
   - Creative Studio
   - Cara Kerja
   - Ruang Klien
   - Portal Desainer / Designer Studio login

## File yang diubah
- `pir-public-polish.css`

## Ringkasan perubahan teknis
Perubahan dilakukan sebagai **lapisan override CSS terakhir**, supaya aman dan cepat diterapkan tanpa membongkar struktur route/server.

### Yang ditambahkan
- sistem variable stage/band global untuk halaman publik,
- full-width band pada section-section yang sebelumnya masih terlihat “mengambang”,
- penyeimbangan padding atas-bawah pada hero/stage,
- peningkatan kontras background inner-card / shell / panel,
- reposisi dekorasi kanan ke area tengah,
- perapian beberapa page wrapper berbasis selector `:has(...)` agar spesifik ke halaman terkait.

## Efek hasil revisi
- area kosong atas/bawah di banyak halaman jadi lebih rapi,
- container tengah lebih terbaca karena warna panel lebih jelas dari latar,
- section publik terasa lebih konsisten antar menu,
- hero kanan tidak lagi terasa “ketarik ke atas”,
- form login / client / collection builder tampil lebih menyatu dengan sistem layout yang sama.

## Cara pasang
1. Ekstrak ZIP part source code ke folder kerja Anda.
2. Timpa file lama bila diminta.
3. Jalankan ulang server Node.js.
4. Hard refresh browser dengan **Ctrl + Shift + R**.

## Catatan
Jika setelah pemasangan masih ada 1–2 halaman yang ingin dibuat **lebih presisi lagi per pixel** (misalnya tinggi hero tertentu, atau jarak antar blok tertentu), kirim screenshot terbaru setelah revisi ini aktif supaya penyamaan bisa dilanjutkan lebih akurat.
