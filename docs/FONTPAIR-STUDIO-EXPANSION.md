# FontPair Studio Expansion

## Commands

| Command | Purpose |
|---|---|
| `.fontpair [style]` | Filter curated pairings by tags |
| `.fontpair semua [page]` | Browse all 33 curated pairs, 12 per page |
| `.fontpair preview <number or style>` | Send a PNG specimen using installed fonts/fallbacks |
| `.fontpair google <display> | <body>` | Send an HTML preview that loads real Google Fonts CSS2 families in a browser |
| `.fontpair mood <brief>` / `.fontpair brand <brief>` | Rank curated pairs for a moodboard or brand brief |
| `.fontpair recommend <need>` | Recommend pairings for a design use case |
| `.fontpair search <font>` | Search local pairings and link to Google Fonts search |
| `.fontpair save <number>` | Save a pairing for the current WhatsApp JID |
| `.fontpair favorites` | List saved pairings for the current JID |
| `.fontpair unsave <number>` | Remove a saved pairing by its list number |

## Google Fonts preview

The bot validates requested families with the Google Fonts CSS2 endpoint before sending a standalone HTML document. The document imports both requested families from `fonts.googleapis.com`; users must open it in a browser with internet access. The bot does not bundle or redistribute font binaries. See the [official CSS2 API documentation](https://developers.google.com/fonts/docs/css2).

## Favorites storage

Favorites are stored in the `FontPairFavorite` MongoDB collection with fields `jid`, `pairKey`, `fonts`, `note`, and `catalogIndex`. A unique compound index on `{ jid, pairKey }` prevents duplicate saves per user. Listing and deletion always filter by the active WhatsApp JID. MongoDB must be connected.

## Recommendation matching

Mood and use-case matching are deterministic keyword/tag ranking over the curated catalogue. Results are suggestions, not an automated brand identity decision. Review legibility, language coverage, weights, and font licenses before production.

## FontPair Design Assistant

Command: `.fontpair ai <brief>` (aliases: `assistant`, `asisten`, `brief`).

The assistant returns a curated typography shortlist, a starter palette, and art-direction guidance from Indonesian/English design keywords. A reference image can be sent with the command caption or quoted/replied to; the image pipeline reads dimensions and channel mean color through Sharp and includes those color hints in the response.

Important limitation: this implementation is deterministic and local-rule based, not an LLM or vision model. It does not perform OCR, object recognition, or semantic visual critique. The response explicitly discloses this so users do not mistake color statistics for AI image understanding. A future true multimodal assistant can be connected through a configured model provider after credentials, privacy, and cost controls are agreed.
