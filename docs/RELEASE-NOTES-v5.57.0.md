# PIR Visuals v5.57.0 — Visual Site Studio

## Major update

### Visual homepage builder
- Added an Owner-only Visual Site Studio inside the existing authenticated dashboard.
- Added homepage section visibility and ordering controls for banner carousel, categories, featured designers, selected work, manifesto, creator CTA, and FAQ.
- The main hero remains fixed at the top to preserve the primary conversion path.
- Added a website preview iframe with a no-store preview route so saved changes can be reviewed without waiting for the public homepage cache.

### Content management
- Added editable copy for homepage category, talent, work, manifesto, creator CTA, and FAQ sections.
- Added three editable FAQ question-and-answer pairs.
- Added category visibility and description controls for all ten creative disciplines.
- Kept category names and directory filtering stable so CMS edits do not break existing search terms.
- Retained existing three-slide banner editor and expanded its validation.

### SEO and sharing
- Added editable homepage SEO title and description.
- Added Open Graph social preview image with HTTPS-only validation.
- Preserved HTML escaping for all Owner-entered text.

### Reliability and security
- CMS updates remain protected by existing HTTP Basic Authentication, same-origin validation, and Owner CSRF token verification.
- Preserved unknown existing homepage CMS fields when saving, avoiding accidental loss of future or legacy content.
- Sanitized multiline content while removing unsafe control characters.
- Banner and social image URLs are restricted to HTTPS or approved internal paths as appropriate.
- Added tests for section ordering, visibility, CMS persistence, category settings, SEO metadata, and preview cache behavior.

## Compatibility
- No database schema changes or migrations.
- Uses the existing `PortfolioSiteContent` collection and `homepage` record.
- Existing designer, portfolio, review, support, and marketplace data are unchanged.
- No changes to bot commands, WhatsApp Baileys, authentication, payment, or transaction workflows.

## Validation
- Root JavaScript syntax check: 173 files passed.
- Website syntax check: passed.
- Website automated tests: 127/127 passed.
