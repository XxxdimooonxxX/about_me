const { chromium } = require('playwright');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'application/javascript', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.jpg': 'image/jpeg' };
const server = http.createServer((req, res) => {
  const file = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname === '/' ? '/index.html' : new URL(req.url, 'http://localhost').pathname));
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404); res.end(); return; }
  res.setHeader('Content-Type', types[path.extname(file)] || 'text/plain');
  res.end(fs.readFileSync(file));
});
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || 'msedge', headless: true });
  const url = process.env.TEST_URL || `http://127.0.0.1:${server.address().port}`;
  fs.mkdirSync(path.join(root, '.local'), { recursive: true });
  try {
    for (const [width, height, touch] of [[1440,900,false],[1024,768,false],[1024,600,false],[1280,720,false],[390,844,true],[320,568,true],[844,390,true],[768,1024,true]]) {
      const context = await browser.newContext({ viewport: {width,height}, hasTouch: touch, isMobile: touch, deviceScaleFactor: 1, timezoneId: 'America/Los_Angeles', reducedMotion: process.env.TEST_URL ? 'no-preference' : 'reduce' });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
const response = await page.goto(url);
      if (process.env.TEST_URL) assert.match(response.headers()['x-robots-tag'] || '', /noindex/);
      await page.locator('.portrait img').evaluate(img => img.decode());
      if (process.env.TEST_URL) {
        await page.waitForTimeout(100);
        const greeting = page.locator('#greeting');
        const first = await greeting.textContent();
        await page.waitForTimeout(120);
        const second = await greeting.textContent();
        assert.notEqual(first, second, 'greeting should type characters');
        assert.equal(await page.locator('.social-link').count(), 8);
      }
      assert.equal(await page.locator('meta[name=robots]').getAttribute('content'), 'noindex, nofollow, noarchive, noimageindex');

      const toggle3d = page.locator('.depth-toggle');
      const initial3d = !touch && width > 600;
      assert.equal(await toggle3d.getAttribute('aria-pressed'), String(initial3d), '3D default differs from device policy');
      assert.equal(await page.locator('.scene-depth').isVisible(), initial3d);
      if (!initial3d) assert.equal(await page.locator('.depth-item').count(), 0, 'mobile should not build the scene until requested');
      const clockSnapshot = await page.locator('#time').evaluate(el => ({
        value: el.dateTime, date: el.querySelector('.clock-date').textContent, digits: el.querySelector('.clock-digits').textContent
      }));
      assert(clockSnapshot.value && !Number.isNaN(Date.parse(clockSnapshot.value)), 'clock must initialize immediately');
      const dateValue = new Date(clockSnapshot.value);
      assert.equal(clockSnapshot.date, new Intl.DateTimeFormat('ru-RU', {
        timeZone: 'Europe/Moscow', day: 'numeric', month: 'long', year: 'numeric'
      }).format(dateValue));
      assert.equal(clockSnapshot.digits, new Intl.DateTimeFormat('ru-RU', {
        timeZone: 'Europe/Moscow', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23'
      }).format(dateValue));

      const checkGeometry = async () => {
        const box = await page.locator('.card').boundingBox();
        assert(box.x >= 20 && box.y >= 20 && box.x + box.width <= width - 20 && box.y + box.height <= height - 20, `card clipped: ${width}x${height} ${JSON.stringify(box)}`);
        if (await page.locator('.orientation-toggle').isVisible()) {
          const button = await page.locator('.orientation-toggle').boundingBox();
          assert(button.x + button.width <= box.x || button.x >= box.x + box.width || button.y + button.height <= box.y || button.y >= box.y + box.height, 'rotate button overlaps card');
        }

        const switchBox = await page.locator('.depth-toggle').boundingBox();
        assert(switchBox && switchBox.x >= 0 && switchBox.y >= 0 && switchBox.x + switchBox.width <= width && switchBox.y + switchBox.height <= height, '3D switch outside viewport');
        const separate = (a, b) => a.x + a.width <= b.x || a.x >= b.x + b.width || a.y + a.height <= b.y || a.y >= b.y + b.height;
        assert(separate(switchBox, box), '3D switch overlaps card');
        if (await page.locator('.scene-depth').isVisible()) {
          for (const zone of await page.locator('.depth-zone:not([hidden])').all()) {
            assert(separate(await zone.boundingBox(), box), '3D region overlaps card');
            assert.equal(await zone.evaluate(el => getComputedStyle(el).overflow), 'hidden', '3D objects must stay clipped outside card');
          }
          assert.equal(await page.locator('.scene-depth').evaluate(el => getComputedStyle(el).pointerEvents), 'none', 'decoration must not intercept clicks');
          if (!process.env.TEST_URL) {
            assert.equal(await page.locator('.depth-float').first().evaluate(el => getComputedStyle(el).animationName), 'none', 'reduced motion should stop 3D animation');
          }
        }

        const overflow = await page.locator('.panel:not([hidden]) .panel-copy').evaluate(el => ({scroll:el.scrollWidth, client:el.clientWidth}));
        assert(overflow.scroll <= overflow.client + 1, `horizontal text overflow: ${JSON.stringify(overflow)}`);
      };
      await checkGeometry();
      await page.screenshot({ path: path.join(root, '.local', `card-${width}x${height}.png`) });

      await toggle3d.focus();
      await page.keyboard.press('Enter');
      assert.equal(await toggle3d.getAttribute('aria-pressed'), String(!initial3d));
      assert.equal(await page.locator('.scene-depth').isVisible(), !initial3d);
      await page.reload();
      assert.equal(await toggle3d.getAttribute('aria-pressed'), String(!initial3d), '3D choice should survive reload');
      await checkGeometry();
      if (initial3d) await toggle3d.click();
      assert.equal(await page.locator('.scene-depth').isVisible(), true);
      assert((await page.locator('.depth-zone:not([hidden])').count()) > 0, 'enabled scene must have visible objects even on a small phone');
      await checkGeometry();
      await page.screenshot({ path: path.join(root, '.local', `chamber-3d-${width}x${height}.png`) });

      for (const id of ['work','skills','about','contacts']) {
        await page.locator(`.nav-link[href="#${id}"]`).click();
        assert.equal(await page.locator('.panel:not([hidden])').getAttribute('id'), id);
        assert.equal(await page.locator('.nav-link[aria-current]').count(), 1);
        await checkGeometry();
      }
      await page.locator('.nav-link[href="#work"]').click();
      for (let i=0; i<3; i++) {
        const project = page.locator('.project').nth(i);
        if (!(await project.getAttribute('open') !== null)) await project.locator('summary').click();
        await page.waitForFunction(number => document.querySelector('#work-number').textContent.endsWith(number), String(i+1).padStart(2,'0'));
        assert.equal(await page.locator('.project[open]').count(), 1);
        await page.locator('#work-preview').evaluate(img => img.decode());
      }
      if (await page.locator('.orientation-toggle').isVisible()) {
        const before = await page.locator('.card').evaluate(el => getComputedStyle(el).transform);
        await page.locator('.orientation-toggle').click();
        const after = await page.locator('.card').evaluate(el => getComputedStyle(el).transform);
        assert.notEqual(before, after);
        assert.equal(await page.locator('.orientation-toggle').getAttribute('aria-pressed'), 'true');
        await checkGeometry();
        await page.reload();
        assert.equal(await page.locator('.orientation-toggle').getAttribute('aria-pressed'), 'true');
        await page.locator('.nav-link[href="#about"]').click();
        await checkGeometry();
      }
      await page.goto(url + '/#skills');
      assert.equal(await page.locator('.panel:not([hidden])').getAttribute('id'), 'skills');
      await page.locator('.nav-link[href="#contacts"]').focus();
      await page.keyboard.press('Enter');
      assert.equal(await page.locator('.panel:not([hidden])').getAttribute('id'), 'contacts');
      await page.goBack();
      assert.equal(await page.locator('.panel:not([hidden])').getAttribute('id'), 'skills');
      assert.deepEqual(errors, []);
      console.log(`PASS ${width}x${height}: navigation, geometry, projects, rotation, keyboard, Moscow clock, 3D toggle and clipping, no errors`);
      await context.close();
    }

    const clockContext = await browser.newContext({ timezoneId: 'Pacific/Honolulu', reducedMotion: 'reduce' });
    const clockPage = await clockContext.newPage();
    await clockPage.clock.install({ time: new Date('2026-12-31T20:59:58Z') });
    await clockPage.clock.pauseAt(new Date('2026-12-31T20:59:58Z'));
    await clockPage.goto(url);
    assert.equal(await clockPage.locator('.clock-date').textContent(), '31 декабря 2026 г.');
    assert.equal(await clockPage.locator('.clock-digits').textContent(), '23:59:58');
    await clockPage.clock.fastForward(3000);
    assert.equal(await clockPage.locator('.clock-date').textContent(), '1 января 2027 г.');
    assert.equal(await clockPage.locator('.clock-digits').textContent(), '00:00:01');
    await clockPage.evaluate(() => {
      sessionStorage.removeItem('chamber-3d');
      Object.defineProperty(Storage.prototype, 'getItem', { value() { throw new Error('Storage blocked'); }, configurable: true });
      Object.defineProperty(Storage.prototype, 'setItem', { value() { throw new Error('Storage blocked'); }, configurable: true });
    });
    await clockContext.addInitScript(() => {
      Object.defineProperty(Storage.prototype, 'getItem', { value() { throw new Error('Storage blocked'); } });
      Object.defineProperty(Storage.prototype, 'setItem', { value() { throw new Error('Storage blocked'); } });
    });
    await clockPage.reload();
    assert.equal(await clockPage.locator('.depth-toggle').getAttribute('aria-pressed'), 'true');
    await clockPage.locator('.depth-toggle').click();
    assert.equal(await clockPage.locator('.depth-toggle').getAttribute('aria-pressed'), 'false');
    await clockContext.close();
    console.log('PASS clock: Moscow midnight and new year from another timezone; 3D works with blocked storage');

  } finally {
    await browser.close();
    server.close();
  }
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });






