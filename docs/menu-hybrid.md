# Menu WhatsApp: katalog teks lengkap

## Implementasi saat ini

- `.menu` menampilkan navigasi utama dalam teks; bot tidak mengirim poster atau gambar menu.
- `.help` tanpa topik memakai menu teks yang sama.
- `.fitur` menampilkan seluruh command yang terdaftar, dikelompokkan per kategori dengan format teks bergaya daftar command.
- Katalog `.fitur` dibangun langsung dari `COMMAND_CATALOG`, sehingga command yang ditambahkan ke registry ikut muncul tanpa mengelola daftar menu terpisah.
- `.fitur cari <kebutuhan>`, `.fitur kategori <nama>`, `.fitur semua [halaman]`, dan `.fitur alur [id]` tetap tersedia sebagai cara menemukan atau mempersempit daftar.
- `.help <perintah>` menampilkan format, parameter, contoh, dan aturan akses sebuah command.
- `.menu <kategori>` tetap membuka menu kategori tekstual yang sudah ada.

## Batasan

Implementasi ini menggunakan pesan teks biasa, bukan reply-button menu atau interactive list message. Setiap baris `.fitur` menampilkan command tingkat atas yang terdaftar; subperintah dijelaskan melalui `.help <perintah>` atau kategori terkait.

## Checklist uji manual

1. Kirim `.menu` dari chat pribadi dan grup yang diizinkan; pastikan hanya teks yang terkirim.
2. Kirim `.help`; pastikan menu utama tampil tanpa gambar.
3. Kirim `.fitur`; pastikan semua command dari registry muncul dan dikelompokkan menurut kategori.
4. Pastikan katalog `.fitur` dapat dibaca sebagai satu pesan dan command dapat disalin.
5. Uji `.fitur cari musik`, `.fitur kategori Tools Desain`, `.fitur semua 2`, dan `.fitur alur`.
6. Uji prefix khusus, misalnya `!fitur`; seluruh contoh prefix harus mengikuti konfigurasi.
