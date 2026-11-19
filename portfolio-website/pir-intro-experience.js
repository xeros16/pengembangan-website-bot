/* PIR VISUALS brand intro — longer hold, intro BEFORE navigation on logo click.
   Keyboard/mouse logo activation use the same flow. No delayed navigation on
   reduced-motion preference. A repeat click on Home never reloads the page. */
(() => {
  'use strict';
  const root = document.documentElement;
  const overlay = document.getElementById('pv-intro-overlay');
  if (!overlay) return;

  const RUN_MS = 2150; // Intro hold; with 450ms exit = 2.6 seconds total.
  const EXIT_MS = 450;
  const SLOW_CAP_MS = 4500;
  const seenKey = 'pir-intro-seen-v20261114q';
  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)');
  const timer = { hold: 0, finish: 0, safety: 0 };
  let state = root.classList.contains('pv-intro-active') ? 'playing' : 'idle';
  let destination = null;
  let startedAt = Number(window.__pvIntroStartedAt) || performance.now();

  const cleanForceQuery = () => {
    try {
      const current = new URL(window.location.href);
      if (current.searchParams.get('pv_intro') !== '1') return;
      current.searchParams.delete('pv_intro');
      window.history.replaceState(window.history.state, '', current.pathname + current.search + current.hash);
    } catch { /* History can be disabled without blocking the website. */ }
  };
  const stopTimers = () => {
    Object.values(timer).forEach(id => { if (id) window.clearTimeout(id); });
    timer.hold = timer.finish = timer.safety = 0;
  };
  const navigateHome = () => {
    // Session flag ensures the next page doesn't replay after pre-navigation intro.
    try { sessionStorage.setItem(seenKey, '1'); } catch { /* optional */ }
    window.location.assign('/');
  };
  const reset = () => {
    stopTimers();
    state = 'idle';
    overlay.hidden = true;
    root.classList.remove('pv-intro-active', 'pv-intro-exit');
    cleanForceQuery();
  };
  const finish = () => {
    if (state === 'idle') return;
    const next = destination;
    destination = null;
    if (next) {
      // Leave intro visible until the browser commits navigation; no flash
      // of the previous page between intro and refresh.
      stopTimers();
      navigateHome();
      // Browser may block navigation: never leave users trapped.
      timer.safety = window.setTimeout(reset, 2000);
    } else {
      reset();
    }
  };
  const exit = () => {
    if (state !== 'playing') return;
    state = 'exiting';
    // For outgoing navigation, don't fade to old page before redirect.
    if (destination) {
      finish();
      return;
    }
    root.classList.add('pv-intro-exit');
    timer.finish = window.setTimeout(finish, EXIT_MS);
  };
  const begin = (goHome = false) => {
    stopTimers();
    destination = goHome ? '/' : null;
    state = 'playing';
    startedAt = performance.now();
    overlay.hidden = false;
    root.classList.remove('pv-intro-exit');
    // Toggle class to replay wordmark/sticker animations on repeated brand clicks.
    root.classList.remove('pv-intro-active');
    void overlay.offsetWidth;
    root.classList.add('pv-intro-active');
    timer.hold = window.setTimeout(exit, RUN_MS);
    timer.safety = window.setTimeout(finish, SLOW_CAP_MS);
  };

  // Capture navigation before browser begins a refresh; ctrl/cmd/middle click
  // keep native browser semantics for opening a new tab.
  document.addEventListener('click', event => {
    const source = event.target instanceof Element ? event.target : event.target?.parentElement;
    const brand = source?.closest?.('header.site-nav a.brand');
    if (!brand || event.defaultPrevented || event.button !== 0 || event.metaKey ||
        event.ctrlKey || event.shiftKey || event.altKey || brand.target === '_blank') return;
    if (reduceMotion?.matches) return; // regular home navigation for reduced motion
    event.preventDefault();
    if (state === 'playing' || state === 'exiting') return;
    const onHome = window.location.pathname === '/' || window.location.pathname === '';
    begin(!onHome);
  }, true);

  overlay.querySelector('[data-pv-intro-skip]')?.addEventListener('click', () => {
    if (state !== 'playing') return;
    stopTimers();
    exit();
  });
  window.addEventListener('keydown', event => {
    if (state === 'playing' && event.key === 'Escape') exit();
  });
  window.addEventListener('pageshow', event => {
    if (event.persisted) { destination = null; reset(); }
  });

  // Automatic first visit/direct ?pv_intro=1: duration measured from boot,
  // not DOMContentLoaded. Don't wait on unrelated network requests.
  if (state === 'playing') {
    overlay.hidden = false;
    timer.hold = window.setTimeout(exit, Math.max(500, RUN_MS - (performance.now() - startedAt)));
    timer.safety = window.setTimeout(finish, SLOW_CAP_MS);
  } else {
    overlay.hidden = true;
    cleanForceQuery();
  }
})();
