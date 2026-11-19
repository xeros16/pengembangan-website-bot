/* PIR Visuals — gapless, always-moving marquee 2026-11-14t.
   A single rAF driver eliminates competing CSS / GSAP timelines.
   Hover slows to ~11% of speed; never pauses or leaves a blank segment. */
(() => {
  const ribbon = document.querySelector('.pv-motion-ribbon');
  const track = ribbon?.querySelector('.pv-motion-ribbon-track');
  const first = track?.querySelector('.pv-motion-ribbon-group');
  if (!ribbon || !track || !first) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const allowed = () => !reduced.matches && document.documentElement.dataset.pvMotion !== 'off';
  const seed = first.cloneNode(true);
  let groupWidth = 1, distance = 0, speed = 0, destinationSpeed = 0, last = 0, frame = 0;
  let slow = false, inView = false;
  const setHover = active => { slow = active; destinationSpeed = active ? 4 : 36; };
  const rebuild = () => {
    // Recompute from the *untransformed* source group; don't let added clones
    // change the measured length of a repetition cycle.
    track.style.transform = 'translate3d(0,0,0)';
    track.replaceChildren(seed.cloneNode(true));
    const source = track.firstElementChild;
    groupWidth = Math.max(1, source.getBoundingClientRect().width);
    // Enough repetitions to cover the viewport plus one whole loop, even at
    // very wide browser windows / low browser zoom (e.g. 4096 CSS px).
    const copies = Math.max(3, Math.ceil(ribbon.clientWidth / groupWidth) + 2);
    for (let i = 1; i < copies; i++) {
      const copy = source.cloneNode(true);
      copy.setAttribute('aria-hidden', 'true');
      track.append(copy);
    }
    distance = ((distance % groupWidth) + groupWidth) % groupWidth;
    track.style.transform = `translate3d(${-distance}px,0,0)`;
  };
  const tick = now => {
    if (!allowed() || !inView) { frame = 0; last = 0; return; }
    const dt = Math.min(.05, Math.max(0, (now - (last || now - 16.7)) / 1000));
    last = now;
    // Exponential velocity interpolation is stable at any refresh rate.
    speed += (destinationSpeed - speed) * (1 - Math.exp(-dt / .55));
    distance = (distance + speed * dt) % groupWidth;
    track.style.transform = `translate3d(${-distance}px,0,0)`;
    frame = requestAnimationFrame(tick);
  };
  const start = () => {
    if (!allowed() || !inView || frame) return;
    last = 0;
    speed = speed || 36;
    destinationSpeed = slow ? 4 : 36;
    frame = requestAnimationFrame(tick);
  };
  const stop = () => { if (frame) cancelAnimationFrame(frame); frame = 0; last = 0; };
  ribbon.addEventListener('pointerenter', () => setHover(true));
  ribbon.addEventListener('pointerleave', () => setHover(false));
  ribbon.addEventListener('focusin', () => setHover(true));
  ribbon.addEventListener('focusout', () => setHover(false));
  document.addEventListener('visibilitychange', () => document.hidden ? stop() : start());
  reduced.addEventListener?.('change', () => reduced.matches ? stop() : start());
  const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(() => rebuild()) : null;
  observer?.observe(ribbon);
  // Fonts influence the repeat width; align groups after font load.
  document.fonts?.ready?.then(rebuild).catch(() => {});
  addEventListener('resize', rebuild, {passive:true});
  rebuild();
  // Keep the marquee seamless when it enters view, but do not redraw it on
  // every frame while the visitor is reading other parts of the page.
  if ('IntersectionObserver' in window) {
    const visibilityObserver = new IntersectionObserver(entries => {
      inView = entries[0]?.isIntersecting === true;
      if (inView) start(); else stop();
    }, { rootMargin: '160px 0px' });
    visibilityObserver.observe(ribbon);
  } else {
    inView = true;
    start();
  }
})();
