// Server statis dengan gzip (untuk pengukuran jaringan yang wajar). node serve-gz.js <dir> <port> [--pages]
// --pages: tajuk cache seperti GitHub Pages (cache-control max-age=600 + ETag, 304 untuk If-None-Match yang cocok);
//          dengan --pages=0 max-age 0, setara kunjungan kedua setelah 10 menit (semua berkas divalidasi ulang).
const http = require('http'), fs = require('fs'), path = require('path'), zlib = require('zlib'), crypto = require('crypto');
const root = path.resolve(process.argv[2]), port = +process.argv[3];
const pagesArg = process.argv.find((a) => a.startsWith('--pages'));
const maxAge = pagesArg ? (pagesArg.includes('=') ? +pagesArg.split('=')[1] : 600) : null;
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.json': 'application/json', '.woff2': 'font/woff2', '.webm': 'video/webm', '.mp4': 'video/mp4' };
const cache = new Map();
http.createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html';
  const f = path.join(root, p);
  if (!f.startsWith(root)) { s.writeHead(403); return s.end(); }
  fs.readFile(f, (e, d) => {
    if (e) { s.writeHead(404); return s.end('nf'); }
    const h = { 'content-type': mime[path.extname(f)] || 'application/octet-stream', 'cache-control': maxAge == null ? 'no-store' : `max-age=${maxAge}` };
    if (maxAge != null) {
      const tag = '"' + crypto.createHash('md5').update(d).digest('hex').slice(0, 16) + '"';
      h.etag = tag; h.vary = 'Accept-Encoding';
      if (q.headers['if-none-match'] === tag) { s.writeHead(304, h); return s.end(); }
    }
    if (/\.(html|js|css|svg|json)$/.test(f) && /gzip/.test(q.headers['accept-encoding'] || '')) {
      const st = fs.statSync(f).mtimeMs, key = f + st; let z = cache.get(key); if (!z) { z = zlib.gzipSync(d, { level: 9 }); cache.set(key, z); }
      h['content-encoding'] = 'gzip'; h['content-length'] = z.length; s.writeHead(200, h); return s.end(z);
    }
    h['content-length'] = d.length; s.writeHead(200, h); s.end(d);
  });
}).listen(port, '127.0.0.1');
