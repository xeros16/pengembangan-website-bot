# Audit Designer Workspace — v5.20.1

Tanggal: 1 November 2026. Baseline: `PIR-Visuals-Bot-v5.20.0-designer-workspace-update-candidate.zip` (SHA-256 cocok dengan catatan handover).

Metode: pembacaan kode `features/commands/designer-assistant.js` (`handleDesignProjectCommand`), reproduksi bug dengan skrip, dan test otomatis memakai model `User` tiruan. **Tidak ada pengujian terhadap MongoDB atau WhatsApp sungguhan.**

## Hasil per butir audit handover

| # | Butir | Hasil |
|---|---|---|
| 1 | Query selalu memakai identitas pemilik | Terverifikasi di level logika: satu titik masuk `User.findOne({ jid: userJid })`; tanpa `userJid` atau tanpa model, perintah ditolak |
| 2 | Edit hanya oleh pemilik | Terverifikasi (test lintas-pengguna: data A tidak berubah, `save` A tidak dipanggil) |
| 3 | Duplicate tidak menyalin kepemilikan salah | Terverifikasi: salinan tetap di dokumen pengguna yang sama; riwayat salinan tidak berbagi referensi dengan sumber |
| 4 | Search/list tidak mengambil proyek pengguna lain | Terverifikasi |
| 5 | History memeriksa kepemilikan | Terverifikasi |
| 6 | Export memeriksa kepemilikan | Terverifikasi |
| 7 | Template konsisten dengan penyimpanan | Terverifikasi: memakai jalur `persist` yang sama |

Catatan: karena proyek disimpan di dokumen `User` milik pemilik (`preferences.designProjects`), tidak ada bidang pemilik terpisah yang bisa salah disalin.

## Bug ditemukan dan diperbaiki

1. **`designproject flow` untuk jenis desain bebas.** `save` menerima jenis apa pun (mis. "Poster Event"), tetapi `flow` hanya mengenali 8 jenis dan menampilkan bantuan generik tanpa penjelasan. Kini jenis dipetakan dari kata yang dikenali; jika tidak ada, pengguna diberi penjelasan dan jenis yang didukung.
2. **`designproject list status` tanpa nilai** menjawab "Tidak ada proyek yang cocok". Kini menampilkan cara pakai filter; status tidak dikenal juga dijelaskan.
3. **Versi `package.json` dan `package-lock.json`** masih 5.19.0 pada ZIP v5.20.0. Disinkronkan ke 5.20.1.
4. **`docs/commands.md` usang** (144 perintah, katalog sebenarnya 151). Diregenerasi dengan skrip resmi.
5. **Dua tes usang** di `tests/general-help.test.js` (mengunci `.checklist poster` dan angka `144`). Diperbarui agar mengikuti perilaku sengaja (`.designqa`/alias) dan menghitung total dari katalog.

## Risiko yang ditemukan tetapi BELUM diperbaiki

- **Lost update (dari pembacaan kode, belum direproduksi di MongoDB).** Setiap aksi membaca dokumen, menyalin seluruh `preferences`, lalu menyimpan ulang. Dua perintah bersamaan dari pengguna yang sama, atau fitur lain yang menulis `preferences` di antara baca dan simpan, dapat saling menimpa. Perbaikan yang disarankan: pembaruan atomik pada `preferences.designProjects` dengan kontrol konkurensi. Ditunda ke v5.23.0 karena mengubah perilaku database dan perlu MongoDB staging.
- **Stabilitas identitas.** Ruang kerja terikat ke `userJid`. Jika WhatsApp memberi JID berbeda (nomor vs LID) untuk orang yang sama, workspace dapat terpecah. Memerlukan pengujian dengan akun nyata.
- **Pemformatan WhatsApp pada nama proyek.** Nama proyek hanya dibersihkan dari baris baru; karakter `*` atau `_` dapat memformat balasan. Dampak kosmetik rendah. Modul baru sudah membersihkannya.
