(() => {
  'use strict';
  const scene = document.querySelector('#chamber-scene');
  const toggle = document.querySelector('.depth-toggle');
  const card = document.querySelector('.card');
  const zones = [...scene.querySelectorAll('.depth-zone')];
  const mobile = matchMedia('(max-width: 600px), (pointer: coarse)');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  let enabled = !mobile.matches;
  let preference = null;
  let mounted = false;
  let layoutFrame = 0;
  let pointerListening = false;
  let lastPointerUpdate = 0;

  try {
    const saved = sessionStorage.getItem('chamber-3d');
    if (saved === 'on' || saved === 'off') {
      preference = saved === 'on';
      enabled = preference;
    }
  } catch { /* The switch also works when browser storage is unavailable. */ }

  const makeObject = (kind) => {
    const item = document.createElement('div');
    item.className = 'depth-item ' + kind;
    let object;
    if (kind === 'companion-cube') {
      object = '<div class="cube">' + ['front', 'back', 'right', 'left', 'top', 'bottom'].map(face =>
        '<div class="cube-face ' + face + '"><span class="cube-heart">&#9829;</span></div>'
      ).join('') + '</div><div class="object-shadow"></div>';
    } else if (kind.startsWith('portal-')) {
      object = '<div class="portal-plate"><div class="portal"></div></div>';
    } else if (kind === 'personality-core') {
      object = '<div class="core"><div class="core-shell"></div><div class="core-eye"></div></div>';
    } else {
      object = '<div class="tile"><span class="aperture-mark"></span><span class="tile-code">02</span></div>';
    }
    item.innerHTML = '<div class="depth-float"><div class="depth-parallax">' + object + '</div></div>';
    return item;
  };
  const mount = () => {
    if (mounted) return;
    const objects = [
      ['portal-blue', 'companion-cube'],
      ['personality-core', 'portal-orange'],
      ['chamber-tile'],
      ['chamber-tile']
    ];
    zones.forEach((zone, index) => objects[index].forEach(kind => zone.append(makeObject(kind))));
    mounted = true;
  };

  const place = (item, size, centerX, centerY, phase) => {
    item.style.setProperty('--size', size + 'px');
    item.style.setProperty('--phase', phase + 's');
    item.style.left = (centerX - size / 2) + 'px';
    item.style.top = (centerY - size / 2) + 'px';
  };

  const layout = () => {
    layoutFrame = 0;
    if (!enabled) return;
    // Four clipped regions leave the transformed card and its shadow completely clear.
    const box = card.getBoundingClientRect();
    const width = document.documentElement.clientWidth;
    const height = window.innerHeight;
    const gutter = 18;
    const top = Math.max(0, box.top - gutter);
    const bottom = Math.min(height, box.bottom + gutter);
    const left = Math.max(0, box.left - gutter);
    const right = Math.min(width, box.right + gutter);
    const regions = [
      [0, top, left, bottom - top],
      [right, top, width - right, bottom - top],
      [0, top > 110 ? 70 : 0, width, top > 110 ? top - 70 : top],
      [0, bottom, width, Math.max(0, height - bottom - (height - bottom > 110 ? 65 : 0))]
    ];
    zones.forEach((zone, index) => {
      const [x, y, w, h] = regions[index];
      Object.assign(zone.style, { left: x + 'px', top: y + 'px', width: w + 'px', height: h + 'px' });
      const side = index < 2;
      const size = side ? Math.min(130, w * .6, h * .24) : Math.min(95, h * .68, w * .2);
      zone.hidden = size < 22;
      [...zone.children].forEach((item, childIndex) => {
        const centerX = side ? w * .5 : w * (h < 60 ? (index === 2 ? .5 : .4) : (w < 600 ? (index === 2 ? .52 : .3) : (index === 2 ? .27 : .74)));
        const centerY = side ? h * (childIndex === 0 ? .25 : .76) : h * .5;
        place(item, size, centerX, centerY, -index * 2 - childIndex * 3);
      });
    });
  };
  const scheduleLayout = () => {
    if (!enabled || layoutFrame) return;
    layoutFrame = requestAnimationFrame(layout);
  };
  const resetPointer = () => {
    scene.style.setProperty('--look-x', '0deg');
    scene.style.setProperty('--look-y', '0deg');
  };
  const trackPointer = (event) => {
    if (event.pointerType !== 'mouse' || event.timeStamp - lastPointerUpdate < 40) return;
    lastPointerUpdate = event.timeStamp;
    scene.style.setProperty('--look-x', ((event.clientX / innerWidth - .5) * 10).toFixed(2) + 'deg');
    scene.style.setProperty('--look-y', ((.5 - event.clientY / innerHeight) * 8).toFixed(2) + 'deg');
  };
  const syncActivity = () => {
    const active = enabled && !document.hidden;
    scene.toggleAttribute('data-paused', !active);
    const shouldTrack = active && finePointer.matches && !reducedMotion.matches;
    if (shouldTrack !== pointerListening) {
      window[shouldTrack ? 'addEventListener' : 'removeEventListener']('pointermove', trackPointer);
      pointerListening = shouldTrack;
    }
    if (!shouldTrack) resetPointer();
  };
  const apply = () => {
    if (enabled) mount();
    scene.hidden = !enabled;
    toggle.setAttribute('aria-pressed', String(enabled));
    toggle.querySelector('.depth-toggle-state').textContent = enabled ? 'ВКЛ' : 'ВЫКЛ';
    toggle.title = enabled ? 'Выключить 3D-окружение' : 'Включить 3D-окружение';
    syncActivity();
    if (enabled) layout();
    else if (layoutFrame) {
      cancelAnimationFrame(layoutFrame);
      layoutFrame = 0;
    }
  };
  toggle.addEventListener('click', () => {
    enabled = !enabled;
    preference = enabled;
    try { sessionStorage.setItem('chamber-3d', enabled ? 'on' : 'off'); } catch { /* Optional preference. */ }
    apply();
  });
  mobile.addEventListener('change', () => {
    if (preference === null) {
      enabled = !mobile.matches;
      apply();
    }
  });
  reducedMotion.addEventListener('change', syncActivity);
  finePointer.addEventListener('change', syncActivity);
  document.addEventListener('visibilitychange', syncActivity);
  window.addEventListener('resize', scheduleLayout);
  window.addEventListener('blur', resetPointer);
  if (window.visualViewport) window.visualViewport.addEventListener('resize', scheduleLayout);
  new ResizeObserver(scheduleLayout).observe(card);
  toggle.hidden = false;
  apply();
})();

