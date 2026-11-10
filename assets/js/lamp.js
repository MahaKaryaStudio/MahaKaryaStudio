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
 *  - Perubahan harga diumumkan lewat satu wilayah aria-live="polite" (#mks-live); ganti edisi juga ("Edisi Senja: Rp464.000, hemat …").
 *  - state.edition = edisi yang tampil di #edisi. Selama rakitan masih berupa edisi, memilih edisi di indeks
 *    ikut mengganti rakitan (studio rakit, orderbar, ringkasan nav sama); rakitan custom tidak ditimpa.
 *    Sebaliknya, rakitan yang menjadi sebuah edisi (preset studio, pulihan, "Pesan edisi ini") menggeser state.edition.
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
  // Paket yang sedang dilihat di segmented #paket (HP); default Kuarto (keputusan pemilik), bukan state rakitan
  let pkgView = null;

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
          // data-fit="exact" (anotasi ukur): tepat 12 px di layar juga saat SVG membesar; diperkecil lewat
          // transform di titik jangkar teks, supaya atribut font-size tidak pernah di bawah 12
          if (n.getAttribute("data-fit") !== "exact") return;
          const k = (MIN_TEXT_PX / s) / base;
          if (k < 0.999) { const x = +n.getAttribute("x") || 0, y = +n.getAttribute("y") || 0; n.setAttribute("transform", `translate(${x} ${y}) scale(${k.toFixed(4)}) translate(${-x} ${-y})`); }
          else n.removeAttribute("transform");
        });
      });
    });
  }

  // Toast (role=status, aria-live=polite) di atas orderbar. Aksi opsional:
  //   toast("Bola (Zaitun) dipasang di Badan 1", { action: { label: "Lihat di studio ↑", href: "#rakit" } })
  //   action.onClick(event) boleh dipakai sebagai ganti/tambahan href. Tampil 2,4 dtk (4 dtk bila ada aksi);
  //   jeda selama kursor/fokus berada di toast.
  function toast(msg, opts) {
    const t = $("#toast");
    if (!t) return;
    const o = opts || {};
    const act = o.action && o.action.label ? o.action : null;
    t.textContent = "";
    t.append(document.createTextNode(String(msg)));
    if (act) {
      const a = document.createElement(act.href ? "a" : "button");
      a.className = "toast__action";
      a.textContent = act.label;
      if (act.href) a.href = act.href;
      else a.type = "button";
      a.addEventListener("click", (e) => {
        if (typeof act.onClick === "function") act.onClick(e);
        hideToast();
      });
      t.append(a);
    }
    toast.ms = o.ms || (act ? 4000 : 2400);
    if (!t.dataset.bound) {
      t.dataset.bound = "1";
      const pause = () => clearTimeout(toast.t);
      const resume = () => { if (t.classList.contains("show")) armToast(); };
      t.addEventListener("mouseenter", pause);
      t.addEventListener("focusin", pause);
      t.addEventListener("mouseleave", resume);
      t.addEventListener("focusout", (e) => { if (!t.contains(e.relatedTarget)) resume(); });
    }
    t.classList.add("show");
    armToast();
  }
  function armToast() { clearTimeout(toast.t); toast.t = setTimeout(hideToast, toast.ms || 2400); }
  // Sembunyikan toast. Aksi yang tersisa di DOM dibuat inert (keluar dari urutan Tab saat toast tak terlihat);
  // bila aksi sedang difokus, fokus pindah ke tujuan tautannya (mis. #rakit) alih-alih jatuh ke <body>.
  function hideToast() {
    clearTimeout(toast.t);
    const t = $("#toast");
    if (!t) return;
    t.classList.remove("show");
    t.querySelectorAll(".toast__action").forEach((x) => {
      const had = x === document.activeElement;
      x.tabIndex = -1;
      x.inert = true;
      if (!had) return;
      const href = x.getAttribute("href") || "";
      let target = null;
      if (href.length > 1 && href[0] === "#") { try { target = document.querySelector(href); } catch (_) {} }
      if (target) {
        if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
        target.focus({ preventScroll: true });
      }
    });
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
  function liveRegion() {
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
    return live;
  }
  // Pesan lain untuk wilayah live yang sama (mis. ganti edisi); menggantikan siaran harga yang masih tertunda
  function say(msg) {
    if (!msg) return;
    liveRegion();
    clearTimeout(liveT);
    liveT = setTimeout(() => { live.textContent = msg; }, 600);
  }
  function announce(det) {
    liveRegion();
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
        // Desktop: tombol WA berisi. HP (≤ 900): orderbar memegang tombol berisi, jadi ringkasan memakai tautan teks
        // (tetap di urutan Tab, tidak menambah tombol berisi kedua di viewport).
        `<div class="acts"><a class="btn btn--wa btn--lg" id="wa-link" data-wa="order" href="${waLink(waText(state))}" target="_blank" rel="noopener">Pesan via WhatsApp</a>` +
        `<a class="text-link summary__wa-hp" id="wa-link-hp" data-wa="order" href="${waLink(waText(state))}" target="_blank" rel="noopener">Pesan via WhatsApp <span class="arrow" aria-hidden="true">→</span></a>` +
        `<small class="reply">${replyHtml(C.replyPromise || "")}</small>` +
        `<div class="acts__row"><button class="btn btn--ghost btn--sm" type="button" id="share-link">Bagikan rakitan</button>` +
        `<button class="btn btn--ghost btn--sm" type="button" id="copy-summary">Salin ringkasan</button></div>` +
        (pi < 0 ? `<button class="btn btn--ghost btn--sm" type="button" id="back-preset">Kembali ke edisi awal</button>` : "") +
        `</div>` +
        `<p class="note">Produksi <b>${esc(leadTimeOf(state))}</b>${pi >= 0 ? " (edisi, bagian berstok)" : " (kombinasi custom dicetak khusus)"}. Bayar transfer bank / QRIS setelah konfirmasi.</p>` +
        marketRow(pi >= 0 ? D().presets[pi] : null, "mkt--dark");
    }
    // Bilah pesan HP (#orderbar) diisi nav.js dari event "mks:change"
    // Strip bagian terpilih: foto asli bila ada
    setHtml(
      "#parts-strip",
      p.lines.map((l, i) => `<figure class="pstrip__item"><div class="pstrip__fig">${partFig(l.kind, l.shape, l.color.id, "ps" + i)}</div><figcaption>${esc(l.label.split(" · ")[1] || l.label)}<small>${esc(l.color.name)}</small></figcaption></figure>`).join("")
    );
  }

  function renderPreview() {
    const cm = `≈ ${A.totalCm(state).toFixed(0)} cm`;
    setHtml("#cfg-lamp", A.renderLamp(state, { uid: "cfg", on: state.on, variant: "studio", label: "Ilustrasi rakitanmu" }));
    const st = $("#cfg-stage");
    if (st) st.style.setProperty("--dim", state.on ? 1 : 0);
    const sw = $("#cfg-switch");
    if (sw) {
      sw.setAttribute("aria-checked", state.on);
      if (sw.lastChild && sw.lastChild.nodeType === 3) sw.lastChild.nodeValue = state.on ? "Nyala" : "Mati";
    }
    setText("#cfg-height", cm);
    setHtml("#spec-fig", A.renderLamp(state, { uid: "spec", on: true, dim: 0.9, dims: true, vb: "0 36 360 464", label: "Ilustrasi rakitanmu dengan ukuran", pill: "Ilustrasi" }));
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
    // #edisi menampilkan edisi yang sama dengan rakitan selama rakitan berupa edisi (preset dari studio, tautan, pulihan)
    const pi = presetIndex(state);
    if (pi >= 0 && pi !== state.edition) { state.edition = pi; fillEdition(); }
    persist();
    return emit(reason);
  }

  // Hero: rig malam lamp-art varian "hero" (desktop 588 × 735) / "hero-hp" (HP 390 × 440).
  // Lampu selalu dirender dengan lapisan nyala; nyala/mati/redup lewat --dim panggung (transisi 600 ms),
  // jadi SVG hanya dirender ulang bila edisi atau varian berubah.
  const heroNarrow = window.matchMedia ? window.matchMedia("(max-width: 860px)") : { matches: false };
  let heroKey = "";
  function renderHero() {
    const pre = D().presets[0];
    const variant = heroNarrow.matches ? "hero-hp" : "hero";
    const key = variant + "|" + code(hero.cfg);
    const host = $("#hero-lamp");
    if (host && key !== heroKey) {
      heroKey = key;
      host.innerHTML = A.renderLamp(hero.cfg, { uid: "hero", variant, vignette: false, dim: hero.dim, label: `Ilustrasi lampu${pre ? " edisi " + pre.name : ""} di atas meja` });
    }
    // Saat motion aktif, nyala lampu hero dikendalikan scroll (motion.js) sampai pengguna menyentuh saklar
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
    // Pil ILUSTRASI: "ILUSTRASI · EDISI SENJA · ≈ 41 CM". Di panggung sempit CSS (container query) menyembunyikan
    // berturut-turut tinggi, kata "Edisi", lalu nama edisi, supaya pil tidak pernah menabrak saklar; "ILUSTRASI" selalu ada.
    setHtml('[data-stage-pill="hero"]', `Ilustrasi${pre ? `<span class="lhero__pill-name"> · <span class="lhero__pill-ed">Edisi </span>${esc(pre.name)}</span>` : ""}<span class="lhero__pill-cm"> · ≈ ${A.totalCm(hero.cfg).toFixed(0)} cm</span>`);
    const d = D();
    const m = minPackagePrice(3);
    setHtml("#hero-from", amountHtml(m.price)); // hero tanpa harga coret (brief): "Mulai dari Rp375.000 · termasuk kit kelistrikan"
    setText("#chip-shapes", d.heads.length + d.bodies.length + d.bases.length);
    setText("#chip-colors", d.colors.length);
  }
  if (heroNarrow.addEventListener) heroNarrow.addEventListener("change", () => renderHero());
  // H1 hero tepat tiga baris pada 112 (HP 52); bila satu baris lebih lebar dari kolom teks (font lain,
  // teks hasil Mode Edit), pakai cadangan brief §11 #7: 104 (HP 48).
  function fitHeroH1() {
    const h = $("#hero h1"), col = $("#hero .lhero__text");
    if (!h || !col) return;
    h.classList.remove("is-fb");
    const lines = $$(".lhero__l", h);
    if (lines.some((l) => l.getBoundingClientRect().width > col.clientWidth + 0.5)) h.classList.add("is-fb");
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitHeroH1);
  let fitT = 0;
  addEventListener("resize", () => { clearTimeout(fitT); fitT = setTimeout(fitHeroH1, 150); });
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
  /* ---------- 05 #paket ----------
     Desktop (≥ 1024): tabel 3 kolom hairline. HP/tablet: segmented dua baris berharga + satu panel.
     Siluet skala nyata 4 px/cm (HP 3 px/cm) dari angka cm terbesar di packages[n].cm, pada garis dasar bersama.
     Semua harga dari minPackagePrice(); coret = harga satuan bagian + kit, hemat selalu dalam rupiah. */
  // Konfigurasi wakil tiap ukuran (yang tertinggi di rentangnya), digambar sebagai gambar kerja
  const PKG_SIL = {
    3: { head: "plisir", body: ["kubus"], base: "bulat" },
    4: { head: "plisir", body: ["heksa", "kubus"], base: "bulat" },
    5: { head: "plisir", body: ["bola", "silinder", "bola"], base: "bulat" },
  };
  const pkgSpec = (n) => PKG_SIL[n] || { head: "plisir", body: Array.from({ length: Math.max(1, n - 2) }, () => "kubus"), base: "bulat" };
  // Siluet garis (gambar kerja) dari renderer bersama LampArt.silhouette(): isi = warna latar,
  // garis 1,5 px, plisir 1 px .28 (kelas .sil__s/.sil__f/.sil__l/.sil__p). Geometri = rig lamp-art.
  const silhouetteSvg = (spec, uid) => A.silhouette(spec, uid);
  // Versi berwarna (panel HP, paket yang dipilih): warna dari edisi pilihan studio, tanpa glow SVG (glow kecil lewat CSS)
  function silhouetteLit(n, uid) {
    const sp = pkgSpec(n), geo = silhouetteSvg(sp, uid);
    const pre = D().presets[D().popularPreset] || D().presets[0];
    const bodies = pre && pre.body.length ? pre.body : [{ color: D().colors[0].id }];
    const cfg = {
      head: { shape: sp.head, color: pre ? pre.head.color : D().shadeColors[0].id },
      body: sp.body.map((shape, i) => ({ shape, color: bodies[i % bodies.length].color })),
      base: { shape: sp.base, color: pre ? pre.base.color : D().colors[0].id },
    };
    const svg = A.renderLamp(cfg, { uid, on: false, table: false, vb: geo.vb });
    return svg.replace("<svg ", `<svg class="sil sil--lit" style="--sil-w:${geo.w};--sil-h:${geo.h}" aria-hidden="true" focusable="false" `).replace(/ role="img" aria-label="[^"]*"/, "");
  }
  // Tinggi siluet = angka cm terbesar di "22–27" × px/cm (cadangan: tinggi konfigurasi wakil)
  const pkgCm = (pk, n) => {
    const m = String((pk && pk.cm) || "").match(/(\d+(?:[.,]\d+)?)\s*$/);
    if (m) return parseFloat(m[1].replace(",", "."));
    const sp = pkgSpec(n);
    return Math.round(A.totalCm({ head: { shape: sp.head }, body: sp.body.map((shape) => ({ shape })), base: { shape: sp.base } }));
  };
  const pkgNote = (pk) => { const t = String((pk && pk.note) || "").trim(); return t && !/[.!?]$/.test(t) ? t + "." : t; };
  const pkgList = () => Object.keys(D().packages).map(Number).sort((a, b) => a - b);
  const pkgHot = () => { const pp = D().presets[D().popularPreset] || D().presets[0]; return pp ? pp.body.length + 2 : -1; }; // paket edisi pilihan studio (opini editorial, bukan klaim penjualan)
  // "~~Rp432.000~~ satuan · hemat Rp57.000"; bila kolom terlalu sempit (atau panel HP) dua span menjadi blok tanpa "·"
  function pkgPrice(n) {
    const m = minPackagePrice(n);
    const was = m.anchor > m.price
      ? `<p class="paket__was num"><span class="paket__was-a"><s>${rp(m.anchor)}</s> satuan</span><span class="paket__sep"> · </span><span class="paket__was-b">hemat ${rp(m.anchor - m.price)}</span></p>`
      : "";
    return `<div class="paket__price"><p class="price-block__label">Mulai dari</p><p class="price-amount price-amount--md num">${amountHtml(m.price)}</p>${was}</div>`;
  }
  function renderPackages() {
    const el = $("#pkgs");
    if (!el) return;
    const list = pkgList();
    if (!list.length) { el.innerHTML = ""; return; }
    const hot = pkgHot();
    if (!list.includes(pkgView)) pkgView = list.includes(4) ? 4 : list[Math.floor(list.length / 2)];
    const table =
      `<div class="paket__table">` +
      list.map((n) => {
        const pk = D().packages[n], hi = n === hot, sil = silhouetteSvg(pkgSpec(n), "pkd" + n);
        return (
          `<article class="paket__col${hi ? " paket__col--hi paper-2" : ""}" aria-labelledby="pk-name-${n}">` +
          `<div class="paket__fig"><p class="paket__num"><span class="paket__n">${n}</span><span class="label">Bagian</span></p>` +
          `<div class="paket__scale" style="--cm:${pkgCm(pk, n)}"><span class="paket__cm">${esc(pk.cm || "")} cm</span><span class="paket__rule" aria-hidden="true"></span><span class="paket__sil">${sil.svg}</span></div></div>` +
          `<h3 class="paket__name" id="pk-name-${n}">${esc(pk.name)}</h3>` +
          `<p class="paket__note">${esc(pkgNote(pk))}</p>` +
          pkgPrice(n) +
          `<button class="btn ${hi ? "btn--primary" : "btn--ghost"} btn--block" type="button" data-pkg="${n}">Rakit paket ini</button></article>`
        );
      }).join("") +
      `</div>`;
    const seg =
      `<div class="segmented segmented--tall paket__seg" role="radiogroup" aria-label="Pilih ukuran paket">` +
      list.map((n) => {
        const on = n === pkgView;
        return `<button type="button" role="radio" aria-checked="${on}" tabindex="${on ? 0 : -1}" aria-controls="pk-panel" data-pkg-view="${n}"><span>${esc(D().packages[n].name)} · ${n}</span><span class="segmented__sub num">${rp(minPackagePrice(n).price)}</span></button>`;
      }).join("") +
      `</div>`;
    el.innerHTML = table + `<div class="paket__hp">${seg}<div class="paket__panel" id="pk-panel">${pkgPanelHtml(pkgView)}</div></div>`;
  }
  function pkgPanelHtml(n) {
    const list = pkgList(), pk = D().packages[n];
    if (!pk) return "";
    return (
      `<div class="paket__well"><span class="label paket__il">Ilustrasi</span>` +
      list.map((k) => {
        const p = D().packages[k], on = k === n;
        return `<figure class="paket__wfig${on ? " is-on" : ""}" style="--cm:${pkgCm(p, k)}"><span class="paket__sil">${on ? silhouetteLit(k, "pkh" + k) : silhouetteSvg(pkgSpec(k), "pkh" + k).svg}</span><figcaption>${esc(p.cm || "")} cm</figcaption></figure>`;
      }).join("") +
      `</div>` +
      `<div class="paket__info"><h3 class="paket__name">${esc(pk.name)}</h3><span class="label">${n} bagian · ${esc(pk.cm || "")} cm</span></div>` +
      `<p class="paket__note">${esc(pkgNote(pk))}</p>` +
      pkgPrice(n) +
      `<button class="btn btn--ghost btn--block" type="button" data-pkg="${n}">Rakit paket ini</button>`
    );
  }
  // Ganti paket yang dilihat (segmented HP): panel berganti lewat crossfade 250 ms; rakitan tidak berubah
  function viewPackage(n, focus) {
    if (!D().packages[n]) return;
    pkgView = n;
    $$("[data-pkg-view]").forEach((b) => {
      const on = +b.dataset.pkgView === n;
      b.setAttribute("aria-checked", on);
      b.tabIndex = on ? 0 : -1;
      if (on && focus) b.focus();
    });
    const panel = $("#pk-panel");
    if (!panel) return;
    panel.innerHTML = pkgPanelHtml(n);
    if (panel.animate) panel.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 250, easing: "cubic-bezier(.22,1,.36,1)" });
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
  // Tautan marketplace yang benar-benar ada: link per edisi (preset.shop) bila diisi, kalau tidak link toko dari config.js
  const marketLinks = (preset) => MARKETS.map((m) => ({ m, url: (preset && preset.shop && preset.shop[m.id]) || storeUrl(m.id) })).filter((x) => x.url);
  const marketLinkHtml = (x, cls) => `<a class="text-link${cls ? " " + cls : ""}" href="${esc(x.url)}" target="_blank" rel="noopener">Juga tersedia di ${esc(x.m.name)} <span class="arrow" aria-hidden="true">→</span></a>`;
  function marketRow(preset, cls) {
    const items = marketLinks(preset);
    if (!items.length) return "";
    return `<div class="mkt ${cls || ""}"><div class="mkt__row">${items.map((x) => marketLinkHtml(x)).join("")}</div><small>Stok warna tetap kami cek dulu lewat WhatsApp.</small></div>`;
  }

  /* ---------- #kenapa: scene cerita (lampu berevolusi per kalimat) ----------
     Satu lapisan rig (meja, tanpa dinding) + empat lapisan lampu yang ber-crossfade lewat CSS
     (.story[data-step][data-sub], motion.js): 0 siluet lampu "satu bentuk" (--ink-2, mati) · 1 dan 2 dua edisi
     lain (redup, --dim .35: bagian berganti bentuk dan warna) · 3 edisi pilihan studio menyala.
     Tanpa pin (gerak dikurangi) hanya lapisan 3 yang tampil, menyala penuh. */
  const storyNarrow = window.matchMedia ? window.matchMedia("(max-width: 699px)") : { matches: false };
  function renderStory() {
    const host = $("#story-art");
    if (!host) return;
    const d = D();
    const pi = d.presets[d.popularPreset] ? d.popularPreset : 0;
    const variant = storyNarrow.matches ? "scene-hp" : "scene";
    const INK2 = "#5b524a";
    const generic = sanitize({ head: { shape: "kerucut", color: "" }, body: [{ shape: "silinder", color: "" }, { shape: "silinder", color: "" }, { shape: "silinder", color: "" }], base: { shape: "bulat", color: "" } });
    [generic.head, generic.base, ...generic.body].forEach((x) => { x.hex = INK2; });
    const others = d.presets.map((_, i) => i).filter((i) => i !== pi);
    const alt = [others[0] ?? pi, others[1] ?? others[0] ?? pi];
    const lamp = (cfg, uid, extra) => A.renderLamp(cfg, Object.assign({ uid, variant, layers: "lamp", vignette: false, decorative: true }, extra));
    host.innerHTML =
      `<div class="story__rig">${A.renderLamp(presetCfg(pi), { uid: "st-r", variant, layers: "rig", wall: false, lit: false, vignette: false, decorative: true })}</div>` +
      `<div class="story__lamp" data-k="0">${lamp(generic, "st0", { mode: "matte", lit: false, off: 0 })}</div>` +
      `<div class="story__lamp" data-k="1">${lamp(presetCfg(alt[0]), "st1", { lit: true, dim: 0.35 })}</div>` +
      `<div class="story__lamp" data-k="2">${lamp(presetCfg(alt[1]), "st2", { lit: true, dim: 0.35 })}</div>` +
      `<div class="story__lamp" data-k="3">${lamp(presetCfg(pi), "st3", { lit: true, dim: 1 })}</div>`;
    setHtml('[data-stage-pill="kenapa"]', `<span>Ilustrasi<span class="story__pill-ed"> · Edisi ${esc(d.presets[pi].name)}</span></span>`);
  }
  if (storyNarrow.addEventListener) storyNarrow.addEventListener("change", () => renderStory());

  /* ---------- 01 Lima edisi ----------
     Kerangka (vitrine + indeks + plakat) dirender sekali per data (renderEditions); ganti edisi hanya mengisi
     ulang node yang sama (fillEdition): lampu vitrine, pil, baris terpilih, cerita, harga, tautan. Karena node
     dipertahankan, fokus radio tidak hilang dan pergantian bisa dianimasikan (View Transitions / crossfade).
     Harga coret = harga satuan bagian + kit dari price(); hemat selalu rupiah. */
  function renderEditions() { keepFocus(renderEditionsNow); }
  function renderEditionsNow() {
    const el = $("#edisi-app");
    if (!el) return;
    const d = D();
    if (!d.presets[state.edition]) state.edition = 0;
    const rows = d.presets.map((q, i) => {
      const c = presetCfg(i), qp = price(c), n = q.body.length + 2;
      const dots = [A.shadeHex(c.head.color), ...c.body.map((x) => A.hexOf(x.color)), A.hexOf(c.base.color)].map((h) => `<i style="background:${h}"></i>`).join("");
      return (
        `<label class="edisi__opt"><input type="radio" name="edisi" value="${i}"/>` +
        `<span class="edisi__ind" aria-hidden="true"></span>` +
        `<span class="edisi__thumb" aria-hidden="true">${A.thumb(c, { uid: "edt" + i, paper: true, ratio: 1 })}</span>` +
        `<span class="edisi__name">${esc(q.name)}</span>` +
        `<span class="edisi__price num">${rp(qp.total)}</span>` +
        `<span class="edisi__meta"><span class="edisi__dots" aria-hidden="true">${dots}</span>${i === d.popularPreset ? '<span class="badge edisi__pick">Pilihan studio</span>' : `<span class="edisi__spec">${n} bagian · ≈ ${A.totalCm(c).toFixed(0)} cm</span>`}</span>` +
        `</label>`
      );
    }).join("");
    el.innerHTML =
      `<div class="edisi__stage stage stage--vitrine" style="--dim:1"><div class="lamp" data-ed-lamp></div><span class="pill stage__pill" data-stage-pill="edisi" data-ed-pill>Ilustrasi</span></div>` +
      `<div class="edisi__rail">` +
      `<div class="edisi__list" role="radiogroup" aria-label="Pilih edisi">${rows}</div>` +
      `<div class="edisi__plakat">` +
      `<h3 class="sr-only" data-ed-title></h3>` +
      `<p class="edisi__story" data-ed-story></p>` +
      `<p class="edisi__room"><span class="label">Cocok untuk</span> <span data-ed-room></span></p>` +
      `<div class="price-block price-block--lg edisi__buy">` +
      // label hanya tampil di HP: indeks sudah tergulir saat harga dan tombol terlihat, jadi nama edisi diulang di sini
      `<p class="price-block__label edisi__buy-label" data-ed-label></p>` +
      `<p class="price-block__was num" data-ed-was></p>` +
      `<p class="price-block__amount num" data-ed-amount></p>` +
      `<p class="price-block__note">Termasuk kit kelistrikan (komponen bertanda SNI/K3L) · bohlam LED opsional ${rp(d.ledPrice)} · produksi ${esc(d.leadTime.preset)}</p>` +
      `</div>` +
      `<div class="edisi__acts">` +
      `<a class="btn btn--wa btn--lg btn--block" data-primary-cta data-ed-order>Pesan edisi ini</a>` +
      `<a class="text-link" href="#rakit" data-ed-edit>Ubah bagian di studio rakit <span class="arrow" aria-hidden="true">→</span></a>` +
      `<span class="edisi__shop" data-ed-shop></span>` +
      `</div></div></div>`;
    fillEdition();
  }
  const editionLive = (i) => {
    const p = D().presets[i];
    if (!p) return "";
    const pr = price(presetCfg(i));
    return `Edisi ${p.name}: ${rp(pr.total)}` + (pr.disc ? `, hemat ${rp(pr.disc)} dari harga satuan` : "");
  };
  function fillEdition() {
    const el = $("#edisi-app");
    if (!el || !$("[data-ed-lamp]", el)) return;
    const d = D(), i = state.edition, p = d.presets[i];
    if (!p) return;
    const cfg = presetCfg(i), pr = price(cfg), cm = A.totalCm(cfg).toFixed(0);
    const anchor = pr.parts + pr.wiring;
    setHtml($("[data-ed-lamp]", el), A.renderLamp(cfg, { uid: "ed", on: true, dim: 1, dims: true, variant: "vitrine", label: `Ilustrasi lampu edisi ${p.name}: kap diameter 20 cm, tinggi sekitar ${cm} cm` }));
    setText($("[data-ed-pill]", el), `Ilustrasi · Edisi ${p.name}`);
    $$(".edisi__opt", el).forEach((row) => {
      const inp = $("input", row), on = !!inp && +inp.value === i;
      row.classList.toggle("is-on", on);
      if (inp && inp.checked !== on) inp.checked = on;
    });
    setText($("[data-ed-title]", el), `Edisi ${p.name}`);
    setText($("[data-ed-story]", el), p.story || "");
    setText($("[data-ed-room]", el), p.room || "Meja kerja");
    const was = $("[data-ed-was]", el);
    if (was) {
      was.hidden = !(anchor > pr.total);
      was.innerHTML = anchor > pr.total ? `<span class="edisi__was-a">Harga satuan <s>${rp(anchor)}</s></span><span class="edisi__sep" aria-hidden="true"> · </span><span class="edisi__was-b">hemat ${rp(anchor - pr.total)}</span>` : "";
    }
    setText($("[data-ed-label]", el), `Harga edisi ${p.name}`);
    setHtml($("[data-ed-amount]", el), amountHtml(pr.total));
    const order = $("[data-ed-order]", el);
    if (order) {
      order.setAttribute("data-wa", "preset:" + i);
      order.setAttribute("data-edisi-order", i);
      order.setAttribute("aria-label", `Pesan edisi ini: ${p.name}, lewat WhatsApp`);
      order.href = waLink(waText(Object.assign(presetCfg(i), { zone: state.zone, gift: { on: false } })));
      order.target = "_blank";
      order.rel = "noopener";
    }
    const edit = $("[data-ed-edit]", el);
    if (edit) edit.setAttribute("data-edisi-edit", i);
    const shop = $("[data-ed-shop]", el);
    if (shop) { const items = marketLinks(p); shop.hidden = !items.length; shop.innerHTML = items.map((x) => marketLinkHtml(x, "edisi__shop-link")).join(""); }
    fitSvgText(el);
  }
  // Pergantian edisi: View Transitions bila didukung (crossfade 300 ms seluruh tampilan lama → baru), dilewati
  // saat gerak dikurangi; tanpa dukungan: crossfade opasitas pada node yang dipertahankan (lampu, plakat 250 ms; harga 200 ms).
  let vtRunning = 0;
  function withTransition(fn, fallbackNodes) {
    const root = document.documentElement;
    if (reduceMotion()) { fn(); return; }
    if (typeof document.startViewTransition === "function") {
      root.classList.add("vt-edisi");
      vtRunning++;
      const done = () => { if (--vtRunning <= 0) { vtRunning = 0; root.classList.remove("vt-edisi"); } };
      let vt = null;
      try { vt = document.startViewTransition(fn); } catch (_) { done(); }
      if (vt) {
        // Transisi yang disalip pilihan berikutnya ditolak dengan AbortError: itu wajar, bukan galat
        const quiet = () => {};
        if (vt.ready) vt.ready.catch(quiet);
        if (vt.updateCallbackDone) vt.updateCallbackDone.catch((err) => { if (err && err.name !== "AbortError") setTimeout(() => { throw err; }); });
        vt.finished.then(done, done);
        return;
      }
    }
    fn();
    (typeof fallbackNodes === "function" ? fallbackNodes() : []).forEach(([node, ms]) => {
      if (node && node.animate) node.animate([{ opacity: 0 }, { opacity: 1 }], { duration: ms, easing: "ease-out" });
    });
  }
  // Pilih edisi di indeks. Selama rakitan masih berupa edisi (belum diubah bagiannya), rakitan ikut berganti supaya
  // studio rakit, orderbar, dan ringkasan nav menunjuk edisi yang sama; rakitan custom tidak pernah ditimpa di sini.
  function selectEdition(i) {
    const d = D();
    if (!d.presets[i]) return;
    const follow = presetIndex(state) >= 0;
    state.edition = i;
    if (follow) { const p = sanitize(clone(d.presets[i])); Object.assign(state, { head: p.head, body: p.body, base: p.base }); }
    withTransition(
      () => {
        fillEdition();
        if (follow) renderAll("edition"); else emit("edition");
        say(editionLive(i));
      },
      () => { const el = $("#edisi-app"); return el ? [["[data-ed-lamp]", 250], ["[data-ed-story]", 250], ["[data-ed-room]", 250], ["[data-ed-was]", 200], ["[data-ed-amount]", 200]].map(([q, ms]) => [$(q, el), ms]) : []; }
    );
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
    setHtml("[data-alur-photo]", A.renderLamp(cfg, { uid: "alur", on: true, dim: 0.9, variant: "thumb", label: "Ilustrasi foto rakitan" }) + '<span class="pill">Ilustrasi</span>');
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
    renderStory();
    renderEditions();
    renderAlur();
    setText("#led-price-note", rp(D().ledPrice));
    setText("#wiring-price-note", rp(D().wiringPrice));
    $$("[data-lead-preset]").forEach((el) => { el.textContent = D().leadTime.preset; });
    $$("[data-lead-custom]").forEach((el) => { el.textContent = D().leadTime.custom; });
    // Persen hanya dipakai sebagai "… dari harga bagian cetak" (lead #paket), tidak pernah di samping harga coret:
    // "15, 22, atau 28%" dari packages[n].disc, urut jumlah bagian
    const pcts = pkgList().map((n) => Math.round((+D().packages[n].disc || 0) * 100)).filter((x) => x > 0);
    setText("#promo-save", pcts.length > 1 ? `${pcts.slice(0, -1).join(", ")}, atau ${pcts[pcts.length - 1]}%` : pcts.length ? `${pcts[0]}%` : "0%");
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
    if (d.pkgView != null) return viewPackage(+d.pkgView);
    if (t.closest("#rakit, #paket, #bagian")) touched = true;
    if (t.id === "share-link") {
      const url = shareUrl(state);
      const text = `Lihat lampu rakitan ${code(state)} di ${C.brand}`;
      if (navigator.share) return navigator.share({ title: C.brand, text, url }).catch((err) => { if (!err || err.name !== "AbortError") copyText(url, "Tautan rakitan disalin"); });
      return copyText(url, "Tautan rakitan disalin");
    }
    if (d.edisiOrder != null || d.edisiEdit != null) {
      const i = +(d.edisiOrder ?? d.edisiEdit);
      // "Pesan edisi ini" selalu memesan edisi apa adanya: rakitan = edisi, kit kelistrikan ya, bohlam LED tidak
      const p = loadPreset(i, d.edisiOrder != null ? "edition-order" : "edition-edit");
      if (!p) return;
      // Tombol WA plakat (#edisi): WhatsApp terbuka lewat href-nya (data-wa="preset:N"), halaman tidak digulir
      if (d.edisiOrder != null && t.tagName === "A" && t.hasAttribute("data-wa")) return;
      // Tautan #rakit menggulir sendiri (dan memindahkan titik fokus); tombol digulirkan dari sini
      if (!(t.tagName === "A" && (t.getAttribute("href") || "").charAt(0) === "#")) scrollToEl(d.edisiOrder != null ? $("#summary") || $("#rakit") : $("#rakit"), d.edisiOrder != null ? "center" : "start");
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
  // Segmented paket (role=radiogroup): panah kiri/kanan/atas/bawah + Home/End memindah pilihan dan fokus
  document.addEventListener("keydown", (e) => {
    const b = e.target.closest && e.target.closest("[data-pkg-view]");
    if (!b) return;
    const list = $$("[data-pkg-view]", b.parentElement);
    const i = list.indexOf(b);
    const k = e.key;
    let j = -1;
    if (k === "ArrowRight" || k === "ArrowDown") j = (i + 1) % list.length;
    else if (k === "ArrowLeft" || k === "ArrowUp") j = (i - 1 + list.length) % list.length;
    else if (k === "Home") j = 0;
    else if (k === "End") j = list.length - 1;
    if (j < 0) return;
    e.preventDefault();
    viewPackage(+list[j].dataset.pkgView, true);
  });
  document.addEventListener("change", (e) => {
    const t = e.target;
    if (t.name === "edisi") return selectEdition(+t.value);
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
  // Bilah pesan HP (#orderbar): isi dan kapan tampil diatur nav.js (event "mks:change" + posisi gulir)
  // Video latar AI: hanya desktop dan tanpa "kurangi gerakan" (CSS tidak merendernya di HP / reduced motion).
  // Di sana skrip tidak memanggil load()/play() dan tidak menukar sumber, jadi HP tidak mengunduh video.
  (function reel() {
    const v = $("#reel-video"), btn = $("#reel-play");
    if (!v || !("IntersectionObserver" in window) || reduceMotion()) return;
    const narrow = window.matchMedia("(max-width: 860px)");
    // Poster hanya dipasang saat video memang akan tampil (desktop, gerak aktif): HP tidak mengunduhnya
    const setPoster = () => { if (!narrow.matches && v.dataset.poster && !v.poster) v.poster = v.dataset.poster; };
    setPoster();
    if (narrow.addEventListener) narrow.addEventListener("change", setPoster);
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
    heroKey = ""; // data bisa berubah (warna/nama dari Mode Edit): hero digambar ulang; jalur saklar/gulir tetap memakai cache
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
