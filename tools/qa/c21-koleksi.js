// Cek langkah koleksi-qa: koleksi.html (K11) dan lintas halaman.
// Pakai: node tools/qa/c21-koleksi.js <url> [--only=c21,ongkir,c11,c13,c14,c16,c19,c9,berisi,c23,edit,tinggi,rapi,laci]
//   c21    tanpa .promo, .wa-float, animasi berjalan, nomor 01–04; 390×664: gambar hero utuh + satu aksi WA di layar pertama
//   ongkir freeShipping false: tidak ada "gratis ongkir" di halaman maupun keranjang berisi; true: bilah memakai scaleX
//   c11    setiap gambar bukan foto (hero, kartu, modal) berlabel ILUSTRASI; legal footer
//   c13    kalimat SNI hanya dalam bentuk penyangkalan / pertanyaan FAQ; tanpa "ber-SNI"
//   c14    harga kartu dan modal = products.js; subtotal keranjang = jumlah
//   c16    HTML mentah tanpa "Rp"+angka dan "wa.me/", satu <noscript>; href WA awal dari config.js walau main.js diblokir
//   c19    tanpa gulir samping di 320, 360, 390, 820, 1024, 1440 (koleksi dan index)
//   c9     kontrol koleksi >= 44 × 44 di 390 dan 360
//   berisi paling banyak satu tombol berisi per layar sepanjang gulir (koleksi 390, 1440)
//   c23    suntingan lama koleksi (pita promo div:0, nomor kartu, h4 footer, tautan WhatsApp) tidak jatuh ke elemen lain
//   edit   Mode Edit koleksi: panel, teks bisa disunting dan tersimpan, tab Produk, Ekspor memuat products.js dan freeShipping
//   tinggi tinggi halaman index di 390 <= 16.500 (angka lab)
//   rapi   'Pilihan studio' 0 kali di koleksi; tanda logo nav >= 28 di 320/360/390; pil ILUSTRASI di sepertiga atas gambar;
//          tombol '+ Keranjang' sebaris per baris kartu (1440, 390); hero satu kolom di 820 dan 1000
//   laci   keranjang: fokus masuk ke laci, isi halaman inert, Tab tetap di laci, Esc mengembalikan fokus ke tombol keranjang
const { run } = require('./_lib');
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..', '..');

run(async ({ open, check, opt, base }) => {
  const only = opt.only ? String(opt.only).split(',') : null;
  const on = (k) => !only || only.includes(k);
  const K = { page: 'koleksi.html' };

  if (on('c21')) {
    const p = await open('hpshort', { ...K, wait: 2000 });
    const r = await p.evaluate(() => {
      const art = document.querySelector('.hero__art').getBoundingClientRect();
      const wa = [...document.querySelectorAll('a[data-wa]')].filter((a) => { const b = a.getBoundingClientRect(); return b.height > 0 && b.top >= 0 && b.bottom <= innerHeight && getComputedStyle(a).visibility !== 'hidden'; });
      return {
        promo: document.querySelectorAll('.promo,[data-free-ship]').length, float: document.querySelectorAll('.wa-float').length,
        anim: document.getAnimations().filter((a) => a.playState === 'running').map((a) => (a.effect && a.effect.target && a.effect.target.className) || '?'),
        nums: [...document.querySelectorAll('.why *')].filter((e) => /^0[1-4]$/.test(e.textContent.trim())).length,
        art: { top: Math.round(art.top), bottom: Math.round(art.bottom), h: Math.round(art.height) }, ih: innerHeight,
        wa: wa.map((a) => a.textContent.trim()), waHref: wa.every((a) => /^https:\/\/wa\.me\/\d+\?text=/.test(a.href)),
        kf: [...document.styleSheets].some((s) => { try { return [...s.cssRules].some((r) => r.type === 7 && r.name === 'float'); } catch (_) { return false; } }),
      };
    });
    check(r.promo === 0 && r.float === 0, 'C21 tanpa pita promo dan gelembung WA melayang', JSON.stringify([r.promo, r.float]));
    check(r.anim.length === 0 && !r.kf, 'C21 tanpa animasi berjalan dan tanpa @keyframes float', r.anim.join(','));
    check(r.nums === 0, 'C21 kartu "Kenapa" tanpa nomor 01–04');
    check(r.art.top >= 0 && r.art.bottom <= r.ih && r.art.h >= 150, 'C21 390×664: gambar hero utuh di layar pertama', JSON.stringify(r.art));
    check(r.wa.length === 1 && r.waHref, 'C21 390×664: tepat satu aksi WhatsApp terjangkau di layar pertama', r.wa.join(' | '));
    check(p.__errs.length === 0, 'koleksi 390: tanpa error JS', p.__errs.join(' | '));
  }

  if (on('ongkir')) {
    for (const fs of [false, true]) {
      const p = await open('hp', { ...K, init: (v) => {
        try { localStorage.setItem('mks-cart-v1', JSON.stringify({ 'vas-kawung': 1 })); } catch (_) {}
        let cfg; Object.defineProperty(window, 'MKS_CONFIG', { configurable: true, get: () => cfg, set: (x) => { x.freeShipping = v; cfg = x; } });
      }, initArg: fs });
      await p.click('[data-open-cart]'); await p.waitForTimeout(400);
      const r = await p.evaluate(() => ({ t: document.body.innerText, bar: document.querySelector('[data-ship-bar]'), i: (document.querySelector('.ship-bar .bar i') || {}).style }));
      const r2 = await p.evaluate(() => { const b = document.querySelector('[data-ship-bar]'); const i = b.querySelector('.bar i'); return { hidden: b.hidden, html: b.innerHTML.length, tf: i ? i.style.transform : '', w: i ? i.style.width : '', t: /gratis ongkir/i.test(document.body.innerText), drawer: /gratis ongkir/i.test(document.querySelector('[data-drawer]').innerText) }; });
      if (!fs) check(!r2.t && !r2.drawer && r2.hidden && r2.html === 0, 'C21 freeShipping false: tanpa "gratis ongkir" di halaman dan keranjang berisi, bilah tidak dirender', JSON.stringify(r2));
      else check(r2.drawer && /^scaleX\(/.test(r2.tf) && !r2.w, 'freeShipping true (bawaan pemilik A7): kalimat tampil di keranjang, bilah memakai scaleX', JSON.stringify(r2));
    }
  }

  if (on('c11') || on('c14')) {
    const p = await open('desktop', K);
    const r = await p.evaluate(() => {
      const P = window.MKS_PRODUCTS, rp = (n) => 'Rp' + Math.round(n).toLocaleString('id-ID');
      const cards = [...document.querySelectorAll('.product')].map((c) => ({ id: c.querySelector('[data-view]').dataset.view, pill: !!c.querySelector('.product__art .pill') && c.querySelector('.product__art .pill').getBoundingClientRect().height > 0, img: !!c.querySelector('.product__art img'), price: c.querySelector('.price').textContent.trim() }));
      return { n: P.length, cards, want: Object.fromEntries(P.map((x) => [x.id, rp(x.price)])), hero: (() => { const e = document.querySelector('.hero__pill'); return e && e.getBoundingClientRect().height > 0 && /ilustrasi/i.test(e.textContent); })(), legal: /Gambar: ilustrasi, bukan foto/.test(document.querySelector('.footer').innerText) };
    });
    if (on('c11')) {
      check(r.hero, 'C11 pil ILUSTRASI di gambar hero');
      check(r.cards.length === r.n && r.cards.every((c) => c.pill || c.img), 'C11 setiap kartu produk bergambar ilustrasi berlabel ILUSTRASI', r.cards.filter((c) => !c.pill && !c.img).map((c) => c.id).join(','));
      check(r.legal, 'C11 legal footer: "Gambar: ilustrasi, bukan foto"');
    }
    if (on('c14')) check(r.cards.every((c) => c.price === r.want[c.id]), 'C14 harga kartu = products.js', r.cards.filter((c) => c.price !== r.want[c.id]).map((c) => c.id + ' ' + c.price).join(','));
    await p.click('.product [data-view]'); await p.waitForTimeout(300);
    const m = await p.evaluate(() => { const d = document.querySelector('[data-modal]'); const id = document.querySelector('[data-madd]').dataset.madd; const P = window.MKS_PRODUCTS.find((x) => x.id === id); return { open: d.open, pill: !!d.querySelector('.modal__art .pill'), price: d.querySelector('.price').textContent.trim(), want: 'Rp' + P.price.toLocaleString('id-ID') }; });
    if (on('c11')) check(m.open && m.pill, 'C11 modal produk: gambar berlabel ILUSTRASI');
    if (on('c14')) check(m.price === m.want, 'C14 harga modal = products.js', m.price + ' / ' + m.want);
    if (on('c14')) {
      await p.click('[data-madd]'); await p.waitForTimeout(300);
      await p.keyboard.press('Escape'); await p.waitForTimeout(300);
      await p.click('.product:nth-child(2) [data-add]'); await p.waitForTimeout(300);
      const c = await p.evaluate(() => { const cart = JSON.parse(localStorage.getItem('mks-cart-v1')); const P = window.MKS_PRODUCTS; const sum = Object.entries(cart).reduce((a, [id, q]) => a + q * P.find((x) => x.id === id).price, 0); return { got: document.querySelector('[data-cart-total]').textContent.trim(), want: 'Rp' + sum.toLocaleString('id-ID') }; });
      check(c.got === c.want, 'C14 subtotal keranjang = jumlah harga products.js', c.got + ' / ' + c.want);
    }
    check(p.__errs.length === 0, 'koleksi 1440: tanpa error JS', p.__errs.join(' | '));
  }

  if (on('c13')) {
    const p = await open('desktop', K);
    await p.evaluate(() => document.querySelectorAll('details').forEach((d) => (d.open = true)));
    await p.click('.product [data-view="lampu-candi"]').catch(() => {});
    await p.waitForTimeout(300);
    const t = await p.evaluate(() => document.body.innerText);
    const occ = t.match(/[^.?!\n]*bersertifikat SNI[^.?!\n]*[.?!]?/g) || [];
    const okOcc = occ.every((s) => /bukan produk bersertifikat SNI|^\s*Apakah .*bersertifikat SNI\?/.test(s));
    check(!/ber-SNI/i.test(t) && !/\bSNI\b(?! ?\/)/.test(t.replace(/bersertifikat SNI/g, '')) && okOcc, 'C13 SNI hanya dalam penyangkalan atau pertanyaan FAQ, tanpa "ber-SNI"', occ.join(' | '));
  }

  if (on('c16')) {
    const raw = fs.readFileSync(path.join(ROOT, 'koleksi.html'), 'utf8');
    check(!/Rp\s?\d/.test(raw), 'C16 koleksi.html mentah tanpa harga ketikan (Rp + angka)', (raw.match(/.{20}Rp\s?\d.{10}/) || [''])[0]);
    check(!/wa\.me\//.test(raw) && !/62\d{8,}/.test(raw), 'C16 koleksi.html mentah tanpa wa.me/ dan nomor');
    check((raw.match(/<noscript>/g) || []).length === 1 && /Harga dan tombol pesan WhatsApp membutuhkan JavaScript\./.test(raw), 'C16 tepat satu <noscript> dengan kalimat tanpa nomor');
    check(/data-cart-total>Rp —</.test(raw), 'C16 subtotal keranjang berplaceholder "Rp —"');
    const p = await open('hp', { ...K, init: () => {} });
    await p.route('**/assets/js/main.js', (r) => r.abort());
    await p.reload({ waitUntil: 'load' }); await p.waitForTimeout(500);
    const w = await p.evaluate(() => [...document.querySelectorAll('a[data-wa]')].map((a) => a.href));
    check(w.length >= 4 && w.every((h) => /^https:\/\/wa\.me\/\d+\?text=./.test(h)), 'C16 main.js diblokir: setiap tautan WA tetap ber-href dari config.js', w.length + ' tautan');
    const p2 = await open('hp', { ...K });
    const nojs = await p2.context().browser().newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
    const q = await nojs.newPage(); await q.goto(base + 'koleksi.html'); await q.waitForTimeout(300);
    const nt = await q.evaluate(() => ({ note: /membutuhkan JavaScript/.test(document.body.innerText), faq: document.querySelectorAll('.faq details').length, h1: document.querySelector('h1').getBoundingClientRect().height > 0 }));
    check(nt.note && nt.faq === 7 && nt.h1, 'C16 tanpa JS: kalimat noscript, judul, dan FAQ terbaca', JSON.stringify(nt));
    await nojs.close();
  }

  if (on('c19')) {
    for (const pg of ['koleksi.html', 'index.html']) {
      const bad = [];
      for (const w of [320, 360, 390, 820, 1024, 1440]) {
        const p = await open([w, 800, w < 1024], { page: pg, wait: 600 });
        const sw = await p.evaluate(async () => { let m = 0; const H = document.documentElement.scrollHeight; for (let y = 0; y < H; y += 700) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 30)); m = Math.max(m, document.documentElement.scrollWidth); } return m; });
        if (sw > w) bad.push(`${w}: ${sw}`);
        await p.context().close();
      }
      check(bad.length === 0, `C19 ${pg}: tanpa gulir samping di 320, 360, 390, 820, 1024, 1440`, bad.join(' | '));
    }
  }

  if (on('c9')) {
    for (const vp of ['hp', 'hp360']) {
      const p = await open(vp, K);
      const small = await p.evaluate(async () => {
        const out = [];
        const sel = '.nav a, .nav button, .menu summary, .hero a, [data-filters] button, .product__art, [data-add], .opt span, .field input, .estimate button, .b2b__cta a, .faq summary, .final a, .footer a, .footer button';
        for (const el of document.querySelectorAll(sel)) {
          const r = el.getBoundingClientRect(); if (!r.width || getComputedStyle(el).visibility === 'hidden' || el.closest('[hidden]')) continue;
          if (r.height < 44 - 0.5 || r.width < 44 - 0.5) out.push((el.className || el.tagName) + ' ' + el.textContent.trim().slice(0, 16) + ' ' + Math.round(r.width) + '×' + Math.round(r.height));
        }
        return out;
      });
      check(small.length === 0, `C9 koleksi ${vp}: kontrol >= 44 × 44`, small.slice(0, 8).join(' | '));
      await p.click('.product [data-view]'); await p.waitForTimeout(300);
      const ms = await p.evaluate(() => [...document.querySelectorAll('[data-modal] button, [data-modal] a')].map((e) => { const r = e.getBoundingClientRect(); return r.height < 43.5 || r.width < 43.5 ? (e.className || e.tagName) + ' ' + Math.round(r.width) + '×' + Math.round(r.height) : null; }).filter(Boolean));
      check(ms.length === 0, `C9 koleksi ${vp}: kontrol modal >= 44`, ms.join(' | '));
    }
  }

  if (on('berisi')) {
    for (const vp of ['hp', 'desktop']) {
      const p = await open(vp, K);
      const worst = await p.evaluate(async () => {
        const FILLED = '.btn--primary, .btn--primary-dark, .btn--wa, .btn--wa-amber, [data-primary-cta]';
        let worst = { n: 0 }; const H = document.documentElement.scrollHeight;
        for (let y = 0; y < H; y += 120) { scrollTo(0, y); await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
          const vis = [...document.querySelectorAll(FILLED)].filter((b) => { if (b.closest('dialog:not([open]), [aria-hidden="true"], [hidden]')) return false; const r = b.getBoundingClientRect(); return r.height > 0 && r.bottom > 0 && r.top < innerHeight; });
          if (vis.length > worst.n) worst = { n: vis.length, y, t: vis.map((b) => b.textContent.trim()) }; }
        return worst;
      });
      check(worst.n <= 1, `koleksi ${vp}: paling banyak satu tombol berisi per layar`, JSON.stringify(worst));
    }
  }

  if (on('c23')) {
    const KF = 'footer:0/div:0/div:';
    const seed = { layout: 10, products: null, config: null, text: { 'koleksi.html': {
      'div:0': 'PROMO LAMA', '#konten/section:1/div:0/div:0/article:0/span:0': '09', '#konten/section:1/div:0/div:0/article:1/h3:0': 'JUDUL KARTU SUNTINGAN',
      [KF + '1/h4:0']: 'BELANJA SUNTINGAN', [KF + '3/a:0']: 'WA LAMA', '#proses/div:0/h2:0': 'Dari ide ke rumah Anda (suntingan)', '#konten/section:0/div:0/div:0/h1:0': 'H1 SUNTINGAN' } } };
    const p = await open('desktop', { ...K, init: (s) => { try { if (!sessionStorage.getItem('__s')) { localStorage.setItem('mks-edits-v2', s); sessionStorage.setItem('__s', '1'); } } catch (_) {} }, initArg: JSON.stringify(seed) });
    const r = await p.evaluate(() => ({ body: document.body.innerText, rows: [...document.querySelectorAll('.why__row')].map((e) => e.innerText).join(' '), scrim: document.querySelector('.scrim').innerHTML, h1: document.querySelector('.hero h1').textContent, card: document.querySelectorAll('.why__row h3')[1].textContent, belanja: document.querySelector('.footer__col--jelajah h3').textContent, st: JSON.parse(localStorage.getItem('mks-edits-v2')) }));
    const v2 = (r.st.textV2 || {})['koleksi.html'] || {}, t = r.st.text['koleksi.html'] || {};
    check(!/PROMO LAMA|WA LAMA|\(suntingan\)/.test(r.body) && !/\b09\b/.test(r.rows) && r.scrim === '', 'C23 koleksi: suntingan lama div:0 (pita promo), nomor kartu, tautan WhatsApp, H2 proses tidak jatuh ke elemen lain', r.scrim.slice(0, 40));
    check(r.h1 === 'H1 SUNTINGAN' && r.card === 'JUDUL KARTU SUNTINGAN' && r.belanja === 'BELANJA SUNTINGAN', 'C23 koleksi: suntingan sah tetap berlaku, h4 footer pindah ke h3', [r.h1, r.card, r.belanja].join(' | '));
    check(['div:0', KF + '3/a:0', '#proses/div:0/h2:0'].every((a) => a in v2 && !(a in t)) && r.st.layout === 11, 'C23 koleksi: alamat lama diarsipkan di textV2, layout 11', JSON.stringify(Object.keys(v2)));
  }

  if (on('edit')) {
    const p = await open('desktop', { ...K, hash: '#edit', wait: 1200 });
    await p.evaluate(() => { const c = document.querySelector('#mks-textmode'); if (c && !c.checked) c.click(); });
    await p.waitForTimeout(200);
    const e = await p.evaluate(() => ({ panel: !!document.querySelector('.mks-editor'), ed: document.querySelectorAll('.mks-editable').length, wa: !!document.querySelector('.hero__wa.mks-editable'), rows: document.querySelectorAll('.why__row .mks-editable').length, dyn: document.querySelectorAll('[data-products] .mks-editable, [data-drawer] .mks-editable').length }));
    check(e.panel && e.ed > 60 && e.wa && e.rows === 8 && e.dyn === 0, 'Mode Edit koleksi: panel, teks statis bisa disunting (termasuk tautan WA hero dan baris "Kenapa"), katalog dan keranjang tidak', JSON.stringify(e));
    await p.evaluate(() => { const el = document.querySelector('.faq details p'); el.textContent = 'JAWAB DARI MODE EDIT'; el.dispatchEvent(new Event('input', { bubbles: true })); });
    await p.reload({ waitUntil: 'load' }); await p.waitForTimeout(900);
    const sv = await p.evaluate(() => document.querySelector('.faq details p').textContent.trim());
    check(sv === 'JAWAB DARI MODE EDIT', 'Mode Edit koleksi: suntingan FAQ tersimpan setelah muat ulang', sv);
    await p.click('.mks-tabs [data-tab="produk"]'); await p.waitForTimeout(300);
    const pr = await p.evaluate(() => document.querySelectorAll('.mks-editor .mks-card').length === window.MKS_PRODUCTS.length);
    check(pr, 'Mode Edit koleksi: tab Produk memuat semua produk');
    await p.click('.mks-tabs [data-tab="ekspor"]'); await p.waitForTimeout(1200);
    const ex = await p.evaluate(() => document.querySelector('.mks-editor').innerText + [...document.querySelectorAll('.mks-editor textarea')].map((t) => t.value).join('\n'));
    check(/MKS_PRODUCTS/.test(ex) && /"freeShipping": true/.test(ex), 'Mode Edit koleksi: Ekspor memuat products.js dan config.js (dengan freeShipping)');
    check(p.__errs.length === 0, 'Mode Edit koleksi: tanpa error JS', p.__errs.join(' | '));
  }

  if (on('rapi')) {
    for (const vp of ['desktop', 'hp']) {
      const p = await open(vp, { ...K, wait: 1200 });
      const r = await p.evaluate(() => {
        const n = (document.body.innerText.match(/pilihan studio/gi) || []).length;
        const pills = [...document.querySelectorAll('.product__art')].map((a) => { const A = a.getBoundingClientRect(), q = a.querySelector('.product__il'); if (!q) return true; const Q = q.getBoundingClientRect(); return Q.bottom <= A.top + A.height / 3; });
        const rows = {};
        document.querySelectorAll('.product').forEach((c) => { const t = Math.round(c.getBoundingClientRect().top); const b = c.querySelector('.product__add').getBoundingClientRect().top; (rows[t] = rows[t] || []).push(Math.round(b)); });
        const misal = Object.values(rows).filter((v) => Math.max(...v) - Math.min(...v) > 1).length;
        const art = document.querySelector('.hero__art').getBoundingClientRect(), hp = document.querySelector('.hero__pill').getBoundingClientRect();
        return { n, pillsOk: pills.every(Boolean), misal, heroPill: hp.bottom <= art.top + art.height / 3 };
      });
      check(r.n === 0, `koleksi ${vp}: "Pilihan studio" tidak muncul (hanya sekali di situs, di index)`, String(r.n));
      check(r.pillsOk && r.heroPill, `koleksi ${vp}: pil ILUSTRASI di sepertiga atas gambar (tidak menutup alas benda)`);
      check(r.misal === 0, `koleksi ${vp}: harga dan "+ Keranjang" sebaris di setiap baris kartu`, String(r.misal));
    }
    for (const vp of [[320, 640, true], 'hp360', 'hp']) {
      const p = await open(vp, K);
      const w = await p.evaluate(() => { const r = document.querySelector('.nav .logo svg').getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height), document.documentElement.scrollWidth, innerWidth]; });
      check(w[0] >= 28 && w[1] >= 28 && w[2] <= w[3], `koleksi ${[].concat(vp)[0]}: tanda logo nav >= 28 × 28, tanpa gulir samping`, w.join(' · '));
    }
    for (const vp of [[820, 1180, true], [1000, 800, false]]) {
      const p = await open(vp, K);
      const r = await p.evaluate(() => { const h = document.querySelector('.hero h1').getBoundingClientRect(), a = document.querySelector('.hero__art').getBoundingClientRect(); return { stacked: a.top >= h.bottom, lines: Math.round(h.height / parseFloat(getComputedStyle(document.querySelector('.hero h1')).lineHeight)) }; });
      check(r.stacked && r.lines <= 3, `koleksi ${vp[0]}: hero satu kolom (gambar di bawah judul), judul <= 3 baris`, JSON.stringify(r));
    }
  }

  if (on('laci')) {
    const p = await open('desktop', { ...K, init: () => { try { localStorage.setItem('mks-cart-v1', JSON.stringify({ 'vas-kawung': 1 })); } catch (_) {} } });
    await p.focus('.cart-btn'); await p.keyboard.press('Enter'); await p.waitForTimeout(400);
    const a = await p.evaluate(() => ({ inDrawer: !!document.activeElement.closest('[data-drawer]'), inert: document.querySelector('main').inert, role: document.querySelector('[data-drawer]').getAttribute('role') }));
    for (let i = 0; i < 8; i++) await p.keyboard.press('Tab');
    const t = await p.evaluate(() => !!document.activeElement.closest('[data-drawer]'));
    await p.keyboard.press('Escape'); await p.waitForTimeout(300);
    const b = await p.evaluate(() => ({ back: document.activeElement.classList.contains('cart-btn'), inert: document.querySelector('main').inert }));
    check(a.inDrawer && a.inert && a.role === 'dialog', 'Laci keranjang: fokus masuk ke laci, isi halaman inert, role dialog', JSON.stringify(a));
    check(t, 'Laci keranjang: Tab tetap di dalam laci');
    check(b.back && !b.inert, 'Laci keranjang: Esc menutup dan mengembalikan fokus ke tombol keranjang', JSON.stringify(b));
    check(p.__errs.length === 0, 'Laci keranjang: tanpa error JS', p.__errs.join(' | '));
  }

  if (on('tinggi')) {
    const p = await open('hp', { wait: 1000 });
    const H = await p.evaluate(() => document.documentElement.scrollHeight);
    check(H <= 16500, 'Tinggi halaman index di 390 <= 16.500 (lab)', H + ' px');
  }
});
