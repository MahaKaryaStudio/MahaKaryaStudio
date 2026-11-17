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
node tools/qa/shoot.js http://localhost:8800/ <folder-tangkapan> --vp=desktop,hp --sel="#edisi,#tiga"
```

- `v3-invariants.js`: harga lima edisi dan tiga paket, harga coret, kalimat SNI, pil
  ILUSTRASI, label video AI, satu tombol utama per layar, dan seterusnya.
- `c02-taps.js`: mengukur berapa ketukan yang hilang setelah ganti edisi.
- `shoot.js`: tangkapan per seksi; `--vp=desktop,laptop,hp,hp360,hpshort`, `--full`,
  `--reduce`, `--page=koleksi.html`.

Cek adendum v3.1 (`cNN-*.js <url>`, keluar 0 bila lulus; `_lib.js` hanya pembantu bersama):

- `c01-gerak-hapus.js`: C1 (tanpa penulisan style per frame pada .story, #hero-stage, <html>; `--story-p`,
  `--nav-offset`, reveal dan hint hero tidak ada di sumber), C4 (hero menyala sekali ≤ 1,2 s tanpa gulir), C5 (tanpa
  teks ber-opasitas 0 di luar daftar pengecualian), C17 (reduce: tanpa animasi, cerita bertumpuk), garis #cara
  scaleY, kalimat cerita keluar −12 px 250 ms, perubahan prefers-reduced-motion selama kunjungan.
- `c12-tombol-berisi.js`: paling banyak satu tombol berisi per layar sepanjang gulir 390/1440, setelah mks:change,
  saat menu dibuka/ditutup, dan setelah ganti lebar.
- `c18-scroll.js [--rate=4]` (lewat `serve-gz.js`): biaya gaya per frame pin #kenapa dan nav sembunyi/muncul
  dengan CPU 4x (angka lab; tiga lintasan karena derau ±3 ms).
- `c24-sticky.js [--shots=<folder>]`: top panggung lengket tetap saat nav berganti (1440, 1366); di HP nav tidak
  menutupi panggung #rakit.
- `c06-layout-props.js [--sel="#tiga,#pita"]`: hanya transform, opacity, warna, box-shadow, dan visibility
  yang dianimasikan di seksi yang sudah dibangun (daftar `SEKSI` di skrip bertambah per langkah).
- `c11-ilustrasi.js [--only=tiga,hero]`: setiap gambar lampu berlabel ilustrasi, di empat ukuran layar.
- `c15-istilah.js [--scope="#tiga,#pita"]`: tanpa "—", "konfigurator", Head/Body/Base di teks terlihat.
- `c20-tipografi.js [--page=koleksi.html]`: tidak ada teks < 12 px dan tidak ada bobot ≥ 700.
- `c23-edit-migrasi.js`: suntingan Mode Edit di alamat lama tidak menimpa teks baru (tahap `STAGES` di
  `editor.js`); kasus bertambah di langkah yang mengubah teks dasar.
- `c90-tiga-pita.js`: tata letak dan perilaku 02 #tiga dan pita (lembar gambar kerja, baris aktif
  termasuk gulir berbalik dan lompatan, panggung lengket, lembar ringkas di tablet dan HP mendatar,
  angka meta dari lamp-data dan token atomiknya di Mode Edit, pil dan label lembar ringkas sejajar margin halaman sampai 320, pita tiga baris tanpa gerak dan tahan teks suntingan). Baris `UKUR`
  melaporkan tinggi seksi terhadap angka brief saja (selisih dicatat sebagai deviasi di laporan langkah).

Angka waktu dari skrip ini berasal dari Chromium ter-throttle, bukan HP sungguhan.
