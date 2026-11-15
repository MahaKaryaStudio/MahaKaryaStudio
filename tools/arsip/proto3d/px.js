// node px.js <png> x,y x,y ...  → rata-rata 5×5 piksel
const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const [file, ...pts] = process.argv.slice(2);
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  const p = await b.newPage();
  const data = 'data:image/png;base64,' + fs.readFileSync(file).toString('base64');
  const out = await p.evaluate(async ({ data, pts }) => {
    const im = new Image(); im.src = data; await im.decode();
    const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; const x = c.getContext('2d'); x.drawImage(im, 0, 0);
    return pts.map((s) => { const [px, py] = s.split(',').map(Number); const d = x.getImageData(px - 2, py - 2, 5, 5).data; let r = 0, g = 0, bl = 0; for (let i = 0; i < d.length; i += 4) { r += d[i]; g += d[i + 1]; bl += d[i + 2]; } return s + ' → ' + [r, g, bl].map((v) => Math.round(v / 25)).join(','); });
  }, { data, pts });
  console.log(out.join('\n'));
  await b.close();
})();
