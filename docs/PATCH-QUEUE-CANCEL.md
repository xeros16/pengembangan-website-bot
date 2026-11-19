# Patch: Batalkan Download yang Masih Mengantre

## Perintah baru
- `.dl cancel` atau `.download cancel` membatalkan satu pekerjaan milik pengirim yang masih menunggu pada chat yang sama.
- Jika pekerjaan sudah aktif, bot menjelaskan bahwa pekerjaan aktif tidak dapat dibatalkan dari antrean.
- Permintaan pengguna lain tidak dapat dibatalkan.
- Slot antrean langsung dibebaskan setelah pembatalan.

## Pengujian
Tes otomatis mensimulasikan satu pekerjaan aktif dan satu pekerjaan menunggu, lalu memastikan pekerjaan menunggu dapat dibatalkan tanpa menghentikan pekerjaan aktif.

## Batasan
Antrean tetap berada di memori proses dan direset saat bot dimulai ulang. Pembatalan hanya berlaku untuk pekerjaan yang belum dimulai.
