# Panduan Revisi PIR Visuals — 20261115v

## Revisi yang diterapkan

1. **Poin manifesto 01–03 dirapikan**
   - Baris 01 dan 02 disejajarkan ulang agar posisi teks lebih berada di tengah seperti baris 03.
   - Jarak terhadap garis atas dan bawah dibuat lebih seimbang.

2. **Party paper untuk 4 kartu kategori dibuat lebih gelap**
   - Efek hover pada kartu **Brand identity**, **Digital experiences**, **Visual storytelling**, dan **Campaign & content** sekarang memakai palet hijau-hutan dan earthy yang lebih gelap agar tetap terlihat jelas di atas latar terang.
   - Efek party paper di grafis footer tetap memakai palet sebelumnya agar tetap ringan di area gelap.

3. **Heading footer dibuat lebih setema dan lebih berbeda**
   - Judul kolom **Jelajahi**, **Perusahaan**, dan **Untuk kreator** memakai serif editorial agar lebih terasa sebagai heading dan lebih berbeda dari link-link di bawahnya.

4. **Cache-busting diperbarui**
   - `pir-footer-refinement.css?v=20261115v`
   - `pir-party-paper.css?v=20261115v`
   - `pir-party-paper.js?v=20261115v`

## File yang berubah

- `server.js`
- `pir-party-paper.css`
- `pir-party-paper.js`
- `pir-footer-refinement.css`
- `tests/party-paper-20261115v.test.js`

## Cara memasang

1. Cadangkan proyek aktif Anda.
2. Ekstrak isi ZIP Part 1 ke folder proyek yang sama, lalu timpa file lama.
3. (Opsional) Ekstrak ZIP Part 2 jika ingin menyimpan dokumen QA dan test file.
4. Restart server Node.js.
5. Di browser, tekan **Ctrl + Shift + R** untuk hard refresh.

## Checklist setelah pemasangan

- Hover ke 4 kartu kategori: partikel terlihat lebih gelap.
- Lihat bagian manifesto: teks 01 dan 02 terasa sepusat seperti 03.
- Lihat footer: heading **Jelajahi / Perusahaan / Untuk kreator** tampak lebih editorial dan lebih berbeda dari link di bawahnya.
