# Unified Player System (Stage 9)

Commands:
- `.player` — profile, activity level, XP, message count, achievements.
- `.player top` — global top 10 ordered by XP, then message count.

The system reuses `User.activity` from the existing database. Level thresholds remain aligned with the existing activity level command: one level per 25 XP. Achievements are calculated from recorded message milestones (1, 25, 100, 500, 1000). MongoDB must be connected. The leaderboard intentionally omits JIDs and phone numbers.
