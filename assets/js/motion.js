/*
 * MOTION — gerak mengikuti scroll, tanpa library, tanpa scroll-jacking.
 *  1. (Nav: sembunyi/muncul, tema, slot, dan tautan aktif ada di nav.js, juga saat gerak dikurangi.)
 *  2. Hero menyala saat scroll: --dim 0.35 → 1 pada 0–30% tinggi hero, turun ke 0.6 saat keluar.
 *  3. Cerita terpaku #kenapa: kalimat bertukar; progres 0..1 di --story-p dan indeks di data-step.
 *  4. #tiga: ilustrasi menempel, baris aktif (.is-active) + data-focus pada #exploded.
 *  5. #cara: garis progres (--fill) dan langkah .is-done.
 *  6. Reveal SEKALI per seksi, hanya kepala seksi.
 * Scroll memakai perilaku asli browser (scroll-behavior: smooth dari CSS untuk tautan #).
 * prefers-reduced-motion atau html.motion-off: tidak ada yang disembunyikan atau digerakkan.
 */
(function () {
  const html = document.documentElement;
  const mq = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };
  const off = mq.matches || html.classList.contains("motion-off");
  html.classList.add(off ? "motion-off" : "motion-on");
  html.classList.remove(off ? "motion-on" : "motion-off");
  window.MKSMotion = { on: !off };
  if (off) return;

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const io = (cb, opts) => ("IntersectionObserver" in window ? new IntersectionObserver(cb, opts) : null);

  // Script dimuat sebelum DOM selesai di beberapa halaman: tunggu bila perlu
  const ready = (fn) => (document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", fn, { once: true }) : fn());
  ready(init);

  function init() {
    /* ---------- 2 + 5: dihitung per frame scroll ---------- */
    const hero = $(".lhero");
    const heroStage = $("#hero-stage");
    const hint = $("#hero-hint");
    const steps = $(".steps-l");
    let ticking = false;

    function frame() {
      const y = window.scrollY;
      if (hero && heroStage) {
        const h = hero.offsetHeight || 1;
        if (y < h + 80 && !heroStage.dataset.off) {
          const p = clamp(y / h, 0, 1);
          let lit = heroStage.dataset.auto ? 1 : 0.35 + 0.65 * clamp(p / 0.3, 0, 1);
          if (lit >= 1) heroStage.dataset.auto = "1";
          if (p > 0.7) lit = Math.min(lit, 1 - 0.4 * clamp((p - 0.7) / 0.3, 0, 1));
          heroStage.style.setProperty("--dim", lit.toFixed(3));
          if (hint) hint.classList.toggle("is-off", lit > 0.5 || !!heroStage.dataset.auto);
        }
      }
      if (steps) {
        const r = steps.getBoundingClientRect();
        const p = clamp((innerHeight * 0.75 - r.top) / (r.height || 1), 0, 1);
        steps.style.setProperty("--fill", p.toFixed(3));
        $$(".step", steps).forEach((st, i, arr) => st.classList.toggle("is-done", p >= (i + 0.5) / arr.length));
      }
      ticking = false;
    }
    const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } };
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", onScroll);
    frame();
    // Tanpa gulir, lampu hero tetap menyala sendiri setelah 2,2 detik
    if (heroStage) {
      setTimeout(() => {
        if (heroStage.dataset.auto || heroStage.dataset.off || window.scrollY > (hero ? hero.offsetHeight * 0.7 : 600)) return;
        heroStage.dataset.auto = "1";
        heroStage.style.setProperty("--dim", "1");
        if (hint) hint.classList.add("is-off");
      }, 2200);
      // Saklar hero mematikan kendali scroll (lamp.js memegang nyala/mati)
      const sw = $("#hero-switch");
      if (sw) sw.addEventListener("click", () => { heroStage.dataset.off = heroStage.dataset.off ? "" : "1"; });
    }

    /* ---------- 3. Cerita terpaku ---------- */
    const story = $(".story");
    if (story) {
      const lines = $$(".story__line", story), dots = $$(".story__dots li", story), card = $(".story__card", story);
      let last = -1;
      const storyFrame = () => {
        const r = story.getBoundingClientRect();
        const total = r.height - innerHeight;
        const p = clamp(-r.top / Math.max(1, total), 0, 1);
        story.style.setProperty("--story-p", p.toFixed(3));
        const n = Math.max(1, lines.length);
        const idx = Math.min(n - 1, Math.floor(p * n * 0.98));
        if (idx !== last) {
          last = idx;
          story.dataset.step = String(idx);
          lines.forEach((l, i) => { l.classList.toggle("is-on", i === idx); l.classList.toggle("is-past", i < idx); l.classList.toggle("is-next", i > idx); });
          dots.forEach((d, i) => d.classList.toggle("is-on", i === idx));
          if (card) card.classList.toggle("is-on", idx === n - 1);
        }
      };
      let sTick = false;
      addEventListener("scroll", () => { if (!sTick) { sTick = true; requestAnimationFrame(() => { sTick = false; storyFrame(); }); } }, { passive: true });
      storyFrame();
    }

    /* ---------- 4. #tiga: baris aktif (desktop) ---------- */
    const rows = $$("#tiga [data-tiga-row], #tiga .part-row");
    const grid = $("#tiga .parts-grid");
    if (rows.length && grid && matchMedia("(min-width: 861px)").matches) {
      grid.classList.add("parts-grid--story");
      const ro = io((es) => es.forEach((e) => {
        if (!e.isIntersecting) return;
        const i = rows.indexOf(e.target);
        rows.forEach((r) => r.classList.toggle("is-active", r === e.target));
        const tiga = $("#tiga"); if (tiga) tiga.dataset.active = String(i);
        const ex = $("#exploded"); if (ex) ex.dataset.focus = ["head", "body", "base"][i] || "";
      }), { rootMargin: "-45% 0px -45% 0px", threshold: 0 });
      if (ro) rows.forEach((r) => ro.observe(r));
    }

    /* ---------- 6. Reveal sekali: kepala seksi saja ---------- */
    const heads = [];
    $$("main section").forEach((sec) => {
      if (sec.matches(".lhero, .story")) return;
      $$(":scope > .wrap > :is(.eyebrow, .label, .section-title, .section-sub), :scope > .wrap > div > :is(.eyebrow, .label, .section-title)", sec)
        .slice(0, 3)
        .forEach((el, i) => { el.setAttribute("data-rv", ""); el.style.setProperty("--rv-i", String(i)); heads.push(el); });
    });
    const show = (el) => el.classList.add("in");
    const rio = io((es) => es.forEach((e) => { if (e.isIntersecting) { show(e.target); rio.unobserve(e.target); } }), { rootMargin: "0px 0px -6% 0px", threshold: 0 });
    heads.forEach((el) => {
      // yang sudah terlewati (mis. masuk lewat tautan #) langsung tampil
      if (!rio || el.getBoundingClientRect().top < innerHeight * 0.94) show(el);
      else rio.observe(el);
    });
  }
})();
