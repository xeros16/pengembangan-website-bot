# PIR Visuals — Revisi Discover (2026-11-15 AL)

Perubahan lanjutan pada halaman **Jelajahi / Discover**:

1. **Animasi dekorasi hero dipulihkan**
   - Ornamen seal `PIR Visuals` di sisi kanan hero kembali bergerak halus.
   - Posisi rata-ratanya tetap berada di **tengah kanan hero**, supaya tidak naik terlalu ke atas seperti sebelumnya.
   - Ornamen lingkar luar juga ikut bergerak lembut sambil tetap memiliki efek breathing opacity.

2. **Band penuh di belakang “Cari talenta” diseimbangkan**
   - Band hijau sage penuh kiri–kanan tetap dipertahankan.
   - Jarak vertikal atas dan bawah dibuat lebih seimbang agar panel tidak terasa terdorong ke atas.
   - Ritme di mobile juga dirapikan agar margin atas-bawah konsisten.

3. **Aksesibilitas motion**
   - Saat sistem pengguna mengaktifkan `prefers-reduced-motion` atau mode motion situs dimatikan, animasi akan berhenti otomatis.

## File yang berubah
- `pir-public-polish.css`

## Saran pengecekan
- Buka `/discover` pada desktop.
- Pastikan dekorasi kanan hero bergerak halus tetapi tetap berada di area tengah kanan.
- Periksa section **Cari talenta** dan lihat apakah panel terasa lebih seimbang antara garis atas dan bawah.
- Cek juga pada lebar mobile.
