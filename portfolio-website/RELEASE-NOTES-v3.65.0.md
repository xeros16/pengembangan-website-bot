# PIR Visuals Website — v3.65.0

## Phase 2 Functional QA — Discover layout repair

- Fixed the Discover desktop overlap visible in the supplied screenshot. The sticky filter rail is now contained by a dedicated directory/results wrapper and cannot float over the Selected Work collection or workflow section below it.
- Reorganized the Discover DOM into `pv-directory-layout` and `pv-directory-results` while preserving existing GET forms, field names, query parameters, sort options, pagination links, portfolio routes, and client-side work filters.
- Kept the filter rail sticky on wide desktop only; it returns to normal document flow on tablet and mobile.
- Stabilized the directory results grid and card action wrapping at desktop and narrow widths.
- Added a final cache-safe stylesheet layer and regression coverage for the layout containment and directory interactions.

## Functional QA scope

- Directory query parsing, sorting, budget overlap, invalid budget handling, fit scoring, and pagination are covered by the existing directory/matchmaking tests.
- Selected-work category chips and search remain client-side and update the visible count and `aria-pressed` state.
- Favorites and shortlist remain browser-local; shortlist is limited to four profiles.
- Live email/WhatsApp delivery, OTP sending, and authenticated Studio mutations are not exercised in isolated QA because they require the user's configured external services and account session.

## Validation

- `npm run check` — passed.
- Focused directory/matchmaking and v3.65 regression tests — see QA report.
- Full legacy website suite contains older release/cache assertions that are not aligned with the current release; failures are recorded separately rather than silently rewritten.
