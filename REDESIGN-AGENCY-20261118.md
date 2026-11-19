# PIR Visuals — Agency Redesign / 2026-11-18

## Status

Redesign layer siap dipasang ke source PIR Visuals. Perubahan mempertahankan route, database model, upload pipeline, autentikasi, Owner CMS, Designer Studio, Client Workspace, dan fitur bot yang sudah ada.

Referensi kualitas desain yang digunakan adalah pendekatan editorial, bold typography, user-path discovery, product cards, social proof, dan storytelling. Identitas PIR Visuals tetap original; tidak ada copy-paste aset, logo, copywriting, atau branding dari referensi eksternal.

## Perubahan utama

- Design system global baru: forest, sage, warm paper, clay accent.
- Typography maksimal dua keluarga: serif editorial untuk heading dan sans-serif system untuk body/UI.
- Navbar konsisten, sticky, full-width, tanpa gap atas.
- Hero interior lebih kuat dan editorial.
- Homepage mendapat user-journey section:
  1. Saya mencari desainer.
  2. Saya ingin menampilkan karya.
  3. Saya sedang menjalankan proyek.
- Homepage menampilkan social proof hanya jika testimonial sudah `emailVerified` dan `isPublished`.
- Card, button, form control, focus state, spacing, shadow, dan radius disatukan.
- Responsive rules ditargetkan untuk 1440, 1280, 1024, 768, 480, dan 375 px.
- Reduced-motion tetap dihormati.
- Case study / portfolio detail dibuat lebih editorial tanpa mengubah data karya.
- Preview offline diperbarui agar mencerminkan design system baru.
- Tidak menambahkan dependency runtime baru.

## File utama

- `portfolio-website/pir-agency-system.css`
- `portfolio-website/server.js`
- `portfolio-website/tests/agency-design-system-20261118.test.js`
- `PIR-Visuals-Preview.html`

## Pemasangan

1. Backup project lama.
2. Extract paket redesign ke folder project yang sama.
3. Pertahankan `.env` lama milik instalasi Anda.
4. Pertahankan data privat lokal seperti `auth_info_baileys`, `config/allowed-chats.json`, dan backup internal jika masih dibutuhkan.
5. Jalankan dari root project:

```bash
npm ci
npm run website:install
npm run website:check
npm run website:test
npm run website
```

6. Buka `http://localhost:3080/` dan lakukan hard refresh.
7. Uji minimal:
   - `/`
   - `/discover`
   - `/categories`
   - `/about`
   - `/for-business`
   - `/contact`
   - `/shortlist`
   - `/favorites`
   - `/work/<ITEM_ID>`
   - `/studio`
   - `/client`
   - Owner Dashboard / Visual Site Studio

## Catatan keamanan paket

Paket distribusi redesign tidak membawa `.env`, session/auth state, `backups`, atau `node_modules`. Ini disengaja agar secret, session WhatsApp, dan data privat tidak ikut didistribusikan. Gunakan konfigurasi dan data privat dari instalasi Anda sendiri.

## Verifikasi

- `node --check portfolio-website/server.js`: lulus.
- `npm run website:check`: lulus.
- Tes redesign baru: 3/3 lulus.
- Tes terarah fitur homepage, Owner CMS, dan Favorites/Shortlist: lulus.
- Suite website penuh masih memiliki kegagalan baseline metadata lama pada repository (release tests mengharapkan versi historis 6.7.2), bukan kegagalan dari redesign ini.
