/* PIR VISUALS / 2026-11-14t — reliable native back-to-top.
 * Progressive enhancement: <a href="#pv-page-top"> works even without JS.
 * One owner of visibility / click; do not animate the full document with a
 * custom rAF loop or compete with legacy scroll/magnetic effects. */
(() => {
  'use strict';
  const target = document.getElementById('pv-page-top');
  const button = document.querySelector('a[data-back-top]');
  if (!button || !target) return;
  document.documentElement.classList.add('pv-top-ready');

  let pending = 0;
  const update = () => {
    pending = 0;
    const y = window.scrollY || document.scrollingElement?.scrollTop || 0;
    const visible = y > 260;
    button.classList.toggle('is-visible', visible);
    button.setAttribute('aria-hidden', String(!visible));
    button.tabIndex = visible ? 0 : -1;
  };
  const schedule = () => {
    if (!pending) pending = window.requestAnimationFrame(update);
  };
  for (const event of ['scroll', 'resize', 'pageshow']) {
    window.addEventListener(event, schedule, { passive: true });
  }

  // Use capture so the legacy page handlers cannot start a conflicting scroll.
  // The href remains a working fallback if this script does not initialize.
  document.addEventListener('click', event => {
    const source = event.target instanceof Element ? event.target : event.target?.parentElement;
    if (!source?.closest?.('a[data-back-top]')) return;
    if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    // An immediate jump is deliberate: no competing smooth-scroll engines,
    // and keyboard/mouse clicks produce exactly the same reliable result.
    try { window.scrollTo({ top: 0, left: 0, behavior: 'instant' }); }
    catch { window.scrollTo(0, 0); }
    if (document.scrollingElement) document.scrollingElement.scrollTop = 0;
    update();
  }, true);

  update();
})();
