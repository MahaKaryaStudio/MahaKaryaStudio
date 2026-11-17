// Cek "satu tombol berisi per viewport" (adendum v3.1, langkah gerak-hapus).
// Pakai: node tools/qa/c12-tombol-berisi.js <url>
// Tombol berisi = [data-primary-cta], .btn--primary, .btn--primary-dark, .btn--wa, .btn--wa-amber, termasuk WA
// "Pesan" di nav dan di orderbar. Terlihat = kotaknya memotong layar (di bawah nav yang terlihat bila tombol itu
// bukan bagian nav; juga di bawah panggung dan tab studio rakit yang lengket di tepi atas), visibility visible, opasitas efektif > 0,1, tidak di dalam <dialog> tertutup.
// Diperiksa: sepanjang gulir penuh (turun lalu naik) di 390 dan 1440, setelah mks:change (ganti edisi dan
// paket), saat menu HP dibuka/ditutup, dan setelah ganti lebar 390 <-> 1440.
// Setiap posisi dibaca setelah transisi selesai (sembunyi 150–250 ms): angka di sini keadaan diam, bukan per frame.
const { run } = require('./_lib');
const COUNT = () => {
  const SEL = '[data-primary-cta], .btn--primary, .btn--primary-dark, .btn--wa, .btn--wa-amber';
  const vh = innerHeight, vw = innerWidth;
  const nav = document.querySelector('.nav');
  const nr = nav ? nav.getBoundingClientRect() : { bottom: 0 };
  // panggung + tab studio rakit yang lengket di tepi atas (HP) menutupi apa pun di bawahnya, seperti nav
  const cover = [...document.querySelectorAll('[data-studio-sticky]')].filter((e) => getComputedStyle(e).position === 'sticky').map((e) => e.getBoundingClientRect()).filter((r) => r.top <= 1 && r.bottom > 0);
  const navBottom = Math.max(0, nr.bottom, ...cover.map((r) => r.bottom));
  const vis = [];
  for (const el of document.querySelectorAll(SEL)) {
    const dlg = el.closest('dialog'); if (dlg && !dlg.open) continue;
    if (!el.getClientRects().length) continue;
    const r = el.getBoundingClientRect(); if (!r.width || !r.height) continue;
    const top = el.closest('.nav, #orderbar, dialog') ? 0 : navBottom; // tertutup nav = tidak terlihat
    if (r.bottom <= top + 1 || r.top >= vh - 1 || r.right <= 0 || r.left >= vw) continue;
    // tertutup orderbar (bila tampil) dihitung tidak terlihat bila seluruhnya di bawah tepi atas orderbar
    const ob = document.querySelector('#orderbar.is-on');
    if (ob && !el.closest('#orderbar') && r.top >= ob.getBoundingClientRect().top) continue;
    let op = 1, n = el, hidden = false;
    while (n && n.nodeType === 1) { const cs = getComputedStyle(n); op *= +cs.opacity; if (cs.visibility === 'hidden' && n === el) hidden = true; n = n.parentElement; }
    if (hidden || getComputedStyle(el).visibility !== 'visible' || op <= 0.1) continue;
    vis.push((el.closest('[id]') || {}).id + ':' + el.textContent.trim().slice(0, 22));
  }
  return vis;
};
run(async ({ open, check }) => {
  const settle = (p) => p.waitForTimeout(330);
  const sweep = async (p, tag) => {
    const H = await p.evaluate(() => document.documentElement.scrollHeight - innerHeight);
    const vh = await p.evaluate(() => innerHeight);
    const bad = []; let n = 0;
    const at = async (y, dir) => {
      await p.evaluate((yy) => window.scrollTo({ top: yy, behavior: 'instant' }), y);
      await settle(p);
      const v = await p.evaluate(COUNT); n++;
      if (v.length > 1) bad.push(`${dir}${Math.round(y)}: ${v.join(' + ')}`);
    };
    const step = Math.round(vh * 0.37);
    for (let y = 0; y <= H; y += step) await at(y, '↓');
    for (let y = H; y >= 0; y -= step * 1.5) await at(y, '↑');
    check(bad.length === 0, `${tag}: paling banyak satu tombol berisi terlihat di setiap posisi gulir (${n} posisi, turun dan naik)`, bad.slice(0, 4).join(' | ') + (bad.length > 4 ? ` … (${bad.length})` : ''));
  };
  for (const vp of ['hp', 'desktop']) {
    const p = await open(vp);
    await sweep(p, vp);
    // setelah mks:change: ganti edisi di #edisi dan pilih paket, baca di posisi yang sama
    const pos = ['#edisi', '#rakit', '#paket', '#alur', '#cara'];
    const bad = [];
    for (const s of pos) {
      await p.evaluate((s) => document.querySelector(s).scrollIntoView({ block: 'start', behavior: 'instant' }), s);
      await settle(p);
      for (const act of ['edisi', 'paket']) {
        await p.evaluate((act) => { const L = window.MKSLamp; L.loadPreset(act === 'edisi' ? 2 : 4); }, act);
        await settle(p);
        const v = await p.evaluate(COUNT);
        if (v.length > 1) bad.push(`${s} ${act}: ${v.join(' + ')}`);
      }
    }
    check(bad.length === 0, `${vp}: setelah mks:change (ganti edisi/paket) tetap paling banyak satu tombol berisi`, bad.join(' | '));
    check(p.__errs.length === 0, `${vp}: tanpa error JS`, p.__errs.join(' | ').slice(0, 200));
  }
  // menu HP dibuka/ditutup
  {
    const p = await open('hp');
    const bad = [];
    for (const s of ['#edisi', '#rakit', '#paket']) {
      await p.evaluate((s) => document.querySelector(s).scrollIntoView({ block: 'start', behavior: 'instant' }), s);
      await settle(p);
      // nav tersembunyi saat gulir turun: gulir naik sedikit (seperti pengguna) supaya tombol menu muncul
      await p.evaluate(() => window.scrollBy({ top: -80, behavior: 'instant' })); await settle(p);
      await p.evaluate(() => document.querySelector('[data-menu-open]').click()); await settle(p);
      const open_ = await p.evaluate(COUNT);
      await p.keyboard.press('Escape'); await settle(p);
      const closed = await p.evaluate(COUNT);
      if (open_.length > 1) bad.push(`${s} menu terbuka: ${open_.join(' + ')}`);
      if (closed.length > 1) bad.push(`${s} menu ditutup: ${closed.join(' + ')}`);
    }
    check(bad.length === 0, 'hp: menu dibuka dan ditutup, paling banyak satu tombol berisi', bad.join(' | '));
    // ganti lebar 390 -> 1440 -> 390 di beberapa posisi
    const bad2 = [];
    for (const s of ['#hero', '#edisi', '#rakit', '#alur', '#paket', '#faq']) {
      for (const w of [[1440, 900], [390, 844]]) {
        await p.setViewportSize({ width: w[0], height: w[1] });
        await p.evaluate((s) => document.querySelector(s).scrollIntoView({ block: 'start', behavior: 'instant' }), s);
        await p.waitForTimeout(450);
        const v = await p.evaluate(COUNT);
        if (v.length > 1) bad2.push(`${s} ${w[0]}: ${v.join(' + ')}`);
      }
    }
    check(bad2.length === 0, 'ganti lebar 390 <-> 1440: paling banyak satu tombol berisi', bad2.join(' | '));
    check(p.__errs.length === 0, 'hp menu/lebar: tanpa error JS', p.__errs.join(' | ').slice(0, 200));
  }
});
