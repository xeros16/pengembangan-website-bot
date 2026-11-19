# PIR Visuals v5.56.0 — Editorial Portfolio & Creative Index

## What changed

### Category discovery
- Rebuilt `/categories` as a visual creative index with ten category identities, distinct color systems, editorial typography and responsive layouts.
- Category counters are calculated from public designer profiles and approved portfolio records.
- Added a recent-work strip, with project links limited to works whose creators have public profiles.

### Designer profiles
- Added a personal profile masthead and a clearer portrait treatment.
- Made specialty chips link directly to the matching discovery filter.
- Highlighted featured projects and refined the portfolio masonry rhythm.
- Improved profile facts, service cards and contact CTA styling across desktop and mobile.

### Project case studies
- Reworked `/work/:itemId` into an editorial case-study layout with category, project type, publish date and project ID metadata.
- Added creator attribution, a project narrative layout, visual gallery heading and related-work section.
- Related projects are restricted to approved works by public creators.
- Fixed the public route allowlist so `/work/:itemId` reaches the case-study handler instead of falling through to the designer directory.
- Removed nested links in related-project cards for valid, accessible markup.

## Compatibility and safety
- No database schema changes or migrations.
- No changes to authentication, owner controls, payments, WhatsApp Baileys, bot commands, or media storage.
- Existing designer and portfolio URLs are retained.
- Counts use existing `category`, `specialties`, and `styles` fields.

## Validation
- Website syntax check passed.
- Website tests: 122/122 passed.
- Bot JavaScript syntax check passed: 173 files.
