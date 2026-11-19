# PIR Visuals v5.70.0 — UX & Interaction References

This release focuses on three workflow surfaces: long-form portfolio case studies, curated collections, and Designer Studio setup. The references below inform interaction patterns and accessibility requirements; the visual execution remains within PIR Visuals' forest-green, sage, and warm-ivory identity.

## In-page navigation for case studies

- [U.S. Web Design System — In-page navigation](https://designsystem.digital.gov/components/in-page-navigation/) describes sticky section navigation for lengthy content and the use of current-section indication.
- [Singapore Government Design System — Table of contents](https://www.designsystem.tech.gov.sg/components/table-of-contents) recommends mapping links to real headings, keeping labels concise, and avoiding contents navigation on short pages.

**Applied to PIR:** case-study chapters link to actual sections and are only rendered when at least four meaningful sections exist. The active link follows the reading position; anchors remain native links.

## Collection sorting and accessible controls

- [Primer — Drag and Drop accessibility patterns](https://primer.style/accessibility/patterns/drag-and-drop/) recommends more than one way to reorder items and calls out visual feedback and assistive-technology announcements.
- [W3C WAI — Technique G219: Alternative for dragging movements](https://www.w3.org/WAI/WCAG22/Techniques/general/G219) describes single-pointer alternatives such as move-up/move-down controls.
- [W3C WAI — Technique G90: Keyboard-triggered event handlers](https://www.w3.org/WAI/WCAG22/Techniques/general/G90) explains providing keyboard access for functionality otherwise triggered by pointer events.

**Applied to PIR:** a curator can drag cards, use visible move-up/move-down buttons, or edit the existing ID field manually. Remove controls are available for unavailable or unwanted items. A polite live region reports reorder/remove results. The existing `itemIds` field remains the backend contract, so no new persistence API is required.

## Studio onboarding and progress

The Designer Studio checklist uses existing profile, approved portfolio, active service, public-profile, and availability data. It is not a new account gate or a mandatory onboarding wizard: every item links to the existing section, and users can continue using the rest of the Studio regardless of completion.

## Scroll and motion implementation

- [MDN — Document scroll event](https://developer.mozilla.org/en-US/docs/Web/API/Document/scroll_event) notes that scroll handlers should avoid expensive work.
- [Chrome for Developers — Passive event listeners](https://developer.chrome.com/docs/lighthouse/best-practices/uses-passive-event-listeners) explains passive listeners for input events that can block scrolling.

**Applied to PIR:** section navigation uses a passive scroll listener, one pending animation-frame callback, and a small ordered list of section geometry reads. It does not prevent default scrolling or take control of the scroll position. New transitions are disabled by Motion Off and `prefers-reduced-motion`.

## Deliberate exclusions

- No scroll-jacking or custom smooth-scroll runtime.
- No new GSAP/Framer Motion dependency.
- No forced drag-only sorting.
- No extra chapter navigation on short case-study pages.
- No new database schema for onboarding progress; the completion state is derived from existing records.
