# PIR Visuals Bot v6.5.1 — Learning Lifecycle, Privacy & Visual System Refinement

**Release type:** Development Candidate / patch release  
**Bot package:** 6.5.1  
**Website package:** 3.48.1

## 1. Learning Cohort lifecycle correction

- Cohort registration may remain open without consuming the planned 1–12 week learning period.
- `.cohort mulai KODE` starts the clock, sets `startsAt`/`startedAt`, calculates `endsAt`, and schedules every milestone from its stored `dueDay`.
- Milestones added before start display a relative day target; after start they display the actual WIB date.
- Legacy open cohorts created in v6.5.0 preserve their previous day offsets by reconstructing the offset from the previous `dueAt` and `startsAt` fields when `dueDay` is missing.
- Cohort creation limits count open registrations and unexpired active programs separately. Only started programs auto-complete at their end date.

## 2. Participant privacy and data deletion

- Former participants who leave a cohort can still view their own retained progress.
- `.cohort hapusdata KODE konfirmasi` works for a current participant or a former participant with retained check-ins. Former-member records are excluded from active review queues and active-member aggregate counts.
- Deletion remains scoped to the current group, cohort code, and requesting member; other participants' records are not touched.
- Facilitator assignments cannot be changed after a cohort is closed.

## 3. Downloader URL validation hardening

- Rejects additional non-public IPv4 ranges: unspecified, carrier-grade NAT, benchmarking, documentation, multicast, reserved, and other special-use ranges.
- Rejects IPv6 loopback, unique-local, link-local, multicast, documentation, IPv4-mapped, and additional special-use ranges.
- Rejects common private/reserved host suffixes (`.internal`, `.lan`, `.home.arpa`, `.test`, `.example`, `.invalid`) and single-label hostnames.
- These checks reduce obvious local-network targets. They do not replace outbound firewall/egress restrictions for DNS rebinding, DNS answers that change, or provider redirects.

## 4. Website visual system refinement

- Added same-origin `portfolio-website/visual-system.css`, loaded after the existing style stack and served with a CSS content type under the existing same-origin CSP.
- Consolidated the final semantic Light/Dark color tokens for page surfaces, text, muted copy, borders, accents, and focus outlines.
- Background now uses one sparse diagonal motif and one asymmetrical organic outline; dense grids and concentric ring stacks are removed from the final layer.
- Navigation action controls have deliberate spacing on desktop and a two-column layout on mobile, including a full-width designer CTA.
- Shared surfaces use consistent tokens across public pages, Designer Studio, Shortlist, and support views. Key text and action token pairs are tested against a 4.5:1 WCAG AA contrast target.

## 5. Command Explorer usability

- Search now filters both command cards and guided workflow cards.
- Result status reports command and workflow matches separately.
- A combined no-results message appears when neither result set matches.
- Copy buttons restore the correct label after clipboard success or manual-copy fallback.

## Compatibility and migration

- No new npm runtime dependency, collection, or database index is introduced.
- `LearningCohort.startsAt` and `endsAt` are now nullable while a cohort is awaiting start. Existing documents remain readable; existing open cohorts receive a fresh schedule when started.
- Downgrade to v6.5.0 requires restoring the pre-v6.5.1 database backup if new v6.5.1 open cohorts exist; the older lifecycle handler cannot start records with null start/end dates.
- Existing `LearningCohort` and `LearningCohortCheckin` indexes remain unchanged and additive.
- Preserve `.env`, Baileys sessions, runtime settings, `content/texts.json`, database records, and uploaded media.

## Verification boundary

Source tests cover lifecycle scheduling, legacy schedule preservation, former-member privacy, IP/host validation, website stylesheet routing, navigation spacing tokens, and workflow search hooks. Live WhatsApp, MongoDB, DNS/redirect egress behavior, yt-dlp providers, and actual desktop/mobile browser rendering still require staging. This release remains Development Candidate until those checks pass.
