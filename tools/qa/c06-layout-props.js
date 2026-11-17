// Cek C6 adendum v3.1: properti tata letak tidak dianimasikan pada seksi yang sudah dibangun.
// Pakai: node tools/qa/c06-layout-props.js <url> [--sel="#tiga,#pita"]
// Untuk setiap elemen (dan ::before/::after) di dalam selektor: transition-property yang berdurasi > 0 dan
// keyframes animasi yang berjalan hanya boleh memuat transform, opacity, warna, box-shadow, visibility.
// Daftar selektor bawaan = seksi yang sudah lulus cek ini; langkah berikutnya menambah seksinya di SEKSI.
const { run } = require('./_lib');
const SEKSI = ['#tiga', '#pita', '.nav', '.nav__pesan', '#hero', '.story', '#cara .steps-l', '.edisi__stage', '#rakit .preview']; // gerak-hapus: nav, hero, cerita, garis #cara, panggung lengket
run(async ({ open, check, opt }) => {
  const sels = opt.sel ? String(opt.sel).split(',') : SEKSI;
  for (const vp of ['desktop', 'hp']) for (const reduce of [false, true]) {
    const p = await open(vp, { reduce });
    const bad = await p.evaluate((sels) => {
      const OK = /^(transform|opacity|visibility|box-shadow|color|background-color|border(-(top|right|bottom|left))?-color|outline-color|text-decoration-color|fill|stroke|none)$/;
      const ms = (s) => (s.endsWith('ms') ? parseFloat(s) : parseFloat(s) * 1000);
      const out = [];
      // peta @keyframes nama -> properti yang dianimasikan (CSSOM, termasuk di dalam @media)
      const KF = {};
      const walkKF = (list) => { for (const r of list) { if (r.type === 7) KF[r.name] = [...new Set([...r.cssRules].flatMap((k) => [...k.style]))]; else if (r.cssRules) walkKF(r.cssRules); } };
      for (const sh of document.styleSheets) { try { walkKF(sh.cssRules); } catch (_) {} }
      const one = (el, pseudo) => {
        const cs = getComputedStyle(el, pseudo || null);
        if (pseudo && (cs.content === 'none' || cs.content === 'normal')) return;
        const props = cs.transitionProperty.split(',').map((x) => x.trim()), durs = cs.transitionDuration.split(',').map((x) => ms(x.trim()));
        props.forEach((pr, i) => { const d = durs[i % durs.length]; if (d > 0 && !OK.test(pr)) out.push(`${el.tagName.toLowerCase()}.${String(el.className.baseVal ?? el.className).split(' ')[0]}${pseudo || ''} transition ${pr} ${d}ms`); });
        // animasi CSS yang dideklarasikan: properti di @keyframes-nya (bukan hanya yang sedang berjalan) harus lolos OK
        if (cs.animationName !== 'none' && ms(cs.animationDuration.split(',')[0]) > 0) cs.animationName.split(',').map((x) => x.trim()).forEach((name) => {
          const props = KF[name];
          if (!props) out.push(`${el.tagName.toLowerCase()}.${String(el.className.baseVal ?? el.className).split(' ')[0]}${pseudo || ''} animation ${name} (keyframes tidak ditemukan)`);
          else props.filter((k) => !OK.test(k)).forEach((k) => out.push(`${el.tagName.toLowerCase()}.${String(el.className.baseVal ?? el.className).split(' ')[0]}${pseudo || ''} animation ${name}: ${k}`));
        });
      };
      sels.forEach((s) => document.querySelectorAll(`${s}, ${s} *`).forEach((el) => { one(el); one(el, '::before'); one(el, '::after'); }));
      // animasi yang sedang berjalan: periksa properti keyframe-nya
      document.getAnimations().forEach((a) => {
        const t = a.effect && a.effect.target; if (!t || !sels.some((s) => t.closest(s))) return;
        const kf = a.effect.getKeyframes ? a.effect.getKeyframes() : [];
        const props = [...new Set(kf.flatMap((k) => Object.keys(k)))].filter((k) => !['offset', 'easing', 'composite', 'computedOffset'].includes(k));
        props.forEach((k) => { const css = k.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase()); if (!OK.test(css)) out.push(`animasi berjalan pada ${t.tagName.toLowerCase()}: ${css}`); });
      });
      return [...new Set(out)];
    }, sels);
    check(bad.length === 0, `C6 ${vp}${reduce ? ' reduce' : ''}: hanya transform/opacity/warna/box-shadow/visibility dianimasikan di ${sels.join(', ')}`, bad.slice(0, 6).join(' | '));
    check(p.__errs.length === 0, `C6 ${vp}${reduce ? ' reduce' : ''}: tanpa error JS`, p.__errs.join(' | ').slice(0, 200));
  }
  // aturan CSS (CSSOM, termasuk di dalam @media): transisi properti tata letak pada elemen di dalam selektor = gagal;
  // aturan serupa untuk seksi lain hanya dicatat (dikerjakan di langkah pemilik seksi itu).
  const p = await open('desktop');
  const rules = await p.evaluate((sels) => {
    const LAY = /(^|,)\s*(top|right|bottom|left|height|width|margin[a-z-]*|padding[a-z-]*|max-width|max-height|inset[a-z-]*|all)\s*(,|$)/;
    const mine = [], other = [];
    const walk = (list) => { for (const r of list) {
      if (r.cssRules && r.type !== 1) { walk(r.cssRules); continue; }
      if (r.type !== 1 || !r.style) continue;
      const tp = r.style.transitionProperty; if (!tp || !LAY.test(tp)) continue;
      if (/^0s(,\s*0s)*$/.test(r.style.transitionDuration || '')) continue;
      let hit = false;
      try { const plain = r.selectorText.replace(/::?(before|after)/g, ''); hit = [...document.querySelectorAll(plain)].some((el) => sels.some((s) => el.closest(s))); } catch (_) {}
      (hit ? mine : other).push(`${r.selectorText} { transition: ${tp} }`);
    } };
    for (const sh of document.styleSheets) { try { walk(sh.cssRules); } catch (_) {} }
    // html.motion-on dsb. sudah terpasang saat aturan dicocokkan
    return { mine, other };
  }, sels);
  check(rules.mine.length === 0, `C6 aturan CSS: tidak ada transisi top/height/width/margin/padding di ${sels.join(', ')}`, rules.mine.join(' | ').slice(0, 300));
  if (rules.other.length) console.log(`INFO ${rules.other.length} aturan transisi tata letak di seksi lain (belum masuk daftar cek ini): ` + rules.other.map((x) => x.split(' {')[0]).join(' ; ').slice(0, 400));
});
