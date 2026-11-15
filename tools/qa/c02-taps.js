// Cek C2 adendum v3.1: ketukan tidak boleh hilang setelah ganti edisi.
// Pakai: node tools/qa/c02-taps.js <folder situs>   (tanpa server: berkas dilayani lewat route Playwright di origin palsu mks.test)
// Lulus (exit 0) bila 16/16 ketukan masuk dan document.startViewTransition tidak pernah dipanggil.
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(process.argv[2] || '.');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.json': 'application/json', '.mp4': 'video/mp4', '.woff2': 'font/woff2' };
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  let ok = 0, total = 0, vtCalls = 0;
  for (const rate of [1, 4]) for (const gap of [60, 150, 250, 400]) {
    const ctx = await b.newContext({ viewport: { width: 390, height: 664 }, isMobile: true, hasTouch: true });
    await ctx.route('**/*', (route) => {
      const u = new URL(route.request().url());
      if (u.hostname !== 'mks.test') return route.abort();
      let f = path.join(ROOT, decodeURIComponent(u.pathname)); if (f.endsWith('/')) f += 'index.html';
      if (!f.startsWith(ROOT) || !fs.existsSync(f)) return route.fulfill({ status: 404, body: '' });
      route.fulfill({ status: 200, contentType: MIME[path.extname(f)] || 'application/octet-stream', body: fs.readFileSync(f) });
    });
    const p = await ctx.newPage(); const cdp = await ctx.newCDPSession(p);
    await p.addInitScript(() => { window.__vt = 0; const o = Document.prototype.startViewTransition; if (o) Document.prototype.startViewTransition = function (...a) { window.__vt++; return o.apply(this, a); }; });
    await p.goto('http://mks.test/index.html', { waitUntil: 'load' }); await p.waitForTimeout(900);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate });
    await p.evaluate(() => document.querySelectorAll('#edisi-app .edisi__opt')[2].scrollIntoView({ block: 'center', behavior: 'instant' })); await p.waitForTimeout(900);
    const getRows = () => p.evaluate(() => [...document.querySelectorAll('#edisi-app .edisi__opt')].map((o) => { const r = o.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, checked: o.querySelector('input').checked }; }));
    let rows = await getRows(); const start = rows.findIndex((x) => x.checked); const a = (start + 1) % 5, c = (start + 2) % 5;
    await p.evaluate(() => { window.__wa = 0; document.addEventListener('click', (e) => { if (e.target.closest && e.target.closest('.orderbar a, .orderbar button')) { window.__wa++; e.preventDefault(); } }, true); });
    await p.touchscreen.tap(rows[a].x, rows[a].y); await p.waitForTimeout(gap); await p.touchscreen.tap(rows[c].x, rows[c].y); await p.waitForTimeout(1500);
    const fin = await p.evaluate(() => [...document.querySelectorAll('#edisi-app .edisi__opt input')].findIndex((i) => i.checked));
    const ob = await p.evaluate(() => { const o = document.querySelector('.orderbar a, .orderbar button'); if (!o) return null; const r = o.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, vis: r.height > 0 && getComputedStyle(o.closest('.orderbar')).visibility !== 'hidden' }; });
    let wa = 'tidak terlihat';
    if (ob && ob.vis) { rows = await getRows(); const n = (rows.findIndex((x) => x.checked) + 1) % 5; await p.touchscreen.tap(rows[n].x, rows[n].y); await p.waitForTimeout(gap); await p.touchscreen.tap(ob.x, ob.y); await p.waitForTimeout(1200); wa = (await p.evaluate(() => window.__wa)) > 0 ? 'OK' : 'HILANG'; }
    vtCalls += await p.evaluate(() => window.__vt);
    total += 2; ok += (fin === c ? 1 : 0) + (wa === 'OK' ? 1 : 0);
    console.log(`cpu${rate}x jarak ${String(gap).padStart(3)} ms: edisi->edisi ${fin === c ? 'OK' : 'HILANG'} | edisi->Pesan ${wa}`);
    await ctx.close();
  }
  await b.close();
  console.log(`HASIL ${ok}/${total} ketukan masuk; startViewTransition dipanggil ${vtCalls} kali`);
  process.exit(ok === total && vtCalls === 0 ? 0 : 1);
})();
