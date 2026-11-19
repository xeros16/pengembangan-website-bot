# PIR Visuals v5.49.0 — Client Shortlist & Designer Comparison

## Client shortlist
- Added a dedicated `/shortlist` workspace.
- Added compare controls to public designer cards.
- Visitors can select up to four designers, remove individual selections, or clear the shortlist.
- Added comparison matrix for location, starting price, specialties, verification, featured status and availability.
- Added shareable shortlist URL; public designer IDs are validated and limited to four.
- Shortlist is stored locally on the visitor's device. No client account is required.

## API
- Extended the existing public designer API response with structured comparison fields.
- Existing card HTML response remains available for the favorites page.
- Public profile visibility is enforced by the existing API query.

## Compatibility
- No database schema migration or new collections.
- No changes to Baileys, game modules, designer accounts, CMS or payment flow.
- Existing favorites and moodboards remain separate and unchanged.

## Validation
- Website syntax check passed.
- Website automated tests: 99/99 passed.
- Bot syntax check passed (173 JavaScript files).
- ZIP integrity validated.
