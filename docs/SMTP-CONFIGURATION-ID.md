# Konfigurasi SMTP PIR Visuals

SMTP dipakai website untuk mengirim tautan verifikasi email dan reset password. SMTP tidak dipakai untuk mengirim OTP WhatsApp; OTP tetap dikirim oleh bot WhatsApp.

## Contoh konfigurasi Gmail

1. Gunakan akun Gmail khusus website (disarankan).
2. Aktifkan Verifikasi 2 Langkah pada akun Google.
3. Buat App Password dari Google Account → Security → 2-Step Verification → App passwords. Jika menu App passwords tidak tersedia, akun Google Workspace atau kebijakan organisasi mungkin membatasi fitur ini.
4. Salin App Password 16 karakter yang dibuat Google. Jangan gunakan password Gmail biasa.
5. Isi file `.env` di folder utama proyek:

```dotenv
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=alamatemail@gmail.com
SMTP_PASSWORD=xxxx xxxx xxxx xxxx
SMTP_FROM=PIR Visuals <alamatemail@gmail.com>
PORTFOLIO_PUBLIC_BASE_URL=https://domain-website-kamu.com
```

Untuk port 587 gunakan `SMTP_SECURE=false` (STARTTLS). Jika provider mewajibkan port 465, gunakan `SMTP_PORT=465` dan `SMTP_SECURE=true`.

6. Simpan `.env`, lalu restart proses website (`npm run website`). Jangan commit atau membagikan `.env`.

## Jika menggunakan provider SMTP lain

Gunakan hostname, port, mode TLS, username, dan password SMTP dari dashboard provider. Contoh provider transaksional: Brevo, Mailgun, Amazon SES, atau SMTP hosting domain sendiri. Pastikan akun/domain sudah diverifikasi dan sender di `SMTP_FROM` diizinkan provider.

## Tes konfigurasi

- Buka `/studio/register` dan selesaikan pendaftaran/link akun untuk memicu email verifikasi, atau gunakan fitur kirim ulang verifikasi di halaman `/studio`.
- Periksa inbox dan folder spam.
- Coba fitur lupa password untuk menguji email reset.
- Jika gagal, periksa log terminal website. Error autentikasi biasanya berarti username/password SMTP salah atau App Password belum benar; timeout biasanya terkait host, port, firewall, atau TLS.
- Pastikan `PORTFOLIO_PUBLIC_BASE_URL` adalah alamat HTTPS publik yang benar agar link di email tidak mengarah ke localhost.

## Keamanan

- Gunakan App Password atau kredensial SMTP khusus aplikasi, bukan password email pribadi.
- Jangan pernah mengirim isi `.env`, `SMTP_PASSWORD`, atau App Password ke chat.
- Batasi akses file `.env` pada server.
- Gunakan alamat pengirim yang domainnya telah diverifikasi provider untuk deliverability yang lebih baik.
