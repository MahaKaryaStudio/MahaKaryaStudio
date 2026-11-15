const { chromium } = require('playwright');
const GL = ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];
const U = 'http://127.0.0.1:8911/index.html?';
const ready = (p) => p.waitForFunction(() => window.__firstFrame, null, { timeout: 60000 });
const st = (p) => p.evaluate(() => window.__lamp.stats());
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: GL });
  const R = {};
  // 1 auto-rotate berjalan, berhenti saat digeser
  { const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } }); const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(String(e)));
    await p.goto(U + 'ed=0'); await ready(p); await p.waitForTimeout(2500); const a = await st(p); await p.waitForTimeout(2000); const c = await st(p);
    R.autoFramesIn2s = c.frames - a.frames; R.autoBefore = c.auto;
    const box = await p.locator('#gl-lamp canvas').boundingBox();
    await p.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await p.mouse.down(); await p.mouse.move(box.x + box.width / 2 + 120, box.y + box.height / 2, { steps: 6 }); await p.waitForTimeout(200); await p.mouse.up();
    await p.waitForTimeout(1500); const d = await st(p); await p.waitForTimeout(800); const e = await st(p);
    R.autoAfterDrag = d.auto; R.framesWhileIdleAfterDrag = e.frames - d.frames; R.loopRunningAfterDrag = e.running;
    // keyboard
    await p.locator('#gl-lamp canvas').focus(); const f0 = (await st(p)).frames; await p.keyboard.press('ArrowRight'); await p.waitForTimeout(200); R.framesAfterArrowKey = (await st(p)).frames - f0;
    R.ariaLabel = await p.locator('#gl-lamp canvas').getAttribute('aria-label'); R.role = await p.locator('#gl-lamp canvas').getAttribute('role');
    // pause di luar layar
    await p.evaluate(() => { document.body.insertAdjacentHTML('beforeend', '<div style="height:4000px"></div>'); window.__lamp.rotateBy(0); });
    await p.evaluate(() => { window.__lamp2 = window.__create(document.getElementById('gl-lamp'), { head: { shape: 'plisir', color: 'gading' }, body: [{ shape: 'bola', color: 'zaitun' }], base: { shape: 'bulat', color: 'hitam' } }, {}); });
    await p.waitForTimeout(600); const g0 = await p.evaluate(() => window.__lamp2.stats()); await p.waitForTimeout(500); const g1 = await p.evaluate(() => window.__lamp2.stats());
    await p.evaluate(() => window.scrollTo(0, 3000)); await p.waitForTimeout(500); const g2 = await p.evaluate(() => window.__lamp2.stats()); await p.waitForTimeout(800); const g3 = await p.evaluate(() => window.__lamp2.stats());
    await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(600); const g4 = await p.evaluate(() => window.__lamp2.stats());
    R.offscreen = { framesVisible500ms: g1.frames - g0.frames, framesOffscreen800ms: g3.frames - g2.frames, framesAfterReturn: g4.frames - g3.frames };
    // dispose berulang
    R.disposeLoop = await p.evaluate(async () => { window.__lamp2.dispose(); let ok = 0; for (let i = 0; i < 12; i++) { const l = window.__create(document.getElementById('gl-lamp'), { head: { shape: 'kotak', color: 'putih' }, body: [{ shape: 'heksa', color: 'bata' }, { shape: 'cincin', color: 'krem' }], base: { shape: 'bunga', color: 'salmon' } }, { auto: false }); if (l) { ok++; await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))); l.dispose(); } } return { created: ok, canvasesLeft: document.querySelectorAll('#gl-lamp canvas').length }; });
    // setConfig berulang: geometri tidak menumpuk
    R.setConfigLeak = await p.evaluate(async () => { const D = window.MKS_LAMP; const a = window.__lamp.stats().geometries; for (let i = 0; i < 20; i++) { const pr = D.presets[i % 5]; window.__lamp.setConfig({ head: pr.head, body: pr.body, base: pr.base }); await new Promise((r) => requestAnimationFrame(r)); } window.__lamp.setConfig({ head: D.presets[0].head, body: D.presets[0].body, base: D.presets[0].base }); await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))); const s = window.__lamp.stats(); return { geometriesBefore: a, geometriesAfter: s.geometries, textures: s.textures, programs: s.programs }; });
    R.errors1 = errs; await ctx.close(); }
  // 2 reduced motion
  { const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' }); const p = await ctx.newPage(); await p.goto(U + 'ed=0'); await ready(p); await p.waitForTimeout(300); const a = await st(p); await p.waitForTimeout(1000); const c = await st(p);
    R.reduced = { auto: c.auto, framesIn1s: c.frames - a.frames, running: c.running };
    const t = await p.evaluate(async () => { window.__setLit(false); await new Promise((r) => setTimeout(r, 120)); return window.__lamp.stats().frames; }); R.reduced.litToggleFrames = t - c.frames; await ctx.close(); }
  // 3 HP: geser vertikal di atas kanvas tetap menggulir halaman; geser mendatar memutar
  { const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }); const p = await ctx.newPage(); await p.goto(U + 'ed=0&auto=0'); await ready(p);
    await p.evaluate(() => document.getElementById('st-3d').scrollIntoView({ block: 'center' })); await p.waitForTimeout(300);
    const box = await p.locator('#gl-lamp canvas').boundingBox(); const cdp = await ctx.newCDPSession(p);
    const swipe = async (x0, y0, x1, y1) => { await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: x0, y: y0 }] }); for (let i = 1; i <= 8; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x0 + ((x1 - x0) * i) / 8, y: y0 + ((y1 - y0) * i) / 8 }] }); await p.waitForTimeout(16); } await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await p.waitForTimeout(500); };
    const cx = box.x + box.width / 2, cy = box.y + box.height / 2;
    const y0 = await p.evaluate(() => scrollY), f0 = (await st(p)).frames; await swipe(cx, cy - 60, cx, cy + 120); const y1 = await p.evaluate(() => scrollY), f1 = (await st(p)).frames;
    await p.evaluate((y) => window.scrollTo(0, y), y0); await p.waitForTimeout(300); const f2 = (await st(p)).frames;
    await swipe(cx - 80, cy, cx + 80, cy); const y2 = await p.evaluate(() => scrollY), f3 = (await st(p)).frames;
    R.touch = { verticalSwipeScrolledPx: y1 - y0, framesDuringVertical: f1 - f0, horizontalSwipeScrolledPx: y2 - y0, framesDuringHorizontal: f3 - f2 }; await ctx.close(); }
  // 4 tanpa WebGL → null
  { const b2 = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--disable-gpu', '--disable-3d-apis'] }); const p = await b2.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(String(e)));
    await p.goto(U + 'ed=0'); await p.waitForTimeout(2500); R.noWebgl = { lampIsNull: await p.evaluate(() => window.__lamp === null), msg: await p.locator('#m-3d').textContent(), canvases: await p.locator('#gl-lamp canvas').count(), pageErrors: errs }; await b2.close(); }
  console.log(JSON.stringify(R, null, 1));
  await b.close();
})();
