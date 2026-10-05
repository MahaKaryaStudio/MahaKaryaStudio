/*
 * GENERATOR VIDEO PROMO — lampu 3D realistis (three.js, WebGL).
 *
 * Menggambar lampu rakitan sebagai benda 3D dengan material PLA matte (garis lapisan
 * halus), kap yang bercahaya hangat dari dalam, bayangan lembut dari cahaya jendela,
 * bayangan kontak di bawah alas, dan tiga latar: studio putih (lemari abu-abu muda,
 * seperti foto produk), meja kayu gelap, meja kayu terang. Dimensi mengikuti proporsi
 * ilustrasi SVG website (1 cm = 6 unit SVG) sehingga susunan sama dengan konfigurator.
 *
 * API (dipakai video-scenes.js): window.MKSLamp3D = { ready: Promise, ok: boolean,
 *   render({cfg, lineup, W, H, scale, cx, bottom, h, w, dim, build, t, theme, room}) → canvas WebGL }
 *   cfg: lampu tunggal; lineup: [cfg…] deretan lampu (semua menyala), w = lebar deretan di layar.
 *   cx/bottom/h: posisi tengah, dasar, dan tinggi lampu di dalam frame W×H (piksel logis).
 *   theme: "studio" | "dark" | "light". room: false = latar transparan, hanya bayangan di meja.
 */
import * as T from "./vendor/three.bundle.min.js";

const U = 1 / 6; // unit SVG → cm
const api = { ok: false, ready: null, render: null, error: null, last: null };
window.MKSLamp3D = api;

function makeRenderer() {
  const canvas = document.createElement("canvas");
  const renderer = new T.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: false, powerPreference: "high-performance" });
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.VSMShadowMap;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.outputColorSpace = T.SRGBColorSpace;
  return renderer;
}

/* ---------- Tekstur prosedural ---------- */
function stripesTexture() {
  const c = document.createElement("canvas");
  c.width = 8;
  c.height = 64;
  const g = c.getContext("2d");
  const grad = g.createLinearGradient(0, 0, 0, 64);
  grad.addColorStop(0, "#808080");
  grad.addColorStop(0.45, "#a0a0a0");
  grad.addColorStop(0.55, "#606060");
  grad.addColorStop(1, "#808080");
  g.fillStyle = grad;
  g.fillRect(0, 0, 8, 64);
  const tx = new T.CanvasTexture(c);
  tx.wrapS = tx.wrapT = T.RepeatWrapping;
  return tx;
}
function woodTexture(light) {
  const c = document.createElement("canvas");
  c.width = c.height = 1024;
  const g = c.getContext("2d");
  const base = light ? ["#c9a675", "#b58e5c"] : ["#5a3a24", "#452a18"];
  const grad = g.createLinearGradient(0, 0, 1024, 1024);
  grad.addColorStop(0, base[0]);
  grad.addColorStop(1, base[1]);
  g.fillStyle = grad;
  g.fillRect(0, 0, 1024, 1024);
  let seed = 11;
  const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
  for (let i = 0; i < 260; i++) {
    const y0 = rnd() * 1024, amp = 4 + rnd() * 10, k = 0.004 + rnd() * 0.006, ph = rnd() * 10;
    g.strokeStyle = `rgba(${light ? "90,55,25" : "20,10,4"},${0.05 + rnd() * 0.14})`;
    g.lineWidth = 0.6 + rnd() * 2.2;
    g.beginPath();
    for (let x = 0; x <= 1024; x += 8) g.lineTo(x, y0 + Math.sin(x * k + ph) * amp + Math.sin(x * 0.02 + ph) * 2);
    g.stroke();
  }
  for (let i = 0; i < 9000; i++) {
    g.fillStyle = `rgba(${rnd() > 0.5 ? "255,240,220" : "0,0,0"},${0.02 + rnd() * 0.05})`;
    g.fillRect(rnd() * 1024, rnd() * 1024, 1 + rnd() * 2, 1);
  }
  const tx = new T.CanvasTexture(c);
  tx.wrapS = tx.wrapT = T.RepeatWrapping;
  tx.repeat.set(2.5, 2.5);
  tx.colorSpace = T.SRGBColorSpace;
  tx.anisotropy = 8;
  return tx;
}
function radialTexture(inner, outer) {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d");
  const r = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  r.addColorStop(0, inner);
  r.addColorStop(0.55, outer);
  r.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = r;
  g.fillRect(0, 0, 256, 256);
  return new T.CanvasTexture(c);
}
// Dinding studio: putih hangat dengan sedikit noise agar tidak terlihat "plastik"
function wallTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 512;
  const g = c.getContext("2d");
  g.fillStyle = "#ecebe7";
  g.fillRect(0, 0, 512, 512);
  let seed = 5;
  const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
  for (let i = 0; i < 30000; i++) {
    g.fillStyle = `rgba(${rnd() > 0.5 ? "255,255,255" : "120,110,100"},${0.03 + rnd() * 0.05})`;
    g.fillRect(rnd() * 512, rnd() * 512, 1.5, 1.5);
  }
  const tx = new T.CanvasTexture(c);
  tx.wrapS = tx.wrapT = T.RepeatWrapping;
  tx.repeat.set(4, 3);
  tx.colorSpace = T.SRGBColorSpace;
  return tx;
}

/* ---------- Geometri bagian ---------- */
function pleatedCylinder(r, h, pleats, depth) {
  const geo = new T.CylinderGeometry(r, r, h, pleats * 8, 1, true);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i);
    const th = Math.atan2(x, z);
    const k = 1 + depth * Math.cos(pleats * th);
    p.setX(i, x * k);
    p.setZ(i, z * k);
  }
  p.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}
function headGeometry(id) {
  if (id === "plisir") return { shade: pleatedCylinder(60 * U, 110 * U, 40, 0.06), h: 110 * U, rTop: 60 * U };
  if (id === "kerucut") return { shade: new T.CylinderGeometry(46 * U, 72 * U, 104 * U, 160, 1, true), h: 104 * U, rTop: 46 * U };
  const g = new T.CylinderGeometry(56 * U * Math.SQRT2, 56 * U * Math.SQRT2, 104 * U, 4, 1, true);
  g.rotateY(Math.PI / 4);
  return { shade: g, h: 104 * U, rTop: 56 * U };
}
function bodyGeometry(id) {
  if (id === "bola") { const g = new T.SphereGeometry(40 * U, 96, 64); g.scale(1, 34 / 40, 1); return { geo: g, h: 68 * U }; }
  if (id === "kubus") return { geo: new T.BoxGeometry(64 * U, 58 * U, 64 * U, 2, 2, 2), h: 58 * U };
  if (id === "cincin") { const g = new T.SphereGeometry(50 * U, 96, 48); g.scale(1, 19 / 50, 1); return { geo: g, h: 38 * U }; }
  if (id === "heksa") { const g = new T.CylinderGeometry(52 * U, 52 * U, 62 * U, 6, 1); g.rotateY(Math.PI / 6); return { geo: g, h: 62 * U }; }
  return { geo: new T.CylinderGeometry(34 * U, 34 * U, 50 * U, 96, 1), h: 50 * U };
}
function baseGeometries(id) {
  if (id === "bulat") return { parts: [{ geo: new T.CylinderGeometry(78 * U, 78 * U, 14 * U, 128, 1), y: 7 * U }], h: 14 * U, r: 78 * U };
  if (id === "segitiga") { const g = new T.CylinderGeometry((176 * U) / Math.sqrt(3), (176 * U) / Math.sqrt(3), 14 * U, 3, 1); g.rotateY(Math.PI / 3); return { parts: [{ geo: g, y: 7 * U }], h: 14 * U, r: 88 * U }; }
  if (id === "kotak") return { parts: [{ geo: new T.BoxGeometry(144 * U, 16 * U, 144 * U), y: 8 * U }], h: 16 * U, r: 80 * U };
  const parts = [{ geo: new T.CylinderGeometry(62 * U, 62 * U, 14 * U, 96, 1), y: 7 * U }];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const g = new T.CylinderGeometry(20 * U, 20 * U, 13.6 * U, 48, 1);
    g.translate(Math.cos(a) * 58 * U, 0, Math.sin(a) * 58 * U);
    parts.push({ geo: g, y: 6.8 * U });
  }
  return { parts, h: 14 * U, r: 80 * U };
}

/* ---------- Material ---------- */
let stripes = null, contactTex = null;
function plaMaterial(hex, h) {
  stripes = stripes || stripesTexture();
  const m = new T.MeshPhysicalMaterial({ color: new T.Color(hex), roughness: 0.66, metalness: 0, sheen: 0.12, sheenRoughness: 0.9, sheenColor: new T.Color(0xffffff) });
  m.bumpMap = stripes.clone();
  m.bumpMap.repeat.set(1, Math.max(8, Math.round(h / 0.08)));
  m.bumpMap.needsUpdate = true;
  m.bumpScale = 0.012;
  return m;
}
function shadeMaterial(hex) {
  const m = new T.MeshPhysicalMaterial({ color: new T.Color(hex), roughness: 0.8, metalness: 0, side: T.DoubleSide, emissive: new T.Color(0xffc98a), emissiveIntensity: 0 });
  const u = { uBulb: { value: new T.Vector3() }, uGlow: { value: 0 } };
  m.userData.u = u;
  m.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, u);
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vMksPos;")
      .replace("#include <worldpos_vertex>", "#include <worldpos_vertex>\nvMksPos = (modelMatrix * vec4(transformed, 1.0)).xyz;");
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vMksPos;\nuniform vec3 uBulb;\nuniform float uGlow;")
      .replace("#include <emissivemap_fragment>", "#include <emissivemap_fragment>\n{ float d = distance(vMksPos, uBulb); totalEmissiveRadiance = emissive * uGlow / (1.0 + d * d * 0.07); }");
  };
  return m;
}

/* ---------- Lampu dari konfigurasi ---------- */
function buildLamp(cfg) {
  const D = window.MKS_LAMP, A = window.LampArt;
  const hexOf = (id) => A.find(D.colors, id).hex;
  const group = new T.Group();
  const parts = []; // urutan perakitan: alas, badan…, soket, kap
  let y = 0;
  const base = baseGeometries(cfg.base.shape);
  const bm = plaMaterial(hexOf(cfg.base.color), base.h);
  const bg = new T.Group();
  base.parts.forEach((p) => { const m = new T.Mesh(p.geo, bm); m.position.y = p.y; m.castShadow = m.receiveShadow = true; bg.add(m); });
  // Bayangan kontak (ambient occlusion palsu) di bawah alas
  contactTex = contactTex || radialTexture("rgba(0,0,0,0.55)", "rgba(0,0,0,0.12)");
  const contactMat = new T.MeshBasicMaterial({ map: contactTex, transparent: true, depthWrite: false, opacity: 1 });
  contactMat.userData.alwaysTransparent = true;
  const contact = new T.Mesh(new T.PlaneGeometry(base.r * 2.8, base.r * 2.8), contactMat);
  contact.rotation.x = -Math.PI / 2;
  contact.position.y = 0.03;
  contact.renderOrder = -1;
  bg.add(contact);
  group.add(bg);
  parts.push(bg);
  y += base.h;
  cfg.body.forEach((b) => {
    const bd = bodyGeometry(b.shape);
    const m = new T.Mesh(bd.geo, plaMaterial(hexOf(b.color), bd.h));
    m.position.y = y + bd.h / 2;
    m.castShadow = m.receiveShadow = true;
    group.add(m);
    parts.push(m);
    y += bd.h;
  });
  const sockMat = new T.MeshStandardMaterial({ color: 0x3a3129, roughness: 0.55, metalness: 0.15 });
  const sock = new T.Mesh(new T.CylinderGeometry(10 * U, 10 * U, 16 * U, 48), sockMat);
  sock.position.y = y + 8 * U;
  sock.castShadow = true;
  group.add(sock);
  parts.push(sock);
  y += 16 * U;
  const hd = headGeometry(cfg.head.shape);
  const shadeHex = A.find(D.shadeColors, cfg.head.color).hex;
  const sm = shadeMaterial(shadeHex);
  const head = new T.Group();
  const shade = new T.Mesh(hd.shade, sm);
  shade.position.y = hd.h / 2;
  shade.castShadow = true;
  shade.receiveShadow = true;
  head.add(shade);
  const ring = new T.Mesh(new T.RingGeometry(11 * U, hd.rTop * (cfg.head.shape === "kotak" ? Math.SQRT2 : 1) - 0.02, 96), new T.MeshStandardMaterial({ color: new T.Color(shadeHex).multiplyScalar(0.92), roughness: 0.8, side: T.DoubleSide }));
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = hd.h - 0.05;
  head.add(ring);
  const fitting = new T.Mesh(new T.CylinderGeometry(10 * U, 10 * U, 6 * U, 48), sockMat);
  fitting.position.y = hd.h + 3 * U;
  head.add(fitting);
  const bulb = new T.Mesh(new T.SphereGeometry(3.2, 32, 24), new T.MeshStandardMaterial({ color: 0xfff1d6, emissive: 0xffe2b0, emissiveIntensity: 0, roughness: 0.3 }));
  bulb.position.y = hd.h * 0.55;
  head.add(bulb);
  // Cahaya lampu ini sendiri: titik (ke segala arah) + sorot ke bawah (kolam di meja)
  const point = new T.PointLight(0xffb45c, 0, 400, 2);
  point.position.y = hd.h * 0.5;
  head.add(point);
  const spot = new T.SpotLight(0xffb45c, 0, 300, Math.PI / 2.6, 0.8, 2);
  spot.position.y = hd.h * 0.5 - 2;
  head.add(spot);
  head.add(spot.target);
  spot.target.position.set(0, -y - hd.h, 0);
  head.position.y = y;
  group.add(head);
  parts.push(head);
  const total = y + hd.h + 6 * U;
  parts.forEach((p) => { p.userData.restY = p.position.y; });
  return { group, parts, total, shadeMat: sm, bulb, point, spot, headY: y, headH: hd.h, headCy: y + hd.h / 2, baseR: base.r };
}

/* ---------- Scene ---------- */
function setup() {
  const renderer = makeRenderer();
  const scene = new T.Scene();
  const pmrem = new T.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new T.RoomEnvironment(), 0.04).texture;
  pmrem.dispose();

  const camera = new T.PerspectiveCamera(24, 1, 1, 2000);
  const key = new T.DirectionalLight(0xfff3e4, 1);
  key.castShadow = true;
  // Frustum bayangan harus menutupi seluruh lantai yang terlihat: di luar frustum,
  // ShadowMaterial menganggap permukaan tertutup bayangan.
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.left = key.shadow.camera.bottom = -260;
  key.shadow.camera.right = key.shadow.camera.top = 260;
  key.shadow.camera.near = 10;
  key.shadow.camera.far = 700;
  key.shadow.bias = -0.0002;
  key.shadow.normalBias = 0.04;
  key.shadow.radius = 6;
  key.shadow.blurSamples = 12;
  scene.add(key);
  scene.add(key.target);
  const fill = new T.HemisphereLight(0xfff4e6, 0x3a2a1c, 0.4);
  scene.add(fill);

  const floorGeo = new T.PlaneGeometry(900, 600);
  const woodDark = new T.MeshPhysicalMaterial({ map: woodTexture(false), roughness: 0.45, metalness: 0, clearcoat: 0.25, clearcoatRoughness: 0.4 });
  const woodLight = new T.MeshPhysicalMaterial({ map: woodTexture(true), roughness: 0.5, metalness: 0, clearcoat: 0.2, clearcoatRoughness: 0.45 });
  const table = new T.Mesh(floorGeo, woodDark);
  table.rotation.x = -Math.PI / 2;
  table.receiveShadow = true;
  scene.add(table);
  const catcher = new T.Mesh(floorGeo, new T.ShadowMaterial({ opacity: 0.32 }));
  catcher.rotation.x = -Math.PI / 2;
  catcher.receiveShadow = true;
  scene.add(catcher);
  const wallDark = new T.MeshStandardMaterial({ color: 0x2b2119, roughness: 0.96 });
  const wallLight = new T.MeshStandardMaterial({ color: 0xd9ccb8, roughness: 0.96 });
  const wallStudio = new T.MeshStandardMaterial({ map: wallTexture(), roughness: 0.95 });
  const wall = new T.Mesh(new T.PlaneGeometry(1200, 600), wallDark);
  wall.position.set(0, 250, -90);
  wall.receiveShadow = true;
  scene.add(wall);

  // Lemari studio: bagian atas abu-abu muda, muka depan dengan pegangan laci
  const cabinet = new T.Group();
  const cabMat = new T.MeshPhysicalMaterial({ color: 0xcfcdc8, roughness: 0.55, metalness: 0, clearcoat: 0.15, clearcoatRoughness: 0.5 });
  const cabTop = new T.Mesh(new T.BoxGeometry(900, 3, 260), cabMat);
  cabTop.position.set(0, -1.5, -70);
  cabTop.receiveShadow = true;
  cabinet.add(cabTop);
  const cabBody = new T.Mesh(new T.BoxGeometry(900, 70, 254), new T.MeshStandardMaterial({ color: 0xc6c4bf, roughness: 0.7 }));
  cabBody.position.set(0, -38, -72);
  cabBody.receiveShadow = true;
  cabinet.add(cabBody);
  const handleMat = new T.MeshStandardMaterial({ color: 0xe8e6e1, roughness: 0.4, metalness: 0.3 });
  for (let i = -2; i <= 2; i++) {
    const hnd = new T.Mesh(new T.BoxGeometry(10, 1.4, 2.5), handleMat);
    hnd.position.set(i * 90, -12, 56.5);
    cabinet.add(hnd);
    const gap = new T.Mesh(new T.BoxGeometry(0.5, 60, 2), new T.MeshStandardMaterial({ color: 0xb9b7b2, roughness: 0.8 }));
    gap.position.set(i * 90 + 45, -40, 56);
    cabinet.add(gap);
  }
  const studioFloor = new T.Mesh(new T.PlaneGeometry(1200, 600), new T.MeshStandardMaterial({ color: 0xe3e1dc, roughness: 0.9 }));
  studioFloor.rotation.x = -Math.PI / 2;
  studioFloor.position.y = -73;
  cabinet.add(studioFloor);
  scene.add(cabinet);

  const cache = new Map();
  const shown = new Set();
  const vec = new T.Vector3();

  function lampFor(cfg) {
    const key = JSON.stringify([cfg.head, cfg.body, cfg.base]);
    if (!cache.has(key)) cache.set(key, buildLamp(cfg));
    return cache.get(key);
  }
  function setOpacity(obj, a) {
    obj.traverse((o) => {
      if (!o.isMesh) return;
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      mats.forEach((m) => { m.transparent = a < 0.999 || m.userData.alwaysTransparent; m.opacity = a; m.depthWrite = a > 0.05 && !m.userData.alwaysTransparent; });
      o.visible = a > 0.002;
    });
  }
  const easeOut = (t) => 1 - Math.pow(1 - Math.max(0, Math.min(1, t)), 3);
  function applyLamp(lamp, dim, build, light, studio) {
    const n = lamp.parts.length;
    lamp.parts.forEach((part, i) => {
      const e = easeOut(build * n - i);
      part.position.y = part.userData.restY + (1 - e) * 14;
      setOpacity(part, e);
    });
    lamp.group.updateMatrixWorld(true);
    lamp.shadeMat.userData.u.uBulb.value.setFromMatrixPosition(lamp.bulb.matrixWorld);
    lamp.shadeMat.userData.u.uGlow.value = dim * (studio ? 1.7 : 1.9);
    lamp.bulb.material.emissiveIntensity = dim * 6;
    lamp.point.intensity = dim * (studio ? 500 : light ? 900 : 1500);
    lamp.spot.intensity = dim * (studio ? 400 : light ? 700 : 1300);
  }

  api.render = function (p) {
    const { W, H } = p;
    const scale = p.scale || 1;
    const pw = Math.max(2, Math.round(W * scale)), ph = Math.max(2, Math.round(H * scale));
    if (renderer.domElement.width !== pw || renderer.domElement.height !== ph) renderer.setSize(pw, ph, false);
    const studio = p.theme === "studio";
    const light = p.theme !== "dark";
    const room = p.room !== false;
    const dim = p.dim == null ? 1 : p.dim;
    const build = p.build == null ? 1 : p.build;
    const t = p.t || 0;

    // Lampu yang ditampilkan: satu, atau deretan
    const cfgs = p.lineup && p.lineup.length ? p.lineup : [p.cfg];
    const lamps = cfgs.map(lampFor);
    shown.forEach((l) => { if (!lamps.includes(l)) { scene.remove(l.group); shown.delete(l); } });
    lamps.forEach((l) => { if (!shown.has(l)) { scene.add(l.group); shown.add(l); } });
    let rowW = 0, maxH = 0;
    if (lamps.length > 1) {
      const gap = 8;
      const widths = lamps.map((l) => Math.max(l.baseR * 2, 20));
      rowW = widths.reduce((s, w) => s + w, 0) + gap * (lamps.length - 1);
      let x = -rowW / 2;
      lamps.forEach((l, i) => { l.group.position.x = x + widths[i] / 2; x += widths[i] + gap; maxH = Math.max(maxH, l.total); });
    } else {
      lamps[0].group.position.x = 0;
      maxH = lamps[0].total;
    }
    lamps.forEach((l) => applyLamp(l, dim, lamps.length > 1 ? 1 : build, light, studio));

    // Lingkungan
    table.visible = room && !studio;
    wall.visible = room;
    cabinet.visible = room && studio;
    catcher.visible = !room;
    table.material = light ? woodLight : woodDark;
    wall.material = studio ? wallStudio : light ? wallLight : wallDark;
    scene.environmentIntensity = studio ? 0.45 : light ? 0.55 : 0.28;
    key.intensity = studio ? 1.25 : light ? 1.5 : 0.75;
    key.color.set(studio ? 0xffffff : 0xfff3e4);
    key.position.set(studio ? -90 : -70, studio ? 150 : 110, studio ? 160 : 70);
    fill.intensity = studio ? 0.55 : light ? 0.5 : 0.3;
    fill.color.set(studio ? 0xffffff : 0xfff4e6);
    fill.groundColor.set(studio ? 0xd0ccc4 : 0x3a2a1c);
    renderer.toneMappingExposure = studio ? 0.86 : 1.05;
    renderer.setClearColor(0x000000, 0);

    // Kamera: lampu setinggi h piksel (atau deretan selebar w piksel), dasar di `bottom`, tengah di `cx`
    const fov = camera.fov * (Math.PI / 180);
    camera.aspect = W / H;
    const az = 0.08 * Math.sin(t * 0.23), el = (studio ? 7 + 1.2 * Math.sin(t * 0.17) : 11 + 1.6 * Math.sin(t * 0.17)) * (Math.PI / 180);
    let d, ty, hPx = p.h;
    if (lamps.length > 1) {
      const tanH = Math.tan(fov / 2) * camera.aspect;
      d = ((rowW * 1.08 * W) / p.w / (2 * tanH)) * 1.02;
      ty = maxH * 0.45;
      hPx = (maxH / (2 * d * Math.tan(fov / 2))) * H;
    } else {
      d = ((maxH * H) / p.h / (2 * Math.tan(fov / 2))) * 1.02;
      ty = maxH * 0.5;
    }
    camera.position.set(Math.sin(az) * Math.cos(el) * d, ty + Math.sin(el) * d, Math.cos(az) * Math.cos(el) * d);
    camera.lookAt(0, ty, 0);
    camera.near = Math.max(1, d * 0.15);
    camera.far = d * 8;
    const cy = p.bottom - hPx / 2;
    camera.setViewOffset(W, H, W / 2 - p.cx, H / 2 - cy, W, H);
    renderer.render(scene, camera);

    // Posisi layar (piksel logis) untuk efek cahaya 2D
    const toScreen = (v) => { const q = v.clone().project(camera); return { x: ((q.x + 1) / 2) * W, y: ((1 - q.y) / 2) * H }; };
    api.last = {
      lamps: lamps.map((l) => ({ head: toScreen(vec.set(l.group.position.x, l.headCy, 0)), floor: toScreen(vec.set(l.group.position.x, 0, 0)), hPx: (l.total / (2 * d * Math.tan(fov / 2))) * H })),
      bulb: toScreen(vec.set(lamps[0].group.position.x, lamps[0].headCy, 0)),
      headCy: toScreen(vec.set(lamps[0].group.position.x, lamps[0].headCy, 0)),
      floor: toScreen(vec.set(0, 0, 0)),
    };
    return renderer.domElement;
  };
}

api.ready = new Promise((resolve) => {
  try {
    const test = document.createElement("canvas");
    const gl = test.getContext("webgl2") || test.getContext("webgl");
    if (!gl) throw new Error("WebGL tidak tersedia");
    setup();
    api.ok = true;
  } catch (e) {
    console.warn("Lampu 3D tidak aktif, memakai ilustrasi SVG:", e);
    api.error = e;
    api.ok = false;
  }
  resolve(api.ok);
});
