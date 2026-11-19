# PinSearch API v3.40.9

## Perilaku
- `.pinsearch` / `.pinterest`: memakai Pinterest API v5 `GET https://api.pinterest.com/v5/search/pins` saja. Tidak lagi melakukan scraping HTML publik.
- Jika token belum diatur, API gagal, atau hasil kosong, bot mengirim tautan pencarian manual Pinterest. Tidak ada fallback otomatis ke Bing.
- `.bingsearch` / `.bingimages`: tetap mencari melalui Bing Images secara terpisah.
- Riwayat URL gambar yang sudah dikirim tetap memakai `data/pinsearch-history.json`.

## Menyiapkan akses Pinterest
1. Daftarkan aplikasi melalui Pinterest Developers dan pastikan aplikasi memiliki akses API.
2. Selesaikan OAuth sesuai dokumentasi Pinterest. Token harus memiliki scope `pins:read`.
3. Buka file `.env` di folder utama proyek (jangan kirim atau bagikan file ini).
4. Tambahkan baris berikut, lalu isi token milikmu:

```env
PINTEREST_ACCESS_TOKEN=TOKEN_PINTEREST_MILIKMU
```

5. Simpan `.env`, matikan bot, lalu jalankan ulang `npm start`.
6. Tes `.pinsearch Yae Miko`.

Jangan menaruh token di source code, chat grup, screenshot, atau file yang dibagikan. Jangan commit `.env`. Jika token pernah bocor, cabut/ganti token melalui pengaturan aplikasi Pinterest.

## Interpretasi kegagalan
- Token kosong: bot memberi tautan pencarian manual Pinterest.
- HTTP 401: token tidak valid/kedaluwarsa.
- HTTP 403: aplikasi/token tidak memiliki izin yang diperlukan atau akses ditolak.
- HTTP 429: rate limit; coba lagi nanti.
- Hasil API kosong: bot memberi tautan pencarian manual.

Tes otomatis menggunakan respons API tiruan; koneksi live Pinterest tetap perlu diuji dengan token resmi milik operator bot.
