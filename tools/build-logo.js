// Membuat logo MahaKarya Studio (SVG): 3 konsep, varian gelap/terang, teks dikonversi ke path.
// Jalankan dari folder yang sudah `npm i opentype.js @fontsource/fraunces`:
//   node tools/build-logo.js assets/brand
const o = require("opentype.js"), fs = require("fs"), path = require("path");
const F = (f) => { const b = fs.readFileSync(`node_modules/@fontsource/fraunces/files/fraunces-latin-${f}.woff`); return o.parse(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength)); };
const fonts = { bold: F("600-normal"), italic: F("400-italic") };
const OUT = process.argv[2] || "logo-out";
fs.mkdirSync(OUT, { recursive: true });

const PAL = {
  dark: { bg: "#15100c", ink: "#f2e7d5", accent: "#f2a33a", accent2: "#c8794a", soft: "#a89a85" },
  light: { bg: "#faf6ef", ink: "#1f1a16", accent: "#c8794a", accent2: "#9c5730", soft: "#5b524a" },
};

// ---------- Wordmark: "MahaKarya" (600) + "Studio" (400 italic) ----------
// Beberapa ukuran menghasilkan NaN di data path (bug konversi kurva); hitung di 1000 unit lalu skalakan.
function word(text, font, size, x, y) {
  const k = size / 1000;
  const p = font.getPath(text, 0, 0, 1000);
  const d = p.toPathData(1);
  if (/NaN/.test(d)) throw new Error("NaN di path untuk " + text);
  const adv = font.getAdvanceWidth(text, size);
  return { d, tf: `translate(${x.toFixed(2)},${y.toFixed(2)}) scale(${k.toFixed(5)})`, w: adv };
}
function wordmark(c, size = 40) {
  const a = word("MahaKarya", fonts.bold, size, 0, 0);
  const b = word("Studio", fonts.italic, size, a.w + size * 0.12, 0);
  return { svg: `<path fill="${c.ink}" transform="${a.tf}" d="${a.d}"/><path fill="${c.accent}" transform="${b.tf}" d="${b.d}"/>`, w: a.w + size * 0.12 + b.w, asc: size * 0.72, desc: size * 0.22 };
}
function stackedWordmark(c, size = 40) {
  const a = word("MahaKarya", fonts.bold, size, 0, 0);
  const b = word("Studio", fonts.italic, size * 0.78, 0, size * 0.95);
  return { svg: `<path fill="${c.ink}" transform="${a.tf}" d="${a.d}"/><path fill="${c.accent}" transform="${b.tf}" d="${b.d}"/>`, w: a.w, h: size * 0.95 + size * 0.78 * 0.22, asc: size * 0.72 };
}

// ---------- Mark A "Lapis": siluet lampu dari garis lapisan cetak ----------
function markLapis(c, opts = {}) {
  const mono = opts.mono;
  const sw = 6, pitch = 10, cx = 50;
  const lines = [];
  const line = (y, w, col) => lines.push(`<line x1="${(cx - w / 2).toFixed(1)}" y1="${y}" x2="${(cx + w / 2).toFixed(1)}" y2="${y}" stroke="${col}"/>`);
  // Kap: trapesium y 10..40, lebar 34→62
  for (let i = 0; i < 4; i++) { const y = 10 + i * pitch; line(y, 34 + (28 * i) / 3, c.accent); }
  // Leher
  line(48, 12, mono ? c.accent : c.soft);
  // Badan: bentuk bulat y 56..76 (3 garis: 36, 44, 36)
  [36, 46, 36].forEach((w, i) => line(56 + i * pitch, w, mono ? c.accent : c.accent2));
  // Alas
  line(88, 60, mono ? c.accent : c.ink);
  return `<g fill="none" stroke-width="${sw}" stroke-linecap="round">${lines.join("")}</g>`;
}
// ---------- Mark B "Tumpuk": bentuk modular solid ----------
function markTumpuk(c, opts = {}) {
  const mono = opts.mono;
  const shade = c.accent, body1 = mono ? c.accent : c.accent2, body2 = mono ? c.accent : c.ink, base = mono ? c.accent : c.soft;
  return `<path d="M34 10h32l12 32H22z" fill="${shade}"/>` +
    `<rect x="45" y="42" width="10" height="6" fill="${body1}"/>` +
    `<circle cx="50" cy="59" r="11" fill="${body1}"/>` +
    `<rect x="40" y="70" width="20" height="12" rx="2" fill="${body2}"/>` +
    `<rect x="20" y="84" width="60" height="7" rx="3.5" fill="${base}"/>`;
}
// ---------- Mark C "Nyala": kap bergaris + titik cahaya ----------
function markNyala(c, opts = {}) {
  const mono = opts.mono;
  const g = [];
  for (let i = 0; i < 5; i++) { const y = 16 + i * 8, w = 30 + i * 8; g.push(`<line x1="${50 - w / 2}" y1="${y}" x2="${50 + w / 2}" y2="${y}"/>`); }
  return `<g fill="none" stroke="${c.accent}" stroke-width="5" stroke-linecap="round">${g.join("")}</g>` +
    `<circle cx="50" cy="66" r="9" fill="${mono ? c.accent : c.ink}"/>` +
    `<line x1="30" y1="88" x2="70" y2="88" stroke="${mono ? c.accent : c.soft}" stroke-width="5" stroke-linecap="round"/>`;
}
const MARKS = { lapis: markLapis, tumpuk: markTumpuk, nyala: markNyala };

const svg = (w, h, inner, bg) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${bg ? `<rect width="${w}" height="${h}" fill="${bg}"/>` : ""}${inner}</svg>\n`;
const write = (name, s) => fs.writeFileSync(path.join(OUT, name), s);

for (const [id, mark] of Object.entries(MARKS)) {
  for (const theme of ["dark", "light"]) {
    const c = PAL[theme];
    // Mark saja (tanpa latar)
    write(`${id}-mark-${theme}.svg`, svg(100, 100, mark(c), null));
    // Horizontal: mark 64px + wordmark
    const wm = wordmark(c, 44);
    const H = 80, mk = 64, gap = 18;
    const W = Math.ceil(mk + gap + wm.w + 8);
    write(`${id}-horizontal-${theme}.svg`, svg(W, H, `<g transform="translate(0,${(H - mk) / 2}) scale(${mk / 100})">${mark(c)}</g><g transform="translate(${mk + gap},${(H + wm.asc - wm.desc) / 2})">${wm.svg}</g>`, null));
    // Stacked: mark 96px di atas wordmark
    const sm = stackedWordmark(c, 40);
    const SW = Math.ceil(Math.max(sm.w, 96) + 24), mkS = 96;
    write(`${id}-stacked-${theme}.svg`, svg(SW, mkS + 20 + sm.h + 24, `<g transform="translate(${(SW - mkS) / 2},0) scale(${mkS / 100})">${mark(c)}</g><g transform="translate(${(SW - sm.w) / 2},${mkS + 20 + sm.asc})">${sm.svg}</g>`, null));
  }
  // Ikon aplikasi / favicon: latar gelap, sudut membulat, mark monokrom amber
  const c = PAL.dark;
  write(`${id}-icon.svg`, svg(100, 100, `<rect width="100" height="100" rx="22" fill="${c.bg}"/><g transform="translate(10,10) scale(.8)">${mark(c, { mono: true })}</g>`, null));
}
console.log("ok", fs.readdirSync(OUT).length, "file");
