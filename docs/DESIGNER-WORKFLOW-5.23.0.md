# Designer Workflow v5.23.0

## Tujuan
Menghubungkan pembuatan brief, penentuan arah visual, dan evaluasi desain tanpa mengganti sistem proyek atau fitur Designer yang sudah ada.

## Perintah
- `.briefbuilder` — alias ke wizard brief tujuh langkah yang sudah ada (`.wizard` / `.briefwizard`).
- `.moodboard <tema> | <warna opsional> | <gaya opsional>` — membuat arahan moodboard berbasis kurasi lokal: suasana, palet awal, tipografi, imagery, komposisi, keyword, dan daftar referensi yang perlu dikumpulkan.
- `.designcritique [konteks]` — menampilkan rubrik review. Kirim/balas gambar bersama perintah untuk analisis visual AI jika `OPENAI_API_KEY` tersedia.

## Pemisahan fitur
- `.designcritique` adalah rubrik review desain.
- `.critique` dan `.rate` tetap merupakan sistem peer-review komunitas berbasis rating yang lama.
- `.brandkit` dan `.designproject` tetap menggunakan implementasi yang sudah ada.

## Batasan
- `.moodboard` menghasilkan brief teks, bukan kolase gambar otomatis.
- Tanpa konfigurasi AI, `.designcritique` tidak mengklaim telah melihat atau menilai gambar.
- Hasil AI adalah saran; desainer tetap harus memvalidasi brief, lisensi, aksesibilitas, dan spesifikasi produksi.
- `.briefbuilder` tidak membuat sistem penyimpanan proyek baru; ia menggunakan sesi wizard yang sudah tersedia.
