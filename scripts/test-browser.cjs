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
    for (const [width, height, touch] of [[1440,900,false],[1024,768,false],[390,844,true],[320,568,true],[844,390,true],[768,1024,true]]) {
      const context = await browser.newContext({ viewport: {width,height}, hasTouch: touch, isMobile: touch, deviceScaleFactor: 1, reducedMotion: process.env.TEST_URL ? 'no-preference' : 'reduce' });
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
      const checkGeometry = async () => {
        const box = await page.locator('.card').boundingBox();
        assert(box.x >= 20 && box.y >= 20 && box.x + box.width <= width - 20 && box.y + box.height <= height - 20, `card clipped: ${width}x${height} ${JSON.stringify(box)}`);
        for (const control of await page.locator('.scene-controls button').all()) {
          const button = await control.boundingBox();
          assert(button.x>=0&&button.y>=0&&button.x+button.width<=width&&button.y+button.height<=height,'scene control is clipped');
          assert(button.x + button.width <= box.x || button.x >= box.x + box.width || button.y + button.height <= box.y || button.y >= box.y + box.height, 'rotate button overlaps card');
        }
        const overflow = await page.locator('.card-body > .panel:not([hidden]) .panel-copy').evaluate(el => ({scroll:el.scrollWidth, client:el.clientWidth}));
        assert(overflow.scroll <= overflow.client + 1, `horizontal text overflow: ${JSON.stringify(overflow)}`);
      };
      await checkGeometry();
      await page.screenshot({ path: path.join(root, '.local', `card-${width}x${height}.png`) });
      for (const id of ['work','skills','about','contacts']) {
        await page.locator(`.nav-link[href="#${id}"]`).click();
        assert.equal(await page.locator('.card-body > .panel:not([hidden])').getAttribute('id'), id);
        assert.equal(await page.locator('.nav-link[aria-current]').count(), 1);
        await checkGeometry();
      }
      await page.locator('.nav-link[href="#work"]').click();
      for (let i=0; i<3; i++) {
        const project = page.locator('#work > .panel-copy .project').nth(i);
        if (!(await project.getAttribute('open') !== null)) await project.locator('summary').click();
        await page.waitForFunction(number => document.querySelector('#work-number').textContent.endsWith(number), String(i+1).padStart(2,'0'));
        assert.equal(await page.locator('#work > .panel-copy .project[open]').count(), 1);
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
      assert.equal(await page.locator('.card-body > .panel:not([hidden])').getAttribute('id'), 'skills');
      await page.locator('.nav-link[href="#contacts"]').focus();
      await page.keyboard.press('Enter');
      assert.equal(await page.locator('.card-body > .panel:not([hidden])').getAttribute('id'), 'contacts');
      await page.goBack();
      assert.equal(await page.locator('.card-body > .panel:not([hidden])').getAttribute('id'), 'skills');
      assert.deepEqual(errors, []);
      console.log(`PASS ${width}x${height}: navigation, geometry, projects, rotation, keyboard, no errors`);
      await context.close();
    }
  } finally {
    await browser.close();
    server.close();
  }
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });






