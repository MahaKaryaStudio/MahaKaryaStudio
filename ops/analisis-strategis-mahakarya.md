# MahaKarya Studio — Analisis Strategis
SWOT · TOWS · Porter's Five Forces · McKinsey 7S · Business Model Canvas

Tanggal: 7 Oktober 2026
Status: **Draf v1.** Video YouTube (`youtu.be/Dy4rYjHV7Ng`) tidak dapat diakses dari lingkungan kerja ini (diblokir kebijakan jaringan), sehingga analisis disusun dari **isi repo website** (produk, harga, operasional, positioning, kebijakan) dan **riset pasar web** per Oktober 2026. Poin yang hanya ada di video (misalnya cerita pendiri, target omzet, jumlah mesin, traksi penjualan) belum masuk. Kirim transkrip atau poin utama video untuk revisi v2.

---

## 0. Ringkasan eksekutif (kelemahan terpenting dulu)

1. **Harga belum berbasis biaya.** README repo sendiri menyatakan semua harga adalah asumsi. Estimasi kasar di bawah menunjukkan margin kotor paket Kuinto (Rp447 ribu) hanya ±25–45% sebelum tenaga kerja dan sebelum potongan marketplace 10–18%. Ini risiko eksistensial, bukan detail.
2. **Kapasitas produksi adalah plafon omzet.** Satu lampu 5 bagian butuh ±20–30 jam mesin. Satu printer ≈ 1 lampu/hari ≈ 25 lampu/bulan ≈ Rp10–11 juta omzet/bulan. Janji 3–5 hari kerja hanya aman di bawah ±5 pesanan/minggu per printer.
3. **Hambatan masuk rendah.** Printer FDM Rp3–8 juta dan file STL gratis membuat pesaing muncul dalam hitungan minggu. Satu-satunya benteng yang tidak mudah ditiru: sistem modular ulir M20 yang saling kompatibel, desain orisinal, dan pengalaman layanan (foto sebelum kirim, garansi 30 hari).
4. **Belum ada bukti pasar.** Belum ada testimoni, belum ada foto produk asli (masih ilustrasi AI), belum ada data penjualan. Semua kekuatan di bawah masih **hipotesis** sampai 20–30 pesanan pertama terjadi.

Yang kuat: proposisi "susun sendiri" jelas berbeda dari lampu 3D print lain di marketplace (yang didominasi moon lamp Rp70–150 ribu dan lampu figuratif), tooling operasional sudah rapi untuk 1 orang, dan posisi harga Rp375–465 ribu masuk di celah antara Informa/IKEA (Rp80–500 ribu, produksi massal) dan pemain 3D print premium lokal seperti MEVAL (Rp480 ribu–1,1 juta).

---

## 1. Profil bisnis (dasar fakta)

| Aspek | Fakta dari repo |
|---|---|
| Produk inti | Lampu meja 3D print modular: kap (3 bentuk) + badan (5 bentuk, 1–3 tumpuk) + alas (4 bentuk), 5 warna filamen + 2 warna kap, ulir cetak M20 tanpa lem. Lima edisi preset + konfigurator. |
| Lini kedua | Koleksi Nusantara: vas, lampu, pot, panel dinding bermotif kawung, parang, megamendung, stupa, terasering. 10 SKU, Rp99–429 ribu. Custom nama/logo, B2B (souvenir, kafe/hotel, desainer interior). |
| Harga lampu | Paket Trio/Kuarto/Kuinto diskon 15/22/28% dari harga satuan. Bagian satuan Rp65–229 ribu. Kit kelistrikan ber-SNI/K3L Rp49 ribu (opsional), LED 5 W Rp25 ribu. Contoh Kuinto Rp447 ribu. |
| Produksi | Jakarta, print-on-demand, PLA+ matte lapis 0,2 mm. Lead time 3–5 hari (preset), 7–10 hari (custom). Tanpa stok gudang. |
| Kanal | Website statis (GitHub Pages) → WhatsApp Business (1 admin). Marketplace Tokopedia/Shopee/TikTok Shop sebagai kanal sekunder. Instagram. |
| Pembayaran | Transfer/QRIS setelah konfirmasi; DP 50% untuk custom. Tidak ada pembayaran online di website. |
| Layanan | Foto rakitan sebelum kirim, garansi 30 hari cacat cetak, ganti bagian, balas <15 menit jam 09–21, refund 1×24 jam. |
| Ops | `admin.html` + workbook Excel (Dashboard, Pesanan, Kas, Stok, Kartu_Stok). KPI: konversi chat→bayar ≥40%, bayar→kirim ≤6 hari. |
| Biaya input (dari tab Stok) | Filamen Rp175 ribu/kg; kit listrik Rp35 ribu; LED Rp18 ribu; kardus Rp12 ribu; busa Rp5 ribu; kartu Rp1,5 ribu. |

### Estimasi unit economics (perlu diverifikasi dengan data mesin nyata)

Asumsi: Kuinto ±0,8–1,0 kg filamen; 20–30 jam mesin; listrik + penyusutan Rp3–5 ribu/jam; belum termasuk tenaga kerja, kegagalan cetak (biasanya 5–10%), dan biaya pemasaran.

| Komponen | Rp (rendah) | Rp (tinggi) |
|---|---|---|
| Filamen | 140.000 | 175.000 |
| Jam mesin | 60.000 | 150.000 |
| Kit listrik + LED | 53.000 | 53.000 |
| Kemasan | 18.500 | 18.500 |
| **HPP langsung** | **271.500** | **396.500** |
| Harga Kuinto (termasuk kit) | 447.000 | 447.000 |
| **Margin kotor** | **39%** | **11%** |
| Setelah potongan marketplace 10–18% | 21–29% | **negatif–1%** |

Kesimpulan: lewat WhatsApp margin masih hidup; lewat marketplace pada asumsi tinggi margin hilang. Harga perlu dihitung ulang dari berat cetak dan jam mesin aktual per bentuk, bukan dari pembanding pesaing.

---

## 2. SWOT

### Strengths (kekuatan)
| # | Kekuatan | Bukti / catatan kritis |
|---|---|---|
| S1 | **Sistem modular ulir M20 terstandar**: semua kap/badan/alas saling tukar; pembeli bisa beli bagian satuan belakangan. | Menciptakan efek "platform" dan repeat purchase. Belum terbukti di pasar. |
| S2 | **Konfigurator + kode rakitan** (MK-…) yang terkirim otomatis ke WhatsApp. | Menurunkan friksi pesanan custom, menghindari salah paham spesifikasi. |
| S3 | **Pengalaman layanan terdefinisi**: foto sebelum kirim, garansi 30 hari, SLA balas 15 menit, alur status 7 tahap, quick reply. | Jarang dimiliki penjual 3D print marketplace. Bergantung pada disiplin 1 admin. |
| S4 | **Kejujuran produk**: tidak klaim "ber-SNI", jujur soal PLA 55 °C, tidak pakai testimoni palsu. | Menurunkan risiko hukum (UU Perlindungan Konsumen) dan retur. |
| S5 | **Biaya tetap rendah**: website statis tanpa server, tanpa stok, 1 orang. | Break-even rendah, tapi juga berarti kapasitas rendah. |
| S6 | **Dua lini saling melengkapi**: lampu modular (B2C hadiah/dekor) dan Koleksi Nusantara (B2B souvenir, kafe, interior). | Diferensiasi motif lokal sulit ditiru penjual file unduhan. |
| S7 | Posisi harga Rp375–465 ribu di celah antara lampu massal dan 3D print premium. | Hanya kekuatan jika HPP terbukti mendukung. |

### Weaknesses (kelemahan)
| # | Kelemahan | Dampak |
|---|---|---|
| W1 | **Harga masih asumsi**, belum dari HPP; margin kemungkinan tipis di marketplace. | Risiko jual rugi tanpa sadar. |
| W2 | **Kapasitas mesin kecil**; satu printer ≈ 1 lampu/hari. | Plafon omzet ±Rp10 juta/bulan/printer; janji 3–5 hari rapuh. |
| W3 | **Belum ada foto produk asli, testimoni, atau data penjualan.** Video hero masih ilustrasi AI. | Konversi website kemungkinan rendah; kepercayaan calon pembeli minim. |
| W4 | **Ketergantungan 1 orang** (admin = produksi = CS = keuangan). | Sakit satu hari = SLA rusak. |
| W5 | **Checkout manual** via WhatsApp: tanpa escrow, tanpa pembayaran online. | Pembeli baru ragu transfer ke rekening pribadi; tidak ada perlindungan pembeli. |
| W6 | **Material PLA**: melunak 55 °C, batas LED 5 W, tidak untuk luar ruangan. | Membatasi use case dan menambah risiko komplain pada pembeli yang tidak membaca. |
| W7 | **Belum ada merek yang mapan**; repo masih menyimpan tiga kandidat logo (Nyala, Lapis, Tumpuk). | Identitas visual belum final. |
| W8 | Lampu rakitan **bukan produk bersertifikat SNI**; hanya komponen kitnya. | Menutup kanal B2B besar (hotel, kantor) yang mensyaratkan sertifikasi. |

### Opportunities (peluang)
| # | Peluang | Data |
|---|---|---|
| O1 | Pasar dekorasi rumah Indonesia besar: ±USD 10,5 miliar (2025), tumbuh ±3,7% CAGR hingga 2034. | IMARC. Pertumbuhan lambat tapi basis sangat besar. |
| O2 | E-commerce Indonesia tumbuh ±9% CAGR; tren personalisasi dekor rumah global tumbuh dua kali lipat 2024→2034. | Shopify ID, IMARC. |
| O3 | **Biaya admin marketplace naik serentak Mei 2026** (Shopee efektif 10–18%, Tokopedia 5–15,8%). Penjual beralih ke kanal mandiri. | Katadata, Bisnis.com. Model website→WA MahaKarya justru diuntungkan. |
| O4 | Segmen hadiah (housewarming, hampers lebaran/natal, souvenir korporat) dengan personalisasi nama/logo. | Sudah ada fitur "kirim sebagai kado" dan program B2B. |
| O5 | Kafe, hotel butik, desainer interior: pesanan berulang volume 10+ unit dengan warna seragam. | Program mitra sudah dirancang di koleksi.html. |
| O6 | Harga printer dan filamen turun (PLA Rp150–210 ribu/kg; Bambu Lab PLA Lite Rp152 ribu) → skala lebih murah. | Tokopedia/Blibli/BigGo Des 2025. |
| O7 | Benchmark global Gantri (USD 148–498 per lampu 3D print PLA) membuktikan segmen premium design-led ada. | Gantri, Dezeen 2025. |
| O8 | Konten "proses cetak + rakit" sangat cocok untuk TikTok/Reels; produk modular menghasilkan konten tak terbatas (kombinasi). | — |

### Threats (ancaman)
| # | Ancaman | Data |
|---|---|---|
| T1 | **Hambatan masuk sangat rendah**: printer Rp3–8 juta, file STL gratis, tutorial melimpah. | Shopify ID, FOMU. |
| T2 | Perang harga di marketplace: moon lamp 3D print Rp72–145 ribu, lampu figuratif Rp365 ribu, MEVAL Rp483 ribu (lampu + vas). | Tokopedia Juni 2026. |
| T3 | Lampu massal murah: Informa Rp79–499 ribu dengan diskon agresif; IKEA. | Ruparupa 2025. |
| T4 | Filamen dan komponen listrik sebagian besar impor → risiko kurs dan larangan/pembatasan impor (lartas lampu 2024 sempat menipiskan stok). | Bisnis.com 2024. |
| T5 | Regulasi SKEM/SNI lampu LED makin ketat (Kepmen ESDM 135/2022). Jika luminer dekoratif ikut diwajibkan, produk rakitan tanpa sertifikat terancam. | Enviliance, Bisnis.com. |
| T6 | Peniruan desain: bentuk dasar (bola, kubus, heksagon) tidak bisa dilindungi; motif Nusantara bisa disalin. | — |
| T7 | Daya beli kelas menengah melemah → lampu Rp450 ribu adalah pembelian diskresioner yang mudah ditunda. | — |
| T8 | Risiko keamanan: kebakaran/meleleh bila pembeli memasang bohlam >5 W. Satu insiden viral bisa mematikan merek. | — |

---

## 3. TOWS (strategi dari persilangan)

| | **Opportunities** | **Threats** |
|---|---|---|
| **Strengths** | **SO — Maxi-maxi (serang)** <br>1. **S1+S6 × O4/O5**: Luncurkan "Edisi Korporat": alas berlogo + warna seragam, MOQ 10, untuk hampers dan kafe. Margin B2B lebih tinggi dan menghabiskan kapasitas dalam batch satu warna (efisien).<br>2. **S2+S3 × O3**: Jadikan website→WA sebagai kanal utama tanpa potongan; pakai marketplace hanya untuk 5 preset (akuisisi), arahkan repeat ke WA.<br>3. **S1 × O8**: Konten "satu lampu, seratus wajah": serial TikTok ganti bagian 10 detik. Modularitas = mesin konten.<br>4. **S4 × O7**: Posisi "lampu PLA berbasis tanaman, dicetak satu per satu di Jakarta" ala Gantri dengan harga 1/5-nya. | **ST — Maxi-mini (bertahan dengan kekuatan)** <br>1. **S1 × T1/T2/T6**: Bersaing di *sistem*, bukan bentuk. Peniru bisa cetak bola, tapi tidak punya ekosistem bagian kompatibel + kode rakitan + bagian pengganti. Pertegas pesan "beli satu bagian baru, lampu terasa baru".<br>2. **S3 × T2**: Jangan ikut perang harga; jual jaminan (foto sebelum kirim, garansi 30 hari) yang penjual Rp100 ribu tidak sanggup berikan.<br>3. **S4 × T5/T8**: Pertahankan kebijakan "kit listrik ber-SNI terpisah" dan edukasi 5 W di kartu perawatan; siapkan opsi kap PETG untuk pembeli ragu.<br>4. **S5 × T7**: Biaya tetap rendah = bisa bertahan di volume kecil; jangan tambah mesin sebelum konversi terbukti. |
| **Weaknesses** | **WO — Mini-maxi (perbaiki untuk menangkap peluang)** <br>1. **W1 × O6**: Hitung HPP per bentuk dari berat dan jam aktual **minggu ini**; tetapkan harga dengan target margin kotor ≥50% via WA dan ≥35% via marketplace. Turunkan harga filamen dengan beli grosir (O6).<br>2. **W3 × O8**: Ganti semua ilustrasi AI dengan foto asli 12 bagian + 5 edisi dalam 2 minggu; 10 pesanan pertama diberi diskon tukar foto ruangan + ulasan.<br>3. **W2 × O5**: Gunakan B2B (batch satu warna, jadwal fleksibel) untuk mengisi mesin di luar jam sibuk; baru tambah printer kedua saat antrean >5 hari selama 4 minggu berturut.<br>4. **W5 × O3**: Tambahkan QRIS dinamis atau link pembayaran (Midtrans/Xendit) untuk mengurangi keraguan transfer tanpa membayar komisi marketplace. | **WT — Mini-mini (hindari/kecilkan)** <br>1. **W1+W2 × T2**: **Jangan** jual bagian satuan di marketplace (margin paling tipis, biaya kirim relatif besar). Hanya paket.<br>2. **W4 × T8**: Buat SOP tertulis + dokumentasi; pastikan ada orang kedua yang bisa membalas WA dan mencetak saat admin absen.<br>3. **W8 × T5**: Jangan kejar B2B yang mensyaratkan sertifikasi luminer; fokus kafe/UMKM/hampers. Pantau regulasi SKEM/SNI tiap kuartal.<br>4. **W6 × T7**: Jangan memperluas ke lampu lantai/outdoor sebelum material (PETG) dan arus kas mendukung. |

---

## 4. Porter's Five Forces

| Kekuatan | Intensitas | Analisis |
|---|---|---|
| **Persaingan antar pemain** | **Tinggi** | Tiga kelompok: (a) penjual 3D print marketplace berbasis file gratis, harga Rp70–365 ribu; (b) merek 3D print premium lokal (MEVAL Rp480 ribu–1,1 juta); (c) ritel massal (Informa, IKEA, Rp80–500 ribu, diskon rutin). Diferensiasi produk rendah di kelompok (a), tinggi di (b). MahaKarya bersaing di (b) dengan harga mendekati (c). |
| **Ancaman pendatang baru** | **Sangat tinggi** | Modal awal Rp5–15 juta, kurva belajar singkat, file desain melimpah, tidak ada lisensi. Satu-satunya hambatan: merek, sistem modular, dan reputasi layanan. |
| **Ancaman substitusi** | **Tinggi** | Lampu konvensional, lampu akrilik LED custom (Onlineprint), lampu rechargeable Rp59 ribu, atau sekadar tidak membeli lampu dekoratif. Produk ini "nice-to-have". |
| **Daya tawar pembeli** | **Tinggi** | Transparansi harga marketplace, biaya beralih nol, ulasan publik, tuntutan gratis ongkir. Sedikit dilunakkan oleh: konfigurasi personal (lampu "milik saya") dan kompatibilitas bagian setelah pembelian pertama (*mild lock-in*). |
| **Daya tawar pemasok** | **Rendah–sedang** | Banyak merek filamen (eSUN, Sunlu, Bambu Lab, lokal) dan harga turun. Namun hampir semua impor (risiko kurs/lartas), dan pemasok kit listrik ber-SNI terbatas dengan MOQ 20 pcs. |

**Kesimpulan Porter:** Industri secara struktural **tidak menarik** untuk pemain tanpa diferensiasi (empat dari lima kekuatan tinggi). Profit hanya tersedia bagi yang berhasil keluar dari kompetisi harga lewat sistem produk, merek, dan layanan, atau yang mengunci pelanggan B2B berulang. Strategi MahaKarya harus diukur dengan satu pertanyaan: *apakah pembeli bersedia membayar Rp300 ribu lebih mahal dari moon lamp karena modularitas dan layanan?* Belum ada bukti; perlu diuji dengan 20–30 pesanan pertama.

---

## 5. McKinsey 7S

Catatan: kerangka ini punya **tujuh** elemen (bukan enam): Strategy, Structure, Systems, Shared Values, Style, Staff, Skills. Semua dianalisis.

| S | Kondisi saat ini | Kesenjangan / rekomendasi |
|---|---|---|
| **Strategy** | Diferensiasi fokus: lampu modular custom + motif Nusantara, print-on-demand, kanal mandiri WA. Harga mid-premium. | Belum ada pilihan segmen tegas (B2C hadiah vs B2B kafe). Pilih satu "pintu masuk" untuk 6 bulan pertama; rekomendasi: **hadiah/housewarming B2C** (siklus beli pendek, konten viral) sambil membangun 2–3 akun B2B. |
| **Structure** | Satu orang memegang produksi, CS, keuangan, pemasaran. | Rapuh (W4). Tahap berikutnya: pisahkan "produksi" (bisa dioutsource ke jasa cetak seperti FOMU saat lonjakan) dari "pelanggan & merek" (dipegang pendiri). |
| **Systems** | Sangat rapi untuk skala mikro: konfigurator→kode→WA→admin.html→CSV→workbook (Dashboard, Kas, Stok). KPI mingguan ditetapkan. | Manual dan bergantung localStorage browser (risiko kehilangan data). Tambahkan cadangan otomatis (Google Sheets) dan pembayaran via link. Tidak ada sistem pelacakan pemasaran (sumber chat). |
| **Shared Values** | Terbaca jelas: kejujuran material, tanpa testimoni palsu, tanpa klaim SNI palsu, "kamu susun, kami cetak", produksi tanpa limbah stok. | Kuat dan konsisten. Harus dijaga saat tekanan harga datang; nilai ini adalah aset merek nomor satu. |
| **Style** | Hangat, personal ("kamu"), balasan manusia bukan bot, maksimal satu emoji, transparan soal perkiraan ongkir. | Cocok untuk segmen hadiah. Untuk B2B perlu register formal (price list, NDA sudah disiapkan). |
| **Staff** | 1 pendiri/admin. | Rekrut 1 orang paruh waktu untuk *post-processing* dan packing saat >15 pesanan/bulan; SOP sudah ada untuk dipakai sebagai bahan latihan. |
| **Skills** | Desain parametrik, operasi printer FDM, pembuatan tooling web, penulisan copy. | Kesenjangan: fotografi produk, pemasaran berbayar/konten TikTok, akuntansi HPP, keselamatan listrik (perlu konsultasi teknisi untuk kit). |

**Alignment:** Values, Style, dan Systems sudah selaras dan mendukung strategi diferensiasi. Ketidakselarasan utama: **Strategy menargetkan mid-premium, tetapi Structure/Staff/Skills masih skala hobi** dan belum ada bukti bahwa Systems bisa mempertahankan SLA pada volume >20 pesanan/bulan.

---

## 6. Business Model Canvas

| Blok | Isi |
|---|---|
| **Customer Segments** | (1) Urban 25–40 tahun di Jabodetabek yang menata kamar/apartemen, membeli lampu sebagai ekspresi diri. (2) Pemberi hadiah: housewarming, ulang tahun, kado pasangan. (3) B2B kecil: kafe, hotel butik, hampers korporat (MOQ 10). (4) Desainer interior/arsitek (program mitra, harga trade). |
| **Value Propositions** | Lampu yang **kamu susun sendiri** (12 bentuk × 7 warna, 1–3 badan), dicetak satu per satu di Jakarta tanpa stok; bagian bisa diganti kapan saja (ulir M20 sama); foto rakitan sebelum kirim; garansi 30 hari cacat cetak; hadiah dengan kartu dan tanpa harga; motif Nusantara orisinal (lini koleksi); kejujuran material. |
| **Channels** | Website (konfigurator, kode rakitan, estimator) → WhatsApp Business (kanal transaksi utama, bebas komisi); Instagram dan TikTok (konten proses); Tokopedia/Shopee/TikTok Shop (5 preset saja, akuisisi + kepercayaan); referral foto ruangan pelanggan. |
| **Customer Relationships** | Personal, manusia, SLA 15 menit; 3 pesan terstruktur (konfirmasi, foto, resi); tindak lanjut H+3; garansi ganti bagian; untuk B2B: konsultasi gratis, mockup, NDA, re-order identik. |
| **Revenue Streams** | Paket lampu Rp375–465 ribu (inti); bagian satuan Rp65–229 ribu (repeat, margin tipis); kit listrik Rp49 ribu + LED Rp25 ribu (add-on); Koleksi Nusantara Rp99–429 ribu; custom nama/logo (premium); B2B volume dengan DP 50%; gratis ongkir di atas ambang untuk menaikkan nilai pesanan. **Belum ada**: langganan/bundle musiman, workshop, lisensi desain. |
| **Key Resources** | File desain parametrik (aset IP utama); printer FDM + stok filamen 7 warna; website + tooling admin; nomor WA Business + reputasi; merek (belum final); pengetahuan proses cetak. |
| **Key Activities** | Desain bentuk dan motif baru; cetak, post-processing, perakitan, QC foto; CS WA dan pencatatan; konten foto/video; pembelian filamen dan kit; pengiriman dan klaim. |
| **Key Partners** | Pemasok filamen (eSUN/Sunlu/Bambu, via Tokopedia/distributor); pemasok kit listrik ber-SNI/K3L; kurir (JNE dkk.); GitHub Pages (hosting gratis); marketplace; jasa cetak pihak ketiga (FOMU, dll.) untuk lonjakan; desainer interior sebagai mitra penjualan. |
| **Cost Structure** | Variabel dominan: filamen (±Rp140–175 ribu/lampu), jam mesin (listrik + penyusutan), kit/LED, kemasan, kegagalan cetak, potongan marketplace (0% via WA, 5–18% via marketplace), ongkir subsidi. Tetap rendah: tidak ada sewa server, 1 orang, printer (Rp5–15 juta amortisasi). Terbesar yang belum dihitung: **waktu pendiri**. |

**Kritik BMC:** Model ini "*low fixed cost, low throughput*". Ia sehat sebagai usaha sampingan, tetapi untuk menjadi bisnis utama perlu salah satu dari: (a) harga naik ke segmen premium design-led (Rp600 ribu–1 juta, dibenarkan oleh foto, merek, dan material lebih baik), (b) volume B2B batch yang menaikkan utilisasi mesin, atau (c) pendapatan non-cetak (lisensi file, workshop, konten). Tanpa salah satunya, BMC ini mentok di plafon kapasitas.

---

## 7. Prioritas 90 hari (turunan dari TOWS)

| Minggu | Tindakan | Alasan |
|---|---|---|
| 1–2 | Hitung HPP aktual per bentuk (berat, jam, gagal cetak); tetapkan harga dengan margin target; putuskan apakah bagian satuan tetap dijual di marketplace. | W1, T2 |
| 1–3 | Foto produk asli 12 bagian + 5 edisi; ganti video AI dengan rekaman proses nyata. | W3 |
| 2–4 | Jual 20 lampu pertama (teman, komunitas, Instagram) dengan syarat ulasan + foto ruangan; ukur konversi chat→bayar dan waktu produksi aktual. | Validasi S1/S3 |
| 3–6 | Tambahkan link pembayaran/QRIS dinamis; cadangan data admin ke Google Sheets. | W5, Systems |
| 4–8 | Luncurkan serial konten "ganti satu bagian"; uji 1 paket hampers korporat (MOQ 10) ke 3 prospek. | O8, O4/O5 |
| 8–12 | Keputusan: tambah printer kedua **hanya** jika antrean >5 hari selama 4 minggu dan margin kotor WA ≥50%. Finalkan merek (pilih satu dari Nyala/Lapis/Tumpuk). | W2, W7 |

---

## 8. Sumber

- Repo MahaKaryaStudio: `README.md`, `index.html`, `koleksi.html`, `assets/js/lamp-data.js`, `assets/js/config.js`, `assets/js/products.js`, `ops/Operasional_MahaKarya.xlsx`, `ops/wa-quick-replies.md`.
- IMARC, *Indonesia Home Decor Market* (USD 10,46 miliar 2025; CAGR 3,73% 2026–2034): https://www.imarcgroup.com/indonesia-home-decor-market
- Tokopedia, kategori lampu 3D print (harga MEVAL, moon lamp, sitting lamp): https://www.tokopedia.com/find/lampu-3d-print
- Ruparupa/Informa, harga lampu meja: https://www.ruparupa.com/informastore/c/dekorasi/lampu-hias/lampu-hias.html
- Harga filamen PLA Indonesia (Blibli, BigGo, Tokopedia): https://www.blibli.com/jual/filamen-pla-esun ; https://biggo.id/s/Filament%20PLA
- Katadata, kenaikan biaya admin marketplace & peralihan ke kanal mandiri: https://katadata.co.id/digital/e-commerce/6a1025262a9ca/biaya-admin-marketplace-naik-seller-mulai-lirik-kanal-penjualan-mandiri
- Bisnis.com, keluhan pedagang biaya admin 2026: https://teknologi.bisnis.com/read/20260123/84/1946722/biaya-admin-makin-tinggi-pedagang-e-commerce-curhat-kami-merasa-dipermainkan
- Shopify ID, ide dan cara memulai bisnis 3D printing: https://www.shopify.com/id-id/blog/cara-memulai-bisnis-pencetakan-3d
- FOMU, jasa 3D print Jakarta & peluang usaha: https://fomu.co.id/peluang-usaha-3d-printing/
- Kontan, usaha bingkai lampu 3D (Miniku3d, Rp175 ribu–1,5 juta): https://peluangusaha.kontan.co.id/news/potensi-nyata-usaha-bingkai-lampu-3d?page=all
- Casa Indonesia, Philips 3D Printed Luminaire: https://casaindonesia.com/article/read/4/2021/4415/kreasi-rumah-lampu-dengan-philips-3d-printed-luminaire
- Gantri (USD 148–498), Dezeen Cube One modular: https://www.dezeen.com/2025/05/19/rarify-gantri-cube-one-lamp-studio-guapo-nyc-design-2025/ ; https://www.insidehook.com/design/gantri-3d-printed-designer-table-lamps/amp
- Enviliance, SKEM & label hemat energi lampu LED (Kepmen ESDM 135/2022): https://enviliance.com/regions/southeast-asia/id/report_8274
- Bisnis.com, efek lartas impor stok lampu 2024: https://ekonomi.bisnis.com/read/20240424/257/1760131/efek-lartas-impor-stok-lampu-rumah-di-indonesia-menipis
