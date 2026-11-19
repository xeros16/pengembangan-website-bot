# Motion & Design Reference Notes — PIR Visuals v5.68.1

These references inform the interaction principles only. PIR Visuals keeps its own pear identity, forest-green / sage / warm-ivory palette, category colors, typography, and editorial composition. No third-party site's assets or code are copied.

## Visual references

1. **Bettr Academy** — https://bettr.academy/
   - The user's supplied reference for an editorial content hierarchy, varied section rhythm, and clear primary actions.
   - PIR application: preserve the oversized editorial hero, give section headings and content groups their own reveal timing, and keep primary actions distinct.

2. **Studio Freight** — https://studiofreight.com/
   - Reference for confident art direction and a visual language that remains consistent across a complete experience.
   - PIR application: image-led work reveals with a transform-only curtain wipe, restrained ambient background movement, and a consistent easing/timing family.

3. **Active Theory** — https://activetheory.net/
   - Its interactive portfolio navigation is discussed in a Communication Arts profile: https://www.commarts.com/webpicks/active-theory-2
   - PIR application: add expressive but small navigation and pointer interactions. The implementation deliberately avoids WebGL and full-screen effects.

4. **Locomotive** — https://locomotive.ca/
   - Reference for the relationship between art direction, interaction, and development in a digital destination.
   - PIR application: more purposeful page transitions and visual hierarchy without changing the core brand system.

## Engineering references

1. **web.dev — How to create high-performance CSS animations**
   - https://web.dev/articles/animations-guide
   - Guidance: favor `transform` and `opacity`, avoid properties that trigger layout or paint when possible, and use `will-change` sparingly.
   - PIR application: scroll progress uses `scaleX`; category and manifesto hovers no longer animate padding; blur was removed from the primary motion paths.

2. **GSAP — ScrollTrigger documentation**
   - https://gsap.com/docs/v3/Plugins/ScrollTrigger/
   - Guidance: trigger motion when content enters view, synchronize scroll updates to animation frames, and avoid scroll-jacking.
   - PIR application: native IntersectionObserver and a single RAF scroll scheduler are retained; GSAP is not added as a new dependency.

3. **MDN — View Transition API**
   - https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API
   - Guidance: named elements can participate separately from the root snapshot during same-origin multi-page navigation.
   - PIR application: the shared navigation gets one persistent `view-transition-name` and no separate entrance animation.

4. **MDN — prefers-reduced-motion**
   - https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion
   - Guidance: adapt non-essential motion when the visitor requests reduced movement.
   - PIR application: system preference and the site's Motion Off control both keep essential copy and imagery visible.

5. **W3C — Animation from Interactions**
   - https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions
   - Guidance: users should be able to prevent non-essential interaction-triggered motion.
   - PIR application: the existing Motion control and OS reduced-motion preference disable decorative motion.

6. **Lenis — Smooth Scroll**
   - https://lenis.dev/
   - Reference for the feel of carefully tuned scroll-linked experiences.
   - PIR decision: Lenis is not installed. The site keeps native scrolling to avoid adding a scroll interception layer or another runtime dependency.

## Design decisions

- Keep the current motion identity; improve its timing and coordination instead of replacing it.
- No heavy WebGL, no new animation framework, and no scroll-jacking.
- No full-page blur transitions.
- No continuous large-scale movement behind body copy.
- New hover/magnetic motion is limited to precise-pointer devices.
- Mobile uses shorter reveal travel and no magnetic cursor effect.
- Essential text and imagery remain visible if JavaScript animation is unavailable or motion is disabled.
