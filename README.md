# MahaKarya Studio — Website

Website toko untuk bisnis **dekorasi rumah 3D print** dengan motif Nusantara.
Website statis (HTML/CSS/JS murni), tanpa build dan tanpa server. Buka `index.html` atau deploy ke GitHub Pages / Netlify / Vercel.

## Isi website

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

1. **`assets/js/config.js`**: email, link Tokopedia/Shopee, kota. (Nomor WhatsApp dan Instagram sudah diisi.)
2. **Harga di `config.js` dan `assets/js/products.js`**: ini **asumsi**, belum dihitung dari biaya riil. Hitung ulang dari:
   `harga filamen per gram × berat + jam mesin × (listrik + penyusutan printer) + finishing + packing + margin + potongan marketplace`.
3. **Foto produk**: isi field `image` di `products.js`, misalnya `"assets/img/vas-kawung.jpg"`. Foto asli jauh lebih meyakinkan daripada ilustrasi.
4. **Kebijakan** (garansi, DP 50%, lead time, daur ulang produk lama): pastikan semuanya memang sanggup Anda jalankan.

## Menambah produk

Salin satu objek di `assets/js/products.js`, ubah `id` (unik), `name`, `category` (`vas | lampu | pot | aksesori | dinding`), `price`, dan deskripsinya.

## Deploy ke GitHub Pages

Settings → Pages → Source: *Deploy from a branch* → pilih branch dan folder `/ (root)`.

## Batasan yang perlu diketahui

- Tidak ada pembayaran online atau stok otomatis. Semua order masuk lewat WhatsApp, jadi pencatatan pesanan masih manual.
- Estimasi waktu produksi di estimator mengasumsikan kapasitas mesin yang kecil. Sesuaikan `leadTimeDays` dengan jumlah printer Anda.
- Belum ada testimoni. Sengaja tidak diisi testimoni palsu. Tambahkan testimoni asli setelah ada pelanggan.
