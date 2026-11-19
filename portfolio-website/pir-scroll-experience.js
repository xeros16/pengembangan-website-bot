/* PIR Visuals — scroll stability 2026-11-14n.
   The browser owns physical wheel, precision touchpad, touch, scrollbar and
   keyboard scrolling. No custom wheel listener, preventDefault, or per-frame
   scrollTo loop. Smooth movement is reserved for explicit anchor navigation. */
(() => {
  'use strict';
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const motionAllowed = () => !reducedMotion.matches &&
    document.documentElement.dataset.pvMotion !== 'off';
  const maxY = () => Math.max(0, document.documentElement.scrollHeight - innerHeight);
  const clamp = value => Math.min(maxY(), Math.max(0, Number(value) || 0));

  // CSS may use scroll-behavior:auto to prevent two smooth scroll systems from
  // fighting; the native smooth behavior here is explicit and compositor-owned.
  const scrollToPosition = top => {
    window.scrollTo({ top: clamp(top), behavior: motionAllowed() ? 'smooth' : 'instant' });
  };
  window.pirScrollTo = scrollToPosition;

  document.addEventListener('click', event => {
    // Leave all ordinary browser scrolling entirely untouched.
    if (event.defaultPrevented || event.button !== 0 || event.metaKey ||
        event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target?.closest?.('a[href*="#"]');
    if (!link || link.target === '_blank' || link.hasAttribute('download')) return;
    let url;
    try { url = new URL(link.href, location.href); } catch { return; }
    if (url.origin !== location.origin || url.pathname !== location.pathname ||
        url.search !== location.search || !url.hash || url.hash === '#') return;
    let id;
    try { id = decodeURIComponent(url.hash.slice(1)); } catch { return; }
    const element = document.getElementById(id);
    if (!element) return;
    event.preventDefault();
    const header = document.querySelector('header.site-nav');
    const headerHeight = header?.getBoundingClientRect().height || 0;
    const top = window.scrollY + element.getBoundingClientRect().top - headerHeight - 16;
    scrollToPosition(top);
    history.pushState?.(null, '', url.hash);
    if (element.hasAttribute('tabindex')) element.focus({ preventScroll: true });
  });
})();
