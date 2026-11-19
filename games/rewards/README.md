# Daily Missions & Rewards (Stage 10)

Commands:
- `.mission` — show today's missions and progress.
- `.mission claim chat10` — claim the 10-message mission.
- `.mission claim games2` — claim the 2-game-command mission.
- `.mission claim chat25` — claim the 25-message mission.

Progress is recorded for messages in allowlisted groups and commands routed through the game registry (plus multiplayer). The daily cycle follows UTC and resets at 00:00 UTC. Rewards add coins and XP to `User.activity`; MongoDB must be connected. Claiming is guarded by a conditional update on the daily claim list to prevent duplicate payouts.

Mission reward table:

| ID | Goal | Reward |
| --- | --- | --- |
| `chat10` | 10 group messages | 20 coins + 5 XP |
| `games2` | 2 game commands | 30 coins + 10 XP |
| `chat25` | 25 group messages | 50 coins + 15 XP |
