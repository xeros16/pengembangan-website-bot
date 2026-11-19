# Update PIR Visuals Website v3.60.2

1. Back up the current website folder, `.env`, database, and upload folders.
2. Stop the website process.
3. Replace the `portfolio-website` folder with this release's `portfolio-website` folder.
4. Keep the existing `.env`, database, and uploaded media. Do not overwrite them with example or empty files.
5. Run `npm ci --prefix portfolio-website --no-audit --no-fund` if dependencies changed; this release does not change runtime dependencies.
6. Start the website again and hard-refresh the browser with `Ctrl + Shift + R`.
7. Open `/dashboard#studio-editor`, add/remove FAQ entries, save, then verify the public homepage FAQ and the live preview.

The FAQ data is stored in the existing `PortfolioSiteContent` homepage document. No migration is required.
