/*
 * KROM HALAMAN — nav, menu HP, bilah pesan HP (orderbar). Dimuat di index.html dan koleksi.html.
 *
 *  Nav (semua halaman):
 *   - sembunyi saat gulir turun (> 400 px), muncul saat gulir naik / fokus masuk nav  → .nav--hide
 *   - elemen sticky memakai top tetap calc(var(--nav-h) + jarak): nav yang bersembunyi tidak menggesernya (K9)
 *   - tautan aktif mengikuti seksi di garis 40% layar                                → .nav__links a.is-active
 *  Nav melayang (index.html, .nav--float):
 *   - tema mengikuti seksi di bawah nav: data-nav-theme = clear (puncak hero) | dark | light
 *   - slot kanan kontekstual (desktop): data-slot = cta (hero, #kenapa) | none (#edisi–#rakit, .final)
 *     | mini (#alur–#faq: ringkasan rakitan + WA "Pesan")
 *   - WA "Pesan" di ringkasan disembunyikan selama tombol berisi lain terlihat        → .nav--quiet
 *     (maksimal satu tombol berisi per viewport)
 *   - html.in-studio: HP, saat blok [data-studio-sticky] di #rakit sudah mencapai tepi atas dan #rakit masih
 *     di layar → nav disembunyikan penuh (tidak ada celah di atas panggung, nav tidak menutupinya)
 *  Tombol berisi: satu IntersectionObserver menyempitkan kandidat ke tombol berisi di dalam layar; per frame hanya
 *   kandidat itu yang diperiksa (visibility, dialog, batas atas). Daftar disegarkan saat DOM berubah.
 *  Menu HP: <dialog id="menu"> layar penuh; Escape / tombol tutup menutup, fokus kembali ke tombol menu.
 *  Orderbar HP (#orderbar, elemen terakhir di DOM):
 *   - isi dari event "mks:change" (nama · jumlah bagian, harga, chip delta, tautan WA)
 *   - tampil dari #edisi sampai .final masuk layar; disembunyikan selama tombol berisi lain terlihat
 *     dan selama <dialog> terbuka; selalu tampil di dalam #rakit            → #orderbar.is-on, html.has-orderbar
 */
(function () {
  const html = document.documentElement;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  /* ---------- Menu ringkas lama (<details class="menu">, koleksi.html) ---------- */
  document.addEventListener("click", (e) => {
    const m = document.querySelector(".menu[open]");
    if (!m) return;
    if (e.target.closest(".menu__links a") || !m.contains(e.target)) m.open = false;
  });
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    const m = document.querySelector(".menu[open]");
    if (!m) return;
    m.open = false;
    const s = m.querySelector("summary");
    if (s) s.focus();
  });

  const nav = $(".nav");
  if (!nav) return;
  const float = nav.classList.contains("nav--float");
  const mq = (q) => (window.matchMedia ? window.matchMedia(q) : { matches: false, addEventListener() {} });
  const HP = mq("(max-width: 900px)");
  const onChange = (m, fn) => (m.addEventListener ? m.addEventListener("change", fn) : m.addListener && m.addListener(fn));

  /* ---------- Menu HP: <dialog> layar penuh ---------- */
  const menu = $("#menu");
  const menuBtn = $("[data-menu-open]");
  let focusAfterClose = null;
  function openMenu() {
    if (!menu || menu.open) return;
    if (typeof menu.showModal === "function") menu.showModal();
    else menu.setAttribute("open", "");
    html.classList.add("menu-open");
    if (menuBtn) menuBtn.setAttribute("aria-expanded", "true");
    sync();
  }
  function closeMenu(target) {
    if (!menu || !menu.open) return;
    focusAfterClose = target || null;
    if (typeof menu.close === "function") menu.close();
    else { menu.removeAttribute("open"); onMenuClosed(); }
  }
  function onMenuClosed() {
    html.classList.remove("menu-open");
    if (menuBtn) menuBtn.setAttribute("aria-expanded", "false");
    const t = focusAfterClose;
    focusAfterClose = null;
    if (t) {
      // Tautan seksi: fokus pindah ke seksi tujuan (tanpa menggulir; gulir ditangani tautan itu sendiri)
      if (!t.hasAttribute("tabindex")) t.setAttribute("tabindex", "-1");
      t.focus({ preventScroll: true });
    } else if (menuBtn) menuBtn.focus({ preventScroll: true });
    sync();
  }
  if (menu) {
    menu.addEventListener("close", onMenuClosed);
    menu.addEventListener("click", (e) => {
      const c = e.target.closest("[data-menu-close], a[href]");
      if (!c) return;
      const href = c.getAttribute("href") || "";
      let target = null;
      if (href.startsWith("#") && href.length > 1) { try { target = document.querySelector(href); } catch (_) {} }
      if (c.matches("[data-menu-close]") || target) closeMenu(target);
    });
  }
  if (menuBtn) menuBtn.addEventListener("click", openMenu);
  onChange(HP, () => { if (!HP.matches) closeMenu(); sync(); });

  /* ---------- Gulir: sembunyi/muncul, tema, slot, tautan aktif, orderbar ---------- */
  const sections = $$("main > section, body > footer");
  const SLOT = { hero: "cta", kenapa: "cta", alur: "mini", paket: "mini", bagian: "mini", cara: "mini", aman: "mini", faq: "mini" };
  const links = $$(".nav__links a[href^='#'], .menu-sheet__links a[href^='#'], .menu__links a[href^='#']");
  const targets = links.map((a) => { try { return document.querySelector(a.getAttribute("href")); } catch (_) { return null; } });
  // Tombol berisi (primer, primer gelap, WA). [data-primary-cta] menandai CTA utama seksi secara eksplisit.
  const FILLED = "[data-primary-cta], .btn--primary, .btn--primary-dark, .btn--wa, .btn--wa-amber";
  const bar = $("#orderbar");
  let lastY = window.scrollY, hiddenByScroll = false, ticking = false, barOn = false, barReady = false;
  const state = { off: null, theme: null, slot: null, quiet: null, studio: null };

  const navH = () => nav.offsetHeight || 72;
  function rectOf(el) {
    if (!el.getClientRects().length) return null;
    const r = el.getBoundingClientRect();
    return r.width && r.height ? r : null;
  }
  // Kandidat tombol berisi: hanya yang dekat layar menurut IntersectionObserver. Tombol yang baru masuk DOM
  // (render ulang ringkasan, paket, lembar bagian) dianggap kandidat sampai IO melaporkannya pertama kali, jadi
  // tidak ada frame tempat tombol baru terlewat. Daftar tombol disegarkan malas: MutationObserver hanya menandai
  // "kotor", querySelectorAll dijalankan di frame berikutnya. Tanpa IO: semua tombol berisi diperiksa (perilaku lama).
  const cand = new Set();
  let watched = new Set(), dirty = true;
  const fio = "IntersectionObserver" in window ? new IntersectionObserver((es) => {
    es.forEach((e) => { if (e.isIntersecting) cand.add(e.target); else cand.delete(e.target); });
    sync();
  }, { rootMargin: "50% 0px 50% 0px" }) : null; // setengah layar di atas dan bawah: tombol sudah jadi kandidat sebelum masuk
  function collect() {
    dirty = false;
    const now = new Set([...document.querySelectorAll(FILLED)].filter((el) => !el.closest(".nav, #orderbar, #menu")));
    watched.forEach((el) => { if (!now.has(el)) { if (fio) fio.unobserve(el); cand.delete(el); } });
    now.forEach((el) => { if (!watched.has(el)) { cand.add(el); if (fio) fio.observe(el); } });
    watched = now;
  }
  if (fio && "MutationObserver" in window) new MutationObserver(() => { dirty = true; }).observe(document.body, { childList: true, subtree: true });
  // Tombol berisi lain (di luar nav, orderbar, menu) yang terlihat di antara top..bawah layar, atau null
  function filledInView(top) {
    const vh = window.innerHeight;
    if (dirty || !fio) collect();
    for (const el of cand) {
      if (!el.isConnected) continue;
      const dlg = el.closest("dialog");
      if (dlg && !dlg.open) continue;
      const r = rectOf(el);
      if (!r || r.bottom <= top || r.top >= vh) continue;
      if (getComputedStyle(el).visibility === "hidden") continue;
      return el;
    }
    return null;
  }
  // Bar akan menjadi inert padahal fokus ada di dalamnya: pindahkan fokus ke target di alur halaman
  // (tombol berisi yang menggantikannya di layar, atau seksi di tengah layar), jangan jatuh ke <body>.
  function rescueFocus() {
    const a = document.activeElement;
    if (!a || !bar.contains(a)) return;
    let t = filledInView(0);
    if (!t) {
      const mid = window.innerHeight / 2;
      t = sections.find((s) => { const r = s.getBoundingClientRect(); return r.top <= mid && r.bottom > mid; }) || $("main");
      if (t && !t.hasAttribute("tabindex")) t.setAttribute("tabindex", "-1");
    }
    if (t) t.focus({ preventScroll: true });
  }
  function setOrderbar(on) {
    if (!bar || on === barOn) return;
    if (!on) rescueFocus();
    barOn = on;
    bar.classList.toggle("is-on", on);
    bar.inert = !on;
    if (on) bar.removeAttribute("aria-hidden");
    else bar.setAttribute("aria-hidden", "true");
    html.classList.toggle("has-orderbar", on);
    document.body.classList.toggle("has-orderbar", on);
  }

  function frame() {
    ticking = false;
    const y = window.scrollY, vh = window.innerHeight, h = navH();
    const menuOpen = !!(menu && menu.open) || !!nav.querySelector(".menu[open]");
    const a = document.activeElement;
    // Fokus keyboard di dalam nav (bukan fokus programatik setelah menu ditutup lewat sentuhan) menahan nav tetap terlihat
    let fv = false;
    try { fv = !!a && a.matches(":focus-visible"); } catch (_) { fv = true; }
    const focusIn = !!a && a !== document.body && nav.contains(a) && fv;
    if (menuOpen || focusIn || y < 140) hiddenByScroll = false;
    else if (y > lastY + 4 && y > 400) hiddenByScroll = true;
    else if (y < lastY - 4) hiddenByScroll = false;
    lastY = y;

    // Studio rakit HP: blok sticky menempel di atas → nav disembunyikan penuh
    let studio = false;
    const st = HP.matches ? $("[data-studio-sticky]") : null;
    if (st && !menuOpen) {
      const r = st.getBoundingClientRect();
      const sec = (st.closest("section") || st).getBoundingClientRect();
      studio = r.top <= h + 1 && sec.bottom > h + Math.min(r.height, vh) * 0.5;
    }
    if (studio !== state.studio) { state.studio = studio; html.classList.toggle("in-studio", studio); }
    const off = (hiddenByScroll || studio) && !focusIn && !menuOpen;
    if (off !== state.off) {
      state.off = off;
      nav.classList.toggle("nav--hide", off);
    }

    // Tautan aktif: seksi yang memuat garis 40% tinggi layar
    const line = vh * 0.4;
    links.forEach((ln, i) => {
      const t = targets[i];
      let on = false;
      if (t) { const r = t.getBoundingClientRect(); on = r.top <= line && r.bottom > line; }
      ln.classList.toggle("is-active", on);
    });

    if (float) {
      // Seksi di bawah nav (garis tengah nav)
      const probe = h / 2;
      let cur = null;
      for (const s of sections) { const r = s.getBoundingClientRect(); if (r.top <= probe && r.bottom > probe) { cur = s; break; } }
      const dark = !!cur && cur.classList.contains("dark");
      const theme = dark ? (y < 8 && cur === sections[0] ? "clear" : "dark") : "light";
      if (theme !== state.theme) { state.theme = theme; nav.dataset.navTheme = theme; }
      const slot = (cur && SLOT[cur.id]) || "none";
      if (slot !== state.slot) { state.slot = slot; nav.dataset.slot = slot; }
      const quiet = slot === "mini" && !HP.matches && !!filledInView(h);
      if (quiet !== state.quiet) { state.quiet = quiet; nav.classList.toggle("nav--quiet", quiet); }
    }

    // Orderbar HP
    if (bar && barReady) {
      let on = false;
      if (HP.matches) {
        const ed = $("#edisi"), fin = $(".final"), rk = $("#rakit");
        const started = ed ? ed.getBoundingClientRect().top <= vh * 0.5 : y > vh;
        const ended = fin ? fin.getBoundingClientRect().top < vh : false;
        let inRakit = false;
        if (rk) { const r = rk.getBoundingClientRect(); inRakit = r.top <= vh * 0.5 && r.bottom > vh * 0.5; }
        const dlgOpen = !!document.querySelector("dialog[open]");
        on = started && !ended && !dlgOpen && (inRakit || !filledInView(0));
      }
      setOrderbar(on);
    }
  }
  function sync() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
  window.addEventListener("scroll", sync, { passive: true });
  window.addEventListener("resize", sync);
  window.addEventListener("load", sync);
  nav.addEventListener("focusin", sync);
  nav.addEventListener("focusout", () => setTimeout(sync, 0));
  if (bar) { bar.inert = true; bar.setAttribute("aria-hidden", "true"); }

  /* ---------- Rakitanmu: ringkasan nav + orderbar dari "mks:change" ---------- */
  const reduce = () => html.classList.contains("motion-off") || mq("(prefers-reduced-motion: reduce)").matches;
  const rp = (n) => "Rp" + Math.round(Math.abs(n)).toLocaleString("id-ID");
  const amountHtml = (n) => (window.MKSLamp && window.MKSLamp.fmt ? window.MKSLamp.fmt.amountHtml(n) : `<span class="rp">Rp</span>${Math.round(n).toLocaleString("id-ID")}`);
  const els = {
    obName: $("[data-ob-name]"), obPrice: $("[data-ob-price]"), obDelta: $("[data-ob-delta]"), obBtn: bar && $(".orderbar__btn", bar),
    name: $("[data-nav-name]"), price: $("[data-nav-price]"), delta: $("[data-nav-delta]"), pesan: $(".nav__pesan"),
  };
  let lastTotal = null;
  // Perubahan dari papan ketik (panah di indeks edisi, tab, segmented) tidak dianimasikan (adendum §4 aturan 6).
  // change dan "mks:change" dari tombol berjalan serentak di dalam aksi bawaan keydown/keyup-nya, jadi bendera
  // dipasang di keydown/keyup dan dilepas di tugas berikutnya (setTimeout 0): tidak bergantung pada lama render.
  let kbd = false, kbdT = 0;
  const markKey = (e) => { if (e.key === "Tab") return; kbd = true; clearTimeout(kbdT); kbdT = setTimeout(() => { kbd = false; }, 0); };
  document.addEventListener("keydown", markKey, true);
  document.addEventListener("keyup", markKey, true);
  document.addEventListener("pointerdown", () => { kbd = false; }, true);
  const fromKey = () => kbd;
  // Harga berganti di node yang sama: crossfade --t-fast dengan kurva --ease-out (opasitas saja, mulai .4 supaya harga
  // terbaca di setiap frame dan tidak pernah ditunda); papan ketik dan gerak dikurangi: seketika
  const tok = (name, fb) => getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fb;
  function swap(el, h) {
    if (!el || el.innerHTML === h) return;
    const first = !el.innerHTML;
    el.innerHTML = h;
    if (!first && !fromKey() && !reduce() && el.animate) el.animate([{ opacity: 0.4 }, { opacity: 1 }], { duration: parseFloat(tok("--t-fast", "150")) || 150, easing: tok("--ease-out", "ease-out") });
  }
  function setText(el, t) { if (el && el.textContent !== t) el.textContent = t; }
  // Chip delta 1,2 dtk. Dari papan ketik: muncul dan hilang seketika (.is-instant = transition none), tanpa animasi.
  function showDelta(el, d) {
    if (!el) return;
    const still = fromKey();
    el.textContent = (d > 0 ? "+" : "−") + rp(d);
    clearTimeout(el._t);
    el.classList.toggle("is-instant", still);
    el.hidden = false;
    if (!still) { el.classList.remove("is-on"); void el.offsetWidth; }
    el.classList.add("is-on");
    el._t = setTimeout(() => {
      el.classList.remove("is-on");
      if (el.classList.contains("is-instant")) { el.hidden = true; return; }
      el._t = setTimeout(() => { el.hidden = true; }, 150); // keluar --t-fast (150); gerak dikurangi: opasitas 150 linear
    }, 1200);
  }
  const QUIET_REASONS = { load: 1, refresh: 1 };
  function render(det) {
    if (!det || !det.price) return;
    const total = det.price.total;
    const delta = lastTotal == null || QUIET_REASONS[det.reason] ? 0 : total - lastTotal;
    lastTotal = total;
    const name = det.presetName || "Rakitanmu";
    // Orderbar: "KEBUN · 5 BAGIAN" (huruf kapital lewat CSS) + harga 24
    setText(els.obName, `${name} · ${det.partsCount} bagian`);
    swap(els.obPrice, amountHtml(total));
    if (els.obBtn && det.waUrl) { els.obBtn.href = det.waUrl; els.obBtn.target = "_blank"; els.obBtn.rel = "noopener"; }
    if (bar && !barReady) { barReady = true; bar.hidden = false; }
    // Ringkasan nav desktop
    setText(els.name, name);
    swap(els.price, amountHtml(total));
    if (els.pesan && det.waUrl) { els.pesan.href = det.waUrl; els.pesan.target = "_blank"; els.pesan.rel = "noopener"; }
    if (delta) { showDelta(els.obDelta, delta); showDelta(els.delta, delta); }
    sync();
  }
  document.addEventListener("mks:change", (e) => render(e.detail));
  // Posisi awal (juga saat halaman dibuka di tengah, mis. index.html#paket). Dipanggil setelah semua deklarasi.
  frame();
})();
