# Anime Discovery — Provider Fallback v6.7.0

## Provider strategy
1. Primary: Jikan API v4, which exposes MyAnimeList data.
2. Fallback: AniList GraphQL when Jikan returns an error, rate limit, timeout, or network failure.

The fallback applies to:
- `.anime cari <judul>`
- `.anime populer`
- `.anime musim`
- `.anime detail <MAL_ID>`

AniList results are normalized into the bot's common anime format. MyAnimeList IDs are used when available; otherwise the reference link points to AniList. The response identifies the provider used.

## Safety
- Jikan requests retain `sfw=true`.
- AniList queries use `isAdult:false`.
- Detail output rejects adult-flagged entries.
- The feature remains information/search only. It does not stream or download anime episodes.

## Failure behavior
If Jikan fails, the bot tries AniList automatically. If both fail, the response distinguishes rate limiting, provider-side errors, timeout, and unreachable network where possible. Check outbound HTTPS/DNS from the bot host if both providers remain unavailable.

## Staging
Test normal search, popular, seasonal, and detail. Then simulate Jikan 429/503/network failure and confirm AniList is used. Finally simulate both providers failing and verify the user receives a useful diagnostic rather than a silent or generic failure.
