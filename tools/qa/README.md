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
  `--nav-offset`, reveal dan hint hero tidak ada di sumber), C4 (hero menyala sekali: --dim dan opasitas lapisan cahaya penuh ≤ 1,2 s tanpa gulir, transisi 600 ms + delay 200 ms), C5 (tanpa
  teks ber-opasitas 0 di luar daftar pengecualian), C17 (reduce: tanpa animasi, cerita bertumpuk), garis #cara
  scaleY, kalimat cerita keluar −12 px 250 ms, perubahan prefers-reduced-motion selama kunjungan.
- `c03-gerak-edisi.js`: 01 #edisi tanpa View Transition (K2): crossfade panggung (baru 250 ms di atas hantu utuh,
  hantu pudar 150 ms setelah delay 200; cakupan cahaya per frame >= 0,9), harga crossfade 150 ms dari 0,4, plakat
  seketika; C3 panah/spasi di indeks tanpa animasi di seluruh dokumen (harga dan chip delta nav/orderbar), juga di
  halaman baru sebelum ketukan apa pun; Tab tidak menandai papan ketik; C10 #edisi biasa dan
  reduce; C17; 20 ganti cepat (paling banyak dua lampu, tanpa id ganda, tangkapan sama dengan render tunggal);
  C20 catatan kit ≥ 16 px di HP; C13 kalimat kit dan daftar izin SNI; C14 harga/coret/pesan WA lima edisi dan
  'Pilihan studio' tepat sekali dan terlihat di setiap edisi. C2 (ketukan beruntun) tetap di `c02-taps.js`.
- `c04-gerak-sentuh.js [--only=token,c7,c8,c10,c11,c16,c13,c23,c14,toast]`: token gerak dan pendamping, tabel
  breakpoint di kepala base.css; C7 hover digerbang `(hover: hover) and (pointer: fine)` dan hanya pada yang bisa diklik (aturan nav/menu ikut dipindai walau tak cocok elemen di index);
  C8 status tekan setiap kontrol hero/#kenapa/#edisi/#tiga/#rakit/#paket/nav/orderbar/toast (`:active` dipaksa lewat CDP, transisi dimatikan: ini simulasi, bukan pengganti uji ketuk di HP sungguhan) di empat
  ukuran layar, biasa (transform atau warna) dan reduce (wajib warna/latar/opacity/box-shadow); C10 durasi dan delay pada
  token (biasa dan reduce); C11 label ILUSTRASI tabel #paket dan baris #bagian; C16 tanpa harga ketikan dan `wa.me/` di
  HTML mentah index/404, satu noscript, href WA awal dari config.js saat lamp.js diblokir; C13; C23 baris label #bagian
  (Mode Edit dan Ekspor); C14 terhadap snapshot `data/c14-gerak-sentuh.json` (pesan `[data-wa]` dibandingkan sebagai himpunan
  pesan unik sejak langkah rakit menghapus tautan WA ringkasan HP kedua yang pesannya sama); toast 3 s / 5 s / jeda saat hover dan fokus.
- `c04-snap-c14.js <url> --tulis`: menulis snapshot C14 (harga, coret, pesan WA lima edisi, semua `[data-wa]`) pada commit
  dasar langkah; dipakai c04.
- `c05-rakit-ketuk.js [--rate=4] [--n=5] [--vp=hp,desktop] [--only=waktu,beruntun] [--json]`: gerbang frekuensi 03 #rakit
  (CPU 4x, median 5): tanda terpilih tercat <= 100 ms, lampu baru tercat <= 150 ms (warna) / <= 200 ms (bentuk, edisi), harga
  berganti bersama tanda; 10 ketukan swatch berjarak 80 ms tanpa frame lampu kosong/pudar dan harga akhir benar; dua ketukan
  berjarak 100 ms keduanya masuk. "Tercat" = tugas pertama sesudah frame tempat perubahan terlihat (batas atas).
- `c09-rakit-tata.js [--only=c8,c9,c19,c24,teks,tab,fungsi,lengket,ukur]`: 03 #rakit: C8 semua kontrol di empat tab dan rincian;
  C9 area tekan 44 × 44 (elementFromPoint) dan jarak visual 8 di 390/360; C19 tanpa gulir samping 320/360/390, isi
  panel tidak meluber dari kotaknya, kode rakitan hanya patah di tanda hubung; `fungsi` fokus tetap di Hapus, ketuk lalu
  muat ulang tetap tersimpan, katalog #bagian tetap swatch 24 dan tombol pil; C24
  panggung HP 260/200 (lampu tidak tertutup pil/saklar/label, pil dan saklar tidak bertumpuk) dan tidak lengket di
  tinggi 520; C15, C20 kalimat ringkasan >= 16 px, C11 pil studio; ARIA tabs + papan ketik; bagian SVG desktop; orderbar
  dan nav HP; panggung desktop/laptop lengket di nav + 24; `UKUR` tinggi #rakit terhadap brief.
- `c12-tombol-berisi.js`: paling banyak satu tombol berisi per layar sepanjang gulir 390/1440, setelah mks:change,
  saat menu dibuka/ditutup, dan setelah ganti lebar. Tombol di bawah panggung + tab studio yang lengket di tepi atas
  (HP) dihitung tertutup, sama seperti di bawah nav (rantai dari tepi atas: panggung lalu tab tepat di bawahnya).
- `c18-scroll.js [--rate=4]` (lewat `serve-gz.js`): biaya gaya per frame pin #kenapa dan nav sembunyi/muncul
  dengan CPU 4x (angka lab; tiga lintasan karena derau ±3 ms).
- `c24-sticky.js [--shots=<folder>]`: top panggung lengket tetap saat nav berganti (1440, 1366; .edisi__stage,
  .tiga__fig, .studio__stage); di HP nav tidak menutupi panggung #rakit, panggung lengket tanpa celah di atasnya.
- `c06-layout-props.js [--sel="#tiga,#pita"]`: hanya transform, opacity, warna, box-shadow, dan visibility
  yang dianimasikan di seksi yang sudah dibangun (daftar `SEKSI` di skrip bertambah per langkah).
- `c11-ilustrasi.js [--only=tiga,hero]`: setiap gambar lampu berlabel ilustrasi, di empat ukuran layar.
- `c15-istilah.js [--scope="#tiga,#pita"]`: tanpa "—", "konfigurator", Head/Body/Base di teks terlihat.
- `c20-tipografi.js [--page=koleksi.html]`: tidak ada teks < 12 px dan tidak ada bobot ≥ 700.
- `c23-edit-migrasi.js`: suntingan Mode Edit di alamat lama tidak menimpa teks baru (tahap `STAGES` di
  `editor.js`); kasus bertambah di langkah yang mengubah teks dasar.
- `c90-tiga-pita.js`: tata letak dan perilaku 02 #tiga dan pita (lembar gambar kerja, baris aktif
  termasuk gulir berbalik dan lompatan, panggung lengket, lembar ringkas di tablet dan HP mendatar,
  angka meta dari lamp-data dan token atomiknya di Mode Edit, pil dan label lembar ringkas sejajar margin halaman sampai 320, tanpa gulir samping 390/360/320, pita tiga baris tanpa gerak dan tahan teks suntingan). Baris `UKUR`
  melaporkan tinggi seksi terhadap angka brief saja (selisih dicatat sebagai deviasi di laporan langkah).

Angka waktu dari skrip ini berasal dari Chromium ter-throttle, bukan HP sungguhan.
