# Music Discovery — v6.3.0

## Commands
```text
.music
.music cari <judul/artis>
.music album <judul/artis>
.music artis <nama>
.music detail <track ID>
.song <judul/artis>
.song pilih <nomor>
.dl audio <tautan publik>
```

## Provider
- Metadata search and lookup use Apple's public iTunes Search API (`/search`, `/lookup`).
- Search entities: `song`, `album`, and `musicArtist`.
- Search results are limited to five displayed items and include the track ID needed by `.music detail`.
- Explicit results are filtered when the provider marks them as explicit.
- The bot returns official Apple Music/iTunes links when a safe HTTPS Apple URL is present.
- No preview audio is sent, cached, or downloaded by this feature.

## Existing audio download flow
- `.song` / `.play` / `.lagu` continue to use the locally installed `yt-dlp` search provider.
- Search selection remains scoped to chat + user and expires after 10 minutes.
- Search result output now includes artist/channel and optional view count/upload date when available.
- Actual download remains subject to the existing queue, file-size limits, provider support, and user's right/permission to download the media.

## Reliability
- Bounded in-memory LRU-style cache (maximum 120 keys, five-minute TTL).
- Serialized provider requests with pacing.
- 10-second request timeout when `AbortSignal.timeout` is available.
- Query length limit, response schema validation, explicit-content filter, and friendly 429/5xx/network messages.
- No database migration or new dependency.

## Acceptance
- Test `.music cari`, `.music album`, `.music artis`, and `.music detail`.
- Verify explicit tracks are not displayed.
- Verify Apple links are HTTPS and on an Apple domain.
- Verify provider 429/timeout produces a friendly message.
- Verify `.song` search still works with local yt-dlp and FFmpeg.
