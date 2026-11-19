# Revisi carousel — right text nudge F (18 November 2026)

- Mengacu pada screenshot terbaru: jarak kanan pada harga dan Profil kreator masih lebih besar daripada inset kiri judul.
- Menambah pergeseran horizontal elemen kanan dari 40 px menjadi 68 px total (+28 px dari revisi E).
- Harga di metadata dan tautan Profil kreator digeser dengan nilai yang sama.
- Garis putus-putus byline diperpanjang sampai `right: -68px` agar ujung garis sejajar dengan posisi teks kanan.
- Padding kiri, padding kanan induk, judul, deskripsi, label kategori, nama kreator, CTA, gambar, rasio, dan komposisi kolom tidak diubah.
- Perubahan hanya aktif pada viewport desktop (min-width 901 px); aturan mobile tetap dibersihkan oleh runtime dan tidak berubah.
- Cache key stylesheet dan runtime dinaikkan ke `20261118f`.
