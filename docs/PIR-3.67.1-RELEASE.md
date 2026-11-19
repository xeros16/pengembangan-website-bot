# PIR Visuals website 3.67.1

The website patch builds on 3.67.0. The WhatsApp bot remains at 6.7.13. MongoDB collections, existing records and shared upload storage remain compatible.

- Same-origin browser forms now submit from private pages that use a no-referrer policy. The shared origin check requires same-origin Fetch Metadata for a serialized null Origin. Session, CSRF and one-time invite token checks still apply.
- Designers can edit their own services in Studio, including price, package, revisions and delivery time. The server validates integer fields and returns 404 for missing or unowned services.
- Studio availability validates real dates against the Jakarta calendar. Historical availability stays in storage, and upcoming entries are shown in Studio. Public availability continues to exclude private notes.
- Public profile collections link to real case studies. The collection display verifies current approval and ownership, removes duplicate references and hides empty published collections. Studio prevents creating an empty collection.
- The daily analytics chart recognizes persisted calendar dates. Discover adds a deterministic tie-breaker for regular, relevance and fit sorting.
- Owner moderation returns a conflict for a work already outside the pending queue. Missing support tickets and unverified or missing testimonials return 404 without a success redirect.

## Install

The cumulative update ZIP applies to the initial project ZIP and to a checkout with 3.67.0. Apply it in a fresh release directory using the [installation and deployment guide](PIR-3.67-DEPLOYMENT.md), substituting the 3.67.1 update ZIP filename. The complete 3.67.1 source ZIP is also available. No database migration is required.

## Files changed in this patch

- `portfolio-website/server.js`, `lead-utils.js`, `directory-utils.js`, `matchmaking-utils.js`, `package.json`, `package-lock.json` and `edition-assets/pir-edition.css`
- Directory, matchmaking, origin validation and analytics authorization assertions in `portfolio-website/tests/`
- `README.md` and this release report. The [3.67.0 technical audit](PIR-3.67-AUDIT.md) and [3.67.0 QA report](PIR-3.67-QA.md) preserve the prior evidence.

## Verification

- The 3.67.1 smoke suite passed all nine checks. JavaScript syntax checks passed.
- The regression run exercised 22 checks on a disposable MongoDB fixture, including Studio service edit in desktop and mobile Chromium, private calendar notes, approved collection links, stale owner moderation, loopback SMTP delivery, browser invite confirmation, and token replay rejection.
- The browser suite passed all 18 desktop and mobile Chromium tests with synthetic public and private work. The screenshot archive includes desktop and mobile views of the service editor and profile collection.
- Testing used a local SMTP capture server restricted to synthetic addresses. Production SMTP, WhatsApp linking and OTP delivery, production traffic and the production rollout remain unverified.
- The requested references still returned HTTP 403 from the cloud proxy. The website Node suite finished with 682 passes and the same 130 failures as 3.67.0. The bot Node suite finished with 697 passes and its same historical metadata failure. These failures remain a release gate.
