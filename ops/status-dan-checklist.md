# MahaKarya Studio — Kompilasi sesi Claude Code, korelasi, dan checklist

Disusun 17 November 2026 dari isi repo, riwayat commit, 11 PR, 5 branch di GitHub, dan log GitHub Actions. Angka dan nama file di bawah diambil langsung dari repo, bukan dari ingatan chat.

## 0. Tiga hal terpenting (baca ini dulu)

1. **Website belum tayang.** Semua 12 deploy GitHub Pages gagal dengan pesan yang sama: `Get Pages site failed … Not Found`. Penyebabnya bukan kode, tapi Pages belum diaktifkan di repo. Satu kali klik: **Settings → Pages → Source: GitHub Actions**, lalu **Actions → Re-run** workflow terakhir. Sebelum ini dilakukan, semua link `mahakaryastudio.github.io/MahaKaryaStudio` di quick reply WA, kemasan, booklet, dan QR tidak hidup.
2. **Empat branch belum masuk `main`** dan dua di antaranya tumpang tindih dengan yang sudah ada di `main` (dua workbook operasional, dua logo). Perlu dua keputusan dari Anda sebelum di-merge (lihat bagian 2).
3. **Semua harga, berat, dan dimensi masih asumsi.** Belum ada satu pun angka yang dihitung dari hasil cetak atau biaya riil. Website sudah menampilkan harga coret dan klaim hemat, jadi ini juga soal kepatuhan, bukan hanya akurasi.

## 1. Peta sesi: siapa mengerjakan apa

Anda menyebut 4 chat. Di GitHub saya menemukan **satu alur utama + empat branch terpisah**, jadi kemungkinan ada 5 sesi, atau salah satu branch di bawah dibuat di chat yang sama.

| # | Sesi / branch | Status di `main` | Isi utama |
|---|---|---|---|
| A | **Utama** — `claude/mahakaryastudio-homedecor-3dprint-kn8wfr` | **Sudah merge** lewat PR #1–#11 (3–6 Okt) | Website statis: konfigurator lampu (3 kap, 5 badan, 4 alas, 5+2 warna), paket 3/4/5, koleksi Nusantara, Mode Edit `#edit`, logo **Nyala**, SEO/OG, `admin.html` (urai pesan WA, status, template balasan, CSV/JSON), `ops/wa-quick-replies.md`, `ops/Operasional_MahaKarya.xlsx` (6 tab), video hero AI, scroll/animasi, bagikan rakitan + mode kado, halaman utama v2 (Lima Edisi, cerita terpaku), link marketplace (Shopee terisi), workflow deploy Pages |
| B | **Kemasan + logo MK + ops sheet + dasbor** — `ccr-1122e03a-lxovu4` | Belum merge (3 commit, 5 Okt). **Konflik** di `README.md` dan `ops/wa-quick-replies.md` | Logo "MK Studio biru muda" (monogram + titik amber), konsep kemasan **LAMP 01 Dhiyanra** (dus kraft 240×240×200 mm, panel cetak SVG/PNG, stiker kode rakitan, `ops/kemasan.md`), `ops/MahaKarya_Ops.xlsx` (12 tab: HPP, laba kotor, stok filamen otomatis dari kode rakitan, resep, rutinitas), `dasbor.html` yang membaca tab "Data dasbor" Google Sheets sebagai CSV |
| C | **Generator video promo** — `ccr-39190c86-b89c8d` | Belum merge (4 commit, 5 Okt). **Konflik** di `assets/js/lamp-art.js` | `video.html` (admin, noindex): 4 template video, format 9:16/1:1/16:9/3:4, render lampu 3D three.js, ekspor MP4/WebM di browser, `tools/prompt-video-promo.md` untuk Gemini/Veo |
| D | **Booklet katalog A5** — `ccr-b44fa6ac-kxnwpr` | Belum merge (2 commit, 5 Okt). Bersih, tanpa konflik | `booklet.html` 16 halaman (flipbook, konfigurator di hal. 7, kalkulator custom di hal. 12), PDF siap cetak `assets/booklet/MahaKarya-Booklet-Edisi-01.pdf`, foto konsep dari frame video, `tools/build-booklet.js` |
| E | **Analisis strategis** — `ccr-7465b2a5-sgcbvj` | Belum merge (1 commit, 7 Okt). Bersih | `ops/analisis-strategis-mahakarya.md`: SWOT, TOWS, Porter, 7S, BMC, prioritas 90 hari, estimasi unit economics (belum diverifikasi) |

Semua branch B–E tertinggal 10–19 commit dari `main` karena dibuat sebelum PR #9–#11 (halaman utama v2 dan marketplace).

## 2. Korelasi antar sesi: yang cocok, yang bentrok

### Bentrok, perlu keputusan Anda

| Topik | Sesi A (sudah di `main`) | Sesi B (branch) | Yang harus diputuskan |
|---|---|---|---|
| **Logo / brand** | Nyala (kap bergaris + titik cahaya) dipakai di nav, footer, favicon, OG image, PNG sosial | MK Studio biru muda (monogram MK + titik amber dari Nyala), varian lengkap, motto "Redefining where colours & sustainability take shapes" | Pilih satu. Kemasan B dirancang dengan logo MK, website A dengan Nyala. Mencampur keduanya membuat paket dan website terlihat seperti dua merek. |
| **Workbook operasional** | `ops/Operasional_MahaKarya.xlsx`: Dashboard, Pesanan, Kas, Stok, Kartu_Stok, Panduan. Ringan, rentang 500 baris | `ops/MahaKarya_Ops.xlsx`: 12 tab, menghitung gram filamen, HPP, laba kotor, pemakaian stok otomatis dari kode rakitan, plus `dasbor.html` | Pilih satu, hapus yang lain. B lebih lengkap (menjawab pertanyaan "untung berapa per lampu") tapi lebih berat di Google Sheets (30 ribu rumus). Keduanya menerima CSV dari `admin.html`. |
| **Quick replies** | `ops/wa-quick-replies.md` versi A | B mengubah 4 baris file yang sama | Konflik kecil, bisa diselesaikan saat merge. |

### Bentrok teknis, bisa diselesaikan tanpa keputusan bisnis

- `assets/js/lamp-art.js`: sesi C memecah `renderLamp` menjadi `renderLayers`; sesi A (PR #9) menambah grup `lp-head/lp-body/lp-base` di file yang sama. Perlu merge manual, bukan pilih salah satu.

### Sudah cocok, tidak perlu diubah

- **Format pesan WhatsApp.** Pesan yang dibuat konfigurator (`lamp.js`: kode `MK-…`, "Paket X (n bagian) — Rp…", "Kirim ke {zona}", "Nama pemesan", "Alamat kirim (penerima)", blok kado) terbaca oleh parser di `admin.js` termasuk mode kado. Diuji dengan membaca kedua regex.
- **Satu sumber data.** Booklet (D), video (C), dan `admin.html` (A) semuanya membaca `lamp-data.js`, `config.js`, `products.js` secara langsung, jadi harga baru dari PR #9–#11 otomatis ikut. Yang perlu dicek visual hanya tata letak booklet setelah merge.
- **Prompt AI.** `tools/prompt-foto-bagian.md` (A, 12 bagian) dan `tools/prompt-video-promo.md` (C) memakai palet 5 warna yang sama dengan `lamp-data.js`.
- **Kemasan ↔ website.** Stiker kode rakitan (B) memakai kode yang sama dengan website dan QR ke `#rakit`; anchor itu ada di `index.html`.

### Angka yang tidak sinkron (sebagian sudah saya samakan di sesi ini)

| Hal | Sebelumnya | Sekarang |
|---|---|---|
| Klaim hemat di bar promo | "hemat hingga 38%" (sisa dari diskon lama 30/35/38%) | **Diperbaiki** menjadi 28%, sesuai diskon paket 15/22/28% |
| Rentang tinggi di kartu paket | 24–30 / 30–38 / 36–46 cm, tidak cocok dengan rumus konfigurator (3 cm alas + 2 cm leher + kap + badan) | **Diperbaiki** menjadi 23–27 / 27–35 / 32–43 cm, hasil rumus yang sama dengan yang dilihat pembeli di ringkasan |
| Ukuran dus di `config.js` | "±25×25×25 cm" (= 2,6 kg volumetrik, tarif 3 kg) | **Diperbaiki** menjadi 24×24×20 cm sesuai `ops/kemasan.md` (1,92 kg volumetrik, tarif 2 kg) |
| Favicon `404.html` | masih logo Lapis (konsep yang tidak dipakai) | **Diperbaiki** ke Nyala |
| README soal video | "di bagian Cara pesan" | **Diperbaiki**: video sekarang latar hero |
| Berat kap 0,42 kg dan alas 0,22 kg | Tertanam di `lamp-art.js`, sama untuk semua bentuk, tidak bisa diedit lewat Mode Edit | Belum diubah; butuh angka timbangan asli dulu (lihat checklist B) |
| Berat total vs ongkir | Berat aktual 0,8–1,2 kg per lampu; kurir menagih volumetrik 2 kg | Catatan di `config.js` sudah disesuaikan; tarif zona tetap contoh |

## 3. Yang dikerjakan di sesi ini (branch `ccr-38311001-p81c6n`)

- Lima perbaikan konsistensi di tabel atas (`index.html`, `404.html`, `README.md`, `lamp-data.js`, `config.js`).
- Dokumen ini.
- Tidak ada perubahan fungsi, harga, atau desain. Branch B–E **tidak** saya merge karena menunggu dua keputusan di bagian 2.

## 4. Checklist

Tanda: **[Anda]** hanya Anda yang bisa; **[Claude]** bisa dikerjakan di sesi berikutnya setelah keputusan ada.

### A. Penghalang peluncuran, kerjakan paling dulu

- [ ] **[Anda]** Aktifkan GitHub Pages: Settings → Pages → Source **GitHub Actions**. Lalu Actions → run terakhir → **Re-run all jobs**. Tanpa ini tidak ada yang tayang.
- [ ] **[Anda]** Setelah hijau, buka `https://mahakaryastudio.github.io/MahaKaryaStudio/`, `…/koleksi.html`, `…/admin.html`, dan tes tombol "Pesan via WhatsApp" dari HP.
- [ ] **[Anda]** Putuskan **brand**: Nyala atau MK Studio biru muda.
- [ ] **[Anda]** Putuskan **workbook**: `Operasional_MahaKarya.xlsx` (ringan) atau `MahaKarya_Ops.xlsx` + `dasbor.html` (HPP dan stok otomatis).
- [ ] **[Claude]** Merge branch E dan D (bersih), lalu B dan C (selesaikan konflik `README.md`, `wa-quick-replies.md`, `lamp-art.js`), hapus workbook dan logo yang tidak dipilih, perbarui README dan `robots.txt`.
- [ ] **[Claude]** Setelah merge: regenerasi booklet PDF (`node tools/build-booklet.js`) dan cek `video.html` masih jalan dengan `lamp-art.js` hasil merge.

### B. Data bisnis yang hanya Anda yang tahu (website masih memakai angka contoh)

- [ ] **Harga.** Hitung HPP per bagian: gram filamen × harga/gram + jam mesin × (listrik + penyusutan) + finishing + packing + margin + potongan marketplace. Isi ke `lamp-data.js` (12 bentuk, LED, kit), `config.js` (estimator custom), `products.js` (koleksi). Tab HPP di workbook B bisa dipakai untuk menghitungnya.
- [ ] **Harga coret** di paket harus sama dengan harga satuan yang benar-benar dijual (UU Perlindungan Konsumen Pasal 9–10). Website sudah menghitungnya otomatis dari harga satuan, jadi cukup pastikan harga satuannya nyata.
- [ ] **Timbang dan ukur** satu hasil cetak per bentuk (12 bagian): berat dan tinggi. Kirim ke Claude untuk dimasukkan; sekarang kap 0,42 kg dan alas 0,22 kg dipukul rata.
- [ ] **Kode filamen** (merek, lini, kode warna) untuk 5 warna badan dan 2 warna kap, isi di field `sku` agar restok warnanya persis.
- [ ] **Rekening / QRIS** atas nama usaha. Template `/konfirmasi` masih berbunyi "BCA xxxx".
- [ ] **Alamat studio dan NIB** di `config.js` (`address`, `nib`). Selama kosong, baris footer disembunyikan.
- [ ] **Link toko**: Tokopedia masih mengarah ke beranda Tokopedia (otomatis disembunyikan), TikTok Shop kosong. Shopee sudah terisi.
- [ ] **Tarif ongkir** per zona (sekarang 20 / 45 / 95 ribu, contoh) berdasarkan dus 24×24×20 cm, tarif 2 kg. Luar Jawa dengan karton luar naik ke 3 kg.
- [ ] **Uji muat kemasan**: alas bunga 15 cm dan kap kotak 20 cm ke rongga 228 mm; nampan dasar diasumsikan Ø 160 × 30 mm.
- [ ] **Janji yang sudah tertulis di website**, pastikan sanggup: garansi 30 hari cacat cetak, foto rakitan sebelum kirim, balas < 15 menit jam 09–21 WIB, refund penuh 1×24 jam, produksi 3–5 hari preset / 7–10 hari custom, bohlam LED maks 5 W.
- [ ] **Kit kelistrikan**: pilih pemasok yang komponennya bertanda SNI/K3L. Website sengaja tidak pernah menyebut lampu "ber-SNI"; jaga itu di semua materi.

### C. Aset visual

- [ ] **12 gambar bagian lampu.** Prompt sudah siap di `tools/prompt-foto-bagian.md`. Jalankan di Gemini/Imagen, kirim 12 file sesuai nama, Claude mewarnai ke palet dan memasang. `photos: {}` di `lamp-data.js` masih kosong, jadi konfigurator masih ilustrasi SVG.
- [ ] **Foto produk asli** untuk mengganti video hero AI, OG image, dan foto konsep di booklet. Label "ilustrasi AI" baru boleh dihapus setelah itu.
- [ ] **Foto koleksi Nusantara** (`image` di `products.js`), sekarang ilustrasi otomatis.
- [ ] **Proof cetak kemasan** setelah brand diputuskan (file panel ada di `ops/kemasan/` di branch B).
- [ ] **Video promo**: jalankan `video.html` setelah merge, unduh versi 9:16 untuk Reels dan 3:4 untuk hero.

### D. Operasional dan WhatsApp

- [ ] Setel WhatsApp Business sesuai `ops/wa-quick-replies.md`: profil, pesan sapaan G1, pesan di luar jam G2, 12 quick reply, 7 label berurutan, tautan singkat untuk bio Instagram.
- [ ] Impor workbook terpilih ke Google Sheets, lalu uji alur penuh: pesan WA → `admin.html` → Unduh CSV → tempel ke tab Pesanan → Dashboard terisi.
- [ ] Jika memakai `dasbor.html`: publikasikan tab "Data dasbor" sebagai CSV dan tempel tautannya di halaman dasbor.
- [ ] Jadwalkan cadangan: tiap Sabtu Unduh JSON dari `admin.html`. Data pesanan hanya ada di browser itu; hilang kalau cache dibersihkan atau ganti HP.
- [ ] Baca `ops/analisis-strategis-mahakarya.md` (branch E), terutama bagian "Prioritas 90 hari" dan unit economics, lalu tandai mana yang disetujui.

### E. Teknis dan kerapian repo

- [x] Bar promo 38% → 28%.
- [x] Favicon `404.html` ke Nyala.
- [x] README: posisi video.
- [x] Rentang tinggi paket disamakan dengan rumus.
- [x] Catatan ukuran dus di `config.js`.
- [ ] **[Claude]** Pindahkan berat kap dan alas dari `lamp-art.js` ke `lamp-data.js` per bentuk, supaya bisa diisi dari timbangan lewat Mode Edit.
- [ ] **[Claude]** Setelah branch B–E merge: hapus branch lama di GitHub (`claude/…` dan empat `ccr-…`), tambah `booklet.html` ke `sitemap.xml` bila dibuat publik, pastikan `video.html` dan `dasbor.html` tetap di `robots.txt`.
- [ ] **[Claude]** Workflow Pages memberi peringatan Node 20 usang untuk `actions/checkout@v4` dan `actions/configure-pages@v5`. Tidak menghalangi deploy; naikkan versi saat sempat.
- [ ] Riset pasar dan laporan (`reports/`, `research_notes/`, `finance/`) sengaja di-gitignore, jadi tidak ada di repo. Simpan salinannya di Drive agar tidak hilang bersama sesi.
- [ ] Testimoni: belum ada dan sengaja tidak diisi palsu. Tambah setelah pelanggan pertama, pakai template `/selesai` untuk memintanya.

## 5. Urutan yang saya sarankan minggu ini

1. Aktifkan Pages (5 menit), cek website tayang.
2. Putuskan brand dan workbook (dua jawaban satu kalimat cukup).
3. Minta Claude merge keempat branch dan merapikan repo.
4. Isi data bisnis bagian B, mulai dari harga dan rekening.
5. Jalankan 12 prompt gambar bagian, kirim hasilnya.
