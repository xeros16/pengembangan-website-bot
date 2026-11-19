# PIR Visuals Website v3.53.0 — Perbaikan Upload & Workspace

## Foto profil
- JPG/PNG/WebP didekode di browser, dipotong ke 1:1, dipratinjau, lalu dioptimalkan menjadi WebP 512 × 512 (fallback PNG).
- Validasi server tidak lagi bergantung pada Sharp untuk foto profil; server memeriksa signature file dan dimensi gambar.
- File disimpan dengan ekstensi dan MIME yang sesuai, dan route foto profil mendukung WebP, PNG, dan JPEG.
- Jika optimasi browser gagal, file asli tetap dapat dikirim untuk divalidasi server.

## Upload SVG karya
- Preview mencoba SVG asli lebih dulu, lalu SVG yang sudah dibersihkan sebagai alternatif.
- Jika browser tidak bisa merasterisasi SVG, file SVG asli tetap dikirim ke server untuk diproses pada 72 DPI.
- Jika Sharp tidak siap, pesan server kini menjelaskan bahwa `npm ci` perlu dijalankan di folder `portfolio-website`.

## Workspace
- Jarak ikon ke teks menjadi 11 px.
- Cache `public-ui.js` diperbarui agar browser tidak memakai handler lama.
- Klik menu Workspace menggulir viewport secara eksplisit ke section yang dipilih dan memperhitungkan header sticky.
