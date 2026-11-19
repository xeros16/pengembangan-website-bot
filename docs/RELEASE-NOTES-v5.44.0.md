# PIR Visuals v5.44.0 — Designer Showcase & Portfolio Case Studies

## Designer showcase
- Rebuilt public designer profiles as editorial portfolio landing pages.
- Clear hero, availability, verified/featured/reputation badges, designer location and experience.
- Added external social/profile links when supplied by the designer.
- Structured capabilities, software skills, selected works, services/pricing, collections, reputation/reviews and direct-contact CTA.
- Retained favorite action and language switch.
- Designer analytics continue to be recorded internally but private engagement counters are no longer exposed on public profile pages.

## Portfolio case studies
- Added `/work/:itemId` pages for standalone portfolio detail.
- Only Owner-approved portfolio items belonging to public designers are visible.
- Case study includes cover, title, category/styles, description, creator attribution, gallery previews and link to designer profile.
- Portfolio preview engagement is recorded in existing analytics.

## SEO and accessibility
- Profile page title and description are contextual.
- Added Open Graph description and profile image metadata when a valid HTTPS avatar exists.
- Responsive layouts for mobile and desktop.
- Reduced-motion preference is respected for hover animation.
- Images use lazy/eager loading and decoding hints.

## Compatibility
- No database schema migration.
- Existing MongoDB collections and portfolio item IDs are reused.
- WhatsApp Baileys and standalone game modules are not changed.
- Existing contact, favorite, reviews, services, collections and public portfolio routes remain in place.

## Validation
- Website syntax check passed.
- Website tests: 78/78 passed.
- Bot syntax check passed.
- ZIP integrity verified.
