# QA Report — PIR Visuals Bot v5.90.0

## Scope
Designer Workflow 2.0 built on the v5.89.0 source. The website application code was not functionally changed; only shared bot-version expectations in website regression tests were advanced to v5.90.0.

## Validation summary

| Check | Result |
|---|---:|
| Root JavaScript syntax | 225 files passed |
| Root test suite | 453/453 passed |
| Website syntax check | Passed |
| Website test suite | 384/384 passed |
| Release archive audit | Passed |
| Command documentation generation | Passed |

Environment: Node.js v22.16.0. Automated tests used the project dependency installation available in the working environment; dependencies are excluded from the release ZIP and must be installed by the recipient with `npm ci`.

## New workflow coverage
- Six-stage order and initial state.
- Legacy project normalization without a schema migration.
- Sequential completion and rejection of skipped stages.
- Completion through all six stages.
- Reopening an earlier stage and clearing downstream completion flags.
- Project-specific step guidance and command suggestions.
- Project creation, step view, board, progress, completion, and reopen.
- Duplicate workflow reset.
- Duplicate-name protection for `start`.
- Per-account in-process serialization of concurrent project creation.

## Compatibility checks
- Existing `.designproject` commands remain available.
- Existing project records without `workflow` begin at Brief.
- Existing `User.preferences` fields are preserved when workspace mutations are saved.
- No database schema migration is required.
- Project data remains scoped by active WhatsApp JID.
- Website version remains 3.42.0; website cache/version assets were not changed.

## Release limitations / staging still required
Automated tests do not verify:
- Live WhatsApp message delivery, reconnect behavior, or actual Android/iOS/Web client rendering.
- MongoDB staging persistence, concurrent writes across multiple bot instances, or backup restoration.
- Actual member comprehension and completion rates in a live group.
- Real design-file inspection; stage completion is a manual user confirmation.
- Cross-account collaboration, file upload, or automatic client approval (not included in this release).

## Release decision
**Automated QA passed.** v5.90.0 is a validated release candidate for staging. Do not describe it as production-verified until the live integration and member walkthrough checks above have been completed.
