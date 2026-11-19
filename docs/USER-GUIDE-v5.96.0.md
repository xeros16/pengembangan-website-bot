# PIR Visuals — Panduan Pengguna v5.96.0

## 1. Mulai dari kebutuhanmu

Kamu tidak perlu menghafal seluruh command.

1. Buka chat bot atau grup komunitas yang diizinkan.
2. Kirim `.mulai`.
3. Pilih kebutuhan dan tingkat pengalaman.
4. Gunakan rekomendasi bot untuk melanjutkan.
5. Jika sudah tahu tujuan, cari dengan `.cari <kebutuhan>`.

Contoh:
```text
.mulai
.mulai cepat
.cari bikin poster acara
.cari belajar desain untuk pemula
.cari mencari desainer logo
```

## 2. Bantuan saat menggunakan bot

```text
.menu
.help <nama-command>
.commands
.support
.support faq
.ticket buka <subjek>
.ticket saya
.ticket detail <ID>
```

- `.help` menjelaskan fungsi, format, akses, dan contoh command.
- `.support` membuka pusat bantuan.
- Tiket bersifat privat sesuai pemilik, Admin grup asal, dan Owner bot.
- Jangan pernah mengirim password, OTP, token aktivasi, atau kredensial database ke grup/tiket.

## 3. Belajar dan berlatih desain

```text
.designlearn jalur
.designlearn mulai pemula warna
.designlearn selesai
.designlearn lanjut
.designlearn progress
.designchallenge harian
.designchallenge mingguan
```

Learning Path adalah materi belajar mandiri. Status selesai merupakan konfirmasi pengguna, bukan sertifikat kompetensi profesional.

Tantangan dan galeri komunitas hanya berlaku di grup tempat karya dikirim. Peer review adalah masukan komunitas, bukan penilaian resmi.

## 4. Profil dan portofolio desainer

### Buat profil melalui WhatsApp
```text
.portfolio daftar
.portfolio preview
.portfolio edit whatsapp 6281234567890
.portfolio website
```

Nomor WhatsApp hanya tampil di profil publik jika kamu sengaja mencantumkannya. Gunakan `.portfolio edit whatsapp off` untuk menyembunyikan nomor.

### Hubungkan akun website
1. Buka `/studio/register` pada domain PIR Visuals.
2. Daftar menggunakan nomor WhatsApp yang sama dengan akun bot.
3. Simpan kode tautan satu kali.
4. Kirim kode melalui chat pribadi:
   `.portfolio link KODE`
5. Selesaikan aktivasi, verifikasi email, dan OTP.
6. Login ke `/studio`.

Jangan mengirim kode tautan atau OTP di grup. Kode aktivasi sekali pakai memiliki masa berlaku terbatas.

### Upload karya dan kelola profil
- Upload gambar dilakukan melalui Designer Studio website.
- Karya baru menunggu moderasi Owner sebelum muncul di direktori.
- Bot dan website membaca profil serta karya dari koleksi MongoDB yang sama.
- Jika kamu mengubah kontak melalui bot atau website, kedua alias kontak disinkronkan.

### Notifikasi website melalui WhatsApp
```text
.portfolio notifikasi
.portfolio notifikasi semua
```

Gunakan di chat pribadi. Perintah pertama membaca maksimal 10 notifikasi belum dibaca dan menandai notifikasi yang ditampilkan sebagai sudah dibaca. Perintah `semua` menampilkan 10 notifikasi terbaru tanpa mengubah status baca.

### Statistik
```text
.portfolio analytics
.studio
```

Statistik mencerminkan aktivitas website yang tercatat, seperti kunjungan profil, pembukaan karya, dan klik kontak. Angka tersebut bukan jumlah transaksi atau pendapatan.

## 5. Cari desainer

```text
.design
.design kategori Logo
.design gaya Minimalist
.design lokasi Bandung
.design cari branding
.designer DSN-ID
.design simpan DSN-ID
.design favorit
```

PIR Visuals adalah direktori portofolio. Calon klien menghubungi desainer melalui kontak publik yang dicantumkan desainer. Kesepakatan, harga final, dan pembayaran dilakukan langsung di luar bot.

## 6. Komunitas dan kolaborasi

```text
.designcommunity profil
.designcommunity mentor branding,uiux
.designcommunity belajar poster,tipografi
.designcommunity cari branding
.designcommunity collab list
```

Profil mentor dan pembelajar bersifat opt-in dan dibatasi pada grup yang sama. Jangan memasukkan nomor pribadi, email, password, atau data sensitif pada deskripsi publik.

## 7. Privasi dan keamanan

- Gunakan chat pribadi untuk aktivasi akun, OTP, notifikasi, dan informasi profil pribadi.
- Jangan membagikan `.env`, folder autentikasi WhatsApp, atau URI MongoDB.
- Cantumkan kontak publik hanya jika kamu ingin menerima pesan langsung dari pengunjung.
- Periksa kembali nomor kontak dan link portofolio sebelum membagikan profil.
- Laporkan profil/karya bermasalah melalui `.lapordesain DSN-ID alasan`.

## 8. Jika mengalami masalah

1. Ketik `.health` hanya jika kamu Owner bot; atau hubungi Admin.
2. Buka `.support faq`.
3. Jika masalah belum selesai, buat `.ticket buka <subjek>`.
4. Simpan ID tiket dan gunakan `.ticket detail ID` untuk membaca balasan.

Panduan ini tidak menjanjikan seluruh fitur selalu tersedia saat database, WhatsApp, atau layanan eksternal sedang mengalami gangguan.
