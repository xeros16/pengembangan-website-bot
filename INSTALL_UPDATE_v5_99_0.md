# Install / Update PIR Visuals v5.99.0

## Sebelum update

1. Hentikan bot dan website lokal.
2. Buat backup database dan folder media.
3. Simpan `.env`, sesi WhatsApp, allowlist lokal, `portfolio_uploads`, dan konfigurasi runtime.
4. Unduh kedua ZIP dan ekstrak keduanya ke folder proyek yang sama. Part 1 dan Part 2 bukan instalasi terpisah.

## Dependency

Dari folder root proyek:

```bash
npm ci
npm run website:install
```

## Pemeriksaan source dan regression

```bash
npm run check
npm run website:check
npm run audit:release
npm test
npm run website:test
```

## Uji browser

Jika Playwright belum dipasang:

```bash
npm run e2e:install
npm run test:e2e
```

## Jalankan lokal

```bash
npm run local:start
```

Jika proses dijalankan terpisah, gunakan terminal berbeda untuk bot dan website sesuai konfigurasi lokal.

## Uji Guided Designer Finder

1. Buka `/discover`.
2. Pilih kategori, skill, rentang anggaran, dan lokasi.
3. Tekan **Temukan desainer yang cocok**.
4. Pastikan jumlah hasil dan alasan kecocokan masuk akal.
5. Uji kata kunci berisi karakter regex seperti `+`, `(`, `[` dan `.`; hasil tidak boleh menimbulkan error atau memperluas pencarian secara tidak sengaja.
6. Uji anggaran preset dan profil lama yang hanya memiliki `priceMin`.
7. Pastikan profil featured/reviewed tidak otomatis mendapat skor lebih tinggi.
8. Pastikan tombol portfolio dan kontak tetap mengarah langsung ke desainer.

## Uji Portfolio Readiness

1. Login ke Designer Studio.
2. Buka bagian **Portfolio health**.
3. Uji akun baru/kosong dan akun yang memiliki profil lengkap.
4. Upload satu karya uji yang masih pending; skor karya publik tidak boleh bertambah sebelum disetujui.
5. Pastikan jumlah karya dihitung dari semua karya disetujui, bukan hanya daftar 30 item terbaru.
6. Pastikan skor dan detail checklist tidak muncul pada halaman profil publik atau halaman pengunjung.
7. Pastikan mengubah checklist tidak membuat lead, order, atau transaksi.

## Rollback

Jika ada masalah, hentikan kedua proses, pulihkan source folder dari backup versi sebelumnya, lalu pertahankan database dan folder media yang sama. v5.99.0 tidak memerlukan migrasi skema.
