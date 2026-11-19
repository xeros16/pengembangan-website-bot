# Checklist rilis

Sebelum membagikan ZIP proyek:

- [ ] `npm run doctor` telah diperiksa.
- [ ] `npm run check` lulus.
- [ ] `npm test` lulus.
- [ ] `npm run audit:release` lulus.
- [ ] `npm run integration:doctor` memastikan database dan folder media bot/website sama.
- [ ] `npm run verify:database` memeriksa collection dan index staging.
- [ ] `npm run smoke:deployment` memeriksa endpoint readiness bot dan website.
- [ ] Backup MongoDB dan media diuji restore ke database staging terpisah.
- [ ] Profil, kontak publik, karya, analytics, dan notifikasi Designer Studio diuji dua arah.
- [ ] `.env`, folder autentikasi WhatsApp, backup, `.git`, dan `node_modules` tidak masuk ZIP.
- [ ] Folder `temp/` hanya berisi `.gitkeep`.
- [ ] `uploads/portfolio/` tidak berisi media pribadi.
- [ ] Database dan data langganan lokal tidak masuk ZIP.
- [ ] README dan `docs/commands.md` sesuai dengan fitur yang benar-benar tersedia.
- [ ] Instalasi diuji di folder baru, tanpa bergantung pada file di komputer pengembang.

Tes lokal tidak menggantikan uji integrasi pada akun WhatsApp dan database pengujian.
