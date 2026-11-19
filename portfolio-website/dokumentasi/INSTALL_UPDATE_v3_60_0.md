# Update PIR Visuals Website v3.60.0

1. Stop the website process before replacing files.
2. Back up the current `portfolio-website` folder, the project `.env`, MongoDB database, and portfolio upload directory.
3. Extract the Website ZIP and replace the existing `portfolio-website` folder. If using the complete Bot ZIP, replace the project with that package while preserving your `.env`, `auth_info_baileys`, `backups`, and `uploads` directories.
4. Do not delete or rename the existing portfolio upload directory. Existing portfolio images and homepage media remain in place.
5. From `portfolio-website`, run `npm ci` if dependencies need to be restored, then run `npm run check`.
6. Start the website with `npm start` (or your existing process manager).
7. Open `/dashboard` and sign in with the Owner Basic Authentication credentials.
8. Review **Kelola karya**, **Desainer**, and **Event & website**. Mark works as featured or approved as needed, then add Owner events in Visual Site Studio.
9. Hard refresh the public homepage with `Ctrl + Shift + R`. Confirm all five showcase tabs and mobile swipe controls.

## Notes

- No MongoDB migration is required.
- The showcase only displays approved works belonging to public designer profiles.
- Termahal/termurah ranking uses the work's `priceFrom` (starting price) and excludes items with no listed price.
- Owner events are independent from designer portfolio uploads and do not need a designer profile.
