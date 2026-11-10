/*
 * LampArt v3 — satu rig ilustrasi untuk semua lampu di situs (brief v3 §6 Stage, §8).
 *
 * Bentuk bagian (alas → badan → leher → kap) dihitung sekali per lampu dalam satuan lampu
 * (pusat x 160, lantai y 440; tinggi bagian sama dengan v2, jadi totalCm/siluet paket tetap cocok),
 * lalu digambar dalam salah satu mode:
 *
 *  night    (bawaan)  panggung "studio malam" 8 lapis dalam satu <svg>: dinding gradien
 *                     (--stage-wall → --stage-wall-2 di 62%), cahaya dinding + glow kap (× --dim),
 *                     meja (permukaan --stage-table → --stage-table-2 + tepi depan), genangan cahaya,
 *                     bayangan kontak statis, lampu, vinyet; pil "ILUSTRASI" lewat o.pill (HTML).
 *                     Lapisan cahaya memakai style="opacity:var(--dim, n)", jadi --dim pada wadah
 *                     (scroll, saklar) menyalakan/meredupkan tanpa render ulang.
 *  catalog            kertas: tanpa dinding/meja/glow, cahaya kunci kiri-atas, bayangan --catalog-shadow.
 *  drawing            gambar kerja: garis tinta (kelas .sil__s/.sil__f/.sil__l/.sil__p, warna lewat CSS).
 *  thumb              renderer sederhana untuk ≤ 64 px: siluet + warna + glow, tanpa pattern/filter.
 *  matte              cadangan "siluet matte": rig malam, bagian warna rata + rim light, tanpa highlight palsu.
 *
 * Kualitas lampu (night/catalog): kap translusen (tengah .95 → tepi .6) + rim light + titik panas bohlam
 * (gradien hangat, bukan blob putih), garis lapisan cetak 1 px tiap 3 px (.05), spekular kiri-atas,
 * AO di setiap sambungan, elips tutup 0,18 seragam, satu <defs> bersama per SVG dengan id unik (o.uid).
 *
 * API (semua pemanggil v2 tetap jalan):
 *   renderLamp(cfg, o) → string <svg>   cfg = {head:{shape,color[,hex]}, body:[…], base:{…}}
 *     o.uid, o.on (alias o.lit), o.dim, o.explode, o.table, o.vb, o.dims, o.cover   (v2)
 *     o.mode     "night" | "catalog" | "drawing" | "thumb" | "matte"
 *                (tanpa mode: table:false → catalog, selain itu night)
 *     o.variant  "hero" | "hero-hp" | "vitrine" | "studio" | "scene" | "scene-hp" | "final" | "thumb"  (bingkai rig malam)
 *     o.frame    [w, h] bingkai sendiri (rasio + skala), o.floor/o.lampFrac menimpa varian
 *     o.vignette false  (hero tanpa bingkai: tepi dipudarkan lewat mask CSS)
 *     o.layers   "rig" = hanya dinding + meja (tanpa lampu/cahaya), "lamp" = hanya lampu + cahaya + bayangan
 *                (tanpa dinding/meja); dipakai scene #kenapa: satu rig, beberapa lampu ber-crossfade di atasnya
 *     o.wall     false = tanpa dinding (scene tanpa kotak: meja menyatu dengan latar seksi lewat mask CSS)
 *     o.off      opasitas penggelap saat mati (bawaan .45); 0 = siluet rata (matte + hex seragam)
 *     o.dims     true = anotasi ukur (Ø kap + tinggi total). Label ber-atribut data-fit="exact": fitSvgText (lamp.js)
 *                menjaganya tepat 12 px di layar pada skala SVG berapa pun (font-size naik bila SVG mengecil,
 *                transform scale turun bila SVG membesar; font-size atribut tidak pernah < 12)
 *     o.pill     teks pil ILUSTRASI → string = svg + <span class="pill stage__pill" data-stage-pill>
 *     o.ink      warna anotasi terurai (katalog di kertas: "#5b524a"), o.marks false = tanpa anotasi
 *     mode "drawing" + o.explode → gambar kerja terurai dengan .sil__lead / .sil__t dan <g data-la-part>
 *     thumb(cfg, {paper:true}) → thumb katalog di kertas (bayangan --catalog-shadow, tanpa glow)
 *     o.label    aria-label; o.decorative → aria-hidden
 *   thumb(cfg, o), silhouette(spec, uid) → {vb, w, h, svg}, geometry(cfg), anchor(cfg, variant),
 *   partSvg(kind, id, hex, uid), iconSvg(kind, id, uid), totalCm, totalKg, find, hexOf, shadeHex, VARIANTS
 *
 * Struktur rig malam: g.lp-lamp > g.lp-base, g.lp-body, g.lp-neck, g.lp-ao, g.lp-head (kap tanpa nyala),
 * lalu SAUDARA setelah g.lp-head: g[data-la-off] (penggelap seluruh lampu) dan g[data-la-lit] (kap menyala).
 * Sorotan per bagian (mis. #tiga) jangan mengandaikan lapisan nyala berada di dalam .lp-head.
 * Atribut data-la-lit / data-la-off selalu ditulis bernilai ="" supaya string SVG sah sebagai XML.
 */
(function () {
  const D = () => window.MKS_LAMP;
  const CX = 160, FLOOR = 440, W0 = 320, H0 = 520;
  const CAP = 0.18; // elips tutup seragam
  const REF = 334; // tinggi lampu acuan (edisi Senja) dalam satuan lampu, untuk skala per varian
  const find = (list, id) => list.find((x) => x.id === id) || list[0];
  const hexOf = (id) => find(D().colors, id).hex;
  const shadeHex = (id) => find(D().shadeColors, id).hex;
  const r1 = (v) => Math.round(v * 10) / 10;
  const P = (x, y) => `${r1(x)} ${r1(y)}`;
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  /* ---------- warna ---------- */
  const rgb = (h) => {
    let s = String(h || "#888888").trim().replace("#", "");
    if (s.length === 3) s = s.split("").map((c) => c + c).join("");
    const n = parseInt(s.slice(0, 6), 16);
    return isNaN(n) ? [136, 136, 136] : [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  const toHex = (a) => "#" + a.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("");
  const mix = (a, b, t) => { const A = rgb(a), B = rgb(b); return toHex(A.map((v, i) => v + (B[i] - v) * t)); };
  const safeHex = (h) => toHex(rgb(h)); // warna bagian selalu "#rrggbb" sebelum ditulis ke atribut fill
  const lum = (h) => { const [r, g, b] = rgb(h).map((v) => v / 255); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };

  /* ---------- geometri ---------- */
  // Permukaan depan frustum/silinder: busur depan elips atas → busur depan elips bawah
  const frontPath = (rxT, rxB, yT, yB, ryT, ryB) =>
    `M${P(CX - rxT, yT)}L${P(CX - rxB, yB)}A${r1(rxB)} ${r1(ryB)} 0 0 0 ${P(CX + rxB, yB)}L${P(CX + rxT, yT)}A${r1(rxT)} ${r1(ryT)} 0 0 1 ${P(CX - rxT, yT)}Z`;
  // Siluet benda pejal: busur belakang elips atas + sisi + busur depan elips bawah
  const solidPath = (rxT, rxB, yT, yB, ryT, ryB) =>
    `M${P(CX - rxT, yT)}A${r1(rxT)} ${r1(ryT)} 0 0 1 ${P(CX + rxT, yT)}L${P(CX + rxB, yB)}A${r1(rxB)} ${r1(ryB)} 0 0 1 ${P(CX - rxB, yB)}Z`;
  const ellPath = (cx, cy, rx, ry) => `M${P(cx - rx, cy)}A${r1(rx)} ${r1(ry)} 0 1 0 ${P(cx + rx, cy)}A${r1(rx)} ${r1(ry)} 0 1 0 ${P(cx - rx, cy)}Z`;
  const polyPath = (pts) => "M" + pts.map(([x, y]) => P(x, y)).join("L") + "Z";
  const frontArc = (rx, cy, ry) => `M${P(CX - rx, cy)}A${r1(rx)} ${r1(ry)} 0 0 0 ${P(CX + rx, cy)}`;

  /* Setiap bentuk → spesifikasi:
     { h, hw, out (path siluet), caps:[{d, tone}], form: cyl|flat|sph|ring|facet, facets:[{d,tone}],
       spec:{cx,cy,rx,ry}, lines:[d] (garis tinta tambahan untuk gambar kerja), foot, bottom } */
  function bodySpec(id, y) {
    if (id === "bola") {
      const cy = y - 34;
      return { h: 68, hw: 40, out: ellPath(CX, cy, 40, 34), form: "sph", spec: { cx: CX - 15, cy: cy - 14, rx: 13, ry: 8 } };
    }
    if (id === "kubus") {
      const t = y - 58;
      return {
        h: 58, hw: 32,
        out: polyPath([[CX - 32, y], [CX - 32, t + 6], [CX - 28, t], [CX + 28, t], [CX + 32, t + 6], [CX + 32, y]]),
        caps: [{ d: polyPath([[CX - 32, t + 6], [CX - 28, t], [CX + 28, t], [CX + 32, t + 6]]), tone: 0.16 }],
        form: "flat",
        edges: [`M${P(CX - 31.2, t + 6.5)}V${r1(y - 0.8)}`],
      };
    }
    if (id === "cincin") {
      const cy = y - 19;
      return {
        h: 38, hw: 50, out: ellPath(CX, cy, 50, 19), form: "ring",
        caps: [{ d: ellPath(CX, cy - 4, 43, 11), tone: 0.1 }],
        groove: { cx: CX, cy: cy - 3, rx: 22, ry: 4.6 },
        spec: { cx: CX - 22, cy: cy - 9, rx: 13, ry: 4 },
        lines: [ellPath(CX, cy - 3, 22, 4.6)],
      };
    }
    if (id === "heksa") {
      const m = y - 31, t = y - 62;
      const L = [CX - 52, m], TL = [CX - 26, t], TR = [CX + 26, t], R = [CX + 52, m], BR = [CX + 26, y], BL = [CX - 26, y];
      return {
        h: 62, hw: 52, out: polyPath([L, TL, TR, R, BR, BL]), form: "facet",
        facets: [
          { d: polyPath([L, TL, [CX - 10, t], [CX - 18, m]]), tone: 0.16 },
          { d: polyPath([[CX - 18, m], [CX - 10, t], [CX + 10, t], [CX + 18, m]]), tone: 0.1 },
          { d: polyPath([[CX + 18, m], [CX + 10, t], TR, R]), tone: -0.06 },
          { d: polyPath([L, [CX - 18, m], [CX - 10, y], BL]), tone: -0.08 },
          { d: polyPath([[CX - 18, m], [CX + 18, m], [CX + 10, y], [CX - 10, y]]), tone: -0.14 },
          { d: polyPath([[CX + 18, m], R, BR, [CX + 10, y]]), tone: -0.26 },
        ],
        lines: [`M${P(CX - 52, m)}H${r1(CX + 52)}M${P(CX - 10, t)}L${P(CX - 18, m)}L${P(CX - 10, y)}M${P(CX + 10, t)}L${P(CX + 18, m)}L${P(CX + 10, y)}`],
      };
    }
    // silinder
    const ry = 34 * CAP, yT = y - 50 + ry, yB = y - ry;
    return {
      h: 50, hw: 34, out: solidPath(34, 34, yT, yB, ry, ry), form: "cyl",
      caps: [{ d: ellPath(CX, yT, 34, ry), tone: 0.16 }],
      spec: { cx: CX - 19, cy: y - 28, rx: 5, ry: 14 },
    };
  }

  function baseSpec(id, y) {
    if (id === "kotak") {
      const t = y - 30, f = y - 22;
      return {
        h: 26, hw: 72,
        out: polyPath([[CX - 72, y], [CX - 72, f], [CX - 66, t], [CX + 66, t], [CX + 72, f], [CX + 72, y]]),
        caps: [{ d: polyPath([[CX - 72, f], [CX - 66, t], [CX + 66, t], [CX + 72, f]]), tone: 0.16 }],
        form: "flat",
        edges: [`M${P(CX - 71.2, f + 0.6)}V${r1(y - 0.8)}`],
        foot: { cy: y - 4, rx: 74, ry: 7 }, bottom: y,
      };
    }
    if (id === "segitiga") {
      const s = y - 8, pk = y - 30, ridge = CX + 14;
      return {
        h: 26, hw: 88,
        out: polyPath([[CX - 88, y], [CX - 88, s], [CX, pk], [CX + 88, s], [CX + 88, y]]),
        facets: [
          { d: polyPath([[CX - 88, s], [CX, pk], [ridge, s]]), tone: 0.12 },
          { d: polyPath([[ridge, s], [CX, pk], [CX + 88, s]]), tone: -0.2 },
          { d: polyPath([[CX - 88, s], [CX + 88, s], [CX + 88, y], [CX - 88, y]]), tone: -0.12 },
        ],
        form: "flat",
        lines: [`M${P(CX - 88, s)}H${r1(CX + 88)}M${P(CX, pk)}L${P(ridge, s)}`],
        foot: { cy: y - 4, rx: 90, ry: 8 }, bottom: y,
      };
    }
    if (id === "bunga") {
      const flower = (cy) => {
        const pts = [];
        for (let i = 0; i < 64; i++) {
          const a = (i / 64) * Math.PI * 2, r = 64 + 12 * Math.cos(8 * a);
          pts.push([CX + Math.cos(a) * r, cy + Math.sin(a) * r * 0.22]);
        }
        return polyPath(pts);
      };
      const top = y - 20;
      return {
        h: 26, hw: 76,
        out: flower(top) + flower(top + 10) + `M${P(CX - 76, top)}H${r1(CX + 76)}V${r1(top + 10)}H${r1(CX - 76)}Z`,
        under: [{ d: flower(top + 10), tone: -0.3 }, { d: flower(top + 5), tone: -0.16 }],
        caps: [{ d: flower(top), tone: 0.12 }],
        form: "cyl",
        draw: [["sil__s", flower(top + 10)], ["sil__f", `M${P(CX - 76, top)}H${r1(CX + 76)}V${r1(top + 10)}H${r1(CX - 76)}Z`], ["sil__l", `M${P(CX - 76, top)}V${r1(top + 10)}M${P(CX + 76, top)}V${r1(top + 10)}`], ["sil__s", flower(top)]],
        foot: { cy: y - 10, rx: 76, ry: 17 }, bottom: y + 7,
      };
    }
    // bulat: cakram silinder (ry 14 = 78 × 0,18)
    const yT = y - 22, yB = y - 8;
    return {
      h: 26, hw: 78, out: solidPath(78, 78, yT, yB, 14, 14), form: "cyl",
      caps: [{ d: ellPath(CX, yT, 78, 14), tone: 0.14 }],
      spec: { cx: CX - 52, cy: y - 14, rx: 10, ry: 4 },
      foot: { cy: yB, rx: 78, ry: 14 }, bottom: y + 6,
    };
  }

  // Kap: permukaan depan, bukaan atas (dinding dalam terlihat), plisir/rusuk, rim bawah
  function headSpec(id, y) {
    if (id === "kerucut") {
      const h = 104, rxT = 46, rxB = 72, ryT = rxT * CAP, ryB = rxB * CAP;
      const yT = y - h + ryT, yB = y - ryB;
      const pleats = [];
      for (let k = 0; k < 20; k++) {
        const a = -Math.PI / 2 + ((k + 0.5) / 20) * Math.PI, s = Math.sin(a), c = Math.cos(a);
        pleats.push({ x1: CX + rxT * s, y1: yT + ryT * c, x2: CX + rxB * s, y2: yB + ryB * c });
      }
      return {
        h, hw: rxB, rxT, rxB, yT, yB, ryT, ryB,
        front: frontPath(rxT, rxB, yT, yB, ryT, ryB), out: solidPath(rxT, rxB, yT, yB, ryT, ryB),
        open: ellPath(CX, yT, rxT, ryT), inner: ellPath(CX, yT + 0.6, rxT - 2.2, ryT - 1.2),
        rimB: frontArc(rxB, yB, ryB), rimT: frontArc(rxT, yT, ryT), pleats,
      };
    }
    if (id === "kotak") {
      const h = 104, t = y - h, f = y - 94;
      const ribs = [];
      for (let yy = f + 5; yy < y - 3; yy += 7) ribs.push({ x1: CX - 55, y1: yy, x2: CX + 55, y2: yy });
      return {
        h, hw: 56, rxT: 52, rxB: 56, yT: f, yB: y, ryT: 0, ryB: 0, box: true,
        front: polyPath([[CX - 56, f], [CX + 56, f], [CX + 56, y], [CX - 56, y]]),
        out: polyPath([[CX - 56, y], [CX - 56, f], [CX - 52, t], [CX + 52, t], [CX + 56, f], [CX + 56, y]]),
        open: polyPath([[CX - 56, f], [CX - 52, t], [CX + 52, t], [CX + 56, f]]),
        inner: polyPath([[CX - 52.5, f - 1.2], [CX - 49.5, t + 1.6], [CX + 49.5, t + 1.6], [CX + 52.5, f - 1.2]]),
        rimB: `M${P(CX - 56, y)}H${r1(CX + 56)}`, rimT: `M${P(CX - 56, f)}H${r1(CX + 56)}`, pleats: ribs, ribs: true,
      };
    }
    // plisir: silinder berlipit
    const h = 110, rx = 60, ry = rx * CAP, yT = y - h + ry, yB = y - ry;
    const pleats = [];
    for (let k = 0; k < 26; k++) {
      const a = -Math.PI / 2 + ((k + 0.5) / 26) * Math.PI, s = Math.sin(a), c = Math.cos(a);
      pleats.push({ x1: CX + rx * s, y1: yT + ry * c, x2: CX + rx * s, y2: yB + ry * c });
    }
    return {
      h, hw: rx, rxT: rx, rxB: rx, yT, yB, ryT: ry, ryB: ry,
      front: frontPath(rx, rx, yT, yB, ry, ry), out: solidPath(rx, rx, yT, yB, ry, ry),
      open: ellPath(CX, yT, rx, ry), inner: ellPath(CX, yT + 0.6, rx - 2.4, ry - 1.4),
      rimB: frontArc(rx, yB, ry), rimT: frontArc(rx, yT, ry), pleats,
    };
  }

  // Susun alas → badan → leher → kap. explode: jarak antarkelompok (gambar "Tiga bagian")
  function stack(cfg, explode) {
    const gap = explode ? 34 : 0;
    let y = FLOOR;
    const base = baseSpec(cfg.base.shape, y);
    base.hex = safeHex(cfg.base.hex || hexOf(cfg.base.color));
    base.kind = "base";
    base.y = y;
    const baseTop = y - base.h;
    y -= base.h + gap;
    const bodyBottom = y;
    const bodies = cfg.body.map((p) => {
      const s = bodySpec(p.shape, y);
      s.hex = safeHex(p.hex || hexOf(p.color));
      s.kind = "body";
      s.y = y;
      y -= s.h;
      return s;
    });
    const bodyTop = y;
    y -= gap;
    const neck = { y, top: y - 16 };
    y -= 16;
    const head = headSpec(cfg.head.shape, y);
    head.hex = safeHex(cfg.head.hex || shadeHex(cfg.head.color));
    head.kind = "head";
    head.y = y;
    const headBottom = y, headTop = y - head.h;
    const hw = Math.max(base.hw, head.hw, ...bodies.map((b) => b.hw));
    // Sambungan (AO): alas–badan, antarbadan, badan–leher, leher–kap
    const joints = [];
    if (!explode) {
      joints.push({ y: baseTop, rx: Math.min(bodies.length ? bodies[0].hw : 30, base.hw) * 0.62 });
      for (let i = 1; i < bodies.length; i++) joints.push({ y: bodies[i].y, rx: Math.min(bodies[i].hw, bodies[i - 1].hw) * 0.55 });
      joints.push({ y: bodyTop, rx: 14 });
      joints.push({ y: headBottom, rx: 12 });
    }
    return {
      base, bodies, neck, head, hw, joints, baseTop, bodyBottom, bodyTop, headBottom, headTop,
      top: headTop, bottom: base.bottom, foot: base.foot,
      shadeCy: (head.yT + head.yB) / 2,
    };
  }

  function totalCm(cfg) {
    let c = 3 + 2 + find(D().heads, cfg.head.shape).cm;
    cfg.body.forEach((b) => (c += find(D().bodies, b.shape).cm));
    return c;
  }
  function totalKg(cfg) {
    let k = 0.42 + 0.22;
    cfg.body.forEach((b) => (k += find(D().bodies, b.shape).kg));
    return k;
  }

  /* ---------- bingkai panggung malam per varian ----------
     r = lebar/tinggi bingkai (rasio tersempit; wadah lebih lebar menampilkan dinding/meja ekstra),
     fl = lantai (dasar lampu) sebagai fraksi tinggi, lf = tinggi lampu acuan / tinggi bingkai,
     fe = tepi depan meja. Skala cm→px tetap per varian: lampu tinggi tampak lebih tinggi. */
  const VARIANTS = {
    stage: { r: 0.8, fl: 0.78, lf: 0.6, fe: 0.9 },
    hero: { r: 0.8, fl: 0.78, lf: 0.62, fe: 0.9 }, // 588 × 735: Senja ±455 px
    // 390 × 440: lampu Senja y ±114–340 (brief: 80–330; puncak diturunkan agar kap punya ±12 px udara di bawah pil 78–102 / saklar 68–112)
    "hero-hp": { r: 0.8, fl: 340 / 440, lf: 226 / 440, fe: 0.88 },
    // 690 × 780 (HP 390 × 360): lampu ±62% tinggi (Kebun 484 px pada 780), lantai di 78%
    vitrine: { r: 690 / 780, fl: 0.78, lf: 0.656, fe: 0.9 },
    studio: { r: 690 / 800, fl: 0.78, lf: 0.6, fe: 0.9 },
    // #kenapa: scene tanpa kotak 486 × 560, lampu Kebun ±420 px (y 64–484); HP 350 × 260, lampu ±212 px (y 18–230)
    scene: { r: 486 / 560, fl: 484 / 560, lf: 0.793, fe: 0.955 },
    "scene-hp": { r: 350 / 260, fl: 230 / 260, lf: 0.862, fe: 0.965 },
    final: { r: 420 / 480, fl: 0.78, lf: 0.6, fe: 0.9 },
    thumb: { r: 0.8, fl: 0.8, lf: 0.66, fe: 0.92 },
  };
  function frameOf(o) {
    const v = Object.assign({}, VARIANTS[o.variant] || VARIANTS.stage);
    if (Array.isArray(o.frame) && o.frame[0] > 0 && o.frame[1] > 0) v.r = o.frame[0] / o.frame[1];
    if (o.floor) v.fl = o.floor;
    if (o.lampFrac) v.lf = o.lampFrac;
    const Hf = REF / v.lf, top = FLOOR - v.fl * Hf, W = v.r * Hf;
    return { Hf, top, W, x: CX - W / 2, fe: top + v.fe * Hf, v };
  }
  // Pusat kap dalam % bingkai (untuk --gx/--gy)
  function anchor(cfg, variant) {
    const L = stack(cfg), f = frameOf({ variant });
    return { gx: r1(((CX - f.x) / f.W) * 100), gy: r1(((L.shadeCy - f.top) / f.Hf) * 100) };
  }

  /* ---------- <defs> bersama (id unik per SVG) ---------- */
  const stop = (o, c, a) => `<stop offset="${o}" stop-color="${c}"${a == null || a === 1 ? "" : ` stop-opacity="${a}"`}/>`;
  const vstop = (o, v, fb) => `<stop offset="${o}" style="stop-color:var(${v},${fb})"/>`;
  function defs(u, need) {
    let s = "<defs>";
    // bentuk: cahaya kunci 45° kiri-atas
    s += `<linearGradient id="${u}-fc" x1="0" x2="1" y1="0" y2="0">${stop(0, "#fff", 0.16)}${stop(0.2, "#fff", 0.05)}${stop(0.46, "#000", 0)}${stop(0.8, "#000", 0.2)}${stop(1, "#000", 0.38)}</linearGradient>`;
    s += `<linearGradient id="${u}-ff" x1="0" x2="1" y1="0" y2="0">${stop(0, "#fff", 0.07)}${stop(0.5, "#000", 0)}${stop(1, "#000", 0.16)}</linearGradient>`;
    s += `<radialGradient id="${u}-fs" cx=".4" cy=".34" r=".72" fx=".34" fy=".27">${stop(0, "#fff", 0.2)}${stop(0.32, "#fff", 0.03)}${stop(0.62, "#000", 0.06)}${stop(0.9, "#000", 0.3)}${stop(1, "#000", 0.42)}</radialGradient>`;
    s += `<radialGradient id="${u}-sp">${stop(0, "#fff", 0.22)}${stop(1, "#fff", 0)}</radialGradient>`;
    s += `<radialGradient id="${u}-ao">${stop(0, "#000", 0.42)}${stop(0.6, "#000", 0.16)}${stop(1, "#000", 0)}</radialGradient>`;
    if (need.lines) s += `<pattern id="${u}-ln" width="6" height="2.25" patternUnits="userSpaceOnUse"><rect width="6" height=".75" fill="#000" fill-opacity=".05"/></pattern>`;
    if (need.lit) {
      // kap menyala: translusen tengah .95 → tepi .6, gradasi vertikal, titik panas bohlam, rim
      s += `<linearGradient id="${u}-sl" x1="0" x2="1" y1="0" y2="0">${stop(0, "#e8963f", 0.6)}${stop(0.2, "#ffcf86", 0.82)}${stop(0.5, "#fff0cf", 0.95)}${stop(0.8, "#ffcf86", 0.82)}${stop(1, "#dd8a38", 0.58)}</linearGradient>`;
      s += `<linearGradient id="${u}-sv" x1="0" x2="0" y1="0" y2="1">${stop(0, "#8a4415", 0.32)}${stop(0.4, "#8a4415", 0)}${stop(0.82, "#fff3d6", 0)}${stop(1, "#fff3d6", 0.3)}</linearGradient>`;
      s += `<radialGradient id="${u}-hs">${stop(0, "#fff7e2", 0.62)}${stop(0.34, "#ffe6b4", 0.4)}${stop(0.7, "#ffcf8a", 0.12)}${stop(1, "#ffc878", 0)}</radialGradient>`;
      s += `<linearGradient id="${u}-wm" x1="0" x2="0" y1="0" y2="1">${stop(0, "#ffbd70", 0.42)}${stop(0.42, "#ffbd70", 0)}</linearGradient>`;
      s += `<radialGradient id="${u}-gl">${stop(0, "#ffbe6e", 0.5)}${stop(0.38, "#ffaa50", 0.12)}${stop(0.62, "#ffaa50", 0)}</radialGradient>`;
      s += `<radialGradient id="${u}-bl">${stop(0, "#ffd696", 0.3)}${stop(0.55, "#ffc778", 0.1)}${stop(1, "#ffc778", 0)}</radialGradient>`;
    }
    if (need.night) {
      const f = need.night;
      s += `<linearGradient id="${u}-wa" gradientUnits="userSpaceOnUse" x1="0" x2="0" y1="${r1(f.top)}" y2="${r1(f.top + f.Hf)}">${vstop(0, "--stage-wall", "#2a2019")}${vstop(0.62, "--stage-wall-2", "#1a130e")}${vstop(1, "--dark-bg", "#15100c")}</linearGradient>`;
      s += `<radialGradient id="${u}-wl">${stop(0, "#f2a33a", 0.24)}${stop(0.55, "#f2a33a", 0.08)}${stop(1, "#f2a33a", 0)}</radialGradient>`;
      s += `<linearGradient id="${u}-tt" gradientUnits="userSpaceOnUse" x1="0" x2="0" y1="${r1(f.J)}" y2="${r1(f.fe)}">${vstop(0, "--stage-table", "#2e2219")}${vstop(1, "--stage-table-2", "#1b140f")}</linearGradient>`;
      s += `<linearGradient id="${u}-tf" gradientUnits="userSpaceOnUse" x1="0" x2="0" y1="${r1(f.fe)}" y2="${r1(f.fe + f.Hf * 0.12)}">${vstop(0, "--stage-table-2", "#1b140f")}${vstop(1, "--dark-bg", "#15100c")}</linearGradient>`;
      s += `<radialGradient id="${u}-pl">${stop(0, "#ffcc80", 0.42)}${stop(0.5, "#ffbe6e", 0.15)}${stop(1, "#ffbe6e", 0)}</radialGradient>`;
      s += `<clipPath id="${u}-tc"><rect x="${r1(f.x - f.W * 2)}" y="${r1(f.J)}" width="${r1(f.W * 5)}" height="${r1(f.Hf * 2)}"/></clipPath>`;
      // vinyet radial(120% 90% at 50% 40%): elips dalam ruang pengguna, di luar bingkai tetap .45 (pad)
      if (f.vig) s += `<radialGradient id="${u}-vg" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="1" gradientTransform="translate(${r1(CX)} ${r1(f.top + f.Hf * 0.4)}) scale(${r1(f.W * 1.2)} ${r1(f.Hf * 0.9)})">${stop(0.55, "#000", 0)}${stop(1, "#000", 0.45)}</radialGradient>`;
    }
    if (need.cs) s += `<radialGradient id="${u}-cs">${stop(0, need.cs, need.csA)}${stop(0.55, need.cs, need.csA * 0.55)}${stop(1, need.cs, 0)}</radialGradient>`;
    if (need.clip) s += `<clipPath id="${u}-sc"><path d="${need.clip}"/></clipPath>`;
    return s + "</defs>";
  }

  /* ---------- pelukis bagian ---------- */
  const tone = (hex, t) => (t >= 0 ? mix(hex, "#ffffff", t) : mix(hex, "#000000", -t));
  // Satu bagian badan/alas. q: {u, lines, spec, warm (0..1 × --dim), dimVar, matte}
  function paintPart(s, q) {
    const u = q.u, hx = s.hex;
    let g = "";
    if (s.under) s.under.forEach((f) => (g += `<path d="${f.d}" fill="${tone(hx, f.tone)}"/>`));
    g += `<path d="${s.out}" fill="${hx}"/>`;
    if (!q.matte) {
      if (s.facets) s.facets.forEach((f) => (g += `<path d="${f.d}" fill="${tone(hx, f.tone)}"/>`));
      if (s.caps) s.caps.forEach((c) => (g += `<path d="${c.d}" fill="${tone(hx, c.tone)}"/>`));
      if (q.lines) g += `<path d="${s.out}" fill="url(#${u}-ln)"/>`;
      const form = s.form === "sph" || s.form === "ring" ? "fs" : s.form === "flat" || s.form === "facet" ? "ff" : "fc";
      g += `<path d="${s.out}" fill="url(#${u}-${form})"/>`;
      if (s.groove) g += `<ellipse cx="${r1(s.groove.cx)}" cy="${r1(s.groove.cy)}" rx="${s.groove.rx}" ry="${s.groove.ry}" fill="#000" fill-opacity=".34"/><path d="M${P(s.groove.cx - s.groove.rx, s.groove.cy)}A${s.groove.rx} ${s.groove.ry} 0 0 0 ${P(s.groove.cx + s.groove.rx, s.groove.cy)}" fill="none" stroke="#fff" stroke-opacity=".14" stroke-width="1"/>`;
      if (s.edges) s.edges.forEach((d) => (g += `<path d="${d}" fill="none" stroke="#fff" stroke-opacity=".16" stroke-width="1.2"/>`));
      if (q.spec && s.spec) g += `<ellipse cx="${r1(s.spec.cx)}" cy="${r1(s.spec.cy)}" rx="${s.spec.rx}" ry="${s.spec.ry}" fill="url(#${u}-sp)"/>`;
    } else {
      // siluet matte: warna rata + rim light tipis di sisi kiri-atas
      if (s.caps) s.caps.forEach((c) => (g += `<path d="${c.d}" fill="${tone(hx, 0.08)}"/>`));
      g += `<path d="${s.out}" fill="none" stroke="#ffd9a0" stroke-opacity=".35" stroke-width="1.2"/>`;
    }
    if (q.warm) g += `<path d="${s.out}" fill="url(#${u}-wm)" style="opacity:calc(var(--dim, ${q.dim}) * ${q.warm})"/>`;
    return g;
  }
  function paintNeck(n) {
    const ry = 10 * CAP * 1.6, yT = n.top + ry, yB = n.y - ry;
    return `<path d="${solidPath(10, 10, yT, yB, ry, ry)}" fill="#3a3129"/><path d="M${P(CX - 10, n.y - 6)}h20M${P(CX - 10, n.y - 10.5)}h20" stroke="#000" stroke-opacity=".35" stroke-width=".9"/><path d="M${P(CX - 8.6, yT + 1)}V${r1(yB)}" stroke="#fff" stroke-opacity=".12" stroke-width="1.2"/>`;
  }
  // Kap: lapisan mati (selalu) + lapisan nyala (× --dim). lit: null = tanpa lapisan nyala
  function paintHead(s, q) {
    const u = q.u, hx = s.hex;
    let g = `<path d="${s.out}" fill="${hx}"/>`;
    // dinding dalam lewat bukaan atas (gelap saat mati)
    g += `<path d="${s.open}" fill="${mix(hx, "#ffffff", 0.2)}"/><path d="${s.inner}" fill="${mix(hx, "#3a2a1c", 0.55)}"/>`;
    if (!q.matte) {
      g += `<path d="${s.front}" fill="url(#${u}-fc)"/>`;
      const pl = s.pleats.map((p) => `M${P(p.x1, p.y1)}L${P(p.x2, p.y2)}`).join("");
      g += `<path d="${pl}" stroke="#000" stroke-opacity="${s.ribs ? 0.09 : 0.08}" stroke-width="${s.ribs ? 1.1 : 1.2}" fill="none"/>`;
      g += `<path d="${s.rimB}" fill="none" stroke="#000" stroke-opacity=".18" stroke-width="1.2"/>`;
    } else {
      g += `<path d="${s.out}" fill="none" stroke="#ffd9a0" stroke-opacity=".35" stroke-width="1.2"/>`;
    }
    return g;
  }
  function paintHeadLit(s, q) {
    const u = q.u;
    const even = [], odd = [];
    s.pleats.forEach((p, k) => (k % 2 ? odd : even).push(`M${P(p.x1, p.y1)}L${P(p.x2, p.y2)}`));
    const midX = CX, rxA = (s.rxT + s.rxB) / 2;
    const hsY = s.yB - (s.yB - s.yT) * 0.36, hsRx = rxA * 0.62, hsRy = (s.yB - s.yT) * 0.44;
    let g = `<path d="${s.front}" fill="url(#${u}-sl)"/>`;
    g += `<g clip-path="url(#${u}-sc)"><ellipse cx="${r1(midX)}" cy="${r1(hsY)}" rx="${r1(hsRx)}" ry="${r1(hsRy)}" fill="url(#${u}-hs)"/></g>`;
    g += `<path d="${s.front}" fill="url(#${u}-sv)"/>`;
    if (!q.matte) {
      g += `<path d="${even.join("")}" stroke="#94531f" stroke-opacity="${s.ribs ? 0.16 : 0.14}" stroke-width="${s.ribs ? 1.2 : 1.5}" fill="none"/>`;
      g += `<path d="${odd.join("")}" stroke="#fff8e8" stroke-opacity=".2" stroke-width="1" fill="none"/>`;
    }
    // dinding dalam terang + rim atas/bawah 1 px
    g += `<path d="${s.inner}" fill="#ffe9bd" fill-opacity=".92"/>`;
    g += `<path d="${s.rimT}" fill="none" stroke="#fff6dc" stroke-opacity=".75" stroke-width="1"/>`;
    g += `<path d="${s.rimB}" fill="none" stroke="#fff1c8" stroke-opacity=".9" stroke-width="1.3"/>`;
    return g;
  }

  /* ---------- renderer utama ---------- */
  function renderLamp(cfg, o = {}) {
    const u = o.uid || "l";
    const on = o.lit != null ? o.lit !== false : o.on !== false;
    const mode = o.mode || (o.table === false ? "catalog" : "night");
    if (mode === "thumb") return renderThumb(cfg, Object.assign({}, o, { on }));
    if (mode === "drawing") return renderDrawing(cfg, o);
    const night = mode === "night" || mode === "matte";
    const matte = mode === "matte";
    const dim = !on ? 0 : o.dim == null ? 1 : Math.max(0, Math.min(1, +o.dim));
    const rigOn = o.layers !== "lamp", lampOn = o.layers !== "rig"; // scene #kenapa: rig dan lampu sebagai lapisan terpisah
    const L = stack(cfg, o.explode);
    const H = L.head;
    // Lapisan cahaya: di rig malam mengikuti --dim wadah (fallback o.dim); di katalog nilai tetap
    const dv = (k) => (night && on ? `style="opacity:${k === 1 ? `var(--dim, ${dim})` : `calc(var(--dim, ${dim}) * ${k})`}"` : `opacity="${Math.round(dim * k * 100) / 100}"`);

    // Bingkai & lapisan rig
    let vb, f = null;
    if (night) {
      f = frameOf(o);
      f.J = FLOOR - 30; // garis temu dinding–meja: lampu berdiri di permukaan meja, bukan di garis dinding
      f.vig = o.vignette !== false && rigOn && lampOn;
      vb = o.vb || `${r1(f.x)} ${r1(f.top)} ${r1(f.W)} ${r1(f.Hf)}`;
    } else vb = o.vb || `0 0 ${W0} ${H0}`;

    // bayangan kontak: malam hitam .62; katalog --catalog-shadow (rgba(31,26,22,.18))
    const need = { lines: !matte && lampOn, lit: on && lampOn, night: f, clip: on && lampOn ? H.front : null, cs: !lampOn ? null : night ? "#000" : "#1f1a16", csA: night ? 0.62 : 0.2 };
    const label = o.decorative ? ' aria-hidden="true" focusable="false"' : ` role="img" aria-label="${esc(o.label || "Pratinjau lampu")}"`;
    const anc = night ? { gx: r1(((CX - f.x) / f.W) * 100), gy: r1(((L.shadeCy - f.top) / f.Hf) * 100) } : null;
    let out = `<svg viewBox="${vb}" xmlns="http://www.w3.org/2000/svg"${label}${night || o.cover ? ' overflow="visible"' : ""}${anc ? ` data-la="${mode}" style="--gx:${anc.gx}%;--gy:${anc.gy}%"` : ""}>`;
    out += defs(u, need);

    const big = night ? { x: r1(f.x - f.W * 2), w: r1(f.W * 5) } : null;
    if (night) {
      // 1 dinding
      if (rigOn && o.wall !== false) out += `<rect x="${big.x}" y="${r1(f.top - f.Hf)}" width="${big.w}" height="${r1(f.J - f.top + f.Hf + 1)}" fill="url(#${u}-wa)"/>`;
      // 2 cahaya dinding + glow kap (× --dim)
      if (on && lampOn) out += `<g data-la-lit="" ${dv(1)}><ellipse cx="${CX}" cy="${r1(L.shadeCy + 10)}" rx="${r1(f.W * 0.62)}" ry="${r1(f.Hf * 0.42)}" fill="url(#${u}-wl)"/><ellipse cx="${CX}" cy="${r1(L.shadeCy)}" rx="235" ry="205" fill="url(#${u}-gl)"/></g>`;
      // 3 meja: permukaan + tepi depan
      if (rigOn) {
        out += `<rect x="${big.x}" y="${r1(f.J)}" width="${big.w}" height="${r1(f.fe - f.J)}" fill="url(#${u}-tt)"/>`;
        out += `<rect x="${big.x}" y="${r1(f.J)}" width="${big.w}" height=".8" fill="#f2e7d5" fill-opacity=".05"/>`;
        out += `<rect x="${big.x}" y="${r1(f.fe)}" width="${big.w}" height="${r1(f.Hf * 2)}" fill="url(#${u}-tf)"/>`;
        out += `<rect x="${big.x}" y="${r1(f.fe)}" width="${big.w}" height="1" fill="#f2e7d5" fill-opacity=".08"/>`;
      }
      // 4 genangan cahaya di meja (× --dim)
      if (on && lampOn && !o.explode) out += `<g data-la-lit="" ${dv(1)} clip-path="url(#${u}-tc)"><ellipse cx="${CX}" cy="${r1(L.foot.cy + 6)}" rx="${r1(Math.max(150, L.hw * 2.3))}" ry="${r1(Math.max(30, (f.fe - f.J) * 0.62))}" fill="url(#${u}-pl)"/></g>`;
    }
    if (!lampOn) return out + "</svg>"; // lapisan rig saja
    // 5 bayangan kontak statis
    if (!o.explode) {
      const ft = L.foot;
      out += `<ellipse cx="${CX}" cy="${r1(ft.cy + 3)}" rx="${r1(ft.rx * 1.18 + 8)}" ry="${r1(ft.ry * 1.5 + 7)}" fill="url(#${u}-cs)"/>`;
      if (night) out += `<ellipse cx="${CX}" cy="${r1(ft.cy + 1)}" rx="${r1(ft.rx + 2)}" ry="${r1(ft.ry + 2)}" fill="#000" fill-opacity=".38"/>`;
    }
    // catalog menyala (tombol preset di latar gelap): glow kecil di belakang kap
    if (!night && on) out += `<ellipse cx="${CX}" cy="${r1(L.shadeCy)}" rx="230" ry="240" fill="url(#${u}-gl)" ${dv(1)}/>`;

    // 6 lampu
    const q = { u, lines: !matte, spec: !matte, matte, dim };
    const nb = L.bodies.length;
    const warmOf = (i) => (night && on ? [0.9, 0.55, 0.38][nb - 1 - i] || 0.3 : 0);
    let lamp = `<g class="lp-base" data-la-part="base">${paintPart(L.base, Object.assign({}, q, { warm: night && on ? 0.45 : 0 }))}</g>`;
    lamp += `<g class="lp-body" data-la-part="body">${L.bodies.map((b, i) => paintPart(b, Object.assign({}, q, { warm: warmOf(i) }))).join("")}</g>`;
    lamp += `<g class="lp-neck">${paintNeck(L.neck)}</g>`;
    // AO: bayangan lembut tepat di bawah sambungan + garis 1 px
    if (L.joints.length) lamp += `<g class="lp-ao">${L.joints.map((j) => `<ellipse cx="${CX}" cy="${r1(j.y + 1.2)}" rx="${r1(j.rx)}" ry="${r1(Math.max(1.8, j.rx * 0.14))}" fill="url(#${u}-ao)"/><rect x="${r1(CX - j.rx * 0.7)}" y="${r1(j.y - 0.4)}" width="${r1(j.rx * 1.4)}" height=".8" fill="#000" fill-opacity=".22"/>`).join("")}</g>`;
    let head = paintHead(H, q);
    if (night) {
      // lampu mati / redup: seluruh lampu lebih gelap (brightness .55 saat mati), tanpa filter
      const offK = o.off == null ? 0.45 : Math.max(0, Math.min(1, +o.off));
      const offOp = on ? `style="opacity:calc((1 - var(--dim, ${dim})) * ${offK})"` : `opacity="${offK}"`;
      const outs = [L.base.out, ...L.bodies.map((b) => b.out), H.out, solidPath(10, 10, L.neck.top + 3, L.neck.y - 3, 3, 3)];
      head += `</g><g data-la-off="" fill="#000" ${offOp}>${outs.map((d) => `<path d="${d}"/>`).join("")}`;
    }
    // kap merespons lebih cepat dari glow: pada --dim .35 (awal gulir hero) sudah terbaca menyala redup
    if (on) head += `</g><g data-la-lit="" ${dv(1.5)}>${paintHeadLit(H, q)}`;
    lamp += `<g class="lp-head" data-la-part="head">${head}</g>`;
    out += `<g class="lp-lamp">${lamp}</g>`;
    // mekar lembut di sekitar kap (× --dim)
    if (on && !matte) out += `<g data-la-lit="" ${dv(1)}><ellipse cx="${CX}" cy="${r1(L.shadeCy + 4)}" rx="${r1(H.hw * 1.7)}" ry="${r1(H.h * 0.95)}" fill="url(#${u}-bl)" style="mix-blend-mode:screen"/></g>`;
    // 7 vinyet
    if (night && f.vig) out += `<rect x="${big.x}" y="${r1(f.top - f.Hf)}" width="${big.w}" height="${r1(f.Hf * 3)}" fill="url(#${u}-vg)" pointer-events="none"/>`;

    if (o.explode && o.marks !== false) out += explodeMarks(L, o.ink);
    if (o.dims) out += dimsMarks(L, cfg);
    out += "</svg>";
    if (o.pill) out += `<span class="pill stage__pill" data-stage-pill>${esc(o.pill)}</span>`;
    return out;
  }

  function explodeMarks(L, ink) {
    const lx = CX + 100, H = L.head;
    const hc = (L.headTop + L.headBottom) / 2, bc = (L.bodyTop + L.bodyBottom) / 2;
    const col = esc(ink || "#a89a85");
    const tf = `font-family="DM Mono,monospace" font-size="12" fill="${col}"`;
    return (
      `<g stroke="${col}" stroke-opacity=".6" stroke-dasharray="3 4">` +
      `<line x1="${CX + H.hw + 10}" y1="${r1(hc)}" x2="${lx}" y2="${r1(hc)}"/>` +
      `<line x1="${CX + 56}" y1="${r1(bc)}" x2="${lx}" y2="${r1(bc)}"/>` +
      `<line x1="${CX + 82}" y1="${r1(L.baseTop + 12)}" x2="${lx}" y2="${r1(L.baseTop + 12)}"/>` +
      `<line x1="${CX}" y1="${r1(L.headBottom + 2)}" x2="${CX}" y2="${r1(L.bodyTop - 2)}" stroke-dasharray="2 3"/>` +
      `<line x1="${CX}" y1="${r1(L.bodyBottom + 2)}" x2="${CX}" y2="${r1(L.baseTop - 2)}" stroke-dasharray="2 3"/></g>` +
      `<g ${tf}><text x="${lx + 6}" y="${r1(hc + 4)}">KAP</text><text x="${lx + 6}" y="${r1(bc + 4)}">BADAN</text><text x="${lx + 6}" y="${r1(L.baseTop + 16)}">ALAS</text>` +
      `<text x="${CX + 8}" y="${r1((L.headBottom + L.bodyTop) / 2 + 4)}" font-size="12">ulir M20</text><text x="${CX + 8}" y="${r1((L.bodyBottom + L.baseTop) / 2 + 4)}" font-size="12">ulir M20</text></g>`
    );
  }
  // Anotasi ukur (vitrine #edisi, gambar spesifikasi): garis 1 px --dark-line-strong (#f2e7d5 .45), label DM Mono.
  // "Ø 20 cm" di atas kap (garis selebar kap), tinggi total (dari lamp-data lewat totalCm) di kanan lampu.
  // Label data-fit="exact": fitSvgText (lamp.js) menjaganya tepat 12 px di layar.
  function dimsMarks(L, cfg) {
    const H = L.head, dx = CX + Math.max(112, L.hw + 30), top = L.headTop, cm = totalCm(cfg);
    const yl = r1(top - 14), x1 = r1(CX - H.hw), x2 = r1(CX + H.hw);
    // token --dark-line-strong / --dark-fg-2 lewat style (atribut presentasi sebagai cadangan di luar halaman)
    const ln = 'stroke="#f2e7d5" stroke-opacity=".45" style="stroke:var(--dark-line-strong,rgba(242,231,213,.45));stroke-opacity:1" stroke-width="1" vector-effect="non-scaling-stroke"';
    return (
      `<g class="la-dims" ${ln} fill="none"><path d="M${dx} ${r1(top)}V${FLOOR}M${dx - 6} ${r1(top)}h12M${dx - 6} ${FLOOR}h12"/>` +
      `<path d="M${x1} ${yl}H${x2}M${x1} ${r1(yl - 6)}v12M${x2} ${r1(yl - 6)}v12"/></g>` +
      `<g class="la-dims-t" font-family="DM Mono,monospace" fill="#d9cdb9" style="fill:var(--dark-fg-2,#d9cdb9)"><text data-fit="exact" font-size="12" x="${dx + 10}" y="${r1((top + FLOOR) / 2)}" dominant-baseline="central">≈ ${cm.toFixed(0)} cm</text><text data-fit="exact" font-size="12" x="${CX}" y="${r1(yl - 8)}" text-anchor="middle">Ø 20 cm</text></g>`
    );
  }

  /* ---------- thumb ≤ 64 px: siluet + warna + glow, tanpa pattern/filter ---------- */
  function renderThumb(cfg, o) {
    const u = o.uid || "t", on = (o.lit != null ? o.lit !== false : o.on !== false) && !o.paper, L = stack(cfg), H = L.head;
    const pad = 14, top = L.top - pad - 6, bot = L.bottom + pad;
    const h = bot - top, w = Math.max(L.hw * 2 + pad * 2, h * (o.ratio || 0.8));
    let s = `<svg viewBox="${r1(CX - w / 2)} ${r1(top)} ${r1(w)} ${r1(h)}" xmlns="http://www.w3.org/2000/svg"${o.decorative === false ? ` role="img" aria-label="${esc(o.label || "Pratinjau lampu")}"` : ' aria-hidden="true" focusable="false"'}>`;
    // o.paper: thumb katalog di kertas (baris edisi HP): bayangan --catalog-shadow, tanpa glow
    const paper = !!o.paper;
    s += `<defs>${on && !paper ? `<radialGradient id="${u}-tg">${stop(0, "#ffbe6e", 0.55)}${stop(0.45, "#ffaa50", 0.14)}${stop(1, "#ffaa50", 0)}</radialGradient>` : ""}<radialGradient id="${u}-tcs">${paper ? stop(0, "#1f1a16", 0.26) + stop(1, "#1f1a16", 0) : stop(0, "#000", 0.5) + stop(1, "#000", 0)}</radialGradient></defs>`;
    if (on && !paper) s += `<ellipse cx="${CX}" cy="${r1(L.shadeCy)}" rx="${r1(w * 0.62)}" ry="${r1(h * 0.42)}" fill="url(#${u}-tg)"/>`;
    s += `<ellipse cx="${CX}" cy="${r1(L.foot.cy + 3)}" rx="${r1(L.foot.rx * 1.2)}" ry="${r1(L.foot.ry * 1.6 + 4)}" fill="url(#${u}-tcs)"/>`;
    const part = (p) => (p.under ? p.under.map((x) => `<path d="${x.d}" fill="${tone(p.hex, x.tone)}"/>`).join("") : "") + `<path d="${p.out}" fill="${p.hex}"/>` + (p.caps ? p.caps.map((c) => `<path d="${c.d}" fill="${tone(p.hex, c.tone)}"/>`).join("") : "");
    s += part(L.base) + L.bodies.map(part).join("") + `<rect x="${CX - 10}" y="${r1(L.neck.top)}" width="20" height="16" fill="#3a3129"/>`;
    s += `<path d="${H.out}" fill="${on ? "#ffdc9c" : H.hex}"/><path d="${H.front}" fill="${on ? "#ffe9bf" : mix(H.hex, "#000", 0.06)}"/><path d="${H.inner}" fill="${on ? "#fff3d2" : mix(H.hex, "#3a2a1c", 0.5)}"/>`;
    return s + "</svg>";
  }

  /* ---------- gambar kerja: garis tinta (kelas dipakai #paket dan nanti #tiga) ---------- */
  function drawingParts(L, grouped) {
    const sh = (d) => `<path class="sil__s" d="${d}"/>`;
    let g = "";
    const open = (k) => { if (grouped) g += `<g data-la-part="${k}">`; };
    const close = () => { if (grouped) g += "</g>"; };
    const part = (p) => {
      if (p.draw) { p.draw.forEach(([c, d]) => (g += `<path class="${c}" d="${d}"/>`)); return; }
      g += sh(p.out);
      if (p.caps) p.caps.forEach((c) => (g += sh(c.d)));
      if (p.lines) g += `<path class="sil__l" d="${p.lines.join("")}"/>`;
      if (p.groove) g += sh(ellPath(p.groove.cx, p.groove.cy, p.groove.rx, p.groove.ry));
    };
    open("base");
    part(L.base);
    close();
    open("body");
    L.bodies.forEach(part);
    close();
    open("head");
    g += sh(solidPath(10, 10, L.neck.top + 3, L.neck.y - 3, 3, 3));
    const H = L.head;
    g += sh(H.out) + sh(H.open) + sh(H.inner);
    const pl = H.pleats.filter((_, k) => k % 2 === 0).map((p) => `M${P(p.x1, p.y1)}L${P(p.x2, p.y2)}`).join("");
    g += `<path class="sil__p" d="${pl}"/>`;
    close();
    return g;
  }
  // o.explode: tampilan terurai (#tiga) dengan garis penunjuk + label mono (kelas .sil__lead / .sil__t,
  // warna dari CSS: garis 1 px --ink-2). Kelompok bagian membawa data-la-part untuk sorot baris aktif.
  function renderDrawing(cfg, o) {
    const L = stack(cfg, o.explode);
    const ex = !!o.explode;
    const top = L.top - (ex ? 10 : 2), bot = L.bottom + (ex ? 10 : 2), hw = L.hw + 2;
    const vb = o.vb || (ex ? `${r1(CX - hw - 10)} ${r1(top)} ${r1(hw * 2 + 110)} ${r1(bot - top)}` : `${r1(CX - hw)} ${r1(top)} ${r1(hw * 2)} ${r1(bot - top)}`);
    const label = o.label ? ` role="img" aria-label="${esc(o.label)}"` : ' aria-hidden="true" focusable="false"';
    let marks = "";
    if (ex) {
      const lx = CX + L.hw + 22, H = L.head;
      const hc = (L.headTop + L.headBottom) / 2, bc = (L.bodyTop + L.bodyBottom) / 2, ac = L.baseTop + 12;
      marks =
        `<path class="sil__lead" d="M${P(CX + H.hw + 8, hc)}H${r1(lx)}M${P(CX + 58, bc)}H${r1(lx)}M${P(CX + L.base.hw + 6, ac)}H${r1(lx)}"/>` +
        `<path class="sil__lead sil__lead--thread" d="M${P(CX, L.headBottom + 2)}V${r1(L.bodyTop - 2)}M${P(CX, L.bodyBottom + 2)}V${r1(L.baseTop - 2)}"/>` +
        `<g class="sil__t" font-family="DM Mono,monospace" font-size="12"><text x="${r1(lx + 6)}" y="${r1(hc + 4)}">KAP</text><text x="${r1(lx + 6)}" y="${r1(bc + 4)}">BADAN</text><text x="${r1(lx + 6)}" y="${r1(ac + 4)}">ALAS</text>` +
        `<text x="${CX + 8}" y="${r1((L.headBottom + L.bodyTop) / 2 + 4)}">ulir M20</text><text x="${CX + 8}" y="${r1((L.bodyBottom + L.baseTop) / 2 + 4)}">ulir M20</text></g>`;
    }
    return `<svg class="sil${ex ? " sil--explode" : ""}" viewBox="${vb}" xmlns="http://www.w3.org/2000/svg"${label} data-la="drawing">${drawingParts(L, true)}${marks}</svg>`;
  }
  // Siluet paket (lamp.js #paket): spec {head, body:[…], base} → {vb, w, h, svg}
  function silhouette(spec, uid) {
    const cfg = { head: { shape: spec.head, hex: "#fff" }, body: spec.body.map((shape) => ({ shape, hex: "#fff" })), base: { shape: spec.base, hex: "#fff" } };
    const L = stack(cfg);
    const top = L.top, bottom = L.bottom, hw = L.hw;
    const w = r1(hw * 2), h = r1(bottom - top);
    const vb = `${r1(CX - hw)} ${r1(top)} ${w} ${h}`;
    return { vb, w, h, svg: `<svg class="sil" viewBox="${vb}" style="--sil-w:${w};--sil-h:${h}" aria-hidden="true" focusable="false" data-uid="${esc(uid || "")}">${drawingParts(L)}</svg>` };
  }
  function geometry(cfg) {
    const L = stack(cfg);
    return { top: L.top, bottom: L.bottom, floor: FLOOR, cx: CX, hw: L.hw, shadeCy: L.shadeCy, shadeTop: L.headTop, shadeBottom: L.headBottom, shadeHw: L.head.hw, foot: L.foot, joints: L.joints.map((j) => j.y) };
  }

  /* ---------- satu bagian (kartu katalog, strip, ikon bentuk) ---------- */
  const VB = {
    part: { head: "70 70 180 130", body: "90 100 140 90", base: "40 100 240 90" },
    icon: { head: "70 70 180 130", body: "96 104 128 80", base: "60 108 200 76" },
  };
  function shapeSvg(kind, id, hex, u, lit) {
    const q = { u, lines: true, spec: true, matte: false, dim: 1 };
    if (kind === "head") {
      const s = headSpec(id, 190);
      s.hex = safeHex(hex);
      return { need: { lines: true, lit: !!lit, clip: lit ? s.front : null }, svg: paintHead(s, q) + (lit ? `<g opacity="${lit}">${paintHeadLit(s, q)}</g>` : "") };
    }
    const s = kind === "body" ? bodySpec(id, 178) : baseSpec(id, 166);
    s.hex = safeHex(hex);
    return { need: { lines: true }, svg: paintPart(s, q) };
  }
  function partSvg(kind, id, hex, u) {
    const r = shapeSvg(kind, id, hex, u, 0.35);
    return `<svg viewBox="${VB.part[kind]}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${defs(u, r.need)}${r.svg}</svg>`;
  }
  // Ikon bentuk netral (tombol pilihan bentuk)
  function iconSvg(kind, id, u) {
    const hex = kind === "head" ? "#e9dcc2" : "#c9b79a";
    const r = shapeSvg(kind, id, hex, u, 0);
    return `<svg viewBox="${VB.icon[kind]}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${defs(u, r.need)}${r.svg}</svg>`;
  }

  const thumb = (cfg, o = {}) => renderThumb(cfg, o);
  window.LampArt = { renderLamp, thumb, silhouette, geometry, anchor, partSvg, iconSvg, totalCm, totalKg, find, hexOf, shadeHex, VARIANTS, mix, lum };
})();
