// Render SVG → PNG lewat Chromium (Playwright). Pakai: node tools/render-svg-png.js <dir-svg> <dir-png> [skala]
const { chromium } = require("playwright"), fs = require("fs"), path = require("path");
(async () => {
  const [inDir, outDir, scale = "4"] = process.argv.slice(2);
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch(); const page = await browser.newPage({ deviceScaleFactor: Number(scale) });
  for (const f of fs.readdirSync(inDir).filter((f) => f.endsWith(".svg"))) {
    const svg = fs.readFileSync(path.join(inDir, f), "utf8");
    const [, w, h] = svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
    const dark = /dark|icon/.test(f);
    const pad = /icon/.test(f) ? 0 : 24;
    await page.setViewportSize({ width: Math.ceil(+w + pad * 2), height: Math.ceil(+h + pad * 2) });
    await page.setContent(`<body style="margin:0;background:${/icon/.test(f) ? "transparent" : dark ? "#0f2a3a" : /hangat/.test(f) ? "#faf6ef" : "#ffffff"};padding:${pad}px">${svg.replace(/width="[\d.]+" height="[\d.]+"/, `width="${w}" height="${h}"`)}</body>`);
    await page.screenshot({ path: path.join(outDir, f.replace(".svg", ".png")), omitBackground: /icon/.test(f) });
  }
  await browser.close(); console.log("render ok");
})();
