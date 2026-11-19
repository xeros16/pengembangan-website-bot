# Color Palette Visualizer

Perintah `.paletteview` menerapkan palet kurasi ke empat mockup UI statis dan mengirim hasil PNG ke chat WhatsApp.

## Penggunaan

```text
.paletteview
.paletteview ocean
.paletteview ocean landing
.paletteview coffee product
.paletteview sunset poster
.paletteview futuristik dashboard
```

Template:
- `landing`: hero website, navigasi, CTA, dan blok visual.
- `product`: kartu produk/e-commerce, harga, swatch, dan tombol aksi.
- `poster`: komposisi editorial/event dengan headline, aksen, dan detail.
- `dashboard`: sidebar, kartu metrik, dan grafik sederhana.

Perintah memakai palet yang sudah ada di `designer-assistant.js`. Preview merupakan mockup ilustratif untuk mengevaluasi kombinasi warna, bukan desain final atau audit aksesibilitas. Gunakan `.palettekit <nama>` untuk semantic tokens dan pemeriksaan kontras WCAG.

## Dependensi

Rendering PNG memakai `sharp`, yang sudah tercantum di `package.json`. Instal dependensi dengan:

```bash
npm ci
```

Tidak memerlukan API key gambar atau layanan AI.
