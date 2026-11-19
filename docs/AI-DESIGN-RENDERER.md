# AI Design Renderer

Perintah WhatsApp:

```text
.designrender <jenis> | <tema> | <audiens> | <gaya> | <detail opsional>
```

Contoh:

```text
.designrender poster | festival musik elektronik | anak muda | futuristik neon | dominan ungu dan cyan
```

Konfigurasi di `.env`:

```env
OPENAI_API_KEY=isi_api_key_di_server
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_IMAGE_MODEL=gpt-image-1
```

Renderer memanggil endpoint image generation OpenAI-compatible `/images/generations`, meminta satu PNG 1024x1024 kualitas medium, lalu mengirimkannya sebagai gambar WhatsApp. Ketersediaan model, izin akun, dan biaya mengikuti provider. API key tidak boleh dimasukkan ke repositori atau dibagikan.

Tanpa API key, perintah akan memberi instruksi konfigurasi dan `.designprompt` tetap tersedia sebagai alternatif prompt teks. Hasil gambar adalah draft eksplorasi; periksa copy, brand, hak penggunaan, dan spesifikasi produksi sebelum dipakai.

## Color Palette Studio

Perintah `.colorpalette` kini menyediakan koleksi palet kurasi dan mengirim preview swatch PNG langsung ke chat WhatsApp.

Contoh:
- `.colorpalette ocean`
- `.colorpalette sunset`
- `.colorpalette coffee`
- `.colorpalette random`
- `.colorpalette search blue`
- `.colorpalette #2D6CDF analogous`

Setiap hasil menyertakan enam kode HEX dan saran penerapan warna utama, pendukung, aksen, serta latar. Preview dibuat lokal menggunakan Sharp; tidak membutuhkan API eksternal.
