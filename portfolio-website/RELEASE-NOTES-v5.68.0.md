# PIR Visuals v5.68.0 — Motion & Design System Upgrade

Base: v5.67.0 Mobile Button Alignment Refinement.

## Experience and design updates
- Introduces a cross-page motion language for homepage, discovery, categories, designer profiles, work detail, Collection/Moodboard, support, informational pages and Designer Studio.
- Adds distinct reveal families: hero entrance, editorial headline mask, rise reveal, card reveal, panel reveal and image curtain reveal.
- Improves sibling stagger timing so related cards arrive in a deliberate sequence rather than a page-wide arbitrary delay.
- Adds subtle fine-pointer card tilt, pointer spotlight and restrained magnetic feedback on primary CTAs. These are not mounted on touch-only devices.
- Refines card, button, link, filter, form, accordion, navigation and image micro-interactions.
- Adds a slow organic drift to the homepage hero ornament and named View Transition treatment for the shared navigation.
- Extends pointer-responsive ambient lighting to support, profile, studio and project surfaces.

## Accessibility and performance
- Keeps native scrolling; no scroll hijacking or forced smooth-scroll runtime.
- Honors `prefers-reduced-motion` and the persistent PIR motion toggle.
- Motion is progressively enhanced: content remains visible if JavaScript or IntersectionObserver is unavailable.
- Uses CSS transforms, opacity, clip-path and IntersectionObserver; no external animation framework, CDN script, WebGL runtime or new package dependency was added.
- Fine-pointer tilt/magnetic effects are limited to hover-capable devices and use requestAnimationFrame for pointer updates.

## Compatibility and preserved behavior
- Preserves existing routes, MongoDB models, designer authentication, OTP, WhatsApp integration, uploads, Client Workspace, analytics and PWA behavior.
- Advances service-worker cache to `pir-visuals-public-v14` and health version to `5.68.0`.
- Updates the icon cache-busting query to `v=568`.

## Validation
- Website regression suite: see the delivered test report; automated tests cover legacy platform features and the new motion system.
- JavaScript syntax checks: `node --check portfolio-website/server.js`.
- CSS validation: stylesheet delimiter and rule-balance checks.
- ZIP integrity: verified after packaging.
- Live browser/database smoke tests still require the user's local MongoDB environment.
