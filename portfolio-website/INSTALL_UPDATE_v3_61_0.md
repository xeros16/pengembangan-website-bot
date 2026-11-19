# Update PIR Visuals Website v3.61.0

1. Backup `.env`, MongoDB, `uploads/portfolio`, `portfolio_uploads`, and any custom backup folders.
2. Stop the website process before replacing files.
3. Extract this release and replace the existing `portfolio-website` folder with the included folder.
4. Preserve the existing `.env` and upload directories; do not replace them with empty folders.
5. Run `npm ci` if dependencies are not already installed or if the lockfile changed.
6. Start the website again using the existing start command.
7. Open Designer Studio and hard-refresh with `Ctrl + Shift + R`.

## Verify
- Open `/studio`, enter **Portfolio**, and check that each work shows its ART ID and image gallery controls.
- Select a different image as **Cover**, remove an image, or add new images; save the work. The work returns to Owner moderation after an edit.
- Enter a price only when it should be displayed; leave it blank to hide the price.
- Open `/dashboard` and confirm Owner portfolio previews retain each image's natural ratio.
- Open Visual Site Studio and confirm the editor no longer has an unnecessary outer frame.

No database migration is required.
