# Anime Discovery — PIR Visuals Bot v6.2.0

## Purpose

Provide a general-interest WhatsApp feature as part of PIR's balanced release policy, without displacing the design/community product. This release adds anime metadata discovery only.

## Commands

| Command | Behavior |
|---|---|
| `.anime` / `.anime help` | Show help |
| `.anime cari <judul>` | Search up to five anime titles |
| `.anime populer` | List five popular titles |
| `.anime musim` | List five current-season titles |
| `.anime detail <ID>` | Show full metadata for a MyAnimeList anime ID |

Aliases: `search`, `popular`, `top`, `season`, `seasonal`, and `info` are accepted as subcommands.

## Data source and behavior

- Data provider: Jikan API v4, an unofficial API for public MyAnimeList data.
- Search, popular, seasonal, and detail calls use the provider's public endpoints.
- Search/list requests set `sfw=true`.
- Results include title, type, episode count, year, score, a shortened synopsis, and a MyAnimeList reference link.
- Detail may include status, genres, and studios.
- The bot does not scrape streaming sites, provide episode playback links, or download copyrighted anime media.
- No personal user data or query history is persisted. Query results are cached in process memory for a short period only.

## Reliability and safety

- Request queue serializes API calls and spaces them to avoid bursts.
- In-memory cache is bounded to 180 entries and uses per-operation TTLs.
- Request timeout is 12 seconds.
- Query length is limited to 80 characters; a search needs at least two characters.
- Detail IDs must be positive safe integers.
- Only API-generated MyAnimeList URLs are emitted; provider response URLs are not trusted for output.
- API 429, 5xx, timeout, and general network errors receive distinct user-facing guidance.
- If the provider is unavailable, the bot remains usable; other commands are unaffected.

## Dependencies and migration

- Requires Node.js 18+ for built-in `fetch` (no new package dependency).
- No MongoDB schema or index migration.
- No website package change.
- Uses public Jikan service; provider availability and terms can change, so live staging checks are required.

## References

- Jikan homepage: https://jikan.moe/
- Jikan API documentation: https://docs.jikan.moe/
- Jikan seasonal API guide: https://docs.jikan.moe/usage/seasonal/
- MyAnimeList: https://myanimelist.net/
