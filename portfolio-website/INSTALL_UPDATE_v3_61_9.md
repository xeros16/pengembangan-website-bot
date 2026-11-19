# Instalasi Update PIR Visuals Website v3.61.9

Update ini hanya menambahkan lapisan penyempurnaan layout desktop dan metadata versi website.

1. Cadangkan folder `portfolio-website` yang sedang digunakan.
2. Hentikan proses website.
3. Salin file dari paket update ke folder `portfolio-website` yang sama, timpa file dengan nama identik, dan pertahankan folder/file lain yang tidak ada di paket.
4. Jangan timpa `.env`, `node_modules`, data upload, atau folder autentikasi WhatsApp pada project utama.
5. Jalankan dari folder `portfolio-website`:

```bash
npm run check
node --test tests/desktop-refinement-v3.61.9.test.js
npm start
```

6. Buka `http://localhost:3080/`, lalu lakukan hard refresh dengan `Ctrl + Shift + R`.
7. Periksa desktop pada lebar 1440 px dan 1280 px, kemudian tablet pada 1024 px. Layout mobile 900 px ke bawah tidak diubah oleh patch ini.

## File dalam update

- `server.js`
- `pir-desktop-refinement.css`
- `package.json`
- `package-lock.json`
- `tests/desktop-refinement-v3.61.9.test.js`
- `RELEASE-NOTES-v3.61.9.md`

Update ini tidak mengubah database, autentikasi, konfigurasi bot, route, maupun upload pipeline.
