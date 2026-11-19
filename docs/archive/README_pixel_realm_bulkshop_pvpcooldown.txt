PIXEL REALM — BULK SHOP + PVP COOLDOWN

Perubahan:
1. Pembelian consumable dalam jumlah 1–99 per transaksi:
   .game beli potion 10
   .game beli ether 5
   .game beli bom 3
   Jika jumlah tidak ditulis, default 1.
2. Total harga dan saldo dicek sebelum saldo dipotong. Jika gold tidak cukup, transaksi dibatalkan.
3. Pedang dan armor tetap satu per transaksi dan tidak bisa dibeli duplikat sesuai aturan yang sudah ada.
4. Cooldown PvP 60 detik untuk kedua pemain setelah duel, agar perintah duel tidak bisa di-spam terus dan pemain tidak terus kehilangan gold karena kalah berulang kali.
5. File .env, data.json, auth_info, node_modules, dan database tidak disertakan atau diubah.

CARA MEMASANG
1. Hentikan bot terlebih dahulu.
2. Salin/cadangkan index.js yang sedang dipakai.
3. Ganti index.js dengan file index_pixel_realm_bulkshop_pvpcooldown.js ini (ubah namanya menjadi index.js).
4. Jangan hapus .env, folder auth_info, node_modules, atau database MongoDB.
5. Jalankan npm start dan uji di grup kecil.

CATATAN
- Pemeriksaan sintaks Node.js berhasil, tetapi pengujian WhatsApp/MongoDB langsung tidak dilakukan.
- PvP tetap memberikan +10 gold ke pemenang dan mengurangi maksimal 5 gold dari pihak yang kalah, sesuai mekanisme sebelumnya. Cooldown hanya membatasi duel berikutnya selama 60 detik.
- Untuk pembelian: contoh .game beli potion 10 membutuhkan 150 gold.
