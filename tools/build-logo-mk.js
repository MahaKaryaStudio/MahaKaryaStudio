// Logo MK Studio (biru muda) digabung dengan identitas website MahaKarya Studio.
// Monogram "MK" geometris + titik cahaya amber (dari mark "Nyala") + garis alas,
// dipasangkan dengan wordmark Fraunces yang sudah dipakai website.
// Jalankan dari folder yang sudah `npm i opentype.js @fontsource/fraunces @fontsource/inter`:
//   node tools/build-logo-mk.js assets/brand/mk
const o = require("opentype.js"), fs = require("fs"), path = require("path");
const FS = (pkg, f) => { const b = fs.readFileSync(require.resolve(`@fontsource/${pkg}/files/${pkg}-latin-${f}.woff`)); return o.parse(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength)); };
const fonts = { bold: FS("fraunces", "600-normal"), italic: FS("fraunces", "400-italic"), sans: FS("inter", "500-normal") };
const OUT = process.argv[2] || "logo-out";
fs.mkdirSync(OUT, { recursive: true });

// Palet: biru muda sebagai warna utama (permintaan), navy sebagai tinta,
// amber "titik cahaya" dipertahankan dari logo website supaya keduanya nyambung.
const PAL = {
  light: { bg: "#ffffff", ink: "#0f2a3a", blue: "#3db4de", blueDeep: "#1c8fbf", amber: "#f2a33a", soft: "#6b7f8c" },
  dark:  { bg: "#0f2a3a", ink: "#f4f8fa", blue: "#5ec8ec", blueDeep: "#3db4de", amber: "#f2a33a", soft: "#9fb3bf" },
};

function word(text, font, size, x, y, spacing = 0) {
  const k = size / 1000;
  const p = font.getPath(text, 0, 0, 1000, { letterSpacing: spacing });
  const d = p.toPathData(1);
  if (/NaN/.test(d)) throw new Error("NaN di path untuk " + text);
  const adv = font.getAdvanceWidth(text, size, { letterSpacing: spacing });
  return { d, tf: `translate(${x.toFixed(2)},${y.toFixed(2)}) scale(${k.toFixed(5)})`, w: adv };
}
function wordmark(c, size = 40) {
  const a = word("MahaKarya", fonts.bold, size, 0, 0);
  const b = word("Studio", fonts.italic, size, a.w + size * 0.12, 0);
  return { svg: `<path fill="${c.ink}" transform="${a.tf}" d="${a.d}"/><path fill="${c.blue}" transform="${b.tf}" d="${b.d}"/>`, w: a.w + size * 0.12 + b.w, asc: size * 0.72, desc: size * 0.22 };
}
// Tagline disusun per glyph (tanpa shaper GSUB) karena tabel ccmp Inter belum
// didukung opentype.js; untuk huruf kapital Latin hasilnya sama.
function wordGlyphs(text, font, size, spacing = 0) {
  const upem = font.unitsPerEm, k = size / upem; let x = 0, d = "";
  for (const ch of text) {
    const g = font.charToGlyph(ch);
    if (ch !== " ") { const gd = g.getPath(0, 0, upem).toPathData(1); if (/NaN/.test(gd)) throw new Error("NaN di path untuk " + text); d += `<path transform="translate(${(x / k).toFixed(1)})" d="${gd}"/>`; }
    x += g.advanceWidth * k + spacing * size;
  }
  return { d: `<g transform="scale(${k.toFixed(6)})">${d}</g>`, w: x - spacing * size };
}
// Motto brand (dari bio Instagram, ejaan dibetulkan: "Redefining").
const MOTTO = "Redefining where colours & sustainability take shapes";
function tagline(c, size = 11, maxW) {
  let t = wordGlyphs(MOTTO, fonts.sans, size, 0.02);
  if (maxW && t.w > maxW) { size = size * (maxW / t.w); t = wordGlyphs(MOTTO, fonts.sans, size, 0.02); }
  return { svg: `<g fill="${c.soft}">${t.d}</g>`, w: t.w, h: size };
}

// ---------- Monogram MK (grid 100×100) ----------
// M: dua tiang + V; K: tiang kanan M dipakai bersama, lengan atas diagonal,
// kaki bawah diganti titik cahaya (amber). Garis alas di bawah = "alas" lampu.
// Semua tebal garis sama (16) supaya terasa satu keluarga; sudut tajam, tanpa celah tipis.
function markMK(c, opts = {}) {
  const mono = opts.mono; // satu warna (untuk cetak 1 warna / sablon)
  const blue = mono || c.blue, amber = mono || c.amber, base = mono || c.ink;
  // M: poligon klasik, tiang 16, diagonal bertemu di tengah (tebal diagonal ≈ 15).
  const m = "M0 6H16L36 34L56 6H72V70H56V32L36 60L16 32V70H0Z";
  // K: tiang kanan M dipakai bersama; lengan atas 45° dari tiang ke sudut kanan atas.
  const k = "M72 34L100 6V28.6L72 56.6Z";
  // Kaki bawah K diganti titik cahaya (amber) = "nyala" dari logo website.
  const dot = `<circle cx="89" cy="60" r="9.5" fill="${amber}"/>`;
  // Garis alas = alas lampu; juga mengunci komposisi jadi satu blok.
  const baseLine = `<rect x="0" y="84" width="100" height="8" rx="4" fill="${base}"/>`;
  return `<path d="${m}${k}" fill="${blue}"/>${dot}${baseLine}`;
}

const svg = (w, h, inner, bg) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${bg ? `<rect width="${w}" height="${h}" fill="${bg}"/>` : ""}${inner}</svg>\n`;
const write = (name, s) => fs.writeFileSync(path.join(OUT, name), s);

for (const theme of ["light", "dark"]) {
  const c = PAL[theme];
  // 1. Mark saja
  write(`mk-mark-${theme}.svg`, svg(100, 100, markMK(c), null));
  // 2. Horizontal: mark 64 + wordmark + tagline
  const wm = wordmark(c, 44), tg = tagline(c, 11.5, wm.w);
  const H = 88, mk = 68, gap = 20;
  const W = Math.ceil(mk + gap + Math.max(wm.w, tg.w) + 8);
  const wy = 54;
  write(`mk-horizontal-${theme}.svg`, svg(W, H,
    `<g transform="translate(0,${(H - mk) / 2}) scale(${mk / 100})">${markMK(c)}</g>` +
    `<g transform="translate(${mk + gap},${wy})">${wm.svg}</g>` +
    `<g transform="translate(${mk + gap + 2},${wy + 24})">${tg.svg}</g>`, null));
  // 3. Stacked: mark 110 di atas wordmark + tagline, rata tengah
  const sw = wordmark(c, 40), st = tagline(c, 10.5, sw.w);
  const mkS = 110, SW = Math.ceil(Math.max(sw.w, st.w) + 32);
  write(`mk-stacked-${theme}.svg`, svg(SW, mkS + 26 + 30 + 22 + 10,
    `<g transform="translate(${(SW - mkS) / 2},0) scale(${mkS / 100})">${markMK(c)}</g>` +
    `<g transform="translate(${(SW - sw.w) / 2},${mkS + 26 + sw.asc})">${sw.svg}</g>` +
    `<g transform="translate(${(SW - st.w) / 2},${mkS + 26 + sw.asc + 26})">${st.svg}</g>`, null));
  // 4. Satu warna (navy di terang, putih di gelap) untuk sablon / cetak 1 warna
  write(`mk-mark-mono-${theme}.svg`, svg(100, 100, markMK(c, { mono: c.ink }), null));
}
// 5. Ikon aplikasi: latar navy, sudut membulat, monogram biru muda + titik amber
{
  const c = PAL.dark;
  write(`mk-icon.svg`, svg(100, 100, `<rect width="100" height="100" rx="22" fill="${c.bg}"/><g transform="translate(14,14) scale(.72)">${markMK(c)}</g>`, null));
  // 6. Varian biru muda sebagai latar (sosial media / profil WA)
  write(`mk-icon-blue.svg`, svg(100, 100, `<rect width="100" height="100" rx="22" fill="${PAL.light.blue}"/><g transform="translate(14,14) scale(.72)">${markMK({ blue: "#ffffff", amber: PAL.light.amber, ink: PAL.light.ink })}</g>`, null));
}
// 7. Versi hangat (palet website: amber/terakota) untuk pembanding
{
  const c = { bg: "#faf6ef", ink: "#1f1a16", blue: "#c8794a", blueDeep: "#9c5730", amber: "#f2a33a", soft: "#5b524a" };
  const wm = wordmark(c, 44), tg = tagline(c, 11.5, wm.w);
  const H = 88, mk = 68, gap = 20, W = Math.ceil(mk + gap + Math.max(wm.w, tg.w) + 8);
  write(`mk-horizontal-hangat.svg`, svg(W, H,
    `<g transform="translate(0,${(H - mk) / 2}) scale(${mk / 100})">${markMK(c)}</g>` +
    `<g transform="translate(${mk + gap},54)">${wm.svg}</g><g transform="translate(${mk + gap + 2},78)">${tg.svg}</g>`, null));
}
console.log("ok", fs.readdirSync(OUT).filter((f) => f.endsWith(".svg")).length, "svg");
