# Update PIR Visuals Website v3.61.7

1. Stop the running website process.
2. Extract this ZIP and replace the existing `portfolio-website` folder with the included folder.
3. Keep the existing installation's `.env`, `auth_info`, and `auth_info_baileys` data; do not overwrite or delete them.
4. Start the website again using the project's usual command.
5. Open `localhost:3080` and hard-refresh with `Ctrl + Shift + R`.

This update corrects the homepage showcase width so the browser's vertical scrollbar no longer hides part of the green panel. The artwork keeps its current large size, centered placement, original aspect ratio, and uncropped `contain` behavior.
