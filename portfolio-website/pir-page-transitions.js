/* PIR Visuals — subtle cross-menu transitions · 2026-11-16bd.
   Modern browsers use CSS cross-document View Transitions. For older browsers,
   fade only the public page content (never the navbar) before ordinary navigation.
   No routing hijack, no form interception, no external redirects. */
(() => {
  'use strict';
  const html = document.documentElement;
  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)');
  const motionOff = () => reduceMotion?.matches || html.dataset.pvMotion === 'off' || (() => {
    try { return localStorage.getItem('pir_visuals_motion_v1') === 'off'; }
    catch { return false; }
  })();

  // Cross-document view transitions support the paired pageswap/pagereveal events.
  // Only run the lightweight fallback when those events are not supported.
  const hasNativeTransition = ('onpageswap' in window) && ('onpagereveal' in window);
  if (hasNativeTransition) return;
  html.dataset.pvRouteFallback = 'true';

  const storageKey = 'pv_fallback_page_arrival_20261116bd';
  try {
    const previous = Number(sessionStorage.getItem(storageKey) || 0);
    sessionStorage.removeItem(storageKey);
    if (previous && Date.now() - previous < 12000 && !motionOff()) {
      html.dataset.pvRouteArriving = 'true';
      window.setTimeout(() => { delete html.dataset.pvRouteArriving; }, 550);
    }
  } catch { /* The transition works even when session storage is blocked. */ }

  let navigating = false;
  document.addEventListener('click', event => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey ||
        event.shiftKey || event.altKey || motionOff()) return;
    const target = event.target instanceof Element ? event.target : event.target?.parentElement;
    const link = target?.closest?.('a[href]');
    if (!link || link.hasAttribute('download') || link.hasAttribute('data-no-page-transition') ||
        (link.getAttribute('target') && link.getAttribute('target') !== '_self') ||
        link.relList?.contains('external')) return;

    let destination;
    try { destination = new URL(link.href, window.location.href); }
    catch { return; }
    if (!['http:', 'https:'].includes(destination.protocol) || destination.origin !== location.origin ||
        (destination.pathname === location.pathname && destination.search === location.search) ||
        /^\/(?:api|media|uploads|out|assets)(?:\/|$)/.test(destination.pathname) ||
        /\.(?:pdf|zip|png|jpe?g|webp|svg|gif|mp4|webm|css|js)$/i.test(destination.pathname)) return;

    event.preventDefault();
    if (navigating) return;
    navigating = true;
    html.dataset.pvRouteLeaving = 'true';
    try { sessionStorage.setItem(storageKey, String(Date.now())); }
    catch { /* No persistent data required for navigation. */ }
    // Always delegate to the browser for actual history, scroll and navigation.
    window.setTimeout(() => { window.location.assign(destination.href); }, 210);
    // If navigation is cancelled by browser policy, never leave the page dimmed.
    window.setTimeout(() => { navigating = false; delete html.dataset.pvRouteLeaving; }, 1600);
  });

  window.addEventListener('pageshow', event => {
    if (event.persisted) {
      navigating = false;
      delete html.dataset.pvRouteLeaving;
      delete html.dataset.pvRouteArriving;
    }
  });
})();
