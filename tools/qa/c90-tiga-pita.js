// Cek langkah tiga-band (brief v3 §7 "02 #tiga" dan ".band", adendum v3.1 §7): tata letak dan perilaku.
// Pakai: node tools/qa/c90-tiga-pita.js <url>
// #tiga: lembar gambar kerja 588×600 (1440) / 390×380 (390), pil, empat label, kaca pembesar 136, tanpa slider,
//        tiga baris ±200 yang bersama-sama setinggi lembar, baris aktif = baris di garis tengah layar (juga setelah
//        gulir berbalik dan lompatan; statis saat reduced motion), top panggung lengket tetap, lembar ringkas
//        dibatasi tingginya di lebar antara (tablet, HP mendatar), angka baris meta mengikuti lamp-data.
// #pita: display 96/48 tiga baris rata kiri, sub 20, siluet garis lapisan + "LAPIS 0,2 MM", tanpa CTA, tanpa gerak;
//        teks suntingan lama/lebih panjang tidak masuk ke bawah siluet dan tidak memotongnya.
const { run } = require('./_lib');
const near = (a, b, t = 2) => Math.abs(a - b) <= t;
// Tinggi seksi adalah angka kira-kira di brief (±): dicetak sebagai UKUR, tidak dihitung lulus/gagal.
// Selisih > 10% ditandai supaya dilaporkan bersama penyebabnya, bukan disembunyikan.
const info = (label, got, target) => console.log(`UKUR ${label}: ${got} px (brief ±${target}; selisih ${got - target >= 0 ? '+' : ''}${Math.round(((got - target) / target) * 100)}%${Math.abs(got - target) / target > 0.1 ? ', DI LUAR ±10%' : ''})`);
run(async ({ open, check }) => {
  const sheet = (p) => p.evaluate(() => {
    const g = document.querySelector('#exploded'), r = g.getBoundingClientRect();
    const box = (el) => { const b = el.getBoundingClientRect(); return { x: b.left - r.left, y: b.top - r.top, w: b.width, h: b.height, t: el.textContent.replace(/\s+/g, ' ').trim(), vis: getComputedStyle(el).display !== 'none' && b.width > 0 }; };
    const labs = [...g.querySelectorAll('.gk__pill, .gk__lab, .gk__title')].map(box).filter((b) => b.vis);
    const over = [];
    labs.forEach((a, i) => labs.slice(i + 1).forEach((b) => { if (a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h) over.push(a.t + ' × ' + b.t); }));
    // label juga tidak boleh menimpa gambar: bagian lampu (kap/badan/alas) dan kaca pembesar
    const art = [...g.querySelectorAll('[data-la-part], .gk__lens')].map((el) => { const b = el.getBoundingClientRect(); return { x: b.left - r.left, y: b.top - r.top, w: b.width, h: b.height, t: el.dataset.laPart || 'kaca pembesar' }; });
    labs.forEach((a) => art.forEach((b) => { if (a.x < b.x + b.w - 1 && b.x < a.x + a.w - 1 && a.y < b.y + b.h - 1 && b.y < a.y + a.h - 1) over.push(a.t + ' × gambar ' + b.t); }));
    const f = document.querySelector('#tiga .tiga__fig').getBoundingClientRect();
    const out = labs.filter((b) => b.x + r.left < f.left - 0.5 || b.y + r.top < f.top - 0.5 || b.x + r.left + b.w > f.right + 0.5 || b.y + r.top + b.h > f.bottom + 0.5).map((b) => b.t);
    const lens = g.querySelector('.gk__lens').getBoundingClientRect();
    const sec = document.querySelector('#tiga').getBoundingClientRect();
    return { x: r.left, w: r.width, h: r.height, fig: { x: f.left, w: f.width, h: f.height }, ih: innerHeight, text: labs.map((b) => b.t).join(' | '), over, out, lens: lens.width, secH: Math.round(sec.height), range: document.querySelectorAll('#tiga input[type=range], #swipe-range').length, sw: document.documentElement.scrollWidth, iw: innerWidth };
  });
  const center = (p, sel) => p.evaluate((sel) => document.querySelector(sel).scrollIntoView({ block: 'center', behavior: 'instant' }), sel);
  const state = (p) => p.evaluate(() => ({
    active: [...document.querySelectorAll('#tiga [data-tiga-row]')].map((r) => r.classList.contains('is-active') ? r.dataset.tigaRow : '').filter(Boolean),
    focus: document.querySelector('#exploded').dataset.focus || '',
    op: Object.fromEntries([...document.querySelectorAll('#exploded [data-la-part]')].map((g) => [g.dataset.laPart, +getComputedStyle(g).opacity])),
    textOp: Math.min(...[...document.querySelectorAll('#tiga .tiga__row, #tiga .tiga__row *, #exploded .gk__lab, #exploded .gk__pill')].map((e) => +getComputedStyle(e).opacity)),
    bar: [...document.querySelectorAll('#tiga [data-tiga-row]')].map((r) => getComputedStyle(r, '::before').transform),
  }));

  /* ---------- 1440 ---------- */
  let p = await open('desktop');
  await center(p, '#exploded'); await p.waitForTimeout(400);
  let s = await sheet(p);
  check(near(s.w, 588) && near(s.h, 600), '#tiga 1440: lembar gambar kerja 588 × 600', `${s.w} × ${s.h}`);
  check(/gambar kerja · ilustrasi/i.test(s.text), '#tiga 1440: pil "Gambar kerja · Ilustrasi"');
  check(/kap · ø 20 cm/i.test(s.text) && /badan · 1–3 bagian/i.test(s.text) && /alas · berpemberat/i.test(s.text) && /ulir m20 · tanpa lem/i.test(s.text), '#tiga 1440: label KAP · Ø 20 CM, BADAN · 1–3 BAGIAN, ALAS · BERPEMBERAT, ULIR M20 · TANPA LEM', s.text);
  check(s.over.length === 0 && s.out.length === 0, '#tiga 1440: label tidak bertumpuk dan tidak keluar lembar', [...s.over, ...s.out.map((t) => 'keluar: ' + t)].join(' | '));
  check(near(s.lens, 136, 3), '#tiga 1440: kaca pembesar 136', s.lens.toFixed(1));
  check(s.range === 0, '#tiga: slider pelangi tidak ada');
  info('#tiga 1440: tinggi seksi', s.secH, 1180);
  const rows = await p.evaluate(() => [...document.querySelectorAll('#tiga [data-tiga-row]')].map((r) => ({ h: r.getBoundingClientRect().height, bottom: r.getBoundingClientRect().bottom, h3: parseFloat(getComputedStyle(r.querySelector('h3')).fontSize), body: parseFloat(getComputedStyle(r.querySelector('.tiga__text')).fontSize), meta: getComputedStyle(r.querySelector('.tiga__meta')).fontFamily, t: r.querySelector('h3').textContent })));
  check(rows.length === 3 && rows.every((r) => r.h >= 180 && r.h <= 240 && near(r.h3, 28, 0.5) && near(r.body, 17, 0.5) && /mono/i.test(r.meta)), '#tiga 1440: tiga baris ±200 (180–240), H3 28, body 17, meta mono', rows.map((r) => `${Math.round(r.h)}/${r.h3}/${r.body}`).join(' · '));
  const figBottom = await p.evaluate(() => document.querySelector('#exploded').getBoundingClientRect().bottom);
  check(near(rows.reduce((a, r) => a + r.h, 0), s.h, 2) && near(rows[2].bottom, figBottom, 2), '#tiga 1440: tiga baris bersama-sama setinggi lembar (hairline terakhir sejajar tepi bawah lembar)', `baris ${Math.round(rows.reduce((a, r) => a + r.h, 0))} vs lembar ${Math.round(s.h)}; bawah ${Math.round(rows[2].bottom)} vs ${Math.round(figBottom)}`);
  // angka di baris meta dan label lembar mengikuti lamp-data (bukan angka mati di HTML)
  const meta = async () => p.evaluate(() => ({ d: window.MKS_LAMP, t: [...document.querySelectorAll('#tiga .tiga__meta')].map((m) => m.textContent.replace(/\s+/g, ' ').trim()), lab: (document.querySelector('#exploded .gk__lab--body') || {}).textContent }));
  let m = await meta();
  check(m.t[0] === `${m.d.heads.length} bentuk · lebar 20 cm · fitting E27` && m.t[1] === `1–${m.d.maxBodies} bagian · ${m.d.colors.length} warna · kabel lewat di dalam` && m.t[2] === `${m.d.bases.length} bentuk · berpemberat`, '#tiga: baris meta = jumlah bentuk/warna di lamp-data; kap "lebar 20 cm" (benar juga untuk kap kotak)', m.t.join(' | '));
  await p.evaluate(() => { window.MKS_LAMP.maxBodies = 2; window.MKS_LAMP.bases.pop(); window.MKSLamp.refresh(); });
  m = await meta();
  check(/^1–2 bagian/.test(m.t[1]) && /1–2 bagian/i.test(m.lab) && /^3 bentuk/.test(m.t[2]), '#tiga: angka meta dan label lembar ikut berubah saat lamp-data berubah (maxBodies 2, satu alas dihapus)', `${m.t[1]} | ${m.t[2]} | ${m.lab}`);
  await p.reload({ waitUntil: 'load' }); await p.waitForTimeout(700);
  await center(p, '#exploded'); await p.waitForTimeout(300);
  check(rows.every((r) => /^(Kap|Badan|Alas): /.test(r.t)), '#tiga: H3 "Kap: …", "Badan: …", "Alas: …" (titik dua)', rows.map((r) => r.t).join(' | '));
  const st = await p.evaluate(() => { const f = document.querySelector('#tiga .tiga__fig'), cs = getComputedStyle(f), a = cs.top; document.documentElement.style.setProperty('--nav-offset', '0px'); const b = getComputedStyle(f).top; document.documentElement.style.removeProperty('--nav-offset'); return { pos: cs.position, a, b, tp: cs.transitionProperty, td: cs.transitionDuration, navH: parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) }; });
  check(st.pos === 'sticky' && st.a === st.b && near(parseFloat(st.a), st.navH + 24, 0.5), '#tiga 1440: panggung lengket, top tetap (tinggi nav + 24) walau --nav-offset berubah', `${st.pos} ${st.a} → ${st.b}`);
  check(!/top/.test(st.tp) || /^0s/.test(st.td), '#tiga 1440: panggung lengket tanpa transition top', `${st.tp} ${st.td}`);
  for (const [i, key] of [[1, 'body'], [2, 'base'], [0, 'head']]) {
    await center(p, `#tiga [data-tiga-row="${key}"]`); await p.waitForTimeout(500);
    const a = await state(p);
    const dimOk = Object.entries(a.op).every(([k, o]) => (k === key ? o === 1 : near(o, 0.3, 0.02)));
    check(a.active.length === 1 && a.active[0] === key && a.focus === key && dimOk && a.textOp === 1 && a.bar.filter((m) => m === 'none' || m === 'matrix(1, 0, 0, 1, 0, 0)').length === 1,
      `#tiga 1440: baris "${key}" aktif saat di tengah layar (hairline tinta, bagian lain di gambar .3, teks tanpa opacity)`, JSON.stringify({ active: a.active, focus: a.focus, op: a.op, textOp: a.textOp }));
  }
  // Baris aktif adalah keadaan posisi, bukan jejak peristiwa: arah gulir berbalik (roda tetikus sungguhan) dan
  // lompatan tanpa melewati baris di antaranya harus berakhir di baris yang memuat garis tengah layar.
  const atMid = (p) => p.evaluate(() => { const m = innerHeight / 2; let k = ''; for (const r of document.querySelectorAll('#tiga [data-tiga-row]')) { if (!k || r.getBoundingClientRect().top <= m) k = r.dataset.tigaRow; } return k; });
  for (const vp of ['desktop', 'laptop']) {
    const q = vp === 'desktop' ? p : await open(vp);
    await center(q, '#tiga [data-tiga-row="head"]'); await q.waitForTimeout(400);
    await q.mouse.move(700, 400);
    let n = 0;
    while (n++ < 60 && (await state(q)).active[0] !== 'body') { await q.mouse.wheel(0, 40); await q.waitForTimeout(120); }
    const down = await state(q);
    for (let i = 0; i < 5; i++) { await q.mouse.wheel(0, -40); await q.waitForTimeout(120); }
    await q.waitForTimeout(400);
    const up = await state(q), want = await atMid(q);
    check(down.active[0] === 'body' && want === 'head' && up.active.length === 1 && up.active[0] === 'head' && up.focus === 'head' && up.op.head === 1,
      `#tiga ${vp}: gulir turun sampai "body" aktif lalu naik 200 px → "head" aktif lagi (tidak tertinggal)`, JSON.stringify({ turun: down.active, naik: up.active, focus: up.focus, tengah: want }));
    const bad = [];
    for (const [key, frac] of [['base', 0.2], ['head', 0.9], ['body', 0.45], ['head', 0.6], ['base', -0.2]]) {
      // lompat seketika: sisi atas baris "key" ditaruh di frac × tinggi layar (frac 0,9 / 0,6 = garis tengah masih di atas baris itu)
      await q.evaluate(([key, frac]) => { const r = document.querySelector(`#tiga [data-tiga-row="${key}"]`).getBoundingClientRect(); window.scrollTo({ top: scrollY + r.top - innerHeight * frac, behavior: 'instant' }); }, [key, frac]);
      await q.waitForTimeout(450);
      const a = await state(q), w = await atMid(q);
      if (a.active.length !== 1 || a.active[0] !== w || a.focus !== w) bad.push(`${key}@${frac}: aktif ${a.active} fokus ${a.focus}, di tengah ${w}`);
    }
    check(bad.length === 0, `#tiga ${vp}: setelah lompatan seketika, baris aktif = baris di garis tengah layar`, bad.join(' | '));
  }
  check(p.__errs.length === 0, '1440: tanpa error JS', p.__errs.join(' | ').slice(0, 200));

  /* ---------- 1024 dan 1200: lembar lebar yang menyempit ---------- */
  for (const w of [1024, 1200]) {
    p = await open([w, 800, false]);
    await center(p, '#exploded'); await p.waitForTimeout(300);
    s = await sheet(p);
    check(s.over.length === 0 && s.out.length === 0 && /ulir m20/i.test(s.text) && s.sw <= w, `#tiga ${w}: label tidak bertumpuk, tidak menimpa gambar, tidak keluar lembar; tanpa gulir samping`, [...s.over, ...s.out.map((t) => 'keluar: ' + t)].join(' | ') + ` lembar ${Math.round(s.w)} × ${Math.round(s.h)}`);
  }

  /* ---------- lebar antara (tablet, HP mendatar): lembar ringkas dibatasi tingginya, gambar di tengah kertas ---------- */
  for (const [w, h, mob] of [[600, 900, true], [760, 1000, true], [820, 1100, false], [1000, 700, false], [740, 360, true], [844, 390, true]]) {
    p = await open([w, h, mob]);
    await center(p, '#exploded'); await p.waitForTimeout(300);
    s = await sheet(p);
    const cap = Math.max(320 * 380 / 390, Math.min(480, 0.8 * s.ih));
    const mid = near(s.x + s.w / 2, s.fig.x + s.fig.w / 2, 1);
    check(s.h <= cap + 1 && near(s.w / s.h, 390 / 380, 0.02) && near(s.fig.h, s.h, 1) && mid && s.over.length === 0 && s.out.length === 0 && s.sw <= w,
      `#tiga ${w}×${h}: lembar ringkas ≤ min(480, 80% tinggi layar) (min 320 lebar), gambar di tengah kertas, label rapi, tanpa gulir samping`, `gambar ${Math.round(s.w)} × ${Math.round(s.h)} di kertas ${Math.round(s.fig.w)} × ${Math.round(s.fig.h)}, batas ${Math.round(cap)}; ` + [...s.over, ...s.out.map((t) => 'keluar: ' + t)].join(' | '));
  }

  /* ---------- edisi pilihan studio bisa diganti lewat Mode Edit: lembar tetap rapi untuk kelima edisi ---------- */
  for (const vp of ['desktop', [1024, 800, false], [820, 1100, false], 'hp', 'hp360']) {
    p = await open(vp);
    const bad = [];
    const n = await p.evaluate(() => window.MKS_LAMP.presets.length);
    for (let i = 0; i < n; i++) {
      await p.evaluate((i) => { window.MKS_LAMP.popularPreset = i; window.MKSLamp.refresh(); document.querySelector('#exploded').scrollIntoView({ block: 'center', behavior: 'instant' }); }, i);
      await p.waitForTimeout(250);
      s = await sheet(p);
      if (s.over.length || s.out.length || !/ulir m20/i.test(s.text)) bad.push(`edisi ${i}: ` + [...s.over, ...s.out.map((t) => 'keluar: ' + t)].join(', '));
    }
    check(bad.length === 0, `#tiga ${Array.isArray(vp) ? vp[0] : vp}: lembar rapi untuk ${n} edisi (label tidak bertumpuk, tidak menimpa gambar, tidak keluar)`, bad.join(' | '));
  }

  /* ---------- 1440 reduced motion: keadaan aktif statis ---------- */
  p = await open('desktop', { reduce: true });
  await center(p, '#tiga [data-tiga-row="base"]'); await p.waitForTimeout(400);
  let a = await state(p);
  const anim = await p.evaluate(() => document.getAnimations().filter((x) => x.effect && x.effect.target && x.effect.target.closest('#tiga, #pita')).length);
  check(a.active.length === 1 && a.active[0] === 'head' && a.focus === '' && Object.values(a.op).every((o) => o === 1) && anim === 0, '#tiga reduced motion: baris pertama tetap aktif, gambar tidak diredupkan, tanpa animasi', JSON.stringify({ active: a.active, focus: a.focus, op: a.op, anim }));

  /* ---------- 390 dan 360 ---------- */
  for (const vp of ['hp', 'hp360']) {
    p = await open(vp);
    await center(p, '#exploded'); await p.waitForTimeout(300);
    s = await sheet(p);
    const W = s.iw;
    check(near(s.x, 0, 0.5) && near(s.w, W) && near(s.h, W * 380 / 390, 2), `#tiga ${W}: lembar ringkas full-bleed ${W} × ${Math.round(W * 380 / 390)}`, `x ${s.x}, ${s.w} × ${s.h.toFixed(0)}`);
    check(/gambar kerja · ilustrasi/i.test(s.text) && /kap · ø 20 cm/i.test(s.text) && /badan · 1–3 bagian/i.test(s.text) && /alas · berpemberat/i.test(s.text) && /ulir m20 · tanpa lem/i.test(s.text), `#tiga ${W}: pil dan empat label ada`, s.text);
    check(s.over.length === 0 && s.out.length === 0, `#tiga ${W}: label tidak bertumpuk dan tidak keluar lembar`, [...s.over, ...s.out.map((t) => 'keluar: ' + t)].join(' | '));
    check(s.sw <= W, `${W}: tanpa gulir samping`, s.sw);
    if (vp === 'hp') info('#tiga 390: tinggi seksi', s.secH, 1150);
    await center(p, '#tiga [data-tiga-row="base"]'); await p.waitForTimeout(400);
    a = await state(p);
    check(Object.values(a.op).every((o) => o === 1) && a.textOp === 1, `#tiga ${W}: tanpa peredupan di tata letak HP`, JSON.stringify(a.op));
  }

  /* ---------- #pita ---------- */
  const band = (p) => p.evaluate(() => {
    const sec = document.querySelector('#pita'), r = sec.getBoundingClientRect(), t = sec.querySelector('.band__text'), cs = getComputedStyle(t);
    const lines = [...t.querySelectorAll('.band__l')].map((l) => { const b = l.getBoundingClientRect(); return { top: Math.round(b.top - r.top), left: b.left, right: b.right, t: l.textContent.trim() }; });
    const sub = sec.querySelector('.band__sub'), sil = sec.querySelector('.band__sil'), sb = sil.getBoundingClientRect(), ann = sec.querySelector('.band__ann'), ab = ann.getBoundingClientRect();
    const wrap = sec.querySelector('.wrap').getBoundingClientRect();
    const moving = [...sec.querySelectorAll('*'), sec].filter((e) => { const c = getComputedStyle(e); return c.transitionDuration.split(',').some((d) => parseFloat(d) > 0) || c.animationName !== 'none'; }).length;
    return { h: Math.round(r.height), fs: parseFloat(cs.fontSize), align: cs.textAlign, lines, wrapL: wrap.left, wrapR: wrap.right, subFs: parseFloat(getComputedStyle(sub).fontSize), subT: sub.textContent.trim(), subAlign: getComputedStyle(sub).textAlign,
      sil: { w: sb.width, h: sb.height, top: sb.top - r.top, bottom: r.bottom - sb.bottom, right: sb.right, op: +getComputedStyle(sil).opacity, mask: (getComputedStyle(sil).webkitMaskImage || getComputedStyle(sil).maskImage || '').slice(0, 8) },
      ann: { vis: getComputedStyle(ann).display !== 'none' && ab.width > 0, t: ann.textContent.trim(), fs: parseFloat(getComputedStyle(ann).fontSize), inside: ab.top >= r.top && ab.bottom <= r.bottom },
      cta: sec.querySelectorAll('a, button').length, moving, sw: document.documentElement.scrollWidth, iw: innerWidth };
  });
  const SUB = 'Setiap lampu dicetak dan dirakit di studio kami, lalu kami kirim foto rakitannya sebelum berangkat.';
  p = await open('desktop'); await center(p, '#pita'); await p.waitForTimeout(300);
  let b = await band(p);
  const three = (b) => b.lines.length === 3 && b.lines[0].t === 'Dicetak satu' && b.lines[1].t === 'per satu.' && b.lines[2].t === 'Di Jakarta.' && b.lines[0].top < b.lines[1].top && b.lines[1].top < b.lines[2].top;
  check(near(b.fs, 96, 0.5) && three(b), '#pita 1440: display 96, tiga baris "Dicetak satu / per satu. / Di Jakarta."', `${b.fs}px · ${b.lines.map((l) => l.t + '@' + l.top).join(' · ')}`);
  check(['left', 'start'].includes(b.align) && ['left', 'start'].includes(b.subAlign) && b.lines.every((l) => near(l.left, b.wrapL, 1)), '#pita 1440: rata kiri', `${b.align}, baris x ${b.lines.map((l) => l.left).join('/')} vs wadah ${b.wrapL}`);
  check(near(b.subFs, 20, 0.5) && b.subT === SUB, '#pita 1440: sub 20 dengan copy brief', `${b.subFs}px`);
  check(near(b.sil.h, 520, 2) && b.sil.w <= 360 && near(b.sil.op, 0.1, 0.005) && b.sil.mask.startsWith('url(') && b.sil.top >= 0 && b.sil.bottom >= 0 && b.sil.right <= b.wrapR + 1, '#pita 1440: siluet garis lapisan tinggi 520 di dalam 360 × 520, opacity .10', JSON.stringify(b.sil));
  check(b.ann.vis && /^lapis 0,2 mm$/i.test(b.ann.t) && b.ann.fs >= 12 && b.ann.inside, '#pita 1440: anotasi "LAPIS 0,2 MM" terlihat', JSON.stringify(b.ann));
  check(b.cta === 0, '#pita: tanpa CTA (tidak ada tautan atau tombol)', b.cta);
  check(b.moving === 0, '#pita 1440: tanpa gerak (tidak ada transisi atau animasi)', b.moving);
  info('#pita 1440: tinggi seksi', b.h, 620);
  // Teks pita hasil Mode Edit: simpanan lama (<span>…</span> <em>…</em>, tanpa .band__l) dan baris yang lebih panjang
  // tidak boleh menjadi satu baris yang lewat di bawah siluet atau membuat pita lebih pendek dari siluetnya.
  for (const [nama, html] of [['simpanan lama', '<span>Dicetak satu demi satu.</span> <em>Di Jakarta.</em>'], ['satu baris pendek', '<span class="band__l">Dicetak.</span>'], ['baris panjang', '<span class="band__l">Dicetak satu per satu di studio kami,</span> <em class="band__l">di Jakarta Selatan.</em>']]) {
    for (const vp of ['desktop', [1024, 768, false]]) {
      p = await open(vp, { init: (s) => { try { localStorage.setItem('mks-edits-v2', s); } catch (_) {} }, initArg: JSON.stringify({ layout: 5, text: { 'index.html': { '#pita/div:0/p:0': html } }, products: null, config: null }) });
      await center(p, '#pita'); await p.waitForTimeout(300);
      const e = await p.evaluate(() => {
        const sec = document.querySelector('#pita'), r = sec.getBoundingClientRect(), t = sec.querySelector('.band__text'), art = sec.querySelector('.band__art').getBoundingClientRect(), sil = sec.querySelector('.band__sil').getBoundingClientRect(), ann = sec.querySelector('.band__ann');
        const kids = [...t.children].map((c) => c.getBoundingClientRect()), em = t.querySelector('em'), eb = em && em.getBoundingClientRect();
        return { right: Math.max(...kids.map((k) => k.right), sec.querySelector('.band__sub').getBoundingClientRect().right), artL: art.left, emOwn: !em || (Math.abs(eb.left - t.getBoundingClientRect().left) < 1 && [...t.children].every((c) => c === em || c.getBoundingClientRect().bottom - eb.top < eb.height * 0.4)), silIn: sil.top >= r.top && sil.bottom <= r.bottom, ann: getComputedStyle(ann).display !== 'none' && ann.getBoundingClientRect().bottom <= r.bottom, h: Math.round(r.height), sw: document.documentElement.scrollWidth, iw: innerWidth };
      });
      check(e.right <= e.artL + 0.5 && e.emOwn && e.silIn && e.ann && e.sw <= e.iw, `#pita ${Array.isArray(vp) ? vp[0] : 1440} suntingan "${nama}": teks di kiri kolom siluet, <em> di baris sendiri, siluet dan anotasi utuh`, JSON.stringify(e));
    }
  }
  for (const vp of ['hp', 'hp360', [320, 640, true]]) {
    p = await open(vp); await center(p, '#pita'); await p.waitForTimeout(300);
    b = await band(p);
    const W = b.iw;
    check(near(b.fs, 48, W === 390 ? 0.5 : 3) && three(b) && b.lines.every((l) => near(l.left, b.wrapL, 1) && l.right <= b.wrapR + 0.5), `#pita ${W}: display 48, tiga baris, rata kiri, muat di wadah`, `${b.fs}px · kanan ${b.lines.map((l) => Math.round(l.right)).join('/')} vs ${b.wrapR}`);
    check(b.moving === 0 && b.cta === 0 && !b.ann.vis, `#pita ${W}: tanpa gerak, tanpa CTA, anotasi disembunyikan`, JSON.stringify({ moving: b.moving, cta: b.cta, ann: b.ann.vis }));
    if (W === 390) {
      info('#pita 390: tinggi seksi', b.h, 420);
      check(near(b.sil.h, 240, 2) && b.sil.w <= 160 && near(b.sil.op, 0.08, 0.005), '#pita 390: siluet 160 × 240, opacity .08', JSON.stringify(b.sil));
      check(near(b.subFs, 17, 0.5), '#pita 390: sub 17', b.subFs);
    }
    if (W !== 320) check(b.sw <= W, `#pita ${W}: tanpa gulir samping`, b.sw);
  }
});
