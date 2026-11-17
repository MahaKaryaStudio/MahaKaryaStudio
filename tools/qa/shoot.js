// Screenshot bersama untuk verifikasi v3.
// node shoot.js <baseUrl> <outDir> [--vp=desktop,hp] [--reduce] [--page=index.html] [--full] [--sel="#edisi,#rakit"] [--view=0,900,1800]
//   --sel  : screenshot per elemen (digulir ke tampilan dulu, maks tinggi 2400 px)
//   --view : screenshot viewport pada posisi scrollY tertentu
//   --full : screenshot halaman penuh (dikecilkan otomatis bila sangat tinggi)
// Viewport: desktop 1440x900, laptop 1366x768, hp 390x844 (innerHeight nyata ±664 diabaikan), hp360 360x740, hpshort 390x664, hp320 320x640;
// tablet (breakpoint 760/1024): t820 820x1180, t880 880x900 (sentuh), t1000 1000x800, t1024 1024x768.
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const [base, outDir, ...rest] = process.argv.slice(2);
const opt = Object.fromEntries(rest.map((a) => { const m = a.match(/^--([^=]+)(?:=(.*))?$/); return m ? [m[1], m[2] ?? true] : [a, true]; }));
const VPS = { desktop: [1440, 900, false], laptop: [1366, 768, false], hp: [390, 844, true], hp360: [360, 740, true], hpshort: [390, 664, true], hp320: [320, 640, true], t820: [820, 1180, true], t880: [880, 900, true], t1000: [1000, 800, false], t1024: [1024, 768, false] };
(async () => {
  fs.mkdirSync(outDir, { recursive: true });
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const vps = String(opt.vp || 'desktop,hp').split(',');
  const outs = [];
  for (const v of vps) {
    const [w, h, m] = VPS[v];
    const ctx = await b.newContext({ viewport: { width: w, height: h }, isMobile: m, hasTouch: m, deviceScaleFactor: 1, reducedMotion: opt.reduce ? 'reduce' : 'no-preference' });
    const p = await ctx.newPage(); const errs = [];
    p.on('pageerror', (e) => errs.push(String(e)));
    await p.goto(base + (opt.page || 'index.html'), { waitUntil: 'load' });
    await p.waitForTimeout(700);
    // gulir pelan sekali untuk memicu reveal/IO
    const H = await p.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < H; y += Math.round(h * 0.8)) { await p.evaluate((yy) => window.scrollTo({ top: yy, behavior: 'instant' }), y); await p.waitForTimeout(120); }
    await p.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' })); await p.waitForTimeout(400);
    if (opt.full) { const f = path.join(outDir, `${v}-full.png`); await p.screenshot({ path: f, fullPage: true }); outs.push(f); }
    if (opt.view) for (const y of String(opt.view).split(',')) {
      await p.evaluate((yy) => window.scrollTo({ top: +yy, behavior: 'instant' }), y); await p.waitForTimeout(700);
      const f = path.join(outDir, `${v}-y${y}.png`); await p.screenshot({ path: f }); outs.push(f);
    }
    if (opt.sel) for (const s of String(opt.sel).split(',')) {
      const el = await p.$(s); if (!el) { outs.push(`(tidak ada ${s} di ${v})`); continue; }
      await el.scrollIntoViewIfNeeded(); await p.waitForTimeout(700);
      const bb = await p.evaluate((sel) => { const r = document.querySelector(sel).getBoundingClientRect(); return { y: r.top + scrollY, h: r.height }; }, s);
      const name = s.replace(/[^a-z0-9]+/gi, '_').replace(/^_|_$/g, '');
      // tangkap per potongan viewport agar elemen sticky/pinned tampil seperti dilihat pengguna
      const chunks = Math.min(4, Math.max(1, Math.ceil(bb.h / h)));
      for (let i = 0; i < chunks; i++) {
        await p.evaluate((yy) => window.scrollTo({ top: yy, behavior: 'instant' }), Math.max(0, bb.y + i * h)); await p.waitForTimeout(600);
        const f = path.join(outDir, `${v}-${name}-${i}.png`); await p.screenshot({ path: f }); outs.push(f);
      }
    }
    if (errs.length) outs.push(`ERROR JS (${v}): ` + errs.join(' | ').slice(0, 400));
    await ctx.close();
  }
  await b.close();
  console.log(outs.join('\n'));
})().catch((e) => { console.error('CRASH', e); process.exit(2); });
