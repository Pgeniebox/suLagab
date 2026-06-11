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

 const style = document.createElement("style");
  style.textContent = `
    *::-webkit-scrollbar { display: none !important; width: 0; height: 0; }

    `;
  document.head.appendChild(style);


const focusRing = document.createElement('div');
Object.assign(focusRing.style, {
  position:      'fixed',
  pointerEvents: 'none',
  zIndex:        '99999',
  boxSizing:     'border-box',
  opacity:       '0',
  transition:    [
    'top    0.18s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    'left   0.18s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    'width  0.18s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    'height 0.18s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    'opacity 0.15s ease',
  ].join(','),
});
document.body.appendChild(focusRing);

function moveFocusRing(cs, el) {
  const pad = 5;
  Object.assign(focusRing.style, {
    top:          (cs.top    - pad) + 'px',
    left:         (cs.left   - pad) + 'px',
    width:        (cs.width  + pad * 2) + 'px',
    height:       (cs.height + pad * 2) + 'px',
    borderRadius: getComputedStyle(el).borderRadius,
    boxShadow:    '0 0 0 2px rgba(255,255,255,0.9), 0 0 0 6px rgba(255,255,255,0.15), 0 0 20px 6px rgba(255,255,255,0.25)',
    opacity:      '1',
     // transition:'all 0s ease',
  });
}

let dbox = [];
let activeDetail = {
  e:  document.querySelector('.action-bar > a'),
  cs: document.querySelector('.action-bar > a').getBoundingClientRect()
};

focusRing.style.transition = 'none';
moveFocusRing(activeDetail.cs, activeDetail.e);
requestAnimationFrame(() => {
  focusRing.style.transition = '';
});

function checkPass(e, direction) {
  const cs = e.getBoundingClientRect();
  const activeCX = activeDetail.cs.x + activeDetail.cs.width  / 2;
  const activeCY = activeDetail.cs.y + activeDetail.cs.height / 2;
  const cx = cs.x + cs.width  / 2;
  const cy = cs.y + cs.height / 2;
  const dx = cx - activeCX;
  const dy = cy - activeCY;

  const isCandidate =
    direction === 'ArrowLeft'  ? dx < 0 :
    direction === 'ArrowRight' ? dx > 0 :
    direction === 'ArrowUp'    ? dy < 0 :
    direction === 'ArrowDown'  ? dy > 0 :
    false;

  if (!isCandidate) return;

  const isHorizontal = direction === 'ArrowLeft' || direction === 'ArrowRight';
  const axialDist = isHorizontal ? Math.abs(dx) : Math.abs(dy);
  const perpDist  = isHorizontal ? Math.abs(dy) : Math.abs(dx);

  const overlap = isHorizontal
    ? Math.max(0, Math.min(activeDetail.cs.bottom, cs.bottom) - Math.max(activeDetail.cs.top,  cs.top))
    : Math.max(0, Math.min(activeDetail.cs.right,  cs.right)  - Math.max(activeDetail.cs.left, cs.left));

  dbox.push({ e, cs, score: axialDist + perpDist * 2, overlap, axialDist });
}

function keyF(e) {
  if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return;
  e.preventDefault();

  activeDetail.cs = activeDetail.e.getBoundingClientRect();
  dbox = [];

  Array.from(document.querySelectorAll('.news-content, a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), iframe[src*="youtube.com/embed"], iframe[src*="youtube-nocookie.com/embed"], [contenteditable="true"], summary, video')).forEach(x => {
    if (x === activeDetail.e) return;
    const visible = x.checkVisibility
      ? x.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })
      : x.offsetWidth > 0 && x.offsetHeight > 0;
    if (visible) checkPass(x, e.key);
  });

  if (!dbox.length) return;

  const aligned = dbox.filter(x => x.overlap > 0);
  const pool    = aligned.length ? aligned : dbox;
  pool.sort((a, b) => aligned.length ? a.axialDist - b.axialDist : a.score - b.score);

  activeDetail = pool[0];

  activeDetail.e.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });

  setTimeout(() => {
    activeDetail.cs = activeDetail.e.getBoundingClientRect();
    moveFocusRing(activeDetail.cs, activeDetail.e);
  }, 80);
}

document.addEventListener('keydown', keyF);
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
    document.querySelectorAll(".google-auto-placed").forEach((e)=>{if(undefined!==e){e.remove()}});
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
  setupYouTubeIframes();
  new MutationObserver(setupYouTubeIframes).observe(document.body, { childList: true, subtree: true });

  setTimeout(() => {
    let dark = document.querySelector("#dark_theme");
    if (dark && !dark.checked) dark.click();
  }, 8000);

})();
