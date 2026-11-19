# Laporan Quality Assurance — PIR Visuals 2026-11-14p

**Audit dari dua screenshot pengguna:** Beranda memiliki navbar penuh; direktori memperlihatkan navbar mulai pada x≈76 px dan terpotong di kanan.

**Hasil baseline Chromium, sebelum perbaikan (1365 px):**
- Beranda: navbar x=0, width=1365 px.
- `/discover`: navbar x≈47.8, width=1365 px, `scrollWidth`=1413 px (**48 px horizontal overflow**).
- Pada 1920 px, navbar `/discover` x≈302 px, `scrollWidth`=2222 px (**302 px overflow**).

**Hasil sesudah perbaikan:**
- 390 px: seluruh 8 rute navbar x≈0 dan width=390; tidak ada overflow.
- 1365 px: seluruh 8 rute navbar x≈0 dan width=1365; tidak ada overflow.
- 1920 px: seluruh 8 rute navbar x≈0 dan width=1920; tidak ada overflow.
- Semua delapan rute diuji tanpa error JavaScript pada kondisi pemeriksaan headless.
- Kontrol menu mobile dan filter direktori lolos tes interaksi.

**Perhitungan:** 33 pemeriksaan pada 390 px + 27 pemeriksaan pada 1365 px + 25 pemeriksaan pada 1920 px = **85/85**.

**Tes kode:** 6/6 baru lulus. Node syntax-check lulus. Full suite 159/189 lulus; 30 kegagalan lama belum diperbaiki.

**Batas pemeriksaan:** Browser pengujian memakai HTML/CSS/JS yang disajikan server mock dengan database desainer kosong. Karena jaringan browser sandbox tidak dapat membuka localhost secara langsung, halaman dan aset teks disisipkan oleh harness sebelum render. Hal ini memvalidasi layout dan interaksi visual terpilih, tetapi tidak menggantikan pengujian koneksi sistem produksi, gambar profil eksternal, email atau autentikasi nyata.
