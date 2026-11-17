// Cek langkah gerak-hapus (adendum v3.1 §4, K1 K5 K6 K9 K10): C1, C4, C5, C17 dan sumbernya.
// Pakai: node tools/qa/c01-gerak-hapus.js <url>
//  C1  selama 60 langkah gulir (hero sampai lewat #kenapa) tidak ada penulisan style pada .story, #hero-stage,
//      <html>; '--story-p' dan '--nav-offset' tidak ada di sumber situs (index.html, koleksi.html, assets/).
//  C4  dihitung dari saat #hero-lamp berisi: --dim panggung hero = 1 dalam 1,2 s tanpa gulir, >= 3 nilai antara
//      opasitas lapisan cahaya terbaca per frame; 0 penulisan --dim selama gulir; reduced motion: sudah menyala
//      saat lampu tergambar; teks "Gulir untuk menyalakan" tidak ada.
//  C5  tidak ada elemen berteks yang terlihat (display/visibility) dengan opasitas efektif 0, kecuali daftar
//      PENGECUALIAN di bawah (kalimat cerita yang sedang tidak tampil saat terpaku, dan penanda selisih harga).
//  C17 reduced motion: 400 ms setelah muat document.getAnimations() kosong; cerita #kenapa bertumpuk.
//  Garis #cara: hanya transform (scaleY), digosok tanpa transisi; reduced motion terisi penuh.
//  Kalimat cerita keluar translateY(-12px) dalam 250 ms, masuk 600 ms.
const { run } = require('./_lib');
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
// Elemen berteks yang boleh ber-opasitas 0 (pola sembunyi yang disengaja dan terdokumentasi):
const PENGECUALIAN = [
  '.story--pin .story__line',     // kalimat cerita yang bukan kalimat aktif (pin #kenapa: satu kalimat tampil)
  '.story--pin .story__close',    // penutup cerita sebelum kalimat terakhir (tetap terjangkau Tab, tampil saat fokus)
  '.price-delta',                 // chip selisih harga nav/orderbar di antara dua perubahan (hidden setelah pudar)
];

function sumber() {
  const files = ['index.html', 'koleksi.html', '404.html', 'admin.html'];
  const walk = (d) => fs.readdirSync(path.join(ROOT, d), { withFileTypes: true }).forEach((e) => { const f = path.join(d, e.name); if (e.isDirectory()) walk(f); else if (/\.(js|css|html)$/.test(e.name)) files.push(f); });
  walk('assets');
  const hit = [];
  // editor.js boleh menyebut #hero-hint di tabel migrasinya (tahap 6 mengarsipkan suntingan lama di alamat itu)
  const KEYS = [[/--story-p(?![\w-])/, '--story-p'], [/--nav-offset/, '--nav-offset'], [/data-rv/, 'data-rv'], [/--rv-i/, '--rv-i'], [/hero-hint/, 'hero-hint', 'assets/js/editor.js'], [/Gulir untuk menyalakan/i, 'Gulir untuk menyalakan', 'assets/js/editor.js']];
  files.forEach((f) => { const t = fs.readFileSync(path.join(ROOT, f), 'utf8'); KEYS.forEach(([re, k, ok]) => { if (f !== ok && re.test(t)) hit.push(`${f}: ${k}`); }); });
  return hit;
}

// Hitung setiap penulisan style (setProperty/removeProperty/cssText/atribut style) pada tiga sasaran C1
const SPY = () => {
  window.__w = { story: 0, hero: 0, html: 0, dim: 0, list: [] };
  const who = (decl) => {
    const s = document.querySelector('.story'), h = document.querySelector('#hero-stage');
    return decl === document.documentElement.style ? 'html' : s && decl === s.style ? 'story' : h && decl === h.style ? 'hero' : null;
  };
  const P = CSSStyleDeclaration.prototype;
  for (const m of ['setProperty', 'removeProperty']) {
    const o = P[m];
    P[m] = function (k, ...a) { const w = who(this); if (w && window.__count) { window.__w[w]++; window.__w.list.push(w + ':' + k); } if (w === 'hero' && k === '--dim') window.__w.dim++; return o.call(this, k, ...a); };
  }
  // atribut style ditulis langsung (setAttribute / cssText) juga dihitung lewat MutationObserver
  addEventListener('DOMContentLoaded', () => {
    new MutationObserver((ms) => ms.forEach((m) => { if (!window.__count) return; const t = m.target; const w = t === document.documentElement ? 'html' : t.matches('.story') ? 'story' : t.id === 'hero-stage' ? 'hero' : null; if (w) window.__w.list.push('mo:' + w); })).observe(document.documentElement, { attributes: true, attributeFilter: ['style'], subtree: true });
  });
  // waktu #hero-lamp berisi
  window.__lampAt = null;
  addEventListener('DOMContentLoaded', () => {
    const host = document.querySelector('#hero-lamp');
    if (!host) return;
    const mark = () => { if (window.__lampAt == null && host.querySelector('svg')) window.__lampAt = performance.now(); };
    new MutationObserver(mark).observe(host, { childList: true }); mark();
    // baca per frame: --dim panggung dan opasitas lapisan cahaya
    window.__frames = [];
    const st = document.querySelector('#hero-stage');
    const tick = () => { const lit = host.querySelector('[data-la-lit]'); const cs = lit && getComputedStyle(lit); window.__frames.push({ t: performance.now(), dim: st ? getComputedStyle(st).getPropertyValue('--dim').trim() : '', op: cs ? +cs.opacity : null, wk: !!(st && st.classList.contains('is-waking')), tr: cs ? cs.transitionDuration + '|' + cs.transitionDelay : '' }); if (window.__frames.length < 240) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  });
};

run(async ({ open, check }) => {
  const hit = sumber();
  check(hit.length === 0, 'C1 sumber: --story-p, --nav-offset, data-rv/--rv-i, #hero-hint dan "Gulir untuk menyalakan" tidak ada di sumber situs', hit.join(' | '));

  for (const vp of ['desktop', 'hp']) {
    /* ---------- C4: nyala hero tanpa gulir ---------- */
    let p = await open(vp, { init: SPY, wait: 1600 });
    const h = await p.evaluate(() => {
      const f = window.__frames.filter((x) => x.t >= window.__lampAt);
      const one = f.find((x) => parseFloat(x.dim) === 1);
      const ops = [...new Set(f.filter((x) => x.op != null).map((x) => x.op.toFixed(3)))];
      const lo = Math.min(...ops.map(Number)), hi = Math.max(...ops.map(Number));
      // cahaya sungguh penuh (opasitas lapisan cahaya, bukan hanya --dim yang langsung 1 saat ditulis) dan durasinya
      const full = f.find((x) => x.op != null && x.op >= 0.99);
      const wk = f.find((x) => x.wk);
      return { tFull: full ? Math.round(full.t - window.__lampAt) : null, wkTr: wk ? wk.tr : '', lampAt: window.__lampAt, t1: one ? Math.round(one.t - window.__lampAt) : null, mids: ops.filter((o) => +o > lo + 0.01 && +o < hi - 0.01).length, lo, hi, dimWrites: window.__w.dim, text: document.body.innerText.includes('Gulir untuk menyalakan') };
    });
    check(h.lampAt != null && h.t1 != null && h.t1 <= 1200, `C4 ${vp}: --dim hero = 1 dalam 1,2 s sejak #hero-lamp berisi, tanpa gulir`, `${h.t1} ms`);
    check(h.tFull != null && h.tFull <= 1200, `C4 ${vp}: opasitas lapisan cahaya hero >= 0,99 dalam 1,2 s sejak #hero-lamp berisi`, `${h.tFull} ms`);
    check(h.wkTr === '0.6s|0.2s', `C4 ${vp}: selama .is-waking transisi lapisan cahaya 600 ms dengan delay 200 ms`, h.wkTr || 'tidak terbaca');
    check(h.mids >= 3, `C4 ${vp}: >= 3 nilai antara opasitas lapisan cahaya terbaca per frame (transisi, bukan lompatan)`, `${h.mids} nilai antara, ${h.lo.toFixed(2)} → ${h.hi.toFixed(2)}`);
    check(h.dimWrites === 1, `C4 ${vp}: lamp.js menulis --dim hero tepat satu kali saat muat`, `${h.dimWrites} kali`);
    check(!h.text, `C4 ${vp}: teks "Gulir untuk menyalakan" tidak ada`);

    /* ---------- C1: 60 langkah gulir ---------- */
    const end = await p.evaluate(() => { const s = document.querySelector('#kenapa'); return s.offsetTop + s.offsetHeight + innerHeight; });
    await p.evaluate(() => { window.__w.list = []; window.__w.story = window.__w.hero = window.__w.html = window.__w.dim = 0; window.__count = true; });
    for (let i = 1; i <= 60; i++) {
      await p.evaluate((y) => new Promise((r) => { window.scrollTo({ top: y, behavior: 'instant' }); requestAnimationFrame(() => requestAnimationFrame(r)); }), Math.round((end * i) / 60));
    }
    for (let i = 59; i >= 0; i -= 3) await p.evaluate((y) => new Promise((r) => { window.scrollTo({ top: y, behavior: 'instant' }); requestAnimationFrame(() => requestAnimationFrame(r)); }), Math.round((end * i) / 60));
    const w = await p.evaluate(() => window.__w);
    check(w.list.length === 0, `C1 ${vp}: 60 langkah gulir turun (+20 naik) tanpa penulisan style pada .story, #hero-stage, <html>`, w.list.slice(0, 8).join(', ') + (w.list.length > 8 ? ` … (${w.list.length})` : ''));
    check(w.dim === 0, `C4 ${vp}: 0 penulisan --dim hero selama gulir`, `${w.dim}`);
    // pin cerita tetap berjalan (kalimat bertukar)
    const story = await p.evaluate(async () => {
      const s = document.querySelector('.story');
      const out = { pin: s.classList.contains('story--pin'), steps: [] };
      const top = s.offsetTop, H = s.offsetHeight - innerHeight;
      for (const f of [0.1, 0.5, 0.9]) { window.scrollTo({ top: top + H * f, behavior: 'instant' }); await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))); out.steps.push(s.dataset.step); }
      return out;
    });
    check(story.pin && story.steps.join() === '0,1,2', `C1 ${vp}: cerita #kenapa tetap terpaku dan bertukar kalimat (data-step 0,1,2)`, JSON.stringify(story));

    /* ---------- kalimat cerita: keluar -12 px 250 ms, masuk 600 ms ---------- */
    await p.waitForTimeout(700); // transisi kalimat selesai
    const ln = await p.evaluate(() => {
      const past = document.querySelector('.story--pin .story__line.is-past'), on = document.querySelector('.story--pin .story__line.is-on');
      const t = (el) => { const cs = getComputedStyle(el); return { tr: cs.transform, d: cs.transitionDuration, p: cs.transitionProperty }; };
      return { past: past && t(past), on: on && t(on) };
    });
    check(ln.past && /matrix\(1, 0, 0, 1, 0, -12\)/.test(ln.past.tr) && /^0\.25s/.test(ln.past.d) && ln.on && /^0\.6s/.test(ln.on.d), `#kenapa ${vp}: kalimat keluar translateY(-12px) dalam 250 ms, masuk 600 ms`, JSON.stringify(ln));

    /* ---------- garis #cara ---------- */
    const cara = await p.evaluate(async () => {
      const s = document.querySelector('#cara .steps-l'), line = s && s.querySelector('.steps-l__fill');
      if (!line) return null;
      const r0 = s.getBoundingClientRect();
      const go = async (y) => { window.scrollTo({ top: y, behavior: 'instant' }); await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))); const cs = getComputedStyle(line); return { tr: cs.transform, tp: cs.transitionProperty, td: cs.transitionDuration, h: line.offsetHeight }; };
      const top = r0.top + scrollY;
      const a = await go(top - innerHeight), b = await go(top + r0.height / 2 - innerHeight * 0.75), c = await go(top + r0.height);
      return { a, b, c, done: s.querySelectorAll('.step.is-done').length };
    });
    const sy = (tr) => { const m = /matrix\(([^)]+)\)/.exec(tr || ''); return m ? +m[1].split(',')[3] : tr === 'none' ? 1 : NaN; };
    check(cara && sy(cara.a.tr) === 0 && sy(cara.b.tr) > 0.3 && sy(cara.b.tr) < 0.7 && sy(cara.c.tr) === 1 && cara.a.h === cara.c.h && (cara.b.td === '0s'), `#cara ${vp}: garis progres digosok lewat transform scaleY (0 → ±0,5 → 1), tinggi tetap, tanpa transisi`, cara && `${cara.a.tr} | ${cara.b.tr} | ${cara.c.tr} | ${cara.b.tp} ${cara.b.td} | done ${cara.done}`);

    /* ---------- C5 ---------- */
    for (const y of ['top', 'mid', 'all']) {
      const bad = await p.evaluate(async ({ EX, y }) => {
        const pos = y === 'top' ? [0] : y === 'mid' ? [document.querySelector('#kenapa').offsetTop + innerHeight * 0.3] : Array.from({ length: Math.ceil(document.documentElement.scrollHeight / innerHeight) }, (_, i) => i * innerHeight);
        const out = new Set();
        for (const t of pos) {
          window.scrollTo({ top: t, behavior: 'instant' });
          await new Promise((r) => setTimeout(r, 900));
          document.querySelectorAll('main *, .nav *, #orderbar *').forEach((el) => {
            if (!el.childNodes.length || ![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) return;
            const cs = getComputedStyle(el);
            if (cs.visibility !== 'visible' || !el.getClientRects().length) return;
            let op = 1, n = el; while (n && n.nodeType === 1) { op *= +getComputedStyle(n).opacity; n = n.parentElement; }
            if (op > 0.001) return;
            if (EX.some((s) => el.closest(s))) return;
            out.add(`${el.tagName.toLowerCase()}.${String(el.className).split(' ')[0]} "${el.textContent.trim().slice(0, 30)}"`);
          });
        }
        return [...out];
      }, { EX: PENGECUALIAN, y });
      check(bad.length === 0, `C5 ${vp} (${y === 'top' ? 'puncak' : y === 'mid' ? 'di dalam pin #kenapa' : 'sepanjang halaman'}): tidak ada teks terlihat ber-opasitas efektif 0 di luar pengecualian`, bad.slice(0, 6).join(' | '));
    }
    check(p.__errs.length === 0, `${vp}: tanpa error JS`, p.__errs.join(' | ').slice(0, 200));

    /* ---------- reduced motion: C4 + C17 + garis #cara ---------- */
    p = await open(vp, { reduce: true, init: SPY, wait: 400 });
    const r = await p.evaluate(() => {
      const f = window.__frames.filter((x) => x.t >= window.__lampAt);
      const s = document.querySelector('.story'), line = document.querySelector('#cara .steps-l__fill');
      return { anims: document.getAnimations().map((a) => (a.effect && a.effect.target ? a.effect.target.className || a.effect.target.tagName : '?') + ':' + (a.animationName || a.transitionProperty || '')), first: f[0] && f[0].dim, ops: [...new Set(f.map((x) => x.op))], pin: s.classList.contains('story--pin'), lines: [...s.querySelectorAll('.story__line')].map((l) => +getComputedStyle(l).opacity), cara: line ? getComputedStyle(line).transform : null, off: document.documentElement.classList.contains('motion-off') };
    });
    check(r.anims.length === 0, `C17 ${vp} reduce: 400 ms setelah muat document.getAnimations() kosong`, r.anims.slice(0, 5).join(', '));
    check(!r.pin && r.lines.every((o) => o === 1), `C17 ${vp} reduce: cerita #kenapa bertumpuk, semua kalimat terlihat`, JSON.stringify({ pin: r.pin, lines: r.lines }));
    check(parseFloat(r.first) === 1 && r.ops.length === 1, `C4 ${vp} reduce: hero dirender sudah menyala (--dim 1 di frame pertama setelah lampu tergambar, tanpa nilai antara)`, `dim ${r.first}, opasitas ${r.ops.join('/')}`);
    check(r.cara === 'none' || /matrix\(1, 0, 0, 1, 0, 0\)/.test(r.cara), `#cara ${vp} reduce: garis progres terisi penuh`, r.cara);
    check(p.__errs.length === 0, `${vp} reduce: tanpa error JS`, p.__errs.join(' | ').slice(0, 200));
  }

  /* ---------- perubahan prefers-reduced-motion selama kunjungan ---------- */
  const p = await open('desktop');
  await p.evaluate(() => { const s = document.querySelector('.story'); window.scrollTo({ top: s.offsetTop + (s.offsetHeight - innerHeight) * 0.5, behavior: 'instant' }); });
  await p.waitForTimeout(300);
  const before = await p.evaluate(() => document.querySelector('.story').classList.contains('story--pin'));
  await p.emulateMedia({ reducedMotion: 'reduce' });
  await p.waitForTimeout(600);
  const after = await p.evaluate(() => ({ pin: document.querySelector('.story').classList.contains('story--pin'), off: document.documentElement.classList.contains('motion-off'), lines: [...document.querySelectorAll('.story__line')].map((l) => +getComputedStyle(l).opacity) }));
  await p.emulateMedia({ reducedMotion: 'no-preference' });
  await p.waitForTimeout(300);
  const back = await p.evaluate(() => ({ pin: document.querySelector('.story').classList.contains('story--pin'), on: document.documentElement.classList.contains('motion-on') }));
  check(before && !after.pin && after.off && after.lines.every((o) => o > 0.99) && back.pin && back.on, 'motion.js mendengarkan prefers-reduced-motion: pin cerita dilepas saat diaktifkan, kembali saat dimatikan', JSON.stringify({ before, after, back }));
});
