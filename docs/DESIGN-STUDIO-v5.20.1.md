# Design Studio v5.20.1 — Typography Studio & Design QA Review

Status: **kandidat pengembangan**, belum rilis produksi.

Dua modul baru berada di `features/design-studio/` dan diregistrasikan melalui `features/commands/designer-assistant.js`. Command lama (`.typescale`, `.fontpair`, `.designqa`, `.checklist`, `.contrast`, dll.) tidak diubah perilakunya.

## `.typography` — Typography Studio

| Perintah | Fungsi |
|---|---|
| `.typography hierarchy <web\|app\|sosial\|poster\|cetak\|kemasan>` | Hierarki font per jenis desain: peran, rentang ukuran, bobot, line-height |
| `.typography size <digital\|cetak>` | Pedoman ukuran dan leading digital atau cetak |
| `.typography check <digital\|cetak> \| <font, font> \| <ukuran...> \| [line-height]` | Pemeriksaan konsistensi tipografi |

Contoh:

```
.typography check digital | Inter, Playfair Display | 12 14 16* 24 32 48 | 1.5
```

- Tanda `*` menandai ukuran body. Tanpa tanda, body diasumsikan ukuran terdekat dengan standar (16 px digital, 10 pt cetak) dan asumsi itu ditampilkan di hasil.
- Satuan otomatis: px untuk digital, pt untuk cetak. Desimal memakai titik pada daftar ukuran; line-height boleh memakai koma.
- Yang diperiksa: jumlah keluarga font, ukuran terkecil, ukuran body, line-height/leading, kekuatan hierarki (ukuran terbesar terhadap body), jumlah level, ukuran yang terlalu mirip (selisih < 10%), dan konsistensi loncatan antarukuran (disertai saran rasio modular untuk `.typescale`).
- Batas input: 2–12 ukuran (3–400), maksimal 8 nama font (40 karakter), line-height 0,8–3.

## `.qareview` — Design QA Review

```
.qareview <poster|sosial|logo|cetak|kemasan|web|app> key=nilai key=nilai ...
```

| Isian | Berlaku untuk | Pemeriksaan |
|---|---|---|
| `teks=#HEX latar=#HEX` | semua | Kontras WCAG (AAA ≥ 7, AA ≥ 4.5, 3–4.5 hanya teks besar, < 3 gagal) |
| `aksen=#HEX` (butuh `latar`) | semua | Kontras komponen/grafis ≥ 3:1 |
| `body=` `judul=` | semua | Hierarki judul/body; ukuran body absolut hanya untuk web, app, cetak |
| `font=` | semua | Jumlah keluarga font |
| `tap=` | web, app | Target sentuh: < 24 px gagal, < 44 px peringatan |
| `cta=ya/tidak` | poster, sosial, web, app | CTA jelas |
| `alt=ya/tidak` | sosial, web, app | Alt text/label aksesibilitas |
| `bleed=` (mm) | poster, cetak, kemasan | 0 gagal, < 3 mm peringatan |
| `dpi=` | poster, cetak, kemasan | Cetak/kemasan: < 200 gagal, < 300 peringatan; poster: < 100 gagal, < 150 peringatan |

Perilaku penting:
- Isian yang tidak valid **tidak** dianggap lulus; ia dilaporkan sebagai tidak valid dan masuk daftar "Belum diperiksa".
- Isian yang tidak berlaku untuk jenis desain tersebut diabaikan, bukan diberi nilai.
- Hasil diurutkan: masalah serius dahulu, lalu peringatan, dengan saran perbaikan yang spesifik.
- Checklist manual lengkap tetap lewat `.designqa <jenis>`.

## Keterbatasan (jujur)

- Seluruh ambang adalah **aturan praktis umum**, bukan standar mutlak. Untuk cetak dan kemasan, spesifikasi vendor dan regulasi menang.
- Pemeriksaan hanya menilai angka yang diisi pengguna. Ia tidak melihat desainnya, tidak menguji aksesibilitas penuh, dan tidak memeriksa lisensi font/aset.
- Logika kontras diduplikasi di `features/design-studio/shared.js` agar modul baru tidak bergantung pada `designer-assistant.js`; kesetaraan hasilnya dengan `.contrast` dijaga oleh test.
