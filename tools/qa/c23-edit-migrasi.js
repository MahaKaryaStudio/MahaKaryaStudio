// Cek C23 adendum v3.1 (bagian alamat teks): suntingan Mode Edit yang tersimpan di alamat lama tidak menimpa
// teks baru, dan suntingan yang elemennya hanya bergeser ikut pindah.
// Pakai: node tools/qa/c23-edit-migrasi.js <url>
// localStorage["mks-edits-v2"] diisi sebelum halaman dimuat, lalu teks di halaman dan isi simpanan diperiksa.
// KASUS bertambah di langkah yang mengubah teks dasar (tahap baru di STAGES editor.js).
const { run } = require('./_lib');
const ROW = '#tiga/div:0/div:0/div:1/div:';
const AC = '#alur/div:0/div:0/article:';
const KASUS = [
  { nama: 'tahap 4 (#tiga), simpanan layout 3', layout: 3,
    text: { '#tiga/div:0/p:1': 'LEAD LAMA', [ROW + '0/span:0']: 'TUDUNG', [ROW + '0/div:0/h3:0']: 'H3 LAMA', [ROW + '1/div:0/p:0']: 'ISI LAMA', '#tiga/div:0/h2:0': 'JUDUL SUNTINGAN', '#pita/div:0/p:1': 'SUB PITA SUNTINGAN', '#edisi/div:0/h2:0': 'JUDUL EDISI V3' },
    harap: { '#tiga .section-sub': /^Kap, badan, dan alas disambung/, '#tiga [data-tiga-row="head"] .tiga__tag': /^TUDUNG$/, '#tiga [data-tiga-row="head"] h3': /^Kap: meredam/, '#tiga [data-tiga-row="body"] .tiga__text': /^Susun satu sampai tiga/, '#tiga .section-title': /^JUDUL SUNTINGAN$/, '#pita .band__sub': /^SUB PITA SUNTINGAN$/, '#edisi .section-title': /^JUDUL EDISI V3$/ },
    arsip: ['#tiga/div:0/p:1', ROW + '0/div:0/h3:0', ROW + '1/div:0/p:0'], pindah: { [ROW + '0/p:0']: 'TUDUNG' } },
  { nama: 'tahap 3 lalu 4, simpanan v2 tanpa layout', layout: undefined,
    text: { '#tiga/div:0/p:1': 'LEAD V2', [ROW + '2/span:0']: 'KAKI', [ROW + '2/div:0/h3:0']: 'H3 V2', 'main:0/section:8/div:0/p:0': 'PITA V2', '#edisi/div:0/h2:0': 'JUDUL EDISI V2' },
    harap: { '#tiga .section-sub': /^Kap, badan, dan alas disambung/, '#tiga [data-tiga-row="base"] .tiga__tag': /^KAKI$/, '#tiga [data-tiga-row="base"] h3': /^Alas: penopang/, '#pita .band__text': /^PITA V2$/, '#edisi .section-title': /^Lima edisi/ },
    arsip: ['#tiga/div:0/p:1', ROW + '2/div:0/h3:0', '#edisi/div:0/h2:0'], pindah: { [ROW + '2/p:0']: 'KAKI', '#pita/div:0/p:0': 'PITA V2' } },
  // tahap 5: meta Kap ditulis ulang (diarsipkan); meta Badan dan isi baris tidak berubah kata (tetap diterapkan)
  { nama: 'tahap 5 (meta Kap #tiga), simpanan layout 4', layout: 4,
    text: { [ROW + '0/p:2']: 'META KAP LAMA', [ROW + '1/p:2']: 'META BADAN SUNTINGAN', [ROW + '0/p:1']: 'ISI KAP SUNTINGAN' },
    harap: { '#tiga [data-tiga-row="head"] .tiga__meta': /^3 bentuk · lebar 20 cm · fitting E27$/, '#tiga [data-tiga-row="body"] .tiga__meta': /^META BADAN SUNTINGAN$/, '#tiga [data-tiga-row="head"] .tiga__text': /^ISI KAP SUNTINGAN$/ },
    arsip: [ROW + '0/p:2'], pindah: { [ROW + '1/p:2']: 'META BADAN SUNTINGAN', [ROW + '0/p:1']: 'ISI KAP SUNTINGAN' } },
  // tahap 6 (gerak-hapus): hint hero "Gulir untuk menyalakan" (#hero-hint) dihapus; suntingannya diarsipkan dan
  // tidak jatuh ke elemen lain; suntingan hero yang lain tetap berlaku
  { nama: 'tahap 6 (#hero-hint dihapus), simpanan layout 5', layout: 5,
    text: { '#hero-hint': 'HINT SUNTINGAN', '#hero/div:2/div:0/p:1': 'LEAD HERO SUNTINGAN' },
    harap: { '#hero .lead': /^LEAD HERO SUNTINGAN$/, 'body': /^(?![\s\S]*HINT SUNTINGAN)/ },
    arsip: ['#hero-hint'], pindah: { '#hero/div:2/div:0/p:1': 'LEAD HERO SUNTINGAN' } },
  // tahap 7 (gerak-sentuh): harga tidak diketik. Baris kit #paket dan gelembung rincian #alur (membawa angka ketikan)
  // diarsipkan; lead #bagian (p:1) tetap mendarat di .section-sub; simpanan di alamat baris label baru (p:2) tidak
  // menimpanya; baris LED #paket (hanya isi span harga yang berubah) tetap berlaku
  { nama: 'tahap 7 (harga tidak diketik, baris label #bagian), simpanan layout 6', layout: 6,
    text: { '#bagian/div:0/p:1': 'LEAD BAGIAN SUNTINGAN', '#bagian/div:0/p:2': 'TIMPA LABEL', '#paket/div:0/ul:0/li:1': 'KIT — Rp49.000 LAMA', '#paket/div:0/ul:0/li:2': '<span class="label">Opsional</span> <span class="paket__incl-text">LED SUNTINGAN +<span id="led-price-note" data-dynamic>Rp25.000</span></span>', '#alur/div:0/div:0/article:0/div:0/p:1': 'Halo Rani, total Rp467.000' },
    harap: { '#bagian .section-sub': /^Semua bagian dijual satuan dan cocok dengan rakitan mana pun\. Ketuk satu bagian/, '#bagian .bagian__il': /^Gambar: ilustrasi, bukan foto$/, '#paket .paket__incl li:nth-child(2) .paket__incl-text': /^Kit kelistrikan, komponen bertanda SNI\/K3L: Rp49\.000, bisa dilepas$/, '#paket .paket__incl li:nth-child(3) .paket__incl-text': /^LED SUNTINGAN \+Rp25\.000$/, '#alur [data-alur-total]': /^Rp\d{3}\.000$/ },
    // sejak tahap 9 (alur-bagian) lead #bagian ditulis ulang, jadi suntingan lead lama ikut diarsipkan
    arsip: ['#paket/div:0/ul:0/li:1', '#alur/div:0/div:0/article:0/div:0/p:1', '#bagian/div:0/p:2', '#bagian/div:0/p:1'], pindah: {} },
  // tahap 8 (rakit): daftar jaminan ringkasan menjadi "Janji kami" (#janji). Garansi dan foto rakitan berteks sama →
  // pindah; baris transfer/QRIS dan ringkasan details#ctrl-wrap diarsipkan; judul dan lead #rakit tetap berlaku
  { nama: 'tahap 8 (studio rakit, Janji kami), simpanan layout 7', layout: 7,
    text: { '#rakit/div:0/div:1/div:0/ul:0/li:0': 'TRANSFER SUNTINGAN', '#rakit/div:0/div:1/div:0/ul:0/li:1': 'GARANSI SUNTINGAN', '#rakit/div:0/div:1/div:0/ul:0/li:2': 'FOTO SUNTINGAN', '#ctrl-wrap/summary:0': 'UBAH SUNTINGAN', '#rakit/div:0/h2:0': 'JUDUL RAKIT SUNTINGAN', '#rakit/div:0/p:1': 'LEAD RAKIT SUNTINGAN' },
    harap: { '#janji li:nth-child(1)': /^FOTO SUNTINGAN$/, '#janji li:nth-child(2)': /^GARANSI SUNTINGAN$/, '#janji li:nth-child(3)': /^Semua bagian dijual satuan/, '#rakit .section-title': /^JUDUL RAKIT SUNTINGAN$/, '#rakit .section-sub': /^LEAD RAKIT SUNTINGAN$/, 'body': /^(?![\s\S]*(TRANSFER|UBAH) SUNTINGAN)/ },
    arsip: ['#rakit/div:0/div:1/div:0/ul:0/li:0', '#ctrl-wrap/summary:0'], pindah: { '#janji/ul:0/li:0': 'FOTO SUNTINGAN', '#janji/ul:0/li:1': 'GARANSI SUNTINGAN', '#rakit/div:0/h2:0': 'JUDUL RAKIT SUNTINGAN' } },
  // tahap 9 (alur-bagian): chat #alur ditulis ulang sebagai simulasi; gelembung lama, lead, dan .alur__note (dulu p:2, kini
  // alamat baris label "Simulasi alur pesan") diarsipkan. #bagian: lead dan kalimat "Sudah punya lampunya?" diarsipkan;
  // judul, kalimat volume, dan tombol sel penutup (dibungkus .bagian__more) ikut pindah
  { nama: 'tahap 9 (#alur simulasi, sel penutup #bagian), simpanan layout 8', layout: 8,
    text: { '#alur/div:0/p:1': 'Tiga pesan, persis seperti ini.', '#alur/div:0/p:2': 'Nama dan nomor resi di atas contoh.', [AC + '0/div:0/p:1']: 'Halo Rani, ini rinciannya', [AC + '1/div:0/p:1']: 'OK, cantik! 😍', [AC + '2/div:0/p:0']: 'Resi: JP1234567890', [AC + '2/div:0/p:1']: 'Kirim fotonya 🙂', '#alur/div:0/h2:0': 'JUDUL ALUR SUNTINGAN',
      '#bagian/div:0/p:1': 'Pakai langsung di konfigurator.', '#bagian/div:0/div:1/div:0/h3:0': 'PUNYA SUNTINGAN', '#bagian/div:0/div:1/div:0/p:0': 'Pilih warna di kartu.', '#bagian/div:0/div:1/a:0': 'TOMBOL SATUAN SUNTINGAN', '#bagian/div:0/div:2/div:0/h3:0': 'VOLUME SUNTINGAN', '#bagian/div:0/div:2/div:0/p:0': 'ISI VOLUME SUNTINGAN', '#bagian/div:0/div:2/a:0': 'TOMBOL VOLUME SUNTINGAN' },
    harap: { '#alur .section-sub': /^Tidak ada akun, tidak ada keranjang\. Tiga pesan dari kami yang akan kamu terima\.$/, '#alur .alur__sim': /^Simulasi alur pesan$/, '#alur .alur__note': /^Balasan dikirim manusia, bukan bot: /, '#alur [data-alur-col="1"] .bub--you': /^OK$/, '#alur [data-alur-col="2"] .bub': /^Kurir dan nomor resi kami kirim di sini\.$/, '#alur .section-title': /^JUDUL ALUR SUNTINGAN$/,
      '#bagian .section-sub': /studio rakit\.$/, '.havebase h3': /^PUNYA SUNTINGAN$/, '.havebase p': /^Beli satu badan atau kap baru saja/, '.havebase a': /^TOMBOL SATUAN SUNTINGAN$/, '.bulk h3': /^VOLUME SUNTINGAN$/, '.bulk p': /^ISI VOLUME SUNTINGAN$/, '.bulk a': /^TOMBOL VOLUME SUNTINGAN$/, 'body': /^(?![\s\S]*(Rani|cantik|JP1234567890|konfigurator|persis seperti ini|contoh\.))/ },
    arsip: ['#alur/div:0/p:1', '#alur/div:0/p:2', AC + '0/div:0/p:1', AC + '1/div:0/p:1', AC + '2/div:0/p:0', AC + '2/div:0/p:1', '#bagian/div:0/p:1', '#bagian/div:0/div:1/div:0/p:0'],
    pindah: { '#alur/div:0/h2:0': 'JUDUL ALUR SUNTINGAN', '#bagian/div:0/div:1/div:0/div:0/h3:0': 'PUNYA SUNTINGAN', '#bagian/div:0/div:1/div:0/a:0': 'TOMBOL SATUAN SUNTINGAN', '#bagian/div:0/div:1/div:1/div:0/h3:0': 'VOLUME SUNTINGAN', '#bagian/div:0/div:1/div:1/div:0/p:0': 'ISI VOLUME SUNTINGAN', '#bagian/div:0/div:1/div:1/a:0': 'TOMBOL VOLUME SUNTINGAN' } },
  // tahap 10 (penutup): H3 langkah ketiga #cara ditulis ulang (diarsipkan), kartu spesifikasi menjadi <details id="spec">
  // (eyebrow lama diarsipkan, dt/dd pindah), kepala #faq dibungkus .faq__head dan daftar ber-id faq-list (pindah), footer h4 →
  // h3 (pindah), "Konfigurator" diarsipkan, label kontak WhatsApp diarsipkan dan label Instagram naik satu baris
  { nama: 'tahap 10 (#cara, #faq, footer), simpanan layout 9', layout: 9,
    text: { '#cara/div:0/div:0/div:0/div:2/div:0/h3:0': 'CETAK SUNTINGAN', '#cara/div:0/div:0/div:0/div:0/div:0/h3:0': 'RAKIT SUNTINGAN', '#cara/div:0/div:1/p:0': 'EYEBROW SPEK SUNTINGAN', '#cara/div:0/div:1/dl:0/dt:0': 'MATERIAL', '#cara/div:0/div:1/dl:0/dd:2': 'ULIR SUNTINGAN',
      '#faq/div:0/h2:0': 'JUDUL FAQ SUNTINGAN', '#faq/div:0/p:0': 'EYEBROW FAQ SUNTINGAN', '#faq/div:0/div:0/details:1/p:0': 'JAWAB SNI SUNTINGAN', '#faq/div:0/div:0/details:7/summary:0': 'BATAL SUNTINGAN',
      'footer:0/div:0/div:1/h4:0': 'KONTAK SUNTINGAN', 'footer:0/div:0/div:3/h4:0': 'PASAR SUNTINGAN', 'footer:0/div:0/div:2/a:0': 'KONFIG SUNTINGAN', 'footer:0/div:0/div:2/a:1': 'PAKET SUNTINGAN', 'footer:0/div:0/div:1/div:0/span:0': 'WA LABEL SUNTINGAN', 'footer:0/div:0/div:1/div:1/span:0': 'IG SUNTINGAN' },
    harap: { '#cara .steps-l > .step:nth-of-type(3) h3': /^Kami cetak & rakit$/, '#cara .steps-l > .step:nth-of-type(1) h3': /^RAKIT SUNTINGAN$/, '#spec summary': /^Spesifikasi rakitanmu$/, '#spec dt': /^MATERIAL$/, '#spec dd:nth-of-type(3)': /^ULIR SUNTINGAN$/,
      '#faq .section-title': /^JUDUL FAQ SUNTINGAN$/, '#faq .eyebrow': /^EYEBROW FAQ SUNTINGAN$/, '#faq-list details:nth-of-type(2) p': /^JAWAB SNI SUNTINGAN$/, '#faq-list details:nth-of-type(8) summary': /^BATAL SUNTINGAN$/,
      '.footer__col--kontak h3': /^KONTAK SUNTINGAN$/, '[data-marketplace-col] h3': /^PASAR SUNTINGAN$/, '.footer__grid > div:nth-of-type(3) a:nth-of-type(1)': /^Studio rakit$/, '.footer__grid > div:nth-of-type(3) a:nth-of-type(2)': /^PAKET SUNTINGAN$/,
      '.footer__col--kontak .contact-line:nth-of-type(1) > span': /^IG SUNTINGAN$/, '.footer__col--kontak .contact-line:nth-of-type(2) > span': /^Email$/, 'body': /^(?![\s\S]*(CETAK|EYEBROW SPEK|KONFIG|WA LABEL) SUNTINGAN)/ },
    // label WhatsApp lama (div:0) diarsipkan, tetapi alamatnya kini dipakai label Instagram yang pindah: cukup diuji lewat 'body'
    arsip: ['#cara/div:0/div:0/div:0/div:2/div:0/h3:0', '#cara/div:0/div:1/p:0', 'footer:0/div:0/div:2/a:0'],
    pindah: { '#spec/dl:0/dt:0': 'MATERIAL', '#spec/dl:0/dd:2': 'ULIR SUNTINGAN', '#faq/div:0/div:0/h2:0': 'JUDUL FAQ SUNTINGAN', '#faq/div:0/div:0/p:0': 'EYEBROW FAQ SUNTINGAN', '#faq-list/details:1/p:0': 'JAWAB SNI SUNTINGAN', '#faq-list/details:7/summary:0': 'BATAL SUNTINGAN',
      'footer:0/div:0/div:1/h3:0': 'KONTAK SUNTINGAN', 'footer:0/div:0/div:3/h3:0': 'PASAR SUNTINGAN', 'footer:0/div:0/div:2/a:1': 'PAKET SUNTINGAN', 'footer:0/div:0/div:1/div:0/span:0': 'IG SUNTINGAN', '#cara/div:0/div:0/div:0/div:0/div:0/h3:0': 'RAKIT SUNTINGAN' } },
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
    check(badS.length === 0 && r.st.layout >= 10, `C23 ${k.nama}: simpanan dimigrasikan (alamat lama diarsipkan di textV2, yang bergeser dipindah, layout ≥ 10)`, badS.join(' | ') + ' layout ' + r.st.layout);
    check(p.__errs.length === 0, `C23 ${k.nama}: tanpa error JS`, p.__errs.join(' | ').slice(0, 200));
  }
  // Mode Edit tetap terbuka dan baris #tiga bisa disunting; label di dalam gambar kerja dan pita tidak ikut
  const p = await open('desktop', { hash: '#edit', wait: 1200 });
  await p.evaluate(() => { const c = document.querySelector('#mks-textmode'); if (c && !c.checked) c.click(); });
  await p.waitForTimeout(200);
  const e = await p.evaluate(() => ({ panel: !!document.querySelector('.mks-editor'), rows: document.querySelectorAll('#tiga .tiga__row .mks-editable').length, inFig: document.querySelectorAll('#exploded .mks-editable, #pita .band__art .mks-editable').length, pita: document.querySelectorAll('#pita .mks-editable').length }));
  check(e.panel, 'C23 Mode Edit (#edit): panel muncul di index');
  check(e.rows === 12 && e.pita === 2 && e.inFig === 0, 'C23 Mode Edit: 12 teks baris #tiga dan 2 teks pita bisa disunting; label gambar kerja dan anotasi pita tidak', JSON.stringify(e));
  // Mode Edit menyimpan: sunting lead hero, muat ulang, suntingan tetap; harga lima edisi (C14) tidak berubah
  await p.evaluate(() => { const el = document.querySelector('#hero .lead'); el.textContent = 'LEAD DARI MODE EDIT'; el.dispatchEvent(new Event('input', { bubbles: true })); });
  await p.reload({ waitUntil: 'load' }); await p.waitForTimeout(1000);
  const sv = await p.evaluate(() => ({ lead: document.querySelector('#hero .lead').textContent.trim(), st: JSON.parse(localStorage.getItem('mks-edits-v2') || '{}'), prices: window.MKS_LAMP.presets.map((pr) => window.MKSLamp.price({ head: pr.head, body: pr.body, base: pr.base, wiring: true, led: false })).map((r) => [r.total, r.parts + r.wiring]) }));
  check(sv.lead === 'LEAD DARI MODE EDIT' && sv.st.layout === 10, 'C23 Mode Edit: suntingan tersimpan dan tetap ada setelah muat ulang (layout 10)', `${sv.lead} · layout ${sv.st.layout}`);
  check(JSON.stringify(sv.prices) === JSON.stringify([[464000, 626000], [447000, 602000], [454000, 612000], [427000, 533000], [383000, 442000]]), 'C14: harga dan coret lima edisi tidak berubah', JSON.stringify(sv.prices));
  check(p.__errs.length === 0, 'C23 Mode Edit: tanpa error JS', p.__errs.join(' | ').slice(0, 200));
});
