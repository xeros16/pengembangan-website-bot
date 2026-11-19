Pixel Realm Modular v1.9.0

Perubahan:
- Memindahkan tampilan inventori ke game/commands/inventory.js.
- Memindahkan tampilan loot bag ke game/commands/inventory.js.
- Memindahkan tampilan ringkasan equipment ke game/commands/equipment-display.js.
- Handler lama tetap mengatur alur command dan penyimpanan, sehingga perilaku mutasi game tidak diubah oleh modul tampilan ini.

Pemeriksaan:
Jalankan npm install, npm run check, dan npm test.
Pengujian WhatsApp/MongoDB langsung belum dilakukan.
Jangan masukkan .env atau sesi autentikasi WhatsApp ke arsip yang dibagikan.
