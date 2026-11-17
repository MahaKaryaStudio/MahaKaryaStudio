// Cek langkah gerak-sentuh (adendum v3.1 §4): token, tekan dua lapis, gerbang hover, kejujuran yang tidak boleh menunggu.
// Pakai: node tools/qa/c04-gerak-sentuh.js <url> [--only=token,c7,c8,c10,c11,c16,c13,c23,c14,toast]
//  token  :root punya --t-press 100ms, --t-follow 200ms, --press-scale .97, --press-bg (terang --paper-3, gelap --dark-bg-4),
//         --ls-label, --ls-meta, --amber-glow, --swatch-edge (dua nilai), --scrim-soft; tabel breakpoint 760/1024 di kepala base.css.
//  C7     setiap aturan :hover yang mengenai komponen dasar atau seksi hero, #kenapa, #edisi, #tiga, #paket, nav, orderbar,
//         toast berada di dalam @media (hover: hover) and (pointer: fine), dan subjek :hover-nya bisa diklik.
//  C8     setiap kontrol terlihat di seksi itu punya status tekan (:active dipaksa lewat CDP, transisi dimatikan saat ukur)
//         di 390 × 844, 360 × 640, 390 × 664, 1440 × 900: mode biasa transform atau warna berubah; mode reduce wajib
//         warna/latar/opacity/box-shadow berubah (skala saja tidak cukup).
//  C10    transisi yang dideklarasikan dan animasi yang berjalan di seksi itu: mode biasa durasi {0,100,150,250,600},
//         delay {0,200} (+ delay visibility {150,250}); mode reduce durasi {0, 0,01, 150}.
//  C11    label ILUSTRASI di tabel #paket 1440 (dan panel HP), baris "Gambar: ilustrasi, bukan foto" di #bagian, baris legal footer.
//  C16    HTML mentah index dan 404 tanpa 'Rp' diikuti angka dan tanpa 'wa.me/'; satu <noscript> per halaman index dan
//         kalimatnya terbaca tanpa JS; lamp.js diblokir tetapi config.js termuat: setiap [data-wa] ber-href wa.me/<MKS_CONFIG.whatsapp>.
//  C13    daftar izin SNI dan pindai bukti sosial di index.html; 'Pilihan studio' tepat sekali.
//  C23    baris label #bagian tidak bisa disunting di Mode Edit, tidak tertimpa simpanan, dan utuh di Ekspor.
//  C14    harga, coret, dan isi pesan WhatsApp lima edisi (dan semua [data-wa]) sama dengan snapshot sebelum langkah
//         (tools/qa/data/c14-gerak-sentuh.json, ditulis c04-snap-c14.js --tulis pada commit dasar).
//  toast  tanpa aksi hilang setelah 3 s, kegagalan 5 s, tidak hilang selama hover atau fokus; masuk 250, keluar 150.
const { run } = require('./_lib');
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const SNAP = require('./c04-snap-c14');
const SEKSI = ['#hero', '#kenapa', '#edisi', '#tiga', '#rakit', '#paket', '#top', '#menu', '#orderbar', '#toast']; // #rakit sejak langkah rakit
const DUR_OK = [0, 100, 150, 250, 600], DEL_OK = [0, 200], VIS_DEL_OK = [150, 250], DUR_RED = [0, 0.01, 150];
const SNI_OK = [/bertanda SNI\/K3L/g, /tanda SNI\/K3L/g, /bukan produk bersertifikat SNI/g, /Apakah lampunya bersertifikat SNI\?/g];
const SOSIAL = /ulasan|testimoni|terjual|terlaris|laris|populer|bintang 5|★|pelanggan kami|\d+\+? pembeli/i;

const TIMING = (sels) => {
  const ms = (v) => v.split(',').map((x) => { x = x.trim(); return x.endsWith('ms') ? parseFloat(x) : parseFloat(x) * 1000; });
  const out = [];
  for (const el of document.querySelectorAll(sels.map((s) => `${s}, ${s} *`).join(','))) for (const pe of [null, '::before', '::after']) {
    const cs = getComputedStyle(el, pe);
    if (pe && (cs.content === 'none' || cs.content === 'normal')) continue;
    if (!cs.transitionDuration) continue; // elemen tanpa kotak gaya (mis. <source>)
    const props = cs.transitionProperty.split(',').map((x) => x.trim()), dur = ms(cs.transitionDuration), del = ms(cs.transitionDelay);
    const who = (el.className && el.className.baseVal == null ? String(el.className).split(' ')[0] : el.tagName.toLowerCase()) + (pe || '');
    props.forEach((p, k) => { const d = dur[k % dur.length], l = del[k % del.length]; if (p === 'all' && d === 0 && l === 0) return; if (p === 'none') return; out.push({ p, d, l, who }); });
    const an = cs.animationName; if (an && an !== 'none') ms(cs.animationDuration).forEach((d) => out.push({ p: 'animation ' + an, d, l: 0, who }));
  }
  return out;
};

run(async ({ open, check, base, opt, browser }) => {
  const only = opt.only ? String(opt.only).split(',') : null;
  const want = (k) => !only || only.includes(k);

  /* ---------- token ---------- */
  if (want('token')) {
    const p = await open('desktop');
    const t = await p.evaluate(() => {
      const r = getComputedStyle(document.documentElement), g = (n) => r.getPropertyValue(n).trim();
      const dk = getComputedStyle(document.querySelector('#rakit'));
      const norm = (v) => { const d = document.createElement('i'); d.style.color = v; document.body.append(d); const c = getComputedStyle(d).color; d.remove(); return c; };
      return { press: g('--t-press'), follow: g('--t-follow'), scale: g('--press-scale'), pbL: norm(g('--press-bg')), paper3: norm(g('--paper-3')), pbD: norm(dk.getPropertyValue('--press-bg').trim()), dbg4: norm(g('--dark-bg-4')), lsl: g('--ls-label'), lsm: g('--ls-meta'), glow: g('--amber-glow'), seL: g('--swatch-edge'), seD: dk.getPropertyValue('--swatch-edge').trim(), scrimSoft: g('--scrim-soft'), scrim: g('--scrim'), fast: g('--t-fast'), med: g('--t-med'), slow: g('--t-slow'), ease: g('--ease-out') };
    });
    check(t.press === '100ms' && t.follow === '200ms' && parseFloat(t.scale) === 0.97, 'token: --t-press 100ms, --t-follow 200ms, --press-scale .97', `${t.press} ${t.follow} ${t.scale}`);
    check(t.fast === '150ms' && t.med === '250ms' && t.slow === '600ms' && /cubic-bezier\(0?\.22, ?1, ?0?\.36, ?1\)/.test(t.ease), 'token: --t-fast/--t-med/--t-slow/--ease-out tetap', `${t.fast} ${t.med} ${t.slow} ${t.ease}`);
    check(t.pbL === t.paper3 && t.pbD === t.dbg4, 'token: --press-bg terang = --paper-3, gelap = --dark-bg-4', `${t.pbL} / ${t.pbD}`);
    check(!!(t.lsl && t.lsm && t.glow && t.seL && t.seD && t.seL !== t.seD && t.scrimSoft) && /0?\.9\)$/.test(t.scrim), 'token pendamping: --ls-label, --ls-meta, --amber-glow, --swatch-edge (dua nilai), --scrim-soft; --scrim tetap .90', JSON.stringify({ lsl: t.lsl, lsm: t.lsm, seL: t.seL, seD: t.seD, soft: t.scrimSoft }));
    const css = fs.readFileSync(path.join(ROOT, 'assets/css/base.css'), 'utf8');
    const head = css.slice(0, css.indexOf('*/'));
    check(/760/.test(head) && /1024/.test(head) && /1023/.test(head), 'tabel breakpoint 760/1024 di komentar kepala base.css');
    // --scrim-soft hanya untuk ::backdrop dan .scrim
    const uses = [];
    for (const f of ['base.css', 'style.css', 'lamp.css', 'motion.css']) { const src = fs.readFileSync(path.join(ROOT, 'assets/css', f), 'utf8'); src.split('}').forEach((blk) => { if (/var\(--scrim-soft/.test(blk)) uses.push(blk.split('{')[0].trim().split('\n').pop()); }); }
    check(uses.every((s) => /::backdrop|^\.scrim\b/.test(s)), '--scrim-soft hanya dipakai di ::backdrop dan .scrim', uses.join(' | '));
  }

  /* ---------- C7 gerbang hover ---------- */
  if (want('c7')) {
    const p = await open('desktop');
    const r = await p.evaluate((SEKSI) => {
      // nav/menu dihitung juga bila tak ada elemen cocok di index (mis. nav terang koleksi di motion.css)
      const BASE = /\.(btn|chip|tab|swatch|segmented|switch|text-link|toast__action|nav|nav__[\w-]+|menu|menu__[\w-]+|menu-sheet[\w-]*|logo)\b/;
      const CLICK = 'a[href], a[data-wa], button, label, summary, select, input, textarea, [role="button"], [role="tab"], [role="radio"], [role="switch"], [role="link"], [tabindex]:not([tabindex="-1"])';
      const split = (s) => { const out = []; let d = 0, cur = ''; for (const ch of s) { if (ch === '(') d++; if (ch === ')') d--; if (ch === ',' && d === 0) { out.push(cur.trim()); cur = ''; } else cur += ch; } if (cur.trim()) out.push(cur.trim()); return out; };
      const inScope = (el) => SEKSI.some((s) => el.closest(s));
      const bad = [], ok = [];
      const walk = (list, conds) => { for (const r of list) {
        if (r.type === 4) { walk(r.cssRules, conds.concat(r.conditionText || r.media.mediaText)); continue; }
        if (r.cssRules && r.type !== 1) { walk(r.cssRules, conds); continue; }
        if (r.type !== 1 || !/:hover/.test(r.selectorText)) continue;
        for (const part of split(r.selectorText)) {
          if (!/:hover/.test(part)) continue;
          const plain = part.replace(/:hover/g, '').replace(/::?(before|after|placeholder)/g, '');
          let els = []; try { els = [...document.querySelectorAll(plain)]; } catch (_) {}
          const scoped = els.some(inScope) || BASE.test(part.split(':hover')[0]);
          if (!scoped) continue;
          const gated = conds.some((c) => /hover:\s*hover/.test(c) && /pointer:\s*fine/.test(c));
          // subjek :hover = compound tepat sebelum ':hover' (di dalam :has(...) diambil setelah '(' terakhir)
          let pre = part.slice(0, part.indexOf(':hover')); let depth = 0; for (const ch of pre) depth += ch === '(' ? 1 : ch === ')' ? -1 : 0;
          if (depth > 0) pre = pre.slice(pre.lastIndexOf('(') + 1);
          let subj = []; try { subj = [...document.querySelectorAll(pre.replace(/:hover/g, ''))].filter(inScope); } catch (_) {}
          const unclick = subj.filter((el) => !el.matches(CLICK) && !el.closest(CLICK));
          if (!gated) bad.push(`tidak digerbang: ${part}`);
          else if (unclick.length) bad.push(`subjek tidak bisa diklik: ${part} (${unclick[0].tagName.toLowerCase()}.${String(unclick[0].className).split(' ')[0]})`);
          else ok.push(part);
        }
      } };
      for (const sh of document.styleSheets) { try { walk(sh.cssRules, []); } catch (_) {} }
      return { bad, n: ok.length };
    }, SEKSI);
    check(r.bad.length === 0, `C7: aturan :hover komponen dasar dan seksi jadi digerbang (hover: hover) and (pointer: fine), subjek bisa diklik`, r.bad.join(' | ') || `${r.n} aturan`);
  }

  /* ---------- C8 status tekan ---------- */
  if (want('c8')) {
    for (const vp of ['hp', 'hp360', 'hpshort', 'desktop']) for (const reduce of [false, true]) {
      const p = await open(vp, { reduce, wait: 1200 });
      // orderbar terlihat bila sudah tampil (HP); paksa tampil supaya kontrolnya ikut diukur
      await p.evaluate(() => { const b = document.querySelector('#orderbar'); if (b && matchMedia('(max-width: 900px)').matches) { b.hidden = false; b.classList.add('is-on'); } });
      await p.addStyleTag({ content: '*, *::before, *::after { transition: none !important; animation: none !important; }' });
      const n = await p.evaluate((SEKSI) => {
        const CTRL = 'a[href], a[data-wa], button, label:has(input), summary, select, [role="switch"], [role="button"], [role="tab"]';
        let i = 0;
        document.querySelectorAll(SEKSI.map((s) => `${s} :is(${CTRL})`).join(',')).forEach((el) => {
          const r = el.getBoundingClientRect(), cs = getComputedStyle(el);
          if (r.width < 1 || r.height < 1 || cs.visibility === 'hidden' || el.closest('[hidden], [inert]') || el.closest('dialog:not([open])')) return;
          if (el.matches('#edisi-app input') ) return;
          el.setAttribute('data-c8', String(i++));
        });
        return i;
      }, SEKSI);
      const cdp = await p.context().newCDPSession(p);
      await cdp.send('DOM.enable'); await cdp.send('CSS.enable');
      const { root } = await cdp.send('DOM.getDocument', { depth: -1 });
      const SIG = (k) => {
        const el = document.querySelector(`[data-c8="${k}"]`);
        const P = ['transform', 'scale', 'background-color', 'color', 'box-shadow', 'opacity', 'border-top-color', 'outline-color', 'text-decoration-color', 'filter', 'background-image'];
        const nodes = [el, ...el.querySelectorAll(':scope > *, :scope > * > *')].slice(0, 12);
        const out = {};
        nodes.forEach((nd, j) => [null, '::before', '::after'].forEach((pe) => { const cs = getComputedStyle(nd, pe); P.forEach((pr) => { out[`${j}${pe || ''} ${pr}`] = cs.getPropertyValue(pr); }); }));
        return { sig: out, who: `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}.${String(el.className).split(' ').slice(0, 2).join('.')} "${(el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 24)}"` };
      };
      const fail = [];
      for (let k = 0; k < n; k++) {
        const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector: `[data-c8="${k}"]` });
        if (!nodeId) continue;
        const a = await p.evaluate(SIG, k);
        await cdp.send('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: ['active'] });
        const b = await p.evaluate(SIG, k);
        await cdp.send('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: [] });
        const changed = Object.keys(a.sig).filter((x) => a.sig[x] !== b.sig[x]);
        const still = changed.filter((x) => !/ (transform|scale)$/.test(x));
        if (reduce ? still.length === 0 : changed.length === 0) fail.push(a.who + (changed.length ? ' (hanya skala)' : ''));
      }
      check(n > 0 && fail.length === 0, `C8 ${vp}${reduce ? ' reduce' : ''}: ${n} kontrol punya status tekan${reduce ? ' tanpa gerak' : ''}`, fail.slice(0, 8).join(' | '));
    }
  }

  /* ---------- C10 durasi ---------- */
  if (want('c10')) {
    for (const vp of ['hp', 'desktop']) {
      const p = await open(vp, { wait: 1500 });
      const tm = await p.evaluate(TIMING, SEKSI);
      const bad = tm.filter((t) => !DUR_OK.includes(t.d) || !(DEL_OK.includes(t.l) || (t.p === 'visibility' && VIS_DEL_OK.includes(t.l))));
      check(bad.length === 0, `C10 ${vp} biasa: transisi seksi jadi, nav, orderbar, toast pada token`, [...new Set(bad.map((t) => `${t.who} ${t.p} ${t.d}/${t.l}`))].slice(0, 10).join('; ') || `${tm.length} deklarasi`);
      // animasi yang berjalan setelah interaksi umum: ganti edisi (ketuk), toast, harga nav/orderbar
      await p.evaluate(() => { window.__runs = []; const orig = Element.prototype.animate; Element.prototype.animate = function (k, o) { const a = orig.call(this, k, o); window.__runs.push(a); return a; }; });
      await p.evaluate(() => document.querySelectorAll('#edisi-app .edisi__opt')[2].scrollIntoView({ block: 'center', behavior: 'instant' }));
      await p.waitForTimeout(400);
      const r = await p.evaluate(() => { const o = document.querySelectorAll('#edisi-app .edisi__opt')[3].getBoundingClientRect(); return [o.left + o.width / 2, o.top + o.height / 2]; });
      if (vp === 'desktop') await p.mouse.click(r[0], r[1]); else await p.touchscreen.tap(r[0], r[1]);
      await p.evaluate(() => window.MKSLamp.toast('Uji toast'));
      await p.waitForTimeout(40);
      const run = await p.evaluate(() => document.getAnimations().map((a) => { const t = a.effect.getTiming(); const tg = a.effect.target; return { d: +t.duration || 0, l: +t.delay || 0, who: tg ? (tg.getAttribute('class') || tg.tagName) : '?', p: a.transitionProperty || 'waapi' }; }));
      const badR = run.filter((a) => !DUR_OK.includes(Math.round(a.d)) || !(DEL_OK.includes(a.l) || (a.p === 'visibility' && VIS_DEL_OK.includes(a.l))));
      check(badR.length === 0, `C10 ${vp} biasa: animasi yang berjalan (ganti edisi, toast, harga) pada token`, badR.map((a) => `${a.who} ${a.p} ${a.d}/${a.l}`).join('; ') || run.map((a) => `${a.p}:${a.d}${a.l ? '+' + a.l : ''}`).join(','));
      check(p.__errs.length === 0, `C10 ${vp}: tanpa galat JS`, p.__errs.join(' | ').slice(0, 200));
    }
    for (const vp of ['hp', 'desktop']) {
      const p = await open(vp, { reduce: true, wait: 1200 });
      const tm = await p.evaluate(TIMING, SEKSI);
      const bad = tm.filter((t) => !DUR_RED.includes(t.d));
      check(bad.length === 0, `C10 ${vp} reduce: durasi {0, 0,01, 150}`, [...new Set(bad.map((t) => `${t.who} ${t.p} ${t.d}`))].slice(0, 10).join('; ') || `${tm.length} deklarasi`);
      const lin = await p.evaluate(() => [...document.querySelectorAll('*')].flatMap((el) => { const cs = getComputedStyle(el); const pr = cs.transitionProperty.split(','), tf = cs.transitionTimingFunction.split(/,(?![^(]*\))/), du = cs.transitionDuration.split(','); return pr.map((x, i) => ({ p: x.trim(), f: (tf[i % tf.length] || '').trim(), d: parseFloat(du[i % du.length]) })).filter((t) => t.d > 0 && t.f === 'linear' && t.p !== 'opacity').map((t) => `${String(el.className).split(' ')[0]} ${t.p}`); }));
      check(lin.length === 0, `C10 ${vp} reduce: linear hanya untuk opacity`, [...new Set(lin)].slice(0, 6).join('; '));
    }
  }

  /* ---------- C11 ---------- */
  if (want('c11')) {
    for (const vp of ['desktop', 'hp']) {
      const p = await open(vp);
      const r = await p.evaluate(() => {
        const vis = (el) => { if (!el) return false; const cs = getComputedStyle(el), b = el.getBoundingClientRect(); return cs.display !== 'none' && cs.visibility !== 'hidden' && b.width > 0 && b.height > 0 && parseFloat(cs.fontSize) >= 12; };
        const tbl = [...document.querySelectorAll('#paket .paket__table .paket__il, #paket .paket__panel .paket__il')].filter(vis).map((e) => e.textContent.trim());
        const bg = document.querySelector('#bagian .bagian__il');
        const sub = document.querySelector('#bagian .section-sub');
        return { tbl, nTbl: document.querySelectorAll('#paket .paket__table .paket__il').length, bag: vis(bg) && bg.textContent.trim(), after: !!(bg && sub && sub.nextElementSibling === bg), dyn: !!(bg && bg.hasAttribute('data-dynamic-text')), legal: /Gambar: ilustrasi, bukan foto \(kecuali bertanda Foto asli\)/.test(document.querySelector('.footer').innerText) };
      });
      check(r.tbl.length === 1 && /^ilustrasi$/i.test(r.tbl[0]) && (vp !== 'desktop' || r.nTbl === 1), `C11 ${vp}: tepat satu label ILUSTRASI terlihat di #paket (${vp === 'desktop' ? 'tabel' : 'panel'})`, JSON.stringify(r.tbl));
      check(r.bag === 'Gambar: ilustrasi, bukan foto' && r.after && r.dyn, `C11 ${vp}: baris "Gambar: ilustrasi, bukan foto" di #bagian, tepat setelah .section-sub, ber-data-dynamic-text`, String(r.bag));
      check(r.legal, `C11 ${vp}: baris legal footer ada`);
    }
  }

  /* ---------- C16 ---------- */
  if (want('c16')) {
    for (const f of ['index.html', '404.html']) {
      const raw = fs.readFileSync(path.join(ROOT, f), 'utf8');
      const rp = raw.match(/Rp\s?\d[^<"]{0,12}/g) || [], wa = raw.match(/.{0,20}wa\.me\/.{0,20}/g) || [];
      check(rp.length === 0 && wa.length === 0, `C16 ${f}: HTML mentah tanpa 'Rp' diikuti angka dan tanpa 'wa.me/'`, [...rp, ...wa].join(' | '));
      const cfg = fs.readFileSync(path.join(ROOT, 'assets/js/config.js'), 'utf8').match(/whatsapp:\s*"(\d+)"/)[1];
      check(!raw.includes(cfg), `C16 ${f}: nomor WhatsApp tidak diketik di HTML`);
    }
    const idx = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
    check((idx.match(/<noscript>/g) || []).length === 1 && !/\d{9,}/.test((idx.match(/<noscript>[\s\S]*?<\/noscript>/) || [''])[0].replace(/https?:[^"]+/g, '')), 'C16 index: satu <noscript>, tanpa nomor');
    // tanpa JS: kalimat terbaca
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, javaScriptEnabled: false });
    const q = await ctx.newPage(); await q.goto(base + 'index.html', { waitUntil: 'load' });
    const nj = await q.evaluate(() => { const e = document.querySelector('.noscript-note'); const r = e && e.getBoundingClientRect(); return { txt: document.body.innerText.includes('Harga dan tombol pesan WhatsApp membutuhkan JavaScript.'), vis: !!(r && r.width > 0 && r.height > 0), sni: document.body.innerText.includes('Lampu rakitan ini bukan produk bersertifikat SNI'), faq: document.querySelectorAll('#faq details').length }; });
    check(nj.txt && nj.vis, 'C16 tanpa JS: kalimat <noscript> terbaca', JSON.stringify(nj));
    check(nj.sni && nj.faq > 0, 'C16 tanpa JS: kalimat SNI dan FAQ (<details>) terbaca');
    await ctx.close();
    // lamp.js diblokir, config.js termuat
    for (const vp of ['hp', 'desktop']) {
      const c2 = await browser.newContext({ viewport: vp === 'hp' ? { width: 390, height: 844 } : { width: 1440, height: 900 } });
      await c2.route(/\/assets\/js\/lamp\.js/, (r) => r.abort());
      const p = await c2.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(String(e)));
      await p.goto(base + 'index.html', { waitUntil: 'load' }); await p.waitForTimeout(500);
      const r = await p.evaluate(() => { const n = window.MKS_CONFIG.whatsapp; const all = [...document.querySelectorAll('[data-wa]')]; return { n: all.length, bad: all.filter((a) => !(a.href || '').startsWith('https://wa.me/' + n + '?text=')).map((a) => a.outerHTML.slice(0, 80)), order: decodeURIComponent((document.querySelector('[data-wa="order"]') || {}).href || '') }; });
      check(r.n > 0 && r.bad.length === 0, `C16 ${vp} lamp.js diblokir: ${r.n} [data-wa] ber-href wa.me/<MKS_CONFIG.whatsapp>`, r.bad.join(' | '));
      check(/kode rakitan/i.test(r.order), `C16 ${vp} lamp.js diblokir: sapaan data-wa="order" menyebut kode rakitan belum termuat`, r.order.slice(0, 120));
      await c2.close();
    }
  }

  /* ---------- C13 ---------- */
  if (want('c13')) for (const vp of ['hp', 'desktop']) {
    const p = await open(vp);
    let txt = await p.evaluate(() => document.body.innerText);
    check(/Lampu rakitan ini bukan produk bersertifikat SNI/.test(txt) && /kit kelistrikan, komponen bertanda SNI\/K3L/i.test(txt), `C13 ${vp}: kalimat SNI dan frasa kit ada`);
    const raw = txt; SNI_OK.forEach((re) => { txt = txt.replace(re, ''); });
    const rest = txt.match(/.{0,30}SNI.{0,20}/g) || [];
    check(rest.length === 0, `C13 ${vp}: setiap 'SNI' lolos daftar izin`, rest.join(' | '));
    const sos = (raw.match(SOSIAL) || [])[0];
    check(!sos, `C13 ${vp}: tanpa bukti sosial`, sos || '');
    check((raw.match(/Pilihan studio/gi) || []).length === 1, `C13 ${vp}: 'Pilihan studio' tepat sekali`);
  }

  /* ---------- C23 baris label ---------- */
  if (want('c23')) {
    const p = await open('desktop', { hash: '#edit', wait: 1400 });
    await p.evaluate(() => { const c = document.querySelector('#mks-textmode'); if (c && !c.checked) c.click(); });
    await p.waitForTimeout(200);
    const e = await p.evaluate(() => { const l = document.querySelector('#bagian .bagian__il'), s = document.querySelector('#bagian .section-sub'); return { lab: l.isContentEditable || l.classList.contains('mks-editable'), sub: s.isContentEditable || s.classList.contains('mks-editable') }; });
    check(!e.lab && e.sub, 'C23 Mode Edit: baris label #bagian tidak bisa disunting; lead #bagian bisa', JSON.stringify(e));
    // sunting lead, lalu ekspor index.html: label utuh, lead tersunting, tanpa harga ketikan/wa.me
    await p.evaluate(() => { const el = document.querySelector('#bagian .section-sub'); el.textContent = 'LEAD BAGIAN EKSPOR'; el.dispatchEvent(new Event('input', { bubbles: true })); });
    await p.waitForTimeout(300);
    await p.evaluate(() => { const b = [...document.querySelectorAll('.mks-tabs button')].find((x) => x.dataset.tab === 'ekspor'); b && b.click(); });
    await p.waitForTimeout(1500);
    const ex = await p.evaluate(() => { const ta = document.querySelector('#mks-file-0'); return ta ? ta.value : ''; });
    const doc = ex.replace(/\s+/g, ' ');
    check(/<p class="label bagian__il" data-dynamic-text="?"?>Gambar: ilustrasi, bukan foto<\/p>/.test(doc) && /LEAD BAGIAN EKSPOR/.test(doc), 'C23 Ekspor: baris label utuh dan lead tersunting di index.html hasil ekspor', doc.match(/.{0,60}bagian__il.{0,60}/) ? doc.match(/.{0,60}bagian__il.{0,60}/)[0] : '(tidak ada)');
    check(!/Rp\s?\d/.test(ex.replace(/<script[\s\S]*?<\/script>/g, '')) && !/wa\.me\//.test(ex), 'C23 Ekspor: index.html hasil ekspor tanpa harga ketikan dan tanpa wa.me/');
    await p.evaluate(() => localStorage.removeItem('mks-edits-v2'));
    check(p.__errs.length === 0, 'C23 Mode Edit: tanpa galat JS', p.__errs.join(' | ').slice(0, 200));
  }

  /* ---------- C14 ---------- */
  if (want('c14')) {
    const before = JSON.parse(fs.readFileSync(SNAP.FILE, 'utf8'));
    const now = await SNAP.ambil(open);
    for (let i = 0; i < 5; i++) {
      const a = before[i], b = now[i];
      check(a.amount === b.amount && a.was === b.was && a.total === b.total, `C14 edisi ${i}: harga dan coret sama dengan snapshot`, `${b.amount} · ${b.was}`);
      // dibandingkan sebagai himpunan pesan unik: langkah rakit menghapus tautan WA ringkasan HP kedua (#wa-link-hp) yang
      // pesannya sama persis dengan #wa-link; setiap pesan sebelum langkah harus tetap ada dan tidak ada pesan baru
      const ua = [...new Set(a.wa)].sort(), ub = [...new Set(b.wa)].sort();
      const diff = [...ub.filter((x) => !ua.includes(x)).map((x) => 'baru: ' + x), ...ua.filter((x) => !ub.includes(x)).map((x) => 'hilang: ' + x)];
      check(a.order === b.order && diff.length === 0, `C14 edisi ${i}: pesan WhatsApp plakat dan ${ub.length} pesan [data-wa] unik sama`, diff.slice(0, 2).join(' | ').slice(0, 200));
    }
  }

  /* ---------- toast ---------- */
  if (want('toast')) {
    const p = await open('desktop');
    const vis = () => p.evaluate(() => document.querySelector('#toast').classList.contains('show'));
    const tr = await p.evaluate(() => { const t = document.querySelector('#toast'); const out = getComputedStyle(t).transitionDuration; t.classList.add('show'); const inn = getComputedStyle(t).transitionDuration; t.classList.remove('show'); return { out, inn }; });
    check(/^0\.15s/.test(tr.out) && /^0\.25s/.test(tr.inn), 'toast: masuk 250, keluar 150', `${tr.inn} / ${tr.out}`);
    await p.mouse.move(5, 5);
    await p.evaluate(() => window.MKSLamp.toast('Uji tiga detik'));
    await p.waitForTimeout(2800); const a1 = await vis(); await p.waitForTimeout(500); const a2 = await vis();
    check(a1 && !a2, 'toast: tanpa aksi hilang setelah 3 s', `2,8 s ${a1} · 3,3 s ${a2}`);
    await p.evaluate(() => window.MKSLamp.toast('Uji gagal', { error: true }));
    await p.waitForTimeout(4800); const b1 = await vis(); await p.waitForTimeout(500); const b2 = await vis();
    check(b1 && !b2, 'toast: kegagalan hilang setelah 5 s', `4,8 s ${b1} · 5,3 s ${b2}`);
    await p.evaluate(() => window.MKSLamp.toast('Uji hover'));
    await p.waitForTimeout(300);
    const box = await p.evaluate(() => { const r = document.querySelector('#toast').getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; });
    await p.mouse.move(box[0], box[1]); await p.waitForTimeout(4000); const c1 = await vis();
    await p.mouse.move(5, 5); await p.waitForTimeout(3300); const c2 = await vis();
    check(c1 && !c2, 'toast: tidak hilang selama hover, hilang 3 s setelah kursor pergi', `hover 4 s ${c1} · sesudah ${c2}`);
    await p.evaluate(() => window.MKSLamp.toast('Uji fokus', { action: { label: 'Lihat', href: '#rakit' } }));
    await p.evaluate(() => document.querySelector('#toast .toast__action').focus());
    await p.waitForTimeout(6000); const d1 = await vis();
    check(d1, 'toast: tidak hilang selama fokus di dalamnya', String(d1));
    check(p.__errs.length === 0, 'toast: tanpa galat JS', p.__errs.join(' | ').slice(0, 200));
  }
});
