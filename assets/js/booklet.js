/*
 * Booklet katalog A5, 16 halaman, dengan dua wajah:
 *  - Layar: flipbook (balik halaman 3D), konfigurator lampu interaktif (hal. 7),
 *    kalkulator pesanan custom (hal. 12), tautan & QR yang bisa diklik.
 *  - Cetak / PDF: halaman statis, satu halaman A5 per lembar (tools/build-booklet.js).
 * Semua angka dibaca dari config.js, lamp-data.js, products.js; gambar lampu dari
 * LampArt (lamp-art.js), ilustrasi koleksi dari MKSArt (art.js). Foto dari assets/img/booklet.
 */
(function () {
  const C = window.MKS_CONFIG;
  const D = window.MKS_LAMP;
  const A = window.LampArt;
  const P = window.MKS_PRODUCTS;
  const ART = window.MKSArt;
  const QR = window.MKS_QR || {};

  const rp = (n) => "Rp" + Math.round(n).toLocaleString("id-ID");
  const roundK = (n) => Math.round(n / 1000) * 1000;
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const find = A.find;
  const $ = (s, el = document) => el.querySelector(s);
  const SITE = "mahakaryastudio.github.io/MahaKaryaStudio";
  const SITE_URL = "https://" + SITE + "/";
  const EDITION = "Edisi 01 · 2026";
  const waDisplay = "+" + C.whatsapp.replace(/^(\d{2})(\d{3})(\d{4})(\d+)$/, "$1 $2-$3-$4");
  const waLink = (msg) => `https://wa.me/${C.whatsapp}?text=${encodeURIComponent(msg)}`;
  const IMG = "assets/img/booklet/";

  /* ---------- Harga (sama dengan lamp.js) ---------- */
  function price(cfg) {
    let sum = find(D.heads, cfg.head.shape).price + find(D.bases, cfg.base.shape).price;
    cfg.body.forEach((b) => (sum += find(D.bodies, b.shape).price));
    const n = cfg.body.length + 2;
    const pkg = D.packages[n] || { name: `${n} bagian`, disc: 0 };
    const disc = sum - roundK(sum * (1 - pkg.disc));
    const wiring = D.wiringPrice;
    return { parts: sum, n, pkg, disc, wiring, total: sum - disc + wiring, anchor: sum + wiring };
  }
  function pkgRange(n) {
    const min = (l) => Math.min(...l.map((x) => x.price));
    const max = (l) => Math.max(...l.map((x) => x.price));
    const lo = min(D.heads) + min(D.bodies) * (n - 2) + min(D.bases);
    const hi = max(D.heads) + max(D.bodies) * (n - 2) + max(D.bases);
    const disc = D.packages[n].disc;
    return { lo: roundK(lo * (1 - disc)) + D.wiringPrice, loAnchor: lo + D.wiringPrice, hi: roundK(hi * (1 - disc)) + D.wiringPrice };
  }
  function code(cfg) {
    const k = (s) => s.slice(0, 3).toUpperCase();
    return "MK-" + [k(cfg.head.shape) + k(cfg.head.color), ...cfg.body.map((b) => k(b.shape) + k(b.color)), k(cfg.base.shape) + k(cfg.base.color)].join("-");
  }
  const maxDisc = Math.max(...Object.values(D.packages).map((p) => p.disc));
  const popular = D.presets[D.popularPreset] || D.presets[0];
  const shapeCount = D.heads.length + D.bodies.length + D.bases.length;

  /* ---------- Potongan gambar ---------- */
  const PAL = {
    dark: { ink: "#f2e7d5", accent: "#f2a33a", soft: "#a89a85" },
    light: { ink: "#1f1a16", accent: "#c8794a", soft: "#5b524a" },
  };
  function mark(theme) {
    const c = PAL[theme];
    let g = "";
    for (let i = 0; i < 5; i++) { const y = 16 + i * 8, w = 30 + i * 8; g += `<line x1="${50 - w / 2}" y1="${y}" x2="${50 + w / 2}" y2="${y}"/>`; }
    return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><g fill="none" stroke="${c.accent}" stroke-width="5" stroke-linecap="round">${g}</g><circle cx="50" cy="66" r="9" fill="${c.ink}"/><line x1="30" y1="88" x2="70" y2="88" stroke="${c.soft}" stroke-width="5" stroke-linecap="round"/></svg>`;
  }
  const wordmark = () => `<span class="wm">MahaKarya<em>Studio</em></span>`;
  function qr(key, href, fill = "#1f1a16") {
    const q = QR[key];
    if (!q) return "";
    const svg = `<svg viewBox="-2 -2 ${q.n + 4} ${q.n + 4}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="QR code"><path d="${q.path}" fill="${fill}"/></svg>`;
    return href ? `<a class="qr" href="${href}" target="_blank" rel="noopener">${svg}</a>` : `<div class="qr">${svg}</div>`;
  }
  const photo = (file, alt, cls = "") => `<img class="photo ${cls}" src="${IMG}${file}" alt="${esc(alt)}" />`;
  const icon = {
    bulb: `<svg viewBox="0 0 24 24" fill="none" stroke="#9c5730" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5.9 1.1 1 1.9h5c.1-.8.4-1.4 1-1.9A6 6 0 0 0 12 3Z"/></svg>`,
    sun: `<svg viewBox="0 0 24 24" fill="none" stroke="#9c5730" stroke-width="1.6" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>`,
    plug: `<svg viewBox="0 0 24 24" fill="none" stroke="#9c5730" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3v5M15 3v5M7 8h10v3a5 5 0 0 1-10 0V8ZM12 16v5"/></svg>`,
    cloth: `<svg viewBox="0 0 24 24" fill="none" stroke="#9c5730" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7c3-3 7 3 10 0s4-2 6 0M4 12c3-3 7 3 10 0s4-2 6 0M4 17c3-3 7 3 10 0s4-2 6 0"/></svg>`,
  };
  function refitArt() {
    return `<svg viewBox="0 0 200 120" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="20" y="70" width="160" height="12" rx="3" fill="#5b524a"/>
      <circle cx="60" cy="42" r="26" fill="#c4522f"/><rect x="52" y="64" width="16" height="8" fill="#3a3129"/>
      <rect x="110" y="18" width="52" height="48" rx="4" fill="#5c8040"/><rect x="128" y="64" width="16" height="8" fill="#3a3129"/>
      <path d="M86 42h20" stroke="#9c5730" stroke-width="2" stroke-dasharray="3 3"/><path d="M103 38l5 4-5 4" fill="none" stroke="#9c5730" stroke-width="2"/>
      <text x="100" y="104" text-anchor="middle" font-family="DM Mono,monospace" font-size="8" fill="#5b524a" letter-spacing="1.5">ULIR M20 · TINGGAL PUTAR</text></svg>`;
  }

  /* ---------- Halaman ---------- */
  const pages = [];
  const add = (cls, inner, o = {}) => pages.push({ cls, inner, folio: o.folio !== false, label: o.label || "" });
  const rh = (right) => `<div class="rh"><span>MahaKarya Studio · Katalog lampu rakitan</span><span>${esc(right || EDITION)}</span></div>`;
  const kicker = (n, t) => `<div class="kicker"><b>${n}</b><span>${esc(t)}</span></div>`;
  const konsep = `<span class="credit">Gambar konsep · warna katalog lihat hal. 5</span>`;

  // 1 · Sampul: foto lampu menyala di kamar
  add("page--dark cover", `
    ${photo("lampu-kamar.jpg", "Lampu rakitan menyala di meja samping tempat tidur", "cover__photo")}
    <div class="cover__shade"></div>
    <div class="cover__brand">${mark("dark")}${wordmark()}</div>
    <h1 class="cover__title">Lampu yang kamu <em>susun sendiri.</em></h1>
    <p class="cover__sub">Kap, badan, alas. Pilih bentuk dan warnanya, kami cetak 3D dan kirim.</p>
    <div class="cover__meta"><span><b>Katalog</b> · ${esc(EDITION)}</span><span>Lampu meja cetak 3D · ${esc(C.city)}</span></div>`, { folio: false });

  // 2 · Foto deretan + halo + daftar isi
  const TOC = [
    [3, "Tiga bagian, satu ulir"], [4, `${shapeCount} bentuk`], [5, "Warna"], [6, "Paket"], [7, "Rakit sendiri"], [8, "Cara pesan"],
    [9, "Spesifikasi & aman"], [10, "Koleksi Nusantara"], [12, "Custom & bisnis"], [13, "Material"], [14, "FAQ"], [15, "Konsultasi"],
  ];
  add("page--photo-top", `
    <div class="bleed-top">${photo("deretan-lampu.jpg", "Tujuh lampu rakitan dengan kombinasi bentuk dan warna berbeda")}${konsep}</div>
    ${rh()}
    <h2 class="intro__hello">Halo, <em>skena</em> rumah.</h2>
    <p class="intro__text">Lampu meja yang kamu susun sendiri dari kap, badan, dan alas. Tanpa lem, tanpa alat, tinggal putar. Dicetak 3D satu per satu di ${esc(C.city.split(",")[0])} sesuai pesanan. Bosan? Ganti satu bagian saja.</p>
    <div class="stats">
      <div class="stat"><b>3</b><span>bagian</span></div>
      <div class="stat"><b>${shapeCount}</b><span>bentuk</span></div>
      <div class="stat"><b>${D.colors.length}+${D.shadeColors.length}</b><span>warna</span></div>
      <div class="stat"><b>${Math.round(maxDisc * 100)}%</b><span>hemat paket</span></div>
    </div>
    <p class="pull">"Tanpa lem. Tanpa alat. <b>Tinggal putar.</b>"</p>
    <div class="toc"><h3>Isi</h3><ol>${TOC.map(([p, t]) => `<li><span>${esc(t)}</span><b>${p}</b></li>`).join("")}</ol></div>`, { label: "Halo" });

  // 3 · Tiga bagian: foto merakit + tiga baris
  add("page--dark", `${rh()}
    ${kicker("01", "Cara kerjanya")}
    <h2 class="h-sec">Tiga bagian, <em>satu ulir.</em></h2>
    <div class="parts">
      <div class="parts__photo">${photo("merakit.jpg", "Tangan menyusun badan lampu di atas alas")}${konsep}</div>
      <div>
        <div class="part-row"><span class="mono">Kap</span><h3>Mengarahkan cahaya.</h3><p>${D.heads.map((h) => h.name).join(" · ")}. Fitting E27 tertanam di leher.</p></div>
        <div class="part-row"><span class="mono">Badan</span><h3>Membangun karakter.</h3><p>Susun 1–${D.maxBodies}: ${D.bodies.map((b) => b.name.toLowerCase()).join(", ")}. Campur warnanya.</p></div>
        <div class="part-row"><span class="mono">Alas</span><h3>Menopang, kabel keluar.</h3><p>${D.bases.map((b) => b.name).join(" · ")}. Berpemberat agar tidak goyah.</p></div>
        <p class="note">Semua bagian memakai <b>ulir cetak M20</b> yang sama. Lepas-pasang kapan saja, termasuk bagian yang kamu beli belakangan.</p>
      </div>
    </div>`, { label: "Cara kerjanya" });

  // 4 · Bentuk
  const tiles = (kind, list, colorId, meta) =>
    `<div class="tiles" style="grid-template-columns:repeat(${list.length},1fr)">${list
      .map((it, i) => {
        const hex = kind === "head" ? A.shadeHex(colorId) : A.hexOf(colorId);
        return `<div class="tile"><div class="tile__art">${A.partSvg(kind, it.id, hex, kind + i)}</div><b>${esc(it.name)}</b><small>${esc(meta(it))}</small><span class="price num">${rp(it.price)}</span></div>`;
      })
      .join("")}</div>`;
  add("", `${rh()}
    ${kicker("02", "Bentuk")}
    <h2 class="h-sec">${shapeCount} bentuk, <em>bebas</em> dipadukan.</h2>
    <p class="lead">Harga satuan. Sebagai paket lebih hemat (hal. 6); semua bentuk cocok dengan rakitan mana pun.</p>
    <div class="parts-head"><h3>Kap<small>${D.heads.length} bentuk</small></h3><span>Ø 20 cm · fitting E27</span></div>
    ${tiles("head", D.heads, D.shadeColors[0].id, (h) => `tinggi ${h.cm} cm`)}
    <div class="parts-head"><h3>Badan<small>${D.bodies.length} bentuk</small></h3><span>susun 1–${D.maxBodies}</span></div>
    ${tiles("body", D.bodies, D.colors[2].id, (b) => `${String(b.cm).replace(".", ",")} cm · ${Math.round(b.kg * 1000)} g`)}
    <div class="parts-head"><h3>Alas<small>${D.bases.length} bentuk</small></h3><span>tebal 3 cm · berpemberat</span></div>
    ${tiles("base", D.bases, D.colors[3].id, () => "lebar 13–15 cm")}
    <p class="small" style="margin-top:auto">Gambar bentuk adalah ilustrasi; garis lapisan cetak 0,2 mm terlihat tipis dan sengaja dibiarkan.</p>`, { label: "Bentuk" });

  // 5 · Warna
  const lum = (hex) => { const n = parseInt(hex.slice(1), 16); return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255; };
  const mixes = D.presets.slice(0, 5).map((p, i) => `<div class="mix">${A.renderLamp(clone(p), { uid: "mx" + i, on: false, table: false, vb: "60 60 200 400" })}</div>`).join("");
  add("page--paper2", `${rh()}
    ${kicker("03", "Warna")}
    <h2 class="h-sec">Lima warna yang <em>saling cocok.</em></h2>
    <p class="lead">Satu lini PLA matte, satu merek: warna pesanan ulangmu persis sama. Di luar palet? Bisa, minimal lima bagian sewarna.</p>
    <div class="swatches">${D.colors.map((c, i) => `<div class="sw ${lum(c.hex) > 0.55 ? "sw--light" : "sw--dark"}" style="background:${c.hex}"><i>0${i + 1}</i><div><b>${esc(c.name)}</b><small>${c.hex}</small></div></div>`).join("")}</div>
    <div class="swatches swatches--kap">${D.shadeColors.map((c, i) => `<div class="sw sw--kap sw--light" style="background:${c.hex}"><i>Kap 0${i + 1}</i><div><b>${esc(c.name)}</b><small>${c.hex} · tembus cahaya</small></div></div>`).join("")}
      <div class="sw-note"><b>Kap selalu terang.</b> ${esc(D.shadeColors[0].name)} adalah PLA natural tanpa pigmen, paling rata meneruskan cahaya. Badan dan alas memakai lima warna di atas.</div>
    </div>
    <div class="mixes">${mixes}</div>
    <p class="small" style="margin-top:1.5mm;text-align:center">Lima kombinasi dari palet yang sama. Nama dan harganya di halaman 7.</p>`, { label: "Warna" });

  // 6 · Paket
  const pkgs = Object.keys(D.packages).map(Number).sort().map((n) => {
    const pk = D.packages[n], r = pkgRange(n), hot = n === popular.body.length + 2;
    return `<div class="pkg${hot ? " pkg--hot" : ""}">${hot ? '<span class="tag tag--amber pkg__flag">Paling laris</span>' : ""}
      <div class="pkg__n">${n}<small>bagian</small></div>
      <div><h3>Paket ${esc(pk.name)} <span class="tag ${hot ? "tag--soft" : "tag--outline"}">hemat ${Math.round(pk.disc * 100)}%</span></h3>
        <ul><li>1 kap + ${n - 2} badan + 1 alas + kit kelistrikan · ± ${esc(pk.cm)} cm</li><li>${esc(pk.note || "")}</li></ul></div>
      <div class="pkg__price"><small>mulai dari</small><b class="num">${rp(r.lo)}</b><s class="num">${rp(r.loAnchor)} satuan</s><em>s.d. ${rp(r.hi)}</em></div>
    </div>`;
  }).join("");
  add("", `${rh()}
    ${kicker("04", "Paket")}
    <h2 class="h-sec">Tiga ukuran, pilih yang <em>pas.</em></h2>
    <p class="lead">Harga coret = ketiga bagian dibeli satuan (hal. 4). Makin banyak badan, makin besar potongannya.</p>
    <div class="pkgs">${pkgs}</div>
    <div class="pkg-bottom">
      <div class="addons">
        <div class="addon"><b>Kit kelistrikan ber-SNI/K3L</b>Fitting E27, kabel 1,5 m, saklar, steker. Termasuk; <span class="mono">− ${rp(D.wiringPrice)}</span> bila dilepas.</div>
        <div class="addon"><b>Bola LED 5 W hangat</b>2700 K, E27. <span class="mono">+ ${rp(D.ledPrice)}</span>, atau pakai bola lampumu sendiri.</div>
        <div class="addon"><b>Dalam paket</b>Kartu perawatan dan kunci ulir. Harga bisa berubah; total final dikonfirmasi lewat WhatsApp.</div>
      </div>
      <div class="pkg-photo">${photo("deretan-lampu-tegak.jpg", "Empat lampu rakitan di atas lemari")}${konsep}</div>
    </div>`, { label: "Paket" });

  // 7 · Rakit sendiri: interaktif di layar, lima kombinasi di cetakan
  const presetCards = D.presets.map((p, i) => {
    const cfg = clone(p), pr = price(cfg), pop = i === D.popularPreset;
    return `<div class="preset${pop ? " preset--pop" : ""}">${pop ? '<span class="tag tag--amber preset__flag">Paling populer</span>' : ""}
      <div class="preset__art">${A.renderLamp(cfg, { uid: "pr" + i, on: true, dim: 0.75, table: false, vb: "40 50 240 410" })}</div>
      <h3>${esc(p.name)}</h3><small>${pr.n} bagian · ${esc(pr.pkg.name)} · ≈ ${A.totalCm(cfg).toFixed(0)} cm</small>
      <div class="preset__price num">${rp(pr.total)}<s>${rp(pr.anchor)}</s></div>
      <div class="preset__code">${code(cfg)}</div></div>`;
  }).join("");
  add("page--dark", `${rh()}
    <div class="only-print">
      ${kicker("05", "Kombinasi populer")}
      <h2 class="h-sec">Mulai dari sini, <em>ubah</em> sesukamu.</h2>
      <p class="lead">Sebut nama atau kirim kodenya lewat WhatsApp. Harga termasuk kit kelistrikan; bola LED + ${rp(D.ledPrice)}.</p>
      <div class="presets">${presetCards}
        <div class="preset preset--text"><b>Ubah bagian mana pun.</b><p>Buka konfigurator di website, atau scan QR di halaman 8. Kombinasi populer dicetak ${esc(D.leadTime.preset)}; custom ${esc(D.leadTime.custom)}.</p></div>
      </div>
    </div>
    <div class="only-screen cfg" id="cfg">
      ${kicker("05", "Rakit sendiri")}
      <h2 class="h-sec">Ketuk, <em>susun</em>, lihat harganya.</h2>
      <div class="cfg__presets" id="cfg-presets"></div>
      <div class="cfg__main">
        <div class="cfg__stage"><div id="cfg-lamp"></div><button class="cfg__switch" type="button" id="cfg-switch" aria-pressed="true"><i></i>Nyala</button><span class="cfg__cm mono" id="cfg-cm"></span></div>
        <div class="cfg__ctl">
          <div class="cfg__tabs" id="cfg-tabs"></div>
          <div class="cfg__shapes" id="cfg-shapes"></div>
          <div class="cfg__colors" id="cfg-colors"></div>
          <div class="cfg__body-btns" id="cfg-body-btns"></div>
        </div>
      </div>
      <div class="cfg__foot">
        <div class="cfg__price"><small id="cfg-pkg"></small><b class="num" id="cfg-total"></b><s class="num" id="cfg-anchor"></s></div>
        <div class="cfg__code mono" id="cfg-code"></div>
        <a class="cfg__wa" id="cfg-wa" href="#" target="_blank" rel="noopener">Pesan via WhatsApp</a>
      </div>
    </div>`, { label: "Rakit sendiri" });

  // 8 · Cara pesan
  const ex = clone(popular);
  add("", `${rh()}
    ${kicker("06", "Cara pesan")}
    <h2 class="h-sec">Dari booklet ke meja <em>dalam seminggu.</em></h2>
    <div class="timeline">
      <div><i>Hari 0</i><b>Chat</b><span>Kirim kode rakitan ke WhatsApp. Kami konfirmasi stok warna dan tagihan, ${esc(C.replyPromise.toLowerCase())}.</span></div>
      <div><i>Hari 0–1</i><b>Bayar</b><span>Transfer bank atau QRIS atas nama usaha. Antrean cetak dimulai setelah bayar.</span></div>
      <div><i>Hari 1–5</i><b>Cetak</b><span>Bagian dicetak per warna, dirakit, lalu difoto untuk kamu sebelum dikemas.</span></div>
      <div><i>Hari 5–7</i><b>Tiba</b><span>Dikemas per bagian, tinggal putar. ${C.shipping.zones.map((z) => `${esc(z.label)} ${rp(z.price)}`).join(" · ")}.</span></div>
    </div>
    <div class="pay"><span>Gratis ongkir dari ${rp(C.freeShippingMin)}</span><span>Garansi 30 hari cacat cetak</span><span>Foto rakitan sebelum kirim</span></div>
    <div class="order-photo">${photo("mencetak-lebar.jpg", "Nozzle printer 3D mencetak alas lampu")}<span class="credit">Alas sedang dicetak, lapis 0,2 mm</span></div>
    <div class="code-box">
      <div><h3>Membaca kode rakitan</h3>
        <code>${code(ex)}</code>
        <div class="legend"><b>MK</b><span>MahaKarya</span><b>${code(ex).split("-")[1]}</b><span>kap: 3 huruf bentuk + 3 huruf warna</span><b>…</b><span>badan dari atas ke bawah, lalu alas</span><b>-TK · -LED</b><span>tanpa kit kelistrikan · dengan bola LED</span></div>
      </div>
      <div>${qr("site", SITE_URL)}<div class="qr-cap">Scan · konfigurator</div></div>
    </div>`, { label: "Cara pesan" });

  // 9 · Spesifikasi & keamanan
  const cmLo = Math.min(...Object.values(D.packages).map((p) => parseInt(p.cm))), cmHi = Math.max(...Object.values(D.packages).map((p) => parseInt(p.cm.split("–")[1] || p.cm)));
  const kgLo = A.totalKg({ body: [{ shape: "cincin" }] }), kgHi = A.totalKg({ body: [{ shape: "heksa" }, { shape: "heksa" }, { shape: "heksa" }] });
  add("", `${rh()}
    ${kicker("07", "Spesifikasi & keamanan")}
    <h2 class="h-sec">Supaya awet dan <em>aman.</em></h2>
    <ul class="spec">
      <li><span>Bahan</span><span>PLA+ matte, lapis 0,2 mm, berbasis pati tanaman</span></li>
      <li><span>Kap</span><span>Ø 20 cm, dinding 1,6 mm, PLA tembus cahaya</span></li>
      <li><span>Sambungan</span><span>Ulir cetak M20 di semua bagian, tanpa lem</span></li>
      <li><span>Fitting</span><span>E27 · LED maks. 5 W, hangat 2700 K</span></li>
      <li><span>Kelistrikan</span><span>Kit ber-SNI/K3L: fitting, kabel 1,5 m, saklar, steker (opsional)</span></li>
      <li><span>Tinggi · bobot</span><span>≈ ${cmLo}–${cmHi} cm · ≈ ${kgLo.toFixed(1).replace(".", ",")}–${kgHi.toFixed(1).replace(".", ",")} kg</span></li>
      <li><span>Produksi</span><span>${esc(D.leadTime.preset)} populer · ${esc(D.leadTime.custom)} custom</span></li>
    </ul>
    <div class="safety">
      <div class="safe">${icon.bulb}<h4>LED maks. 5 W</h4><p>Bola pijar atau halogen melunakkan PLA (±55 °C).</p></div>
      <div class="safe">${icon.sun}<h4>Jauhkan dari panas</h4><p>Bukan di jendela terik, dasbor mobil, atau dekat kompor.</p></div>
      <div class="safe">${icon.plug}<h4>Komponen bertanda</h4><p>Kit listrik dari produsen terdaftar SNI/K3L. Lampu rakitannya sendiri bukan produk bersertifikat SNI.</p></div>
      <div class="safe">${icon.cloth}<h4>Perawatan</h4><p>Lap kering atau sedikit lembap. Tanpa alkohol dan tiner.</p></div>
    </div>
    <div class="spec-photo">${photo("merakit-lebar.jpg", "Bagian-bagian lampu di meja kerja studio")}<span class="credit">Semua bagian lepas-pasang. ${konsep}</span></div>`, { label: "Spesifikasi" });

  // 10–11 · Koleksi
  const TAGCLS = { bestseller: "", baru: "tag--green", hadiah: "tag--amber" };
  const prod = (p) => `<div class="prod"><div class="prod__art">${p.tags[0] ? `<span class="tag ${TAGCLS[p.tags[0]] || ""}">${esc(p.tags[0])}</span>` : ""}${ART.render(p, { small: true })}</div>
    <div class="prod__info"><span class="prod__col">${esc(p.collection)} · ${esc(p.category)}</span><h3>${esc(p.name)}</h3><p>${esc(p.desc)}</p><div class="prod__specs">${p.specs.map(esc).join(" · ")}</div><div class="prod__price num">${rp(p.price)}</div></div></div>`;
  add("", `${rh()}
    ${kicker("08", "Koleksi lain")}
    <h2 class="h-sec">Motif Nusantara, <em>lapis demi lapis.</em></h2>
    <p class="lead">Kawung, parang, megamendung, stupa, terasering: digambar ulang sendiri, bukan file unduhan. Semua bisa diubah warna dan ukuran.</p>
    <div class="products">${P.slice(0, 6).map(prod).join("")}</div>`, { label: "Koleksi" });
  add("", `${rh()}
    <div class="products">${P.slice(6).map(prod).join("")}</div>
    <div class="why4">
      <div><i>01</i><h4>Desain orisinal</h4><p>Motif lokal dirancang ulang sendiri.</p></div>
      <div><i>02</i><h4>Personalisasi</h4><p>Nama, logo, warna, ukuran.</p></div>
      <div><i>03</i><h4>Sesuai pesanan</h4><p>Tanpa gudang, tanpa sisa stok.</p></div>
      <div><i>04</i><h4>Fungsional</h4><p>Wadah kaca kedap, drainase, listrik standar.</p></div>
    </div>
    <p class="small" style="margin-top:auto">Ilustrasi koleksi dibuat dari profil bentuk tiap produk sampai foto asli tersedia. Katalog lengkap: ${esc(SITE)}/koleksi.html</p>`, { label: "Koleksi" });

  // 12 · Custom & bisnis: kalkulator di layar, tabel di cetakan
  const E = C.estimator;
  const pct = (m) => (m === 1 ? "harga dasar" : `+${Math.round((m - 1) * 100)}%`);
  add("page--dark", `${rh()}
    ${kicker("09", "Custom & bisnis")}
    <h2 class="h-sec">Hadiah personal, souvenir, <em>dekor kafe.</em></h2>
    <div class="only-print">
      <p class="lead">Perkiraan = harga dasar ukuran × material + finishing + desain, dikurangi diskon volume. Harga final setelah desain disetujui; mockup gratis revisi 2×; DP 50%.</p>
      <div class="est">
        <div class="est__box"><h4>Ukuran · harga dasar</h4><table>${E.sizes.map((s) => `<tr><td>${esc(s.label)}</td><td>${rp(s.base)}</td></tr>`).join("")}</table></div>
        <div class="est__box"><h4>Material</h4><table>${E.materials.map((m) => `<tr><td>${esc(m.label)}</td><td>${pct(m.mult)}</td></tr>`).join("")}</table></div>
        <div class="est__box"><h4>Finishing & desain</h4><table>${E.finishes.map((f) => `<tr><td>${esc(f.label)}</td><td>${f.add ? "+ " + rp(f.add) : "termasuk"}</td></tr>`).join("")}<tr><td>Nama / logo</td><td>+ ${rp(E.designFee.personal)}</td></tr><tr><td>Desain baru</td><td>+ ${rp(E.designFee.custom)}</td></tr></table></div>
        <div class="est__box"><h4>Diskon volume</h4><table>${E.tiers.filter((t) => t.disc).map((t) => `<tr><td>${t.min} pcs ke atas</td><td>− ${Math.round(t.disc * 100)}%</td></tr>`).join("")}</table></div>
      </div>
    </div>
    <div class="only-screen calc" id="calc">
      <p class="lead">Pilih, lihat perkiraannya, kirim ke WhatsApp. Harga final setelah desain disetujui; DP 50%.</p>
      <div class="calc__grid">
        <fieldset><legend>Ukuran</legend><div class="opts" data-k="size">${E.sizes.map((s, i) => `<button type="button" class="opt${i === 1 ? " is-on" : ""}" data-v="${s.id}">${esc(s.label)}</button>`).join("")}</div></fieldset>
        <fieldset><legend>Material</legend><div class="opts" data-k="mat">${E.materials.map((m, i) => `<button type="button" class="opt${i === 0 ? " is-on" : ""}" data-v="${m.id}">${esc(m.label.split(" (")[0])}</button>`).join("")}</div></fieldset>
        <fieldset><legend>Finishing</legend><div class="opts" data-k="fin">${E.finishes.map((f, i) => `<button type="button" class="opt${i === 0 ? " is-on" : ""}" data-v="${f.id}">${esc(f.label.split(" (")[0])}</button>`).join("")}</div></fieldset>
        <fieldset><legend>Desain</legend><div class="opts" data-k="design"><button type="button" class="opt is-on" data-v="none">Dari katalog</button><button type="button" class="opt" data-v="personal">+ Nama / logo</button><button type="button" class="opt" data-v="custom">Desain baru</button></div></fieldset>
        <fieldset class="calc__qty"><legend>Jumlah</legend><div class="opts" data-k="qty">${[1, 10, 25, 50, 100].map((q, i) => `<button type="button" class="opt${i === 0 ? " is-on" : ""}" data-v="${q}">${q}</button>`).join("")}</div></fieldset>
      </div>
      <div class="calc__out"><div><small>Perkiraan total</small><b class="num" id="calc-total"></b><span class="mono" id="calc-meta"></span></div><a class="cfg__wa" id="calc-wa" href="#" target="_blank" rel="noopener">Kirim ke WhatsApp</a></div>
    </div>
    <div class="cstep">
      <div><i>1</i><b>Kirim spesifikasi</b><span>ukuran, material, jumlah, referensi</span></div>
      <div><i>2</i><b>Mockup gratis</b><span>revisi 2× sampai disetujui</span></div>
      <div><i>3</i><b>DP 50%</b><span>produksi dimulai setelah DP</span></div>
      <div><i>4</i><b>Produksi & kirim</b><span>${esc(D.leadTime.custom)}, lebih lama untuk volume</span></div>
    </div>
    <div class="b2b">
      <div><h4>Souvenir & hampers</h4><ul><li>Mulai 10 pcs</li><li>Diskon hingga 25%</li><li>Logo atau nama</li></ul></div>
      <div><h4>Kafe, hotel, resto</h4><ul><li>Warna seragam, logo di alas</li><li>Desain eksklusif</li><li>Re-order identik</li></ul></div>
      <div><h4>Desainer interior</h4><ul><li>Harga trade</li><li>Sampel warna</li><li>Prioritas produksi</li></ul></div>
    </div>`, { label: "Custom & bisnis" });

  // 13 · Material: foto proses cetak
  add("page--paper2", `${rh()}
    ${kicker("10", "Material")}
    <h2 class="h-sec">Jujur soal <em>PLA.</em></h2>
    <div class="mat-hero">${photo("mencetak.jpg", "Printer 3D sedang mencetak alas lampu berlapis")}<span class="credit">Satu alas ± 3 jam cetak</span></div>
    <div class="mats">
      <div class="mat"><b>PLA Matte</b><i>standar lampu</i><span>Doff, garis lapisan paling samar, warna terlengkap.</span></div>
      <div class="mat"><b>PLA Silk</b><i>+15%</i><span>Kilau metalik emas, perunggu, tembaga.</span></div>
      <div class="mat"><b>Wood-fill</b><i>+30%</i><span>Serat kayu, bisa diamplas dan dipernis.</span></div>
      <div class="mat"><b>PETG</b><i>+20%</i><span>Lebih kuat, tahan air dan UV.</span></div>
    </div>
    <ul class="checklist">
      <li><b>Tidak tahan panas</b> di atas ±55 °C: bukan untuk mobil, terik matahari, bola pijar.</li>
      <li><b>Garis lapisan bukan cacat.</b> Ingin lebih halus? Pilih diamplas + coating.</li>
      <li><b>Terurai hanya di kompos industri.</b> Produk lama kami terima untuk didaur ulang.</li>
    </ul>`, { label: "Material" });

  // 14 · FAQ
  const FAQ = [
    ["Aman dari panas?", "Ya, dengan LED sampai 5 W. Bola pijar dan halogen melunakkan PLA."],
    ["Ber-SNI?", "Lampu rakitannya tidak bersertifikat SNI. Kit listriknya memakai komponen bertanda SNI/K3L dari produsen terdaftar; bisa dipesan tanpa kit."],
    ["Berapa lama?", `Kombinasi populer ${D.leadTime.preset}, custom ${D.leadTime.custom}, dihitung setelah pembayaran.`],
    ["Warna di luar palet?", "Bisa untuk minimal lima bagian sewarna. Kami kirim foto contoh cetak sebelum produksi."],
    ["Retak atau mau ganti?", "Semua bagian dijual satuan, tinggal putar. Cacat cetak dalam 30 hari diganti gratis."],
    ["Rusak saat kirim?", "Kirim video unboxing dalam 2×24 jam, bagian yang rusak kami cetak ulang gratis."],
    ["Pakai bola lampu sendiri?", "Bisa, fitting E27 standar. Pilih LED hangat 2700 K, maksimal 5 W."],
    ["Cara bayar?", "Transfer bank atau QRIS atas nama usaha setelah konfirmasi di WhatsApp."],
  ];
  add("", `${rh()}
    ${kicker("11", "FAQ")}
    <h2 class="h-sec">Yang sering <em>ditanyakan.</em></h2>
    <div class="faq">${FAQ.map(([q, a]) => `<div><h4>${esc(q)}</h4><p>${esc(a)}</p></div>`).join("")}</div>
    <div class="faq-photo">${photo("deretan-lampu.jpg", "Deretan lampu rakitan")}<span class="credit">Tujuh rakitan, satu ulir yang sama. ${konsep}</span></div>`, { label: "FAQ" });

  // 15 · Konsultasi
  add("page--paper2", `${rh()}
    ${kicker("12", "Konsultasi")}
    <div class="cta">
      <div>
        <h2 class="cta__title">Belum yakin <em>kombinasinya?</em></h2>
        <p>Kirim foto meja atau ruanganmu. Kami pilihkan bentuk dan warna yang pas, gratis, lalu kirim pratinjau rakitannya.</p>
        <ul class="promises"><li>Garansi 30 hari cacat cetak</li><li>Foto rakitan sebelum kirim</li><li>Bagian bisa diganti kapan saja</li><li>${esc(C.replyPromise)}</li></ul>
      </div>
      <div>${qr("wa", waLink("Halo MahaKarya Studio, saya lihat bookletnya dan mau tanya lampu rakitan"))}<div class="qr-cap">Scan · chat WhatsApp</div><a class="cta__wa" href="${waLink("Halo MahaKarya Studio, saya lihat bookletnya dan mau tanya lampu rakitan")}" target="_blank" rel="noopener">${esc(waDisplay)}</a><a class="cta__hours" href="https://instagram.com/${esc(C.instagram)}" target="_blank" rel="noopener">@${esc(C.instagram)}</a></div>
    </div>
    <div class="cta-photo">${photo("lampu-kamar.jpg", "Lampu rakitan menyala di kamar tidur")}<div class="cta-photo__text"><b>Nyala hangat 2700 K.</b> Kap PLA natural meneruskan cahaya rata, tanpa titik silau.</div></div>
    <div class="refit"><div><h4>Sudah punya lampunya?</h4><p>Beli satu badan atau kap baru saja; ulirnya sama, tinggal putar.</p></div>${refitArt()}</div>`, { label: "Konsultasi" });

  // 16 · Sampul belakang
  add("page--dark back", `
    <div class="back__mark">${mark("dark")}</div>${wordmark()}
    <p class="back__tag">Dekorasi rumah cetak 3D. Dicetak satu per satu sesuai pesanan, dirakit tanpa lem, bisa terus diganti bagiannya.</p>
    <div class="contact">
      <div><i>WhatsApp</i><a href="${waLink("Halo MahaKarya Studio, saya mau tanya lampu rakitan")}" target="_blank" rel="noopener">${esc(waDisplay)}</a><small>${esc(C.replyPromise)}</small></div>
      <div><i>Instagram</i><a href="https://instagram.com/${esc(C.instagram)}" target="_blank" rel="noopener">@${esc(C.instagram)}</a><small>foto rakitan & warna baru</small></div>
      <div><i>Website</i><a href="${SITE_URL}" target="_blank" rel="noopener">${esc(SITE)}</a><small>konfigurator & koleksi</small></div>
      <div><i>Email</i><a href="mailto:${esc(C.email)}">${esc(C.email)}</a><small>pesanan bisnis & kerja sama</small></div>
      <div><i>Studio</i><b>${esc(C.address || C.city)}</b><small>kunjungan dengan janji</small></div>
      <div><i>Marketplace</i><b>Tokopedia · Shopee</b><small>cari "MahaKarya Studio"</small></div>
    </div>
    <div class="back__qrs"><div>${qr("site", SITE_URL)}<div class="qr-cap">Website</div></div><div>${qr("ig", "https://instagram.com/" + esc(C.instagram))}<div class="qr-cap">Instagram</div></div></div>
    <div class="back__legal">© ${new Date().getFullYear()} MahaKarya Studio · ${esc(EDITION)}. Harga berlaku saat katalog dicetak dan dapat berubah; total final, stok warna, dan ongkir dikonfirmasi lewat WhatsApp sebelum pembayaran. Foto adalah gambar konsep; warna produk mengikuti palet halaman 5. Gambar bentuk dan koleksi adalah ilustrasi.${C.nib ? " · NIB " + esc(C.nib) : ""}</div>`, { folio: false });

  /* ---------- Pasang ke dokumen: lembar (sheet) berisi halaman depan + belakang ---------- */
  const book = document.getElementById("book");
  const pageHtml = (p, i) => {
    const n = i + 1, side = n % 2 === 0 ? "left" : "right";
    const folio = p.folio ? `<div class="folio"><b>${n}</b><span>${esc(p.label)} · MahaKarya Studio</span></div>` : "";
    return `<section class="page ${p.cls}" data-side="${side}" data-n="${n}" aria-label="Halaman ${n}">${p.inner}${folio}</section>`;
  };
  let html = "";
  for (let i = 0; i < pages.length; i += 2) {
    html += `<div class="sheet" data-sheet="${i / 2}"><div class="sheet__face sheet__front">${pageHtml(pages[i], i)}</div>${pages[i + 1] ? `<div class="sheet__face sheet__back">${pageHtml(pages[i + 1], i + 1)}</div>` : ""}</div>`;
  }
  book.innerHTML = html;
  const sheets = [...book.querySelectorAll(".sheet")];
  const N = sheets.length;

  /* ---------- Flipbook ---------- */
  let spread = 0; // 0 = sampul saja, k = lembar 0..k-1 sudah dibalik, N = sampul belakang saja
  const navLabel = document.getElementById("nav-label");
  function setSpread(k) {
    spread = Math.max(0, Math.min(N, k));
    sheets.forEach((s, i) => {
      const flipped = i < spread;
      s.classList.toggle("is-flipped", flipped);
      s.style.zIndex = flipped ? i + 1 : N - i;
    });
    const left = spread * 2, right = spread * 2 + 1;
    if (navLabel) navLabel.textContent = spread === 0 ? `Sampul · ${pages.length} hal.` : spread === N ? `${left} / ${pages.length}` : `${left}–${right} / ${pages.length}`;
    document.getElementById("nav-prev").disabled = spread === 0;
    document.getElementById("nav-next").disabled = spread === N;
    try { localStorage.setItem("mks-booklet-spread", String(spread)); } catch (e) {}
  }
  const next = () => setSpread(spread + 1), prev = () => setSpread(spread - 1);
  document.getElementById("nav-next").addEventListener("click", next);
  document.getElementById("nav-prev").addEventListener("click", prev);
  const isInteractive = (el) => el.closest("button, a, input, select, label, .cfg, .calc");
  book.addEventListener("click", (e) => {
    if (!book.classList.contains("book--flip") || isInteractive(e.target)) return;
    const pg = e.target.closest(".page");
    if (!pg) return;
    const r = pg.getBoundingClientRect(), x = (e.clientX - r.left) / r.width;
    if (pg.dataset.side === "right" && x > 0.55) next();
    else if (pg.dataset.side === "left" && x < 0.45) prev();
  });
  document.addEventListener("keydown", (e) => {
    if (e.target.matches("input, select, textarea")) return;
    if (e.key === "ArrowRight" || e.key === "PageDown") next();
    if (e.key === "ArrowLeft" || e.key === "PageUp") prev();
  });
  let touchX = null;
  book.addEventListener("touchstart", (e) => (touchX = e.touches[0].clientX), { passive: true });
  book.addEventListener("touchend", (e) => {
    if (touchX == null || !book.classList.contains("book--flip")) return;
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 50) (dx < 0 ? next : prev)();
    touchX = null;
  });

  /* ---------- Mode tampilan & skala ---------- */
  const wrap = document.getElementById("book-wrap");
  const MM = 96 / 25.4;
  let mode = "flip";
  try { mode = localStorage.getItem("mks-booklet-mode") || "flip"; } catch (e) {}
  const modeBtn = document.getElementById("mode-btn");
  function applyMode() {
    const avail = window.innerWidth - 32;
    const narrow = avail < 170 * MM;
    const flip = mode === "flip" && !narrow;
    book.classList.toggle("book--flip", flip);
    book.classList.toggle("book--scroll", !flip);
    book.classList.toggle("book--single", !flip && avail < 300 * MM);
    document.getElementById("nav").hidden = !flip;
    if (modeBtn) { modeBtn.textContent = flip ? "Gulir" : "Balik halaman"; modeBtn.hidden = narrow; }
    const natural = (flip ? 296 : book.classList.contains("book--single") ? 148 : 296) * MM;
    const z = Math.min(1, avail / natural);
    book.style.transformOrigin = "top left";
    book.style.transform = `scale(${z})`;
    book.style.margin = `0 0 0 ${Math.max(0, (avail - natural * z) / 2)}px`;
    const h = flip ? 210 * MM : book.offsetHeight;
    wrap.style.height = h * z + 76 + "px";
    if (flip) setSpread(spread);
  }
  if (modeBtn) modeBtn.addEventListener("click", () => { mode = mode === "flip" ? "scroll" : "flip"; try { localStorage.setItem("mks-booklet-mode", mode); } catch (e) {} applyMode(); });
  try { spread = Math.min(N, parseInt(localStorage.getItem("mks-booklet-spread") || "0", 10) || 0); } catch (e) {}
  applyMode();
  window.addEventListener("resize", applyMode);
  window.addEventListener("beforeprint", () => { book.style.transform = "none"; book.style.margin = "0"; });
  window.addEventListener("afterprint", applyMode);

  /* ---------- Konfigurator interaktif (hal. 7) ---------- */
  (function configurator() {
    const root = $("#cfg");
    if (!root) return;
    const KIND = { head: "Kap", body: "Badan", base: "Alas" };
    const listOf = (k) => (k === "head" ? D.heads : k === "body" ? D.bodies : D.bases);
    const colorsOf = (k) => (k === "head" ? D.shadeColors : D.colors);
    const state = clone(popular);
    state.on = true;
    let sel = { kind: "body", idx: 0 };
    const part = () => (sel.kind === "body" ? state.body[sel.idx] : state[sel.kind]);

    function presetButtons() {
      $("#cfg-presets").innerHTML = D.presets.map((p, i) => `<button type="button" class="cfg__preset${same(p) ? " is-on" : ""}" data-i="${i}">${A.renderLamp(clone(p), { uid: "cp" + i, on: false, table: false, vb: "60 60 200 400" })}<span>${esc(p.name)}</span></button>`).join("");
    }
    const same = (p) => code(p) === code(state);
    function render() {
      const cfg = { head: state.head, body: state.body, base: state.base };
      $("#cfg-lamp").innerHTML = A.renderLamp(cfg, { uid: "cfgl", on: state.on, dim: 0.9, table: false, vb: "30 40 260 420" });
      $("#cfg-cm").textContent = `≈ ${A.totalCm(cfg).toFixed(0)} cm`;
      $("#cfg-tabs").innerHTML =
        `<button type="button" class="cfg__tab${sel.kind === "head" ? " is-on" : ""}" data-kind="head">Kap</button>` +
        state.body.map((b, i) => `<button type="button" class="cfg__tab${sel.kind === "body" && sel.idx === i ? " is-on" : ""}" data-kind="body" data-idx="${i}">Badan ${state.body.length > 1 ? i + 1 : ""}</button>`).join("") +
        `<button type="button" class="cfg__tab${sel.kind === "base" ? " is-on" : ""}" data-kind="base">Alas</button>`;
      const p = part();
      $("#cfg-shapes").innerHTML = listOf(sel.kind).map((s) => `<button type="button" class="cfg__shape${s.id === p.shape ? " is-on" : ""}" data-shape="${s.id}" title="${esc(s.name)}">${A.iconSvg(sel.kind, s.id, "ci" + s.id)}<span>${esc(s.name)}</span><small>${rp(s.price)}</small></button>`).join("");
      $("#cfg-colors").innerHTML = colorsOf(sel.kind).map((c) => `<button type="button" class="cfg__color${c.id === p.color ? " is-on" : ""}" data-color="${c.id}" style="background:${c.hex}" title="${esc(c.name)}"><span>${esc(c.name)}</span></button>`).join("");
      $("#cfg-body-btns").innerHTML = `<button type="button" class="cfg__mini" data-act="add" ${state.body.length >= D.maxBodies ? "disabled" : ""}>+ Tambah badan</button><button type="button" class="cfg__mini" data-act="remove" ${state.body.length <= 1 ? "disabled" : ""}>− Kurangi badan</button>`;
      const pr = price(cfg);
      $("#cfg-pkg").textContent = `Paket ${pr.pkg.name} · ${pr.n} bagian · termasuk kit kelistrikan`;
      $("#cfg-total").textContent = rp(pr.total);
      $("#cfg-anchor").textContent = rp(pr.anchor);
      $("#cfg-code").textContent = code(cfg);
      const lines = [`Kap: ${find(D.heads, cfg.head.shape).name} ${find(D.shadeColors, cfg.head.color).name}`, ...cfg.body.map((b, i) => `Badan ${i + 1}: ${find(D.bodies, b.shape).name} ${find(D.colors, b.color).name}`), `Alas: ${find(D.bases, cfg.base.shape).name} ${find(D.colors, cfg.base.color).name}`];
      $("#cfg-wa").href = waLink(`Halo MahaKarya Studio, saya mau pesan lampu rakitan dari booklet.\nKode: ${code(cfg)}\n${lines.join("\n")}\nPaket ${pr.pkg.name}, perkiraan ${rp(pr.total)} termasuk kit kelistrikan.`);
      $("#cfg-switch").setAttribute("aria-pressed", String(state.on));
      $("#cfg-switch").lastChild.textContent = state.on ? "Nyala" : "Mati";
      root.querySelectorAll(".cfg__preset").forEach((b) => b.classList.toggle("is-on", same(D.presets[+b.dataset.i])));
    }
    presetButtons();
    render();
    root.addEventListener("click", (e) => {
      const b = e.target.closest("button");
      if (!b) return;
      if (b.classList.contains("cfg__preset")) { Object.assign(state, clone(D.presets[+b.dataset.i])); sel = { kind: "body", idx: 0 }; }
      else if (b.classList.contains("cfg__tab")) sel = { kind: b.dataset.kind, idx: +(b.dataset.idx || 0) };
      else if (b.dataset.shape) part().shape = b.dataset.shape;
      else if (b.dataset.color) part().color = b.dataset.color;
      else if (b.dataset.act === "add") { state.body.push({ shape: D.bodies[0].id, color: D.colors[0].id }); sel = { kind: "body", idx: state.body.length - 1 }; }
      else if (b.dataset.act === "remove") { state.body.pop(); if (sel.kind === "body") sel.idx = Math.min(sel.idx, state.body.length - 1); }
      else if (b.id === "cfg-switch") state.on = !state.on;
      else return;
      render();
    });
  })();

  /* ---------- Kalkulator custom (hal. 12), rumus sama dengan main.js ---------- */
  (function calculator() {
    const root = $("#calc");
    if (!root) return;
    const val = (k) => root.querySelector(`.opts[data-k="${k}"] .is-on`).dataset.v;
    function calc() {
      const size = E.sizes.find((s) => s.id === val("size")), mat = E.materials.find((m) => m.id === val("mat")), fin = E.finishes.find((f) => f.id === val("fin"));
      const design = val("design"), qty = +val("qty");
      const tier = E.tiers.filter((t) => qty >= t.min).pop() || { disc: 0 };
      const unit = size.base * mat.mult + fin.add, designFee = E.designFee[design] || 0;
      const subtotal = unit * qty * (1 - tier.disc) + designFee;
      const days = Math.ceil(E.leadTimeDays.base + (design === "custom" ? 3 : 0) + (size.hours * qty * E.leadTimeDays.perUnitHours) / 3);
      $("#calc-total").textContent = rp(subtotal);
      $("#calc-meta").textContent = `${qty} pcs × ${rp(unit)}${tier.disc ? ` − ${Math.round(tier.disc * 100)}%` : ""}${designFee ? ` + desain ${rp(designFee)}` : ""} · ± ${days} hari kerja`;
      $("#calc-wa").href = waLink(`Halo MahaKarya Studio, saya mau tanya pesanan custom dari booklet:\n• Ukuran: ${size.label}\n• Material: ${mat.label}\n• Finishing: ${fin.label}\n• Desain: ${design === "none" ? "dari katalog" : design === "personal" ? "+ nama/logo" : "desain baru"}\n• Jumlah: ${qty}\nPerkiraan ${rp(subtotal)}.`);
    }
    root.addEventListener("click", (e) => {
      const b = e.target.closest(".opt");
      if (!b) return;
      b.parentElement.querySelectorAll(".opt").forEach((o) => o.classList.toggle("is-on", o === b));
      calc();
    });
    calc();
  })();

  window.MKS_BOOKLET = { pages: pages.length, setSpread };
})();
