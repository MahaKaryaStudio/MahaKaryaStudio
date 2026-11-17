# MahaKarya Studio — Website

Website toko untuk bisnis **lampu meja 3D print yang dirakit sendiri oleh pembeli** (kap + badan + alas, tiap bagian pilih bentuk dan warna), plus katalog dekorasi bermotif Nusantara sebagai lini kedua.
Website statis (HTML/CSS/JS murni), tanpa build dan tanpa server. Buka `index.html` atau deploy ke GitHub Pages / Netlify / Vercel.

## Halaman

| File | Isi |
|---|---|
| `index.html` | **Lampu rakitan** ("Galeri Nyala" v3): hero dengan lampu yang menyala sekali setelah tergambar, cerita tiga kalimat, 01 Lima edisi, 02 gambar kerja tiga bagian, pita "Dicetak satu per satu", 03 studio rakit (tab Kap/Badan/Alas/Listrik, rincian harga, Janji kami), 04 simulasi alur pesan WhatsApp, 05 paket 3/4/5 bagian, 06 bagian satuan + lembar bagian, 07 cara pesan + spesifikasi, 08 keamanan, 09 tanya jawab, 10 konsultasi dengan rakitan pengunjung, footer |
| `koleksi.html` | **Koleksi Nusantara**: katalog vas/lampu/pot/panel, keranjang → WhatsApp, estimator pesanan custom, B2B, material, FAQ |
| `admin.html` | Admin WA internal (lihat di bawah) |
| `404.html` | Halaman tidak ditemukan (jalur aset mutlak `/MahaKaryaStudio/` untuk GitHub Pages) |

## Struktur kode dan sistem desain

| Berkas | Isi |
|---|---|
| `assets/css/base.css` | Dimuat pertama di kedua halaman. Token (warna, tipe, spasi, radius, bayangan, z, gerak), tema `.paper` / `.paper-2` / `.dark` / `.dark-2`, tipografi dasar, cincin fokus, komponen inti: `.btn` (`--primary`, `--ghost`, `--ghost-dark`, `--wa`, `--sm`, `--lg`), `.chip`, `.label`/`.eyebrow`, `.badge`, `.pill` (label ILUSTRASI), `.segmented`, `.tabs`, `.swatch`, `.switch`, `.select`, `.toast`, `.price-block`. Kepalanya memuat tabel breakpoint dan sistem gerak. |
| `assets/css/style.css` | Gaya bersama index + koleksi + 404: seksi, nav (terang koleksi, `.nav--float` index), menu HP, FAQ, `.final`, footer. |
| `assets/css/lamp.css` | Seksi index (hero, cerita, edisi, #tiga, pita, studio rakit, alur, paket, bagian, cara, aman), panggung lampu, orderbar. |
| `assets/css/koleksi.css` | Seksi khusus koleksi (hero, baris "Kenapa", katalog, estimator, bisnis, proses, material, modal, keranjang). |
| `assets/css/motion.css` | Gerak yang digosok gulir (garis #cara, baris aktif #tiga, garis bawah nav koleksi). |
| `assets/js/lamp.js`, `lamp-art.js` | Studio rakit dan render ilustrasi lampu (`window.MKSLamp`, event `mks:change`). |
| `assets/js/main.js`, `art.js` | Katalog, keranjang, estimator koleksi; ilustrasi produk. |
| `assets/js/nav.js`, `motion.js` | Nav, menu, orderbar; penjadwal gerak satu requestAnimationFrame. |
| `assets/js/editor.js`, `editor-lamp.js` | Mode Edit (`#edit`). |

Aturan yang dijaga di kode: breakpoint dua batas **760** dan **1024** (≤ 1023 tata letak HP, 761–1023 wadah isi maks 720 px, ≥ 1024 desktop; pengecualian tercatat di komentar CSS), token gerak 100/150/250/600 ms dengan satu kurva, hover hanya untuk pointer halus, setiap kontrol punya status tekan tanpa gerak, tidak ada teks di bawah 12 px dan tidak ada bobot 700, harga dan nomor WhatsApp tidak diketik di HTML (placeholder "Rp —"; `href` WA awal dibuat dari `config.js`).

Pemeriksaan: `tools/qa/` (Playwright; lihat `tools/qa/README.md`), termasuk gerbang invarian `v3-invariants.js`. Aturan keras proyek untuk asisten kode ada di `.claude/skills/aturan-proyek/SKILL.md`; skill lain di `.claude/skills/` hanya rujukan praktik. `tools/` dan `.claude/` tidak ikut tayang.

Video latar hero: `assets/video/proses-lampu.webm` + `.mp4` (lanskap, 8 detik, tanpa suara) dan `proses-lampu-tegak.*` (potongan 3:4 untuk HP), masing-masing dengan poster `.jpg`; tombol jeda tersedia. Saat ini video ilustrasi buatan AI dan diberi label demikian di halaman; ganti dengan rekaman produk asli dengan nama file yang sama, lalu hapus kalimat labelnya lewat Mode Edit tab Teks.

Data: `assets/js/config.js` (kontak, janji waktu balas, alamat/NIB, perkiraan ongkir per zona, gratis ongkir, estimator), `assets/js/lamp-data.js` (bentuk, warna, harga, paket, kit kelistrikan, waktu produksi, preset populer, foto bagian lampu), `assets/js/products.js` (katalog koleksi).

Keputusan harga & produk (dari riset pasar di `reports/`, ringkasnya):
- Harga paket lampu diposisikan Rp375–465 ribu (di antara lampu IKEA dan pesaing lokal 3D print), bagian satuan Rp65–229 ribu, diskon paket 15/22/28%. Bohlam LED (≤5 W) dan **kit kelistrikan (komponen bertanda SNI/K3L)** adalah baris terpisah; lampu bisa dipesan "hanya bagian cetak". Website tidak pernah menyebut lampu rakitan "ber-SNI".
- Konfigurator dibuka dengan edisi "Pilihan studio" (label editorial, bukan klaim penjualan); di HP panel ubah bentuk dilipat. Waktu produksi tampil per varian: preset/berstok vs custom.
- Perkiraan ongkir per zona dan perkiraan total tampil sebelum tombol WhatsApp; angkanya contoh, samakan dengan tarif kurir.
- Rakitan tersimpan di browser dan dipulihkan saat kembali; tombol **Bagikan rakitan** membuat tautan `?kode=MK-…&zona=…` yang membuka konfigurator dengan rakitan itu (alamat halaman ikut berubah saat merakit). **Kirim sebagai kado**: nama penerima, pesan kartu, tanpa harga di paket, ikut terkirim di pesan WhatsApp dan terbaca oleh `admin.html`.

## Isi halaman koleksi

| Bagian | Fungsi bisnis |
|---|---|
| Hero + "Kenapa bukan 3D print biasa" | Posisi pasar: desain orisinal bermotif lokal, personalisasi, produksi sesuai pesanan. Tidak bersaing harga dengan penjual file unduhan gratis |
| Koleksi + filter + detail produk | Katalog. Ilustrasi SVG dibuat otomatis sampai foto asli tersedia |
| Keranjang → WhatsApp | Checkout lewat chat, kanal penjualan utama di Indonesia. Indikator gratis ongkir untuk menaikkan nilai order hanya tampil bila `freeShipping: true` di `config.js` (matikan bila tidak berlaku) |
| Estimator custom | Calon pembeli bisa menghitung harga sendiri, lalu kirim spesifikasi ke WhatsApp. Pesanan custom punya margin lebih tinggi |
| Untuk bisnis (B2B) | Souvenir korporat, kafe/hotel, desainer interior. Sumber pesanan berulang dan volume |
| Material (jujur soal PLA) | Menurunkan komplain dan retur; membangun kepercayaan |
| FAQ, garansi kirim | Menjawab keberatan pembeli sebelum ditanyakan |

## Yang WAJIB diganti sebelum live

1. **`assets/js/config.js`**: link Tokopedia/Shopee, alamat studio, NIB, tarif ongkir per zona. (WhatsApp, Instagram, email, dan kota sudah diisi.)
2. **Harga di `lamp-data.js`, `config.js`, dan `products.js`**: ini **asumsi**, belum dihitung dari biaya riil. Hitung ulang dari:
   `harga filamen per gram × berat + jam mesin × (listrik + penyusutan printer) + finishing + packing + margin + potongan marketplace`.
3. **Foto produk**: lampu → unggah per bagian lewat Mode Edit tab "Lampu" (atau isi `photos` di `lamp-data.js`); koleksi → field `image` di `products.js`. Foto asli jauh lebih meyakinkan daripada ilustrasi.
4. **Kebijakan** (garansi, DP 50%, lead time, daur ulang produk lama): pastikan semuanya memang sanggup Anda jalankan.

## Admin WA (`admin.html`)

Halaman khusus admin (tidak ditautkan dari halaman publik, `noindex`, dilarang di `robots.txt`). Tempel pesan WhatsApp dari pembeli → kode rakitan diurai, harga dihitung ulang dari `lamp-data.js`, pesanan disimpan di browser (localStorage) dengan alur status Baru → Konfirmasi → Tunggu bayar → Cetak → Dikirim → Selesai, tiap status punya balasan siap salin / buka chat WA. Unduh CSV untuk tab Pesanan di `ops/Operasional_MahaKarya.xlsx` (satu workbook: Dashboard, Pesanan, Kas, Stok, Kartu_Stok, Panduan; impor ke Google Sheets lewat File → Import), unduh JSON sebagai cadangan. Ritme harian/mingguan/bulanan ada di tab Panduan. Pengaturan WhatsApp Business, label, alur, dan teks quick reply ada di `ops/wa-quick-replies.md`.

## Mode Edit (ubah isi website tanpa coding)

Buka halaman mana pun dengan `#edit` di akhir alamat, misalnya `https://mahakaryastudio.github.io/MahaKaryaStudio/#edit` atau `.../koleksi.html#edit`. Muncul panel di kanan:

| Tab | Halaman | Fungsi |
|---|---|---|
| Teks | semua | Aktifkan, lalu klik judul/paragraf/tombol/FAQ di halaman dan ketik langsung |
| Lampu | index | Unggah foto asli per bagian (jenis + bentuk + warna), harga tiap bentuk, harga LED, nama/diskon paket, tambah/hapus warna filamen |
| Produk | koleksi | Tambah, hapus, duplikat, urutkan produk; ubah nama, harga, kategori, warna, bentuk ilustrasi, deskripsi, spesifikasi, label, dan unggah foto |
| Kontak & Harga | semua | WhatsApp, email, Instagram, link marketplace, kota, saklar dan ambang gratis ongkir, serta angka estimator custom |
| Ekspor | semua | Salin file HTML halaman ini + `config.js` + `lamp-data.js`/`products.js` hasil edit, lalu tempel ke file yang sama di GitHub, atau kirim ke Claude untuk di-commit |

Perubahan tersimpan di browser yang dipakai mengedit (localStorage), **belum** tayang untuk pengunjung sampai file hasil ekspor di-commit. Pengunjung biasa tidak melihat panel ini.

Catatan desain ulang v3: suntingan teks disimpan per alamat elemen. Saat tata letak berubah, suntingan yang elemennya hanya bergeser ikut pindah, tetapi suntingan untuk teks yang ditulis ulang atau dihapus tidak diterapkan lagi (disimpan sebagai arsip, agar tidak jatuh ke elemen lain). Jadi suntingan teks yang dibuat di tata letak v2 mungkin perlu diulang.

Versi untuk artifact claude.ai (Mode Edit selalu aktif di kedua halaman): `node tools/build-artifact.js` → `dist/artifact/`.

## Menambah produk koleksi lewat file

Salin satu objek di `assets/js/products.js`, ubah `id` (unik), `name`, `category` (`vas | lampu | pot | aksesori | dinding`), `price`, dan deskripsinya.

## Deploy ke GitHub Pages

Sekali saja: Settings → Pages → Source = **GitHub Actions** (token bawaan Actions tidak bisa mengaktifkan Pages sendiri). Setelah itu workflow `.github/workflows/pages.yml` men-deploy isi repo setiap push ke `main`, dan bisa dijalankan manual dari tab Actions. Alamat: `https://mahakaryastudio.github.io/MahaKaryaStudio/`.

## Batasan yang perlu diketahui

- Tidak ada pembayaran online atau stok otomatis. Semua order masuk lewat WhatsApp, jadi pencatatan pesanan masih manual.
- Estimasi waktu produksi di estimator mengasumsikan kapasitas mesin yang kecil. Sesuaikan `leadTimeDays` dengan jumlah printer Anda.
- Pratinjau lampu di konfigurator adalah ilustrasi SVG, bukan foto. Foto asli yang diunggah tampil di kartu bagian satuan dan strip bagian terpilih.
- Bentuk bagian lampu (3 kap, 5 badan, 4 alas) terikat pada gambar SVG di `lamp-art.js`; menambah bentuk baru perlu menggambar ilustrasinya.
- Belum ada testimoni. Sengaja tidak diisi testimoni palsu. Tambahkan testimoni asli setelah ada pelanggan.
