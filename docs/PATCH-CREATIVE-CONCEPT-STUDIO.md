# Creative Concept Studio — v5.20.0 work

## Perubahan

Perintah `.creative` ditingkatkan dari tiga kalimat konsep acak menjadi generator arahan kreatif terstruktur.

Format:

```text
.creative <topik> | <gaya opsional> | <platform/ukuran opsional>
```

Contoh:

```text
.creative kemasan kopi lokal | organik premium | pouch 250 gram
.creative dashboard aplikasi kasir | minimalis | desktop dan mobile
```

## Output

- Deteksi kategori proyek: identitas brand, kemasan, antarmuka digital, konten sosial, banner, atau poster/editorial.
- Tiga arah konsep deterministik: fokus & jelas, karakter & ekspresif, serta hangat & bercerita.
- Arahan produksi untuk fokus, komposisi, warna, dan tipografi.
- QA spesifik kategori proyek.
- Prompt teks siap salin dan pintasan ke Brief Wizard, Color Studio, Typography Studio, dan Design Review.

## Batasan

Generator ini berbasis template dan pencocokan kata kunci. Tidak menggunakan layanan AI eksternal, tidak membuat gambar, dan tidak menilai file desain secara otomatis. Rekomendasi perlu divalidasi terhadap brief, spesifikasi cetak/platform, dan lisensi aset.

## Pengujian

Jalankan:

```bash
node --test tests/creative-concept-studio.test.js tests/designprompt-v5.test.js tests/design-brief-wizard.test.js
npm run check
npm test
```

Pengujian penuh membutuhkan dependensi proyek terpasang melalui `npm ci`.
