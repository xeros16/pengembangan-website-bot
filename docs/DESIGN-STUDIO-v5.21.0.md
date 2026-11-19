# Design Studio Expansion v5.21.0

Status: kandidat patch; verifikasi produksi WhatsApp belum dilakukan.

## Perintah baru
- `.fontstudio [mood] [poster|feed|banner|web]`: pasangan heading/body dan hierarki contoh. Mood: elegan, modern, playful, futuristik, editorial, bold.
- `.layoutstudio <poster|feed|banner|web>`: grid, rasio awal, urutan hierarki, dan checklist komposisi.
- `.socialkit <preset>`: ukuran kanvas umum, safe area, dan checklist carousel. Preset: instagram_feed, instagram_square, instagram_story, tiktok, youtube_thumbnail, youtube_banner, facebook_cover, linkedin_post.
- `.resourcefind <font|icon|mockup|texture|asset> [kata kunci]`: direktori sumber terkurasi dengan tautan resmi dan catatan lisensi.

## Batasan
- Rekomendasi tipografi/layout adalah titik awal, bukan pengganti brief, uji keterbacaan, atau spesifikasi vendor.
- Ukuran platform dan safe area dapat berubah; cek dokumentasi/platform sebelum publish.
- Resource Finder adalah direktori tautan, bukan crawler/verifikator lisensi. Lisensi harus diperiksa per aset dan versi sebelum penggunaan komersial.
- `.fontpair` dan `.typography` lama tetap dipertahankan.

## Instalasi
Salin file patch sesuai struktur folder. Jangan timpa `.env`, folder `auth_info_baileys`, database, `node_modules`, maupun file konfigurasi runtime.
