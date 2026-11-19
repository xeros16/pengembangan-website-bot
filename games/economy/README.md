# Player Economy (Stage 11)

Commands (MongoDB required):
- `.shop` — list collectable items and prices.
- `.buy <item-id> [quantity]` — purchase 1–10 copies; balance check and debit happen in one conditional MongoDB update.
- `.inventory` / `.inv` — list owned items.
- `.wallet` / `.saldo` — show coin balance.
- `.daily` — claim once per UTC day for 100 coins and 10 XP.

Items are currently collection-only; the ticket item does not alter game odds or outcomes. Purchases and daily claims are recorded in a rolling 30-entry activity transaction history. No player-to-player transfer or cash conversion is provided.
