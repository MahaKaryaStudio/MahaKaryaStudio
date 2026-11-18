// Cek langkah gerak (adendum v3.1, K7 huruf sendiri, muat awal bertahap, anggaran HP). Angka lab dari Chromium headless.
// Pakai: node tools/qa/c28-gerak.js <url serve-gz.js> [--only=c18,huruf,transfer,lt,bertahap,cls,c24,tab,kedua] [--json=<berkas>]
//  - c18      : 0 permintaan ke fonts.googleapis.com / fonts.gstatic.com, tanpa berkas GSAP atau three, HTML/CSS/JS
//               dilayani dengan content-encoding gzip (jalankan lewat serve-gz.js).
//  - huruf    : lima berkas woff2 bernama seperti adendum di assets/vendor/fonts, total <= 230 KB, lisensi OFL, tepat satu
//               preload (Fraunces roman) di index dan koleksi, tanpa tautan Google Fonts di HTML mentah.
//  - transfer : muat pertama HP 390 × 844 di kabel tanpa gulir (video diblokir): <= 345 KB dan <= 19 permintaan.
//  - lt       : CPU 4x + 1,6 Mbps / RTT 150 ms: long task terpanjang <= 200 ms, total blocking time <= 350 ms
//               (jumlah bagian > 50 ms dari semua long task sampai load + 2 s), node DOM saat load <= 4.000.
//  - bertahap : 2 s setelah load, tanpa gulir: semua wadah [data-dynamic] terisi (kecuali dialog tertutup), setiap
//               [data-wa] punya href wa.me. Siluet #pita (topeng CSS) dihitung terisi lewat .is-on.
//  - cls      : CLS < 0,05 saat muat dan sepanjang gulir penuh (390 dan 1440).
//  - c24      : #paket, #faq, ?kode=…#rakit tepat setelah muat: sasaran 0–120 px dari atas viewport, bergeser <= 8 px
//               dalam 2,5 s sesudahnya (390 dan 1440).
//  - tab      : Tab tepat setelah muat, tanpa gulir, mencapai semua kontrol yang bisa di-Tab (dihitung setelah semua
//               seksi selesai dirender).
//  - kedua    : kunjungan kedua dengan cache kedaluwarsa (setara 10 menit di GitHub Pages: max-age=600 + ETag; butuh
//               serve-gz.js --pages): mencatat permintaan bersyarat (304) dan apakah huruf dipakai sebelum termuat
//               (kedipan) pada RTT 150 ms. Informatif: hanya gagal bila ada galat halaman.
const { run } = require('./_lib');
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const FONTS = {
  'fraunces-latin-opsz-normal.woff2': 67304, 'fraunces-latin-opsz-italic.woff2': 81520,
  'inter-latin-wght-normal.woff2': 48256, 'dm-mono-latin-400-normal.woff2': 14872, 'dm-mono-latin-500-normal.woff2': 15024,
};
const HP = [390, 844, true], DESK = [1440, 900, false];
const SLOW = { offline: false, latency: 150, downloadThroughput: 1.6e6 / 8, uploadThroughput: 750e3 / 8 };

run(async ({ check, base, opt, browser }) => {
  const only = opt.only ? String(opt.only).split(',') : null;
  const on = (k) => !only || only.includes(k);
  const out = {};
  const ctxOf = async (vp, o = {}) => {
    const [w, h, m] = vp;
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, isMobile: m, hasTouch: m, deviceScaleFactor: 1 });
    if (o.blockVideo !== false) await ctx.route(/\.(mp4|webm)(\?|$)/, (r) => r.abort());
    return ctx;
  };
  // pengamat dipasang sebelum skrip halaman: long task, layout shift, cat pertama
  const OBS = () => {
    window.__lt = []; window.__cls = 0; window.__shifts = [];
    try { new PerformanceObserver((l) => l.getEntries().forEach((e) => window.__lt.push([e.startTime, e.duration]))).observe({ type: 'longtask', buffered: true }); } catch {}
    try { new PerformanceObserver((l) => l.getEntries().forEach((e) => { if (!e.hadRecentInput) { window.__cls += e.value; window.__shifts.push([Math.round(e.startTime), +e.value.toFixed(4), (e.sources || []).map((s) => s.node && (s.node.id || s.node.className || s.node.nodeName)).join('|').slice(0, 120)]); } })).observe({ type: 'layout-shift', buffered: true }); } catch {}
  };

  /* ---------- C18 + transfer (HP, kabel, tanpa gulir) ---------- */
  if (on('c18') || on('transfer')) {
    const ctx = await ctxOf(HP);
    const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(String(e)));
    const cdp = await ctx.newCDPSession(p);
    await cdp.send('Network.enable');
    await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
    const reqs = new Map();
    cdp.on('Network.requestWillBeSent', (e) => { if (!/^data:/.test(e.request.url)) reqs.set(e.requestId, { url: e.request.url, bytes: 0, enc: '' }); });
    cdp.on('Network.responseReceived', (e) => { const r = reqs.get(e.requestId); if (r) { r.enc = (e.response.headers['content-encoding'] || e.response.headers['Content-Encoding'] || ''); r.type = e.type; r.status = e.response.status; } });
    cdp.on('Network.loadingFinished', (e) => { const r = reqs.get(e.requestId); if (r) r.bytes = e.encodedDataLength; });
    cdp.on('Network.loadingFailed', (e) => { const r = reqs.get(e.requestId); if (r) r.failed = e.errorText; });
    await p.goto(base + 'index.html', { waitUntil: 'load' });
    await p.waitForTimeout(3000);
    const all = [...reqs.values()];
    const ok = all.filter((r) => !r.failed);
    const google = all.filter((r) => /fonts\.(googleapis|gstatic)\.com/.test(r.url));
    const lib = all.filter((r) => /gsap|three(\.module)?(\.min)?\.js|lamp3d/i.test(r.url));
    const textNoGz = ok.filter((r) => /\.(html|css|js)(\?|$)|\/$/.test(r.url) && r.status === 200 && !/gzip/.test(r.enc));
    const kb = ok.reduce((s, r) => s + r.bytes, 0) / 1024;
    out.transfer = { kb: +kb.toFixed(1), n: ok.length, list: ok.map((r) => [r.url.replace(base, ''), +(r.bytes / 1024).toFixed(1)]) };
    if (on('c18')) {
      check(google.length === 0, 'C18 0 permintaan ke fonts.googleapis.com / fonts.gstatic.com', google.map((r) => r.url).join(' ') || '0');
      check(lib.length === 0, 'C18 tanpa berkas GSAP / three / lamp3d saat muat', lib.map((r) => r.url).join(' ') || '0');
      check(textNoGz.length === 0, 'C18 HTML/CSS/JS dilayani gzip', textNoGz.map((r) => r.url.replace(base, '')).join(' ') || 'semua gzip');
    }
    if (on('transfer')) {
      check(kb <= 345 && ok.length <= 19, 'transfer muat pertama HP (kabel, tanpa video) <= 345 KB dan <= 19 permintaan', `${kb.toFixed(1)} KB, ${ok.length} permintaan`);
      console.log('      ' + out.transfer.list.map((x) => x.join(' ')).join('\n      '));
    }
    check(!errs.length, 'muat HP tanpa galat halaman', errs.join(' | '));
    await ctx.close();
  }

  /* ---------- Huruf ---------- */
  if (on('huruf')) {
    const dir = path.join(ROOT, 'assets', 'vendor', 'fonts');
    const have = fs.existsSync(dir) ? fs.readdirSync(dir) : [];
    const woff = have.filter((f) => f.endsWith('.woff2'));
    const named = Object.keys(FONTS).every((f) => woff.includes(f)) && woff.length === 5;
    const total = woff.reduce((s, f) => s + fs.statSync(path.join(dir, f)).size, 0);
    check(named, 'huruf: lima berkas woff2 bernama seperti adendum', woff.join(', '));
    check(total <= 230 * 1024 && total > 0, 'huruf: total <= 230 KB', `${total} B`);
    const sizes = Object.entries(FONTS).filter(([f, b]) => woff.includes(f) && fs.statSync(path.join(dir, f)).size !== b);
    check(!sizes.length, 'huruf: ukuran berkas sama dengan paket npm yang dikunci', sizes.map(([f]) => f).join(', ') || 'sama');
    const lic = have.filter((f) => /OFL|LICENSE/i.test(f));
    check(lic.length >= 3 && lic.every((f) => /Open Font License/.test(fs.readFileSync(path.join(dir, f), 'utf8'))), 'huruf: lisensi OFL ikut (tiga keluarga)', lic.join(', '));
    for (const page of ['index.html', 'koleksi.html', '404.html']) {
      const html = fs.readFileSync(path.join(ROOT, page), 'utf8');
      const pre = [...html.matchAll(/<link[^>]+rel="preload"[^>]*>/g)].map((m) => m[0]);
      check(!/fonts\.(googleapis|gstatic)\.com/.test(html), `huruf: ${page} tanpa tautan/preconnect Google Fonts`);
      if (page === '404.html') continue;
      check(pre.length === 1 && /as="font"/.test(pre[0]) && /fraunces-latin-opsz-normal\.woff2/.test(pre[0]) && /crossorigin/.test(pre[0]), `huruf: ${page} tepat satu preload (Fraunces roman, crossorigin)`, pre.join(' ') || 'tidak ada');
    }
    const css = fs.readFileSync(path.join(ROOT, 'assets/css/base.css'), 'utf8');
    const faces = [...css.matchAll(/@font-face\s*{[^}]*}/g)].map((m) => m[0]).filter((f) => /vendor\/fonts/.test(f));
    check(faces.length === 5 && faces.every((f) => /font-display:\s*(swap|optional)/.test(f) && /url\("?\.\.\/vendor\/fonts\//.test(f) && !/font-weight:\s*100 900/.test(f)), 'huruf: lima @font-face di base.css (url relatif, font-display, bobot dibatasi)', `${faces.length} face`);
    check(/"Fraunces Fallback"/.test(css) && /"Inter Fallback"/.test(css) && /"DM Mono Fallback"/.test(css), 'huruf: fallback metrik lama tetap');
    // huruf benar-benar dipakai di halaman (index dan koleksi)
    for (const page of ['index.html', 'koleksi.html']) {
      const ctx = await ctxOf(DESK); const p = await ctx.newPage(); const req = [];
      p.on('request', (r) => req.push(r.url()));
      await p.goto(base + page, { waitUntil: 'load' }); await p.waitForTimeout(1200);
      const st = await p.evaluate(async () => { await document.fonts.ready; return [...document.fonts].filter((f) => f.status === 'loaded').map((f) => `${f.family} ${f.style} ${f.weight}`); });
      const fam = ['Fraunces normal', 'Fraunces italic', 'Inter normal', 'DM Mono normal 400', 'DM Mono normal 500'];
      const miss = fam.filter((k) => !st.some((s) => s.startsWith(k)));
      check(!miss.length, `huruf: ${page} memuat lima face sendiri`, miss.length ? 'kurang ' + miss.join(', ') + ' | ' + st.join(', ') : st.join(', '));
      check(req.filter((u) => /vendor\/fonts/.test(u)).length <= 5 && !req.some((u) => /fonts\.(googleapis|gstatic)/.test(u)), `huruf: ${page} hanya meminta berkas sendiri`, req.filter((u) => /font/.test(u)).map((u) => u.split('/').pop()).join(', '));
      await ctx.close();
    }
  }

  /* ---------- Long task, TBT, DOM (CPU 4x + 1,6 Mbps) ---------- */
  if (on('lt')) {
    const res = [];
    for (let rep = 0; rep < 3; rep++) {
      const ctx = await ctxOf(HP); await ctx.addInitScript(OBS);
      const p = await ctx.newPage(); const cdp = await ctx.newCDPSession(p);
      await cdp.send('Network.enable'); await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
      await cdp.send('Network.emulateNetworkConditions', SLOW);
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
      await p.goto(base + 'index.html', { waitUntil: 'load', timeout: 60000 });
      const domLoad = await p.evaluate(() => document.getElementsByTagName('*').length);
      await p.waitForTimeout(2000);
      const r = await p.evaluate(() => {
        const nav = performance.getEntriesByType('navigation')[0], fcp = (performance.getEntriesByName('first-contentful-paint')[0] || {}).startTime || 0;
        const lt = window.__lt.filter((x) => x[0] + x[1] >= fcp);
        return { load: Math.round(nav.loadEventStart), fcp: Math.round(fcp), max: Math.round(Math.max(0, ...window.__lt.map((x) => x[1]))), tbt: Math.round(lt.reduce((s, x) => s + Math.max(0, x[1] - 50), 0)), n: window.__lt.length, all: window.__lt.map((x) => `${Math.round(x[0])}+${Math.round(x[1])}`).join(' '), dom: document.getElementsByTagName('*').length };
      });
      r.domLoad = domLoad; res.push(r);
      await ctx.close();
    }
    const med = (k) => [...res.map((r) => r[k])].sort((a, b) => a - b)[1];
    out.lt = res;
    res.forEach((r, i) => console.log(`      lintasan ${i + 1}: FCP ${r.fcp} ms, load ${r.load} ms, long task maks ${r.max} ms, TBT ${r.tbt} ms, DOM load ${r.domLoad} / +2 s ${r.dom}; ${r.all}`));
    check(med('max') <= 200, 'long task terpanjang saat muat <= 200 ms (CPU 4x + 1,6 Mbps, median 3)', `${med('max')} ms (${res.map((r) => r.max).join(' / ')})`);
    check(med('tbt') <= 350, 'total blocking time <= 350 ms (CPU 4x + 1,6 Mbps, median 3)', `${med('tbt')} ms (${res.map((r) => r.tbt).join(' / ')})`);
    check(Math.max(...res.map((r) => r.domLoad)) <= 4000, 'node DOM saat load <= 4.000', `${res.map((r) => r.domLoad).join(' / ')} (2 s sesudahnya ${res.map((r) => r.dom).join(' / ')})`);
  }

  /* ---------- Muat bertahap ---------- */
  if (on('bertahap')) {
    for (const [nm, vp] of [['390', HP], ['1440', DESK]]) {
      const ctx = await ctxOf(vp); const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(String(e)));
      const cdp = await ctx.newCDPSession(p); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
      await p.goto(base + 'index.html', { waitUntil: 'load' });
      await p.waitForTimeout(2000);
      const r = await p.evaluate(() => {
        const empty = [...document.querySelectorAll('[data-dynamic]')].filter((el) => !(el.tagName === 'DIALOG' && !el.open) && el.id !== 'orderbar' && !el.textContent.trim() && !el.querySelector('svg,img,button,input') && !el.classList.contains('is-on'));
        const wa = [...document.querySelectorAll('[data-wa]')].filter((a) => !/^https:\/\/wa\.me\/\d+/.test(a.getAttribute('href') || ''));
        return { n: document.querySelectorAll('[data-dynamic]').length, empty: empty.map((e) => e.id || e.className), wa: wa.map((a) => a.outerHTML.slice(0, 80)), y: scrollY, nwa: document.querySelectorAll('[data-wa]').length };
      });
      check(!r.empty.length && r.y === 0, `bertahap ${nm}: 2 s setelah load (CPU 4x) semua wadah [data-dynamic] terisi tanpa gulir`, r.empty.length ? 'kosong: ' + r.empty.join(', ') : `${r.n} wadah`);
      check(!r.wa.length, `bertahap ${nm}: setiap [data-wa] punya href wa.me`, r.wa.join(' | ') || `${r.nwa} tautan`);
      check(!errs.length, `bertahap ${nm}: tanpa galat`, errs.join(' | '));
      await ctx.close();
    }
  }

  /* ---------- CLS ---------- */
  if (on('cls')) {
    for (const [nm, vp] of [['390', HP], ['1440', DESK]]) {
      const ctx = await ctxOf(vp); await ctx.addInitScript(OBS); const p = await ctx.newPage();
      await p.goto(base + 'index.html', { waitUntil: 'load' });
      await p.waitForTimeout(1500);
      const atLoad = await p.evaluate(() => window.__cls);
      // gulir penuh dengan roda (input gulir tidak dihitung sebagai hadRecentInput, jadi pergeseran karena render terlambat terlihat)
      const H = await p.evaluate(() => document.documentElement.scrollHeight);
      for (let y = 0; y < H; y += vp[1] * 0.6) { await p.mouse.wheel(0, vp[1] * 0.6); await p.waitForTimeout(120); }
      await p.waitForTimeout(600);
      const r = await p.evaluate(() => ({ cls: window.__cls, shifts: window.__shifts.filter((s) => s[1] >= 0.002).slice(0, 8) }));
      out['cls' + nm] = { atLoad, total: r.cls };
      check(atLoad < 0.05, `CLS ${nm} saat muat < 0,05`, atLoad.toFixed(4));
      check(r.cls < 0.05, `CLS ${nm} sepanjang gulir penuh < 0,05`, r.cls.toFixed(4) + (r.shifts.length ? ' ' + JSON.stringify(r.shifts) : ''));
      await ctx.close();
    }
  }

  /* ---------- C24 mendarat ---------- */
  if (on('c24')) {
    const kode = await (async () => { const ctx = await ctxOf(DESK); const p = await ctx.newPage(); await p.goto(base + 'index.html', { waitUntil: 'load' }); await p.waitForTimeout(500); const k = await p.evaluate(() => { const L = window.MKSLamp; const s = JSON.parse(JSON.stringify(L.state)); s.body = s.body.slice(0, 1); s.led = true; return L.code(s); }); await ctx.close(); return k; })();
    for (const [nm, vp] of [['390', HP], ['1440', DESK]]) {
      for (const [lbl, url, sel] of [['#paket', 'index.html#paket', '#paket'], ['#faq', 'index.html#faq', '#faq'], ['?kode=…#rakit', `index.html?kode=${kode}#rakit`, '#rakit']]) {
        const ctx = await ctxOf(vp); const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(String(e)));
        const cdp = await ctx.newCDPSession(p); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
        await p.goto(base + url, { waitUntil: 'load' });
        await p.waitForTimeout(400);
        const t0 = await p.evaluate((s) => Math.round(document.querySelector(s).getBoundingClientRect().top), sel);
        const ys = [];
        for (let i = 0; i < 10; i++) { await p.waitForTimeout(250); ys.push(await p.evaluate((s) => Math.round(document.querySelector(s).getBoundingClientRect().top), sel)); }
        const drift = Math.max(...ys.map((y) => Math.abs(y - t0)));
        check(t0 >= 0 && t0 <= 120 && drift <= 8 && !errs.length, `C24 ${nm} ${lbl}: mendarat 0–120 px dari atas, bergeser <= 8 px sesudahnya`, `top ${t0} px, geser maks ${drift} px (${ys.join(',')})${errs.length ? ' galat ' + errs.join(' | ') : ''}`);
        if (lbl.startsWith('?kode')) {
          const got = await p.evaluate(() => window.MKSLamp.code(window.MKSLamp.state));
          check(got === kode, `C24 ${nm} ?kode=: rakitan dari tautan dimuat`, got);
        }
        await ctx.close();
      }
    }
  }

  /* ---------- Tab tanpa gulir ---------- */
  if (on('tab')) {
    for (const [nm, vp] of [['1440', DESK], ['390', HP]]) {
      const ctx = await ctxOf(vp); const p = await ctx.newPage();
      await p.goto(base + 'index.html', { waitUntil: 'load' });
      await p.waitForTimeout(50);
      const seen = new Set(); let guard = 0, wrapped = false;
      await p.evaluate(() => { document.querySelectorAll('*').forEach((el, i) => { el.__k = i; }); });
      while (guard++ < 700) {
        await p.keyboard.press('Tab');
        const k = await p.evaluate(() => { const a = document.activeElement; if (!a || a === document.body) return null; if (!a.dataset.qtab) a.dataset.qtab = String(Math.random()).slice(2); return a.dataset.qtab; });
        if (k == null) { if (seen.size) { wrapped = true; break; } continue; }
        if (seen.has(k)) { wrapped = true; break; }
        seen.add(k);
      }
      // kontrol yang bisa di-Tab setelah semua seksi dirender (terlihat, tidak inert, tabindex >= 0, di luar dialog tertutup)
      const r = await p.evaluate(() => {
        const sel = 'a[href],button,input,select,textarea,summary,[tabindex]';
        const list = [...document.querySelectorAll(sel)].filter((el) => {
          if (el.disabled || el.tabIndex < 0 || el.closest('[inert],dialog:not([open]),[hidden]')) return false;
          if (el.tagName === 'INPUT' && el.type === 'radio' && !el.checked) return false;
          // checkVisibility: di dalam <details> tertutup (content-visibility) atau display:none tidak bisa di-Tab
          if (el.checkVisibility && !el.checkVisibility({ visibilityProperty: true })) return false;
          const cs = getComputedStyle(el); if (cs.visibility === 'hidden') return false;
          const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 || el.matches('input[type=radio],input[type=checkbox]');
        });
        const miss = list.filter((el) => !el.dataset.qtab);
        return { n: list.length, miss: miss.slice(0, 8).map((el) => (el.id ? '#' + el.id : el.tagName.toLowerCase() + '.' + String(el.className).split(' ')[0]) + ' ' + (el.textContent || '').trim().slice(0, 24)), nm: miss.length };
      });
      check(r.nm === 0, `Tab ${nm}: tepat setelah muat, Tab tanpa gulir mencapai semua kontrol`, `${seen.size} fokus, ${r.n} kontrol, terlewat ${r.nm}${r.nm ? ': ' + r.miss.join(' | ') : ''}`);
      await ctx.close();
    }
  }

  /* ---------- Kunjungan kedua (cache kedaluwarsa, RTT 150 ms) ---------- */
  if (on('kedua')) {
    // ctx.route mematikan cache HTTP Playwright: video diblokir lewat CDP supaya cache dan ETag bekerja seperti peramban biasa
    const ctx = await ctxOf(HP, { blockVideo: false }); const errs = [];
    const p0 = await ctx.newPage(); p0.on('pageerror', (e) => errs.push(String(e)));
    const c0 = await ctx.newCDPSession(p0); await c0.send('Network.enable');
    await c0.send('Network.setBlockedURLs', { urls: ['*.mp4', '*.webm'] });
    await p0.goto(base + 'index.html', { waitUntil: 'load' }); await p0.waitForTimeout(1500);
    await p0.close();
    // kunjungan kedua di tab baru (cache disk + validasi ulang, bukan cache memori tab lama)
    const p = await ctx.newPage(); p.on('pageerror', (e) => errs.push(String(e)));
    const cdp = await ctx.newCDPSession(p); await cdp.send('Network.enable');
    await cdp.send('Network.setBlockedURLs', { urls: ['*.mp4', '*.webm'] });
    await cdp.send('Network.emulateNetworkConditions', SLOW);
    const st = new Map();
    // status di kabel (304 = permintaan bersyarat berhasil) dari ExtraInfo; responseReceived melaporkan 200 dari cache
    const wire = new Map();
    cdp.on('Network.responseReceivedExtraInfo', (e) => wire.set(e.requestId, e.statusCode));
    cdp.on('Network.responseReceived', (e) => st.set(e.response.url, [e.requestId, e.response.fromDiskCache]));
    await p.addInitScript(() => {
      window.__ff = [];
      const C = { unloaded: 'u', loading: 'g', loaded: 'L', error: 'x' };
      const tick = () => { const s = [...document.fonts].filter((f) => /Fraunces|Inter|DM Mono/.test(f.family) && !/Fallback/.test(f.family)).map((f) => C[f.status]).join(''); window.__ff.push([Math.round(performance.now()), s]); if (performance.now() < 4000) requestAnimationFrame(tick); };
      requestAnimationFrame(tick);
    });
    await p.goto(base + 'index.html', { waitUntil: 'load' }); await p.waitForTimeout(2500);
    const r = await p.evaluate(() => {
      const fcp = (performance.getEntriesByName('first-contentful-paint')[0] || {}).startTime || 0;
      const atFcp = (window.__ff.find((x) => x[0] >= fcp) || window.__ff[0] || [0, ''])[1];
      const done = window.__ff.find((x) => x[1] && !/[ug]/.test(x[1]));
      return { fcp: Math.round(fcp), atFcp, allLoadedAt: done ? done[0] : null };
    });
    const code = (s) => wire.get(s[0]) || (s[1] ? 'cache' : '?');
    const fontsSt = [...st.entries()].filter(([u]) => /vendor\/fonts/.test(u)).map(([u, s]) => u.split('/').pop() + ' ' + code(s));
    const n304 = [...st.values()].filter((s) => wire.get(s[0]) === 304).length;
    out.kedua = { r, fontsSt, n304, total: st.size };
    console.log(`      kunjungan kedua: ${st.size} respons, ${n304} × 304; huruf: ${fontsSt.join(', ') || '-'}; FCP ${r.fcp} ms, status face saat FCP "${r.atFcp}" (L=loaded, g=loading, u=unloaded), semua termuat ${r.allLoadedAt} ms`);
    check(!errs.length, 'kunjungan kedua tanpa galat (informatif: kedipan dicatat di atas)', errs.join(' | '));
    await ctx.close();
  }
  if (opt.json) fs.writeFileSync(opt.json, JSON.stringify(out, null, 2));
});
