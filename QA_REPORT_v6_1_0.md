# QA Report — PIR Visuals Bot v6.1.0

## Scope

WhatsApp-first update covering resumable Design Brief Wizard sessions, Admin-managed group word filtering, warning review reminders, command discoverability, and MongoDB index verification.

## Focused automated tests

The focused test batch executed:

```bash
node --test tests/design-brief-wizard.test.js tests/onboarding.test.js tests/group-moderation-access.test.js tests/antitoxic-moderation.test.js tests/command-catalog.test.js tests/command-routing.test.js tests/command-search.test.js
```

Result after the v6.1.0 changes: **55/55 passed** in the focused batch. `npm run check` also passed with **260 JavaScript files** syntax-checked. The full root suite then passed **572/572 tests** after the existing Mongoose dependency from the provided project bundle was made available for the run.

Coverage includes:
- Wizard start, seven-step completion, validation, status, cancel, and command pass-through.
- Per-account/per-chat isolation.
- Persistent mock storage and resume after clearing the process cache.
- Backtracking and overwriting an earlier answer.
- Deletion of drafts on completion/cancel.
- Unicode normalization and exact whole-word matching.
- Admin exemption and automated moderation warning creation.
- Admin-managed word list, explicit enable action, and natural-language command discovery.
- Existing onboarding behavior and allowlist moderation gate.

Release audit passed after excluding local runtime files. The full root suite passed 572/572; no live WhatsApp or production MongoDB connection was used for these automated tests.

## Not yet verified in this environment

- Live MongoDB compound/TTL index creation and TTL monitor behavior.
- Live Baileys session continuity across an actual process restart.
- WhatsApp message deletion with the bot as a group Admin.
- LID/phone-JID identity consistency across real WhatsApp clients.
- Live website, SMTP, media providers, and external AI APIs.

## Release assessment

**Development candidate — not yet certified Stable.** Do not interpret automated test results as live-production approval. Complete the staging acceptance in `INSTALL_UPDATE_v6_1_0.md` before production rollout.
