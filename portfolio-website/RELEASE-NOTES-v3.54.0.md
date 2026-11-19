# PIR Visuals Website v3.54.0

## Designer Studio fixes

- Foto profil PNG/JPG/WebP beresolusi tinggi (hingga 100 megapiksel dan 32.768 px per sisi) tidak lagi ditolak hanya karena melewati batas lama 20 megapiksel. Jika browser tidak berhasil mengoptimalkan gambar, server memakai Sharp untuk memotong ke 512 × 512 dan menyimpan WebP.
- Batas file foto profil tetap 5 MB. File yang rusak, format yang tidak cocok, atau gambar di atas batas aman tetap ditolak dengan pesan yang lebih jelas.
- Preview browser tetap mencoba optimasi lokal; bila browser tidak dapat menampilkan gambar, UI menandai tipe file yang dipilih dan memberi tahu bahwa server akan memvalidasinya saat disimpan.
- Tombol Simpan perubahan dan Hapus karya diberi pemisah visual dan jarak yang konsisten.
- Form testimoni dan layanan memakai jarak antarkontrol yang konsisten; tombol rating tidak lagi menempel pada dropdown.
- Form profil memisahkan label, input, keterangan bantuan, dan checkbox; textarea memakai line-height yang lebih lega agar lebih mudah dibaca.
- Tombol aksi memiliki tinggi minimum dan tata letak responsif untuk layar kecil.

## Verification

- `node --check server.js`
- `node --check portfolio-media.js`
- `node --test tests/portfolio-svg-upload.test.js tests/designer-studio-usability.test.js` — 16/16 lulus.
