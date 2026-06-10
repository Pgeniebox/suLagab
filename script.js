

(function () {

  // ── Page cleanup ──────────────────────────────────────────────────────────
  document.querySelector("header")?.remove();
  document.querySelector(".download-app-section")?.remove();
  document.querySelector("footer")?.remove();

  const ab = document.querySelector('.action-bar');
  ab.style.display = 'grid';
  ab.style.maxWidth = 'fit-content';
  ab.style.minHeight = 'stretch';
  document.body.style.setProperty('padding-left', String(ab.getBoundingClientRect().width) + 'px', 'important');
  document.body.style.setProperty('padding-top', '50px', 'important');
  document.body.style.setProperty('padding-bottom', '50px', 'important');

  // ── Ad removal ────────────────────────────────────────────────────────────
  const adObserver = new MutationObserver((mutations) => {
    for (const m of mutations)
      for (const node of m.addedNodes)
        if (node.classList?.contains("google-auto-placed")) node.remove();
  });
  adObserver.observe(document.body, { childList: true, subtree: true });

  // ── Styles ────────────────────────────────────────────────────────────────
  const style = document.createElement("style");
  style.textContent = `
    *::-webkit-scrollbar { display: none !important; width: 0; height: 0; }
    *:focus { outline: none; }
    .tv-focus { position: relative; z-index: 20; }

    /* Steam-like navigation ring — lives on body, never clipped */
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

    /* ── YouTube TV overlay — fixed on body, synced to the iframe position ── */
    .yt-tv-overlay {
      position: fixed;
      z-index: 9999;
      box-sizing: border-box;
      outline: none;
      background: transparent;
      cursor: pointer;
    }

    /* "Press ENTER" hint — visible when overlay is focused, not in player mode */
    .yt-tv-enter-hint {
      position: absolute;
      bottom: 14px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0,0,0,0.80);
      color: #fff;
      padding: 8px 20px;
      border-radius: 24px;
      font: 600 13px/1 sans-serif;
      white-space: nowrap;
      pointer-events: none;
      opacity: 0;
      transition: opacity .2s;
    }
    .yt-tv-overlay.focused .yt-tv-enter-hint     { opacity: 1; }
    .yt-tv-overlay.player-active .yt-tv-enter-hint { opacity: 0 !important; }

    /* HUD bar at the bottom of the video */
    .yt-tv-hud {
      position: absolute;
      bottom: 0; left: 0; right: 0;
      padding: 60px 18px 16px;
      background: linear-gradient(transparent, rgba(0,0,0,0.92));
      color: #fff;
      font-family: sans-serif;
      pointer-events: none;
      opacity: 0;
      transition: opacity .25s;
      border-radius: 0 0 4px 4px;
    }
    .yt-tv-overlay.player-active .yt-tv-hud { opacity: 1; }

    .yt-tv-seekbar {
      position: relative;
      height: 4px;
      background: rgba(255,255,255,0.28);
      border-radius: 2px;
      margin-bottom: 12px;
    }
    .yt-tv-seekbar-fill {
      position: absolute;
      left: 0; top: 0; bottom: 0;
      background: #1e8cff;
      border-radius: 2px;
      width: 0%;
      transition: width .4s linear;
    }
    .yt-tv-seekbar-thumb {
      position: absolute;
      width: 13px; height: 13px;
      background: #fff;
      border-radius: 50%;
      top: 50%; transform: translate(-50%, -50%);
      left: 0%;
      box-shadow: 0 0 6px rgba(30,140,255,.9);
      transition: left .4s linear;
    }
    .yt-tv-hud-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;
    }
    .yt-tv-playpause { font-size: 24px; line-height: 1; }
    .yt-tv-time      { font-size: 15px; font-weight: 600; letter-spacing: .02em; }
    .yt-tv-vol       { font-size: 14px; opacity: .85; }
    .yt-tv-hints {
      display: flex; gap: 16px;
      font-size: 11px; opacity: .60;
      justify-content: center; flex-wrap: wrap;
    }
    .yt-tv-hints span { white-space: nowrap; }

    /* Flash feedback (seek / volume) */
    .yt-tv-flash {
      position: absolute;
      top: 50%; left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0,0,0,0.72);
      color: #fff;
      font: 700 26px/1 sans-serif;
      padding: 14px 28px;
      border-radius: 16px;
      pointer-events: none;
      opacity: 0;
      transition: opacity .15s;
      white-space: nowrap;
    }
    .yt-tv-flash.show { opacity: 1; }
  `;
  document.head.appendChild(style);

  // ── Focus ring ────────────────────────────────────────────────────────────
  const focusRing = document.createElement("div");
  focusRing.id = "tv-focus-ring";
  document.body.appendChild(focusRing);
  const RING_PAD = 5;

  function updateRing(el) {
    if (!el) { focusRing.classList.remove("visible"); return; }
    const rect  = el.getBoundingClientRect();
    const cs    = getComputedStyle(el);
    const radii = [
      cs.borderTopLeftRadius,     cs.borderTopRightRadius,
      cs.borderBottomRightRadius, cs.borderBottomLeftRadius
    ].map(r => r.endsWith("%") ? r : `${parseFloat(r) + RING_PAD}px`);
    focusRing.style.left         = `${rect.left   - RING_PAD}px`;
    focusRing.style.top          = `${rect.top    - RING_PAD}px`;
    focusRing.style.width        = `${rect.width  + RING_PAD * 2}px`;
    focusRing.style.height       = `${rect.height + RING_PAD * 2}px`;
    focusRing.style.borderRadius = radii.join(" ");
    focusRing.classList.add("visible");
  }

  // ── Shared navigation state ───────────────────────────────────────────────
  const STATE = { current: null };

  function isVisible(el) {
    if (!el || el.nodeType !== 1 || !el.isConnected) return false;
    const s = getComputedStyle(el);
    if (s.display === "none" || s.visibility === "hidden" || s.opacity === "0") return false;
    // Note: we intentionally do NOT filter on pointerEvents so YouTube overlays
    // (which may have pointer-events adjustments) still appear in the nav list.
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  }

  function focusElement(el) {
    if (!el) return;
    if (STATE.current && STATE.current !== el) {
      STATE.current.classList.remove("tv-focus");
      // Remove focused class from YouTube overlays too
      STATE.current.classList.remove("focused");
    }
    el.classList.add("tv-focus");
    // Add focused class so YouTube enter-hint appears
    if (el._ytController) el.classList.add("focused");
    el.focus?.({ preventScroll: true });
    el.scrollIntoView({ block: "center", inline: "center" });
    STATE.current = el;
    requestAnimationFrame(() => updateRing(el));
  }

  // ── YouTube TV Controller ─────────────────────────────────────────────────
  let activeYTCtrl = null;
  const allYTControllers = [];

  function fmtTime(s) {
    s = Math.floor(s || 0);
    const h  = Math.floor(s / 3600);
    const m  = Math.floor((s % 3600) / 60);
    const ss = String(s % 60).padStart(2, '0');
    return h > 0 ? `${h}:${String(m).padStart(2,'0')}:${ss}` : `${m}:${ss}`;
  }

  class YouTubeController {
    constructor(iframe) {
      this.iframe      = iframe;
      this.overlay     = null;
      this.hud         = null;
      this.flash       = null;
      this.isActive    = false;
      this.currentTime = 0;
      this.duration    = 0;
      this.paused      = true;
      this.volume      = 100;
      this._flashTimer = null;
      this._msgHandler = null;

      this._upgradeIframe();
      this._buildOverlay();      // overlay on body — iframe DOM is UNTOUCHED
      this._listenMessages();
      this._syncPosition();

      allYTControllers.push(this);
    }

    // Add enablejsapi=1 so postMessage commands work.
    // The iframe stays exactly where it is in the DOM — we never move or wrap it.
    _upgradeIframe() {
      try {
        const src = new URL(this.iframe.src, location.href);
        if (!src.searchParams.has('enablejsapi')) {
          src.searchParams.set('enablejsapi', '1');
          src.searchParams.set('origin', location.origin);
          this.iframe.src = src.toString();
        }
      } catch(e) {}
      // Exclude the raw iframe from TV nav — the overlay handles navigation
      this.iframe.setAttribute('tabindex', '-1');
    }

    // Build the overlay as a fixed-position div on <body>.
    // It floats above the iframe, sized and positioned via getBoundingClientRect.
    _buildOverlay() {
      this.overlay = document.createElement('div');
      this.overlay.className = 'yt-tv-overlay';
      this.overlay.setAttribute('tabindex', '0');
      this.overlay._ytController = this;

      // "Press ENTER" hint
      const hint = document.createElement('div');
      hint.className   = 'yt-tv-enter-hint';
      hint.textContent = '▶  Press ENTER to control';

      // HUD bar
      this.hud = document.createElement('div');
      this.hud.className = 'yt-tv-hud';
      this.hud.innerHTML = `
        <div class="yt-tv-seekbar">
          <div class="yt-tv-seekbar-fill"></div>
          <div class="yt-tv-seekbar-thumb"></div>
        </div>
        <div class="yt-tv-hud-row">
          <span class="yt-tv-playpause">▶</span>
          <span class="yt-tv-time">0:00 / 0:00</span>
          <span class="yt-tv-vol">🔊 100%</span>
        </div>
        <div class="yt-tv-hints">
          <span>← −10s</span>
          <span>ENTER  Play/Pause</span>
          <span>+10s →</span>
          <span>↑ Vol+</span>
          <span>↓ Vol−</span>
          <span>ESC  Exit</span>
        </div>
      `;

      // Flash feedback
      this.flash = document.createElement('div');
      this.flash.className = 'yt-tv-flash';

      this.overlay.appendChild(hint);
      this.overlay.appendChild(this.hud);
      this.overlay.appendChild(this.flash);

      // Appended to body — completely outside the iframe's DOM tree
      document.body.appendChild(this.overlay);
    }

    // Keep the fixed overlay positioned directly over the iframe.
    _syncPosition() {
      const rect = this.iframe.getBoundingClientRect();
      // If iframe isn't rendered yet, skip
      if (rect.width === 0 || rect.height === 0) return;
      this.overlay.style.left   = `${rect.left}px`;
      this.overlay.style.top    = `${rect.top}px`;
      this.overlay.style.width  = `${rect.width}px`;
      this.overlay.style.height = `${rect.height}px`;
    }

    _send(func, args = []) {
      try {
        this.iframe.contentWindow?.postMessage(
          JSON.stringify({ event: 'command', func, args }), '*'
        );
      } catch(e) {}
    }

    _listenMessages() {
      this._msgHandler = (e) => {
        if (e.source !== this.iframe.contentWindow) return;
        try {
          const data = JSON.parse(e.data);
          if (data.event === 'infoDelivery' && data.info) {
            const { currentTime, duration, playerState, volume } = data.info;
            if (currentTime !== undefined) this.currentTime = currentTime;
            if (duration    !== undefined) this.duration    = duration;
            if (playerState !== undefined) this.paused      = playerState !== 1;
            if (volume      !== undefined) this.volume      = volume;
            this._updateHUD();
          }
          if (data.event === 'onStateChange') {
            this.paused = data.info !== 1;
            this._updateHUD();
          }
        } catch(e) {}
      };
      window.addEventListener('message', this._msgHandler);
    }

    _updateHUD() {
      if (!this.hud) return;
      const fill  = this.hud.querySelector('.yt-tv-seekbar-fill');
      const thumb = this.hud.querySelector('.yt-tv-seekbar-thumb');
      const time  = this.hud.querySelector('.yt-tv-time');
      const pp    = this.hud.querySelector('.yt-tv-playpause');
      const vol   = this.hud.querySelector('.yt-tv-vol');
      const pct   = this.duration > 0 ? (this.currentTime / this.duration * 100) : 0;
      fill.style.width   = `${pct}%`;
      thumb.style.left   = `${pct}%`;
      time.textContent   = `${fmtTime(this.currentTime)} / ${fmtTime(this.duration)}`;
      pp.textContent     = this.paused ? '▶' : '⏸';
      vol.textContent    = `🔊 ${Math.round(this.volume)}%`;
    }

    _showFlash(text) {
      this.flash.textContent = text;
      this.flash.classList.add('show');
      clearTimeout(this._flashTimer);
      this._flashTimer = setTimeout(() => this.flash.classList.remove('show'), 700);
    }

    activate() {
      this.isActive = true;
      this.overlay.classList.add('player-active');
      activeYTCtrl = this;
      this._send('addEventListener', ['onStateChange']);
    }

    deactivate() {
      this.isActive = false;
      this.overlay.classList.remove('player-active');
      if (activeYTCtrl === this) activeYTCtrl = null;
      // Return focus to the overlay so the user can navigate away normally
      focusElement(this.overlay);
    }

    handleKey(key) {
      switch (key) {
        case 'Enter':
          if (this.paused) { this._send('playVideo');  this._showFlash('▶'); }
          else             { this._send('pauseVideo'); this._showFlash('⏸'); }
          break;
        case 'ArrowLeft':
          this.currentTime = Math.max(0, this.currentTime - 10);
          this._send('seekTo', [this.currentTime, true]);
          this._updateHUD();
          this._showFlash('← −10s');
          break;
        case 'ArrowRight':
          this.currentTime = Math.min(this.duration || 999999, this.currentTime + 10);
          this._send('seekTo', [this.currentTime, true]);
          this._updateHUD();
          this._showFlash('+10s →');
          break;
        case 'ArrowUp':
          this.volume = Math.min(100, this.volume + 10);
          this._send('setVolume', [this.volume]);
          this._updateHUD();
          this._showFlash(`🔊 ${this.volume}%`);
          break;
        case 'ArrowDown':
          this.volume = Math.max(0, this.volume - 10);
          this._send('setVolume', [this.volume]);
          this._updateHUD();
          this._showFlash(`🔊 ${this.volume}%`);
          break;
      }
    }
  }

  // Re-sync all overlays on scroll or resize (overlays are fixed, iframes scroll)
  function syncAllOverlays() {
    for (const ctrl of allYTControllers) ctrl._syncPosition();
    // Also keep focus ring in sync if current element is a YouTube overlay
    if (STATE.current?._ytController) updateRing(STATE.current);
  }
  window.addEventListener('scroll', syncAllOverlays, { passive: true, capture: true });
  window.addEventListener('resize', syncAllOverlays, { passive: true });

  function setupYouTubeIframes() {
    document.querySelectorAll(
      'iframe[src*="youtube.com/embed"], iframe[src*="youtube-nocookie.com/embed"]'
    ).forEach(iframe => {
      if (iframe._ytTVReady) return;
      iframe._ytTVReady = true;
      new YouTubeController(iframe);
    });
  }

  setupYouTubeIframes();
  // Pick up iframes added later by the page
  const ytObserver = new MutationObserver(setupYouTubeIframes);
  ytObserver.observe(document.body, { childList: true, subtree: true });

  // ── TV Navigation ─────────────────────────────────────────────────────────
  (() => {
    const SELECTOR = `
      a[href],
      button:not([disabled]),
      input:not([disabled]),
      select:not([disabled]),
      textarea:not([disabled]),
      [tabindex]:not([tabindex="-1"]),
      [contenteditable="true"],
      summary,
      video
    `;

    function getFocusables() {
      return [...document.querySelectorAll(SELECTOR)]
        .filter(isVisible)
        .map(el => {
          const r = el.getBoundingClientRect();
          return {
            el,
            left: r.left, right: r.right,
            top: r.top,   bottom: r.bottom,
            cx: (r.left + r.right) / 2,
            cy: (r.top  + r.bottom) / 2,
            width: r.width, height: r.height
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
          primary   = cand.left - active.right;
          secondary = Math.abs(cand.cy - active.cy);
          align     = overlap1D(active.top, active.bottom, cand.top, cand.bottom);
        } else if (dir === "left") {
          if (cand.right > active.left) continue;
          valid = true;
          primary   = active.left - cand.right;
          secondary = Math.abs(cand.cy - active.cy);
          align     = overlap1D(active.top, active.bottom, cand.top, cand.bottom);
        } else if (dir === "down") {
          if (cand.top < active.bottom) continue;
          valid = true;
          primary   = cand.top - active.bottom;
          secondary = Math.abs(cand.cx - active.cx);
          align     = overlap1D(active.left, active.right, cand.left, cand.right);
        } else if (dir === "up") {
          if (cand.bottom > active.top) continue;
          valid = true;
          primary   = active.top - cand.bottom;
          secondary = Math.abs(cand.cx - active.cx);
          align     = overlap1D(active.left, active.right, cand.left, cand.right);
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

        if (score < bestScore) { bestScore = score; best = cand; }
      }

      return best?.el || null;
    }

    function syncCurrent() {
      const nodes = getFocusables();
      if (!nodes.length) { STATE.current = null; return null; }

      const active     = document.activeElement;
      const activeNode = nodes.find(n => n.el === active);
      if (activeNode) { STATE.current = activeNode.el; return activeNode.el; }

      if (STATE.current) {
        const cur = nodes.find(n => n.el === STATE.current);
        if (cur) return cur.el;
      }

      STATE.current = nodes[0].el;
      return STATE.current;
    }

    function move(dir) {
      const nodes = getFocusables();
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

        const nodes2  = getFocusables();
        currentNode   = nodes2.find(n => n.el === STATE.current)
                     || nodes2.find(n => n.el === document.activeElement)
                     || null;
        if (currentNode) next = bestInDirection(currentNode, nodes2, dir);
      }

      if (next) focusElement(next);
    }

    // ── Keyboard handler ───────────────────────────────────────────────────
    document.addEventListener("keydown", (e) => {
      e.preventDefault();
      e.stopImmediatePropagation();

      // YouTube player mode: all keys go to the active controller
      if (activeYTCtrl) {
        if (e.key === 'Escape') activeYTCtrl.deactivate();
        else                    activeYTCtrl.handleKey(e.key);
        return;
      }

      // Enter key
      if (e.key === 'Enter') {
        const cur = STATE.current;
        if (cur?._ytController) {
          // Focused element is a YouTube overlay → enter player mode
          cur._ytController.activate();
        } else {
          cur?.click();
        }
        return;
      }

      // Arrow keys: navigate
      const map = {
        ArrowRight: "right", ArrowLeft: "left",
        ArrowUp: "up",       ArrowDown: "down"
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

    window.tvNav = { getFocusables, move, syncCurrent, state: STATE };
  })();

})();
