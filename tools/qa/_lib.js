// Pembantu bersama skrip cek cNN-*.js (bukan cek). Pakai: const { run, args } = require('./_lib');
// run(async ({ open, check, base, opt }) => { ... }) → mencetak PASS/FAIL per butir, "N/M lolos", keluar 0 bila semua lolos.
// open(vp, {page, reduce}) → halaman Playwright; vp: desktop 1440×900, hp 390×844, hp360 360×640, hpshort 390×664.
const { chromium } = require('playwright');
const VPS = { desktop: [1440, 900, false], laptop: [1366, 768, false], hp: [390, 844, true], hp360: [360, 640, true], hpshort: [390, 664, true] };
function args() {
  const [base, ...rest] = process.argv.slice(2);
  const opt = Object.fromEntries(rest.map((a) => { const m = a.match(/^--([^=]+)(?:=(.*))?$/); return m ? [m[1], m[2] ?? true] : [a, true]; }));
  return { base: base && !base.endsWith('/') ? base + '/' : base, opt };
}
async function run(fn) {
  const { base, opt } = args();
  if (!base) { console.error('Pakai: node ' + process.argv[1].split('/').pop() + ' <url dasar, mis. http://localhost:8800/> [--opsi=nilai]'); process.exit(2); }
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  let pass = 0, total = 0; const ctxs = [];
  const check = (ok, label, detail) => { total++; if (ok) pass++; console.log(`${ok ? 'PASS' : 'FAIL'} ${label}${detail !== undefined && detail !== '' ? ' — ' + detail : ''}`); return ok; };
  const open = async (vp, o = {}) => {
    const [w, h, m] = Array.isArray(vp) ? vp : VPS[vp];
    const ctx = await b.newContext({ viewport: { width: w, height: h }, isMobile: !!m, hasTouch: !!m, deviceScaleFactor: 1, reducedMotion: o.reduce ? 'reduce' : 'no-preference' });
    ctxs.push(ctx);
    if (o.init) await ctx.addInitScript(o.init, o.initArg);
    const p = await ctx.newPage(); p.__errs = [];
    p.on('pageerror', (e) => p.__errs.push(String(e)));
    await p.goto(base + (o.page || 'index.html') + (o.hash || ''), { waitUntil: 'load' });
    await p.waitForTimeout(o.wait ?? 700);
    return p;
  };
  try { await fn({ open, check, base, opt, browser: b }); }
  catch (e) { console.error('CRASH', e); await b.close(); process.exit(2); }
  for (const c of ctxs) await c.close().catch(() => {});
  await b.close();
  console.log(`\n${pass}/${total} lolos`);
  process.exit(pass === total && total > 0 ? 0 : 1);
}
module.exports = { run, args, VPS };
