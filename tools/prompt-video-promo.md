# Prompt gambar & video fotorealistis untuk promo (Gemini / Imagen / Veo / Kling)

Generator `video.html` menggambar lampu sebagai render 3D: bersih, konsisten dengan data
website, tapi tetap terlihat render. Untuk tampilan **foto sungguhan** (seperti referensi
deretan lampu di lemari putih), pakai model AI gambar/video dengan akun Anda sendiri, lalu
masukkan hasilnya ke generator (template **Foto**) agar harga, kontak, dan logo tetap dari data website.

Tidak perlu kunci API. Biaya mengikuti layanan yang dipakai (Gemini app gratis untuk gambar
dengan batas harian; Veo lewat Gemini Advanced/Flow, Kling, Runway berbayar per klip).

## Aturan main (agar tidak menyesatkan pembeli)

1. Selama belum ada foto produk asli, beri label **"Ilustrasi AI"** di video/unggahan, seperti
   yang sudah dilakukan di video hero website.
2. Jangan minta AI menggambar fitur yang tidak dijual: tidak ada "ber-SNI" pada lampu,
   tidak ada warna di luar palet, tidak ada ukuran lain. Kap selalu Ø 20 cm.
3. Pakai **satu blok gaya** yang sama untuk semua gambar supaya seri video terlihat satu sesi foto.

## Palet & bentuk (salin persis, AI menuruti kode hex dengan cukup baik)

| Bagian | Pilihan |
|---|---|
| Kap (Ø 20 cm) | `pleated cylinder` (Silinder plisir, 14 cm), `smooth empire cone` (Kerucut, 13 cm), `square tapered box` (Kotak, 13 cm). Warna: ivory `#F3E8D1` atau white `#F8F5EE`, tembus cahaya hangat saat menyala |
| Badan | `sphere` (Bola), `cube` (Kubus), `flat lens/ring` (Cincin), `hexagonal prism` (Heksagon), `short cylinder` (Silinder) |
| Alas | `round disc` (Bulat), `triangle` (Segitiga), `square plate` (Kotak), `flower / scalloped` (Bunga) |
| Warna badan & alas | cream `#EFE3CB`, charcoal black `#2B2622`, brick red `#C4522F`, olive green `#5C8040`, salmon `#E8836F` |

### Lima preset (urutan badan dari bawah ke atas)

| Preset | Kap | Badan | Alas |
|---|---|---|---|
| Senja | kerucut, ivory | kubus brick red → heksagon cream → bola salmon | kotak brick red |
| Kebun | plisir, ivory | bola olive → cincin cream → kubus salmon | bulat charcoal |
| Monokrom | kotak, white | bola cream → cincin charcoal → bola cream | bulat charcoal |
| Blush | plisir, ivory | cincin salmon → bola cream | bunga salmon |
| Kayu manis | kerucut, ivory | silinder cream | segitiga brick red |

## BLOK GAYA (tempel di awal setiap prompt, jangan diubah)

```
Photorealistic product photograph, editorial interior style. Subject: modular 3D-printed
table lamps made of matte PLA with faint horizontal 0.2 mm layer lines visible only up close,
stacked geometric parts (shade on top, one to three body shapes, a flat base) joined on a
central axis. Shades are thin translucent PLA, 20 cm wide, glowing softly warm (2700K) from
an LED bulb inside, with a small dark socket between shade and body. Setting: bright white
studio room, matte white wall, light-grey low cabinet with drawer handles as the table.
Lighting: large soft daylight window from the front-left, gentle fill, soft shadows falling
to the right, no harsh highlights. Camera: 50 mm lens at eye level, straight on, shallow
depth of field, sharp on the lamps. Colors exactly as specified. No text, no logo, no
watermark, no people, no cables visible, no extra objects.
```

Negative prompt (bila alat mendukung): `text, logo, watermark, people, hands, cables, glossy
plastic, neon colors, extra lamps, cluttered room, dramatic lighting, fisheye, blur on subject`

## A. Gambar diam → template Foto (jalur paling murah)

Buat di Gemini (Imagen) atau alat sejenis, minta rasio sesuai target (9:16 untuk Reels,
1:1 untuk feed, 16:9 untuk website), resolusi tertinggi. Buat 2–3 variasi per prompt, pilih
yang bentuk dan warnanya paling tepat, simpan, lalu unggah ke `video.html` → template **Foto**
dan isi keterangan tiap foto. Judul penutup, WhatsApp, Instagram, dan logo ditambahkan otomatis.

| # | Nama file | Prompt (setelah blok gaya) |
|---|---|---|
| 1 | `promo-deretan.jpg` | `Five lamps in a row on the cabinet, all switched on, evenly spaced, slightly different heights (24–46 cm). From left: (1) cone ivory shade, brick-red cube, cream hexagon, salmon sphere, brick-red square base. (2) pleated ivory shade, olive sphere, cream flat ring, salmon cube, charcoal round base. (3) square white shade, cream sphere, charcoal flat ring, cream sphere, charcoal round base. (4) pleated ivory shade, salmon flat ring, cream sphere, salmon flower base. (5) cone ivory shade, cream short cylinder, brick-red triangle base.` |
| 2 | `promo-kebun.jpg` | `One lamp centered, switched on: pleated ivory shade, olive-green sphere, cream flat ring, salmon cube, charcoal round base. Total height 39 cm. Room for text on the left third of the frame.` |
| 3 | `promo-senja.jpg` | `One lamp centered, switched on: smooth ivory cone shade, brick-red cube, cream hexagonal prism, salmon sphere, brick-red square base. Total height 41 cm.` |
| 4 | `promo-detail.jpg` | `Extreme close-up, macro 100 mm: the salmon cube body sitting on a cream flat ring, matte PLA surface with fine horizontal layer lines, the threaded M20 joint slightly visible, shade glow out of focus above.` |
| 5 | `promo-rakit.jpg` | `Hands of a person assembling the lamp on the cabinet: screwing a cream sphere body onto a charcoal round base, the pleated shade and other parts laid neatly beside, lamp off, daylight only.` |
| 6 | `promo-kamar.jpg` | `The "Kebun" lamp switched on, on a wooden bedside table in a calm bedroom at dusk, warm light pool on the wall, linen bedding softly out of focus, cozy and quiet.` |
| 7 | `promo-paket.jpg` | `Flat lay from above on the white cabinet: the five parts of one lamp (pleated ivory shade, olive sphere, cream ring, salmon cube, charcoal base) arranged in a row with small gaps, plus a coiled fabric cable with switch and plug beside them.` |

Urutan video yang enak: 1 → 2 → 4 → 5 → 6 → (penutup otomatis). Keterangan contoh:
"5 preset siap kirim" · "Preset Kebun, ≈39 cm" · "PLA matte, garis lapisan halus" ·
"Dirakit sendiri, ulir M20" · "Cahaya hangat 2700K".

## B. Video AI (Veo 3 di Gemini/Flow, Kling, Runway): klip 5–8 detik

Minta **tanpa suara/teks** dan **tanpa gerakan kamera cepat** supaya mudah dipotong dan diberi
teks oleh generator (atau langsung dipakai sebagai latar hero: 16:9 untuk desktop, 9:16/3:4
untuk HP). Untuk konsistensi bentuk dan warna, pakai **image-to-video**: unggah gambar #1 atau #2
dari bagian A sebagai frame awal, lalu beri prompt gerak di bawah.

| # | Pakai untuk | Prompt gerak (setelah blok gaya, atau sebagai prompt image-to-video) |
|---|---|---|
| V1 | Latar hero, pembuka Reels | `Slow lateral dolly from left to right along five lamps on the cabinet, all lamps on, 8 seconds, steady, shallow depth of field, no cuts.` |
| V2 | Adegan "nyala" | `Static camera on one lamp; the lamp is off for 2 seconds, then the shade glows on softly with a warm light pool spreading on the cabinet and wall, 6 seconds.` |
| V3 | Adegan rakit | `Top-down slow push-in while hands stack the parts one by one onto the base: base, sphere, ring, cube, then the pleated shade, finishing with the lamp switched on, 8 seconds.` |
| V4 | Variasi warna | `Static camera on one lamp; every 2 seconds one body part swaps to another color from the palette with a quick soft cross-dissolve, lamp stays on, 8 seconds.` |

Setelah unduh: potong di aplikasi ponsel bila perlu, lalu
- untuk **hero website**: ubah ke WebM + MP4 960×540 (dan 540×720 versi tegak), ganti
  `assets/video/proses-lampu.*` dan `proses-lampu-tegak.*`, ambil satu frame sebagai poster `.jpg`;
- untuk **Reels/TikTok**: unggah langsung, tambahkan teks dan musik di aplikasi, atau ambil
  beberapa frame terbaik sebagai gambar untuk template Foto.

## Cek sebelum dipakai

- Jumlah bagian dan warnanya sama dengan preset di website (pembeli membandingkan).
- Tidak ada teks/logo palsu, tidak ada kabel aneh, tidak ada lampu "melayang".
- Kap tampak tembus cahaya hangat, bukan putih menyala rata.
- Simpan prompt dan seed yang berhasil di catatan agar sesi berikutnya konsisten.
