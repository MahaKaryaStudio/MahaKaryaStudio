/*
 * MOTION — halaman yang bergerak mengikuti scroll, tanpa library.
 *  1. Header: sembunyi saat scroll ke bawah, muncul saat scroll ke atas; tautan nav mengikuti bagian aktif.
 *  2. Garis progres baca.
 *  3. Reveal dua arah: elemen masuk dari bawah saat scroll turun, dari atas saat scroll naik,
 *     dan diulang setiap kali keluar-masuk layar.
 *  4. Hero mengikuti scroll: parallax video & panggung, teks memudar, nyala lampu meredup.
 *  5. Cerita gulir "Tiga bagian": ilustrasi menempel, baris bagian menyala bergantian.
 *  6. Langkah "Cara pesan": garis pemandu terisi mengikuti scroll.
 *  7. Scroll halus (inersia) untuk roda mouse di desktop; sentuhan di HP tetap native.
 * Semua dimatikan bila pengguna memilih "kurangi gerakan" di sistem.
 */
(function () {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const html = document.documentElement;
  html.classList.add(reduce ? "motion-off" : "motion-on");
  if (reduce) return;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  /* ---------- 7. Scroll halus (desktop, roda mouse) ---------- */
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
  let smooth = null;
  if (finePointer) {
    // scroll-behavior: smooth milik CSS akan menganimasikan scrollTo kita sendiri; matikan,
    // dan tangani tautan # dengan inersia yang sama.
    html.style.scrollBehavior = "auto";
    let target = window.scrollY, current = window.scrollY, raf = 0, written = -1;
    const maxY = () => html.scrollHeight - innerHeight;
    const write = (v) => { written = Math.round(v); window.scrollTo(0, v); };
    const tick = () => {
      const diff = target - current;
      if (Math.abs(diff) < 0.5) { current = target; write(current); raf = 0; return; }
      current += diff * 0.14;
      write(current);
      raf = requestAnimationFrame(tick);
    };
    addEventListener("wheel", (e) => {
      if (e.ctrlKey || e.defaultPrevented) return;
      if (e.target.closest(".mks-editor, textarea, select, [data-native-scroll]")) return;
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      e.preventDefault();
      const d = e.deltaMode === 1 ? e.deltaY * 32 : e.deltaMode === 2 ? e.deltaY * innerHeight : e.deltaY;
      if (!raf) { current = window.scrollY; target = current; }
      target = clamp(target + d, 0, maxY());
      if (!raf) raf = requestAnimationFrame(tick);
    }, { passive: false });
    // Scroll yang bukan dari kita (klik tautan #, keyboard, drag scrollbar) terlihat dari
    // posisi yang tidak sama dengan yang terakhir kita tulis: hentikan inersia & sinkronkan.
    addEventListener("scroll", () => {
      const y = Math.round(window.scrollY);
      if (Math.abs(y - written) <= 1) return;
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
      current = target = y;
    }, { passive: true });
    document.addEventListener("click", (e) => {
      const a = e.target.closest('a[href^="#"]'); if (!a || a.closest(".mks-editor")) return;
      const el = a.getAttribute("href").length > 1 && document.getElementById(a.getAttribute("href").slice(1)); if (!el) return;
      e.preventDefault();
      const nav = document.querySelector(".nav");
      const pad = nav ? nav.offsetHeight + 12 : 80;
      if (!raf) { current = window.scrollY; }
      target = clamp(el.getBoundingClientRect().top + window.scrollY - pad, 0, maxY());
      if (!raf) raf = requestAnimationFrame(tick);
      history.replaceState(null, "", a.getAttribute("href"));
      a.closest(".menu")?.removeAttribute("open");
    });
    smooth = { stop: () => { if (raf) { cancelAnimationFrame(raf); raf = 0; } } };
  }

  /* ---------- 1 + 2 + 4 + 6. Semua yang dihitung per frame scroll ---------- */
  const nav = $(".nav");
  const bar = document.createElement("div");
  bar.className = "scroll-progress"; bar.setAttribute("aria-hidden", "true"); document.body.appendChild(bar);
  const hero = $(".lhero") || $(".hero");
  const heroBg = $(".lhero__bg");
  const heroStage = $(".lhero .stage") || $(".hero__stage");
  const heroCopy = $(".lhero__grid > div:first-child") || $(".hero__copy");
  const heroStageEl = $("#hero-stage");
  const steps = $(".steps-l");
  const navLinks = $$(".nav__links a[href^='#'], .menu__links a[href^='#']");
  const sections = navLinks.map((a) => $(a.getAttribute("href"))).filter(Boolean);
  let lastY = window.scrollY, ticking = false, hiddenNav = false, dirDown = true;

  function frame() {
    const y = window.scrollY;
    const max = html.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? clamp(y / max, 0, 1) : 0})`;
    // arah scroll → kelas di <html>, dipakai reveal dua arah
    if (y > lastY + 2 && !dirDown) { dirDown = true; html.classList.remove("scroll-up"); html.classList.add("scroll-down"); }
    else if (y < lastY - 2 && dirDown) { dirDown = false; html.classList.remove("scroll-down"); html.classList.add("scroll-up"); }
    if (nav) {
      nav.classList.toggle("nav--scrolled", y > 8);
      const menuOpen = $(".menu[open]", nav);
      if (y > lastY + 4 && y > 140 && !hiddenNav && !menuOpen) { hiddenNav = true; nav.classList.add("nav--hide"); }
      else if ((y < lastY - 4 || y < 140) && hiddenNav) { hiddenNav = false; nav.classList.remove("nav--hide"); }
      // scroll spy
      let active = null;
      for (const s of sections) if (s.getBoundingClientRect().top <= innerHeight * 0.4) active = s;
      navLinks.forEach((a) => a.classList.toggle("is-active", !!active && a.getAttribute("href") === "#" + active.id));
    }
    // hero mengikuti scroll
    if (hero) {
      const h = hero.offsetHeight || 1;
      if (y < h + 80) {
        const p = clamp(y / h, 0, 1);
        if (heroBg) heroBg.style.transform = `translate3d(0, ${y * 0.22}px, 0)`;
        if (heroStage) heroStage.style.transform = `translate3d(0, ${y * -0.06}px, 0) scale(${1 - p * 0.04})`;
        if (heroCopy) { heroCopy.style.opacity = String(1 - p * 1.1); heroCopy.style.transform = `translate3d(0, ${y * 0.12}px, 0)`; }
        if (heroStageEl && !heroStageEl.dataset.off) heroStageEl.style.setProperty("--dim", String(clamp(1 - p * 1.6, 0.15, 1)));
      }
    }
    // garis langkah "Cara pesan" terisi mengikuti posisi scroll
    if (steps) {
      const r = steps.getBoundingClientRect();
      const p = clamp((innerHeight * 0.75 - r.top) / r.height, 0, 1);
      steps.style.setProperty("--fill", p.toFixed(3));
      $$(".step", steps).forEach((st, i, arr) => st.classList.toggle("is-done", p >= (i + 0.5) / arr.length));
    }
    lastY = y; ticking = false;
  }
  addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }, { passive: true });
  addEventListener("resize", () => requestAnimationFrame(frame));
  html.classList.add("scroll-down");
  frame();
  // Jangan ubah --dim hero saat pengguna mematikan lampu lewat saklar
  if (heroStageEl) $("#hero-switch")?.addEventListener("click", () => { heroStageEl.dataset.off = heroStageEl.dataset.off ? "" : "1"; });

  /* ---------- 3. Reveal dua arah ---------- */
  const SINGLE = ".eyebrow, .section-title, .section-sub, .trust--hero, .part-row, .step, .spec, .final__inner, .faq__list details, .hero__points li, .custom__form, .b2b__copy, .material__copy";
  const GROUP = "#presets, #pkgs, #catalog, .safety, .why__grid, .products, .process__grid, .material__cards, .b2b__grid, .footer__grid, .parts-grid > div:last-child";
  $$(SINGLE).forEach((el) => { if (!el.closest(".nav, .mks-editor, .lhero__grid")) el.setAttribute("data-rv", ""); });
  $$(GROUP).forEach((el) => el.setAttribute("data-rv-group", ""));
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) e.target.classList.add("in");
    else if (e.boundingClientRect.top > 0) e.target.classList.remove("in"); // keluar lewat bawah: siap muncul lagi
    else if (e.boundingClientRect.bottom < 0) e.target.classList.remove("in"); // keluar lewat atas
  }), { rootMargin: "0px 0px -6% 0px", threshold: 0.06 });
  $$("[data-rv], [data-rv-group]").forEach((el) => io.observe(el));

  /* ---------- 5. Cerita gulir "Tiga bagian" (desktop) ---------- */
  const rows = $$("#tiga .part-row");
  if (rows.length && matchMedia("(min-width: 861px)").matches) {
    $("#tiga .parts-grid").classList.add("story");
    const ro = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) rows.forEach((r) => r.classList.toggle("is-active", r === e.target));
    }), { rootMargin: "-45% 0px -45% 0px", threshold: 0 });
    rows.forEach((r) => ro.observe(r));
  }

  window.MKSMotion = { smooth };
})();
