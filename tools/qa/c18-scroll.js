// Cek anggaran gulir (adendum v3.1 §8, langkah gerak-hapus): biaya gaya per frame, dengan nav.js dan motion.js
// yang sebenarnya, CPU diperlambat 4x (CDP Emulation.setCPUThrottlingRate). Angka lab, bukan HP sungguhan.
// Pakai: node tools/qa/c18-scroll.js <url> [--rate=4] [--json=<berkas>]
//  - pin #kenapa: gulir per frame (30 px) melewati cerita terpaku; gaya per frame (jumlah UpdateLayoutTree dalam
//    satu frame utama) <= 5 ms (diukur: maks dan p95).
//  - nav sembunyi/muncul: gulir turun di #alur sampai nav bersembunyi, lalu naik sampai muncul; frame termahal
//    (UpdateLayoutTree + Layout) di sekitar pergantian <= 10 ms.
// Frame = rentang antara dua peristiwa BeginMainThreadFrame di utas utama renderer.
const { run } = require('./_lib');
const fs = require('fs');
// kategori seringan mungkin: rekaman rinci (invalidationTracking, timeline penuh) menambah biaya ke angka yang diukur
const CATS = ['devtools.timeline', 'disabled-by-default-devtools.timeline.frame'];
function frames(trace) {
  const ev = (JSON.parse(trace).traceEvents || []);
  // utas utama renderer = utas dengan UpdateLayoutTree terbanyak
  const cnt = {};
  ev.forEach((e) => { if (e.name === 'UpdateLayoutTree') cnt[e.pid + ':' + e.tid] = (cnt[e.pid + ':' + e.tid] || 0) + 1; });
  const main = Object.entries(cnt).sort((a, b) => b[1] - a[1])[0];
  if (!main) return [];
  const [pid, tid] = main[0].split(':').map(Number);
  const mine = ev.filter((e) => e.pid === pid && e.tid === tid);
  const starts = mine.filter((e) => e.name === 'BeginMainThreadFrame').map((e) => e.ts).sort((a, b) => a - b);
  const work = mine.filter((e) => e.ph === 'X' && (e.name === 'UpdateLayoutTree' || e.name === 'Layout'));
  if (!starts.length) return work.filter((e) => e.name === 'UpdateLayoutTree').map((e) => ({ style: e.dur / 1000, layout: 0 }));
  const out = starts.map(() => ({ style: 0, layout: 0 }));
  work.forEach((e) => {
    let lo = 0, hi = starts.length - 1, k = -1;
    while (lo <= hi) { const m = (lo + hi) >> 1; if (starts[m] <= e.ts) { k = m; lo = m + 1; } else hi = m - 1; }
    if (k < 0) return;
    if (e.name === 'UpdateLayoutTree') out[k].style += e.dur / 1000; else out[k].layout += e.dur / 1000;
  });
  return out.filter((f) => f.style + f.layout > 0);
}
const stat = (a) => { if (!a.length) return { max: 0, p95: 0, med: 0, n: 0 }; const s = [...a].sort((x, y) => x - y); return { max: +s[s.length - 1].toFixed(2), p95: +s[Math.min(s.length - 1, Math.floor(s.length * 0.95))].toFixed(2), med: +s[s.length >> 1].toFixed(2), n: s.length }; };
run(async ({ open, check, opt, browser }) => {
  const rate = +(opt.rate || 4);
  const res = {};
  for (const vp of ['desktop', 'hp']) {
    const p = await open(vp, { wait: 1500 });
    const cdp = await p.context().newCDPSession(p);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate });
    // pin #kenapa
    const range = await p.evaluate(() => { const s = document.querySelector('.story'); return [s.offsetTop, s.offsetTop + s.offsetHeight - innerHeight]; });
    // tiga lintasan turun (angka throttle berderau ±3 ms per frame): statistik atas semua frame, ditambah maks per lintasan
    const f1 = [], perRun = [];
    for (let rep = 0; rep < 3; rep++) {
      await p.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), range[0] - 60);
      await p.waitForTimeout(700);
      await browser.startTracing(p, { categories: CATS });
      await p.evaluate(([a, b]) => new Promise((r) => { let y = a - 60; const go = () => { y += 30; window.scrollTo({ top: y, behavior: 'instant' }); if (y < b + 60) requestAnimationFrame(go); else setTimeout(r, 200); }; requestAnimationFrame(go); }), range);
      const fr = frames((await browser.stopTracing()).toString());
      f1.push(...fr); perRun.push(stat(fr.map((f) => f.style)).max);
    }
    const s1 = stat(f1.map((f) => f.style));
    s1.perRun = perRun;
    res[vp + ' pin'] = s1;
    check(s1.n > 60 && s1.max <= 5, `C18 ${vp} CPU ${rate}x: gaya per frame selama pin #kenapa <= 5 ms`, `maks ${s1.max} ms (per lintasan ${perRun.join(' / ')}), p95 ${s1.p95}, median ${s1.med} (${s1.n} frame, 3 lintasan)`);
    // nav sembunyi/muncul di #alur
    const a0 = await p.evaluate(() => document.querySelector('#alur').offsetTop + 200);
    await p.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), a0);
    await p.waitForTimeout(300);
    await p.evaluate(() => window.scrollBy({ top: -60, behavior: 'instant' })); // nav terlihat dulu
    await p.waitForTimeout(500);
    const vis0 = await p.evaluate(() => !document.querySelector('.nav').classList.contains('nav--hide'));
    await browser.startTracing(p, { categories: CATS });
    const tog = await p.evaluate(() => new Promise((r) => {
      const nav = document.querySelector('.nav'); const log = [];
      let i = 0;
      const go = () => {
        i++;
        window.scrollBy({ top: i <= 12 ? 12 : -12, behavior: 'instant' });
        log.push(nav.classList.contains('nav--hide') ? 1 : 0);
        if (i < 24) requestAnimationFrame(go); else setTimeout(() => r(log), 400);
      };
      requestAnimationFrame(go);
    }));
    const t2 = (await browser.stopTracing()).toString();
    const f2 = frames(t2);
    const s2 = stat(f2.map((f) => f.style + f.layout));
    const toggled = vis0 && tog.includes(1) && tog[tog.length - 1] === 0;
    res[vp + ' nav'] = s2;
    check(toggled && s2.max <= 10, `C18 ${vp} CPU ${rate}x: nav sembunyi lalu muncul, frame termahal (gaya + layout) <= 10 ms`, `maks ${s2.max} ms, p95 ${s2.p95}, median ${s2.med} (${s2.n} frame); nav ${tog.join('')}`);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
    check(p.__errs.length === 0, `${vp}: tanpa error JS`, p.__errs.join(' | ').slice(0, 200));
  }
  if (opt.json) fs.writeFileSync(opt.json, JSON.stringify(res, null, 2));
});
