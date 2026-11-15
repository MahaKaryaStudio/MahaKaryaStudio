# Alat cek (QA)

Skrip Node untuk memeriksa situs di Chromium lewat Playwright. Folder `tools/` tidak ikut
tayang (dikecualikan di `.github/workflows/pages.yml`) dan tidak ikut build artifact.

Butuh `playwright` yang bisa di-`require` dan Chromium di `/opt/pw-browsers/chromium`
(ubah `executablePath` di skrip bila lokasinya lain).

```sh
node tools/qa/serve.js . 8800 &                      # layani repo tanpa kompresi
node tools/qa/serve-gz.js . 8801 &                   # sama, dengan gzip (untuk ukur transfer)
node tools/qa/v3-invariants.js http://localhost:8800/   # gerbang invarian: harus 40/40
node tools/qa/c02-taps.js .                             # ketukan beruntun setelah ganti edisi (tanpa server)
node tools/qa/shoot.js http://localhost:8800/ /tmp/shots --vp=desktop,hp --sel="#edisi,#tiga"
```

- `v3-invariants.js`: harga lima edisi dan tiga paket, harga coret, kalimat SNI, pil
  ILUSTRASI, label video AI, satu tombol utama per layar, dan seterusnya.
- `c02-taps.js`: mengukur berapa ketukan yang hilang setelah ganti edisi.
- `shoot.js`: tangkapan per seksi; `--vp=desktop,laptop,hp,hp360,hpshort`, `--full`,
  `--reduce`, `--page=koleksi.html`.

Angka waktu dari skrip ini berasal dari Chromium ter-throttle, bukan HP sungguhan.
