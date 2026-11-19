# Palette Kit / Design Tokens

Perintah baru untuk mengubah palet Color Palette Studio menjadi token warna semantik.

## Penggunaan

```text
.palettekit ocean
.palettekit futuristik
.palettekit pastel
```

Perintah menampilkan peran `primary`, `secondary`, `tertiary`, `accent`, `muted`, `surface`, `text`, dan `on-primary`; snippet CSS `:root`; serta rasio kontras untuk pasangan teks/latar utama. Token dapat disalin ke proyek web atau disesuaikan untuk Figma/Canva.

Pemeriksaan kontras menggunakan rumus relative luminance WCAG dan ambang AA teks normal 4.5:1 serta teks besar 3:1. Ini bukan audit aksesibilitas menyeluruh; state interaksi dan komponen nyata tetap perlu diuji.
