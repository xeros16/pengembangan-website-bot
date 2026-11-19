(() => {
  const root = document.documentElement;
  const themeButton = document.querySelector('[data-appearance-toggle]');
  const colorScheme = matchMedia('(prefers-color-scheme: dark)');
  let theme;
  try {
    theme = localStorage.getItem('pir-appearance');
  } catch {
    // The current page can still switch themes if browser storage is unavailable.
  }

  function paintTheme() {
    const dark = theme === 'dark' || (theme !== 'light' && colorScheme.matches);
    root.dataset.appearance = dark ? 'dark' : 'light';
    themeButton?.setAttribute('aria-pressed', String(dark));
  }

  themeButton?.addEventListener('click', () => {
    theme = root.dataset.appearance === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem('pir-appearance', theme); } catch {}
    paintTheme();
  });
  colorScheme.addEventListener('change', paintTheme);
  paintTheme();

  if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      observer.unobserve(entry.target);
      if (root.dataset.pvMotion !== 'off') entry.target.dataset.editionVisible = '';
    }
  }, { threshold: 0.12 });

  for (const element of document.querySelectorAll(
    '.edition-hero-copy, .edition-directory-heading, .edition-directory-intro, ' +
    '.pv-directory-results > .section-head, .case-section > h2, ' +
    '.studio-panel > h2, .owner-manager-heading, .pv-client-workspace > header',
  )) {
    observer.observe(element);
    element.addEventListener('animationend', () => delete element.dataset.editionVisible, { once: true });
  }
  window.addEventListener('pagehide', event => {
    if (!event.persisted) observer.disconnect();
  }, { once: true });
})();
