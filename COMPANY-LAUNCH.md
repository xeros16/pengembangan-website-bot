# PIR Visuals — Company Edition

Paket kode website PIR Visuals, dikembangkan dari proyek yang diberikan. Arah visual mengacu pada logo dan karakter PIR Visuals: hijau hutan, sage, ivory, dan aksen tanah. Ritme editorial tetap dipakai tanpa menyalin identitas warna Bettr Academy.

## Cakupan website

| Halaman / alur | URL utama | Status |
| --- | --- | --- |
| Beranda editorial, katalog karya dan talent | `/` | Dinamis (MongoDB) |
| Direktori desainer dan filter | `/discover` | Backend lama dipertahankan |
| Halaman kategori | `/categories` | Backend lama dipertahankan |
| Solusi bisnis | `/for-business` | Ditambahkan dalam paket ini |
| Tentang dan cara kerja | `/about`, `/how-it-works` | Konten dan desain diperluas |
| Karya, profil dan ulasan | `/work/...`, `/designer/...`, `/p/...` | Backend lama dipertahankan |
| Favorit, shortlist dan moodboard | `/favorites`, `/shortlist`, `/collections` | Backend lama dipertahankan |
| Designer Studio, login dan manajemen portfolio | `/studio`, `/dashboard` | Backend lama dipertahankan |
| Brief dan ruang proyek klien | `/client` dan tautan undangan | Backend lama dipertahankan |
| Kontak, dukungan dan tiket | `/contact` | Backend lama dipertahankan |
| Panduan Creative Studio dan katalog bot | `/creative-studio`, `/commands` | Backend lama dipertahankan |
| Privasi dan ketentuan | `/privacy`, `/terms` | **Draf; perlu pemeriksaan legal** |

Seluruh halaman yang memakai `pageShell` memuat `portfolio-website/company-editorial.css` untuk gaya konsisten. Mode terang adalah default pengunjung baru; preferensi tersimpan tetap dihormati. Mode gelap, navigasi mobile, animasi reduced-motion, fungsi pencarian, modal, form, panel owner, dan API lama tidak sengaja dihapus.

**STATUS GO-LIVE: DITAHAN.** Endpoint `/health` mengembalikan HTTP 503 tanpa MongoDB, integrasi gagal pada MONGO_URI, tes website gagal 17 (dari 432), dan tes proyek induk gagal 27 (dari 679). Jangan unggah paket ini ke produksi sebelum semua jalur kritis lolos.

## Kebutuhan sebelum website benar-benar live

1. Domain yang dikelola perusahaan; konfigurasi DNS A/AAAA ke IP server.
2. Server yang mendukung Docker Compose dan port 80/443.
3. MongoDB yang dapat diakses container website (URI dan backup dikelola perusahaan). Database existing harus dimigrasikan/diakses sesuai prosedur, tidak ada data pengguna yang disertakan di rilis.
4. Kredensial Owner website; SMTP aktif untuk verifikasi email, OTP dan undangan ruang proyek.
5. Informasi dukungan perusahaan, merek/logo resmi jika diinginkan, kebijakan privasi final, syarat penggunaan, dan rencana respons insiden.

## Deploy dengan Docker Compose

Dari direktori ini:

```bash
cp deploy/production.env.example deploy/production.env
# Edit production.env dan isi seluruh nilai wajib; jangan commit atau bagikan file ini.
docker compose -f deploy/compose.yaml --env-file deploy/production.env up -d --build
docker compose -f deploy/compose.yaml ps
docker compose -f deploy/compose.yaml logs --tail=100 website
```

Caddy memproksi website dan mengurus TLS untuk domain yang valid dengan DNS yang benar. Jangan mempublikasikan port database ke internet. Pastikan `MONGO_URI` benar; website tidak akan memulai tanpa URI database. Cek `https://DOMAIN/health`, `/`, `/discover`, `/for-business`, `/studio`, `/contact`.

## Jalankan lokal

```bash
npm run website:install
cp .env.example .env
# Edit MONGO_URI, DASHBOARD_USER, DASHBOARD_PASSWORD dan pengaturan SMTP.
npm run website
```

Buka `http://127.0.0.1:3010` bila menggunakan pengaturan `.env.example`; atau gunakan URL sesuai konfigurasi. **Jangan gunakan nilai contoh sebagai kredensial produksi.**

## Pengujian

- `cd portfolio-website && npm run check` — lolos pada proses penyiapan paket.
- `cd portfolio-website && npm test` — 415/432 tes lolos pada audit revisi. Ketujuh belas kegagalan adalah pemeriksaan versi statis lama yang mengharapkan platform 6.7.2, sedangkan paket sumber telah 6.7.3; jumlah serta jenis kegagalan sama dengan baseline rilis yang diunggah.
- HTTP route smoke tanpa database menggunakan stub Sharp khusus pengujian; 16 tautan publik di navigasi/footer mengembalikan status 200. Beranda serta direktori diperiksa menggunakan model database kosong yang dimock. Form kontak menolak input tidak valid dengan status 400.
- Render browser Chromium pada 10 halaman × 6 lebar layar (60 kasus) tidak menunjukkan horizontal overflow atau error JavaScript. Interaksi menu, tema, filter, FAQ, dan validasi formulir telah diperiksa secara lokal. **Uji build Docker nyata, login MongoDB, pengiriman SMTP, upload gambar Sharp asli, beban server, TLS domain, audit keamanan operasional, dan persetujuan legal belum dilakukan.**

## Keamanan dan data

Rilis ini **tidak** menyertakan `.env` aktual, kredensial dan sesi WhatsApp (`auth_info*`), folder node_modules, backup, database ekspor, file upload pelanggan, atau data runtime. ZIP sumber yang diberikan memuat data sensitif seperti file `.env` dan sesi WhatsApp. Jika ZIP sumber pernah dibagikan atau dipublikasikan, lakukan rotasi kredensial dan sesi terkait. Simpan password dan URI database di penyimpanan rahasia perusahaan.

Konfigurasi konten situs seperti identitas resmi, alamat, foto karya, serta pengaturan layanan harus dikonfirmasi dengan pemilik perusahaan sebelum go-live. Jangan menampilkan portofolio, angka keberhasilan, ulasan atau harga yang belum diverifikasi.
