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
- `shoot.js`: tangkapan per seksi; `--vp=desktop,laptop,hp,hp360,hpshort` (juga `hp320` dan tablet `t820,t880,t1000,t1024`
  untuk breakpoint 760/1024), `--full`, `--reduce`, `--page=koleksi.html`.

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
  C8 status tekan setiap kontrol hero/#kenapa/#edisi/#tiga/#rakit/#alur/#paket/#bagian/nav/orderbar/toast (`:active` dipaksa lewat CDP, transisi dimatikan: ini simulasi, bukan pengganti uji ketuk di HP sungguhan) di empat
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
  muat ulang tetap tersimpan, katalog #bagian = ubin <button> + lembar bagian (swatch .swatch); C24
  panggung HP 260/200 (lampu tidak tertutup pil/saklar/label, pil dan saklar tidak bertumpuk) dan tidak lengket di
  tinggi 520; C15, C20 kalimat ringkasan >= 16 px, C11 pil studio; ARIA tabs + papan ketik; bagian SVG desktop; orderbar
  dan nav HP; panggung desktop/laptop lengket di nav + 24; `UKUR` tinggi #rakit terhadap brief.
- `c13-alur-bagian.js [--only=c12,jujur,c15,c16,c11,c9,c20,ukur,lembar,gerak,c8,saring,karusel,ekspor,rapi]`: 04 #alur dan
  06 #bagian: label "Simulasi alur pesan" terlihat di kepala seksi (390, 1440); teks #alur tanpa nama orang, pujian, emoji,
  pola resi; kolom desktop tanpa bingkai ponsel; C15 tanpa "konfigurator"/"—" (juga di lembar bagian) dan kepala kolom tanpa
  durasi; C16 HTML mentah tanpa "Rp" + angka; C11 pil thumb #alur, baris label #bagian, pil lembar; C9 chip saring, ubin,
  swatch, chip slot, tombol tutup (elementFromPoint di sudut kotak 44, jarak 8) di 390/360; C20 gelembung >= 16 px;
  `UKUR` tinggi #bagian 390 <= 2.600 dan #alur terhadap brief; lembar bagian (dialog modal berlabel, Escape + fokus kembali,
  orderbar tersembunyi, satu tombol berisi, Pasang + toast beraksi tanpa gulir otomatis, WA pesan satuan); gerak masuk
  250 / keluar 150 (reduce seketika); C8 kontrol lembar; chip saring dari lamp-data; karusel HP (snap, fokus + panah,
  intip, titik, tanpa gulir samping 320/360/390); C23 suntingan lama gelembung/.alur__note tidak muncul di halaman dan Ekspor.
  `rapi`: kartu karusel setinggi isi, nama di rincian utuh, pil thumb di atas tanpa role=img bersarang, chip saring muat
  (360) atau memudar di tepi (320), tombol sel penutup sejajar, warna lembar ikut ke ubin, toast sisa disembunyikan saat
  lembar dibuka, tombol lembar terlihat di 320 × 640.
- `c27-penutup.js [--only=c13,cara,c15,final,reduce,faq,c16,c9,heading,orderbar,footer,rapi,ukur]`: 07 #cara (empat langkah,
  isi >= 16 px dan <= 62ch, tanpa "15 menit" dan langkah WhatsApp tanpa durasi, spesifikasi <details> terbuka di desktop dan
  terlipat di HP, angka dari state), 10 .final (0 penulisan --dim sebelum panggung masuk layar walau ada mks:change, tepat 1
  sesudahnya, cahaya penuh, pil ILUSTRASI, keterangan harga ikut mks:change, reduce sudah menyala), 09 #faq (12 entri, 6 + tombol
  "Lihat 6 pertanyaan lain", fokus ke pertanyaan ketujuh, terbuka seketika, ikon 150 ms, semua tampil di Mode Edit), C16 tanpa
  JS (FAQ dan kalimat SNI terbaca), C9 footer/#faq/#cara >= 44 di 390 dan 360, heading tanpa loncatan, orderbar tersembunyi
  di .final dan footer, footer (legal, catatan video AI, "Studio rakit", logotype 40, WA + nomor + Salin), `rapi` (panggung .final 420:480, pemisah legal di depan span, summary spesifikasi bisa diklik di Mode Edit, email ber-wbr, baris WA dan Jelajah dua kolom di HP, WA .final 56), `UKUR` tinggi.
  C7, C8, C10 seksi ini lewat c04 (SEKSI memuat #cara–footer), garis #cara lewat c06.
- `c21-koleksi.js [--only=c21,ongkir,c11,c13,c14,c16,c19,c9,berisi,c23,edit,tinggi]`: koleksi.html (langkah koleksi-qa): C21 tanpa
  pita promo, gelembung WA, animasi berjalan, @keyframes float, nomor 01–04; di 390 × 664 gambar hero utuh dan tepat satu aksi
  WA di layar pertama; saklar `freeShipping` false = tanpa "gratis ongkir" di halaman dan keranjang berisi (true = bilah scaleX);
  C11 pil ILUSTRASI hero/kartu/modal + legal footer; C13; C14 harga kartu, modal, subtotal = products.js; C16 HTML mentah, satu
  noscript, href WA awal saat main.js diblokir, tanpa JS terbaca; C19 tanpa gulir samping di 320/360/390/820/1024/1440 (koleksi
  dan index); C9 kontrol >= 44 di 390/360 (juga modal); satu tombol berisi per layar; C23 suntingan lama koleksi (tahap 11);
  Mode Edit koleksi (teks, Produk, Ekspor); `tinggi` halaman index 390 <= 16.500.
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
