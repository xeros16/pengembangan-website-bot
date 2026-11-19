# QA Report — PIR Visuals v5.89.0

## Scope
Beginner Experience & Guided Onboarding: guided member setup, personalized recommendations, need-based command discovery, extended workflows, welcome guidance, and release packaging hygiene.

## Automated validation

| Check | Result |
|---|---:|
| Root bot test suite (`npm test`) | **442 passed / 0 failed** |
| Website test suite (`npm run website:test`) | **384 passed / 0 failed** |
| Root JavaScript syntax (`npm run check`) | **223 files passed** |
| Website syntax (`npm run website:check`) | **Passed** |
| Release archive audit (`npm run audit:release`) | **Passed** |

The root suite was 419/419 before this change. v5.89.0 adds coverage for onboarding sessions, per-member isolation, brief-wizard arbitration, persistence, custom prefixes, cancellation, search relevance, and expanded need workflows.

## Findings addressed
1. `.mulai` was previously a static guide. It now offers a two-step onboarding based on user goal and skill level.
2. Members had to know command names to find tools. `.cari` now accepts natural-language Indonesian/English needs and ranks relevant catalog commands.
3. `.alur` focused mainly on design production. It now also covers finding/offer services, community use, and games.
4. Default group welcome messages did not clearly route new members to onboarding. The default welcome now includes `.mulai`, `.cari`, and `.rules`.
5. Runtime files could be present in the source tree. `audit:release` now checks local environment, auth, backup, allowlist, local config, and temporary data.

## Data and compatibility
- No MongoDB schema change or migration.
- Onboarding preferences use existing `User.preferences` Mixed field.
- The code uses `$set: { 'preferences.onboarding': profile }` so other preferences are not replaced.
- Database persistence is skipped when MongoDB is not ready; in-process fallback remains available.
- Existing command routes and permission checks are retained.
- No runtime dependency was added.

## Manual and staging limitations
The following were not certified by automated local tests:
1. Live WhatsApp pairing and real group welcome delivery.
2. MongoDB persistence against the user's live/staging database, including read-after-restart.
3. Real member testing on Android, iOS, WhatsApp Web, and different client versions.
4. Actual group onboarding behavior under concurrent users at production message volume.
5. External integrations, SMTP, media processing, and backup restore.

## Release assessment
**Automated status: green.**

v5.89.0 is a bot release candidate ready for staging verification. It is not a claim that live WhatsApp/MongoDB integrations have been tested or that production readiness is certified.
