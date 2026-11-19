/* PIR Visuals intro boot — before first paint, no inline script required by CSP. */
(() => {
  try {
    const path = location.pathname;
    if (!/^\/(?:$|discover\/?$|about\/?$|for-business\/?$|contact\/?$|categories\/?$|how-it-works\/?$|commands\/?$)/.test(path)) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const force = new URLSearchParams(location.search).get('pv_intro') === '1';
    if (!force && sessionStorage.getItem('pir-intro-seen-v20261114q')) return;
    sessionStorage.setItem('pir-intro-seen-v20261114q', '1');
    document.documentElement.classList.add('pv-intro-active');
    window.__pvIntroStartedAt = performance.now();
  } catch (_) { /* Storage blocked: omit intro rather than obscure content. */ }
})();
