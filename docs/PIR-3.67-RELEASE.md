# PIR Visuals website 3.67.0

The supplied website version was 3.66.0. The bot remains at 6.7.13 with a repaired dependency lockfile. The database and upload paths stay compatible with existing records.

- New editorial homepage and Discover layouts, shared Manrope typography, responsive original hero photography, a visible search submit, and compact workspace surfaces. Preserved owner-controlled homepage copy, artwork, categories, events and section order.
- Theme preference, focus styles and reduced-motion support in the shared edition assets. Profile, case study, category, company and support pages share updated typography and panel styling.
- Published works and media now check author visibility. Client invitations require confirmation, private pages opt out of caching and indexing, and project timelines surface recent activity.
- Shared CSS is cacheable, metadata uses the configured site origin, the MongoDB health route performs a live ping, and production startup validates the configured public origin.
- Local and container ignore rules exclude private deployment settings and browser test output.

## Affected files

- `portfolio-website/server.js`, `static-assets.js`, package and lockfile
- `portfolio-website/edition-assets/` stylesheet, interaction script, image variants, font and license
- Root `package-lock.json`, `.gitignore`, `.dockerignore`, and `README.md`
- Playwright configuration, editorial regression tests, and the public contact browser assertion
- Technical audit, QA, deployment and release documentation in `docs/`

Review the QA report and staging requirements before releasing to production.
