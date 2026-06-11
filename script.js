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
  e.stopImmediatePropagation();
  activeDetail.cs = activeDetail.e.getBoundingClientRect();
  dbox = [];

  Array.from(document.querySelectorAll('a[href], button')).forEach(x => {
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
  setTimeout(() => {
    let dark = document.querySelector("#dark_theme");
    if (dark && !dark.checked) dark.click();
  }, 8000);

})();
