/*
 * Konfigurator lampu rakitan: state, harga, pratinjau, dan pesan WhatsApp.
 * Data dari window.MKS_LAMP, kontak dari window.MKS_CONFIG, gambar dari window.LampArt.
 */
(function () {
  const C = window.MKS_CONFIG;
  const D = () => window.MKS_LAMP;
  const A = window.LampArt;
  const $ = (s, el = document) => el.querySelector(s);
  const rp = (n) => "Rp" + Math.round(n).toLocaleString("id-ID");
  const roundK = (n) => Math.round(n / 1000) * 1000;
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const clone = (o) => JSON.parse(JSON.stringify(o));
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
    const disc = sum - roundK(sum * (1 - pkg.disc));
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
  // Indeks preset yang sama persis dengan konfigurasi, atau -1
  function presetIndex(cfg) {
    const same = (a, b) => a.shape === b.shape && a.color === b.color;
    return D().presets.findIndex((p) => same(p.head, cfg.head) && same(p.base, cfg.base) && p.body.length === cfg.body.length && p.body.every((b, i) => same(b, cfg.body[i])));
  }
  const leadTimeOf = (cfg) => (presetIndex(cfg) >= 0 ? D().leadTime.preset : D().leadTime.custom);
  const zoneOf = (cfg) => (C.shipping && C.shipping.zones.find((z) => z.id === cfg.zone)) || (C.shipping && C.shipping.zones[0]) || null;
  function waText(cfg) {
    const p = price(cfg);
    const z = zoneOf(cfg);
    return (
      `Halo ${C.brand}, saya mau pesan lampu rakitan:\nKode: ${code(cfg)}\n` +
      p.lines.map((l) => `• ${l.label} — ${l.color.name}`).join("\n") +
      `\n• Kelistrikan: ${cfg.wiring === false ? "tanpa (hanya bagian cetak)" : "kit ber-SNI/K3L"}` +
      `\n• Bola LED 5 W hangat: ${cfg.led ? "ya" : "tidak"}` +
      `\nPaket ${p.pkg.name} (${p.n} bagian) — ${rp(p.total)}` +
      (z ? `\nKirim ke ${z.label}, perkiraan ongkir ${rp(z.price)} → total ±${rp(p.total + z.price)}` : "") +
      `\nTinggi ≈ ${A.totalCm(cfg).toFixed(0)} cm · produksi ${leadTimeOf(cfg)}\n\nNama: \nAlamat kirim: `
    );
  }
  const waLink = (msg) => `https://wa.me/${C.whatsapp}?text=${encodeURIComponent(msg)}`;

  /* ---------- State ---------- */
  const state = sanitize(clone(D().presets[D().popularPreset] || D().presets[0]));
  state.led = false; // bohlam adalah tambahan berbayar
  state.wiring = true; // kit kelistrikan ber-SNI/K3L, bisa dilepas
  state.on = true;
  state.zone = C.shipping && C.shipping.zones[0] ? C.shipping.zones[0].id : null;
  const hero = { cfg: sanitize(clone(D().presets[0])), on: true, dim: 1 };
  const catColor = {};

  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toast.t);
    toast.t = setTimeout(() => t.classList.remove("show"), 1800);
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
      `<div class="toggle-row"><div class="desc"><b>${esc(d.wiringLabel)}</b><small>Komponen dari produsen terdaftar. Tanpa kit ini, Anda menerima bagian cetak saja dan memasang kelistrikan sendiri.</small></div><button class="switch" type="button" id="wiring-switch" role="switch" aria-checked="${state.wiring !== false}"><i></i>${rp(d.wiringPrice)}</button></div>` +
      `<div class="toggle-row"><div class="desc"><b>Bola LED 5 W warna hangat</b><small>2700 K, E27. Maksimal 5 W agar kap tetap dingin.</small></div><button class="switch" type="button" id="led-switch" role="switch" aria-checked="${state.led}"><i></i>${rp(d.ledPrice)}</button></div>` +
      `<div class="row-wrap"><button class="ghost" type="button" id="random"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M2 4h3l6 8h3M2 12h3l1.5-2M9.5 6L11 4h3M12 2l2 2-2 2M12 10l2 2-2 2"/></svg>Acak kombinasi</button></div></div>`;
    $("#controls").innerHTML = h;
  }

  function renderSummary() {
    const p = price(state);
    let rows = p.lines
      .map((l) => `<div class="row row-sw"><span><i style="background:${l.color.hex}"></i>${esc(l.label)} — ${esc(l.color.name)}</span><span class="num">${rp(l.price)}</span></div>`)
      .join("");
    rows += `<div class="row"><span>Harga satuan ${p.n} bagian</span><span class="num"><s>${rp(p.parts)}</s></span></div>`;
    if (p.disc) rows += `<div class="row row-disc"><span>Potongan paket ${esc(p.pkg.name)} (${Math.round(p.pkg.disc * 100)}%)</span><span class="num">− ${rp(p.disc)}</span></div>`;
    rows += p.wiring
      ? `<div class="row"><span>Kit kelistrikan ber-SNI/K3L</span><span class="num">${rp(p.wiring)}</span></div>`
      : `<div class="row"><span>Tanpa kelistrikan (hanya bagian cetak)</span><span class="num">Rp0</span></div>`;
    if (state.led) rows += `<div class="row"><span>Bola LED 5 W hangat</span><span class="num">${rp(p.led)}</span></div>`;
    const anchorTotal = p.parts + p.wiring + p.led;
    const pi = presetIndex(state);
    const popular = pi >= 0 && pi === D().popularPreset;
    const z = zoneOf(state);
    const zones = C.shipping ? C.shipping.zones : [];
    $("#summary").innerHTML =
      `<div class="badges"><span class="badge">Paket ${esc(p.pkg.name)} · ${p.n} bagian</span>${popular ? '<span class="badge badge--pop">Paling populer</span>' : pi >= 0 ? `<span class="badge">Preset ${esc(D().presets[pi].name)}</span>` : '<span class="badge badge--custom">Rakitan custom</span>'}</div>` +
      `<div class="rows">${rows}</div>` +
      `<div class="total"><div><small>${p.wiring ? "Total termasuk kit kelistrikan" : "Total bagian cetak"}${p.led ? " + bohlam" : ""}</small>${p.disc ? `<s class="was num">${rp(anchorTotal)}</s>` : ""}<b class="num">${rp(p.total)}</b></div><span class="code">${code(state)}</span></div>` +
      (p.disc ? `<div class="save">Hemat <b>${rp(p.disc)}</b> dibanding beli ${p.n} bagian satuan</div>` : "") +
      (zones.length
        ? `<div class="ship"><label for="zone-select">Kirim ke</label><select id="zone-select">${zones.map((x) => `<option value="${esc(x.id)}"${z && x.id === z.id ? " selected" : ""}>${esc(x.label)} · ±${rp(x.price)}</option>`).join("")}</select><div class="ship__total"><span>Perkiraan total dengan ongkir</span><b class="num">±${rp(p.total + (z ? z.price : 0))}</b></div><small>${esc(C.shipping.note || "")}</small></div>`
        : "") +
      `<div class="acts"><a class="btn btn--wa" id="wa-link" href="${waLink(waText(state))}" target="_blank" rel="noopener">Pesan via WhatsApp</a>` +
      `<small class="reply">${esc(C.replyPromise || "")}</small>` +
      `<button class="btn btn--ghost-dark" type="button" id="copy-summary">Salin ringkasan</button>` +
      (pi < 0 ? `<button class="btn btn--ghost-dark" type="button" id="back-preset">Kembali ke preset populer</button>` : "") +
      `</div>` +
      `<p class="note">Produksi <b>${esc(leadTimeOf(state))}</b>${pi >= 0 ? " (preset, bagian berstok)" : " (kombinasi custom dicetak khusus)"}. Bayar transfer bank / QRIS setelah konfirmasi.</p>`;
    // Bilah pesan di HP
    $("#orderbar").innerHTML =
      `<div class="orderbar__info"><span>${p.disc ? `<s class="num">${rp(anchorTotal)}</s>` : ""}<small>${p.disc ? `Hemat ${rp(p.disc)}` : `Paket ${esc(p.pkg.name)}`}</small></span><b class="num">${rp(p.total)}</b></div>` +
      `<a class="btn btn--wa" href="${waLink(waText(state))}" target="_blank" rel="noopener">Pesan via WhatsApp</a>`;
    // Strip bagian terpilih: foto asli bila ada
    $("#parts-strip").innerHTML = p.lines
      .map((l, i) => `<figure class="pstrip__item"><div class="pstrip__fig">${partFig(l.kind, l.shape, l.color.id, "ps" + i)}</div><figcaption>${esc(l.label.split(" · ")[1] || l.label)}<small>${esc(l.color.name)}</small></figcaption></figure>`)
      .join("");
  }

  function renderPreview() {
    $("#cfg-lamp").innerHTML = A.renderLamp(state, { uid: "cfg", on: state.on, cover: true });
    $("#cfg-stage").style.setProperty("--dim", state.on ? 1 : 0);
    const sw = $("#cfg-switch");
    sw.setAttribute("aria-checked", state.on);
    sw.lastChild.nodeValue = state.on ? "Nyala" : "Mati";
    $("#cfg-height").textContent = `≈ ${A.totalCm(state).toFixed(0)} cm`;
    $("#spec-fig").innerHTML = A.renderLamp(state, { uid: "spec", on: false, dims: true, vb: "0 36 360 444" });
    $("#spec-height").textContent = `≈ ${A.totalCm(state).toFixed(0)} cm`;
    $("#spec-weight").textContent = `≈ ${A.totalKg(state).toFixed(1).replace(".", ",")} kg`;
  }
  const renderAll = () => {
    renderControls();
    renderSummary();
    renderPreview();
  };

  function renderHero() {
    $("#hero-lamp").innerHTML = A.renderLamp(hero.cfg, { uid: "hero", on: hero.on, dim: hero.dim, cover: true });
    $("#hero-stage").style.setProperty("--dim", hero.on ? hero.dim : 0);
    const sw = $("#hero-switch");
    sw.setAttribute("aria-checked", hero.on);
    sw.lastChild.nodeValue = hero.on ? "Nyala" : "Mati";
    const d = D();
    const m = minPackagePrice(3);
    $("#hero-from").innerHTML = `${rp(m.price)}${m.price < m.anchor ? ` <s>${rp(m.anchor)}</s>` : ""}`;
    $("#chip-shapes").textContent = d.heads.length + d.bodies.length + d.bases.length;
    $("#chip-colors").textContent = d.colors.length;
  }
  function renderPresets() {
    $("#presets").innerHTML =
      "<p>Mulai dari kombinasi favorit:</p>" +
      D()
        .presets.map((p, i) => {
          const n = p.body.length + 2;
          const pr = price(Object.assign(sanitize(clone(p)), { wiring: true, led: false }));
          const pop = i === D().popularPreset;
          return `<button class="preset${pop ? " preset--pop" : ""}" type="button" data-preset="${i}">${pop ? '<span class="preset__flag">Paling populer</span>' : ""}${A.renderLamp(sanitize(clone(p)), { uid: "pr" + i, on: true, dim: 0.7, table: false, vb: "50 60 220 400" })}<b>${esc(p.name)}</b><small>${n} bagian · ${esc((D().packages[n] || {}).name || "")}</small><span class="preset__price num">${rp(pr.total)}${pr.disc ? ` <s>${rp(pr.parts + pr.wiring)}</s>` : ""}</span></button>`;
        })
        .join("");
  }
  function renderPackages() {
    $("#pkgs").innerHTML = Object.keys(D().packages)
      .map(Number)
      .sort()
      .map((n) => {
        const pk = D().packages[n];
        const hot = n === 4;
        const m = minPackagePrice(n);
        return (
          `<div class="pkg${hot ? " hot" : ""}">${hot ? '<span class="pkg__flag">Paling laris</span>' : ""}<div class="top"><div class="n">${n}<small>bagian</small></div><span class="badge">hemat ${Math.round(pk.disc * 100)}%</span></div><h3>Paket ${esc(pk.name)}</h3>` +
          `<ul><li>1 kap + ${n - 2} badan + 1 alas + kit kelistrikan</li><li>Tinggi ± ${esc(pk.cm)} cm</li><li>${esc(pk.note || "")}</li></ul>` +
          `<div class="from"><small>mulai dari</small><b class="num">${rp(m.price)}</b>${m.price < m.anchor ? `<s class="num">${rp(m.anchor)} beli satuan</s><em>Hemat ${rp(m.anchor - m.price)}</em>` : ""}</div><button class="btn ${hot ? "btn--primary" : "btn--ghost"}" type="button" data-pkg="${n}">Rakit paket ini</button></div>`
        );
      })
      .join("");
  }
  function renderCatalog() {
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
    $("#catalog").innerHTML = h;
  }
  function renderStatic() {
    $("#exploded").innerHTML = A.renderLamp(sanitize({ head: { shape: "plisir", color: "gading" }, body: [{ shape: "bola", color: "salmon" }, { shape: "kubus", color: "zaitun" }], base: { shape: "bulat", color: "hitam" } }), { uid: "ex", on: false, explode: true, table: false, vb: "20 70 300 400" });
    $("#led-price-note").textContent = rp(D().ledPrice);
    $("#wiring-price-note").textContent = rp(D().wiringPrice);
    $("#wiring-label-note").textContent = D().wiringLabel;
  }

  /* ---------- Events ---------- */
  document.addEventListener("click", (e) => {
    const t = e.target.closest("button, a");
    if (!t) return;
    const d = t.dataset;
    const D_ = D();
    if (t.id === "hero-switch") { hero.on = !hero.on; return renderHero(); }
    if (t.id === "cfg-switch") { state.on = !state.on; return renderPreview(); }
    if (t.id === "led-switch") { state.led = !state.led; return renderAll(); }
    if (t.id === "wiring-switch") { state.wiring = state.wiring === false; return renderAll(); }
    if (t.id === "back-preset") {
      const p = sanitize(clone(D_.presets[D_.popularPreset] || D_.presets[0]));
      Object.assign(state, { head: p.head, body: p.body, base: p.base });
      renderAll();
      return toast(`Kembali ke ${p.name}`);
    }
    if (t.id === "add-body") {
      if (state.body.length < D_.maxBodies) state.body.push({ shape: pick(D_.bodies), color: pick(D_.colors) });
      return renderAll();
    }
    if (d.remove != null) { state.body.splice(+d.remove, 1); return renderAll(); }
    if (t.id === "random") {
      state.body = state.body.map(() => ({ shape: pick(D_.bodies), color: pick(D_.colors) }));
      state.head = { shape: pick(D_.heads), color: pick(D_.shadeColors) };
      state.base = { shape: pick(D_.bases), color: pick(D_.colors) };
      return renderAll();
    }
    if (d.preset != null) {
      const p = sanitize(clone(D_.presets[+d.preset]));
      Object.assign(state, { head: p.head, body: p.body, base: p.base });
      renderAll();
      return toast(`Kombinasi ${p.name} dimuat`);
    }
    if (d.pkg != null) {
      const want = +d.pkg - 2;
      while (state.body.length < want) state.body.push({ shape: pick(D_.bodies), color: pick(D_.colors) });
      while (state.body.length > want) state.body.pop();
      renderAll();
      $("#rakit").scrollIntoView({ behavior: "smooth", block: "start" });
      return toast(`Paket ${D_.packages[+d.pkg].name} disiapkan`);
    }
    if (d.part) {
      const target = d.part === "body" ? state.body[+d.i] : state[d.part];
      if (d.shape) target.shape = d.shape;
      if (d.color) target.color = d.color;
      return renderAll();
    }
    if (d.cat) { catColor[d.cat.replace(":", "")] = d.color; return renderCatalog(); }
    if (d.use) {
      const [kind, shape] = d.use.split(":");
      const col = catColor[kind + shape] || colorsOf(kind)[0].id;
      if (kind === "head") state.head = { shape, color: col };
      else if (kind === "base") state.base = { shape, color: col };
      else if (state.body.length < D_.maxBodies) state.body.push({ shape, color: col });
      else state.body[state.body.length - 1] = { shape, color: col };
      renderAll();
      $("#rakit").scrollIntoView({ behavior: "smooth", block: "start" });
      return toast("Dipakai di rakitan");
    }
    if (t.id === "copy-summary") return copyText(waText(state), "Ringkasan disalin");
    if (d.copy) return copyText(d.copy, "Nomor disalin");
  });
  document.addEventListener("change", (e) => {
    if (e.target.id === "zone-select") {
      state.zone = e.target.value;
      renderSummary();
    }
  });
  document.addEventListener("input", (e) => {
    if (e.target.id === "hero-dim") {
      hero.dim = e.target.value / 100;
      hero.on = true;
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
    document.querySelectorAll("[data-wa]").forEach((a) => {
      a.href = waLink(a.dataset.wa);
      a.target = "_blank";
      a.rel = "noopener";
    });
    const links = { instagram: `https://instagram.com/${C.instagram}`, email: `mailto:${C.email}`, tokopedia: C.tokopedia, shopee: C.shopee };
    document.querySelectorAll("[data-link]").forEach((a) => {
      a.href = links[a.dataset.link] || "#";
      // Sembunyikan link marketplace yang masih mengarah ke beranda marketplace (belum ada toko)
      if (["tokopedia", "shopee"].includes(a.dataset.link)) a.hidden = !/\/\/(www\.)?(tokopedia|shopee)\.[a-z.]+\/[^/?#]+/i.test(links[a.dataset.link] || "");
    });
    document.querySelectorAll("[data-marketplace]").forEach((el) => (el.hidden = [...el.querySelectorAll("a[data-link]")].every((a) => a.hidden)));
    document.querySelectorAll("[data-wa-text]").forEach((el) => (el.textContent = "+" + C.whatsapp));
    document.querySelectorAll("[data-wa-copy]").forEach((el) => (el.dataset.copy = "+" + C.whatsapp));
    document.querySelectorAll("[data-ig]").forEach((el) => (el.textContent = "@" + C.instagram));
    document.querySelectorAll("[data-city]").forEach((el) => (el.textContent = C.city));
    document.querySelectorAll("[data-reply]").forEach((el) => (el.textContent = C.replyPromise || ""));
    document.querySelectorAll("[data-address]").forEach((el) => { el.textContent = C.address || ""; el.closest(".contact-line").hidden = !C.address; });
    document.querySelectorAll("[data-nib]").forEach((el) => { el.textContent = C.nib ? "NIB " + C.nib : ""; el.closest(".contact-line").hidden = !C.nib; });
    document.querySelectorAll("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));
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
      material: "PLA+",
      offers: { "@type": "AggregateOffer", priceCurrency: "IDR", lowPrice: Math.min(...lows), highPrice: high, offerCount: ns.length, availability: "https://schema.org/MadeToOrder" },
    });
  }
  // Bilah pesan di HP hanya saat area pilihan konfigurator terlihat
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(
      ([e]) => {
        $("#orderbar").hidden = !e.isIntersecting;
        document.body.classList.toggle("has-orderbar", e.isIntersecting);
      },
      { rootMargin: "-120px 0px 0px 0px" }
    ).observe($("#ctrl-wrap"));
  }
  // Di layar lebar panel ubah bentuk selalu terbuka; di HP dilipat sebagai langkah opsional
  const wide = window.matchMedia("(min-width: 901px)");
  const syncCtrl = () => { if (wide.matches) $("#ctrl-wrap").open = true; };
  syncCtrl();
  wide.addEventListener("change", syncCtrl);
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
    renderAll();
  }
  refresh();
  window.MKSLamp = { refresh, state, price, code };
})();
