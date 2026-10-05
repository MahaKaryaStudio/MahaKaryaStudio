/*
 * Booklet katalog A5, 16 halaman. Semua angka (bentuk, warna, harga, paket, preset,
 * koleksi, kontak) dibaca dari config.js, lamp-data.js, dan products.js, jadi booklet
 * selalu sama dengan website. Gambar lampu memakai LampArt (lamp-art.js) dan ilustrasi
 * koleksi memakai MKSArt (art.js). Ekspor PDF: `node tools/build-booklet.js`.
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
  const SITE = "mahakaryastudio.github.io/MahaKaryaStudio";
  const EDITION = "Edisi 01 · 2026";
  const waDisplay = "+" + C.whatsapp.replace(/^(\d{2})(\d{3})(\d{4})(\d+)$/, "$1 $2-$3-$4");

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
  const coverPreset = D.presets[0];

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
  function qr(key, fill = "#1f1a16") {
    const q = QR[key];
    if (!q) return "";
    return `<svg viewBox="-2 -2 ${q.n + 4} ${q.n + 4}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="QR code"><path d="${q.path}" fill="${fill}"/></svg>`;
  }
  const icon = {
    bulb: `<svg viewBox="0 0 24 24" fill="none" stroke="#9c5730" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5.9 1.1 1 1.9h5c.1-.8.4-1.4 1-1.9A6 6 0 0 0 12 3Z"/></svg>`,
    sun: `<svg viewBox="0 0 24 24" fill="none" stroke="#9c5730" stroke-width="1.6" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>`,
    plug: `<svg viewBox="0 0 24 24" fill="none" stroke="#9c5730" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3v5M15 3v5M7 8h10v3a5 5 0 0 1-10 0V8ZM12 16v5"/></svg>`,
    cloth: `<svg viewBox="0 0 24 24" fill="none" stroke="#9c5730" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7c3-3 7 3 10 0s4-2 6 0M4 12c3-3 7 3 10 0s4-2 6 0M4 17c3-3 7 3 10 0s4-2 6 0"/></svg>`,
  };
  // Ilustrasi garis lapisan cetak (halaman material)
  function layersArt() {
    let l = "";
    for (let i = 0; i < 22; i++) {
      const y = 8 + i * 5.2, w = 90 + 60 * Math.sin((i / 26) * Math.PI) + 10 * Math.sin(i * 0.9);
      l += `<rect x="${(160 - w / 2).toFixed(1)}" y="${y}" width="${w.toFixed(1)}" height="3.6" rx="1.8" fill="#efe3cb" opacity="${(0.55 + 0.45 * (i / 26)).toFixed(2)}"/>`;
    }
    return `<svg viewBox="0 0 320 150" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${l}<text x="14" y="140" font-family="DM Mono,monospace" font-size="8" fill="#a89a85" letter-spacing="1.5">LAPIS 0,2 MM · PLA+ MATTE · DICETAK SATU PER SATU</text></svg>`;
  }
  // Ulir yang sama: dua bagian berbeda bertemu di satu sambungan (halaman 15)
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

  // 1 · Sampul
  add("page--dark cover", `
    <div class="cover__grid"></div>
    <div class="cover__brand">${mark("dark")}${wordmark()}</div>
    <h1 class="cover__title">Lampu yang kamu <em>susun sendiri.</em></h1>
    <p class="cover__sub">Pilih kap, badan, dan alas satu per satu. Kami cetak 3D, rakit, lalu kirim ke rumahmu.</p>
    <div class="cover__lamp">${A.renderLamp(clone(coverPreset), { uid: "cv", on: true, dim: 1, table: false, vb: "-10 30 340 420" })}</div>
    <div class="cover__meta"><span><b>Katalog</b> · ${esc(EDITION)}</span><span>Lampu meja cetak 3D · ${esc(C.city)}</span><span>${esc(SITE)}</span></div>
    <div class="cover__vert">MahaKarya Studio · Dicetak satu per satu</div>`, { folio: false });

  // 2 · Halo + daftar isi
  const TOC = [
    [3, "Tiga bagian, satu ulir"], [4, "12 bentuk"], [5, "Warna filamen"], [6, "Paket Trio · Kuarto · Kuinto"], [7, "Kombinasi populer"],
    [8, "Cara pesan & kode rakitan"], [9, "Spesifikasi & keamanan"], [10, "Koleksi Nusantara"], [12, "Custom & bisnis"], [13, "Material, jujur soal PLA"], [14, "Yang sering ditanyakan"], [15, "Konsultasi gratis"],
  ];
  const shapeCount = D.heads.length + D.bodies.length + D.bases.length;
  add("", `${rh()}
    <h2 class="intro__hello">Halo, <em>skena</em> rumah.</h2>
    <div class="intro__text">
      <p>MahaKarya Studio membuat lampu meja yang <b>kamu susun sendiri</b>. Tiap lampu terdiri dari kap, badan, dan alas; setiap bagian punya bentuk dan warnanya sendiri, disambung dengan ulir cetak yang sama. Tanpa lem, tanpa alat.</p>
      <p>Semua dicetak 3D satu per satu di ${esc(C.city.split(",")[0])}, sesuai pesanan. Tidak ada gudang berisi stok, tidak ada sisa yang terbuang. Bosan? Ganti satu bagian saja, lampumu terasa baru.</p>
      <p>Booklet ini berisi semua bentuk, warna, dan harga yang berlaku saat dicetak. Harga paling baru dan konfigurator ada di website; hasilnya bisa kamu kirim langsung lewat WhatsApp.</p>
    </div>
    <div class="stats">
      <div class="stat"><b>3</b><span>bagian · kap, badan, alas</span></div>
      <div class="stat"><b>${shapeCount}</b><span>bentuk · satu ulir M20</span></div>
      <div class="stat"><b>${D.colors.length}+${D.shadeColors.length}</b><span>warna filamen · badan + kap</span></div>
    </div>
    <p class="pull">"Tanpa lem. Tanpa alat. <b>Tinggal putar.</b>"</p>
    <div class="toc"><h3>Daftar isi</h3><ol>${TOC.map(([p, t]) => `<li><i>${String(p).padStart(2, "0")}</i><span>${esc(t)}</span><b>${p}</b></li>`).join("")}</ol></div>`, { label: "Halo" });

  // 3 · Tiga bagian
  add("page--dark", `${rh()}
    ${kicker("01", "Cara kerjanya")}
    <h2 class="h-sec">Tiga bagian, <em>satu ulir</em> yang sama.</h2>
    <div class="exploded">
      <div class="exploded__art">${A.renderLamp(clone(coverPreset), { uid: "ex", on: true, dim: 0.55, table: false, explode: true, dims: true, vb: "0 0 320 470" })}</div>
      <div>
        <div class="part-row"><span class="mono">Kap · head</span><h3>Meredam dan mengarahkan cahaya.</h3><p>${D.heads.map((h) => h.name).join(", ")}. Fitting E27 tertanam di leher kap, jadi bola lampu tinggal diputar masuk. Dicetak dari PLA tembus cahaya.</p></div>
        <div class="part-row"><span class="mono">Badan · body</span><h3>Bagian yang membangun karakter.</h3><p>Susun satu sampai ${D.maxBodies} bentuk: ${D.bodies.map((b) => b.name.toLowerCase()).join(", ")}. Campur warna sesuka hati; kabel lewat di dalam.</p></div>
        <div class="part-row"><span class="mono">Alas · base</span><h3>Penopang dan jalur kabel keluar.</h3><p>${D.bases.map((b) => b.name).join(", ")}. Diberi pemberat di dalam supaya lampu tidak mudah goyah walau badannya tinggi.</p></div>
        <p class="note" style="margin-top:4mm">Kap, badan, dan alas disambung dengan <b>ulir cetak M20</b> yang sama di semua bagian. Tanpa lem. Bagian apa pun bisa dilepas dan diganti kapan saja, termasuk yang kamu beli belakangan.</p>
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
    <p class="lead" style="margin-bottom:4mm">Semua bagian dijual satuan dan cocok dengan rakitan mana pun. Harga di bawah adalah harga satuan; beli sebagai paket lebih hemat (hal. 6).</p>
    <div class="parts-head"><h3>Kap<small>${D.heads.length} bentuk</small></h3><span>Ø 20 cm · dinding 1,6 mm · fitting E27 tertanam</span></div>
    ${tiles("head", D.heads, D.shadeColors[0].id, (h) => `tinggi ${h.cm} cm`)}
    <div class="parts-head"><h3>Badan<small>${D.bodies.length} bentuk</small></h3><span>susun 1–${D.maxBodies} · ulir M20 atas & bawah</span></div>
    ${tiles("body", D.bodies, D.colors[2].id, (b) => `tinggi ${String(b.cm).replace(".", ",")} cm · ${Math.round(b.kg * 1000)} g`)}
    <div class="parts-head"><h3>Alas<small>${D.bases.length} bentuk</small></h3><span>tebal 3 cm · berpemberat · lubang kabel belakang</span></div>
    ${tiles("base", D.bases, D.colors[3].id, () => "lebar 13–15 cm")}
    <p class="small" style="margin-top:auto">Ilustrasi menunjukkan bentuk, bukan foto produk. Garis lapisan cetak 0,2 mm terlihat tipis dan sengaja dibiarkan; filamen matte membuatnya halus di bawah cahaya.</p>`, { label: "Bentuk" });

  // 5 · Warna
  const lum = (hex) => { const n = parseInt(hex.slice(1), 16); return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255; };
  const mixes = D.presets.slice(0, 5).map((p, i) => `<div class="mix">${A.renderLamp(clone(p), { uid: "mx" + i, on: false, table: false, vb: "60 60 200 400" })}</div>`).join("");
  add("page--paper2", `${rh()}
    ${kicker("03", "Warna")}
    <h2 class="h-sec">Lima warna yang <em>saling cocok</em>, apa pun kombinasinya.</h2>
    <p class="lead">Palet inti dirancang supaya badan dan alas bisa dicampur tanpa salah. Semua memakai satu lini PLA matte dari merek yang sama, jadi warna pesanan ulangmu persis sama.</p>
    <div class="swatches">${D.colors.map((c, i) => `<div class="sw ${lum(c.hex) > 0.55 ? "sw--light" : "sw--dark"}" style="background:${c.hex}"><i>0${i + 1}</i><div><b>${esc(c.name)}</b><small>${c.hex}</small></div></div>`).join("")}</div>
    <div class="swatches swatches--kap">${D.shadeColors.map((c, i) => `<div class="sw sw--kap sw--light" style="background:${c.hex}"><i>Kap 0${i + 1}</i><div><b>${esc(c.name)}</b><small>${c.hex} · tembus cahaya</small></div></div>`).join("")}
      <div class="sw-note"><b>Kap selalu terang.</b> ${esc(D.shadeColors[0].name)} adalah PLA natural tanpa pigmen, paling rata meneruskan cahaya; ${esc(D.shadeColors[1].name)} sedikit lebih dingin. Badan dan alas memakai lima warna di atas.<br><br><b>Warna di luar palet?</b> Bisa, untuk minimal lima bagian dengan warna sama. Kami kirim foto contoh cetak sebelum produksi.</div>
    </div>
    <div class="mixes">${mixes}</div>
    <p class="small" style="margin-top:1.5mm;text-align:center">Lima kombinasi dari palet yang sama, lampu dalam keadaan mati. Nama dan harganya di halaman 7.</p>`, { label: "Warna" });

  // 6 · Paket
  const pkgs = Object.keys(D.packages).map(Number).sort().map((n) => {
    const pk = D.packages[n], r = pkgRange(n), hot = n === popular.body.length + 2;
    return `<div class="pkg${hot ? " pkg--hot" : ""}">${hot ? '<span class="tag tag--amber pkg__flag">Paling laris</span>' : ""}
      <div class="pkg__n">${n}<small>bagian</small></div>
      <div><h3>Paket ${esc(pk.name)} <span class="tag ${hot ? "tag--soft" : "tag--outline"}">hemat ${Math.round(pk.disc * 100)}%</span></h3>
        <ul><li>1 kap + ${n - 2} badan + 1 alas + kit kelistrikan</li><li>Tinggi ± ${esc(pk.cm)} cm</li><li>${esc(pk.note || "")}</li></ul></div>
      <div class="pkg__price"><small>mulai dari</small><b class="num">${rp(r.lo)}</b><s class="num">${rp(r.loAnchor)} beli satuan</s><em>sampai ${rp(r.hi)} untuk bentuk termahal</em></div>
    </div>`;
  }).join("");
  add("", `${rh()}
    ${kicker("04", "Paket")}
    <h2 class="h-sec">Tiga ukuran, pilih yang <em>pas</em> di mejamu.</h2>
    <p class="lead">Setiap paket adalah kap + badan + alas. Harga coret adalah harga kalau ketiga bagian dibeli satuan dari halaman 4; makin banyak badan, makin besar potongannya, sampai ${Math.round(maxDisc * 100)}%.</p>
    <div class="pkgs">${pkgs}</div>
    <div class="addons">
      <div class="addon"><b>${esc(D.wiringLabel.split(" (")[0])}</b>${esc("(" + D.wiringLabel.split(" (")[1])} Sudah termasuk di harga paket; <span class="mono">− ${rp(D.wiringPrice)}</span> bila dilepas dan kamu pasang kelistrikan sendiri.</div>
      <div class="addon"><b>Bola LED 5 W warna hangat</b>2700 K, E27, maksimal 5 W agar kap tetap dingin. Tambahan <span class="mono">+ ${rp(D.ledPrice)}</span>, atau pakai bola lampumu sendiri.</div>
    </div>
    <p class="small pkg-foot">Setiap paket disertai kartu perawatan dan kunci ulir. Harga bisa berubah; total final dikonfirmasi lewat WhatsApp sebelum kamu bayar.</p>`, { label: "Paket" });

  // 7 · Kombinasi populer
  const presetCards = D.presets.map((p, i) => {
    const cfg = clone(p), pr = price(cfg), pop = i === D.popularPreset;
    return `<div class="preset${pop ? " preset--pop" : ""}">${pop ? '<span class="tag tag--amber preset__flag">Paling populer</span>' : ""}
      <div class="preset__art">${A.renderLamp(cfg, { uid: "pr" + i, on: true, dim: 0.75, table: false, vb: "40 50 240 410" })}</div>
      <h3>${esc(p.name)}</h3><small>${pr.n} bagian · ${esc(pr.pkg.name)} · ≈ ${A.totalCm(cfg).toFixed(0)} cm</small>
      <div class="preset__price num">${rp(pr.total)}<s>${rp(pr.anchor)}</s></div>
      <div class="preset__code">${code(cfg)}</div></div>`;
  }).join("");
  add("page--dark", `${rh()}
    ${kicker("05", "Kombinasi populer")}
    <h2 class="h-sec">Mulai dari sini, <em>ubah</em> sesukamu.</h2>
    <p class="lead">Lima rakitan yang paling sering dipesan. Sebut namanya atau kirim kodenya lewat WhatsApp; atau buka di konfigurator dan ganti bagian mana pun.</p>
    <div class="presets">${presetCards}
      <div class="preset preset--text"><b>Semua harga sudah termasuk kit kelistrikan.</b><p>Harga coret adalah harga ketiga bagian bila dibeli satuan. Bola LED belum termasuk (+ ${rp(D.ledPrice)}). Kombinasi populer dicetak dalam ${esc(D.leadTime.preset)}; kombinasi custom ${esc(D.leadTime.custom)}.</p></div>
    </div>`, { label: "Kombinasi populer" });

  // 8 · Cara pesan
  const ex = clone(popular);
  add("", `${rh()}
    ${kicker("06", "Cara pesan")}
    <h2 class="h-sec">Dari booklet ke meja <em>dalam seminggu.</em></h2>
    <div class="steps">
      <div class="step"><i>1</i><div><h3>Pilih atau rakit</h3><p>Pilih kombinasi di halaman 7, atau susun sendiri bentuk dan warnanya di konfigurator website. Harga dan tinggi lampu muncul langsung.</p></div></div>
      <div class="step"><i>2</i><div><h3>Kirim lewat WhatsApp</h3><p>Kirim nama kombinasi atau kode rakitan ke ${esc(waDisplay)}. Kami balas konfirmasi stok warna dan tagihan. ${esc(C.replyPromise)}.</p></div></div>
      <div class="step"><i>3</i><div><h3>Kami cetak</h3><p>Produksi dimulai setelah pembayaran. Tiap bagian dicetak satu per satu, ${esc(D.leadTime.preset)} untuk kombinasi populer. Kamu terima foto rakitan sebelum dikirim.</p></div></div>
      <div class="step"><i>4</i><div><h3>Tiba di rumah</h3><p>Dikemas per bagian, tinggal putar dan pasang. ${esc(C.shipping.zones[0].label)} 1–2 hari, luar kota 2–5 hari. Perkiraan ongkir: ${C.shipping.zones.map((z) => `${esc(z.label)} ${rp(z.price)}`).join(", ")}.</p></div></div>
    </div>
    <div class="pay"><span>Transfer bank / QRIS atas nama usaha</span><span>Gratis ongkir dari ${rp(C.freeShippingMin)}</span><span>Garansi 30 hari cacat cetak</span></div>
    <div class="timeline">
      <div><i>Hari 0</i><b>Chat</b><span>Kirim kode, kami konfirmasi stok warna & tagihan.</span></div>
      <div><i>Hari 0–1</i><b>Bayar</b><span>Transfer / QRIS. Antrean cetak dimulai setelah bayar.</span></div>
      <div><i>Hari 1–5</i><b>Cetak</b><span>Bagian dicetak per warna, dirakit, difoto untuk kamu.</span></div>
      <div><i>Hari 5–7</i><b>Tiba</b><span>Dikemas per bagian; ${esc(C.shipping.zones[0].label)} 1–2 hari.</span></div>
    </div>
    <div class="code-box">
      <div><h3>Membaca kode rakitan</h3>
        <p>Setiap rakitan punya kode unik yang bisa kamu ketik di WhatsApp. Contoh untuk kombinasi <b>${esc(popular.name)}</b>:</p>
        <code>${code(ex)}</code>
        <div class="legend"><b>MK</b><span>MahaKarya</span><b>${code(ex).split("-")[1]}</b><span>kap: 3 huruf bentuk + 3 huruf warna (${esc(find(D.heads, ex.head.shape).name)} ${esc(find(D.shadeColors, ex.head.color).name)})</span><b>…</b><span>badan satu per satu dari atas ke bawah, lalu alas</span><b>-TK</b><span>tanpa kit kelistrikan · <b>-LED</b> dengan bola LED</span></div>
      </div>
      <div><div class="qr">${qr("site")}</div><div class="qr-cap">Scan · buka konfigurator</div></div>
    </div>`, { label: "Cara pesan" });

  // 9 · Spesifikasi & keamanan
  const cmLo = Math.min(...Object.values(D.packages).map((p) => parseInt(p.cm))), cmHi = Math.max(...Object.values(D.packages).map((p) => parseInt(p.cm.split("–")[1] || p.cm)));
  const kgLo = A.totalKg({ body: [{ shape: "cincin" }] }), kgHi = A.totalKg({ body: [{ shape: "heksa" }, { shape: "heksa" }, { shape: "heksa" }] });
  add("", `${rh()}
    ${kicker("07", "Spesifikasi & keamanan")}
    <h2 class="h-sec">Supaya awet dan <em>aman</em> dipakai.</h2>
    <ul class="spec">
      <li><span>Bahan</span><span>PLA+ matte, lapis 0,2 mm, berbasis pati tanaman</span></li>
      <li><span>Kap</span><span>Ø 20 cm, dinding 1,6 mm, PLA tembus cahaya</span></li>
      <li><span>Sambungan</span><span>Ulir cetak M20 di semua bagian, tanpa lem</span></li>
      <li><span>Fitting</span><span>E27 · bola LED maksimal 5 W, warna hangat 2700 K</span></li>
      <li><span>Kelistrikan</span><span>${esc(D.wiringLabel)}, opsional</span></li>
      <li><span>Tinggi</span><span>≈ ${cmLo}–${cmHi} cm tergantung paket dan bentuk</span></li>
      <li><span>Bobot</span><span>≈ ${kgLo.toFixed(1).replace(".", ",")}–${kgHi.toFixed(1).replace(".", ",")} kg termasuk pemberat alas</span></li>
      <li><span>Produksi</span><span>${esc(D.leadTime.preset)} (populer) · ${esc(D.leadTime.custom)} (custom)</span></li>
    </ul>
    <div class="safety">
      <div class="safe">${icon.bulb}<h4>LED maksimal 5 W</h4><p>Jangan pakai bola pijar atau halogen. PLA mulai melunak di sekitar 55 °C; batas 5 W menjaga kap tetap dingin.</p></div>
      <div class="safe">${icon.sun}<h4>Jauhkan dari panas</h4><p>Hindari jendela yang kena matahari langsung, dasbor mobil, dan kompor. Ruangan ber-AC atau berventilasi ideal.</p></div>
      <div class="safe">${icon.plug}<h4>Komponen bertanda SNI/K3L</h4><p>Kit kabel, saklar, steker, dan fitting berasal dari produsen terdaftar. Lampu rakitan ini sendiri bukan produk bersertifikat SNI; bila ragu, pesan tanpa kit dan pasang kelistrikan pilihanmu.</p></div>
      <div class="safe">${icon.cloth}<h4>Perawatan</h4><p>Lap dengan kain kering atau sedikit lembap. Hindari alkohol dan tiner. Untuk membersihkan bagian dalam, putar lepas bagiannya.</p></div>
    </div>`, { label: "Spesifikasi" });

  // 10–11 · Koleksi
  const TAGCLS = { bestseller: "", baru: "tag--green", hadiah: "tag--amber" };
  const prod = (p) => `<div class="prod"><div class="prod__art">${p.tags[0] ? `<span class="tag ${TAGCLS[p.tags[0]] || ""}">${esc(p.tags[0])}</span>` : ""}${ART.render(p, { small: true })}</div>
    <div class="prod__info"><span class="prod__col">${esc(p.collection)} · ${esc(p.category)}</span><h3>${esc(p.name)}</h3><p>${esc(p.desc)}</p><div class="prod__specs">${p.specs.map(esc).join(" · ")}</div><div class="prod__price num">${rp(p.price)}</div></div></div>`;
  add("", `${rh()}
    ${kicker("08", "Koleksi lain")}
    <h2 class="h-sec">Motif Nusantara, dicetak <em>lapis demi lapis.</em></h2>
    <p class="lead">Vas, pot, lampu, dan panel dinding dari motif lokal yang kami gambar ulang sendiri: kawung, parang, megamendung, stupa, terasering. Harga untuk ukuran dan material standar; semua bisa diubah warna dan ukurannya.</p>
    <div class="products">${P.slice(0, 6).map(prod).join("")}</div>`, { label: "Koleksi" });
  add("", `${rh()}
    <div class="products">${P.slice(6).map(prod).join("")}</div>
    <div class="why4">
      <div><i>01</i><h4>Desain orisinal bercerita</h4><p>Setiap koleksi berangkat dari motif lokal yang dirancang ulang sendiri, bukan file unduhan gratis.</p></div>
      <div><i>02</i><h4>Personalisasi cepat</h4><p>Nama, inisial, logo, warna, dan ukuran bisa disesuaikan. Hal yang tidak bisa dilakukan pabrik massal.</p></div>
      <div><i>03</i><h4>Produksi sesuai pesanan</h4><p>Tanpa gudang, tanpa sisa stok. Limbah lebih sedikit, modal berputar lebih sehat.</p></div>
      <div><i>04</i><h4>Fungsional, bukan cuma pajangan</h4><p>Vas dengan wadah kaca anti-bocor, pot dengan drainase, lampu dengan komponen listrik standar.</p></div>
    </div>
    <p class="small" style="margin-top:4mm">Ilustrasi koleksi dibuat otomatis dari profil bentuk tiap produk sampai foto asli tersedia. Katalog lengkap dan keranjang: ${esc(SITE)}/koleksi.html</p>`, { label: "Koleksi" });

  // 12 · Custom & bisnis
  const E = C.estimator;
  const pct = (m) => (m === 1 ? "harga dasar" : `+${Math.round((m - 1) * 100)}%`);
  add("page--dark", `${rh()}
    ${kicker("09", "Custom & bisnis")}
    <h2 class="h-sec">Hadiah personal, souvenir, <em>dekor kafe.</em></h2>
    <p class="lead">Hitung sendiri perkiraan harga pesanan custom dari tabel ini, lalu kirim spesifikasinya ke WhatsApp. Harga final dikonfirmasi setelah desain disetujui; mockup gratis revisi 2×.</p>
    <div class="est">
      <div class="est__box"><h4>Ukuran · harga dasar</h4><table>${E.sizes.map((s) => `<tr><td>${esc(s.label)}</td><td>${rp(s.base)} · ±${s.hours} jam</td></tr>`).join("")}</table></div>
      <div class="est__box"><h4>Material</h4><table>${E.materials.map((m) => `<tr><td>${esc(m.label)}</td><td>${pct(m.mult)}</td></tr>`).join("")}</table></div>
      <div class="est__box"><h4>Finishing & desain</h4><table>${E.finishes.map((f) => `<tr><td>${esc(f.label)}</td><td>${f.add ? "+ " + rp(f.add) : "termasuk"}</td></tr>`).join("")}<tr><td>Personalisasi nama / logo</td><td>+ ${rp(E.designFee.personal)}</td></tr><tr><td>Desain baru dari nol</td><td>+ ${rp(E.designFee.custom)}</td></tr></table></div>
      <div class="est__box"><h4>Diskon volume</h4><table>${E.tiers.filter((t) => t.disc).map((t) => `<tr><td>${t.min} pcs ke atas</td><td>− ${Math.round(t.disc * 100)}%</td></tr>`).join("")}<tr><td>DP</td><td>50% di awal</td></tr></table></div>
    </div>
    <div class="b2b">
      <div><h4>Souvenir & corporate gift</h4><p>Hampers lebaran, natal, akhir tahun, souvenir seminar dan pernikahan dengan logo atau nama.</p><ul><li>Mulai 10 pcs</li><li>Diskon hingga 25%</li><li>Kemasan branded</li></ul></div>
      <div><h4>Kafe, hotel & resto</h4><p>Lampu warna seragam dengan logo di alas, pot, dan aksen dekor yang konsisten dengan identitas brand; bisa diulang kapan saja.</p><ul><li>Konsultasi gratis</li><li>Desain eksklusif</li><li>Re-order cepat</li></ul></div>
      <div><h4>Desainer interior & arsitek</h4><p>Program mitra: harga trade, file mockup untuk presentasi klien, dan prototipe cepat.</p><ul><li>Harga trade khusus</li><li>Sampel warna</li><li>Prioritas produksi</li></ul></div>
    </div>
    <div class="formula"><b>Perkiraan</b> = harga dasar ukuran × pengali material + finishing + desain, lalu dikurangi diskon volume. Contoh: vas sedang, PLA Silk, diamplas + coating, 25 pcs dengan logo → (${rp(E.sizes[1].base)} × 1,15 + ${rp(E.finishes[1].add)}) × 25 − 15% + ${rp(E.designFee.personal)} ≈ <b>${rp(roundK(((E.sizes[1].base * 1.15 + E.finishes[1].add) * 25) * 0.85 + E.designFee.personal))}</b>.</div>`, { label: "Custom & bisnis" });

  // 13 · Material
  add("page--paper2", `${rh()}
    ${kicker("10", "Material")}
    <h2 class="h-sec">Jujur soal <em>PLA.</em></h2>
    <p class="lead">Mayoritas produk memakai PLA, plastik berbasis pati tanaman (jagung, tebu). Kami lebih suka kamu tahu batasannya sebelum membeli daripada kecewa setelahnya.</p>
    <div class="layers">${layersArt()}</div>
    <div class="mats">
      <div class="mat"><b>PLA Matte</b><i>standar lampu</i><span>Tekstur halus doff, garis lapisan paling samar, pilihan warna paling lengkap. Dipakai untuk semua bagian lampu rakitan.</span></div>
      <div class="mat"><b>PLA Silk</b><i>+15%</i><span>Kilau metalik emas, perunggu, tembaga. Cantik untuk vas dan aksesori; garis lapisan lebih terlihat.</span></div>
      <div class="mat"><b>Wood-fill</b><i>+30%</i><span>Campuran serat kayu, hangat, bisa diamplas dan dipernis seperti kayu asli.</span></div>
      <div class="mat"><b>PETG</b><i>+20%</i><span>Lebih kuat, tahan air dan UV. Untuk pot luar ruangan atau benda yang kontak air terus-menerus.</span></div>
    </div>
    <ul class="checklist">
      <li><b>PLA tidak tahan panas</b> di atas ±55 °C. Jangan letakkan di dalam mobil, di bawah terik matahari langsung, atau memakai bola pijar.</li>
      <li><b>Garis lapisan bukan cacat.</b> Garis halus horizontal adalah ciri cetak 3D. Ingin lebih halus? Pilih finishing diamplas + coating.</li>
      <li><b>PLA hanya terurai di fasilitas kompos industri</b>, bukan di tanah biasa. Kami menerima produk lama untuk didaur ulang.</li>
      <li><b>Vas untuk bunga segar</b> memakai wadah kaca di dalamnya agar benar-benar kedap air.</li>
    </ul>`, { label: "Material" });

  // 14 · FAQ
  const FAQ = [
    ["Apakah lampu cetak 3D aman dari panas?", "Aman dengan bola LED sampai 5 W. Jangan pakai bola pijar atau halogen; panasnya bisa melunakkan PLA. Setiap paket disertai catatan ini di kartu perawatan."],
    ["Apakah lampunya ber-SNI?", "Lampu rakitannya sendiri tidak bersertifikat SNI. Kit kelistrikan yang kami sertakan berasal dari produsen terdaftar dengan komponen bertanda SNI/K3L. Ingin memakai kelistrikan sendiri? Pesan tanpa kit, harganya berkurang."],
    ["Berapa lama produksinya?", `Kombinasi populer dan bagian berstok: ${D.leadTime.preset}. Kombinasi custom yang dicetak khusus: ${D.leadTime.custom}. Waktu yang berlaku kami sebut saat konfirmasi.`],
    ["Bisa pesan warna di luar yang ada?", "Bisa untuk pesanan minimal lima bagian dengan warna yang sama. Sebutkan warnanya di WhatsApp, kami cek stok filamen dan kirim foto contoh cetak sebelum produksi."],
    ["Kalau satu bagian retak atau ingin diganti?", "Semua bagian dijual satuan dan tinggal diputar ke ulir yang sama. Retak akibat cacat cetak dalam 30 hari pertama kami ganti gratis."],
    ["Bisa pakai bola lampu sendiri?", "Bisa, fittingnya E27 standar. Pilih LED warna hangat 2700 K dan maksimal 5 W agar kap tampak seperti di gambar dan tetap dingin."],
    ["Bagaimana cara bayar dan kapan dikirim?", "Setelah rakitan dikonfirmasi di WhatsApp, kami kirim tagihan untuk transfer bank atau QRIS atas nama usaha. Produksi dimulai setelah pembayaran diterima; foto rakitan dikirim sebelum paket berangkat."],
    ["Bagaimana jika barang rusak saat pengiriman?", "Kirim video unboxing dalam 2×24 jam, kami cetak ulang bagian yang rusak dan kirim gratis."],
    ["Bisa pesan satuan dengan nama?", `Bisa. Personalisasi nama atau inisial tersedia mulai satu buah (+ ${rp(E.designFee.personal)}), termasuk logo di alas lampu untuk pesanan kafe atau kantor.`],
    ["Apakah ada produk selain lampu?", "Ada. Vas, pot, panel dinding, dan aksesori bermotif Nusantara di halaman 10–11 dan di halaman Koleksi website."],
  ];
  add("", `${rh()}
    ${kicker("11", "FAQ")}
    <h2 class="h-sec">Yang sering <em>ditanyakan.</em></h2>
    <div class="faq">${FAQ.map(([q, a]) => `<div><h4>${esc(q)}</h4><p>${esc(a)}</p></div>`).join("")}</div>`, { label: "FAQ" });

  // 15 · Konsultasi
  add("page--paper2", `${rh()}
    ${kicker("12", "Konsultasi")}
    <div class="cta">
      <div>
        <h2 class="cta__title">Belum yakin <em>kombinasinya?</em></h2>
        <p>Kirim foto meja atau ruanganmu lewat WhatsApp. Kami bantu pilihkan bentuk dan warna yang pas, gratis, lalu kirim pratinjau rakitannya sebelum kamu memutuskan.</p>
        <ul class="promises"><li>Garansi 30 hari untuk cacat cetak</li><li>Foto rakitan dikirim sebelum paket berangkat</li><li>Bagian bisa diganti kapan saja, ulirnya sama</li><li>${esc(C.replyPromise)}</li></ul>
      </div>
      <div><div class="qr">${qr("wa")}</div><div class="qr-cap">Scan · chat WhatsApp</div><div class="cta__wa">${esc(waDisplay)}</div><div class="cta__hours">@${esc(C.instagram)}</div></div>
    </div>
    <div class="night"><div class="night__row">${D.presets.slice(0, 5).map((p, i) => A.renderLamp(clone(p), { uid: "nt" + i, on: true, dim: 0.85, table: false, vb: "40 40 240 420" })).join("")}</div><p>Foto rakitan asli & warna baru di <b>@${esc(C.instagram)}</b></p></div>
    <div class="refit"><div><h4>Sudah punya lampunya?</h4><p>Beli satu badan atau kap baru saja; ulirnya sama, tinggal putar. Sebutkan bentuk dan warnanya dari halaman 4–5, kami kirim sebagai bagian satuan.</p></div>${refitArt()}</div>`, { label: "Konsultasi" });

  // 16 · Sampul belakang
  add("page--dark back", `
    <div class="back__mark">${mark("dark")}</div>${wordmark()}
    <p class="back__tag">Dekorasi rumah cetak 3D. Dicetak satu per satu sesuai pesanan, dirakit tanpa lem, dan bisa terus diganti bagiannya.</p>
    <div class="contact">
      <div><i>WhatsApp</i><b>${esc(waDisplay)}</b><small>${esc(C.replyPromise)}</small></div>
      <div><i>Instagram</i><b>@${esc(C.instagram)}</b><small>foto rakitan & warna baru</small></div>
      <div><i>Website</i><b>${esc(SITE)}</b><small>konfigurator & katalog koleksi</small></div>
      <div><i>Email</i><b>${esc(C.email)}</b><small>pesanan bisnis & kerja sama</small></div>
      <div><i>Studio</i><b>${esc(C.address || C.city)}</b><small>kunjungan dengan janji</small></div>
      <div><i>Marketplace</i><b>Tokopedia · Shopee</b><small>cari "MahaKarya Studio"</small></div>
    </div>
    <div class="back__qrs"><div><div class="qr">${qr("site")}</div><div class="qr-cap">Website</div></div><div><div class="qr">${qr("ig")}</div><div class="qr-cap">Instagram</div></div></div>
    <div class="back__legal">© ${new Date().getFullYear()} MahaKarya Studio · ${esc(EDITION)}. Harga berlaku saat katalog dicetak dan dapat berubah; total final, stok warna, dan ongkir dikonfirmasi lewat WhatsApp sebelum pembayaran. Gambar lampu dan koleksi adalah ilustrasi, bukan foto produk.${C.nib ? " · NIB " + esc(C.nib) : ""}</div>`, { folio: false });

  /* ---------- Pasang ke dokumen ---------- */
  const book = document.getElementById("book");
  book.innerHTML = pages
    .map((p, i) => {
      const n = i + 1, side = n % 2 === 0 ? "left" : "right";
      const folio = p.folio ? `<div class="folio"><b>${n}</b><span>${esc(p.label)} · MahaKarya Studio</span></div>` : "";
      return `<section class="page ${p.cls}" data-side="${side}" aria-label="Halaman ${n}">${p.inner}${folio}</section>`;
    })
    .join("");

  // Skala tampilan layar supaya spread 2 halaman (296 mm) muat di jendela
  const wrap = document.getElementById("book-wrap");
  const MM = 96 / 25.4;
  function fit() {
    const avail = window.innerWidth - 32;
    const single = avail < 230 * MM;
    book.classList.toggle("book--single", single);
    const natural = (single ? 148 : 296) * MM;
    const z = Math.min(1, avail / natural);
    book.style.transformOrigin = "top left";
    book.style.transform = `scale(${z})`;
    book.style.margin = `0 0 0 ${Math.max(0, (avail - natural * z) / 2)}px`;
    wrap.style.height = book.offsetHeight * z + 76 + "px";
  }
  fit();
  window.addEventListener("resize", fit);
  window.addEventListener("beforeprint", () => (book.style.transform = "none"));
  window.addEventListener("afterprint", fit);
  window.MKS_BOOKLET = { pages: pages.length };
})();
