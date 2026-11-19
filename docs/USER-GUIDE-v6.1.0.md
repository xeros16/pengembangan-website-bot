# PIR Visuals Bot — Panduan Pengguna v6.1.0

## Mulai dan temukan fitur

```text
.mulai
.menu
.cari bikin poster promosi
.commands tools desain
.cepat
```

Kamu tidak perlu menghafal semua perintah. `.cari` menerima kebutuhan dengan bahasa sehari-hari, sedangkan `.cepat` menyimpan hingga delapan pintasan perintah pribadi.

## Wizard brief desain yang bisa dilanjutkan

```text
.wizard
.wizard status
.wizard lanjut
.wizard kembali
.wizard ulang
.wizard batal
```

Wizard menanyakan jenis desain, tujuan, audiens, platform/ukuran, gaya, warna, dan teks/batasan. Jawaban serta progres disimpan sementara di MongoDB hingga 24 jam agar bisa dilanjutkan setelah bot restart. Draft dipisahkan berdasarkan akun dan chat.

- `.wizard` memulai draft baru, atau memberi pilihan jika masih ada draft aktif.
- `.wizard lanjut` melanjutkan dari pertanyaan terakhir.
- `.wizard kembali` kembali satu pertanyaan untuk mengganti jawaban.
- `.wizard status` melihat progres.
- `.wizard ulang` menghapus draft lama dan memulai dari awal.
- `.wizard batal` menghapus draft.

Jika MongoDB tidak tersedia, wizard hanya menyimpan sesi di memori proses dan tidak dapat dipulihkan setelah restart. Jangan memasukkan password, OTP, atau data rahasia klien.

## Proteksi grup

Pengaturan berikut hanya dapat diubah Admin grup:

```text
.antilink on
.antispam on
.antitoxic
.antitoxic tambah <kata>
.antitoxic daftar
.antitoxic on
.antitoxic off
.antitoxic hapus <kata>
.antitoxic reset
```

Filter `.antitoxic`:
- Nonaktif secara default.
- Admin menyusun daftar maksimal 30 kata, satu token per kata (2–32 karakter).
- Pencocokan memakai kata utuh setelah normalisasi Unicode; tidak memakai AI untuk menilai percakapan.
- Admin grup dan Owner bot yang terverifikasi dikecualikan dari filter.
- Jika bot memiliki hak Admin, pesan yang cocok dapat dihapus. Jika tidak, bot hanya mengirim peringatan.
- Pada tiga peringatan dalam 30 hari, bot mengingatkan Admin untuk meninjau riwayat. Bot tidak otomatis mengeluarkan atau memblokir anggota.

Gunakan `.warnings @anggota` dan `.modlogs` untuk meninjau riwayat.

## Tools desain dan komunitas

```text
.creative poster acara sekolah
.designrender poster | festival musik | remaja | futuristik | ungu dan cyan
.designcritique poster acara
.designlearn jalur
.designcommunity mentor branding
.designchallenge harian
```

## Direktori desainer

```text
.design
.designer DSN-ID
.portfolio
.studio
```

Bot menampilkan portofolio dan kontak publik yang diaktifkan desainer. PIR tidak memproses checkout, pembayaran, komisi, escrow, atau transaksi.

## Bantuan

```text
.support
.ticket buka Bot tidak merespons
.akses
```
