// ==UserScript==
// @name tv-nav-worker-optimized
// @match https://www.ysscores.com/*
// ==/UserScript==
(function () {

  document.querySelector("header")?.remove();
  document.querySelector(".download-app-section")?.remove();
  document.querySelector("footer")?.remove();

  const ab = document.querySelector('.action-bar');
  if (ab) {
    ab.style.display = 'grid';
    ab.style.maxWidth = 'fit-content';
    ab.style.minHeight = 'stretch';
    document.body.style.setProperty('padding-left', String(ab.getBoundingClientRect().width) + 'px', 'important');
  }

  document.body.style.setProperty('padding-top',    '50px', 'important');
  document.body.style.setProperty('padding-bottom', '50px', 'important');
  document.body.style.setProperty('overflow-x', 'hidden', 'important');
  document.body.style.setProperty('overflow-y', 'hidden', 'important');

  const style = document.createElement("style");
  style.textContent = `
    *::-webkit-scrollbar { display: none !important; width: 0; height: 0; }
    .overlay-blur {
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      display: flex; justify-content: center; align-items: center;
      backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
      background: rgba(0, 0, 0, 0.3); z-index: 1000;
      opacity: 0; visibility: hidden;
      transition: opacity 0.3s ease, visibility 0.3s;
      box-sizing: border-box;
    }
    .overlay-blur.active { opacity: 1; visibility: visible; }
    .spotText {
      max-height: 80vh; overflow-y: auto; padding: 40px;
      color: white; font-size: 2rem; border: none;
    }
  `;
  document.head.appendChild(style);

  function showBlurOverlay(Text) {
    const overlay = document.createElement('div');
    overlay.className = 'overlay-blur active';
    overlay.innerHTML = `<div class="spotText">${Text}</div>`;
    document.body.appendChild(overlay);
    overlay.querySelector('.spotText').focus();
  }

  const WORKER_SRC = `
    let canvas = null, ctx = null, dpr = 1;
    let curRect = null, curBR = 0;
    let ticker  = null;

    self.onmessage = ({ data: m }) => {
      switch (m.type) {

        case 'init':
          canvas = m.canvas;
          ctx    = canvas.getContext('2d');
          dpr    = m.dpr || 1;
          break;

        case 'resize':
          if (canvas) { canvas.width = m.w; canvas.height = m.h; repaint(); }
          break;

       
        case 'start':
          curRect = m.rect;
          curBR   = m.br || 0;
          repaint();
          if (!ticker) ticker = setInterval(() => self.postMessage({ type: 'tick' }), 33);
          break;

        case 'update':
          curRect = m.rect;
          curBR   = m.br || 0;
          repaint();
          break;

        case 'stop':
          clearInterval(ticker); ticker = null;
          curRect = null;
          if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
          break;

        case 'nav': {
          const idx = scoreNav(m.rects, m.active, m.dir);
          self.postMessage({ type: 'nav-result', idx });
          break;
        }
      }
    };


    function repaint() {
      if (!ctx || !curRect) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const pad = 5 * dpr;
      const x = curRect.left   * dpr - pad;
      const y = curRect.top    * dpr - pad;
      const w = curRect.width  * dpr + pad * 2;
      const h = curRect.height * dpr + pad * 2;
      const r = Math.max(0, Math.min(curBR * dpr, w / 2, h / 2));

      ctx.save();

      strokeRing(
        x - 2*dpr, y - 2*dpr, w + 4*dpr, h + 4*dpr, r + 2*dpr,
        'rgba(255,255,255,0.15)', 6 * dpr,
        'rgba(255,255,255,0.25)', 20 * dpr
      );

      strokeRing(
        x, y, w, h, r,
        'rgba(255,255,255,0.9)', 2 * dpr,
        'transparent', 0
      );

      ctx.restore();
    }

    function strokeRing(x, y, w, h, r, color, lw, shadowColor, shadowBlur) {
      ctx.beginPath();
      if (r <= 0) {
        ctx.rect(x, y, w, h);
      } else {
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y,     x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x,     y + h, x,     y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x,     y,     x + r, y);
        ctx.closePath();
      }
      ctx.strokeStyle = color;
      ctx.lineWidth   = lw;
      ctx.shadowColor = shadowColor;
      ctx.shadowBlur  = shadowBlur;
      ctx.stroke();
    }


    function scoreNav(rects, active, dir) {
      const aCX = active.left + active.width  / 2;
      const aCY = active.top  + active.height / 2;
      const isH = dir === 'ArrowLeft' || dir === 'ArrowRight';
      const hits = [];

      for (let i = 0; i < rects.length; i++) {
        const cs = rects[i];
        const dx = (cs.left + cs.width  / 2) - aCX;
        const dy = (cs.top  + cs.height / 2) - aCY;

        const ok = dir === 'ArrowLeft'  ? dx < 0
                 : dir === 'ArrowRight' ? dx > 0
                 : dir === 'ArrowUp'    ? dy < 0
                 : dir === 'ArrowDown'  ? dy > 0
                 : false;
        if (!ok) continue;

        const axial   = isH ? Math.abs(dx) : Math.abs(dy);
        const perp    = isH ? Math.abs(dy) : Math.abs(dx);
        const overlap = isH
          ? Math.max(0, Math.min(active.bottom, cs.bottom) - Math.max(active.top,  cs.top))
          : Math.max(0, Math.min(active.right,  cs.right)  - Math.max(active.left, cs.left));

        hits.push({ i, axial, score: axial + perp * 2, overlap });
      }

      if (!hits.length) return -1;
      const aligned = hits.filter(x => x.overlap > 0);
      const pool    = aligned.length ? aligned : hits;
      pool.sort((a, b) => aligned.length ? a.axial - b.axial : a.score - b.score);
      return pool[0].i;
    }
  `;

  const worker = new Worker(
    URL.createObjectURL(new Blob([WORKER_SRC], { type: 'application/javascript' }))
  );


  const focusCanvas = document.createElement('canvas');
  const DPR = window.devicePixelRatio || 1;
  focusCanvas.width  = innerWidth  * DPR;
  focusCanvas.height = innerHeight * DPR;
  Object.assign(focusCanvas.style, {
    position: 'fixed', top: '0', left: '0',
    width: '100vw', height: '100vh',
    pointerEvents: 'none', zIndex: '99999',
  });
  document.body.appendChild(focusCanvas);

  const offscreen = focusCanvas.transferControlToOffscreen();
  worker.postMessage({ type: 'init', canvas: offscreen, dpr: DPR }, [offscreen]);

  window.addEventListener('resize', () => {
    const d = window.devicePixelRatio || 1;
    worker.postMessage({ type: 'resize', w: innerWidth * d, h: innerHeight * d });
  });


  function plainRect(cs) {
    return { top: cs.top, left: cs.left, bottom: cs.bottom,
             right: cs.right, width: cs.width, height: cs.height };
  }
  function elBR(el) { return parseFloat(getComputedStyle(el).borderRadius) || 0; }

  function ringStart(el) {
    worker.postMessage({ type: 'start', rect: plainRect(el.getBoundingClientRect()), br: elBR(el) });
  }
  function ringStop() { worker.postMessage({ type: 'stop' }); }

  let activeDetail = {
    e:  document.querySelector('.action-bar > a'),
    cs: document.querySelector('.action-bar > a').getBoundingClientRect(),
  };
  ringStart(activeDetail.e);
  let stop       = false;
  let navPending = false;  
  let _navResolve = null;

  worker.onmessage = ({ data: m }) => {

    if (m.type === 'tick' && activeDetail?.e) {
      worker.postMessage({
        type: 'update',
        rect: plainRect(activeDetail.e.getBoundingClientRect()),
        br:   elBR(activeDetail.e),
      });
    }

    if (m.type === 'nav-result' && _navResolve) {
      _navResolve(m.idx);
      _navResolve = null;
    }
  };

  function askNav(rects, active, dir) {
    return new Promise(resolve => {
      _navResolve = resolve;
      worker.postMessage({ type: 'nav', rects, active, dir });
    });
  }


  async function keyF(e) {
    if (!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Enter','Escape'].includes(e.key)) return;

    if (e.key === 'Escape') {
      const overlay = document.querySelector('.overlay-blur');
      if (overlay) {
        e.preventDefault();
        e.stopImmediatePropagation();
        overlay.classList.remove('active');
        stop = false;
        ringStart(activeDetail.e);
        setTimeout(() => overlay.remove(), 300);
      }
      return;
    }

    if (stop) return;
    e.preventDefault();
    e.stopImmediatePropagation();

    if (e.key === 'Enter') {
      if (activeDetail.e._ytVideoId) { sendYouTubeToJava(activeDetail.e._ytVideoId); return; }
      if (activeDetail.e.classList?.contains('news-content')) {
        ringStop();
        showBlurOverlay(activeDetail.e.innerText);
        stop = true;
        return;
      }
      activeDetail.e.click();
      return;
    }

    if (navPending) return;
    navPending = true;

    try {
      const activeRect = activeDetail.e.getBoundingClientRect();

      const elements = Array.from(document.querySelectorAll(
        '.video-seo-panel,.prediction-result-wrap,.mobile-single-title, .match-teams-rank, .news-content, a[href], button:not([disabled]), input:not([disabled]),' +
        ' select:not([disabled]), textarea:not([disabled]),' +
        ' iframe[src*="youtube.com/embed"], iframe[src*="youtube-nocookie.com/embed"],' +
        ' [contenteditable="true"], summary, video'
      )).filter(x => {
        if (x === activeDetail.e) return false;
        return x.checkVisibility
          ? x.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })
          : x.offsetWidth > 0 && x.offsetHeight > 0;
      });

      if (!elements.length) return;

    
      const rects = elements.map(x => plainRect(x.getBoundingClientRect()));

      const idx = await askNav(rects, plainRect(activeRect), e.key);
      if (idx === -1) return;

      activeDetail = { e: elements[idx], cs: rects[idx] };
      activeDetail.e.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });



    } finally {
      navPending = false;
    }
  }

  document.addEventListener('keydown', keyF);

  function getYouTubeVideoId(src) {
    try {
      const u = new URL(src, location.href);
      if (u.searchParams.has('v'))          return u.searchParams.get('v');
      if (u.hostname.includes('youtu.be'))  return u.pathname.slice(1);
      let m = u.pathname.match(/\/embed\/([^/?]+)/);
      if (m) return m[1];
      m = u.pathname.match(/\/shorts\/([^/?]+)/);
      if (m) return m[1];
      return null;
    } catch { return null; }
  }

  function sendYouTubeToJava(videoId) {
    try {
      if (window.Android && typeof Android.openYouTubeTv === 'function')
        Android.openYouTubeTv(String(videoId));
    } catch (e) {}
  }

  function setupYouTubeIframes() {
    document.querySelectorAll('.google-auto-placed').forEach(e => { if (e) e.remove(); });
    document.querySelectorAll(
      'iframe[src*="youtube.com/embed"], iframe[src*="youtube-nocookie.com/embed"], a[href*="youtube.com"]'
    ).forEach(iframe => {
      if (iframe._ytTVReady) return;
      iframe._ytTVReady = true;
      const videoId = iframe.tagName === 'A'
        ? getYouTubeVideoId(iframe.href)
        : getYouTubeVideoId(iframe.src);
      iframe._ytVideoId = videoId;
      iframe.setAttribute('tabindex', '0');
      iframe.addEventListener('click', ev => {
        if (!iframe._ytVideoId) return;
        ev.preventDefault();
        ev.stopPropagation();
        sendYouTubeToJava(iframe._ytVideoId);
      }, true);
    });
  }
  setupYouTubeIframes();
  new MutationObserver(setupYouTubeIframes).observe(document.body, { childList: true, subtree: true });

  setTimeout(() => {
    const dark = document.querySelector('#dark_theme');
    if (dark && !dark.checked) dark.click();
  }, 8000);

})();
