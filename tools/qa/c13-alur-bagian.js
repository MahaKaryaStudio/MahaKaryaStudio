// Cek langkah alur-bagian (adendum v3.1): 04 #alur sebagai simulasi jujur + 06 #bagian (ubin + lembar bagian).
// Pakai: node tools/qa/c13-alur-bagian.js <url> [--only=c12,jujur,c15,c16,c11,c9,c20,ukur,lembar,gerak,c8,saring,karusel,ekspor]
//  c12     label "Simulasi alur pesan" (mono, data-dynamic-text) terlihat di kepala seksi di 390 dan 1440.
//  jujur   teks #alur tanpa nama orang, pujian, emoji, pola resi [A-Z]{2}\d{8,}; kolom tanpa bingkai ponsel di desktop.
//  c15     tanpa "konfigurator" dan "—" di #alur, #bagian, dan lembar bagian; kepala kolom #alur tanpa durasi (A2b).
//  c16     HTML mentah #alur dan #bagian tanpa "Rp" diikuti angka.
//  c11     pil ILUSTRASI pada thumb #alur dan di lembar bagian; baris "Gambar: ilustrasi, bukan foto" di #bagian.
//  c9      area tekan >= 44 × 44 (elementFromPoint di sudut kotak 44) dan jarak visual >= 8: ubin dan chip saring #bagian,
//          swatch, chip slot, dan tombol tutup lembar, di 390 dan 360.
//  c20     gelembung #alur >= 16 px di 390, 360, 1440.
//  ukur    tinggi #bagian di 390 <= 2.600 (brief ±2.380); tinggi #alur dilaporkan terhadap brief (1.080 / 960).
//  lembar  dialog: buka dari ubin, Escape menutup dan fokus kembali ke ubin; orderbar tersembunyi selama terbuka (HP);
//          satu tombol berisi terlihat (tombol "Pasang"), slot "Pesan" nav diam (desktop); "Pasang di rakitanku"
//          mengubah rakitan, menutup lembar, toast "… dipasang di …" dengan aksi "Lihat di studio", tanpa gulir otomatis.
//  gerak   lembar masuk 250 ms, keluar 150 ms (opacity/transform); reduce: tanpa animasi masuk > 0,01 ms, tutup seketika.
//  c8      setiap kontrol lembar bagian punya status tekan (biasa: transform atau warna; reduce: warna/latar/opacity).
//  saring  angka chip dari lamp-data (ikut berubah), chip menyaring ubin seketika.
//  karusel HP: scroll-snap x mandatory, wadah bisa difokus dan panah kanan menggeser, kartu berikutnya mengintip, titik
//          indikator mengikuti; tanpa gulir samping halaman di 320, 360, 390.
//  ekspor  suntingan lama (layout 8) pada gelembung #alur dan .alur__note tidak muncul di halaman maupun Ekspor index.html.
const { run } = require('./_lib');
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const AC = '#alur/div:0/div:0/article:';

const openSheet = async (p, tile = 'body:bola') => {
  await p.evaluate((t) => document.querySelector(`[data-ptile="${t}"]`).scrollIntoView({ block: 'center', behavior: 'instant' }), tile);
  await p.waitForTimeout(150);
  await p.evaluate((t) => document.querySelector(`[data-ptile="${t}"]`).click(), tile);
  await p.waitForTimeout(400);
};

run(async ({ open, check, opt }) => {
  const want = (k) => !opt.only || String(opt.only).split(',').includes(k);

  if (want('c12') || want('jujur') || want('c20')) {
    for (const vp of ['desktop', 'hp', 'hp360']) {
      const p = await open(vp);
      const r = await p.evaluate(() => {
        const a = document.querySelector('#alur'), l = a.querySelector('.alur__sim');
        l.scrollIntoView({ block: 'center', behavior: 'instant' });
        const cs = getComputedStyle(l), b = l.getBoundingClientRect();
        const bubs = [...a.querySelectorAll('.bub:not(.bub--img)')].map((x) => parseFloat(getComputedStyle(x).fontSize));
        const sub = [...a.querySelectorAll('.bub:not(.bub--img) *')].filter((x) => x.textContent.trim()).map((x) => parseFloat(getComputedStyle(x).fontSize));
        const col = a.querySelector('.alur__col'), ccs = getComputedStyle(col);
        return { txt: l.textContent.trim(), vis: cs.visibility !== 'hidden' && cs.display !== 'none' && b.width > 0 && b.top >= 0 && b.bottom <= innerHeight, mono: /Mono/.test(cs.fontFamily), fs: parseFloat(cs.fontSize), dyn: l.hasAttribute('data-dynamic-text'), head: !!l.closest('.wrap') && l.nextElementSibling && l.nextElementSibling.classList.contains('alur'),
          text: a.innerText, bubs, sub, colBg: ccs.backgroundColor, colShadow: ccs.boxShadow, phone: a.querySelectorAll('.phone').length, cols: a.querySelectorAll('.alur__col').length };
      });
      if (want('c12') && vp !== 'hp360') check(r.txt === 'Simulasi alur pesan' && r.vis && r.mono && r.fs >= 12 && r.dyn && r.head, `C12 ${vp}: label "Simulasi alur pesan" terlihat di kepala seksi #alur (mono, data-dynamic-text)`, JSON.stringify({ vis: r.vis, mono: r.mono, fs: r.fs, dyn: r.dyn, head: r.head }));
      if (want('jujur') && vp !== 'hp360') {
        const bad = [];
        if (/\bRani\b/.test(r.text)) bad.push('nama Rani');
        const halo = r.text.match(/\bHalo\s+([A-Z][a-z]+)\b/g) || [];
        halo.filter((h) => !/Halo MahaKarya/.test(h)).forEach((h) => bad.push('sapaan bernama: ' + h));
        if (/cantik|keren|bagus|mantap|suka banget|puas|terima kasih banyak|mantul/i.test(r.text)) bad.push('pujian');
        if (/\p{Extended_Pictographic}/u.test(r.text)) bad.push('emoji');
        if (/[A-Z]{2}\d{8,}/.test(r.text)) bad.push('pola resi');
        if (/persis seperti ini/i.test(r.text)) bad.push('"persis seperti ini"');
        check(bad.length === 0, `jujur ${vp}: teks #alur tanpa nama orang, pujian, emoji, resi karangan`, bad.join(', '));
        check(/Halo, ini rinciannya:/.test(r.text) && /Kurir dan nomor resi kami kirim di sini\./.test(r.text) && /(^|\n)OK(\n|$)/.test(r.text), `jujur ${vp}: gelembung studio "Halo, ini rinciannya:", pembeli "OK", resi "Kurir dan nomor resi kami kirim di sini."`);
        if (vp === 'desktop') check(r.phone === 0 && r.cols === 3 && r.colBg === 'rgba(0, 0, 0, 0)' && r.colShadow === 'none', 'jujur desktop: tiga kolom tanpa bingkai ponsel (tanpa latar/bayangan kolom)', JSON.stringify({ phone: r.phone, cols: r.cols, bg: r.colBg, sh: r.colShadow }));
      }
      if (want('c20')) check(r.bubs.length >= 6 && Math.min(...r.bubs, ...r.sub) >= 16, `C20 ${vp}: gelembung #alur >= 16 px`, `min ${Math.min(...r.bubs, ...r.sub)} dari ${r.bubs.length} gelembung`);
      check(p.__errs.length === 0, `${vp}: tanpa galat JS`, p.__errs.join(' | ').slice(0, 200));
    }
  }

  if (want('c15')) {
    for (const vp of ['desktop', 'hp']) {
      const p = await open(vp);
      const t1 = await p.evaluate(() => ['#alur', '#bagian'].map((s) => document.querySelector(s).innerText).join('\n'));
      await openSheet(p);
      const t2 = await p.evaluate(() => document.querySelector('#psheet').innerText);
      const heads = await p.evaluate(() => [...document.querySelectorAll('#alur .alur__head')].map((h) => h.innerText.replace(/\s+/g, ' ').trim()));
      const all = t1 + '\n' + t2;
      check(!/konfigurator/i.test(all) && !/—/.test(all), `C15 ${vp}: tanpa "konfigurator" dan "—" di #alur, #bagian, dan lembar bagian`, (all.match(/.{0,30}(konfigurator|—).{0,20}/i) || [''])[0]);
      check(/studio rakit/.test(t1), `C15 ${vp}: #bagian menyebut "studio rakit"`);
      check(heads.length === 3 && heads.every((h) => !/15 menit|\bmenit\b|\bjam\b|\bhari\b/i.test(h)) && /Setelah kode diterima/i.test(heads[0]), `C15 ${vp}: kepala kolom #alur tanpa durasi; kolom A "Setelah kode diterima"`, heads.join(' | '));
    }
  }

  if (want('c16')) {
    const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
    const sec = (id) => { const a = html.indexOf(`<section id="${id}"`); return html.slice(a, html.indexOf('</section>', a)); };
    const hit = ['alur', 'bagian'].map((id) => (sec(id).match(/Rp\s?\d[\d.]*/g) || []).map((m) => `#${id}: ${m}`)).flat();
    check(sec('alur').length > 500 && hit.length === 0, 'C16: HTML mentah #alur dan #bagian tanpa "Rp" diikuti angka', hit.join(', '));
  }

  if (want('c11')) {
    for (const vp of ['desktop', 'hp', 'hp360', 'hpshort']) {
      const p = await open(vp);
      const r = await p.evaluate(() => {
        const ph = document.querySelector('#alur [data-alur-photo]'), pill = ph && ph.querySelector('.pill');
        const cs = pill && getComputedStyle(pill), b = pill && pill.getBoundingClientRect(), pb = ph && ph.getBoundingClientRect();
        const il = document.querySelector('#bagian .bagian__il');
        return { pill: pill ? pill.textContent.trim() : null, fs: cs && parseFloat(cs.fontSize), inside: !!(b && pb && b.left >= pb.left && b.right <= pb.right && b.bottom <= pb.bottom && b.width > 0), svg: !!(ph && ph.querySelector('svg')), il: il && il.textContent.trim(), ilVis: il && getComputedStyle(il).display !== 'none' && il.getBoundingClientRect().height > 0 };
      });
      check(/^ilustrasi$/i.test(r.pill || '') && r.fs >= 12 && r.inside && r.svg, `C11 ${vp}: pil ILUSTRASI di dalam thumb #alur`, JSON.stringify(r));
      check(r.il === 'Gambar: ilustrasi, bukan foto' && r.ilVis, `C11 ${vp}: baris "Gambar: ilustrasi, bukan foto" di #bagian`);
      if (vp === 'desktop' || vp === 'hp') {
        await openSheet(p);
        const s = await p.evaluate(() => { const pl = document.querySelector('#psheet .psheet__fig .pill'); return pl && getComputedStyle(pl).display !== 'none' ? pl.textContent.trim() : null; });
        check(/^(ilustrasi|foto asli)$/i.test(s || ''), `C11 ${vp}: gambar di lembar bagian berpil ILUSTRASI`, String(s));
      }
    }
  }

  if (want('c9')) {
    const MEASURE = (sel) => {
      const els = [...document.querySelectorAll(sel)].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== 'hidden'; });
      const bad = [];
      els.forEach((e) => {
        const r = e.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        if (cy < 0 || cy > innerHeight) return;
        const pts = [[cx, cy], [cx - 21.5, cy - 21.5], [cx + 21.5, cy - 21.5], [cx - 21.5, cy + 21.5], [cx + 21.5, cy + 21.5]];
        const miss = pts.filter(([x, y]) => { const h = document.elementFromPoint(x, y); return !h || !(h === e || e.contains(h)); });
        if (miss.length) bad.push(`${e.className.split(' ')[0]}[${e.dataset.psColor || e.dataset.psSlot || e.dataset.ptile || e.dataset.pfilter || ''}] ${Math.round(r.width)}×${Math.round(r.height)}`);
      });
      // jarak visual antartetangga dalam satu baris (rect yang bertumpuk vertikal)
      const gaps = [];
      for (let i = 0; i + 1 < els.length; i++) {
        const a = els[i].getBoundingClientRect(), b = els[i + 1].getBoundingClientRect();
        if (Math.abs(a.top - b.top) < 4 && els[i].parentElement === els[i + 1].parentElement) gaps.push(Math.round((b.left - a.right) * 10) / 10);
        else if (els[i].closest('li') && els[i + 1].closest('li')) { /* ubin di sel grid berbeda */ const ga = els[i].closest('li').getBoundingClientRect(), gb = els[i + 1].closest('li').getBoundingClientRect(); if (Math.abs(ga.top - gb.top) < 4) gaps.push(Math.round((gb.left - ga.right) * 10) / 10); }
      }
      return { n: els.length, bad, minGap: gaps.length ? Math.min(...gaps) : null };
    };
    for (const vp of ['hp', 'hp360']) {
      const p = await open(vp);
      await p.evaluate(() => document.querySelector('#catalog').scrollIntoView({ block: 'start', behavior: 'instant' }));
      await p.waitForTimeout(200);
      // baris chip boleh bergeser ke samping di layar sempit: tiap chip diukur setelah digulir ke dalam baris
      const f = { n: 0, bad: [], minGap: null };
      for (const k of ['all', 'head', 'body', 'base']) {
        await p.evaluate((k) => document.querySelector(`#catalog [data-pfilter="${k}"]`).scrollIntoView({ inline: 'nearest', block: 'nearest', behavior: 'instant' }), k);
        const one = await p.evaluate(MEASURE, `#catalog [data-pfilter="${k}"]`);
        f.n += one.n; f.bad.push(...one.bad);
      }
      f.minGap = (await p.evaluate(MEASURE, '#catalog [data-pfilter]')).minGap;
      f.fits = await p.evaluate(() => { const r = document.querySelector('#catalog .pcat__filter'); return r.scrollWidth <= r.clientWidth; });
      check(f.n === 4 && f.bad.length === 0 && f.minGap >= 8, `C9 ${vp}: chip saring #bagian area tekan >= 44 dan jarak >= 8`, JSON.stringify(f));
      await p.evaluate(() => document.querySelector('#catalog .pcat__grid').scrollIntoView({ block: 'start', behavior: 'instant' }));
      await p.waitForTimeout(200);
      const t = await p.evaluate(MEASURE, '#catalog .ptile');
      check(t.n >= 2 && t.bad.length === 0 && t.minGap >= 8, `C9 ${vp}: ubin #bagian area tekan >= 44 dan jarak >= 8`, JSON.stringify(t));
      await openSheet(p);
      const sw = await p.evaluate(MEASURE, '#psheet .swatch');
      const sl = await p.evaluate(MEASURE, '#psheet [data-ps-slot]');
      const cl = await p.evaluate(MEASURE, '#psheet [data-ps-close]');
      const btn = await p.evaluate(MEASURE, '#psheet .psheet__act .btn');
      check(sw.n >= 5 && sw.bad.length === 0 && sw.minGap >= 8, `C9 ${vp}: swatch lembar bagian area tekan >= 44 dan jarak visual >= 8`, JSON.stringify(sw));
      check(sl.n >= 1 && sl.bad.length === 0 && (sl.minGap === null || sl.minGap >= 8), `C9 ${vp}: chip slot lembar area tekan >= 44 dan jarak >= 8`, JSON.stringify(sl));
      check(cl.n === 1 && cl.bad.length === 0 && btn.n === 2 && btn.bad.length === 0, `C9 ${vp}: tombol tutup dan dua tombol aksi lembar area tekan >= 44`, JSON.stringify({ cl, btn }));
    }
  }

  if (want('ukur')) {
    const H = {};
    for (const vp of ['desktop', 'hp', 'hp360']) {
      const p = await open(vp);
      H[vp] = await p.evaluate(() => ['#alur', '#bagian'].map((s) => Math.round(document.querySelector(s).getBoundingClientRect().height)));
    }
    check(H.hp[1] <= 2600, '#bagian di 390 <= 2.600 px (brief ±2.380; sebelum langkah 6.296)', `${H.hp[1]} px`);
    console.log(`UKUR #alur 1440 ${H.desktop[0]} (brief ±1.080) · 390 ${H.hp[0]} (brief ±960) · 360 ${H.hp360[0]}; #bagian 1440 ${H.desktop[1]} (brief ±1.270) · 390 ${H.hp[1]} (±2.380) · 360 ${H.hp360[1]}`);
  }

  if (want('lembar')) {
    for (const vp of ['hp', 'desktop']) {
      const p = await open(vp);
      // HP: gulir ke #bagian (orderbar sudah tampil di sini), lalu buka lembar
      await p.evaluate(() => document.querySelector('#bagian').scrollIntoView({ block: 'start', behavior: 'instant' }));
      await p.waitForTimeout(400);
      const before = await p.evaluate(() => ({ ob: !!document.querySelector('#orderbar.is-on') }));
      await openSheet(p);
      const o = await p.evaluate(() => {
        const d = document.querySelector('#psheet');
        const FILLED = '[data-primary-cta], .btn--primary, .btn--primary-dark, .btn--wa, .btn--wa-amber';
        const vis = (e) => { const r = e.getBoundingClientRect(), cs = getComputedStyle(e); let op = 1; for (let n = e; n && n.nodeType === 1; n = n.parentElement) op *= +getComputedStyle(n).opacity; return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight && cs.visibility !== 'hidden' && op > 0.1 && !e.closest('dialog:not([open])'); };
        const filledIn = [...d.querySelectorAll(FILLED)].filter(vis).map((e) => e.textContent.trim());
        const pesan = document.querySelector('.nav__pesan');
        return { open: d.open, modal: d.matches(':modal'), label: d.getAttribute('aria-labelledby') && (document.getElementById(d.getAttribute('aria-labelledby')) || {}).textContent, ob: !!document.querySelector('#orderbar.is-on'), filledIn, pesanVis: pesan ? vis(pesan) : false, inside: d.contains(document.activeElement), y: scrollY };
      });
      check(o.open && o.modal && !!o.label && o.inside, `lembar ${vp}: ubin membuka <dialog> modal berlabel, fokus di dalam`, JSON.stringify({ open: o.open, label: o.label, inside: o.inside }));
      if (vp === 'hp') check(before.ob && !o.ob, 'lembar hp: orderbar tersembunyi selama dialog terbuka (tampil sebelum dibuka)', JSON.stringify({ before: before.ob, during: o.ob }));
      check(o.filledIn.length === 1 && o.filledIn[0] === 'Pasang di rakitanku' && !o.pesanVis, `lembar ${vp}: satu tombol berisi ("Pasang di rakitanku"); WA "Pesan" nav tidak terlihat`, JSON.stringify({ filled: o.filledIn, pesan: o.pesanVis }));
      // WA pesan satuan: tautan wa.me ke nomor config, pesan menyebut bagian dan warna
      const wa = await p.evaluate(() => { const a = document.querySelector('#psheet .psheet__act a'); return { href: a.href, n: window.MKS_CONFIG.whatsapp, cls: a.className }; });
      const msg = decodeURIComponent((wa.href.split('text=')[1] || ''));
      check(wa.href.startsWith(`https://wa.me/${wa.n}?`) && /bagian satuan/.test(msg) && /Badan · Bola · /.test(msg) && !/btn--wa\b|btn--primary/.test(wa.cls), `lembar ${vp}: "Pesan satuan via WhatsApp" = tautan wa.me nomor config (bukan tombol berisi), pesan bagian satuan`, msg.split('\n')[1]);
      // Escape → tutup, fokus kembali ke ubin, orderbar kembali (HP)
      await p.keyboard.press('Escape');
      await p.waitForTimeout(400);
      const e = await p.evaluate(() => ({ open: document.querySelector('#psheet').open, f: document.activeElement && document.activeElement.getAttribute('data-ptile'), ob: !!document.querySelector('#orderbar.is-on') }));
      check(!e.open && e.f === 'body:bola' && (vp !== 'hp' || e.ob), `lembar ${vp}: Escape menutup dan mengembalikan fokus ke ubin${vp === 'hp' ? '; orderbar tampil lagi' : ''}`, JSON.stringify(e));
      // Pasang: warna Salmon, Badan 2
      await openSheet(p);
      // tanpa gulir otomatis = ubin tetap di tempat yang sama di layar (scroll anchoring boleh menyerap perubahan tinggi #rakit)
      const y0 = await p.evaluate(() => document.querySelector('[data-ptile="body:bola"]').getBoundingClientRect().top);
      await p.evaluate(() => { document.querySelector('#psheet [data-ps-color="salmon"]').click(); });
      await p.evaluate(() => { document.querySelector('#psheet [data-ps-slot="1"]').click(); });
      const mid = await p.evaluate(() => ({ title: document.querySelector('#psheet .grp__title b').textContent, slot: document.querySelector('#psheet [data-ps-slot="1"]').getAttribute('aria-pressed') }));
      await p.evaluate(() => document.querySelector('#psheet [data-ps-use]').click());
      await p.waitForTimeout(500);
      const u = await p.evaluate(() => ({ open: document.querySelector('#psheet').open, b1: window.MKSLamp.state.body[1], toast: document.querySelector('#toast').textContent, act: (document.querySelector('#toast .toast__action') || {}).getAttribute ? document.querySelector('#toast .toast__action').getAttribute('href') : null, y: document.querySelector('[data-ptile="body:bola"]').getBoundingClientRect().top, f: document.activeElement && document.activeElement.getAttribute('data-ptile') }));
      check(mid.title === 'Salmon' && mid.slot === 'true', `lembar ${vp}: swatch dan slot menandai pilihan (judul grup "WARNA: Salmon")`, JSON.stringify(mid));
      check(!u.open && u.b1 && u.b1.shape === 'bola' && u.b1.color === 'salmon' && /^Bola \(Salmon\) dipasang di Badan 2/.test(u.toast) && /Lihat di studio/.test(u.toast) && u.act === '#rakit' && Math.abs(u.y - y0) < 2 && u.f === 'body:bola', `lembar ${vp}: "Pasang di rakitanku" mengubah Badan 2, menutup, toast beraksi "Lihat di studio", tanpa gulir otomatis, fokus kembali`, JSON.stringify(u));
      check(p.__errs.length === 0, `lembar ${vp}: tanpa galat JS`, p.__errs.join(' | ').slice(0, 200));
    }
  }

  if (want('gerak')) {
    for (const reduce of [false, true]) {
      const p = await open('desktop', { reduce });
      await p.evaluate(() => document.querySelector('[data-ptile="head:plisir"]').scrollIntoView({ block: 'center', behavior: 'instant' }));
      await p.waitForTimeout(150);
      await p.evaluate(() => document.querySelector('[data-ptile="head:plisir"]').click());
      await p.waitForTimeout(30);
      const inA = await p.evaluate(() => document.getAnimations().filter((a) => a.effect && a.effect.target && (a.effect.target === document.querySelector('#psheet') || a.effect.pseudoElement === '::backdrop')).map((a) => ({ d: +a.effect.getTiming().duration, n: a.animationName || a.transitionProperty, props: a.effect.getKeyframes().flatMap((k) => Object.keys(k).filter((x) => !['offset', 'easing', 'composite', 'computedOffset'].includes(x))) })));
      await p.waitForTimeout(400);
      await p.evaluate(() => document.querySelector('#psheet [data-ps-close]').click());
      await p.waitForTimeout(30);
      const outA = await p.evaluate(() => ({ open: document.querySelector('#psheet').open, a: document.getAnimations().filter((a) => a.effect && a.effect.target === document.querySelector('#psheet')).map((a) => ({ d: +a.effect.getTiming().duration, p: a.transitionProperty })) }));
      await p.waitForTimeout(300);
      const closed = await p.evaluate(() => !document.querySelector('#psheet').open);
      const props = [...new Set(inA.flatMap((a) => a.props))];
      if (!reduce) {
        check(inA.length >= 1 && inA.every((a) => a.d === 250) && props.every((x) => ['opacity', 'transform'].includes(x)), 'gerak: lembar (dan latar) masuk 250 ms, hanya opacity/transform', JSON.stringify(inA));
        check(outA.open && outA.a.length >= 1 && outA.a.every((a) => a.d === 150 && ['opacity', 'transform'].includes(a.p)) && closed, 'gerak: lembar keluar 150 ms (opacity/transform), lalu tertutup', JSON.stringify(outA));
      } else {
        check(inA.every((a) => a.d <= 0.01), 'gerak reduce: tanpa animasi masuk lembar (<= 0,01 ms)', JSON.stringify(inA));
        check(!outA.open && outA.a.length === 0, 'gerak reduce: lembar tertutup seketika', JSON.stringify(outA));
      }
    }
  }

  if (want('c8')) {
    for (const vp of ['hp', 'desktop']) for (const reduce of [false, true]) {
      const p = await open(vp, { reduce });
      await openSheet(p);
      await p.addStyleTag({ content: '*, *::before, *::after { transition: none !important; animation: none !important; }' });
      const n = await p.evaluate(() => { let i = 0; document.querySelectorAll('#psheet :is(a[href], button)').forEach((el) => { if (el.disabled) return; el.setAttribute('data-c8', String(i++)); }); return i; });
      const cdp = await p.context().newCDPSession(p);
      await cdp.send('DOM.enable'); await cdp.send('CSS.enable');
      const { root } = await cdp.send('DOM.getDocument', { depth: -1 });
      const SIG = (k) => { const el = document.querySelector(`[data-c8="${k}"]`); const P = ['transform', 'background-color', 'color', 'box-shadow', 'opacity', 'outline-color']; const out = {}; [el, ...el.querySelectorAll(':scope > *')].slice(0, 6).forEach((nd, j) => [null, '::before', '::after'].forEach((pe) => { const cs = getComputedStyle(nd, pe); P.forEach((pr) => { out[`${j}${pe || ''} ${pr}`] = cs.getPropertyValue(pr); }); })); return { sig: out, who: `${el.tagName.toLowerCase()}.${String(el.className).split(' ')[0]} "${(el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 20)}"` }; };
      const fail = [];
      for (let k = 0; k < n; k++) {
        const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector: `[data-c8="${k}"]` });
        const a = await p.evaluate(SIG, k);
        await cdp.send('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: ['active'] });
        const b = await p.evaluate(SIG, k);
        await cdp.send('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: [] });
        const ch = Object.keys(a.sig).filter((x) => a.sig[x] !== b.sig[x]);
        const still = ch.filter((x) => !/ transform$/.test(x));
        if (reduce ? still.length === 0 : ch.length === 0) fail.push(a.who);
      }
      check(n >= 8 && fail.length === 0, `C8 lembar ${vp}${reduce ? ' reduce' : ''}: ${n} kontrol lembar bagian punya status tekan${reduce ? ' tanpa gerak' : ''}`, fail.join(' | '));
    }
  }

  if (want('saring')) {
    const p = await open('desktop');
    const c = await p.evaluate(() => [...document.querySelectorAll('#catalog [data-pfilter]')].map((b) => b.textContent.replace(/\s+/g, ' ').trim()));
    const d = await p.evaluate(() => [window.MKS_LAMP.heads.length + window.MKS_LAMP.bodies.length + window.MKS_LAMP.bases.length, window.MKS_LAMP.heads.length, window.MKS_LAMP.bodies.length, window.MKS_LAMP.bases.length]);
    check(c.join(' · ') === `Semua ${d[0]} · Kap ${d[1]} · Badan ${d[2]} · Alas ${d[3]}`, 'saring: chip "Semua · Kap · Badan · Alas" dengan angka dari lamp-data', c.join(' · '));
    await p.evaluate(() => document.querySelector('#catalog [data-pfilter="base"]').click());
    const f = await p.evaluate(() => ({ vis: [...document.querySelectorAll('#catalog .pcat__cell')].filter((li) => !li.hidden && li.getBoundingClientRect().height > 0).map((li) => li.dataset.pkind), pressed: document.querySelector('#catalog [data-pfilter="base"]').getAttribute('aria-pressed') }));
    check(f.pressed === 'true' && f.vis.length === d[3] && f.vis.every((k) => k === 'base'), 'saring: chip Alas menampilkan hanya ubin alas, seketika', JSON.stringify(f));
    await p.evaluate(() => { window.MKS_LAMP.bodies.pop(); window.MKSLamp.refresh(); });
    const c2 = await p.evaluate(() => [...document.querySelectorAll('#catalog [data-pfilter]')].map((b) => b.textContent.replace(/\s+/g, ' ').trim()).join(' · '));
    check(c2 === `Semua ${d[0] - 1} · Kap ${d[1]} · Badan ${d[2] - 1} · Alas ${d[3]}`, 'saring: angka chip ikut berubah saat lamp-data berubah', c2);
  }

  if (want('karusel')) {
    for (const vp of ['hp', 'hp360', [320, 640, true]]) {
      const p = await open(vp);
      const name = Array.isArray(vp) ? '320' : vp;
      const r = await p.evaluate(() => {
        const t = document.querySelector('#alur .alur'); t.scrollIntoView({ block: 'center', behavior: 'instant' });
        const cs = getComputedStyle(t), cols = [...t.querySelectorAll('.alur__col')];
        const c2 = cols[1].getBoundingClientRect();
        return { snap: cs.scrollSnapType, tab: t.tabIndex, overflow: t.scrollWidth > t.clientWidth, peek: Math.round(innerWidth - c2.left), w: Math.round(cols[0].getBoundingClientRect().width), sw: document.documentElement.scrollWidth, iw: innerWidth };
      });
      check(r.sw <= r.iw, `karusel ${name}: tanpa gulir samping halaman`, `${r.sw} > ${r.iw}`);
      if (name === '320') continue;
      check(/x/.test(r.snap) && /mandatory/.test(r.snap) && r.tab === 0 && r.overflow && r.w <= 300, `karusel ${name}: scroll-snap x mandatory, wadah bisa difokus, kartu <= 300`, JSON.stringify(r));
      check(r.peek >= 24, `karusel ${name}: kartu berikutnya mengintip >= 24 px`, `${r.peek} px`);
      await p.focus('#alur .alur');
      await p.keyboard.press('ArrowRight'); await p.keyboard.press('ArrowRight');
      await p.waitForTimeout(900);
      const k = await p.evaluate(() => ({ x: document.querySelector('#alur .alur').scrollLeft, dot: [...document.querySelectorAll('#alur .alur__dots i')].findIndex((d) => d.classList.contains('is-on')), dots: getComputedStyle(document.querySelector('#alur .alur__dots')).display }));
      check(k.x > 100 && k.dot >= 1 && k.dots !== 'none', `karusel ${name}: panah kanan menggeser karusel; titik indikator mengikuti`, JSON.stringify(k));
    }
    const p = await open('desktop');
    const d = await p.evaluate(() => ({ tab: document.querySelector('#alur .alur').hasAttribute('tabindex'), dots: getComputedStyle(document.querySelector('#alur .alur__dots')).display, ph: (() => { const b = document.querySelector('#alur [data-alur-photo]').getBoundingClientRect(); return [Math.round(b.width), Math.round(b.height)]; })() }));
    check(!d.tab && d.dots === 'none' && d.ph[0] === 200 && d.ph[1] === 250, 'desktop: #alur bukan karusel (tanpa tabindex/titik), thumb 200 × 250', JSON.stringify(d));
  }

  if (want('ekspor')) {
    const seed = { layout: 8, products: null, config: null, text: { 'index.html': { [AC + '0/div:0/p:1']: 'Halo Rani, ini rinciannya: Rp467.000', [AC + '1/div:0/p:1']: 'OK, cantik! 😍', [AC + '2/div:0/p:0']: 'Resi: JP1234567890', '#alur/div:0/p:2': 'Nama dan nomor resi di atas contoh.' } } };
    const p = await open('desktop', { hash: '#edit', wait: 1400, init: (s) => { try { if (!sessionStorage.getItem('__seeded')) { localStorage.setItem('mks-edits-v2', s); sessionStorage.setItem('__seeded', '1'); } } catch (_) {} }, initArg: JSON.stringify(seed) });
    const pg = await p.evaluate(() => document.querySelector('#alur').innerText);
    check(!/Rani|cantik|JP1234567890|contoh\./.test(pg) && /Simulasi alur pesan/i.test(pg) && /Kurir dan nomor resi kami kirim di sini\./.test(pg), 'C23 halaman: suntingan lama gelembung #alur dan .alur__note tidak menimpa teks baru');
    await p.evaluate(() => { const c = document.querySelector('#mks-textmode'); if (c && !c.checked) c.click(); });
    await p.waitForTimeout(200);
    const ed2 = await p.evaluate(() => ({ sim: document.querySelector('#alur .alur__sim').classList.contains('mks-editable'), a: document.querySelector('#alur [data-alur-col="0"] .bub--you').classList.contains('mks-editable'), h3: document.querySelector('#alur .alur__head h3').classList.contains('mks-editable'), dlg: document.querySelectorAll('#psheet .mks-editable').length }));
    check(!ed2.sim && !ed2.a && ed2.h3 && ed2.dlg === 0, 'Mode Edit: label simulasi dan gelembung berdata tidak bisa disunting; H3 kolom bisa; isi lembar tidak', JSON.stringify(ed2));
    await p.evaluate(() => { const b = [...document.querySelectorAll('.mks-tabs button')].find((x) => x.dataset.tab === 'ekspor'); b && b.click(); });
    await p.waitForTimeout(1500);
    const ex = await p.evaluate(() => { const ta = document.querySelector('#mks-file-0'); return ta ? ta.value : ''; });
    check(ex.length > 1000 && !/Rani|cantik|JP1234567890|Nama dan nomor resi/.test(ex) && /Simulasi alur pesan/.test(ex) && /Kurir dan nomor resi kami kirim di sini\./.test(ex), 'C23 Ekspor: index.html hasil ekspor memuat teks #alur baru, tanpa suntingan lama', `${ex.length} karakter`);
    await p.evaluate(() => localStorage.removeItem('mks-edits-v2'));
    check(p.__errs.length === 0, 'Mode Edit: tanpa galat JS', p.__errs.join(' | ').slice(0, 200));
  }
});
