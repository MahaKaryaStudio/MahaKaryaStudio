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

Cek adendum v3.1 (`cNN-*.js <url>`, keluar 0 bila lulus; `_lib.js` hanya pembantu bersama):

- `c06-layout-props.js [--sel="#tiga,#pita"]`: hanya transform, opacity, warna, box-shadow, dan visibility
  yang dianimasikan di seksi yang sudah dibangun (daftar `SEKSI` di skrip bertambah per langkah).
- `c11-ilustrasi.js [--only=tiga,hero]`: setiap gambar lampu berlabel ilustrasi, di empat ukuran layar.
- `c15-istilah.js [--scope="#tiga,#pita"]`: tanpa "—", "konfigurator", Head/Body/Base di teks terlihat.
- `c20-tipografi.js [--page=koleksi.html]`: tidak ada teks < 12 px dan tidak ada bobot ≥ 700.
- `c23-edit-migrasi.js`: suntingan Mode Edit di alamat lama tidak menimpa teks baru (tahap `STAGES` di
  `editor.js`); kasus bertambah di langkah yang mengubah teks dasar.
- `c90-tiga-pita.js`: tata letak dan perilaku 02 #tiga dan pita (lembar gambar kerja, baris aktif
  termasuk gulir berbalik dan lompatan, panggung lengket, lembar ringkas di tablet dan HP mendatar,
  angka meta dari lamp-data, pita tiga baris tanpa gerak dan tahan teks suntingan). Baris `UKUR`
  melaporkan tinggi seksi terhadap brief; `CATATAN` menjelaskan selisih yang sudah diterima.

Angka waktu dari skrip ini berasal dari Chromium ter-throttle, bukan HP sungguhan.
