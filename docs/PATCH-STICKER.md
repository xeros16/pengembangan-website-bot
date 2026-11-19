# Catatan Patch Sticker

Perubahan pada `features/commands/image-processing.js`:

1. `.sticker 1:1` kini diarahkan ke handler `sticker1:1`, sehingga argumen `1:1` benar-benar menjalankan crop persegi.
2. Crop video menggunakan sisi terpendek dan posisi tengah, jadi tidak gagal pada video portrait.
3. Deteksi stiker WebP animasi ditambahkan; jika input stiker memiliki banyak frame, ia diproses lewat FFmpeg, bukan diratakan menjadi satu frame oleh Sharp.
4. Konversi animasi memakai 15 fps, format WebP eksplisit, dan loop tanpa batas. Opsi `-vsync 0` dihapus karena FFmpeg 9.0.2 tidak lagi mengenali opsi tersebut; filter `fps=15` tetap mengatur frame rate.

Pemeriksaan:
- `npm run check`: lulus (81 file JavaScript).
- `npm test`: belum seluruhnya dapat dijalankan di lingkungan analisis karena dependensi belum diinstal (`node-fetch` dan `mongoose` tidak ditemukan). Sebagian besar tes yang sempat berjalan lulus.

Penting: arsip patch sengaja tidak menyertakan `.env`, folder sesi autentikasi WhatsApp, `.git`, `node_modules`, folder backup, atau file sementara. Salin perubahan kode ke instalasi lokal dan pertahankan konfigurasi lokal Anda sendiri. Jangan membagikan file sesi autentikasi.


Perbaikan kompatibilitas FFmpeg 9: opsi `-vsync 0` dihapus dari kedua jalur video stiker.
