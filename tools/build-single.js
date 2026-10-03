#!/usr/bin/env node
/*
 * Menggabungkan website menjadi SATU file HTML (tanpa <html>/<head>/<body>)
 * untuk dipublikasikan sebagai artifact claude.ai dengan Mode Edit aktif.
 *
 *   node tools/build-single.js [output.html]
 *
 * Template index.html asli disertakan agar tab "Ekspor" bisa menghasilkan
 * index.html dalam format repo.
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");
const out = process.argv[2] || path.join(root, "dist", "editor.html");

const index = read("index.html");
const fonts = (index.match(/<link[^>]+fonts\.googleapis\.com\/css2[^>]*>/) || [""])[0];
let body = index.match(/<body>([\s\S]*)<\/body>/)[1];
body = body.replace(/\s*<script src="assets\/js\/[^"]+"><\/script>/g, "");

const inlineScript = (p) => `<script data-src="${p}">\n${read(p).replace(/<\/script/gi, "<\\/script")}\n</script>`;
const template = JSON.stringify(index).replace(/<\/script/gi, "<\\/script");

const html = `<title>MahaKarya Studio Editor</title>
${fonts}
<style data-src="assets/css/style.css">
${read("assets/css/style.css")}
</style>
${body}
<script>window.MKS_EDITOR_ALWAYS = true; window.MKS_TEMPLATE = ${template};</script>
${["assets/js/config.js", "assets/js/products.js", "assets/js/art.js", "assets/js/editor.js", "assets/js/main.js"].map(inlineScript).join("\n")}
`;

fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, html);
console.log(`ditulis: ${out} (${(html.length / 1024).toFixed(0)} KB)`);
