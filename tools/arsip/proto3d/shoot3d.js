// node shoot3d.js <outDir> <name> <query> [vp=desktop|hp] [sel]
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const [outDir, ...jobs] = process.argv.slice(2);
const VPS = { desktop: [1440, 900, false, 1], hp: [390, 844, true, 2] };
(async () => {
  fs.mkdirSync(outDir, { recursive: true });
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  for (const job of jobs) {
    const [name, query, vp = 'desktop', sel = '.pair'] = job.split('|');
    const [w, h, m, dpr] = VPS[vp];
    const ctx = await b.newContext({ viewport: { width: w, height: h }, isMobile: m, hasTouch: m, deviceScaleFactor: dpr });
    const p = await ctx.newPage(); const errs = [];
    p.on('pageerror', (e) => errs.push(String(e))); p.on('console', (c) => { if (c.type() === 'error' || c.type() === 'warning') errs.push(c.text()); });
    await p.goto('http://127.0.0.1:8911/index.html?' + query, { waitUntil: 'load' });
    await p.waitForFunction(() => window.__firstFrame, null, { timeout: 60000 }).catch(() => errs.push('no first frame'));
    await p.waitForTimeout(900);
    const f = path.join(outDir, name + '.png');
    await p.locator(sel).first().screenshot({ path: f });
    const st = await p.evaluate(() => window.__lamp && window.__lamp.stats());
    console.log(name, JSON.stringify(st), errs.length ? 'ERR ' + errs.join(' | ') : '');
    await ctx.close();
  }
  await b.close();
})();
