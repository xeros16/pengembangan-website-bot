# v5.19.0 — Security & Access Control Audit

Status: kandidat rilis, belum diuji pada WhatsApp produksi.

## Perubahan

- `isInboundChatAllowed` menjadi satu titik keputusan inbound:
  - Owner terverifikasi boleh menggunakan chat pribadi.
  - Pesan di grup, termasuk dari Owner, tetap harus melewati allowlist grup.
  - Kontak non-Owner tetap harus melewati allowlist kontak.
- JID chat pribadi Owner yang telah terverifikasi otomatis didaftarkan sebagai tujuan balasan outbound, baik format nomor WhatsApp maupun LID.
- Grup tidak pernah otomatis ditambahkan ke allowlist oleh jalur Owner.
- Tes MongoDB allowlist diisolasi dari konfigurasi lokal agar tidak membaca/mengubah daftar grup pengguna.
- Ekspektasi tes katalog diperbarui mengikuti teks UI aktual.

## Validasi lokal (baseline arsip sebelum perbaikan audit lanjutan)

Hasil yang tercatat di dokumen ini berasal dari pengujian sebelumnya dan bukan hasil pengujian ulang terhadap setiap lingkungan deployment. Hasil verifikasi terbaru harus dicatat pada laporan audit yang menyertai build distribusi.

## Batasan dan langkah sebelum rilis

1. Verifikasi `OWNER_JIDS` melalui `.env` pada mesin deployment.
2. Pastikan nomor Owner dan LID yang dipakai WhatsApp benar-benar cocok dengan identitas pesan Baileys.
3. Uji Owner private chat (nomor dan LID), Owner di grup allowlisted, Owner di grup non-allowlisted, Admin, dan Member.
4. Pastikan balasan Owner hanya menuju JID pribadi yang terverifikasi.
5. Jalankan tes integrasi dengan MongoDB staging.
6. Jangan sertakan `.env`, `auth_info*`, `config/allowed-chats.json`, backup, atau file sementara ke arsip distribusi.

## Catatan

Kandidat ini memperbaiki bypass Owner di grup yang ditemukan pada audit sumber. Status v5.19.0 belum boleh dianggap rilis produksi sampai pengujian operasional di atas selesai.


## Hardening audit lanjutan — 1 November 2026

- Pemeriksaan inbound pada command handler diselaraskan dengan helper `isInboundChatAllowed`, sehingga bypass Owner tetap terbatas pada chat pribadi meskipun handler dipanggil langsung.
- Helper inbound memverifikasi tipe tujuan dari JID selain flag `isGroup`; JID grup atau tujuan tidak valid tidak dapat memakai bypass Owner.
- Log inbound tidak lagi mencetak isi pesan. Log outbound yang diblokir tidak lagi mencetak JID tujuan.
- Dokumentasi kebijakan Owner diperbarui agar tidak menyatakan Owner dapat menjalankan command dari grup yang belum diizinkan.
- Ditambahkan tes regresi untuk flag grup yang tidak konsisten, JID grup, JID privat, LID, dan tujuan tidak valid.
- Hasil `npm ci` pada lingkungan audit mengalami timeout; dependensi `node-fetch` dan `mongoose` tidak tersedia. Karena itu `npm test` belum dapat dinyatakan lulus penuh.


## Hasil pengujian ulang setelah hardening — 1 November 2026

- `npm run check`: lulus, 152 file JavaScript.
- `node --test tests/access-control.test.js tests/designer-assistant.test.js`: lulus, 42/42 tes.
- `npm test`: 240 lulus, 5 gagal (245 total). Lima kegagalan terjadi saat pemuatan modul karena paket `node-fetch` (empat test file) dan `mongoose` (satu test file) tidak tersedia di lingkungan.
- `npm ci --ignore-scripts --no-audit --no-fund`: timeout; instalasi dependensi belum berhasil diselesaikan.
- MongoDB staging/produksi: belum diuji.
- WhatsApp live, termasuk pemetaan LID/nomor lintas perangkat: belum diuji.

Status verifikasi: syntax dan tes terfokus lulus; keseluruhan suite belum lulus. Kandidat belum layak dinyatakan rilis produksi.

- `node scripts/audit-release.js`: lulus; tidak ditemukan file sesi, `.env` aktif, backup, data langganan, atau file sementara yang dilarang.
