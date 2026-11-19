/* PIR Visuals / AR — Consistent orbit artwork on pages with an existing PIR seal.
 * Progressive enhancement: legacy pseudo seals remain in place if JS is disabled.
 * Only existing forest-green hero seals are upgraded; category/support editorial
 * panels without a PIR seal retain their original artwork and composition.
 */
(() => {
  'use strict';
  const root = document.querySelector('#main-content.wrap');
  if (!root) return;

  const accents = () => {
    const layer = document.createElement('div');
    layer.className = 'pv-discover-ornament__accents';
    layer.setAttribute('aria-hidden', 'true');
    for (const [name, glyph] of [
      ['star', '✳'], ['star2', '✦'], ['dots', ''], ['leaf', ''], ['pencil', ''],
    ]) {
      const mark = document.createElement('span');
      mark.className = `pv-discover-ornament__accent pv-discover-ornament__accent--${name}`;
      if (glyph) mark.textContent = glyph;
      layer.appendChild(mark);
    }
    return layer;
  };

  const upgrade = (host) => {
    if (!host || host.querySelector(':scope > .pv-discover-ornament')) return;
    const ornament = document.createElement('div');
    ornament.className = 'pv-discover-ornament pv-shared-seal';
    ornament.setAttribute('aria-hidden', 'true');
    const outer = document.createElement('div');
    outer.className = 'pv-discover-ornament__outer';
    const inner = document.createElement('div');
    inner.className = 'pv-discover-ornament__inner';
    const logo = document.createElement('img');
    logo.src = '/pir-footer-seal.svg';
    logo.alt = '';
    logo.width = 560;
    logo.height = 560;
    logo.decoding = 'async';
    inner.appendChild(logo);
    outer.appendChild(inner);
    ornament.append(outer, accents());
    host.appendChild(ornament);
    // Only hide old CSS pseudos once the complete replacement is present.
    host.classList.add('pv-shared-seal-host');
  };

  // Discover already includes its own complete orbit with satellites.
  const hero = root.querySelector(':scope > .hero:not(.pv-hero):not(.legal-copy)');
  if (hero && (!hero.querySelector('.stat-grid') || hero.classList.contains('command-explorer-hero'))) upgrade(hero);

  // Shortlist uses its own ::after seal instead of the generic .hero class.
  upgrade(root.querySelector(':scope > .shortlist-hero'));

  // The shared footer artwork has its own ring and wordmark; add the small
  // orbiting accents only, avoiding an extra seal image over its existing text.
  const footerSeal = root.querySelector(':scope > .pv-footer .pv-footer-feature-graphic');
  if (footerSeal && !footerSeal.querySelector('.pv-discover-ornament__accents')) {
    const footerAccents = accents();
    footerAccents.classList.add('pv-footer-orbit-accents');
    footerSeal.appendChild(footerAccents);
  }
})();
