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

    #tv-focus-ring {
      position: fixed;
      pointer-events: none;
      z-index: 2147483647;
      box-sizing: border-box;
      border: 2px solid rgba(255,255,255,0.88);
      box-shadow:
        0 0 0 3px  rgba(30,140,255,0.85),
        0 0 14px 4px rgba(30,140,255,0.55),
        0 0 40px 10px rgba(30,140,255,0.25);
      opacity: 0;
      transition:
        left   .14s cubic-bezier(.25,.46,.45,.94),
        top    .14s cubic-bezier(.25,.46,.45,.94),
        width  .14s cubic-bezier(.25,.46,.45,.94),
        height .14s cubic-bezier(.25,.46,.45,.94),
        border-radius .14s ease,
        opacity .12s ease;
      animation: tvRingPulse 2s infinite ease-in-out;
    }
    #tv-focus-ring.visible { opacity: 1; }

    @keyframes tvRingPulse {
      0%,100% {
        box-shadow:
          0 0 0 3px  rgba(30,140,255,.80),
          0 0 12px 3px  rgba(30,140,255,.45),
          0 0 32px 8px  rgba(30,140,255,.20);
      }
      50% {
        box-shadow:
          0 0 0 3px  rgba(30,140,255,1),
          0 0 20px 6px  rgba(30,140,255,.70),
          0 0 55px 14px rgba(30,140,255,.35),
          0 0 80px 20px rgba(60,160,255,.15);
      }
    }
  `;
  document.head.appendChild(style);

  const focusRing = document.createElement("div");
  focusRing.id = "tv-focus-ring";
  document.body.appendChild(focusRing);
  const RING_PAD = 5;

  function updateRing(el) {
    if (!el) {
      focusRing.classList.remove("visible");
      return;
    }
    const rect = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    const radii = [
      cs.borderTopLeftRadius,
      cs.borderTopRightRadius,
      cs.borderBottomRightRadius,
      cs.borderBottomLeftRadius
    ].map(r => r.endsWith("%") ? r : `${parseFloat(r) + RING_PAD}px`);

    focusRing.style.left = `${rect.left - RING_PAD}px`;
    focusRing.style.top = `${rect.top - RING_PAD}px`;
    focusRing.style.width = `${rect.width + RING_PAD * 2}px`;
    focusRing.style.height = `${rect.height + RING_PAD * 2}px`;
    focusRing.style.borderRadius = radii.join(" ");
    focusRing.classList.add("visible");
  }

  const STATE = { current: null };

  function isVisible(el) {
    if (!el || el.nodeType !== 1 || !el.isConnected) return false;
    const s = getComputedStyle(el);
    if (s.display === "none" || s.visibility === "hidden" || s.opacity === "0") return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  }

  function scrollToElement(el) {
    const rect = el.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const margin = 100;

    let scrollY = 0;
    let scrollX = 0;

    if (rect.top < margin) {
      scrollY = rect.top - margin;
    } else if (rect.bottom > vh - margin) {
      scrollY = rect.bottom - vh + margin;
    }

    if (rect.left < margin) {
      scrollX = rect.left - margin;
    } else if (rect.right > vw - margin) {
      scrollX = rect.right - vw + margin;
    }

    if (scrollY !== 0 || scrollX !== 0) {
      window.scrollBy({ top: scrollY, left: scrollX, behavior: "instant" });
    }
  }

  function focusElement(el) {
    if (!el) return;
    if (STATE.current && STATE.current !== el) {
      STATE.current.classList.remove("tv-focus");
    }

    el.classList.add("tv-focus");
    el.focus?.({ preventScroll: true });
    STATE.current = el;

    scrollToElement(el);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => updateRing(STATE.current));
    });
  }

  let ringRafPending = false;
  window.addEventListener('scroll', () => {
    if (!ringRafPending) {
      ringRafPending = true;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          updateRing(STATE.current);
          ringRafPending = false;
        });
      });
    }
  }, { passive: true, capture: true });

  function getYouTubeVideoId(src) {
    try {
      const u = new URL(src, location.href);
      const m = u.pathname.match(/\/embed\/([^/?]+)/);
      return m ? m[1] : null;
    } catch (e) {
      return null;
    }
  }

  function sendYouTubeToJava(videoId) {
    try {
      if (window.Android && typeof Android.openYouTubeTv === "function") {
        Android.openYouTubeTv(String(videoId));
      }
    } catch (e) {}
  }

  function setupYouTubeIframes() {
    document.querySelectorAll(
      'iframe[src*="youtube.com/embed"], iframe[src*="youtube-nocookie.com/embed"]'
    ).forEach(iframe => {
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

  function bestVisibleFocusables() {
    const SELECTOR = `
      a[href],
      button:not([disabled]),
      input:not([disabled]),
      select:not([disabled]),
      textarea:not([disabled]),
      iframe[src*="youtube.com/embed"],
      iframe[src*="youtube-nocookie.com/embed"],
      [tabindex]:not([tabindex="-1"]),
      [contenteditable="true"],
      summary,
      video
    `;

    return [...document.querySelectorAll(SELECTOR)]
      .filter(isVisible)
      .map(el => {
        const r = el.getBoundingClientRect();
        return {
          el,
          left: r.left, right: r.right,
          top: r.top, bottom: r.bottom,
          cx: (r.left + r.right) / 2,
          cy: (r.top + r.bottom) / 2,
          width: r.width,
          height: r.height
        };
      });
  }

  function overlap1D(a1, a2, b1, b2) {
    return Math.max(0, Math.min(a2, b2) - Math.max(a1, b1));
  }

  function centerDistance(a, b) {
    return Math.hypot(b.cx - a.cx, b.cy - a.cy);
  }

  function bestInDirection(active, nodes, dir) {
    let best = null, bestScore = Infinity;

    for (const cand of nodes) {
      if (cand.el === active.el) continue;

      let primary = 0, secondary = 0, align = 0, valid = false;

      if (dir === "right") {
        if (cand.left < active.right) continue;
        valid = true;
        primary = cand.left - active.right;
        secondary = Math.abs(cand.cy - active.cy);
        align = overlap1D(active.top, active.bottom, cand.top, cand.bottom);
      } else if (dir === "left") {
        if (cand.right > active.left) continue;
        valid = true;
        primary = active.left - cand.right;
        secondary = Math.abs(cand.cy - active.cy);
        align = overlap1D(active.top, active.bottom, cand.top, cand.bottom);
      } else if (dir === "down") {
        if (cand.top < active.bottom) continue;
        valid = true;
        primary = cand.top - active.bottom;
        secondary = Math.abs(cand.cx - active.cx);
        align = overlap1D(active.left, active.right, cand.left, cand.right);
      } else if (dir === "up") {
        if (cand.bottom > active.top) continue;
        valid = true;
        primary = active.top - cand.bottom;
        secondary = Math.abs(cand.cx - active.cx);
        align = overlap1D(active.left, active.right, cand.left, cand.right);
      }

      if (!valid) continue;

      const alignRatio = (dir === "left" || dir === "right")
        ? align / Math.max(1, active.height)
        : align / Math.max(1, active.width);

      const score =
        (alignRatio > 0 ? 0 : 100000) +
        primary * 10 +
        secondary * 2 +
        centerDistance(active, cand) * 0.05;

      if (score < bestScore) {
        bestScore = score;
        best = cand;
      }
    }

    return best?.el || null;
  }

  function syncCurrent() {
    const nodes = bestVisibleFocusables();
    if (!nodes.length) {
      STATE.current = null;
      return null;
    }

    const active = document.activeElement;
    const activeNode = nodes.find(n => n.el === active);
    if (activeNode) {
      STATE.current = activeNode.el;
      return activeNode.el;
    }

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

    if (!currentNode) {
      focusElement(nodes[0].el);
      return;
    }

    let next = bestInDirection(currentNode, nodes, dir);

    if (!next) {
      const scrollAmount = 500;
      if (dir === "down")  window.scrollBy({ top:  scrollAmount, behavior: "smooth" });
      if (dir === "up")    window.scrollBy({ top: -scrollAmount, behavior: "smooth" });
      if (dir === "right") window.scrollBy({ left:  scrollAmount, behavior: "smooth" });
      if (dir === "left")  window.scrollBy({ left: -scrollAmount, behavior: "smooth" });

      const nodes2 = bestVisibleFocusables();
      currentNode = nodes2.find(n => n.el === STATE.current)
                 || nodes2.find(n => n.el === document.activeElement)
                 || null;

      if (currentNode) next = bestInDirection(currentNode, nodes2, dir);
    }

    if (next) focusElement(next);
  }

  setupYouTubeIframes();
  new MutationObserver(setupYouTubeIframes)
    .observe(document.body, { childList: true, subtree: true });

  document.addEventListener("keydown", (e) => {
    e.preventDefault();
    e.stopImmediatePropagation();

    if (e.key === "Enter") {
      const cur = STATE.current || document.activeElement;
      if (cur && cur._ytVideoId) {
        sendYouTubeToJava(cur._ytVideoId);
        return;
      }
      cur?.click?.();
      return;
    }

    const map = {
      ArrowRight: "right",
      ArrowLeft: "left",
      ArrowUp: "up",
      ArrowDown: "down"
    };

    const dir = map[e.key];
    if (dir) move(dir);
  }, true);

  document.addEventListener("focusin", (e) => {
    if (e.target?.nodeType === 1 && isVisible(e.target)) {
      STATE.current = e.target;
    }
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) focusRing.classList.remove("visible");
  });

  window.tvNav = { bestVisibleFocusables, move, syncCurrent, state: STATE };

  setTimeout(() => {
    let dark = document.querySelector("#dark_theme");
    if (dark && !dark.checked) dark.click();
  }, 8000);

})();
