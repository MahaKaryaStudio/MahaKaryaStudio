// Cek C23 adendum v3.1 (bagian alamat teks): suntingan Mode Edit yang tersimpan di alamat lama tidak menimpa
// teks baru, dan suntingan yang elemennya hanya bergeser ikut pindah.
// Pakai: node tools/qa/c23-edit-migrasi.js <url>
// localStorage["mks-edits-v2"] diisi sebelum halaman dimuat, lalu teks di halaman dan isi simpanan diperiksa.
// KASUS bertambah di langkah yang mengubah teks dasar (tahap baru di STAGES editor.js).
const { run } = require('./_lib');
const ROW = '#tiga/div:0/div:0/div:1/div:';
const KASUS = [
  { nama: 'tahap 4 (#tiga), simpanan layout 3', layout: 3,
    text: { '#tiga/div:0/p:1': 'LEAD LAMA', [ROW + '0/span:0']: 'TUDUNG', [ROW + '0/div:0/h3:0']: 'H3 LAMA', [ROW + '1/div:0/p:0']: 'ISI LAMA', '#tiga/div:0/h2:0': 'JUDUL SUNTINGAN', '#pita/div:0/p:1': 'SUB PITA SUNTINGAN', '#edisi/div:0/h2:0': 'JUDUL EDISI V3' },
    harap: { '#tiga .section-sub': /^Kap, badan, dan alas disambung/, '#tiga [data-tiga-row="head"] .tiga__tag': /^TUDUNG$/, '#tiga [data-tiga-row="head"] h3': /^Kap: meredam/, '#tiga [data-tiga-row="body"] .tiga__text': /^Susun satu sampai tiga/, '#tiga .section-title': /^JUDUL SUNTINGAN$/, '#pita .band__sub': /^SUB PITA SUNTINGAN$/, '#edisi .section-title': /^JUDUL EDISI V3$/ },
    arsip: ['#tiga/div:0/p:1', ROW + '0/div:0/h3:0', ROW + '1/div:0/p:0'], pindah: { [ROW + '0/p:0']: 'TUDUNG' } },
  { nama: 'tahap 3 lalu 4, simpanan v2 tanpa layout', layout: undefined,
    text: { '#tiga/div:0/p:1': 'LEAD V2', [ROW + '2/span:0']: 'KAKI', [ROW + '2/div:0/h3:0']: 'H3 V2', 'main:0/section:8/div:0/p:0': 'PITA V2', '#edisi/div:0/h2:0': 'JUDUL EDISI V2' },
    harap: { '#tiga .section-sub': /^Kap, badan, dan alas disambung/, '#tiga [data-tiga-row="base"] .tiga__tag': /^KAKI$/, '#tiga [data-tiga-row="base"] h3': /^Alas: penopang/, '#pita .band__text': /^PITA V2$/, '#edisi .section-title': /^Lima edisi/ },
    arsip: ['#tiga/div:0/p:1', ROW + '2/div:0/h3:0', '#edisi/div:0/h2:0'], pindah: { [ROW + '2/p:0']: 'KAKI', '#pita/div:0/p:0': 'PITA V2' } },
];
run(async ({ open, check }) => {
  for (const k of KASUS) {
    const seed = { text: { 'index.html': k.text }, products: null, config: null }; if (k.layout !== undefined) seed.layout = k.layout;
    const p = await open('desktop', { init: (s) => { try { if (!sessionStorage.getItem('__seeded')) { localStorage.setItem('mks-edits-v2', s); sessionStorage.setItem('__seeded', '1'); } } catch (_) {} }, initArg: JSON.stringify(seed) });
    const r = await p.evaluate((sels) => ({ got: Object.fromEntries(sels.map((s) => [s, (document.querySelector(s) || {}).textContent || null])), st: JSON.parse(localStorage.getItem('mks-edits-v2') || '{}') }), Object.keys(k.harap));
    const bad = Object.entries(k.harap).filter(([s, re]) => !re.test(String(r.got[s]).trim())).map(([s]) => `${s} = "${String(r.got[s]).trim().slice(0, 40)}"`);
    check(bad.length === 0, `C23 ${k.nama}: teks baru tidak tertimpa, suntingan yang sah tetap diterapkan`, bad.join(' | '));
    const t = (r.st.text || {})['index.html'] || {}, v2 = (r.st.textV2 || {})['index.html'] || {};
    const badS = [...k.arsip.filter((a) => a in t || !(a in v2)).map((a) => 'tidak diarsipkan: ' + a), ...Object.entries(k.pindah).filter(([a, v]) => t[a] !== v).map(([a]) => 'tidak pindah: ' + a)];
    check(badS.length === 0 && r.st.layout >= 4, `C23 ${k.nama}: simpanan dimigrasikan (alamat lama diarsipkan di textV2, yang bergeser dipindah, layout ≥ 4)`, badS.join(' | ') + ' layout ' + r.st.layout);
    check(p.__errs.length === 0, `C23 ${k.nama}: tanpa error JS`, p.__errs.join(' | ').slice(0, 200));
  }
  // Mode Edit tetap terbuka dan baris #tiga bisa disunting; label di dalam gambar kerja dan pita tidak ikut
  const p = await open('desktop', { hash: '#edit', wait: 1200 });
  await p.evaluate(() => { const c = document.querySelector('#mks-textmode'); if (c && !c.checked) c.click(); });
  await p.waitForTimeout(200);
  const e = await p.evaluate(() => ({ panel: !!document.querySelector('.mks-editor'), rows: document.querySelectorAll('#tiga .tiga__row .mks-editable').length, inFig: document.querySelectorAll('#exploded .mks-editable, #pita .band__art .mks-editable').length, pita: document.querySelectorAll('#pita .mks-editable').length }));
  check(e.panel, 'C23 Mode Edit (#edit): panel muncul di index');
  check(e.rows === 12 && e.pita === 2 && e.inFig === 0, 'C23 Mode Edit: 12 teks baris #tiga dan 2 teks pita bisa disunting; label gambar kerja dan anotasi pita tidak', JSON.stringify(e));
  check(p.__errs.length === 0, 'C23 Mode Edit: tanpa error JS', p.__errs.join(' | ').slice(0, 200));
});
