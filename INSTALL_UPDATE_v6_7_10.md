# Update PIR Visuals Bot v6.7.10

1. Backup `.env`, database, `uploads`, and `auth_info_baileys`.
2. Stop the bot and website processes.
3. Extract this package over a clean copy of the existing bot folder, or replace the existing folder after backup.
4. Keep the existing `.env` and runtime data folders.
5. Run `npm ci` at the bot root only if bot dependencies changed. Run `npm ci --prefix portfolio-website` only if website dependencies changed.
6. Start the bot and website again.
7. Open `/discover`, use Quick view, and verify the designer's profile photo appears.
8. Open a designer profile and verify Selected Work images are visible and retain their original aspect ratios.
9. Open a project case study and verify its cover is not cropped and the chapter navigation is readable.
10. Check the “Bagikan pengalaman proyek” form on desktop and mobile.

This update changes website rendering only; it does not require a database migration. Keep all runtime data and uploads during replacement.
