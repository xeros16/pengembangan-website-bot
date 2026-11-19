# Revisi Heading Showcase Zoom-Safe — 19 November 2026

Memperbaiki judul `Karya & aktivitas komunitas.` yang terdorong keluar layar saat browser di-zoom.

- Penyelarasan geometris hanya aktif pada layout desktop (viewport CSS minimal 901px).
- Pada viewport yang lebih sempit, posisi judul direset ke alur responsif normal.
- Pada desktop, offset penyelarasan dibatasi agar seluruh blok judul tetap berada di dalam viewport.
- Heading menggunakan grid satu kolom dan lebar fleksibel pada layout responsif.
- Carousel, artwork, dekorasi ranting, dan copy panel tidak diubah.

File utama: `pir-home-showcase.js`, `pir-showcase-editorial.css`, `server.js`.
