// Cek C20 adendum v3.1 (bagian umum): tidak ada teks terlihat < 12 px dan tidak ada bobot ≥ 700.
// Pakai: node tools/qa/c20-tipografi.js <url> [--page=koleksi.html]   (bawaan: index.html dan koleksi.html, 1440 dan 390)
// Teks HTML: font-size terhitung. Teks SVG: font-size × skala layar. Halaman digulir penuh dulu supaya semua seksi terisi.
const { run } = require('./_lib');
run(async ({ open, check, opt }) => {
  const pages = opt.page ? [String(opt.page)] : ['index.html', 'koleksi.html'];
  for (const page of pages) for (const vp of ['desktop', 'hp']) {
    const p = await open(vp, { page });
    const H = await p.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < H; y += 700) { await p.evaluate((yy) => scrollTo({ top: yy, behavior: 'instant' }), y); await p.waitForTimeout(60); }
    const r = await p.evaluate(() => {
      const small = [], bold = [];
      const tag = (el) => el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + '.' + String(el.className.baseVal ?? el.className).split(' ')[0];
      document.querySelectorAll('body *').forEach((el) => {
        if (el.closest('.mks-editor, script, style, noscript, template')) return;
        if (![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) return;
        const cs = getComputedStyle(el), rc = el.getBoundingClientRect();
        if (cs.display === 'none' || cs.visibility === 'hidden' || rc.width === 0 || rc.height === 0) return;
        let fs = parseFloat(cs.fontSize);
        if (el instanceof SVGElement && el.getScreenCTM) { const m = el.getScreenCTM(); if (m) fs *= Math.hypot(m.a, m.b); }
        if (fs < 11.95) small.push(`${tag(el)} ${fs.toFixed(1)}px "${el.textContent.trim().slice(0, 24)}"`);
        if (+cs.fontWeight >= 700) bold.push(`${tag(el)} ${cs.fontWeight} "${el.textContent.trim().slice(0, 24)}"`);
      });
      return { small, bold };
    });
    check(r.small.length === 0, `C20 ${page} ${vp}: tidak ada teks < 12 px`, r.small.length ? `${r.small.length}: ${r.small.slice(0, 4).join(' | ')}` : '');
    check(r.bold.length === 0, `C20 ${page} ${vp}: tidak ada bobot ≥ 700`, r.bold.length ? `${r.bold.length}: ${r.bold.slice(0, 4).join(' | ')}` : '');
  }
});
