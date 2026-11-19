# Audit Menu dan Registry Perintah

## Ringkasan

Menu utama memiliki enam kategori: Tools Desain, Belajar Desain, Proteksi Grup, Design Marketplace, Pixel Realm, dan Owner. Router utama ada di `features/command-handler.js`; registry perintah modular ada di `features/commands/*.js`. Marketplace diproses sebelum perintah umum, sementara game didaftarkan melalui `games/index.js`.

## Registry modular yang terdeteksi

| Registry | Perintah |
|---|---|
| `IMAGE_INFO_COMMANDS` | `imageinfo`, `info` |
| `IMAGE_PROCESSING_COMMANDS` | `compress`, `ratio`, `resize`, `sticker` |
| `DESIGN_BRIEF_COMMANDS` | `brief`, `fontpair`, `layout` |
| `DESIGN_TOOLS_COMMANDS` | `creative`, `explain` |
| `ASSETS_DISCOVERY_COMMANDS` | `assets`, `kategoriassets`, `newassets`, `randomassets`, `requestassets`, `searchassets` |
| `ASSETS_MANAGEMENT_COMMANDS` | `addasset`, `assetid`, `assetsinfo`, `assetsstats`, `favoriteassets` |
| `SUPPORT_REPORTS_COMMANDS` | `report`, `reports`, `ticket` |
| `SUPPORT_ADMIN_COMMANDS` | `backup`, `level` |
| `MODERATION_SETTINGS_COMMANDS` | `antilink`, `antispam`, `antitoxic`, `rules`, `setrules`, `welcome`, `goodbye` |
| `MODERATION_ACTIONS_COMMANDS` | `alltag`, `clearwarn`, `hidetag`, `kick`, `modlogs`, `mute`, `open`, `polling`, `warn`, `warnings` |
| `GENERAL_HELP_COMMANDS` | `help`, `menu` |
| `GENERAL_OWNER_COMMANDS` | `owner`, `ownerhelp` |
| `GROUP_IDENTIFIER_COMMANDS` | `jid`, `idgrup`, `groupid`, `idanggota`, `memberid`, `daftaridanggota` |
| Marketplace handler | `cancel`, `requestdesign`, `portfolio`, `design`, `designer`, `lapordesain`, `marketreport`, `marketadmin` |
| Game router | `games`, `pixelrealm`, `game` |

## Temuan dari perbandingan menu dengan router

- Perintah seperti `addasset`, `report`, `reports`, `ticket`, `level`, `ownerhelp`, `jid`, `idgrup`, `groupid`, `idanggota`, `memberid`, dan `daftaridanggota` sebelumnya tidak tercantum jelas pada kategori menu.
- `marketadmin`, `marketreport`, `requestdesign`, `studio`, `service`/`layanan`, dan banyak subperintah marketplace memang ada pada handler khusus, bukan `Set` di registry perintah modular. Mulai v4.0.1, perintah marketplace tingkat atas tersebut dicantumkan pada katalog agar dapat ditemukan melalui `.commands market`.
- `cancel` bukan perintah umum yang selalu merespons; ia hanya diproses ketika wizard marketplace aktif.
- `games` menghasilkan daftar berdasarkan `GAME_REGISTRY`, dan saat ini registry berisi Pixel Realm.
- Menu kategori telah diperbarui agar menampilkan perintah komunitas dan marketplace yang lebih lengkap. Kategori game mengarahkan pengguna ke `.game` untuk bantuan subperintah yang menjadi sumber paling dekat dengan handler.
- Menu tidak boleh mengklaim editor teks Owner sudah ada; fitur tersebut belum diimplementasikan.

## Risiko dan tindak lanjut

1. Daftar perintah dan menu masih dipelihara di lokasi berbeda. Idealnya buat metadata perintah tunggal yang dapat menjadi sumber menu dan dokumentasi.
2. Alias `group` dan `grup` sama-sama diterima oleh menu kategori; fallback sebaiknya menggunakan `.menu grup` untuk konsistensi.
3. Hak akses harus tetap diverifikasi di handler. Menampilkan perintah pada menu bukan pemberian izin.
4. Perintah `polling` dan format list message harus diuji pada klien WhatsApp aktual.
5. Tes otomatis harus memvalidasi setiap command registry punya deskripsi/kategori dan memastikan menu tidak merujuk alias yang tidak ditangani.

## Pembaruan UX v4.0.1

- Tambahan bantuan kontekstual `.help studio`, `.help service`, `.help layanan`, `.help requestdesign`, `.help portfolio`, `.help design`, dan `.help designer`.
- `.service bantuan` memisahkan alur klien dan desainer, termasuk catatan bahwa katalog belum otomatis membuat pesanan.
- Dashboard `.studio` menampilkan ringkasan performa dan langkah pengelolaan yang dapat langsung dipilih.
