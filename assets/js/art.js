/*
 * Ilustrasi produk generatif (SVG) — pengganti foto selama foto produk asli belum ada.
 * Menggambar siluet putar (lathe) dengan garis layer seperti hasil 3D print.
 */
(function () {
  const PI = Math.PI;
  let uid = 0;

  function hexToRgb(hex) {
    const n = parseInt(hex.replace("#", ""), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function shade(hex, amt) {
    const [r, g, b] = hexToRgb(hex);
    const f = (c) => Math.max(0, Math.min(255, Math.round(amt < 0 ? c * (1 + amt) : c + (255 - c) * amt)));
    return `rgb(${f(r)},${f(g)},${f(b)})`;
  }
  const smooth = (a, b, t) => {
    const x = Math.max(0, Math.min(1, (t - a) / (b - a)));
    return x * x * (3 - 2 * x);
  };

  // Profil radius r(t), t=0 bawah → 1 atas, nilai 0..1 dari lebar maksimum
  const PROFILES = {
    vase: (t) => 0.42 + 0.5 * Math.sin(PI * Math.min(1, t * 1.15)) * (1 - smooth(0.6, 0.85, t) * 0.75) + smooth(0.88, 1, t) * 0.12,
    tall: (t) => 0.34 + 0.14 * Math.sin(PI * t * 1.2) + 0.12 * smooth(0.75, 1, t),
    bulb: (t) => 0.3 + 0.62 * Math.sin(PI * Math.min(1, t * 0.95 + 0.05)) ** 0.8,
    cylinder: (t) => 0.62 + 0.05 * t,
    bowl: (t) => 0.55 + 0.45 * Math.sqrt(t),
    lamp: (t) => (t < 0.18 ? 0.22 : 0.25 + 0.7 * Math.sin(PI * ((t - 0.18) / 0.82) * 0.55 + PI * 0.45)),
    planter: (t) => 0.5 + 0.12 * Math.floor(t * 4) / 1 + 0.05 * ((t * 4) % 1),
  };
  const HEIGHT = { vase: 1, tall: 1.05, bulb: 0.88, cylinder: 0.5, bowl: 0.32, lamp: 1, planter: 0.62 };

  function lathe(p, opts) {
    const id = `a${++uid}`;
    const W = 200, H = 240;
    const shape = PROFILES[p.shape] ? p.shape : "vase";
    const prof = PROFILES[shape];
    const h = 180 * (HEIGHT[shape] || 1);
    const base = 214, top = base - h, cx = W / 2, maxR = shape === "bowl" ? 82 : 66;
    const N = 60;
    const wob = (t) => (p.motif === "wave" ? 1 + 0.045 * Math.sin(t * 22) : 1);
    const pts = [];
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      pts.push([t, base - t * h, Math.max(0.05, prof(t)) * maxR * wob(t)]);
    }
    const right = pts.map(([, y, r]) => `${(cx + r).toFixed(1)},${y.toFixed(1)}`);
    const left = pts.slice().reverse().map(([, y, r]) => `${(cx - r).toFixed(1)},${y.toFixed(1)}`);
    const outline = `M${right.join(" L")} L${left.join(" L")} Z`;
    const rTop = pts[N][2], rBot = pts[0][2];
    const ell = (r) => r * 0.22;

    // Garis layer
    let layers = "";
    const step = opts.small ? 5 : 3.2;
    for (let y = base - 2; y > top + 2; y -= step) {
      const t = (base - y) / h;
      const r = Math.max(0.05, prof(t)) * maxR * wob(t);
      layers += `M${(cx - r).toFixed(1)},${y.toFixed(1)} Q${cx},${(y + ell(r) * 1.6).toFixed(1)} ${(cx + r).toFixed(1)},${y.toFixed(1)} `;
    }

    // Motif permukaan
    let motif = "";
    const M = p.motif;
    if (M === "ridge" || M === "twist" || M === "parang") {
      const ribs = M === "parang" ? 9 : 14;
      for (let k = 0; k < ribs; k++) {
        let d = "", pen = false;
        for (let i = 0; i <= N; i += 2) {
          const [t, y, r] = pts[i];
          const twist = M === "twist" ? t * PI * 0.9 : M === "parang" ? t * PI * 1.6 : 0;
          const th = (k / ribs) * PI * 2 + twist;
          if (Math.cos(th) < 0) { pen = false; continue; }
          d += `${pen ? " L" : " M"}${(cx + r * Math.sin(th)).toFixed(1)},${(y + ell(r) * 0.8 * Math.cos(th)).toFixed(1)}`;
          pen = true;
        }
        if (!d) continue;
        motif += `<path d="${d}" fill="none" stroke="${shade(p.color, -0.28)}" stroke-width="${M === "parang" ? 3 : 1.6}" stroke-linecap="round" opacity=".55"/>`;
      }
    } else if (M === "kawung" || M === "batik") {
      const s = M === "kawung" ? 22 : 18;
      for (let y = top + 10; y < base; y += s) {
        for (let x = cx - maxR; x < cx + maxR; x += s) {
          const ox = ((y - top) / s) % 2 ? s / 2 : 0;
          const X = x + ox, Y = y;
          if (M === "kawung") {
            motif += `<g transform="translate(${X.toFixed(1)},${Y.toFixed(1)})" fill="${shade(p.color, -0.3)}" opacity=".5"><ellipse cx="0" cy="-5" rx="3.2" ry="5"/><ellipse cx="0" cy="5" rx="3.2" ry="5"/><ellipse cx="-5" cy="0" rx="5" ry="3.2"/><ellipse cx="5" cy="0" rx="5" ry="3.2"/></g>`;
          } else {
            motif += `<path transform="translate(${X.toFixed(1)},${Y.toFixed(1)})" d="M-7,2 q3.5,-9 7,0 q3.5,-9 7,0" fill="none" stroke="${shade(p.color, -0.32)}" stroke-width="1.8" opacity=".55"/>`;
          }
        }
      }
    } else if (M === "voronoi") {
      let seed = 7;
      const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
      for (let i = 0; i < 70; i++) {
        const t = 0.22 + rnd() * 0.74;
        const r = prof(t) * maxR;
        const x = cx + (rnd() * 2 - 1) * r * 0.85;
        const y = base - t * h;
        const s = 3 + rnd() * 5;
        motif += `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${s.toFixed(1)}" ry="${(s * 0.8).toFixed(1)}" fill="#fff6dc" opacity=".85"/>`;
      }
    }

    const glowDef = shape === "lamp"
      ? `<radialGradient id="${id}g"><stop offset="0" stop-color="#ffd98a" stop-opacity=".55"/><stop offset="1" stop-color="#ffd98a" stop-opacity="0"/></radialGradient>`
      : "";
    const glow = shape === "lamp" ? `<circle cx="${cx}" cy="${(top + h * 0.55).toFixed(1)}" r="110" fill="url(#${id}g)"/>` : "";

    return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Ilustrasi ${p.name}">
  <defs>
    <linearGradient id="${id}s" x1="0" x2="1">
      <stop offset="0" stop-color="${shade(p.color, -0.38)}"/>
      <stop offset=".38" stop-color="${shade(p.color, 0.12)}"/>
      <stop offset=".62" stop-color="${p.color}"/>
      <stop offset="1" stop-color="${shade(p.color, -0.45)}"/>
    </linearGradient>
    <clipPath id="${id}c"><path d="${outline}"/></clipPath>
    ${glowDef}
  </defs>
  ${glow}
  <ellipse cx="${cx}" cy="${base + 6}" rx="${(rBot * 1.15 + 10).toFixed(1)}" ry="7" fill="#000" opacity=".12"/>
  <path d="${outline}" fill="url(#${id}s)"/>
  <g clip-path="url(#${id}c)">
    <path d="${layers}" fill="none" stroke="${shade(p.color, -0.22)}" stroke-width=".7" opacity=".55"/>
    ${motif}
  </g>
  ${shape !== "bowl" ? `<ellipse cx="${cx}" cy="${top.toFixed(1)}" rx="${rTop.toFixed(1)}" ry="${ell(rTop).toFixed(1)}" fill="${shade(p.color, -0.5)}" stroke="${shade(p.color, 0.15)}" stroke-width="1.2"/>` : `<ellipse cx="${cx}" cy="${top.toFixed(1)}" rx="${rTop.toFixed(1)}" ry="${ell(rTop).toFixed(1)}" fill="${shade(p.color, -0.35)}" stroke="${shade(p.color, 0.2)}" stroke-width="1.4"/>`}
  ${shape === "lamp" ? `<rect x="${cx - 26}" y="${base - 4}" width="52" height="8" rx="3" fill="#2a2420"/>` : ""}
</svg>`;
  }

  function panel(p, opts) {
    const id = `a${++uid}`;
    const W = 200, H = 240;
    let waves = "";
    const step = opts.small ? 9 : 7;
    for (let y = 40; y <= 200; y += step) {
      let d = `M30,${y}`;
      for (let x = 30; x <= 170; x += 4) {
        const dy = 6 * Math.sin((x / 140) * PI * 3 + y / 18) * Math.cos(y / 40);
        d += ` L${x},${(y + dy).toFixed(1)}`;
      }
      waves += `<path d="${d}" fill="none" stroke="${shade(p.color, 0.35)}" stroke-width="2.4" stroke-linecap="round"/>`;
    }
    return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Ilustrasi ${p.name}">
  <defs><clipPath id="${id}c"><rect x="26" y="34" width="148" height="172" rx="6"/></clipPath></defs>
  <rect x="32" y="42" width="148" height="172" rx="6" fill="#000" opacity=".12"/>
  <rect x="26" y="34" width="148" height="172" rx="6" fill="${p.color}"/>
  <g clip-path="url(#${id}c)">${waves}</g>
</svg>`;
  }

  window.MKSArt = {
    render(p, opts = {}) {
      if (p.image) return `<img src="${p.image}" alt="${p.name}" loading="lazy" />`;
      return p.shape === "wave" ? panel(p, opts) : lathe(p, opts);
    },
  };
})();
