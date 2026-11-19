## PIR Visuals Website v3.63.0 — PIR Brand Harmony

- Hero desktop, live Creative Index, section hierarchy, and natural color-block rhythm are refined around PIR's forest / sage / cream identity.
- User pathways now appear directly after the hero, followed by the community showcase and curated content.
- Homepage showcase, categories, talent cards, selected work, manifesto, CTA, FAQ, and testimonials receive a more editorial, image-led treatment.
- Desktop `/discover` receives a collection-style sticky filter column and scannable designer grid; tablet and mobile retain the compact filter disclosure.
- Existing copy, routes, data, media handling, profile interactions, and portfolio functionality remain intact.
- See `RELEASE-NOTES-v3.63.0.md` and `INSTALL_UPDATE_v3_63_0.md` for the latest brand-harmony update. The previous BETTR × Rewilding reference blend remains documented in `RELEASE-NOTES-v3.62.0.md`.

---

## v3.53.0 — Upload Preview & Workspace Navigation Fix

- Profile images are cropped and previewed in the browser before upload; server-side avatar validation no longer depends on Sharp.
- SVG preview uses original-first fallback; if client rasterization fails, original SVG still reaches server processing.
- Workspace navigation now scrolls explicitly to the chosen section, with fresh cache keys and clearer icon spacing.

## v3.52.0 — SVG Preview & Designer Studio

- SVG preview forces the correct MIME type and sanitizes local preview markup.
- Website converts SVG to WebP in the browser before upload; server fallback rasterizes at 72 DPI for Figma-sized exports.
- Profile photo can be uploaded directly (JPG/PNG/WebP, max 5 MB); no URL required.
- Workspace navigation has semantic icons and explicit click-to-section behavior.
- All common profile and portfolio form fields include examples.

## v3.51.0 — SVG Portfolio Upload

- Designer Studio accepts JPEG, PNG, WebP, and SVG up to 15 MB per file.
- Up to five files per portfolio work; website multipart requests are capped at 80 MB.
- SVG is validated and rasterized to WebP before public storage.
- WhatsApp `.portfolio add` now uploads one work directly in private chat using the same media pipeline and shared storage.
- New works still require Owner moderation.


## v3.50.0 — Feature Discovery Navigation\n\n- Promoted `/commands` to the primary navigation as **Semua Fitur Bot**.\n- Updated Creative Studio help for Apple public previews and Anime provider fallback.\n- Platform version: v6.7.1.\n\n## v3.49.0 — Creative Studio Guide & Command Discovery

- Added public `/creative-studio` feature guide for Creative Asset Studio, Sticker Studio, Design Seasons, and multifunction media discovery.
- Added the route to the main navigation, quick navigation, footer, and sitemap.
- The page uses the existing semantic Light/Dark visual tokens and does not connect to WhatsApp chats or private asset records.

# PIR Visuals Website v3.50.0 / Platform v6.7.1

This website is part of the PIR Visuals project and shares the root project's `.env`, MongoDB database, designer profiles, portfolio records, and upload storage with the WhatsApp bot.

Run from the project root:
- `npm run website:install` once
- `npm run website`

The website uses `MONGO_URI` from the root `.env`. Keep the bot and website pointed at the same MongoDB database. The default upload root is the project root plus `PORTFOLIO_UPLOAD_DIR`.

Designer signup is available at `/studio/register`. It is linked to WhatsApp by sending `.portfolio link KODE` in a private chat from the same phone number. After email verification, request OTP using `.portfolio dashboard otp`.

Portfolio artwork can be uploaded through Designer Studio or directly in a private WhatsApp chat using `.portfolio add`. JPEG, PNG, WebP, and SVG are supported up to 15 MB per file. SVG files are validated and converted to safe WebP previews; every new work remains pending until Owner moderation.

See `../docs/WEBSITE-WHATSAPP-SHARED-ACCOUNT-v5.39.0.md`.


## v3.48.0 — Guided Command Workflows

The public `/commands` Command Explorer now includes four curated, copyable guided workflows for Learning Cohort participants, facilitators, media preflight, and Designer Growth. Workflow data is generated from the root bot command catalog. The website only displays/copies command text; it does not execute WhatsApp commands or access chat content. The route remains protected by the existing same-origin CSP and uses the external `command-explorer.js` asset.

## Visual Site Studio — Platform v5.57.0
Owner can manage homepage section visibility and order, section copy, banners, FAQ entries, creative category visibility and descriptions, plus homepage SEO metadata from the authenticated `/dashboard` area. The live preview uses `/?preview=1` with no-store caching so saved changes can be reviewed immediately.

## Marketplace Intelligence & Visual Refresh — Platform v5.58.0
The authenticated Owner dashboard now includes 30-day growth intelligence: public page views, profile-to-contact funnel, incoming briefs, lead statuses, campaign CTA clicks, category discovery and a designer activity ranking. Public event tracking is same-origin and avoids storing visitor IP addresses, personal contact details or free-text search terms.

Current public site: one permanent PIR Visuals editorial appearance (forest-green hero and navbar, cream/sage sections, dark-green footer). The Light/Dark toggle was removed in the 2026-11-14g revision. Historical release notes below describe earlier designs; see `../PANDUAN-TEMA-TETAP-PIR-VISUALS.md` for the current installation steps.

## Experience 2.0 — Platform v5.59.0
Designer Studio now supports a personal-brand story, three safe profile layout presets, and profile SEO/social preview metadata. Public designer pages can display a tagline, creative point of view, working approach and ideal project fit. Case-study uploads and edits support optional client/brand, industry, year, scope, outcome highlight and page SEO fields. Case-study galleries use the accessible same-origin lightbox. The Designer Studio performance area reports 30-day totals and contact rate, a 14-day profile-traffic trend, and the most-viewed case studies based on page-open events.

Project-view analytics use a same-origin collector with validated designer/item IDs and the existing privacy-conscious event collection. Existing project records remain compatible; all new fields are optional.

## Client Workspace & Motion Experience — Platform v5.60.0
New designer briefs now create a private Client Project Room alongside the existing lead record. Clients receive a single-use, 30-minute magic link by email; after activation, an HttpOnly/SameSite session is scoped to that one project for 30 days. Clients can read the original brief, follow the project stage, see designer updates, and send feedback. Designers can manage project status, publish updates, and resend invitations from their authenticated Designer Studio. SMTP must be configured and `PORTFOLIO_PUBLIC_BASE_URL` must point to the public HTTPS website in production.

The public site adds reduced-motion-aware scroll reveals, a scroll progress indicator, live toast feedback for favorites/shortlists, interactive pointer lighting, swipe and keyboard carousel controls, and responsive client/designer project room layouts. Existing Baileys bot, direct designer-to-client contact, lead pipeline, moderation and MongoDB collections are retained.


## Editorial Motion v5.61.0
The homepage motion system is inspired by Bettr Academy's public editorial page structure (large hero, featured content, statistics, image-led stories and impact sections), reinterpreted in PIR Visuals' visual identity. It includes kinetic hero words, IntersectionObserver-based section storytelling, staggered category/talent/portfolio reveals, number count-up, an infinite motion ribbon, subtle hero parallax/pointer lighting, cinematic carousel image drift and staged carousel copy. Motion is progressive-enhancement only and fully disables nonessential movement under `prefers-reduced-motion`. No third-party animation runtime is required.


## PIR Visuals v5.62.0 — Full Platform & Experience Overhaul
The shared public shell now includes a keyboard-accessible quick command palette (`Ctrl/Cmd + K` or `/`), active navigation state, persistent motion preference control, a back-to-top control, native cross-document View Transitions where supported, and responsive spotlight feedback for cards. The website adds a refined common surface system, subtle grid/orbit background texture in both themes, improved focus states and a progressive reveal for lazy-loaded images. The command palette can search designers by submitting to `/discover` and navigate directly to public pages, favorites, shortlist, collections, Designer Studio, Client Workspace, and support.

The motion control is stored in localStorage and respects the operating system's `prefers-reduced-motion` setting. When motion is disabled, scroll reveals are made visible and the homepage carousel stops auto-advancing. The service worker cache is `pir-visuals-public-v8` and explicitly excludes `/client` alongside other private routes. No external animation framework or runtime dependency was added. See `../RELEASE-NOTES-v5.62.0.md`.


## v5.63.0 Responsive Editorial Refinement
Adaptive navigation groups primary routes, secondary routes, and utility actions. Tablet/laptop widths use an accessible compact menu that closes on route selection, outside click, and Escape. The homepage hero switches to a single-column layout below 1180px, with balanced fluid type and visible overflow for animated words. Dark/light theme contrast and reduced-motion behavior are retained.


## v5.64.0 Contrast, Navigation & Motion Refinement
Light/Dark theme tokens now drive a consistent contrast hierarchy for headings, supporting copy, forms, tables, cards, tags, and controls. The compact menu has clearer grouping and spacing; theme/motion buttons keep stable child markup and compact state labels. The decorative canvas uses sparse diagonal linework and an asymmetric organic outline. The release preserves existing routes and reduced-motion behavior. See `../RELEASE-NOTES-v5.64.0.md`.


## v5.65.0 Theme Contrast Repair
Category-card foreground colors and primary navigation/hero CTA pairs were made theme-aware. The ten category palettes were checked for WCAG AA text contrast, and light/dark surfaces were normalized for the public navigation.

## v5.66.0 Mobile Navigation Refinement
The compact mobile menu was aligned to the header width, given scrollable behavior on short screens, and reorganized into separate Portal desainer, Cari, and two-column Motion/Tema groups.

## v5.67.0 Mobile Button Alignment Refinement
Menu/Tutup now uses a fixed icon slot and deliberate label spacing. Mobile utility buttons use centered icon-label alignment and consistent touch height; Cari and Portal desainer occupy explicit full-width rows while Motion and Tema sit in equal columns. The mobile layout is isolated from desktop navigation. See `RELEASE-NOTES-v5.67.0.md`.


## v5.68.1 — Motion Refinement & Design Polish

- Smooths scroll-linked UI through a single animation-frame scheduler for the progress indicator, sticky navigation state, back-to-top visibility, and hero parallax.
- Keeps the sticky navigation stable across same-origin View Transitions to avoid a second entrance animation or a duplicated-looking header.
- Removes blur and layout-changing padding from motion paths; scroll progress now uses `transform: scaleX()`.
- Prevents nested reveal observers from animating a parent and its child card at the same time.
- Fixes hidden homepage headline words and clipped portfolio images when the visitor switches Motion Off.
- Adds category artwork movement, image-led portfolio reveal, nav underline and chevron motion, CTA arrow feedback, and restrained magnetic CTA response on precise-pointer devices.
- Keeps the existing forest-green / sage / warm-ivory identity and existing mobile navigation layout.
- Honors `prefers-reduced-motion` and the visitor's Motion Off setting.


### v5.68.1 validation

- Website regression: 196/196 passed.
- JavaScript syntax scan: 173 files passed.
- CSS parser and extracted public UI script: passed.
- Chromium/Playwright shared-motion smoke: one header, no horizontal overflow at 320–1440px, menu open/close, Motion Off, reduced-motion and reveal checks passed.
- See the root `TEST-REPORT-v5.68.1.md` for exact scope and environment limitations.


## v5.69.0 — Immersive Motion & UI/UX Evolution

The existing editorial motion language is extended across category pages, designer showcases, portfolio case studies, selected studio surfaces, FAQ, and support states. Precise-pointer devices receive bounded media-frame tilt; touch devices do not. Discover filters use a compact mobile disclosure with an active-filter count, while the no-JavaScript fallback keeps all filter fields visible. Focus, form, dialog, FAQ, and toast feedback are refined. Motion Off and `prefers-reduced-motion` keep content visible and disable non-essential effects.

Validation: website regression 205/205; root syntax scan 173 files; website syntax passed; extracted UI script syntax passed; CSS parser 0 errors; representative Chromium QA 0 console/page errors and no horizontal overflow from 320px to 1440px. See `../RELEASE-NOTES-v5.69.0.md`, `../TEST-REPORT-v5.69.0.md`, and `../docs/MOTION-DESIGN-REFERENCES-v5.69.0.md` for details, references, and limitations.


## Portfolio Storytelling & Workspace Experience — Platform v5.70.0
Collection boards now have an editorial cover, ordered work grid, live builder preview, and accessible sorting controls. Long case studies gain a contextual chapter rail when enough sections exist, and Designer Studio shows a setup checklist derived from existing profile/work/service/availability data. The public share action uses the canonical collection path and does not copy private edit tokens. See `../RELEASE-NOTES-v5.70.0.md` and `../TEST-REPORT-v5.70.0.md`.


## PIR Visuals v5.72.0 — Navigation Restoration

The compact navigation no longer renders the `Lainnya` submenu while its native `<details>` element is closed. This prevents the hidden submenu from overlapping Portal desainer, Cari, Motion, and Tema. The menu controller now has one state path, updates `aria-expanded`, closes on route selection/outside click/Escape, and restores keyboard focus. Client Workspace and Contact & Support are available directly in the secondary navigation. See `../RELEASE-NOTES-v5.72.0.md` and `../TEST-REPORT-v5.72.0.md`.


## v5.73.0 — Public UI Runtime & Navigation Repair

The public `public-ui.js` route now preserves regex escapes while interpolating its server-side template. A parse error in that emitted asset previously prevented the browser from executing the entire controller, including navbar, theme, favorite, and other public interactions. The `Lainnya` disclosure now toggles its native details state and `aria-expanded` synchronously. The selected-work filter also initializes reduced-motion state before use and supplies a stable card index for re-entry motion.

The public service-worker cache is `pir-visuals-public-v19`; public asset URLs use `v=5730`. Website regression is 242/242, with Chromium navigation checks across 10 viewport widths. See `../RELEASE-NOTES-v5.73.0.md` and `../TEST-REPORT-v5.73.0.md`.


## v5.74.0 — Unified Premium Website System

- Establishes a single semantic color layer for light and dark themes, with warm ivory surfaces, forest-green accents, and accessible supporting text.
- Adds restrained architectural linework and one asymmetric contour to the page canvas; removes the dense decorative pattern from the selected-work panel.
- Refines the desktop and compact navigation utility spacing while preserving the v5.73.0 navigation controller.
- Harmonizes cards, forms, buttons, section spacing, and the editorial home-page composition.
- Elevates Contact & Customer Support with a clear support overview, quick links, an always-available ticket channel, and a ticket-copy action after submission. Configured email and WhatsApp links continue to appear only when their environment values exist.
- Advances the public cache to `pir-visuals-public-v20` and public asset cache-busting to `v=5740`.

### Customer Support configuration

The `/contact` page always provides the support-ticket form. To show direct contact cards, configure `SUPPORT_EMAIL` and/or `SUPPORT_WHATSAPP` in the **root project `.env`**. `SUPPORT_HOURS` controls the displayed service-hours label. Ticket submissions are stored in MongoDB; email notifications are attempted only when the support email and SMTP settings are configured. Do not put example contact values into production.


## PIR Visuals v5.76.0 — Discovery & Navigation Refinement

The shared navigation now identifies the active destination using `aria-current="page"`, including nested designer, case-study, Studio, Client Workspace, and collection routes. Discovery designer cards use an image-led identity header, clear availability state, concise skills, visible starting price, and a more consistent action hierarchy. Shared discovery page headings, statistics, filters, and feature surfaces now follow the v5.74 semantic theme tokens. Existing favorites, shortlist, quick-view, and profile destinations remain wired to their existing handlers.

The server module now starts its MongoDB-backed entrypoint only when executed directly, so importing the exported server for isolated QA does not attempt a database connection. Production startup through `node server.js` remains unchanged. Public cache and asset tokens are advanced to v22 / v=5760.



## Designer Intelligence & Platform Growth — Platform v5.99.0
The public `/discover` directory includes a guided designer finder with transparent fit signals for category, specialty, location, public budget range, and keyword. Designer Studio includes a private Portfolio Readiness checklist based on profile/portfolio completeness. The fit score is not a quality rating; readiness is private and not shown on public profiles. No database migration or new runtime dependency is required.

## v3.47.0 — Command Explorer

- Public `/commands` route generated from the bot's `docs/commands.json` registry.
- Search, category filter, copy-example buttons, and access labels.
- Same-origin `command-explorer.js` asset remains compatible with strict `script-src 'self'` CSP.

## v3.48.1 — Unified Visual System & Workflow Search

- Added same-origin `visual-system.css` for semantic light/dark tokens, restrained background motifs, and consistent responsive navigation spacing.
- Command Explorer search now includes guided workflows and provides a combined no-results state.
- Added regression coverage for stylesheet routing and workflow filtering.
