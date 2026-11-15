// Uji invarian bisnis & dasar untuk redesign v3 (tidak bergantung pada markup lama).
// node v3-invariants.js [baseUrl]
const { chromium } = require('playwright');
const BASE = process.argv[2] || 'http://localhost:8787/';
const out = []; const ok = (n, c, i = '') => out.push(`${c ? 'PASS' : 'FAIL'} ${n}${i ? ' — ' + i : ''}`);
const EXP = { totals: [464000, 447000, 454000, 427000, 383000], anchors: [626000, 602000, 612000, 533000, 442000], pkg: { 3: 375000, 4: 398000, 5: 418000 } };
const FORBID = /ber-SNI|laris|terjual|terlaris|paling sering|paling populer|hemat hingga 38/i;
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  for (const [tag, vp, mobile] of [['desktop', { width: 1440, height: 900 }, false], ['laptop', { width: 1366, height: 768 }, false], ['hp390', { width: 390, height: 844 }, true], ['hp360', { width: 360, height: 740 }, true]]) {
    const ctx = await b.newContext({ viewport: vp, isMobile: mobile, hasTouch: mobile });
    const p = await ctx.newPage(); const errs = [];
    p.on('pageerror', (e) => errs.push(String(e)));
    p.on('console', (m) => { if (m.type() === 'error' && !/fonts\.g|ERR_|net::|Failed to load resource/i.test(m.text())) errs.push(m.text()); });
    await p.goto(BASE + 'index.html', { waitUntil: 'load' }); await p.waitForTimeout(800);
    ok(`${tag}: tanpa error JS`, errs.length === 0, errs.join(' | ').slice(0, 300));
    const ov = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    ok(`${tag}: tanpa overflow horizontal`, ov <= 1, `lebih ${ov}px`);
    if (tag === 'desktop' || tag === 'hp390') {
      const prices = await p.evaluate(() => { const L = window.MKSLamp, D = window.MKS_LAMP; if (!L) return null;
        return D.presets.map((pr) => { const c = JSON.parse(JSON.stringify({ head: pr.head, body: pr.body, base: pr.base, wiring: true, led: false })); const r = L.price(c); return { total: r.total, anchor: r.parts + r.wiring }; }); });
      ok(`${tag}: API MKSLamp tersedia`, !!prices);
      if (prices) { ok(`${tag}: harga 5 edisi`, JSON.stringify(prices.map((x) => x.total)) === JSON.stringify(EXP.totals), JSON.stringify(prices.map((x) => x.total)));
        ok(`${tag}: harga coret 5 edisi = satuan + kit`, JSON.stringify(prices.map((x) => x.anchor)) === JSON.stringify(EXP.anchors), JSON.stringify(prices.map((x) => x.anchor))); }
      const txt = await p.evaluate(() => document.body.innerText);
      const bad = (txt.match(FORBID) || [])[0];
      ok(`${tag}: tanpa kata terlarang (ber-SNI/laris/populer/38%)`, !bad, bad || '');
      ok(`${tag}: kalimat "bukan produk bersertifikat SNI" ada`, /bukan produk bersertifikat SNI/i.test(txt));
      ok(`${tag}: frasa "komponen bertanda SNI/K3L" ada`, /komponen bertanda SNI\/K3L/i.test(txt));
      ok(`${tag}: label ILUSTRASI ada`, /ilustrasi/i.test(txt));
      if (tag === 'desktop') ok('desktop: label video AI ada', /dibuat dengan AI/i.test(txt));
      for (const n of [375, 398, 418]) ok(`${tag}: harga paket Rp${n}.000 tampil`, txt.includes(`Rp${n}.000`));
      const wa = await p.evaluate(() => [...document.querySelectorAll('a[href*="wa.me"]')].map((a) => decodeURIComponent(a.href)));
      ok(`${tag}: ada tautan WhatsApp berisi kode rakitan`, wa.some((h) => /Kode: MK-/.test(h)), `${wa.length} tautan`);
      const small = await p.evaluate(() => { let n = 0, ex = ''; for (const el of document.querySelectorAll('body *')) { if (!el.childNodes.length || ![...el.childNodes].some((c) => c.nodeType === 3 && c.textContent.trim())) continue; const cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden') continue; const r = el.getBoundingClientRect(); if (!r.width || !r.height) continue; if (parseFloat(cs.fontSize) < 12) { n++; ex = ex || (el.className + ':' + cs.fontSize); } } return { n, ex }; });
      ok(`${tag}: tidak ada teks < 12px`, small.n === 0, `${small.n} elemen, mis. ${small.ex}`);
    }
    await ctx.close();
  }
  // tautan bagikan + reduced motion
  const ctx = await b.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(String(e)));
  await p.goto(BASE + 'index.html?kode=MK-KERGAD-KUBBAT-BULKRE-TK&zona=jawa#rakit', { waitUntil: 'load' }); await p.waitForTimeout(600);
  const st = await p.evaluate(() => window.MKSLamp && { code: window.MKSLamp.code(window.MKSLamp.state), zone: window.MKSLamp.state.zone });
  ok('tautan bagikan ?kode= dimuat', st && st.code === 'MK-KERGAD-KUBBAT-BULKRE-TK' && st.zone === 'jawa', JSON.stringify(st));
  const hidden = await p.evaluate(() => [...document.querySelectorAll('h1,h2,h3,p')].filter((e) => { const r = e.getBoundingClientRect(); return r.height > 0 && parseFloat(getComputedStyle(e).opacity) < 0.5; }).length);
  ok('reduced-motion: tidak ada judul/paragraf tersembunyi', hidden === 0, `${hidden} elemen opacity<0.5`);
  ok('reduced-motion: tanpa error JS', errs.length === 0, errs.join(' | ').slice(0, 200));
  for (const pg of ['koleksi.html', 'admin.html']) { const e2 = []; const q = await ctx.newPage(); q.on('pageerror', (e) => e2.push(String(e))); await q.goto(BASE + pg, { waitUntil: 'load' }); await q.waitForTimeout(400); ok(`${pg}: tanpa error JS`, e2.length === 0, e2.join(' | ').slice(0, 200)); const t = await q.evaluate(() => document.body.innerText); const bad = (t.match(FORBID) || [])[0]; ok(`${pg}: tanpa kata terlarang`, !bad, bad || ''); await q.close(); }
  await b.close();
  console.log(out.join('\n')); const f = out.filter((l) => l.startsWith('FAIL')).length; console.log(`\n${out.length - f}/${out.length} lolos`); process.exit(f ? 1 : 0);
})().catch((e) => { console.error('CRASH', e); console.log(out.join('\n')); process.exit(2); });
