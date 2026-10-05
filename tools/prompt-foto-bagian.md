# 12 prompt gambar bagian lampu (sementara, sebelum foto asli)

Tujuan: satu gambar **netral** per bentuk. Pewarnaan ke 5 warna palet dilakukan otomatis
oleh script, jadi semua bagian dibuat dalam **satu warna krem gading yang sama**. Jangan
minta warna lain ke AI; hasilnya tidak akan konsisten dengan kode hex website.

## Cara pakai

1. Buka Gemini (Imagen) atau alat lain. Unggah **gambar referensi gaya**:
   `assets/video/proses-lampu-poster.jpg` (deretan lampu) dan, bila alat mendukung
   dua referensi, satu frame adegan tangan menyusun modul.
2. Tempel **BLOK GAYA** di bawah, lalu tambahkan **satu** prompt bagian (A1 … C4).
   Jalankan 12 kali, ganti bagian saja. Jangan ubah blok gaya di antara bagian.
3. Minta rasio **1:1**, resolusi tertinggi yang tersedia (minimal 1024 px).
4. Buat 2–3 variasi per bagian, pilih yang bentuknya paling sesuai gambar SVG di website
   (buka `index.html#bagian` untuk membandingkan), dan sudut kameranya paling mirip
   dengan bagian lain yang sudah dipilih.
5. Simpan dengan nama persis seperti kolom **Nama file**, kirim ke saya. Saya akan:
   menghapus latar, menyamakan ukuran dan posisi, mewarnai ke 5 warna palet
   (krem, hitam arang, merah bata, zaitun, salmon) dan 2 warna kap (gading, putih),
   mengompres ke WebP, dan memasangnya ke konfigurator dengan label
   **"Ilustrasi AI, bukan foto produk"**.

Saat foto asli sudah ada: foto setiap bagian dengan nama file yang sama, kirim lagi,
label berganti otomatis menjadi "Foto produk".

## BLOK GAYA (tempel selalu, tanpa diubah)

```
Product photo of a single 3D-printed table-lamp component, standing alone, centered,
filling about 60% of a square 1:1 frame. Material: matte PLA 3D print in a warm ivory
cream color (#EFE3CB), uniform color, no gloss, with fine horizontal layer lines of
0.2 mm visible only on close inspection. Clean, precise geometry with slightly softened
edges, like a well-printed FDM part. Background: seamless plain warm light-grey studio
sweep (#E9E4DC), no props, no table edge, no texture. Lighting: soft daylight from a
large window on the left, white bounce card on the right, gentle contact shadow under
the object, no hard shadows, no colored light. Camera: 50 mm lens, eye level about
15 degrees above the object, straight on, no tilt. Photorealistic, sharp focus
throughout, neutral white balance. No text, no logo, no watermark, no hands, no cable,
no bulb, no other objects, no reflections of the room.
```

Catatan untuk alat yang mendukung negative prompt:
`text, logo, watermark, hands, cable, bulb, multiple objects, glossy, colored background, dramatic lighting, tilt-shift, blur`

## 12 prompt bagian

Semua ukuran adalah ukuran nyata produk; sebutkan agar proporsi antar bagian benar.
"Threaded socket" = ulir cetak M20 yang menyambungkan semua bagian.

### A. Kap (head) — 3 bentuk, Ø 20 cm, dinding 1,6 mm, bagian dalam berongga

| # | Nama di website | Nama file | Prompt bagian |
|---|---|---|---|
| A1 | Silinder plisir | `head-plisir.png` | `The component is a lampshade: a pleated cylinder (drum) 20 cm in diameter and 14 cm tall, with about 48 narrow vertical pleats running top to bottom, straight vertical sides, open at top and bottom. Thin 1.6 mm wall, slightly translucent at the edges. At the top opening, a small flat ring with a 20 mm threaded socket in the center for the fitting. Shown unlit.` |
| A2 | Kerucut | `head-kerucut.png` | `The component is a lampshade: a smooth truncated cone (empire shade) 20 cm wide at the bottom, 9 cm wide at the top, 13 cm tall, with straight sloping sides, open at top and bottom. Thin 1.6 mm wall, slightly translucent at the edges, surface plain without pleats. At the top opening, a small flat ring with a 20 mm threaded socket in the center. Shown unlit.` |
| A3 | Kotak | `head-kotak.png` | `The component is a lampshade: a square tapered box shade, 20 cm wide at the bottom, 11 cm wide at the top, 13 cm tall, four flat trapezoid faces with crisp vertical corner edges, open at top and bottom. Thin 1.6 mm wall, slightly translucent at the edges. At the top opening, a small flat square plate with a 20 mm threaded socket in the center. Shown unlit.` |

### B. Badan (body) — 5 bentuk, ulir M20 di atas dan bawah

| # | Nama di website | Nama file | Prompt bagian |
|---|---|---|---|
| B1 | Bola | `body-bola.png` | `The component is a solid-looking sphere 8 cm in diameter with a small flat circular facet on top and bottom (about 3 cm wide) where a 20 mm threaded socket sits in the center of the top facet. Smooth continuous curvature.` |
| B2 | Kubus | `body-kubus.png` | `The component is a cube 7 cm on each side, standing flat on one face, with slightly chamfered edges of about 1.5 mm, and a 20 mm threaded socket centered on the top face.` |
| B3 | Cincin | `body-cincin.png` | `The component is a short wide ring (torus-like disc) 9 cm in diameter and 4.5 cm tall, with a rounded outer edge like a flattened doughnut, a flat top and bottom, and a 20 mm threaded socket centered on top. Proportion: much wider than it is tall.` |
| B4 | Heksagon | `body-heksa.png` | `The component is a hexagonal prism (six flat vertical faces) 8 cm across the flats and 7.5 cm tall, standing on one hexagonal face, crisp vertical edges, flat top with a 20 mm threaded socket in the center.` |
| B5 | Silinder | `body-silinder.png` | `The component is a plain smooth cylinder 7 cm in diameter and 6 cm tall, standing upright, flat top and bottom, slightly softened rim, with a 20 mm threaded socket centered on top.` |

### C. Alas (base) — 4 bentuk, tebal 3 cm, ulir M20 di atas, lubang kabel kecil di sisi belakang

| # | Nama di website | Nama file | Prompt bagian |
|---|---|---|---|
| C1 | Bulat | `base-bulat.png` | `The component is a lamp base: a flat round disc 14 cm in diameter and 3 cm thick, with a gently rounded top edge, flat underside, a 20 mm threaded socket in the center of the top, and a small 6 mm cable notch at the back lower edge barely visible.` |
| C2 | Segitiga | `base-segitiga.png` | `The component is a lamp base: a flat rounded-corner triangle 15 cm on each side and 3 cm thick, corners rounded with about 2 cm radius, flat top with a 20 mm threaded socket in the center, one flat edge facing the camera.` |
| C3 | Kotak | `base-kotak.png` | `The component is a lamp base: a flat rounded-corner square 13 cm on each side and 3 cm thick, corners rounded with about 1.5 cm radius, flat top with a 20 mm threaded socket in the center, one flat edge facing the camera.` |
| C4 | Bunga | `base-bunga.png` | `The component is a lamp base: a flat flower-shaped disc 15 cm across and 3 cm thick, with eight soft scalloped petals around the edge (like a daisy outline), smooth top, a 20 mm threaded socket in the center of the top.` |

## Pemeriksaan sebelum dikirim

- Semua 12 gambar: latar abu hangat polos yang sama, objek di tengah, cahaya dari kiri.
- Tidak ada teks, logo, tangan, kabel, atau bohlam.
- Warna krem gading di semua bagian; bila AI memberi warna lain, ulangi.
- Kap tampak **tidak menyala**; versi menyala tidak diperlukan karena website punya
  ilustrasi nyala sendiri.
- Bandingkan proporsi dengan ilustrasi SVG di `index.html#bagian`; yang paling sering
  meleset adalah Cincin (dibuat terlalu tinggi) dan Bunga (kelopak terlalu banyak).
