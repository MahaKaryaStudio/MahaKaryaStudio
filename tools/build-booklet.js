// Mengekspor booklet.html menjadi PDF A5 16 halaman (dan pratinjau PNG per halaman bila diminta).
// Membutuhkan Playwright dengan Chromium:
//   npx playwright install chromium   (sekali)
//   node tools/build-booklet.js                → assets/booklet/MahaKarya-Booklet-Edisi-01.pdf
//   node tools/build-booklet.js --png out/dir  → juga menyimpan PNG tiap halaman untuk pratinjau
//   node tools/build-booklet.js --qr           → membuat ulang assets/js/booklet-qr.js (perlu `npm i qrcode`)
// Font (Fraunces, Inter, DM Mono) diambil dari Google Fonts saat render, jadi perlu koneksi internet.
const fs = require("fs"), path = require("path");
const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "assets", "booklet", "MahaKarya-Booklet-Edisi-01.pdf");
const args = process.argv.slice(2);
const pngDir = args.includes("--png") ? args[args.indexOf("--png") + 1] : null;

function buildQr() {
  const QR = require("qrcode");
  const C = {};
  new Function("window", fs.readFileSync(path.join(ROOT, "assets/js/config.js"), "utf8"))(C);
  const cfg = C.MKS_CONFIG;
  const make = (text) => {
    const q = QR.create(text, { errorCorrectionLevel: "M" });
    const n = q.modules.size, d = q.modules.data;
    let p = "";
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (d[y * n + x]) p += `M${x} ${y}h1v1h-1z`;
    return { n, path: p };
  };
  const data = {
    site: make("https://mahakaryastudio.github.io/MahaKaryaStudio/"),
    wa: make(`https://wa.me/${cfg.whatsapp}?text=` + encodeURIComponent("Halo MahaKarya Studio, saya lihat bookletnya dan mau tanya lampu rakitan")),
    ig: make(`https://instagram.com/${cfg.instagram}`),
  };
  const src =
    "/*\n * Data QR code untuk booklet (dibuat dengan paket npm `qrcode`, level koreksi M).\n * site: halaman utama; wa: chat WhatsApp dengan pesan pembuka; ig: profil Instagram.\n * Buat ulang bila alamat website/nomor WhatsApp berubah: lihat tools/build-booklet.js.\n */\nwindow.MKS_QR = " +
    JSON.stringify(data) + ";\n";
  fs.writeFileSync(path.join(ROOT, "assets/js/booklet-qr.js"), src);
  console.log("QR diperbarui: assets/js/booklet-qr.js");
}

async function buildPdf() {
  let chromium;
  try { ({ chromium } = require("playwright")); } catch { ({ chromium } = require(process.env.PLAYWRIGHT_PATH || "/opt/node22/lib/node_modules/playwright")); }
  const launch = { args: ["--font-render-hinting=none"] };
  if (process.env.CHROMIUM_PATH) launch.executablePath = process.env.CHROMIUM_PATH;
  const browser = await chromium.launch(launch);
  const page = await browser.newPage({ viewport: { width: 1200, height: 1700 } });
  page.on("pageerror", (e) => console.error("Kesalahan di halaman:", e.message));
  await page.goto("file://" + path.join(ROOT, "booklet.html"), { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  const n = await page.evaluate(() => document.querySelectorAll(".page").length);
  if (n % 4) console.warn(`Peringatan: ${n} halaman; booklet jilid tengah perlu kelipatan 4.`);
  // Deteksi isi yang meluap keluar halaman (akan terpotong saat cetak)
  const overflow = await page.evaluate(() =>
    [...document.querySelectorAll(".page")].flatMap((pg, i) => {
      const r = pg.getBoundingClientRect(), bad = [];
      pg.querySelectorAll(".folio, .back__legal, .cover__meta").forEach((el) => {});
      for (const el of pg.querySelectorAll("*")) {
        if (el.closest(".cover__lamp, .cover__grid, .cover__vert, svg")) continue;
        const b = el.getBoundingClientRect();
        if (b.height && (b.bottom > r.bottom + 1 || b.right > r.right + 1)) { bad.push(`${i + 1}:${el.className || el.tagName}`); break; }
      }
      return bad;
    })
  );
  if (overflow.length) console.warn("Isi meluap di halaman:", overflow.join(", "));
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  await page.emulateMedia({ media: "print" });
  await page.pdf({ path: OUT, preferCSSPageSize: true, printBackground: true, margin: { top: 0, right: 0, bottom: 0, left: 0 } });
  console.log(`PDF: ${path.relative(ROOT, OUT)} (${n} halaman, ${(fs.statSync(OUT).size / 1024).toFixed(0)} KB)`);
  if (pngDir) {
    fs.mkdirSync(pngDir, { recursive: true });
    await page.emulateMedia({ media: "screen" });
    await page.addStyleTag({ content: ".toolbar{display:none}.book-wrap{padding:0}.book{display:block!important;width:148mm!important;transform:none!important}.page{box-shadow:none;margin:0}" });
    const handles = await page.$$(".page");
    for (let i = 0; i < handles.length; i++) await handles[i].screenshot({ path: path.join(pngDir, `hal-${String(i + 1).padStart(2, "0")}.png`), scale: "css" });
    console.log(`PNG: ${handles.length} halaman di ${pngDir}`);
  }
  await browser.close();
}

(async () => {
  if (args.includes("--qr")) buildQr();
  await buildPdf();
})().catch((e) => { console.error(e); process.exit(1); });
