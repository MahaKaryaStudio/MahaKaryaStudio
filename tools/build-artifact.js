#!/usr/bin/env node
/*
 * Menyiapkan folder dist/artifact untuk dipublikasikan sebagai artifact claude.ai
 * dengan Mode Edit selalu aktif di kedua halaman:
 *   - index.html   : isi halaman tanpa <html>/<head>/<body> (format halaman artifact)
 *   - koleksi.html : dokumen lengkap (dilayani apa adanya)
 *   - assets/      : CSS, JS, gambar (disalin)
 * Template asli tiap halaman disisipkan agar tab "Ekspor" menghasilkan file dalam format repo.
 *
 *   node tools/build-artifact.js
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const out = path.join(root, "dist", "artifact");
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");
const jsString = (s) => JSON.stringify(s).replace(/<\/script/gi, "<\\/script");
const boot = (page, template) => `<script>window.MKS_EDITOR_ALWAYS = true; window.MKS_PAGE = ${JSON.stringify(page)}; window.MKS_TEMPLATE = ${jsString(template)};</script>`;

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });

// Halaman utama → format artifact (tanpa kerangka dokumen)
const index = read("index.html");
const head = index.match(/<head>([\s\S]*)<\/head>/)[1];
const headKeep = [...head.matchAll(/<link[^>]+(?:fonts\.googleapis\.com|rel="stylesheet")[^>]*>/g)].map((m) => m[0]).join("\n");
let body = index.match(/<body[^>]*>([\s\S]*)<\/body>/)[1];
body = body.replace(/(\s*)(<script src="assets\/js\/config\.js"><\/script>)/, `$1${boot("index.html", index)}$1$2`);
fs.writeFileSync(path.join(out, "index.html"), `<title>MahaKarya Studio Editor</title>\n${headKeep}\n${body}\n`);

// Halaman koleksi → dokumen lengkap + boot Mode Edit
const koleksi = read("koleksi.html");
fs.writeFileSync(path.join(out, "koleksi.html"), koleksi.replace(/(\s*)(<script src="assets\/js\/config\.js"><\/script>)/, `$1${boot("koleksi.html", koleksi)}$1$2`));

// Aset
fs.cpSync(path.join(root, "assets"), path.join(out, "assets"), { recursive: true });

const files = [];
(function walk(dir) {
  fs.readdirSync(dir, { withFileTypes: true }).forEach((d) => {
    const p = path.join(dir, d.name);
    if (d.isDirectory()) walk(p);
    else if (path.relative(out, p) !== "index.html") files.push(path.relative(out, p));
  });
})(out);
fs.writeFileSync(path.join(out, "files.json"), JSON.stringify(files.filter((f) => f !== "files.json"), null, 2));
console.log(`ditulis: ${out}\n  index.html + ${files.length} file pendukung (daftar di files.json)`);
