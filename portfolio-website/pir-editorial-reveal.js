/* PIR Visuals / 2026-11-14p. Lightweight, once-only section entrances.
   Scrolling itself stays native. No wheel listeners and no rAF scroll engine. */
(() => {
  'use strict';
  if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const selectors = [
    '#main-content:not(:has(.pv-home)) > .pv-match-finder',
    '#main-content:not(:has(.pv-home)) > .pv-discovery-shell',
    '#main-content:not(:has(.pv-home)) > .company-editorial .company-editorial-grid',
    '#main-content:not(:has(.pv-home)) > .company-editorial .company-editorial-copy',
    '#main-content:not(:has(.pv-home)) > .support-layout',
    '#main-content:not(:has(.pv-home)) > .category-grid'
  ];
  const nodes = selectors.flatMap(selector => Array.from(document.querySelectorAll(selector)));
  if (!nodes.length) return;
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('pir-revealed');
      observer.unobserve(entry.target);
    }
  }, { threshold:0.03, rootMargin:'0px 0px 80px 0px' });
  for (const el of nodes) {
    // Avoid hiding sections already visible at startup, even momentarily.
    if (el.getBoundingClientRect().top < window.innerHeight + 50) continue;
    el.classList.add('pir-reveal-pending');
    observer.observe(el);
  }
  addEventListener('pagehide', () => observer.disconnect(), {once:true});
})();
