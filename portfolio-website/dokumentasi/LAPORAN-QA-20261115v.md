# Laporan QA PIR Visuals — 20261115v

## Fokus pengujian

- Perataan vertikal baris manifesto 01–03
- Kontras warna efek party paper pada 4 kartu kategori
- Diferensiasi heading footer terhadap link footer
- Cache-busting asset yang diubah

## Hasil

**6/6 test lulus** menggunakan `node --test tests/party-paper-20261115v.test.js`.

### Yang diverifikasi

1. `server.js` memanggil asset baru dengan versi cache `20261115v`.
2. Efek party paper tetap hanya aktif pada 4 kartu kategori dan grafis footer.
3. Efek tetap mematuhi reduced motion dan tidak menghalangi interaksi.
4. Pembersihan partikel setelah animasi selesai tetap aktif.
5. Garis manifesto tidak lagi dobel pada baris pertama.
6. Palet kartu kini lebih gelap, dan heading footer memakai gaya serif editorial.

## Catatan

- Palet gelap hanya diterapkan untuk **kartu kategori** agar lebih terlihat pada latar terang.
- Palet footer tetap dipertahankan agar tidak terlalu berat pada section hero/footer yang gelap.
- Revisi ini merupakan kelanjutan dari paket `20261115u`, sehingga perubahan sebelumnya tetap dipertahankan.
