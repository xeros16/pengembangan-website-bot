# Kontrol Akses Whitelist

Bot menggunakan prinsip **default deny**. Selain Owner yang terdaftar pada `OWNER_JIDS` di `.env`, chat tidak dapat menggunakan bot sampai disetujui. Pesan dari chat yang belum diizinkan diabaikan tanpa balasan.

## Perintah Owner

- `.allowlist` atau `.allowlist list` — tampilkan daftar izin.
- `.allowlist group add <JID-grup>` — izinkan grup dari chat pribadi Owner; tanpa JID, jalankan di grup yang ingin diizinkan.\n- `.allowlist group name <alias>` — beri nama internal pada grup (jalankan di grup tersebut), atau `.allowlist group name <JID-grup> <alias>` dari chat pribadi Owner.\n- `.allowlist group note <catatan>` — simpan catatan internal grup, atau `.allowlist group note <JID-grup> <catatan>` dari chat pribadi Owner.
- `.allowlist group remove <JID-grup>` — cabut izin grup dari chat pribadi Owner; tanpa JID, jalankan di grup tersebut.
- `.allowlist contact add 628123456789` — izinkan nomor WhatsApp dalam format internasional tanpa tanda `+`.\n- `.allowlist contact name 628123456789 <alias>` — beri nama internal kontak.\n- `.allowlist contact note 628123456789 <catatan>` — simpan catatan internal kontak.
- `.allowlist search <kata kunci>` — cari grup/kontak berdasarkan alias, nama WhatsApp yang tersimpan, ID/JID, atau catatan.
- `.allowlist search group <kata kunci>` — batasi pencarian ke grup.
- `.allowlist search contact <kata kunci>` — batasi pencarian ke kontak.
- `.allowlist contact remove 628123456789` — cabut izin kontak.

Owner harus dikonfigurasi di `OWNER_JIDS` sebelum bot dijalankan. Owner terverifikasi mendapat bypass allowlist hanya pada chat pribadi dengan JID nomor WhatsApp atau LID yang valid. Pesan Owner di grup tetap harus berasal dari grup yang sudah diizinkan. Admin grup bukan Owner dan tidak dapat mengubah whitelist global.

Daftar izin aktif disimpan pada `config/allowed-chats.json`. File ini bersifat lokal dan tidak boleh ditimpa saat update. Jika file belum ada, bot otomatis menggunakan daftar kosong dan tetap menolak semua chat non-Owner. `config/allowed-chats.example.json` hanya template.

## Catatan identitas WhatsApp

Untuk kontak pribadi, bot mencocokkan JID nomor dan identitas alternatif yang disertakan Baileys. Jika WhatsApp hanya memberikan LID tanpa alias nomor, tambahkan JID LID yang terlihat pada log tepercaya atau gunakan nomor yang cocok dengan identitas alternatif. Jangan membagikan file sesi WhatsApp.

## Whitelist keluar (ketat)

Semua pemanggilan `sock.sendMessage` melewati gerbang tujuan terpusat. Bot hanya mengirim ke grup/kontak yang terdaftar, termasuk notifikasi marketplace (pesanan, penawaran, revisi, hasil, ulasan), tiket, moderasi, sambutan, dan notifikasi otomatis lain. Jika penerima marketplace belum diizinkan, pesan notifikasinya diblokir; transaksi/data tetap mengikuti alur fitur dan penerima dapat melihat status melalui kanal yang tersedia di bot setelah aksesnya disetujui.

Pesan masuk dari chat yang belum diizinkan dihentikan sebelum moderasi, XP, wizard, command, atau pemrosesan lain. Owner terverifikasi dapat mengelola allowlist melalui chat pribadi tanpa pendaftaran kontak sebelumnya; JID pribadi Owner yang diverifikasi akan didaftarkan otomatis untuk mengizinkan balasan. Di grup, Owner hanya dapat menjalankan perintah setelah grup tersebut masuk allowlist. Untuk bootstrap grup baru, Owner dapat menjalankan `.allowlist group add <JID-grup>` dari chat pribadi; alternatifnya jalankan `.allowlist group add` dari dalam grup yang sudah dapat diakses.


## Penyimpanan permanen

Daftar izin disimpan secara atomik di `config/allowed-chats.json` dan disinkronkan ke koleksi MongoDB `access_lists` (dokumen `key: global`). Saat startup, bot memulihkan daftar dari MongoDB. Jika MongoDB belum memiliki dokumen, bot mengimpor daftar lokal ke database. Jika database sedang offline, perubahan tetap disimpan lokal dan file lokal yang lebih baru akan disinkronkan saat koneksi kembali. Untuk ketahanan lintas restart/server, pastikan `MONGO_URI` menunjuk ke database persisten dan jangan menghapus koleksi `access_lists`.


## Pencarian identitas

Pencarian tidak mengubah allowlist dan hanya tersedia bagi Owner melalui handler perintah Owner. Maksimal 10 hasil ditampilkan per pencarian agar balasan WhatsApp tetap ringkas. Pencarian mencocokkan teks tanpa membedakan huruf besar/kecil pada alias, nama WhatsApp yang tersimpan, JID, dan catatan internal.

## Identitas grup dan kontak
Setiap entri allowlist dapat memiliki `alias`, nama WhatsApp saat disetujui (`waName` untuk grup), dan catatan internal. Alias tidak bergantung pada nama grup/profil WhatsApp sehingga tetap stabil ketika nama asli berubah. Metadata disimpan bersama allowlist di file lokal dan dokumen MongoDB `access_lists`. File lokal memiliki backup `config/allowed-chats.json.bak`; JSON rusak tidak boleh diam-diam dianggap sebagai daftar kosong.


Allowlist memakai nomor revisi (`revision`) untuk sinkronisasi: perubahan lokal yang memang dibuat saat MongoDB offline dapat disinkronkan ketika database kembali, sementara file konfigurasi kosong dari deployment baru tidak boleh menimpa daftar yang sudah tersimpan di MongoDB hanya karena timestamp file lebih baru. MongoDB menjadi sumber utama setelah dokumen global tersedia.
