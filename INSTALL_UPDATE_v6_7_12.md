# Update PIR Visuals Bot v6.7.12

1. Backup `.env`, database, `uploads`, and `auth_info_baileys`.
2. Stop the bot and website processes.
3. Extract this release and retain the existing runtime data/configuration.
4. Ensure the `portfolio-website` folder is replaced with the bundled v3.59.0 folder.
5. Restart the bot and website.
6. Hard-refresh the browser with `Ctrl + Shift + R`.

No database migration is required. The homepage carousel remains independent from designer portfolio uploads. If campaign slides are missing, separately uploaded homepage media is used as a fallback; otherwise a branded default slide is shown. Upload custom slides from Owner Dashboard → Visual Site Studio → Banner & campaign.
