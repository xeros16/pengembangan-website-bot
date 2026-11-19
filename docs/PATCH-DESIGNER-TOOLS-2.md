# Patch lanjutan — alat bantu desainer

Menambahkan dua kemudahan untuk workflow desain:

- `.contrast <HEX teks> <HEX latar>` menghitung rasio kontras berdasarkan luminansi relatif dan menilai ambang WCAG AA/AAA untuk teks normal dan teks besar.

Contoh:
- `.contrast #222222 #FFFFFF`
- `.contrast 777 FFF`
- `.colorpalette futuristik`

Perintah kontras hanya memeriksa rasio warna. Ia tidak menggantikan audit aksesibilitas lengkap, dan hasil tidak mempertimbangkan ukuran/ketebalan font aktual selain ambang teks besar yang dijelaskan.

## Penerapan
Ekstrak patch kumulatif ke folder proyek yang sama. Pertahankan `.env`, sesi WhatsApp, database, dan data langganan lokal. Jalankan `npm test` dan `npm run check` sebelum menyalakan bot.
