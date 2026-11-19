# PIR Visuals Website v3.50.0 — Feature Discovery Navigation

- Promoted `/commands` to the primary navigation as **Semua Fitur Bot**, so the WhatsApp feature catalog is no longer hidden under the overflow menu.
- Updated the Creative Studio guide with Apple Music public-preview commands and Anime's Jikan/AniList fallback behavior.
- Updated public asset cache-busting tokens to v6700 and service-worker cache epoch to v45; health metadata reports platform v6.7.0.
- No new route or database schema is introduced; `/commands` remains generated from the active bot command registry.


## Bot content refresh — PIR Visuals v6.7.2

- Creative Studio guide now includes Voice Lab audio effects and Local Information commands (`.cuaca`, `.gempa`).
- Command Explorer catalog and guided workflows are regenerated from the same active bot command registry.
- Public asset query token advances to `v=6710` and service-worker cache epoch to `v46` so the updated guide/catalog is not hidden by stale cached HTML.
- Website package remains `3.50.0`; no website runtime dependency was added.
