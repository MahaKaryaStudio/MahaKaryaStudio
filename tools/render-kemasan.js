// Render mockup, lembar panel, dan gambar insert kemasan → PNG. Pakai: node tools/render-kemasan.js ops/kemasan
const { chromium } = require("playwright"), fs = require("fs"), path = require("path");
(async () => {
  const dir = process.argv[2] || "ops/kemasan"; const out = path.join(dir, "png"); fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch(); const page = await browser.newPage({ deviceScaleFactor: 2 });
  await page.setViewportSize({ width: 1600, height: 1100 });
  await page.setContent(fs.readFileSync(path.join(dir, "mockup.html"), "utf8")); await page.screenshot({ path: path.join(out, "mockup-3d.png") });
  await page.setViewportSize({ width: 1720, height: 1200 });
  await page.setContent(fs.readFileSync(path.join(dir, "lembar-panel.html"), "utf8")); await page.screenshot({ path: path.join(out, "lembar-panel.png"), fullPage: true });
  const ins = fs.readFileSync(path.join(dir, "insert-dan-ukuran.svg"), "utf8").replace(/width="[\d.]+mm" height="[\d.]+mm"/, 'width="1680" height="1188"');
  await page.setViewportSize({ width: 1680, height: 1188 }); await page.setContent(`<body style="margin:0">${ins}</body>`); await page.screenshot({ path: path.join(out, "insert-dan-ukuran.png") });
  for (const f of ["panel-depan", "panel-samping-a-isi", "panel-samping-b-rakit", "panel-belakang", "panel-tutup", "stiker-kode-rakitan"]) {
    const s = fs.readFileSync(path.join(dir, f + ".svg"), "utf8"); const [, w, h] = s.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
    await page.setViewportSize({ width: w * 4, height: h * 4 }); await page.setContent(`<body style="margin:0">${s.replace(/width="[\d.]+mm" height="[\d.]+mm"/, `width="${w * 4}" height="${h * 4}"`)}</body>`);
    await page.screenshot({ path: path.join(out, f + ".png") });
  }
  await browser.close(); console.log("render ok");
})();
