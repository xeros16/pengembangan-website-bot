# PIR Visuals v5.78.0 — Motion & Visual Experience

## Ringkasan
v5.78.0 memperbaiki kontras Light Mode pada kartu statistik hero dan memperkenalkan GSAP 3.15.1 sebagai animation engine untuk interaksi serta scroll storytelling website.

## Perbaikan Light Mode dari screenshot
- Memperbaiki teks `Great work deserves to be discovered.` yang sebelumnya mewarisi warna pucat dari aturan teks hero gelap, padahal berada di dalam kartu indeks berwarna ivory.
- Memberi warna teks #4B594E pada heading, label statistik, dan supporting copy di kartu indeks.
- Memperkuat warna angka statistik dengan #263B2B.
- Menaikkan ukuran teks pendukung menjadi 11 px dan label statistik menjadi 8 px.
- Menjaga kartu tetap ivory dengan border sage yang jelas.
- Kontras teks pendukung pada permukaan ivory melewati WCAG AA untuk teks normal.

## GSAP Motion System
Dependency website:
- `gsap@3.15.1`
- `ScrollTrigger` dari paket GSAP yang sama

Penerapan:
- Hero intro timeline: overline, kinetic headline, description, CTA, dan statistics card.
- ScrollTrigger reveals untuk konten dan panel di halaman publik.
- Staggered timeline untuk kategori, kartu desainer, dan karya pilihan.
- Count-up angka statistik dengan easing.
- Motion ribbon looping yang pause ketika hover, focus, atau tab tidak aktif.
- Micro-interaction pada kartu dan tombol.
- Refresh ScrollTrigger saat konten dinamis ditambahkan.
- GSAP di-serve dari dependency lokal melalui route allowlist; tidak memuat script pihak ketiga dari CDN.

## Accessibility dan fallback
- GSAP tidak diaktifkan jika `prefers-reduced-motion: reduce` atau motion website dimatikan.
- Tombol Motion Off menghentikan timeline dan ScrollTrigger.
- IntersectionObserver + CSS motion lama tetap tersedia jika GSAP belum terpasang atau asset gagal dimuat.
- Tidak menggunakan smooth-scroll paksa, scroll pinning, atau animasi layout berat.

## Versi
- Platform: 5.78.0
- Website package: 3.32.0
- GSAP: 3.15.1
- Public service-worker cache: `pir-visuals-public-v24`
- Asset query string: `v=5780`

## Dampak instalasi
Perlu menjalankan `npm run website:install` satu kali agar dependency GSAP terpasang. Tidak mengubah skema database, data, `.env`, uploads, atau sesi WhatsApp.
