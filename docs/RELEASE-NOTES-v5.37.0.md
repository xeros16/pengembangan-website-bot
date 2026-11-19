# PIR Visuals v5.37.0 — Corporate Website Experience

## Brand and information architecture
- Introduced a distinct corporate-style homepage at `/`.
- Moved the full searchable directory to `/discover`.
- Added consistent corporate navigation and footer across public pages.
- Added skip-to-content accessibility link, social metadata, responsive footer and mobile layouts.
- Added company overview, how-it-works, contact guidance, privacy summary and terms draft pages.

## Homepage
- Dynamic platform metrics from public designer profiles.
- Featured designer section.
- Latest approved portfolio showcase.
- Clear value proposition, trust/process strip, product feature blocks, FAQ and calls to action for clients and designers.

## Search and portfolio continuity
- Existing directory search, filters, sorting, favorite behavior and profile routes remain intact.
- Designer login and password reset remain under `/studio`.
- Sitemap now includes public static information pages and designer portfolio URLs without duplicate homepage entries.

## Operational boundaries
- PIR Visuals remains a discovery and portfolio platform; no client checkout, payment processing or intermediary order workflow was added.
- WhatsApp transport remains Baileys; website remains a separate process; Game Center remains separate.

## Validation
- Server syntax, website unit tests, root syntax and selected regression tests are run in the build environment.
- Live database content, Cloudflare tunnel, browser rendering and real-device responsive checks must be verified on the Windows deployment.
- Privacy and terms pages are product drafts and must be reviewed against the operator's actual data practices and applicable law before production launch.
