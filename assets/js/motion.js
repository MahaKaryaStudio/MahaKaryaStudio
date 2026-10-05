/*
 * MOTION — transisi saat scroll, tanpa library.
 *  1. Header: sembunyi saat scroll ke bawah, muncul saat scroll ke atas.
 *  2. Garis progres baca di atas halaman.
 *  3. Reveal: elemen/grup muncul (fade + naik) saat masuk layar, berjenjang.
 *  4. Parallax halus di hero (video latar & panggung lampu bergerak beda kecepatan).
 *  5. Cerita gulir "Tiga bagian": ilustrasi menempel, baris bagian menyala bergantian.
 * Semua dimatikan bila pengguna memilih "kurangi gerakan" di sistem.
 */
(function () {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  document.documentElement.classList.add(reduce ? "motion-off" : "motion-on");
  if (reduce) return;

  /* 1 + 2. Header & progres */
  const nav = $(".nav");
  const bar = document.createElement("div");
  bar.className = "scroll-progress";
  bar.setAttribute("aria-hidden", "true");
  document.body.appendChild(bar);
  let lastY = window.scrollY, ticking = false, hiddenNav = false;
  const hero = $(".lhero") || $(".hero");
  const heroBg = $(".lhero__bg");
  const heroStage = $(".lhero .stage") || $(".hero__stage");

  function onScroll() {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? Math.min(1, y / max) : 0})`;
    if (nav) {
      nav.classList.toggle("nav--scrolled", y > 8);
      const menuOpen = $(".menu[open]", nav);
      const down = y > lastY + 4, up = y < lastY - 4;
      if (down && y > 140 && !hiddenNav && !menuOpen) { hiddenNav = true; nav.classList.add("nav--hide"); }
      else if ((up || y < 140) && hiddenNav) { hiddenNav = false; nav.classList.remove("nav--hide"); }
    }
    // 4. Parallax hero (hanya selama hero masih terlihat)
    if (hero && y < hero.offsetHeight + 80) {
      if (heroBg) heroBg.style.transform = `translate3d(0, ${y * 0.22}px, 0)`;
      if (heroStage) heroStage.style.transform = `translate3d(0, ${y * -0.06}px, 0)`;
    }
    lastY = y;
    ticking = false;
  }
  addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  /* 3. Reveal */
  const SINGLE = ".eyebrow, .section-title, .section-sub, .lead, h1, .lhero__cta, .chips, .trust, .part-row, .step, .spec, .final__inner, .faq__list details, .hero__copy > *, .hero__points li, .custom__form, .b2b__copy, .material__copy";
  const GROUP = "#presets, #pkgs, #catalog, .safety, .why__grid, .products, .process__grid, .material__cards, .b2b__grid, .footer__grid, .steps-l, .parts-grid > div:last-child";
  $$(SINGLE).forEach((el) => { if (!el.closest(".nav, .mks-editor")) el.setAttribute("data-rv", ""); });
  $$(GROUP).forEach((el) => el.setAttribute("data-rv-group", ""));
  // Elemen yang sudah terlihat saat halaman dibuka langsung tampil (tanpa menunggu scroll)
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
  $$("[data-rv], [data-rv-group]").forEach((el) => io.observe(el));

  /* 5. Cerita gulir "Tiga bagian" (desktop) */
  const rows = $$("#tiga .part-row");
  if (rows.length && matchMedia("(min-width: 861px)").matches) {
    $("#tiga .parts-grid").classList.add("story");
    const ro = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) { rows.forEach((r) => r.classList.toggle("is-active", r === e.target)); }
    }), { rootMargin: "-45% 0px -45% 0px", threshold: 0 });
    rows.forEach((r) => ro.observe(r));
  }
})();
