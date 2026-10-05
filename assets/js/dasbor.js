/*
 * Dasbor operasional MahaKarya Studio.
 * Membaca tab "Data dasbor" dari Google Sheet yang dipublikasikan sebagai CSV
 * (File → Bagikan → Publikasikan ke web → tab "Data dasbor" → CSV). Tautan disimpan
 * di localStorage browser ini. Tidak ada server; tidak ada data pembeli di tab itu.
 */
(() => {
  "use strict";
  const $ = (s, el = document) => el.querySelector(s);
  const KEY = "mks-dasbor-csv";
  const REFRESH_MS = 5 * 60 * 1000;
  const S1 = "#c8794a", S2 = "#1c8fbf";

  /* ---------- util ---------- */
  const rp = (n) => (n == null || n === "" || isNaN(n) ? "–" : (n < 0 ? "−" : "") + "Rp" + Math.abs(Math.round(n)).toLocaleString("id-ID"));
  const rpK = (n) => { n = Number(n) || 0; const a = Math.abs(n); const s = a >= 1e9 ? (a / 1e9).toFixed(1).replace(".", ",") + " M" : a >= 1e6 ? (a / 1e6).toFixed(1).replace(".", ",") + " jt" : a >= 1e3 ? Math.round(a / 1e3) + " rb" : String(a); return (n < 0 ? "−" : "") + "Rp" + s; };
  const num = (v) => { if (v === "" || v == null) return null; const n = Number(String(v).replace(",", ".")); return isNaN(n) ? null : n; };
  const pct = (v) => (v == null ? "–" : Math.round(v * 100) + "%");
  const monthLabel = (ym) => { const [y, m] = ym.split("-"); return ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"][+m - 1] + " " + y.slice(2); };
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const svgEl = (tag, attrs = {}) => { const e = document.createElementNS("http://www.w3.org/2000/svg", tag); for (const k in attrs) e.setAttribute(k, attrs[k]); return e; };

  function parseCsv(text) {
    const rows = []; let row = [], cell = "", q = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (q) { if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += c; }
      else if (c === '"') q = true;
      else if (c === ",") { row.push(cell); cell = ""; }
      else if (c === "\n" || c === "\r") { if (c === "\r" && text[i + 1] === "\n") i++; row.push(cell); rows.push(row); row = []; cell = ""; }
      else cell += c;
    }
    if (cell !== "" || row.length) { row.push(cell); rows.push(row); }
    return rows;
  }

  /* CSV → {kpi:{}, tren:[], filamen:[], bahan:[], jadi:[], aktif:[], meta:{}} */
  function model(rows) {
    const m = { kpi: {}, meta: {}, tren: [], filamen: [], bahan: [], jadi: [], aktif: [] };
    for (const r of rows.slice(1)) {
      const [bag, key, ...v] = r;
      if (!bag || bag === "bagian") continue;
      if (bag === "kpi") m.kpi[key] = num(v[0]);
      else if (bag === "meta") m.meta[key] = v[0];
      else if (bag === "tren" && key) m.tren.push({ bulan: key, masuk: num(v[0]) || 0, terbayar: num(v[1]) || 0, omzet: num(v[2]) || 0, laba: num(v[3]) || 0, kas: num(v[4]) || 0, hari: num(v[5]), hpp: num(v[6]) || 0 });
      else if (bag === "filamen" && key) m.filamen.push({ kode: key, warna: v[0], sisa: num(v[1]) || 0, min: num(v[2]) || 0, hari: num(v[3]), status: v[4], hex: v[5], pakai30: num(v[6]) || 0 });
      else if (bag === "bahan" && key) m.bahan.push({ item: key, sisa: num(v[0]) || 0, min: num(v[1]) || 0, status: v[2], satuan: v[3] });
      else if (bag === "jadi" && key) m.jadi.push({ kode: key, bagian: v[0], bentuk: v[1], warna: v[2], jumlah: num(v[3]) || 0, min: num(v[4]) || 0, status: v[5] });
      else if (bag === "aktif" && key) m.aktif.push({ id: key, status: v[0], tgl: v[1], janji: v[2], telat: v[3] === "YA", kode: v[4], zona: v[5] });
    }
    return m;
  }

  /* ---------- data demo (format sama dengan tab Data dasbor) ---------- */
  function demoModel() {
    const now = new Date(), ym = (d) => d.toISOString().slice(0, 7);
    const tren = [];
    const base = [4, 6, 9, 8, 12, 14];
    for (let i = 5; i >= 0; i--) { const d = new Date(now.getFullYear(), now.getMonth() - i, 1); const masuk = base[5 - i] + 3, terbayar = base[5 - i]; const omzet = terbayar * 415000; tren.push({ bulan: ym(d), masuk, terbayar, omzet, laba: Math.round(omzet * 0.42), kas: Math.round(omzet * 0.3) - 400000, hari: 5 + (i % 3), hpp: Math.round(omzet * 0.58) }); }
    const cur = tren[5];
    return {
      meta: { bulan: ym(now) },
      kpi: { pesanan_masuk: cur.masuk, terbayar: cur.terbayar, konversi: cur.terbayar / cur.masuk, omzet: cur.omzet, laba_kotor: cur.laba, hari_bayar_tiba: 6.5, belum_dibalas: 2, tunggu_bayar_1hari: 1, antrean_cetak: 5, terlambat: 1, dikirim: 3, aktif: 11, filamen_pesan: 2, bahan_pesan: 1, jadi_cetak: 2, kas_masuk_bulan: 5810000, kas_keluar_bulan: 2140000, saldo_kas: 9375000, target_konversi: 0.4, target_hari: 8 },
      tren,
      filamen: [
        { kode: "KRE", warna: "Krem", sisa: 1420, min: 300, hari: 31, status: "OK", hex: "#efe3cb", pakai30: 1370 },
        { kode: "HIT", warna: "Hitam arang", sisa: 640, min: 300, hari: 22, status: "OK", hex: "#2b2622", pakai30: 860 },
        { kode: "BAT", warna: "Merah bata", sisa: 180, min: 300, hari: 6, status: "PESAN", hex: "#c4522f", pakai30: 910 },
        { kode: "ZAI", warna: "Zaitun", sisa: 820, min: 300, hari: 68, status: "OK", hex: "#5c8040", pakai30: 360 },
        { kode: "SAL", warna: "Salmon", sisa: 260, min: 300, hari: 11, status: "PESAN", hex: "#e8836f", pakai30: 700 },
        { kode: "GAD", warna: "Gading", sisa: 1960, min: 300, hari: 29, status: "OK", hex: "#f3e8d1", pakai30: 2040 },
        { kode: "PUT", warna: "Putih", sisa: 900, min: 300, hari: 75, status: "OK", hex: "#f8f5ee", pakai30: 360 },
      ],
      bahan: [
        { item: "Dus kraft 240×240×200", sisa: 31, min: 20, status: "OK", satuan: "pcs" }, { item: "Insert E-flute", sisa: 31, min: 20, status: "OK", satuan: "set" },
        { item: "Stiker kode rakitan", sisa: 64, min: 30, status: "OK", satuan: "pcs" }, { item: "Tisu kraft", sisa: 120, min: 50, status: "OK", satuan: "lembar" },
        { item: "Bubble wrap", sisa: 8, min: 10, status: "PESAN", satuan: "m" }, { item: "Kit kelistrikan", sisa: 6, min: 5, status: "OK", satuan: "pcs" },
        { item: "Bohlam LED 5 W", sisa: 7, min: 5, status: "OK", satuan: "pcs" }, { item: "Pemberat alas", sisa: 14, min: 10, status: "OK", satuan: "pcs" },
      ],
      jadi: [
        { kode: "KERGAD", bagian: "Kap", bentuk: "Kerucut", warna: "Gading", jumlah: 2, min: 1, status: "OK" }, { kode: "PLIGAD", bagian: "Kap", bentuk: "Silinder plisir", warna: "Gading", jumlah: 0, min: 1, status: "CETAK" },
        { kode: "BOLKRE", bagian: "Badan", bentuk: "Bola", warna: "Krem", jumlah: 1, min: 1, status: "OK" }, { kode: "BULHIT", bagian: "Alas", bentuk: "Bulat", warna: "Hitam arang", jumlah: 0, min: 1, status: "CETAK" },
      ],
      aktif: [
        { id: "P251001-07", status: "Cetak", tgl: "2025-10-01", janji: "2025-10-06", telat: true, kode: "MK-KERGAD-KUBBAT-HEKKRE-BOLSAL-KOTBAT", zona: "Jabodetabek" },
        { id: "P251003-08", status: "Cetak", tgl: "2025-10-03", janji: "2025-10-10", telat: false, kode: "MK-PLIGAD-BOLZAI-BULHIT-LED", zona: "Pulau Jawa" },
        { id: "P251004-09", status: "Tunggu bayar", tgl: "2025-10-04", janji: "", telat: false, kode: "MK-KOTPUT-CINHIT-BOLKRE-BUNSAL-TK", zona: "Jabodetabek" },
        { id: "P251005-10", status: "Dikirim", tgl: "2025-10-05", janji: "2025-10-09", telat: false, kode: "MK-KERGAD-BOLKRE-SEGBAT", zona: "Luar Jawa" },
        { id: "P251005-11", status: "Baru", tgl: "2025-10-05", janji: "", telat: false, kode: "MK-PLIGAD-CINSAL-BOLKRE-BUNSAL", zona: "Jabodetabek" },
      ],
    };
  }

  /* ---------- tooltip ---------- */
  const tip = $("#tip");
  function showTip(x, y, title, rows) {
    tip.replaceChildren();
    const b = el("b", null, title); tip.appendChild(b);
    for (const [label, value, color] of rows) {
      const r = el("div", "row"); const l = el("span"); if (color) { const i = el("i"); i.style.background = color; l.appendChild(i); } l.appendChild(document.createTextNode(label));
      r.appendChild(l); r.appendChild(el("strong", null, value)); tip.appendChild(r);
    }
    tip.hidden = false;
    const w = tip.offsetWidth, h = tip.offsetHeight;
    tip.style.left = Math.min(x + 14, window.innerWidth - w - 8) + "px";
    tip.style.top = Math.max(8, y - h - 12) + "px";
  }
  const hideTip = () => { tip.hidden = true; };

  /* ---------- kolom (1–2 seri) ---------- */
  function columns(fig, data, series, opts) {
    fig.replaceChildren();
    if (!data.length) { fig.appendChild(el("div", "empty", "Belum ada data bulanan.")); return; }
    const W = 560, H = 240, pad = { t: 18, r: 12, b: 30, l: 44 };
    const iw = W - pad.l - pad.r, ih = H - pad.t - pad.b;
    const max = Math.max(1, ...data.flatMap((d) => series.map((s) => d[s.key] || 0)));
    const step = niceStep(max), top = Math.ceil(max / step) * step;
    const y = (v) => pad.t + ih - (v / top) * ih;
    const svg = svgEl("svg", { viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": opts.aria });
    const grid = svgEl("g", { class: "grid" }), axis = svgEl("g", { class: "axis" });
    for (let v = 0; v <= top; v += step) {
      grid.appendChild(svgEl("line", { x1: pad.l, x2: W - pad.r, y1: y(v), y2: y(v) }));
      const t = svgEl("text", { x: pad.l - 6, y: y(v) + 4, "text-anchor": "end" }); t.textContent = opts.fmtAxis(v); axis.appendChild(t);
    }
    svg.appendChild(grid); svg.appendChild(axis);
    const band = iw / data.length, gap = 2, bw = Math.min(24, (band - 12) / series.length - gap);
    data.forEach((d, i) => {
      const x0 = pad.l + band * i + (band - (bw + gap) * series.length) / 2;
      const t = svgEl("text", { x: pad.l + band * i + band / 2, y: H - 8, "text-anchor": "middle" }); t.textContent = monthLabel(d.bulan); axis.appendChild(t);
      series.forEach((s, j) => {
        const v = d[s.key] || 0, x = x0 + j * (bw + gap), yy = y(v), h = Math.max(0, pad.t + ih - yy);
        const r = Math.min(4, h);
        const path = h > 0 ? `M${x} ${yy + r} a${r} ${r} 0 0 1 ${r} -${r} h${bw - 2 * r} a${r} ${r} 0 0 1 ${r} ${r} v${h - r} h-${bw} z` : "";
        if (path) svg.appendChild(svgEl("path", { d: path, fill: s.color, class: "bar" }));
        if (i === data.length - 1 && v > 0) { const l = svgEl("text", { x: x + bw / 2, y: yy - 5, "text-anchor": "middle", class: "lbl" }); l.textContent = opts.fmtLabel(v); svg.appendChild(l); }
      });
      const hit = svgEl("rect", { x: pad.l + band * i, y: pad.t, width: band, height: ih, class: "hit", tabindex: 0 });
      const rows = series.map((s) => [s.name, opts.fmtTip(d[s.key] || 0), s.color]);
      hit.addEventListener("pointermove", (e) => showTip(e.clientX, e.clientY, monthLabel(d.bulan), rows));
      hit.addEventListener("focus", () => { const b = hit.getBoundingClientRect(); showTip(b.left + b.width / 2, b.top + 40, monthLabel(d.bulan), rows); });
      hit.addEventListener("pointerleave", hideTip); hit.addEventListener("blur", hideTip);
      svg.appendChild(hit);
    });
    fig.appendChild(svg);
    if (series.length > 1) { const lg = el("div", "legend"); for (const s of series) { const sp = el("span"); const i = el("i"); i.style.background = s.color; sp.appendChild(i); sp.appendChild(document.createTextNode(s.name)); lg.appendChild(sp); } fig.appendChild(lg); }
    const table = el("table"); table.hidden = true;
    const thead = el("thead"), trh = el("tr"); trh.appendChild(el("th", null, "Bulan")); for (const s of series) trh.appendChild(el("th", null, s.name)); thead.appendChild(trh); table.appendChild(thead);
    const tb = el("tbody"); for (const d of data) { const tr = el("tr"); tr.appendChild(el("td", null, d.bulan)); for (const s of series) tr.appendChild(el("td", null, opts.fmtTip(d[s.key] || 0))); tb.appendChild(tr); } table.appendChild(tb);
    fig.appendChild(table);
  }
  function niceStep(max) { const raw = max / 4, p = Math.pow(10, Math.floor(Math.log10(raw))); const m = raw / p; return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10) * p; }

  /* ---------- render ---------- */
  function tile(label, value, note, state, icon) {
    const t = el("div", "tile" + (state ? " tile--" + state : ""));
    t.appendChild(el("div", "tile__label", label)); t.appendChild(el("div", "tile__value", value));
    const n = el("div", "tile__note"); if (icon) n.appendChild(iconEl(icon)); n.appendChild(document.createTextNode(note || "")); t.appendChild(n);
    return t;
  }
  function iconEl(kind) {
    const s = svgEl("svg", { viewBox: "0 0 16 16", class: "ic", "aria-hidden": "true" });
    const col = kind === "ok" ? "#5c8040" : kind === "warn" ? "#c98500" : "#b3412a";
    if (kind === "ok") s.appendChild(svgEl("path", { d: "M3 8.5l3 3 7-7", fill: "none", stroke: col, "stroke-width": "2", "stroke-linecap": "round", "stroke-linejoin": "round" }));
    else if (kind === "warn") { s.appendChild(svgEl("path", { d: "M8 2l6.5 11.5h-13z", fill: "none", stroke: col, "stroke-width": "1.6", "stroke-linejoin": "round" })); s.appendChild(svgEl("path", { d: "M8 6.5v3.5M8 11.8v.4", stroke: col, "stroke-width": "1.6", "stroke-linecap": "round" })); }
    else { s.appendChild(svgEl("circle", { cx: 8, cy: 8, r: 6, fill: "none", stroke: col, "stroke-width": "1.6" })); s.appendChild(svgEl("path", { d: "M8 4.5v4M8 11v.4", stroke: col, "stroke-width": "1.8", "stroke-linecap": "round" })); }
    return s;
  }
  const stateOf = (n, warnAt = 1, badAt = 3) => (n >= badAt ? "bad" : n >= warnAt ? "warn" : "ok");

  function render(m, source) {
    const k = m.kpi, bulan = m.meta.bulan || "";
    $("#bulan").textContent = bulan ? monthLabel(bulan) : "";
    const todo = $("#todo"); todo.replaceChildren();
    const td = [
      ["Belum dibalas", k.belum_dibalas, "balas < 15 menit", stateOf(k.belum_dibalas, 1, 3)],
      ["Menunggu bayar > 1 hari", k.tunggu_bayar_1hari, "ingatkan sekali (/ingat)", stateOf(k.tunggu_bayar_1hari, 1, 4)],
      ["Antrean cetak", k.antrean_cetak, "kelompokkan per warna", "ok"],
      ["Terlambat dari janji", k.terlambat, "kabari pembeli hari ini", stateOf(k.terlambat, 1, 2)],
      ["Dikirim, belum selesai", k.dikirim, "H+3 tiba: tanya kabar", "ok"],
      ["Pesanan aktif", k.aktif, "selain Selesai / Batal", "ok"],
    ];
    for (const [l, v, n, s] of td) todo.appendChild(tile(l, v == null ? "–" : String(v), n, s, s));
    const kpi = $("#kpi"); kpi.replaceChildren();
    const konvOk = k.konversi == null ? null : k.konversi >= (k.target_konversi || 0.4);
    const hariOk = k.hari_bayar_tiba == null ? null : k.hari_bayar_tiba <= (k.target_hari || 8);
    kpi.appendChild(tile("Pesanan masuk", String(k.pesanan_masuk ?? "–"), "chat yang jadi pesanan"));
    kpi.appendChild(tile("Terbayar", String(k.terbayar ?? "–"), "dari pesanan bulan ini"));
    kpi.appendChild(tile("Konversi chat → bayar", pct(k.konversi), "target ≥ " + pct(k.target_konversi || 0.4), konvOk == null ? "" : konvOk ? "ok" : "bad", konvOk == null ? null : konvOk ? "ok" : "bad"));
    kpi.appendChild(tile("Omzet lampu", rpK(k.omzet), rp(k.omzet)));
    kpi.appendChild(tile("Laba kotor (perkiraan)", rpK(k.laba_kotor), k.omzet ? "margin " + pct(k.laba_kotor / k.omzet) : "omzet − HPP asumsi"));
    kpi.appendChild(tile("Hari bayar → tiba", k.hari_bayar_tiba == null ? "–" : (Math.round(k.hari_bayar_tiba * 10) / 10).toLocaleString("id-ID"), "target ≤ " + (k.target_hari || 8) + " hari", hariOk == null ? "" : hariOk ? "ok" : "bad", hariOk == null ? null : hariOk ? "ok" : "bad"));

    // 6 bulan terakhir sampai bulan ini; kalau bulan-bulan terakhir kosong tapi ada data lebih lama,
    // jendela digeser mundur supaya bulan berdata terakhir tetap terlihat (maks. 12 batang).
    const tren = m.tren.filter((t) => t.bulan && t.bulan <= bulan);
    let lastIdx = -1; tren.forEach((t, i) => { if (t.masuk || t.omzet) lastIdx = i; });
    const start = lastIdx < 0 ? 0 : Math.max(0, Math.min(tren.length - 6, lastIdx));
    const last6 = lastIdx < 0 ? [] : tren.slice(start, Math.min(tren.length, start + 12));
    columns($("#c-pesanan"), last6, [{ key: "masuk", name: "Pesanan masuk", color: S2 }, { key: "terbayar", name: "Terbayar", color: S1 }], { aria: "Pesanan masuk dan terbayar per bulan", fmtAxis: (v) => String(v), fmtLabel: (v) => String(v), fmtTip: (v) => v + " pesanan" });
    columns($("#c-omzet"), last6, [{ key: "omzet", name: "Omzet lampu", color: S1 }, { key: "laba", name: "Laba kotor", color: S2 }], { aria: "Omzet dan laba kotor per bulan", fmtAxis: (v) => (v >= 1e6 ? v / 1e6 + " jt" : v >= 1e3 ? v / 1e3 + " rb" : v), fmtLabel: rpK, fmtTip: rp });

    const fil = $("#filamen"); fil.replaceChildren();
    const maxG = Math.max(1000, ...m.filamen.map((f) => f.sisa));
    for (const f of m.filamen) {
      const bad = f.status === "PESAN", warn = !bad && f.hari != null && f.hari < 14;
      const row = el("div", "meter" + (bad ? " is-bad" : warn ? " is-warn" : ""));
      const sw = el("span", "sw"); sw.style.background = /^#[0-9a-f]{6}$/i.test(f.hex || "") ? f.hex : "#ccc"; row.appendChild(sw);
      const name = el("div", "name", f.warna || f.kode); const sm = el("small", null, f.kode + (f.hari != null ? " · ±" + f.hari + " hari lagi" : " · 0 g dipakai 30 hari terakhir")); name.appendChild(sm); row.appendChild(name);
      const track = el("div", "track"); const fillEl = el("div", "fill"); fillEl.style.width = Math.min(100, (f.sisa / maxG) * 100) + "%"; track.appendChild(fillEl);
      const mn = el("div", "min"); mn.style.left = Math.min(100, (f.min / maxG) * 100) + "%"; mn.title = "minimum " + f.min + " g"; track.appendChild(mn); row.appendChild(track);
      const val = el("div", "val"); const b = el("b", null, Math.round(f.sisa).toLocaleString("id-ID") + " g"); val.appendChild(b); val.appendChild(document.createTextNode(bad ? " · PESAN" : "")); row.appendChild(val);
      row.title = `${f.warna}: sisa ${Math.round(f.sisa)} g, minimum ${f.min} g, pakai 30 hari ${Math.round(f.pakai30)} g`;
      fil.appendChild(row);
    }
    $("#fil-note").textContent = "garis = stok minimum · " + (k.filamen_pesan || 0) + " warna perlu dipesan";

    const bahan = $("#bahan"); bahan.replaceChildren();
    const list = el("div", "list");
    list.appendChild(el("h3", null, "Bahan kemasan & kelistrikan"));
    const sortedB = [...m.bahan].sort((a, b) => (a.status === "PESAN" ? -1 : 1) - (b.status === "PESAN" ? -1 : 1));
    for (const b of sortedB) {
      const it = el("div", "item" + (b.status === "PESAN" ? " is-bad" : "")); it.appendChild(el("span", null, b.item));
      const r = el("span"); r.appendChild(el("span", "n", `${b.sisa} ${b.satuan || ""} / min ${b.min}  `)); r.appendChild(el("span", "badge" + (b.status === "PESAN" ? " badge--bad" : ""), b.status === "PESAN" ? "PESAN" : "OK")); it.appendChild(r);
      list.appendChild(it);
    }
    list.appendChild(el("h3", null, "Bagian jadi (preset) di bawah minimum"));
    const cetak = m.jadi.filter((j) => j.status === "CETAK");
    if (!cetak.length) list.appendChild(el("div", "item", "Semua bagian preset ≥ minimum."));
    for (const j of cetak) { const it = el("div", "item is-warn"); it.appendChild(el("span", null, `${j.bagian} ${j.bentuk} · ${j.warna}`)); const r = el("span"); r.appendChild(el("span", "n", `${j.jumlah} / min ${j.min}  `)); r.appendChild(el("span", "badge badge--warn", "CETAK")); it.appendChild(r); list.appendChild(it); }
    bahan.appendChild(list);

    const tbl = $("#aktif"); tbl.replaceChildren();
    const order = { Baru: 0, Konfirmasi: 1, "Tunggu bayar": 2, Cetak: 3, Dikirim: 4 };
    const aktif = [...m.aktif].sort((a, b) => (b.telat - a.telat) || (order[a.status] ?? 9) - (order[b.status] ?? 9) || a.tgl.localeCompare(b.tgl));
    $("#aktif-n").textContent = aktif.length ? aktif.length + " pesanan" : "";
    const th = el("thead"), tr = el("tr"); for (const h of ["ID", "Status", "Tanggal", "Janji selesai", "Kode rakitan", "Zona"]) tr.appendChild(el("th", null, h)); th.appendChild(tr); tbl.appendChild(th);
    const tb = el("tbody");
    if (!aktif.length) { const r = el("tr"); const d = el("td", "muted", "Tidak ada pesanan aktif."); d.colSpan = 6; r.appendChild(d); tb.appendChild(r); }
    for (const a of aktif) {
      const r = el("tr", a.telat ? "is-bad" : a.status === "Baru" ? "is-warn" : "");
      r.appendChild(el("td", "mono", a.id)); const st = el("td"); st.appendChild(el("span", "badge" + (a.telat ? " badge--bad" : a.status === "Baru" ? " badge--warn" : ""), a.telat ? a.status + " · terlambat" : a.status)); r.appendChild(st);
      r.appendChild(el("td", null, a.tgl || "")); r.appendChild(el("td", null, a.janji || "–")); r.appendChild(el("td", "mono", a.kode || "")); r.appendChild(el("td", null, a.zona || ""));
      tb.appendChild(r);
    }
    tbl.appendChild(tb);

    const kas = $("#kas"); kas.replaceChildren();
    kas.appendChild(tile("Kas masuk bulan ini", rpK(k.kas_masuk_bulan), rp(k.kas_masuk_bulan)));
    kas.appendChild(tile("Kas keluar bulan ini", rpK(k.kas_keluar_bulan), rp(k.kas_keluar_bulan)));
    const net = (k.kas_masuk_bulan || 0) - (k.kas_keluar_bulan || 0);
    kas.appendChild(tile("Arus kas bersih", rpK(net), rp(net), net < 0 ? "bad" : "", net < 0 ? "bad" : null));
    kas.appendChild(tile("Saldo kas", rpK(k.saldo_kas), "harus = saldo rekening bisnis", (k.saldo_kas || 0) < 0 ? "bad" : "", (k.saldo_kas || 0) < 0 ? "bad" : null));

    $("#upd").textContent = (source === "demo" ? "Data demo · " : "Diperbarui ") + new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  }
  function addMonths(ym, n) { const [y, m] = ym.split("-").map(Number); const d = new Date(y, m - 1 + n, 1); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0"); }

  /* ---------- muat ---------- */
  const msg = $("#msg");
  function note(text, isErr) { msg.hidden = !text; msg.textContent = text || ""; msg.style.color = isErr ? "var(--bad)" : ""; }
  async function load() {
    const url = localStorage.getItem(KEY);
    if (!url) { $("#setup").hidden = false; note("Belum ada sumber data. Tempel tautan CSV tab “Data dasbor”, atau lihat contohnya dengan data demo."); render(demoModel(), "demo"); return; }
    try {
      note("");
      document.body.style.opacity = "0.6";
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const text = await res.text();
      if (!/^bagian,kunci/i.test(text.trim())) throw new Error("Isi tautan bukan tab “Data dasbor” (baris pertama harus: bagian,kunci,…). Pastikan yang dipublikasikan tab itu, format CSV.");
      render(model(parseCsv(text)), "sheet");
    } catch (e) {
      note("Gagal memuat: " + e.message + " · Periksa: sheet sudah “Publikasikan ke web”? tab “Data dasbor”? format CSV?", true);
    } finally { document.body.style.opacity = ""; }
  }
  $("#setup-btn").addEventListener("click", () => { $("#setup").hidden = !$("#setup").hidden; $("#csv-url").value = localStorage.getItem(KEY) || ""; });
  $("#save-url").addEventListener("click", () => { const v = $("#csv-url").value.trim(); if (!/^https:\/\/docs\.google\.com\//.test(v)) { note("Tautan harus dari docs.google.com.", true); return; } localStorage.setItem(KEY, v); $("#setup").hidden = true; load(); });
  $("#demo").addEventListener("click", () => { render(demoModel(), "demo"); note("Ini data demo, bukan data Anda. Tempel tautan CSV untuk data asli."); });
  $("#reload").addEventListener("click", load);
  document.addEventListener("click", (e) => { const b = e.target.closest("[data-table]"); if (!b) return; const fig = document.getElementById(b.dataset.table); const t = fig.querySelector("table"), s = fig.querySelector("svg"), lg = fig.querySelector(".legend"); if (!t) return; t.hidden = !t.hidden; s.hidden = !t.hidden; if (lg) lg.hidden = !t.hidden; b.textContent = t.hidden ? "Tabel" : "Grafik"; });
  load();
  setInterval(() => { if (localStorage.getItem(KEY)) load(); }, REFRESH_MS);
})();
