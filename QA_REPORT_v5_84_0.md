# QA Report — PIR Visuals v5.84.0

## Release scope
Designer & Client Workspace integration. This release focuses on the project lifecycle, synchronization with the designer lead pipeline, consistent project history, and project list usability.

## Automated checks
| Check | Result |
|---|---:|
| `npm run website:check` | PASS |
| `npm run website:test` | PASS — 342/342 |
| `npm run check` | PASS — 182 JavaScript files syntax-checked |
| `npm test` | 397 passed / 10 failed / 407 total |

## New project workflow coverage
The v5.84 suite adds tests for:
- Valid next-stage choices and terminal completed/cancelled states.
- Lead pipeline updates for contacted, qualified, won and closed.
- Preservation of manually closed/won lead outcomes.
- Server-side rejection of terminal project reopening and invalid transitions.
- Optimistic concurrency checks, including older documents without `__v`.
- Consistent status labels in client and designer activity timelines.
- Read-only presentation for closed projects.
- Project summary cards, accessible search/status filters and no-results feedback.
- Execution of the emitted project filter JavaScript against a mocked DOM to verify search, status filtering, result counts and empty-state behavior.

## Regression results
- Website suite: **342 passed, 0 failed**.
- Root suite: **397 passed, 10 failed**.
- The 10 root-suite failures match the existing baseline failure set exactly. They concern backup validation/retention, bot readiness/connection lifecycle, WhatsApp setup token/OTP, and older designer profile/route expectations. No additional root-suite failure was introduced by v5.84.0.

## Security and compatibility checks
- Existing designer ownership checks and client project-session scoping remain.
- Existing client CSRF protection remains.
- Existing one-time hashed access links and expiration behavior remain.
- Project status updates compare the expected status and version before writing, reducing stale concurrent updates.
- Completed/cancelled projects cannot be reopened through the project update route.
- No MongoDB model or collection migration is required.
- No new dependency was added.

## Environment limitations
- Database-connected smoke tests were not run; this environment does not verify the user's live MongoDB deployment.
- Real SMTP delivery was not exercised.
- Headless Chromium could not start reliably in the isolated runtime because of its GPU/display environment. The emitted filter JavaScript was instead executed in a Node VM with a DOM fixture, and all behavior assertions passed. Perform a visual browser check on the local deployment before production release.

## Files deliberately excluded
- `portfolio-website/models.js`
- `.env`, `.env.example`
- database/MongoDB data
- uploads and media
- WhatsApp authentication/session folders
- local logs and backups
