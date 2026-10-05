// Kemasan LAMP 01 "Dhiyanra": panel cetak (mm), gambar insert, dan mockup 3D.
// Semua teks dikonversi ke path supaya file siap dibawa ke percetakan tanpa font.
// Jalankan dari folder yang sudah `npm i opentype.js qrcode @fontsource/fraunces @fontsource/inter`
// (Playwright untuk render PNG):
//   node tools/build-kemasan.js ops/kemasan
const o = require("opentype.js"), fs = require("fs"), path = require("path"), QR = require("qrcode");
const FS = (pkg, f) => { const b = fs.readFileSync(require.resolve(`@fontsource/${pkg}/files/${pkg}-latin-${f}.woff`)); return o.parse(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength)); };
const F = { serif: FS("fraunces", "600-normal"), serifIt: FS("fraunces", "400-italic"), sans: FS("inter", "500-normal"), sansReg: FS("inter", "400-normal") };
const OUT = process.argv[2] || "kemasan-out";
fs.mkdirSync(OUT, { recursive: true });

// ---------- UKURAN (mm) ----------
// Luar 240 × 240 × 200 → volumetrik 240·240·200/6000 = 1,92 kg → tarif 2 kg.
// Dalam 228 × 228 × 188 (dinding B-flute 3 mm + lipatan tutup).
const BOX = { W: 240, D: 240, H: 200, iW: 228, iD: 228, iH: 188 };

// ---------- WARNA ----------
// Dua warna cetak di kraft: hitam arang + putih opaque. Kraft hanya pratinjau (warna bahan).
const C = { kraft: "#c7a470", kraftDark: "#b8945f", ink: "#2b2622", white: "#f6f1e7", amber: "#f2a33a" };

// ---------- TEKS → PATH (per glyph + kerning, tanpa shaper GSUB) ----------
function text(str, font, size, x, y, opt = {}) {
  const { anchor = "start", fill = C.ink, spacing = 0, opacity } = opt;
  // Path dihitung pada ukuran unitsPerEm lalu diskalakan lewat transform:
  // konversi kurva opentype.js menghasilkan NaN pada beberapa ukuran kecil.
  const upem = font.unitsPerEm, k = size / upem; let wu = 0; const gl = [];
  let prev = null;
  for (const ch of str) {
    const g = font.charToGlyph(ch);
    if (prev) { const kv = font.getKerningValue(prev, g); if (Number.isFinite(kv)) wu += kv; }
    gl.push([g, wu]); wu += g.advanceWidth + spacing * upem; prev = g;
  }
  wu -= spacing * upem;
  const w = wu * k, x0 = anchor === "middle" ? x - w / 2 : anchor === "end" ? x - w : x;
  // Tiap glyph digambar di x=0 lalu digeser lewat transform: getPath dengan x besar
  // menghasilkan NaN pada glyph berkurva (bug opentype.js).
  let inner = "";
  for (const [g, gx] of gl) { const d = g.getPath(0, 0, upem).toPathData(1); if (/NaN/.test(d)) throw new Error("NaN di path untuk " + str); if (d) inner += `<path transform="translate(${gx.toFixed(1)})" d="${d}"/>`; }
  return { svg: `<g fill="${fill}"${opacity ? ` fill-opacity="${opacity}"` : ""} transform="translate(${x0.toFixed(2)},${y.toFixed(2)}) scale(${k.toFixed(6)})">${inner}</g>`, w, x0 };
}
const label = (s, size, x, y, opt) => text(s, F.sans, size, x, y, { spacing: 0.16, ...opt }).svg;
const body = (s, size, x, y, opt) => text(s, F.sansReg, size, x, y, opt).svg;

// ---------- MONOGRAM MK (dari tools/build-logo-mk.js, versi 2 warna kemasan) ----------
function markMK(col = { letters: C.ink, dot: C.white, base: C.ink }) {
  return `<path d="M0 6H16L36 34L56 6H72V70H56V32L36 60L16 32V70H0ZM72 34L100 6V28.6L72 56.6Z" fill="${col.letters}"/>` +
    `<circle cx="89" cy="60" r="9.5" fill="${col.dot}"/><rect x="0" y="84" width="100" height="8" rx="4" fill="${col.base}"/>`;
}
function wordmark(size, x, y, col = { a: C.ink, b: C.ink }, anchor = "start") {
  const a = text("MahaKarya", F.serif, size, 0, 0), b = text("Studio", F.serifIt, size, 0, 0);
  const w = a.w + size * 0.12 + b.w, x0 = anchor === "middle" ? x - w / 2 : x;
  return text("MahaKarya", F.serif, size, x0, y, { fill: col.a }).svg + text("Studio", F.serifIt, size, x0 + a.w + size * 0.12, y, { fill: col.b }).svg;
}

// ---------- SILUET LAMPU (preset "Senja": kerucut · kubus · heksa · bola · alas kotak) ----------
// Skala 2,5 mm per cm. Bagian dipisah garis tipis = menunjukkan lampu ini modular.
function lampSilhouette(cx, yBottom, s = 2.5, fill = C.white, line = C.ink) {
  let y = yBottom, out = "";
  const sep = (yy, w) => `<line x1="${(cx - w / 2).toFixed(1)}" y1="${yy.toFixed(1)}" x2="${(cx + w / 2).toFixed(1)}" y2="${yy.toFixed(1)}" stroke="${line}" stroke-width="0.6"/>`;
  // Alas kotak 14 × 3 cm
  out += `<rect x="${cx - 7 * s}" y="${y - 3 * s}" width="${14 * s}" height="${3 * s}" rx="${0.6 * s}" fill="${fill}"/>`; y -= 3 * s; out += sep(y, 8 * s);
  // Bola Ø 8
  out += `<circle cx="${cx}" cy="${y - 4 * s}" r="${4 * s}" fill="${fill}"/>`; y -= 8 * s; out += sep(y, 4 * s);
  // Heksagon 7,5 tinggi, lebar 7
  { const h = 7.5 * s, w = 7 * s, yc = y - h / 2; out += `<polygon points="${cx - w / 2},${yc} ${cx - w / 4},${y - h} ${cx + w / 4},${y - h} ${cx + w / 2},${yc} ${cx + w / 4},${y} ${cx - w / 4},${y}" fill="${fill}"/>`; y -= h; out += sep(y, 3.5 * s); }
  // Kubus 7
  out += `<rect x="${cx - 3.5 * s}" y="${y - 7 * s}" width="${7 * s}" height="${7 * s}" fill="${fill}"/>`; y -= 7 * s; out += sep(y, 3.5 * s);
  // Leher 2 cm
  out += `<rect x="${cx - 1.2 * s}" y="${y - 2 * s}" width="${2.4 * s}" height="${2 * s}" fill="${fill}"/>`; y -= 2 * s;
  // Kap kerucut Ø 20 bawah, Ø 9 atas, tinggi 13
  out += `<polygon points="${cx - 10 * s},${y} ${cx + 10 * s},${y} ${cx + 4.5 * s},${y - 13 * s} ${cx - 4.5 * s},${y - 13 * s}" fill="${fill}"/>`; y -= 13 * s;
  return { svg: out, top: y, h: yBottom - y };
}

const panel = (w, h, inner, bg = C.kraft, id = "") => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}mm" height="${h}mm">` +
  `<g id="pratinjau-bahan"><rect width="${w}" height="${h}" fill="${bg}"/></g><g id="cetak">${inner}</g></svg>\n`;
const write = (name, s) => fs.writeFileSync(path.join(OUT, name), s);
const hr = (x1, x2, y, col = C.ink, w = 0.5) => `<line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke="${col}" stroke-width="${w}"/>`;

// ================= PANEL DEPAN =================
function front() {
  const W = BOX.W, H = BOX.H, cx = W / 2; let g = "";
  g += label("MAHAKARYA STUDIO", 3.6, cx, 18, { anchor: "middle", spacing: 0.3 });
  g += hr(cx - 6, cx + 6, 25, C.ink, 0.5);
  g += label("LAMP 01", 4.2, cx, 36, { anchor: "middle", spacing: 0.28 });
  const t = text("Dhiyanra", F.serif, 17, cx, 54, { anchor: "middle" });
  g += t.svg + hr(t.x0 - 16, t.x0 - 6, 48.5, C.ink, 0.8) + hr(t.x0 + t.w + 6, t.x0 + t.w + 16, 48.5, C.ink, 0.8);
  g += body("lampu meja rakitan  ·  modular table lamp", 3.5, cx, 63, { anchor: "middle" });
  const L = lampSilhouette(cx, 176, 2.6);
  g += L.svg;
  g += body("Ø 20 cm  ·  tinggi 24–46 cm  ·  PLA matte  ·  cetak 3D", 3.2, cx, 190, { anchor: "middle" });
  return panel(W, H, g);
}

// ================= PANEL SAMPING A: ISI PAKET + KODE RAKITAN =================
function icon(kind, x, y, s = 1) {
  // ikon garis 10 mm, hitam arang
  const st = `fill="none" stroke="${C.ink}" stroke-width="0.7" stroke-linejoin="round" stroke-linecap="round"`;
  const T = `transform="translate(${x},${y}) scale(${s})"`;
  switch (kind) {
    case "kap": return `<g ${T}><polygon points="0,10 12,10 9,1 3,1" ${st}/></g>`;
    case "badan": return `<g ${T}><rect x="2" y="0" width="8" height="4" ${st}/><circle cx="6" cy="8" r="3" ${st}/></g>`;
    case "alas": return `<g ${T}><rect x="0" y="6" width="12" height="4" rx="1" ${st}/><line x1="6" y1="6" x2="6" y2="2" ${st}/></g>`;
    case "kit": return `<g ${T}><path d="M1 10c3-6 7 0 10-6" ${st}/><rect x="9" y="0" width="3" height="4" ${st}/></g>`;
    case "kartu": return `<g ${T}><rect x="0" y="1" width="12" height="8" rx="1" ${st}/><line x1="3" y1="4" x2="9" y2="4" ${st}/><line x1="3" y1="6.5" x2="7" y2="6.5" ${st}/></g>`;
    case "led": return `<g ${T}><circle cx="6" cy="4" r="3.5" ${st}/><rect x="4" y="8" width="4" height="2.5" ${st}/></g>`;
    case "putar": return `<g ${T}><path d="M2 6a4 4 0 1 1 1.5 3" ${st}/><polyline points="2,10 2,6 6,6" ${st}/></g>`;
    case "daur": return `<g ${T}><path d="M6 1l3 5H3z M2 11l3-5 M10 11l-3-5 M3 11h6" ${st}/></g>`;
    case "pin": return `<g ${T}><path d="M6 11c-3-4-4-5-4-7a4 4 0 0 1 8 0c0 2-1 3-4 7z" ${st}/><circle cx="6" cy="4" r="1.3" ${st}/></g>`;
    case "pla": return `<g ${T}><path d="M6 1c-2 3-4 4-4 6a4 4 0 0 0 8 0c0-2-2-3-4-6z" ${st}/></g>`;
  }
  return "";
}
function sideA(qrSvg) {
  const W = BOX.D, H = BOX.H; let g = "";
  g += label("ISI PAKET", 4.6, 20, 26, { spacing: 0.28 }) + hr(20, 118, 31);
  const rows = [["kap", "1 kap", "Ø 20 cm, ulir M20"], ["badan", "1–3 badan", "bentuk & warna sesuai pesanan"], ["alas", "1 alas", "berpemberat, jalur kabel keluar"], ["kit", "kit kelistrikan", "fitting E27, kabel 1,5 m, saklar (jika dipesan)"], ["kartu", "kartu rakit", "cara rakit, perawatan, garansi cetak 30 hari"]];
  rows.forEach(([ic, a, b], i) => {
    const y = 46 + i * 19;
    g += icon(ic, 20, y - 7) + text(a, F.sans, 4.2, 38, y, {}).svg + body(b, 3.2, 38, y + 5.5, { opacity: 0.85 });
  });
  // Area stiker kode rakitan (stiker 70 × 40 mm, cetak digital per pesanan)
  g += `<rect x="140" y="40" width="80" height="48" rx="2" fill="none" stroke="${C.ink}" stroke-width="0.5" stroke-dasharray="2 1.5"/>`;
  g += label("KODE RAKITAN", 3.4, 180, 58, { anchor: "middle", spacing: 0.25 });
  g += body("stiker per pesanan: kode, warna,", 3, 180, 66, { anchor: "middle", opacity: 0.8 });
  g += body("nama pemesan, tanggal cetak", 3, 180, 71, { anchor: "middle", opacity: 0.8 });
  g += `<g transform="translate(188,102) scale(${32 / 33})">${qrSvg}</g>`;
  g += label("SCAN", 3.2, 182, 112, { anchor: "end", spacing: 0.25 }) + body("cara rakit, bagian", 3, 182, 118, { anchor: "end", opacity: 0.85 }) + body("tambahan, garansi", 3, 182, 123, { anchor: "end", opacity: 0.85 });
  g += hr(20, 220, 170, C.ink, 0.4);
  g += body("Simpan dus ini. Bagian apa pun bisa dikirim balik untuk diganti atau ditukar bentuk.", 3.2, 20, 180);
  g += body("Semua bagian pakai ulir M20 yang sama: bagian yang dibeli belakangan tetap cocok.", 3.2, 20, 186);
  return panel(W, H, g);
}

// ================= PANEL SAMPING B: RAKIT 3 LANGKAH =================
function stepArt(n, x, y) {
  const st = `fill="${C.white}" stroke="${C.ink}" stroke-width="0.6" stroke-linejoin="round"`;
  let g = `<circle cx="${x}" cy="${y}" r="5.5" fill="${C.ink}"/>` + text(String(n), F.sans, 6.5, x, y + 2.3, { anchor: "middle", fill: C.kraft }).svg;
  const yy = y + 14;
  if (n === 1) g += `<rect x="${x - 14}" y="${yy + 22}" width="28" height="7" rx="1" ${st}/><path d="M${x} ${yy + 22}v-6" stroke="${C.ink}" stroke-width="0.6" fill="none"/><path d="M${x + 14} ${yy + 26}c8 0 8 8 16 8" stroke="${C.ink}" stroke-width="0.8" fill="none"/><rect x="${x - 4}" y="${yy + 8}" width="8" height="8" ${st}/>`;
  if (n === 2) g += `<rect x="${x - 14}" y="${yy + 22}" width="28" height="7" rx="1" ${st}/><circle cx="${x}" cy="${yy + 14}" r="8" ${st}/><rect x="${x - 7}" y="${yy - 8}" width="14" height="14" ${st}/><path d="M${x + 14} ${yy + 2}a9 9 0 0 1 0 12" stroke="${C.ink}" stroke-width="0.8" fill="none"/><polygon points="${x + 14},${yy + 16} ${x + 11},${yy + 12} ${x + 17},${yy + 12}" fill="${C.ink}"/>`;
  if (n === 3) g += `<rect x="${x - 14}" y="${yy + 22}" width="28" height="7" rx="1" ${st}/><rect x="${x - 7}" y="${yy + 8}" width="14" height="14" ${st}/><circle cx="${x}" cy="${yy + 2}" r="3.5" ${st}/><polygon points="${x - 20},${yy - 2} ${x + 20},${yy - 2} ${x + 9},${yy - 26} ${x - 9},${yy - 26}" ${st}/>`;
  return g;
}
function sideB() {
  const W = BOX.D, H = BOX.H; let g = "";
  g += label("RAKIT DALAM 3 LANGKAH", 4.6, 20, 26, { spacing: 0.28 }) + hr(20, 220, 31);
  g += body("tanpa alat, tanpa lem", 3.4, 220, 26, { anchor: "end", opacity: 0.85 });
  const xs = [52, 120, 188], names = [["Pasang kit ke alas", "kabel lewat lubang bawah"], ["Putar badan ke alas", "ulir M20, cukup setengah putaran"], ["Pasang kap & bohlam", "LED maks 5 W, fitting E27"]];
  xs.forEach((x, i) => {
    g += stepArt(i + 1, x, 52);
    g += text(names[i][0], F.sans, 4, x, 118, { anchor: "middle" }).svg + body(names[i][1], 3.1, x, 124, { anchor: "middle", opacity: 0.85 });
  });
  g += `<rect x="20" y="146" width="200" height="22" rx="2" fill="none" stroke="${C.ink}" stroke-width="0.5"/>`;
  g += icon("led", 26, 151) + text("Hanya bohlam LED, maksimal 5 watt.", F.sans, 3.8, 44, 156, {}).svg;
  g += body("Bohlam pijar atau halogen panas dan bisa melunakkan PLA. Lap dengan kain kering; jauhkan dari sinar matahari langsung.", 3, 44, 162, { opacity: 0.85 });
  g += body("Bagian tidak pas atau cacat cetak dalam 30 hari? Foto, kirim lewat WhatsApp, kami ganti bagiannya.", 3.2, 20, 186);
  return panel(W, H, g);
}

// ================= PANEL BELAKANG =================
function back() {
  const W = BOX.W, H = BOX.H, cx = W / 2; let g = "";
  g += `<g transform="translate(${cx - 16},18) scale(.32)">${markMK()}</g>`;
  g += wordmark(8.5, cx, 62, { a: C.ink, b: C.ink }, "middle");
  g += text("Redefining where colours & sustainability take shapes", F.sans, 3.4, cx, 70, { anchor: "middle", opacity: 0.85 }).svg;
  g += text("Dicetak sesuai pesanan di Tebet, Jakarta Selatan.", F.serifIt, 7.5, cx, 92, { anchor: "middle" }).svg;
  ["Tiap bagian dicetak 3D dari PLA, plastik berbahan dasar pati tanaman, lapis demi lapis 0,2 mm.", "Disambung ulir M20 tanpa lem, jadi bisa diganti, ditukar bentuk, dan dirakit ulang kapan saja.", "Dus ini kraft tanpa laminasi: bisa didaur ulang bersama kertas, atau dipakai lagi untuk menyimpan bagian."].forEach((s, i) => { g += body(s, 3.3, cx, 104 + i * 6, { anchor: "middle" }); });
  const items = [["pla", "PLA berbasis tanaman"], ["daur", "Dus kraft daur ulang"], ["pin", "Dibuat di Tebet, Jakarta"]];
  items.forEach(([ic, s], i) => { const x = cx - 70 + i * 70; g += `<circle cx="${x}" cy="140" r="9" fill="none" stroke="${C.ink}" stroke-width="0.5"/>` + icon(ic, x - 6, 134) + body(s, 3.1, x, 155, { anchor: "middle" }); });
  g += hr(40, 200, 168, C.ink, 0.4);
  g += body("WhatsApp 0851-1050-4229   ·   Instagram @maha.karyastudioid   ·   mahakaryastudio.github.io/MahaKaryaStudio", 3.1, cx, 177, { anchor: "middle" });
  g += label("LAMP 01 · DHIYANRA", 3, cx, 188, { anchor: "middle", spacing: 0.3, opacity: 0.8 });
  return panel(W, H, g);
}

// ================= TUTUP (ATAS) =================
function lid() {
  const W = BOX.W, D = BOX.D, cx = W / 2; let g = "";
  // Lubang pegangan: 95 × 18 mm, pegangan plastik snap-in (atau die-cut dengan lipatan penguat)
  g += `<rect x="${cx - 47.5}" y="30" width="95" height="18" rx="9" fill="${C.kraftDark}" stroke="${C.white}" stroke-width="0.4"/>`;
  g += label("PEGANGAN", 2.6, cx, 56, { anchor: "middle", spacing: 0.3, fill: C.white, opacity: 0.6 });
  g += `<g transform="translate(${cx - 30},84) scale(.6)">${markMK({ letters: C.white, dot: C.white, base: C.white })}</g>`;
  g += wordmark(10, cx, 168, { a: C.white, b: C.white }, "middle");
  g += text("Redefining where colours & sustainability take shapes", F.sans, 3.8, cx, 178, { anchor: "middle", fill: C.white, opacity: 0.85 }).svg;
  g += label("LAMP 01 · DHIYANRA", 3, cx, 222, { anchor: "middle", spacing: 0.3, fill: C.white, opacity: 0.6 });
  return panel(W, D, g, C.ink);
}

// ================= GAMBAR INSERT & DIMENSI (A3 lanskap, skala 1:2,5) =================
function insertDrawing() {
  const W = 420, H = 297, s = 0.4; let g = "";
  const ln = (x1, y1, x2, y2, w = 0.35, dash) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${C.ink}" stroke-width="${w}"${dash ? ` stroke-dasharray="${dash}"` : ""}/>`;
  const dimH = (x1, x2, y, t) => ln(x1, y, x2, y, 0.3) + `<circle cx="${x1}" cy="${y}" r="0.6" fill="${C.ink}"/><circle cx="${x2}" cy="${y}" r="0.6" fill="${C.ink}"/>` + text(t, F.sans, 3, (x1 + x2) / 2, y + 5, { anchor: "middle" }).svg;
  const dimV = (x, y1, y2, t) => ln(x, y1, x, y2, 0.3) + `<circle cx="${x}" cy="${y1}" r="0.6" fill="${C.ink}"/><circle cx="${x}" cy="${y2}" r="0.6" fill="${C.ink}"/>` + `<g transform="translate(${x - 2},${(y1 + y2) / 2}) rotate(-90)">${text(t, F.sans, 3, 0, 0, { anchor: "middle" }).svg}</g>`;
  g += text("LAMP 01 · Dhiyanra — insert & ukuran dus", F.serif, 8, 16, 20, {}).svg;
  g += body("Skala 1 : 2,5  ·  satuan mm  ·  dus kraft B-flute 3 mm, dua warna cetak (hitam arang + putih opaque)  ·  insert E-flute die-cut", 3.4, 16, 28, { opacity: 0.8 });
  const iw = BOX.iW * s, id = BOX.iD * s, hh = BOX.iH * s, top = 52;
  // --- Lapisan 1 (bawah): alas + kantong kit
  let ox = 16, oy = top;
  g += label("LAPISAN 1 · BAWAH", 3.4, ox, oy - 5, { spacing: 0.25 });
  g += `<rect x="${ox}" y="${oy}" width="${iw}" height="${id}" fill="none" stroke="${C.ink}" stroke-width="0.5"/>`;
  g += `<circle cx="${ox + 80 * s + 5}" cy="${oy + id / 2}" r="${80 * s}" fill="${C.white}" stroke="${C.ink}" stroke-width="0.4"/>` + body("alas Ø maks. 160", 3, ox + 80 * s + 5, oy + id / 2 + 1, { anchor: "middle" });
  g += `<rect x="${ox + iw - 56 * s - 5}" y="${oy + 8}" width="${56 * s}" height="${id - 16}" rx="2" fill="${C.white}" stroke="${C.ink}" stroke-width="0.4" stroke-dasharray="1.5 1"/>`;
  g += `<g transform="translate(${ox + iw - 28 * s - 5},${oy + id / 2}) rotate(-90)">${body("kantong kit 56 × 200", 2.8, 0, 1, { anchor: "middle" })}</g>`;
  g += dimH(ox, ox + iw, oy + id + 6, "228") + dimV(ox - 5, oy, oy + id, "228");
  g += body("Nampan E-flute 5 mm di dasar; pemisah karton 3 mm di atas lapisan ini.", 2.9, ox, oy + id + 16, { opacity: 0.8 });
  // --- Lapisan 2 (atas): kap terbalik + 3 badan
  ox = 150;
  g += label("LAPISAN 2 · ATAS", 3.4, ox, oy - 5, { spacing: 0.25 });
  g += `<rect x="${ox}" y="${oy}" width="${iw}" height="${id}" fill="none" stroke="${C.ink}" stroke-width="0.5"/>`;
  const ccx = ox + iw / 2, ccy = oy + id / 2;
  g += `<circle cx="${ccx}" cy="${ccy}" r="${100 * s}" fill="${C.white}" stroke="${C.ink}" stroke-width="0.4"/>`;
  g += `<circle cx="${ccx}" cy="${ccy}" r="${45 * s}" fill="none" stroke="${C.ink}" stroke-width="0.3" stroke-dasharray="1 1"/>`;
  const r = 40 * s, R = 46.2 * s;
  [90, 210, 330].forEach((a) => { const x = ccx + R * Math.cos((a * Math.PI) / 180), y = ccy + R * Math.sin((a * Math.PI) / 180); g += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}" fill="${C.kraft}" stroke="${C.ink}" stroke-width="0.4"/>`; });
  g += dimH(ox, ox + iw, oy + id + 6, "228");
  g += body("Kap terbalik Ø 200 (garis putus: Ø 90 puncak kap). Tiga badan Ø maks. 80", 2.9, ox, oy + id + 16, { opacity: 0.8 });
  g += body("duduk di cradle E-flute di dalam rongga kap; muat dalam lingkaran Ø 173.", 2.9, ox, oy + id + 21, { opacity: 0.8 });
  // --- Potongan samping
  ox = 286; const yb0 = top + id;
  g += label("POTONGAN SAMPING", 3.4, ox, oy - 5, { spacing: 0.25 });
  g += `<rect x="${ox}" y="${yb0 - hh}" width="${iw}" height="${hh}" fill="none" stroke="${C.ink}" stroke-width="0.5"/>`;
  let yb = yb0;
  const layer = (h, lbl, fill = C.white, inset = 3) => { g += `<rect x="${ox + inset}" y="${yb - h * s}" width="${iw - inset * 2}" height="${h * s}" fill="${fill}" stroke="${C.ink}" stroke-width="0.35"/>`; if (lbl) g += body(lbl, 2.7, ox + iw + 3, yb - (h * s) / 2 + 1, { opacity: 0.85 }); yb -= h * s; };
  layer(5, "nampan 5", C.kraft); layer(30, "alas 30 + kantong kit"); layer(3, "pemisah 3", C.kraft);
  g += `<polygon points="${ox + iw / 2 - 100 * s},${yb - 140 * s} ${ox + iw / 2 + 100 * s},${yb - 140 * s} ${ox + iw / 2 + 45 * s},${yb} ${ox + iw / 2 - 45 * s},${yb}" fill="${C.white}" stroke="${C.ink}" stroke-width="0.35"/>`;
  g += body("kap terbalik 140", 2.7, ox + iw + 3, yb - 70 * s + 1, { opacity: 0.85 }) + body("badan di rongga kap", 2.7, ox + iw + 3, yb - 70 * s + 5, { opacity: 0.85 });
  [-22, 0, 22].forEach((dx) => { g += `<circle cx="${ox + iw / 2 + dx}" cy="${yb - 20 * s - 2}" r="${18 * s}" fill="${C.kraft}" stroke="${C.ink}" stroke-width="0.3"/>`; });
  yb -= 140 * s;
  g += body("ruang 10: kartu + tisu", 2.7, ox + iw + 3, yb - 1.5, { opacity: 0.85 });
  g += dimV(ox - 5, yb0 - hh, yb0, "188") + dimH(ox, ox + iw, yb0 + 6, "228");
  // --- Tabel ukuran & spesifikasi
  ox = 16; oy = top + id + 34;
  g += label("UKURAN & SPESIFIKASI", 3.4, ox, oy, { spacing: 0.25 });
  const rows = [["Luar (P × L × T)", "240 × 240 × 200 mm"], ["Dalam", "228 × 228 × 188 mm"], ["Volumetrik (÷ 6000)", "1,92 kg, masuk tarif 2 kg"], ["Bobot isi + dus", "sekitar 0,9 – 1,5 kg"], ["Bahan dus", "kraft B-flute 3 mm, liner kraft 150 g, tanpa laminasi"], ["Insert", "E-flute die-cut: nampan dasar, pemisah, cradle badan"], ["Cetak", "2 warna: hitam arang (Pantone Black 7 C) + putih opaque"], ["Tutup", "lipat satu lembar, kunci lidah depan, pegangan plastik snap-in 95 × 18"]];
  rows.forEach(([a, b], i) => { const y = oy + 9 + i * 7.5; g += body(a, 3.1, ox, y, { opacity: 0.85 }) + text(b, F.sans, 3.1, ox + 46, y, {}).svg + ln(ox, y + 2.4, ox + 170, y + 2.4, 0.2); });
  // --- Catatan pengiriman
  ox = 210;
  g += label("PENGIRIMAN", 3.4, ox, oy, { spacing: 0.25 });
  ["Dus ini sekaligus dus kirim: bungkus bubble wrap 1 lapis + plastik wrap,", "tanpa karton luar, supaya tetap di tarif 2 kg. Sudut dus diberi pelindung.", "Luar Jawa / rawan banting: tambah karton luar 260 × 260 × 220 (tarif 3 kg).", "", "Pegangan plastik hanya untuk jinjing; saat dikirim pegangan dilipat rata", "atau dilepas dan dimasukkan ke dalam dus.", "", "Stiker kode rakitan 80 × 48 mm ditempel di area putus-putus panel samping A", "sebelum dus ditutup; isinya kode, warna tiap bagian, nama pemesan, tanggal."].forEach((t, i) => { if (t) g += body(t, 3, ox, oy + 9 + i * 5.2, { opacity: 0.9 }); });
  return panel(W, H, g, "#ffffff");
}

// ================= STIKER KODE RAKITAN (80 × 48 mm, cetak digital per pesanan) =================
function sticker() {
  const W = 80, H = 48; let g = "";
  g += `<rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="2" fill="none" stroke="${C.ink}" stroke-width="0.3"/>`;
  g += `<g transform="translate(4,4) scale(.08)">${markMK({ letters: C.ink, dot: C.amber, base: C.ink })}</g>`;
  g += label("KODE RAKITAN", 3, 15, 8, { spacing: 0.25 });
  g += body("MahaKarya Studio · LAMP 01 Dhiyanra", 2.4, 15, 11.5, { opacity: 0.8 });
  g += text("KER-GAD · KUB-BAT · HEK-KRM · BOL-SAL · KOT-BAT", F.sans, 2.6, 4, 17.5, {}).svg;
  const rows = [["Kap", "Kerucut · Gading"], ["Badan", "Kubus · Merah bata, Heksagon · Krem,"], ["", "Bola · Salmon"], ["Alas", "Kotak · Merah bata"], ["Pemesan", "___________________________"], ["Dicetak", "____ / ____ / 20____"]];
  rows.forEach(([a, b], i) => { const y = 23.5 + i * 3.9; if (a) g += label(a.toUpperCase(), 2.2, 4, y, { spacing: 0.2, opacity: 0.8 }); g += body(b, 2.6, 20, y, {}); });
  g += hr(4, W - 4, 43.6, C.ink, 0.2);
  g += body("Garansi cetak 30 hari · WA 0851-1050-4229", 2.2, W - 4, 46.3, { anchor: "end", opacity: 0.8 });
  return panel(W, H, g, "#ffffff");
}

// ================= MOCKUP HTML (CSS 3D) =================
function mockupHtml(svgs) {
  const px = 3; // px per mm
  const face = (svg, w, h, extra) => `<div class="face" style="width:${w * px}px;height:${h * px}px;${extra}">${svg.replace(/width="[\d.]+mm" height="[\d.]+mm"/, `width="${w * px}" height="${h * px}"`)}</div>`;
  const W = BOX.W * px, D = BOX.D * px, H = BOX.H * px;
  return `<!doctype html><meta charset="utf-8"><style>
  body{margin:0;background:#efe9df;width:1600px;height:1100px;overflow:hidden;font-family:sans-serif}
  .bg{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 35%,#f7f3ea 0%,#e9e2d5 60%,#ddd4c4 100%)}
  .scene{position:absolute;left:${(1600 - W) / 2}px;top:${(1100 - H) / 2 - 40}px;width:${W}px;height:${H}px;perspective:2600px;perspective-origin:50% 30%}
  .box{position:absolute;inset:0;transform-style:preserve-3d;transform:rotateX(-18deg) rotateY(-34deg)}
  .face{position:absolute;left:0;top:0;backface-visibility:hidden;box-shadow:inset 0 0 0 1px rgba(0,0,0,.08)}
  .face svg{display:block}
  .shade{position:absolute;inset:0;pointer-events:none}
  .shadow{position:absolute;left:${(1600 - W) / 2 - 120}px;top:${(1100 + H) / 2 - 90}px;width:${W + 420}px;height:170px;background:radial-gradient(ellipse at 50% 50%,rgba(40,30,20,.45),rgba(40,30,20,0) 65%);filter:blur(10px);transform:skewX(-20deg)}
  .handle{position:absolute;left:${(W - 100 * px / 3.3) / 2}px;top:-${14 * px}px;width:${100 * px / 3.3}px;height:${14 * px}px;border:${3.5 * px}px solid #1d1916;border-bottom:none;border-radius:${50 * px / 3.3}px ${50 * px / 3.3}px 0 0;box-sizing:border-box;transform:translateZ(${-D / 2 + 39 * px}px)}
  </style><div class="bg"></div><div class="shadow"></div><div class="scene"><div class="box">
  ${face(svgs.front, BOX.W, BOX.H, `transform:translateZ(${D / 2}px)`)}<div class="shade" style="transform:translateZ(${D / 2 + 1}px);width:${W}px;height:${H}px;background:linear-gradient(90deg,rgba(255,255,255,.06),rgba(0,0,0,.06))"></div>
  ${face(svgs.sideA, BOX.D, BOX.H, `transform:rotateY(90deg) translateZ(${W / 2}px)`)}<div class="shade" style="transform:rotateY(90deg) translateZ(${W / 2 + 1}px);width:${D}px;height:${H}px;background:linear-gradient(90deg,rgba(0,0,0,.22),rgba(0,0,0,.34))"></div>
  ${face(svgs.lid, BOX.W, BOX.D, `top:${(H - D) / 2}px;transform:rotateX(90deg) translateZ(${H / 2}px)`)}<div class="shade" style="top:${(H - D) / 2}px;transform:rotateX(90deg) translateZ(${H / 2 + 1}px);width:${W}px;height:${D}px;background:linear-gradient(180deg,rgba(255,255,255,.10),rgba(255,255,255,.02))"></div>
  <div class="handle"></div>
  </div></div>`;
}

// ================= LEMBAR PANEL (gabungan untuk presentasi) =================
function sheetHtml(svgs) {
  const px = 2.2;
  const cell = (title, svg, w, h) => `<figure style="margin:0"><figcaption style="font:600 13px/1.4 sans-serif;letter-spacing:.14em;color:#2b2622;margin:0 0 8px">${title}</figcaption>${svg.replace(/width="[\d.]+mm" height="[\d.]+mm"/, `width="${w * px}" height="${h * px}"`)}<div style="font:12px sans-serif;color:#6b6258;margin-top:6px">${w} × ${h} mm</div></figure>`;
  return `<!doctype html><meta charset="utf-8"><body style="margin:0;background:#f4efe6;padding:40px;width:1720px;box-sizing:border-box">
  <div style="font:600 26px Georgia,serif;color:#2b2622;margin-bottom:4px">LAMP 01 · Dhiyanra — panel cetak</div><div style="font:14px sans-serif;color:#6b6258;margin-bottom:28px">Kraft B-flute · 2 warna cetak (hitam arang + putih opaque) · teks sudah jadi path · ukuran sebenarnya di file SVG</div>
  <div style="display:grid;grid-template-columns:repeat(3,auto);gap:36px 36px;justify-content:start">
  ${cell("DEPAN", svgs.front, BOX.W, BOX.H)}${cell("SAMPING A · ISI PAKET", svgs.sideA, BOX.D, BOX.H)}${cell("SAMPING B · CARA RAKIT", svgs.sideB, BOX.D, BOX.H)}
  ${cell("BELAKANG", svgs.back, BOX.W, BOX.H)}${cell("TUTUP ATAS", svgs.lid, BOX.W, BOX.D)}</div></body>`;
}

(async () => {
  const qr = await QR.toString("https://mahakaryastudio.github.io/MahaKaryaStudio/#rakit", { type: "svg", margin: 0, errorCorrectionLevel: "M" });
  const qrPath = qr.match(/<path stroke="#000000" d="([^"]+)"/)[1];
  const qrSvg = `<rect x="-2" y="-2" width="37" height="37" fill="${C.white}"/><path stroke="${C.ink}" d="${qrPath}"/>`;
  const svgs = { front: front(), sideA: sideA(qrSvg), sideB: sideB(), back: back(), lid: lid(), insert: insertDrawing() };
  write("panel-depan.svg", svgs.front); write("panel-samping-a-isi.svg", svgs.sideA); write("panel-samping-b-rakit.svg", svgs.sideB);
  write("panel-belakang.svg", svgs.back); write("panel-tutup.svg", svgs.lid); write("insert-dan-ukuran.svg", svgs.insert); write("stiker-kode-rakitan.svg", sticker());
  write("mockup.html", mockupHtml(svgs)); write("lembar-panel.html", sheetHtml(svgs));
  console.log("ok", fs.readdirSync(OUT).length, "file");
})();
