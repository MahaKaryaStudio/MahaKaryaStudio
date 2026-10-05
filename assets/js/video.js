/*
 * GENERATOR VIDEO PROMO — antarmuka, pratinjau, dan encoder.
 *
 * Adegan dari video-scenes.js digambar ke canvas lalu di-encode di browser:
 *  - Jalur utama: WebCodecs (VideoEncoder) + mp4-muxer / webm-muxer → MP4 H.264 atau WebM VP9,
 *    lebih cepat dari durasi video, frame tepat 30 fps (Chrome, Edge, Safari 16.4+, Opera).
 *  - Cadangan: MediaRecorder dari canvas.captureStream (perekaman waktu nyata, WebM; Firefox).
 * Tidak ada server. Edit dari Mode Edit (localStorage "mks-edits-v2") ikut dipakai.
 */
(function () {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const clone = (x) => JSON.parse(JSON.stringify(x));
  const C = window.MKS_CONFIG, D = window.MKS_LAMP, V = window.MKSVideo;

  /* ---------- Terapkan edit dari Mode Edit (localStorage) ---------- */
  try {
    const s = JSON.parse(localStorage.getItem("mks-edits-v2")) || {};
    const replace = (target, src) => { Object.keys(target).forEach((k) => delete target[k]); Object.assign(target, clone(src)); };
    if (s.lamp) replace(D, s.lamp);
    if (s.config) replace(C, s.config);
    if (s.products && window.MKS_PRODUCTS) window.MKS_PRODUCTS.splice(0, window.MKS_PRODUCTS.length, ...clone(s.products));
  } catch (_) { /* tanpa edit */ }

  /* ---------- State ---------- */
  const siteGuess = location.protocol.startsWith("http") && !/localhost|127\.0\.0\.1/.test(location.host) ? (location.host + location.pathname.replace(/[^/]*$/, "")).replace(/\/$/, "") : "mahakaryastudio.github.io/MahaKaryaStudio";
  const S = {
    template: "lampu",
    format: "9:16",
    size: "full",
    theme: "dark",
    pace: 1,
    quality: "sedang",
    container: "mp4",
    presetIndex: D.popularPreset || 0,
    cfg: clone(D.presets[D.popularPreset || 0]),
    showPrice: true,
    showCode: true,
    noText: false,
    products: (window.MKS_PRODUCTS || []).slice(0, 4).map((p) => p.id),
    photos: [],
    photoDur: 3,
    text: { headline: "", sub: "", cta: "", highlight: "", detail: "" },
    cta: { wa: C.whatsapp || "", ig: C.instagram || "", site: siteGuess, trust: "Garansi 30 hari cacat cetak · Foto rakitan sebelum dikirim" },
    safe: true,
  };
  let movie = null, building = false, dirty = false, playing = true, tPrev = 0, t = 0, lastTs = 0;

  function toast(msg, bad) {
    const el = $("#toast");
    el.textContent = msg;
    el.classList.add("show");
    el.classList.toggle("bad", !!bad);
    clearTimeout(toast.t);
    toast.t = setTimeout(() => el.classList.remove("show"), 2600);
  }

  /* ---------- Font ---------- */
  let fontsReady = null;
  function ensureFonts() {
    if (fontsReady) return fontsReady;
    const want = ['600 40px "Fraunces"', 'italic 400 40px "Fraunces"', '400 20px "Inter"', '500 20px "Inter"', '600 20px "Inter"', '500 20px "DM Mono"'];
    fontsReady = Promise.all(want.map((f) => document.fonts.load(f).catch(() => null))).then(() => {
      if (!document.fonts.check('600 40px "Fraunces"')) $("#font-warn").hidden = false;
    });
    return fontsReady;
  }

  /* ---------- Bangun film ---------- */
  async function rebuild() {
    if (building) { dirty = true; return; }
    building = true;
    $("#status").textContent = "Menyusun adegan…";
    try {
      await ensureFonts();
      const opts = {
        template: S.template, format: S.format, size: S.size, theme: S.theme, pace: S.pace,
        noText: S.template === "lampu" && S.noText, cfg: S.cfg, presetIndex: S.presetIndex,
        showPrice: S.showPrice, showCode: S.showCode, products: S.products,
        photos: S.photos.map((p) => ({ img: p.img, caption: p.caption })), photoDur: S.photoDur,
        text: S.text, cta: S.cta,
      };
      movie = await V.build(opts);
      const cv = $("#cv");
      const k = Math.min(1, 720 / Math.max(movie.W, movie.H));
      cv.width = Math.round(movie.W * k);
      cv.height = Math.round(movie.H * k);
      cv.dataset.k = k;
      cv.style.aspectRatio = `${movie.W} / ${movie.H}`;
      $("#dur").textContent = movie.duration.toFixed(1) + " dtk";
      $("#dims").textContent = `${movie.W} × ${movie.H}`;
      $("#scrub").max = movie.duration.toFixed(2);
      if (t > movie.duration) t = 0;
      $("#status").textContent = movie.scenes.map((s) => `${s.id} ${s.dur.toFixed(1)}s`).join(" · ");
    } catch (e) {
      console.error(e);
      toast("Gagal menyusun adegan: " + e.message, true);
      $("#status").textContent = "Gagal: " + e.message;
    }
    building = false;
    if (dirty) { dirty = false; rebuild(); }
  }
  let rebuildTimer = 0;
  const schedule = () => { clearTimeout(rebuildTimer); rebuildTimer = setTimeout(rebuild, 180); };

  /* ---------- Pratinjau ---------- */
  function drawPreview() {
    const cv = $("#cv");
    if (!movie) return;
    const ctx = cv.getContext("2d");
    const k = +cv.dataset.k || 1;
    ctx.setTransform(k, 0, 0, k, 0, 0);
    movie.draw(ctx, t);
    if (S.safe && S.format === "9:16") {
      // Area yang tertutup antarmuka Reels/TikTok: atas ≈12%, bawah ≈20%, kolom ikon kanan ≈12%
      ctx.fillStyle = "rgba(255,80,80,0.16)";
      ctx.fillRect(0, 0, movie.W, movie.H * 0.12);
      ctx.fillRect(0, movie.H * 0.8, movie.W, movie.H * 0.2);
      ctx.fillRect(movie.W * 0.86, movie.H * 0.35, movie.W * 0.14, movie.H * 0.45);
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    $("#time").textContent = t.toFixed(1) + " / " + movie.duration.toFixed(1);
    if (!$("#scrub").matches(":active")) $("#scrub").value = t.toFixed(2);
  }
  function loop(ts) {
    if (movie && playing && !rendering) {
      const dt = Math.min(0.1, (ts - lastTs) / 1000);
      t = (t + dt) % movie.duration;
    }
    lastTs = ts;
    if (!rendering) drawPreview();
    requestAnimationFrame(loop);
  }

  /* ---------- Encoder ---------- */
  let rendering = false, cancelRender = false;
  const BPP = { tinggi: 0.14, sedang: 0.09, ringan: 0.045 }; // bit per piksel per frame
  async function pickCodec(container, W, H, fps, bitrate) {
    const list = container === "mp4" ? ["avc1.640033", "avc1.640028", "avc1.4d0028", "avc1.42E028", "avc1.42E01F"] : ["vp09.00.10.08", "vp09.00.40.08", "vp8"];
    for (const codec of list) {
      const cfg = { codec, width: W, height: H, bitrate, framerate: fps, latencyMode: "quality" };
      if (container === "mp4") cfg.avc = { format: "avc" };
      try {
        const r = await VideoEncoder.isConfigSupported(cfg);
        if (r.supported) return cfg;
      } catch (_) { /* coba berikutnya */ }
    }
    return null;
  }
  async function renderWebCodecs(container, fps, onProgress) {
    const { W, H, duration, draw } = movie;
    const bitrate = Math.round(W * H * fps * BPP[S.quality]);
    const cfg = await pickCodec(container, W, H, fps, bitrate);
    if (!cfg) return null;
    const isMp4 = container === "mp4";
    const target = isMp4 ? new Mp4Muxer.ArrayBufferTarget() : new WebMMuxer.ArrayBufferTarget();
    const muxer = isMp4
      ? new Mp4Muxer.Muxer({ target, video: { codec: "avc", width: W, height: H }, fastStart: "in-memory" })
      : new WebMMuxer.Muxer({ target, video: { codec: cfg.codec === "vp8" ? "V_VP8" : "V_VP9", width: W, height: H, frameRate: fps } });
    let err = null;
    const enc = new VideoEncoder({ output: (chunk, meta) => muxer.addVideoChunk(chunk, meta), error: (e) => (err = e) });
    enc.configure(cfg);
    const cv = document.createElement("canvas");
    cv.width = W;
    cv.height = H;
    const ctx = cv.getContext("2d");
    const total = Math.round(duration * fps);
    for (let i = 0; i < total; i++) {
      if (cancelRender) { enc.close(); return { cancelled: true }; }
      if (err) throw err;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      draw(ctx, i / fps);
      const frame = new VideoFrame(cv, { timestamp: Math.round((i * 1e6) / fps), duration: Math.round(1e6 / fps) });
      enc.encode(frame, { keyFrame: i % (fps * 2) === 0 });
      frame.close();
      while (enc.encodeQueueSize > 6) await new Promise((r) => setTimeout(r, 4));
      if (i % 5 === 0) { onProgress(i / total); await new Promise((r) => setTimeout(r, 0)); }
    }
    await enc.flush();
    enc.close();
    muxer.finalize();
    return { blob: new Blob([target.buffer], { type: isMp4 ? "video/mp4" : "video/webm" }), codec: cfg.codec, ext: isMp4 ? "mp4" : "webm" };
  }
  // Cadangan: rekam waktu nyata lewat MediaRecorder (selalu sepanjang durasi video)
  function renderMediaRecorder(fps, onProgress) {
    return new Promise((resolve, reject) => {
      const { W, H, duration, draw } = movie;
      const cv = document.createElement("canvas");
      cv.width = W;
      cv.height = H;
      const ctx = cv.getContext("2d");
      const stream = cv.captureStream(fps);
      const types = ["video/mp4;codecs=avc1", "video/mp4", "video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"];
      const mime = types.find((m) => window.MediaRecorder && MediaRecorder.isTypeSupported(m));
      if (!mime) return reject(new Error("Browser ini tidak mendukung perekaman video. Pakai Chrome atau Edge terbaru."));
      const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: Math.round(W * H * fps * BPP[S.quality]) });
      const chunks = [];
      rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      rec.onstop = () => resolve({ blob: new Blob(chunks, { type: mime.split(";")[0] }), codec: mime, ext: mime.includes("mp4") ? "mp4" : "webm", realtime: true });
      rec.onerror = (e) => reject(e.error || new Error("MediaRecorder gagal"));
      const start = performance.now();
      draw(ctx, 0);
      rec.start(250);
      (function tick() {
        const el = (performance.now() - start) / 1000;
        if (cancelRender) { rec.stop(); return; }
        if (el >= duration) { draw(ctx, duration - 0.001); setTimeout(() => rec.stop(), 120); return; }
        draw(ctx, el);
        onProgress(el / duration);
        requestAnimationFrame(tick);
      })();
    });
  }
  async function doRender() {
    if (!movie || rendering) return;
    rendering = true;
    cancelRender = false;
    const btn = $("#render"), bar = $("#bar"), out = $("#out");
    btn.disabled = true;
    $("#cancel").hidden = false;
    out.innerHTML = "";
    const fps = 30;
    const t0 = performance.now();
    const onProgress = (p) => { bar.value = p; $("#pct").textContent = Math.round(p * 100) + "%"; };
    try {
      let res = null;
      const hasWC = typeof VideoEncoder !== "undefined" && typeof VideoFrame !== "undefined";
      if (hasWC) res = await renderWebCodecs(S.container, fps, onProgress);
      if (!res && hasWC && S.container === "mp4") {
        toast("Encoder H.264 tidak tersedia di browser ini; mencoba WebM (VP9).");
        res = await renderWebCodecs("webm", fps, onProgress);
      }
      if (!res) {
        toast("WebCodecs tidak tersedia; merekam waktu nyata (" + movie.duration.toFixed(0) + " detik).");
        res = await renderMediaRecorder(fps, onProgress);
      }
      if (res.cancelled) { $("#pct").textContent = "dibatalkan"; return; }
      const name = `mahakarya-${S.template}-${S.format.replace(":", "x")}-${movie.W}x${movie.H}.${res.ext}`;
      const url = URL.createObjectURL(res.blob);
      const secs = ((performance.now() - t0) / 1000).toFixed(1);
      out.innerHTML =
        `<video src="${url}" controls playsinline muted loop></video>` +
        `<div class="acts"><a class="btn btn--primary" href="${url}" download="${esc(name)}">Unduh ${res.ext.toUpperCase()} (${(res.blob.size / 1048576).toFixed(1)} MB)</a>` +
        `<span class="muted small">${esc(res.codec)} · ${movie.W}×${movie.H} · ${fps} fps · ${movie.duration.toFixed(1)} dtk · selesai ${secs} dtk${res.realtime ? " (perekaman waktu nyata)" : ""}</span></div>` +
        (S.format === "16:9" || S.format === "3:4"
          ? `<p class="muted small">Untuk latar hero website: ganti nama file menjadi <code>${S.format === "16:9" ? "proses-lampu" : "proses-lampu-tegak"}.${res.ext}</code> (buat juga versi ${res.ext === "mp4" ? "WebM" : "MP4"}), simpan ke <code>assets/video/</code>, lalu unduh poster di bawah dengan nama <code>${S.format === "16:9" ? "proses-lampu-poster" : "proses-lampu-tegak-poster"}.jpg</code>.</p>`
          : "");
      onProgress(1);
    } catch (e) {
      console.error(e);
      toast("Render gagal: " + (e.message || e), true);
      out.innerHTML = `<p class="warn">Render gagal: ${esc(e.message || e)}. Coba format WebM, kualitas lebih ringan, atau browser Chrome/Edge terbaru.</p>`;
    } finally {
      rendering = false;
      btn.disabled = false;
      $("#cancel").hidden = true;
    }
  }
  function poster() {
    if (!movie) return;
    const cv = document.createElement("canvas");
    cv.width = movie.W;
    cv.height = movie.H;
    const ctx = cv.getContext("2d");
    movie.draw(ctx, t);
    cv.toBlob((b) => {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(b);
      a.download = `mahakarya-${S.template}-${S.format.replace(":", "x")}-poster.jpg`;
      a.click();
    }, "image/jpeg", 0.86);
  }

  /* ---------- Antarmuka ---------- */
  const listOf = (kind) => (kind === "head" ? D.heads : kind === "body" ? D.bodies : D.bases);
  const colorsOf = (kind) => (kind === "head" ? D.shadeColors : D.colors);
  const opt = (list, cur) => list.map((x) => `<option value="${esc(x.id)}" ${x.id === cur ? "selected" : ""}>${esc(x.name)}</option>`).join("");
  function partRow(kind, part, i) {
    return `<div class="part" data-kind="${kind}" data-i="${i == null ? "" : i}">
      <b>${kind === "head" ? "Kap" : kind === "body" ? "Badan " + (i + 1) : "Alas"}</b>
      <select data-shape>${opt(listOf(kind), part.shape)}</select>
      <select data-color>${opt(colorsOf(kind), part.color)}</select>
      ${kind === "body" && S.cfg.body.length > 1 ? `<button type="button" class="chip" data-del title="Hapus badan ini">×</button>` : "<span></span>"}
    </div>`;
  }
  function renderLampForm() {
    const el = $("#tpl-lampu");
    el.innerHTML = `
      <label>Preset <select id="preset">${D.presets.map((p, i) => `<option value="${i}" ${i === S.presetIndex ? "selected" : ""}>${esc(p.name)}${i === D.popularPreset ? " (paling populer)" : ""}</option>`).join("")}<option value="-1" ${S.presetIndex < 0 ? "selected" : ""}>Rakitan sendiri…</option></select></label>
      <div class="parts">
        ${partRow("head", S.cfg.head)}
        ${S.cfg.body.map((b, i) => partRow("body", b, i)).join("")}
        ${partRow("base", S.cfg.base)}
      </div>
      <div class="acts">
        <button type="button" class="btn btn--sm" id="add-body" ${S.cfg.body.length >= D.maxBodies ? "disabled" : ""}>+ Badan</button>
        <span class="muted small">Paket ${V.priceOf(S.cfg).pkg.name} · ${window.MKSVideo.codeOf(S.cfg)}</span>
      </div>
      <label class="check"><input type="checkbox" id="show-price" ${S.showPrice ? "checked" : ""}/> Tampilkan adegan harga paket</label>
      <label class="check"><input type="checkbox" id="show-code" ${S.showCode ? "checked" : ""}/> Tampilkan kode rakitan</label>
      <label class="check"><input type="checkbox" id="no-text" ${S.noText ? "checked" : ""}/> Tanpa teks (untuk latar hero website; hanya rakit → nyala → variasi)</label>`;
    $("#preset", el).onchange = (e) => {
      S.presetIndex = +e.target.value;
      if (S.presetIndex >= 0) S.cfg = clone(D.presets[S.presetIndex]);
      renderLampForm();
      schedule();
    };
    const custom = () => { S.presetIndex = -1; renderLampForm(); schedule(); };
    $$(".part", el).forEach((row) => {
      const kind = row.dataset.kind, i = row.dataset.i;
      const part = kind === "body" ? S.cfg.body[+i] : S.cfg[kind];
      $("[data-shape]", row).onchange = (e) => { part.shape = e.target.value; custom(); };
      $("[data-color]", row).onchange = (e) => { part.color = e.target.value; custom(); };
      const del = $("[data-del]", row);
      if (del) del.onclick = () => { S.cfg.body.splice(+i, 1); custom(); };
    });
    $("#add-body", el).onclick = () => { S.cfg.body.push({ shape: D.bodies[0].id, color: D.colors[0].id }); custom(); };
    $("#show-price", el).onchange = (e) => { S.showPrice = e.target.checked; schedule(); };
    $("#show-code", el).onchange = (e) => { S.showCode = e.target.checked; schedule(); };
    $("#no-text", el).onchange = (e) => { S.noText = e.target.checked; schedule(); };
  }
  function renderKoleksiForm() {
    const el = $("#tpl-koleksi");
    const P = window.MKS_PRODUCTS || [];
    el.innerHTML = `<p class="muted small">Pilih produk (urutan tampil mengikuti urutan katalog). Foto asli dipakai bila field <code>image</code> terisi; selain itu ilustrasi SVG.</p>
      <div class="plist">${P.map((p) => `<label class="check"><input type="checkbox" value="${esc(p.id)}" ${S.products.includes(p.id) ? "checked" : ""}/> ${esc(p.name)} <span class="muted">· ${"Rp" + p.price.toLocaleString("id-ID")}${p.image ? " · foto" : ""}</span></label>`).join("")}</div>`;
    $$("input", el).forEach((cb) => (cb.onchange = () => { S.products = $$("input:checked", el).map((x) => x.value); schedule(); }));
  }
  function renderFotoForm() {
    const el = $("#tpl-foto");
    el.innerHTML = `<p class="muted small">Unggah foto produk atau proses (JPG/PNG, maksimal 12). Foto tidak diunggah ke mana pun; hanya dipakai di browser ini.</p>
      <label class="btn btn--sm">Pilih foto<input type="file" id="photos" accept="image/*" multiple hidden /></label>
      <label>Durasi per foto (detik) <input type="number" id="photo-dur" min="1.5" max="8" step="0.5" value="${S.photoDur}" /></label>
      <div class="photos">${S.photos.map((p, i) => `<div class="photo"><img src="${p.url}" alt="" /><input type="text" placeholder="Keterangan (opsional)" value="${esc(p.caption)}" data-cap="${i}" /><div class="acts"><button type="button" class="chip" data-up="${i}" title="Naik">↑</button><button type="button" class="chip" data-down="${i}" title="Turun">↓</button><button type="button" class="chip" data-del="${i}">Hapus</button></div></div>`).join("")}</div>`;
    $("#photos", el).onchange = async (e) => {
      const files = [...e.target.files].slice(0, 12 - S.photos.length);
      for (const f of files) {
        const url = URL.createObjectURL(f);
        try {
          const img = await V.urlImage(url);
          S.photos.push({ url, img, caption: "", name: f.name });
        } catch (_) { toast("Gagal membaca " + f.name, true); }
      }
      renderFotoForm();
      schedule();
    };
    $("#photo-dur", el).onchange = (e) => { S.photoDur = +e.target.value || 3; schedule(); };
    $$("[data-cap]", el).forEach((inp) => (inp.oninput = () => { S.photos[+inp.dataset.cap].caption = inp.value; schedule(); }));
    $$("[data-del]", el).forEach((b) => (b.onclick = () => { S.photos.splice(+b.dataset.del, 1); renderFotoForm(); schedule(); }));
    const swap = (i, j) => { if (j < 0 || j >= S.photos.length) return; [S.photos[i], S.photos[j]] = [S.photos[j], S.photos[i]]; renderFotoForm(); schedule(); };
    $$("[data-up]", el).forEach((b) => (b.onclick = () => swap(+b.dataset.up, +b.dataset.up - 1)));
    $$("[data-down]", el).forEach((b) => (b.onclick = () => swap(+b.dataset.down, +b.dataset.down + 1)));
  }
  function bindText() {
    const map = [["#t-headline", "text", "headline"], ["#t-headline-teks", "text", "headline"], ["#t-sub", "text", "sub"], ["#t-cta", "text", "cta"], ["#t-highlight", "text", "highlight"], ["#t-detail", "text", "detail"], ["#c-wa", "cta", "wa"], ["#c-ig", "cta", "ig"], ["#c-site", "cta", "site"], ["#c-trust", "cta", "trust"]];
    map.forEach(([sel, g, k]) => {
      const el = $(sel);
      el.value = S[g][k];
      el.oninput = () => { S[g][k] = el.value; schedule(); };
    });
  }
  function showTemplate() {
    $$("[data-tpl]").forEach((el) => (el.hidden = el.dataset.tpl !== S.template));
    $$("#tabs .chip").forEach((b) => b.classList.toggle("is-on", b.dataset.t === S.template));
    $("#teks-only").hidden = S.template !== "teks";
    $("#lampu-only").hidden = S.template !== "lampu";
  }
  function init() {
    const fsel = $("#format");
    fsel.innerHTML = Object.entries(V.FORMATS).map(([k, f]) => `<option value="${k}" ${k === S.format ? "selected" : ""}>${esc(f.label)}</option>`).join("");
    fsel.onchange = () => { S.format = fsel.value; schedule(); };
    const bind = (sel, key, f = (v) => v) => { const el = $(sel); el.onchange = () => { S[key] = f(el.value); schedule(); }; };
    bind("#size", "size");
    bind("#theme", "theme");
    bind("#pace", "pace", Number);
    bind("#quality", "quality");
    $("#container").onchange = (e) => (S.container = e.target.value);
    $("#safe").onchange = (e) => (S.safe = e.target.checked);
    $$("#tabs .chip").forEach((b) => (b.onclick = () => { S.template = b.dataset.t; showTemplate(); schedule(); }));
    $("#play").onclick = () => { playing = !playing; $("#play").textContent = playing ? "Jeda" : "Putar"; };
    $("#scrub").oninput = (e) => { t = +e.target.value; playing = false; $("#play").textContent = "Putar"; drawPreview(); };
    $("#render").onclick = doRender;
    $("#cancel").onclick = () => (cancelRender = true);
    $("#poster").onclick = poster;
    renderLampForm();
    renderKoleksiForm();
    renderFotoForm();
    bindText();
    showTemplate();
    // Info dukungan encoder
    const sup = [];
    if (typeof VideoEncoder !== "undefined") sup.push("WebCodecs ✓ (render cepat)");
    else sup.push("WebCodecs ✗ → perekaman waktu nyata (WebM)");
    if (window.MediaRecorder && MediaRecorder.isTypeSupported("video/mp4")) sup.push("MP4 ✓");
    $("#support").textContent = sup.join(" · ");
    if (location.protocol === "file:") $("#file-warn").hidden = false;
    rebuild();
    requestAnimationFrame(loop);
  }
  document.addEventListener("DOMContentLoaded", init);
})();
