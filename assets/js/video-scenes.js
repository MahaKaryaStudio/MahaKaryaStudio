/*
 * GENERATOR VIDEO PROMO — adegan dan penggambaran ke canvas.
 *
 * Menyusun storyboard dari data website (MKS_LAMP, MKS_PRODUCTS, MKS_CONFIG) lalu
 * menggambar tiap frame ke canvas. Tidak ada server dan tidak ada API: ilustrasi
 * lampu diambil dari LampArt.renderLayers (SVG per bagian), ilustrasi koleksi dari
 * MKSArt, foto asli dari unggahan pengguna atau field `image`/`photos`.
 *
 * API: window.MKSVideo.build(opts) → Promise<{W, H, duration, draw(ctx, t), scenes}>
 *   opts: {template: "lampu"|"koleksi"|"foto"|"teks", format: "9:16"|"1:1"|"16:9"|"3:4",
 *          size: "full"|"light", theme: "dark"|"light", pace: 1 (1 = normal, 0.6 = singkat),
 *          noText, cfg, presetIndex, showPrice, showCode, products: [id], photos: [{img, caption}],
 *          text: {headline, sub, highlight, detail}, cta: {wa, ig, site, trust}}
 * Encoder dan antarmuka ada di video.js.
 */
(function () {
  const rp = (n) => "Rp" + Math.round(n).toLocaleString("id-ID");
  const roundK = (n) => Math.round(n / 1000) * 1000;
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const E = {
    outCubic: (t) => 1 - Math.pow(1 - clamp(t), 3),
    inOut: (t) => ((t = clamp(t)) < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
    outBack: (t) => 1 + 2.2 * Math.pow(clamp(t) - 1, 3) + 1.2 * Math.pow(clamp(t) - 1, 2),
  };
  const seg = (t, a, b) => clamp((t - a) / (b - a));

  const THEMES = {
    dark: { bg: "#15100c", bg2: "#1e1712", fg: "#f2e7d5", muted: "#a89a85", accent: "#f2a33a", accent2: "#c8794a", table: "#2b1f15", tableLine: "#4a3625", wa: "#25d366", waInk: "#0b3d1f", card: "rgba(255,255,255,0.06)" },
    light: { bg: "#faf6ef", bg2: "#f2ebdf", fg: "#1f1a16", muted: "#5b524a", accent: "#c8794a", accent2: "#9c5730", table: "#e6dccb", tableLine: "#d2c4ab", wa: "#25d366", waInk: "#0b3d1f", card: "rgba(31,26,22,0.06)" },
    studio: { bg: "#efede8", bg2: "#e6e3dd", fg: "#1f1a16", muted: "#5b524a", accent: "#c8794a", accent2: "#9c5730", table: "#d8d6d1", tableLine: "#c6c4bf", wa: "#25d366", waInk: "#0b3d1f", card: "rgba(31,26,22,0.06)" },
  };
  const FORMATS = {
    "9:16": { full: [1080, 1920], light: [720, 1280], label: "Tegak 9:16 (Reels, TikTok, Status WA)" },
    "1:1": { full: [1080, 1080], light: [720, 720], label: "Persegi 1:1 (feed Instagram, marketplace)" },
    "16:9": { full: [1920, 1080], light: [1280, 720], label: "Lebar 16:9 (latar hero website, YouTube)" },
    "3:4": { full: [1080, 1440], light: [540, 720], label: "Tegak 3:4 (latar hero versi HP)" },
  };
  const FAM = { serif: '"Fraunces", Georgia, serif', sans: '"Inter", system-ui, sans-serif', mono: '"DM Mono", ui-monospace, monospace' };
  const TAG = { bestseller: "Terlaris", baru: "Baru", hadiah: "Hadiah" };
  const CAT = { vas: "Vas", lampu: "Lampu", pot: "Pot", aksesori: "Aksesori", dinding: "Panel dinding" };

  /* ---------- Gambar ---------- */
  const imgCache = new Map();
  function svgImage(svg) {
    if (imgCache.has(svg)) return imgCache.get(svg);
    const p = new Promise((res, rej) => {
      const img = new Image();
      img.onload = () => res(img);
      img.onerror = () => rej(new Error("SVG tidak bisa dimuat"));
      img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
    });
    imgCache.set(svg, p);
    return p;
  }
  function urlImage(url) {
    if (imgCache.has(url)) return imgCache.get(url);
    const p = new Promise((res, rej) => {
      const img = new Image();
      img.onload = () => res(img);
      img.onerror = () => rej(new Error("Gambar tidak bisa dimuat: " + url));
      img.src = url;
    });
    imgCache.set(url, p);
    return p;
  }
  const sized = (svg, w, h) => svg.replace(/<svg\s/, `<svg width="${w}" height="${h}" `);

  /* ---------- Teks ---------- */
  function font(ctx, F, weight, px, fam = "sans", italic = false) {
    ctx.font = `${italic ? "italic " : ""}${weight} ${Math.round(px)}px ${FAM[fam]}`;
  }
  // Teks dengan penanda *miring aksen*; dibungkus per kata sesuai lebar maksimum.
  // Satu "kata" bisa terdiri dari beberapa segmen (mis. "*WhatsApp*," → segmen aksen + koma biasa).
  function richLines(ctx, F, text, maxW, size, fam = "serif", weight = 600) {
    const words = []; // {segs:[{w, acc}], br}
    let glue = false;
    String(text || "")
      .split(/(\*[^*]+\*)/)
      .forEach((chunk) => {
        if (!chunk) return;
        const acc = chunk.startsWith("*") && chunk.endsWith("*");
        const body = chunk.replace(/^\*|\*$/g, "");
        const pieces = body.split(/(\n| +)/);
        pieces.forEach((pc, idx) => {
          if (pc === "\n") { words.push({ br: true }); glue = false; return; }
          if (!pc) return;
          if (/^ +$/.test(pc)) { glue = false; return; }
          if (glue && words.length && !words[words.length - 1].br) words[words.length - 1].segs.push({ w: pc, acc });
          else words.push({ segs: [{ w: pc, acc }] });
          glue = true;
        });
        glue = !/ $/.test(body) && glue;
      });
    font(ctx, F, weight, size, fam);
    const space = ctx.measureText(" ").width;
    words.forEach((wd) => {
      if (wd.br) return;
      wd.width = 0;
      wd.segs.forEach((sg) => { font(ctx, F, sg.acc ? 400 : weight, size, fam, sg.acc); sg.width = ctx.measureText(sg.w).width; wd.width += sg.width; });
    });
    const lines = [[]];
    let width = 0;
    words.forEach((wd) => {
      if (wd.br) { lines.push([]); width = 0; return; }
      const cur = lines[lines.length - 1];
      if (cur.length && width + space + wd.width > maxW) { lines.push([wd]); width = wd.width; }
      else { cur.push(wd); width += (cur.length > 1 ? space : 0) + wd.width; }
    });
    return { lines, space };
  }
  function textHeight(ctx, F, str, o) {
    if (!str) return 0;
    let { lines } = richLines(ctx, F, str, o.w, o.size, o.fam || "sans", o.weight || 400);
    if (o.maxLines && lines.length > o.maxLines) lines = lines.slice(0, o.maxLines);
    return lines.length * o.size * (o.lh || 1.15);
  }
  /* Blok teks: o = {x, y, w, size, fam, weight, color, accent, align, lh, alpha, maxLines}. Mengembalikan tinggi. */
  function text(ctx, F, str, o) {
    if (!str) return 0;
    const size = o.size, lh = o.lh || 1.15, fam = o.fam || "sans", weight = o.weight || 400;
    let { lines, space } = richLines(ctx, F, str, o.w, size, fam, weight);
    if (o.maxLines && lines.length > o.maxLines) lines = lines.slice(0, o.maxLines);
    ctx.save();
    ctx.globalAlpha = (ctx.globalAlpha || 1) * (o.alpha == null ? 1 : o.alpha);
    ctx.textBaseline = "alphabetic";
    lines.forEach((ln, i) => {
      const total = ln.reduce((s, t) => s + t.width, 0) + Math.max(0, ln.length - 1) * space;
      let x = o.align === "center" ? o.x + o.w / 2 - total / 2 : o.align === "right" ? o.x + o.w - total : o.x;
      const y = o.y + size * 0.78 + i * size * lh;
      ln.forEach((wd) => {
        wd.segs.forEach((sg) => {
          font(ctx, F, sg.acc ? 400 : weight, size, fam, sg.acc);
          ctx.fillStyle = sg.acc ? o.accent || F.c.accent : o.color || F.c.fg;
          ctx.fillText(sg.w, x, y);
          x += sg.width;
        });
        x += space;
      });
    });
    ctx.restore();
    return lines.length * size * lh;
  }
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
  }
  // Pil berlabel; mengembalikan lebarnya
  function pill(ctx, F, label, x, y, o = {}) {
    const size = o.size || 26 * F.s;
    font(ctx, F, o.weight || 600, size, o.fam || "sans");
    const padX = size * 0.8, h = size * 1.9;
    const w = ctx.measureText(label).width + padX * 2 + (o.icon ? h * 0.9 : 0);
    const left = o.align === "center" ? x - w / 2 : o.align === "right" ? x - w : x;
    ctx.save();
    ctx.globalAlpha *= o.alpha == null ? 1 : o.alpha;
    roundRect(ctx, left, y, w, h, h / 2);
    ctx.fillStyle = o.bg || F.c.accent;
    ctx.fill();
    if (o.border) { ctx.strokeStyle = o.border; ctx.lineWidth = 2 * F.s; ctx.stroke(); }
    let tx = left + padX;
    if (o.icon === "wa") { waIcon(ctx, tx + h * 0.35 - size * 0.1, y + h / 2, size * 0.62, o.color || F.c.waInk, o.bg || F.c.accent); tx += h * 0.9; }
    if (o.icon === "ig") { igIcon(ctx, tx + h * 0.35 - size * 0.1, y + h / 2, size * 0.6, o.color || F.c.fg); tx += h * 0.9; }
    ctx.fillStyle = o.color || F.c.waInk;
    ctx.textBaseline = "middle";
    ctx.fillText(label, tx, y + h / 2 + size * 0.05);
    ctx.restore();
    return w;
  }
  // Ikon WhatsApp sederhana: gelembung bulat berekor dengan gagang telepon berwarna latar pil
  function waIcon(ctx, cx, cy, r, color, hole) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.moveTo(-r * 0.95, r * 0.95);
    ctx.lineTo(-r * 0.55, r * 0.25);
    ctx.lineTo(-r * 0.3, r * 0.95);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = hole || "#fff";
    ctx.lineWidth = r * 0.3;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.5, Math.PI * 0.8, Math.PI * 1.95);
    ctx.stroke();
    ctx.restore();
  }
  function igIcon(ctx, cx, cy, r, color) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = r * 0.22;
    roundRect(ctx, cx - r, cy - r, 2 * r, 2 * r, r * 0.55);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.45, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(cx + r * 0.58, cy - r * 0.58, r * 0.13, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  // Logo "Nyala": kap bergaris + titik cahaya (sama dengan tools/build-logo.js) + nama merek
  function logo(ctx, F, x, y, size, o = {}) {
    const k = size / 100;
    ctx.save();
    ctx.translate(x, y);
    ctx.globalAlpha *= o.alpha == null ? 1 : o.alpha;
    ctx.strokeStyle = F.c.accent;
    ctx.lineWidth = 5 * k;
    ctx.lineCap = "round";
    ctx.beginPath();
    for (let i = 0; i < 5; i++) { const yy = (16 + i * 8) * k, w = (30 + i * 8) * k; ctx.moveTo(50 * k - w / 2, yy); ctx.lineTo(50 * k + w / 2, yy); }
    ctx.stroke();
    ctx.fillStyle = F.c.fg;
    ctx.beginPath();
    ctx.arc(50 * k, 66 * k, 9 * k, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = F.c.muted;
    ctx.beginPath();
    ctx.moveTo(30 * k, 88 * k);
    ctx.lineTo(70 * k, 88 * k);
    ctx.stroke();
    if (o.word !== false) {
      const fs = size * 0.46;
      font(ctx, F, 600, fs, "serif");
      ctx.textBaseline = "alphabetic";
      ctx.fillStyle = F.c.fg;
      const bx = size * 1.02, by = size * 0.66;
      ctx.fillText("MahaKarya", bx, by);
      const w1 = ctx.measureText("MahaKarya").width;
      font(ctx, F, 400, fs, "serif", true);
      ctx.fillStyle = F.c.accent;
      ctx.fillText("Studio", bx + w1 + fs * 0.12, by);
    }
    ctx.restore();
  }
  function logoWidth(ctx, F, size) {
    font(ctx, F, 600, size * 0.46, "serif");
    const a = ctx.measureText("MahaKarya").width;
    font(ctx, F, 400, size * 0.46, "serif", true);
    return size * 1.02 + a + size * 0.46 * 0.12 + ctx.measureText("Studio").width;
  }
  // Garis-garis lapisan cetak di latar (dekorasi halus)
  function backdrop(ctx, F, t, o = {}) {
    const { W, H } = F;
    ctx.fillStyle = F.c.bg;
    ctx.fillRect(0, 0, W, H);
    const g = ctx.createRadialGradient(W * (0.5 + 0.08 * Math.sin(t * 0.4)), H * (o.glowY == null ? 0.42 : o.glowY), 0, W * 0.5, H * 0.42, Math.max(W, H) * 0.7);
    g.addColorStop(0, F.theme === "dark" ? "rgba(242,163,58,0.14)" : "rgba(200,121,74,0.12)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    if (o.lines !== false) {
      ctx.save();
      ctx.strokeStyle = F.theme === "dark" ? "rgba(242,231,213,0.045)" : "rgba(31,26,22,0.05)";
      ctx.lineWidth = 2 * F.s;
      const step = 26 * F.s;
      for (let y = (t * 6 * F.s) % step; y < H; y += step) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
      ctx.restore();
    }
  }
  function cover(ctx, img, box, zoom = 1, px = 0.5, py = 0.5) {
    const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
    const k = Math.max(box.w / iw, box.h / ih) * zoom;
    const w = iw * k, h = ih * k;
    ctx.drawImage(img, box.x + (box.w - w) * px, box.y + (box.h - h) * py, w, h);
  }
  function contain(ctx, img, box, zoom = 1) {
    const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
    const k = Math.min(box.w / iw, box.h / ih) * zoom;
    const w = iw * k, h = ih * k;
    ctx.drawImage(img, box.x + (box.w - w) / 2, box.y + (box.h - h) / 2, w, h);
  }

  /* ---------- Tata letak per orientasi ---------- */
  function makeFrame(opts) {
    const fmt = FORMATS[opts.format] || FORMATS["9:16"];
    const [W, H] = fmt[opts.size === "light" ? "light" : "full"];
    const s = Math.min(W, H) / 1080;
    const c = THEMES[opts.theme] || THEMES.dark;
    const portrait = H > W * 1.1, landscape = W > H * 1.1;
    const m = (portrait ? 0.08 : 0.07) * W;
    let lay;
    if (landscape) {
      lay = {
        title: { x: m, y: H * 0.14, w: W * 0.44, h: H * 0.56 },
        foot: { x: m, y: H * 0.72, w: W * 0.44, h: H * 0.2 },
        art: { x: W * 0.56, y: H * 0.1, w: W * 0.38, h: H * 0.8 },
        center: { x: m, y: H * 0.16, w: W - 2 * m, h: H * 0.64 },
      };
    } else if (portrait) {
      // Sisakan ruang untuk antarmuka Reels/TikTok di atas (≈12%) dan bawah (≈20%)
      lay = {
        title: { x: m, y: H * 0.13, w: W - 2 * m, h: H * 0.17 },
        art: { x: m, y: H * 0.3, w: W - 2 * m, h: H * 0.39 },
        foot: { x: m, y: H * 0.7, w: W - 2 * m, h: H * 0.1 },
        center: { x: m, y: H * 0.2, w: W - 2 * m, h: H * 0.58 },
      };
    } else {
      lay = {
        title: { x: m, y: H * 0.07, w: W - 2 * m, h: H * 0.16 },
        art: { x: m, y: H * 0.23, w: W - 2 * m, h: H * 0.46 },
        foot: { x: m, y: H * 0.72, w: W - 2 * m, h: H * 0.2 },
        center: { x: m, y: H * 0.14, w: W - 2 * m, h: H * 0.7 },
      };
    }
    return { W, H, s, c, theme: THEMES[opts.theme] ? opts.theme : "dark", lay, portrait, landscape, m };
  }

  /* ---------- Lampu: lapisan → gambar ---------- */
  async function loadLamp(cfg, F, box) {
    const L3 = window.MKSLamp3D;
    if (L3 && (await L3.ready) && L3.ok) return { mode3d: true, cfg, box, cx: box.x + box.w / 2, floorY: box.y + box.h, h: box.h };
    const A = window.LampArt;
    const probe = A.renderLayers(cfg, { px: 10, table: false });
    const lampTop = (probe.geom.headTop - probe.vy) / probe.vh, lampBot = (probe.geom.floor - probe.vy) / probe.vh;
    const Hi = box.h / (lampBot - lampTop);
    const Wi = Hi * (probe.vw / probe.vh);
    const L = A.renderLayers(cfg, { px: Math.ceil(Wi), table: false, uid: "v" });
    const imgs = {};
    await Promise.all(L.layers.map(async (l) => (imgs[l.id] = await svgImage(l.svg))));
    const x = box.x + box.w / 2 - Wi / 2, y = box.y - lampTop * Hi;
    return { L, imgs, x, y, w: Wi, h: Hi, floorY: y + lampBot * Hi, cx: x + Wi / 2 };
  }
  /* st: {dim 0..1, alpha, build (0..1 kemajuan perakitan, 1 = utuh), dx, dy, zoom} */
  function drawLamp(ctx, F, lamp, st = {}) {
    const dim = st.dim == null ? 1 : st.dim, build = st.build == null ? 1 : st.build;
    if (lamp.mode3d) {
      const z = st.zoom || 1;
      const scale = ctx.getTransform().a || 1;
      const room = st.table !== false;
      const cv = window.MKSLamp3D.render({ cfg: lamp.cfg, lineup: st.lineup, W: F.W, H: F.H, scale, cx: lamp.cx + (st.dx || 0), bottom: lamp.floorY + (st.dy || 0), h: lamp.h * z, w: st.w || F.W * 0.9, dim, build, t: st.t || 0, theme: F.theme, room });
      const L = window.MKSLamp3D.last;
      ctx.save();
      ctx.globalAlpha *= st.alpha == null ? 1 : st.alpha;
      ctx.drawImage(cv, 0, 0, F.W, F.H);
      if (dim > 0.01) {
        // Pendar cahaya di sekitar kap dan kolam hangat di meja (efek 2D aditif)
        ctx.globalCompositeOperation = "lighter";
        const k = (F.theme === "dark" ? 0.75 : F.theme === "studio" ? 0.22 : 0.35) * dim;
        L.lamps.forEach((lp) => {
          const r = lp.hPx * 0.55;
          let g = ctx.createRadialGradient(lp.head.x, lp.head.y, 0, lp.head.x, lp.head.y, r);
          g.addColorStop(0, `rgba(255,200,120,${0.45 * k})`);
          g.addColorStop(0.35, `rgba(255,170,80,${0.16 * k})`);
          g.addColorStop(1, "rgba(255,160,70,0)");
          ctx.fillStyle = g;
          ctx.fillRect(lp.head.x - r, lp.head.y - r, 2 * r, 2 * r);
          if (!room) {
            const rx = lp.hPx * 0.6, ry = rx * 0.22;
            ctx.save();
            ctx.translate(lp.floor.x, lp.floor.y);
            ctx.scale(1, ry / rx);
            g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
            g.addColorStop(0, `rgba(255,190,110,${0.35 * dim})`);
            g.addColorStop(1, "rgba(255,190,110,0)");
            ctx.fillStyle = g;
            ctx.fillRect(-rx, -rx, 2 * rx, 2 * rx);
            ctx.restore();
          }
        });
      }
      if (room) {
        // Vignette tipis agar terasa seperti foto
        ctx.globalCompositeOperation = "source-over";
        const v = ctx.createRadialGradient(F.W / 2, F.H / 2, Math.min(F.W, F.H) * 0.35, F.W / 2, F.H / 2, Math.max(F.W, F.H) * 0.75);
        v.addColorStop(0, "rgba(0,0,0,0)");
        v.addColorStop(1, F.theme === "dark" ? "rgba(0,0,0,0.45)" : F.theme === "studio" ? "rgba(40,35,30,0.12)" : "rgba(40,30,20,0.18)");
        ctx.fillStyle = v;
        ctx.fillRect(0, 0, F.W, F.H);
      }
      ctx.restore();
      return;
    }
    const parts = lamp.L.layers.filter((l) => !["glow", "pool", "head", "headLit"].includes(l.id)).map((l) => l.id).concat(["head"]);
    const n = parts.length;
    const each = (id) => {
      const i = parts.indexOf(id);
      const t = clamp(build * n - i, 0, 1); // tiap bagian mendapat jatah 1/n dari kemajuan
      const e = E.outCubic(t);
      return { a: e, dy: -(1 - e) * lamp.h * 0.18 };
    };
    ctx.save();
    ctx.globalAlpha *= st.alpha == null ? 1 : st.alpha;
    const z = st.zoom || 1;
    const ox = (st.dx || 0) + lamp.cx * (1 - z), oy = (st.dy || 0) + lamp.floorY * (1 - z);
    ctx.translate(ox, oy);
    ctx.scale(z, z);
    const draw = (id, a = 1, dy = 0) => {
      if (a <= 0.002) return;
      const g = ctx.globalAlpha;
      ctx.globalAlpha = g * a;
      ctx.drawImage(lamp.imgs[id], lamp.x, lamp.y + dy, lamp.w, lamp.h);
      ctx.globalAlpha = g;
    };
    draw("glow", dim);
    if (st.table !== false) {
      ctx.fillStyle = F.c.table;
      ctx.fillRect(-F.W * 2, lamp.floorY, F.W * 5, F.H * 3);
      ctx.fillStyle = F.c.tableLine;
      ctx.fillRect(-F.W * 2, lamp.floorY, F.W * 5, 3 * F.s);
    }
    draw("pool", dim);
    parts.forEach((id) => {
      const p = each(id);
      if (id === "head") { draw("head", p.a, p.dy); draw("headLit", p.a * dim, p.dy); }
      else draw(id, p.a, p.dy);
    });
    ctx.restore();
  }
  function describe(cfg) {
    const D = window.MKS_LAMP, A = window.LampArt;
    const h = A.find(D.heads, cfg.head.shape), hc = A.find(D.shadeColors, cfg.head.color);
    const ba = A.find(D.bases, cfg.base.shape), bc = A.find(D.colors, cfg.base.color);
    const lines = [{ k: "Alas", s: ba.name, c: bc.name }];
    cfg.body.forEach((b, i) => lines.push({ k: cfg.body.length > 1 ? `Badan ${i + 1}` : "Badan", s: A.find(D.bodies, b.shape).name, c: A.find(D.colors, b.color).name }));
    lines.push({ k: "Kap", s: h.name, c: hc.name });
    return lines;
  }
  // Harga paket, sama dengan lamp.js (kit kelistrikan termasuk, bohlam tidak)
  function priceOf(cfg) {
    const D = window.MKS_LAMP, A = window.LampArt;
    let sum = A.find(D.heads, cfg.head.shape).price + A.find(D.bases, cfg.base.shape).price;
    cfg.body.forEach((b) => (sum += A.find(D.bodies, b.shape).price));
    const n = cfg.body.length + 2;
    const pkg = D.packages[n] || { name: `${n} bagian`, disc: 0 };
    const disc = sum - roundK(sum * (1 - pkg.disc));
    return { parts: sum, n, pkg, disc, wiring: D.wiringPrice, total: sum - disc + D.wiringPrice, anchor: sum + D.wiringPrice };
  }
  function codeOf(cfg) {
    const k = (s) => s.slice(0, 3).toUpperCase();
    return "MK-" + [k(cfg.head.shape) + k(cfg.head.color), ...cfg.body.map((b) => k(b.shape) + k(b.color)), k(cfg.base.shape) + k(cfg.base.color)].join("-");
  }
  const waPretty = (num) => {
    const d = String(num || "").replace(/\D/g, "");
    if (!d) return "";
    const local = d.startsWith("62") ? "0" + d.slice(2) : d;
    return local.replace(/(\d{4})(\d{4})(\d+)/, "$1-$2-$3");
  };

  /* ---------- Adegan umum ---------- */
  function sceneIntro(F, o) {
    return {
      id: "intro",
      dur: 2.2,
      draw(ctx, t) {
        backdrop(ctx, F, t);
        const size = (F.landscape ? 150 : 130) * F.s;
        const w = logoWidth(ctx, F, size);
        const e = E.outCubic(seg(t, 0.05, 0.9));
        ctx.save();
        ctx.translate(F.W / 2, F.H / 2 - size * 0.5);
        ctx.scale(0.94 + 0.06 * e, 0.94 + 0.06 * e);
        logo(ctx, F, -w / 2, -size * 0.35, size, { alpha: e });
        ctx.restore();
        text(ctx, F, o.eyebrow, { x: F.m, y: F.H / 2 + size * 0.55, w: F.W - 2 * F.m, size: 24 * F.s, weight: 600, color: F.c.accent, align: "center", alpha: seg(t, 0.6, 1.3) });
      },
    };
  }
  function sceneCta(F, o, lamp) {
    const cta = o.cta || {};
    return {
      id: "cta",
      dur: 3.2,
      draw(ctx, t) {
        backdrop(ctx, F, t, { glowY: 0.6 });
        const L = F.lay.center;
        const e1 = seg(t, 0.1, 0.7), e2 = seg(t, 0.5, 1.1), e3 = seg(t, 0.9, 1.5);
        let y = L.y;
        // Lampu sebagai pengingat produk: penuh di kanan (16:9), kecil di sudut (1:1, 9:16)
        if (lamp && F.landscape) drawLamp(ctx, F, lamp, { t, dim: 0.85 + 0.15 * Math.sin(t * 1.5), alpha: e1 * 0.95, table: false });
        const w = F.landscape ? F.lay.title.w : L.w;
        y += text(ctx, F, o.headline || "Pesan lewat WhatsApp", { x: L.x, y, w, size: (F.landscape ? 64 : 68) * F.s, fam: "serif", weight: 600, alpha: e1, lh: 1.08 }) + 24 * F.s;
        if (cta.wa) { pill(ctx, F, waPretty(cta.wa), L.x, y, { size: 32 * F.s, bg: F.c.wa, icon: "wa", alpha: e2, fam: "mono" }); y += 32 * 1.9 * F.s + 18 * F.s; }
        if (cta.ig) { pill(ctx, F, "@" + cta.ig.replace(/^@/, ""), L.x, y, { size: 28 * F.s, bg: F.c.card, color: F.c.fg, icon: "ig", alpha: e2 }); y += 28 * 1.9 * F.s + 18 * F.s; }
        if (cta.site) y += text(ctx, F, cta.site, { x: L.x, y: y + 6 * F.s, w, size: 26 * F.s, fam: "mono", weight: 500, color: F.c.muted, alpha: e3 }) + 16 * F.s;
        if (cta.trust) text(ctx, F, cta.trust, { x: L.x, y: y + 10 * F.s, w, size: 24 * F.s, weight: 500, color: F.c.muted, alpha: e3, lh: 1.35 });
        if (lamp && !F.landscape) drawLamp(ctx, F, lamp, { t, dim: 0.85 + 0.15 * Math.sin(t * 1.5), alpha: e1 * 0.9, table: false, zoom: 0.5, dy: F.H * (F.portrait ? 0.1 : 0.1), dx: F.W * 0.28 });
        logo(ctx, F, F.W - F.m - logoWidth(ctx, F, 56 * F.s), F.H - F.m * 0.9 - 56 * F.s, 56 * F.s, { alpha: e3 * 0.9 });
      },
    };
  }

  /* ---------- Template: lampu rakitan ---------- */
  async function buildLampu(F, o) {
    const D = window.MKS_LAMP;
    const cfg = o.cfg;
    const artBox = o.noText ? { ...F.lay.center, y: F.H * 0.12, h: F.H * 0.74 } : F.lay.art;
    const lamp = await loadLamp(cfg, F, artBox);
    const others = D.presets.map((p, i) => ({ p, i })).filter(({ i }) => i !== o.presetIndex).slice(0, 4);
    const variants = await Promise.all(others.map(({ p }) => loadLamp(p, F, artBox)));
    const parts = describe(cfg);
    const n = parts.length + 1; // + ulir/soket
    const buildDur = 0.5 * n + 0.9;
    const scenes = [];
    const headline = (ctx, t, str, sub, mono) => {
      if (o.noText) return;
      const T = F.lay.title;
      let y = T.y + text(ctx, F, str, { x: T.x, y: T.y, w: T.w, size: (F.landscape ? 60 : 58) * F.s, fam: "serif", weight: 600, alpha: seg(t, 0, 0.5), lh: 1.08, maxLines: F.landscape ? 3 : 2 });
      if (sub) y += 10 * F.s + text(ctx, F, sub, { x: T.x, y: y + 10 * F.s, w: T.w, size: 26 * F.s, weight: 500, color: F.c.muted, alpha: seg(t, 0.3, 0.9), lh: 1.3 });
      if (mono) text(ctx, F, mono, { x: T.x, y: y + 14 * F.s, w: T.w, size: 24 * F.s, fam: "mono", weight: 500, color: F.c.accent, alpha: seg(t, 0.5, 1.1) });
    };
    if (!o.noText) scenes.push(sceneIntro(F, { eyebrow: o.eyebrow }));
    scenes.push({
      id: "rakit",
      dur: buildDur,
      fadeOut: false,
      draw(ctx, t) {
        backdrop(ctx, F, t);
        const build = clamp(t / (0.5 * n));
        drawLamp(ctx, F, lamp, { t, dim: 0, build });
        headline(ctx, t, o.text.headline || "Lampu yang kamu *susun sendiri.*", o.text.sub || "Pilih kap, badan, dan alas satu per satu. Tiap bagian punya bentuk dan warnanya sendiri.");
        if (!o.noText) {
          const Fo = F.lay.foot;
          const size = 24 * F.s, lh = 1.45;
          parts.forEach((p, i) => {
            const a = seg(t, 0.5 * i + 0.25, 0.5 * i + 0.6);
            const y = F.landscape ? Fo.y + i * size * lh : Fo.y + Math.floor(i / 2) * size * lh;
            const x = F.landscape ? Fo.x : Fo.x + (i % 2) * (Fo.w / 2);
            text(ctx, F, `${p.k} · ${p.s} · ${p.c}`, { x, y, w: Fo.w / (F.landscape ? 1 : 2), size, weight: 500, color: F.c.muted, alpha: a });
          });
        }
      },
    });
    const pr = priceOf(cfg);
    const name = o.presetIndex >= 0 ? `Preset “${D.presets[o.presetIndex].name}”` : "Rakitanmu sendiri";
    const cm = window.LampArt.totalCm(cfg).toFixed(0);
    scenes.push({
      id: "nyala",
      dur: 2.8,
      fadeIn: false,
      fadeOut: false,
      draw(ctx, t) {
        backdrop(ctx, F, t);
        drawLamp(ctx, F, lamp, { t, dim: E.inOut(seg(t, 0.15, 1.1)) });
        headline(ctx, t, name, `Tinggi ≈ ${cm} cm · Paket ${pr.pkg.name} (${pr.n} bagian) · bohlam LED E27`, o.showCode ? codeOf(cfg) : "");
      },
    });
    if (variants.length && o.pace >= 0.8) {
      const each = 1.1;
      scenes.push({
        id: "variasi",
        dur: each * variants.length + 0.4,
        fadeIn: false,
        draw(ctx, t) {
          backdrop(ctx, F, t);
          // Pudar dari lampu utama ke tiap preset lain
          const k = Math.min(variants.length, Math.floor(t / each) + 1);
          const prev = k === 1 ? lamp : variants[k - 2];
          const cur = variants[k - 1];
          const f = E.inOut(seg(t - (k - 1) * each, 0, 0.45));
          drawLamp(ctx, F, prev, { t, dim: 1, alpha: 1 - f });
          drawLamp(ctx, F, cur, { t, dim: 1, alpha: f });
          headline(ctx, t, `*${D.heads.length + D.bodies.length + D.bases.length} bentuk* · ${D.colors.length} warna filamen · ${D.shadeColors.length} warna kap`, "Ganti bagian kapan saja. Bagian lama bisa ditukar warna atau bentuk lain.");
        },
      });
    }
    if (lamp.mode3d && D.presets.length > 1) {
      const lineup = D.presets.slice(0, F.portrait ? 3 : 7);
      const rowBox = o.noText ? { x: F.W * 0.05, w: F.W * 0.9 } : F.landscape ? { x: F.W * 0.05, w: F.W * 0.9 } : { x: F.m, w: F.W - 2 * F.m };
      scenes.push({
        id: "deretan",
        dur: 3.6,
        draw(ctx, t) {
          backdrop(ctx, F, t);
          const zoom = 1 + 0.04 * clamp(t / this.dur);
          drawLamp(ctx, F, lamp, { t, dim: 1, lineup, w: rowBox.w * zoom, dy: F.portrait ? F.H * (o.noText ? 0.66 : 0.68) - lamp.floorY : 0 });
          headline(ctx, t, `*${lineup.length} preset* siap kirim, atau susun sendiri`, `Produksi ${D.leadTime.preset} untuk preset, ${D.leadTime.custom} untuk rakitan sendiri.`);
        },
      });
    }
    if (o.showPrice && !o.noText) {
      scenes.push({
        id: "harga",
        dur: 3.2,
        draw(ctx, t) {
          backdrop(ctx, F, t, { glowY: 0.5 });
          const L = F.landscape ? F.lay.title : F.lay.center;
          if (F.landscape) drawLamp(ctx, F, lamp, { t, dim: 1, alpha: seg(t, 0, 0.5), table: false });
          let y = L.y;
          y += text(ctx, F, `Paket ${pr.pkg.name} · ${pr.n} bagian`, { x: L.x, y, w: L.w, size: 26 * F.s, weight: 600, color: F.c.accent, alpha: seg(t, 0, 0.4) }) + 14 * F.s;
          const e = E.outCubic(seg(t, 0.15, 0.8));
          ctx.save();
          ctx.translate(0, (1 - e) * 20 * F.s);
          y += text(ctx, F, rp(pr.total), { x: L.x, y, w: L.w, size: (F.landscape ? 110 : 120) * F.s, fam: "serif", weight: 600, alpha: e, lh: 1 }) + 10 * F.s;
          ctx.restore();
          // Harga satuan (pembanding), dicoret
          font(ctx, F, 500, 30 * F.s, "mono");
          const anchor = `Harga satuan ${rp(pr.anchor)}`;
          const aw = ctx.measureText(anchor).width;
          text(ctx, F, anchor, { x: L.x, y, w: L.w, size: 30 * F.s, fam: "mono", weight: 500, color: F.c.muted, alpha: seg(t, 0.5, 1) });
          ctx.save();
          ctx.globalAlpha *= seg(t, 0.7, 1.2);
          ctx.strokeStyle = F.c.muted;
          ctx.lineWidth = 3 * F.s;
          ctx.beginPath();
          ctx.moveTo(L.x, y + 30 * F.s * 0.55);
          ctx.lineTo(L.x + aw, y + 30 * F.s * 0.55);
          ctx.stroke();
          ctx.restore();
          pill(ctx, F, `Hemat ${Math.round(pr.pkg.disc * 100)}%`, L.x + aw + 20 * F.s, y - 10 * F.s, { size: 24 * F.s, alpha: seg(t, 0.9, 1.4), color: F.c.theme === "dark" ? "#2a1a05" : "#fff" });
          y += 30 * 1.9 * F.s + 10 * F.s;
          y += text(ctx, F, `Termasuk kit kelistrikan ber-SNI/K3L (fitting E27, kabel 1,5 m, saklar, steker). Bohlam LED 5 W +${rp(D.ledPrice)}.`, { x: L.x, y, w: L.w, size: 24 * F.s, weight: 500, color: F.c.muted, alpha: seg(t, 1, 1.5), lh: 1.35 }) + 10 * F.s;
          text(ctx, F, `Produksi ${o.presetIndex >= 0 ? D.leadTime.preset : D.leadTime.custom} · garansi 30 hari cacat cetak`, { x: L.x, y, w: L.w, size: 24 * F.s, weight: 500, color: F.c.muted, alpha: seg(t, 1.2, 1.7), lh: 1.35 });
          if (!F.landscape) drawLamp(ctx, F, lamp, { t, dim: 1, alpha: seg(t, 0.2, 0.8) * 0.9, table: false, zoom: 0.55, dy: F.H * (F.portrait ? 0.14 : 0.1), dx: F.W * 0.26 });
        },
      });
    }
    if (!o.noText) scenes.push(sceneCta(F, { headline: o.text.cta || "Pesan lewat *WhatsApp*, kami cetak dan rakit untukmu.", cta: o.cta }, lamp));
    return scenes;
  }

  /* ---------- Template: koleksi ---------- */
  async function buildKoleksi(F, o) {
    const C = window.MKS_CONFIG;
    const items = (window.MKS_PRODUCTS || []).filter((p) => o.products.includes(p.id));
    const art = F.lay.art;
    const assets = await Promise.all(
      items.map(async (p) => {
        if (p.image) { try { return { p, img: await urlImage(p.image), photo: true }; } catch (_) { /* jatuh ke ilustrasi */ } }
        const svg = window.MKSArt.render({ ...p, image: "" });
        const h = Math.ceil(art.h), w = Math.ceil((h * 200) / 240);
        return { p, img: await svgImage(sized(svg, w, h)), photo: false };
      })
    );
    const scenes = [sceneIntro(F, { eyebrow: o.eyebrow })];
    assets.forEach((a, idx) => {
      const p = a.p;
      scenes.push({
        id: "produk-" + p.id,
        dur: 3 * o.pace + 0.6,
        draw(ctx, t) {
          backdrop(ctx, F, t, { lines: !a.photo });
          const e = E.outCubic(seg(t, 0, 0.6));
          const zoom = 1 + 0.05 * clamp(t / this.dur);
          ctx.save();
          ctx.globalAlpha = e;
          if (a.photo) {
            ctx.save();
            roundRect(ctx, art.x, art.y, art.w, art.h, 28 * F.s);
            ctx.clip();
            cover(ctx, a.img, art, zoom, 0.5, 0.5 - 0.03 * (t / this.dur));
            ctx.restore();
          } else contain(ctx, a.img, art, zoom);
          ctx.restore();
          const T = F.lay.title, Fo = F.lay.foot;
          let y = T.y;
          y += text(ctx, F, `${p.collection ? "Koleksi " + p.collection + " · " : ""}${CAT[p.category] || p.category}`, { x: T.x, y, w: T.w, size: 24 * F.s, weight: 600, color: F.c.accent, alpha: seg(t, 0.1, 0.5) }) + 10 * F.s;
          y += text(ctx, F, p.name, { x: T.x, y, w: T.w, size: (F.landscape ? 64 : 60) * F.s, fam: "serif", weight: 600, alpha: seg(t, 0.2, 0.7), lh: 1.06, maxLines: 2 }) + 10 * F.s;
          if (F.landscape) {
            y += 10 * F.s + text(ctx, F, p.desc, { x: T.x, y: y + 10 * F.s, w: T.w, size: 26 * F.s, weight: 400, color: F.c.muted, alpha: seg(t, 0.4, 0.9), lh: 1.4, maxLines: 4 });
          }
          const fy = F.landscape ? Fo.y : Fo.y;
          let fx = Fo.x;
          text(ctx, F, rp(p.price), { x: fx, y: fy, w: Fo.w, size: 54 * F.s, fam: "serif", weight: 600, alpha: seg(t, 0.4, 0.9), lh: 1 });
          font(ctx, F, 600, 54 * F.s, "serif");
          fx += ctx.measureText(rp(p.price)).width + 20 * F.s;
          const tag = (p.tags || []).map((x) => TAG[x] || x)[0];
          if (tag) pill(ctx, F, tag, fx, fy + 4 * F.s, { size: 22 * F.s, alpha: seg(t, 0.6, 1), color: F.theme === "dark" ? "#2a1a05" : "#fff" });
          text(ctx, F, (p.specs || []).join(" · "), { x: Fo.x, y: fy + 54 * F.s + 14 * F.s, w: Fo.w, size: 24 * F.s, weight: 500, color: F.c.muted, alpha: seg(t, 0.6, 1.1), lh: 1.35, maxLines: 2 });
          text(ctx, F, `${idx + 1}/${assets.length}`, { x: F.W - F.m - 200 * F.s, y: F.H - F.m - 26 * F.s, w: 200 * F.s, size: 22 * F.s, fam: "mono", color: F.c.muted, align: "right", alpha: 0.8 });
        },
      });
    });
    scenes.push(sceneCta(F, { headline: o.text.cta || "Pesan lewat *WhatsApp*. Bisa custom warna dan ukuran.", cta: o.cta }, null));
    return scenes;
  }

  /* ---------- Template: foto ---------- */
  async function buildFoto(F, o) {
    const photos = o.photos || [];
    const scenes = [sceneIntro(F, { eyebrow: o.eyebrow })];
    photos.forEach((ph, idx) => {
      const dur = (o.photoDur || 3) * o.pace + 0.5;
      scenes.push({
        id: "foto-" + idx,
        dur,
        draw(ctx, t) {
          ctx.fillStyle = F.c.bg;
          ctx.fillRect(0, 0, F.W, F.H);
          const u = clamp(t / dur);
          const dir = idx % 2 ? -1 : 1;
          cover(ctx, ph.img, { x: 0, y: 0, w: F.W, h: F.H }, 1.04 + 0.08 * u, 0.5 + dir * 0.06 * (u - 0.5), 0.5 - 0.04 * (u - 0.5));
          if (ph.caption) {
            const g = ctx.createLinearGradient(0, F.H * 0.55, 0, F.H);
            g.addColorStop(0, "rgba(21,16,12,0)");
            g.addColorStop(1, "rgba(21,16,12,0.78)");
            ctx.fillStyle = g;
            ctx.fillRect(0, F.H * 0.55, F.W, F.H * 0.45);
            const fo = F.lay.foot;
            text(ctx, F, ph.caption, { x: fo.x, y: fo.y + (F.portrait ? 0 : fo.h * 0.2), w: fo.w, size: (F.landscape ? 44 : 46) * F.s, fam: "serif", weight: 600, color: "#f2e7d5", alpha: seg(t, 0.2, 0.8), lh: 1.15, maxLines: 3 });
          }
          logo(ctx, F, F.m, F.m, 56 * F.s, { alpha: 0.9 });
        },
      });
    });
    scenes.push(sceneCta(F, { headline: o.text.cta || "Pesan lewat *WhatsApp*, kami cetak dan rakit untukmu.", cta: o.cta }, null));
    return scenes;
  }

  /* ---------- Template: teks / pengumuman ---------- */
  async function buildTeks(F, o) {
    const T = o.text;
    const scenes = [];
    const L = F.lay.center;
    scenes.push({
      id: "judul",
      dur: 3.2,
      draw(ctx, t) {
        backdrop(ctx, F, t);
        const h1 = { x: L.x, w: L.w, size: (F.landscape ? 86 : 84) * F.s, fam: "serif", weight: 600, lh: 1.06 };
        const h2 = { x: L.x, w: L.w * (F.landscape ? 0.7 : 1), size: 30 * F.s, weight: 500, color: F.c.muted, lh: 1.4 };
        const total = 110 * F.s + textHeight(ctx, F, T.headline || "Judul pengumuman", h1) + 24 * F.s + textHeight(ctx, F, T.sub, h2);
        let y = L.y + Math.max(0, (L.h - total) / 2);
        logo(ctx, F, L.x, y, 70 * F.s, { alpha: seg(t, 0, 0.5) });
        y += 110 * F.s;
        y += text(ctx, F, T.headline || "Judul pengumuman", { ...h1, y, alpha: seg(t, 0.2, 0.8) }) + 24 * F.s;
        text(ctx, F, T.sub, { ...h2, y, alpha: seg(t, 0.6, 1.2) });
      },
    });
    if (T.highlight) {
      scenes.push({
        id: "sorot",
        dur: 3,
        draw(ctx, t) {
          backdrop(ctx, F, t, { glowY: 0.5 });
          const e = E.outBack(seg(t, 0.1, 0.8));
          ctx.save();
          ctx.translate(F.W / 2, F.H / 2);
          ctx.scale(0.85 + 0.15 * e, 0.85 + 0.15 * e);
          ctx.translate(-F.W / 2, -F.H / 2);
          const h = text(ctx, F, T.highlight, { x: L.x, y: F.H * 0.5 - 70 * F.s, w: L.w, size: (F.landscape ? 150 : 128) * F.s, fam: "serif", weight: 600, color: F.c.accent, align: "center", alpha: e, lh: 1 });
          ctx.restore();
          text(ctx, F, T.detail, { x: L.x, y: F.H * 0.5 - 70 * F.s + h + 30 * F.s, w: L.w, size: 30 * F.s, weight: 500, color: F.c.muted, align: "center", alpha: seg(t, 0.7, 1.3), lh: 1.4 });
        },
      });
    }
    scenes.push(sceneCta(F, { headline: T.cta || "Pesan lewat *WhatsApp*", cta: o.cta }, null));
    return scenes;
  }

  /* ---------- Penyusun ---------- */
  const BUILDERS = { lampu: buildLampu, koleksi: buildKoleksi, foto: buildFoto, teks: buildTeks };
  async function build(opts) {
    const F = makeFrame(opts);
    const o = Object.assign({ pace: 1, text: {}, cta: {}, products: [], photos: [], presetIndex: -1, showPrice: true, showCode: true }, opts);
    o.eyebrow = o.eyebrow || `Lampu meja cetak 3D · dirakit sesuai pesanan · ${(window.MKS_CONFIG.city || "").split(",")[0]}`;
    const scenes = await (BUILDERS[o.template] || buildLampu)(F, o);
    const FADE = 0.35;
    let t0 = 0;
    scenes.forEach((s) => { s.dur = Math.max(0.6, s.dur * (s.id === "rakit" || s.id === "nyala" ? 1 : o.pace)); s.start = t0; t0 += s.dur; });
    const duration = t0;
    function draw(ctx, t) {
      t = clamp(t, 0, duration - 1e-4);
      const s = scenes.find((x) => t >= x.start && t < x.start + x.dur) || scenes[scenes.length - 1];
      const lt = t - s.start;
      ctx.save();
      ctx.globalAlpha = 1;
      s.draw(ctx, lt, t);
      ctx.restore();
      // Pudar dari/ke latar di awal dan akhir adegan (kecuali adegan yang bersambung)
      let a = 0;
      if (s.fadeIn !== false) a = Math.max(a, 1 - seg(lt, 0, FADE));
      if (s.fadeOut !== false) a = Math.max(a, seg(lt, s.dur - FADE, s.dur));
      if (a > 0) { ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = F.c.bg; ctx.fillRect(0, 0, F.W, F.H); ctx.restore(); }
    }
    return { W: F.W, H: F.H, duration, draw, scenes, F };
  }

  window.MKSVideo = { build, FORMATS, THEMES, priceOf, codeOf, describe, urlImage };
})();
