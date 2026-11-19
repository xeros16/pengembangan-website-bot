# Update PIR Visuals Bot v6.7.9

1. Backup `.env`, database, `uploads`, and `auth_info_baileys`.
2. Stop the bot and website processes.
3. Extract this package over a clean copy of the existing bot folder, or replace the existing folder after backup.
4. Keep the existing `.env` and runtime data folders.
5. Run `npm ci` at the bot root if dependencies changed; the website package lock is also updated to v3.56.0.
6. Start the bot and website again.
7. Open `/studio` and choose a PNG/JPG to verify the profile preview appears before saving.
8. Open `/discover` to verify circular avatars and natural image ratios.
9. Open Owner Dashboard → Visual Site Studio → Media karya pilihan Beranda to upload separate homepage photos/videos. Save and refresh `/`.

Homepage showcase media is now independent of designer portfolio uploads. Existing portfolio works remain available on their designer profiles and the directory; they will not automatically appear on the homepage.
