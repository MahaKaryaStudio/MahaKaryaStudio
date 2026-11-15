/*
 * lamp3d.js — PROTOTIPE lampu rakitan 3D (three.js), pasangan rig SVG LampArt.
 *
 * createLamp3D(container, cfg, opts) → handle | null (null = WebGL tidak tersedia → pemanggil tetap pakai SVG)
 *   cfg  = objek yang sama dengan LampArt.renderLamp: {head:{shape,color[,hex]}, body:[{shape,color}], base:{shape,color}}
 *   opts = { data (bawaan window.MKS_LAMP), lit, yaw (rad), auto (bawaan true), frame {lf, fl, fe}, label, maxDpr (2) }
 *   handle = { canvas, setConfig(cfg), setLit(bool, instant?), rotateBy(rad), setYaw(rad), stats(), dispose() }
 *
 * Satuan = satuan lampu lamp-art.js (bola 68 tinggi, kap kerucut 104, dst.). Angka profil di SHAPES disalin dari
 * bodySpec / baseSpec / headSpec di lamp-art.js (h = tinggi tumpuk, hw = setengah lebar siluet). Rig SVG memakai
 * elips tutup 0,18 → kamera 3D dipasang pada elevasi asin(0,18) ≈ 10,4° dengan lensa panjang supaya sudut pandangnya sama.
 * Yang TIDAK ada di data 2D dan terpaksa diputuskan di sini ditandai "ASUMSI".
 */
import {
  WebGLRenderer, Scene, PerspectiveCamera, Group, Mesh, LatheGeometry, BufferGeometry, BufferAttribute,
  MeshStandardMaterial, MeshBasicMaterial, ShaderMaterial, DataTexture, Vector2, Vector3, Color,
  DirectionalLight, HemisphereLight, PointLight, RepeatWrapping, RedFormat, LinearFilter, LinearMipmapLinearFilter,
  AdditiveBlending, DoubleSide,
} from "three";

const TAU = Math.PI * 2;
const CAP = 0.18; // lamp-art.js: elips tutup seragam
const ELEV = Math.asin(CAP);
const REF = 334; // lamp-art.js: tinggi lampu acuan (Senja)
const GROUND = 8; // pusat dasar alas berada 8 satuan di atas FLOOR SVG (baseSpec bulat: yB = y - 8)
const NECK = 16, NECK_R = 10;
const LAYER = 3; // garis lapisan cetak tiap 3 satuan (lamp-art.js: pattern tinggi 2,25 ≈ 3 px layar)

/* ---------- profil ---------- */
const seg = (a, b, n) => { const out = []; for (let i = 1; i <= n; i++) out.push([a[0] + ((b[0] - a[0]) * i) / n, a[1] + ((b[1] - a[1]) * i) / n]); return out; };
const arc = (cx, cy, rx, ry, a0, a1, n) => { const out = []; for (let i = 0; i <= n; i++) { const a = a0 + ((a1 - a0) * i) / n; out.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]); } return out; };
// cakram/silinder dengan pinggul kecil; cincin tambahan menjaga normal tetap rata di bidang datar
const puck = (r, h, b, rings = []) => [[0, 0], ...rings.map((x) => [x, 0]), [r - 2 * b, 0], [r - b, 0], [r, b], [r, 2 * b], [r, h - 2 * b], [r, h - b], [r - b, h], [r - 2 * b, h], ...rings.slice().reverse().map((x) => [x, h]), [0, h]];
// penampang: persegi bersudut bulat (superelips), bunga 8 kelopak, plisir zigzag
const squircle = (n) => (p) => 1 / Math.pow(Math.pow(Math.abs(Math.cos(p)), n) + Math.pow(Math.abs(Math.sin(p)), n), 1 / n);
const flower = (p) => (64 + 12 * Math.cos(8 * p)) / 76;
const pleat = (count, depth) => (p) => { const t = ((p * count) / TAU) % 1; return 1 + depth * (1 - 4 * Math.abs(t - 0.5)); };

// dinding kap: luar naik, bibir, dalam turun, lantai dalam. → {profile, inner (indeks awal dinding dalam)}
function shadeProfile(rB, rT, h, w) {
  const p = [[0, 0], ...seg([0, 0], [rB, 0], 2), [rB, 0], ...seg([rB, 0], [rT, h], 12), [rT, h]];
  const inner = p.length;
  p.push([rT - w, h], [rT - w, h], ...seg([rT - w, h], [rB - w, 3], 6), [rB - w, 3], ...seg([rB - w, 3], [0, 3], 2));
  return { profile: p, inner };
}

// lamp-art headSpec: h adalah tinggi SILUET (termasuk setengah elips atas dan bawah), dan bibir depan-bawah kap
// jatuh di puncak leher. Supaya siluet 3D sama: tinggi dinding = h − (rT + rB) × 0,18, kap diangkat rB × 0,18 (leher memanjang).
const shadeSpec = (rB, rT, h, extra) => { const wall = h - (rT + rB) * CAP; return Object.assign(shadeProfile(rB, rT, wall, 2.2), { h: wall, hw: Math.max(rB, rT), lift: rB * CAP }, extra); };

const SHAPES = {
  body: {
    // lamp-art bodySpec: elips 40 × 34. ASUMSI: bidang rata r 12 di kutub (tempat ulir).
    bola: () => { const am = Math.acos(12 / 40), k = 34 / Math.sin(am); return { h: 68, hw: 40, profile: [[0, 0], [12, 0], ...arc(0, 34, 40, k, -am, am, 20), [12, 68], [0, 68]] }; },
    // lamp-art: muka depan 64 × 58. ASUMSI: tampak atas persegi 64 × 64, rusuk tegak membulat.
    kubus: () => ({ h: 58, hw: 32, profile: puck(32, 58, 1.6, [20]), mod: squircle(9), segs: 72 }),
    // lamp-art: elips 50 × 19 dengan alur r 22 di atas. ASUMSI: lensa (elipsoid pipih) dengan bidang rata r 22 + cekungan tengah.
    cincin: () => { const am = Math.acos(22 / 50), k = 19 / Math.sin(am); return { h: 38, hw: 50, profile: [[0, 0], [22, 0], ...arc(0, 19, 50, k, -am, am, 18), [22, 38], [20.5, 34.5], [0, 34.5]] }; },
    // lamp-art: siluet heksagon 52 → 104 → 52, 3 faset tampak per paruh. ASUMSI: dua limas terpancung bersisi 6.
    heksa: () => ({ h: 62, hw: 52, profile: [[0, 0], [26, 0], [52, 31], [26, 62], [0, 62]], segs: 6, flat: true, phase: Math.PI / 6 }),
    silinder: () => ({ h: 50, hw: 34, profile: puck(34, 50, 1.4, [18]) }),
  },
  base: {
    // tebal 18 = 26 (h tumpuk) − 8 (GROUND): dasar badan jatuh tepat di FLOOR − 26 seperti di SVG
    bulat: () => ({ h: 18, hw: 78, profile: puck(78, 18, 1.4, [26, 44]) }),
    // ASUMSI: tampak atas persegi 144 × 144 (SVG menggambar muka atas hanya 8 satuan)
    kotak: () => ({ h: 18, hw: 72, profile: puck(72, 18, 1.6, [26, 44]), mod: squircle(12), segs: 80 }),
    // lamp-art: sisi 176, bilah 8, puncak 22 di atas dasar. ASUMSI: limas segitiga sama sisi, terpancung di 18.
    segitiga: () => { const R = 176 / Math.sqrt(3); return { h: 18, hw: 88, profile: [[0, 0], [R, 0], [R, 8], [R * (4 / 14), 18], [0, 18]], segs: 3, flat: true }; },
    // lamp-art: r = 64 + 12 cos 8a, tebal 10–14
    bunga: () => ({ h: 14, hw: 76, profile: puck(76, 14, 1.4, [26, 44]), mod: flower, segs: 128 }),
  },
  head: {
    // lamp-art headSpec: h 104, rxT 46, rxB 72, 20 garis plisir per setengah keliling → 40 rusuk (bump)
    kerucut: () => shadeSpec(72, 46, 104, { ribs: ["u", 40, 0.5] }),
    // lamp-art: 112 lebar × 104, rusuk mendatar tiap 7. ASUMSI: tampak atas persegi.
    kotak: () => shadeSpec(56, 56, 104, { mod: squircle(14), segs: 80, ribs: ["v", 7, 1.1] }),
    // lamp-art: silinder r 60 × 110, 26 lipit per setengah keliling → 52 lipit (geometri zigzag)
    plisir: () => shadeSpec(60, 60, 110, { mod: pleat(52, 0.026), segs: 208 }),
  },
};
const specOf = (kind, id) => (SHAPES[kind][id] || Object.values(SHAPES[kind])[0])();

/* ---------- geometri putar ---------- */
// LatheGeometry + (opsional) modulasi radius per sudut. shade(j, [r, y]) → pengali warna verteks (AO); glow(j) → pijar kap.
function revolve(spec, o = {}) {
  const P = spec.profile, n = P.length, segs = spec.segs || 48;
  const g = new LatheGeometry(P.map((p) => new Vector2(Math.max(0, p[0]), p[1])), segs, spec.phase || 0);
  const pos = g.attributes.position, uv = g.attributes.uv;
  const col = new Float32Array(pos.count * 3), glow = o.glow ? new Float32Array(pos.count) : null;
  for (let i = 0; i <= segs; i++) {
    const phi = (i / segs) * TAU, m = spec.mod ? spec.mod(phi) : 1;
    for (let j = 0; j < n; j++) {
      const k = i * n + j;
      if (m !== 1) { pos.setX(k, pos.getX(k) * m); pos.setZ(k, pos.getZ(k) * m); }
      uv.setXY(k, (i / segs) * (o.uRep || 1), P[j][1] / (o.pitch || LAYER));
      col[k * 3] = col[k * 3 + 1] = col[k * 3 + 2] = o.shade ? o.shade(j, P[j]) : 1;
      if (glow) glow[k] = o.glow(j, P[j]);
    }
  }
  g.setAttribute("color", new BufferAttribute(col, 3));
  if (glow) g.setAttribute("aGlow", new BufferAttribute(glow, 1));
  if (spec.flat) { const f = g.toNonIndexed(); g.dispose(); f.computeVertexNormals(); return f; }
  if (spec.mod) {
    g.computeVertexNormals();
    const nr = g.attributes.normal, a = new Vector3(), b = new Vector3();
    for (let j = 0; j < n; j++) { // jahitan: samakan normal kolom pertama dan terakhir
      a.fromBufferAttribute(nr, j); b.fromBufferAttribute(nr, segs * n + j); a.add(b).normalize();
      nr.setXYZ(j, a.x, a.y, a.z); nr.setXYZ(segs * n + j, a.x, a.y, a.z);
    }
  }
  return g;
}
// AO verteks di sekitar sambungan (lamp-art: elips AO di tiap sambungan)
const jointAO = (h, rcB, rcT) => (j, p) => {
  const dB = Math.hypot(Math.max(0, p[0] - rcB), p[1]), dT = Math.hypot(Math.max(0, p[0] - rcT), h - p[1]);
  return 1 - 0.34 * Math.exp(-Math.min(rcB < 0 ? 1e9 : dB, rcT < 0 ? 1e9 : dT) / 7);
};

/* ---------- tekstur prosedural mungil (garis lapisan / rusuk) ---------- */
function stripeTex(vertical) {
  const d = new Uint8Array([255, 255, 250, 228, 190, 190, 228, 250]);
  const t = vertical ? new DataTexture(d, 8, 1, RedFormat) : new DataTexture(d, 1, 8, RedFormat);
  t.wrapS = t.wrapT = RepeatWrapping; t.magFilter = LinearFilter; t.minFilter = LinearMipmapLinearFilter; t.generateMipmaps = true; t.needsUpdate = true;
  return t;
}

/* ---------- bercak gradien radial (bayangan kontak, genangan, glow): 3 stop seperti <radialGradient> SVG ---------- */
const BLOB_V = "varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}";
const BLOB_F = "varying vec2 vUv;uniform vec3 uC;uniform vec4 uS;uniform float uO;void main(){float d=length(vUv-.5)*2.;float a=d<uS.z?mix(uS.x,uS.y,d/uS.z):mix(uS.y,0.,clamp((d-uS.z)/(uS.w-uS.z),0.,1.));gl_FragColor=vec4(uC,a*uO);}";
const srgb = (hex) => { const n = parseInt(hex.slice(1), 16); return new Vector3(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255); };
function quadGeo() {
  const g = new BufferGeometry();
  g.setAttribute("position", new BufferAttribute(new Float32Array([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0]), 3));
  g.setAttribute("uv", new BufferAttribute(new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]), 2));
  g.setIndex([0, 1, 2, 0, 2, 3]);
  return g;
}
function blob(geo, hex, stops, add) {
  const m = new ShaderMaterial({ vertexShader: BLOB_V, fragmentShader: BLOB_F, transparent: true, depthWrite: false, side: DoubleSide, uniforms: { uC: { value: srgb(hex) }, uS: { value: stops }, uO: { value: 1 } } });
  if (add) m.blending = AdditiveBlending;
  return new Mesh(geo, m);
}
// lembar bergradien warna verteks (dinding, meja): rows = [[x0,y0,z0, x1,y1,z1, hex], …]
function sheet(rows) {
  const pos = [], col = [], idx = [], c = new Color();
  rows.forEach((r, i) => {
    c.set(r[6]); pos.push(r[0], r[1], r[2], r[3], r[4], r[5]); col.push(c.r, c.g, c.b, c.r, c.g, c.b);
    if (i) { const a = (i - 1) * 2; idx.push(a, a + 1, a + 3, a, a + 3, a + 2); }
  });
  const g = new BufferGeometry();
  g.setAttribute("position", new BufferAttribute(new Float32Array(pos), 3));
  g.setAttribute("color", new BufferAttribute(new Float32Array(col), 3));
  g.setIndex(idx);
  return g;
}

const ease = (t) => 1 - Math.pow(1 - t, 3);
const lerp = (a, b, t) => a + (b - a) * t;
const reduced = () => document.documentElement.classList.contains("motion-off") || !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);

export function createLamp3D(container, cfg, opts = {}) {
  const t0 = performance.now();
  const data = opts.data || window.MKS_LAMP;
  const frame = Object.assign({ lf: 0.6, fl: 0.78, fe: 0.9 }, opts.frame);
  let renderer;
  try { renderer = new WebGLRenderer({ antialias: true, alpha: false, powerPreference: "default" }); } catch (e) { return null; }
  const canvas = renderer.domElement;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, opts.maxDpr || 2));
  // tanpa tone mapping: NeutralToneMapping mengurangi kanal terkecil (offset fresnel) sehingga merah bata jadi lebih jenuh dari swatch
  renderer.setClearColor(0x15100c, 1); // --dark-bg
  canvas.style.cssText = "display:block;width:100%;height:100%;touch-action:pan-y;cursor:grab;outline-offset:-3px";
  canvas.tabIndex = 0;
  canvas.setAttribute("role", "img");
  container.appendChild(canvas);

  const scene = new Scene();
  const Hf = REF / frame.lf, FOV = 12;
  const dist = Hf / 2 / Math.tan((FOV * Math.PI) / 360);
  const camera = new PerspectiveCamera(FOV, 0.8, dist * 0.4, dist * 3);
  const target = new Vector3(0, ((frame.fl - 0.5) * Hf - GROUND) / Math.cos(ELEV), 0);
  let pitch = ELEV;
  const placeCamera = () => { camera.position.set(0, target.y + Math.sin(pitch) * dist, Math.cos(pitch) * dist); camera.lookAt(target); };
  placeCamera();

  /* panggung: warna persis token brief (MeshBasic, tanpa tone mapping) */
  // kedalaman z di bidang meja yang jatuh pada fraksi tinggi bingkai tertentu (proyeksi perspektif persis)
  const solveZ = (frac) => { const K = (frac - 0.5) * Hf, ty = target.y, se = Math.sin(ELEV), ce = Math.cos(ELEV); return (K * (ty * se + dist) - ty * dist * ce) / (K * ce + dist * se); };
  const zBack = solveZ(frame.fl - 30 / Hf); // garis temu dinding–meja = FLOOR − 30 (lamp-art f.J)
  const zFront = solveZ(frame.fe); // tepi depan meja
  const X = 4000, wallY = (f) => ((frame.fl - f) * Hf - 30) / Math.cos(ELEV); // tinggi di dinding untuk fraksi bingkai f
  const stageMat = new MeshBasicMaterial({ vertexColors: true, toneMapped: false });
  const mixHex = (a, b, t) => { const A = srgb(a), B = srgb(b); return "#" + [A.x + (B.x - A.x) * t, A.y + (B.y - A.y) * t, A.z + (B.z - A.z) * t].map((v) => Math.round(v * 255).toString(16).padStart(2, "0")).join(""); }; // campur di ruang sRGB seperti CSS
  const J = frame.fl - 30 / Hf;
  const wall = new Mesh(sheet([
    [-X, 0, zBack, X, 0, zBack, mixHex("#1a130e", "#15100c", Math.max(0, (J - 0.62) / 0.38))],
    [-X, wallY(0.62), zBack, X, wallY(0.62), zBack, "#1a130e"], // --stage-wall-2 di 62%
    [-X, wallY(0), zBack, X, wallY(0), zBack, "#2a2019"], // --stage-wall
    [-X, wallY(0) + 2000, zBack, X, wallY(0) + 2000, zBack, "#2a2019"],
  ]), stageMat);
  const table = new Mesh(sheet([
    [-X, 0, zBack, X, 0, zBack, "#2e2219"], // --stage-table
    [-X, 0, zFront, X, 0, zFront, "#1b140f"], // --stage-table-2
    [-X, 0, zFront, X, 0, zFront, mixHex("#1b140f", "#f2e7d5", 0.08)], // garis tepi depan 1 px (lamp-art: #f2e7d5 .08)
    [-X, -1.1, zFront, X, -1.1, zFront, mixHex("#1b140f", "#f2e7d5", 0.08)],
    [-X, -1.1, zFront, X, -1.1, zFront, "#1b140f"],
    [-X, -Hf * 0.12, zFront, X, -Hf * 0.12, zFront, "#15100c"],
  ]), stageMat);
  table.geometry.index.array.reverse(); // muka atas menghadap +y
  scene.add(wall, table);

  /* cahaya: satu kunci hangat kiri-atas + ambien redup; bohlam = PointLight di dalam kap (hanya saat menyala) */
  const key = new DirectionalLight(0xfff8f0, 1);
  key.position.set(-0.7, 0.5, 0.75);
  const hemi = new HemisphereLight(0xffffff, 0xa39b93, 1);
  const bulbLight = new PointLight(0xffd9ae, 0, 0, 1);
  scene.add(key, hemi, bulbLight);

  const quad = quadGeo();
  const contact = blob(quad, "#000000", { x: 0.74, y: 0.4, z: 0.5, w: 1 });
  const pool = blob(quad, "#ffcc80", { x: 0.42, y: 0.15, z: 0.5, w: 1 });
  const wallLight = blob(quad, "#f2a33a", { x: 0.24, y: 0.08, z: 0.55, w: 1 });
  const halo = blob(quad, "#ffbe6e", { x: 0.5, y: 0.12, z: 0.38, w: 0.62 });
  const bloom = blob(quad, "#ffd696", { x: 0.17, y: 0.07, z: 0.55, w: 1 }, true);
  contact.rotation.x = pool.rotation.x = -Math.PI / 2;
  bloom.material.depthTest = false;
  [pool, contact, wallLight, halo].forEach((m, i) => (m.renderOrder = i + 1));
  bloom.renderOrder = 10;
  scene.add(pool, contact, wallLight, halo, bloom);

  const layerTex = stripeTex(false), ribTex = stripeTex(true);
  const lampGroup = new Group();
  scene.add(lampGroup);
  let shadeMat = null, bulbMat = null, shadeBase = new Color(), partMats = [];

  const hexOf = (p, list) => p.hex || (list.find((x) => x.id === p.color) || list[0]).hex;

  function disposeLamp() {
    lampGroup.traverse((o) => { if (o.isMesh) { o.geometry.dispose(); o.material.dispose(); } });
    lampGroup.clear();
    partMats = [];
  }

  function build(cf) {
    disposeLamp();
    const plastic = (hex) => { const m = new MeshStandardMaterial({ color: hex, roughness: 0.84, metalness: 0, vertexColors: true, bumpMap: layerTex, bumpScale: 0.14 }); partMats.push(m); return m; };
    const add = (geo, mat, y) => { const m = new Mesh(geo, mat); m.position.y = y; lampGroup.add(m); return m; };
    const base = specOf("base", cf.base.shape), bodies = cf.body.map((b) => specOf("body", b.shape)), head = specOf("head", cf.head.shape);
    const contactR = (a, b) => Math.min(a, b) * 0.55;
    let y = 0;
    add(revolve(base, { shade: jointAO(base.h, -1, bodies.length ? contactR(bodies[0].hw, base.hw) : NECK_R) }), plastic(hexOf(cf.base, data.colors)), y);
    y += base.h;
    bodies.forEach((s, i) => {
      const rb = i ? contactR(s.hw, bodies[i - 1].hw) : contactR(s.hw, base.hw), rt = i < bodies.length - 1 ? contactR(s.hw, bodies[i + 1].hw) : NECK_R + 2;
      add(revolve(s, { shade: jointAO(s.h, rb, rt) }), plastic(hexOf(cf.body[i], data.colors)), y);
      y += s.h;
    });
    // leher/fitting (lamp-art paintNeck: r 10, #3a3129)
    const neckMat = new MeshStandardMaterial({ color: 0x463b32, roughness: 0.6, metalness: 0, vertexColors: true });
    add(revolve({ profile: [[0, 0], [NECK_R, 0], [NECK_R, 0], [NECK_R, 5], [NECK_R - 0.9, 5.6], [NECK_R, 6.2], [NECK_R, 9.6], [NECK_R - 0.9, 10.2], [NECK_R, 10.8], [NECK_R, NECK + head.lift], [0, NECK + head.lift]], segs: 24 }), neckMat, y);
    y += NECK + head.lift;
    // kap: translusen dipalsukan = emisif × pijar per verteks × tint tepi (jalur cahaya lebih panjang di sudut landai)
    const hh = head.h, inner = head.inner;
    const glow = (j, p) => (j >= inner ? 1.12 : j < 3 ? 0.5 : (0.66 + 0.34 * Math.exp(-Math.pow((p[1] / hh - 0.36) / 0.42, 2))) * (1 - 0.22 * Math.max(0, (p[1] / hh - 0.55) / 0.45)));
    const shade = (j, p) => (j >= inner ? 0.5 : j < 3 ? 1 - 0.34 * Math.exp(-Math.max(0, p[0] - NECK_R) / 7) : 1);
    shadeBase.set(hexOf(cf.head, data.shadeColors));
    shadeMat = new MeshStandardMaterial({ color: shadeBase.clone(), roughness: 0.72, metalness: 0, vertexColors: true, emissive: 0xffe9bd, emissiveIntensity: 0 });
    if (head.ribs) { shadeMat.bumpMap = head.ribs[0] === "u" ? ribTex : layerTex; shadeMat.bumpScale = head.ribs[2]; }
    shadeMat.onBeforeCompile = (sh) => {
      sh.uniforms.uEdge = { value: new Vector3(0.9, 0.52, 0.2) };
      sh.vertexShader = "attribute float aGlow;varying float vGlow;\n" + sh.vertexShader.replace("#include <begin_vertex>", "#include <begin_vertex>\nvGlow=aGlow;");
      sh.fragmentShader = "varying float vGlow;uniform vec3 uEdge;\n" + sh.fragmentShader.replace("#include <emissivemap_fragment>", "#include <emissivemap_fragment>\ntotalEmissiveRadiance*=vGlow*mix(uEdge,vec3(1.),pow(saturate(dot(normal,normalize(vViewPosition))),2.6));\n#ifdef USE_BUMPMAP\ntotalEmissiveRadiance*=.84+.16*smoothstep(.74,1.,texture2D(bumpMap,vBumpMapUv).x);\n#endif\n");
    };
    add(revolve(head, { shade, glow, uRep: head.ribs && head.ribs[0] === "u" ? head.ribs[1] : 1, pitch: head.ribs && head.ribs[0] === "v" ? head.ribs[1] : LAYER }), shadeMat, y);
    // bohlam (hanya terlihat dari sudut tinggi lewat bukaan atas)
    const by = y + hh * 0.36;
    bulbMat = new MeshBasicMaterial({ color: 0x6a625a });
    add(revolve({ profile: [[0, -14], ...arc(0, 0, 14, 14, -Math.PI / 2, Math.PI / 2, 10).slice(1)], segs: 20 }), bulbMat, by);
    add(revolve({ profile: [[0, 0], [9, 0], [9, 0], [9, hh * 0.36 - 15], [0, hh * 0.36 - 15]], segs: 20 }), neckMat.clone(), y + 3);

    const shadeCy = y + hh / 2, total = y + hh;
    bulbLight.position.set(0, by, 0);
    // bercak mengikuti lamp-art renderLamp (lapis 2, 4, 5 dan "mekar")
    const sr = base.hw * (base.mod || base.flat ? 1.42 : 1.18) + 14;
    contact.scale.set(sr, sr, 1); contact.position.set(0, 0.6, 0);
    const pr = Math.max(150, Math.max(base.hw, head.hw) * 2.3), pz = Math.min(zFront - 24, 300);
    pool.scale.set(pr, pz, 1); pool.position.set(0, 0.4, 14);
    // di dinding: titik yang segaris dengan pusat kap dari kamera
    const cam = camera.position, onWall = (py) => { const t = (zBack + 1 - cam.z) / (0 - cam.z); return new Vector3(0, cam.y + (py - cam.y) * t, zBack + 1); };
    const k = (dist + -zBack) / dist; // kompensasi perspektif: ukuran di dinding
    const W = 0.8 * Hf;
    wallLight.position.copy(onWall(shadeCy - 10)); wallLight.scale.set(W * 0.62 * k, Hf * 0.42 * k, 1);
    halo.position.copy(onWall(shadeCy)); halo.position.z += 1; halo.scale.set(235 * k, 205 * k, 1);
    bloom.position.set(0, shadeCy - 4, 0); bloom.scale.set(head.hw * 1.7, head.h * 0.95, 1);
    info = { total, shadeCy, tris: 0 };
    lampGroup.traverse((o) => { if (o.isMesh) info.tris += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3; });
    applyLit();
    invalidate();
  }

  /* nyala/mati */
  let info = null, litT = opts.lit === false ? 0 : 1, litGoal = litT, litFrom = litT, litStart = 0;
  const LIT_MS = 600; // sama dengan transisi --dim rig SVG
  const warm = new Color(0xfff3d2), cold = new Color(0x6a625a), dark = new Color();
  function applyLit() {
    const t = litT;
    key.intensity = lerp(0.66, 2.2, t); // mati: seluruh lampu lebih gelap (lamp-art: penggelap .45 ≈ kecerahan .55)
    hemi.intensity = lerp(0.66, 2.2, t);
    bulbLight.intensity = 40 * t;
    if (shadeMat) { shadeMat.emissiveIntensity = 0.76 * t; shadeMat.color.copy(shadeBase).lerp(dark.copy(shadeBase).multiplyScalar(0.12), t); }
    if (bulbMat) bulbMat.color.copy(cold).lerp(warm, t);
    pool.material.uniforms.uO.value = wallLight.material.uniforms.uO.value = halo.material.uniforms.uO.value = bloom.material.uniforms.uO.value = t;
  }
  function setLit(on, instant) {
    litGoal = on ? 1 : 0; litFrom = litT; litStart = performance.now();
    if (instant || reduced()) { litT = litGoal; applyLit(); }
    invalidate();
  }

  /* putar */
  let yaw = opts.yaw || 0, vel = 0, auto = opts.auto !== false && !reduced(), dragging = false, lastX = 0, lastY = 0, lastMove = 0;
  const AUTO = 0.28; // rad/detik ≈ 22 detik per putaran
  const down = (e) => { if (e.button) return; dragging = true; auto = false; vel = 0; lastX = e.clientX; lastY = e.clientY; lastMove = e.timeStamp; canvas.setPointerCapture(e.pointerId); canvas.style.cursor = "grabbing"; };
  const move = (e) => {
    if (!dragging) return;
    const dx = e.clientX - lastX, dy = e.clientY - lastY, dt = Math.max(1, e.timeStamp - lastMove);
    const kx = (Math.PI * 1.1) / Math.max(1, canvas.clientWidth);
    yaw += dx * kx; vel = (dx * kx * 1000) / dt;
    if (e.pointerType === "mouse") { pitch = Math.min(0.5, Math.max(0.05, pitch + dy * 0.004)); placeCamera(); bloom.quaternion.copy(camera.quaternion); }
    lastX = e.clientX; lastY = e.clientY; lastMove = e.timeStamp;
    invalidate();
  };
  const up = (e) => { if (!dragging) return; dragging = false; canvas.style.cursor = "grab"; if (reduced() || e.type === "pointercancel" || e.timeStamp - lastMove > 80) vel = 0; invalidate(); };
  const keyDown = (e) => {
    const d = e.key === "ArrowLeft" ? -1 : e.key === "ArrowRight" ? 1 : 0;
    if (d) { auto = false; yaw += d * (Math.PI / 12); e.preventDefault(); invalidate(); }
    else if (e.key === "Home") { auto = false; yaw = 0; pitch = ELEV; placeCamera(); bloom.quaternion.copy(camera.quaternion); invalidate(); }
  };
  canvas.addEventListener("pointerdown", down); canvas.addEventListener("pointermove", move);
  canvas.addEventListener("pointerup", up); canvas.addEventListener("pointercancel", up);
  canvas.addEventListener("keydown", keyDown);

  /* loop: hanya menggambar bila ada yang berubah; berhenti saat di luar layar / tab tersembunyi */
  let raf = 0, dirty = true, visible = true, lost = false, last = 0, frames = 0, firstFrame = 0, dead = false;
  const active = () => auto || dragging || Math.abs(vel) > 0.02 || litT !== litGoal;
  function invalidate() { dirty = true; if (!raf && visible && !document.hidden && !lost && !dead) raf = requestAnimationFrame(tick); }
  function tick(now) {
    raf = 0;
    if (dead || lost || !visible || document.hidden) return;
    const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016);
    last = now;
    if (litT !== litGoal) { const p = Math.min(1, (performance.now() - litStart) / LIT_MS); litT = lerp(litFrom, litGoal, ease(p)); if (p >= 1) litT = litGoal; applyLit(); dirty = true; }
    if (auto) { yaw += AUTO * dt; dirty = true; }
    else if (!dragging && Math.abs(vel) > 0.02) { yaw += vel * dt; vel *= Math.pow(0.04, dt); dirty = true; }
    if (dirty) {
      dirty = false;
      lampGroup.rotation.y = yaw;
      renderer.render(scene, camera);
      frames++;
      if (!firstFrame) { firstFrame = performance.now(); try { container.dispatchEvent(new CustomEvent("lamp3d:firstframe", { detail: { ms: firstFrame - t0 } })); } catch (e) {} }
    }
    if (active()) raf = requestAnimationFrame(tick); else last = 0;
  }
  function resize() {
    const w = container.clientWidth, h = container.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    invalidate();
  }
  const ro = new ResizeObserver(resize); ro.observe(container);
  const io = new IntersectionObserver((en) => { visible = en[0].isIntersecting; if (visible) { last = 0; invalidate(); } }, { rootMargin: "80px" });
  io.observe(container);
  const onVis = () => { if (!document.hidden) { last = 0; invalidate(); } };
  document.addEventListener("visibilitychange", onVis);
  const onLost = (e) => { e.preventDefault(); lost = true; if (opts.onLost) opts.onLost(); };
  const onRestored = () => { lost = false; invalidate(); };
  canvas.addEventListener("webglcontextlost", onLost); canvas.addEventListener("webglcontextrestored", onRestored);

  function label(cf) {
    if (opts.label) return typeof opts.label === "function" ? opts.label(cf) : opts.label;
    return "Ilustrasi 3D lampu rakitan. Geser ke kiri atau kanan, atau tekan tombol panah, untuk memutar.";
  }
  function setConfig(cf) { cfg = cf; canvas.setAttribute("aria-label", label(cf)); build(cf); }

  bloom.quaternion.copy(camera.quaternion);
  resize();
  setConfig(cfg);

  return {
    canvas, setConfig, setLit,
    rotateBy(r) { auto = false; yaw += r; invalidate(); },
    setYaw(r) { auto = false; vel = 0; yaw = r; invalidate(); },
    setPitch(r) { pitch = r; placeCamera(); bloom.quaternion.copy(camera.quaternion); invalidate(); },
    stats: () => ({ frames, firstFrameMs: firstFrame ? firstFrame - t0 : null, tris: info && info.tris, calls: renderer.info.render.calls, geometries: renderer.info.memory.geometries, textures: renderer.info.memory.textures, programs: renderer.info.programs ? renderer.info.programs.length : null, auto, running: !!raf, dpr: renderer.getPixelRatio(), total: info && info.total }),
    dispose() {
      dead = true; cancelAnimationFrame(raf); ro.disconnect(); io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      canvas.removeEventListener("pointerdown", down); canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerup", up); canvas.removeEventListener("pointercancel", up);
      canvas.removeEventListener("keydown", keyDown);
      canvas.removeEventListener("webglcontextlost", onLost); canvas.removeEventListener("webglcontextrestored", onRestored);
      disposeLamp();
      [wall, table, contact, pool, wallLight, halo, bloom].forEach((m) => m.material.dispose());
      wall.geometry.dispose(); table.geometry.dispose(); quad.dispose();
      layerTex.dispose(); ribTex.dispose();
      renderer.dispose(); renderer.forceContextLoss();
      canvas.remove();
    },
  };
}
