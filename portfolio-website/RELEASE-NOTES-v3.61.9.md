# PIR Visuals Website — Release Notes v3.61.9

Tanggal: 19 November 2026

## Desktop Editorial Refinement

- Menyeimbangkan hero desktop antara headline dan Creative Index tanpa mengubah isi atau CTA.
- Memperjelas ukuran teks pendukung, label statistik, dan deskripsi section agar nyaman dibaca pada layar besar.
- Menata ulang grid kategori layanan menjadi empat kartu dengan variasi warm paper, sage, dan clay yang tetap mengikuti identitas PIR Visuals.
- Memberi ruang lebih lega pada jalur pengguna, kartu talenta, portfolio, manifesto, CTA kreator, dan FAQ.
- Menambahkan fallback dua kolom untuk rentang 901–1024 px; breakpoint mobile di 900 px ke bawah tetap mengikuti layout yang sudah ada.
- Mempertahankan carousel Community Showcase, rasio asli media, alignment judul, interaksi, dan aturan reduced-motion yang sudah ada.
- Tidak mengubah route, database, autentikasi, upload pipeline, Owner CMS, Designer Studio, Client Workspace, maupun fitur bot.
- Tidak menambahkan dependency runtime baru.

## Design references

- Starbucks: prinsip warm-neutral canvas dan forest-green color blocking.
- Webflow: prinsip grid yang disiplin, hierarchy, dan component spacing.

Referensi digunakan untuk prinsip desain; identitas, warna, konten, dan aset PIR Visuals tetap orisinal.

## Verification

- `node --check server.js` — PASS
- `node --check pir-home-showcase.js` — PASS
- `node --test tests/desktop-refinement-v3.61.9.test.js` — PASS
- `node --test` untuk seluruh suite masih memiliki sejumlah tes historis yang mengharapkan versi/cache key dan ornament lama; tes tersebut tidak mewakili regresi pada refinement ini.
