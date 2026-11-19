# PIR Visuals v5.97.0 — Directory Quality, Trust & Hybrid Workspace

## Product direction

v5.97.0 adopts the **hybrid model**:
- WhatsApp bot remains a portfolio directory and direct-contact channel only.
- Website retains an optional private project workspace for client-designer collaboration.
- No PIR payment, checkout, commission, escrow, transaction mediation, or payment ledger is introduced.

## Implemented

### Directory quality
- Added 24-item pagination with previous/next and page links.
- Directory counts now report the number of results matching the active filters.
- Added query relevance ranking for exact name, name text, specialties, bio, and location.
- Added newest-first sorting and additive MongoDB indexes for newest/price sorting.
- Replaced the previous price-minimum-only comparison with range-overlap logic. Legacy profiles with missing or zero `priceMax` are treated as a single-price point.
- Invalid inverted budget ranges now return no results with a clear validation message.
- Pagination preserves active filters and search parameters.

### Trust transparency
- Replaced the ambiguous public “Verified” wording with “Profil ditinjau PIR”.
- Clarified that the profile badge represents manual profile review, not legal identity or transaction verification.
- Public testimonial copy now says the reviewer's email is verified and clearly states that PIR does not verify client relationship, project, or transaction.
- Added a written moderation standard for the profile badge and testimonials.

### Optional public availability
- Added `availabilityPublic`, default false.
- Designers may opt in from Designer Studio.
- Public pages show only date and status; internal calendar notes remain private.
- Visitors are told to confirm the schedule directly with the designer.

### Hybrid project workspace clarity
- Kept the optional website brief/project-room workflow.
- Added an explicit optional-workspace CTA to public profiles when the designer accepts inquiries.
- Kept direct WhatsApp contact as the primary contact route.
- Added clear non-transaction disclosures to the intake page and both client/designer workspace views.
- Bot behavior remains directory/direct-contact only.

### Engineering
- Added `directory-utils.js` with unit-tested filter parsing, price overlap, relevance pipeline, pagination, and page URL helpers.
- Added v5.97 regression tests and `npm run db:ensure-directory-indexes` for safe index creation.
- Bumped bot package to 5.97.0 and website package to 3.44.0.

## Compatibility and data safety

- Existing `isVerified` values are retained; only public wording changes.
- Existing profile documents default to private calendar display because `availabilityPublic` is false when absent.
- Existing lead and project-room records are preserved.
- No destructive migration is required.
- No bot command or schema for payment/checkout is added.

## Validation status

See `QA_REPORT_v5_97_0.md`. Unit and source-level regression tests are run in the development environment. Live MongoDB, browser E2E, real WhatsApp, SMTP invitation, and backup/restore acceptance must still be completed on the user's local setup before Stable Release.
