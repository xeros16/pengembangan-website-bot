PIR VISUALS v5.89.0 — SOURCE DISTRIBUTION (2 ZIP PARTS)

This project is split into two independent ZIP archives because the full source package may be difficult to download as one file.

HOW TO REBUILD THE PROJECT FOLDER
1. Download BOTH Part 1 and Part 2.
2. Create one empty destination folder, for example: PIR-Visuals-v5.89.0.
3. Extract Part 1 into that destination folder.
4. Extract Part 2 into THE SAME destination folder.
5. If the extractor asks to merge folders, choose Merge/Combine. The two archives contain different files; the distribution note may appear in both parts.
6. Open a terminal in the reconstructed project folder and run `npm ci`.
7. Copy `.env.example` to `.env`, then fill in your own credentials. For an existing installation, preserve your existing `.env`, WhatsApp auth, database, and uploads instead.

IMPORTANT
- Both parts are required. Do not run the project from only one part.
- `node_modules`, `.env`, WhatsApp sessions, database contents, backups, allowlist data, local runtime settings, and uploads are intentionally excluded.
- `npm ci` installs dependencies from the included lockfile.
- The website has its own package manifest; use `npm --prefix portfolio-website install` only if website dependencies are needed.
- See `INSTALL_UPDATE_v5_89_0.txt` and `OPERATIONS_RUNBOOK_v5_89_0.md` for detailed instructions.
