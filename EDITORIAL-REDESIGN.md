# PIR Visuals — Creative Edition

Beranda diadaptasi dari arah visual https://bettr.academy/: header gelap, aksen kuning, headline besar, hero visual lebar, dan section editorial. Konten, ilustrasi geometris, dan identitas tetap PIR Visuals. Tidak menyalin foto, logo, atau teks Bettr.

## Perubahan
- Tema beranda: cokelat #302015, krem #f6eedf, kuning #ffcb32.
- Hero memakai karya pertama yang disetujui dari database; jika kosong memakai SVG lokal orisinal.
- Judul default: Ide berani. Karya berarti. Judul/subjudul yang disimpan melalui CMS tetap diprioritaskan.
- Kartu kategori pastel, section manifesto kuning, ajakan bergabung gelap.
- Layout adaptif ponsel, fokus keyboard, FAQ native, dan dukungan prefers-reduced-motion.
- CSS hanya berlaku pada beranda, sehingga dashboard dan ruang proyek mempertahankan styling operasional sebelumnya.
- Markup beranda memakai div agar tidak membuat landmark main bertingkat.
- Cache aset dan paket deployment dari revisi sebelumnya tetap tersedia.

## Memasang
Gunakan paket lengkap ini pada salinan staging, instal dependensi website dengan `npm run website:install`, isi environment perusahaan, kemudian jalankan `npm run website`. Untuk Docker lihat COMPANY-SETUP.md. Restart proses ketika mengganti CSS karena cache aset disimpan selama proses hidup.

File utama: portfolio-website/server.js, editorial-theme.css, editorial-art.svg.

## Pratinjau
PIR-Visuals-Preview.html adalah pratinjau offline dengan markup beranda asli dan data kosong. Tautan eksplorasi/akun pada pratinjau diarahkan ke bagian halaman; akun, direktori, CMS, dan data nyata berfungsi melalui server aplikasi dengan MongoDB. Tidak ada angka pelanggan atau testimoni rekaan.

## Verifikasi
Pemeriksaan sintaks JavaScript lolos. Suite website: 429 tes, 412 lolos, 17 gagal; jumlah dan nama kegagalan sama dengan baseline sebelum redesign. Masalah baseline belum diselesaikan. Pratinjau berhasil dirender menjadi HTML dari fungsi renderHome asli dengan model database tiruan kosong. Pratinjau browser remote tidak dapat mengakses server lokal (connection refused), sehingga pemeriksaan visual browser belum selesai. Uji end-to-end database, email, unggahan, serta audit aksesibilitas lengkap tetap diperlukan di staging. Paket ini bukan website yang sudah dipublikasikan.
