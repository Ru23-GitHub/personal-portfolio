(function(){
  const hero   = document.getElementById('hero');
  const fitbox = document.getElementById('fitbox');
  const gb     = document.getElementById('gb');

  if (!hero || !fitbox || !gb) return;

  function spawnShine(){
    hero.querySelectorAll('.shine').forEach(n=>n.remove());
    const shine = document.createElement('div');
    shine.className = 'shine';
    hero.appendChild(shine);
  }

  function replay(){
    hero.classList.remove('play'); void hero.offsetHeight; hero.classList.add('play');
    spawnShine();
  }

  function buildWord(el, { baseDelayVar, staggerVar, offsets=[] } = {}){
    const text = (el.getAttribute('data-text')||'').trim();
    el.textContent='';
    const frag = document.createDocumentFragment();
    let seq = 0;
    const compactLen = text.split(' ').join('').length;

    for(const ch of text){
      if(ch===' '){
        const sp = document.createElement('span');
        sp.className='space';
        sp.innerHTML='&nbsp;';
        frag.appendChild(sp);
        continue;
      }
      const span = document.createElement('span');
      span.className='char';
      const defaultOxEm = (seq - (compactLen - 1) / 2) * 0.35; // em so it scales
      const ox = (offsets[seq] !== undefined) ? offsets[seq] : defaultOxEm;
      span.style.setProperty('--ox', (typeof ox === 'number' ? ox : parseFloat(ox)) + 'em');
      span.style.setProperty('--char-delay', `calc(var(${baseDelayVar}) + ${seq} * var(${staggerVar}))`);
      span.textContent = ch;
      frag.appendChild(span);
      seq++;
    }
    el.appendChild(frag);
  }

  // Add ~4em vertical headroom so bounce never clips
  function emToPx(el, em){
    const fs = parseFloat(getComputedStyle(el).fontSize) || 16;
    return em * fs;
  }

  function fitToViewport(){
    // reset transform to measure natural size
    fitbox.style.transform = 'translate(-50%,-50%) scale(1)';

    requestAnimationFrame(() => {
      const rect = gb.getBoundingClientRect();
      const vw = hero.clientWidth;
      const vh = hero.clientHeight;

      // margins so it doesn't kiss the edges
      const paddingX = Math.max(12, vw * 0.04);
      const paddingY = Math.max(12, vh * 0.06);

      // add bounce headroom (~3.2em up + small extra)
      const bounceHeadroomPx = emToPx(gb, 4);

      const maxW = vw - paddingX * 2;
      const maxH = vh - paddingY * 2 - bounceHeadroomPx;

      const scaleW = maxW / rect.width;
      const scaleH = maxH / rect.height;

      // clamp to a reasonable minimum so it's never 0
      const scale = Math.max(0.05, Math.min(scaleW, scaleH, 1));

      fitbox.style.transform = `translate(-50%,-50%) scale(${scale})`;
      fitbox.style.visibility = 'visible';

      // Let the scroll cue sit a fixed distance below the logo's actual
      // rendered edge (not the viewport edge), so the gap stays proportional
      // to the logo regardless of viewport size/aspect ratio.
      const heroTop = hero.getBoundingClientRect().top;
      const logoBottom = fitbox.getBoundingClientRect().bottom - heroTop;
      hero.style.setProperty('--logo-bottom', `${logoBottom}px`);
    });
  }

  // Build, fit, animate
  buildWord(gb, {
    baseDelayVar:'--title-delay',
    staggerVar:'--char-stagger',
    offsets:[-3.5,-2.8,-1.2,-1.2,-1.2,-1.2,2.8]
  });

  // Fit after fonts ready (width depends on font metrics)
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => { fitToViewport(); spawnShine(); });
  } else {
    // fallback if Font Loading API not available
    window.addEventListener('load', () => { fitToViewport(); spawnShine(); });
  }

  // Refit whenever the hero's actual rendered box size changes. This is more
  // reliable than a window 'resize' listener alone: it reacts to the real,
  // final layout size (covers orientation changes, mobile browser chrome
  // showing/hiding, and any viewport metrics that settle a moment after the
  // initial font-ready measurement) instead of trusting one early reading.
  let refitDebounce;
  const resizeObserver = new ResizeObserver(() => {
    clearTimeout(refitDebounce);
    refitDebounce = setTimeout(fitToViewport, 80);
  });
  resizeObserver.observe(hero);

  // Replay also refits (useful if text changes). Scoped to clicks inside the
  // hero so interacting with the rest of the page (nav, contact links, etc.)
  // never retriggers the animation.
  function replayAndFit(){
    replay();
    fitToViewport();
  }
  hero.addEventListener('click', replayAndFit);

  // Public API to change text & keep single-line fit
  window.setBootText = (title) => {
    if (title!=null) gb.setAttribute('data-text', title);
    buildWord(gb, { baseDelayVar:'--title-delay', staggerVar:'--char-stagger' });
    fitToViewport();
    replay();
  };
})();
