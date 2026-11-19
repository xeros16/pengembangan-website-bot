# Website Visual System v6.5.1

## Direction

The website now loads a same-origin `portfolio-website/visual-system.css` layer after the existing legacy style stack. This avoids adding another set of conflicting inline rules and makes the final visual tokens easier to maintain.

## Design rules

- **Light mode:** warm ivory canvas, near-white surfaces, forest-green primary actions, charcoal headings, and muted green-gray body copy.
- **Dark mode:** charcoal/forest surfaces, soft ivory headings, muted sage copy, and restrained sage accents.
- **Background:** one sparse diagonal line motif and one asymmetrical organic outline. No dense grid or stacked concentric rings.
- **Navigation:** action controls are separated from primary links; mobile actions use a two-column grid with consistent spacing.
- **Surfaces:** cards, statistics, studio panels, support cards, and shortlist surfaces share semantic surface/border tokens.
- **Accessibility:** primary/muted/subtle text and button token pairs are statically checked against a 4.5:1 WCAG AA contrast target; focus-visible outlines, responsive controls, and reduced-motion support remain required.

## Command Explorer

- Search now filters both individual commands and guided workflows.
- The live result count reports command and workflow matches separately.
- A no-results message appears when neither list has a match.
- Copy buttons restore their own labels after success or manual-copy fallback.
- The stylesheet and client script are same-origin assets compatible with the existing `script-src 'self'` policy.

## Verification boundary

Source tests and syntax checks cover the stylesheet route, token presence, sparse motif, mobile action layout, workflow filtering hooks, and CSP-safe asset loading. Real desktop/mobile browser rendering on the deployment host remains a staging requirement.
