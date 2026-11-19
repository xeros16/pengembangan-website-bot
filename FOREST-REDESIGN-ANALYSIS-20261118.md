# PIR Visuals — Forest Editorial Redesign Analysis
Date: 2026-11-18

## Basis of review
The review used the supplied screenshots of the current local site and the existing PIR Visuals source package. The external visual reference was Bettr Academy, used for design principles rather than copied assets/layout.

Bettr Academy's current homepage is structured around a clear first impression, a "Where Does Your Bettr Journey Begin?" path selector, curated product/course cards, reasons to choose the service, community reviews, stories, and a final subscription/footer area. This informed the information-architecture check, while PIR Visuals keeps its own content and brand.

## Issues found in the supplied screenshots

1. **The showcase artwork container was too generic.**
   A fixed 16:10 gallery frame made portrait artwork sit inside excessive empty space, while landscape artwork used the same frame. This weakened the portfolio-first presentation.

2. **The visual identity was not distinctive enough.**
   The existing sage/forest palette was coherent, but the page still read as a conventional card-based editorial layout. There was no strong botanical/forest signature connecting the sections.

3. **The journey cards looked clean but somewhat static.**
   The three paths were clear, but the decoration relied mainly on circular rings. The section needed a stronger organic motif and a more tactile hover response.

4. **The page lacked a persistent decorative system.**
   The screenshots showed no consistent root/branch/leaf framing around the experience. A restrained fixed frame was added so it can become a recognizable PIR Visuals visual device without changing document flow.

5. **Hover interaction was mostly conventional.**
   Cards moved or changed shadows, but there was no brand-specific micro-interaction. A small leaf scatter effect was added to selected interactive surfaces.

6. **Sticky navigation can hide anchored content.**
   The sticky masthead is useful, but anchor targets can land underneath it. Scroll margins were added to major sections and anchors.

7. **Section transitions were too box-to-box.**
   The redesign now uses warm paper, moss/sage surfaces, deep forest chapters, and subtle organic gradients so the page reads as one continuous environment.

## Changes implemented

- Added a global **Forest Edition** visual layer to the complete site shell.
- Added an inline botanical frame made from branches, roots, twigs, leaves, and seed dots.
- Added a progressive leaf-burst hover interaction for journey cards, category cards, portfolio cards, showcase artwork, buttons, and selected editorial cards.
- Respects `prefers-reduced-motion` and the site's existing Motion Off control.
- Kept all decorative layers `pointer-events:none` so they cannot block controls.
- Reworked homepage colors toward deep forest, moss, leaf, bark, and warm ivory.
- Strengthened hero contrast and CTA hierarchy.
- Reworked the showcase container to use a taller gallery treatment so portrait artwork has less wasted space while preserving `object-fit: contain`.
- Increased showcase radius, border quality, depth, and control consistency.
- Reworked the "Pilih jalur" cards into a forest-path treatment with organic corner decoration.
- Reworked manifesto/Why PIR into a dark forest editorial chapter.
- Reworked creator CTA and footer to finish the experience as a conversion-oriented forest chapter.
- Applied the forest system to interior/public pages without forcing public decorative treatment onto functional dashboard information density.
- Added sticky-header-safe scroll margins.
- Updated the offline preview to show the same forest frame and hover treatment.

## UX / website-principle check

### Visual hierarchy
Hero → primary CTA → community showcase → user path → discovery categories → talent/work → value/why → creator CTA → social proof/FAQ → footer.

### Interaction
- Hover is additive, not required for functionality.
- Keyboard focus remains independent from the animation.
- Reduced-motion users do not receive the leaf animation.
- Motion Off removes active leaf particles.
- Decorative elements never capture pointer input.

### Responsive
The forest frame is progressively reduced at 900px, 600px, and 390px so it does not compete with content on small screens. Showcase artwork height and card sizing also step down for mobile.

### Accessibility
- Decorative SVG is `aria-hidden`.
- Leaf particles are decorative and not focusable.
- Existing semantic headings, links, buttons, labels, and focus styles are preserved.
- Anchor scroll margin prevents sticky navigation from covering section headings.

### Performance
No new runtime dependency was introduced. The frame is inline SVG and the leaf effect is lightweight DOM animation with a small particle count. Existing portfolio images remain lazy-loaded where appropriate.

## Verification

- `node --check portfolio-website/server.js` — PASS
- `node --check portfolio-website/pir-shared-ornaments.js` — PASS
- `node --check portfolio-website/pir-home-showcase.js` — PASS
- Homepage showcase tests — PASS
- Homepage media/aspect-ratio tests — PASS
- Homepage featured-card test — PASS
- Layout consistency test — PASS
- The full legacy test suite still contains historical release/version assertions that were already out of sync with the package metadata; those are not caused by the forest redesign.

## Design intent

The target is:

**Forest editorial + premium + playful + tactile + conversion-focused**

The forest elements are deliberately secondary to the content. The root/leaf frame should feel like a signature environment, not a decorative border pasted onto every component.
