# Keamanan dan data lokal

## Jangan bagikan

Jangan kirim atau masukkan ke ZIP publik:

- `.env` dan token/API key di dalamnya.
- Folder autentikasi WhatsApp yang ditunjuk `AUTH_DIR`, termasuk `creds.json`, session keys, dan sender keys.
- Folder backup, database lokal, `data/bot-subscriptions.json`, atau file konfigurasi grup lama `data.json`.
- Foto/berkas portofolio privat dan file di `temp/`.

## Jika file sensitif telanjur dibagikan

1. Dari WhatsApp, buka **Perangkat tertaut** dan keluarkan sesi bot/perangkat yang tidak lagi dipercaya.
2. Buat sesi baru dengan menautkan ulang bot.
3. Ganti API key/token yang disimpan di `.env` jika masih aktif; perbarui konfigurasi lokal setelahnya.
4. Jika URI MongoDB memuat username/password, ubah kredensial tersebut dan perbarui `MONGO_URI`.
5. Hapus salinan arsip sensitif dari lokasi berbagi yang dapat kamu kendalikan.

Jangan mengunggah folder sesi untuk meminta bantuan debugging. Cukup kirim pesan error yang sudah disamarkan.
