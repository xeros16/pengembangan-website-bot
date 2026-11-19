# Update PIR Visuals Website v3.60.1

1. Stop the website process.
2. Back up the current `portfolio-website` folder, project `.env`, MongoDB database, and portfolio upload directory.
3. Replace the existing `portfolio-website` folder with this release. Preserve `.env`, uploads, and other private runtime data.
4. From `portfolio-website`, run `npm ci` if dependencies need to be restored, then run `npm run check` and `npm test`.
5. Start the website using your existing process manager or `npm start`.
6. Open `http://localhost:3080` and confirm the homepage and featured designer section render.
7. Hard refresh Chrome with `Ctrl + Shift + R`.

No database migration is required. Existing portfolio images, homepage media, Owner Dashboard data, and authentication settings remain in place.
