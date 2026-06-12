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
  let ticker = null;

  const state = {
    rect: null,      // cible actuelle
    from: null,      // ancienne position pour animer le déplacement
    br: 0,
    t: 0,
    navPulse: 0,     // pulse après navigation
    moveStart: 0,
    moveDur: 180
  };

  self.onmessage = ({ data: m }) => {
    switch (m.type) {
      case 'init':
        canvas = m.canvas;
        ctx = canvas.getContext('2d', { alpha: true, desynchronized: true });
        dpr = m.dpr || 1;
        break;

      case 'resize':
        if (canvas) {
          canvas.width = m.w;
          canvas.height = m.h;
          repaint();
        }
        break;

      case 'start':
        state.rect = cloneRect(m.rect);
        state.from = cloneRect(m.rect);
        state.br = m.br || 0;
        state.moveStart = performance.now();
        state.navPulse = 1;
        repaint();
        if (!ticker) ticker = setInterval(() => {
          state.t += 1 / 30;
          if (state.navPulse > 0) state.navPulse = Math.max(0, state.navPulse - 0.05);
          repaint();
          self.postMessage({ type: 'tick' });
        }, 33);
        break;

      case 'update':
        if (state.rect) state.from = cloneRect(state.rect);
        state.rect = cloneRect(m.rect);
        state.br = m.br || 0;
        state.moveStart = performance.now();
        state.navPulse = 1;
        repaint();
        break;

      case 'stop':
        clearInterval(ticker);
        ticker = null;
        state.rect = null;
        state.from = null;
        state.navPulse = 0;
        if (ctx && canvas) ctx.clearRect(0, 0, canvas.width, canvas.height);
        break;

      case 'nav': {
        const idx = scoreNav(m.rects, m.active, m.dir);
        self.postMessage({ type: 'nav-result', idx });
        break;
      }
    }
  };

  function repaint() {
    if (!ctx || !canvas || !state.rect) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const now = performance.now();
    const k = Math.min(1, (now - state.moveStart) / state.moveDur);
    const ease = easeOutCubic(k);

    const cur = state.from ? lerpRect(state.from, state.rect, ease) : state.rect;

    const pulse = 0.5 + 0.5 * Math.sin(state.t * 4.2);
    const navBoost = 1 + state.navPulse * 0.18;
    const pad = (6 + 4 * pulse) * dpr * navBoost;

    const x = cur.left * dpr - pad;
    const y = cur.top * dpr - pad;
    const w = cur.width * dpr + pad * 2;
    const h = cur.height * dpr + pad * 2;
    const r = Math.max(0, Math.min((state.br || 0) * dpr, w / 2, h / 2));

    ctx.save();

    // outer glow
    drawRoundedRect(
      x - 7 * dpr, y - 7 * dpr, w + 14 * dpr, h + 14 * dpr, r + 7 * dpr,
      'rgba(120,220,255,0.18)',
      (9 + pulse * 4) * dpr,
      'rgba(120,220,255,0.48)',
      (24 + pulse * 10) * dpr
    );

    // soft aura
    ctx.save();
    ctx.globalAlpha = 0.20 + pulse * 0.10;
    const aura = ctx.createRadialGradient(
      x + w / 2, y + h / 2, 0,
      x + w / 2, y + h / 2, Math.max(w, h) * 0.8
    );
    aura.addColorStop(0, 'rgba(255,255,255,0.12)');
    aura.addColorStop(0.45, 'rgba(90,220,255,0.10)');
    aura.addColorStop(1, 'rgba(90,220,255,0.00)');
    ctx.fillStyle = aura;
    fillRoundedRect(x, y, w, h, r);
    ctx.restore();

    // dashed pulse ring
    ctx.save();
    ctx.setLineDash([10 * dpr, 8 * dpr]);
    ctx.lineDashOffset = -state.t * 50 * dpr;
    drawRoundedRect(
      x - 2 * dpr, y - 2 * dpr, w + 4 * dpr, h + 4 * dpr, r + 2 * dpr,
      'rgba(255,255,255,0.34)',
      (2.2 + pulse * 1.2) * dpr,
      'rgba(255,255,255,0.22)',
      10 * dpr
    );
    ctx.restore();

    // main border
    const grad = ctx.createLinearGradient(x, y, x + w, y + h);
    grad.addColorStop(0.00, 'rgba(90,220,255,0.95)');
    grad.addColorStop(0.25, 'rgba(255,255,255,1.00)');
    grad.addColorStop(0.50, 'rgba(120,240,180,0.95)');
    grad.addColorStop(0.75, 'rgba(255,255,255,1.00)');
    grad.addColorStop(1.00, 'rgba(90,220,255,0.95)');

    drawRoundedRect(
      x, y, w, h, r,
      grad,
      (2.0 + pulse * 0.9) * dpr,
      'rgba(90,220,255,0.55)',
      (10 + pulse * 6) * dpr
    );

    // moving highlight sweep
    ctx.save();
    ctx.beginPath();
    clipRoundedRect(x, y, w, h, r);
    ctx.clip();

    const sx = x - w * 0.45 + (w * 1.9) * ((Math.sin(state.t * 0.9) + 1) / 2);
    const sweep = ctx.createLinearGradient(sx - 70 * dpr, y, sx + 70 * dpr, y + h);
    sweep.addColorStop(0, 'rgba(255,255,255,0.00)');
    sweep.addColorStop(0.5, 'rgba(255,255,255,0.40)');
    sweep.addColorStop(1, 'rgba(255,255,255,0.00)');
    ctx.globalAlpha = 0.18 + pulse * 0.10;
    ctx.fillStyle = sweep;
    ctx.fillRect(x - 70 * dpr, y, w + 140 * dpr, h);
    ctx.restore();

    // corner sparks
    drawSpark(x, y, tSpark(state.t, 0), dpr);
    drawSpark(x + w, y, tSpark(state.t, 1), dpr);
    drawSpark(x + w, y + h, tSpark(state.t, 2), dpr);
    drawSpark(x, y + h, tSpark(state.t, 3), dpr);

    ctx.restore();
  }

  function drawRoundedRect(x, y, w, h, r, strokeStyle, lineWidth, shadowColor, shadowBlur) {
    ctx.beginPath();
    clipRoundedRect(x, y, w, h, r);
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = lineWidth;
    ctx.shadowColor = shadowColor;
    ctx.shadowBlur = shadowBlur;
    ctx.stroke();
  }

  function fillRoundedRect(x, y, w, h, r) {
    ctx.beginPath();
    clipRoundedRect(x, y, w, h, r);
    ctx.fill();
  }

  function clipRoundedRect(x, y, w, h, r) {
    if (r <= 0) {
      ctx.rect(x, y, w, h);
      return;
    }
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  function drawSpark(x, y, amp, dpr) {
    const size = (2 + amp * 2.8) * dpr;
    ctx.save();
    ctx.globalAlpha = 0.16 + amp * 0.24;
    ctx.fillStyle = 'rgba(255,255,255,1)';
    ctx.shadowColor = 'rgba(120,220,255,0.9)';
    ctx.shadowBlur = 14 * dpr;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function tSpark(t, index) {
    return 0.5 + 0.5 * Math.sin(t * 2.2 + index * 1.6);
  }

  function cloneRect(r) {
    if (!r) return null;
    return {
      left: r.left, top: r.top, right: r.right, bottom: r.bottom,
      width: r.width, height: r.height
    };
  }

  function lerpRect(a, b, k) {
    return {
      left: a.left + (b.left - a.left) * k,
      top: a.top + (b.top - a.top) * k,
      right: a.right + (b.right - a.right) * k,
      bottom: a.bottom + (b.bottom - a.bottom) * k,
      width: a.width + (b.width - a.width) * k,
      height: a.height + (b.height - a.height) * k
    };
  }

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
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

      const axial = isH ? Math.abs(dx) : Math.abs(dy);
      const perp = isH ? Math.abs(dy) : Math.abs(dx);
      const overlap = isH
        ? Math.max(0, Math.min(active.bottom, cs.bottom) - Math.max(active.top, cs.top))
        : Math.max(0, Math.min(active.right, cs.right) - Math.max(active.left, cs.left));

      hits.push({ i, axial, score: axial + perp * 2, overlap });
    }

    if (!hits.length) return -1;
    const aligned = hits.filter(x => x.overlap > 0);
    const pool = aligned.length ? aligned : hits;
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
        let selector = document;
    let checkSel = Array.from(document.querySelectorAll('.popup-item')).filter((x)=>{
   return x.checkVisibility
          ? x.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })
          : x.offsetWidth > 0 && x.offsetHeight > 0;
})[0];
      if(checkSel!==undefined){
       selector = checkSel;
}
      const elements = Array.from(selector.querySelectorAll(
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
activeDetail.e.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });


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
