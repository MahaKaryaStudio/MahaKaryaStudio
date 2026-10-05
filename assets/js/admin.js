/*
 * ADMIN WA — alat bantu satu admin untuk pesanan lampu rakitan.
 * Tidak ada server: semua data tersimpan di browser ini (localStorage "mks-orders-v1").
 * Buat cadangan rutin lewat tombol "Unduh JSON"; "Unduh CSV" untuk sheet Pesanan.
 *
 * Alur status: baru → konfirmasi → bayar → cetak → kirim → selesai (atau batal).
 * Tiap status punya template balasan; placeholder {nama}, {kode}, {total}, dst.
 */
(function () {
  const C = window.MKS_CONFIG;
  const D = window.MKS_LAMP;
  const KEY = "mks-orders-v1";
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const rp = (n) => "Rp" + Math.round(n || 0).toLocaleString("id-ID");
  const roundK = (n) => Math.round(n / 1000) * 1000;
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const today = () => new Date().toISOString().slice(0, 10);
  const addDays = (iso, n) => { const d = new Date(iso + "T00:00:00"); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
  const fmtDate = (iso) => (iso ? new Date(iso + "T00:00:00").toLocaleDateString("id-ID", { day: "numeric", month: "short" }) : "—");
  const daysBetween = (a, b) => Math.round((new Date(b + "T00:00:00") - new Date(a + "T00:00:00")) / 86400000);

  /* ---------- Status ---------- */
  const STATUS = [
    { id: "baru", label: "Baru", hint: "Balas < 15 menit", color: "#e2b43c" },
    { id: "konfirmasi", label: "Konfirmasi", hint: "Cek stok, kirim total", color: "#4f86c6" },
    { id: "bayar", label: "Tunggu bayar", hint: "Ingatkan setelah 24 jam", color: "#ea7f31" },
    { id: "cetak", label: "Cetak", hint: "Foto rakitan sebelum kirim", color: "#8a62c2" },
    { id: "kirim", label: "Dikirim", hint: "Kirim resi hari yang sama", color: "#5c8040" },
    { id: "selesai", label: "Selesai", hint: "Minta foto/ulasan H+3", color: "#8a7a68" },
    { id: "batal", label: "Batal", hint: "", color: "#b3412a" },
  ];
  const NEXT = { baru: "konfirmasi", konfirmasi: "bayar", bayar: "cetak", cetak: "kirim", kirim: "selesai" };
  const statusOf = (id) => STATUS.find((s) => s.id === id) || STATUS[0];

  /* ---------- Template balasan (sama dengan ops/wa-quick-replies.md) ---------- */
  const T = {
    baru: "Halo {nama}, terima kasih sudah merakit lampunya 🙂 Kode {kode} sudah kami terima. Kami cek stok warna dulu, maksimal 1 jam ya.",
    konfirmasi:
      "Halo {nama}, ini rinciannya:\n{rincian}\nPaket {paket}: {harga}\nOngkir ke {zona}: {ongkir}\n*Total {total}*\nProduksi {produksi} setelah pembayaran, dikirim pakai kurir reguler.\n\nPembayaran: transfer BCA xxxx / QRIS (foto terlampir). Kirim bukti transfernya di sini ya, dan alamat lengkap + nomor HP penerima kalau belum.",
    bayar: "Halo {nama}, pesanan {kode} masih kami simpan sampai besok jam ini ya. Kalau sudah transfer, kirim buktinya di sini supaya langsung masuk antrean cetak 🙏",
    cetak: "Pembayaran {total} diterima, terima kasih {nama}! Lampu {kode} masuk antrean cetak hari ini. Perkiraan selesai {jadi}; nanti kami kirim foto rakitannya dulu sebelum dikemas.",
    foto: "Halo {nama}, ini foto rakitan {kode} sebelum dikemas. Kalau sudah oke, balas \"OK\" dan kami kirim hari ini. Kalau ada yang kurang pas, bilang saja sekarang, lebih mudah diganti sebelum dikirim.",
    kirim: "Lampu {kode} sudah dikirim ✅\nKurir: {kurir}\nResi: {resi}\nPerkiraan tiba {tiba}. Saat tiba, cek kardusnya dulu sebelum tanda tangan; kalau penyok, foto dulu ya sebelum dibuka.",
    selesai: "Halo {nama}, lampunya sudah terpasang? Kalau berkenan, kirim fotonya di ruanganmu, kami senang melihatnya (dan boleh kami tampilkan dengan izin). Bohlam LED maksimal 5 W ya, supaya kap tetap dingin.",
    stokhabis: "Halo {nama}, warna {warna} sedang kosong, restok sekitar 5 hari. Pilihannya: (1) tunggu restok, (2) ganti ke warna lain yang ready: {alternatif}, (3) batalkan tanpa potongan. Mau yang mana?",
    custom: "Kombinasi {kode} dicetak khusus, jadi produksinya 7–10 hari kerja (bukan 3–5). Harganya tetap sama. Lanjut?",
    batal: "Baik {nama}, pesanan {kode} kami batalkan. Kalau sudah ada pembayaran, kami kembalikan penuh ke rekening yang sama dalam 1×24 jam. Terima kasih sudah mampir, kapan pun mau merakit lagi, kodenya masih bisa dipakai.",
  };

  /* ---------- Data lampu ---------- */
  const k3 = (s) => s.slice(0, 3).toUpperCase();
  const listOf = (kind) => (kind === "head" ? D.heads : kind === "body" ? D.bodies : D.bases);
  const colorsOf = (kind) => (kind === "head" ? D.shadeColors : D.colors);
  const KIND_LABEL = { head: "Kap", body: "Badan", base: "Alas" };

  // Urai kode MK-KERGAD-KUBBAT-...-KOTBAT[-TK][-LED]
  function decode(codeStr) {
    const parts = String(codeStr || "").trim().toUpperCase().split("-").filter(Boolean);
    if (parts[0] !== "MK") return null;
    let segs = parts.slice(1);
    const led = segs.includes("LED"), wiring = !segs.includes("TK");
    segs = segs.filter((s) => s !== "LED" && s !== "TK");
    if (segs.length < 3 || segs.length > 2 + D.maxBodies) return null;
    const find = (list, pre) => list.find((x) => k3(x.id) === pre) || null;
    const part = (kind, seg) => {
      const shape = find(listOf(kind), seg.slice(0, 3)), color = find(colorsOf(kind), seg.slice(3, 6));
      return shape && color ? { kind, shape, color } : null;
    };
    const head = part("head", segs[0]), base = part("base", segs[segs.length - 1]);
    const body = segs.slice(1, -1).map((s) => part("body", s));
    if (!head || !base || body.some((b) => !b)) return null;
    return { head, body, base, led, wiring };
  }

  function priceOf(cfg) {
    const lines = [cfg.head, ...cfg.body, cfg.base].map((p, i) => ({
      ...p,
      label: `${KIND_LABEL[p.kind]}${p.kind === "body" && cfg.body.length > 1 ? " " + i : ""} · ${p.shape.name}`,
      price: p.shape.price,
    }));
    const parts = lines.reduce((s, l) => s + l.price, 0);
    const n = lines.length;
    const pkg = D.packages[n] || { name: `${n} bagian`, disc: 0 };
    const disc = parts - roundK(parts * (1 - pkg.disc));
    const wiring = cfg.wiring ? D.wiringPrice : 0;
    const led = cfg.led ? D.ledPrice : 0;
    return { lines, parts, n, pkg, disc, wiring, led, total: parts - disc + wiring + led };
  }
  const isPreset = (cfg) =>
    D.presets.some((p) => p.head.shape === cfg.head.shape.id && p.head.color === cfg.head.color.id && p.base.shape === cfg.base.shape.id && p.base.color === cfg.base.color.id && p.body.length === cfg.body.length && p.body.every((b, i) => b.shape === cfg.body[i].shape.id && b.color === cfg.body[i].color.id));
  const leadDays = (cfg) => (isPreset(cfg) ? 5 : 10);
  const zoneById = (id) => (C.shipping.zones.find((z) => z.id === id) || C.shipping.zones[0]);

  /* ---------- Urai pesan WA ---------- */
  function parseMessage(text) {
    const t = String(text || "");
    const code = (t.match(/MK-[A-Z0-9-]+/i) || [""])[0].toUpperCase().replace(/-+$/, "");
    const grab = (re) => { const m = t.match(re); return m ? m[1].trim() : ""; };
    const zoneLabel = grab(/Kirim ke ([^,\n]+)/i);
    const zone = C.shipping.zones.find((z) => z.label.toLowerCase() === zoneLabel.toLowerCase());
    const stated = grab(/Paket [^—\n]+— Rp([\d.]+)/i).replace(/\./g, "");
    return {
      code,
      nama: grab(/Nama:\s*([^\n]*)/i),
      alamat: grab(/Alamat kirim:\s*([^\n]*)/i),
      zone: zone ? zone.id : C.shipping.zones[0].id,
      statedTotal: stated ? +stated : null,
    };
  }

  /* ---------- Penyimpanan ---------- */
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; } };
  const save = (list) => localStorage.setItem(KEY, JSON.stringify(list));
  let orders = load();
  const nextId = () => {
    const d = today().replace(/-/g, "").slice(2);
    const n = orders.filter((o) => o.id.startsWith("P" + d)).length + 1;
    return `P${d}-${String(n).padStart(2, "0")}`;
  };

  /* ---------- Isi template ---------- */
  function fill(tpl, o) {
    const cfg = decode(o.code);
    const p = cfg ? priceOf(cfg) : null;
    const z = zoneById(o.zone);
    const ongkir = o.ongkir != null && o.ongkir !== "" ? +o.ongkir : z.price;
    const total = (p ? p.total : +o.total || 0) + ongkir;
    const map = {
      nama: o.nama || "Kak",
      kode: o.code,
      rincian: p ? p.lines.map((l) => `• ${l.label} — ${l.color.name}`).join("\n") + `\n• Kelistrikan: ${cfg.wiring ? "kit ber-SNI/K3L" : "tanpa (hanya bagian cetak)"}` + (cfg.led ? "\n• Bola LED 5 W" : "") : "",
      paket: p ? `${p.pkg.name} (${p.n} bagian)` : "",
      harga: p ? rp(p.total) : rp(o.total),
      zona: z.label,
      ongkir: rp(ongkir),
      total: rp(total),
      produksi: cfg ? (isPreset(cfg) ? D.leadTime.preset : D.leadTime.custom) : D.leadTime.custom,
      jadi: o.jadwal ? fmtDate(o.jadwal) : "—",
      kurir: o.kurir || "—",
      resi: o.resi || "—",
      tiba: o.tiba ? fmtDate(o.tiba) : "2–5 hari",
      warna: "…",
      alternatif: D.colors.filter((c) => c.stock !== false).map((c) => c.name).join(", "),
    };
    return tpl.replace(/\{(\w+)\}/g, (_, k) => (k in map ? map[k] : "{" + k + "}"));
  }
  // 08xx → 628xx; +62 → 62
  const normHp = (s) => String(s || "").replace(/\D/g, "").replace(/^0/, "62");
  const waUrl = (o, msg) => `https://wa.me/${normHp(o.hp)}?text=${encodeURIComponent(msg)}`;

  /* ---------- UI: form pesanan baru ---------- */
  const form = $("#form");
  let draft = null;

  function renderDraft() {
    const box = $("#draft");
    if (!draft) { box.innerHTML = ""; return; }
    const cfg = decode(draft.code);
    const p = cfg ? priceOf(cfg) : null;
    const z = zoneById(draft.zone);
    const warn = [];
    if (!cfg) warn.push("Kode tidak dikenali. Periksa ejaannya, atau bentuk/warnanya sudah tidak ada di lamp-data.js.");
    if (p && draft.statedTotal != null && p.total !== draft.statedTotal) warn.push(`Harga di pesan (${rp(draft.statedTotal)}) berbeda dari harga sekarang (${rp(p.total)}). Pakai harga yang dijanjikan di pesan bila pembeli sudah melihatnya.`);
    if (cfg && cfg.body.some((b) => b.color.stock === false) || (cfg && cfg.base.color.stock === false)) warn.push("Ada warna yang ditandai habis di website.");
    box.innerHTML =
      `<div class="card">
        <div class="card__head"><b>${esc(draft.code || "(tanpa kode)")}</b>${cfg ? `<span class="pill">${isPreset(cfg) ? "Preset · " + D.leadTime.preset : "Custom · " + D.leadTime.custom}</span>` : ""}</div>
        ${warn.map((w) => `<p class="warn">⚠ ${esc(w)}</p>`).join("")}
        ${p ? `<table class="lines">${p.lines.map((l) => `<tr><td>${esc(l.label)}</td><td>${esc(l.color.name)}</td><td class="num">${rp(l.price)}</td></tr>`).join("")}
          <tr><td colspan="2">Diskon paket ${esc(p.pkg.name)} (${Math.round(p.pkg.disc * 100)}%)</td><td class="num">−${rp(p.disc)}</td></tr>
          ${p.wiring ? `<tr><td colspan="2">Kit kelistrikan</td><td class="num">${rp(p.wiring)}</td></tr>` : ""}
          ${p.led ? `<tr><td colspan="2">Bola LED</td><td class="num">${rp(p.led)}</td></tr>` : ""}
          <tr><td colspan="2">Ongkir ${esc(z.label)} (perkiraan)</td><td class="num">${rp(z.price)}</td></tr>
          <tr class="total"><td colspan="2">Total</td><td class="num">${rp(p.total + z.price)}</td></tr></table>` : ""}
        <div class="grid2">
          <label>Nama<input name="nama" value="${esc(draft.nama)}" /></label>
          <label>Nomor WA pembeli<input name="hp" inputmode="tel" placeholder="08xxx / 628xxx" value="${esc(draft.hp || "")}" /></label>
          <label class="span2">Alamat kirim<input name="alamat" value="${esc(draft.alamat)}" /></label>
          <label>Zona<select name="zone">${C.shipping.zones.map((zz) => `<option value="${zz.id}" ${zz.id === draft.zone ? "selected" : ""}>${esc(zz.label)} · ${rp(zz.price)}</option>`).join("")}</select></label>
          <label>Ongkir aktual (isi setelah cek kurir)<input name="ongkir" inputmode="numeric" placeholder="${z.price}" value="${esc(draft.ongkir || "")}" /></label>
          <label class="span2">Catatan<input name="catatan" value="${esc(draft.catatan || "")}" /></label>
        </div>
        <div class="acts"><button class="btn btn--primary" type="button" id="save-draft" ${cfg ? "" : "disabled"}>Simpan sebagai pesanan baru</button><button class="btn" type="button" id="clear-draft">Batal</button></div>
      </div>`;
    $$("#draft input, #draft select").forEach((el) => el.addEventListener("input", () => { draft[el.name] = el.value; if (el.name === "zone") renderDraft(); }));
    $("#save-draft").addEventListener("click", () => {
      const cfg2 = decode(draft.code), p2 = priceOf(cfg2);
      orders.unshift({
        id: nextId(), tgl: today(), status: "baru", code: draft.code, nama: draft.nama, hp: draft.hp || "", alamat: draft.alamat, zone: draft.zone,
        ongkir: draft.ongkir || "", total: draft.statedTotal != null && draft.statedTotal !== p2.total ? draft.statedTotal : p2.total, catatan: draft.catatan || "",
        lead: leadDays(cfg2), bayar: "", jadwal: "", kurir: "", resi: "", tiba: "", selesai: "", log: [{ t: today(), s: "baru" }],
      });
      save(orders); draft = null; $("#paste").value = ""; renderDraft(); renderList(); toast("Pesanan disimpan");
    });
    $("#clear-draft").addEventListener("click", () => { draft = null; renderDraft(); });
  }

  $("#parse").addEventListener("click", () => {
    const txt = $("#paste").value;
    if (!txt.trim()) return toast("Tempel pesan WA dulu");
    draft = { ...parseMessage(txt), hp: "", ongkir: "", catatan: "" };
    renderDraft();
  });
  $("#manual").addEventListener("click", () => { draft = { code: "MK-", nama: "", alamat: "", zone: C.shipping.zones[0].id, statedTotal: null, hp: "", ongkir: "", catatan: "" }; renderDraft(); $("#draft input[name=nama]").focus(); });
  // Kode diketik manual: perbarui saat kode diubah di kolom catatan? Sediakan input kode terpisah
  $("#draft").addEventListener("input", (e) => { if (e.target.name === "code") { draft.code = e.target.value.toUpperCase(); renderDraft(); } });

  /* ---------- UI: daftar pesanan ---------- */
  let filter = "aktif";
  function renderList() {
    const q = ($("#q").value || "").toLowerCase();
    const rows = orders.filter((o) => (filter === "aktif" ? !["selesai", "batal"].includes(o.status) : filter === "semua" ? true : o.status === filter))
      .filter((o) => !q || [o.id, o.nama, o.code, o.hp, o.resi].join(" ").toLowerCase().includes(q));
    $("#count").textContent = `${rows.length} pesanan`;
    $("#list").innerHTML = rows.length ? rows.map(rowHtml).join("") : `<p class="muted">Belum ada pesanan di filter ini.</p>`;
    renderStats();
  }
  function dueInfo(o) {
    if (o.status === "cetak" && o.jadwal) { const d = daysBetween(today(), o.jadwal); return d < 0 ? { cls: "late", txt: `Terlambat ${-d} hari` } : { cls: "", txt: `Janji ${fmtDate(o.jadwal)} (${d} hari lagi)` }; }
    if (o.status === "bayar") { const d = daysBetween(o.log.find((l) => l.s === "bayar")?.t || o.tgl, today()); return d >= 1 ? { cls: "late", txt: `Belum bayar ${d} hari` } : { cls: "", txt: "Menunggu bukti bayar" }; }
    if (o.status === "baru") return { cls: "late", txt: "Balas < 15 menit" };
    if (o.status === "kirim" && o.tiba) { const d = daysBetween(o.tiba, today()); return d >= 3 ? { cls: "late", txt: "Saatnya tanya kabar" } : { cls: "", txt: `Tiba ±${fmtDate(o.tiba)}` }; }
    return { cls: "", txt: statusOf(o.status).hint };
  }
  function rowHtml(o) {
    const s = statusOf(o.status), due = dueInfo(o), cfg = decode(o.code);
    const total = (+o.total || 0) + (o.ongkir !== "" ? +o.ongkir : zoneById(o.zone).price);
    return `<details class="order" data-id="${o.id}">
      <summary>
        <span class="dot" style="background:${s.color}"></span>
        <span class="o-id">${esc(o.id)}</span>
        <span class="o-name">${esc(o.nama || "—")}<small>${esc(o.code)}</small></span>
        <span class="o-total num">${rp(total)}</span>
        <span class="o-status">${esc(s.label)}<small class="${due.cls}">${esc(due.txt)}</small></span>
      </summary>
      <div class="o-body">
        <div class="grid2">
          <label>Status<select data-f="status">${STATUS.map((x) => `<option value="${x.id}" ${x.id === o.status ? "selected" : ""}>${x.label}</option>`).join("")}</select></label>
          <label>Nomor WA<input data-f="hp" value="${esc(o.hp)}" /></label>
          <label>Tanggal bayar<input type="date" data-f="bayar" value="${esc(o.bayar)}" /></label>
          <label>Janji selesai cetak<input type="date" data-f="jadwal" value="${esc(o.jadwal)}" /></label>
          <label>Kurir<input data-f="kurir" value="${esc(o.kurir)}" placeholder="JNE REG / SiCepat / …" /></label>
          <label>Resi<input data-f="resi" value="${esc(o.resi)}" /></label>
          <label>Perkiraan tiba<input type="date" data-f="tiba" value="${esc(o.tiba)}" /></label>
          <label>Ongkir aktual<input data-f="ongkir" inputmode="numeric" value="${esc(o.ongkir)}" placeholder="${zoneById(o.zone).price}" /></label>
          <label class="span2">Alamat<input data-f="alamat" value="${esc(o.alamat)}" /></label>
          <label class="span2">Catatan<input data-f="catatan" value="${esc(o.catatan)}" /></label>
        </div>
        ${cfg ? `<p class="muted small">${priceOf(cfg).lines.map((l) => `${esc(l.label)} ${esc(l.color.name)}`).join(" · ")} · ${cfg.wiring ? "kit" : "tanpa kit"}${cfg.led ? " · LED" : ""} · ${isPreset(cfg) ? "preset" : "custom"}</p>` : ""}
        <div class="tpls">
          ${["baru", "konfirmasi", "bayar", "cetak", "foto", "kirim", "selesai", "stokhabis", "custom", "batal"].map((k) => `<button class="chip${k === o.status || (o.status === "cetak" && k === "foto") ? " chip--on" : ""}" type="button" data-tpl="${k}">${k === "foto" ? "Foto rakitan" : k === "stokhabis" ? "Stok habis" : statusOf(k).label === "Baru" && k !== "baru" ? k : k === "custom" ? "Custom 7–10 hari" : statusOf(k).label}</button>`).join("")}
        </div>
        <textarea class="msg" rows="6" readonly></textarea>
        <div class="acts">
          <button class="btn btn--primary" type="button" data-copy>Salin balasan</button>
          <a class="btn btn--wa" data-open target="_blank" rel="noopener">Buka chat WA</a>
          ${NEXT[o.status] ? `<button class="btn" type="button" data-next>Lanjut ke “${statusOf(NEXT[o.status]).label}” →</button>` : ""}
          <button class="btn btn--danger" type="button" data-del>Hapus</button>
        </div>
        <p class="muted small">Riwayat: ${o.log.map((l) => `${esc(l.s)} ${fmtDate(l.t)}`).join(" → ")}</p>
      </div>
    </details>`;
  }
  function setStatus(o, s) {
    if (o.status === s) return;
    o.status = s; o.log.push({ t: today(), s });
    if (s === "cetak") { o.bayar = o.bayar || today(); o.jadwal = o.jadwal || addDays(o.bayar, Math.ceil(o.lead * 1.4)); }
    if (s === "kirim") { o.tiba = o.tiba || addDays(today(), o.zone === "jabodetabek" ? 2 : o.zone === "jawa" ? 3 : 5); }
    if (s === "selesai") o.selesai = today();
  }
  $("#list").addEventListener("input", (e) => {
    const el = e.target.closest("[data-f]"); if (!el) return;
    const o = orders.find((x) => x.id === el.closest(".order").dataset.id);
    if (el.dataset.f === "status") setStatus(o, el.value); else o[el.dataset.f] = el.value;
    save(orders);
    if (el.dataset.f === "status") renderList();
  });
  $("#list").addEventListener("click", (e) => {
    const det = e.target.closest(".order"); if (!det) return;
    const o = orders.find((x) => x.id === det.dataset.id);
    const tplBtn = e.target.closest("[data-tpl]");
    if (tplBtn) { $$(".chip", det).forEach((b) => b.classList.toggle("chip--on", b === tplBtn)); showMsg(det, o, tplBtn.dataset.tpl); }
    if (e.target.closest("[data-copy]")) { const m = $(".msg", det).value || showMsg(det, o); navigator.clipboard.writeText(m).then(() => toast("Balasan disalin")); }
    if (e.target.closest("[data-next]")) { setStatus(o, NEXT[o.status]); save(orders); renderList(); toast(`Status: ${statusOf(o.status).label}`); }
    if (e.target.closest("[data-del]") && confirm(`Hapus pesanan ${o.id}?`)) { orders = orders.filter((x) => x !== o); save(orders); renderList(); }
  });
  $("#list").addEventListener("toggle", (e) => {
    const det = e.target; if (!det.classList.contains("order") || !det.open) return;
    const o = orders.find((x) => x.id === det.dataset.id);
    showMsg(det, o, o.status === "cetak" ? "cetak" : o.status);
  }, true);
  function showMsg(det, o, key) {
    key = key || o.status;
    const m = fill(T[key] || "", o);
    $(".msg", det).value = m;
    const a = $("[data-open]", det);
    a.href = waUrl(o, m); a.classList.toggle("is-off", !o.hp); a.title = o.hp ? "" : "Isi nomor WA pembeli dulu";
    return m;
  }
  $$("[data-filter]").forEach((b) => b.addEventListener("click", () => { filter = b.dataset.filter; $$("[data-filter]").forEach((x) => x.classList.toggle("is-on", x === b)); renderList(); }));
  $("#q").addEventListener("input", renderList);

  /* ---------- Laporan singkat ---------- */
  function renderStats() {
    const d30 = addDays(today(), -30);
    const recent = orders.filter((o) => o.tgl >= d30);
    const paid = recent.filter((o) => ["cetak", "kirim", "selesai"].includes(o.status));
    const omzet = paid.reduce((s, o) => s + (+o.total || 0), 0);
    const prod = orders.filter((o) => o.bayar && o.log.find((l) => l.s === "kirim")).map((o) => daysBetween(o.bayar, o.log.find((l) => l.s === "kirim").t));
    const avg = prod.length ? (prod.reduce((a, b) => a + b, 0) / prod.length).toFixed(1) : "—";
    const late = orders.filter((o) => o.status === "cetak" && o.jadwal && o.jadwal < today()).length;
    $("#stats").innerHTML = [
      ["Pesanan 30 hari", recent.length], ["Terbayar", `${paid.length} (${recent.length ? Math.round((paid.length / recent.length) * 100) : 0}%)`],
      ["Omzet terbayar", rp(omzet)], ["Rata-rata bayar → kirim", `${avg} hari`], ["Terlambat cetak", late],
      ["Menunggu balasan", orders.filter((o) => o.status === "baru").length],
    ].map(([k, v]) => `<div class="stat"><small>${k}</small><b>${v}</b></div>`).join("");
  }

  /* ---------- Ekspor / cadangan ---------- */
  const COLS = ["id", "tgl", "status", "nama", "hp", "code", "total", "zone", "ongkir", "alamat", "bayar", "jadwal", "kurir", "resi", "tiba", "selesai", "catatan"];
  const HEAD = ["ID", "Tanggal", "Status", "Nama", "No WA", "Kode rakitan", "Harga lampu", "Zona", "Ongkir", "Alamat", "Tgl bayar", "Janji selesai", "Kurir", "Resi", "Perkiraan tiba", "Tgl selesai", "Catatan"];
  const dl = (name, text, type) => { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name; a.click(); };
  $("#csv").addEventListener("click", () => {
    const cell = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const csv = [HEAD.map(cell).join(";"), ...orders.map((o) => COLS.map((c) => cell(c === "zone" ? zoneById(o.zone).label : o[c])).join(";"))].join("\r\n");
    dl(`pesanan-${today()}.csv`, "﻿" + csv, "text/csv;charset=utf-8");
  });
  $("#json").addEventListener("click", () => dl(`cadangan-pesanan-${today()}.json`, JSON.stringify(orders, null, 2), "application/json"));
  $("#restore").addEventListener("change", (e) => {
    const f = e.target.files[0]; if (!f) return;
    f.text().then((t) => { const arr = JSON.parse(t); if (!Array.isArray(arr)) throw 0; if (confirm(`Ganti ${orders.length} pesanan di browser ini dengan ${arr.length} pesanan dari cadangan?`)) { orders = arr; save(orders); renderList(); toast("Cadangan dipulihkan"); } }).catch(() => toast("File tidak valid"));
    e.target.value = "";
  });

  function toast(m) { const t = $("#toast"); t.textContent = m; t.classList.add("show"); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove("show"), 1600); }

  $("#brand").textContent = C.brand;
  renderList();
})();
