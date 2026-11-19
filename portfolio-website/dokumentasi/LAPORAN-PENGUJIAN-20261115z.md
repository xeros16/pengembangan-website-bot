# Laporan pengujian UI — PIR Visuals 20261115z

Perubahan diperiksa melalui CSS lengkap yang diekstrak dari `server.js` dan semua stylesheet proyek dengan urutan aslinya, bersama DOM FAQ, manifesto, serta tombol hero/footer. Penanganan pointer magnetik diuji menggunakan potongan handler asli dari `server.js`.

- **Chromium 390, 768, 1365, 1920 px**: awal teks FAQ question dan answer punya selisih horizontal **0 px** pada ketiga item yang terbuka.
- Baris manifesto 01, 02, dan 03: tinggi **54 px** masing-masing; 01/02 disesuaikan secara optis 2 px pada teksnya.
- Overflow horizontal: **0 px** pada empat lebar tampilan.
- Hover CTA hero dan footer dengan event mouse: kedua elemen menerima kelas `.pv-magnetic` dan variabel `--pv-magnetic-x`/`--pv-magnetic-y`, serta berpindah posisi akibat pointer.
- `npm run check`: lulus.
- Tes regresi terkait (file baru + kartu dan interaksi sebelumnya): **14/14 lulus** setelah tes lama yang memeriksa cache `20261115y` diperbarui sesuai versi aktif.

**Batas pengujian**: ini adalah render HTML/CSS proyek dalam Chromium dengan DOM tujuan yang dibangun untuk QA. Bukan pengujian otomatis terhadap koneksi MongoDB atau rilis produksi. Alur situs lengkap, login dan transaksi perlu diuji terpisah dengan database staging.
