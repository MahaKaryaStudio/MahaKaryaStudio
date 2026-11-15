// Cek C11 adendum v3.1: setiap gambar lampu berlabel ilustrasi.
// Pakai: node tools/qa/c11-ilustrasi.js <url> [--only=tiga,hero]   (tanpa --only: semua butir index.html)
// Butir "pil": wadah gambar memuat pil terlihat berteks "ilustrasi". Butir "teks": seksi memuat teks terlihat itu.
// Dijalankan di 1440 × 900, 390 × 844, 360 × 640, 390 × 664.
const { run } = require('./_lib');
const BUTIR = {
  hero: ['#hero-stage', /ilustrasi/i], kenapa: ['#story-scene', /ilustrasi/i], edisi: ['#edisi-app .edisi__stage', /ilustrasi/i],
  rakit: ['#cfg-stage', /ilustrasi/i], alur: ['#alur', /ilustrasi/i], final: ['#konsultasi', /ilustrasi/i],
  paket: ['#paket', /ilustrasi/i], tiga: ['#tiga', /gambar kerja · ilustrasi/i], bagian: ['#bagian', /ilustrasi/i],
  footer: ['.footer', /gambar: ilustrasi, bukan foto/i],
};
run(async ({ open, check, opt }) => {
  const keys = opt.only ? String(opt.only).split(',') : Object.keys(BUTIR);
  for (const vp of ['desktop', 'hp', 'hp360', 'hpshort']) {
    const p = await open(vp);
    for (const k of keys) {
      const [sel, re] = BUTIR[k];
      const r = await p.evaluate(([sel, src, flags]) => {
        const re = new RegExp(src, flags), host = document.querySelector(sel);
        if (!host) return { ok: false, why: 'wadah tidak ada' };
        host.scrollIntoView({ block: 'center', behavior: 'instant' });
        const vis = (el) => { const cs = getComputedStyle(el), r = el.getBoundingClientRect(); let o = 1; for (let n = el; n && n.nodeType === 1; n = n.parentElement) o *= +getComputedStyle(n).opacity; return cs.visibility !== 'hidden' && cs.display !== 'none' && r.width > 0 && r.height > 0 && o > 0.5; };
        const hit = [...host.querySelectorAll('*')].filter((el) => el.children.length === 0 || [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())).find((el) => re.test(el.textContent.replace(/\s+/g, ' ')) && vis(el));
        if (!hit) return { ok: false, why: 'tidak ada teks terlihat yang cocok' };
        const cs = getComputedStyle(hit);
        return { ok: parseFloat(cs.fontSize) >= 12, why: `"${hit.textContent.trim().replace(/\s+/g, ' ').slice(0, 40)}" ${cs.fontSize}` };
      }, [sel, re.source, re.flags]);
      check(r.ok, `C11 ${vp}: ${k} (${sel}) berlabel ilustrasi`, r.why);
    }
  }
});
