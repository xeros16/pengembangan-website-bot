/* PIR Visuals FAQ — native disclosure, CSS-driven height interpolation.
   No JS measurement/cancellation means rapid mouse and keyboard clicks
   cannot restart a height animation from an outdated pixel value. */
(() => {
  document.querySelectorAll('.pv-faq-list details').forEach(item => {
    const summary = item.querySelector(':scope > summary');
    if (!summary) return;
    const sync = () => summary.setAttribute('aria-expanded', String(item.open));
    item.addEventListener('toggle', sync);
    sync();
  });
})();
