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

  document.body.style.setProperty('padding-top', '50px', 'important');
  document.body.style.setProperty('padding-bottom', '50px', 'important');

  const adObserver = new MutationObserver((mutations) => {
    for (const m of mutations) {
      for (const node of m.addedNodes) {
        if (node.classList?.contains("google-auto-placed")) node.remove();
      }
    }
  });
  adObserver.observe(document.body, { childList: true, subtree: true });


  const style = document.createElement("style");
  style.textContent = `
    *::-webkit-scrollbar { display: none !important; width: 0; height: 0; }
    *:focus { outline: none; }
    .tv-focus { position: relative; z-index: 20; }
.overlay-blur {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  background: rgba(0, 0, 0, 0.3);
  z-index: 1000;

  opacity: 0;
  visibility: hidden;
  transition: opacity 0.3s ease, visibility 0.3s;

  box-sizing: border-box;
}

.overlay-blur.active {
  opacity: 1;
  visibility: visible;
}

.spotText {
  max-height: 80vh;
  overflow-y: auto;
  padding: 40px;
  color: white;
  font-size: 2rem;
}
  `;
  document.head.appendChild(style);
function showBlurOverlay(Text) {
  const overlay = document.createElement('div');
  overlay.className = 'overlay-blur active';

  overlay.innerHTML = `
    <div class="spotText">
      ${Text}
         </div>
  `;

  document.body.appendChild(overlay);

  focusElement(overlay.querySelector('.spotText'));
  overlay.querySelector('.spotText').focus();
}


  const rendererCode = `
   const raf = typeof requestAnimationFrame !== 'undefined'
    ? cb => requestAnimationFrame(cb)
    : cb => setTimeout(cb, 16);
    let canvas, ctx;
    let target = { x: 0, y: 0, w: 0, h: 0, radii: [0,0,0,0], visible: false };
    let current = { x: 0, y: 0, w: 0, h: 0, radii: [0,0,0,0], opacity: 0 };
    let width = 0, height = 0;

    function lerp(start, end, factor) {
      return start + (end - start) * factor;
    }

    function drawRoundRect(ctx, x, y, w, h, r) {
      ctx.beginPath();
      ctx.moveTo(x + r[0], y);
      ctx.lineTo(x + w - r[1], y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r[1]);
      ctx.lineTo(x + w, y + h - r[2]);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r[2], y + h);
      ctx.lineTo(x + r[3], y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r[3]);
      ctx.lineTo(x, y + r[0]);
      ctx.quadraticCurveTo(x, y, x + r[0], y);
      ctx.closePath();
    }

   let lastTime = 0;

    function loop(time) {
      if (!ctx) return raf(loop);
 const dt = Math.min((time - lastTime) / 1000, 0.05);
  lastTime = time;
     const speed = 1 - Math.pow(0.01, dt * 6);
      current.x = lerp(current.x, target.x, speed);
      current.y = lerp(current.y, target.y, speed);
      current.w = lerp(current.w, target.w, speed);
      current.h = lerp(current.h, target.h, speed);
      current.opacity = lerp(current.opacity, target.visible ? 1 : 0, speed);

      for(let i=0; i<4; i++) {
        current.radii[i] = lerp(current.radii[i], target.radii[i], speed);
      }

      ctx.clearRect(0, 0, width, height);

      if (current.opacity > 0.01) {
        const pulse = (Math.sin(time / 250) + 1) / 2;

        ctx.save();
        ctx.globalAlpha = current.opacity;

        // Beautiful tight neon glow profile
        const layers = [
          { width: 4,  alpha: lerp(0.5, 0.6, pulse) },
          { width: 10, alpha: lerp(0.3, 0.5, pulse) },
          { width: 20, alpha: lerp(0.08, 0.18, pulse) }
        ];

        drawRoundRect(ctx, current.x, current.y, current.w, current.h, current.radii);
        for (const layer of layers) {
          ctx.strokeStyle = \`rgba(30, 140, 255, \${layer.alpha})\`;
          ctx.lineWidth = layer.width;
          ctx.stroke();
        }

        // High contrast white core line
        drawRoundRect(ctx, current.x, current.y, current.w, current.h, current.radii);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.restore();
      }

      raf(loop);
    }

    function handleMessage(data) {
      if (data.type === 'INIT') {
        canvas = data.canvas;
        canvas.width = data.width;
        canvas.height = data.height;
        ctx = canvas.getContext('2d');
        //ctx.scale(data.dpr, data.dpr);
        width = data.width;
        height = data.height;
        raf(loop);
      } else if (data.type === 'UPDATE') {
        if (!target.visible && data.visible) {
           current.x = data.x;
           current.y = data.y;
           current.w = data.w;
           current.h = data.h;
           current.radii = [...data.radii];
        }
        target.x = data.x;
        target.y = data.y;
        target.w = data.w;
        target.h = data.h;
        target.radii = data.radii;
        target.visible = data.visible;
      } else if (data.type === 'RESIZE') {
        if(canvas) {
          canvas.width = data.width;
          canvas.height = data.height;
          width = data.width;
          height = data.height;
        }
      }
    }
  `;

  const canvasEl = document.createElement("canvas");
  canvasEl.id = "tv-focus-canvas";
  canvasEl.style.cssText = "position:fixed;top:0;left:0;width:100vw;height:100vh;pointer-events:none;z-index:2147483647;margin:0;padding:0;overflow:hidden;";
  document.documentElement.appendChild(canvasEl);

  let workerSystem;
  const w = window.innerWidth;
  const h = window.innerHeight;

  if ('OffscreenCanvas' in window && typeof canvasEl.transferControlToOffscreen === 'function') {
    const offscreen = canvasEl.transferControlToOffscreen();
    const blob = new Blob([rendererCode + `\n self.onmessage = e => handleMessage(e.data);`], { type: 'application/javascript' });
    workerSystem = new Worker(URL.createObjectURL(blob));
      const dpr = window.devicePixelRatio || 1;
    workerSystem.postMessage({ type: 'INIT', canvas: offscreen, width: w, height: h ,dpr}, [offscreen]);
  } else {
    canvasEl.width = w;
    canvasEl.height = h;
    const script = document.createElement('script');
    script.textContent = rendererCode + `\n window._tvCanvasHandle = handleMessage;`;
    document.body.appendChild(script);

    workerSystem = {
      postMessage: (data) => {
        if (window._tvCanvasHandle) window._tvCanvasHandle(data);
      }
    };
    workerSystem.postMessage({ type: 'INIT', canvas: canvasEl, width: w, height: h });
  }

  window.addEventListener('resize', () => {
    workerSystem.postMessage({ type: 'RESIZE', width: window.innerWidth, height: window.innerHeight });
  });

  const RING_PAD = 2;
  const STATE = { current: null };

  function updateRing(el) {
    if (!el) {
      workerSystem.postMessage({ type: 'UPDATE', visible: false });
      return;
    }

    const rect = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    const parseRad = (r, max) => r.endsWith('%') ? (parseFloat(r) / 100) * max : parseFloat(r);

    workerSystem.postMessage({
      type: 'UPDATE',
      visible: true,
      x: rect.left - RING_PAD,
      y: rect.top - RING_PAD,
      w: rect.width + RING_PAD * 2,
      h: rect.height + RING_PAD * 2,
      radii: [
        parseRad(cs.borderTopLeftRadius, rect.width) + RING_PAD,
        parseRad(cs.borderTopRightRadius, rect.width) + RING_PAD,
        parseRad(cs.borderBottomRightRadius, rect.width) + RING_PAD,
        parseRad(cs.borderBottomLeftRadius, rect.width) + RING_PAD
      ]
    });
  }

  function isVisible(el) {
    if (!el || el.nodeType !== 1 || !el.isConnected) return false;
    const s = getComputedStyle(el);
    if (s.display === "none" || s.visibility === "hidden" || s.opacity === "0") return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  }

  function scrollToElement(el) {
    if (!el) return;

    let parent = el.parentElement;
    while (parent && parent !== document.body && parent !== document.documentElement) {
      const style = window.getComputedStyle(parent);
      const overflowX = style.overflowX;
      const overflowY = style.overflowY;

      const isScrollableX = (overflowX === 'auto' || overflowX === 'scroll' || overflowX === 'hidden') && parent.scrollWidth > parent.clientWidth;
      const isScrollableY = (overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'hidden') && parent.scrollHeight > parent.clientHeight;

      if (isScrollableX || isScrollableY) {
        const pRect = parent.getBoundingClientRect();
        const eRect = el.getBoundingClientRect();

        if (isScrollableX) {
          if (eRect.right > pRect.right - 40) {
            parent.scrollLeft += (eRect.right - pRect.right + 40);
          } else if (eRect.left < pRect.left + 40) {
            parent.scrollLeft += (eRect.left - pRect.left - 40);
          }
        }

        if (isScrollableY) {
          if (eRect.bottom > pRect.bottom - 40) {
            parent.scrollTop += (eRect.bottom - pRect.bottom + 40);
          } else if (eRect.top < pRect.top + 40) {
            parent.scrollTop += (eRect.top - pRect.top - 40);
          }
        }
      }
      parent = parent.parentElement;
    }

    const rect = el.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const margin = 100;
    let scrollY = 0, scrollX = 0;

    if (rect.top < margin) scrollY = rect.top - margin;
    else if (rect.bottom > vh - margin) scrollY = rect.bottom - vh + margin;

    if (rect.left < margin) scrollX = rect.left - margin;
    else if (rect.right > vw - margin) scrollX = rect.right - vw + margin;

    if (scrollY !== 0 || scrollX !== 0) {
      window.scrollBy({ top: scrollY, left: scrollX, behavior: "instant" });
    }
  }

  function focusElement(el) {
    if (!el) return;
    if (STATE.current && STATE.current !== el) STATE.current.classList.remove("tv-focus");

    el.classList.add("tv-focus");
    STATE.current = el;

    scrollToElement(el);
    requestAnimationFrame(() => requestAnimationFrame(() => updateRing(STATE.current)));
  }

  let ringRafPending = false;
  window.addEventListener('scroll', () => {
    if (!ringRafPending) {
      ringRafPending = true;
      requestAnimationFrame(() => {
        updateRing(STATE.current);
        ringRafPending = false;
      });
    }
  }, { passive: true, capture: true });

  function getYouTubeVideoId(src) {
    try {
      const u = new URL(src, location.href);
      const m = u.pathname.match(/\/embed\/([^/?]+)/);
      return m ? m[1] : null;
    } catch (e) { return null; }
  }

  function sendYouTubeToJava(videoId) {
    try {
      if (window.Android && typeof Android.openYouTubeTv === "function") Android.openYouTubeTv(String(videoId));
    } catch (e) {}
  }

  function setupYouTubeIframes() {
    document.querySelectorAll('iframe[src*="youtube.com/embed"], iframe[src*="youtube-nocookie.com/embed"]').forEach(iframe => {
      if (iframe._ytTVReady) return;
      iframe._ytTVReady = true;
      const videoId = getYouTubeVideoId(iframe.src);
      iframe._ytVideoId = videoId;
      iframe.setAttribute("tabindex", "0");
      iframe.addEventListener("click", (e) => {
        if (!iframe._ytVideoId) return;
        e.preventDefault();
        e.stopPropagation();
        sendYouTubeToJava(iframe._ytVideoId);
      }, true);
    });
  }
let _nodeCache = null;

const _cacheInvalidator = new MutationObserver(() => { _nodeCache = null; });
_cacheInvalidator.observe(document.body, { childList: true, subtree: true });
window.addEventListener('scroll', () => { _nodeCache = null; }, { passive: true, capture: true });

  function bestVisibleFocusables() {
    const SELECTOR = `.news-content, a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), iframe[src*="youtube.com/embed"], iframe[src*="youtube-nocookie.com/embed"], [tabindex]:not([tabindex="-1"]), [contenteditable="true"], summary, video`;

      if (_nodeCache) return _nodeCache;
  _nodeCache = [...document.querySelectorAll(SELECTOR)]
    .filter(isVisible)
    .map(el => {
      const r = el.getBoundingClientRect();
      return { el, left: r.left, right: r.right, top: r.top, bottom: r.bottom,
               cx: (r.left + r.right) / 2, cy: (r.top + r.bottom) / 2,
               width: r.width, height: r.height };
    });
  return _nodeCache;
  }

  function overlap1D(a1, a2, b1, b2) { return Math.max(0, Math.min(a2, b2) - Math.max(a1, b1)); }
  function centerDistance(a, b) { return Math.hypot(b.cx - a.cx, b.cy - a.cy); }
const SNAP = 6;
  function bestInDirection(active, nodes, dir) {
    let best = null, bestScore = Infinity;
   for (const cand of nodes) {
    if (cand.el === active.el) continue;
    let primary = 0, secondary = 0, align = 0, valid = false;

    if (dir === "right") {
      if (cand.left < active.right - SNAP) continue;
      valid = true;
      primary = Math.max(0, cand.left - active.right);
      secondary = Math.abs(cand.cy - active.cy);
      align = overlap1D(active.top, active.bottom, cand.top, cand.bottom);
    } else if (dir === "left") {
      if (cand.right > active.left + SNAP) continue;
      valid = true;
      primary = Math.max(0, active.left - cand.right);
      secondary = Math.abs(cand.cy - active.cy);
      align = overlap1D(active.top, active.bottom, cand.top, cand.bottom);
    } else if (dir === "down") {
      if (cand.top < active.bottom - SNAP) continue;
      valid = true;
      primary = Math.max(0, cand.top - active.bottom);
      secondary = Math.abs(cand.cx - active.cx);
      align = overlap1D(active.left, active.right, cand.left, cand.right);
    } else if (dir === "up") {
      if (cand.bottom > active.top + SNAP) continue;
      valid = true;
      primary = Math.max(0, active.top - cand.bottom);
      secondary = Math.abs(cand.cx - active.cx);
      align = overlap1D(active.left, active.right, cand.left, cand.right);
    }

      if (!valid) continue;

      const alignRatio = (dir === "left" || dir === "right") ? align / Math.max(1, active.height) : align / Math.max(1, active.width);
      const score = (alignRatio > 0 ? 0 : 100000) + primary * 10 + secondary * 2 + centerDistance(active, cand) * 0.05;

      if (score < bestScore) { bestScore = score; best = cand; }
    }
    return best?.el || null;
  }

  function syncCurrent() {
    const nodes = bestVisibleFocusables();
    if (!nodes.length) { STATE.current = null; return null; }
    const activeNode = nodes.find(n => n.el === document.activeElement);
    if (activeNode) { STATE.current = activeNode.el; return activeNode.el; }
    if (STATE.current) {
      const cur = nodes.find(n => n.el === STATE.current);
      if (cur) return cur.el;
    }
    STATE.current = nodes[0].el;
    return STATE.current;
  }

  function move(dir) {
    const nodes = bestVisibleFocusables();
    if (!nodes.length) return;
    const currentEl = syncCurrent();
    let currentNode = nodes.find(n => n.el === currentEl);
    if (!currentNode) { focusElement(nodes[0].el); return; }

    let next = bestInDirection(currentNode, nodes, dir);
    if (!next) {
      const scrollAmount = 500;
      if (dir === "down")  window.scrollBy({ top:  scrollAmount, behavior: "smooth" });
      if (dir === "up")    window.scrollBy({ top: -scrollAmount, behavior: "smooth" });
      if (dir === "right") window.scrollBy({ left:  scrollAmount, behavior: "smooth" });
      if (dir === "left")  window.scrollBy({ left: -scrollAmount, behavior: "smooth" });

      const nodes2 = bestVisibleFocusables();
      currentNode = nodes2.find(n => n.el === STATE.current) || nodes2.find(n => n.el === document.activeElement) || null;
      if (currentNode) next = bestInDirection(currentNode, nodes2, dir);
    }
    if (next) focusElement(next);
  }

  setupYouTubeIframes();
  new MutationObserver(setupYouTubeIframes).observe(document.body, { childList: true, subtree: true });
  let stop = false;
  document.addEventListener("keydown", (e) => {

        if(e.key === "Escape"){
            if(undefined!==document.querySelector('.overlay-blur')){
                   e.preventDefault();
    e.stopImmediatePropagation();
   document.querySelector('.overlay-blur').classList.remove('active');
                stop=false;
    setTimeout(() => document.querySelector('.overlay-blur').remove(), 300);
            }
    }
      if(stop)return
   e.preventDefault();
    e.stopImmediatePropagation();
    if (e.key === "Enter") {
      const cur = STATE.current || document.activeElement;
      if (cur && cur._ytVideoId) { sendYouTubeToJava(cur._ytVideoId); return; }
      cur?.click?.();
      if(cur.classList?.contains("news-content")){
          showBlurOverlay(cur.innerText);
          stop=true;
      }
      return;
    }

    const map = { ArrowRight: "right", ArrowLeft: "left", ArrowUp: "up", ArrowDown: "down" };
    const dir = map[e.key];
    if (dir) move(dir);
  }, true);

  document.addEventListener("focusin", (e) => {
    if (e.target?.nodeType === 1 && isVisible(e.target)) {
      STATE.current = e.target;
      requestAnimationFrame(() => updateRing(STATE.current));
    }
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) workerSystem.postMessage({ type: 'UPDATE', visible: false });
  });

  window.tvNav = { bestVisibleFocusables, move, syncCurrent, state: STATE };

  setTimeout(() => {
    let dark = document.querySelector("#dark_theme");
    if (dark && !dark.checked) dark.click();
  }, 8000);

})();
