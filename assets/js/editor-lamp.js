/*
 * Tab "Lampu" untuk Mode Edit: foto asli per bagian, harga bentuk, warna filamen,
 * paket, dan harga LED. Mendaftar ke window.MKSEditor; dimuat setelah editor.js
 * dan sebelum lamp.js.
 */
(function () {
  const ED = window.MKSEditor;
  const data = window.MKS_LAMP;
  if (!ED || !data) return;
  const { esc, rp, $, $$, clone, confirmBox, shrinkImage, replaceObject } = ED;
  const ORIGINAL = clone(data);
  const KIND = { head: "Kap", body: "Badan", base: "Alas" };
  const listOf = (kind) => (kind === "head" ? data.heads : kind === "body" ? data.bodies : data.bases);
  const colorsOf = (kind) => (kind === "head" ? data.shadeColors : data.colors);
  const changed = () => ED.markChanged("lamp", data);

  function render(body) {
    body.innerHTML = `
      <h4>Foto asli per bagian</h4>
      <p class="mks-help">Pilih jenis, bentuk, dan warna, lalu unggah foto bagian yang sudah dicetak. Foto tampil di kartu "Bagian satuan" dan di strip bagian terpilih; pratinjau lampu tetap ilustrasi. Foto diperkecil otomatis (maks. 800 px).</p>
      <div class="mks-grid3">
        <label>Jenis<select data-pk="kind">${Object.entries(KIND).map(([k, v]) => `<option value="${k}">${v}</option>`).join("")}</select></label>
        <label>Bentuk<select data-pk="shape"></select></label>
        <label>Warna<select data-pk="color"></select></label>
      </div>
      <div class="mks-row"><label class="mks-btn mks-btn--primary mks-file">Unggah foto<input type="file" accept="image/*" data-photo hidden /></label></div>
      <div class="mks-photos" data-photos></div>

      <h4>Harga bentuk (Rp)</h4>
      ${table("heads", [["name", "Kap"], ["price", "Harga", "number"], ["cm", "Tinggi cm", "number", 'step="0.5"']])}
      ${table("bodies", [["name", "Badan"], ["price", "Harga", "number"], ["cm", "Tinggi cm", "number", 'step="0.5"'], ["kg", "Berat kg", "number", 'step="0.01"']])}
      ${table("bases", [["name", "Alas"], ["price", "Harga", "number"]])}
      <label>Bola LED 5 W hangat (Rp)<input data-l="ledPrice" type="number" value="${data.ledPrice}" /></label>
      <label>Kit kelistrikan ber-SNI/K3L (Rp)<input data-l="wiringPrice" type="number" value="${data.wiringPrice}" /></label>
      <label>Nama kit kelistrikan<input data-l="wiringLabel" value="${esc(data.wiringLabel)}" /></label>
      <div class="mks-grid2">
        <label>Produksi preset/berstok<input data-l="leadTime.preset" value="${esc(data.leadTime.preset)}" /></label>
        <label>Produksi custom<input data-l="leadTime.custom" value="${esc(data.leadTime.custom)}" /></label>
      </div>
      <label>Preset "Paling populer" (dibuka pertama)<select data-l="popularPreset">${data.presets.map((p, i) => `<option value="${i}"${i === data.popularPreset ? " selected" : ""}>${esc(p.name)}</option>`).join("")}</select></label>

      <h4>Paket</h4>
      <table class="mks-table"><thead><tr><th>Bagian</th><th>Nama</th><th>Diskon %</th><th>Tinggi</th></tr></thead><tbody>
      ${Object.keys(data.packages).map((n) => `<tr><td>${n}</td><td><input data-l="packages.${n}.name" value="${esc(data.packages[n].name)}"/></td><td><input data-l="packages.${n}.disc" type="number" value="${Math.round(data.packages[n].disc * 100)}"/></td><td><input data-l="packages.${n}.cm" value="${esc(data.packages[n].cm)}"/></td></tr>`).join("")}
      </tbody></table>

      <h4>Warna filamen (badan &amp; alas)</h4>
      <p class="mks-help">Kolom "Ada": hilangkan centang bila stok filamen warna itu habis; warnanya tetap tampil tapi tidak bisa dipilih.</p>
      ${colorTable("colors")}
      <div class="mks-row"><button type="button" class="mks-btn" data-add-color="colors">+ Tambah warna</button></div>
      <h4>Warna kap</h4>
      ${colorTable("shadeColors")}
      <div class="mks-row"><button type="button" class="mks-btn" data-add-color="shadeColors">+ Tambah warna kap</button></div>
      <p class="mks-help mks-muted">Bentuk baru dan kombinasi favorit (preset) diubah lewat file <code>assets/js/lamp-data.js</code>, karena ilustrasinya perlu digambar.</p>
      <div class="mks-row"><button type="button" class="mks-btn" data-reset-lamp>Kembalikan data lampu asli</button></div>`;

    const kindSel = $('[data-pk="kind"]', body);
    const shapeSel = $('[data-pk="shape"]', body);
    const colorSel = $('[data-pk="color"]', body);
    const fillSelects = () => {
      const kind = kindSel.value;
      shapeSel.innerHTML = listOf(kind).map((s) => `<option value="${s.id}">${esc(s.name)}</option>`).join("");
      colorSel.innerHTML = `<option value="">Semua warna</option>` + colorsOf(kind).map((c) => `<option value="${c.id}">${esc(c.name)}</option>`).join("");
    };
    fillSelects();
    kindSel.addEventListener("change", fillSelects);

    const renderPhotos = () => {
      const keys = Object.keys(data.photos);
      $("[data-photos]", body).innerHTML = keys.length
        ? keys.map((k) => `<div class="mks-photo"><img src="${esc(data.photos[k])}" alt=""/><span>${esc(label(k))}</span><button type="button" data-del-photo="${esc(k)}">Hapus</button></div>`).join("")
        : `<p class="mks-help mks-muted">Belum ada foto. Semua bagian masih memakai ilustrasi.</p>`;
    };
    renderPhotos();

    body.addEventListener("change", (e) => {
      const inp = e.target.closest("[data-photo]");
      if (!inp || !inp.files[0]) return;
      shrinkImage(inp.files[0], 800).then((url) => {
        const key = `${kindSel.value}:${shapeSel.value}` + (colorSel.value ? `:${colorSel.value}` : "");
        data.photos[key] = url;
        inp.value = "";
        changed();
        renderPhotos();
      });
    });
    body.addEventListener("click", (e) => {
      const del = e.target.closest("[data-del-photo]");
      if (del) {
        delete data.photos[del.dataset.delPhoto];
        changed();
        return renderPhotos();
      }
      const delColor = e.target.closest("[data-del-color]");
      if (delColor) {
        const [list, i] = delColor.dataset.delColor.split(".");
        if (data[list].length <= 1) return;
        data[list].splice(+i, 1);
        changed();
        return render(body);
      }
      const addColor = e.target.closest("[data-add-color]");
      if (addColor) {
        const list = addColor.dataset.addColor;
        data[list].push({ id: "warna" + Date.now().toString(36).slice(-4), name: "Warna baru", hex: "#c8794a" });
        changed();
        return render(body);
      }
      if (e.target.closest("[data-reset-lamp]"))
        confirmBox(body, "Data lampu (harga, warna, paket, foto) kembali ke versi asli. Lanjutkan?", () => {
          replaceObject(data, ORIGINAL);
          ED.state.lamp = null;
          ED.save();
          ED.refreshAll();
          render(body);
        });
    });
    body.addEventListener("change", (e) => {
      const st = e.target.closest("[data-stock]");
      if (!st) return;
      const [list, i] = st.dataset.stock.split(".");
      if (st.checked) delete data[list][+i].stock;
      else data[list][+i].stock = false;
      changed();
    });
    body.addEventListener("input", (e) => {
      const t = e.target.closest("[data-l]");
      if (!t) return;
      const path = t.dataset.l.split(".");
      let cur = data;
      while (path.length > 1) cur = cur[path.shift()];
      const k = path[0];
      let v = t.type === "number" ? +t.value || 0 : t.value;
      if (k === "disc") v = v / 100;
      if (k === "popularPreset") v = +t.value || 0;
      cur[k] = v;
      changed();
    });
  }

  function table(list, cols) {
    return `<table class="mks-table"><thead><tr>${cols.map((c) => `<th>${c[1]}</th>`).join("")}</tr></thead><tbody>
      ${data[list].map((row, i) => `<tr>${cols.map(([k, , type, attrs]) => `<td><input data-l="${list}.${i}.${k}" type="${type || "text"}" value="${esc(row[k])}" ${attrs || ""}/></td>`).join("")}</tr>`).join("")}
    </tbody></table>`;
  }
  function colorTable(list) {
    return `<table class="mks-table"><thead><tr><th>Nama</th><th>Warna</th><th>Ada</th><th></th></tr></thead><tbody>
      ${data[list].map((c, i) => `<tr><td><input data-l="${list}.${i}.name" value="${esc(c.name)}"/></td><td><input data-l="${list}.${i}.hex" type="color" value="${/^#[0-9a-f]{6}$/i.test(c.hex) ? c.hex : "#c8794a"}"/></td><td><input type="checkbox" data-stock="${list}.${i}" ${c.stock === false ? "" : "checked"} title="Hilangkan centang bila stok filamen habis"/></td><td><button type="button" class="mks-btn mks-btn--sm mks-btn--danger" data-del-color="${list}.${i}">✕</button></td></tr>`).join("")}
    </tbody></table>`;
  }
  function label(key) {
    const [kind, shape, color] = key.split(":");
    const s = listOf(kind).find((x) => x.id === shape);
    const c = color && colorsOf(kind).find((x) => x.id === color);
    return `${KIND[kind]} ${s ? s.name : shape} · ${c ? c.name : color ? color : "semua warna"}`;
  }

  ED.register({
    id: "lampu",
    label: "Lampu",
    storeKey: "lamp",
    data,
    render,
    exportFiles: (header) => [{ path: "assets/js/lamp-data.js", content: header("DATA LAMPU RAKITAN (harga masih contoh sampai dikalibrasi)") + "window.MKS_LAMP = " + JSON.stringify(data, null, 2) + ";\n" }],
  });
})();
