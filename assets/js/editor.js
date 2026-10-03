/*
 * MODE EDIT — buka website dengan #edit di akhir alamat, misalnya:
 *   https://mahakaryastudio.github.io/MahaKaryaStudio/#edit
 *
 * - Teks: klik langsung pada tulisan di halaman lalu ketik.
 * - Produk, harga, foto, kontak: lewat panel di kanan.
 * - Perubahan disimpan di browser ini saja (localStorage). Supaya tayang untuk
 *   semua orang, salin file dari tab "Ekspor" ke GitHub (index.html,
 *   assets/js/config.js, assets/js/products.js).
 *
 * File ini harus dimuat SEBELUM main.js agar produk/kontak hasil edit dipakai
 * saat halaman dirender.
 */
(function () {
  const KEY = "mks-edits-v1";
  const products = window.MKS_PRODUCTS;
  const config = window.MKS_CONFIG;
  const ORIGINAL = { products: clone(products), config: clone(config) };
  const state = load();
  if (state.products) replaceArray(products, state.products);
  if (state.config) replaceObject(config, state.config);

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const rp = (n) => "Rp" + Math.round(+n || 0).toLocaleString("id-ID");

  function clone(x) {
    return JSON.parse(JSON.stringify(x));
  }
  function replaceArray(target, src) {
    target.splice(0, target.length, ...clone(src));
  }
  function replaceObject(target, src) {
    Object.keys(target).forEach((k) => delete target[k]);
    Object.assign(target, clone(src));
  }
  function load() {
    try {
      const s = JSON.parse(localStorage.getItem(KEY)) || {};
      return { text: s.text || {}, products: s.products || null, config: s.config || null };
    } catch (_) {
      return { text: {}, products: null, config: null };
    }
  }
  let saveWarned = false;
  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
      setStatus("Tersimpan di browser ini");
    } catch (_) {
      if (!saveWarned) {
        saveWarned = true;
        setStatus("Penyimpanan browser penuh — kecilkan/hapus foto produk", true);
      }
    }
  }

  /* ---------- Alamat elemen teks (stabil antar muat halaman) ---------- */
  function pathOf(el) {
    const segs = [];
    let n = el;
    while (n && n !== document.body) {
      if (n.id) {
        segs.unshift("#" + n.id);
        break;
      }
      const p = n.parentElement;
      if (!p) break;
      const idx = [...p.children].filter((c) => c.tagName === n.tagName).indexOf(n);
      segs.unshift(n.tagName.toLowerCase() + ":" + idx);
      n = p;
    }
    return segs.join("/");
  }
  function resolve(path, root) {
    const segs = path.split("/");
    let cur = root.body;
    for (const seg of segs) {
      if (seg.startsWith("#")) cur = root.querySelector("#" + CSS.escape(seg.slice(1)));
      else {
        const [tag, idx] = seg.split(":");
        cur = cur && [...cur.children].filter((c) => c.tagName.toLowerCase() === tag)[+idx];
      }
      if (!cur) return null;
    }
    return cur;
  }

  const EXCLUDE = "[data-products],[data-modal],[data-drawer],[data-hero-art],[data-filters],[data-opt],.mks-editor,.mks-pill";
  const SEL = "h1,h2,h3,h4,p,li,summary,legend,a.btn,.eyebrow,.promo,.mat b,.mat span,.footer a,.footer h4,.nav__links a,.estimate__label,.card-why__num,.step span";
  const editables = () => $$(SEL).filter((el) => !el.closest(EXCLUDE));

  function applyText() {
    Object.entries(state.text).forEach(([path, html]) => {
      const el = resolve(path, document);
      if (el) el.innerHTML = html;
    });
    if (window.MKS) {
      // Teks yang diedit bisa membawa nilai lama dari config; segarkan binding.
      $$("[data-free-ship]").forEach((el) => (el.textContent = rp(config.freeShippingMin)));
      $$("[data-city]").forEach((el) => (el.textContent = config.city));
    }
  }

  const wanted = () => !!window.MKS_EDITOR_ALWAYS || location.hash === "#edit";
  document.addEventListener("DOMContentLoaded", () => {
    applyText();
    if (wanted()) init();
  });
  window.addEventListener("hashchange", () => wanted() && init());

  /* ---------- UI ---------- */
  let booted = false;
  let textMode = false;
  let panel, statusEl;

  function init() {
    if (booted) return;
    booted = true;
    injectStyle();
    panel = document.createElement("aside");
    panel.className = "mks-editor";
    panel.setAttribute("aria-label", "Panel edit website");
    panel.innerHTML = `
      <header class="mks-head">
        <b>Mode Edit</b>
        <span class="mks-status" data-status></span>
        <button type="button" class="mks-x" data-hide title="Sembunyikan panel">✕</button>
      </header>
      <nav class="mks-tabs">
        <button type="button" class="is-on" data-tab="teks">Teks</button>
        <button type="button" data-tab="produk">Produk</button>
        <button type="button" data-tab="atur">Kontak &amp; Harga</button>
        <button type="button" data-tab="ekspor">Ekspor</button>
      </nav>
      <section class="mks-body" data-body></section>`;
    document.body.appendChild(panel);
    const pill = document.createElement("button");
    pill.type = "button";
    pill.className = "mks-pill";
    pill.textContent = "✎ Mode Edit";
    pill.hidden = true;
    document.body.appendChild(pill);
    pill.addEventListener("click", () => {
      panel.hidden = false;
      pill.hidden = true;
    });
    statusEl = $("[data-status]", panel);

    panel.addEventListener("click", (e) => {
      if (e.target.closest("[data-hide]")) {
        panel.hidden = true;
        pill.hidden = false;
      }
      const t = e.target.closest("[data-tab]");
      if (t) {
        $$("[data-tab]", panel).forEach((b) => b.classList.toggle("is-on", b === t));
        showTab(t.dataset.tab);
      }
    });
    showTab("teks");

    // Edit teks langsung di halaman
    document.addEventListener("input", (e) => {
      const el = e.target.closest && e.target.closest(".mks-editable");
      if (!el) return;
      state.text[pathOf(el)] = el.innerHTML;
      save();
    });
    document.addEventListener(
      "click",
      (e) => {
        if (textMode && e.target.closest(".mks-editable")) e.preventDefault();
      },
      true
    );
    document.addEventListener("paste", (e) => {
      if (!e.target.closest || !e.target.closest(".mks-editable")) return;
      e.preventDefault();
      document.execCommand("insertText", false, e.clipboardData.getData("text/plain"));
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && e.target.closest && e.target.closest(".mks-editable")) {
        e.preventDefault();
        document.execCommand("insertLineBreak");
      }
    });
  }

  function setStatus(msg, bad) {
    if (!statusEl) return;
    statusEl.textContent = msg;
    statusEl.classList.toggle("is-bad", !!bad);
  }

  function setTextMode(on) {
    textMode = on;
    editables().forEach((el) => {
      el.contentEditable = on ? "true" : "false";
      el.classList.toggle("mks-editable", on);
    });
    if (on) $$("details").forEach((d) => (d.open = true));
  }

  function showTab(name) {
    const body = $("[data-body]", panel);
    if (name !== "teks" && textMode) setTextMode(false);
    if (name === "teks") return tabText(body);
    if (name === "produk") return tabProducts(body);
    if (name === "atur") return tabConfig(body);
    if (name === "ekspor") return tabExport(body);
  }

  /* ---------- Tab Teks ---------- */
  function tabText(body) {
    body.innerHTML = `
      <label class="mks-switch"><input type="checkbox" id="mks-textmode" ${textMode ? "checked" : ""}/> <span>Aktifkan edit teks di halaman</span></label>
      <p class="mks-help">Saat aktif, semua judul, paragraf, tombol, dan FAQ bisa diklik lalu diketik langsung. Tekan Enter untuk baris baru. Perubahan tersimpan otomatis.</p>
      <p class="mks-help">Teks produk (nama, harga, deskripsi) diubah di tab <b>Produk</b>. Nomor WhatsApp, email, dan harga estimator di tab <b>Kontak &amp; Harga</b>.</p>
      <div class="mks-row">
        <button type="button" class="mks-btn" data-reset-text>Kembalikan semua teks asli</button>
      </div>
      <p class="mks-help mks-muted">${Object.keys(state.text).length} bagian teks sudah diubah.</p>`;
    $("#mks-textmode", body).addEventListener("change", (e) => setTextMode(e.target.checked));
    $("[data-reset-text]", body).addEventListener("click", () =>
      confirmBox(body, "Semua teks akan kembali ke versi asli. Lanjutkan?", () => {
        state.text = {};
        save();
        location.reload();
      })
    );
  }

  /* ---------- Tab Produk ---------- */
  const SHAPES = ["vase", "tall", "bulb", "cylinder", "bowl", "lamp", "planter", "wave"];
  const MOTIFS = ["ridge", "twist", "batik", "parang", "kawung", "smooth", "voronoi", "wave"];
  const CATS = ["vas", "lampu", "pot", "aksesori", "dinding"];
  const TAGS = [["bestseller", "Terlaris"], ["baru", "Baru"], ["hadiah", "Ide hadiah"]];

  function productsChanged() {
    state.products = products;
    save();
    window.MKS && window.MKS.refresh();
  }

  function tabProducts(body) {
    body.innerHTML = `
      <div class="mks-row">
        <button type="button" class="mks-btn mks-btn--primary" data-add-product>+ Tambah produk</button>
        <button type="button" class="mks-btn" data-reset-products>Kembalikan katalog asli</button>
      </div>
      <p class="mks-help">Harga dalam Rupiah tanpa titik. Foto akan diperkecil otomatis (maks. 900 px). Tanpa foto, ilustrasi dibuat dari bentuk &amp; motif.</p>
      <div data-list></div>`;
    const list = $("[data-list]", body);
    const render = () => {
      list.innerHTML = products.map((p, i) => productCard(p, i)).join("");
    };
    render();

    $("[data-add-product]", body).addEventListener("click", () => {
      const n = products.length + 1;
      products.push({
        id: "produk-" + Date.now().toString(36),
        name: "Produk baru " + n,
        category: "vas",
        collection: "Modern",
        price: 150000,
        shape: "vase",
        motif: "ridge",
        color: "#c8794a",
        desc: "Deskripsi singkat produk.",
        specs: ["Tinggi 15 cm", "PLA Matte"],
        tags: [],
      });
      productsChanged();
      render();
      list.lastElementChild.open = true;
      list.lastElementChild.scrollIntoView({ block: "nearest" });
    });
    $("[data-reset-products]", body).addEventListener("click", () =>
      confirmBox(body, "Katalog akan kembali ke versi asli (termasuk foto). Lanjutkan?", () => {
        replaceArray(products, ORIGINAL.products);
        state.products = null;
        save();
        window.MKS && window.MKS.refresh();
        render();
      })
    );

    list.addEventListener("input", (e) => onProductField(e, list));
    list.addEventListener("change", (e) => onProductField(e, list));
    list.addEventListener("click", (e) => {
      const b = e.target.closest("[data-act]");
      if (!b) return;
      const card = b.closest("[data-i]");
      const i = +card.dataset.i;
      const act = b.dataset.act;
      if (act === "del") {
        return confirmBox(card, `Hapus "${products[i].name}"?`, () => {
          products.splice(i, 1);
          productsChanged();
          render();
        });
      }
      if (act === "dup") {
        const c = clone(products[i]);
        c.id = c.id + "-" + Date.now().toString(36).slice(-4);
        c.name += " (salinan)";
        products.splice(i + 1, 0, c);
      }
      if (act === "up" && i > 0) products.splice(i - 1, 0, products.splice(i, 1)[0]);
      if (act === "down" && i < products.length - 1) products.splice(i + 1, 0, products.splice(i, 1)[0]);
      if (act === "noimg") delete products[i].image;
      productsChanged();
      render();
      const again = list.querySelector(`[data-i="${act === "up" ? i - 1 : act === "down" ? i + 1 : i}"]`);
      if (again && act !== "del") again.open = true;
    });
  }

  function productCard(p, i) {
    const sel = (name, opts, val) => `<select data-f="${name}">${opts.map((o) => `<option value="${o}"${o === val ? " selected" : ""}>${o}</option>`).join("")}</select>`;
    return `
    <details class="mks-card" data-i="${i}">
      <summary><span class="mks-thumb">${MKSArt.render(p, { small: true })}</span><span class="mks-sum"><b data-sum-name>${esc(p.name)}</b><small data-sum-price>${rp(p.price)} · ${esc(p.category)}</small></span></summary>
      <div class="mks-fields">
        <label>Nama<input data-f="name" value="${esc(p.name)}" /></label>
        <div class="mks-grid2">
          <label>Harga (Rp)<input data-f="price" type="number" min="0" step="1000" value="${+p.price || 0}" /></label>
          <label>Kategori${sel("category", CATS, p.category)}</label>
        </div>
        <div class="mks-grid2">
          <label>Koleksi<input data-f="collection" value="${esc(p.collection)}" /></label>
          <label>Warna<input data-f="color" type="color" value="${/^#[0-9a-f]{6}$/i.test(p.color) ? p.color : "#c8794a"}" /></label>
        </div>
        <div class="mks-grid2">
          <label>Bentuk ilustrasi${sel("shape", SHAPES, p.shape)}</label>
          <label>Motif${sel("motif", MOTIFS, p.motif)}</label>
        </div>
        <label>Deskripsi<textarea data-f="desc" rows="3">${esc(p.desc)}</textarea></label>
        <label>Spesifikasi (satu per baris)<textarea data-f="specs" rows="3">${esc((p.specs || []).join("\n"))}</textarea></label>
        <div class="mks-tags">${TAGS.map(([v, l]) => `<label><input type="checkbox" data-f="tags" value="${v}"${(p.tags || []).includes(v) ? " checked" : ""}/> ${l}</label>`).join("")}</div>
        <div class="mks-row">
          <label class="mks-btn mks-file">Unggah foto<input type="file" accept="image/*" data-f="image" hidden /></label>
          ${p.image ? `<button type="button" class="mks-btn" data-act="noimg">Hapus foto</button>` : ""}
        </div>
        <div class="mks-row mks-row--end">
          <button type="button" class="mks-icon" data-act="up" title="Naik">↑</button>
          <button type="button" class="mks-icon" data-act="down" title="Turun">↓</button>
          <button type="button" class="mks-btn" data-act="dup">Duplikat</button>
          <button type="button" class="mks-btn mks-btn--danger" data-act="del">Hapus</button>
        </div>
      </div>
    </details>`;
  }

  function onProductField(e, list) {
    const inp = e.target.closest("[data-f]");
    if (!inp) return;
    const card = inp.closest("[data-i]");
    const p = products[+card.dataset.i];
    const f = inp.dataset.f;
    if (f === "image") {
      if (e.type !== "change" || !inp.files[0]) return;
      return shrinkImage(inp.files[0]).then((url) => {
        p.image = url;
        productsChanged();
        $(".mks-thumb", card).innerHTML = MKSArt.render(p, { small: true });
        inp.value = "";
        const row = inp.closest(".mks-row");
        if (!$("[data-act=noimg]", row)) row.insertAdjacentHTML("beforeend", `<button type="button" class="mks-btn" data-act="noimg">Hapus foto</button>`);
      });
    }
    if (e.type === "input" && (inp.type === "checkbox" || inp.tagName === "SELECT")) return;
    if (f === "tags") p.tags = $$('[data-f="tags"]:checked', card).map((c) => c.value);
    else if (f === "specs") p.specs = inp.value.split("\n").map((s) => s.trim()).filter(Boolean);
    else if (f === "price") p.price = Math.max(0, Math.round(+inp.value || 0));
    else p[f] = inp.value;
    $("[data-sum-name]", card).textContent = p.name;
    $("[data-sum-price]", card).textContent = `${rp(p.price)} · ${p.category}`;
    if (["shape", "motif", "color"].includes(f)) $(".mks-thumb", card).innerHTML = MKSArt.render(p, { small: true });
    productsChanged();
  }

  function shrinkImage(file, max = 900) {
    return new Promise((res, rej) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const k = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = Math.round(img.width * k);
        c.height = Math.round(img.height * k);
        const ctx = c.getContext("2d");
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, c.width, c.height);
        ctx.drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        res(c.toDataURL("image/jpeg", 0.82));
      };
      img.onerror = rej;
      img.src = url;
    });
  }

  /* ---------- Tab Kontak & Harga ---------- */
  function configChanged() {
    state.config = config;
    save();
    window.MKS && window.MKS.refresh();
  }

  function tabConfig(body) {
    const E = config.estimator;
    const f = (k, label, type = "text", attrs = "") => `<label>${label}<input data-c="${k}" type="${type}" value="${esc(config[k])}" ${attrs}/></label>`;
    const table = (title, key, cols) => `
      <h4>${title}</h4>
      <table class="mks-table"><thead><tr>${cols.map((c) => `<th>${c.label}</th>`).join("")}</tr></thead><tbody>
      ${E[key].map((row, i) => `<tr>${cols.map((c) => `<td><input data-e="${key}.${i}.${c.k}" type="${c.type || "text"}" value="${esc(c.get ? c.get(row[c.k]) : row[c.k])}" ${c.attrs || ""}/></td>`).join("")}</tr>`).join("")}
      </tbody></table>`;
    body.innerHTML = `
      <h4>Kontak</h4>
      ${f("brand", "Nama brand")}
      ${f("whatsapp", "Nomor WhatsApp (format 62…, tanpa + dan spasi)", "tel", 'inputmode="numeric"')}
      ${f("email", "Email", "email")}
      ${f("instagram", "Instagram (tanpa @)")}
      ${f("tokopedia", "Link toko Tokopedia", "url")}
      ${f("shopee", "Link toko Shopee", "url")}
      ${f("city", "Kota (footer)")}
      ${f("freeShippingMin", "Minimal belanja gratis ongkir (Rp)", "number", 'min="0" step="10000"')}
      ${table("Estimator — ukuran", "sizes", [{ k: "label", label: "Label" }, { k: "base", label: "Harga dasar (Rp)", type: "number" }, { k: "hours", label: "Jam cetak", type: "number", attrs: 'step="0.5"' }])}
      ${table("Estimator — material", "materials", [{ k: "label", label: "Label" }, { k: "mult", label: "Pengali harga (1 = sama)", type: "number", attrs: 'step="0.05"' }])}
      ${table("Estimator — finishing", "finishes", [{ k: "label", label: "Label" }, { k: "add", label: "Tambahan (Rp)", type: "number" }])}
      ${table("Diskon jumlah", "tiers", [{ k: "min", label: "Mulai (pcs)", type: "number" }, { k: "disc", label: "Diskon (%)", type: "number", get: (v) => Math.round(v * 100) }])}
      <h4>Biaya desain</h4>
      <div class="mks-grid2">
        <label>+ Nama / logo (Rp)<input data-e="designFee.personal" type="number" value="${E.designFee.personal}" /></label>
        <label>Desain baru (Rp)<input data-e="designFee.custom" type="number" value="${E.designFee.custom}" /></label>
      </div>
      <div class="mks-row"><button type="button" class="mks-btn" data-reset-config>Kembalikan pengaturan asli</button></div>`;

    body.addEventListener("input", (e) => {
      const c = e.target.closest("[data-c]");
      if (c) {
        config[c.dataset.c] = c.type === "number" ? +c.value || 0 : c.value.trim();
        return configChanged();
      }
      const t = e.target.closest("[data-e]");
      if (!t) return;
      const path = t.dataset.e.split(".");
      let cur = config.estimator;
      while (path.length > 1) cur = cur[path.shift()];
      const k = path[0];
      let v = t.type === "number" ? +t.value || 0 : t.value;
      if (k === "disc") v = v / 100;
      cur[k] = v;
      configChanged();
    });
    $("[data-reset-config]", body).addEventListener("click", () =>
      confirmBox(body, "Kontak dan harga estimator kembali ke versi asli. Lanjutkan?", () => {
        replaceObject(config, ORIGINAL.config);
        state.config = null;
        save();
        window.MKS && window.MKS.refresh();
        tabConfig(body);
      })
    );
  }

  /* ---------- Tab Ekspor ---------- */
  function tabExport(body) {
    body.innerHTML = `
      <p class="mks-help">Salin isi file di bawah, lalu tempel ke file yang sama di GitHub (tombol ✎ di halaman file → Commit changes). Atau kirim semuanya ke Claude untuk di-commit.</p>
      <div class="mks-row">
        <button type="button" class="mks-btn mks-btn--primary" data-copy-all>Salin semua (untuk Claude)</button>
        <button type="button" class="mks-btn mks-btn--danger" data-reset-all>Hapus semua perubahan</button>
      </div>
      <div data-files><p class="mks-help">Menyiapkan file…</p></div>`;
    $("[data-reset-all]", body).addEventListener("click", () =>
      confirmBox(body, "Semua perubahan (teks, produk, kontak) dihapus dari browser ini. Lanjutkan?", () => {
        try {
          localStorage.removeItem(KEY);
        } catch (_) {}
        location.reload();
      })
    );
    buildExports().then((files) => {
      const box = $("[data-files]", body);
      if (!box.isConnected) return;
      box.innerHTML = files
        .map(
          (f, i) => `
        <div class="mks-file-block">
          <div class="mks-row mks-row--between"><code>${f.path}</code><button type="button" class="mks-btn" data-copy="${i}">Salin</button></div>
          ${f.error ? `<p class="mks-help is-bad">${esc(f.error)}</p>` : `<textarea readonly rows="6" id="mks-file-${i}">${esc(f.content)}</textarea>`}
        </div>`
        )
        .join("");
      box.addEventListener("click", (e) => {
        const b = e.target.closest("[data-copy]");
        if (b) copy(files[+b.dataset.copy].content, b);
      });
      $("[data-copy-all]", body).addEventListener("click", (e) => {
        copy(files.map((f) => `===== FILE: ${f.path} =====\n${f.content || "(" + f.error + ")"}\n`).join("\n"), e.target);
      });
    });
  }

  async function buildExports() {
    const header = (what) => `/*\n * ${what} — diekspor dari Mode Edit website pada ${new Date().toLocaleString("id-ID")}.\n * Ubah lewat Mode Edit (#edit) atau langsung di file ini.\n */\n`;
    const files = [
      { path: "assets/js/config.js", content: header("KONFIGURASI BISNIS") + "window.MKS_CONFIG = " + JSON.stringify(config, null, 2) + ";\n" },
      { path: "assets/js/products.js", content: header("KATALOG PRODUK") + "window.MKS_PRODUCTS = " + JSON.stringify(products, null, 2) + ";\n" },
    ];
    let html;
    try {
      const src = window.MKS_TEMPLATE || (await (await fetch(location.pathname.replace(/\/$/, "/index.html"), { cache: "no-store" })).text());
      const doc = new DOMParser().parseFromString(src, "text/html");
      Object.entries(state.text).forEach(([path, h]) => {
        const el = resolve(path, doc);
        if (el) el.innerHTML = h;
      });
      html = { path: "index.html", content: "<!doctype html>\n" + doc.documentElement.outerHTML + "\n" };
    } catch (_) {
      html = { path: "index.html", error: "index.html hanya bisa diekspor saat website dibuka lewat alamat web (bukan file lokal)." };
    }
    return [html, ...files];
  }

  function copy(text, btn) {
    const done = (ok) => {
      const t = btn.textContent;
      btn.textContent = ok ? "✓ Tersalin" : "Gagal — pilih teks manual";
      setTimeout(() => (btn.textContent = t), 1500);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(() => done(true), () => fallback());
    else fallback();
    function fallback() {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      let ok = false;
      try {
        ok = document.execCommand("copy");
      } catch (_) {}
      ta.remove();
      done(ok);
    }
  }

  function confirmBox(host, msg, onYes) {
    $$(".mks-confirm", host).forEach((x) => x.remove());
    const d = document.createElement("div");
    d.className = "mks-confirm";
    d.innerHTML = `<p>${esc(msg)}</p><div class="mks-row"><button type="button" class="mks-btn mks-btn--danger" data-yes>Ya</button><button type="button" class="mks-btn" data-no>Batal</button></div>`;
    host.prepend(d);
    d.addEventListener("click", (e) => {
      if (e.target.closest("[data-yes]")) {
        d.remove();
        onYes();
      }
      if (e.target.closest("[data-no]")) d.remove();
    });
    d.scrollIntoView({ block: "nearest" });
  }

  function injectStyle() {
    const s = document.createElement("style");
    s.textContent = `
      .mks-editable{outline:1.5px dashed rgba(200,121,74,.75);outline-offset:3px;border-radius:3px;cursor:text;min-width:1ch}
      .mks-editable:hover{background:rgba(200,121,74,.1)}
      .mks-editable:focus{outline:2px solid #c8794a;background:#fff}
      .mks-editor{position:fixed;top:0;right:0;bottom:0;width:min(400px,100vw);z-index:200;background:#fffdf9;color:#1f1a16;border-left:1px solid #e4dacb;box-shadow:-12px 0 40px rgba(0,0,0,.18);display:flex;flex-direction:column;font:14px/1.5 Inter,system-ui,sans-serif;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}
      .mks-editor[hidden]{display:none}
      .mks-editor *{box-sizing:border-box}
      .mks-head{display:flex;align-items:center;gap:10px;padding:12px 14px;border-bottom:1px solid #e4dacb;background:#1f1a16;color:#fff}
      .mks-head b{font-size:15px}
      .mks-status{flex:1;font-size:12px;color:#bfb2a1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .mks-status.is-bad{color:#ff9f7a}
      .mks-x{border:0;background:transparent;color:#fff;font-size:16px;cursor:pointer;padding:4px 8px;border-radius:6px}
      .mks-x:hover{background:rgba(255,255,255,.12)}
      .mks-tabs{display:flex;border-bottom:1px solid #e4dacb;background:#f2ebdf}
      .mks-tabs button{flex:1;border:0;background:transparent;padding:10px 4px;font:inherit;font-weight:600;font-size:13px;color:#5b524a;cursor:pointer;border-bottom:2px solid transparent}
      .mks-tabs button.is-on{color:#1f1a16;border-bottom-color:#c8794a;background:#fffdf9}
      .mks-body{flex:1;overflow-y:auto;padding:14px}
      .mks-body h4{margin:18px 0 8px;font-size:13px;text-transform:uppercase;letter-spacing:.08em;color:#9c5730}
      .mks-body label{display:flex;flex-direction:column;gap:4px;font-size:12px;color:#5b524a;margin-bottom:10px}
      .mks-body input:not([type=checkbox]):not([type=color]),.mks-body select,.mks-body textarea{width:100%;font:inherit;font-size:14px;color:#1f1a16;padding:8px 10px;border:1.5px solid #e4dacb;border-radius:8px;background:#fff}
      .mks-body input:focus,.mks-body select:focus,.mks-body textarea:focus{outline:none;border-color:#c8794a}
      .mks-body input[type=color]{width:100%;height:38px;padding:2px;border:1.5px solid #e4dacb;border-radius:8px;background:#fff}
      .mks-body textarea{resize:vertical}
      .mks-grid2{display:grid;grid-template-columns:1fr 1fr;gap:10px}
      .mks-row{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0}
      .mks-row--end{justify-content:flex-end}
      .mks-row--between{justify-content:space-between;align-items:center}
      .mks-btn{display:inline-flex;align-items:center;justify-content:center;font:inherit;font-size:13px;font-weight:600;padding:8px 14px;border-radius:999px;border:1.5px solid #1f1a16;background:#fff;color:#1f1a16;cursor:pointer;margin:0}
      .mks-btn:hover{background:#f2ebdf}
      .mks-btn--primary{background:#1f1a16;color:#fff}
      .mks-btn--primary:hover{background:#9c5730;border-color:#9c5730}
      .mks-btn--danger{border-color:#b3412a;color:#b3412a}
      .mks-btn--danger:hover{background:#b3412a;color:#fff}
      .mks-icon{width:36px;height:36px;border-radius:50%;border:1.5px solid #e4dacb;background:#fff;cursor:pointer;font-size:16px}
      .mks-switch{flex-direction:row!important;align-items:center;gap:10px!important;font-size:15px!important;color:#1f1a16!important;font-weight:600}
      .mks-switch input{width:20px;height:20px;accent-color:#c8794a}
      .mks-help{font-size:13px;color:#5b524a;margin:0 0 10px}
      .mks-help.is-bad{color:#b3412a}
      .mks-muted{color:#8a7a68}
      .mks-card{border:1px solid #e4dacb;border-radius:12px;margin-bottom:10px;background:#fff}
      .mks-card summary{display:flex;align-items:center;gap:10px;padding:8px 10px;cursor:pointer;list-style:none}
      .mks-card summary::-webkit-details-marker{display:none}
      .mks-thumb{width:46px;height:52px;flex:none;background:#f2ebdf;border-radius:8px;padding:3px;display:grid;place-items:center}
      .mks-thumb svg,.mks-thumb img{width:100%;height:100%;object-fit:contain}
      .mks-sum{display:flex;flex-direction:column;min-width:0}
      .mks-sum b{font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .mks-sum small{color:#5b524a}
      .mks-fields{padding:4px 12px 12px;border-top:1px solid #f2ebdf}
      .mks-tags{display:flex;gap:12px;flex-wrap:wrap}
      .mks-tags label{flex-direction:row;align-items:center;gap:6px;font-size:13px;color:#1f1a16}
      .mks-file{cursor:pointer}
      .mks-table{width:100%;border-collapse:collapse;font-size:12px}
      .mks-table th{text-align:left;font-weight:600;color:#5b524a;padding:0 4px 4px 0}
      .mks-table td{padding:0 4px 6px 0}
      .mks-table input{padding:6px 8px!important}
      .mks-file-block{margin-bottom:14px}
      .mks-file-block code{font-size:12px;background:#f2ebdf;padding:3px 8px;border-radius:6px}
      .mks-file-block textarea{font:11px/1.4 ui-monospace,Menlo,Consolas,monospace;white-space:pre}
      .mks-confirm{background:#fff4ec;border:1px solid #e8c3a8;border-radius:10px;padding:10px 12px;margin-bottom:12px}
      .mks-confirm p{margin:0 0 6px;font-size:13px;font-weight:600}
      .mks-pill{position:fixed;left:16px;bottom:calc(16px + env(safe-area-inset-bottom,0px));z-index:200;border:0;border-radius:999px;background:#1f1a16;color:#fff;font:600 14px Inter,system-ui,sans-serif;padding:12px 18px;cursor:pointer;box-shadow:0 8px 24px rgba(0,0,0,.25)}
      .mks-pill[hidden]{display:none}
      @media (min-width:900px){ body.mks-has-panel{padding-right:400px} }
      @media (max-width:760px){ .mks-editor{top:auto;height:62vh;width:100vw;border-left:0;border-top:1px solid #e4dacb;border-radius:16px 16px 0 0} }
    `;
    document.head.appendChild(s);
    document.body.classList.add("mks-has-panel");
  }
})();
