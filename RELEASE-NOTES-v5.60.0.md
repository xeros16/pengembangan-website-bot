# PIR Visuals v5.60.0 — Client Workspace & Motion Experience

## Major update

### Client Workspace
- Every new public designer brief now creates a private `ClientProject` alongside the existing `DesignerLead`.
- Client email is required for secure workspace access; it is not exposed on the public designer portfolio.
- A one-time 256-bit random magic-link token is generated, stored only as a SHA-256 hash, and expires after 30 minutes.
- Access activation atomically consumes the token and issues a project-scoped, HttpOnly, SameSite=Strict session cookie.
- Client sessions expire after 30 days and are stored as hashes with MongoDB TTL cleanup.
- Clients can view the initial brief, designer identity, project stage, shared activity timeline and direct designer WhatsApp contact when provided.
- Clients can send feedback/messages from the private workspace; closed or completed projects reject new messages.
- The `/client` landing page explains invitation-based access.
- Client logout revokes the current session.
- Client and designer private project pages carry `noindex`; `/client` routes are also excluded from crawler discovery.
- Production invitation/update emails refuse non-HTTPS public base URLs.

### Designer Project Room
- Designer Studio now lists private project rooms next to the lead pipeline.
- Existing/legacy leads can be converted into project rooms without changing or deleting the original lead records.
- Designers can open a project room, update its stage, publish a client-visible activity update, and resend a one-time invitation.
- Project access is scoped to the authenticated designer ID on every route.
- All designer/client mutations require CSRF validation and same-origin checks.
- Designer notifications are created for new client messages and project updates.
- Optional SMTP email notifications are sent to clients when a designer publishes an update.
- The existing direct client-to-designer relationship remains intact. PIR Visuals does not process payments, hold funds, or act as an order intermediary.

### Motion & interaction system
- Added a restrained scroll-reveal system with staggered entrances for hero sections, cards, portfolio items, studio panels and project workspace components.
- Added a top-of-page scroll progress indicator.
- Added accessible live toast feedback for favorite and shortlist actions.
- Added pointer-responsive ambient lighting on selected hero surfaces.
- Added swipe gestures and keyboard arrow controls to the homepage carousel.
- Improved mobile navigation dismissal and retained focus/keyboard behavior.
- Added responsive client and designer project-room layouts with status indicators, progress stages, activity timeline and feedback forms.
- All motion respects `prefers-reduced-motion`; essential content remains visible if IntersectionObserver is unavailable.

## Security and data compatibility
- New MongoDB collections: `clientprojects`, `clientprojectsessions`, and `clientprojectupdates`.
- Existing `designerleads`, designer profiles, Designer Studio authentication, analytics, moderation and portfolio collections are reused.
- No destructive migration is required; historical lead records remain unchanged and are not automatically converted to client project rooms.
- Client email is private; public portfolio pages do not display it.
- Magic links are single-use, time-limited, hashed at rest, and never rendered back into HTML.
- Project sessions are restricted to one project ID; client and designer write routes validate CSRF and ownership.
- Production deployment requires SMTP configuration and a real HTTPS `PORTFOLIO_PUBLIC_BASE_URL`. Without SMTP, new projects are still created, but the designer must configure SMTP and resend the invitation.

## Compatibility
- WhatsApp Baileys bot, games, website separation, designer account system, Owner dashboard, direct contact, portfolio upload and lead pipeline are retained.
- New model fields and collections are additive.

## Validation
- Root JavaScript syntax check: 173 files passed.
- Website server/model syntax check: passed.
- Website automated tests: 153/153 passed.
- Public UI generated JavaScript parse: passed.
- Inline CSS parse: passed with zero top-level parser errors.
- Live MongoDB, SMTP delivery and browser end-to-end checks require the deployment environment and were not run in this build environment.
- Root automated tests: 350/356 passed; six test files/cases are blocked in this build environment by missing `node-fetch` and `mongoose` packages.
