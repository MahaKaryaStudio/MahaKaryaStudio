# Kemasan LAMP 01 · Dhiyanra

Konsep: dus kraft bergaya *carry box* (tutup gelap, pegangan di atas, siluet produk putih di depan) seperti referensi West Elm "Small Pillar" / "Glass Pendant", tetapi disesuaikan dengan produk kita: **lampu dikirim terurai per bagian**, bukan terpasang. Karena itu dusnya lebih pendek dan lebih kompak dari referensi.

File desain ada di `ops/kemasan/` (SVG ukuran sebenarnya, teks sudah path), pratinjau PNG di `ops/kemasan/png/`. Semua dibuat ulang dengan `node tools/build-kemasan.js ops/kemasan` lalu `node tools/render-kemasan.js ops/kemasan`.

## Ukuran

| | mm | Catatan |
|---|---|---|
| **Luar (P × L × T)** | **240 × 240 × 200** | 240·240·200 ÷ 6000 = **1,92 kg volumetrik → tarif 2 kg** (JNE/J&T/SiCepat). Ini ukuran terbesar yang masih kena tarif 2 kg; 5 mm lebih besar ke mana pun langsung jadi 3 kg. |
| Dalam | 228 × 228 × 188 | dinding B-flute 3 mm + toleransi lipatan tutup |
| Kap (Ø 20 × 13–14 cm) | 200 × 140 | dikemas **terbalik**, bagian badan masuk ke rongga kap |
| Badan (maks. 3, Ø ≤ 8 cm) | 3 × Ø 80 | duduk di cradle di dalam rongga kap; tiga lingkaran Ø 80 muat di lingkaran Ø 173 |
| Alas (Ø ≤ 16 × 3 cm) | 160 × 30 | lapisan paling bawah, di samping kantong kit listrik 56 × 200 |
| Bobot isi + dus | ≈ 0,9–1,5 kg | bobot riil di bawah volumetrik, jadi tarif selalu ikut volumetrik 2 kg |

Tumpukan dari bawah: nampan 5 → alas 30 + kantong kit → pemisah 3 → kap terbalik 140 (badan di dalam) → ruang 10 untuk kartu rakit & tisu = 188.

Mengapa bukan dus tinggi seperti referensi: lampu terpasang (24–46 cm) butuh dus ±25 × 25 × 50 cm = 5,2 kg volumetrik, ongkir 2,5× lipat, dan kap jadi bagian paling rawan pecah. Dus terurai juga sejalan dengan cerita produk ("rakit sendiri") dan dipakai lagi pembeli untuk menyimpan bagian cadangan.

## Bahan & konstruksi

- **Dus:** kraft corrugated **B-flute 3 mm**, liner kraft coklat 150 g, tanpa laminasi (bisa didaur ulang, sesuai pesan di panel belakang). E-flute lebih halus untuk cetak tapi kurang kuat untuk dikirim tanpa karton luar.
- **Model:** satu lembar, tutup lipat engsel di belakang, kunci lidah di depan (tanpa lem, tanpa lakban saat packing). Pegangan plastik snap-in hitam 95 × 18 mm di tutup (alternatif murah: lubang die-cut dengan lipatan penguat ganda).
- **Insert:** E-flute die-cut 3 bagian: nampan dasar (lubang Ø 160 untuk alas + kantong kit), pemisah datar, dan cradle 3 lubang Ø 80 untuk badan di dalam kap. Pulp mold lebih rapi tapi cetakan mahal; pakai E-flute dulu sampai volume > 1.000 pcs/tahun.
- **Pelindung tambahan:** tiap bagian dibungkus tisu kraft; bubble wrap 1 lapis di luar dus + plastik wrap saat kirim. Pengiriman luar Jawa: karton luar 260 × 260 × 220 (naik ke tarif 3 kg).

## Cetak

- **2 warna di kraft:** hitam arang (Pantone Black 7 C / tinta flexo hitam) + **putih opaque** untuk siluet lampu dan logo di tutup. Tutup dicetak blok hitam penuh.
- Siluet lampu memakai preset "Senja" (kerucut · kubus · heksagon · bola · alas kotak) dengan garis sambungan tipis supaya terlihat modular.
- Opsi warna ketiga (amber #f2a33a untuk titik logo) hanya jika percetakan tidak menambah biaya; desain sudah bekerja dengan 2 warna.
- Panel: depan 240 × 200, samping A (isi paket + area stiker + QR) 240 × 200, samping B (rakit 3 langkah + peringatan LED) 240 × 200, belakang 240 × 200, tutup 240 × 240. Bleed 3 mm dan dieline final dibuat percetakan dari ukuran luar di atas.
- **MOQ:** cetak flexo/offset di kraft biasanya minimal 300–500 pcs. Untuk awal (< 100 pesanan) pakai **dus kraft polos ukuran sama + stiker kraft cetak digital** untuk panel depan dan tutup; file depan bisa dipakai apa adanya sebagai stiker 240 × 200.

## Stiker kode rakitan (per pesanan)

`ops/kemasan/stiker-kode-rakitan.svg`, 80 × 48 mm, cetak digital/thermal, ditempel di area putus-putus panel samping A sebelum dus ditutup. Isi: kode rakitan (sama dengan kode di website/WhatsApp), bentuk + warna tiap bagian, nama pemesan, tanggal cetak. QR di sebelahnya mengarah ke `…/MahaKaryaStudio/#rakit` (buat anchor ini di `index.html` bagian cara pesan/rakit).

## Perkiraan biaya (asumsi, minta penawaran)

| Komponen | Per pcs (MOQ 500) |
|---|---|
| Dus B-flute 2 warna + pegangan | Rp 9.000–14.000 |
| Insert E-flute die-cut 3 bagian | Rp 3.000–5.000 |
| Tisu kraft, stiker, bubble wrap | Rp 2.000–3.000 |
| **Total** | **≈ Rp 14.000–22.000** (3–5 % dari harga paket Rp 375–465 rb) |

## Checklist sebelum ke percetakan

1. Ukur **alas sebenarnya**: nampan dasar diasumsikan Ø 160 × 30 mm. Kalau alas bunga/segitiga lebih lebar, insert diubah, ukuran dus tetap.
2. Pastikan kap "kotak" 20 × 20 cm memang masuk rongga 228 (sisa 14 mm per sisi).
3. Uji jatuh 1 m, 6 sisi, dengan dus isi lengkap sebelum pesan 500 pcs.
4. Ganti teks kontak di panel belakang jika nomor WA / Instagram berubah (`tools/build-kemasan.js`, fungsi `back()`).
