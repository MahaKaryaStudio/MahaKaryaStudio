(function () {
  const C = window.MKS_CONFIG;
  const P = window.MKS_PRODUCTS;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const rp = (n) => "Rp" + Math.round(n).toLocaleString("id-ID");
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const waLink = (msg) => `https://wa.me/${C.whatsapp}?text=${encodeURIComponent(msg)}`;

  const CATEGORIES = [
    { id: "all", label: "Semua" },
    { id: "vas", label: "Vas" },
    { id: "lampu", label: "Lampu" },
    { id: "pot", label: "Pot" },
    { id: "aksesori", label: "Aksesori" },
    { id: "dinding", label: "Dinding" },
  ];
  const TAG_LABEL = { bestseller: "Terlaris", baru: "Baru", hadiah: "Ide hadiah" };

  /* ---------- Static bindings ---------- */
  function bindStatic() {
    $$("[data-wa]").forEach((a) => {
      a.href = waLink(a.dataset.wa);
      a.target = "_blank";
      a.rel = "noopener";
    });
    const links = {
      tokopedia: C.tokopedia,
      shopee: C.shopee,
      instagram: `https://instagram.com/${C.instagram}`,
      email: `mailto:${C.email}`,
    };
    $$("[data-link]").forEach((a) => (a.href = links[a.dataset.link] || "#"));
    $$("[data-free-ship]").forEach((el) => (el.textContent = rp(C.freeShippingMin)));
    $$("[data-city]").forEach((el) => (el.textContent = C.city));
    $$("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));
  }

  /* ---------- Hero art ---------- */
  function renderHero() {
    const picks = ["lampu-candi", "vas-kawung", "pot-twist"].map((id) => P.find((p) => p.id === id)).filter(Boolean);
    while (picks.length < 3 && P[picks.length]) if (!picks.includes(P[picks.length])) picks.push(P[picks.length]);
    $("[data-hero-art]").innerHTML = picks.map((p, i) => `<div class="hero__piece hero__piece--${i}">${MKSArt.render(p)}</div>`).join("");
  }

  /* ---------- Catalog ---------- */
  let filter = "all";
  const filtersEl = $("[data-filters]");
  filtersEl.innerHTML = CATEGORIES.map(
    (c) => `<button role="tab" class="chip${c.id === filter ? " is-active" : ""}" aria-selected="${c.id === filter}" data-cat="${c.id}">${c.label}</button>`
  ).join("");
  filtersEl.addEventListener("click", (e) => {
    const b = e.target.closest("[data-cat]");
    if (!b) return;
    filter = b.dataset.cat;
    $$(".chip", filtersEl).forEach((x) => {
      const on = x === b;
      x.classList.toggle("is-active", on);
      x.setAttribute("aria-selected", on);
    });
    renderProducts();
  });

  const grid = $("[data-products]");
  function renderProducts() {
    const list = filter === "all" ? P : P.filter((p) => p.category === filter);
    grid.innerHTML = list
      .map(
        (p) => `
      <article class="product">
        <button class="product__art" data-view="${esc(p.id)}" aria-label="Lihat detail ${esc(p.name)}">
          ${(p.tags || []).map((t) => `<span class="badge badge--${esc(t)}">${TAG_LABEL[t] || esc(t)}</span>`).join("")}
          ${MKSArt.render(p, { small: true })}
        </button>
        <div class="product__info">
          <span class="product__col">${esc(p.collection)}</span>
          <h3>${esc(p.name)}</h3>
          <div class="product__row">
            <span class="price">${rp(p.price)}</span>
            <button class="btn btn--sm" data-add="${esc(p.id)}">+ Keranjang</button>
          </div>
        </div>
      </article>`
      )
      .join("");
  }

  grid.addEventListener("click", (e) => {
    const add = e.target.closest("[data-add]");
    if (add) return addToCart(add.dataset.add, 1, add);
    const view = e.target.closest("[data-view]");
    if (view) openModal(view.dataset.view);
  });

  /* ---------- Product modal ---------- */
  const modal = $("[data-modal]");
  function openModal(id) {
    const p = P.find((x) => x.id === id);
    if (!p) return;
    $("[data-modal-body]").innerHTML = `
      <button class="icon-btn modal__close" data-close-modal aria-label="Tutup">✕</button>
      <div class="modal__art">${MKSArt.render(p)}</div>
      <div class="modal__info">
        <span class="product__col">Koleksi ${esc(p.collection)}</span>
        <h3>${esc(p.name)}</h3>
        <p class="price price--lg">${rp(p.price)}</p>
        <p>${esc(p.desc)}</p>
        <ul class="specs">${(p.specs || []).map((s) => `<li>${esc(s)}</li>`).join("")}</ul>
        <div class="modal__actions">
          <div class="qty"><button type="button" data-q="-1" aria-label="Kurangi">−</button><input type="number" min="1" value="1" aria-label="Jumlah" data-mqty /><button type="button" data-q="1" aria-label="Tambah">+</button></div>
          <button class="btn btn--primary" data-madd="${esc(p.id)}">Tambah ke keranjang</button>
        </div>
        <a class="link" target="_blank" rel="noopener" href="${waLink(`Halo, saya mau custom produk "${p.name}" (warna/ukuran/nama). Bisa dibantu?`)}">Mau warna, ukuran, atau nama sendiri? Tanya custom →</a>
      </div>`;
    if (typeof modal.showModal === "function") modal.showModal();
    else modal.setAttribute("open", "");
  }
  modal.addEventListener("click", (e) => {
    if (e.target === modal || e.target.closest("[data-close-modal]")) return modal.close();
    const q = e.target.closest("[data-q]");
    if (q) {
      const inp = $("[data-mqty]", modal);
      inp.value = Math.max(1, (+inp.value || 1) + +q.dataset.q);
    }
    const add = e.target.closest("[data-madd]");
    if (add) {
      addToCart(add.dataset.madd, Math.max(1, +$("[data-mqty]", modal).value || 1));
      modal.close();
      openCart();
    }
  });

  /* ---------- Cart ---------- */
  const KEY = "mks-cart-v1";
  let cart = {};
  try {
    cart = JSON.parse(localStorage.getItem(KEY)) || {};
  } catch (_) {
    cart = {};
  }
  const save = () => {
    try {
      localStorage.setItem(KEY, JSON.stringify(cart));
    } catch (_) {}
  };

  function addToCart(id, qty, btn) {
    if (!P.find((p) => p.id === id)) return;
    cart[id] = (cart[id] || 0) + qty;
    save();
    renderCart();
    if (btn) {
      const t = btn.textContent;
      btn.textContent = "✓ Ditambahkan";
      btn.disabled = true;
      setTimeout(() => {
        btn.textContent = t;
        btn.disabled = false;
      }, 1100);
    }
  }

  function cartLines() {
    return Object.entries(cart)
      .map(([id, qty]) => ({ p: P.find((x) => x.id === id), qty }))
      .filter((l) => l.p && l.qty > 0);
  }

  function renderCart() {
    const lines = cartLines();
    const count = lines.reduce((a, l) => a + l.qty, 0);
    const total = lines.reduce((a, l) => a + l.qty * l.p.price, 0);
    $("[data-cart-count]").textContent = count;
    $("[data-cart-count]").classList.toggle("is-on", count > 0);
    $("[data-cart-total]").textContent = rp(total);
    $("[data-checkout]").disabled = !lines.length;

    const left = C.freeShippingMin - total;
    const pct = Math.min(100, (total / C.freeShippingMin) * 100);
    $("[data-ship-bar]").innerHTML = lines.length
      ? `<p>${left > 0 ? `Tambah <b>${rp(left)}</b> lagi untuk gratis ongkir` : "<b>Selamat!</b> Pesanan Anda gratis ongkir"}</p><div class="bar"><i style="width:${pct}%"></i></div>`
      : "";

    $("[data-cart-items]").innerHTML = lines.length
      ? lines
          .map(
            (l) => `
        <div class="line">
          <div class="line__art">${MKSArt.render(l.p, { small: true })}</div>
          <div class="line__info">
            <b>${esc(l.p.name)}</b>
            <span>${rp(l.p.price)}</span>
            <div class="qty qty--sm"><button data-dec="${esc(l.p.id)}" aria-label="Kurangi">−</button><span>${l.qty}</span><button data-inc="${esc(l.p.id)}" aria-label="Tambah">+</button></div>
          </div>
          <button class="icon-btn" data-del="${esc(l.p.id)}" aria-label="Hapus ${esc(l.p.name)}">✕</button>
        </div>`
          )
          .join("")
      : `<div class="empty"><p>Keranjang masih kosong.</p><a href="#koleksi" class="btn btn--sm" data-close-cart>Lihat koleksi</a></div>`;
  }

  $("[data-cart-items]").addEventListener("click", (e) => {
    const t = e.target.closest("[data-inc],[data-dec],[data-del]");
    if (!t) return;
    const id = t.dataset.inc || t.dataset.dec || t.dataset.del;
    if (t.dataset.inc) cart[id]++;
    if (t.dataset.dec) cart[id]--;
    if (t.dataset.del || cart[id] <= 0) delete cart[id];
    save();
    renderCart();
  });

  $("[data-checkout]").addEventListener("click", () => {
    const lines = cartLines();
    if (!lines.length) return;
    const total = lines.reduce((a, l) => a + l.qty * l.p.price, 0);
    const msg =
      `Halo ${C.brand}, saya mau pesan:\n\n` +
      lines.map((l, i) => `${i + 1}. ${l.p.name} × ${l.qty} = ${rp(l.qty * l.p.price)}`).join("\n") +
      `\n\nSubtotal: ${rp(total)}` +
      `\n\nNama:\nAlamat kirim:\nWarna/catatan:`;
    window.open(waLink(msg), "_blank", "noopener");
  });

  const drawer = $("[data-drawer]");
  const scrim = $("[data-scrim]");
  function openCart() {
    drawer.classList.add("is-open");
    scrim.classList.add("is-open");
    drawer.setAttribute("aria-hidden", "false");
  }
  function closeCart() {
    drawer.classList.remove("is-open");
    scrim.classList.remove("is-open");
    drawer.setAttribute("aria-hidden", "true");
  }
  $$("[data-open-cart]").forEach((b) => b.addEventListener("click", openCart));
  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-close-cart]")) closeCart();
  });
  scrim.addEventListener("click", closeCart);
  document.addEventListener("keydown", (e) => e.key === "Escape" && closeCart());

  /* ---------- Estimator ---------- */
  const E = () => C.estimator;
  const form = $("[data-estimator]");
  const optGroups = { sizes: "size", materials: "material", finishes: "finish" };
  function buildEstimatorOptions() {
    Object.entries(optGroups).forEach(([key, name]) => {
      $(`[data-opt="${key}"]`, form).innerHTML = E()[key]
        .map((o, i) => `<label class="opt"><input type="radio" name="${name}" value="${esc(o.id)}"${i === 0 ? " checked" : ""} /><span>${esc(o.label)}</span></label>`)
        .join("");
    });
  }

  function estimate() {
    const fd = new FormData(form);
    const e = E();
    const size = e.sizes.find((s) => s.id === fd.get("size")) || e.sizes[0];
    const mat = e.materials.find((m) => m.id === fd.get("material")) || e.materials[0];
    const fin = e.finishes.find((f) => f.id === fd.get("finish")) || e.finishes[0];
    const design = fd.get("design");
    const qty = Math.max(1, Math.min(1000, parseInt(fd.get("qty"), 10) || 1));
    const tier = e.tiers.filter((t) => qty >= t.min).pop() || { disc: 0 };
    const unit = size.base * mat.mult + fin.add;
    const designFee = e.designFee[design] || 0;
    const subtotal = unit * qty * (1 - tier.disc) + designFee;
    const days = Math.ceil(e.leadTimeDays.base + (design === "custom" ? 3 : 0) + (size.hours * qty * e.leadTimeDays.perUnitHours) / 3);
    return { size, mat, fin, design, qty, tier, unit, designFee, subtotal, days, note: (fd.get("note") || "").trim() };
  }

  function renderEstimate() {
    const r = estimate();
    $("[data-est-total]").textContent = rp(r.subtotal);
    $("[data-est-meta]").textContent =
      `${rp(r.unit * (1 - r.tier.disc))}/pcs` +
      (r.tier.disc ? ` · hemat ${Math.round(r.tier.disc * 100)}%` : "") +
      (r.designFee ? ` · desain ${rp(r.designFee)}` : "") +
      ` · ±${r.days} hari kerja`;
  }
  form.addEventListener("input", renderEstimate);
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const r = estimate();
    const designLabel = { none: "Dari katalog", personal: "Tambah nama/logo", custom: "Desain baru" }[r.design];
    const msg =
      `Halo ${C.brand}, saya mau pesanan custom:\n\n` +
      `• Ukuran: ${r.size.label}\n• Material: ${r.mat.label}\n• Finishing: ${r.fin.label}\n• Desain: ${designLabel}\n• Jumlah: ${r.qty} pcs\n` +
      (r.note ? `• Catatan: ${r.note}\n` : "") +
      `\nEstimasi dari website: ${rp(r.subtotal)} (±${r.days} hari kerja)`;
    window.open(waLink(msg), "_blank", "noopener");
  });

  /* ---------- Boot + API untuk Mode Edit ---------- */
  function refresh() {
    bindStatic();
    renderHero();
    renderProducts();
    renderCart();
    buildEstimatorOptions();
    renderEstimate();
  }
  refresh();
  window.MKS = { refresh, rp };
})();
