# PIR Visuals v5.75.0 — Discovery & Navigation Refinement

**Source baseline:** user-supplied PIR Visuals v5.72.0; carries forward the prepared v5.73 navigation repair and v5.74 visual system  
**Website package:** 3.29.0  
**Platform version:** 5.75.0

## What changed

- Restores route-aware active navigation with `aria-current="page"` for primary links, secondary links, nested designer profiles, case studies, Studio, Client Workspace, and collection routes.
- Marks the `Lainnya` disclosure when one of its secondary destinations is active without forcing the disclosure open.
- Redesigns shared designer cards for homepage talent highlights and discovery results: safe HTTPS avatar/initial fallback, featured and verified markers, open-for-work status, concise profile copy, skill chips, starting price, and a clear portfolio action. Existing quick view, favorite, and shortlist hooks are preserved.
- Refines shared discovery page rhythm, search/filter surfaces, statistic tiles, and feature cards using the v5.74 semantic color tokens. Light and Dark themes remain token-driven.
- Makes the server module safe to import for isolated QA; direct execution still starts the same MongoDB-backed server.
- Advances the public service-worker cache to `pir-visuals-public-v21` and asset cache-busting to `v=5750`.

## Compatibility

No database schema, migration, designer account, portfolio record, authentication flow, bot command, WhatsApp session, Client Workspace permission, or contact-ticket contract changed. Existing favorites, shortlist, and quick-view browser storage remain compatible.

## Verification

See `portfolio-website/tests/discovery-navigation-v5.75.test.js`, `portfolio-website/tests/public-ui-runtime-v5.73.test.js`, and the release test report for automated validation.


Automated test details and execution limitations are recorded in `TEST-REPORT-v5.75.0.md`. Installation instructions are in `INSTALL-UPDATE-v5.75.0.md`.
