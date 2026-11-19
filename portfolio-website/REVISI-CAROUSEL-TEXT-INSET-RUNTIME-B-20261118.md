# Revisi carousel — text inset runtime B (18 November 2026)

- Menghapus wrapper teks tambahan `.pv-showcase-copy-inner` yang memutus selector anak langsung yang sudah dipakai stylesheet.
- Menambahkan penanda `data-pv-showcase-copy` langsung pada kolom teks kiri untuk semua slide karya dan event.
- Pada desktop (viewport minimal 901px), JavaScript menerapkan `padding-left dan padding-right sama-sama `clamp(76px, 6.8vw, 104px) !important`` langsung pada kolom teks yang dirender. Nilai kiri dan kanan selalu sama.
- Padding vertikal dipertahankan: atas 46px dan bawah 42px.
- Saat masuk breakpoint mobile, properti inline desktop dilepas sehingga aturan mobile lama tetap mengatur tampilan.
- Kolom gambar, sumber gambar, rasio, object-fit, dan grid 50/50 tidak diubah.
- Cache key stylesheet dan script diperbarui ke `20261118-copy-inset-runtime-b`.
