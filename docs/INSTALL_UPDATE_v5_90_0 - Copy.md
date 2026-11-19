# Instalasi / Update PIR Visuals Bot v5.90.0

## Sebelum update
1. Hentikan proses bot dengan aman.
2. Buat backup database MongoDB dan folder sesi WhatsApp.
3. Simpan `.env` dan konfigurasi lokal di luar folder source yang akan diganti.
4. Pastikan versi Node.js sesuai dengan baseline proyek (Node.js 22 atau versi yang dinyatakan kompatibel pada environment deployment).

## Ekstrak source
1. Unduh Part 1 dan Part 2 dari paket `PIR-Visuals-v5.90.0-Clean-Source`.
2. Ekstrak keduanya ke folder proyek yang sama. Struktur folder dari kedua ZIP harus digabung, bukan dibuat sebagai dua instalasi terpisah.
3. Jangan menimpa folder `auth_info_baileys`, `backups`, `temp`, atau file `.env` milik instalasi yang sedang berjalan.
4. Pastikan `package.json` dan `package-lock.json` berasal dari v5.90.0.

## Instalasi dependensi dan pemeriksaan
Jalankan dari folder proyek:

```bash
npm ci
npm run check
npm test
npm run website:check
npm run website:test
npm run audit:release
```

Jika `npm ci` gagal, jangan menghapus folder sesi atau database. Perbaiki koneksi registry/dependensi terlebih dahulu.

## Jalankan
1. Pastikan MongoDB berjalan dan `MONGO_URI` benar.
2. Pastikan `OWNER_JIDS`, `PREFIX`, direktori sesi, dan konfigurasi lain di `.env` sesuai.
3. Jalankan `npm start`.
4. Periksa `.health` (Owner) dan readiness endpoint lokal.
5. Uji pesan WhatsApp dengan akun staging sebelum mengganti produksi.

## Mencoba Designer Workflow 2.0
```text
.designproject start Kopi Senja | web | website kopi modern | pelanggan dewasa | mobile-first
.designproject step Kopi Senja
.designproject done Kopi Senja
.designproject progress Kopi Senja
.designproject board
```

Tahap `done` harus dikirim hanya setelah checklist tahap tersebut diperiksa oleh pengguna.

## Penyimpanan
Workflow berada pada `User.preferences.designProjects`. Tidak ada migrasi database. Proyek lama yang belum memiliki `workflow` akan dimulai dari tahap Brief. Data proyek tetap privat berdasarkan JID pengguna.
