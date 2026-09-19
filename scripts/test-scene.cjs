const { chromium } = require('playwright');
const { pathToFileURL } = require('node:url');
const path = require('node:path');
const assert = require('node:assert/strict');
(async () => {
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try {
  for (const mobile of [false,true]) {
   const page=await browser.newPage({viewport:mobile?{width:390,height:844}:{width:1440,height:900},hasTouch:mobile,isMobile:mobile});
   const errors=[]; page.on('pageerror',e=>errors.push(e.message));
   await page.goto(pathToFileURL(path.resolve(__dirname,'../index.html')).href);
   const toggle=page.locator('.scene-toggle');
   assert.equal(await toggle.getAttribute('aria-pressed'),String(!mobile));
   if(mobile) { assert.equal(await page.locator('script[src*=three]').count(),0); await toggle.click(); }
   await page.waitForFunction(()=>document.body.classList.contains('scene-active'));
   const box=await page.locator('.card').boundingBox(), control=await toggle.boundingBox();
   assert(control.x+control.width<=box.x||control.x>=box.x+box.width||control.y+control.height<=box.y||control.y>=box.y+box.height,'3D toggle overlaps card');
   await page.locator('[href="#work"]').click();
   await page.waitForSelector('.flip-tile');
   assert.equal(await page.locator('.flip-tile').count(),12);
   await page.locator('[href="#skills"]').click();
   await page.waitForSelector('.flip-grid',{state:'detached'});
   assert.equal(await page.locator('.panel:not([hidden])').getAttribute('id'),'skills');
   await page.screenshot({path:path.resolve(__dirname,`../.local/portal-${mobile?'mobile':'desktop'}.png`)});
   await toggle.click();
   assert.equal(await toggle.getAttribute('aria-pressed'),'false');
   assert.equal(await page.locator('body').evaluate(el=>el.classList.contains('scene-active')),false);
   assert.deepEqual(errors,[]);
   console.log(`PASS ${mobile?'mobile':'desktop'}: WebGL render, defaults, lazy loading, toggle clearance, rapid transitions, no JS errors`);
   await page.close();
  }
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
