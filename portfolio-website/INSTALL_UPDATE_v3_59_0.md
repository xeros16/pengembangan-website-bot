# Update PIR Visuals Website v3.59.0

1. Backup `.env`, database, `uploads`, and `auth_info_baileys`.
2. Stop the website process.
3. Replace the website files with this release.
4. Keep the existing environment file and runtime upload/database folders.
5. Restart the website and hard-refresh with `Ctrl + Shift + R`.

No database migration is required. The campaign carousel is kept visible at the top of the homepage. Existing saved campaign slides are restored even if an older save marked all slides disabled. If no campaign slides exist, separately uploaded homepage media is used; otherwise a branded default slide is shown. Custom slides can be managed in Owner Dashboard → Visual Site Studio → Banner & campaign.
