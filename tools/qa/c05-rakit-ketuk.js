// Cek langkah rakit (adendum v3.1 §4 aturan 5, gerbang frekuensi #rakit). Angka lab dari Chromium ter-throttle, bukan HP.
// Pakai: node tools/qa/c05-rakit-ketuk.js <url> [--rate=4] [--n=5] [--vp=hp,desktop] [--only=waktu,beruntun] [--json]
//  waktu     ketuk bentuk / warna / edisi (badan 1) pada CPU 4x, median 5 kali: tanda terpilih (aria-pressed="true" pada
//            tombol yang diketuk) tercat <= 100 ms; lampu baru (svg baru di #cfg-lamp) tercat <= 150 ms (ganti warna)
//            dan <= 200 ms (ganti bentuk, ganti edisi). "Tercat" = tugas pertama sesudah frame tempat perubahan
//            pertama kali terlihat di requestAnimationFrame (batas atas, termasuk jeda setTimeout).
//  beruntun  10 ketukan berjarak 80 ms pada swatch badan: di setiap frame lampu ada (svg berisi), opasitas penuh, tanpa
//            animasi opasitas; harga akhir di ringkasan = MKSLamp.price(state); dua ketukan berjarak 100 ms (warna lalu
//            bentuk) keduanya masuk ke state; harga tidak ditunda (teks total berganti di frame yang sama dengan tanda).
const { run } = require('./_lib');

const ARM = () => {
  // window.__arm(markSel): mulai ukur pada pointerdown berikutnya; selesai saat tanda dan lampu sama-sama tercat
  window.__arm = (markSel, priceSel) => new Promise((res) => {
    const lamp = document.querySelector('#cfg-lamp');
    const svg0 = lamp && lamp.querySelector('svg');
    const pr0 = priceSel && document.querySelector(priceSel) ? document.querySelector(priceSel).textContent : null;
    let t0 = null, mark = null, lampT = null, priceT = null;
    addEventListener('pointerdown', (e) => { t0 = performance.now(); }, { capture: true, once: true });
    const start = performance.now();
    const after = (set) => setTimeout(() => set(performance.now() - t0), 0);
    const tick = () => {
      if (t0 != null) {
        const m = markSel ? document.querySelector(markSel) : null;
        const mOk = !markSel || (m && m.getAttribute('aria-pressed') === 'true');
        const lOk = lamp && lamp.querySelector('svg') && lamp.querySelector('svg') !== svg0;
        if (mOk && mark == null) { mark = 'p'; after((v) => { mark = v; }); }
        if (lOk && lampT == null) { lampT = 'p'; after((v) => { lampT = v; }); }
        if (pr0 != null && priceT == null && document.querySelector(priceSel) && document.querySelector(priceSel).textContent !== pr0) { priceT = 'p'; after((v) => { priceT = v; }); }
      }
      const done = typeof mark === 'number' && typeof lampT === 'number' && (pr0 == null || typeof priceT === 'number');
      if (done || performance.now() - start > 6000) return res({ mark, lamp: lampT, price: priceT, timeout: !done });
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
};
// Siapkan panel: v2 (details#ctrl-wrap) dibuka; v3 tab Badan dipilih
const PREP = () => {
  const cw = document.querySelector('#ctrl-wrap'); if (cw) cw.open = true;
  const tab = document.querySelector('[role="tab"][data-tab="body"]'); if (tab && tab.getAttribute('aria-selected') !== 'true') tab.click();
};
const med = (a) => { const s = a.filter((x) => typeof x === 'number').sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : NaN; };
const r1 = (x) => (Number.isFinite(x) ? Math.round(x) : 'n/a');

run(async ({ open, check, opt }) => {
  const RATE = +opt.rate || 4, N = +opt.n || 5;
  const vps = opt.vp ? String(opt.vp).split(',') : ['hp', 'desktop'];
  const only = opt.only ? String(opt.only).split(',') : null;
  const want = (k) => !only || only.includes(k);
  const json = {};
  for (const vp of vps) {
    const p = await open(vp, { wait: 1500 });
    const mobile = vp !== 'desktop' && vp !== 'laptop';
    await p.evaluate(ARM);
    await p.evaluate(PREP);
    await p.waitForTimeout(300);
    const cdp = await p.context().newCDPSession(p);
    const tapAt = async (sel) => {
      const box = await p.evaluate((sel) => { const el = document.querySelector(sel); if (!el) return null; el.scrollIntoView({ block: 'center', behavior: 'instant' }); const r = el.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }, sel);
      return box;
    };
    const tap = async (xy) => { if (mobile) await p.touchscreen.tap(xy[0], xy[1]); else await p.mouse.click(xy[0], xy[1]); };
    const priceSel = await p.evaluate(() => (document.querySelector('[data-sum-total]') ? '[data-sum-total]' : '#summary .total b'));

    if (want('waktu')) {
      const kinds = {
        warna: async (k) => { const s = await p.evaluate(() => window.MKSLamp.state.body[0].color); const list = await p.evaluate(() => window.MKS_LAMP.colors.map((c) => c.id)); const c = list.filter((x) => x !== s)[k % (list.length - 1)]; return `[data-part="body"][data-i="0"][data-color="${c}"]`; },
        bentuk: async (k) => { const s = await p.evaluate(() => window.MKSLamp.state.body[0].shape); const list = await p.evaluate(() => window.MKS_LAMP.bodies.map((c) => c.id)); const c = list.filter((x) => x !== s)[k % (list.length - 1)]; return `[data-part="body"][data-i="0"][data-shape="${c}"]`; },
        edisi: async (k) => { const cur = await p.evaluate(() => { const L = window.MKSLamp, D = window.MKS_LAMP; const s = L.state; return D.presets.findIndex((pr) => L.code(Object.assign({}, pr, { wiring: s.wiring, led: s.led })) === L.code(s)); }); const opts = [0, 1, 2, 3, 4].filter((i) => i !== cur); return `[data-preset="${opts[k % opts.length]}"]`; },
      };
      const LIM = { warna: [100, 150], bentuk: [100, 200], edisi: [100, 200] };
      for (const [kind, pickSel] of Object.entries(kinds)) {
        const res = [];
        for (let k = 0; k < N; k++) {
          await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
          await p.evaluate(PREP);
          const sel = await pickSel(k);
          const xy = await tapAt(sel);
          if (!xy) { res.push({ mark: null, lamp: null, miss: sel }); continue; }
          await p.waitForTimeout(250);
          await cdp.send('Emulation.setCPUThrottlingRate', { rate: RATE });
          const pr = p.evaluate(([s, ps]) => window.__arm(s, ps), [kind === 'edisi' && !(await p.evaluate((s) => document.querySelector(s).hasAttribute('aria-pressed'), sel)) ? null : sel, priceSel]);
          await p.waitForTimeout(30);
          await tap(xy);
          res.push(await pr);
          await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
          await p.waitForTimeout(400);
        }
        const mk = med(res.map((r) => r.mark)), lp = med(res.map((r) => r.lamp)), pc = med(res.map((r) => r.price));
        json[`${vp}.${kind}`] = { mark: res.map((r) => r1(r.mark)), lamp: res.map((r) => r1(r.lamp)), price: res.map((r) => r1(r.price)) };
        check(mk <= LIM[kind][0], `${vp} ${kind}: tanda terpilih tercat <= ${LIM[kind][0]} ms (median ${N}, CPU ${RATE}x)`, `median ${r1(mk)} ms [${res.map((r) => r1(r.mark)).join(', ')}]`);
        check(lp <= LIM[kind][1], `${vp} ${kind}: lampu baru tercat <= ${LIM[kind][1]} ms (median ${N}, CPU ${RATE}x)`, `median ${r1(lp)} ms [${res.map((r) => r1(r.lamp)).join(', ')}]`);
        if (Number.isFinite(pc)) check(pc <= mk + 1, `${vp} ${kind}: harga berganti paling lambat bersama tanda (tidak ditunda)`, `harga median ${r1(pc)} ms, tanda ${r1(mk)} ms`);
      }
    }

    if (want('beruntun')) {
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
      await p.evaluate(PREP);
      const cols = await p.evaluate(() => window.MKS_LAMP.colors.map((c) => c.id));
      const pts = [];
      for (const c of cols) pts.push(await tapAt(`[data-part="body"][data-i="0"][data-color="${c}"]`));
      // semua swatch badan 1 harus terlihat bersama (satu posisi gulir)
      const xy = await p.evaluate((cols) => cols.map((c) => { const r = document.querySelector(`[data-part="body"][data-i="0"][data-color="${c}"]`).getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }), cols);
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: RATE });
      await p.evaluate(() => {
        window.__bad = []; window.__frames = 0; window.__run = true;
        const lamp = document.querySelector('#cfg-lamp');
        const tick = () => {
          if (!window.__run) return;
          window.__frames++;
          const svg = lamp.querySelector('svg');
          const anims = lamp.getAnimations({ subtree: true }).filter((a) => a.effect && a.effect.getKeyframes().some((k) => 'opacity' in k));
          const op = Math.min(+getComputedStyle(lamp).opacity, svg ? +getComputedStyle(svg).opacity : 0, +getComputedStyle(lamp.parentElement).opacity);
          if (!svg || svg.childElementCount < 3 || op < 1 || anims.length) window.__bad.push(`${window.__frames}: svg=${!!svg} n=${svg ? svg.childElementCount : 0} op=${op} anim=${anims.length}`);
          requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
      const seq = [];
      for (let k = 0; k < 10; k++) { const i = (k + 1) % cols.length; seq.push(cols[i]); tap(xy[i]); await p.waitForTimeout(80); }
      await p.waitForTimeout(1500);
      const r = await p.evaluate((priceSel) => { window.__run = false; const L = window.MKSLamp; const t = L.price(L.state).total; const shown = (document.querySelector(priceSel) || {}).textContent || ''; return { bad: window.__bad, frames: window.__frames, color: L.state.body[0].color, total: t, shown: shown.replace(/\D/g, ''), pressed: (document.querySelector(`[data-part="body"][data-i="0"][aria-pressed="true"][data-color]`) || {}).dataset }; }, priceSel);
      check(r.bad.length === 0 && r.frames > 5, `${vp} beruntun: 10 ketukan / 80 ms, tiap frame lampu utuh, opasitas penuh, tanpa fade (${r.frames} frame)`, r.bad.slice(0, 4).join(' | '));
      check(r.color === seq[seq.length - 1] && r.pressed && r.pressed.color === seq[seq.length - 1], `${vp} beruntun: ketukan terakhir yang menang (state dan tanda)`, `state ${r.color}, tanda ${r.pressed && r.pressed.color}, harap ${seq[seq.length - 1]}`);
      check(String(r.total) === r.shown, `${vp} beruntun: harga akhir di ringkasan = MKSLamp.price`, `${r.shown} vs ${r.total}`);
      // dua ketukan berjarak 100 ms: warna lalu bentuk
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
      await p.waitForTimeout(300);
      const before = await p.evaluate(() => ({ c: window.MKSLamp.state.body[0].color, s: window.MKSLamp.state.body[0].shape }));
      const c2 = cols.find((c) => c !== before.c);
      const s2 = (await p.evaluate(() => window.MKS_LAMP.bodies.map((b) => b.id))).find((s) => s !== before.s);
      const a = await p.evaluate((c) => { const el = document.querySelector(`[data-part="body"][data-i="0"][data-color="${c}"]`); const r = el.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }, c2);
      // titik ketuk harus benar-benar mengenai tombolnya (tidak tertutup panggung/tab yang lengket)
      const hit = (sel) => p.evaluate((sel) => { const el = document.querySelector(sel); const r = el.getBoundingClientRect(); const x = r.left + r.width / 2, y = r.top + r.height / 2; const h = document.elementFromPoint(x, y); return h && (h === el || el.contains(h)) ? [x, y] : null; }, sel);
      await tapAt(`[data-part="body"][data-i="0"][data-shape="${s2}"]`);
      await p.waitForTimeout(200);
      const b2 = await hit(`[data-part="body"][data-i="0"][data-shape="${s2}"]`);
      const a2 = await hit(`[data-part="body"][data-i="0"][data-color="${c2}"]`);
      if (!a2) check(false, `${vp}: swatch badan 1 bisa diketuk (tidak tertutup)`);
      if (!b2) check(false, `${vp}: swatch dan bentuk badan 1 terlihat bersama untuk uji dua ketukan`);
      else {
        await cdp.send('Emulation.setCPUThrottlingRate', { rate: RATE });
        tap(a2 || a); await p.waitForTimeout(100); await tap(b2);
        await p.waitForTimeout(1200);
        const after = await p.evaluate(() => ({ c: window.MKSLamp.state.body[0].color, s: window.MKSLamp.state.body[0].shape }));
        check(after.c === c2 && after.s === s2, `${vp}: dua ketukan berjarak 100 ms keduanya masuk`, JSON.stringify({ harap: { c: c2, s: s2 }, dapat: after }));
      }
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
    }
    check(p.__errs.length === 0, `${vp}: tanpa galat JS`, p.__errs.join(' | ').slice(0, 200));
  }
  if (opt.json) console.log(JSON.stringify(json));
});
