# Motion reference notes — PIR Visuals v5.68.0

This is a translation of public interaction principles into the PIR Visuals design language, not a reproduction of any site's assets or layouts. The aim is editorial confidence, tactile micro-interactions and clear navigation while preserving the pear/forest/sage identity.

## References reviewed

1. **Bettr Academy / Q Agency (Webflow showcase)** — the showcase describes a bold brand translated into a clear digital experience and explicitly notes GSAP-powered Webflow interactions. PIR application: a more expressive motion rhythm around the hero, featured work and section reveals, while keeping content legible and direct.
   - https://webflow.com/made-in-webflow/website/bettr-academy
   - https://bettr.academy/
2. **Locomotive — Populous case study** — describes refined animations, clean layouts and impactful visual content for an immersive but clear experience. PIR application: controlled image reveals, visual hierarchy and soft transitions rather than effects that compete with the portfolio.
   - https://locomotive.ca/en/work/populous
3. **GSAP ScrollTrigger documentation** — documents trigger-based reveals, scrub-linked animation, pinning and performance-aware scroll callbacks. PIR application: trigger-based sequencing and native scrolling; no scroll-jacking, no pinned long-form sections in this release.
   - https://gsap.com/docs/v3/Plugins/ScrollTrigger/
4. **Webflow interaction guidance** — recommends motion that guides attention, provides feedback, reveals hierarchy or adds delight, and warns against heavy or unnecessary movement. PIR application: separate motion roles for hero, cards, images, CTAs and accordions, with a single user-controlled motion switch.
   - https://university.webflow.com/videos/when-to-use-interactions
5. **Webflow parallax guide and Made in Webflow scroll-reveal gallery** — show layered parallax, scroll reveal, image reveal and hide/reveal navigation patterns, while highlighting reduced-motion and performance considerations. PIR application: restrained pointer lighting and image curtains, not continuous deep parallax.
   - https://webflow.com/blog/parallax-scrolling
   - https://webflow.com/made-in-webflow/scroll-reveal
   - https://webflow.com/made-in-webflow/reveal-on-scroll
6. **MDN View Transition API** — explains transitions between document views and how they can preserve context as users move between pages. PIR application: a named transition for the persistent navigation, with fallback to the existing root transition.
   - https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API
7. **Apple Developer — What’s new in Safari and WebKit** — covers scroll-driven animation and calls out reduced-motion accessibility as an important design consideration. PIR application: motion remains optional and reduced-motion-safe; no dependence on a single browser-only feature.
   - https://developer.apple.com/videos/play/wwdc2025/233/
8. **Framer Academy — Bring websites to life with animation** — recommends using entrance motion for hierarchy, hover/press for feedback, and transitions to explain changes, then reviewing the complete sequence across breakpoints. PIR application: shared timings/easing and responsive-specific interaction mounting.
   - https://www.framer.com/academy/lessons/bringing-websites-to-life-with-animation
9. **Locomotive Scroll** — documents in-view detection, animation, performance and touch-aware parallax behavior. PIR application: native IntersectionObserver and disabling tilt/magnetic interactions on touch-only devices instead of adding a scrolling dependency.
   - https://scroll.locomotive.ca/
10. **regards.design — Website animation examples** — catalogues real-site cursor, hover, menu, headline and ambient animation patterns. PIR application: varied triggers across pointer, click, scroll and page navigation, with restrained intensity.
    - https://www.regards.design/website-animations

## Motion system map

| Pattern | Trigger | PIR application |
|---|---|---|
| Hero entrance | Initial viewport | Homepage, support, profile and studio headers |
| Editorial headline mask | Scroll into view | Section headings and page titles |
| Staggered card reveal | Scroll into view | Directory cards, portfolio tiles, service/support panels |
| Image curtain reveal | Scroll into view / image load | Work, case-study and portfolio imagery |
| Panel lift and mask | Scroll into view | CTA, support, manifesto and workspace panels |
| Pointer spotlight + micro tilt | Pointer movement | Desktop cards only |
| Magnetic CTA feedback | Pointer movement | Primary CTA buttons only |
| Micro feedback | Hover, press, focus, accordion | Navigation, buttons, forms, tags and FAQ |
| Cross-document transition | Navigation | Shared site navigation where supported |
| Ambient organic drift | Time | Homepage decorative ornament only |

## Design guardrails

- Motion must explain hierarchy, affordance, state change or brand character.
- Avoid animating all content at once; related groups use staggered entrances.
- Keep touch controls static and easy to tap; pointer effects are desktop-only.
- Respect the persistent PIR motion toggle and operating-system reduced-motion preference.
- Do not block or replace native scrolling.
- Keep images and content visible when JavaScript is unavailable.
