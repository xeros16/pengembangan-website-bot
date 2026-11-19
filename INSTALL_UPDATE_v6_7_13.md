# Update PIR Visuals Bot v6.7.13

1. Stop the bot and website processes.
2. Back up the project `.env`, MongoDB database, `auth_info_baileys`, `uploads`, `portfolio_uploads`, `backups`, and `temp` directories.
3. Extract this ZIP and replace the previous project files. Preserve the existing private runtime directories and `.env`.
4. From the project root, run `npm ci` if dependencies need to be restored.
5. Run `npm run check` and `npm run website:check`.
6. Start the bot using the existing process manager. Start the website using `npm run website` or your current website process command.
7. Open `/dashboard` and use Owner Basic Authentication. The new controls are under Kelola karya, Desainer, and Event & website.
8. Hard refresh the homepage with `Ctrl + Shift + R` and test all five showcase tabs on desktop and mobile.

No MongoDB migration is required. Do not delete the existing upload directories or change the existing `.env` values.
