// Cek langkah rakit: tata letak, sentuhan, dan kejujuran 03 #rakit (studio rakit). Angka lab dari Chromium headless.
// Pakai: node tools/qa/c09-rakit-tata.js <url> [--only=c8,c9,c19,c24,teks,tab,fungsi,lengket,ukur]
//  c8      setiap kontrol #rakit di keempat tab (Kap, Badan, Alas, Listrik), rincian terbuka dan kado aktif punya status
//          tekan (:active dipaksa lewat CDP, transisi mati): biasa transform/warna, reduce wajib warna/latar/opacity/bayangan.
//  c9      390 × 844 dan 360 × 740: area tekan setiap kontrol >= 44 × 44 (elementFromPoint di pusat dan empat sudut kotak
//          44 × 44 yang berpusat di kontrol; panggung/tab lengket dan orderbar disingkirkan saat ukur) dan jarak visual
//          antarkontrol bertetangga dalam satu grup >= 8.
//  c19     tanpa gulir samping di 320, 360, 390 (keempat tab, rincian terbuka); isi panel tidak meluber dari kotaknya;
//          label kode rakitan satu baris dan kode hanya patah di tanda hubung.
//  fungsi  fokus tetap di "Hapus" sesudah badan dihapus; ketuk lalu muat ulang seketika tetap tersimpan; katalog
//          #bagian tetap swatch .sw 24 dan tombol pil (tidak ikut gaya studio).
//  c24     tinggi 640 → panggung 200 dan lampu tidak tertutup pil, saklar, atau label tinggi (pil dan saklar juga tidak
//          bertumpuk, sampai lebar 320); 844/740/664 → panggung 260
//          dan lampu bebas; tinggi 520 → panggung dan tab tidak lengket.
//  teks    C15: tanpa HEAD/BODY/BASE, "—", "konfigurator" di teks terlihat #rakit (keempat tab dan rincian); C20: kalimat
//          ringkasan >= 16 px di 390 dan 360; C11: pil ILUSTRASI di panggung studio desktop dan HP; harga ringkasan =
//          MKSLamp.price; tidak ada teks < 12 px dan bobot >= 700 di #rakit.
//  tab     ARIA tabs: satu tab terpilih, roving tabindex, panel berlabel tab terpilih, panah/Home/End memindah pilihan dan
//          fokus seketika (tanpa transisi), bagian SVG panggung desktop membuka tabnya; HP orderbar tampil begitu WA
//          ringkasan keluar layar atau tertutup panggung lengket, dan nav tersembunyi selama panggung lengket.
//  lengket desktop 1440 × 900 dan laptop 1366 × 768: panggung lengket di nav + 24 dan seluruhnya di dalam layar.
//  ukur    tinggi #rakit di 1440 dan 390 terhadap angka brief (1.440 / 1.280); hanya dilaporkan.
const { run } = require('./_lib');
const CTRL = 'a[href], a[data-wa], button, label:has(input), summary, select, input:not([type="checkbox"]), textarea, [role="switch"], [role="button"], [role="tab"]';
const TABS = ['head', 'body', 'base', 'power'];

run(async ({ open, check, opt }) => {
  const only = opt.only ? String(opt.only).split(',') : null;
  const want = (k) => !only || only.includes(k);
  const tabTo = (p, t) => p.evaluate((t) => { const b = document.querySelector(`#studio-tabs [data-tab="${t}"]`); if (b.getAttribute('aria-selected') !== 'true') b.click(); }, t);
  const openAll = (p) => p.evaluate(() => { const d = document.querySelector('#rincian'); d.open = true; const g = document.querySelector('#gift-on'); if (g && !g.checked) g.click(); });

  /* ---------- C8 ---------- */
  if (want('c8')) {
    for (const vp of ['hp', 'desktop']) for (const reduce of [false, true]) {
      const p = await open(vp, { reduce, wait: 1200 });
      await openAll(p);
      const fail = []; let total = 0;
      for (const t of TABS) {
        await tabTo(p, t); await p.waitForTimeout(150);
        await p.addStyleTag({ content: '*, *::before, *::after { transition: none !important; animation: none !important; }' });
        const n = await p.evaluate((CTRL) => {
          document.querySelectorAll('[data-c8]').forEach((e) => e.removeAttribute('data-c8'));
          let i = 0;
          document.querySelectorAll(`#rakit :is(${CTRL})`).forEach((el) => {
            const r = el.getBoundingClientRect(), cs = getComputedStyle(el);
            if (r.width < 1 || r.height < 1 || cs.visibility === 'hidden' || el.closest('[hidden], [inert]')) return;
            if (el.matches('input, textarea, :disabled, [aria-disabled="true"]')) return; // isian teks: fokus, bukan tekan; nonaktif: tanpa tekan
            el.setAttribute('data-c8', String(i++));
          });
          return i;
        }, CTRL);
        const cdp = await p.context().newCDPSession(p);
        await cdp.send('DOM.enable'); await cdp.send('CSS.enable');
        const { root } = await cdp.send('DOM.getDocument', { depth: -1 });
        const SIG = (k) => {
          const el = document.querySelector(`[data-c8="${k}"]`);
          const P = ['transform', 'scale', 'background-color', 'color', 'box-shadow', 'opacity', 'border-top-color', 'outline-color', 'text-decoration-color', 'filter', 'background-image'];
          const nodes = [el, ...el.querySelectorAll(':scope > *, :scope > * > *')].slice(0, 12);
          const out = {};
          nodes.forEach((nd, j) => [null, '::before', '::after'].forEach((pe) => { const cs = getComputedStyle(nd, pe); P.forEach((pr) => { out[`${j}${pe || ''} ${pr}`] = cs.getPropertyValue(pr); }); }));
          return { sig: out, who: `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}.${String(el.className.baseVal ?? el.className).split(' ')[0]} "${(el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 20)}"` };
        };
        for (let k = 0; k < n; k++) {
          const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector: `[data-c8="${k}"]` });
          if (!nodeId) continue;
          const a = await p.evaluate(SIG, k);
          await cdp.send('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: ['active'] });
          const b = await p.evaluate(SIG, k);
          await cdp.send('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: [] });
          const changed = Object.keys(a.sig).filter((x) => a.sig[x] !== b.sig[x]);
          const still = changed.filter((x) => !/ (transform|scale)$/.test(x));
          if (reduce ? still.length === 0 : changed.length === 0) fail.push(`${t}:${a.who}` + (changed.length ? ' (hanya skala)' : ''));
        }
        total += n;
        await cdp.detach();
      }
      check(total > 40 && fail.length === 0, `C8 ${vp}${reduce ? ' reduce' : ''}: semua kontrol #rakit di 4 tab + rincian punya status tekan${reduce ? ' tanpa gerak' : ''} (${total})`, [...new Set(fail)].slice(0, 8).join(' | '));
    }
  }

  /* ---------- C9 ---------- */
  if (want('c9')) {
    for (const vp of ['hp', 'hp360']) {
      const p = await open(vp, { wait: 1000 });
      await p.addStyleTag({ content: '.studio__stage, .studio__tabs { position: static !important; } #orderbar, .nav { display: none !important; } .studio__panel { height: auto !important; overflow: visible !important; }' });
      await openAll(p);
      const small = [], gaps = []; let n = 0;
      for (const t of TABS) {
        await tabTo(p, t); await p.waitForTimeout(150);
        const r = await p.evaluate((CTRL) => {
          const out = { small: [], gaps: [], n: 0 };
          const els = [...document.querySelectorAll(`#rakit :is(${CTRL})`)].filter((el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden'; });
          const who = (el) => `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}.${String(el.className.baseVal ?? el.className).split(' ')[0]} "${(el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 18)}"`;
          for (const el of els) {
            el.scrollIntoView({ block: 'center', behavior: 'instant' });
            const r = el.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
            const pts = [[cx, cy], [cx - 21.5, cy - 21.5], [cx + 21.5, cy - 21.5], [cx - 21.5, cy + 21.5], [cx + 21.5, cy + 21.5]];
            // kontrol yang lebih besar dari 44 di satu sumbu: sudut diambil di dalam kotaknya sendiri
            const miss = pts.filter(([x, y]) => { const h = document.elementFromPoint(Math.min(Math.max(x, r.left + 0.5), Math.max(r.right - 0.5, x)), y); const h2 = document.elementFromPoint(x, y); return !(h2 && (h2 === el || el.contains(h2) || (el.control && h2 === el.control))); });
            out.n++;
            if (miss.length) out.small.push(`${who(el)} ${Math.round(r.width)}×${Math.round(r.height)} (${miss.length} titik)`);
          }
          // jarak visual dalam grup kontrol bertetangga
          const GROUPS = ['.studio__chips-row', '.slots', '.tiles', '.studio__sw', '.rincian__acts', '.studio__panel', '.sum'];
          for (const g of GROUPS) document.querySelectorAll(`#rakit ${g}`).forEach((box) => {
            const kids = [...box.children].filter((c) => c.matches(CTRL) && c.getBoundingClientRect().width > 0);
            for (let i = 0; i < kids.length; i++) for (let j = i + 1; j < kids.length; j++) {
              const a = kids[i].getBoundingClientRect(), b = kids[j].getBoundingClientRect();
              const ovY = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top), ovX = Math.min(a.right, b.right) - Math.max(a.left, b.left);
              let gap = null;
              if (ovY > 0) gap = Math.max(b.left - a.right, a.left - b.right);
              else if (ovX > 0) gap = Math.max(b.top - a.bottom, a.top - b.bottom);
              if (gap != null && gap < 7.5) out.gaps.push(`${g}: ${who(kids[i])} ↔ ${who(kids[j])} ${gap.toFixed(1)} px`);
            }
          });
          return out;
        }, CTRL);
        n += r.n; small.push(...r.small); gaps.push(...r.gaps);
      }
      check(n > 30 && small.length === 0, `C9 ${vp}: area tekan setiap kontrol #rakit >= 44 × 44 (${n} kontrol, 4 tab, rincian terbuka)`, [...new Set(small)].slice(0, 8).join(' | '));
      check(gaps.length === 0, `C9 ${vp}: jarak visual antarkontrol bertetangga >= 8`, [...new Set(gaps)].slice(0, 6).join(' | '));
    }
  }

  /* ---------- C19 ---------- */
  if (want('c19')) {
    for (const w of [320, 360, 390]) {
      const p = await open([w, 740, true], { wait: 900 });
      const bad = [];
      for (const t of TABS) {
        await tabTo(p, t); await openAll(p); await p.waitForTimeout(150);
        const o = await p.evaluate(() => {
          const sw = document.documentElement.scrollWidth - innerWidth;
          const wide = [...document.querySelectorAll('#rakit *')].filter((e) => { const r = e.getBoundingClientRect(); return r.width && r.right > innerWidth + 0.5 && !e.closest('.studio__chips-row, svg'); }).slice(0, 3).map((e) => `${e.tagName.toLowerCase()}.${String(e.className.baseVal ?? e.className).split(' ')[0]} ${Math.round(e.getBoundingClientRect().right)}`);
          return { sw, wide };
        });
        if (o.sw > 0 || o.wide.length) bad.push(`${t}: lebih ${o.sw}px ${o.wide.join(', ')}`);
        // isi panel tidak meluber dari kotaknya sendiri (anak #controls dan kartu saklar Listrik)
        const spill = await p.evaluate(() => {
          const out = [];
          document.querySelectorAll('#controls > *, #controls .toggle').forEach((box) => {
            const b = box.getBoundingClientRect();
            box.querySelectorAll('*').forEach((e) => {
              if (e.closest('svg') && e.tagName.toLowerCase() !== 'svg') return;
              const r = e.getBoundingClientRect();
              if (!r.width || !r.height) return;
              if (r.bottom > b.bottom + 1 || r.right > b.right + 1) out.push(`${box.id || box.className.split(' ')[0]} > ${e.tagName.toLowerCase()} +${Math.round(Math.max(r.bottom - b.bottom, r.right - b.right))}`);
            });
          });
          return out;
        });
        if (spill.length) bad.push(`${t}: meluber ${spill.slice(0, 3).join(', ')}`);
      }
      // kode rakitan: label satu baris, kode hanya patah di tanda hubung
      const code = await p.evaluate(() => {
        const row = document.querySelector('.rincian__row--code'), lab = row.firstElementChild, el = row.querySelector('.mono-code');
        const lh = parseFloat(getComputedStyle(lab).lineHeight) || 20;
        const split = [];
        const tn = el.firstChild; let i = 0;
        for (const seg of el.textContent.split('-')) { const r = document.createRange(); r.setStart(tn, i); r.setEnd(tn, i + seg.length); if (r.getClientRects().length > 1) split.push(seg); i += seg.length + 1; }
        return { labelLines: Math.round(lab.getBoundingClientRect().height / lh), split };
      });
      if (code.labelLines > 1 || code.split.length) bad.push(`kode rakitan: label ${code.labelLines} baris, segmen terpotong ${code.split.join(',')}`);
      check(bad.length === 0, `C19 ${w}: tanpa gulir samping, isi panel tidak meluber, kode rakitan utuh (4 tab, rincian dan kado terbuka)`, bad.join(' | '));
    }
  }

  /* ---------- C24 ---------- */
  if (want('c24')) {
    for (const [w, h, stageH] of [[390, 844, 260], [360, 740, 260], [390, 664, 260], [390, 640, 200], [360, 600, 200], [320, 640, 200]]) {
      const p = await open([w, h, true], { wait: 900 });
      for (const t of ['head', 'power']) {
        await p.evaluate(() => { const s = document.querySelector('.studio__stage'); window.scrollTo({ top: s.getBoundingClientRect().top + scrollY + 40, behavior: 'instant' }); });
        await p.waitForTimeout(400);
        // lampu tertinggi (Kuinto) dan terlebar diuji juga
        for (const preset of [null, 0, 2]) {
          if (preset != null) await p.evaluate((i) => window.MKSLamp.loadPreset(i), preset);
          await p.waitForTimeout(250);
          const r = await p.evaluate(() => {
            const st = document.querySelector('#cfg-stage').getBoundingClientRect();
            const lamp = document.querySelector('#cfg-lamp .lp-lamp').getBoundingClientRect();
            const box = (sel) => { const e = document.querySelector(sel); const r = e.getBoundingClientRect(); return { l: r.left, t: r.top, r: r.right, b: r.bottom }; };
            const sw = box('#cfg-switch > i'); const swT = (() => { const e = document.querySelector('#cfg-switch'); const rg = document.createRange(); rg.selectNodeContents(e); const rr = [...rg.getClientRects()].pop(); return rr ? { l: rr.left, t: rr.top, r: rr.right, b: rr.bottom } : sw; })();
            const L = { l: lamp.left, t: lamp.top, r: lamp.right, b: lamp.bottom };
            const hit = (a, b) => a.l < b.r && b.l < a.r && a.t < b.b && b.t < a.b;
            const items = { pil: box('#cfg-stage .stage__pill'), saklar: sw, 'teks saklar': swT, tinggi: box('#cfg-height') };
            if (hit(items.pil, items['teks saklar']) || hit(items.pil, items.saklar)) items.__pil_saklar = { l: -1e4, t: -1e4, r: 1e4, b: 1e4 }; // pil dan saklar tidak boleh bertumpuk
            return { stageH: Math.round(st.height), stageTop: Math.round(st.top), covered: Object.entries(items).filter(([, b]) => hit(L, b)).map(([k]) => k), inside: L.t >= st.top - 0.5 && L.b <= st.bottom + 0.5, pos: getComputedStyle(document.querySelector('.studio__stage')).position, lampH: Math.round(lamp.height) };
          });
          check(r.stageH === stageH && r.covered.length === 0 && r.inside, `C24 ${w}×${h} ${t}${preset != null ? ' edisi ' + preset : ''}: panggung ${stageH}, lampu (${r.lampH} px) tidak tertutup pil/saklar/label`, JSON.stringify(r));
        }
        await tabTo(p, 'power');
      }
    }
    for (const [w, h] of [[390, 520], [360, 480]]) {
      const p = await open([w, h, true], { wait: 900 });
      await p.evaluate(() => { const s = document.querySelector('.studio__stage'); window.scrollTo({ top: s.getBoundingClientRect().top + scrollY + 200, behavior: 'instant' }); });
      await p.waitForTimeout(400);
      const r = await p.evaluate(() => ({ pos: getComputedStyle(document.querySelector('.studio__stage')).position, tabs: getComputedStyle(document.querySelector('.studio__tabs')).position, top: Math.round(document.querySelector('.studio__stage').getBoundingClientRect().top), studio: document.documentElement.classList.contains('in-studio') }));
      check(r.pos === 'static' && r.tabs === 'static' && r.top < -150 && !r.studio, `C24 ${w}×${h}: panggung dan tab tidak lengket, nav tidak disembunyikan oleh studio`, JSON.stringify(r));
    }
  }

  /* ---------- teks: C15, C20, C11, harga, tipografi ---------- */
  if (want('teks')) {
    for (const vp of ['hp', 'hp360', 'desktop']) {
      const p = await open(vp, { wait: 1000 });
      await openAll(p);
      let txt = '';
      for (const t of TABS) { await tabTo(p, t); await p.waitForTimeout(100); txt += '\n' + await p.evaluate(() => document.querySelector('#rakit').innerText); }
      const bad = (txt.match(/\b(HEAD|BODY|BASE)\b|—|konfigurator/gi) || []);
      check(bad.length === 0, `C15 ${vp}: tanpa HEAD/BODY/BASE, "—", "konfigurator" di teks terlihat #rakit`, [...new Set(bad)].join(', '));
      check(/Kap/.test(txt) && /Badan/.test(txt) && /Alas/.test(txt), `${vp}: istilah Kap/Badan/Alas di tab studio`);
      const r = await p.evaluate(() => {
        const line = document.querySelector('.sum__line'), L = window.MKSLamp;
        const pill = document.querySelector('#cfg-stage .stage__pill'), pr = pill.getBoundingClientRect();
        const small = [], heavy = [];
        document.querySelectorAll('#rakit *').forEach((el) => {
          if (![...el.childNodes].some((c) => c.nodeType === 3 && c.textContent.trim())) return;
          const cs = getComputedStyle(el), r = el.getBoundingClientRect();
          if (!r.width || cs.visibility === 'hidden' || el.closest('.sr-only, .slot-chip__k')) return;
          if (parseFloat(cs.fontSize) < 12) small.push(el.className + ' ' + cs.fontSize);
          if (+cs.fontWeight >= 700) heavy.push(el.className + ' ' + cs.fontWeight);
        });
        return { fs: parseFloat(getComputedStyle(line).fontSize), line: line.textContent, pill: pill.textContent, pillVis: pr.width > 0 && getComputedStyle(pill).visibility !== 'hidden' && +getComputedStyle(pill).opacity === 1, total: L.price(L.state).total, shown: document.querySelector('[data-sum-total]').textContent.replace(/\D/g, ''), small, heavy };
      });
      if (vp !== 'desktop') check(r.fs >= 16, `C20 ${vp}: kalimat ringkasan >= 16 px`, `${r.fs}px "${r.line}"`);
      check(/ilustrasi/i.test(r.pill) && r.pillVis, `C11 ${vp}: pil ILUSTRASI di panggung studio`, r.pill);
      check(String(r.total) === r.shown, `${vp}: harga ringkasan = MKSLamp.price`, `${r.shown} / ${r.total}`);
      check(r.small.length === 0 && r.heavy.length === 0, `${vp}: #rakit tanpa teks < 12 px dan tanpa bobot >= 700`, [...r.small, ...r.heavy].slice(0, 4).join(' | '));
      check(p.__errs.length === 0, `${vp}: tanpa galat JS`, p.__errs.join(' | ').slice(0, 200));
    }
  }

  /* ---------- tab: ARIA, papan ketik, bagian SVG, orderbar/nav HP ---------- */
  if (want('tab')) {
    const p = await open('desktop', { wait: 1000 });
    await p.evaluate(() => document.querySelector('#studio-tabs').scrollIntoView({ block: 'center', behavior: 'instant' }));
    await p.focus('#tab-head');
    const states = [];
    const snap = () => p.evaluate(() => { const tabs = [...document.querySelectorAll('#studio-tabs [role=tab]')]; const sel = tabs.filter((t) => t.getAttribute('aria-selected') === 'true'); return { sel: sel.map((t) => t.dataset.tab).join(','), tabbable: tabs.filter((t) => t.tabIndex === 0).map((t) => t.dataset.tab).join(','), focus: document.activeElement.dataset.tab || document.activeElement.tagName, panel: document.querySelector('#controls').getAttribute('aria-labelledby'), anims: document.querySelector('#studio').getAnimations({ subtree: true }).length, role: document.querySelector('#studio-tabs').getAttribute('role') }; });
    states.push(await snap());
    for (const k of ['ArrowRight', 'ArrowRight', 'End', 'Home', 'ArrowLeft']) { await p.keyboard.press(k); await p.waitForTimeout(20); states.push(await snap()); }
    const exp = ['head', 'body', 'base', 'power', 'head', 'power'];
    const ok = states.every((s, i) => s.sel === exp[i] && s.tabbable === exp[i] && s.focus === exp[i] && s.panel === 'tab-' + exp[i] && s.role === 'tablist');
    check(ok, 'tab: ARIA tabs dengan roving tabindex; panah, Home, End memindah pilihan, fokus, dan label panel', states.map((s) => `${s.sel}/${s.focus}/${s.panel}`).join(' → '));
    check(states.slice(1).every((s) => s.anims === 0), 'tab: pindah tab dari papan ketik tanpa animasi', states.map((s) => s.anims).join(','));
    // bagian SVG panggung (desktop) membuka tabnya, juga lewat Enter
    const part = await p.evaluate(() => { const g = document.querySelector('#cfg-lamp [data-la-part="base"][role="button"]'); if (!g) return null; g.scrollIntoView({ block: 'center', behavior: 'instant' }); const r = g.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2, g.getAttribute('tabindex'), g.getAttribute('aria-label')]; });
    if (!part) check(false, 'tab: bagian SVG desktop bisa diketuk');
    else {
      await p.mouse.click(part[0], part[1]); await p.waitForTimeout(100);
      const s1 = await snap();
      await p.focus('#cfg-lamp [data-la-part="head"]'); await p.keyboard.press('Enter'); await p.waitForTimeout(100);
      const s2 = await snap();
      check(s1.sel === 'base' && s2.sel === 'head' && part[2] === '0' && /Alas/.test(part[3]), 'tab: bagian SVG panggung (desktop) bisa diketuk dan difokus, membuka tab Alas/Kap', `${s1.sel} ${s2.sel} ${part[3]}`);
    }
    // HP: orderbar dan nav
    const q = await open('hp', { wait: 1000 });
    const ob = async () => q.evaluate(() => ({ ob: document.querySelector('#orderbar').classList.contains('is-on'), nav: document.querySelector('.nav').classList.contains('nav--hide'), studio: document.documentElement.classList.contains('in-studio') }));
    await q.evaluate(() => { const s = document.querySelector('#wa-link'); window.scrollTo({ top: s.getBoundingClientRect().top + scrollY - innerHeight + 160, behavior: 'instant' }); });
    await q.waitForTimeout(500);
    const vis = await q.evaluate(() => { const r = document.querySelector('#wa-link').getBoundingClientRect(); const cover = Math.max(...[...document.querySelectorAll('[data-studio-sticky]')].map((e) => e.getBoundingClientRect().bottom)); return r.top >= cover && r.bottom <= innerHeight; });
    const a = await ob();
    await q.evaluate(() => { const s = document.querySelector('#wa-link'); window.scrollTo({ top: s.getBoundingClientRect().top + scrollY - 150, behavior: 'instant' }); });
    await q.waitForTimeout(500);
    const b = await ob();
    check(vis && !a.ob && b.ob && b.nav && b.studio, 'tab HP: orderbar disembunyikan selama WA ringkasan terlihat, tampil saat WA tertutup/keluar; nav tersembunyi selama panggung lengket', JSON.stringify({ waTerlihat: vis, a, b }));
  }

  /* ---------- fungsi: fokus sesudah Hapus, simpan sebelum rAF, katalog #bagian ---------- */
  if (want('fungsi')) {
    const p = await open('desktop', { wait: 1000 });
    await p.evaluate(() => document.querySelector('#studio-tabs').scrollIntoView({ block: 'center', behavior: 'instant' }));
    await p.click('#tab-body'); await p.waitForTimeout(100);
    await p.evaluate(() => { const a = document.querySelector('#add-body'); while (document.querySelectorAll('.slot-chip').length < 3 && a.getAttribute('aria-disabled') !== 'true') a.click(); });
    await p.focus('[data-slot="1"]'); await p.keyboard.press('Enter'); await p.waitForTimeout(50);
    const n0 = await p.evaluate(() => document.querySelectorAll('.slot-chip').length);
    await p.focus('#remove-body'); await p.keyboard.press('Enter'); await p.waitForTimeout(100);
    const f = await p.evaluate(() => ({ id: document.activeElement.id, n: document.querySelectorAll('.slot-chip').length }));
    check(f.id === 'remove-body' && f.n === n0 - 1, 'fungsi: fokus tetap di "Hapus" sesudah badan dihapus dari papan ketik', JSON.stringify({ n0, ...f }));
    // ketuk swatch lalu muat ulang seketika: rakitan tetap tersimpan (sisa kerja dikerjakan saat pagehide)
    const color = await p.evaluate(() => { document.querySelector('#tab-head').click(); const s = document.querySelector('#controls .swatch[data-part="head"]:not([aria-pressed="true"]):not(:disabled)'); s.click(); return s.dataset.color; });
    await p.waitForTimeout(5);
    await p.reload({ waitUntil: 'load' }); await p.waitForTimeout(800);
    const after = await p.evaluate(() => (document.querySelector('#controls .swatch[data-part="head"][aria-pressed="true"]') || document.querySelector('#tab-head') && (document.querySelector('#tab-head').click(), document.querySelector('#controls .swatch[data-part="head"][aria-pressed="true"]')) || {}).dataset?.color);
    check(after === color, 'fungsi: ketuk warna lalu muat ulang seketika, warna tetap tersimpan', JSON.stringify({ color, after }));
    // katalog #bagian memakai swatch kecil .sw dan tombol pil "Pakai di rakitan" (belum dibangun ulang)
    const cat = await p.evaluate(() => {
      const c = document.querySelector('#catalog .pcard'); if (!c) return null;
      const sw = c.querySelector('.sw'), g = c.querySelector('[data-use]');
      const r = sw && sw.getBoundingClientRect(), cs = g && getComputedStyle(g);
      return { sw: sw ? [Math.round(r.width), Math.round(r.height)] : null, radius: cs && cs.borderTopLeftRadius, bg: cs && cs.backgroundColor, h: g && Math.round(g.getBoundingClientRect().height), emptyGroup: !!c.querySelector('[role="group"][aria-label=""]') };
    });
    check(cat && cat.sw && cat.sw[0] === 24 && parseFloat(cat.radius) >= 22 && cat.bg === 'rgba(0, 0, 0, 0)' && cat.h >= 44 && !cat.emptyGroup, 'fungsi: katalog #bagian tetap swatch 24 dan tombol pil (tidak ikut gaya studio)', JSON.stringify(cat));
  }

  /* ---------- lengket desktop ---------- */
  if (want('lengket')) {
    for (const vp of ['desktop', 'laptop']) {
      const p = await open(vp, { wait: 900 });
      const r = await p.evaluate(async () => {
        const st = document.querySelector('.studio__stage'), studio = document.querySelector('.studio');
        const nav = Math.round(parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')));
        const sTop = st.getBoundingClientRect().top + scrollY, sH = st.getBoundingClientRect().height;
        const end = studio.getBoundingClientRect().bottom + scrollY; // ujung area lengket (baris terakhir rel)
        const from = sTop - nav - 24, to = end - sH - nav - 24;
        const out = [];
        for (const f of [0.1, 0.5, 0.9]) {
          window.scrollTo({ top: from + (to - from) * f, behavior: 'instant' });
          await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
          const r = document.querySelector('#cfg-stage').getBoundingClientRect();
          out.push({ top: Math.round(r.top), bottom: Math.round(r.bottom), vh: innerHeight, nav });
        }
        return { out, range: Math.round(to - from) };
      });
      check(r.range > 0 && r.out.every((o) => o.top === o.nav + 24 && o.bottom <= o.vh), `lengket ${vp}: panggung lengket di nav + 24 sepanjang rel (${r.range} px) dan seluruhnya di dalam layar`, JSON.stringify(r.out));
    }
  }

  /* ---------- ukur ---------- */
  if (want('ukur')) {
    for (const [vp, brief] of [['desktop', 1440], ['hp', 1280], ['hp360', 1280]]) {
      const p = await open(vp, { wait: 800 });
      const h = await p.evaluate(() => Math.round(document.querySelector('#rakit').getBoundingClientRect().height));
      console.log(`UKUR #rakit ${vp}: ${h} px (brief ±${brief}, ${h > brief ? '+' : ''}${Math.round((h / brief - 1) * 100)}%)`);
    }
  }
});
