# PIR Visuals Bot v6.3.0 — PIR Assistant & Music Discovery

## Core PIR improvements
- Added `.asisten <kebutuhan>` as a deterministic intent router over the live command catalog.
- Assistant suggestions include the best-matching existing command, related tools, and examples.
- The assistant never executes suggested commands automatically and does not claim to be generative AI.
- Added music/audio discovery to natural-language command search and category navigation.
- Added `.menu musik`, `.alur musik`, and dedicated `.help asisten` / `.help music` guides.

## General/multifunction feature slot
- Added `.music cari <query>` for song metadata search.
- Added `.music album <query>` for album search.
- Added `.music artis <query>` for artist search.
- Added `.music detail <track ID>` for track metadata lookup.
- Results include track ID, artist, album, genre, release year, duration, and Apple Music/iTunes links where available.
- Explicit results are filtered. No audio previews are sent or downloaded by Music Discovery.
- Improved existing `.song`/`.play`/`.lagu` search results with artist/channel, view-count, and upload-date metadata when available.

## Reliability and compatibility
- Music metadata uses Apple's public iTunes Search/Lookup API, bounded in-memory cache, serialized request pacing, timeout, query validation, and friendly provider error handling.
- Existing yt-dlp download queue, ownership guidance, and media size checks remain in place.
- No new runtime package dependency or database migration.
- Website package and MongoDB schemas remain unchanged.

## Verification boundary
- Automated tests cover command registration, intent routing, iTunes URL construction, explicit filtering, metadata formatting, lookup validation, cache behavior, and provider 429 handling.
- Live iTunes API, yt-dlp/FFmpeg, WhatsApp delivery, and target-host behavior still require staging verification.
- Release status: Development Candidate until full dependency suite and live staging checks pass.
