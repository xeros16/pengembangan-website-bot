# Pintasan singkat perintah

Semua pintasan memakai prefix yang dikonfigurasi (default `.`). Pintasan hanya alias; fungsi dan pemeriksaan izin tetap sama dengan perintah aslinya.

## Pintasan bawaan

| Pintasan | Perintah lengkap | Kegunaan |
|---|---|---|
| `.cmd` / `.c` | `.commands` | Daftar perintah (10 per halaman) |
| `.h` | `.help` | Bantuan dan contoh perintah |
| `.m` | `.menu` | Menu utama |
| `.ak` | `.akun` | Status akun dan langganan |
| `.wz` | `.wizard` | Wizard brief desain |
| `.cp` | `.colorpalette` | Rekomendasi palet warna |
| `.ct` | `.contrast` | Pemeriksaan kontras |
| `.ck` | `.checklist` | Checklist desain |
| `.rv` | `.revision` | Template revisi |
| `.br` | `.brief` | Brief desain |
| `.fp` | `.fontpair` | Pasangan font |
| `.ly` | `.layout` | Saran layout |
| `.cr` | `.creative` | Ide kreatif |
| `.as` | `.assets` | Pencarian aset |
| `.st` | `.sticker` | Membuat stiker |
| `.inf` | `.info` | Informasi gambar |

## Membuat pintasan sendiri

Buka `config/command-aliases.json`, lalu tambahkan pasangan `"pintasan": "perintah_asli"` di dalam objek `aliases`.

Contoh konfigurasi bawaan:

```json
{
  "aliases": {
    "kontras": "contrast",
    "warna": "colorpalette",
    "daftar": "commands"
  }
}
```

Dengan konfigurasi tersebut, `.kontras`, `.warna`, dan `.daftar` dapat digunakan. Ganti nilai tujuan dengan nama perintah yang benar-benar tersedia di bot. Setelah mengubah file, **restart bot** agar konfigurasi dibaca ulang.

Aturan konfigurasi:

- Nama pintasan menggunakan huruf kecil, diawali huruf, dan maksimal 12 karakter.
- Gunakan nama perintah lengkap sebagai tujuan, tanpa prefix titik.
- Pintasan tambahan tidak boleh mengambil alih nama perintah utama atau pintasan bawaan.
- Baris konfigurasi yang tidak valid diabaikan; jika file tidak ada atau JSON rusak, bot tetap memakai pintasan bawaan.
- Jangan mengubah pemeriksaan akses: perintah premium, admin, dan Owner tetap mengikuti izin perintah aslinya.

Contoh: `.ct #222222 #FFFFFF` sama dengan `.contrast #222222 #FFFFFF`.
