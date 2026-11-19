# PIR Visuals — paket perusahaan

Status: kode diperbaiki dan paket deployment disediakan. Belum dipublikasikan; belum lulus uji penerimaan perusahaan. Fitur asli portofolio, dashboard, ruang proyek, dan bot dipertahankan. Tidak ada perubahan brand perusahaan tanpa materi resmi.

## Perubahan
- CSS dan JavaScript utama dibaca asinkron sekali per proses, bukan sinkron setiap permintaan. Restart aplikasi setelah mengganti aset.
- ETag mendukung respons 304 dan HEAD untuk mengurangi transfer ulang.
- Shutdown dibatasi 25 detik agar deployment tidak menggantung karena koneksi aktif.
- Docker, reverse proxy Caddy, kompresi respons, volume upload persisten, dan healthcheck disiapkan.

## Menjalankan di server perusahaan
1. Siapkan Docker Compose, MongoDB perusahaan, domain, dan akun SMTP. Gunakan database staging untuk uji awal.
2. Salin `deploy/production.env.example` menjadi `deploy/production.env`. Isi domain, URL publik, URI MongoDB, akun dashboard, salt acak, dan SMTP. Cocokkan juga opsi fitur lain pada `.env.example` dengan kebutuhan organisasi.
3. Arahkan DNS domain ke server; buka port 80/443. Jalankan dari direktori proyek:

```sh
docker compose -f deploy/compose.yaml --env-file deploy/production.env up -d --build
docker compose -f deploy/compose.yaml ps
docker compose -f deploy/compose.yaml logs --tail=100 website
```

4. Periksa `/health`, homepage, pencarian, login owner/desainer, unggah karya, moderasi, email verifikasi, dan ruang proyek klien. Uji desktop dan ponsel dengan data staging.
5. Sesuaikan profil, identitas, layanan, informasi kontak, kebijakan privasi, dan persetujuan penggunaan data sebelum peluncuran.

Compose menjalankan website saja. Bot WhatsApp tetap dijalankan terpisah menggunakan petunjuk proyek asli dan database yang sama bila integrasi diperlukan. Rate limiter saat ini berada di memori proses: gunakan satu replika website sampai penyimpanan limiter bersama diimplementasikan. Proxy langsung membuat alamat klien di aplikasi menjadi alamat proxy; pembatasan berbasis IP dapat terhitung bersama. Evaluasi dan implementasikan trusted-proxy sesuai topologi sebelum trafik perusahaan besar; jangan mengaktifkan header Cloudflare jika origin dapat diakses langsung.

## Operasional
Backup MongoDB dan volume upload setiap hari; uji pemulihan ke staging sebelum go-live. Simpan konfigurasi rahasia di pengelola secret perusahaan. Simpan image rilis sebelumnya untuk rollback; jangan hapus volume saat redeploy. Pantau error, kapasitas disk, respons health, dan pengiriman email. Sesuaikan batas sumber daya berdasarkan pengukuran beban nyata.

ZIP asli memuat `.env` dan folder autentikasi bot. Paket distribusi ini tidak menyertakan kredensial, sesi, backup, data runtime, atau node_modules. Jika ZIP asli pernah dibagikan ke pihak yang tidak berwenang, ganti kredensial terkait dan sesi bot.

## Batas verifikasi
Docker build, TLS, MongoDB, SMTP, pengujian beban, audit dependensi daring, dan pengujian browser end-to-end belum dijalankan. Tidak ada klaim sertifikasi keamanan atau kesiapan produksi penuh. Lihat `COMPANY-TEST-RESULTS.txt` untuk hasil pengujian otomatis aktual.
