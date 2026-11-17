// Cek langkah gerak-edisi (adendum v3.1 §4, K2): 01 #edisi tanpa View Transition.
// Pakai: node tools/qa/c03-gerak-edisi.js <url>      (C2 ketukan beruntun: node tools/qa/c02-taps.js .)
//  Sumber  tidak ada startViewTransition / ::view-transition / vt-edisi di assets dan HTML.
//  Ketuk   ganti edisi lewat ketukan: lampu baru masuk 250 ms (--t-med) di atas lampu lama, yang memudar 150 ms
//          (--t-fast, delay 200); cakupan cahaya per frame (rAF) 1-(1-hantu)(1-baru) >= 0,9; harga (coret + total)
//          crossfade 150 ms dan opasitasnya tidak pernah di bawah 0,4; plakat (cerita, cocok untuk) tidak dianimasikan.
//  C3      panah dan spasi di indeks edisi: tidak ada animasi atau transisi di seluruh dokumen (termasuk chip delta
//          dan harga di orderbar/nav); satu lampu di panggung. Juga di halaman baru tanpa ketukan sebelumnya (chip
//          delta tersembunyi), setelah transisi gulir selesai; chip tetap muncul (seketika) lalu hilang seketika.
//  C10     #edisi, mode biasa: durasi transisi/animasi {0,100,150,250,600}, delay {0,200} (+ visibility 150/250);
//          mode reduce: durasi {0, 0,01, 150}; ganti edisi seketika.
//  C17     400 ms setelah ganti edisi document.getAnimations() kosong (biasa dan reduce).
//  Cepat   20 ganti edisi beruntun (jarak 40 ms): selama itu paling banyak dua lampu, sesudahnya tepat satu; tidak ada
//          id ganda di dokumen; tangkapan panggung sama dengan render tunggal edisi yang sama.
//  C20     catatan kit >= 16 px di 390 dan 360; C13 kalimat kit sama dengan templat (data lamp-data) dan setiap 'SNI'
//          di halaman lolos daftar izin; tanpa kata bukti sosial.
//  C14     harga dan coret 5 edisi di indeks dan plakat = nilai tetap; 'Pilihan studio' tepat sekali dan terlihat
//          di setiap edisi; baris Kebun memuat jumlah bagian dan tinggi; harga plakat tidak bergeser antar edisi.
const { run } = require('./_lib');
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const EXP = { totals: [464000, 447000, 454000, 427000, 383000], anchors: [626000, 602000, 612000, 533000, 442000] };
const rp = (n) => 'Rp' + n.toLocaleString('id-ID');
const SNI_OK = [/bertanda SNI\/K3L/g, /tanda SNI\/K3L/g, /bukan produk bersertifikat SNI/g, /Apakah lampunya bersertifikat SNI\?/g];
const SOSIAL = /ulasan|testimoni|terjual|terlaris|laris|populer|bintang 5|★|pelanggan kami|\d+\+? pembeli/i;
const DUR_OK = [0, 100, 150, 250, 600], DEL_OK = [0, 200], VIS_DEL_OK = [150, 250], DUR_RED = [0, 0.01, 150];

function sumber() {
  const files = ['index.html', 'koleksi.html', '404.html'];
  const walk = (d) => fs.readdirSync(path.join(ROOT, d), { withFileTypes: true }).forEach((e) => { const f = path.join(d, e.name); if (e.isDirectory()) walk(f); else if (/\.(js|css|html)$/.test(e.name)) files.push(f); });
  walk('assets');
  return files.filter((f) => /startViewTransition|::view-transition|vt-edisi/.test(fs.readFileSync(path.join(ROOT, f), 'utf8')));
}

// Semua durasi/delay transisi CSS pada elemen #edisi (termasuk ::before/::after) dan semua animasi yang sedang jalan
const TIMING = () => {
  const ms = (v) => v.split(',').map((x) => { x = x.trim(); return x.endsWith('ms') ? parseFloat(x) : parseFloat(x) * 1000; });
  const out = [];
  for (const el of document.querySelectorAll('#edisi, #edisi *')) for (const pe of [null, '::before', '::after']) {
    const cs = getComputedStyle(el, pe);
    if (pe && cs.content === 'none') continue;
    const props = cs.transitionProperty.split(',').map((x) => x.trim()), dur = ms(cs.transitionDuration), del = ms(cs.transitionDelay);
    props.forEach((p, k) => { const d = dur[k % dur.length], l = del[k % del.length]; if (p === 'all' && d === 0 && l === 0) return; out.push({ kind: 'transition', p, d, l, who: (el.className && el.className.baseVal == null ? String(el.className).split(' ')[0] : el.tagName) + (pe || '') }); });
    const an = cs.animationName; if (an && an !== 'none') ms(cs.animationDuration).forEach((d) => out.push({ kind: 'css-anim', p: an, d, l: 0, who: String(el.className) }));
  }
  return out;
};
const RUNNING = () => document.getAnimations().map((a) => { const t = a.effect && a.effect.getTiming ? a.effect.getTiming() : {}; const tg = a.effect && a.effect.target; return { d: +t.duration || 0, l: +t.delay || 0, who: tg ? (tg.closest('#edisi') ? 'edisi:' : 'luar:') + (tg.getAttribute('class') || tg.tagName) : '?', type: a.constructor.name, prop: a.transitionProperty || '' }; });

async function rowsXY(p) {
  return p.evaluate(() => [...document.querySelectorAll('#edisi-app .edisi__opt')].map((o) => { const r = o.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, on: o.querySelector('input').checked }; }));
}
async function toList(p) {
  await p.evaluate(() => document.querySelectorAll('#edisi-app .edisi__opt')[2].scrollIntoView({ block: 'center', behavior: 'instant' }));
  await p.waitForTimeout(500);
}
async function tapRow(p, i, vp) {
  const rows = await rowsXY(p);
  if (vp === 'desktop') await p.mouse.click(rows[i].x, rows[i].y); else await p.touchscreen.tap(rows[i].x, rows[i].y);
}
// beda piksel dua PNG di dalam browser (tanpa pustaka)
async function diff(p, a, b) {
  return p.evaluate(async ([a, b]) => {
    const img = (s) => new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.src = 'data:image/png;base64,' + s; });
    const [A, B] = await Promise.all([img(a), img(b)]);
    if (A.width !== B.width || A.height !== B.height) return { size: false, n: -1 };
    const c = document.createElement('canvas'); c.width = A.width; c.height = A.height; const x = c.getContext('2d');
    x.drawImage(A, 0, 0); const da = x.getImageData(0, 0, c.width, c.height).data; x.clearRect(0, 0, c.width, c.height); x.drawImage(B, 0, 0); const db = x.getImageData(0, 0, c.width, c.height).data;
    let n = 0, mx = 0; for (let k = 0; k < da.length; k += 4) { const d = Math.max(Math.abs(da[k] - db[k]), Math.abs(da[k + 1] - db[k + 1]), Math.abs(da[k + 2] - db[k + 2])); if (d > 2) n++; if (d > mx) mx = d; }
    return { size: true, n, mx, total: da.length / 4 };
  }, [a.toString('base64'), b.toString('base64')]);
}

run(async ({ open, check }) => {
  const hit = sumber();
  check(hit.length === 0, 'Sumber: tanpa startViewTransition, ::view-transition, vt-edisi', hit.join(', '));

  /* ---------- C3 di halaman baru: panah sebelum ketukan apa pun (chip delta belum tampil) ---------- */
  for (const vp of ['hp', 'hp360', 'desktop']) {
    const p = await open(vp, { wait: 1500 });
    await toList(p);
    await p.waitForTimeout(1200); // transisi yang dipicu gulir (mis. lampu cerita #kenapa 200 + 600 ms) selesai dulu
    const pre = await p.evaluate(() => document.getAnimations().length);
    check(pre === 0, `${vp} C3 halaman baru: sebelum panah tidak ada animasi berjalan (prasyarat)`, String(pre));
    await p.evaluate(() => document.querySelector('#edisi-app input[name="edisi"]:checked').focus());
    const seen = [];
    for (const key of ['ArrowDown', 'ArrowDown', 'ArrowUp']) {
      await p.keyboard.press(key);
      for (const w of [16, 120]) {
        await p.waitForTimeout(w);
        seen.push(...(await p.evaluate(() => document.getAnimations().map((a) => `${(a.effect.target && a.effect.target.getAttribute('class')) || '?'} ${a.transitionProperty || ''}`))));
      }
    }
    const chip = await p.evaluate(() => { const e = document.querySelector(innerWidth < 1024 ? '[data-ob-delta]' : '[data-nav-delta]'); return e ? { on: e.classList.contains('is-on') && !e.hidden, op: getComputedStyle(e).opacity } : null; });
    check(seen.length === 0, `${vp} C3 halaman baru: panah tanpa animasi di seluruh dokumen (chip delta, harga, cerita)`, [...new Set(seen)].join(', '));
    check(!chip || (chip.on && chip.op === '1'), `${vp} C3 halaman baru: chip delta tetap muncul, seketika`, JSON.stringify(chip));
    await p.waitForTimeout(1400);
    const gone = await p.evaluate(() => ({ a: document.getAnimations().length, h: [...document.querySelectorAll('[data-ob-delta], [data-nav-delta]')].every((e) => e.hidden) }));
    check(gone.a === 0 && gone.h, `${vp} C3 halaman baru: chip delta hilang seketika setelah 1,2 s`, JSON.stringify(gone));
    // Tab ke indeks tidak menandai papan ketik (transisi baris tetap hidup)
    await p.evaluate(() => { document.querySelector('#edisi-app .edisi__list').removeAttribute('data-input'); document.querySelector('#edisi-app input[name="edisi"]:checked').focus(); });
    await p.keyboard.press('Shift+Tab'); await p.keyboard.press('Tab');
    const tab = await p.evaluate(() => ({ name: document.activeElement && document.activeElement.name, di: document.querySelector('#edisi-app .edisi__list').getAttribute('data-input') }));
    check(tab.name === 'edisi' && tab.di == null, `${vp}: Tab ke indeks tidak mematikan transisi baris (tanpa data-input)`, JSON.stringify(tab));
    check(p.__errs.length === 0, `${vp} C3 halaman baru: tanpa galat JS`, p.__errs.join(' | ').slice(0, 300));
  }

  for (const vp of ['hp', 'desktop']) {
    const p = await open(vp, { init: () => { window.__vt = 0; const o = Document.prototype.startViewTransition; if (o) Document.prototype.startViewTransition = function (...a) { window.__vt++; return o.apply(this, a); }; } });
    await toList(p);
    /* ---------- ketukan: crossfade panggung, harga 150, plakat seketika ---------- */
    let rows = await rowsXY(p); const start = rows.findIndex((r) => r.on);
    // sampler per frame: cakupan cahaya dua lampu dan opasitas harga, sejak sebelum ketukan sampai 450 ms
    await p.evaluate(() => {
      window.__cov = [];
      const t0 = performance.now();
      const f = () => {
        const s = [...document.querySelectorAll('[data-ed-lamp] > svg')];
        const g = s.find((x) => x.classList.contains('ed-ghost')), n = s.filter((x) => !x.classList.contains('ed-ghost')).pop();
        const o = (x) => (x ? +getComputedStyle(x).opacity : 0);
        const pr = document.querySelector('#edisi-app [data-ed-amount]');
        window.__cov.push({ c: 1 - (1 - o(g)) * (1 - o(n)), pr: +getComputedStyle(pr).opacity });
        if (performance.now() - t0 < 900) requestAnimationFrame(f);
      };
      requestAnimationFrame(f);
    });
    await tapRow(p, (start + 1) % 5, vp);
    await p.waitForTimeout(30);
    const run1 = await p.evaluate(RUNNING);
    const lampAnims = await p.evaluate(() => [...document.querySelectorAll('[data-ed-lamp] > svg')].map((s) => ({ ghost: s.classList.contains('ed-ghost'), d: s.getAnimations().map((a) => a.effect.getTiming().duration) })));
    const g = lampAnims.find((x) => x.ghost), n = lampAnims.find((x) => !x.ghost);
    check(g && g.d[0] === 150 && n && n.d[0] === 250 && lampAnims.length === 2, `${vp} ketukan: lampu lama pudar 150 ms, lampu baru masuk 250 ms`, JSON.stringify(lampAnims));
    const price = await p.evaluate(() => ['[data-ed-amount]', '[data-ed-was]'].map((q) => { const e = document.querySelector('#edisi-app ' + q); return e.hidden ? 'hidden' : e.getAnimations().map((a) => a.effect.getTiming().duration).join(','); }));
    check(price[0] === '150' && (price[1] === '150' || price[1] === 'hidden'), `${vp} ketukan: harga dan coret muncul dalam 150 ms`, price.join(' | '));
    const plak = await p.evaluate(() => ['[data-ed-story]', '[data-ed-room]', '[data-ed-pill]', '.edisi__tag', '[data-ed-label]'].map((q) => document.querySelector('#edisi-app ' + q).getAnimations().length));
    check(plak.every((x) => x === 0), `${vp} ketukan: plakat dan pil berganti seketika`, plak.join(','));
    check(await p.evaluate(() => getComputedStyle(document.querySelector('[data-ed-lamp] > svg.ed-ghost') || document.body).pointerEvents) === 'none', `${vp} ketukan: hantu lampu tidak menerima ketukan`);
    const tAll = run1.filter((a) => a.who.startsWith('edisi:'));
    const badRun = tAll.filter((a) => !DUR_OK.includes(a.d) || !DEL_OK.includes(a.l));
    check(badRun.length === 0, `${vp} C10 biasa: animasi yang berjalan di #edisi memakai durasi token`, badRun.map((a) => `${a.who} ${a.d}/${a.l}`).join('; ') || tAll.map((a) => a.d).join(','));
    await p.waitForTimeout(370);
    const left = await p.evaluate(RUNNING);
    check(left.length === 0, `${vp} C17: 400 ms setelah ganti edisi getAnimations() kosong`, left.map((a) => `${a.who} ${a.d}`).join('; '));
    await p.waitForTimeout(500);
    const cov = await p.evaluate(() => window.__cov);
    const minC = Math.min(...cov.map((x) => x.c)), minP = Math.min(...cov.map((x) => x.pr));
    check(cov.length > 10 && minC >= 0.9, `${vp} ketukan: cahaya panggung tidak meredup di tengah crossfade (cakupan min >= 0,9)`, `min ${minC.toFixed(3)} dari ${cov.length} frame`);
    check(minP >= 0.4, `${vp} ketukan: harga tidak pernah tak terbaca (opasitas min >= 0,4)`, `min ${minP.toFixed(2)}`);
    check(await p.evaluate(() => document.querySelectorAll('[data-ed-lamp] > svg').length) === 1, `${vp} ketukan: satu lampu tersisa di panggung`);
    /* ---------- C10 transisi CSS yang dideklarasikan di #edisi ---------- */
    const tm = await p.evaluate(TIMING);
    const badT = tm.filter((t) => !DUR_OK.includes(t.d) || !(DEL_OK.includes(t.l) || (t.p === 'visibility' && VIS_DEL_OK.includes(t.l))));
    check(badT.length === 0, `${vp} C10 biasa: transisi CSS #edisi pada token`, badT.map((t) => `${t.who} ${t.p} ${t.d}/${t.l}`).join('; ') || `${tm.length} deklarasi`);
    /* ---------- C3 papan ketik ---------- */
    await p.evaluate(() => { const i = document.querySelector('#edisi-app input[name="edisi"]:checked'); i.focus(); });
    for (const key of ['ArrowDown', 'ArrowUp', 'ArrowDown']) {
      await p.keyboard.press(key);
      await p.waitForTimeout(16);
      const r = await p.evaluate(() => ({ a: document.getAnimations().map((a) => (a.effect.target && a.effect.target.getAttribute('class')) || '?'), n: document.querySelectorAll('[data-ed-lamp] > svg').length }));
      check(r.a.length === 0 && r.n === 1, `${vp} C3: ${key} di indeks edisi tanpa animasi, satu lampu`, r.a.join(', '));
    }
    // spasi pada radio yang belum terpilih (Tab tidak memindah di radiogroup; pakai fokus langsung)
    await p.evaluate(() => { const ins = [...document.querySelectorAll('#edisi-app input[name="edisi"]')]; const j = (ins.findIndex((x) => x.checked) + 2) % ins.length; ins[j].focus(); });
    await p.keyboard.press('Space'); await p.waitForTimeout(16);
    const sp = await p.evaluate(() => document.getAnimations().map((a) => `${(a.effect.target && a.effect.target.getAttribute('class')) || '?'} ${a.transitionProperty || ''}`));
    check(sp.length === 0, `${vp} C3: spasi di indeks edisi tanpa animasi`, sp.join(', '));
    // ketukan berikutnya menghidupkan crossfade lagi
    rows = await rowsXY(p);
    await tapRow(p, (rows.findIndex((r) => r.on) + 1) % 5, vp); await p.waitForTimeout(30);
    check(await p.evaluate(() => document.querySelectorAll('[data-ed-lamp] > svg').length) === 2, `${vp} ketukan sesudah papan ketik: crossfade kembali`);
    await p.waitForTimeout(500);
    /* ---------- 20 ganti cepat ---------- */
    let maxN = 0;
    for (let k = 0; k < 20; k++) {
      rows = await rowsXY(p);
      await tapRow(p, (rows.findIndex((r) => r.on) + 1 + (k % 3)) % 5, vp);
      await p.waitForTimeout(40);
      maxN = Math.max(maxN, await p.evaluate(() => document.querySelectorAll('[data-ed-lamp] > svg').length));
    }
    await p.waitForTimeout(500);
    const after = await p.evaluate(() => {
      const ids = [...document.querySelectorAll('[id]')].map((e) => e.id); const dup = ids.filter((x, i) => ids.indexOf(x) !== i);
      const svgs = document.querySelectorAll('[data-ed-lamp] > svg');
      return { n: svgs.length, dup: [...new Set(dup)], ed: [...document.querySelectorAll('#edisi-app input')].findIndex((i) => i.checked), op: svgs[0] ? getComputedStyle(svgs[0]).opacity : '' };
    });
    check(maxN <= 2 && after.n === 1 && after.op === '1', `${vp} 20 ganti cepat: paling banyak 2 lampu selama, tepat 1 sesudah (opasitas 1)`, `maks ${maxN}, akhir ${after.n}, opasitas ${after.op}`);
    check(after.dup.length === 0, `${vp} 20 ganti cepat: tidak ada id ganda (gradien)`, after.dup.slice(0, 5).join(', '));
    check((await p.evaluate(() => window.__vt)) === 0, `${vp}: startViewTransition tidak dipanggil`);
    // tangkapan panggung = render tunggal edisi yang sama di halaman baru
    const stage = '#edisi-app .edisi__stage';
    await p.evaluate((s) => document.querySelector(s).scrollIntoView({ block: 'center', behavior: 'instant' }), stage); await p.waitForTimeout(300);
    const shotA = await p.locator(stage).screenshot({ animations: 'disabled' });
    const q = await open(vp);
    await toList(q);
    const cur = (await rowsXY(q)).findIndex((r) => r.on);
    if (cur !== after.ed) { await tapRow(q, after.ed, vp); await q.waitForTimeout(600); }
    await q.evaluate((s) => document.querySelector(s).scrollIntoView({ block: 'center', behavior: 'instant' }), stage); await q.waitForTimeout(300);
    const shotB = await q.locator(stage).screenshot({ animations: 'disabled' });
    const df = await diff(p, shotA, shotB);
    check(df.size && df.n <= df.total * 0.001, `${vp} 20 ganti cepat: panggung sama dengan render tunggal`, `${df.n} piksel beda (maks ${df.mx})`);
    check(p.__errs.length === 0 && q.__errs.length === 0, `${vp}: tanpa galat JS`, [...p.__errs, ...q.__errs].join(' | ').slice(0, 300));
  }

  /* ---------- reduce: seketika, C10 reduce, C17 ---------- */
  for (const vp of ['hp', 'desktop']) {
    const p = await open(vp, { reduce: true });
    await toList(p);
    const rows = await rowsXY(p);
    await tapRow(p, (rows.findIndex((r) => r.on) + 1) % 5, vp); await p.waitForTimeout(30);
    const r = await p.evaluate(() => ({ n: document.querySelectorAll('[data-ed-lamp] > svg').length, a: document.getAnimations().filter((a) => a.effect.target && a.effect.target.closest('#edisi')).map((a) => `${a.effect.target.getAttribute('class')} ${a.effect.getTiming().duration}`) }));
    check(r.n === 1 && r.a.every((x) => /\s(0|150)$/.test(x)), `${vp} reduce: ganti edisi seketika (satu lampu, tanpa crossfade)`, r.a.join('; '));
    const tm = await p.evaluate(TIMING);
    const bad = tm.filter((t) => !DUR_RED.includes(t.d));
    check(bad.length === 0, `${vp} C10 reduce: durasi #edisi {0, 0,01, 150}`, bad.map((t) => `${t.who} ${t.p} ${t.d}`).join('; ') || `${tm.length} deklarasi`);
    await p.waitForTimeout(370);
    const left = await p.evaluate(() => document.getAnimations().length);
    check(left === 0, `${vp} reduce C17: 400 ms setelah ganti edisi getAnimations() kosong`, String(left));
  }

  /* ---------- C20 / C13 / C14 ---------- */
  for (const vp of ['hp', 'hp360', 'desktop']) {
    const p = await open(vp);
    const note = await p.evaluate(() => {
      const e = document.querySelector('#edisi-app .price-block__note'); const D = window.MKS_LAMP;
      const want = `Termasuk kit kelistrikan (komponen bertanda SNI/K3L) · bohlam LED opsional Rp${D.ledPrice.toLocaleString('id-ID')} · produksi ${D.leadTime.preset}`;
      return { fs: parseFloat(getComputedStyle(e).fontSize), txt: e.textContent, want };
    });
    if (vp !== 'desktop') check(note.fs >= 16, `${vp} C20: catatan kit >= 16 px`, `${note.fs}px`);
    check(note.txt === note.want, `${vp} C13: kalimat kit tidak berubah`, note.txt);
    if (vp === 'hp' || vp === 'desktop') {
      let txt = await p.evaluate(() => document.body.innerText);
      check(/Lampu rakitan ini bukan produk bersertifikat SNI/.test(txt) && /kit kelistrikan, komponen bertanda SNI\/K3L/i.test(txt), `${vp} C13: kalimat SNI dan frasa kit ada`);
      const raw = txt; SNI_OK.forEach((re) => { txt = txt.replace(re, ''); });
      const rest = (txt.match(/.{0,30}SNI.{0,20}/g) || []);
      check(rest.length === 0, `${vp} C13: setiap 'SNI' lolos daftar izin`, rest.join(' | '));
      const sos = (raw.match(SOSIAL) || [])[0];
      check(!sos, `${vp} C13: tanpa bukti sosial`, sos || '');
    }
    // C14: indeks dan plakat untuk lima edisi
    await toList(p);
    const idx = await p.evaluate(() => [...document.querySelectorAll('#edisi-app .edisi__price')].map((e) => e.textContent));
    check(JSON.stringify(idx) === JSON.stringify(EXP.totals.map(rp)), `${vp} C14: harga lima edisi di indeks`, idx.join(' '));
    const pl = [], picks = [], tops = [];
    for (let i = 0; i < 5; i++) {
      await tapRow(p, i, vp); await p.waitForTimeout(420);
      pl.push(await p.evaluate(() => ({ a: document.querySelector('#edisi-app [data-ed-amount]').textContent, w: document.querySelector('#edisi-app [data-ed-was]').textContent, wa: decodeURIComponent(document.querySelector('#edisi-app [data-ed-order]').href) })));
      picks.push(await p.evaluate(() => (document.body.innerText.match(/Pilihan studio/gi) || []).length));
      tops.push(await p.evaluate(() => Math.round(document.querySelector('#edisi-app [data-ed-amount]').getBoundingClientRect().top - document.querySelector('#edisi-app .edisi__plakat').getBoundingClientRect().top)));
    }
    const okP = pl.every((x, i) => x.a === rp(EXP.totals[i]) && x.w.includes(rp(EXP.anchors[i])) && x.w.includes('hemat ' + rp(EXP.anchors[i] - EXP.totals[i])) && /Kode: MK-/.test(x.wa) && x.wa.includes(rp(EXP.totals[i])));
    check(okP, `${vp} C14: harga, coret, hemat, dan pesan WA plakat lima edisi`, pl.map((x) => x.a + ' / ' + x.w).join(' ; '));
    const pop = await p.evaluate(() => window.MKS_LAMP.popularPreset);
    check(picks.every((c) => c === 1), `${vp} C14: 'Pilihan studio' tepat sekali dan terlihat di setiap edisi`, picks.join(','));
    check(new Set(tops).size === 1, `${vp}: harga plakat tidak bergeser antar edisi (baris label dicadangkan)`, tops.join(','));
    const kebun = await p.evaluate((pop) => document.querySelectorAll('#edisi-app .edisi__opt')[pop].querySelector('.edisi__spec')?.textContent || '', pop);
    check(/^\d bagian · ≈ \d+ cm$/.test(kebun), `${vp}: baris edisi pilihan studio memuat jumlah bagian dan tinggi`, kebun);
    check(p.__errs.length === 0, `${vp}: tanpa galat JS`, p.__errs.join(' | ').slice(0, 300));
  }
});
