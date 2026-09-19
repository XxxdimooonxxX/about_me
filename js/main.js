(() => {
  'use strict';
  const panels = [...document.querySelectorAll('.panel')];
  const links = [...document.querySelectorAll('.nav-link')];
  const code = document.querySelector('.section-code');
  const selectPanel = () => {
    const id = location.hash.slice(1);
    const active = panels.find((panel) => panel.id === id) || panels[0];
    panels.forEach((panel) => { panel.hidden = panel !== active; });
    links.forEach((link, index) => {
      const selected = link.hash === `#${active.id}`;
      if (selected) {
        link.setAttribute('aria-current', 'page');
        code.textContent = `${String(index + 1).padStart(2, '0')} — ${link.textContent.trim().toUpperCase()}`;
      } else {
        link.removeAttribute('aria-current');
      }
    });
  };
  window.addEventListener('hashchange', selectPanel);
  links.forEach((link) => link.addEventListener('click', (event) => {
    event.preventDefault();
    if (location.hash !== link.hash) history.pushState(null, '', link.hash);
    selectPanel();
  }));
  window.addEventListener('popstate', selectPanel);
  selectPanel();

  const projects = [...document.querySelectorAll('.project')];
  const preview = document.querySelector('#work-preview');
  projects.forEach((project) => project.addEventListener('toggle', () => {
    if (!project.open) return;
    projects.forEach((other) => { if (other !== project) other.open = false; });
    preview.src = project.dataset.image;
    preview.alt = project.dataset.alt;
    document.querySelector('#work-number').textContent = `PROJECT — ${project.dataset.number}`;
  }));

  const rotate = document.querySelector('.orientation-toggle');
  let flipped = false;
  try { flipped = sessionStorage.getItem('card-flipped') === 'true'; } catch { /* Storage can be disabled. */ }
  const applyOrientation = () => {
    document.documentElement.style.setProperty('--flip', flipped ? '180deg' : '0deg');
    rotate.setAttribute('aria-pressed', String(flipped));
  };
  rotate.addEventListener('click', () => {
    flipped = !flipped;
    applyOrientation();
    try { sessionStorage.setItem('card-flipped', String(flipped)); } catch { /* Rotation still works without storage. */ }
  });
  applyOrientation();

  const clock = document.querySelector('#time');
  const formatter = new Intl.DateTimeFormat('ru-RU', {
    timeZone: 'Europe/Moscow', day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  });
  const updateClock = () => {
    const now = new Date();
    clock.textContent = formatter.format(now);
    clock.dateTime = now.toISOString();
  };
  updateClock();
  window.setInterval(updateClock, 1000);
  const decorToggle = document.querySelector('.three-d-toggle');
  let decorEnabled = !matchMedia('(pointer: coarse), (max-width: 600px)').matches;
  const applyDecor = () => { document.body.classList.toggle('three-d-on', decorEnabled); decorToggle.setAttribute('aria-pressed', String(decorEnabled)); };
  document.querySelectorAll('.cube').forEach(cube => { for (let i = 0; i < 6; i += 1) { const face = document.createElement('span'); face.className = 'cube-face'; cube.append(face); } });
  decorToggle.addEventListener('click', () => { decorEnabled = !decorEnabled; applyDecor(); });
  applyDecor();  const greeting = document.querySelector('#greeting');
  const greetings = ['Привет!', 'Hello!', 'Ciao!', 'こんにちは!', '嗨！', '안녕!'];
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const delay = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));
  const waitUntilVisible = async () => {
    while (document.hidden) {
      await new Promise((resolve) => document.addEventListener('visibilitychange', resolve, { once: true }));
    }
  };
  const typeGreeting = async (word) => {
    greeting.textContent = '';
    for (const character of [...word]) {
      await waitUntilVisible();
      greeting.textContent += character;
      await delay(95);
    }
    await delay(2200);
    for (let length = [...word].length; length > 0; length -= 1) {
      await waitUntilVisible();
      greeting.textContent = [...word].slice(0, length - 1).join('');
      await delay(55);
    }
    await delay(400);
  };
  const runGreetingLoop = () => {
    let index = 0;
    const next = async () => {
      if (document.hidden) {
        window.setTimeout(next, 500);
        return;
      }
      const word = greetings[index++ % greetings.length];
      if (reducedMotion.matches) {
        greeting.textContent = word;
        window.setTimeout(next, 3200);
        return;
      }
      await typeGreeting(word);
      next();
    };
    next();
  };
  runGreetingLoop();
})();


