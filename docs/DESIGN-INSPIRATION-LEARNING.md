# Design Inspiration & Learning

Modul ini offline-first untuk materi inspirasi, latihan, dan penyusunan portfolio. Tidak memerlukan API eksternal untuk menghasilkan panduan teks.

## `.designinspire <kategori> [tema/gaya]`
Menyediakan keyword referensi, arahan eksplorasi, latihan singkat, dan tautan pencarian eksternal.

Kategori: `poster`, `branding`, `ui`, `social`, `packaging`, `illustration`, `typography`, `photography`.

Contoh:
```text
.designinspire poster cyberpunk merah hitam
.designinspire branding kopi modern
.designinspire ui dashboard fintech
```
Tautan Pinterest dan Bing Images adalah pencarian eksternal. Bot tidak mengunduh, mengkurasi, atau memverifikasi lisensi gambar.

## `.designlearn <tingkat> [topik]`
Materi belajar bertahap untuk `pemula`, `menengah`, dan `lanjutan`. Topik: `dasar`, `warna`, `tipografi`, `layout`.

Contoh:
```text
.designlearn pemula
.designlearn pemula warna
.designlearn menengah tipografi
.designlearn lanjutan layout
```
Materi bersifat panduan belajar mandiri dan latihan praktik, bukan sertifikasi atau penilaian otomatis.

## `.designchallenge <harian|mingguan> [kategori]`
Menghasilkan tantangan desain dari pustaka lokal. Tantangan mencakup brief, batasan, output yang diharapkan, dan pertanyaan evaluasi mandiri.

Kategori: `poster`, `branding`, `ui`, `social`, `packaging`, `illustration`, `typography`, `photography`.

Contoh:
```text
.designchallenge harian
.designchallenge harian poster
.designchallenge mingguan branding
```
Pilihan tantangan stabil untuk tanggal/minggu UTC yang sama dan berotasi mengikuti kalender UTC. Tantangan tidak disimpan sebagai progres pengguna; bot belum menerima atau menilai karya secara otomatis.

## `.portfolioguide`
Membantu menyusun portfolio profesional, checklist publikasi, bio singkat, dan kerangka case study.

Contoh:
```text
.portfolioguide mulai
.portfolioguide checklist
.portfolioguide case-study Kopi Senja | Branding | Brand belum dikenal | Riset, sketsa, dan iterasi logo | Identitas siap digunakan
.portfolioguide bio Brand identity | 2 tahun proyek freelance | Figma dan Illustrator
```
Builder menghasilkan kerangka teks, bukan portfolio website atau file PDF. Pengguna harus memastikan klaim, metrik, izin publikasi, dan hak penggunaan aset benar.

## Batasan umum
- Tidak ada pencarian web langsung di dalam modul ini.
- Tautan referensi membuka layanan eksternal.
- Materi belajar dan rubric bersifat panduan, bukan sertifikasi.
- Tidak ada penyimpanan otomatis atas challenge yang dikerjakan atau portfolio draft.
