# PIR Visuals Bot v6.7.0 — Feature Discovery, Anime Resilience & Apple Music Preview

## Highlights

### 1. Feature Discovery Hub
- Added `.fitur`, `.features`, and `.jelajah` as obvious entry points to the full WhatsApp command catalog.
- `.fitur` lists every command category with live command counts.
- `.fitur cari <kebutuhan>` searches the registry using natural language and synonyms.
- `.fitur kategori <nama>` opens a category; `.fitur semua [halaman]` pages through all commands.
- `.fitur alur` lists guided workflows; `.fitur alur <id>` opens a workflow step-by-step.
- The main WhatsApp menu now always advertises the discovery hub, independent of a user's customized runtime text.
- Website primary navigation now exposes **Semua Fitur Bot** directly instead of hiding Command Explorer under the overflow menu.

### 2. Anime Provider Resilience
- Jikan/MyAnimeList remains the primary source.
- AniList GraphQL is now queried automatically when Jikan fails, times out, or rate-limits.
- Search, popular, current-season, and MAL-ID detail requests have fallback query mappings.
- Fallback results are normalized into the same response format, include the provider attribution, and preserve safe-for-work filtering.
- If both sources fail, the bot reports whether providers rate-limited, timed out, or were unreachable rather than showing one generic error.
- No streaming, unofficial mirror, or copyrighted anime download functionality is introduced.

### 3. Apple Music Public Preview Download
- `.music preview <tautan-lagu-Apple>` resolves a single-song Apple Music URL through Apple's public iTunes Lookup API.
- `.dl apple <tautan-lagu-Apple>` and `.dl <tautan-lagu-Apple>` route to the same preview flow.
- The bot downloads only the public preview URL explicitly returned by Apple, when available, then sends that audio preview to WhatsApp.
- A single-track link is required. Album links should include the `?i=TRACK_ID` song identifier or use a direct song URL.
- Preview URL hosts are allowlisted to Apple's audio CDN; fetch is time-limited, content type is checked, redirects are revalidated against the Apple CDN allowlist, and the file is capped at 15 MB.
- If Apple does not expose a preview, the bot explains that no public preview is available.
- The feature does not decrypt DRM, access subscriber streams, or download full Apple Music tracks.

### 4. Website & Help Content
- `/commands` is now visible as **Semua Fitur Bot** in the primary navigation.
- Creative Studio documentation includes Apple preview commands and Anime fallback behavior.
- The generated command catalog and guided workflows include the new feature discovery aliases and Apple Music preview workflow.
- Website cache-busting version is advanced to v3.50.0.

## Compatibility
- Bot package: `6.7.0`.
- Website package: `3.50.0`.
- Node.js 18+ recommended.
- No new runtime npm dependency.
- No MongoDB schema or index migration.
- Existing runtime `content/texts.json` is preserved; the main menu adds the `.fitur` discovery footer in code. New default menu copy is also present in `content/texts.example.json`.

## Validation boundary
Automated tests cover command discovery, category paging, workflow lookup, AniList fallback mapping, provider error reporting, Apple Music URL parsing, Apple preview host allowlisting, size/content-type limits, and WhatsApp audio send routing. Live AniList/Jikan availability, Apple's current preview availability, real WhatsApp audio delivery, and browser visual acceptance still require staging. See `QA_REPORT_v6_7_0.md`.
