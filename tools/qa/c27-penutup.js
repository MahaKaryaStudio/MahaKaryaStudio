// Cek langkah penutup (adendum v3.1): 07 #cara, 08 #aman, 09 #faq, 10 .final (#konsultasi), footer.
// Pakai: node tools/qa/c27-penutup.js <url> [--only=c13,cara,c15,final,reduce,faq,c16,c9,heading,orderbar,footer,ukur]
// Hover/tekan (C7, C8) dan durasi (C10) seksi ini diuji c04-gerak-sentuh.js (SEKSI memuat #cara–footer); garis #cara
// hanya transform di c06-layout-props.js; satu tombol berisi sepanjang gulir di c12; migrasi Mode Edit tahap 10 di c23.
const { run } = require('./_lib');
const SNI_OK = [/bertanda SNI\/K3L/g, /tanda SNI\/K3L/g, /bukan produk bersertifikat SNI/g, /Apakah lampunya bersertifikat SNI\?/g, /tidak bersertifikat SNI/g];
// Rekam setiap perubahan --dim pada #final-stage sejak awal dokumen (MutationObserver atribut style)
const REKAM = () => {
  window.__dimLog = [];
  new MutationObserver((ms) => ms.forEach((m) => {
    const t = m.target;
    if (t.id !== 'final-stage') return;
    const prev = ((m.oldValue || '').match(/--dim:\s*([^;]+)/) || [])[1], now = t.style.getPropertyValue('--dim').trim();
    if ((prev || '').trim() !== now) window.__dimLog.push({ v: now, y: Math.round(scrollY), top: Math.round(t.getBoundingClientRect().top), vh: innerHeight });
  })).observe(document, { subtree: true, attributes: true, attributeFilter: ['style'], attributeOldValue: true });
};
run(async ({ open, check, opt, browser, base }) => {
  const want = (k) => !opt.only || String(opt.only).split(',').includes(k);

  /* ---------- C13: SNI ---------- */
  if (want('c13')) {
    const p = await open('desktop');
    const txt = await p.evaluate(() => document.body.innerText);
    check(/Lampu rakitan ini bukan produk bersertifikat SNI/.test(txt) && /kit kelistrikan, komponen bertanda SNI\/K3L/i.test(txt), 'C13: kalimat "Lampu rakitan ini bukan produk bersertifikat SNI" dan frasa "kit kelistrikan, komponen bertanda SNI/K3L" ada');
    let rest = txt; SNI_OK.forEach((re) => { rest = rest.replace(re, ''); });
    const left = rest.match(/.{0,30}SNI.{0,20}/g) || [];
    check(left.length === 0, 'C13: setiap "SNI" di teks terlihat lolos daftar izin', left.join(' | '));
    const aman = await p.evaluate(() => document.querySelector('#aman').innerText);
    check(/Lampu rakitan ini bukan produk bersertifikat SNI; bila ragu, pesan tanpa kit/.test(aman), 'C13: kalimat SNI di #aman utuh dengan lanjutannya');
  }

  /* ---------- 07 #cara ---------- */
  if (want('cara') || want('c15')) {
    for (const vp of ['desktop', 'hp']) {
      const p = await open(vp, { wait: 1000 });
      const r = await p.evaluate(() => {
        const steps = [...document.querySelectorAll('#cara .steps-l > .step')];
        const st = steps.map((s) => ({ h: s.querySelector('h3').textContent.trim(), t: s.innerText, fs: parseFloat(getComputedStyle(s.querySelector('p')).fontSize), mw: s.querySelector('p').getBoundingClientRect().width, ch: (() => { const c = document.createElement('span'); c.textContent = '0'; s.querySelector('p').appendChild(c); const w = c.getBoundingClientRect().width; c.remove(); return w; })() }));
        const d = document.querySelector('#spec'), sum = d && d.querySelector('summary');
        const snap = window.MKSLamp.snapshot();
        return { st, n: steps.length, fill: !!document.querySelector('#cara .steps-l > i.steps-l__fill'), open: d && d.open, tab: sum && sum.getAttribute('tabindex'), sum: sum && sum.textContent.trim(),
          h: (document.querySelector('#spec-height') || {}).textContent, parts: (document.querySelector('#spec-parts') || {}).textContent, n2: snap.partsCount, cm: snap.heightCm,
          rows: [...document.querySelectorAll('#spec dl > dt')].map((x) => x.textContent.trim()), pill: !!document.querySelector('#spec-fig .stage__pill, #spec-fig [class*="pill"]') || /ilustrasi/i.test((document.querySelector('#spec-fig') || {}).textContent || '') };
      });
      check(r.n === 4 && r.st.map((s) => s.h).join('|') === 'Rakit di sini|Kirim lewat WhatsApp|Kami cetak & rakit|Tiba di rumah' && r.fill, `#cara ${vp}: empat langkah (tanpa langkah kelima, tanpa label "01") dan isian garis scaleY ada`, r.st.map((s) => s.h).join('|'));
      check(r.st.every((s) => s.fs >= 16 && s.mw <= s.ch * 62 + 1), `#cara ${vp}: isi langkah --fs-body (>= 16 px) dan <= 62ch`, r.st.map((s) => `${s.fs}px ${Math.round(s.mw / s.ch)}ch`).join(', '));
      const wa = r.st[1].t;
      check(!/15\s*menit/.test(r.st.map((s) => s.t).join(' ')) && !/\d+\s*(menit|jam|hari)|<\s*\d/.test(wa), `C15 ${vp}: tidak ada "15 menit" di langkah #cara; langkah "Kirim lewat WhatsApp" tanpa durasi (A2b)`, wa.replace(/\s+/g, ' ').slice(0, 80));
      check(r.sum === 'Spesifikasi rakitanmu' && r.rows.join(',') === 'Bahan,Kap,Sambungan,Fitting,Kelistrikan,Kabel,Tinggi,Bobot,Bagian', `#cara ${vp}: "Spesifikasi rakitanmu" dua kolom <dl> (bahan, fitting/LED 5 W, tinggi, bobot, bagian)`, r.rows.join(','));
      check(r.h === `≈ ${r.cm} cm` && new RegExp(`^${r.n2} bagian`).test(r.parts || ''), `#cara ${vp}: tinggi dan jumlah bagian spesifikasi dari state bersama`, `${r.h} · ${r.parts}`);
      if (vp === 'desktop') check(r.open && r.tab === '-1', '#cara desktop: spesifikasi terbuka, summary hanya label (tabindex -1)', `open ${r.open} tab ${r.tab}`);
      else {
        const o2 = await p.evaluate(async () => { const d = document.querySelector('#spec'); const a = d.open; d.scrollIntoView({ block: 'center', behavior: 'instant' }); const s = d.querySelector('summary').getBoundingClientRect(); return { a, x: s.left + s.width / 2, y: s.top + s.height / 2, hgt: s.height }; });
        await p.touchscreen.tap(o2.x, o2.y); await p.waitForTimeout(60);
        const b = await p.evaluate(() => ({ open: document.querySelector('#spec').open, anim: document.getAnimations().filter((a) => a.effect && a.effect.target && a.effect.target.closest && a.effect.target.closest('#spec') && a.transitionProperty !== 'transform' && a.transitionProperty !== 'background-color').length }));
        check(o2.a === false && b.open === true && o2.hgt >= 44 && b.anim === 0, '#cara hp: spesifikasi terlipat dalam <details>, ketuk summary (>= 44) membuka seketika', JSON.stringify({ awal: o2.a, sesudah: b.open, tinggi: o2.hgt, anim: b.anim }));
      }
      check(p.__errs.length === 0, `#cara ${vp}: tanpa galat JS`, p.__errs.join(' | ').slice(0, 200));
    }
  }

  /* ---------- 10 .final: momen cahaya ---------- */
  if (want('final')) {
    for (const vp of ['desktop', 'hp']) {
      const p = await open(vp, { init: REKAM, wait: 1200 });
      // gulir bertahap sampai tepat sebelum panggung masuk layar; ubah rakitan di tengah jalan
      const before = await p.evaluate(async () => {
        const st = document.querySelector('#final-stage');
        const stop = st.getBoundingClientRect().top + scrollY - innerHeight - 40;
        for (let y = 0; y < stop; y += 300) { scrollTo({ top: y, behavior: 'instant' }); await new Promise((r) => requestAnimationFrame(() => r())); }
        scrollTo({ top: stop, behavior: 'instant' }); await new Promise((r) => setTimeout(r, 300));
        const svg0 = document.querySelector('#final-lamp').innerHTML.length;
        const cap0 = document.querySelector('[data-final-cap]').textContent;
        window.MKSLamp.update((s) => { s.body = s.body.slice(0, 1); }, 'uji');
        await new Promise((r) => setTimeout(r, 300));
        const snap = window.MKSLamp.snapshot();
        return { n: window.__dimLog.length, dim: st.style.getPropertyValue('--dim').trim(), top: Math.round(st.getBoundingClientRect().top), vh: innerHeight,
          svgChanged: document.querySelector('#final-lamp').innerHTML.length !== svg0, cap0, cap: document.querySelector('[data-final-cap]').textContent, total: snap.price.total, n2: snap.partsCount };
      });
      check(before.n === 0 && before.dim === '0.12' && before.top > before.vh, `.final ${vp}: 0 penulisan --dim sebelum panggung masuk layar (gulir bertahap + mks:change)`, JSON.stringify({ tulis: before.n, dim: before.dim, top: before.top }));
      const rp = 'Rp' + before.total.toLocaleString('id-ID');
      check(before.svgChanged && before.cap.includes(rp) && before.cap.includes(`${before.n2} bagian`), `.final ${vp}: rakitan dan keterangan harga ikut mks:change (harga dari lamp.js)`, `${before.cap0} → ${before.cap}`);
      await p.evaluate(() => document.querySelector('#final-stage').scrollIntoView({ block: 'center', behavior: 'instant' }));
      await p.waitForTimeout(900);
      const after = await p.evaluate(() => {
        const st = document.querySelector('#final-stage'), lit = st.querySelector('[data-la-lit]');
        const pill = st.querySelector('.stage__pill'), pr = pill.getBoundingClientRect(), cs = getComputedStyle(pill);
        return { log: window.__dimLog, op: lit ? +getComputedStyle(lit).opacity : -1, pill: pill.textContent.trim(), pillVis: pr.width > 0 && cs.visibility !== 'hidden' && +cs.opacity > 0.5 && parseFloat(cs.fontSize) >= 12 };
      });
      check(after.log.length === 1 && after.log[0].v === '1' && after.log[0].top < after.log[0].vh, `.final ${vp}: tepat 1 penulisan --dim (1) sesudah masuk layar`, JSON.stringify(after.log));
      check(after.op > 0.95, `.final ${vp}: lapisan cahaya menyala penuh <= 900 ms (600 ms)`, String(after.op));
      check(/^ilustrasi/i.test(after.pill) && after.pillVis, `C11 .final ${vp}: pil ILUSTRASI terlihat di panggung`, after.pill);
      // gulir menjauh lalu kembali + ubah rakitan: tetap satu penulisan
      await p.evaluate(async () => { scrollTo({ top: 0, behavior: 'instant' }); await new Promise((r) => setTimeout(r, 200)); window.MKSLamp.update((s) => { s.led = !s.led; }, 'uji2'); document.querySelector('#final-stage').scrollIntoView({ block: 'center', behavior: 'instant' }); await new Promise((r) => setTimeout(r, 300)); });
      const again = await p.evaluate(() => window.__dimLog.length);
      check(again === 1, `.final ${vp}: masuk layar lagi dan mks:change tidak menulis --dim lagi`, String(again));
      const lay = await p.evaluate(() => { const f = document.querySelector('.final__fig').getBoundingClientRect(), h = document.querySelector('#konsultasi h2').getBoundingClientRect(), b = document.querySelector('#konsultasi .btn--wa'); const rr = document.querySelector('#konsultasi .final__reply'); return { fTop: f.top, fLeft: f.left, hTop: h.top, hRight: h.right, btnH: b.getBoundingClientRect().height, reply: rr.textContent.trim(), h2fs: parseFloat(getComputedStyle(document.querySelector('#konsultasi h2')).fontSize), story: document.querySelector('#konsultasi h2').classList.contains('t-story') }; });
      if (vp === 'hp') check(lay.fTop < lay.hTop, '.final hp: panggung di atas teks', JSON.stringify(lay));
      else check(lay.fLeft >= lay.hRight && lay.btnH === 56 && lay.h2fs >= 79, '.final desktop: panggung di kanan teks, kalimat 80 (.t-story), WA 56', JSON.stringify(lay));
      check(lay.story && lay.reply.length > 5, `.final ${vp}: judul memakai .t-story, jam balas dari config di bawah tombol`, lay.reply);
      check(p.__errs.length === 0, `.final ${vp}: tanpa galat JS`, p.__errs.join(' | ').slice(0, 200));
    }
  }
  if (want('reduce')) {
    for (const vp of ['desktop', 'hp']) {
      const p = await open(vp, { reduce: true, wait: 800 });
      const r = await p.evaluate(() => { const st = document.querySelector('#final-stage'), lit = st.querySelector('[data-la-lit]'); return { dim: getComputedStyle(st).getPropertyValue('--dim').trim(), op: lit ? +getComputedStyle(lit).opacity : -1, top: Math.round(st.getBoundingClientRect().top) }; });
      check(r.dim === '1' && r.op > 0.95, `.final ${vp} reduce: dirender sudah menyala sebelum masuk layar`, JSON.stringify(r));
    }
  }

  /* ---------- 09 #faq ---------- */
  if (want('faq')) {
    for (const vp of ['desktop', 'hp']) {
      const p = await open(vp, { wait: 900 });
      const vis = () => [...document.querySelectorAll('#faq-list > details')].map((d) => d.getBoundingClientRect().height > 0);
      const a = await p.evaluate((src) => { const vis = eval(src); const ds = [...document.querySelectorAll('#faq-list > details')]; const b = document.querySelector('[data-faq-more]'); const h = document.querySelector('.faq__head'); return { n: ds.length, open: ds.map((d) => d.open), vis: vis(), btn: b && !b.hidden && b.getBoundingClientRect().height >= 44 && b.textContent.trim(), sni: ds.some((d) => d.querySelector('summary').textContent.trim() === 'Apakah lampunya bersertifikat SNI?'), damage: ds.some((d) => /rusak saat pengiriman/.test(d.textContent)), refund: ds.some((d) => /batal atau minta uang kembali/.test(d.textContent)), reply: (h.querySelector('[data-reply]') || {}).textContent, ghost: !!h.querySelector('a.btn--ghost[data-wa]') && /^https:\/\/wa\.me\/\d+\?/.test(h.querySelector('a.btn--ghost[data-wa]').href), sticky: getComputedStyle(h).position, ic: getComputedStyle(ds[0].querySelector('summary'), '::after').transitionDuration }; }, `(${vis})`);
      check(a.n === 12 && a.sni && a.damage && a.refund, `#faq ${vp}: 12 tanya-jawab tetap ada (termasuk kerusakan kirim, batal/refund, "Apakah lampunya bersertifikat SNI?")`, String(a.n));
      check(a.open[0] && a.open.slice(1).every((x) => !x) && a.vis.filter(Boolean).length === 6 && a.vis.slice(0, 6).every(Boolean) && a.btn === 'Lihat 6 pertanyaan lain', `#faq ${vp}: enam pertanyaan (yang pertama terbuka) + tombol "Lihat 6 pertanyaan lain" (>= 44)`, JSON.stringify({ vis: a.vis.filter(Boolean).length, btn: a.btn }));
      check(a.reply && a.reply.length > 5 && a.ghost && (vp === 'hp' || a.sticky === 'sticky'), `#faq ${vp}: kepala ${vp === 'hp' ? '' : 'lengket + '}jam balas (config.replyPromise) + ghost "Tanya via WhatsApp" (wa.me dari config)`, JSON.stringify({ reply: a.reply, sticky: a.sticky }));
      check(a.ic === '0.15s', `#faq ${vp}: ikon summary berputar --t-fast (150 ms)`, a.ic);
      // tombol: semua tampil, fokus ke pertanyaan ketujuh, tombol hilang
      await p.evaluate(() => document.querySelector('[data-faq-more]').scrollIntoView({ block: 'center', behavior: 'instant' }));
      const bb = await p.evaluate(() => { const r = document.querySelector('[data-faq-more]').getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; });
      if (vp === 'hp') await p.touchscreen.tap(bb[0], bb[1]); else await p.mouse.click(bb[0], bb[1]);
      await p.waitForTimeout(100);
      const b = await p.evaluate((src) => { const vis = eval(src); const ds = [...document.querySelectorAll('#faq-list > details')]; return { vis: vis().filter(Boolean).length, focus: document.activeElement === ds[6].querySelector('summary'), btn: document.querySelector('[data-faq-more]').hidden }; }, `(${vis})`);
      check(b.vis === 12 && b.focus && b.btn, `#faq ${vp}: "Lihat 6 pertanyaan lain" menampilkan semua, fokus ke pertanyaan ketujuh`, JSON.stringify(b));
      // <details> terbuka seketika: tanpa animasi tinggi; hanya ikon (transform) dan warna/latar summary
      const sp = await p.evaluate(() => { const s = document.querySelectorAll('#faq-list > details')[1].querySelector('summary'); s.scrollIntoView({ block: 'center', behavior: 'instant' }); const r = s.getBoundingClientRect(); return [r.left + 40, r.top + r.height / 2]; });
      if (vp === 'hp') await p.touchscreen.tap(sp[0], sp[1]); else await p.mouse.click(sp[0], sp[1]);
      await p.waitForTimeout(30);
      const c = await p.evaluate(() => { const d = document.querySelectorAll('#faq-list > details')[1]; return { open: d.open, h: d.querySelector('p').getBoundingClientRect().height, anim: document.getAnimations().filter((x) => x.effect && x.effect.target && x.effect.target.closest && x.effect.target.closest('#faq')).map((x) => `${x.transitionProperty || 'waapi'}:${x.effect.getTiming().duration}`) }; });
      check(c.open && c.h > 20 && c.anim.every((x) => /^(transform|color|background-color):/.test(x) && parseFloat(x.split(':')[1]) <= 150), `#faq ${vp}: <details> terbuka seketika (isi langsung setinggi penuh; hanya ikon/warna, <= 150 ms)`, JSON.stringify(c));
      check(p.__errs.length === 0, `#faq ${vp}: tanpa galat JS`, p.__errs.join(' | ').slice(0, 200));
    }
    // Mode Edit: semua pertanyaan tampil agar bisa disunting
    const p = await open('desktop', { hash: '#edit', wait: 1200 });
    const e = await p.evaluate(() => [...document.querySelectorAll('#faq-list > details')].filter((d) => d.getBoundingClientRect().height > 0).length);
    check(e === 12, '#faq Mode Edit: 12 pertanyaan tampil untuk disunting', String(e));
  }

  /* ---------- C16: JavaScript mati ---------- */
  if (want('c16')) {
    for (const vp of [[1440, 900, false], [390, 844, true]]) {
      const ctx = await browser.newContext({ viewport: { width: vp[0], height: vp[1] }, isMobile: vp[2], hasTouch: vp[2], javaScriptEnabled: false });
      const p = await ctx.newPage();
      await p.goto(base + 'index.html', { waitUntil: 'load' }); await p.waitForTimeout(300);
      const r = await p.evaluate(() => {
        const ds = [...document.querySelectorAll('#faq-list > details')];
        const txt = document.body.innerText;
        return { n: ds.filter((d) => d.querySelector('summary').getBoundingClientRect().height >= 44).length, open0: ds[0].open && ds[0].querySelector('p').getBoundingClientRect().height > 0,
          btn: document.querySelector('[data-faq-more]').getBoundingClientRect().height, sni: /Lampu rakitan ini bukan produk bersertifikat SNI/.test(document.querySelector('#aman').innerText), faqSni: /Apakah lampunya bersertifikat SNI\?/.test(txt),
          spec: document.querySelector('#spec').open, fig: document.querySelector('.final__fig').getBoundingClientRect().height, h2: document.querySelector('#konsultasi h2').getBoundingClientRect().height > 0 };
      });
      check(r.n === 12 && r.open0 && r.btn === 0 && r.sni && r.faqSni, `C16 ${vp[0]}: tanpa JS 12 pertanyaan FAQ terbaca (yang pertama terbuka, tanpa tombol lipat) dan kalimat SNI terbaca`, JSON.stringify(r));
      check(r.spec && r.fig === 0 && r.h2, `C16 ${vp[0]}: tanpa JS spesifikasi #cara terbuka, panggung .final kosong disembunyikan <noscript>, judul .final terbaca`, JSON.stringify(r));
      await ctx.close();
    }
  }

  /* ---------- C9: sasaran sentuh footer, #faq, #cara ---------- */
  if (want('c9')) {
    for (const vp of ['hp', 'hp360']) {
      const p = await open(vp, { wait: 900 });
      const r = await p.evaluate(() => {
        const out = [];
        document.querySelectorAll('.footer a, .footer button, #faq-list summary, #faq a.btn, [data-faq-more], #spec summary, #konsultasi a.btn').forEach((el) => {
          const b = el.getBoundingClientRect(), cs = getComputedStyle(el);
          if (b.width < 1 || cs.visibility === 'hidden' || el.closest('[hidden]')) return;
          // lebar: area tekan tautan blok/teks; tinggi >= 44 dan elementFromPoint di pusat mengenai elemen itu
          el.scrollIntoView({ block: 'center', behavior: 'instant' });
          const c = el.getBoundingClientRect(); const hit = document.elementFromPoint(c.left + Math.min(c.width / 2, 20), c.top + c.height / 2);
          if (c.height < 44 || c.width < 44 || !(hit === el || el.contains(hit))) out.push(`${el.tagName.toLowerCase()} "${(el.textContent || '').trim().slice(0, 20)}" ${Math.round(c.width)}x${Math.round(c.height)}`);
        });
        return out;
      });
      check(r.length === 0, `C9 ${vp}: tautan dan tombol footer, summary #faq/#cara, tombol .final >= 44 x 44`, r.slice(0, 8).join(' | '));
    }
  }

  /* ---------- heading ---------- */
  if (want('heading')) {
    const p = await open('desktop');
    const r = await p.evaluate(() => { const hs = [...document.querySelectorAll('h1, h2, h3, h4, h5, h6')].filter((h) => !h.closest('dialog, [hidden], .mks-editor')); const bad = []; let prev = 0; hs.forEach((h) => { const l = +h.tagName[1]; if (prev && l > prev + 1) bad.push(`${'h' + prev} → ${h.tagName.toLowerCase()} "${h.textContent.trim().slice(0, 24)}"`); prev = l; }); return { bad, h4: document.querySelectorAll('.footer h4').length, h3: document.querySelectorAll('.footer h3').length }; });
    check(r.bad.length === 0 && r.h4 === 0 && r.h3 === 3, 'Heading: tanpa loncatan (h2 → h4) di index; footer memakai h3', r.bad.join(' | ') + ` h3 ${r.h3} h4 ${r.h4}`);
  }

  /* ---------- orderbar + satu tombol berisi di .final dan footer ---------- */
  if (want('orderbar')) {
    for (const vp of ['hp', 'hp360', 'desktop']) {
      const p = await open(vp, { wait: 900 });
      const r = [];
      for (const sel of ['#faq', '#konsultasi', '#konsultasi .btn--wa', '.footer']) {
        await p.evaluate((s) => { const el = document.querySelector(s); scrollTo({ top: el.getBoundingClientRect().top + scrollY - (s === '.footer' ? 0 : 80), behavior: 'instant' }); }, sel);
        await p.waitForTimeout(450);
        r.push(await p.evaluate((s) => {
          const bar = document.querySelector('#orderbar'), bs = getComputedStyle(bar);
          const br = bar.getBoundingClientRect(); const barOn = bar.classList.contains('is-on') || (!bar.hidden && bs.display !== 'none' && bs.visibility !== 'hidden' && +bs.opacity > 0.1 && br.height > 0 && br.top < innerHeight);
          const filled = [...document.querySelectorAll('[data-primary-cta], .btn--primary, .btn--primary-dark, .btn--wa, .btn--wa-amber')].filter((b) => { const r = b.getBoundingClientRect(), cs = getComputedStyle(b); let o = 1; for (let n = b; n && n.nodeType === 1; n = n.parentElement) { const c = getComputedStyle(n); o *= +c.opacity; if (c.visibility === 'hidden' || c.display === 'none') o = 0; } return r.width > 0 && r.bottom > 0 && r.top < innerHeight && o > 0.1 && !b.closest('dialog:not([open])'); });
          return { s, barOn, filled: filled.map((b) => (b.textContent || b.getAttribute('aria-label') || '').trim().slice(0, 18)) };
        }, sel));
      }
      const fin = r.filter((x) => x.s !== '#faq');
      check(fin.every((x) => !x.barOn), `Orderbar ${vp}: tersembunyi di .final dan footer`, JSON.stringify(fin.map((x) => x.barOn)));
      check(r.every((x) => x.filled.length <= 1), `Satu tombol berisi ${vp}: #faq, .final, footer`, JSON.stringify(r.map((x) => x.filled)));
    }
  }

  /* ---------- footer ---------- */
  if (want('footer')) {
    for (const vp of ['desktop', 'hp']) {
      const p = await open(vp, { wait: 900 });
      const r = await p.evaluate(() => {
        const f = document.querySelector('.footer'), txt = f.innerText;
        const wa = f.querySelector('.footer__wa a.btn--ghost-dark[data-wa]'), num = f.querySelector('[data-wa-text]'), copy = f.querySelector('[data-wa-copy]');
        const logo = f.querySelector('.logo svg').getBoundingClientRect();
        const links = [...f.querySelectorAll('.footer__col a')].filter((a) => a.getBoundingClientRect().height > 0);
        return { legal: /Gambar: ilustrasi, bukan foto \(kecuali bertanda Foto asli\)/.test(txt), ai: /ilustrasi konsep \(dibuat dengan AI\)/.test(txt), studio: [...f.querySelectorAll('a')].some((a) => a.textContent.trim() === 'Studio rakit'), konf: /konfigurator/i.test(txt),
          wa: !!wa && /^https:\/\/wa\.me\/\d+\?/.test(wa.href) && wa.textContent.trim() === 'Chat WhatsApp', num: num && /^\+\d{10,}$/.test(num.textContent.trim()), copy: copy && copy.getBoundingClientRect().height >= 44, logo: Math.round(logo.height),
          cols: f.querySelectorAll('.footer__col').length, market: [...f.querySelectorAll('[data-marketplace-col] a')].filter((a) => !a.hidden).map((a) => a.href), blockH: links.map((a) => Math.round(a.getBoundingClientRect().height)), bg: getComputedStyle(f).backgroundColor === getComputedStyle(document.querySelector('#konsultasi')).backgroundColor };
      });
      check(r.legal && r.ai, `Footer ${vp}: baris legal "Gambar: ilustrasi, bukan foto (kecuali bertanda Foto asli)" dan catatan video AI`, JSON.stringify({ legal: r.legal, ai: r.ai }));
      check(r.studio && !r.konf, `Footer ${vp}: "Studio rakit", tanpa "konfigurator"`);
      check(r.wa && r.num && r.copy && r.logo === 40 && r.cols === 3 && r.bg, `Footer ${vp}: logotype 40, ghost-dark "Chat WhatsApp" + nomor + Salin (44), tiga kolom tautan, latar sama dengan .final`, JSON.stringify({ wa: r.wa, num: r.num, copy: r.copy, logo: r.logo, cols: r.cols, bg: r.bg }));
      check(r.market.every((u) => /shp\.ee|shopee|tokopedia\.com\/[^/]+|tiktok\.com\/@/.test(u)) && r.market.length >= 1, `Footer ${vp}: marketplace hanya tautan toko dari config.js`, r.market.join(' '));
      if (vp === 'hp') check(r.blockH.every((h) => h >= 44), 'Footer hp: tautan kolom berupa blok 44', r.blockH.join(','));
    }
  }

  /* ---------- tinggi seksi (lapor) ---------- */
  if (want('ukur')) {
    const BRIEF = { desktop: { '#konsultasi': 760 }, hp: { '.footer': 660 } };
    for (const vp of ['desktop', 'hp', 'hp360']) {
      const p = await open(vp);
      const h = await p.evaluate(() => Object.fromEntries(['#cara', '#aman', '#faq', '#konsultasi', '.footer'].map((s) => [s, Math.round(document.querySelector(s).getBoundingClientRect().height)])));
      console.log(`UKUR ${vp}: ` + Object.entries(h).map(([s, v]) => `${s} ${v}${(BRIEF[vp] || {})[s] ? ` (brief ±${BRIEF[vp][s]})` : ''}`).join(' · '));
      const sw = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      check(sw <= 0, `${vp}: tanpa gulir samping`, String(sw));
    }
  }
});
