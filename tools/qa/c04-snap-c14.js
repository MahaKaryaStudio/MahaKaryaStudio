// Snapshot C14 untuk langkah gerak-sentuh: harga, coret, dan isi pesan WhatsApp lima edisi + semua tautan [data-wa].
// Pakai: node tools/qa/c04-snap-c14.js <url> --tulis      → menulis tools/qa/data/c14-gerak-sentuh.json (dijalankan SEBELUM langkah)
//        require('./c04-snap-c14').ambil(open)            → dipakai c04-gerak-sentuh.js untuk membandingkan
const fs = require('fs'), path = require('path');
const FILE = path.join(__dirname, 'data', 'c14-gerak-sentuh.json');
async function ambil(open) {
  const out = [];
  for (let i = 0; i < 5; i++) {
    const p = await open('desktop');
    await p.evaluate(() => document.querySelectorAll('#edisi-app .edisi__opt')[2].scrollIntoView({ block: 'center', behavior: 'instant' }));
    await p.waitForTimeout(300);
    const r = await p.evaluate((i) => { const o = document.querySelectorAll('#edisi-app .edisi__opt')[i].getBoundingClientRect(); return [o.left + o.width / 2, o.top + o.height / 2]; }, i);
    await p.mouse.click(r[0], r[1]); await p.waitForTimeout(500);
    out.push(await p.evaluate(() => ({
      amount: document.querySelector('#edisi-app [data-ed-amount]').textContent,
      was: document.querySelector('#edisi-app [data-ed-was]').textContent,
      order: decodeURIComponent(document.querySelector('#edisi-app [data-ed-order]').href),
      total: window.MKSLamp.price(window.MKSLamp.state).total,
      wa: [...document.querySelectorAll('[data-wa]')].map((a) => (a.getAttribute('data-wa') || '') + ' => ' + decodeURIComponent(a.href || '')),
    }), i));
    await p.context().close();
  }
  return out;
}
module.exports = { ambil, FILE };
if (require.main === module) {
  const { run } = require('./_lib');
  run(async ({ open, check, opt }) => {
    const snap = await ambil(open);
    if (opt.tulis) { fs.mkdirSync(path.dirname(FILE), { recursive: true }); fs.writeFileSync(FILE, JSON.stringify(snap, null, 1) + '\n'); }
    check(snap.length === 5, `snapshot C14 lima edisi${opt.tulis ? ' ditulis ke ' + path.relative(process.cwd(), FILE) : ''}`, snap.map((s) => s.amount).join(' '));
  });
}
