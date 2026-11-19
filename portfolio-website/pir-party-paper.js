/* PIR Visuals original paper confetti: hover bursts positioned behind cards/graphics.
   One short CSS animation per entry, no scroll listeners or persistent rAF. */
(() => {
  'use strict';
  const cardColors = ['#56745D','#678164','#748A5E','#8B7561','#9E7C69','#B18C73'];
  const sealColors = ['#D9E9C6','#BED4AB','#E6D7C6','#C28569','#F6F4E8','#96B692'];
  const motionDisabled = () =>
    document.documentElement.getAttribute('data-pv-motion') === 'off' ||
    Boolean(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const lerp = (a,b,t) => a+(b-a)*t;
  const randomFrom = (seed) => {
    let n = seed >>> 0;
    return () => {
      n = (Math.imul(n,1664525) + 1013904223) >>> 0;
      return n/4294967296;
    };
  };
  // Only the trailing arrow becomes its own animated element; link text stays fixed.
  const decorateLinkArrows = () => {
    document.querySelectorAll('#main-content a').forEach(link => {
      if (link.classList.contains('pv-arrow-decorated')) return;
      const last = link.lastChild;
      if (!last) return;
      if (last.nodeType === 1 && last.textContent.trim() === '↗' && last.tagName === 'SPAN') {
        last.classList.add('pv-link-arrow');
        last.setAttribute('aria-hidden','true');
        link.classList.add('pv-arrow-decorated');
        return;
      }
      if (last.nodeType !== 3) return;
      const match = last.textContent.match(/^(.*?)(\s*)↗\s*$/s);
      if (!match) return;
      last.textContent = match[1] + match[2];
      const arrow = document.createElement('span');
      arrow.className = 'pv-link-arrow';
      arrow.setAttribute('aria-hidden','true');
      arrow.textContent = '↗';
      link.appendChild(arrow);
      link.classList.add('pv-arrow-decorated');
    });
  };
  const init = () => {
    decorateLinkArrows();
    const footerFeature = document.querySelector('.pv-footer .pv-footer-feature');
    const footerGraphic = footerFeature?.querySelector('.pv-footer-feature-graphic');
    const targets = [];
    const attachLayer = (container, kind) => {
      if (!container) return null;
      let layer = container.querySelector(':scope > .pv-party-layer');
      if (!layer) {
        layer = document.createElement('span');
        layer.className = `pv-party-layer pv-party-layer--${kind}`;
        layer.setAttribute('aria-hidden','true');
        container.appendChild(layer);
      }
      return layer;
    };
    const registerCardGroup = (container, selector) => {
      if (!container) return;
      const items = [...container.querySelectorAll(selector)];
      if (!items.length) return;
      const layer = attachLayer(container, 'cards');
      items.forEach((item, index) => {
        item.classList.add('pv-party-animated');
        targets.push({ item, container, layer, kind:'card', index, last:-Infinity });
      });
    };

    registerCardGroup(document.querySelector('.pv-home .pv-category-grid'), '.home-category');
    registerCardGroup(document.querySelector('.category-tile-grid'), '.category-tile');
    // Same three-card journey grid powers Cara Kerja, Untuk Bisnis, and Tentang.
    registerCardGroup(document.querySelector('.company-editorial-grid'), '.company-editorial-card');

    const footerLayer = attachLayer(footerFeature, 'footer');
    if (footerGraphic && footerLayer && getComputedStyle(footerGraphic).display !== 'none') {
      targets.push({item:footerGraphic,container:footerFeature,layer:footerLayer,kind:'seal',index:77,last:-Infinity});
    }

    const burst = (record) => {
      if (motionDisabled() || !record.layer || !record.item.isConnected) return;
      if (record.kind === 'seal' && getComputedStyle(record.item).display === 'none') return;
      const now = performance.now();
      if (now-record.last < 900) return;
      record.last = now;
      const itemBox = record.item.getBoundingClientRect();
      const outerBox = record.layer.getBoundingClientRect();
      if (!itemBox.width || !itemBox.height || !outerBox.width) return;
      const random = randomFrom(Math.floor(now) + record.index * 863 + 311);
      const max = record.kind === 'card' ? 22 : 24;
      const frag = document.createDocumentFragment();
      const createdPieces = [];
      for (let i=0;i<max;i++) {
        const p = document.createElement('i');
        p.className = 'pv-party-piece';
        const variant = i % 5 === 0 ? 'circle' : i%4 === 0 ? 'ribbon' : 'rect';
        p.dataset.shape = variant;
        let x,y,dx,dy;
        if (record.kind === 'card') {
          const side = i % 4;
          const t = lerp(.14,.86,random());
          if (side===0) {x = t*itemBox.width;y=3;dx=lerp(-46,46,random());dy=-lerp(36,90,random());}
          else if (side===1) {x=itemBox.width-3;y=t*itemBox.height;dx=lerp(42,104,random());dy=lerp(-52,52,random());}
          else if (side===2) {x=t*itemBox.width;y=itemBox.height-3;dx=lerp(-46,46,random());dy=lerp(36,94,random());}
          else {x=3;y=t*itemBox.height;dx=-lerp(42,104,random());dy=lerp(-52,52,random());}
        } else {
          const theta = (i/max)*Math.PI*2 + random()*.12;
          const radius = itemBox.width*.38;
          x = itemBox.width/2 + Math.cos(theta)*radius;
          y = itemBox.height/2 + Math.sin(theta)*radius;
          const flight = lerp(42,90,random());
          dx=Math.cos(theta)*flight;dy=Math.sin(theta)*flight;
        }
        p.style.setProperty('--px',`${itemBox.left - outerBox.left + x}px`);
        p.style.setProperty('--py',`${itemBox.top - outerBox.top + y}px`);
        p.style.setProperty('--dx',`${dx.toFixed(1)}px`);
        p.style.setProperty('--dy',`${dy.toFixed(1)}px`);
        p.style.setProperty('--rot',`${Math.round(random()*620-310)}deg`);
        p.style.setProperty('--pw',`${Math.round(6+random()*6)}px`);
        p.style.setProperty('--ph',`${Math.round(9+random()*9)}px`);
        const palette = record.kind === 'card' ? cardColors : sealColors;
        p.style.setProperty('--pc',palette[(i + record.index * 2) % palette.length]);
        p.style.setProperty('--dur',`${Math.round(850+random()*300)}ms`);
        p.style.setProperty('--delay',`${Math.round(random()*80)}ms`);
        p.addEventListener('animationend', () => p.remove(), {once:true});
        frag.appendChild(p);
        createdPieces.push(p);
      }
      record.layer.appendChild(frag);
      window.setTimeout(() => createdPieces.forEach(p => p.remove()), 1700);
    };
    targets.forEach(record => {
      record.item.addEventListener('pointerenter',event => {
        if (event.pointerType === 'touch') return;
        burst(record);
      }, {passive:true});
      record.item.addEventListener('focusin', () => burst(record));
    });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
