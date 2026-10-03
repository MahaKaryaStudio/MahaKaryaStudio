/*
 * Renderer SVG lampu rakitan: menumpuk alas → badan → kap, dengan efek nyala.
 * Semua fungsi membaca window.MKS_LAMP untuk warna.
 */
(function () {
  const D = () => window.MKS_LAMP;
  const CX = 160;
  const find = (list, id) => list.find((x) => x.id === id) || list[0];
  const hexOf = (id) => find(D().colors, id).hex;
  const shadeHex = (id) => find(D().shadeColors, id).hex;

  function bodyShape(id, y, hex) {
    let s = "", h = 0, g;
    if (id === "bola") {
      h = 68;
      const cy = y - 34;
      g = `<ellipse cx="${CX}" cy="${cy}" rx="40" ry="34"/>`;
      s = `<g fill="${hex}">${g}</g><g fill="url(#SH)">${g}</g><ellipse cx="${CX - 14}" cy="${cy - 13}" rx="10" ry="6" fill="#fff" opacity=".16"/>`;
    } else if (id === "kubus") {
      h = 58;
      g = `<rect x="${CX - 32}" y="${y - 58}" width="64" height="58" rx="3"/>`;
      s = `<g fill="${hex}">${g}</g><g fill="url(#SH)">${g}</g><rect x="${CX - 32}" y="${y - 58}" width="64" height="7" rx="2" fill="#fff" opacity=".14"/>`;
    } else if (id === "cincin") {
      h = 38;
      const cy = y - 19;
      g = `<ellipse cx="${CX}" cy="${cy}" rx="50" ry="19"/>`;
      s = `<g fill="${hex}">${g}</g><g fill="url(#SH)">${g}</g><ellipse cx="${CX}" cy="${cy}" rx="46" ry="5" fill="#000" opacity=".16"/><ellipse cx="${CX - 18}" cy="${cy - 8}" rx="12" ry="4" fill="#fff" opacity=".14"/>`;
    } else if (id === "heksa") {
      h = 62;
      const m = y - 31;
      g = `<polygon points="${CX - 52},${m} ${CX - 26},${y - 62} ${CX + 26},${y - 62} ${CX + 52},${m} ${CX + 26},${y} ${CX - 26},${y}"/>`;
      s = `<g fill="${hex}">${g}</g><g fill="url(#SH)">${g}</g><polygon points="${CX - 52},${m} ${CX - 26},${y - 62} ${CX + 26},${y - 62} ${CX + 52},${m}" fill="#fff" opacity=".1"/>`;
    } else {
      h = 50;
      g = `<rect x="${CX - 34}" y="${y - 50}" width="68" height="50" rx="7"/>`;
      s = `<g fill="${hex}">${g}</g><g fill="url(#SH)">${g}</g><rect x="${CX - 34}" y="${y - 50}" width="68" height="6" rx="3" fill="#fff" opacity=".14"/>`;
    }
    return { svg: s, h };
  }

  function baseShape(id, y, hex) {
    let s = "";
    const h = 26;
    if (id === "bulat") {
      s =
        `<ellipse cx="${CX}" cy="${y - 8}" rx="78" ry="14" fill="${hex}"/><ellipse cx="${CX}" cy="${y - 8}" rx="78" ry="14" fill="#000" opacity=".28"/>` +
        `<rect x="${CX - 78}" y="${y - 22}" width="156" height="14" fill="${hex}"/><rect x="${CX - 78}" y="${y - 22}" width="156" height="14" fill="url(#SH)"/>` +
        `<ellipse cx="${CX}" cy="${y - 22}" rx="78" ry="14" fill="${hex}"/><ellipse cx="${CX}" cy="${y - 22}" rx="78" ry="14" fill="#fff" opacity=".1"/>`;
    } else if (id === "segitiga") {
      s =
        `<polygon points="${CX - 88},${y - 8} ${CX + 88},${y - 8} ${CX},${y - 30}" fill="${hex}"/><polygon points="${CX - 88},${y - 8} ${CX + 88},${y - 8} ${CX + 88},${y} ${CX - 88},${y}" fill="${hex}"/>` +
        `<polygon points="${CX - 88},${y - 8} ${CX + 88},${y - 8} ${CX + 88},${y} ${CX - 88},${y}" fill="#000" opacity=".3"/><polygon points="${CX - 88},${y - 8} ${CX + 88},${y - 8} ${CX},${y - 30}" fill="#fff" opacity=".08"/>`;
    } else if (id === "kotak") {
      s =
        `<rect x="${CX - 72}" y="${y - 12}" width="144" height="12" rx="2" fill="${hex}"/><rect x="${CX - 72}" y="${y - 12}" width="144" height="12" fill="#000" opacity=".3"/>` +
        `<rect x="${CX - 72}" y="${y - 26}" width="144" height="16" rx="3" fill="${hex}"/><rect x="${CX - 72}" y="${y - 26}" width="144" height="16" rx="3" fill="url(#SH)"/>`;
    } else {
      let pet = "";
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        pet += `<circle cx="${(CX + Math.cos(a) * 58).toFixed(1)}" cy="${(y - 20 + Math.sin(a) * 12).toFixed(1)}" r="20"/>`;
      }
      pet += `<ellipse cx="${CX}" cy="${y - 20}" rx="62" ry="14"/>`;
      s = `<g transform="translate(0,10)" fill="${hex}">${pet}</g><g transform="translate(0,10)" fill="#000" opacity=".3">${pet}</g><g fill="${hex}">${pet}</g><g fill="url(#SH)" opacity=".7">${pet}</g>`;
    }
    return { svg: s, h };
  }

  function headShape(id, y, hex, lit) {
    let s = "", h = 0, g, lines = "";
    if (id === "plisir") {
      h = 110;
      g = `<rect x="${CX - 60}" y="${y - 110}" width="120" height="110" rx="6"/>`;
      for (let x = CX - 56; x < CX + 60; x += 6) lines += `<line x1="${x}" y1="${y - 108}" x2="${x}" y2="${y - 2}"/>`;
      s = `<g fill="${hex}">${g}</g><g fill="url(#LIT)" opacity="${lit}">${g}</g><g stroke="#000" stroke-opacity=".08" stroke-width="2">${lines}</g><g fill="url(#SH)" opacity=".55">${g}</g>`;
    } else if (id === "kerucut") {
      h = 104;
      g = `<polygon points="${CX - 46},${y - 104} ${CX + 46},${y - 104} ${CX + 72},${y} ${CX - 72},${y}"/>`;
      for (let k = -8; k <= 8; k++) {
        const t = k / 8;
        lines += `<line x1="${CX + t * 44}" y1="${y - 102}" x2="${CX + t * 70}" y2="${y - 2}"/>`;
      }
      s = `<g fill="${hex}">${g}</g><g fill="url(#LIT)" opacity="${lit}">${g}</g><g stroke="#000" stroke-opacity=".07" stroke-width="2">${lines}</g><g fill="url(#SH)" opacity=".5">${g}</g>`;
    } else {
      h = 104;
      g = `<rect x="${CX - 56}" y="${y - 104}" width="112" height="104" rx="3"/>`;
      for (let yy = y - 98; yy < y - 4; yy += 7) lines += `<line x1="${CX - 54}" y1="${yy}" x2="${CX + 54}" y2="${yy}"/>`;
      s = `<g fill="${hex}">${g}</g><g fill="url(#LIT)" opacity="${lit}">${g}</g><g stroke="#000" stroke-opacity=".07" stroke-width="1.5">${lines}</g><g fill="url(#SH)" opacity=".5">${g}</g>`;
    }
    return { svg: s, h };
  }

  function defs(u) {
    return (
      "<defs>" +
      `<linearGradient id="${u}-sh" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="#000" stop-opacity=".42"/><stop offset=".42" stop-color="#000" stop-opacity="0"/><stop offset=".68" stop-color="#fff" stop-opacity=".12"/><stop offset="1" stop-color="#000" stop-opacity=".3"/></linearGradient>` +
      `<radialGradient id="${u}-lit" cx=".5" cy=".62" r=".7"><stop offset="0" stop-color="#fff7de" stop-opacity=".95"/><stop offset=".55" stop-color="#ffe0a0" stop-opacity=".55"/><stop offset="1" stop-color="#ffc26a" stop-opacity=".2"/></radialGradient>` +
      `<radialGradient id="${u}-glow"><stop offset="0" stop-color="#ffd58a" stop-opacity=".62"/><stop offset=".45" stop-color="#ffb347" stop-opacity=".16"/><stop offset="1" stop-color="#ffb347" stop-opacity="0"/></radialGradient>` +
      `<radialGradient id="${u}-pool"><stop offset="0" stop-color="#ffcc80" stop-opacity=".45"/><stop offset="1" stop-color="#ffcc80" stop-opacity="0"/></radialGradient>` +
      "</defs>"
    );
  }
  const scoped = (svg, u) => svg.split("url(#SH)").join(`url(#${u}-sh)`).split("url(#LIT)").join(`url(#${u}-lit)`);

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

  /* cfg: {head:{shape,color}, body:[{shape,color}], base:{shape,color}}
   * o: {uid, on, dim, explode, table, vb, dims, cover} */
  function renderLamp(cfg, o = {}) {
    const u = o.uid || "l";
    const dim = o.on === false ? 0 : o.dim == null ? 1 : o.dim;
    const explode = o.explode ? 34 : 0;
    const table = o.table == null ? true : o.table;
    const W = 320, H = 520, floor = 440;
    const parts = [];
    let y = floor;
    const b = baseShape(cfg.base.shape, y, hexOf(cfg.base.color));
    parts.push(b.svg);
    const baseTop = y - b.h;
    y -= b.h + explode;
    const bodyBottom = y;
    cfg.body.forEach((p) => {
      const bs = bodyShape(p.shape, y, hexOf(p.color));
      parts.push(bs.svg);
      y -= bs.h;
    });
    const bodyTop = y;
    y -= explode;
    parts.push(`<rect x="${CX - 10}" y="${y - 16}" width="20" height="16" rx="2" fill="#3a3129"/>`);
    y -= 16;
    const hs = headShape(cfg.head.shape, y, shadeHex(cfg.head.color), dim * 0.9);
    const headBottom = y, headTop = y - hs.h, headCy = y - hs.h / 2;

    let out = `<svg viewBox="${o.vb || `0 0 ${W} ${H}`}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Pratinjau lampu"${o.cover ? ' style="overflow:visible"' : ""}>${defs(u)}`;
    if (dim > 0) out += `<ellipse cx="${CX}" cy="${headCy}" rx="230" ry="240" fill="url(#${u}-glow)" opacity="${dim}"/>`;
    if (table) out += `<rect x="-600" y="${floor}" width="1520" height="${H - floor + 200}" fill="#2b1f15"/><rect x="-600" y="${floor}" width="1520" height="3" fill="#4a3625"/>`;
    if (dim > 0 && table) out += `<ellipse cx="${CX}" cy="${floor + 6}" rx="150" ry="16" fill="url(#${u}-pool)" opacity="${dim}"/>`;
    out += `<g>${parts.join("")}</g>${hs.svg}`;
    if (dim > 0) out += `<ellipse cx="${CX}" cy="${headBottom - hs.h * 0.45}" rx="24" ry="30" fill="#fff" opacity="${dim * 0.28}"/>`;
    if (o.explode) {
      const lx = CX + 100;
      const tf = 'font-family="DM Mono,monospace" font-size="11" fill="#a89a85"';
      out +=
        `<g stroke="#a89a85" stroke-opacity=".6" stroke-dasharray="3 4">` +
        `<line x1="${CX + 70}" y1="${(headTop + headBottom) / 2}" x2="${lx}" y2="${(headTop + headBottom) / 2}"/>` +
        `<line x1="${CX + 56}" y1="${(bodyTop + bodyBottom) / 2}" x2="${lx}" y2="${(bodyTop + bodyBottom) / 2}"/>` +
        `<line x1="${CX + 82}" y1="${baseTop + 12}" x2="${lx}" y2="${baseTop + 12}"/>` +
        `<line x1="${CX}" y1="${headBottom + 2}" x2="${CX}" y2="${bodyTop - 2}" stroke-dasharray="2 3"/>` +
        `<line x1="${CX}" y1="${bodyBottom + 2}" x2="${CX}" y2="${baseTop - 2}" stroke-dasharray="2 3"/></g>`;
      out +=
        `<g ${tf}><text x="${lx + 6}" y="${(headTop + headBottom) / 2 + 4}">KAP</text><text x="${lx + 6}" y="${(bodyTop + bodyBottom) / 2 + 4}">BADAN</text><text x="${lx + 6}" y="${baseTop + 16}">ALAS</text>` +
        `<text x="${CX + 8}" y="${(headBottom + bodyTop) / 2 + 4}" font-size="9">ulir M20</text><text x="${CX + 8}" y="${(bodyBottom + baseTop) / 2 + 4}" font-size="9">ulir M20</text></g>`;
    }
    if (o.dims) {
      const dx = CX + 112;
      const cm = totalCm(cfg);
      out +=
        `<g stroke="#a89a85" stroke-opacity=".7"><line x1="${dx}" y1="${headTop}" x2="${dx}" y2="${floor}"/><line x1="${dx - 6}" y1="${headTop}" x2="${dx + 6}" y2="${headTop}"/><line x1="${dx - 6}" y1="${floor}" x2="${dx + 6}" y2="${floor}"/>` +
        `<line x1="${CX - 60}" y1="${headTop - 14}" x2="${CX + 60}" y2="${headTop - 14}"/><line x1="${CX - 60}" y1="${headTop - 20}" x2="${CX - 60}" y2="${headTop - 8}"/><line x1="${CX + 60}" y1="${headTop - 20}" x2="${CX + 60}" y2="${headTop - 8}"/></g>`;
      out += `<g font-family="DM Mono,monospace" font-size="11" fill="#f2e7d5"><text x="${dx + 10}" y="${(headTop + floor) / 2 + 4}">≈ ${cm.toFixed(0)} cm</text><text x="${CX}" y="${headTop - 22}" text-anchor="middle">Ø 20 cm</text></g>`;
    }
    out += "</svg>";
    return scoped(out, u);
  }

  const VB = {
    part: { head: "70 70 180 130", body: "90 100 140 90", base: "40 100 240 90" },
    icon: { head: "70 70 180 130", body: "96 104 128 80", base: "60 108 200 76" },
  };
  function shapeOf(kind, id, hex, lit) {
    if (kind === "head") return headShape(id, 190, hex, lit).svg;
    if (kind === "body") return bodyShape(id, 178, hex).svg;
    return baseShape(id, 166, hex).svg;
  }
  // Satu bagian dengan warna asli (kartu katalog, strip bagian terpilih)
  function partSvg(kind, id, hex, u) {
    return scoped(`<svg viewBox="${VB.part[kind]}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${defs(u)}${shapeOf(kind, id, hex, 0.35)}</svg>`, u);
  }
  // Ikon bentuk netral (tombol pilihan bentuk)
  function iconSvg(kind, id, u) {
    const hex = kind === "head" ? "#e9dcc2" : "#c9b79a";
    return scoped(`<svg viewBox="${VB.icon[kind]}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${defs(u)}${shapeOf(kind, id, hex, 0)}</svg>`, u);
  }

  window.LampArt = { renderLamp, partSvg, iconSvg, totalCm, totalKg, find, hexOf, shadeHex };
})();
