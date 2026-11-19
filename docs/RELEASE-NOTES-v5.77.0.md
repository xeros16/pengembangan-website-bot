# PIR Visuals v5.77.0 — Universal Design System

## Ringkasan
v5.77.0 menerapkan satu lapisan desain universal pada seluruh keluarga halaman PIR Visuals. Pembaruan ini berfokus pada kontras, konsistensi permukaan, keterbacaan komponen, dan perilaku responsif di Light Mode maupun Dark Mode.

## Cakupan
- Homepage, hero editorial, statistik, kategori, dan section manifesto.
- Discovery, filter, direktori, kartu desainer, dan halaman profil/portfolio.
- Designer Studio, sidebar, KPI, editor konten, dan growth analytics.
- Shortlist, tabel, Moodboard, dan komponen collection.
- Client Workspace, ruang proyek, timeline, aktivitas, dan formulir pesan.
- Customer Support, kanal kontak, form tiket, notifikasi, dialog, quick view, dan command palette.
- Navigasi global, tombol, field, status chip, footer, serta layout mobile.

## Perbaikan visual penting
- Menyatukan semantic tokens untuk background, surface, border, text, muted text, accent, status, dan shadow.
- Memperjelas teks sekunder, label, placeholder, status, tabel, dan form.
- Mengganti panel abu-abu kusam dengan permukaan ivory/sage yang lebih jelas pada Light Mode.
- Mempertahankan panel editorial gelap sebagai elemen brand, tetapi memastikan teks dan aksen tetap terbaca pada kedua tema.
- Memperbaiki konflik `-webkit-text-fill-color` lama yang menyebabkan judul hero Light Mode menjadi gelap di atas panel gelap.
- Memperbaiki kontras kartu indeks di hero agar teks gelap berada di atas permukaan terang.
- Menyamakan active state navigasi Designer Studio, status proyek, chip filter, dan kontrol.
- Mengurangi intensitas garis dekoratif latar agar tidak bersaing dengan konten.
- Menjaga ukuran layar sempit tanpa horizontal overflow pada 320–1440 px.

## Cache dan versi
- Platform: 5.77.0
- Website package: 3.31.0
- Public service-worker cache: `pir-visuals-public-v23`
- Asset query string: `v=5770`

## Kompatibilitas
Pembaruan ini merupakan overlay source website. Tidak mengubah skema database, kredensial, `.env`, data upload, sesi WhatsApp, atau kode bot WhatsApp.
