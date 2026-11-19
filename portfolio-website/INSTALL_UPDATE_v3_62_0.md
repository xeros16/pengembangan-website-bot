# Instalasi Update PIR Visuals v3.62.0

1. Backup folder `portfolio-website`.
2. Extract isi update ZIP ke folder project dan izinkan file revisi menimpa file lama.
3. Jangan timpa `.env`, `node_modules`, folder database, atau sesi autentikasi.
4. Jalankan dari folder `portfolio-website`:

```bash
npm run check
node --test tests/reference-blend-v3.62.test.js
npm start
```

5. Buka homepage dan `/discover` pada desktop 1440px, tablet 900px, dan mobile 390px.
6. Pastikan filter directory tetap bisa dipakai, tab showcase berpindah, dan reduced-motion tetap dihormati.

Update ini berisi source file yang berubah saja.
