// Cek C15 adendum v3.1: istilah di teks terlihat.
// Pakai: node tools/qa/c15-istilah.js <url> [--scope="#tiga,#pita"]   (tanpa --scope: seluruh <main> + footer)
// "konfigurator", "Head", "Body", "Base", dan "—" tidak muncul di teks terlihat; nilai kosong "Rp —" dan "≈ — cm" boleh.
const { run } = require('./_lib');
run(async ({ open, check, opt }) => {
  const scopes = opt.scope ? String(opt.scope).split(',') : ['main', '.footer'];
  for (const vp of ['desktop', 'hp']) {
    const p = await open(vp);
    for (const s of scopes) {
      const r = await p.evaluate((s) => {
        const host = document.querySelector(s); if (!host) return null;
        const txt = host.innerText.replace(/Rp\s*—/g, '').replace(/≈\s*—\s*(cm|kg)/g, '');
        const out = [];
        txt.split('\n').forEach((line) => {
          if (/—/.test(line)) out.push('"—": ' + line.trim().slice(0, 60));
          if (/konfigurator/i.test(line)) out.push('"konfigurator": ' + line.trim().slice(0, 60));
          const m = line.match(/\b(Head|Body|Base)\b/); if (m) out.push(`"${m[1]}": ` + line.trim().slice(0, 60));
        });
        return out;
      }, s);
      check(r && r.length === 0, `C15 ${vp}: ${s} tanpa "—", "konfigurator", Head/Body/Base di teks terlihat`, r ? r.slice(0, 5).join(' | ') : 'selektor tidak ada');
    }
  }
});
