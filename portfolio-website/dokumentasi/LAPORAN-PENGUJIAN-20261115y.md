# QA PIR Visuals — 20261115y

## Pemeriksaan yang dilakukan

- `npm run check`: **lulus** (pemeriksaan sintaks Node.js).
- `node --test tests/interaction-alignment-20261115y.test.js tests/party-paper-20261115x.test.js tests/card-hover-motion-20261115x.test.js`: **16/16 lulus**.
- Chromium headless dengan **fixture interaksi yang memakai stylesheet dan JavaScript revisi** di lebar 390, 768, 1365, dan 1920 px: baris manifesto berada di titik tengah baris (selisih <=0.5 px akibat ketebalan border), efek kategori dan footer berjalan, kilau terisolasi per kartu, dan tidak ada overflow horizontal dalam fixture.
- Chromium reduced-motion: tidak ada partikel dan transformasi panah tidak dijalankan.

## Batasan

Fixture Chrome bukan pemeriksaan menyeluruh pada website + server/database sungguhan. Dependensi npm yang diperlukan untuk membuka server produksi tidak dapat dipasang dalam lingkungan pengujian ini. Karena itu, paket belum dapat dinyatakan siap produksi.

## Aset yang diubah

- `server.js` (markup CTA/Explore serta versi aset)
- `pir-party-paper.css` (batas kilau, alignment, hover Explore, CTA dan panah)
- `pir-party-paper.js` (dekorasi panah tautan tanpa mengubah teks)
- `tests/party-paper-20261115x.test.js` (sesuai versi aset terbaru)
- `tests/interaction-alignment-20261115y.test.js` (tes regresi tambahan)
