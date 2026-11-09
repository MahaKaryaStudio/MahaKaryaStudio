/*
 * Konfigurator lampu rakitan: state, harga, pratinjau, dan pesan WhatsApp.
 * Data dari window.MKS_LAMP, kontak dari window.MKS_CONFIG, gambar dari window.LampArt.
 *
 * Kontrak untuk bagian halaman lain (nav, orderbar, #cara, .final, dst.):
 *  - Satu objek `state` adalah sumber kebenaran rakitan (MKSLamp.state).
 *  - Setiap perubahan state (dan sekali setelah halaman dimuat) memicu
 *      document "mks:change"  detail = { state, price, code, waUrl, presetName, partsCount, heightCm,
 *                                        anchor, save, presetIndex, edition, leadTime, zone, reason }
 *    MKSLamp.snapshot() memberi detail yang sama kapan saja (untuk skrip yang dimuat belakangan).
 *  - Semua tautan [data-wa] diperbarui dari state pada setiap perubahan:
 *      data-wa="" / "order"   → pesanan rakitan saat ini (berisi "Kode: MK-…")
 *      data-wa="preset:N"     → pesanan edisi ke-N apa adanya
 *      teks lain              → pesan statis; {kode}, {harga}, {nama} diganti nilai rakitan saat ini
 *  - Perubahan harga diumumkan lewat satu wilayah aria-live="polite" (#mks-live).
 *  - Setiap kait DOM bersifat opsional: markup boleh dihapus/diganti tanpa membuat skrip error.
 */
(function () {
  const C = window.MKS_CONFIG || {};
  const D = () => window.MKS_LAMP;
  const A = window.LampArt;
  if (!D() || !A) return;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const setHtml = (sel, h) => { const el = typeof sel === "string" ? $(sel) : sel; if (el) el.innerHTML = h; return el; };
  const setText = (sel, t) => { const el = typeof sel === "string" ? $(sel) : sel; if (el) el.textContent = t; return el; };
  const rp = (n) => "Rp" + Math.round(n).toLocaleString("id-ID");
  const amountHtml = (n) => `<span class="rp">Rp</span>${Math.round(n).toLocaleString("id-ID")}`;
  // Harga coret + hemat SELALU dalam rupiah (persen hanya "dari harga bagian cetak")
  const wasHtml = (anchor, total) => (anchor > total ? `<s>${rp(anchor)}</s> · hemat ${rp(anchor - total)}` : "");
  const roundK = (n) => Math.round(n / 1000) * 1000;
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const reduceMotion = () => document.documentElement.classList.contains("motion-off") || !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const scrollToEl = (el, block) => { if (el) el.scrollIntoView({ behavior: reduceMotion() ? "auto" : "smooth", block: block || "start" }); };
  const find = A.find;
  const pick = (list) => {
    const ok = list.filter((x) => x.stock !== false);
    return (ok.length ? ok : list)[Math.floor(Math.random() * (ok.length ? ok : list).length)].id;
  };
  const KIND_LABEL = { head: "Kap", body: "Badan", base: "Alas" };

  const listOf = (kind) => (kind === "head" ? D().heads : kind === "body" ? D().bodies : D().bases);
  const colorsOf = (kind) => (kind === "head" ? D().shadeColors : D().colors);
  const photoOf = (kind, shape, color) => D().photos[`${kind}:${shape}:${color}`] || D().photos[`${kind}:${shape}`] || null;

  // Pastikan konfigurasi hanya memakai bentuk/warna yang masih ada di data
  function sanitize(cfg) {
    const fix = (part, kind) => {
      part.shape = find(listOf(kind), part.shape).id;
      part.color = find(colorsOf(kind), part.color).id;
    };
    fix(cfg.head, "head");
    fix(cfg.base, "base");
    cfg.body = cfg.body.slice(0, D().maxBodies);
    if (!cfg.body.length) cfg.body.push({ shape: D().bodies[0].id, color: D().colors[0].id });
    cfg.body.forEach((b) => fix(b, "body"));
    return cfg;
  }

  /* ---------- Harga ---------- */
  function price(cfg) {
    const lines = [];
    let sum = 0;
    const h = find(D().heads, cfg.head.shape);
    lines.push({ kind: "head", label: `Kap · ${h.name}`, shape: h.id, color: find(D().shadeColors, cfg.head.color), price: h.price });
    sum += h.price;
    cfg.body.forEach((p, i) => {
      const b = find(D().bodies, p.shape);
      lines.push({ kind: "body", label: `Badan ${i + 1} · ${b.name}`, shape: b.id, color: find(D().colors, p.color), price: b.price });
      sum += b.price;
    });
    const ba = find(D().bases, cfg.base.shape);
    lines.push({ kind: "base", label: `Alas · ${ba.name}`, shape: ba.id, color: find(D().colors, cfg.base.color), price: ba.price });
    sum += ba.price;
    const n = cfg.body.length + 2;
    const pkg = D().packages[n] || { name: `${n} bagian`, disc: 0, cm: "—" };
    // Harga paket dibulatkan ke ribuan; potongan = selisih dari harga satuan
    const disc = Math.max(0, sum - roundK(sum * (1 - pkg.disc)));
    const wiring = cfg.wiring === false ? 0 : D().wiringPrice;
    const led = cfg.led ? D().ledPrice : 0;
    const total = sum - disc + wiring + led;
    return { lines, parts: sum, n, pkg, disc, wiring, led, total };
  }
  // Harga paket termurah untuk n bagian, termasuk kit kelistrikan:
  // {anchor: jumlah harga satuan + kit, price: harga paket + kit}
  function minPackagePrice(n) {
    const min = (list) => Math.min(...list.map((x) => x.price));
    const parts = min(D().heads) + min(D().bodies) * (n - 2) + min(D().bases);
    const w = D().wiringPrice;
    return { anchor: parts + w, price: roundK(parts * (1 - D().packages[n].disc)) + w };
  }
  function code(cfg) {
    const k = (s) => s.slice(0, 3).toUpperCase();
    const arr = [k(cfg.head.shape) + k(cfg.head.color), ...cfg.body.map((b) => k(b.shape) + k(b.color)), k(cfg.base.shape) + k(cfg.base.color)];
    return "MK-" + arr.join("-") + (cfg.wiring === false ? "-TK" : "") + (cfg.led ? "-LED" : "");
  }
  // Kebalikan code(): "MK-KERGAD-KUBBAT-KOTBAT[-TK][-LED]" → konfigurasi, atau null
  function decodeCode(str) {
    const parts = String(str || "").trim().toUpperCase().split("-").filter(Boolean);
    if (parts[0] !== "MK") return null;
    const led = parts.includes("LED"), wiring = !parts.includes("TK");
    const segs = parts.slice(1).filter((x) => x !== "LED" && x !== "TK");
    if (segs.length < 3 || segs.length > 2 + D().maxBodies) return null;
    const k = (x) => x.slice(0, 3).toUpperCase();
    const pick3 = (list, pre) => list.find((x) => k(x.id) === pre);
    const part = (kind, seg) => {
      const sh = pick3(listOf(kind), seg.slice(0, 3)), co = pick3(colorsOf(kind), seg.slice(3, 6));
      return sh && co ? { shape: sh.id, color: co.id } : null;
    };
    const head = part("head", segs[0]), base = part("base", segs[segs.length - 1]);
    const body = segs.slice(1, -1).map((x) => part("body", x));
    if (!head || !base || body.some((b) => !b)) return null;
    return { head, body, base, led, wiring };
  }
  // Tautan yang membuka konfigurator dengan rakitan ini
  const shareUrl = (cfg) => {
    const u = new URL(location.href);
    u.search = "";
    u.searchParams.set("kode", code(cfg));
    if (cfg.zone) u.searchParams.set("zona", cfg.zone);
    u.hash = "rakit";
    return u.toString();
  };
  // Simpan rakitan di browser supaya bisa dilanjutkan nanti
  const SAVE_KEY = "mks-rakit-v1";
  let touched = false;
  function persist() {
    if (!touched) return;
    try { localStorage.setItem(SAVE_KEY, JSON.stringify({ head: state.head, body: state.body, base: state.base, led: state.led, wiring: state.wiring, zone: state.zone, gift: state.gift, t: Date.now() })); } catch {}
    try { history.replaceState(null, "", shareUrl(state).replace(/#rakit$/, location.hash || "")); } catch {}
  }
  // Indeks preset yang sama persis dengan konfigurasi, atau -1
  function presetIndex(cfg) {
    const same = (a, b) => a.shape === b.shape && a.color === b.color;
    return D().presets.findIndex((p) => same(p.head, cfg.head) && same(p.base, cfg.base) && p.body.length === cfg.body.length && p.body.every((b, i) => same(b, cfg.body[i])));
  }
  const leadTimeOf = (cfg) => (presetIndex(cfg) >= 0 ? D().leadTime.preset : D().leadTime.custom);
  const zones = () => (C.shipping && Array.isArray(C.shipping.zones) ? C.shipping.zones : []);
  const zoneOf = (cfg) => zones().find((z) => z.id === cfg.zone) || zones()[0] || null;
  function waText(cfg) {
    const p = price(cfg);
    const z = zoneOf(cfg);
    return (
      `Halo ${C.brand}, saya mau pesan lampu rakitan:\nKode: ${code(cfg)}\n` +
      p.lines.map((l) => `• ${l.label} — ${l.color.name}`).join("\n") +
      `\n• Kelistrikan: ${cfg.wiring === false ? "tanpa (hanya bagian cetak)" : "kit kelistrikan (komponen bertanda SNI/K3L)"}` +
      `\n• Bola LED 5 W hangat: ${cfg.led ? "ya" : "tidak"}` +
      `\nPaket ${p.pkg.name} (${p.n} bagian) — ${rp(p.total)}` +
      (z ? `\nKirim ke ${z.label}, perkiraan ongkir ${rp(z.price)} → total ±${rp(p.total + z.price)}` : "") +
      `\nTinggi ≈ ${A.totalCm(cfg).toFixed(0)} cm · produksi ${leadTimeOf(cfg)}` +
      (cfg.gift && cfg.gift.on
        ? `\n\n🎁 Kirim sebagai kado untuk: ${cfg.gift.to || "(nama penerima)"}` +
          `\nPesan kartu: "${cfg.gift.msg || "(isi pesan)"}"` +
          `\nTanpa harga di paket: ${cfg.gift.hide === false ? "tidak" : "ya"}` +
          `\n\nNama pemesan: \nAlamat kirim (penerima): `
        : `\n\nNama: \nAlamat kirim: `)
    );
  }
  const waLink = (msg) => `https://wa.me/${C.whatsapp}?text=${encodeURIComponent(msg)}`;

  /* ---------- State: satu sumber kebenaran ---------- */
  const state = sanitize(clone(D().presets[D().popularPreset] || D().presets[0]));
  state.led = false; // bohlam adalah tambahan berbayar
  state.wiring = true; // kit kelistrikan (komponen bertanda SNI/K3L), bisa dilepas
  state.on = true; // saklar panggung studio
  state.zone = zones()[0] ? zones()[0].id : null;
  state.gift = { on: false, to: "", msg: "", hide: true };
  state.edition = D().popularPreset || 0; // edisi yang sedang dilihat di #edisi (tidak mengubah rakitan)
  const hero = { cfg: sanitize(clone(D().presets[0])), on: true, dim: 1 };
  const catColor = {};
  // Bilah pesan HP: tampil saat pilihan konfigurator terlihat, kecuali selama tombol WA ringkasan terlihat
  const obState = { ctrl: false, wa: false };
  let waIO = null;

  // Jam balas dari config ("09.00–21.00 WIB") tidak boleh terpotong di tengah rentang
  const replyHtml = (txt) => esc(txt).replace(/(\d{1,2}[.:]\d{2})\s*[–-]\s*(\d{1,2}[.:]\d{2}(?:\s*WIB)?)/g, '<span class="nowrap">$1–$2</span>');
  const lowerFirst = (s) => (s ? s.charAt(0).toLowerCase() + s.slice(1) : "");

  /* ---------- Label SVG minimal 12 px di layar ----------
     Label ukuran (Ø 20 cm, ≈ 39 cm) dan anotasi (KAP, ulir M20) ditulis dalam satuan viewBox.
     Saat SVG mengecil (HP), font-size dinaikkan supaya teks tetap ≥ 12 px di layar. */
  const MIN_TEXT_PX = 12;
  const FIT_HOSTS = "#edisi-app, #spec-fig, #exploded";
  function fitSvgText(host) {
    (host ? [host] : $$(FIT_HOSTS)).forEach((h) => {
      if (!h) return;
      h.querySelectorAll("svg").forEach((svg) => {
        const nodes = svg.querySelectorAll("[font-size]");
        if (!nodes.length) return;
        let m = null;
        try { m = svg.getScreenCTM(); } catch {}
        const s = m ? Math.hypot(m.a, m.b) : 0;
        if (!s) return;
        nodes.forEach((n) => {
          if (n.getAttribute("data-fs") == null) n.setAttribute("data-fs", n.getAttribute("font-size"));
          const base = parseFloat(n.getAttribute("data-fs")) || MIN_TEXT_PX;
          n.setAttribute("font-size", Math.max(base, MIN_TEXT_PX / s).toFixed(2));
        });
      });
    });
  }

  function toast(msg) {
    const t = $("#toast");
    if (!t) return;
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toast.t);
    toast.t = setTimeout(() => t.classList.remove("show"), 2400);
  }

  /* ---------- Siaran perubahan: event, [data-wa], aria-live ---------- */
  function presetCfg(i) { return Object.assign(sanitize(clone(D().presets[i])), { wiring: true, led: false }); }
  function snapshot(reason) {
    const p = price(state);
    const pi = presetIndex(state);
    return {
      state,
      price: p,
      code: code(state),
      waUrl: waLink(waText(state)),
      presetName: pi >= 0 ? D().presets[pi].name : null,
      presetIndex: pi,
      partsCount: p.n,
      heightCm: Math.round(A.totalCm(state)),
      anchor: p.parts + p.wiring + p.led,
      save: p.disc,
      edition: state.edition,
      leadTime: leadTimeOf(state),
      zone: zoneOf(state),
      reason: reason || "change",
    };
  }
  function waMessageFor(el, det) {
    const v = el.getAttribute("data-wa") || "";
    if (v === "" || v === "order") return waText(state);
    const m = /^preset:(\d+)$/.exec(v);
    if (m) {
      const i = +m[1];
      if (D().presets[i]) return waText(Object.assign(presetCfg(i), { zone: state.zone, gift: { on: false } }));
      return waText(state);
    }
    return v.replace(/\{kode\}/g, det.code).replace(/\{harga\}/g, rp(det.price.total)).replace(/\{nama\}/g, det.presetName || "rakitan custom");
  }
  function refreshWa(det) {
    $$("[data-wa]").forEach((a) => {
      a.href = waLink(waMessageFor(a, det));
      if (a.tagName === "A") { a.target = "_blank"; a.rel = "noopener"; }
    });
  }
  let live = null, liveT = 0, lastLive = "";
  function announce(det) {
    if (!live) {
      live = $("#mks-live");
      if (!live) {
        live = document.createElement("div");
        live.id = "mks-live";
        live.className = "sr-only";
        live.setAttribute("aria-live", "polite");
        live.setAttribute("aria-atomic", "true");
        document.body.appendChild(live);
      }
    }
    const msg = `Total ${rp(det.price.total)}` + (det.anchor > det.price.total ? `, hemat ${rp(det.anchor - det.price.total)}` : "");
    if (msg === lastLive) return;
    lastLive = msg;
    clearTimeout(liveT);
    liveT = setTimeout(() => { live.textContent = msg; }, 600);
  }
  let booted = false;
  function emit(reason) {
    const det = snapshot(reason);
    refreshWa(det);
    if (booted) announce(det);
    else lastLive = `Total ${rp(det.price.total)}` + (det.anchor > det.price.total ? `, hemat ${rp(det.anchor - det.price.total)}` : "");
    try { document.dispatchEvent(new CustomEvent("mks:change", { detail: det })); } catch (err) { setTimeout(() => { throw err; }); }
    return det;
  }

  /* ---------- Potongan HTML ---------- */
  const inStock = (c) => c.stock !== false;
  const swatchesHtml = (list, current, attr) =>
    `<div class="swatches">${list
      .map((c) => `<button class="sw${inStock(c) ? "" : " sw--out"}" type="button" aria-pressed="${c.id === current}" title="${esc(c.name)}${inStock(c) ? "" : " — habis"}" style="background:${c.hex}" ${attr} data-color="${c.id}" ${inStock(c) ? "" : "disabled"}><span>${esc(c.name)}${inStock(c) ? "" : " (habis)"}</span></button>`)
      .join("")}</div>`;
  const shapesHtml = (kind, list, current, attr) =>
    `<div class="shapes">${list
      .map((s) => `<button class="shape" type="button" aria-pressed="${s.id === current}" ${attr} data-shape="${s.id}">${A.iconSvg(kind, s.id, "ic" + kind + s.id + attr.replace(/[^a-z0-9]/gi, ""))}${esc(s.name)}</button>`)
      .join("")}</div>`;
  // Gambar satu bagian: foto asli jika ada, kalau tidak ilustrasi
  function partFig(kind, shape, colorId, uid) {
    const photo = photoOf(kind, shape, colorId);
    if (photo) return `<img src="${esc(photo)}" alt="${esc(KIND_LABEL[kind])} ${esc(find(listOf(kind), shape).name)} warna ${esc(find(colorsOf(kind), colorId).name)}" loading="lazy" />`;
    return A.partSvg(kind, shape, find(colorsOf(kind), colorId).hex, uid);
  }

  /* ---------- Render ---------- */
  function renderControls() {
    const el = $("#controls");
    if (!el) return;
    const d = D();
    const hd = find(d.heads, state.head.shape);
    let h =
      `<div class="ctrl"><div class="ctrl-head"><h3>Kap <small>Head</small></h3><span class="price num">${rp(hd.price)}</span></div>` +
      `<div><div class="lbl">Bentuk</div>${shapesHtml("head", d.heads, state.head.shape, 'data-part="head"')}</div>` +
      `<div><div class="lbl">Warna kap</div>${swatchesHtml(d.shadeColors, state.head.color, 'data-part="head"')}</div></div>`;
    h += `<div class="ctrl"><div class="ctrl-head"><h3>Badan <small>Body · ${state.body.length} dari ${d.maxBodies}</small></h3></div>`;
    state.body.forEach((b, i) => {
      const bd = find(d.bodies, b.shape);
      h +=
        `<div class="slot"><div class="slot-top"><b>Badan ${i + 1} · ${rp(bd.price)}</b>${state.body.length > 1 ? `<button class="x" type="button" data-remove="${i}">Hapus</button>` : ""}</div>` +
        `<div><div class="lbl">Bentuk</div>${shapesHtml("body", d.bodies, b.shape, `data-part="body" data-i="${i}"`)}</div>` +
        `<div><div class="lbl">Warna</div>${swatchesHtml(d.colors, b.color, `data-part="body" data-i="${i}"`)}</div></div>`;
    });
    const full = state.body.length >= d.maxBodies;
    h += `<button class="add" type="button" id="add-body" ${full ? "disabled" : ""}>${full ? `Maksimal ${d.maxBodies} badan` : "+ Tambah badan"}</button></div>`;
    const ba = find(d.bases, state.base.shape);
    h +=
      `<div class="ctrl"><div class="ctrl-head"><h3>Alas <small>Base</small></h3><span class="price num">${rp(ba.price)}</span></div>` +
      `<div><div class="lbl">Bentuk</div>${shapesHtml("base", d.bases, state.base.shape, 'data-part="base"')}</div>` +
      `<div><div class="lbl">Warna</div>${swatchesHtml(d.colors, state.base.color, 'data-part="base"')}</div></div>`;
    h +=
      `<div class="ctrl"><div class="ctrl-head"><h3>Kelistrikan <small>opsional</small></h3></div>` +
      `<div class="toggle-row"><div class="desc"><b id="wiring-label">${esc(d.wiringLabel)}</b><small id="wiring-desc">Komponen dari produsen terdaftar. Tanpa kit ini, kamu menerima bagian cetak saja dan memasang kelistrikan sendiri.</small></div><button class="switch" type="button" id="wiring-switch" role="switch" aria-labelledby="wiring-label wiring-switch" aria-describedby="wiring-desc" aria-checked="${state.wiring !== false}"><i></i>${rp(d.wiringPrice)}</button></div>` +
      `<div class="toggle-row"><div class="desc"><b id="led-label">Bola LED 5 W warna hangat</b><small id="led-desc">2700 K, E27. Maksimal 5 W agar kap tetap dingin.</small></div><button class="switch" type="button" id="led-switch" role="switch" aria-labelledby="led-label led-switch" aria-describedby="led-desc" aria-checked="${state.led}"><i></i>${rp(d.ledPrice)}</button></div>` +
      `<div class="row-wrap"><button class="ghost" type="button" id="random"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M2 4h3l6 8h3M2 12h3l1.5-2M9.5 6L11 4h3M12 2l2 2-2 2M12 10l2 2-2 2"/></svg>Acak kombinasi</button></div></div>`;
    el.innerHTML = h;
  }

  function renderSummary() {
    const p = price(state);
    const anchorTotal = p.parts + p.wiring + p.led;
    const pi = presetIndex(state);
    const z = zoneOf(state);
    const zs = zones();
    const summary = $("#summary");
    if (summary) {
      let rows = p.lines
        .map((l) => `<div class="row row-sw"><span><i style="background:${l.color.hex}"></i>${esc(l.label)} — ${esc(l.color.name)}</span><span class="num">${rp(l.price)}</span></div>`)
        .join("");
      rows += `<div class="row"><span>Harga satuan ${p.n} bagian</span><span class="num"><s>${rp(p.parts)}</s></span></div>`;
      if (p.disc) rows += `<div class="row row-disc"><span>Potongan paket ${esc(p.pkg.name)} (${Math.round(p.pkg.disc * 100)}% dari bagian cetak)</span><span class="num">− ${rp(p.disc)}</span></div>`;
      rows += p.wiring
        ? `<div class="row"><span>Kit kelistrikan (komponen bertanda SNI/K3L)</span><span class="num">${rp(p.wiring)}</span></div>`
        : `<div class="row"><span>Tanpa kelistrikan (hanya bagian cetak)</span><span class="num">Rp0</span></div>`;
      rows += state.led
        ? `<div class="row"><span>Bola LED 5 W hangat</span><span class="num">${rp(p.led)}</span></div>`
        : `<div class="row"><span>Tanpa bohlam (LED sendiri, maks 5 W)</span><button class="add-led" type="button" id="led-add">+ Bohlam LED ${rp(D().ledPrice)}</button></div>`;
      summary.innerHTML =
        `<div class="badges"><span class="badge">Paket ${esc(p.pkg.name)} · ${p.n} bagian</span>${pi >= 0 ? `<span class="badge">Edisi ${esc(D().presets[pi].name)}</span>` : '<span class="badge">Rakitan custom</span>'}</div>` +
        `<div class="rows">${rows}</div>` +
        `<div class="total"><div><small>${p.wiring ? "Total termasuk kit kelistrikan" : "Total bagian cetak"}${p.led ? " + bohlam" : ""}</small>${p.disc ? `<s class="was num">${rp(anchorTotal)}</s>` : ""}<b class="num">${rp(p.total)}</b></div><span class="code">${code(state)}</span></div>` +
        (p.disc ? `<div class="save">Hemat <b>${rp(p.disc)}</b> dibanding beli ${p.n} bagian satuan</div>` : "") +
        (zs.length
          ? `<div class="ship"><label for="zone-select">Kirim ke</label><select id="zone-select">${zs.map((x) => `<option value="${esc(x.id)}"${z && x.id === z.id ? " selected" : ""}>${esc(x.label)} · ±${rp(x.price)}</option>`).join("")}</select><div class="ship__total"><span>Perkiraan total dengan ongkir</span><b class="num">±${rp(p.total + (z ? z.price : 0))}</b></div><small>${esc((C.shipping && C.shipping.note) || "")}</small></div>`
          : "") +
        `<div class="gift${state.gift.on ? " is-on" : ""}"><label class="gift__head"><input type="checkbox" id="gift-on" ${state.gift.on ? "checked" : ""}/> <span>Kirim sebagai kado</span><small>Kartu ucapan gratis, dikemas rapi, tanpa harga di paket</small></label>` +
        (state.gift.on
          ? `<div class="gift__fields"><input id="gift-to" type="text" maxlength="40" placeholder="Nama penerima" value="${esc(state.gift.to)}" /><textarea id="gift-msg" rows="2" maxlength="120" placeholder="Pesan di kartu (maks 120 huruf)">${esc(state.gift.msg)}</textarea><label class="gift__opt"><input type="checkbox" id="gift-hide" ${state.gift.hide === false ? "" : "checked"}/> Tanpa harga di paket</label></div>`
          : "") +
        `</div>` +
        `<div class="acts"><a class="btn btn--wa btn--lg" id="wa-link" data-wa="order" href="${waLink(waText(state))}" target="_blank" rel="noopener">Pesan via WhatsApp</a>` +
        `<small class="reply">${replyHtml(C.replyPromise || "")}</small>` +
        `<div class="acts__row"><button class="btn btn--ghost btn--sm" type="button" id="share-link">Bagikan rakitan</button>` +
        `<button class="btn btn--ghost btn--sm" type="button" id="copy-summary">Salin ringkasan</button></div>` +
        (pi < 0 ? `<button class="btn btn--ghost btn--sm" type="button" id="back-preset">Kembali ke edisi awal</button>` : "") +
        `</div>` +
        `<p class="note">Produksi <b>${esc(leadTimeOf(state))}</b>${pi >= 0 ? " (edisi, bagian berstok)" : " (kombinasi custom dicetak khusus)"}. Bayar transfer bank / QRIS setelah konfirmasi.</p>` +
        marketRow(pi >= 0 ? D().presets[pi] : null, "mkt--dark");
      watchWaLink();
    }
    // Bilah pesan di HP
    setHtml(
      "#orderbar",
      `<div class="orderbar__info"><span>${p.disc ? `<s class="num">${rp(anchorTotal)}</s>` : ""}<small>${p.disc ? `Hemat ${rp(p.disc)}` : `Paket ${esc(p.pkg.name)}`}</small></span><b class="num">${rp(p.total)}</b></div>` +
        `<a class="btn btn--wa" data-wa="order" href="${waLink(waText(state))}" target="_blank" rel="noopener">Pesan</a>`
    );
    // Strip bagian terpilih: foto asli bila ada
    setHtml(
      "#parts-strip",
      p.lines.map((l, i) => `<figure class="pstrip__item"><div class="pstrip__fig">${partFig(l.kind, l.shape, l.color.id, "ps" + i)}</div><figcaption>${esc(l.label.split(" · ")[1] || l.label)}<small>${esc(l.color.name)}</small></figcaption></figure>`).join("")
    );
  }

  function renderPreview() {
    const cm = `≈ ${A.totalCm(state).toFixed(0)} cm`;
    setHtml("#cfg-lamp", A.renderLamp(state, { uid: "cfg", on: state.on, cover: true }));
    const st = $("#cfg-stage");
    if (st) st.style.setProperty("--dim", state.on ? 1 : 0);
    const sw = $("#cfg-switch");
    if (sw) {
      sw.setAttribute("aria-checked", state.on);
      if (sw.lastChild && sw.lastChild.nodeType === 3) sw.lastChild.nodeValue = state.on ? "Nyala" : "Mati";
    }
    setText("#cfg-height", cm);
    setHtml("#spec-fig", A.renderLamp(state, { uid: "spec", on: false, dims: true, vb: "0 36 360 444" }));
    setText("#spec-height", cm);
    setText("#spec-weight", `≈ ${A.totalKg(state).toFixed(1).replace(".", ",")} kg`);
    fitSvgText($("#spec-fig"));
  }
  // Render ulang lewat innerHTML menghancurkan elemen yang sedang fokus; simpan "alamat"nya
  // (id atau kombinasi data-*) lalu fokuskan lagi elemen yang setara setelah render.
  function focusKey(el) {
    if (!el || el === document.body || !el.closest("#rakit, #edisi, #bagian, #paket, [data-keep-focus]")) return null;
    if (el.id) return "#" + CSS.escape(el.id);
    if (el.name === "edisi") return `input[name="edisi"][value="${CSS.escape(el.value)}"]`;
    const d = el.dataset || {};
    const keys = ["part", "i", "shape", "color", "cat", "use", "preset", "pkg", "remove", "edisiOrder", "edisiEdit"].filter((k) => d[k] != null);
    if (!keys.length) return null;
    const attr = (k) => "data-" + k.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase());
    return el.tagName.toLowerCase() + keys.map((k) => `[${attr(k)}="${CSS.escape(d[k])}"]`).join("");
  }
  function keepFocus(fn) {
    let key = null;
    try { key = focusKey(document.activeElement); } catch {}
    fn();
    if (!key) return;
    let el = null;
    try { el = document.querySelector(key); } catch {}
    if (el && el !== document.activeElement && !el.disabled) el.focus({ preventScroll: true });
  }
  // Semua perubahan rakitan lewat sini: render, simpan, siarkan
  function renderAll(reason) {
    keepFocus(() => {
      renderControls();
      renderSummary();
      renderPreview();
    });
    persist();
    return emit(reason);
  }

  function renderHero() {
    setHtml("#hero-lamp", A.renderLamp(hero.cfg, { uid: "hero", on: hero.on, dim: hero.dim, cover: true }));
    // Saat motion aktif, nyala lampu hero dikendalikan scroll (motion.js) sampai pengguna menyentuh saklar/dimmer
    const st = $("#hero-stage");
    if (st) {
      const byScroll = document.documentElement.classList.contains("motion-on") && hero.on && !st.dataset.auto && !st.dataset.off;
      if (!byScroll) st.style.setProperty("--dim", hero.on ? hero.dim : 0);
    }
    const sw = $("#hero-switch");
    if (sw) {
      sw.setAttribute("aria-checked", hero.on);
      if (sw.lastChild && sw.lastChild.nodeType === 3) sw.lastChild.nodeValue = hero.on ? "Nyala" : "Mati";
    }
    const pre = D().presets[0];
    setText('[data-stage-pill="hero"]', `Ilustrasi${pre ? " · Edisi " + pre.name : ""}`);
    const d = D();
    const m = minPackagePrice(3);
    setText("#hero-from", rp(m.price)); // hero tanpa harga coret (brief): "Mulai dari Rp375.000 · termasuk kit kelistrikan"
    setText("#chip-shapes", d.heads.length + d.bodies.length + d.bases.length);
    setText("#chip-colors", d.colors.length);
  }
  function renderPresets() {
    const el = $("#presets");
    if (!el) return;
    el.innerHTML =
      "<p>Mulai dari salah satu edisi:</p><div class=\"presets__row\">" +
      D()
        .presets.map((p, i) => {
          const n = p.body.length + 2;
          const pr = price(Object.assign(sanitize(clone(p)), { wiring: true, led: false }));
          return `<button class="preset" type="button" data-preset="${i}">${A.renderLamp(sanitize(clone(p)), { uid: "pr" + i, on: true, dim: 0.7, table: false, vb: "50 60 220 400" })}<b>${esc(p.name)}</b><small>${n} bagian · ${esc((D().packages[n] || {}).name || "")}</small><span class="preset__price num">${rp(pr.total)}</span></button>`;
        })
        .join("") + "</div>";
  }
  function renderPackages() {
    const el = $("#pkgs");
    if (!el) return;
    el.innerHTML = Object.keys(D().packages)
      .map(Number)
      .sort((a, b) => a - b)
      .map((n) => {
        const pk = D().packages[n];
        const popPreset = D().presets[D().popularPreset] || D().presets[0];
        const hot = !!popPreset && n === popPreset.body.length + 2; // paket edisi pilihan studio, bukan klaim penjualan
        const m = minPackagePrice(n);
        return (
          `<div class="pkg${hot ? " hot" : ""}">${hot ? '<span class="pkg__flag">Rekomendasi kami</span>' : ""}<div class="top"><div class="n">${n}<small>bagian</small></div></div><h3>Paket ${esc(pk.name)}</h3>` +
          `<ul><li>1 kap + ${n - 2} badan + 1 alas + kit kelistrikan</li><li>Tinggi ± ${esc(pk.cm)} cm</li><li>${esc(pk.note || "")}</li></ul>` +
          `<div class="from"><small>mulai dari</small><b class="num">${rp(m.price)}</b>${m.price < m.anchor ? `<span><s class="num">${rp(m.anchor)}</s> <em>satuan · hemat ${rp(m.anchor - m.price)}</em></span>` : ""}</div><button class="btn ${hot ? "btn--primary" : "btn--ghost"}" type="button" data-pkg="${n}">Rakit paket ini</button></div>`
        );
      })
      .join("");
  }
  function renderCatalog() { keepFocus(renderCatalogNow); }
  function renderCatalogNow() {
    const el = $("#catalog");
    if (!el) return;
    let h = "";
    const card = (kind, item) => {
      const list = colorsOf(kind);
      const cur = catColor[kind + item.id] || list[0].id;
      const photo = photoOf(kind, item.id, cur);
      h +=
        `<div class="pcard" data-card="${kind}:${item.id}"><div class="fig${photo ? " fig--photo" : ""}">${partFig(kind, item.id, cur, "cat" + kind + item.id)}${photo ? '<span class="fig__tag">Foto asli</span>' : ""}</div>` +
        `<div class="meta"><h3>${esc(item.name)}</h3><small>${KIND_LABEL[kind]}</small></div><div class="price num"><b>${rp(item.price)}</b> / pcs</div>` +
        swatchesHtml(list, cur, `data-cat="${kind}:${item.id}"`) +
        `<button class="ghost" type="button" data-use="${kind}:${item.id}">Pakai di rakitan</button></div>`;
    };
    D().heads.forEach((x) => card("head", x));
    D().bodies.forEach((x) => card("body", x));
    D().bases.forEach((x) => card("base", x));
    el.innerHTML = h;
  }
  /* ---------- Marketplace: hanya link yang ada di config.js ---------- */
  const MARKETS = [
    // Menerima link toko penuh maupun link pendek dari tombol Bagikan (shp.ee, tk.tokopedia, vt.tiktok)
    { id: "tokopedia", name: "Tokopedia", re: /\/\/([a-z0-9-]+\.)*tokopedia\.[a-z.]+\/[^/?#]+/i },
    { id: "shopee", name: "Shopee", re: /\/\/([a-z0-9-]+\.)*(shopee\.[a-z.]+|shp\.ee)\/[^/?#]+/i },
    { id: "tiktok", name: "TikTok Shop", re: /\/\/([a-z0-9-]+\.)*tiktok\.[a-z.]+\/[^/?#]+/i },
  ];
  const storeUrl = (id) => { const m = MARKETS.find((x) => x.id === id); const u = C[id] || ""; return m && m.re.test(u) ? u : ""; };
  // Tautan "Juga tersedia di …": link per edisi (preset.shop) bila ada, kalau tidak link toko
  function marketRow(preset, cls) {
    const items = MARKETS.map((m) => ({ m, url: (preset && preset.shop && preset.shop[m.id]) || storeUrl(m.id) })).filter((x) => x.url);
    if (!items.length) return "";
    return `<div class="mkt ${cls || ""}"><div class="mkt__row">${items.map((x) => `<a class="text-link" href="${esc(x.url)}" target="_blank" rel="noopener">Juga tersedia di ${esc(x.m.name)} <span class="arrow" aria-hidden="true">→</span></a>`).join("")}</div><small>Stok warna tetap kami cek dulu lewat WhatsApp.</small></div>`;
  }

  /* ---------- 01 Lima edisi ---------- */
  function renderEditions() { keepFocus(renderEditionsNow); }
  function renderEditionsNow() {
    const el = $("#edisi-app");
    if (!el) return;
    const d = D();
    if (!d.presets[state.edition]) state.edition = 0;
    const edition = state.edition;
    const cfg = presetCfg(edition);
    const pr = price(cfg);
    const p = d.presets[edition];
    el.innerHTML =
      `<div class="edisi__stage stage" style="--dim:1"><div class="wall"></div><div class="glow"></div><div class="lamp">${A.renderLamp(cfg, { uid: "ed", on: true, dim: 0.95, dims: true, cover: true })}</div><span class="pill stage__pill">Ilustrasi · Edisi ${esc(p.name)}</span></div>` +
      `<div class="edisi__side">` +
      `<div class="edisi__list" role="radiogroup" aria-label="Pilih edisi">${d.presets.map((q, i) => {
        const c = presetCfg(i), qp = price(c), n = q.body.length + 2;
        return `<label class="edisi__opt${i === edition ? " is-on" : ""}"><input type="radio" name="edisi" value="${i}" ${i === edition ? "checked" : ""}/><span class="edisi__sw"><i style="background:${A.shadeHex(c.head.color)}"></i>${c.body.map((x) => `<i style="background:${A.hexOf(x.color)}"></i>`).join("")}<i style="background:${A.hexOf(c.base.color)}"></i></span><span class="edisi__name"><b>${esc(q.name)}</b>${i === d.popularPreset ? '<em class="badge">Pilihan studio</em>' : `<small>${n} bagian · Paket ${esc((d.packages[n] || {}).name || "")}</small>`}</span><span class="edisi__price num">${rp(qp.total)}</span></label>`;
      }).join("")}</div>` +
      `<div class="edisi__detail">` +
      `<h3>Edisi ${esc(p.name)}</h3><p class="edisi__story">${esc(p.story || "")}</p>` +
      `<dl class="edisi__specs"><div><dt>Tinggi</dt><dd>≈ ${A.totalCm(cfg).toFixed(0)} cm</dd></div><div><dt>Kap</dt><dd>Ø 20 cm</dd></div><div><dt>Bobot</dt><dd>≈ ${A.totalKg(cfg).toFixed(1).replace(".", ",")} kg</dd></div><div><dt>Cocok untuk</dt><dd>${esc(p.room || "meja kerja")}</dd></div></dl>` +
      `<ul class="edisi__mat"><li>PLA matte, lapis 0,2 mm, dicetak sesuai pesanan</li><li>Ulir cetak M20 di semua bagian, tanpa lem</li><li>${esc(d.wiringLabel)} (bisa dilepas)</li></ul>` +
      // Price block: label → "Harga satuan ~~coret~~ · hemat RpX" (selalu rupiah) → harga, semua dari price()
      `<div class="edisi__total"><div class="price-block price-block--md"><p class="price-block__label">Harga edisi, termasuk kit</p>${pr.disc ? `<p class="price-block__was num">Harga satuan ${wasHtml(pr.parts + pr.wiring, pr.total)}</p>` : ""}<p class="price-block__amount num">${amountHtml(pr.total)}</p></div><span class="edisi__lead">Produksi ${esc(d.leadTime.preset)}</span></div>` +
      `<div class="edisi__acts"><button class="btn btn--primary" type="button" data-edisi-order="${edition}">Pesan edisi ini</button><button class="btn btn--ghost" type="button" data-edisi-edit="${edition}">Ubah bagian</button></div>` +
      marketRow(p, "mkt--light") +
      `</div></div>`;
    fitSvgText(el);
  }
  // Kartu pesan ringkas yang diulang di beberapa bagian
  function renderOrderCards() {
    const d = D(); const i = d.popularPreset || 0; const cfg = presetCfg(i); const pr = price(cfg); const m = minPackagePrice(3);
    $$("[data-ocard]").forEach((el, k) => {
      el.innerHTML =
        `<div class="ocard__fig">${A.renderLamp(cfg, { uid: "oc" + k, on: true, dim: 0.8, table: false, vb: "50 60 220 400" })}</div>` +
        `<div class="ocard__body"><small>Mulai dari</small><b class="num">${rp(m.price)}</b><span>Edisi ${esc(d.presets[i].name)} ${rp(pr.total)} · produksi ${esc(d.leadTime.preset)} · bayar setelah konfirmasi WA</span></div>` +
        `<div class="ocard__acts"><button class="btn btn--primary" type="button" data-edisi-order="${i}">Pesan edisi ${esc(d.presets[i].name)}</button><a class="btn btn--ghost" href="#rakit">Rakit sendiri</a></div>`;
    });
  }
  // Mockup alur WA mengikuti edisi pilihan studio
  function renderAlur() {
    const d = D(); const i = d.popularPreset || 0; const cfg = presetCfg(i); const pr = price(cfg);
    const z = zones()[0];
    $$("[data-alur-code]").forEach((el) => (el.textContent = code(cfg)));
    setHtml("[data-alur-lines]", pr.lines.map((l) => `• ${esc(l.label)} — ${esc(l.color.name)}`).join("<br />"));
    setText("[data-alur-pkg]", pr.pkg.name);
    setText("[data-alur-price]", rp(pr.total));
    setText("[data-alur-total]", rp(pr.total + (z ? z.price : 0)));
    setHtml("[data-alur-photo]", A.renderLamp(cfg, { uid: "alur", on: true, dim: 0.85, vb: "40 40 240 420" }) + '<span class="pill">Ilustrasi</span>');
    // huruf pertama kecil karena muncul di tengah kalimat; "WIB" tetap kapital
    setHtml("[data-reply-inline]", replyHtml(lowerFirst(C.replyPromise || "")));
  }
  // Geser untuk ganti warna badan di ilustrasi "Tiga bagian"
  const EX = { head: { shape: "plisir", color: "gading" }, body: [{ shape: "bola", color: "salmon" }, { shape: "kubus", color: "zaitun" }], base: { shape: "bulat", color: "hitam" } };
  const hex2rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const mix = (a, b, t) => "#" + a.map((v, i) => Math.round(v + (b[i] - v) * t).toString(16).padStart(2, "0")).join("");
  function renderExploded(t) {
    const el = $("#exploded");
    if (!el) return;
    const cols = D().colors.filter((c) => c.stock !== false);
    const cfg = sanitize(clone(EX));
    if (t != null && cols.length > 1) {
      const pos = t * (cols.length - 1), i = Math.min(cols.length - 2, Math.floor(pos)), f = pos - i;
      cfg.body[0].hex = mix(hex2rgb(cols[i].hex), hex2rgb(cols[i + 1].hex), f);
      const near = cols[Math.round(pos)];
      setText("#swipe-name", `· ${near.name}`);
    }
    el.innerHTML = A.renderLamp(cfg, { uid: "ex", on: false, explode: true, table: false, vb: "20 70 300 400" });
    fitSvgText(el);
  }

  function renderStatic() {
    renderExploded(null);
    renderEditions();
    renderOrderCards();
    renderAlur();
    setText("#led-price-note", rp(D().ledPrice));
    setText("#wiring-price-note", rp(D().wiringPrice));
    setText("#wiring-label-note", D().wiringLabel);
    $$("[data-lead-preset]").forEach((el) => { el.textContent = D().leadTime.preset; });
    $$("[data-lead-custom]").forEach((el) => { el.textContent = D().leadTime.custom; });
    // Persen hanya dipakai sebagai "… dari harga bagian cetak" (lead #paket)
    setText("#promo-save", `${Math.round(Math.max(...Object.values(D().packages).map((p) => +p.disc || 0)) * 100)}%`);
  }

  /* ---------- Aksi ---------- */
  function loadPreset(i, reason) {
    const D_ = D();
    if (!D_.presets[i]) return null;
    const p = sanitize(clone(D_.presets[i]));
    Object.assign(state, { head: p.head, body: p.body, base: p.base, led: false, wiring: true });
    touched = true;
    renderAll(reason || "preset");
    return p;
  }
  document.addEventListener("click", (e) => {
    const t = e.target.closest && e.target.closest("button, a");
    if (!t) return;
    const d = t.dataset;
    const D_ = D();
    if (t.id === "hero-switch") { hero.on = !hero.on; const st = $("#hero-stage"); if (st) st.dataset.auto = "1"; return renderHero(); }
    if (t.id === "cfg-switch") { state.on = !state.on; renderPreview(); return emit("switch"); }
    if (t.closest("#rakit, #paket, #bagian")) touched = true;
    if (t.id === "share-link") {
      const url = shareUrl(state);
      const text = `Lihat lampu rakitan ${code(state)} di ${C.brand}`;
      if (navigator.share) return navigator.share({ title: C.brand, text, url }).catch((err) => { if (!err || err.name !== "AbortError") copyText(url, "Tautan rakitan disalin"); });
      return copyText(url, "Tautan rakitan disalin");
    }
    if (d.edisiOrder != null || d.edisiEdit != null) {
      const i = +(d.edisiOrder ?? d.edisiEdit);
      const p = loadPreset(i, d.edisiOrder != null ? "edition-order" : "edition-edit");
      if (!p) return;
      scrollToEl(d.edisiOrder != null ? $("#summary") || $("#rakit") : $("#rakit"), d.edisiOrder != null ? "center" : "start");
      const cw = $("#ctrl-wrap");
      if (d.edisiEdit != null && cw) cw.open = true;
      return toast(d.edisiOrder != null ? `Edisi ${p.name} siap dipesan` : `Edisi ${p.name} dimuat, ubah bagian mana pun`);
    }
    if (t.id === "led-switch" || t.id === "led-add") { state.led = !state.led; return renderAll("led"); }
    if (t.id === "wiring-switch") { state.wiring = state.wiring === false; return renderAll("wiring"); }
    if (t.id === "back-preset") {
      const p = sanitize(clone(D_.presets[D_.popularPreset] || D_.presets[0]));
      Object.assign(state, { head: p.head, body: p.body, base: p.base });
      renderAll("preset");
      return toast(`Kembali ke ${p.name}`);
    }
    if (t.id === "add-body") {
      if (state.body.length < D_.maxBodies) state.body.push({ shape: pick(D_.bodies), color: pick(D_.colors) });
      return renderAll("add-body");
    }
    if (d.remove != null) { state.body.splice(+d.remove, 1); return renderAll("remove-body"); }
    if (t.id === "random") {
      state.body = state.body.map(() => ({ shape: pick(D_.bodies), color: pick(D_.colors) }));
      state.head = { shape: pick(D_.heads), color: pick(D_.shadeColors) };
      state.base = { shape: pick(D_.bases), color: pick(D_.colors) };
      return renderAll("random");
    }
    if (d.preset != null) {
      const p = sanitize(clone(D_.presets[+d.preset]));
      Object.assign(state, { head: p.head, body: p.body, base: p.base });
      renderAll("preset");
      return toast(`Kombinasi ${p.name} dimuat`);
    }
    if (d.pkg != null) {
      const want = +d.pkg - 2;
      while (state.body.length < want) state.body.push({ shape: pick(D_.bodies), color: pick(D_.colors) });
      while (state.body.length > want) state.body.pop();
      renderAll("package");
      scrollToEl($("#rakit"), "start");
      return toast(`Paket ${(D_.packages[+d.pkg] || {}).name || ""} disiapkan`);
    }
    if (d.part) {
      const target = d.part === "body" ? state.body[+d.i] : state[d.part];
      if (!target) return;
      if (d.shape) target.shape = d.shape;
      if (d.color) target.color = d.color;
      return renderAll("part");
    }
    if (d.cat) { catColor[d.cat.replace(":", "")] = d.color; return renderCatalog(); }
    if (d.use) {
      const [kind, shape] = d.use.split(":");
      const col = catColor[kind + shape] || colorsOf(kind)[0].id;
      if (kind === "head") state.head = { shape, color: col };
      else if (kind === "base") state.base = { shape, color: col };
      else if (state.body.length < D_.maxBodies) state.body.push({ shape, color: col });
      else state.body[state.body.length - 1] = { shape, color: col };
      renderAll("use-part");
      scrollToEl($("#rakit"), "start");
      return toast("Dipakai di rakitan");
    }
    if (t.id === "copy-summary") return copyText(waText(state), "Ringkasan disalin");
    if (d.copy) return copyText(d.copy, "Nomor disalin");
  });
  document.addEventListener("change", (e) => {
    const t = e.target;
    if (t.name === "edisi") { state.edition = +t.value; renderEditions(); return emit("edition"); }
    if (t.id === "zone-select") {
      touched = true;
      state.zone = t.value;
      keepFocus(renderSummary);
      persist();
      return emit("zone");
    }
    if (t.id === "gift-on") {
      touched = true;
      state.gift.on = t.checked;
      keepFocus(renderSummary);
      persist();
      emit("gift");
      if (state.gift.on) { const g = $("#gift-to"); if (g) g.focus(); }
      return;
    }
    if (t.id === "gift-hide") { state.gift.hide = t.checked; persist(); return emit("gift"); }
  });
  document.addEventListener("input", (e) => {
    const t = e.target;
    if (t.id === "swipe-range") { renderExploded(+t.value / 1000); return; }
    if (t.id === "gift-to" || t.id === "gift-msg") {
      touched = true;
      state.gift[t.id === "gift-to" ? "to" : "msg"] = t.value;
      persist();
      return emit("gift");
    }
    if (t.id === "hero-dim") {
      hero.dim = t.value / 100;
      hero.on = true;
      const st = $("#hero-stage"); if (st) st.dataset.auto = "1";
      renderHero();
    }
  });
  function copyText(txt, msg) {
    const fallback = () => {
      const ta = document.createElement("textarea");
      ta.value = txt;
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
        toast(msg);
      } catch (_) {
        toast("Tidak bisa menyalin otomatis");
      }
      ta.remove();
    };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(() => toast(msg), fallback);
    else fallback();
  }

  /* ---------- Kontak + boot ---------- */
  function bindStatic() {
    const links = { instagram: `https://instagram.com/${C.instagram}`, email: `mailto:${C.email}`, tokopedia: C.tokopedia, shopee: C.shopee, tiktok: C.tiktok };
    $$("[data-link]").forEach((a) => {
      a.href = links[a.dataset.link] || "#";
      // Sembunyikan link marketplace yang masih mengarah ke beranda marketplace (belum ada toko)
      if (MARKETS.some((m) => m.id === a.dataset.link)) a.hidden = !storeUrl(a.dataset.link);
    });
    $$("[data-marketplace]").forEach((el) => {
      const col = el.closest("[data-marketplace-col]") || el;
      el.hidden = [...col.querySelectorAll("a[data-link]")].filter((a) => MARKETS.some((m) => m.id === a.dataset.link)).every((a) => a.hidden);
    });
    $$("[data-wa-text]").forEach((el) => (el.textContent = "+" + C.whatsapp));
    $$("[data-wa-copy]").forEach((el) => (el.dataset.copy = "+" + C.whatsapp));
    $$("[data-ig]").forEach((el) => (el.textContent = "@" + C.instagram));
    $$("[data-city]").forEach((el) => (el.textContent = C.city || ""));
    $$("[data-reply]").forEach((el) => (el.innerHTML = replyHtml(C.replyPromise || "")));
    $$("[data-address]").forEach((el) => { el.textContent = C.address || ""; const l = el.closest(".contact-line"); if (l) l.hidden = !C.address; });
    $$("[data-nib]").forEach((el) => { el.textContent = C.nib ? "NIB " + C.nib : ""; const l = el.closest(".contact-line"); if (l) l.hidden = !C.nib; });
    $$("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));
  }
  // Data terstruktur produk + rentang harga paket, selalu mengikuti data terkini
  function renderSchema() {
    const ns = Object.keys(D().packages).map(Number);
    const lows = ns.map((n) => minPackagePrice(n).price);
    const max = (list) => Math.max(...list.map((x) => x.price));
    const nMax = Math.max(...ns);
    const high = roundK((max(D().heads) + max(D().bodies) * (nMax - 2) + max(D().bases)) * (1 - D().packages[nMax].disc)) + D().wiringPrice + D().ledPrice;
    let el = document.getElementById("schema-product");
    if (!el) {
      el = document.createElement("script");
      el.type = "application/ld+json";
      el.id = "schema-product";
      document.head.appendChild(el);
    }
    el.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Product",
      name: "Lampu meja rakitan MahaKarya Studio",
      description: "Lampu meja cetak 3D yang dirakit sesuai pesanan: pilih kap, badan, dan alas dengan bentuk dan warna masing-masing.",
      brand: { "@type": "Brand", name: C.brand },
      material: "PLA matte",
      offers: { "@type": "AggregateOffer", priceCurrency: "IDR", lowPrice: Math.min(...lows), highPrice: high, offerCount: ns.length, availability: "https://schema.org/InStock" },
    });
  }
  // Bilah pesan di HP: hanya saat area pilihan konfigurator terlihat, dan disembunyikan selama
  // tombol WhatsApp ringkasan (#wa-link) terlihat, supaya maksimal satu tombol berisi per layar.
  function syncOrderbar() {
    const bar = $("#orderbar");
    if (!bar) return;
    const on = obState.ctrl && !obState.wa;
    bar.hidden = !on;
    document.body.classList.toggle("has-orderbar", on);
    document.documentElement.classList.toggle("has-orderbar", on);
  }
  // #wa-link dirender ulang lewat innerHTML: amati elemen yang baru setiap kali ringkasan dirender
  function watchWaLink() {
    if (!waIO) return;
    waIO.disconnect();
    const a = $("#wa-link");
    if (a) waIO.observe(a);
    else { obState.wa = false; syncOrderbar(); }
  }
  (function orderbarWatch() {
    const target = $("#ctrl-wrap"), bar = $("#orderbar");
    if (!target || !bar || !("IntersectionObserver" in window)) return;
    new IntersectionObserver(([e]) => { obState.ctrl = e.isIntersecting; syncOrderbar(); }, { rootMargin: "-120px 0px 0px 0px" }).observe(target);
    waIO = new IntersectionObserver((es) => { es.forEach((e) => { obState.wa = e.isIntersecting; }); syncOrderbar(); }, { threshold: 0 });
    watchWaLink();
  })();
  // Video latar AI: hanya desktop dan tanpa "kurangi gerakan" (CSS tidak merendernya di HP / reduced motion).
  // Di sana skrip tidak memanggil load()/play() dan tidak menukar sumber, jadi HP tidak mengunduh video.
  (function reel() {
    const v = $("#reel-video"), btn = $("#reel-play");
    if (!v || !("IntersectionObserver" in window) || reduceMotion()) return;
    const narrow = window.matchMedia("(max-width: 860px)");
    if (narrow.addEventListener) narrow.addEventListener("change", () => { if (narrow.matches) v.pause(); });
    if (btn) {
      const syncBtn = () => { btn.textContent = v.paused ? "▶" : "❚❚"; btn.setAttribute("aria-label", v.paused ? "Putar video latar" : "Jeda video latar"); };
      btn.hidden = false;
      syncBtn();
      v.addEventListener("play", syncBtn);
      v.addEventListener("pause", syncBtn);
      btn.addEventListener("click", () => {
        if (v.paused) { delete v.dataset.userPaused; if (v.preload === "none") v.preload = "auto"; v.play().catch(() => {}); }
        else { v.dataset.userPaused = "1"; v.pause(); }
      });
    }
    new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting && !narrow.matches) { if (v.dataset.userPaused) return; if (v.preload === "none") v.preload = "auto"; v.play().catch(() => {}); }
      else v.pause();
    }), { threshold: 0.35 }).observe(v);
  })();
  // Label SVG ikut menyesuaikan saat ukuran panggung berubah (putar layar, ubah jendela)
  if ("ResizeObserver" in window) {
    const ro = new ResizeObserver(() => fitSvgText());
    $$(FIT_HOSTS).forEach((h) => ro.observe(h));
  }

  // Di layar lebar panel ubah bentuk selalu terbuka; di HP dilipat sebagai langkah opsional
  const wide = window.matchMedia("(min-width: 901px)");
  const syncCtrl = () => { const cw = $("#ctrl-wrap"); if (cw && wide.matches) cw.open = true; };
  syncCtrl();
  if (wide.addEventListener) wide.addEventListener("change", syncCtrl);
  function refresh() {
    sanitize(state);
    sanitize(hero.cfg);
    bindStatic();
    renderSchema();
    renderStatic();
    renderHero();
    renderPresets();
    renderPackages();
    renderCatalog();
    return renderAll("refresh");
  }
  refresh();
  // Buka dari tautan bagikan (?kode=…) atau pulihkan rakitan terakhir
  (function restore() {
    const q = new URLSearchParams(location.search);
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem(SAVE_KEY) || "null"); } catch {}
    const validSaved = !!(saved && saved.head && saved.base && Array.isArray(saved.body) && saved.body.length && [saved.head, saved.base, ...saved.body].every((x) => x && typeof x === "object" && typeof x.shape === "string" && typeof x.color === "string"));
    let ownCode = "";
    if (validSaved) { try { ownCode = code(sanitize({ head: saved.head, body: saved.body, base: saved.base, led: !!saved.led, wiring: saved.wiring !== false })); } catch {} }
    // ?kode= yang sama dengan rakitan tersimpan berasal dari persist() (reload / kembali), bukan tautan bagikan
    const fromLink = q.get("kode") && q.get("kode").toUpperCase() !== ownCode && decodeCode(q.get("kode"));
    if (fromLink) {
      Object.assign(state, fromLink);
      const z = q.get("zona"); if (z && zones().some((x) => x.id === z)) state.zone = z;
      touched = true;
      refresh();
      toast("Rakitan dari tautan dimuat");
      setTimeout(() => scrollToEl($("#rakit"), "start"), 300);
      return;
    }
    if (q.get("kode")) history.replaceState(null, "", location.pathname + location.hash);
    if (!validSaved) return;
    const snap = clone(state);
    try {
      const before = code(state);
      const g = saved.gift && typeof saved.gift === "object" ? saved.gift : {};
      Object.assign(state, { head: saved.head, body: saved.body, base: saved.base, led: !!saved.led, wiring: saved.wiring !== false, zone: typeof saved.zone === "string" ? saved.zone : state.zone, gift: { on: !!g.on, to: typeof g.to === "string" ? g.to : "", msg: typeof g.msg === "string" ? g.msg : "", hide: g.hide !== false } });
      sanitize(state);
      refresh();
      if (code(state) !== before && !q.get("kode")) toast("Rakitan terakhirmu dipulihkan");
    } catch {
      // data tersimpan rusak: kembali ke rakitan awal, buang yang rusak
      Object.assign(state, snap);
      try { localStorage.removeItem(SAVE_KEY); } catch {}
      try { refresh(); } catch {}
    }
  })();
  // Siaran awal setelah semua skrip halaman sempat mendaftar pendengar
  const bootEmit = () => { emit("load"); booted = true; };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => setTimeout(bootEmit, 0), { once: true });
  else setTimeout(bootEmit, 0);

  // Ubah rakitan dari skrip lain: MKSLamp.update((s) => { s.led = true; }, "alasan")
  function update(mutator, reason) {
    if (typeof mutator === "function") mutator(state);
    sanitize(state);
    touched = true;
    return renderAll(reason || "update");
  }
  window.MKSLamp = {
    refresh,
    state,
    price,
    code,
    decodeCode,
    shareUrl,
    // tambahan v3 (aditif)
    snapshot: () => snapshot("snapshot"),
    update,
    loadPreset,
    minPackagePrice,
    waText,
    waLink,
    toast,
    fmt: { rp, amountHtml, wasHtml },
  };
})();
