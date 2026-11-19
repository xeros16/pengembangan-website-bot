# PIR Visuals v5.26.0 — Architecture & Audit Update

## Keputusan arsitektur
- WhatsApp tetap menggunakan Baileys 6.7.24.
- Game Center tetap dipertahankan sebagai modul terpisah di `games/`; tidak digabung dengan fitur direktori desainer.
- Public Portfolio Website dipisahkan menjadi project deployable `portfolio-website/` dengan package dan konfigurasi sendiri.
- Proses bot tidak lagi memulai/menghentikan HTTP server website.
- Website berbagi MongoDB collections dan folder upload dengan bot.

## Kompatibilitas
- Koleksi `designerprofiles`, `portfolioitems`, `designservices`, dan `designeranalytics` tetap digunakan.
- Tidak ada migrasi destruktif atau penghapusan data.
- Perintah WhatsApp portfolio/design/service dipertahankan.
- Game source tetap tersedia di `games/`.

## Operasional
Deploy bot dan website secara independen. Konfigurasikan `PORTFOLIO_PUBLIC_BASE_URL` pada bot, lalu konfigurasi `portfolio-website/.env` dengan MongoDB URI dan path absolut media yang sama.

## Batas verifikasi
Uji syntax dan test otomatis dilakukan pada source. Uji live Baileys, MongoDB staging, reverse proxy, QR provider, dan WhatsApp real-session harus dilakukan pada environment deployment.
