# MahaKarya Studio — Website

Website toko untuk bisnis **lampu meja 3D print yang dirakit sendiri oleh pembeli** (kap + badan + alas, tiap bagian pilih bentuk dan warna), plus katalog dekorasi bermotif Nusantara sebagai lini kedua.
Website statis (HTML/CSS/JS murni), tanpa build dan tanpa server. Buka `index.html` atau deploy ke GitHub Pages / Netlify / Vercel.

## Halaman

| File | Isi |
|---|---|
| `index.html` | **Lampu rakitan**: hero dengan lampu menyala, penjelasan 3 bagian, konfigurator (bentuk + warna per bagian, harga & tinggi langsung terhitung, kode rakitan, pesan via WhatsApp), paket 3/4/5 bagian, katalog bagian satuan, cara pesan, spesifikasi, FAQ |
| `koleksi.html` | **Koleksi Nusantara**: katalog vas/lampu/pot/panel, keranjang → WhatsApp, estimator pesanan custom, B2B, material, FAQ |

Video proses di bagian "Cara pesan": `assets/video/proses-lampu.webm` + `.mp4` (8 detik, tanpa suara, 960×540) dan poster `.jpg`. Saat ini video ilustrasi buatan AI dan diberi label demikian di halaman; ganti dengan rekaman produk asli dengan nama file yang sama, lalu hapus kalimat labelnya lewat Mode Edit tab Teks.

Data: `assets/js/config.js` (kontak, janji waktu balas, alamat/NIB, perkiraan ongkir per zona, gratis ongkir, estimator), `assets/js/lamp-data.js` (bentuk, warna, harga, paket, kit kelistrikan, waktu produksi, preset populer, foto bagian lampu), `assets/js/products.js` (katalog koleksi).

Keputusan harga & produk (dari riset pasar di `reports/`, ringkasnya):
- Harga paket lampu diposisikan Rp375–465 ribu (di antara lampu IKEA dan pesaing lokal 3D print), bagian satuan Rp65–229 ribu, diskon paket 15/22/28%. Bohlam LED (≤5 W) dan **kit kelistrikan ber-SNI/K3L** adalah baris terpisah; lampu bisa dipesan "hanya bagian cetak". Website tidak pernah menyebut lampu rakitan "ber-SNI".
- Konfigurator dibuka dengan preset "Paling populer"; di HP panel ubah bentuk dilipat. Waktu produksi tampil per varian: preset/berstok vs custom.
- Perkiraan ongkir per zona dan perkiraan total tampil sebelum tombol WhatsApp; angkanya contoh, samakan dengan tarif kurir.

## Isi halaman koleksi

| Bagian | Fungsi bisnis |
|---|---|
| Hero + "Kenapa bukan 3D print biasa" | Posisi pasar: desain orisinal bermotif lokal, personalisasi, produksi sesuai pesanan. Tidak bersaing harga dengan penjual file unduhan gratis |
| Koleksi + filter + detail produk | Katalog. Ilustrasi SVG dibuat otomatis sampai foto asli tersedia |
| Keranjang → WhatsApp | Checkout lewat chat, kanal penjualan utama di Indonesia. Ada indikator gratis ongkir untuk menaikkan nilai order |
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

## Logo MK & kemasan

- **Logo MK Studio** (monogram MK biru muda + titik cahaya amber + wordmark Fraunces yang sama dengan website): `assets/brand/mk/` (SVG) dan `assets/brand/mk/png/` (pratinjau, termasuk `perbandingan-sebelum-sesudah.png`). Dibuat ulang dengan `node tools/build-logo-mk.js assets/brand/mk` lalu `node tools/render-svg-png.js assets/brand/mk assets/brand/mk/png` (butuh `opentype.js`, `@fontsource/fraunces`, `@fontsource/inter`, Playwright). Motto: *Redefining where colours & sustainability take shapes*.
- **Kemasan LAMP 01 · Dhiyanra**: spesifikasi ukuran, bahan, cetak, dan biaya di `ops/kemasan.md`; panel cetak SVG ukuran sebenarnya, gambar insert, stiker kode rakitan, dan mockup di `ops/kemasan/` (`tools/build-kemasan.js`, `tools/render-kemasan.js`).

## Admin WA (`admin.html`)

Halaman khusus admin (tidak ditautkan dari halaman publik, `noindex`, dilarang di `robots.txt`). Tempel pesan WhatsApp dari pembeli → kode rakitan diurai, harga dihitung ulang dari `lamp-data.js`, pesanan disimpan di browser (localStorage) dengan alur status Baru → Konfirmasi → Tunggu bayar → Cetak → Dikirim → Selesai, tiap status punya balasan siap salin / buka chat WA. Unduh CSV untuk tab Pesanan di `ops/MahaKarya_Ops.xlsx` (sheet operasional, lihat bawah), unduh JSON sebagai cadangan. Pengaturan WhatsApp Business, label, alur, dan teks quick reply ada di `ops/wa-quick-replies.md`.

## Sheet operasional (`ops/MahaKarya_Ops.xlsx` → Google Sheets)

Satu workbook untuk semua pencatatan, dibuat oleh `python3 tools/build-ops-sheet.py ops/MahaKarya_Ops.xlsx` (openpyxl). Unggah ke Google Drive → buka dengan Google Spreadsheet → simpan sebagai Google Spreadsheet; semua rumus, dropdown, dan warna terbawa.

| Tab | Isi | Diisi |
|---|---|---|
| Dashboard | KPI bulan ini, daftar yang harus dikerjakan hari ini, peringatan stok, tren 6 bulan | otomatis |
| Data dasbor | ringkasan datar (tanpa data pembeli) yang dibaca `dasbor.html`; satu-satunya tab yang dipublikasikan ke web | otomatis |
| Pesanan | kolom A–Q = CSV dari `admin.html`; kolom R–AO rumus (total, keterlambatan, uraian kode rakitan, gram filamen, HPP, laba kotor) | mingguan (tempel CSV) |
| Stok filamen / Stok bahan | sisa gram per warna & sisa bahan kemasan/kelistrikan; pemakaian untuk pesanan dihitung otomatis dari kode rakitan, status PESAN bila di bawah minimum | otomatis |
| Stok bagian jadi | bagian preset yang sudah dicetak | mingguan (opname) |
| Mutasi stok | pembelian, pemakaian manual (gagal cetak), koreksi opname | harian |
| Kas | uang masuk/keluar, saldo berjalan | harian |
| Laporan bulanan | pesanan, konversi, omzet, HPP, laba kotor, arus kas per bulan | otomatis |
| Rutinitas | checklist harian / mingguan / bulanan dan di mana mengisinya | – |
| Resep, Pengaturan | gram per bentuk, kode warna, asumsi biaya (ganti dengan angka nyata) | sekali |

### Dasbor web (`dasbor.html`)

Versi web dari tab Dashboard: KPI bulan ini, tugas hari ini, stok filamen/bahan/bagian jadi, grafik 6 bulan, pesanan aktif, kas. Halaman statis (noindex, dilarang di `robots.txt`) yang membaca tab **Data dasbor** dari Google Sheet operasional yang dipublikasikan sebagai CSV (File → Bagikan → Publikasikan ke web → pilih tab *Data dasbor* + CSV). Tab itu hanya berisi ringkasan, tanpa nama/HP/alamat pembeli. Tautan CSV disimpan di browser (localStorage); tombol *Sumber data* untuk mengaturnya, *Lihat contoh* untuk data demo. Memuat ulang otomatis tiap 5 menit. Kode: `assets/js/dasbor.js`, `assets/css/dasbor.css`.

## Mode Edit (ubah isi website tanpa coding)

Buka halaman mana pun dengan `#edit` di akhir alamat, misalnya `https://mahakaryastudio.github.io/MahaKaryaStudio/#edit` atau `.../koleksi.html#edit`. Muncul panel di kanan:

| Tab | Halaman | Fungsi |
|---|---|---|
| Teks | semua | Aktifkan, lalu klik judul/paragraf/tombol/FAQ di halaman dan ketik langsung |
| Lampu | index | Unggah foto asli per bagian (jenis + bentuk + warna), harga tiap bentuk, harga LED, nama/diskon paket, tambah/hapus warna filamen |
| Produk | koleksi | Tambah, hapus, duplikat, urutkan produk; ubah nama, harga, kategori, warna, bentuk ilustrasi, deskripsi, spesifikasi, label, dan unggah foto |
| Kontak & Harga | semua | WhatsApp, email, Instagram, link marketplace, kota, ambang gratis ongkir, serta angka estimator custom |
| Ekspor | semua | Salin file HTML halaman ini + `config.js` + `lamp-data.js`/`products.js` hasil edit, lalu tempel ke file yang sama di GitHub, atau kirim ke Claude untuk di-commit |

Perubahan tersimpan di browser yang dipakai mengedit (localStorage), **belum** tayang untuk pengunjung sampai file hasil ekspor di-commit. Pengunjung biasa tidak melihat panel ini.

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
