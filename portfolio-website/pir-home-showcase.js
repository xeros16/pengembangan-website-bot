(() => {
  const root = document.querySelector('[data-pv-showcase]');
  if (!root) return;

  const tabs = [...root.querySelectorAll('[data-showcase-tab]')];
  const panels = [...root.querySelectorAll('[data-showcase-panel]')];
  if (!tabs.length || !panels.length) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let activeKey = 'latest';
  let timer = null;
  let touchStartX = 0;
  const indexByKey = new Map();

  const getPanel = key => panels.find(panel => panel.dataset.showcasePanel === key);
  const getSlides = panel => [...panel.querySelectorAll('[data-showcase-slide]')];

  // Apply the desktop inset to the actual copy column at runtime.
  // Inline !important styles avoid stale/competing stylesheet rules.
  const copyInsetMedia = window.matchMedia('(min-width: 901px)');
  const applyCopyInset = () => {
    root.querySelectorAll('[data-pv-showcase-copy]').forEach(copy => {
      if (copyInsetMedia.matches) {
        copy.style.setProperty('box-sizing', 'border-box', 'important');
        copy.style.setProperty('padding-block', '46px 42px', 'important');
        copy.style.setProperty('padding-left', 'clamp(44px, 3.8vw, 56px)', 'important');
        copy.style.setProperty('padding-right', 'clamp(16px, 1.8vw, 24px)', 'important');
        copy.querySelectorAll('.pv-showcase-meta strong, .pv-showcase-byline a').forEach(item => {
          item.style.removeProperty('position');
          item.style.removeProperty('left');
          item.style.removeProperty('transform');
        });
      } else {
        copy.style.removeProperty('box-sizing');
        copy.style.removeProperty('padding-block');
        copy.style.removeProperty('padding-left');
        copy.style.removeProperty('padding-right');
        copy.querySelectorAll('.pv-showcase-meta strong, .pv-showcase-byline a').forEach(item => {
          item.style.removeProperty('position');
          item.style.removeProperty('left');
          item.style.removeProperty('transform');
        });
      }
    });
    root.dataset.copyInsetRuntime = '20261118m-left-shift';
  };
  applyCopyInset();
  copyInsetMedia.addEventListener?.('change', applyCopyInset);
  window.addEventListener('resize', applyCopyInset, { passive: true });

  // Align the section title's left edge with the actual text inset in the
  // active carousel copy panel. This avoids guessing with viewport-based
  // padding when the heading container and full-width carousel have
  // different parent gutters.
  const headingTitleBlock = root.querySelector('.pv-showcase-heading > div:first-child');
  // Keep the heading aligned with the active carousel copy at every
  // viewport width, including narrow browser windows and browser zoom.
  // The measured shift is clamped to the visible showcase bounds below.
  let headingAlignFrame = 0;
  const resetHeadingAlignment = () => {
    headingTitleBlock.style.removeProperty('left');
    headingTitleBlock.style.removeProperty('position');
    headingTitleBlock.style.removeProperty('transform');
    root.dataset.headingAlignRuntime = 'responsive-flow';
  };
  const alignHeadingToCarouselCopy = () => {
    if (!headingTitleBlock) return;
    // Only measure the currently visible slide. The previous selector could
    // return the first slide even after it became display:none; after the
    // autoplay timer changed slides, that hidden heading had a zero rect and
    // reset the title alignment back to its default position.
    const activeCopy = root.querySelector(
      '[data-showcase-panel]:not([hidden]) .pv-showcase-slide.is-active [data-pv-showcase-copy]'
    );
    if (!activeCopy) {
      resetHeadingAlignment();
      return;
    }
    // Keep the current offset in place while measuring. Removing `left`
    // before every pass caused a visible snap to the default position during
    // autoplay; instead subtract the current inline offset to recover the
    // title's stable, unshifted layout coordinate without moving it on screen.
    headingTitleBlock.style.setProperty('position', 'relative', 'important');
    const rootRect = root.getBoundingClientRect();
    const headingRect = headingTitleBlock.getBoundingClientRect();
    const copyRect = activeCopy.getBoundingClientRect();
    if (!headingRect.width || !copyRect.width || !rootRect.width) {
      resetHeadingAlignment();
      return;
    }
    const currentLeft = Number.parseFloat(headingTitleBlock.style.getPropertyValue('left')) || 0;
    const headingBaseLeft = headingRect.left - currentLeft;
    // The text starts at the copy panel's content edge, not at a heading
    // glyph box that can change width or animate as slides rotate.
    const copyStyle = window.getComputedStyle(activeCopy);
    const copyBorderLeft = Number.parseFloat(copyStyle.borderLeftWidth) || 0;
    const copyPaddingLeft = Number.parseFloat(copyStyle.paddingLeft) || 0;
    const copyContentLeft = copyRect.left + copyBorderLeft + copyPaddingLeft;
    const desiredShift = copyContentLeft - headingBaseLeft;
    // Clamp the shift so the entire title block always remains inside the
    // visible page, even at unusual desktop widths or non-default zoom levels.
    const safeLeft = Math.max(12, rootRect.left + 12);
    const safeRight = Math.min(window.innerWidth - 12, rootRect.right - 12);
    const minShift = safeLeft - headingBaseLeft;
    const maxShift = safeRight - (headingBaseLeft + headingRect.width);
    if (maxShift < minShift) {
      resetHeadingAlignment();
      return;
    }
    const shift = Math.max(minShift, Math.min(maxShift, desiredShift));
    headingTitleBlock.style.setProperty('left', `${shift.toFixed(2)}px`, 'important');
    root.dataset.headingAlignRuntime = '20261119d-base-rect-clamped';
  };
  const scheduleHeadingAlignment = () => {
    if (headingAlignFrame) window.cancelAnimationFrame(headingAlignFrame);
    headingAlignFrame = window.requestAnimationFrame(() => {
      headingAlignFrame = 0;
      alignHeadingToCarouselCopy();
    });
  };
  scheduleHeadingAlignment();
  window.addEventListener('resize', scheduleHeadingAlignment, { passive: true });
  document.fonts?.ready?.then(scheduleHeadingAlignment).catch?.(() => {});
  if ('ResizeObserver' in window) {
    const headingAlignObserver = new ResizeObserver(scheduleHeadingAlignment);
    headingAlignObserver.observe(root);
    if (headingTitleBlock) headingAlignObserver.observe(headingTitleBlock);
    const activeCopyHeading = root.querySelector('[data-showcase-panel]:not([hidden]) [data-pv-showcase-copy] h3');
    if (activeCopyHeading) headingAlignObserver.observe(activeCopyHeading);
  }

  const classifyMedia = slide => {
    const art = slide?.querySelector('.pv-showcase-art');
    const media = art?.querySelector('img, video');
    if (!art || !media) return;
    const apply = (width, height) => {
      if (!width || !height) return;
      const ratio = width / height;
      art.classList.remove('is-portrait', 'is-landscape', 'is-square');
      art.classList.add(ratio < 0.86 ? 'is-portrait' : ratio > 1.18 ? 'is-landscape' : 'is-square');
    };
    if (media.tagName === 'IMG') {
      if (media.naturalWidth && media.naturalHeight) apply(media.naturalWidth, media.naturalHeight);
      else media.addEventListener('load', () => apply(media.naturalWidth, media.naturalHeight), { once: true });
    } else {
      if (media.videoWidth && media.videoHeight) apply(media.videoWidth, media.videoHeight);
      else media.addEventListener('loadedmetadata', () => apply(media.videoWidth, media.videoHeight), { once: true });
    }
  };

  const stop = () => {
    if (timer) window.clearInterval(timer);
    timer = null;
  };

  const paint = (panel, requestedIndex) => {
    const slides = getSlides(panel);
    const key = panel.dataset.showcasePanel;
    if (!slides.length) {
      panel.querySelector('.pv-showcase-controls')?.setAttribute('hidden', '');
      return;
    }
    const activeIndex = (requestedIndex + slides.length) % slides.length;
    indexByKey.set(key, activeIndex);
    panel.querySelector('.pv-showcase-controls')?.removeAttribute('hidden');
    slides.forEach(classifyMedia);
    slides.forEach((slide, index) => {
      const active = index === activeIndex;
      slide.classList.toggle('is-active', active);
      slide.setAttribute('aria-hidden', String(!active));
      const video = slide.querySelector('video');
      if (video) {
        if (active) video.play?.().catch?.(() => {});
        else video.pause?.();
      }
    });
    // The active slide is the alignment reference. Recalculate after the
    // class switch so the heading never follows a hidden/previous slide.
    scheduleHeadingAlignment();
    const current = panel.querySelector('[data-showcase-current]');
    if (current) current.textContent = String(activeIndex + 1).padStart(2, '0');
    panel.querySelectorAll('[data-showcase-dot]').forEach((dot, index) => {
      dot.setAttribute('aria-current', String(index === activeIndex));
    });
    const previous = panel.querySelector('[data-showcase-prev]');
    const next = panel.querySelector('[data-showcase-next]');
    if (previous) previous.disabled = slides.length < 2;
    if (next) next.disabled = slides.length < 2;
  };

  const start = () => {
    stop();
    const panel = getPanel(activeKey);
    if (!panel || getSlides(panel).length < 2 || reducedMotion.matches || document.hidden) return;
    if (root.matches(':hover') || root.contains(document.activeElement)) return;
    timer = window.setInterval(() => {
      const currentPanel = getPanel(activeKey);
      if (!currentPanel) return;
      paint(currentPanel, (indexByKey.get(activeKey) || 0) + 1);
    }, 7200);
  };

  const activate = key => {
    if (!getPanel(key)) return;
    stop();
    activeKey = key;
    tabs.forEach((tab, index) => {
      const active = tab.dataset.showcaseTab === key;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
      tab.classList.toggle('is-active', active);
    });
    panels.forEach(panel => {
      const active = panel.dataset.showcasePanel === key;
      panel.hidden = !active;
      if (active) paint(panel, indexByKey.get(key) || 0);
      else panel.querySelectorAll('video').forEach(video => video.pause?.());
    });
    scheduleHeadingAlignment();
    start();
  };

  tabs.forEach(tab => {
    tab.addEventListener('click', () => activate(tab.dataset.showcaseTab));
    tab.addEventListener('keydown', event => {
      if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const current = tabs.indexOf(tab);
      const nextIndex = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (current + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
      tabs[nextIndex].focus();
      activate(tabs[nextIndex].dataset.showcaseTab);
    });
  });

  root.addEventListener('click', event => {
    const panel = event.target.closest('[data-showcase-panel]');
    if (!panel || panel.dataset.showcasePanel !== activeKey) return;
    const slides = getSlides(panel);
    const current = indexByKey.get(activeKey) || 0;
    const dot = event.target.closest('[data-showcase-dot]');
    const previous = event.target.closest('[data-showcase-prev]');
    const next = event.target.closest('[data-showcase-next]');
    if (!dot && !previous && !next) return;
    event.preventDefault();
    stop();
    if (dot) paint(panel, Number(dot.dataset.showcaseDot) || 0);
    else if (previous) paint(panel, current - 1);
    else if (next) paint(panel, current + 1);
    start();
  });

  root.addEventListener('mouseenter', stop);
  root.addEventListener('mouseleave', start);
  root.addEventListener('focusin', stop);
  root.addEventListener('focusout', () => window.setTimeout(start, 0));
  const swipeSurface = root.querySelector('.pv-showcase-panels') || root;
  swipeSurface.addEventListener('touchstart', event => {
    touchStartX = event.changedTouches[0]?.clientX || 0;
    stop();
  }, { passive: true });
  swipeSurface.addEventListener('touchend', event => {
    const delta = (event.changedTouches[0]?.clientX || 0) - touchStartX;
    const panel = getPanel(activeKey);
    if (panel && Math.abs(delta) > 48) paint(panel, (indexByKey.get(activeKey) || 0) + (delta < 0 ? 1 : -1));
    start();
  }, { passive: true });
  document.addEventListener('visibilitychange', () => document.hidden ? stop() : start());
  reducedMotion.addEventListener?.('change', start);

  tabs.forEach((tab, index) => { tab.tabIndex = index === 0 ? 0 : -1; });
  activate(tabs.find(tab => tab.dataset.showcaseTab === 'latest')?.dataset.showcaseTab || tabs[0].dataset.showcaseTab);
})();
