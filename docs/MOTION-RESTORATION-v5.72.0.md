# Motion Restoration & Immersive Polish — v5.72.0

## Motion On / Motion Off state

The reveal observers and fine-pointer listeners are intentionally not initialized on first load when the saved preference is Motion Off. Merely changing the root data attribute back to `on` cannot recreate those startup-only observers. The Motion On control therefore persists the preference and reloads the current page once. A one-time session notice confirms that the immersive motion system has been restored.

The control exposes an explicit `data-motion-state` value (`on`, `off`, or `reduced`) and remains disabled when the operating system requests reduced motion.

## Additional motion

- Progressive same-origin View Transitions affect the main content, not the persistent navbar.
- Case-study cover parallax uses one requestAnimationFrame scheduler for scroll and resize.
- Case-study chapter navigation shows a subtle reading-progress line.
- Fullscreen gallery images receive a short transition when changing slides.
- Selected-work cards use staggered entrances only when they become visible after filtering.

## Accessibility and performance

- Motion Off disables the new decorative animations and parallax.
- `prefers-reduced-motion: reduce` disables the new transitions and transforms.
- No new runtime dependency or database change.
- Scroll work is batched through requestAnimationFrame; no per-frame layout animation is added to the navbar.

## Verification

The website regression suite includes motion restoration, View Transition, case-study progress/parallax, gallery transition, and filter entrance assertions. See `TEST-REPORT-v5.72.0.md`.
