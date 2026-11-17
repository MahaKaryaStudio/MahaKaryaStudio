/*
 * MOTION — gerak mengikuti scroll, tanpa library, tanpa scroll-jacking (adendum v3.1 §4).
 *  1. (Nav: sembunyi/muncul, tema, slot, dan tautan aktif ada di nav.js, juga saat gerak dikurangi.)
 *  2. (Hero: nyala sekali setelah lampunya tergambar ada di lamp.js wakeHero(); tidak ada kopling gulir.)
 *  3. Cerita terpaku #kenapa (.story--pin): kalimat bertukar, lampu scene berevolusi; data-step, data-sub.
 *  4. #tiga: baris aktif (.is-active pada [data-tiga-row]) + data-focus pada #exploded, kelas .tiga--live;
 *     dihitung dari posisi garis tengah layar, hanya ≥ 1024 px dan selama seksi terlihat.
 *  5. #cara: garis progres (transform scaleY pada <i class="steps-l__fill">) dan langkah .is-done.
 * Satu requestAnimationFrame untuk semua: semua baca dulu (innerHeight, rect), baru tulis; nilai yang sama
 * dilewati; #kenapa, #tiga, dan #cara dihitung hanya selama IntersectionObserver menyatakan dekat/terlihat.
 * Tidak ada custom property yang ditulis per frame; tidak ada reveal saat gulir.
 * prefers-reduced-motion atau html.motion-off: tidak ada yang disembunyikan atau digerakkan. Perubahan
 * pengaturan selama kunjungan didengarkan: pin cerita dilepas (atau dipasang lagi) seketika.
 */
(function () {
  const html = document.documentElement;
  const mq = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };
  // html.motion-off yang sudah terpasang sebelum skrip ini (mis. dari pemilik halaman) = gerak mati permanen
  const forced = html.classList.contains("motion-off");
  const isOff = () => forced || mq.matches;
  const apply = () => {
    const off = isOff();
    html.classList.toggle("motion-off", off);
    html.classList.toggle("motion-on", !off);
    window.MKSMotion = { on: !off };
    return off;
  };
  let off = apply();

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const hasIO = "IntersectionObserver" in window;

  // Script dimuat sebelum DOM selesai di beberapa halaman: tunggu bila perlu
  const ready = (fn) => (document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", fn, { once: true }) : fn());
  ready(init);

  function init() {
    let raf = 0;
    const parts = []; // { read(): state|null, write(state) } per blok, dijalankan berurutan di satu frame
    function frame() {
      raf = 0;
      const states = parts.map((p) => p.read());
      parts.forEach((p, i) => p.write(states[i]));
    }
    const sync = () => { if (!raf) raf = requestAnimationFrame(frame); };
    // "dekat": IntersectionObserver memasang bendera; tanpa IO selalu dekat
    const near = (el, margin) => {
      const flag = { on: !hasIO };
      if (hasIO && el) new IntersectionObserver((es) => { flag.on = es[es.length - 1].isIntersecting; sync(); }, { rootMargin: margin, threshold: 0 }).observe(el);
      return flag;
    };

    /* ---------- 3. Cerita terpaku #kenapa ----------
       Bawaan CSS = kalimat bertumpuk. .story--pin (200vh desktop / 160vh HP, isi terpaku) hanya dipasang bila
       gerak aktif, layar cukup tinggi untuk isi pin, dan Mode Edit tidak terbuka. Yang ditulis hanya saat
       berganti: data-step (kalimat 0–2), data-sub (0/1: dua lampu selingan di kalimat kedua), kelas baris
       is-on/is-past/is-next, segmen progres, dan penutup (.story__close.is-on di kalimat terakhir), lampu .is-on,
       pil .is-ed, dan .is-lit pada lapisan cahaya lampu 3, bertahap selama lima frame (lihat queue). */
    const story = $(".story");
    if (story) {
      const lines = $$(".story__line", story), segs = $$(".story__prog i", story), close = $(".story__close", story);
      const art = $("#story-art", story), pill = $(".story__pill", story);
      // lampu scene: kalimat 0 -> lampu 0, kalimat 1 -> lampu 1/2 (data-sub), kalimat 2 -> lampu 3 (pilihan studio)
      const lampK = (idx, sub) => (idx === 0 ? 0 : idx === 1 ? 1 + sub : 3);
      const setLamps = (k) => $$(".story__lamp", story).forEach((l) => l.classList.toggle("is-on", l.dataset.k === k));
      // lapisan cahaya lampu 3 (elemen ber-style var(--dim)) diberi .is-lit langsung, dalam dua kelompok: part 0 =
      // penggelap dan rona hangat, part 1 = [data-la-lit]; part null = keduanya
      const setLit = (on, part) => $$('.story__lamp[data-k="3"] [style*="--dim"]', story).forEach((el) => {
        if (part == null || el.hasAttribute("data-la-lit") === (part === 1)) el.classList.toggle("is-lit", on);
      });
      // pergantian kalimat ditulis bertahap, satu tahap per frame: (1) kalimat yang keluar dan segmen; (2) kalimat yang
      // masuk dan penutup; (3) lampu .is-on dan pil; (4, 5) .is-lit pada lapisan cahaya lampu 3. Tiap tahap memulai
      // transisinya sendiri; satu frame tidak menanggung seluruh hitung ulang gaya (anggaran c18 <= 5 ms di CPU 4x).
      let queue = [];
      const MIN_H = 600;
      const nearStory = near(story, "50% 0px 50% 0px");
      let last = "", pinned = null;
      parts.push({
        read() {
          const pin = !off && innerHeight >= MIN_H && !document.body.classList.contains("mks-has-panel");
          // jauh dari layar tidak dihitung, kecuali keadaan awal (last kosong): kelas awal dipasang saat muat, bukan saat gulir masuk
          if (!pin || pinned !== true || (!nearStory.on && last)) return { pin, key: null };
          const r = story.getBoundingClientRect();
          const p = clamp(-r.top / Math.max(1, r.height - innerHeight), 0, 1);
          const n = Math.max(1, lines.length);
          const f = p * n * 0.98;
          const idx = Math.min(n - 1, Math.floor(f));
          return { pin, idx, sub: f - idx >= 0.5 ? 1 : 0, key: idx + ":" + (f - idx >= 0.5 ? 1 : 0) };
        },
        write(s) {
          if (queue.length && s.pin === pinned && (s.key == null || s.key === last)) { queue.shift()(); if (queue.length) sync(); return; }
          if (s.pin !== pinned) {
            queue = [];
            pinned = s.pin;
            last = "";
            story.classList.toggle("story--pin", s.pin);
            if (!s.pin) {
              story.removeAttribute("data-step");
              story.removeAttribute("data-sub");
              lines.forEach((l) => l.classList.remove("is-on", "is-past", "is-next"));
              segs.forEach((d) => d.classList.remove("is-on"));
              if (close) close.classList.remove("is-on");
              setLamps("");
              setLit(false);
              if (pill) pill.classList.toggle("is-ed", false);
            }
            // tinggi seksi berubah: hitung lagi di frame berikutnya (baca setelah tulis = frame baru)
            sync();
            return;
          }
          if (s.key == null || s.key === last) return;
          last = s.key;
          const n = lines.length;
          story.dataset.step = String(s.idx);
          story.dataset.sub = String(s.sub);
          // frame ini: kalimat yang keluar dan segmen; frame berikut: kalimat yang masuk dan penutup
          lines.forEach((l, i) => { if (i === s.idx) return; l.classList.remove("is-on"); l.classList.toggle("is-past", i < s.idx); l.classList.toggle("is-next", i > s.idx); });
          segs.forEach((d, i) => d.classList.toggle("is-on", i === s.idx));
          const k = String(lampK(s.idx, s.sub)), ed = s.idx === n - 1, cur = lines[s.idx];
          queue = [
            () => { if (cur) { cur.classList.remove("is-past", "is-next"); cur.classList.add("is-on"); } if (close) close.classList.toggle("is-on", ed); },
            () => { setLamps(k); if (pill) pill.classList.toggle("is-ed", ed); },
            () => setLit(k === "3", 0),
            () => setLit(k === "3", 1),
          ];
          sync();
        },
      });
      // lamp.js menggambar ulang scene (refresh, Mode Edit, ganti lebar): pasang lagi .is-on di frame berikutnya
      if (art && "MutationObserver" in window) new MutationObserver(() => { last = ""; sync(); }).observe(art, { childList: true });
      // Mode Edit (#edit) menambah body.mks-has-panel: cerita kembali bertumpuk agar semua kalimat bisa disunting
      if ("MutationObserver" in window) new MutationObserver(sync).observe(document.body, { attributes: true, attributeFilter: ["class"] });
    }

    /* ---------- 4. #tiga: baris aktif ----------
       Keadaan dihitung dari posisi, bukan dari peristiwa "masuk": baris aktif = baris yang memuat garis tengah
       layar; garis tengah di atas daftar → baris pertama, di bawah daftar → baris terakhir. Jadi arah gulir
       yang berbalik, lompatan (muat ulang, seret scrollbar, tautan #) dan ubah ukuran jendela selalu berakhir
       di baris yang benar. Dihitung hanya selama #tiga terlihat dan hanya di tata letak ≥ 1024 px (di bawahnya
       tanda baris aktif tidak digambar). Yang ditulis hanya pergantian kelas .is-active dan data-focus pada
       #exploded (penanda; gambar tidak diredupkan), dan hanya saat barisnya berganti; tampilan dan transisinya
       ada di CSS. Gerak dikurangi: baris pertama tetap bertanda, tanpa .tiga--live. */
    const tigaGrid = $("#tiga .tiga");
    const rows = $$("#tiga [data-tiga-row]");
    if (rows.length && tigaGrid && hasIO) {
      const ex = $("#exploded");
      const wide = window.matchMedia("(min-width: 1024px)");
      const seen = near(tigaGrid, "0px");
      let cur = rows.find((r) => r.classList.contains("is-active")) || rows[0];
      let live = null;
      parts.push({
        read() {
          if (off || !seen.on || !wide.matches) return { live: !off, row: off ? rows[0] : null };
          const mid = innerHeight / 2;
          let pick = rows[0];
          for (let i = 1; i < rows.length; i++) { if (rows[i].getBoundingClientRect().top <= mid) pick = rows[i]; else break; }
          return { live: true, row: pick };
        },
        write(s) {
          if (s.live !== live) { live = s.live; tigaGrid.classList.toggle("tiga--live", live); }
          if (!s.row) return;
          if (s.row !== cur) { cur = s.row; rows.forEach((r) => r.classList.toggle("is-active", r === s.row)); }
          // gerak dikurangi: tanpa data-focus (seperti sebelum langkah ini)
          const key = s.live ? s.row.dataset.tigaRow || "" : "";
          if (ex && (ex.dataset.focus || "") !== key) { if (key) ex.dataset.focus = key; else ex.removeAttribute("data-focus"); }
        },
      });
      if (wide.addEventListener) wide.addEventListener("change", sync);
    }

    /* ---------- 5. #cara: garis progres (scaleY) ----------
       Digosok gulir tanpa transisi: transform ditulis pada isian garis itu sendiri, dibulatkan ke 0,001 dan
       hanya bila berubah; titik langkah .is-done berganti warna (transisi warna 250 ms di motion.css). */
    const steps = $(".steps-l");
    const fill = steps && $(".steps-l__fill", steps);
    if (steps && fill) {
      const stepEls = $$(".step", steps);
      const nearCara = near(steps, "25% 0px 25% 0px");
      let lastP = null, lastDone = -1;
      parts.push({
        read() {
          if (off) return { p: null };
          if (!nearCara.on) return { p: -1 };
          const r = steps.getBoundingClientRect();
          return { p: Math.round(clamp((innerHeight * 0.75 - r.top) / (r.height || 1), 0, 1) * 1000) / 1000 };
        },
        write(s) {
          if (s.p === -1) return; // jauh dari layar: biarkan keadaan terakhir
          if (s.p == null) {
            // gerak dikurangi: garis penuh dari CSS, semua titik tinta
            if (lastP !== null) { fill.style.removeProperty("transform"); stepEls.forEach((st) => st.classList.remove("is-done")); lastP = null; lastDone = -1; }
            return;
          }
          if (s.p !== lastP) { lastP = s.p; fill.style.transform = `scaleY(${s.p})`; }
          const done = stepEls.filter((_, i) => s.p >= (i + 0.5) / stepEls.length).length;
          if (done !== lastDone) { lastDone = done; stepEls.forEach((st, i) => st.classList.toggle("is-done", i < done)); }
        },
      });
    }

    addEventListener("scroll", sync, { passive: true });
    addEventListener("resize", sync);
    const onPref = () => { off = apply(); sync(); };
    if (mq.addEventListener) mq.addEventListener("change", onPref);
    else if (mq.addListener) mq.addListener(onPref);
    frame();
  }
})();
