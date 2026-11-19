# PIR Visuals — Revisi AM (15 November 2026)

## Perubahan

### 1. Memulihkan animasi dekorasi PIR Visuals di halaman Jelajahi
- Menghilangkan deklarasi `translate:0 0!important` yang mengunci posisi meskipun animasi CSS aktif.
- Menghilangkan deklarasi `offset-distance:0%!important` di kondisi normal sehingga animasi dapat melintasi orbit.
- Mengganti lintasan dengan kurva tertutup (`offset-path`) yang berulang secara kontinu dan bergerak halus ke segala arah.
- Dekorasi tetap berpusat di **tengah kanan** hero; efek animasi tidak memindahkannya ke atas.
- Pengaturan aksesibilitas `prefers-reduced-motion` dan mode animasi Off tetap dihormati.

### 2. Menyeimbangkan panel penuh kiri–kanan “Cari talenta”
- Menghapus margin eksternal atas/bawah yang membuat jarak antarband tampak tidak konsisten.
- Menggunakan padding vertikal yang sama pada kedua sisi panel (desktop: `clamp(60px,5.6vw,84px)`, ponsel: `42px`).
- Memusatkan konten dengan `align-items:center` serta mempertahankan lebar penuh `100vw`.

### 3. Cache-busting
- URL CSS di `server.js` diperbarui dari `pir-public-polish.css?v=20261115ak` menjadi **`pir-public-polish.css?v=20261115am`**.
- Tujuannya agar browser tidak membaca versi lama dengan nama URL yang sama.

## File sumber yang diubah
- `pir-public-polish.css`
- `server.js`

## Cara memasang
1. Cadangkan proyek lama.
2. Ekstrak ZIP Part 1 sehingga folder `portfolio-website/` menggantikan/menyatukan file proyek lama.
3. Jalankan ulang server Node.js (`npm start`, atau perintah startup Anda).
4. Tekan Ctrl + Shift + R pada Chrome.
5. Periksa kode sumber halaman (Ctrl + U), pastikan CSS bertanda `pir-public-polish.css?v=20261115am`.
6. Pastikan pengaturan animasi situs **On** dan sistem tidak menggunakan Reduce motion jika ingin menyaksikan animasinya.

## Lingkup pemeriksaan
Pemeriksaan browser dilakukan terhadap fixture HTML dengan struktur class yang sama dan seluruh stylesheet yang dimuat. Pemeriksaan mengukur keyframe CSS dan geometri panel. Pengujian antarmuka menyeluruh dengan server/database milik Anda belum dilakukan.
