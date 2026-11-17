// Cek C24 (sticky) adendum v3.1, langkah gerak-hapus (K9: --nav-offset dihapus, top panggung tetap).
// Pakai: node tools/qa/c24-sticky.js <url> [--shots=<folder>]
// 1440: .edisi__stage, .tiga__fig dan .studio__stage (#rakit) lengket pada top tetap (tinggi nav + 24);
//       rect.top-nya tidak berubah saat nav bersembunyi dan muncul lagi; tidak ada transisi 'top'.
// 1366×768: sama untuk .edisi__stage dan .studio__stage.
// 390:  di #rakit tidak ada celah di atas panggung (#cfg-stage) dan nav tidak menutupinya: setiap kali tepi atas
//       panggung berada di bawah nav (antara 0 dan tinggi nav), nav tersembunyi penuh (tepi bawah nav <= 0).
//       Di luar #rakit nav kembali normal. --shots menyimpan tangkapan layar sebagai lampiran.
const { run } = require('./_lib');
const near = (a, b, t = 0.5) => Math.abs(a - b) <= t;
run(async ({ open, check, opt }) => {
  const frames = (p) => p.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  for (const vp of ['desktop', 'laptop']) {
    const p = await open(vp);
    const navH = await p.evaluate(() => document.querySelector('.nav').offsetHeight);
    const items = vp === 'desktop' ? [['.edisi__stage', 24], ['#tiga .tiga__fig', 24], ['#rakit .studio__stage', 24]] : [['.edisi__stage', 24], ['#rakit .studio__stage', 24]];
    for (const [sel, gap] of items) {
      // rentang gulir tempat panggung menempel: dari (atas panggung/induk - T) sampai (bawah induk - T - tinggi panggung)
      const rg = await p.evaluate(({ sel, T }) => { window.scrollTo({ top: 0, behavior: 'instant' }); const el = document.querySelector(sel), par = el.parentElement.getBoundingClientRect(); /* item grid (studio): mulai menempel dari posisinya sendiri, bukan dari atas induk */ return { a: Math.max(par.top, el.getBoundingClientRect().top) + scrollY - T, b: par.bottom + scrollY - T - el.offsetHeight }; }, { sel, T: navH + gap });
      const read = () => p.evaluate((sel) => { const el = document.querySelector(sel), cs = getComputedStyle(el), nav = document.querySelector('.nav').getBoundingClientRect(); return { top: el.getBoundingClientRect().top, css: cs.top, pos: cs.position, tp: cs.transitionProperty, navB: nav.bottom }; }, sel);
      const roomy = rg.b - rg.a >= 150;
      const y0 = roomy ? rg.a + 10 : Math.max(500, rg.a - 100);
      // gulir turun dalam langkah kecil: nav bersembunyi (gulir turun > 400 px)
      for (let i = 0; i <= 6; i++) { await p.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), y0 + i * 20); await frames(p); }
      await p.waitForTimeout(350);
      const hid = await read();
      // gulir naik sedikit: nav muncul
      for (let i = 1; i <= 3; i++) { await p.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), y0 + 120 - i * 20); await frames(p); }
      await p.waitForTimeout(350);
      const shown = await read();
      check(hid.pos === 'sticky' && hid.navB <= 0.5 && shown.navB >= navH - 0.5, `C24 ${vp} ${sel}: nav tersembunyi lalu muncul`, `nav bawah ${hid.navB} → ${shown.navB}`);
      if (roomy) check(near(hid.top, shown.top) && near(shown.top, navH + gap), `C24 ${vp} ${sel}: menempel, rect.top tetap (tinggi nav + ${gap} = ${navH + gap}) saat nav berganti`, `${hid.top} / ${shown.top} (css ${shown.css})`);
      else check(hid.css === shown.css && near(parseFloat(shown.css), navH + gap), `C24 ${vp} ${sel}: top lengket tetap ${navH + gap} saat nav berganti (di ukuran ini panggung tidak pernah menempel: rentang ${Math.round(rg.b - rg.a)} px)`, `${hid.css} / ${shown.css}`);
      check(!/(^|,\s*)(top|all)(,|$)/.test(shown.tp) || /^0s(,\s*0s)*$/.test(await p.evaluate((sel) => getComputedStyle(document.querySelector(sel)).transitionDuration, sel)), `C6 ${vp} ${sel}: tanpa transisi top`, shown.tp);
    }
    if (opt.shots && vp === 'desktop') {
      await p.evaluate(() => { const el = document.querySelector('#rakit .studio__stage'); window.scrollTo({ top: el.parentElement.getBoundingClientRect().top + scrollY + 260, behavior: 'instant' }); });
      await p.waitForTimeout(500);
      await p.screenshot({ path: `${opt.shots}/c24-desktop-rakit.png` });
    }
    check(p.__errs.length === 0, `${vp}: tanpa error JS`, p.__errs.join(' | ').slice(0, 200));
  }
  for (const vp of ['hp', 'hp360', 'hpshort']) {
    const p = await open(vp);
    const r = await p.evaluate(async () => {
      const st = document.querySelector('#cfg-stage'), nav = document.querySelector('.nav');
      const navH = nav.offsetHeight, out = [];
      const wait = () => new Promise((r) => setTimeout(r, 330));
      const base = st.getBoundingClientRect().top + scrollY;
      // dekati dari atas dengan gulir turun: tepi atas panggung di 200, 120, navH-1, 30, 0, -150
      for (const off of [200, 120, navH - 1, 30, 0, -150]) {
        window.scrollTo({ top: base - off, behavior: 'instant' });
        await wait();
        const s = st.getBoundingClientRect(), n = nav.getBoundingClientRect();
        out.push({ off, stageTop: Math.round(s.top), navBottom: Math.round(n.bottom) });
      }
      // gulir naik kembali di dalam #rakit (panggung di bawah nav): nav tetap tidak menutupi
      window.scrollTo({ top: base - 20, behavior: 'instant' }); await wait();
      const up = { stageTop: Math.round(st.getBoundingClientRect().top), navBottom: Math.round(nav.getBoundingClientRect().bottom) };
      // di luar #rakit (atas): nav kembali
      window.scrollTo({ top: document.querySelector('#rakit').offsetTop - 600, behavior: 'instant' }); await wait();
      window.scrollBy({ top: -40, behavior: 'instant' }); await wait();
      const outside = Math.round(nav.getBoundingClientRect().bottom);
      // panggung (atau leluhurnya di #rakit) benar-benar sticky? (studio HP: .studio__stage lengket di top 0)
      let sticky = false;
      for (let e = st; e && e.id !== 'rakit'; e = e.parentElement) if (getComputedStyle(e).position === 'sticky') sticky = true;
      return { navH, out, up, outside, sticky };
    });
    const covered = [...r.out, r.up].filter((x) => x.stageTop < r.navH && x.stageTop + 40 > 0 && x.navBottom > 0.5);
    check(covered.length === 0, `C24 ${vp}: nav tidak menutupi panggung #rakit (setiap tepi atas panggung < tinggi nav → nav tersembunyi)`, JSON.stringify(covered.length ? covered : r.out));
    const gap = r.out.filter((x) => x.off <= 0 && x.stageTop > 0.5 && x.stageTop < r.navH);
    check(r.sticky && gap.length === 0, `C24 ${vp}: panggung #rakit lengket dan tanpa celah di atasnya saat mencapai tepi atas`, JSON.stringify({ sticky: r.sticky, gap }));
    check(r.outside >= r.navH - 0.5, `C24 ${vp}: di luar #rakit nav muncul lagi saat gulir naik`, `nav bawah ${r.outside}`);
    if (opt.shots) {
      await p.evaluate(() => { const st = document.querySelector('#cfg-stage'); window.scrollTo({ top: st.getBoundingClientRect().top + scrollY - 10, behavior: 'instant' }); });
      await p.waitForTimeout(400);
      await p.screenshot({ path: `${opt.shots}/c24-${vp}-rakit.png` });
    }
    check(p.__errs.length === 0, `${vp}: tanpa error JS`, p.__errs.join(' | ').slice(0, 200));
  }
});
