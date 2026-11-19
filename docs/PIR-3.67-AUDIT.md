# PIR Visuals 3.67 technical audit

The November 19, 2026 delivery is based on `pengembangan-website-bot-github-clean.zip`. The supplied manifests identify bot 6.7.13 and website 3.66.0. The website remains a native Node HTTP application with HTML templates, Mongoose, Sharp, Nodemailer and GSAP. The bot remains on Baileys. Both applications use the same designer and portfolio collections and the configured upload directory.

## Findings and disposition

| Priority | Finding | Disposition |
| --- | --- | --- |
| Critical | Approved portfolio metadata and image delivery did not consistently enforce the author's current public visibility. The directory and sitemap could include work with no public author. | Enforced author visibility at media delivery and before Discover and sitemap selection limits. Public image responses now revalidate visibility, and the new offline cache excludes work, profile, avatar and media routes. Purge derivative CDN copies from earlier releases when deploying. |
| High | An email security scanner could consume a one-time client invite by opening it. GET also signed clients out. | GET displays a confirmation, POST consumes the invitation, and client logout requires POST and the scoped CSRF token. Session creation failure attempts to restore the unused invitation without replacing a newer token. |
| High | The bot lockfile specified an unavailable transitive range and an SSH dependency URL. Dependency audit also flagged the locked Nodemailer and follow-redirects releases. | Restored the registry-declared tr46 range and HTTPS transport at the same libsignal revision. Upgraded follow-redirects and Nodemailer. Added registry-provided integrity for GSAP. |
| High | Large watermark input could fail composition and fall through to an unwatermarked response. | The overlay matches the resized image dimensions. Processing failure returns a temporary error when watermarking is enabled. Existing WebP files bypass redundant conversion where no watermark is required. |
| Medium | The shared style block was retransmitted with every HTML response. The home hero had low-contrast statistics and the search submit was within the collapsible filter panel. | Served the shared styles through an ETag-validated asset. Added responsive editorial media, clearer stats, and a visible search button. Reused the CMS and the existing filter URLs. |
| Medium | Loading a project log always selected its oldest 100 updates. Daily analytics could append duplicate dates under concurrent writes. | Select the most recent 100 project records and display them in chronological order. Use a conditional append for new daily rows and increment the existing row when another request wins. |
| Medium | Duplicate robots and sitemap handlers, relative share images, partial login labels and duplicate main landmarks. | Consolidated crawler handlers, added configured-origin canonical metadata, corrected public share image URLs, added form label associations, and removed nested main landmarks. |
| Medium | Workspace pages used promotional footer calls to action and large decorative banners in task-oriented views. | Applied compact workspace headings, flatter form panels, and a smaller footer. Workspace HTML explicitly sets private cache and crawler rules. |
| Minor | Search, saved lists, profile presentation and layout behavior varied between device sizes. | Applied shared editorial type and focus treatment, tuned directory gutters and card geometry, and checked the supported viewport matrix. |

## Inventory

- **Public HTTP and templates** live in `portfolio-website/server.js`. The home CMS config drives ordered categories, talent, work, manifesto, joining and FAQ content. Discover uses directory and matchmaking query helpers. Profile, case study, favorites, shortlist, moodboard, category, About, For Business, commands and contact retain their routes.
- **Private flows** use Studio password plus OTP, designer sessions, owner Basic authentication plus CSRF, client project invites and scoped client sessions. Forms and uploads use server validation. The existing Sharp pipeline converts SVG inputs before public media delivery.
- **Shared records** live in the Mongoose collections configured by `portfolio-website/models.js` and the bot's `models/` files. Bot registration, verification, OTP, notifications and approval integrations continue to use those records. This release has no schema migration.
- **Static assets and interactions** use the existing asset allowlist, CMS routes, GSAP and native scroll behavior. The new edition assets are first-party and use one-shot viewport entrances, with system reduced-motion and the PIR motion toggle honored.
- **Operations and QA** include the existing CI workflows, deployment Compose and Caddy configuration, syntax and smoke checks, Node suites, and browser tests. Baseline results were measured from the supplied ZIP.

## Open items

- Full production certification depends on an actual TLS reverse proxy, production-equivalent MongoDB, monitored storage and backups, and a staging pass with dedicated WhatsApp and SMTP test accounts.
- The owner dashboard keeps the existing Basic authentication model. Add named staff accounts with auditable per-role permissions before granting broad team access. Rate limits on a single process need a shared edge policy before horizontal scale.
- Legacy styles still contain overlapping selectors. The dark appearance applies to shared surfaces and selected editorial and workspace treatments. Contrast and screenshot coverage should be expanded to every state before claiming full dark-theme or WCAG conformance.
- Production traffic, Core Web Vitals, high-cardinality MongoDB query plans, all CMS permutations, all form failure combinations and all browser engines remain unverified. No formal penetration test was performed.
- The design-reference URLs returned proxy HTTP 403. The implementation uses the brief's editorial and botanical direction and the existing PIR art and identity. The hero photograph is a new generated editorial asset.
- Existing version-specific tests assert mutually incompatible historical source, CSS, cache and layout details. They are intact and their failures are recorded in the QA report.
